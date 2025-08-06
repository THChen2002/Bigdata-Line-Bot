// 影片管理表格類
class VideoTable extends DataTable {
    // 覆寫新增方法
    onAdd() {
        showEditModal({
            title: '新增影片',
            icon: 'bi-plus-circle',
            fields: this.generateModalFields(null, 'add'),
            data: {},
            onSave: (formData) => {
                const max_id = Math.max(...this.data.map(v => v.video_id || 0), 0);
                formData.video_id = max_id + 1;
                this.addItem(formData, {
                    url: '/admin/video/add'
                });
            }
        });
    }

    // 覆寫編輯方法
    onEdit(item) {
        showEditModal({
            title: '編輯影片',
            icon: 'bi-pencil-square',
            fields: this.generateModalFields(item, 'edit'),
            data: item,
            onSave: (formData) => {
                this.updateItem(item.video_id, formData, {
                    url: `/admin/video/update/${item.video_id}`
                });
            }
        });
    }

    // 覆寫刪除方法
    onDelete(item) {
        showConfirmModal({
            title: '刪除影片',
            message: `確定要刪除影片「${item.video_name}」嗎？此操作無法復原。`,
            confirmText: '刪除',
            confirmClass: 'btn-danger',
            onConfirm: () => {
                this.deleteItem(item.video_id, {
                    url: `/admin/video/delete/${item.video_id}`
                });
            }
        });
    }
}

function initializeTable(videosData) {
    window.videoTable = new VideoTable({
        data: videosData,
        idField: 'video_id',
        fields: [
            {
                key: 'video_id',
                label: '影片ID',
                type: 'text',
                searchable: true,
                editable: false,
                addable: false
            },
            {
                key: 'video_name',
                label: '影片名稱',
                type: 'text',
                required: true,
                searchable: true,
                sortable: false
            },
            {
                key: 'video_url',
                label: 'YouTube連結',
                type: 'link',
                required: true,
                searchable: false,
                sortable: false
            },
            {
                key: 'category',
                label: '類別',
                type: 'select',
                required: true,
                searchable: true,
                filterable: true,
                filterType: 'select',
                options: [
                    {value: '教育版註冊', label: '教育版註冊', class: 'bg-success'},
                    {value: '程式安裝教學', label: '程式安裝教學', class: 'bg-info'},
                    {value: 'Python初學小教室', label: 'Python初學小教室', class: 'bg-secondary'},
                    {value: 'n8n', label: 'n8n', class: 'bg-warning'},
                    {value: 'AI LINE Bot練功坊', label: 'AI LINE Bot練功坊', class: 'bg-danger'},
                    {value: 'LINE Bot進階實戰應用', label: 'LINE Bot進階實戰應用', class: 'bg-dark'}
                ],
                render: (value, item) => {
                    const colors = {
                        '教育版註冊': 'success',
                        '程式安裝教學': 'info',
                        'Python初學小教室': 'secondary',
                        'n8n': 'warning',
                        'AI LINE Bot練功坊': 'danger',
                        'LINE Bot進階實戰應用': 'dark'
                    };
                    const color = colors[value] || 'secondary';
                    return `<span class="badge bg-${color}">${value || ''}</span>`;
                }
            },
            {
                key: 'description',
                label: '描述',
                type: 'textarea',
                searchable: true,
                sortable: false,
                render: (value, item) => {
                    return `<div class="text-truncate" style="max-width: 200px;" title="${value || ''}">${value || ''}</div>`;
                }
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

// 初始化影片表格
$(document).ready(function () {
    initializeTable(videosData);
});