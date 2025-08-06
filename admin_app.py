from config import get_config
from map import DatabaseCollectionMap, Permission, LIFF
from flask import Blueprint, request, render_template, jsonify
from api.linebot_helper import LineBotHelper, RichMenuHelper, WebhookHelper
from api.oauth_helper import OauthHelper
from api.liff_helper import LiffHelper
from urllib.parse import urlparse
from utils.error_handler import handle_exception
from datetime import datetime
import pytz

admin_app = Blueprint('admin_app', __name__)

config = get_config()
firebaseService = config.firebaseService

@admin_app.route('/auth', methods=['POST'])
def check_admin():
    """驗證 admin 身份"""
    try:
        user_id = request.json.get('userId')
        if not user_id:
            return jsonify({'success': False, 'message': '缺少 userId'}), 400
        
        user = firebaseService.get_data(DatabaseCollectionMap.USER, user_id)
        if user and user.get('permission') >= Permission.LEADER:
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'message': '權限不足'}), 403
            
    except Exception as e:
        return handle_exception(e)

@admin_app.route('/', methods=['GET'])
def admin():
    liff_id = LIFF.ADMIN.value
    # 取得各等級人數，保證每個 key 都有值
    level_counts = {i: 0 for i in range(4)}
    for level in [0, 1, 2, 3]:
        level_counts[level] = int(firebaseService.get_aggregate_count(
            DatabaseCollectionMap.USER,
            [('youtube.level', '==', level)]
        ))
    return render_template('admin/index.html', **locals())

@admin_app.route('/line', methods=['GET'])
def line():
    liff_id = LIFF.ADMIN.value
    return render_template('admin/line.html', **locals())

@admin_app.route('/firebase', methods=['GET'])
def firebase():
    liff_id = LIFF.ADMIN.value
    collection_names = firebaseService.list_collections()
    return render_template('admin/firebase.html', **locals())

@admin_app.route('/users', methods=['GET'])
def users():
    liff_id = LIFF.ADMIN.value
    users = firebaseService.get_collection_data(DatabaseCollectionMap.USER)

    for user in users:
        user.pop('statusMessage', None)
    return render_template('admin/user.html', **locals())

@admin_app.route('/user/update/<string:user_id>', methods=['PUT'])
def update_user(user_id):
    try:
        data = request.get_json()
        data = data['youtube']
        data['youtube'] = {
            'channel': data.pop('channel'),
            'level': int(data.pop('level')),
            # 前端傳來的要加上 +8 時區
            'joinAt': datetime.fromisoformat(data.pop('joinAt')).astimezone(pytz.timezone('Asia/Taipei')) if data.get('joinAt') else None
        }
        firebaseService.update_data(DatabaseCollectionMap.USER, user_id, data)
        return jsonify({'success': True, 'message': '使用者資訊已更新'})
    except Exception as e:
        return handle_exception(e, admin_notification=True, return_json=True)

@admin_app.route('/news', methods=['GET'])
def news():
    liff_id = LIFF.ADMIN.value
    news_items = firebaseService.get_collection_data(DatabaseCollectionMap.NEWS, order_by=('news_id', 'desc'))
    for news in news_items:
        if 'content' in news and news['content']:
            news['content'] = news['content'].replace('\n', '\\n')
    return render_template('admin/news.html', **locals())

@admin_app.route('/news/add', methods=['POST'])
def add_news():
    try:
        data = request.get_json()
        # 驗證必要欄位
        required_fields = ['title', 'content']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'message': f'缺少必要欄位: {field}'})
        # 生成新的公告ID
        existing_news = firebaseService.get_collection_data(DatabaseCollectionMap.NEWS)
        max_id = max([n.get('news_id', 0) for n in existing_news], default=0)
        data['news_id'] = max_id + 1
        data['views'] = 0
        data['created_at'] = datetime.now(pytz.timezone('Asia/Taipei'))
        data['updated_at'] = datetime.now(pytz.timezone('Asia/Taipei'))
        # 儲存到 Firebase
        firebaseService.add_data(DatabaseCollectionMap.NEWS, str(data['news_id']), data)
        
        # 回傳新增的公告資料
        return jsonify({
            'success': True, 
            'message': '公告新增成功',
            'data': data
        })
    except Exception as e:
        return handle_exception(e)

