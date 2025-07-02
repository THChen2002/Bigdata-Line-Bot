from config import Config
from map import DatabaseCollectionMap, Permission, LIFF
from flask import Blueprint, request, render_template, jsonify
from api.linebot_helper import LineBotHelper, RichMenuHelper
from linebot.v3.messaging import TextMessage
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

@admin_app.route('/update', methods=['POST'])
def update():
    try:
        data = request.get_json()
        user_id = data.pop('userId')
        firebaseService.update_data(DatabaseCollectionMap.USER, user_id, {'youtube': data})
        return jsonify({'success': True})
    except Exception as e:
        error_message = ''.join(traceback.format_exception(None, e, e.__traceback__))
        LineBotHelper.push_message(
            firebaseService.filter_data(
                DatabaseCollectionMap.USER, [('permission', '==', Permission.ADMIN)]
            )[0]['userId'],
            [TextMessage(text=error_message)]
        )
        return jsonify({'success': False, 'message': '發生錯誤，請聯繫系統管理員！'})

@admin_app.route('/line/operation', methods=['POST'])
def line_operation():
    try:
        data = request.get_json()
        operation_type = data.get('type')
        
        # 驗證操作類型
        valid_operations = ['update_users', 'update_richmenu', 'update_yt_richmenu', 'delete_all_richmenu']
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