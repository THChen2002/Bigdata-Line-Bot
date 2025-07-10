import random
import re
import pytz
from datetime import datetime
from typing import Dict, Any

def get_current_time():
    """Returns
    datetime: 現在時間
    """
    return datetime.now(pytz.timezone('Asia/Taipei'))


def convert_timedelta_to_string(timedelta):
    """Returns
    str: 時間字串 (小時:分鐘:秒 e.g. 01:20:43)
    """
    hours = timedelta.days * 24 + timedelta.seconds // 3600
    minutes = (timedelta.seconds % 3600) // 60
    seconds = timedelta.seconds % 60
    hours = hours if len(str(hours)) >= 2 else f'0{hours}'
    minutes = minutes if len(str(minutes)) == 2 else f'0{minutes}'
    seconds = seconds if len(str(seconds)) == 2 else f'0{seconds}'
    return f'{hours}:{minutes}:{seconds}'


def generate_id(k: int=20):
    """
    生成ID
    """
    CHARS='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    return ''.join(random.choices(CHARS, k=k))

def camel_to_snake_case(data: Dict[str, Any]) -> Dict[str, Any]:
    """將字典的鍵從 camelCase 轉換為 snake_case。
    
    Args:
        data (Dict[str, Any]): 包含 camelCase 鍵的字典
        
    Returns:
        Dict[str, Any]: 包含 snake_case 鍵的字典
        
    Example:
        >>> camel_to_snake_case({"firstName": "John", "lastName": "Doe"})
        {'first_name': 'John', 'last_name': 'Doe'}
    """
    def convert(key: str) -> str:
        return re.sub(r'(?<!^)(?=[A-Z])', '_', key).lower()
    
    return {convert(k): v for k, v in data.items()}

def replace_variable(text: str, variable_dict: Dict[str, Any], max_count: int = 0) -> str:
    """替換文字中的變數。
    
    將文字中的 {{variable}} 格式的變數替換為 variable_dict 中對應的值。
    
    Args:
        text (str): 包含 {{variable}} 格式變數的文字
        variable_dict (Dict[str, Any]): 包含變數值的字典
        max_count (int, optional): 每個變數的最大替換次數。預設為 0（無限制）
        
    Returns:
        str: 替換變數後的文字
        
    Example:
        >>> replace_variable("Hello {{name}}!", {"name": "World"})
        'Hello World!'
    """
    replaced_count: Dict[str, int] = {}
    
    def replace(match: re.Match) -> str:
        key = match.group(1)
        if max_count:
            if key not in replaced_count:
                replaced_count[key] = 1
            else:
                replaced_count[key] += 1
                if replaced_count[key] > max_count:
                    return match.group(0)
        return str(variable_dict.get(key, match.group(0)))

    pattern = r'\{\{([a-zA-Z0-9_]*)\}\}'
    return re.sub(pattern, replace, text) 