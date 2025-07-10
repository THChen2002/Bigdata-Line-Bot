from config import get_config
from map import DatabaseCollectionMap, Permission, LIFF
from flask import Blueprint, request, render_template, jsonify
from api.linebot_helper import LineBotHelper, RichMenuHelper, WebhookHelper
from api.oauth_helper import OauthHelper
from api.liff_helper import LiffHelper
from urllib.parse import urlparse
from utils.error_handler import handle_exception

admin_app = Blueprint('admin_app', __name__)

config = get_config()
firebaseService = config.firebaseService

def get_admin_context():
    """取得管理員頁面的共用上下文"""
    liff_id = LIFF.ADMIN.value
    admin_users = firebaseService.filter_data(
        DatabaseCollectionMap.USER, [('permission', '==', Permission.ADMIN)]
    )
    admin_user_ids = [user.get('userId') for user in admin_users]
    return {
        'liff_id': liff_id,
        'admin_users': admin_users,
        'admin_user_ids': admin_user_ids
    }

@admin_app.route('/', methods=['GET'])
def admin():
    context = get_admin_context()
    # 取得各等級人數，保證每個 key 都有值
    level_counts = {i: 0 for i in range(4)}
    for level in [0, 1, 2, 3]:
        level_counts[level] = int(firebaseService.get_aggregate_count(
            DatabaseCollectionMap.USER,
            [('youtube.level', '==', level)]
        ))
    return render_template('admin/index.html', **context)

@admin_app.route('/users', methods=['GET'])
def users():
    context = get_admin_context()
    context['user'] = firebaseService.get_collection_data(DatabaseCollectionMap.USER)

    for user in context['user']:
        user.pop('statusMessage', None)
    return render_template('admin/users.html', **context)

@admin_app.route('/line', methods=['GET'])
def line():
    context = get_admin_context()
    return render_template('admin/line.html', **context)

@admin_app.route('/firebase', methods=['GET'])
def firebase():
    context = get_admin_context()
    context['collection_names'] = firebaseService.list_collections()
    return render_template('admin/firebase.html', **context)

@admin_app.route('/line/operation', methods=['POST'])
def line_operation():
    try:
        data = request.get_json()
        operation_type = data.get('type')
        
        # 驗證操作類型
        valid_operations = ['update_user', 'update_users', 'update_richmenu', 'update_yt_richmenu', 'delete_all_richmenu', 'update_liff_urls']
        if operation_type not in valid_operations:
            return jsonify({'success': False, 'message': '無效的操作類型'})
        
        # 根據操作類型執行相應的邏輯
        if operation_type == 'update_user':
            result = handle_update_user(data)
        elif operation_type == 'update_users':
            result = handle_update_users()
        elif operation_type == 'delete_all_richmenu':
            result = handle_delete_all_richmenu()
        elif operation_type == 'update_richmenu':
            result = handle_update_richmenu()
        elif operation_type == 'update_yt_richmenu':
            result = handle_update_yt_richmenu()
        elif operation_type == 'update_liff_urls':
            result = handle_update_liff_urls()
        
        return jsonify(result)
        
    except Exception as e:
        return handle_exception(e, admin_notification=True, return_json=True)

@admin_app.route('/line/webhook', methods=['GET', 'POST'])
def webhook_config():
    if request.method == 'GET':
        action = request.args.get('action')
        if action == 'test':
            try:
                response = WebhookHelper.test_webhook_url()
                return jsonify(response)
            except Exception as e:
                return jsonify({'success': False, 'message': str(e)})
        else:
            try:
                url = WebhookHelper.get_webhook_url()
                return jsonify({'url': url})
            except Exception as e:
                return jsonify({'url': '', 'message': str(e)}), 500
    elif request.method == 'POST':
        data = request.get_json()
        webhook_url = data.get('url', '').strip()
        
        if not webhook_url:
            return jsonify({'success': False, 'message': '請輸入有效的 Webhook URL'})
        try:
            # 從 webhook URL 提取基礎網址
            parsed_url = urlparse(webhook_url)
            base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
            
                        # 設定 Webhook URL
            WebhookHelper.set_webhook_url(webhook_url)
            return jsonify({'success': True})
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)})

