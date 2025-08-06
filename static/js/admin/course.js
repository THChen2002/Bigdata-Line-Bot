// 課程管理表格類
class CourseTable extends DataTable {
    // 覆寫新增方法
    onAdd() {
        showEditModal({
            title: '新增課程',
            icon: 'bi-plus-circle',
            fields: this.generateModalFields(null, 'add'),
            data: {},
            onSave: (formData) => {
                const max_id = Math.max(...this.data.map(c => c.course_id || 0), 0);
                formData.course_id = max_id + 1;
                this.addItem(formData, {
                    url: '/admin/course/add'
                });
            }
        });
    }

    // 覆寫編輯方法
    onEdit(item) {
        showEditModal({
            title: '編輯課程',
            icon: 'bi-pencil-square',
            fields: this.generateModalFields(item, 'edit'),
            data: item,
            onSave: (formData) => {
                this.updateItem(item.course_id, formData, {
                    url: `/admin/course/update/${item.course_id}`
                });
            }
        });
    }

    // 覆寫刪除方法
    onDelete(item) {
        showConfirmModal({
            title: '刪除課程',
            message: `確定要刪除課程「${item.course_cname}」嗎？此操作無法復原。`,
            confirmText: '刪除',
            confirmClass: 'btn-danger',
            onConfirm: () => {
                this.deleteItem(item.course_id, {
                    url: `/admin/course/delete/${item.course_id}`
                });
            }
        });
    }
}

function initializeTable(coursesData) {
    window.courseTable = new CourseTable({
        data: coursesData,
        idField: 'course_id',
        fields: [
            {
                key: 'course_id',
                label: '課程ID',
                type: 'text',
                searchable: true,
                editable: false,
                addable: false
            },
            {
                key: 'course_cname',
                label: '課程名稱(中文)',
                type: 'text',
                searchable: true,
                sortable: false,
                required: true
            },
            {
                key: 'course_ename',
                label: '課程名稱(英文)',
                type: 'text',
                searchable: true,
                sortable: false,
                required: true
            },
            {
                key: 'category',
                label: '類別',
                type: 'select',
                searchable: true,
                filterable: true,
                filterType: 'select',
                options: [
                    {value: '基礎', label: '基礎', class: 'bg-primary'},
                    {value: '進階', label: '進階', class: 'bg-danger'},
                    {value: '實務', label: '實務', class: 'bg-warning'}
                ]
            },
            {
                key: 'type',
                label: '類型',
                type: 'select',
                searchable: true,
                filterable: true,
                filterType: 'select',
                options: [
                    {value: '必修', label: '必修', class: 'bg-danger'},
                    {value: '選修', label: '選修', class: 'bg-success'}
                ]
            },
            {
                key: 'cover_url',
                label: '封面圖片',
                type: 'image',
                searchable: false,
                sortable: false
            }
        ]
    });
}

// 初始化課程表格
$(document).ready(function() {
    initializeTable(coursesData);
});