@admin_app.route('/news/update/<int:news_id>', methods=['PUT'])
def update_news(news_id):
    try:
        data = request.get_json()
        
        data['news_id'] = news_id
       
        data['updated_at'] = datetime.now(pytz.timezone('Asia/Taipei'))
        
        # 更新公告
        firebaseService.update_data(DatabaseCollectionMap.NEWS, str(news_id), data)
        
        # 回傳更新的公告資料
        return jsonify({
            'success': True, 
            'message': '公告更新成功',
            'data': firebaseService.get_data(DatabaseCollectionMap.NEWS, str(news_id))
        })
    except Exception as e:
        return handle_exception(e)

@admin_app.route('/news/delete/<int:news_id>', methods=['DELETE'])
def delete_news(news_id):
    try:
        firebaseService.delete_data(DatabaseCollectionMap.NEWS, str(news_id))
        
        # 回傳刪除的公告ID
        return jsonify({
            'success': True, 
            'message': '公告刪除成功',
            'data': {'news_id': news_id}
        })
    except Exception as e:
        return handle_exception(e)

@admin_app.route('/course', methods=['GET'])
def course():
    liff_id = LIFF.ADMIN.value
    courses = firebaseService.get_collection_data(DatabaseCollectionMap.COURSE, order_by=('course_id', 'asc'))
    return render_template('admin/course.html', **locals())

@admin_app.route('/course/add', methods=['POST'])
def add_course():
    try:
        data = request.get_json()
        # 驗證必要欄位
        required_fields = ['course_cname', 'course_ename', 'category', 'type']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'message': f'缺少必要欄位: {field}'})
        
        # 生成新的課程ID
        existing_courses = firebaseService.get_collection_data(DatabaseCollectionMap.COURSE)
        max_id = max([c.get('course_id', 0) for c in existing_courses], default=0)
        data['course_id'] = max_id + 1
        
        # 儲存到 Firebase
        firebaseService.add_data(DatabaseCollectionMap.COURSE, str(data['course_id']), data)
        
        # 回傳新增的課程資料
        return jsonify({
            'success': True, 
            'message': '課程新增成功',
            'data': data
        })
        
    except Exception as e:
        return handle_exception(e)

@admin_app.route('/course/update/<int:course_id>', methods=['PUT'])
def update_course(course_id):
    try:
        data = request.get_json()
        
        data['course_id'] = course_id
        
        # 更新課程
        firebaseService.update_data(DatabaseCollectionMap.COURSE, str(course_id), data)
        
        # 回傳更新的課程資料
        return jsonify({
            'success': True, 
            'message': '課程更新成功',
            'data': data
        })
        
    except Exception as e:
        return handle_exception(e)

@admin_app.route('/course/delete/<int:course_id>', methods=['DELETE'])
def delete_course(course_id):
    try:
        firebaseService.delete_data(DatabaseCollectionMap.COURSE, str(course_id))
        
        # 回傳刪除的課程ID
        return jsonify({
            'success': True, 
            'message': '課程刪除成功',
            'data': {'course_id': course_id}
        })
        
    except Exception as e:
        return handle_exception(e)

@admin_app.route('/course_open', methods=['GET'])
def course_open():
    liff_id = LIFF.ADMIN.value
    course_open_records = firebaseService.get_collection_data(DatabaseCollectionMap.COURSE_OPEN, order_by=('id', 'desc'), ref_fields=['course'])
    courses = firebaseService.get_collection_data(DatabaseCollectionMap.COURSE)
    return render_template('admin/course_open.html', **locals())

@admin_app.route('/course_open/add', methods=['POST'])
def add_course_open():
    try:
        data = request.get_json()
        # 驗證必要欄位
        required_fields = ['course_id', 'professor', 'classroom', 'year', 'semester', 'week', 'start_class', 'end_class', 'credit']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'message': f'缺少必要欄位: {field}'})
        
        # 生成新的開課ID
        existing_records = firebaseService.get_collection_data(DatabaseCollectionMap.COURSE_OPEN)
        max_id = max([c.get('id', 0) for c in existing_records], default=0)
        data['id'] = max_id + 1
        
        data['course'] = data.pop('course_id')
        # 設定 reference 欄位
        ref_fields = {
            'course': DatabaseCollectionMap.COURSE
        }
        
        # 儲存到 Firebase，處理 reference
        firebaseService.add_data(
            DatabaseCollectionMap.COURSE_OPEN, 
            str(data['id']), 
            data, 
            ref_fields
        )
        
        # 回傳新增的開課記錄
        return jsonify({
            'success': True, 
            'message': '開課記錄新增成功',
            'data': firebaseService.get_data(DatabaseCollectionMap.COURSE_OPEN, str(data['id']), ref_fields)
        })
        
    except Exception as e:
        return handle_exception(e)

