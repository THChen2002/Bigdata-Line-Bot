from config import get_config
from map import LIFF, EquipmentStatus, DatabaseCollectionMap, Permission, EquipmentType, EquipmentName
from flask import Blueprint, request, render_template, jsonify, abort
from api.linebot_helper import LineBotHelper
from linebot.v3.messaging import (
    TextMessage,
    FlexMessage,
    FlexContainer
)
from utils.error_handler import handle_exception

liff_app = Blueprint('liff_app', __name__)

config = get_config()
firebaseService = config.firebaseService

def get_liff_id(size: str, default_to_tall: bool = True) -> str:
    """
    Get LIFF ID based on size parameter
    Args:
        size (str): LIFF size (FULL, TALL, COMPACT)
        default_to_tall (bool): If True, returns TALL size when invalid. If False, raises 404
    Returns:
        str: LIFF ID
    """
    if size.upper() in [liff_type.name for liff_type in LIFF]:
        return getattr(LIFF, size.upper()).value
    if default_to_tall:
        return LIFF.TALL.value
    abort(404)

# ----------------LIFF 動態尺寸跳轉用頁面 Start----------------

@liff_app.route('/<size>', methods=['GET'])
def liff_size(size):
    liff_id = get_liff_id(size, default_to_tall=False)
    return render_template('liff/liff.html', liff_id=liff_id)

# ----------------LIFF 動態尺寸跳轉用頁面 End----------------

# ----------------LIFF 頁面(根據需求設定不同大小) Start----------------
# ----------------使用者詳細資料 Start----------------
@liff_app.route('/<size>/userinfo', methods=['GET'])
def userinfo(size):
    liff_id = get_liff_id(size)
    user_id = request.args.get('userId')
    user_data = firebaseService.get_data(DatabaseCollectionMap.USER, user_id)
    user_info = user_data.get('details', {})
    user_yt = user_data.get('youtube', {})
    return render_template('liff/userinfo.html', **locals())

@liff_app.route('/userinfo', methods=['POST'])
def userinfo_post():
    try:
        data = request.form.to_dict()
        user_id = data.pop('userId')
        user_data = firebaseService.get_data(DatabaseCollectionMap.USER, user_id)
        user_info = user_data.get('details', {})
        user_yt = user_data.get('youtube', {})
        # 分開處理 youtube 與 details 資料
        yt_fields = ['channel']
        yt_data = {k: data.pop(k) for k in yt_fields if k in data}
        yt_data.update({'channel': yt_data.get('channel'), 'level': user_yt.get('level'), 'joinAt': user_yt.get('joinAt')})
        if user_info:
            verification = user_info.pop('verification')
            verification_keys = ['identity', 'name', 'studentId', 'college', 'department', 'grade']
            # 如果身份已驗證，限制資料修改
            if verification and any(data.get(key) != user_info.get(key) for key in verification_keys):
                return jsonify({'success': False, 'message': '身分已驗證，無法修改姓名、學號及學籍資料'})
            # 將verification加回data
            data.update({'verification': verification})
        else:
            data.update({'verification': False})

        # 更新資料到Firebase
        firebaseService.update_data(DatabaseCollectionMap.USER, user_id, {'details': data, 'youtube': yt_data})

        return jsonify({'success': True, 'message': '設定成功'})
    except Exception as e:
        return handle_exception(e, admin_notification=True, return_json=True)
# ----------------使用者詳細資料 End----------------

# ----------------設備租借 Start----------------
@liff_app.route('/<size>/rent', methods=['GET'])
def rent(size):
    liff_id = get_liff_id(size)
    user_id = request.args.get('userId')
    user_info = firebaseService.get_data(DatabaseCollectionMap.USER, user_id).get('details')

    # 計算每種設備的可借數量
    equipments = []
    for key, equipment_id in EquipmentType.__members__.items():
        equipment = {'equipment_name': EquipmentName[key].value}
        conditions = [
            ('type', '==', equipment_id),
            ('status', '==', EquipmentStatus.AVAILABLE)
        ]
        equipment['available_amount'] = len(firebaseService.filter_data(DatabaseCollectionMap.EQUIPMENT, conditions))
        equipment['equipment_id'] = equipment_id.value
        equipments.append(equipment)

    return render_template('liff/rent.html', **locals())

@liff_app.route('/rent', methods=['POST'])
def submit_rent():
    data = request.form
    user_id = data.get('userId')

    try:
        # 將處理過的 postback_data 存入 Firebase TEMP
        firebaseService.add_data(DatabaseCollectionMap.TEMP, user_id, data)
        supervisors = [user.get('userId') for user in firebaseService.filter_data(DatabaseCollectionMap.USER, [('permission', '>=', Permission.LEADER)])]
        line_flex_template = firebaseService.get_data(
            DatabaseCollectionMap.LINE_FLEX,
            "equipment"
        ).get("approve")
        line_flex_str = LineBotHelper.replace_variable(line_flex_template, data)
        LineBotHelper.multicast_message(supervisors, [
            FlexMessage(alt_text='租借申請確認', contents=FlexContainer.from_json(line_flex_str))
        ])

        return jsonify({'message': "提交成功，等候審核處理"})

    except Exception as e:
        print(f'Error: {e}')
        return jsonify({'error': '提交失敗，請稍後再試'}), 500
# ----------------設備租借 End----------------

# ----------------LIFF 頁面(根據需求設定不同大小) End----------------
