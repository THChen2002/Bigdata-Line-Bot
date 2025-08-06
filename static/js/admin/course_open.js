// 開課管理表格類
class CourseOpenTable extends DataTable {
    // 覆寫新增方法
    onAdd() {
        showEditModal({
            title: '新增開課',
            icon: 'bi-plus-circle',
            fields: this.generateModalFields(null, 'add'),
            data: {},
            onSave: (formData) => {
                const max_id = Math.max(...this.data.map(co => co.id || 0), 0);
                formData.id = max_id + 1;
                this.addItem(formData, {
                    url: '/admin/course_open/add'
                });
            }
        });
    }

    // 覆寫編輯方法
    onEdit(item) {        
        showEditModal({
            title: '編輯開課',
            icon: 'bi-pencil-square',
            fields: this.generateModalFields(item, 'edit'),
            data: item,
            onSave: (formData) => {
                this.updateItem(item.id, formData, {
                    url: `/admin/course_open/update/${item.id}`
                });
            }
        });
    }

    // 覆寫刪除方法
    onDelete(item) {
        const courseName = coursesData.find(c => c.course_id === parseInt(item.course_id))?.course_cname || '未知課程';
        showConfirmModal({
            title: '刪除開課',
            message: `確定要刪除「${item.professor}」的「${courseName}」開課資訊嗎？此操作無法復原。`,
            confirmText: '刪除',
            confirmClass: 'btn-danger',
            onConfirm: () => {
                this.deleteItem(item.id, {
                    url: `/admin/course_open/delete/${item.id}`
                });
            }
        });
    }
}

function initializeTable(courseOpenData) {
    window.courseOpenTable = new CourseOpenTable({
        data: courseOpenData,
        idField: 'id',
        fields: [
            {
                key: 'id',
                label: '開課ID',
                type: 'text',
                searchable: true,
                editable: false,
                addable: false
            },
            {
                key: 'course_id',
                label: '課程名稱',
                type: 'select',
                searchable: true,
                sortable: false,
                filterable: true,
                filterType: 'checkbox',
                required: true,
                validationMessage: '請選擇課程名稱',
                options: coursesData.map(course => ({
                    value: course.course_id,
                    label: course.course_cname
                })),
                getRowValue: (item) => {
                    return coursesData.find(c => c.course_id === parseInt(item.course_id))?.course_cname || '未知課程';
                },
                getModalValue: (item) => {
                    return item.course.course_id;
                }
            },
            {
                key: 'year',
                label: '學年',
                type: 'select',
                searchable: false,
                filterable: true,
                filterType: 'select',
                required: true,
                validationMessage: '請選擇學年',
                options: [
                    {value: '114', label: '114'},
                    {value: '113', label: '113'},
                    {value: '112', label: '112'},
                    {value: '111', label: '111'}
                ]
            },
            {
                key: 'semester',
                label: '學期',
                type: 'select',
                searchable: false,
                filterable: true,
                filterType: 'select',
                required: true,
                validationMessage: '請選擇學期',
                options: [
                    {value: '1', label: '上學期', class: 'bg-primary'},
                    {value: '2', label: '下學期', class: 'bg-success'},
                ]
            },
            {
                key: 'professor',
                label: '教授',
                type: 'text',
                searchable: true,
                sortable: false,
                required: true,
                validationMessage: '請輸入教授姓名',
                placeholder: '請輸入教授姓名'
            },
            {
                key: 'classroom',
                label: '教室',
                type: 'text',
                searchable: true,
                sortable: false,
                required: true,
                validationMessage: '請輸入教室',
                placeholder: '例如：F401B'
            },
            {
                key: 'week',
                label: '星期',
                type: 'select',
                searchable: false,
                sortable: false,
                filterable: true,
                filterType: 'select',
                required: true,
                validationMessage: '請選擇星期',
                options: [
                    {value: '一', label: '星期一', class: 'bg-primary'},
                    {value: '二', label: '星期二', class: 'bg-success'},
                    {value: '三', label: '星期三', class: 'bg-info'},
                    {value: '四', label: '星期四', class: 'bg-warning'},
                    {value: '五', label: '星期五', class: 'bg-danger'}
                ]
            },
            {
                key: 'start_class',
                label: '開始節次',
                type: 'select',
                searchable: false,
                sortable: false,
                filterable: true,
                filterType: 'select',
                required: true,
                validationMessage: '請選擇開始節次',
                options: [
                    {value: '0M', label: '0M'},
                    {value: '01', label: '01'},
                    {value: '02', label: '02'},
                    {value: '03', label: '03'},
                    {value: '04', label: '04'},
                    {value: '0N', label: '0N'},
                    {value: '05', label: '05'},
                    {value: '06', label: '06'},
                    {value: '07', label: '07'},
                    {value: '08', label: '08'},
                    {value: '0E', label: '0E'},
                    {value: '09', label: '09'},
                    {value: '10', label: '10'},
                    {value: '11', label: '11'},
                    {value: '12', label: '12'}
                ]
            },
            {
                key: 'end_class',
                label: '結束節次',
                type: 'select',
                searchable: false,
                sortable: false,
                filterable: true,
                filterType: 'select',
                required: true,
                validationMessage: '請選擇結束節次',
                options: [
                    {value: '0M', label: '0M'},
                    {value: '01', label: '01'},
                    {value: '02', label: '02'},
                    {value: '03', label: '03'},
                    {value: '04', label: '04'},
                    {value: '0N', label: '0N'},
                    {value: '05', label: '05'},
                    {value: '06', label: '06'},
                    {value: '07', label: '07'},
                    {value: '08', label: '08'},
                    {value: '0E', label: '0E'},
                    {value: '09', label: '09'},
                    {value: '10', label: '10'},
                    {value: '11', label: '11'},
                    {value: '12', label: '12'}
                ]
            },
            {
                key: 'credit',
                label: '學分',
                type: 'number',
                searchable: true,
                required: true,
                validationMessage: '請輸入學分數',
                placeholder: '請輸入學分數'
            },
            {
                key: 'class',
                label: '班級',
                type: 'text',
                searchable: true,
                sortable: false,
                required: true,
                validationMessage: '請輸入班級',
                placeholder: '例如：大一、大二、大三、大四'
            }
        ]
    });
}

// 初始化開課表格
$(document).ready(function() {
    initializeTable(courseOpenData);
}); 