$(document).ready(function () {
    const today = new Date().toISOString().split('T')[0];
    // 設定借用日期最小值為今天
    $('#startDate').attr('min', today);

    // 檢查借用日期是否晚於今天
    $('#startDate').change(function () {
        const borrowDate = $(this).val();
        // 清空不合法的借用日期
        if (today > borrowDate) {
            alert('借用日期不可早於今天');
            $(this).val('');
        } else {
            $('#endDate').attr('min', borrowDate);
        }
    });

    // 檢查歸還日期是否早於借用日期
    $('#endDate').change(function () {
        const borrowDate = $('#startDate').val();
        const returnDate = $(this).val();
        if (returnDate < borrowDate) {
            alert('歸還日期不能早於借用日期');
            $(this).val('');
        }
    });

    // 根據設備選擇動態更新「數量」選項
    $('#equipmentName').change(function () {
        const selectedEquipment = $(this).find('option:selected');
        const availableAmount = parseInt(selectedEquipment.data('available'));

        const amountSelect = $('#equipmentAmount');
        amountSelect.empty();
        amountSelect.append('<option selected disabled value="">請選擇要租借的數量</option>');

        for (let i = 1; i <= availableAmount; i++) {
            amountSelect.append(`<option value="${i}">${i}</option>`);
        }
    });

    // 驗證 email 和手機號碼格式
    function validateEmail(email) {
        const regex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/;
        return regex.test(email);
    }

    function validatePhone(phone) {
        const regex = /^09\d{8}$/;
        return regex.test(phone);
    }

    // 提交表單
    $('#rentalForm').submit(function (e) {
        e.preventDefault();

        const email = $('#email').val();
        const phone = $('#phone').val();

        if (!validateEmail(email)) {
            alert('請輸入有效的Email');
            return;
        }

        if (!validatePhone(phone)) {
            alert('請輸入有效的手機號碼');
            return;
        }

        // 驗證表單
        if (!this.checkValidity()) {
            e.stopPropagation();
            $(this).addClass('was-validated');
            return;
        }
        $('#submitBtn').addClass('d-none');
        $('#loadBtn').removeClass('d-none');

        // 收集表單資料
        const data = {
            userId: user_id,
            borrowerName: $('#borrowerName').val(),
            department: $('#department').val(),
            phone: $('#phone').val(),
            email: $('#email').val(),
            equipmentName: $('#equipmentName').val(),
            equipmentId: $('#equipmentName option:selected').data('id'),
            equipmentAmount: $('#equipmentAmount').val(),
            startDate: $('#startDate').val(),
            endDate: $('#endDate').val(),
            selectedTime: $('#selectedTime').val(),
            returnTime: $('#returnTime').val()
        };

        $.ajax({
            url: location.origin + "/liff/rent",
            type: 'POST',
            data: data,
            success: function (response) {
                liff.sendMessages([{
                    type: 'text',
                    text: response.message
                }])
                    .then(() => {
                        liff.closeWindow();
                    });
            },
            error: function (error) {
                console.log('error', error);
            }
        });
    });
});