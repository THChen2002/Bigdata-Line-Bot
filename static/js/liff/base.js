let userId;

// 初始化LIFF
function initializeLiff(liffId) {
    liff.init({ liffId: liffId }).then(() => {
        if (!liff.isLoggedIn()) {
            liff.login({
                redirectUri: window.location.href
            });
        } else {
            $('#liffLoading').addClass('d-none');
            $('#mainContent').removeClass('d-none');
            liff.getProfile().then(profile => {
                userId = profile.userId;
            }).catch(err => {
                console.error('取得使用者資訊失敗', err);
            });
        }
    }).catch(err => {
        console.error('LIFF 初始化失敗', err);
    });
}

$(document).ready(function () {
    initializeLiff(liffId);
});