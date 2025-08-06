from flask import jsonify, current_app
from config import get_config
from map import Permission
from api.linebot_helper import LineBotHelper
from linebot.v3.messaging import (
    TextMessage
)
import traceback

config = get_config()
firebaseService = config.firebaseService

def handle_exception(e, admin_notification=False, event=None, return_json=False):
    """
    共用錯誤處理器
    :param e: Exception instance
    :param admin_notification: 是否通知管理員
    :param event: LINE event 物件（如有則回覆用戶）
    :param return_json: 是否回傳 JSON 給前端（API 用）
    :return: JSON response
    """
    # 取得完整的錯誤追蹤
    error_message = ''.join(traceback.format_exception(None, e, e.__traceback__))

    # 記錄到 logger
    try:
        current_app.logger.error(error_message)
    except Exception:
        print(error_message)

    # 通知管理員
    if admin_notification:
        try:
            LineBotHelper.show_loading_animation_(event)
            LineBotHelper.push_message(
                firebaseService.filter_data(
                    'users', [('permission', '==', Permission.ADMIN)]
                )[0]['userId'],
                [TextMessage(text=error_message)]
            )
        except Exception as notify_error:
            # 如果通知管理員時發生錯誤，記錄但不要中斷主要流程
            print(f"Failed to notify admin: {str(notify_error)}")

    # 回覆用戶
    if event:
        try:
            LineBotHelper.reply_message(event, [TextMessage(text='發生錯誤，請聯繫系統管理員！')])
        except Exception as reply_error:
            print(f"Failed to reply to LINE event: {str(reply_error)}")
    
    # 回傳給客戶端的錯誤訊息，使用 200 狀態碼
    return jsonify({
        'success': False, 
        'message': "發生錯誤，請聯繫系統管理員"
    }), 200 