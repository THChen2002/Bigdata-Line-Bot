// Modal 相關常數
const TOAST_DURATION = 3000;
const TOAST_REMOVE_DELAY = 500;
const TOAST_ICON_MAP = {
    success: 'bi-check-circle-fill text-success',
    error: 'bi-x-circle-fill text-danger',
    warning: 'bi-exclamation-triangle-fill text-warning',
    info: 'bi-info-circle-fill text-info'
};

// 顯示提示訊息（Toast）
function showToast(message, type = 'success') {
    const icon = TOAST_ICON_MAP[type] || TOAST_ICON_MAP.success;
    const toast = `
    <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 11">
      <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-header">
          <i class="bi ${icon} me-2"></i>
          <strong class="me-auto">通知</strong>
          <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">${message}</div>
      </div>
    </div>`;
    // 只保留一個 toast
    $('.position-fixed.bottom-0.end-0.p-3').remove();
    $(toast).appendTo('body');
    setTimeout(() => {
        $('.toast').toast('hide');
        setTimeout(() => {
            $('.position-fixed.bottom-0.end-0.p-3').remove();
        }, TOAST_REMOVE_DELAY);
    }, TOAST_DURATION);
}

// 通用確認 Modal
function showConfirmModal({
    title = '確認操作',
    message = '您確定要執行此操作嗎？',
    confirmText = '確認',
    cancelText = '取消',
    confirmClass = 'btn-primary',
    onConfirm = null,
    onCancel = null
} = {}) {
    $('#confirmModalLabel').html(`<i class="bi bi-question-circle text-primary me-2"></i>${title}`);
    $('#confirmModalBody').html(`<p class="mb-0">${message}</p>`);
    const $confirmBtn = $('#confirmModalConfirm');
    $confirmBtn.html(`<i class="bi bi-check-circle me-1"></i>${confirmText}`);
    $confirmBtn.removeClass().addClass(`btn ${confirmClass}`);
    $confirmBtn.off('click').on('click', () => {
        $('#confirmModal').modal('hide');
        if (typeof onConfirm === 'function') onConfirm();
    });
    $('#confirmModal').off('hidden.bs.modal').on('hidden.bs.modal', () => {
        if (typeof onCancel === 'function') onCancel();
    });
    $('#confirmModal').modal('show');
}

// 通用：為按鈕或選擇器加確認功能
function addConfirmTo(target, options = {}) {
    $(target).on('click', function(e) {
        e.preventDefault();
        showConfirmModal(options);
    });
}

// 通用檢視 Modal 功能
function showViewModal({
    title = '檢視資料',
    icon = 'bi-eye',
    fields = [],
    data = {},
    onClose = null
} = {}) {
    $('#viewModalLabel').html(`<i class="bi ${icon} me-2"></i>${title}`);
    const $viewFields = $('#viewInfoFields').empty();
    
    fields.forEach(field => {
        const {
            id, label, type = 'text', value, render = null
        } = field;
        
        let displayValue = '';
        
        // 根據欄位類型渲染顯示值
        const fieldValue = value !== undefined ? value : (data[id] !== undefined ? data[id] : '');
        switch (type) {
            case 'select':
                // 如果是 select 類型，嘗試找到對應的選項標籤
                const fieldDef = fields.find(f => f.id === id);
                if (fieldDef && fieldDef.options) {
                    const option = fieldDef.options.find(opt => opt.value == fieldValue);
                    if (option && option.class) {
                        const badgeClass = option.class || 'bg-secondary';
                        displayValue = `<span class="badge ${badgeClass}">${option.label}</span>`;
                    } else {
                        displayValue = fieldValue;
                    }
                } else {
                    displayValue = fieldValue;
                }
                break;
            case 'boolean':
                displayValue = fieldValue ? 
                    '<span class="badge bg-success">是</span>' : 
                    '<span class="badge bg-secondary">否</span>';
                break;
            case 'date':
                displayValue = fieldValue ? new Date(fieldValue).toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' }) : '';
                break;
            case 'datetime':
                displayValue = fieldValue ? new Date(fieldValue).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }) : '';
                break;
            case 'image':
                displayValue = fieldValue ? 
                    `<img src="${fieldValue}" alt="${label}" class="img-thumbnail" style="max-width: 200px; max-height: 200px; object-fit: cover;">` : 
                    '<span class="text-muted">無圖片</span>';
                break;
            case 'link':
                displayValue = fieldValue ? 
                    `<a href="${fieldValue}" target="_blank" class="text-decoration-none">
                        <i class="bi bi-link-45deg me-1"></i>${fieldValue}
                    </a>` : 
                    '<span class="text-muted">無連結</span>';
                break;
            case 'textarea':
                displayValue = fieldValue ? fieldValue.replace(/\n/g, '<br>') : '';
                break;
            default:
                displayValue = fieldValue;
        }
        
        // 根據欄位類型決定顯示方式
        if (type === 'image') {
            // 圖片類型，佔用整行
            $viewFields.append(`
                <div class="col-12">
                    <strong class="text-primary">${label}：</strong>
                    <div class="mt-2">${displayValue}</div>
                </div>
            `);
        } else if (type === 'textarea') {
            // 文字區域類型，佔用整行
            $viewFields.append(`
                <div class="col-12">
                    <strong class="text-primary">${label}：</strong>
                    <div class="mt-2 p-3 bg-light rounded border">${displayValue}</div>
                </div>
            `);
        } else {
            // 一般欄位，使用響應式佈局
            $viewFields.append(`
                <div class="col-md-6">
                    <strong class="text-primary">${label}：</strong>
                    <span class="ms-2">${displayValue}</span>
                </div>
            `);
        }
    });
    
    $('#viewModal').off('hidden.bs.modal').on('hidden.bs.modal', () => {
        if (typeof onClose === 'function') onClose();
    });
    $('#viewModal').modal('show');
}

