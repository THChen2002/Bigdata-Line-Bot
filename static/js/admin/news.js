// 公告管理表格類
class NewsTable extends DataTable {
    // 覆寫新增方法
    onAdd() {
        showEditModal({
            title: '新增公告',
            icon: 'bi-plus-circle',
            fields: this.generateModalFields(null, 'add'),
            data: {},
            onSave: (formData) => {
                this.addItem(formData, {
                    url: '/admin/news/add'
                });
            }
        });
    }

    // 覆寫編輯方法
    onEdit(item) {
        showEditModal({
            title: '編輯公告',
            icon: 'bi-pencil-square',
            fields: this.generateModalFields(item, 'edit'),
            data: item,
            onSave: (formData) => {
                this.updateItem(item.news_id, formData, {
                    url: `/admin/news/update/${item.news_id}`
                });
            }
        });
    }

    // 覆寫刪除方法
    onDelete(item) {
        showConfirmModal({
            title: '刪除公告',
            message: `確定要刪除公告「${item.title}」嗎？此操作無法復原。`,
            confirmText: '刪除',
            confirmClass: 'btn-danger',
            onConfirm: () => {
                this.deleteItem(item.news_id, {
                    url: `/admin/news/delete/${item.news_id}`
                });
            }
        });
    }
}

function initializeTable(newsData) {
    window.newsTable = new NewsTable({
        data: newsData,
        idField: 'news_id',
        fields: [
            {
                key: 'news_id',
                label: '公告ID',
                type: 'text',
                searchable: true,
                editable: false,
                addable: false
            },
            {
                key: 'title',
                label: '標題',
                type: 'text',
                searchable: true,
                sortable: false,
                required: true
            },
            {
                key: 'category',
                label: '分類',
                type: 'select',
                searchable: true,
                filterable: true,
                filterType: 'select',
                options: [
                    { value: '公告', label: '公告', class: 'bg-primary' },
                    { value: '活動', label: '活動', class: 'bg-success' },
                    { value: '資訊分享', label: '資訊分享', class: 'bg-info' },
                    { value: '其他', label: '其他', class: 'bg-secondary' }
                ]
            },
            {
                key: 'content',
                label: '內容',
                type: 'textarea',
                searchable: true,
                visible: false,
                required: true
            },
            {
                key: 'is_active',
                label: '啟用',
                type: 'boolean',
                filterable: true,
                filterType: 'select',
                options: [
                    { value: true, label: '啟用', class: 'bg-success' },
                    { value: false, label: '停用', class: 'bg-danger' }
                ]
            },
            {
                key: 'views',
                label: '瀏覽次數',
                type: 'number',
                searchable: false,
                editable: false,
                addable: false
            },
            {
                key: 'created_at',
                label: '建立時間',
                type: 'datetime',
                visible: false,
                editable: false,
                addable: false
            },
            {
                key: 'updated_at',
                label: '更新時間',
                type: 'datetime',
                editable: false,
                addable: false
            }
        ]
    });
}

$(document).ready(function () {
    initializeTable(newsData);
});
