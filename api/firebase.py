import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1.base_query import FieldFilter
from google.cloud.firestore_v1 import query, aggregation
import threading

class FireBaseService:
    def __init__(self, cred):
        self.cred = credentials.Certificate(cred)
        firebase_admin.initialize_app(self.cred)
        self.db = firestore.client()
        self.callback_done = threading.Event()

    def _get_collection_ref(self, collection):
        """取得集合參考"""
        return self.db.collection(collection)

    def _apply_ordering(self, collection_ref, order_by):
        """套用排序到集合參考
        
        Args:
            collection_ref: 集合參考
            order_by: ("field", "direction") 格式，direction 為 "asc" 或 "desc"
        
        Returns:
            排序後的集合參考
        """
        if order_by:
            field = order_by[0]
            direction = query.Query.DESCENDING if order_by[1] == 'desc' else query.Query.ASCENDING
            return collection_ref.order_by(field, direction=direction)
        return collection_ref

    def _docs_to_dict_list(self, docs):
        """將文件列表轉換為字典列表
        
        Args:
            docs: 文件迭代器
        
        Returns:
            包含 doc_id 的字典列表
        """
        return [{'doc_id': doc.id, **doc.to_dict()} for doc in docs]

    def _process_ref_fields(self, data, ref_fields, operation='add'):
        """處理參考欄位
        
        Args:
            data: 原始資料
            ref_fields: 參考欄位設定 {'field_name': 'target_collection'}
            operation: 'add' 或 'get'，決定是轉換為 DocumentReference 還是解構參考
        
        Returns:
            處理後的資料
        """
        processed_data = data.copy()
        
        if not ref_fields:
            return processed_data
            
        for field_name, target_collection in ref_fields.items():
            if field_name in processed_data and processed_data[field_name]:
                if operation == 'add':
                    # 將 ID 轉換為 DocumentReference
                    ref_doc = self.db.collection(target_collection).document(str(processed_data[field_name]))
                    processed_data[field_name] = ref_doc
                elif operation == 'get':
                    # 解構 DocumentReference
                    ref = processed_data[field_name]
                    if hasattr(ref, 'get'):
                        ref_doc = ref.get()
                        if ref_doc.exists:
                            processed_data[field_name] = ref_doc.to_dict()
                            processed_data[f'{field_name}_id'] = ref.id
        
        return processed_data

    def _process_docs_with_refs(self, docs, ref_fields):
        """處理文件列表並解構參考欄位
        
        Args:
            docs: 文件迭代器
            ref_fields: 需要解構的參考欄位名稱列表
        
        Returns:
            處理後的文件列表
        """
        result = []
        
        for doc in docs:
            doc_data = {'doc_id': doc.id, **doc.to_dict()}
            
            # 將 ref_fields 轉換為字典格式以配合 _process_ref_fields
            if ref_fields:
                ref_fields_dict = {field: None for field in ref_fields}
                doc_data = self._process_ref_fields(doc_data, ref_fields_dict, operation='get')
            
            result.append(doc_data)
        
        return result

    def list_collections(self):
        """取得所有 collection 名稱"""
        return [c.id for c in self.db.collections()]

    def get_collection_data(self, collection, order_by=None, ref_fields=None):
        """取得集合所有資料
        
        Args:
            collection (str): 集合名稱
            order_by (tuple, optional): 排序條件 ("field", "direction")
                direction: "asc" or "desc" (default: "asc")
                Example: ("age", "desc")
            ref_fields (list, optional): 需要解構的 reference 欄位名稱列表
        
        Returns:
            list: 包含資料的文件列表
        """
        collection_ref = self._get_collection_ref(collection)
        collection_ref = self._apply_ordering(collection_ref, order_by)
        docs = collection_ref.stream()
        
        if ref_fields:
            return self._process_docs_with_refs(docs, ref_fields)
        else:
            return self._docs_to_dict_list(docs)

    def get_data(self, collection, doc_id, ref_fields=None):
        """取得資料"""
        doc_ref = self.db.collection(collection).document(doc_id)
        doc = doc_ref.get()
        if ref_fields:
            return self._process_ref_fields(doc.to_dict(), ref_fields, operation='get')
        else:
            return doc.to_dict()
    
    def filter_data(self, collection, conditions, order_by=None, limit=None, ref_fields=None):
        """篩選資料
        
        Args:
            collection (str): 集合名稱
            conditions (list): 篩選條件列表，格式為 [
                ("field", "operator", "value"),
                ...
            ]
                Example: [("age", ">", 20)]
            order_by (tuple, optional): 排序條件 ("field", "direction")
                direction: "asc" or "desc" (default: "asc")
                Example: ("age", "desc")
            limit (int, optional): 限制返回的文件數量
            ref_fields (list, optional): 需要解構的 reference 欄位名稱列表
        
        Returns:
            list: 包含資料的文件列表
        """
        collection_ref = self._get_collection_ref(collection)
        
        # 套用篩選條件
        for condition in conditions:
            collection_ref = collection_ref.where(filter=FieldFilter(*condition))
        
        # 套用排序
        collection_ref = self._apply_ordering(collection_ref, order_by)
        
        # 套用限制
        if limit:
            collection_ref = collection_ref.limit(limit)
            
        docs = collection_ref.stream()
        
        if ref_fields:
            return self._process_docs_with_refs(docs, ref_fields)
        else:
            return self._docs_to_dict_list(docs)
    
    def get_aggregate_count(self, collection, conditions):
        """
        取得collection經過條件篩選後的總筆數
        """
        collection_ref = self._get_collection_ref(collection)
        for condition in conditions:
            collection_ref = collection_ref.where(filter=FieldFilter(*condition))
        aggregate_query = aggregation.AggregationQuery(collection_ref)
        aggregate_query.count()
        results = aggregate_query.get()

        return results[0][0].value
    
    def add_data(self, collection, doc_id, data, ref_fields=None):
        """新增資料
        
        Args:
            collection (str): 集合名稱
            doc_id (str): 文件ID
            data (dict): 要儲存的資料
            ref_fields (dict, optional): reference 欄位設定，格式為 {
                'field_name': 'target_collection'
            }
        """
        processed_data = self._process_ref_fields(data, ref_fields, operation='add')
        doc_ref = self.db.collection(collection).document(doc_id)
        doc_ref.set(processed_data)

    def update_data(self, collection, doc_id, data, ref_fields=None):
        """更新資料
        
        Args:
            collection (str): 集合名稱
            doc_id (str): 文件ID
            data (dict): 要更新的資料
            ref_fields (dict, optional): reference 欄位設定，格式為 {
                'field_name': 'target_collection'
            }
        """
        processed_data = self._process_ref_fields(data, ref_fields, operation='add')
        doc_ref = self.db.collection(collection).document(doc_id)
        doc_ref.update(processed_data)

    def delete_data(self, collection, doc_id):
        """刪除資料"""
        doc_ref = self.db.collection(collection).document(doc_id)
        doc_ref.delete()

    def on_snapshot(self, collection):
        """監聽文件變更"""
        def callback(doc_snapshot, changes, read_time):
            for change in changes:
                # 檢測變更類型
                if change.type.name == 'MODIFIED':
                    print(f"Document modified: {change.document.id}")
                    self.update_correct_rate(change.document)

        # 監聽集合
        doc_ref = self.db.collection(collection)
        doc_watch = doc_ref.on_snapshot(callback)
        return doc_watch
    
    def update_correct_rate(self, document):
        """根據 total_count 和 correct_count 更新 correct_rate"""
        data = document.to_dict()
        total_count = data.get('total_count', 0)
        correct_count = data.get('correct_count', 0)

        # 避免除以零的錯誤
        correct_rate = round((correct_count / total_count)*100, 2) if total_count > 0 else 0

        # 更新文檔的 correct_rate 欄位
        document.reference.update({
            'correct_rate': correct_rate
        })
        print(f"Updated correct_rate for document {document.id}: {correct_rate}")
