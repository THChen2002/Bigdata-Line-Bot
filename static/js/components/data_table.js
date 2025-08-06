class DataTable {
    constructor(options = {}) {
        this.options = {
            tableId: 'dataTable',
            searchId: 'searchInput',
            filterPanelId: 'filterPanel',
            tableBodyId: 'tableBody',
            paginationId: 'pagination',
            itemsPerPage: 10,
            idField: 'id',
            fields: [],
            ...options
        };
        
        // 從 HTML data 屬性初始化動作按鈕設定
        this.initActionButtonSettings();
        
        // 自動產生搜尋和篩選欄位
        this.initFieldsFromDefinition();
        
        this.data = [];
        this.filteredData = [];
        this.currentPage = 1;
        this.sortField = null;
        this.sortDirection = 'asc';
        this.filters = {};
        this.init();
    }

    // 從 HTML data 屬性初始化動作按鈕設定
    initActionButtonSettings() {
        const $table = $(`#${this.options.tableId}`);
        this.options.showViewButton = $table.data('show-view-button') !== false;
        this.options.showEditButton = $table.data('show-edit-button') !== false;
        this.options.showDeleteButton = $table.data('show-delete-button') !== false;
    }

    // 從欄位定義初始化搜尋和篩選欄位
    initFieldsFromDefinition() {
        // 自動產生 searchFields
        this.searchFields = this.options.fields
            .filter(field => field.searchable !== false)
            .map(field => field.key);
            
        // 自動產生 filterFields
        this.filterFields = this.options.fields
            .filter(field => field.filterable && field.options)
            .map(field => ({
                key: field.key,
                label: field.label,
                type: field.filterType || 'select',
                options: field.options,
                getRowValue: field.getRowValue
            }));
    }

    // 取得欄位定義
    getFieldDefinition(key) {
        return this.options.fields.find(field => field.key === key);
    }

    // 取得所有可顯示的欄位
    getDisplayFields() {
        return this.options.fields.filter(field => field.visible !== false);
    }

    init() {
        this.setData(this.options.data);
        this.bindEvents();
        this.initFilters();
        this.render();
    }

    bindEvents() {
        // 搜尋
        $(`#${this.options.searchId}`).on('input', (e) => {
            this.handleSearch(e.target.value);
        });
        // 篩選重置
        $('#resetBtn').on('click', () => this.resetFilters());
        // 新增
        $('#addBtn').on('click', () => this.onAdd());
        // 匯出
        $('#exportBtn').off('click').on('click', function() {
            window.location.href = $(this).data('download-url');
        });
        // 排序
        $(`#${this.options.tableId}`).on('click', 'th[data-sort]', (e) => {
            const field = $(e.currentTarget).data('sort');
            this.handleSort(field);
        });
        // 分頁
        $(`#${this.options.paginationId}`).on('click', '.page-link', (e) => {
            e.preventDefault();
            const page = $(e.currentTarget).data('page');
            if (page) this.goToPage(page);
        });
        // 動作按鈕事件
        $(`#${this.options.tableBodyId}`).on('click', '.row-action-btn', (e) => {
            const action = $(e.currentTarget).data('action');
            const id = $(e.currentTarget).data('id');
            const item = this.data.find(item => String(item[this.options.idField]) === String(id));
            this.handleRowAction(action, item, e);
        });
    }

    // 處理行動作
    handleRowAction(action, item, e) {
        switch (action) {
            case 'edit':
                this.onEdit(item);
                break;
            case 'delete':
                this.onDelete(item);
                break;
            case 'view':
                this.onView(item);
                break;
            default:
                // 如果有自定義的 onRowAction，則調用它
                if (this.options.onRowAction && typeof this.options.onRowAction === 'function') {
                    this.options.onRowAction(action, item, e);
                }
        }
    }

    // 從欄位定義產生 Modal 欄位
    generateModalFields(item, mode = 'edit') {
        // mode: 'edit', 'add', or 'view'
        return this.options.fields
            .filter(field => {
                if (mode === 'add') {
                    return field.addable !== false;
                } else if (mode === 'view') {
                    // 檢視模式：顯示所有欄位，不進行篩選
                    return true;
                }
                // 預設編輯模式
                return field.editable !== false;
            })
            .map(field => {
                let value = item ? this.getModalFieldValue(item, field) : '';
                return {
                    id: field.key,
                    label: field.label,
                    type: field.type,
                    required: field.required || false,
                    readonly: field.readonly || false,
                    placeholder: field.placeholder,
                    options: field.options,
                    value: value,
                    validationMessage: field.validationMessage || ''
                };
            });
    }

    // 取得 Modal 欄位的實際值
    getModalFieldValue(item, field) {
        // 如果有自定義的 getModalValue 函數，優先使用
        if (field.getModalValue && typeof field.getModalValue === 'function') {
            return field.getModalValue(item);
        }
        
        // 如果有 getRowValue 函數，使用它來取得實際值
        if (field.getRowValue && typeof field.getRowValue === 'function') {
            return field.getRowValue(item);
        }
        
        // 否則直接從 item 中取得值
        return item && item[field.key] !== undefined ? item[field.key] : '';
    }

    // 資料設定與渲染
    setData(data) {
        this.data = data;
        this.filteredData = [...data];
        this.currentPage = 1;
        this.initFilters();
        this.render();
    }

    render() {
        // 排序
        let sortedData = [...this.filteredData];
        if (this.sortField) {
            sortedData.sort((a, b) => {
                let aVal = a[this.sortField];
                let bVal = b[this.sortField];
                if (!isNaN(aVal) && !isNaN(bVal)) {
                    aVal = Number(aVal); bVal = Number(bVal);
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
        // 動態產生表格標題
        this.renderTableHeader();
        
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

    renderTableHeader() {
        const $thead = $(`#${this.options.tableId} thead tr`);
        
        // 清空標題行
        $thead.empty();
        
        if (this.options.fields.length > 0) {
            // 使用 fields 定義產生標題
            const displayFields = this.getDisplayFields();
            displayFields.forEach(field => {
                const sortable = field.sortable !== false;
                const sortClass = sortable ? 'sortable' : '';
                const sortIcon = sortable ? '<span class="sort-icon"><i class="bi bi-sort-up"></i></span>' : '';
                
                $thead.append(`
                    <th data-sort="${field.key}" class="${sortClass}">
                        ${field.label}
                        ${sortIcon}
                    </th>
                `);
            });
            
            // 加入動作欄位
            $thead.append('<th>動作</th>');
        }
    }

    // 渲染資料列
    renderRow(item) {
        if (this.options.fields.length > 0) {
            return this.renderRowFromFields(item);
        }
        // 如果沒有定義 fields，使用原本的方式
        return `<tr><td colspan="100%" class="text-center">請重寫 renderRow 方法或使用 fields 定義</td></tr>`;
    }

    // 根據欄位定義自動渲染資料列
    renderRowFromFields(item) {
        const displayFields = this.getDisplayFields();
        let cells = displayFields.map(field => {
            const value = this.getFieldValue(item, field);
            const renderedValue = this.renderFieldValue(value, field, item);
            return `<td ${field.className ? `class="${field.className}"` : ''}>${renderedValue}</td>`;
        }).join('');
        
        // 加入動作欄位
        const actionButtons = this.renderActionButtons(item);
        cells += `<td>${actionButtons}</td>`;
        
        return `<tr>${cells}</tr>`;
    }

    // 取得欄位值
    getFieldValue(item, field) {
        if (field.getRowValue && typeof field.getRowValue === 'function') {
            return field.getRowValue(item);
        }
        return item[field.key];
    }

    // 渲染欄位值
    renderFieldValue(value, field, item) {
        // 如果有自定義渲染函數
        if (field.render && typeof field.render === 'function') {
            return field.render(value, item);
        }
        
        // 根據欄位類型渲染
        switch (field.type) {
            case 'select':
                const option = field.options ? field.options.find(opt => opt.value == value) : null;
                if (option && option.class) {
                    const badgeClass = option.class || 'bg-secondary';
                    return `<span class="badge ${badgeClass}">${option.label}</span>`;
                }
                return value || '';
            case 'image':
                return value ? 
                    `<img src="${value}" alt="${field.label}" class="img-thumbnail" style="width: 50px; height: 50px; object-fit: cover;">` : 
                    '<span class="text-muted">無圖片</span>';
            case 'boolean':
                return value ? 
                    '<span class="badge bg-success">是</span>' : 
                    '<span class="badge bg-secondary">否</span>';
            case 'date':
                return value ? new Date(value).toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' }) : '';
            case 'datetime':
                return value ? new Date(value).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }) : '';
            case 'link':
                return value ?
                    `<a href="${value}" target="_blank" class="text-primary text-decoration-none">
                    <i class="bi bi-link"></i> link</a>` :
                    '<span class="text-muted">無連結</span>';
            default:
                return value !== undefined ? value : '';
        }
    }

    // 渲染動作按鈕
    renderActionButtons(item) {
        let buttonsHtml = '';
        
        if (this.options.showViewButton) {
            buttonsHtml += `
                <button type="button" class="btn btn-outline-info row-action-btn" 
                        data-action="view" 
                        data-id="${item[this.options.idField]}" 
                        title="檢視">
                    <i class="bi bi-eye"></i> 檢視
                </button>
            `;
        }
        
        if (this.options.showEditButton) {
            buttonsHtml += `
                <button type="button" class="btn btn-outline-primary row-action-btn" 
                        data-action="edit" 
                        data-id="${item[this.options.idField]}" 
                        title="編輯">
                    <i class="bi bi-pencil"></i> 編輯
                </button>
            `;
        }
        
        if (this.options.showDeleteButton) {
            buttonsHtml += `
                <button type="button" class="btn btn-outline-danger row-action-btn" 
                        data-action="delete" 
                        data-id="${item[this.options.idField]}" 
                        title="刪除">
                    <i class="bi bi-trash"></i> 刪除
                </button>
            `;
        }
        
        return `<div class="btn-group btn-group-sm" role="group">${buttonsHtml}</div>`;
    }

    renderPagination(totalItems) {
        let totalPages = Math.ceil(totalItems / this.options.itemsPerPage);
        const $pagination = $(`#${this.options.paginationId}`);
        $pagination.empty();
        if (totalPages === 0) totalPages = 1;
        if (totalItems === 0) {
            $pagination.append(`
                <li class="page-item disabled"><span class="page-link">上一頁</span></li>
                <li class="page-item disabled"><span class="page-link">1</span></li>
                <li class="page-item disabled"><span class="page-link">下一頁</span></li>
            `);
            return;
        }
        const prevDisabled = this.currentPage === 1 ? 'disabled' : '';
        $pagination.append(`
            <li class="page-item ${prevDisabled}"><a class="page-link" href="#" data-page="${this.currentPage - 1}" tabindex="${prevDisabled ? -1 : 0}">上一頁</a></li>
        `);
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);
        for (let i = startPage; i <= endPage; i++) {
            if (i === this.currentPage) {
                $pagination.append(`<li class="page-item active" aria-current="page"><span class="page-link">${i}</span></li>`);
            } else {
                $pagination.append(`<li class="page-item"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`);
            }
        }
        const nextDisabled = this.currentPage === totalPages ? 'disabled' : '';
        $pagination.append(`
            <li class="page-item ${nextDisabled}"><a class="page-link" href="#" data-page="${this.currentPage + 1}" tabindex="${nextDisabled ? -1 : 0}">下一頁</a></li>
        `);
    }

    updatePaginationInfo(totalItems, startIndex, endIndex) {
        const $info = $('.pagination-info');
        if (totalItems === 0) {
            $info.text('目前沒有資料');
        } else {
            $('#total-count').text(totalItems);
            $('#start-index').text(startIndex + 1);
            $('#end-index').text(Math.min(endIndex, totalItems));
            $info.html('顯示 <span id="start-index">' + (startIndex + 1) +
                '</span> 到 <span id="end-index">' + Math.min(endIndex, totalItems) +
                '</span> 筆，共 <span id="total-count">' + totalItems + '</span> 筆資料');
        }
    }

    // ====== 搜尋、排序、分頁 ======
    handleSearch(query) {
        if (!query.trim()) {
            this.filteredData = [...this.data];
        } else {
            this.filteredData = this.data.filter(item =>
                this.searchFields.length > 0
                    ? this.searchFields.some(key =>
                        String(item[key] ?? '').toLowerCase().includes(query.toLowerCase())
                    )
                    : Object.values(item).some(value =>
                        String(value).toLowerCase().includes(query.toLowerCase())
                    )
            );
        }
        this.currentPage = 1;
        this.render();
    }

    handleSort(field) {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
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

    // ====== 篩選功能 ======
    initFilters() {
        // 根據 filterFields 自動渲染 filter UI
        const filterFields = this.filterFields;
        if (!filterFields || filterFields.length === 0) return;
        let html = '<div class="row g-3">';
        filterFields.forEach(field => {
            html += `<div class="col-md-2"><label class="form-label">${field.label}</label><div>`;
            if (field.type === 'checkbox') {
                html += this.renderMultiSelectDropdown(field);
            } else if (field.type === 'select') {
                html += `<select class="form-select filter-field" id="filter-${field.key}">
                    <option value="">全選</option>
                    ${field.options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                </select>`;
            }
            html += '</div></div>';
        });
        html += '</div>';
        $('#filterContent').html(html);

        // 綁定篩選選項的自動篩選事件
        this.bindFilterEvents();
    }

    // 渲染多選下拉選單
    renderMultiSelectDropdown(field) {
        const dropdownId = `filter-${field.key}-dropdown`;
        const buttonId = `filter-${field.key}-button`;
        const menuId = `filter-${field.key}-menu`;

        let html = `
            <div class="dropdown" id="${dropdownId}">
                <button class="btn btn-outline-secondary dropdown-toggle w-100 text-start d-flex justify-content-between align-items-center" type="button" 
                        id="${buttonId}" data-bs-toggle="dropdown" aria-expanded="false">
                    <span class="selected-text text-truncate">全部選取</span>
                </button>
                <ul class="dropdown-menu" style="min-width: 300px;" id="${menuId}">
        `;

        // 添加選項
        field.options.forEach(opt => {
            html += `
                <li>
                    <label class="dropdown-item">
                        <input class="form-check-input filter-field me-2" type="checkbox" 
                               id="filter-${field.key}-${opt.value}" value="${opt.value}" checked>
                        ${opt.label}
                    </label>
                </li>
            `;
        });

        html += `
                </ul>
            </div>
        `;

        return html;
    }

    // 綁定篩選選項的事件
    bindFilterEvents() {
        // 一般篩選選項的 change 事件
        $('.filter-field:not(.dropdown .filter-field)').off('change').on('change', () => {
            this.applyFilters();
        });

        // 多選下拉選單中的 checkbox 綁定事件
        $('.dropdown .filter-field').off('change').on('change', (e) => {
            const dropdown = $(e.currentTarget).closest('.dropdown');
            this.updateDropdownButtonText(dropdown);
            // 觸發篩選
            this.applyFilters();
        });

        // 防止下拉選單點擊時關閉
        $('.dropdown-menu').off('click').on('click', (e) => {
            if ($(e.target).hasClass('dropdown-item') || $(e.target).hasClass('form-check-input')) {
                e.stopPropagation();
            }
        });
    }

    // 更新下拉選單按鈕文字
    updateDropdownButtonText(dropdown) {
        const checkboxes = dropdown.find('.filter-field');
        const checkedBoxes = checkboxes.filter(':checked');
        const totalBoxes = checkboxes.length;
        const button = dropdown.find('.dropdown-toggle .selected-text');

        if (checkedBoxes.length === 0) {
            button.text('請選擇');
        } else if (checkedBoxes.length === totalBoxes) {
            button.text('全部選取');
        } else {
            button.text(`已選取 ${checkedBoxes.length} 項`);
        }
    }

    applyFilters() {
        this.filters = {};
        const filterFields = this.filterFields;
        filterFields.forEach(field => {
            if (field.type === 'checkbox') {
                // 處理 checkbox 類型的篩選
                const selected = [];
                $(`input[id^="filter-${field.key}-"]:checked`).each(function () {
                    selected.push($(this).val());
                });
                // 即使沒有選中任何選項，也要記錄這個欄位的篩選狀態
                this.filters[field.key] = selected;
            } else if (field.type === 'select') {
                // 處理 select 類型的篩選
                const selected = $(`#filter-${field.key}`).val();
                if (selected && selected !== '') {
                    this.filters[field.key] = [selected];
                }
            }
        });

        // 自動篩選
        this.filteredData = this.data.filter(item => {
            let match = true;
            filterFields.forEach(field => {
                const filterValues = this.filters[field.key];
                            
                // 如果沒有篩選條件，跳過此欄位
                if (!filterValues) {
                    return;
                }
                
                let itemValue = item[field.key];
                // 如果資料值為undefined，代表這個欄位值是巢狀結構，需要使用getRowValue來取得值，也不能直接使用getRowValue，因為會把下拉選單的value換成label
                if (itemValue === undefined && field.getRowValue && typeof field.getRowValue === 'function') {
                    itemValue = field.getRowValue(item);
                }
                
                // 因為選項的value是字串，所以將資料值轉換為字串
                const itemValueStr = String(itemValue);
                
                // 檢查項目值是否在篩選值中
                if (!filterValues.includes(itemValueStr)) {
                    match = false;
                }
            });            
            return match;
        });
        this.currentPage = 1;
        this.render();
    }

    resetFilters() {
        this.filters = {};
        this.filteredData = [...this.data];
        this.currentPage = 1;
        this.render();
        this.initFilters();
    }

    // ====== CRUD 操作 ======
    // 覆寫這些方法來實現自定義的行為
    onAdd() {}
    onEdit(item) {}
    onView(item) {
        const fields = this.generateModalFields(item, 'view');
        showViewModal({
            title: '檢視資料',
            icon: 'bi-eye',
            fields: fields,
            data: item
        });
    }
    onDelete(item) {}

    _ajaxRequest(options, onSuccessCallback) {
        const { url, method, data, onSuccess, onError } = options;
        
        $.ajax({
            url: url,
            method: method,
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: (response) => {
                if (response.success) {
                    onSuccessCallback && onSuccessCallback(response);
                    this.render();
                    onSuccess && onSuccess(response);
                } else {
                    onError && onError(response);
                }
                showToast(response.message || '操作成功');
            },
            error: (xhr, status, error) => {
                onError && onError({ message: error });
            }
        });
    }

    addItem(item, options = {}) {
        const { method = 'POST', data = item, ...restOptions } = options;
        this._ajaxRequest({ ...restOptions, method, data }, (response) => {
            // 使用後端回傳的資料
            if (response.data) {
                this.data.push(response.data);
                this.filteredData = [...this.data];
                this.render();
            } else {
                // 如果後端沒有回傳資料，則手動添加
                this.data.push(item);
                this.filteredData = [...this.data];
                this.render();
            }
        });
    }

    updateItem(id, updates, options = {}) {
        const { method = 'PUT', data = { id, ...updates }, ...restOptions } = options;
        this._ajaxRequest({ ...restOptions, method, data }, (response) => {
            // 使用後端回傳的資料
            if (response.data) {
                const index = this.data.findIndex(item => item[this.options.idField] === id);
                if (index !== -1) {
                    this.data[index] = response.data;
                    this.filteredData = [...this.data];
                    this.render();
                }
            } else {
                // 如果後端沒有回傳資料，則手動更新
                const index = this.data.findIndex(item => item[this.options.idField] === id);
                if (index !== -1) {
                    this.data[index] = { ...this.data[index], ...updates };
                    this.filteredData = [...this.data];
                    this.render();
                }
            }
        });
    }

    deleteItem(id, options = {}) {
        const { method = 'DELETE', data = { id }, ...restOptions } = options;
        this._ajaxRequest({ ...restOptions, method, data }, (response) => {
            // 使用後端回傳的資料
            if (response.data) {
                // 如果是刪除ID，則從資料中移除
                if (response.data[id] || response.data[this.options.idField]) {
                    const deleteId = response.data[id] || response.data[this.options.idField];
                    this.data = this.data.filter(item => item[this.options.idField] !== deleteId);
                    this.filteredData = [...this.data];
                    this.render();
                }
            } else {
                // 如果後端沒有回傳資料，則手動刪除
                this.data = this.data.filter(item => item[this.options.idField] !== id);
                this.filteredData = [...this.data];
                this.render();
            }
        });
    }
}