@admin_app.route('/api/firebase/query', methods=['POST'])
def api_firebase_query():
    try:
        data = request.get_json()
        collection = data.get('collection')
        conditions = data.get('conditions', [])
        limit = data.get('limit')
        order_by = tuple(data.get('order_by')) if data.get('order_by') else None
        if not collection:
            return jsonify({'success': False, 'message': '缺少 collection 名稱'})
        if collection not in firebaseService.list_collections():
            return jsonify({'success': False, 'message': f'找不到 collection: {collection}'})
        # 將 conditions 轉為 Firestore 查詢格式
        conds = [(c['field'], c['op'], c['value']) for c in conditions if c.get('field')]
        docs = firebaseService.filter_data(collection, conds, order_by=order_by, limit=limit)
        result = [{'_id': doc.get('_id'), 'data': doc} for doc in docs]
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@admin_app.route('/api/firebase/update', methods=['POST'])
def api_firebase_update():
    try:
        data = request.get_json()
        collection = data.get('collection')
        doc_id = data.get('docId')
        update_data = data.get('data')
        if not collection or not doc_id or not update_data:
            return jsonify({'success': False, 'message': '缺少參數'})
        if collection not in firebaseService.list_collections():
            return jsonify({'success': False, 'message': f'找不到 collection: {collection}'})
        firebaseService.update_data(collection, doc_id, update_data)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@admin_app.route('/api/firebase/delete', methods=['POST'])
def api_firebase_delete():
    try:
        data = request.get_json()
        collection = data.get('collection')
        doc_id = data.get('docId')
        if not collection or not doc_id:
            return jsonify({'success': False, 'message': '缺少參數'})
        if collection not in firebaseService.list_collections():
            return jsonify({'success': False, 'message': f'找不到 collection: {collection}'})
        firebaseService.delete_data(collection, doc_id)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@admin_app.route('/api/firebase/fields', methods=['GET'])
def api_firebase_fields():
    collection = request.args.get('collection')
    if collection not in firebaseService.list_collections():
        return jsonify({'success': False, 'fields': []})
    docs = firebaseService.get_collection_data(collection)
    if not docs:
        return jsonify({'success': True, 'fields': []})
    field_set = set(docs[0].keys())
    field_set.discard('_id')

    return jsonify({'success': True, 'fields': list(field_set)})

def handle_update_user(data):
    try:
        user_id = data.get('userId')
        youtube_data = data.get('youtube', {})
        if not user_id:
            return {'success': False, 'message': '缺少 userId'}
        firebaseService.update_data(DatabaseCollectionMap.USER, user_id, {'youtube': youtube_data})
        return {'success': True, 'message': '使用者資訊已更新'}
    except Exception as e:
        return handle_exception(e, admin_notification=True, return_json=True)

def handle_update_users():
    """處理更新使用者資訊的操作"""
    try:
        users_data = firebaseService.get_collection_data(DatabaseCollectionMap.USER)
        for user in users_data:
            user_info = LineBotHelper.get_user_info(user['userId'])
            if user_info:
                firebaseService.update_data(DatabaseCollectionMap.USER, user['userId'], user_info)
        return {
            'success': True,
            'message': '使用者資訊更新成功'
        }
    except Exception as e:
        return handle_exception(e, admin_notification=True, return_json=True)
    
def handle_delete_all_richmenu():
    """處理刪除所有圖文選單的操作"""
    try:
        RichMenuHelper.delete_all_richmenu()
        
        return {
            'success': True,
            'message': '所有圖文選單刪除成功'
        }
    except Exception as e:
        raise Exception(f"刪除所有圖文選單失敗: {str(e)}")

def handle_update_richmenu():
    """處理更新圖文選單的操作"""
    try:
        RichMenuHelper.set_richmenu()

        return {
            'success': True,
            'message': '圖文選單更新成功'
        }
    except Exception as e:
        raise Exception(f"更新圖文選單失敗: {str(e)}")

def handle_update_yt_richmenu():
    """處理重置 YT 會員選單的操作"""
    try:
        RichMenuHelper.set_richmenu_by_youtube_level()
        
        return {
            'success': True,
            'message': 'YT 會員選單重置成功'
        }
    except Exception as e:
        raise Exception(f"重置 YT 會員選單失敗: {str(e)}")

def handle_update_liff_urls():
    """處理更新 LIFF 網址的操作"""
    try:
        # 取得現有的 webhook URL
        webhook_url = WebhookHelper.get_webhook_url()
        if not webhook_url:
            return {
                'success': False,
                'message': '請先設定 Webhook URL'
            }
        
        # 從 webhook URL 提取基礎網址
        parsed_url = urlparse(webhook_url)
        base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
        
        # 設定LIFF URL
        stateless_token = OauthHelper.issue_stateless_channel_access_token()
        liff_apps = LiffHelper.get_all_liff_apps(stateless_token)
        for liff_app in liff_apps:
            liff_id = liff_app.liff_id
            # 從原始的 liff_app.view.url 提取路徑部分
            original_url = liff_app.view.url
            original_parsed = urlparse(original_url)
            path = original_parsed.path
            
            # 用新的基礎網址加上原始路徑
            liff_url = f"{base_url}{path}"
            
            LiffHelper.update_liff_app_url(stateless_token, liff_id, liff_url)
        
        return {
            'success': True,
            'message': 'LIFF 網址更新成功'
        }
    except Exception as e:
        raise Exception(f"更新 LIFF 網址失敗: {str(e)}")
