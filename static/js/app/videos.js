// 全局變數
const rowsPerPage = 6;
let $allVideoCards;
let $filteredCards;
let currentPage = 1;
let currentKeyword = '';
let currentCategory = 'all';

$(document).ready(function () {
    // 初始化變數
    $allVideoCards = $('.video-card');
    $filteredCards = $allVideoCards;

    // 事件綁定
    bindEvents();

    // 初始化顯示
    filterVideos();
});

function bindEvents() {    
    // 系列篩選變更
    $('#seriesFilter').on('change', function() {
        currentCategory = $(this).val();
        filterVideos();
    });

    // 搜尋框即時搜尋
    $('#searchInput').on('input', function() {
        currentKeyword = $(this).val().trim();
        filterVideos();
    });

    // 分頁點擊事件
    $(document).on('click', '.pagination .page-link', function (e) {
        e.preventDefault();
        const page = parseInt($(this).data('page'));
        if (!isNaN(page) && page >= 1 && page <= getTotalPages()) {
            currentPage = page;
            showPage(currentPage);
        }
    });
}

// 篩選影片卡片
function filterVideos() {
    // 重置顯示狀態
    $allVideoCards.hide();
    $filteredCards = $allVideoCards;

    // 類別篩選
    if (currentCategory && currentCategory !== 'all') {
        $filteredCards = $filteredCards.filter(function() {
            return $(this).data('category') === currentCategory;
        });
    }

    // 關鍵字搜尋
    if (currentKeyword) {
        $filteredCards = $filteredCards.filter(function() {
            const name = $(this).find('.card-title').text();
            return name.toLowerCase().includes(currentKeyword.toLowerCase());
        });
    }
    
    // 重置分頁並顯示
    currentPage = 1;
    showPage(currentPage);
}

// 顯示指定頁面的卡片
function showPage(page) {
    const start = (page - 1) * rowsPerPage;
    const end = Math.min(start + rowsPerPage, $filteredCards.length);
    
    // 隱藏所有卡片，顯示當前頁的卡片
    $allVideoCards.hide();
    $filteredCards.slice(start, end).show();

    // 更新分頁控制項
    updatePagination(page);
    updatePaginationInfo(start, end);
}

// 更新分頁信息
function updatePaginationInfo(start, end) {
    const totalRows = $filteredCards.length;
    if (totalRows > 0) {
        $('#pagination-info').text(`顯示第 ${start + 1} 筆至第 ${end} 筆，共 ${totalRows} 筆課程`);
    } else {
        $('#pagination-info').text('沒有符合條件的課程');
    }
}

// 更新分頁導航
function updatePagination(page) {
    const $pagination = $('.pagination');
    const totalPages = getTotalPages();
    
    $pagination.empty();

    // 如果沒有課程或只有一頁，不顯示分頁
    if (totalPages <= 1) {
        return;
    }

    // 計算顯示的頁碼範圍
    let startPage = Math.max(1, page - 1);
    let endPage = Math.min(totalPages, startPage + 2);
    if (endPage - startPage < 2) {
        startPage = Math.max(1, endPage - 2);
    }

    // 生成分頁按鈕
    generatePaginationButtons($pagination, page, startPage, endPage, totalPages);
}

// 生成分頁按鈕
function generatePaginationButtons($pagination, currentPage, startPage, endPage, totalPages) {
    // 首頁和上一頁
    $pagination.append(`
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="1">&laquo;</a>
        </li>
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}">&lsaquo;</a>
        </li>
    `);

    // 頁碼按鈕
    for (let i = startPage; i <= endPage; i++) {
        $pagination.append(`
            <li class="page-item ${currentPage === i ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `);
    }

    // 下一頁和尾頁
    $pagination.append(`
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage + 1}">&rsaquo;</a>
        </li>
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${totalPages}">&raquo;</a>
        </li>
    `);
}

// 獲取總頁數
function getTotalPages() {
    return Math.max(1, Math.ceil($filteredCards.length / rowsPerPage));
}