from config import Config
from map import DatabaseCollectionMap, Permission, LIFF
from flask import Blueprint, request, render_template, jsonify
from api.linebot_helper import LineBotHelper, RichMenuHelper, WebhookHelper
from api.oauth_helper import OauthHelper
from api.liff_helper import LiffHelper
from linebot.v3.messaging import TextMessage
from urllib.parse import urlparse
import traceback

admin_app = Blueprint('admin_app', __name__)

config = Config()
firebaseService = config.firebaseService

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
    # 驗證登入使用者的權限
    admin_users = firebaseService.filter_data(
        DatabaseCollectionMap.USER, [('permission', '==', 4)]
    )
    admin_user_ids = [user.get('userId') for user in admin_users]
    return render_template('admin/index.html', **locals())

@admin_app.route('/users', methods=['GET'])
def users():
    liff_id = LIFF.ADMIN.value
    users = firebaseService.get_collection_data(DatabaseCollectionMap.USER)
    # 驗證登入使用者的權限
    admin_users = firebaseService.filter_data(
        DatabaseCollectionMap.USER, [('permission', '==', Permission.ADMIN)]
    )
    admin_user_ids = [user.get('userId') for user in admin_users]
    for user in users:
        user.pop('statusMessage', None)
    return render_template('admin/users.html', **locals())

@admin_app.route('/line', methods=['GET'])
def line():
    liff_id = LIFF.ADMIN.value
    # 驗證登入使用者的權限
    admin_users = firebaseService.filter_data(
        DatabaseCollectionMap.USER, [('permission', '==', Permission.ADMIN)]
    )
    admin_user_ids = [user.get('userId') for user in admin_users]
    return render_template('admin/line.html', **locals())

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
        error_message = ''.join(traceback.format_exception(None, e, e.__traceback__))
        # 發送錯誤訊息給管理員
        admin_users = firebaseService.filter_data(
            DatabaseCollectionMap.USER, [('permission', '==', Permission.ADMIN)]
        )
        if admin_users:
            LineBotHelper.push_message(
                admin_users[0]['userId'],
                [TextMessage(text=f"LINE操作錯誤: {error_message}")]
            )
        return jsonify({'success': False, 'message': '操作失敗，請聯繫系統管理員！'})

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

def handle_update_user(data):
    try:
        user_id = data.get('userId')
        youtube_data = data.get('youtube', {})
        if not user_id:
            return {'success': False, 'message': '缺少 userId'}
        firebaseService.update_data(DatabaseCollectionMap.USER, user_id, {'youtube': youtube_data})
        return {'success': True, 'message': '使用者資訊已更新'}
    except Exception as e:
        error_message = ''.join(traceback.format_exception(None, e, e.__traceback__))
        LineBotHelper.push_message(
            firebaseService.filter_data(
                DatabaseCollectionMap.USER, [('permission', '==', Permission.ADMIN)]
            )[0]['userId'],
            [TextMessage(text=error_message)]
        )
        return {'success': False, 'message': '發生錯誤，請聯繫系統管理員！'}

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
        error_message = ''.join(traceback.format_exception(None, e, e.__traceback__))
        LineBotHelper.push_message(
            firebaseService.filter_data(
                DatabaseCollectionMap.USER, [('permission', '==', Permission.ADMIN)]
            )[0]['userId'],
            [TextMessage(text=error_message)]
        )
        return {
            'success': False,
            'message': '更新使用者資訊失敗，請聯繫系統管理員！'
        }
    
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
