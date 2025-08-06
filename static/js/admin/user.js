class UserTable extends DataTable {
    // 覆寫編輯方法
    onEdit(item) {
        showEditModal({
            title: '編輯使用者',
            icon: 'bi-person-gear',
            fields: this.generateModalFields(item, 'edit'),
            data: item,
            onSave: (formData) => {
                const userId = item.userId;
                const updates = {
                    youtube: {
                        channel: formData.ytChannel,
                        level: parseInt(formData.ytLevel),
                        joinAt: formData.joinAt || ""
                    }
                };
                
                this.updateItem(userId, updates, {
                    url: `/admin/user/update/${userId}`,
                    data: updates
                });
            }
        });
    }
}

// 初始化應用程式
function initializeTable(usersData) {    
    window.userTable = new UserTable({
        data: usersData,
        idField: 'userId',
        fields: [
            {
                key: 'userId',
                label: '用戶ID',
                type: 'text',
                searchable: true,
                sortable: false,
                editable: false
            },
            {
                key: 'displayName',
                label: '使用者名稱',
                type: 'text',
                searchable: true,
                sortable: false,
                editable: false
            },
            {
                key: 'pictureUrl',
                label: '頭像',
                type: 'image',
                searchable: false,
                sortable: false,
                editable: false
            },
            {
                key: 'permission',
                label: '權限',
                type: 'number',
                searchable: true,
                editable: false
            },
            {
                key: 'ytChannel',
                label: 'YT名稱',
                type: 'text',
                searchable: true,
                sortable: false,
                placeholder: '輸入 YT 頻道名稱',
                getRowValue: (item) => {
                    return item.youtube?.channel;
                },
                getModalValue: (item) => {
                    return item.youtube?.channel;
                }
            },
            {
                key: 'ytLevel',
                label: 'YT會員等級',
                type: 'select',
                filterable: true,
                filterType: 'checkbox',
                options: [
                    {value: '0', label: '無', class: 'bg-secondary'},
                    {value: '1', label: '等級 1 - 請老師喝杯水', class: 'bg-primary'},
                    {value: '2', label: '等級 2 - 請老師吃便當', class: 'bg-success'},
                    {value: '3', label: '等級 3 - 請老師吃大餐', class: 'bg-warning'}
                ],
                getRowValue: (item) => {
                    return item.youtube?.level;
                },
                getModalValue: (item) => {
                    return item.youtube?.level;
                }
            },
            {
                key: 'joinAt',
                label: '加入YT會員時間',
                type: 'datetime',
                getRowValue: (item) => {
                    return item.youtube?.joinAt;
                },
                getModalValue: (item) => {
                    return item.youtube?.joinAt;
                }
            }
        ]
    });
}

// 當 DOM 載入完成後初始化
$(document).ready(function() {
    initializeTable(usersData);
});