@admin_app.route('/course_open/update/<int:record_id>', methods=['PUT'])
def update_course_open(record_id):
    try:
        data = request.get_json()
        
        data['id'] = record_id
        data['course'] = data.pop('course_id')
        
        # 設定 reference 欄位
        ref_fields = {
            'course': DatabaseCollectionMap.COURSE
        }
        
        # 更新開課記錄，處理 reference
        firebaseService.update_data(
            DatabaseCollectionMap.COURSE_OPEN, 
            str(record_id), 
            data, 
            ref_fields
        )
        
        # 回傳更新的開課記錄
        return jsonify({
            'success': True, 
            'message': '開課記錄更新成功',
            'data': firebaseService.get_data(DatabaseCollectionMap.COURSE_OPEN, str(record_id), ref_fields)
        })
        
    except Exception as e:
        return handle_exception(e)

@admin_app.route('/course_open/delete/<int:record_id>', methods=['DELETE'])
def delete_course_open(record_id):
    try:
        firebaseService.delete_data(DatabaseCollectionMap.COURSE_OPEN, str(record_id))
        
        # 回傳刪除的記錄ID
        return jsonify({
            'success': True, 
            'message': '開課記錄刪除成功',
            'data': {'id': record_id}
        })
        
    except Exception as e:
        return handle_exception(e)

@admin_app.route('/video', methods=['GET'])
def video():
    liff_id = LIFF.ADMIN.value
    videos = firebaseService.get_collection_data(DatabaseCollectionMap.VIDEO, order_by=('video_id', 'desc'))
    
    # 處理換行符問題，確保 JSON 序列化不會出錯
    for video in videos:
        if 'description' in video and video['description']:
            # 將換行符轉換為 HTML 換行標籤，避免 JSON 解析錯誤
            video['description'] = video['description'].replace('\n', '\\n')
    
    return render_template('admin/video.html', **locals())

@admin_app.route('/video/add', methods=['POST'])
def add_video():
    try:
        data = request.get_json()
        required_fields = ['video_name', 'video_url', 'category', 'description']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'message': f'缺少必要欄位: {field}'})
        
        # 生成新的影片ID
        existing_videos = firebaseService.get_collection_data(DatabaseCollectionMap.VIDEO)
        max_id = max([v.get('video_id', 0) for v in existing_videos], default=0)
        data['video_id'] = max_id + 1
        
        # 儲存到 Firebase
        firebaseService.add_data(DatabaseCollectionMap.VIDEO, str(data['video_id']), data)
        
        # 回傳新增的影片資料
        return jsonify({
            'success': True, 
            'message': '影片新增成功',
            'data': data
        })
        
    except Exception as e:
        return handle_exception(e)

@admin_app.route('/video/update/<int:video_id>', methods=['PUT'])
def update_video(video_id):
    try:
        data = request.get_json()

        data['video_id'] = video_id
        
        # 更新影片
        firebaseService.update_data(DatabaseCollectionMap.VIDEO, str(video_id), data)
        
        # 回傳更新的影片資料
        return jsonify({
            'success': True, 
            'message': '影片更新成功',
            'data': data
        })
    except Exception as e:
        return handle_exception(e)

@admin_app.route('/video/delete/<int:video_id>', methods=['DELETE'])
def delete_video(video_id):
    try:
        firebaseService.delete_data(DatabaseCollectionMap.VIDEO, str(video_id))
        
        # 回傳刪除的影片ID
        return jsonify({
            'success': True, 
            'message': '影片刪除成功',
            'data': {'video_id': video_id}
        })
    except Exception as e:
        return handle_exception(e)

@admin_app.route('/line/operation', methods=['POST'])
def line_operation():
    try:
        data = request.get_json()
        operation_type = data.get('type')
        
        # 驗證操作類型
        valid_operations = ['update_users', 'update_richmenu', 'update_yt_richmenu', 'delete_all_richmenu', 'update_liff_urls']
        if operation_type not in valid_operations:
            return jsonify({'success': False, 'message': '無效的操作類型'})
        
        # 根據操作類型執行相應的邏輯
        if operation_type == 'update_users':
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
        result = [{'doc_id': doc.get('doc_id'), 'data': doc} for doc in docs]
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
    field_set.discard('doc_id')

    return jsonify({'success': True, 'fields': list(field_set)})

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
