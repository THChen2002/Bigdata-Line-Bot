/**
 * 通用數據表格管理類
 */
class DataTable {
    constructor(options = {}) {
        this.options = {
            tableId: 'data-table',
            searchId: 'search-input',
            filterPanelId: 'filterPanel',
            tableBodyId: 'table-body',
            paginationId: 'pagination',
            itemsPerPage: 10,
            idField: 'id',
            ...options
        };
        
        this.data = [];
        this.filteredData = [];
        this.currentPage = 1;
        this.sortField = null;
        this.sortDirection = 'asc';
        this.filters = {};
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.render();
    }
    
    bindEvents() {
        // 搜尋功能
        $(`#${this.options.searchId}`).on('input', (e) => {
            this.handleSearch(e.target.value);
        });
        
        // 篩選按鈕
        $('#filterButton').on('click', () => {
            this.toggleFilterPanel();
        });
        
        $('#closeFilterBtn').on('click', () => {
            this.toggleFilterPanel();
        });
        
        // 套用篩選
        $('#applyFilterBtn').on('click', () => {
            this.applyFilters();
        });
        
        // 重置按鈕
        $('#resetButton').on('click', () => {
            this.resetFilters();
        });
        
        // 排序功能
        $(`#${this.options.tableId}`).on('click', 'th[data-sort]', (e) => {
            const field = $(e.currentTarget).data('sort');
            this.handleSort(field);
        });
        
        // 分頁
        $(`#${this.options.paginationId}`).on('click', '.page-link', (e) => {
            e.preventDefault();
            const page = $(e.currentTarget).data('page');
            if (page) {
                this.goToPage(page);
            }
        });
    }
    
    setData(data) {
        this.data = data;
        this.filteredData = [...data];
        this.currentPage = 1;
        this.render();
    }
    
    handleSearch(query) {
        if (!query.trim()) {
            this.filteredData = [...this.data];
        } else {
            this.filteredData = this.data.filter(item => 
                Object.values(item).some(value => 
                    String(value).toLowerCase().includes(query.toLowerCase())
                )
            );
        }
        this.currentPage = 1;
        this.render();
    }
    
    toggleFilterPanel() {
        const $panel = $(`#${this.options.filterPanelId}`);
        $panel.toggle();
    }
    
    applyFilters() {
        // 子類可以重寫這個方法來實現特定的篩選邏輯
        this.currentPage = 1;
        this.render();
        this.toggleFilterPanel();
    }
    
    resetFilters() {
        this.filters = {};
        this.filteredData = [...this.data];
        this.currentPage = 1;
        this.render();
        this.toggleFilterPanel();
        this.updateFilterBadges();
    }
    
    handleSort(field) {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
        
        // 更新排序圖標
        $(`#${this.options.tableId} th[data-sort] .sort-icon`).html('<i class="bi bi-sort-up"></i>');
        $(`#${this.options.tableId} th[data-sort="${field}"] .sort-icon`).html(
            `<i class="bi bi-sort-${this.sortDirection === 'asc' ? 'up' : 'down'}"></i>`
        );
        
        this.render();
    }
    
    goToPage(page) {
        this.currentPage = page;
        this.render();
    }
    
    render() {
        // 排序數據
        let sortedData = [...this.filteredData];
        if (this.sortField) {
            sortedData.sort((a, b) => {
                let aVal = a[this.sortField];
                let bVal = b[this.sortField];
                
                // 處理數字排序
                if (!isNaN(aVal) && !isNaN(bVal)) {
                    aVal = Number(aVal);
                    bVal = Number(bVal);
                } else {
                    aVal = String(aVal || '').toLowerCase();
                    bVal = String(bVal || '').toLowerCase();
                }
                
                if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
                if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }
        
        // 分頁
        const startIndex = (this.currentPage - 1) * this.options.itemsPerPage;
        const endIndex = startIndex + this.options.itemsPerPage;
        const pageData = sortedData.slice(startIndex, endIndex);
        
        this.renderTable(pageData);
        this.renderPagination(sortedData.length);
        this.updatePaginationInfo(sortedData.length, startIndex, endIndex);
    }
    
    renderTable(data) {
        const $tbody = $(`#${this.options.tableBodyId}`);
        $tbody.empty();
        
        if (data.length === 0) {
            $tbody.html('<tr><td colspan="100%" class="text-center text-muted">沒有找到資料</td></tr>');
            return;
        }
        
        data.forEach(item => {
            const row = this.renderRow(item);
            $tbody.append(row);
        });
    }
    
    renderRow(item) {
        // 子類需要重寫這個方法來實現特定的行渲染邏輯
        return `<tr><td colspan="100%" class="text-center">請重寫 renderRow 方法</td></tr>`;
    }
    
    renderPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.options.itemsPerPage);
        const $pagination = $(`#${this.options.paginationId}`);
        $pagination.empty();
        
        if (totalPages <= 1) return;
        
        // 上一頁
        const prevDisabled = this.currentPage === 1 ? 'disabled' : '';
        $pagination.append(`
            <li class="page-item ${prevDisabled}">
                <a class="page-link" href="#" data-page="${this.currentPage - 1}">上一頁</a>
            </li>
        `);
        
        // 頁碼
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            const active = i === this.currentPage ? 'active' : '';
            $pagination.append(`
                <li class="page-item ${active}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `);
        }
        
        // 下一頁
        const nextDisabled = this.currentPage === totalPages ? 'disabled' : '';
        $pagination.append(`
            <li class="page-item ${nextDisabled}">
                <a class="page-link" href="#" data-page="${this.currentPage + 1}">下一頁</a>
            </li>
        `);
    }
    
    updatePaginationInfo(totalItems, startIndex, endIndex) {
        $('#total-count').text(totalItems);
        $('#start-index').text(startIndex + 1);
        $('#end-index').text(Math.min(endIndex, totalItems));
    }
    
    updateFilterBadges() {
        const $badges = $('#filterBadges');
        $badges.empty();
        
        Object.entries(this.filters).forEach(([key, value]) => {
            if (value && value.length > 0) {
                $badges.append(`
                    <span class="badge bg-primary me-1">
                        ${key}: ${Array.isArray(value) ? value.join(', ') : value}
                        <i class="bi bi-x ms-1" style="cursor: pointer;" data-filter="${key}"></i>
                    </span>
                `);
            }
        });
        
        if ($badges.children().length > 0) {
            $('#activeFilters').show();
        } else {
            $('#activeFilters').hide();
        }
    }
    
    // CRUD 操作方法
    addItem(item) {
        this.data.push(item);
        this.filteredData = [...this.data];
        this.render();
    }
    
    updateItem(id, updates) {
        const index = this.data.findIndex(item => item[this.options.idField] === id);
        if (index !== -1) {
            this.data[index] = { ...this.data[index], ...updates };
            this.filteredData = [...this.data];
            this.render();
        }
    }
    
    deleteItem(id) {
        this.data = this.data.filter(item => item[this.options.idField] !== id);
        this.filteredData = [...this.data];
        this.render();
    }
    
    // 工具方法
    showToast(message, type = 'success') {
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
    
    showConfirmModal(options) {
        if (typeof showConfirmModal === 'function') {
            showConfirmModal(options);
        } else {
            if (confirm(options.message)) {
                options.onConfirm && options.onConfirm();
            }
        }
    }
} 