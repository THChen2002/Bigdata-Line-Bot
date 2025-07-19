// 常數區
const YT_LEVEL_MAP = {
    0: { text: '無', class: 'badge-yt-0' },
    1: { text: '請老師喝杯水', class: 'badge-yt-1' },
    2: { text: '請老師吃便當', class: 'badge-yt-2' },
    3: { text: '請老師吃大餐', class: 'badge-yt-3' }
};

// 用戶管理表格類
class UserTable extends DataTable {
    constructor() {
        super({
            tableId: 'user-table',
            searchId: 'user-search',
            filterPanelId: 'userFilterPanel',
            tableBodyId: 'user-table-body',
            paginationId: 'pagination', // 宏使用固定的 pagination ID
            itemsPerPage: 10,
            idField: 'userId' // 用戶管理使用 userId 作為主鍵
        });
        
        this.initUserSpecificFeatures();
    }
    
    initUserSpecificFeatures() {
        // 初始化用戶特定的篩選器
        this.initFilters();
        
        // 綁定篩選器移除事件
        $('#filterBadges').on('click', '.bi-x', (e) => {
            const filterKey = $(e.target).data('filter');
            this.removeFilter(filterKey);
        });
    }
    
    initFilters() {
        const filterContent = `
            <div class="row g-3">
                <div class="col-md-12">
                    <label class="form-label">YT會員等級</label>
                    <div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="checkbox" id="filter-level-0" value="0">
                            <label class="form-check-label" for="filter-level-0">無</label>
                        </div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="checkbox" id="filter-level-1" value="1">
                            <label class="form-check-label" for="filter-level-1">請老師喝杯水</label>
                        </div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="checkbox" id="filter-level-2" value="2">
                            <label class="form-check-label" for="filter-level-2">請老師吃便當</label>
                        </div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="checkbox" id="filter-level-3" value="3">
                            <label class="form-check-label" for="filter-level-3">請老師吃大餐</label>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        $('#filter-content').html(filterContent);
    }
    
    applyFilters() {
        this.filters = {};
        
        // 收集YT等級篩選
        const selectedLevels = [];
        $('input[id^="filter-level-"]:checked').each(function() {
            selectedLevels.push(parseInt($(this).val()));
        });
        if (selectedLevels.length > 0) {
            this.filters.ytLevel = selectedLevels;
        }
        
        // 應用篩選
        this.filteredData = this.data.filter(item => {
            let match = true;
            
            if (this.filters.ytLevel && this.filters.ytLevel.length > 0) {
                match = match && this.filters.ytLevel.includes(item.ytLevel);
            }
            
            return match;
        });
        
        this.currentPage = 1;
        this.render();
        this.toggleFilterPanel();
        this.updateFilterBadges();
    }
    
    removeFilter(filterKey) {
        delete this.filters[filterKey];
        
        // 清除對應的 checkbox
        $(`input[id^="filter-${filterKey}-"]`).prop('checked', false);
        
        this.applyFilters();
    }
    
    renderRow(user) {
        const levelInfo = YT_LEVEL_MAP[user.ytLevel] || YT_LEVEL_MAP[0];
        const displayJoinAt = user.joinAt ? this.getDisplayTimestamp(user.joinAt) : '';
        
        return `
            <tr>
                <td>${user.id || ''}</td>
                <td title="${user.userId}">${user.userId ? user.userId.substring(0, 15) + '...' : ''}</td>
                <td>${user.displayName || ''}</td>
                <td>${user.YtChannel || ''}</td>
                <td>
                    <span class="badge ${levelInfo.class}">${levelInfo.text}</span>
                </td>
                <td>${displayJoinAt}</td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button type="button" class="btn btn-outline-primary btn-edit" data-id="${user.userId}" title="編輯">
                            <i class="bi bi-pencil"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
    
    getDisplayTimestamp(datetime) {
        if (typeof datetime === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(datetime)) return datetime;
        const date = new Date(datetime);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const period = hours >= 12 ? '下午' : '上午';
        hours = hours % 12 || 12;
        hours = String(hours).padStart(2, '0');
        return `${year}/${month}/${day} ${period}${hours}:${minutes}:${seconds}`;
    }
    
    bindRowEvents() {
        // 綁定編輯按鈕事件
        $(`#${this.options.tableBodyId}`).off('click', '.btn-edit').on('click', '.btn-edit', (e) => {
            const userId = $(e.currentTarget).data('id');
            const user = this.data.find(u => u.userId === userId);
            if (user) {
                this.showEditUserModal(user);
            }
        });
    }
    
    showEditUserModal(user) {
        const userData = {
            editUserId: user.id,
            editUserName: user.displayName,
            editUserIdField: user.userId,
            editYtChannel: user.YtChannel || '',
            editYtLevel: user.ytLevel ?? 0,
            editJoinAt: user.joinAt || ''
        };
        
        showEditModal({
            title: '編輯使用者',
            icon: 'bi-person-gear',
            fields: [
                { id: 'editUserName', label: '使用者名稱', type: 'text', readonly: true },
                { id: 'editUserIdField', label: 'User ID', type: 'text', readonly: true },
                { id: 'editYtChannel', label: 'YT名稱', type: 'text', placeholder: '輸入 YouTube 頻道名稱' },
                { id: 'editYtLevel', label: 'YT會員等級', type: 'select', options: [
                    { value: '0', label: '無' },
                    { value: '1', label: '等級 1 - 請老師喝杯水' },
                    { value: '2', label: '等級 2 - 請老師吃便當' },
                    { value: '3', label: '等級 3 - 請老師吃大餐' }
                ] },
                { id: 'editJoinAt', label: '註冊日期', type: 'date' }
            ],
            data: userData,
            onSave: (formData) => {
                this.updateUser(formData);
            }
        });
    }
    
    updateUser(formData) {
        const userId = formData.editUserIdField;
        const updates = {
            YtChannel: formData.editYtChannel,
            ytLevel: parseInt(formData.editYtLevel),
            joinAt: formData.editJoinAt || ""
        };
        
        // 發送修改的資料到後端
        $.ajax({
            url: '/admin/line/operation',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                type: 'update_user',
                userId,
                youtube: {
                    channel: updates.YtChannel,
                    level: updates.ytLevel,
                    joinAt: updates.joinAt
                }
            }),
            success: (response) => {
                if (response.success) {
                    this.updateItem(userId, updates);
                    this.showToast("使用者資料已更新成功！");
                    $('#editModal').modal('hide');
                } else {
                    this.showToast("更新失敗：" + (response.message || "未知錯誤"), 'error');
                }
            },
            error: (xhr, status, error) => {
                this.showToast('發生錯誤：' + error, 'error');
            }
        });
    }
}

// 初始化應用程式
function initializeApp(usersData) {
    const processedData = usersData.map((user, index) => ({
        id: index + 1,
        userId: user.userId,
        displayName: user.displayName,
        YtChannel: user.youtube?.channel || '',
        ytLevel: user.youtube?.level || 0,
        joinAt: user.youtube?.joinAt || ''
    }));
    
    window.userTable = new UserTable();
    window.userTable.setData(processedData);
    window.userTable.bindRowEvents();
}

$(document).ready(() => {
    initializeApp(usersData);
    setActiveNav('nav-users');
});