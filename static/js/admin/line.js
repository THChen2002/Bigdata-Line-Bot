$(document).ready(function() {
    setActiveNav('nav-line');
    
    // 為各操作按鈕加確認功能
    addConfirmTo('#update-users-btn', {
        title: '更新使用者資訊',
        message: '確定要更新所有 LINE 使用者資訊嗎？此操作可能需要一些時間。',
        confirmText: '開始更新',
        confirmClass: 'btn-primary',
        onConfirm: () => callLineOperation('update_users')
    });
    addConfirmTo('#delete-all-richmenu-btn', {
        title: '刪除所有圖文選單',
        message: '警告：此操作將刪除所有 LINE 圖文選單，包括所有使用者的選單設定。此操作無法復原，確定要繼續嗎？',
        confirmText: '刪除所有選單',
        confirmClass: 'btn-danger',
        onConfirm: () => callLineOperation('delete_all_richmenu')
    });
    addConfirmTo('#update-richmenu-btn', {
        title: '更新圖文選單',
        message: '確定要更新 LINE 圖文選單嗎？此操作會影響所有使用者的選單顯示。',
        confirmText: '更新選單',
        confirmClass: 'btn-success',
        onConfirm: () => callLineOperation('update_richmenu')
    });
    addConfirmTo('#update-yt-richmenu-btn', {
        title: '更新 YT 會員選單',
        message: '確定要更新所有 YouTube 會員的圖文選單嗎？此操作會影響所有 YT 會員。',
        confirmText: '更新選單',
        confirmClass: 'btn-warning',
        onConfirm: () => callLineOperation('update_yt_richmenu')
    });
});

// 統一的 LINE 操作 API 調用
function callLineOperation(operationType) {
    const $button = $(`[data-operation="${operationType}"]`).length ? 
                   $(`[data-operation="${operationType}"]`) : 
                   $(`#${operationType.replace(/_/g, '-')}-btn`);
    const originalText = $button.html();
    $button.html(`
        <div class="d-flex align-items-center justify-content-center">
            <div class="spinner-border spinner-border-sm me-2" role="status">
                <span class="visually-hidden">載入中...</span>
            </div>
            <span>處理中...</span>
        </div>
    `);
    $button.prop('disabled', true);
    $.ajax({
        url: '/admin/line/operation',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ type: operationType }),
        success: response => {
            if (response.success) {
                showToast(response.message);
            } else {
                showToast(response.message, 'error');
            }
        },
        error: (xhr, status, error) => {
            showToast('網路錯誤，請稍後再試', 'error');
            console.error('API 請求失敗:', error);
        },
        complete: () => {
            $button.prop('disabled', false);
            $button.html(originalText);
        }
    });
}