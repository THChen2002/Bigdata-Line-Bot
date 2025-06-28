// --- GLOBAL STATE ---
let currentSort = { column: 'id', direction: 'asc' };
let activeFilters = {
    ytLevels: []
};
let allUsers = [];
let membersChartInstance = null;

// --- INITIALIZATION ---
$(document).ready(function() {
    initializeLiff(liffId);
    initializeApp(usersData); 
});

// 初始化LIFF
function initializeLiff(liffId) {
    liff.init({ liffId: liffId }).then(() => {
        if (!liff.isLoggedIn()) {
            liff.login({
                redirectUri: window.location.href
            });
        } else {
            liff.getProfile().then(profile => {
                userId = profile.userId;
                if(adminUsers.includes(userId)) {
                    $('#liff-loading').addClass('d-none');
                    $('#mainContent').removeClass('d-none');
                } else {
                    window.location.href = '/forbidden';
                }
            }).catch(err => {
                console.error('取得使用者資訊失敗', err);
            });
        }
    }).catch(err => {
        console.error('LIFF 初始化失敗', err);
    });
}

// --- APP SETUP ---
function initializeApp(usersData) {
    // Process raw data into a more usable format
    allUsers = usersData.map((user, index) => ({
        id: index + 1,
        userId: user.userId,
        displayName: user.displayName,
        YtChannel: user.youtube?.channel || '',
        ytLevel: user.youtube?.level || 0,
        joinAt: user.youtube?.joinAt || ''
    }));
    
    setupEventListeners();
    renderDashboard();
    renderTable(allUsers); // Initial table render
    updateSortIcons(); // Set initial sort icon
}

// --- VIEW NAVIGATION ---
function showView(viewId) {
    $('.view').removeClass('active');
    $('#' + viewId).addClass('active');
    $('.nav-link').removeClass('active');
    if(viewId === 'dashboard-view'){
        $('#nav-dashboard').addClass('active');
            renderDashboard(); // Re-render dashboard when switching to it
    } else {
            $('#nav-users').addClass('active');
    }
}

// --- DASHBOARD LOGIC ---
function renderDashboard() {
    const levelCounts = { 0: 0, 1: 0, 2: 0, 3: 0 };
    allUsers.forEach(user => {
        levelCounts[user.ytLevel]++;
    });

    const totalMembers = levelCounts[1] + levelCounts[2] + levelCounts[3];
    
    $('#total-members-card').text(totalMembers);
    $('#non-members-card').text(levelCounts[0]);
    $('#level1-card').text(levelCounts[1]);
    $('#level2-card').text(levelCounts[2]);
    $('#level3-card').text(levelCounts[3]);
    
    renderChart(levelCounts);
}

function renderChart(levelCounts) {
    const ctx = document.getElementById('membersChart').getContext('2d');
    if(membersChartInstance) {
        membersChartInstance.destroy();
    }
    membersChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['請老師喝杯水 (Lv1)', '請老師吃便當 (Lv2)', '請老師吃大餐 (Lv3)'],
            datasets: [{
                label: '會員人數',
                data: [levelCounts[1], levelCounts[2], levelCounts[3]],
                backgroundColor: [
                    'rgba(13, 110, 253, 0.6)',
                    'rgba(25, 135, 84, 0.6)',
                    'rgba(255, 193, 7, 0.6)'
                ],
                borderColor: [
                    'rgb(13, 110, 253)',
                    'rgb(25, 135, 84)',
                    'rgb(255, 193, 7)'
                ],
                borderWidth: 1.5,
                borderRadius: 5,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                        grid: {
                        color: '#e9ecef'
                    },
                    ticks: {
                        precision: 0 // Ensure y-axis labels are integers
                    }
                },
                x: {
                        grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#343a40',
                    titleFont: { size: 14 },
                    bodyFont: { size: 12 },
                    padding: 10,
                    cornerRadius: 4,
                    displayColors: false,
                }
            }
        }
    });
}

