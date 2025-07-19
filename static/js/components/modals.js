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
            id, label, type = 'text', required = false, readonly = false, options = [], placeholder = '', value
        } = field;
        let fieldHtml = '';
        if (type === 'select') {
            fieldHtml = `
                <div class="mb-3">
                    <label for="${id}" class="form-label">${label}</label>
                    <select class="form-select" id="${id}" ${required ? 'required' : ''} ${readonly ? 'disabled' : ''}>
                        ${options.map(option => 
                            `<option value="${option.value}" ${option.value == (data[id] ?? value ?? '') ? 'selected' : ''}>${option.label}</option>`
                        ).join('')}
                    </select>
                </div>
            `;
        } else if (type === 'textarea') {
            fieldHtml = `
                <div class="mb-3">
                    <label for="${id}" class="form-label">${label}</label>
                    <textarea class="form-control" id="${id}" rows="6" ${required ? 'required' : ''} ${readonly ? 'readonly' : ''}>${data[id] ?? value ?? ''}</textarea>
                </div>
            `;
        } else if (type === 'checkbox') {
            fieldHtml = `
                <div class="mb-3 form-check">
                    <input type="checkbox" class="form-check-input" id="${id}" ${(data[id] ?? value) ? 'checked' : ''} ${readonly ? 'disabled' : ''}>
                    <label class="form-check-label" for="${id}">${label}</label>
                </div>
            `;
        } else {
            fieldHtml = `
                <div class="mb-3">
                    <label for="${id}" class="form-label">${label}</label>
                    <input type="${type}" class="form-control" id="${id}" 
                           value="${data[id] ?? value ?? ''}" 
                           ${required ? 'required' : ''} 
                           ${readonly ? 'readonly' : ''}
                           ${placeholder ? `placeholder="${placeholder}"` : ''}>
                </div>
            `;
        }
        $formFields.append(fieldHtml);
    });
    $('#saveEditBtn').off('click').on('click', () => {
        const formData = {};
        fields.forEach(field => {
            if (field.type === 'checkbox') {
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
    $('#editModal').off('hidden.bs.modal').on('hidden.bs.modal', () => {
        if (typeof onCancel === 'function') onCancel();
    });
    $('#editModal').modal('show');
} 