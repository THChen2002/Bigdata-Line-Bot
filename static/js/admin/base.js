// 常數區
const TOAST_DURATION = 3000;
const TOAST_REMOVE_DELAY = 500;
const TOAST_ICON_MAP = {
    success: 'bi-check-circle-fill text-success',
    error: 'bi-x-circle-fill text-danger',
    warning: 'bi-exclamation-triangle-fill text-warning',
    info: 'bi-info-circle-fill text-info'
};

// 初始化LIFF
function initializeLiff(liffId) {
    liff.init({ liffId }).then(() => {
        if (!liff.isLoggedIn()) {
            liff.login({ redirectUri: window.location.href });
        } else {
            // 獲取使用者資訊
            liff.getProfile().then(profile => {
                // 發送請求到後端驗證 admin 身份
                $.ajax({
                    url: '/admin/auth',
                    method: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({ userId: profile.userId }),
                    success: function(res) {
                        // 驗證通過，顯示主要內容，隱藏載入畫面
                        $('#liffLoading').addClass('d-none');
                        $('#mainContent').removeClass('d-none');
                    },
                    error: function(xhr) {
                        // 驗證失敗，導向 forbidden 頁面
                        window.location.href = "/forbidden";
                        liff.closeWindow();
                    }
                });
            }).catch(err => {
                console.error('取得使用者資訊失敗', err);
            });
        }
    }).catch(err => {
        console.error('LIFF 初始化失敗', err);
    });
}

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

// 設定 active nav 項目
function setActiveNav(navId) {
    $('.nav-link').removeClass('active');
    $(`#${navId}`).addClass('active');
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

/**
 * 綁定 input 的 autocomplete 下拉提示（支援鍵盤導航）
 * @param {string|jQuery} $input - input selector 或 jQuery 物件
 * @param {Array<string>} dataList - 可選項目陣列
 * @param {string} dropdownId - autocomplete 容器 id（如 #collection-autocomplete）
 */
function bindAutocomplete($input, dataList, dropdownId) {
    $input = $($input);
    let selectedIndex = -1;
    let currentMatches = [];
    let isSelecting = false; // 標誌，防止選擇時重新顯示選單

    function updateDropdown() {
        if (isSelecting) return; // 如果正在選擇，不更新選單
        
        const val = $input.val().toLowerCase();
        currentMatches = dataList.filter(c => c.toLowerCase().includes(val));
        let html = '';
        if (val && currentMatches.length) {
            html = '<div class="list-group position-absolute w-100" style="z-index:1000;">' +
                currentMatches.map((c, index) => 
                    `<button type="button" class="list-group-item list-group-item-action ${index === selectedIndex ? 'active' : ''}" data-index="${index}">${c}</button>`
                ).join('') +
                '</div>';
            $(dropdownId).html(html).show();
        } else {
            $(dropdownId).hide();
        }
    }

    function selectItem(index) {
        if (index >= 0 && index < currentMatches.length) {
            isSelecting = true; // 設置標誌
            $input.val(currentMatches[index]);
            $(dropdownId).hide();
            selectedIndex = -1;
            // 觸發 input 事件以觸發其他相關邏輯
            $input.trigger('input');
            // 延遲重置標誌
            setTimeout(() => {
                isSelecting = false;
            }, 200);
        }
    }

    function highlightItem(index) {
        selectedIndex = index;
        $(dropdownId).find('.list-group-item').removeClass('active');
        $(dropdownId).find(`[data-index="${index}"]`).addClass('active');
    }

    $input.on('input focus', function() {
        selectedIndex = -1;
        updateDropdown();
    });

    $input.on('keydown', function(e) {
        const $dropdown = $(dropdownId);
        if (!$dropdown.is(':visible') || currentMatches.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, currentMatches.length - 1);
                highlightItem(selectedIndex);
                break;
            case 'ArrowUp':
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                if (selectedIndex === -1) {
                    $(dropdownId).find('.list-group-item').removeClass('active');
                } else {
                    highlightItem(selectedIndex);
                }
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0) {
                    selectItem(selectedIndex);
                } else if (currentMatches.length === 1) {
                    // 如果只有一個匹配項，直接選擇
                    selectItem(0);
                } else {
                    // 如果沒有選中任何項目，隱藏選單
                    $dropdown.hide();
                    selectedIndex = -1;
                }
                // 確保選單隱藏
                $(dropdownId).hide();
                break;
            case 'Escape':
                e.preventDefault();
                $dropdown.hide();
                selectedIndex = -1;
                break;
        }
    });

    $(dropdownId).on('click', '.list-group-item', function() {
        const index = parseInt($(this).data('index'));
        selectItem(index);
    });

    $(document).on('click', function(e) {
        if (!$(e.target).closest($input).length && !$(e.target).closest(dropdownId).length) {
            $(dropdownId).hide();
            selectedIndex = -1;
        }
    });
}

$(document).ready(() => {
    initializeLiff(liffId);
});