// --- USER MANAGEMENT LOGIC ---
// 顯示用的時間格式轉換
function getDisplayTimestamp(datetime) {
    // 檢查是否為純日期格式（YYYY-MM-DD）
    if (typeof datetime === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(datetime)) {
        return datetime;
    }
    
    // 完整日期時間格式
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

function renderTable(users) {
    const tableBody = $('#userTableBody');
    tableBody.empty();
    if (users.length === 0) {
        tableBody.append('<tr><td colspan="7" class="text-center py-5">沒有符合條件的使用者</td></tr>');
        return;
    }
    const ytLevelMap = {
        0: { text: '無', class: 'badge-yt-0' },
        1: { text: '請老師喝杯水', class: 'badge-yt-1' },
        2: { text: '請老師吃便當', class: 'badge-yt-2' },
        3: { text: '請老師吃大餐', class: 'badge-yt-3' }
    };

    users.forEach(user => {
        const levelInfo = ytLevelMap[user.ytLevel] || ytLevelMap[0];
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
            </tr>
        `;
        tableBody.append(row);
    });
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
    // Navigation
    $('#nav-dashboard').on('click', (e) => { e.preventDefault(); showView('dashboard-view'); });
    $('#nav-users').on('click', (e) => { e.preventDefault(); showView('users-view'); });

    // Search (real-time)
    $('#searchInput').on('keyup', function(e) {
        applySearchAndFilter();
    });

    // Filter Panel
    $('#filterButton').on('click', () => $('#filterPanel').toggleClass('show'));
    $('#closeFilterBtn').on('click', () => $('#filterPanel').removeClass('show'));
    $('#applyFilterBtn').on('click', function() {
        // 收集選中的會員等級
        activeFilters.ytLevels = [];
        $("input[type=checkbox]:checked").each(function () {
            activeFilters.ytLevels.push($(this).val());
        });

        // 更新篩選標籤
        updateFilterBadges();

        // 重新渲染表格
        applySearchAndFilter();

        // 關閉篩選面板
        $("#filterPanel").removeClass("show");

        // 顯示篩選成功提示
        if (activeFilters.ytLevels.length > 0) {
            showToast("篩選條件已套用");
        }
    });

    // Reset
    $('#resetButton').on('click', function() {
        // 清空搜尋框
        $("#searchInput").val("");

        // 清空篩選條件
        activeFilters.ytLevels = [];
        $("input[type=checkbox]").prop("checked", false);

        // 更新篩選標籤
        updateFilterBadges();

        // 重新渲染表格
        applySearchAndFilter();

        // 顯示重置成功提示
        showToast("已重置所有篩選條件");
    });

    // Sorting
    $('th[data-sort]').on('click', function () {
        const column = $(this).data('sort');

        // 如果點擊的是當前排序的列，則切換排序方向
        if (column === currentSort.column) {
            currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            // 否則，更改排序列並設置為升序
            currentSort.column = column;
            currentSort.direction = 'asc';
        }

        updateSortIcons();
        applySearchAndFilter();
    });
    
    // Edit User Modal
    $(document).on('click', '.edit-user', function () {
        const userId = $(this).data("userid");
        const user = allUsers.find(u => u.userId === userId);
    
        if (user) {
            openEditModal(user);
        } else {
            alert("找不到對應的使用者資料！");
        }
    });

    // Save User Logic
    $('#saveUserBtn').on('click', function () {
        const userId = $("#editUserIdField").val();
        const newYtLevel = parseInt($("#editYtLevel").val());
        const newYtChannel = $("#editYtChannel").val();
        const joinAt = $("#editJoinAt").val() || "";

        // 這裡只是更新前端顯示
        // 用 userId 找到對應的使用者資料
        const userIndex = allUsers.findIndex(u => u.userId === userId);
    
        if (userIndex !== -1) {
            allUsers[userIndex].ytLevel = newYtLevel;
            allUsers[userIndex].YtChannel = newYtChannel;
            allUsers[userIndex].joinAt = joinAt;
            
            // 重新渲染表格和儀表板
            applySearchAndFilter();
            renderDashboard();

            // 發送修改的資料到後端
            $.ajax({
                url: '/admin/update',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    userId: userId,
                    channel: newYtChannel,
                    level: newYtLevel,
                    joinAt: joinAt
                }),
                success: function (response) {
                    if (response.success) {
                        showToast("使用者資料已更新成功！");
                    } else {
                        showToast("更新失敗：" + (response.message || "未知錯誤"));
                    }
                },
                error: function (xhr, status, error) {
                    showToast('發生錯誤：' + error);
                }
            });

            // 關閉彈窗
            $('#editUserModal').modal('hide');
        }
        else {
            alert("找不到對應的使用者資料！");
        }
    });
}

// --- CORE LOGIC ---
function applySearchAndFilter() {
    const searchTerm = $('#searchInput').val().toLowerCase();
    
    let filteredUsers = allUsers.filter(user => {
        const matchesSearch = searchTerm === '' || 
            user.userId.toLowerCase().includes(searchTerm) || 
            user.displayName.toLowerCase().includes(searchTerm) ||
            user.YtChannel.toLowerCase().includes(searchTerm);

        const matchesFilter = activeFilters.ytLevels.length === 0 || 
            activeFilters.ytLevels.includes(user.ytLevel.toString());

        return matchesSearch && matchesFilter;
    });
    
    sortUsers(filteredUsers); // Sort the filtered list
    renderTable(filteredUsers); // Render the final list
}

function updateFilterBadges() {
    const $filterBadgesContainer = $('#filterBadges').empty();
    const $activeFilters = $('#activeFilters');
    let hasFilters = false;
    
    const levelMap = {
        0: '無',
        1: '請老師喝杯水',
        2: '請老師吃便當',
        3: '請老師吃大餐'
    };

    // YT會員等級篩選標籤
    if (activeFilters.ytLevels.length > 0) {
        hasFilters = true;
        activeFilters.ytLevels.forEach(level => {
            const label = levelMap[level];
            const $badge = $(`<span class="badge bg-primary filter-badge">YT 等級: ${label} <i class="bi bi-x-circle-fill"></i></span>`);
            
            $badge.on('click', function() {
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

function sortUsers(users) {
    users.sort((a, b) => {
        let valA = a[currentSort.column];
        let valB = b[currentSort.column];
        
        // Handle numeric or string comparison
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

function updateSortIcons() {
    $('th[data-sort] .sort-icon').empty();
    const iconClass = currentSort.direction === 'asc' ? 'bi-sort-up' : 'bi-sort-down';
    $(`th[data-sort="${currentSort.column}"] .sort-icon`).html(`<i class="bi ${iconClass}"></i>`);
}

// 打開編輯彈窗
function openEditModal(user) {
    let joinAtDisplay = user.joinAt ? getDisplayTimestamp(user.joinAt) : '';
    $("#editUserId").val(user.id);
    $("#editUserName").val(user.displayName);
    $("#editUserIdField").val(user.userId);
    $("#editYtChannel").val(user.YtChannel || '');
    $("#editYtLevel").val(user.ytLevel ?? 0);
    $("#editJoinAt").val(user.joinAt || '');

    const editModal = new bootstrap.Modal($('#editUserModal'));
    editModal.show();
}

// 顯示提示訊息
function showToast(message) {
    const toast = `
        <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 11">
            <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <i class="bi bi-check-circle-fill text-success me-2"></i>
                    <strong class="me-auto">通知</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        </div>
    `;

    // 移除舊的提示
    $('.position-fixed.bottom-0.end-0.p-3').remove();

    // 添加新的提示
    $(toast).appendTo('body');
    setTimeout(() => {
        $('.toast').toast('hide');
        setTimeout(() => {
            $('.position-fixed.bottom-0.end-0.p-3').remove();
        }, 500);
    }, 3000);
}