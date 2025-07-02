// 常數區
const YT_LEVEL_MAP = {
    0: { text: '無', class: 'badge-yt-0' },
    1: { text: '請老師喝杯水', class: 'badge-yt-1' },
    2: { text: '請老師吃便當', class: 'badge-yt-2' },
    3: { text: '請老師吃大餐', class: 'badge-yt-3' }
};
const USER_EDIT_FIELDS = [
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
];

let currentSort = { column: 'id', direction: 'asc' };
let activeFilters = { ytLevels: [] };
let allUsers = [];

// 初始化應用程式
function initializeApp(usersData) {
    allUsers = usersData.map((user, index) => ({
        id: index + 1,
        userId: user.userId,
        displayName: user.displayName,
        YtChannel: user.youtube?.channel || '',
        ytLevel: user.youtube?.level || 0,
        joinAt: user.youtube?.joinAt || ''
    }));
    setupEventListeners();
    renderTable(allUsers);
    updateSortIcons();
}

// 顯示用的時間格式轉換
function getDisplayTimestamp(datetime) {
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

// 渲染使用者表格
function renderTable(users) {
    const tableBody = $('#user-table-body');
    tableBody.empty();
    if (users.length === 0) {
        tableBody.append('<tr><td colspan="7" class="text-center py-5">沒有符合條件的使用者</td></tr>');
        return;
    }
    users.forEach(user => {
        const levelInfo = YT_LEVEL_MAP[user.ytLevel] || YT_LEVEL_MAP[0];
        const displayJoinAt = user.joinAt ? getDisplayTimestamp(user.joinAt) : '';
        const row = `
        <tr data-user-id="${user.userId}">
            <td>${user.id}</td>
            <td title="${user.userId}">${user.userId.substring(0, 15)}...</td>
            <td>${user.displayName}</td>
            <td>${user.YtChannel || ''}</td>
            <td><span class="badge ${levelInfo.class}">${levelInfo.text}</span></td>
            <td>${displayJoinAt}</td>
            <td><span class="btn-edit edit-user" data-userid="${user.userId}"><i class="bi bi-pencil-square me-1"></i>編輯</span></td>
        </tr>`;
        tableBody.append(row);
    });
}

// 綁定事件
function setupEventListeners() {
    $('#search-input').on('keyup', applySearchAndFilter);
    $('#filterButton').on('click', () => $('#filterPanel').toggleClass('show'));
    $('#closeFilterBtn').on('click', () => $('#filterPanel').removeClass('show'));
    $('#applyFilterBtn').on('click', () => {
        activeFilters.ytLevels = $("input[type=checkbox]:checked").map((_, el) => $(el).val()).get();
        updateFilterBadges();
        applySearchAndFilter();
        $("#filterPanel").removeClass("show");
        if (activeFilters.ytLevels.length > 0) showToast("篩選條件已套用");
    });
    $('#resetButton').on('click', () => {
        $("#search-input").val("");
        activeFilters.ytLevels = [];
        $("input[type=checkbox]").prop("checked", false);
        updateFilterBadges();
        applySearchAndFilter();
        showToast("已重置所有篩選條件");
    });
    $('th[data-sort]').on('click', function () {
        const column = $(this).data('sort');
        if (column === currentSort.column) {
            currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort.column = column;
            currentSort.direction = 'asc';
        }
        updateSortIcons();
        applySearchAndFilter();
    });
    $(document).on('click', '.edit-user', function () {
        const userId = $(this).data("userid");
        const user = allUsers.find(u => u.userId === userId);
        if (user) openEditModal(user);
        else showToast("找不到對應的使用者資料！", 'error');
    });
}

// 搜尋與篩選
function applySearchAndFilter() {
    const searchTerm = $('#search-input').val().toLowerCase();
    let filteredUsers = allUsers.filter(user => {
        const matchesSearch = searchTerm === '' ||
            user.userId.toLowerCase().includes(searchTerm) ||
            user.displayName.toLowerCase().includes(searchTerm) ||
            user.YtChannel.toLowerCase().includes(searchTerm);
        const matchesFilter = activeFilters.ytLevels.length === 0 ||
            activeFilters.ytLevels.includes(user.ytLevel.toString());
        return matchesSearch && matchesFilter;
    });
    sortUsers(filteredUsers);
    renderTable(filteredUsers);
}

// 篩選徽章
function updateFilterBadges() {
    const $filterBadgesContainer = $('#filterBadges').empty();
    const $activeFilters = $('#activeFilters');
    let hasFilters = false;
    const levelMap = {
        0: '無', 1: '請老師喝杯水', 2: '請老師吃便當', 3: '請老師吃大餐'
    };
    if (activeFilters.ytLevels.length > 0) {
        hasFilters = true;
        activeFilters.ytLevels.forEach(level => {
            const label = levelMap[level];
            const $badge = $(`<span class="badge bg-primary filter-badge">YT 等級: ${label} <i class="bi bi-x-circle-fill"></i></span>`);
            $badge.on('click', function () {
                activeFilters.ytLevels = activeFilters.ytLevels.filter(l => l !== level);
                $(`#level${level}`).prop('checked', false);
                applySearchAndFilter();
                updateFilterBadges();
            });
            $filterBadgesContainer.append($badge);
        });
    }
    $activeFilters.toggle(hasFilters);
}

// 排序
function sortUsers(users) {
    users.sort((a, b) => {
        let valA = a[currentSort.column];
        let valB = b[currentSort.column];
        if (typeof valA === 'string') {
            const result = valA.localeCompare(valB, 'zh-Hant');
            return currentSort.direction === 'asc' ? result : -result;
        } else {
            if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
            if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });
}

// 排序圖示
function updateSortIcons() {
    $('th[data-sort] .sort-icon').empty();
    const iconClass = currentSort.direction === 'asc' ? 'bi-sort-up' : 'bi-sort-down';
    $(`th[data-sort="${currentSort.column}"] .sort-icon`).html(`<i class="bi ${iconClass}"></i>`);
}

// 編輯 Modal
function showUserEditModal(userData, onSave) {
    showEditModal({
        title: '編輯使用者',
        icon: 'bi-person-gear',
        fields: USER_EDIT_FIELDS,
        data: userData,
        onSave
    });
}

function openEditModal(user) {
    const userData = {
        editUserId: user.id,
        editUserName: user.displayName,
        editUserIdField: user.userId,
        editYtChannel: user.YtChannel || '',
        editYtLevel: user.ytLevel ?? 0,
        editJoinAt: user.joinAt || ''
    };
    showUserEditModal(userData, formData => {
        const userId = formData.editUserIdField;
        const newYtLevel = parseInt(formData.editYtLevel);
        const newYtChannel = formData.editYtChannel;
        const joinAt = formData.editJoinAt || "";
        const userIndex = allUsers.findIndex(u => u.userId === userId);
        if (userIndex !== -1) {
            allUsers[userIndex].ytLevel = newYtLevel;
            allUsers[userIndex].YtChannel = newYtChannel;
            allUsers[userIndex].joinAt = joinAt;
            applySearchAndFilter();
            // 發送修改的資料到後端
            $.ajax({
                url: '/admin/update',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ userId, channel: newYtChannel, level: newYtLevel, joinAt }),
                success: response => {
                    if (response.success) {
                        showToast("使用者資料已更新成功！");
                        $('#editModal').modal('hide');
                    } else {
                        showToast("更新失敗：" + (response.message || "未知錯誤"), 'error');
                    }
                },
                error: (xhr, status, error) => {
                    showToast('發生錯誤：' + error, 'error');
                }
            });
        } else {
            showToast("找不到對應的使用者資料！", 'error');
        }
    });
}

$(document).ready(() => {
    initializeApp(usersData);
    setActiveNav('nav-users');
});