from config import Config
from map import DatabaseCollectionMap, Permission, LIFF
from flask import Blueprint, request, render_template, jsonify
from api.linebot_helper import LineBotHelper
from linebot.v3.messaging import TextMessage
import traceback

admin_app = Blueprint('admin_app', __name__)

config = Config()
firebaseService = config.firebaseService

@admin_app.route('/', methods=['GET'])
def admin():
    liff_id = LIFF.ADMIN.value
    users = firebaseService.get_collection_data(
        DatabaseCollectionMap.USER
    )
    # 驗證登入使用者的權限
    admin_users = firebaseService.filter_data(
        DatabaseCollectionMap.USER, [('permission', '==', 4)]
    )
    admin_user_ids = [user.get('userId') for user in admin_users]
    for user in users:
        user.pop('statusMessage') if user.get('statusMessage') else None
    return render_template('admin/index.html', **locals())

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