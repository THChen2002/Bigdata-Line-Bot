let userId;

// 初始化LIFF
function initializeLiff(liffId) {
    liff.init({ liffId }).then(() => {
        if (!liff.isLoggedIn()) {
            liff.login({ redirectUri: window.location.href });
        } else {
            liff.getProfile().then(profile => {
                const userId = profile.userId;
                if (adminUsers.includes(userId)) {
                    $('#liffLoading').addClass('d-none');
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

$(document).ready(function () {
    initializeLiff(liff_id);
});