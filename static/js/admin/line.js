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
    // 設定 Webhook 按鈕事件
    $('#set-webhook-btn').on('click', function() {
        // 取得現有 Webhook URL 並用通用編輯 Modal 顯示
        $.get('/admin/line/webhook', function(data) {
            showEditModal({
                title: '設定 LINE Webhook URL',
                icon: 'bi-link-45deg',
                fields: [
                    {
                        id: 'webhook_url',
                        label: 'Webhook URL',
                        type: 'url',
                        required: true,
                        placeholder: 'https://xxxxx.ngrok-free.app/callback'
                    }
                ],
                data: { webhook_url: data && data.url ? data.url : '' },
                onSave: function(formData) {
                    const url = formData.webhook_url;
                    if (!url) {
                        showToast('請輸入 Webhook URL', 'error');
                        return;
                    }
                    $.ajax({
                        url: '/admin/line/webhook',
                        method: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify({ url }),
                        success: function(response) {
                            if (response.success) {
                                showToast('Webhook URL 已儲存');
                                $('#editModal').modal('hide');
                            } else {
                                showToast(response.message || '儲存失敗', 'error');
                            }
                        },
                        error: function() {
                            showToast('網路錯誤，請稍後再試', 'error');
                        }
                    });
                }
            });
        });
    });
    
    // 驗證 Webhook 按鈕事件
    $('#test-webhook-btn').on('click', function() {
        function showWebhookResultModal({success, msg, statusCode, reason, detail, timestamp}) {
            let html = `<div class="alert alert-${success ? 'success' : 'danger'} mb-2">${msg}</div>`;
            if (typeof statusCode !== 'undefined') html += `<div><b>狀態碼：</b>${statusCode}</div>`;
            if (reason) html += `<div><b>原因：</b>${reason}</div>`;
            $('#alertModalLabel').html('<i class="bi bi-patch-check me-2"></i>Webhook 驗證結果');
            $('#alertModalBody').html(html);
            $('#alertModal').modal('show');
        }
        $.ajax({
            url: '/admin/line/webhook?action=test',
            method: 'GET',
            success: function(response) {
                console.log('Webhook 測試結果:', response);
                showWebhookResultModal({
                    success: response.success,
                    msg: response.success ? 'Webhook 驗證成功' : 'Webhook 驗證失敗',
                    statusCode: response.statusCode,
                    reason: response.reason
                });
            },
            error: function(xhr) {
                let r = xhr.responseJSON || {};
                showWebhookResultModal({
                    success: false,
                    msg: r.message || 'Webhook 驗證失敗',
                    statusCode: r.statusCode,
                    reason: r.reason,
                    detail: r.detail,
                    timestamp: r.timestamp
                });
            }
        });
    });

    // 更新 LIFF 網址按鈕事件
    $('#update-liff-urls-btn').on('click', function() {
        // 直接執行更新 LIFF 網址操作
        callLineOperation('update_liff_urls');
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