// 通用編輯 Modal 功能
function showEditModal({
    title = '編輯資料',
    icon = 'bi-pencil-square',
    fields = [],
    data = {},
    onSave = null,
    onCancel = null
} = {}) {
    $('#editModalLabel').html(`<i class="bi ${icon} me-2"></i>${title}`);
    const $formFields = $('#editFormFields').empty();
    
    fields.forEach(field => {
        const {
            id, label, type = 'text', required = false, readonly = false, options = [], placeholder = '', value, validationMessage = ''
        } = field;
        
        let fieldHtml = '';
        const requiredAttr = required ? 'required' : '';
        const readonlyAttr = readonly ? 'readonly' : '';
        const placeholderAttr = placeholder ? `placeholder="${placeholder}"` : '';
        const validationMessageHtml = required ? `<div class="invalid-feedback">${validationMessage || `${label}欄位必填`}</div>` : '';
        
        if (type === 'select') {
            fieldHtml = `
                <div class="mb-3">
                    <label for="${id}" class="form-label">${label}</label>
                    <select class="form-select" id="${id}" ${requiredAttr} ${readonlyAttr}>
                        ${options.map(option => 
                            `<option value="${option.value}" ${option.value == (data[id] ?? value ?? '') ? 'selected' : ''}>${option.label}</option>`
                        ).join('')}
                    </select>
                    ${validationMessageHtml}
                </div>
            `;
        } else if (type === 'textarea') {
            fieldHtml = `
                <div class="mb-3">
                    <label for="${id}" class="form-label">${label}</label>
                    <textarea class="form-control" id="${id}" rows="6" ${requiredAttr} ${readonlyAttr}>${data[id] ?? value ?? ''}</textarea>
                    ${validationMessageHtml}
                </div>
            `;
        } else if (type === 'checkbox' || type === 'boolean') {
            fieldHtml = `
                <div class="mb-3 form-check">
                    <input type="checkbox" class="form-check-input" id="${id}" ${(data[id] ?? value) ? 'checked' : ''} ${readonlyAttr}>
                    <label class="form-check-label" for="${id}">${label}</label>
                </div>
            `;
        } else if (type === 'datetime') {
            // 將時間轉為 +8 時區
            let dtValue = data[id] ?? value;
            let localValue = '';
            if (dtValue) {
                let dateObj = new Date(dtValue);
                // 取得 UTC 毫秒數，加上 8 小時
                dateObj = new Date(dateObj.getTime() + 8 * 60 * 60 * 1000);
                // 轉為 yyyy-MM-ddTHH:mm 格式
                localValue = dateObj.toISOString().slice(0, 16);
            }
            fieldHtml = `
                <div class="mb-3">
                    <label for="${id}" class="form-label">${label}</label>
                    <input type="datetime-local" class="form-control" id="${id}" value="${localValue}" ${requiredAttr} ${readonlyAttr}>
                    ${validationMessageHtml}
                </div>
            `;
        } else if (type === 'image') {
            fieldHtml = `
                <div class="mb-3">
                    <label for="${id}" class="form-label">${label}</label>
                    <input type="text" class="form-control" id="${id}" value="${data[id] ?? value ?? ''}" ${requiredAttr} ${readonlyAttr}>
                    ${validationMessageHtml}
                </div>
            `;
        } else {
            fieldHtml = `
                <div class="mb-3">
                    <label for="${id}" class="form-label">${label}</label>
                    <input type="${type}" class="form-control" id="${id}" 
                           value="${data[id] ?? value ?? ''}" 
                           ${requiredAttr} 
                           ${readonlyAttr}
                           ${placeholderAttr}>
                    ${validationMessageHtml}
                </div>
            `;
        }
        $formFields.append(fieldHtml);
    });
    
    // 為表單添加驗證事件
    $('#editForm').off('submit').on('submit', function(e) {
        e.preventDefault();
        
        // 驗證表單
        if (!this.checkValidity()) {
            e.stopPropagation();
            $(this).addClass('was-validated');
            return false;
        }
        
        // 表單驗證通過，收集資料
        const formData = {};
        fields.forEach(field => {
            if (field.type === 'checkbox' || field.type === 'boolean') {
                formData[field.id] = $(`#${field.id}`).is(':checked');
            } else if (field.type === 'textarea') {
                formData[field.id] = $(`#${field.id}`).val();
            } else {
                formData[field.id] = $(`#${field.id}`).val();
            }
        });
        
        if (typeof onSave === 'function') onSave(formData);
        $('#editModal').modal('hide');
    });
    
    $('#saveEditBtn').off('click').on('click', function(e) {
        e.preventDefault();
        // 觸發表單提交事件
        $('#editForm').submit();
    });
    
    $('#editModal').off('hidden.bs.modal').on('hidden.bs.modal', () => {
        // 清除驗證狀態
        $('#editForm').removeClass('was-validated');
        if (typeof onCancel === 'function') onCancel();
    });
    
    $('#editModal').modal('show');
} 