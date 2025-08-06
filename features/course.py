from .base import Feature, register_feature
from utils.utils import replace_variable
from linebot.v3.messaging import (
    TextMessage,
    FlexMessage,
    FlexContainer
)
from api.linebot_helper import LineBotHelper, QuickReplyHelper, FlexMessageHelper
from map import DatabaseCollectionMap
import json
import math

@register_feature('course')
class Course(Feature):
    """
    開課修業查詢
    """
    def execute_message(self, event, **kwargs):
        line_flex_str = self.firebaseService.get_data(
            DatabaseCollectionMap.LINE_FLEX,
            "course"
        ).get("select")
        return LineBotHelper.reply_message(event, [FlexMessage(alt_text='開課時間查詢', contents=FlexContainer.from_json(line_flex_str))])

    def execute_postback(self, event, **kwargs):
        params = kwargs.get('params')
        type = params.get('type')
        if type == 'open':
            quick_reply_data = self.firebaseService.get_data(
                DatabaseCollectionMap.QUICK_REPLY,
                "course"
            ).get("semester")
            return LineBotHelper.reply_message(event, [TextMessage(text=quick_reply_data.get('text'), quick_reply=QuickReplyHelper.create_quick_reply(quick_reply_data.get('actions')))])
                
        elif type == 'progress':
            # 查詢修課進度
            user_id = event.source.user_id

            user_detail = self.firebaseService.get_data(DatabaseCollectionMap.USER, user_id).get('details')
            # 確認使用者填完的資料是否已經認證
            if not user_detail or not user_detail['verification']:
                return LineBotHelper.reply_message(event, [TextMessage(text='請先在圖文選單點擊【設定】中的【設定個人資料】填寫表單，並傳送學生證正面照片完成認證')])

            student_id = user_detail['studentId']
            user_courses = self.firebaseService.filter_data(DatabaseCollectionMap.COURSE_STUDY, [('student_id', '==', student_id)])
            courses = self.firebaseService.get_collection_data(DatabaseCollectionMap.COURSE, ref_fields=['course'])
            # 處理課程資料，合併修課記錄
            course_records = self.__process_courses_with_study_records(courses, user_courses)

            # 取得line flex template以及替換修課資料變數
            line_flex_template = self.firebaseService.get_data(
                DatabaseCollectionMap.LINE_FLEX,
                "course"
            ).get('progress')
            for course_record in course_records:
                course_id = course_record['course_id']
                variable_dict = { f"{key}{course_id}": course_record[key] for key in ['status', 'category', 'semester', 'color'] }
                line_flex_template = replace_variable(line_flex_template, variable_dict)

            # 建立替換學分數據的字典
            credits_summary = self.__calculate_credits_summary(course_records)

            line_flex_str = replace_variable(line_flex_template, credits_summary)
            return LineBotHelper.reply_message(event, [FlexMessage(alt_text='修課進度', contents=FlexContainer.from_json(line_flex_str))])
            
        else:
            course_record_id = params.get('course_record')
            course_category = params.get('category')

            # 如果有course_record_id，則回傳該課程的詳細資訊
            if course_record_id:
                course_record = self.firebaseService.filter_data(DatabaseCollectionMap.COURSE_OPEN, [('id', '==', int(course_record_id))], ref_fields=['course'])[0]
                course = self.firebaseService.filter_data(DatabaseCollectionMap.COURSE, [('course_id', '==', course_record['course'].get('course_id'))])[0]
                course.update(course_record)
                line_flex_template = self.firebaseService.get_data(
                    DatabaseCollectionMap.LINE_FLEX,
                    "course"
                ).get('detail')
                line_flex_str = replace_variable(line_flex_template, course)
                return LineBotHelper.reply_message(event, [FlexMessage(alt_text='詳細說明', contents=FlexContainer.from_json(line_flex_str))])
            
            # 否則如果有course_category，則回傳該類別的課程資訊
            elif course_category:
                course_map = {
                    'overview': '總覽',
                    'basic': '基礎',
                    'advanced': '進階',
                    'practical': '實務'
                }
                # 拆解學年和學期
                year = params.get('semester')[:3]
                semester = params.get('semester')[3:]
                course_records = self.firebaseService.filter_data(DatabaseCollectionMap.COURSE_OPEN, [('year', '==', year), ('semester', '==', semester)], ref_fields=['course'])
                for record in course_records:
                    course = self.firebaseService.filter_data(DatabaseCollectionMap.COURSE, [('course_id', '==', int(record['course'].get('course_id')))])[0]
                    record.update(course)
                if course_category != 'overview':
                    course_records = [record for record in course_records if record.get('category') == course_map.get(course_category)]
                if len(course_records) == 0:
                    message = f'{year}學年度第{semester}學期沒有{course_map.get(course_category)}課程資料'
                    return LineBotHelper.reply_message(event, [TextMessage(text=message)])
                else:
                    line_flex_template = self.firebaseService.get_data(
                        DatabaseCollectionMap.LINE_FLEX, 
                        "course"
                    ).get('summary')

                    bubble_amount = 12
                    flex_message_bubbles = []
                    for i in range(math.ceil(len(course_records) / bubble_amount)):
                        temp = course_records[i*bubble_amount:i*bubble_amount+bubble_amount] if i*bubble_amount+bubble_amount < len(course_records) else course_records[i*bubble_amount:]
                        line_flex_json = FlexMessageHelper.create_carousel_bubbles(temp, json.loads(line_flex_template))
                        line_flex_str = json.dumps(line_flex_json)
                        flex_message_bubbles.append(FlexContainer.from_json(line_flex_str))
                    return LineBotHelper.reply_message(event, [FlexMessage(alt_text=course_map.get(course_category), contents=flex) for flex in flex_message_bubbles])
            
            # 否則回傳課程類別的快速回覆選項
            else:
                quick_reply_data = self.firebaseService.get_data(
                    DatabaseCollectionMap.QUICK_REPLY,
                    "course"
                ).get("category")
                for i, text in enumerate(quick_reply_data.get('actions')):
                    quick_reply_data.get('actions')[i] = replace_variable(text, params)
                return LineBotHelper.reply_message(event, [TextMessage(text=quick_reply_data.get('text'), quick_reply=QuickReplyHelper.create_quick_reply(quick_reply_data.get('actions')))])
    
    def __get_study_status(self, course_dict):
        """Returns
        Tuple: (修課狀態, 修課狀態顏色)
        """
        if course_dict.get('student_id'):
            if course_dict.get('pass') == 1:
                return '已修畢', '#00BB00'
            else:
                return '未通過', '#FF0000'
        else:
            return '未修畢', '#000000'

    def __process_courses_with_study_records(self, courses, user_courses):
        """處理課程資料，合併修課記錄"""
        # 設定預設值
        default_values = {
            'semester': '-',
            'credit': 0,
            'status': '未修畢',
            'color': '#000000',
            'pass': 0
        }
        
        # 如果沒有修課記錄，直接設定預設值
        if not user_courses:
            for course in courses:
                course.update(default_values)
            return courses
        
        # 建立課程記錄的字典
        course_records_dict = {}
        for user_course in user_courses:
            record_id = user_course['record_id']
            course_record = self.firebaseService.get_data(DatabaseCollectionMap.COURSE_OPEN, str(record_id), ref_fields={'course': DatabaseCollectionMap.COURSE})
            if course_record and course_record['course']:
                course_id = course_record['course'].get('course_id')
                # 如果同課程有多筆記錄，保留最新的（id 最大的）
                if course_id not in course_records_dict or course_record['id'] > course_records_dict[course_id]['id']:
                    course_records_dict[course_id] = course_record
                    course_records_dict[course_id].update(user_course)
        
        # 合併課程資料和修課記錄
        processed_courses = []
        for course in courses:
            course_id = course['course_id']
            if course_id in course_records_dict:
                # 有修課記錄
                course_record = course_records_dict[course_id]
                course.update(course_record)
                # 設定修課狀態
                status, color = self.__get_study_status(course)
                course['status'] = status
                course['color'] = color
                course['semester'] = f"{int(course_record['year'])}-{int(course_record['semester'])}" if course_record.get('year') and course_record.get('semester') else '-'
                course['pass'] = int(course_record.get('pass', 0))
                course['credit'] = int(course_record.get('credit', 0))
            else:
                # 沒有修課記錄，使用預設值
                course.update(default_values)
            
            processed_courses.append(course)
        
        return processed_courses
    
    def __calculate_credits_summary(self, course_records):
        """計算學分摘要"""
        completed_required_credit = sum(course['credit'] for course in course_records if course['type'] == '必修' and course['pass'] == 1)
        incompleted_required_credit = max(6 - completed_required_credit, 0)
        completed_elective_credit = sum(course['credit'] for course in course_records if course['type'] == '選修' and course['pass'] == 1)
        incompleted_elective_credit = max(4 - completed_elective_credit, 0)
        
        standard = '已達到發證標準' if incompleted_required_credit <= 0 and incompleted_elective_credit <= 0 else '尚未符合發證標準'
        color = '#00BB00' if standard == '已達到發證標準' else '#FF0000'
        
        return locals()