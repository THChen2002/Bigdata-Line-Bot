$(document).ready(function () {
    const rowsPerPage = 6;
    const allCourseCards = $('.course-card');
    let filteredCards = allCourseCards;
    let totalRows = allCourseCards.length;
    let totalPages = Math.ceil(totalRows / rowsPerPage);
    let currentPage = 1;
    let currentCategory = 'all';

    // 從 URL 獲取類別參數
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    if (categoryParam) {
        currentCategory = categoryParam;
        $('#categoryFilter .category-pill').removeClass('active bg-primary').addClass('bg-secondary');
        $(`#categoryFilter .category-pill[data-category="${currentCategory}"]`).removeClass('bg-secondary').addClass('bg-primary active');
        filterCourses();
    }

    // 類別篩選功能
    $('#categoryFilter .category-pill').click(function() {
        currentCategory = $(this).data('category');
        
        // 更新選中狀態
        $('#categoryFilter .category-pill').removeClass('active bg-primary').addClass('bg-secondary');
        $(this).removeClass('bg-secondary').addClass('bg-primary active');
        
        // 過濾課程
        filterCourses();
        
        // 更新 URL（可選）
        if (history.pushState) {
            const newUrl = currentCategory === 'all' 
                ? window.location.pathname 
                : `${window.location.pathname}?category=${currentCategory}`;
            window.history.pushState({ path: newUrl }, '', newUrl);
        }
    });

    function filterCourses() {
        // 重置顯示狀態
        allCourseCards.hide();
        
        if (currentCategory === 'all') {
            filteredCards = allCourseCards;
        } else {
            filteredCards = allCourseCards.filter(function() {
                return $(this).data('category') === currentCategory;
            });
        }
        
        // 重新計算分頁
        totalRows = filteredCards.length;
        totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
        currentPage = 1;
        
        showPage(currentPage);
    }

    function showPage(page) {
        const start = (page - 1) * rowsPerPage;
        const end = Math.min(start + rowsPerPage, totalRows);
        
        // 隱藏所有卡片，然後只顯示當前頁的卡片
        allCourseCards.hide();
        filteredCards.slice(start, end).show();

        // 更新分頁控制項
        updatePagination(page);

        // 更新顯示信息
        if (totalRows > 0) {
            $('#pagination-info').text(`顯示第 ${start + 1} 筆至第 ${end} 筆，共 ${totalRows} 筆課程`);
        } else {
            $('#pagination-info').text('沒有符合條件的課程');
        }
    }

    function updatePagination(page) {
        const pagination = $('.pagination');
        pagination.empty();

        // 如果沒有課程或只有一頁，不顯示分頁
        if (totalPages <= 1) {
            return;
        }

        // 生成分頁按鈕
        let startPage = Math.max(1, page - 1);
        let endPage = Math.min(totalPages, startPage + 2);
        if (endPage - startPage < 2) {
            startPage = Math.max(1, endPage - 2);
        }

        // 首頁和上一頁按鈕
        pagination.append(`<li class="page-item ${page === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="1">&laquo;</a></li>`);
        pagination.append(`<li class="page-item ${page === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${page - 1}">&lsaquo;</a></li>`);

        // 頁碼按鈕
        for (let i = startPage; i <= endPage; i++) {
            pagination.append(`<li class="page-item ${page === i ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a></li>`);
        }

        // 下一頁和尾頁按鈕
        pagination.append(`<li class="page-item ${page === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${page + 1}">&rsaquo;</a></li>`);
        pagination.append(`<li class="page-item ${page === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${totalPages}">&raquo;</a></li>`);
    }

    // 綁定分頁點擊事件
    $(document).on('click', '.pagination .page-link', function (e) {
        e.preventDefault();
        const page = parseInt($(this).data('page'));
        if (!isNaN(page) && page >= 1 && page <= totalPages) {
            currentPage = page;
            showPage(currentPage);
        }
    });

    // 初始化顯示
    filterCourses();
});