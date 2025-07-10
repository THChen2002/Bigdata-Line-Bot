const colleges = {
    "教育學院": ["課傳與教學傳播科技所", "教育經營與管理所", "教育系", "幼兒與家庭教育所", "特教系", "心理諮商系", "社會與區域發展學系"],
    "理學院": ["數學暨資訊教育學系", "資訊科學系", "體育學系", "自然科學教育學系", "數位科技設計學系"],
    "人文藝術學院": ["語文創作系", "兒童英語創作系", "藝術與造型設計學系", "台灣文化研究所", "音樂系", "文化創意產業經營系"],
    "國際學位學程": ["當代藝術評論與策展研究全英語碩士學程", "學習與教學國際碩士學位學程", "東南亞區域管理碩士學位學程"]
}

$(document).ready(function () {
    // 設置表單初始化
    initDropDowns();

    // Identity 下拉選單變化時動態顯示相關欄位
    $('#identity').change(function () {
        updateFieldsBasedOnIdentity($(this).val());
        // 僅在身份選擇後清空不相關欄位資料（避免新使用者identity在試算表中還是Null的時候，系統會不斷執行清除資料）
        if (identity) {
            // 清空不相關身份的欄位資料（為避免使用者切換身份後，不相關欄位資料仍保留）
            clearIrrelevantFields(identity);
        }
    });

    // 選擇學院時更新系所下拉選單
    $('#college').change(function () {
        if ($('#college').val() === '') {
            $('#department').empty();
            $('#department').append('<option value="" selected disabled>請選擇系所</option>');
            return;
        }
        updateDepartmentDropdown();
    });

    // 送出表單
    $('form').submit(function (e) {
        e.preventDefault();
        // 驗證表單
        if (!this.checkValidity()) {
            e.stopPropagation();
            $(this).addClass('was-validated');
            return;
        }
        $('#submitBtn').hide();
        $('#loadBtn').show();
        // 收集表單資料
        data = {
            userId: userId,
            identity: $('#identity').val(),
            name: $('#name').val(),
            gender: $('#gender').val(),
            studentId: $('#studentId').val(),
            email: $('#email').val(),
            phone: $('#phone').val(),
            college: $('#college').val(),
            department: $('#department').val(),
            grade: $('#grade').val(),
            schoolName: $('#schoolName').val(),
            extDepartment: $('#extDepartment').val(),
            extGrade: $('#extGrade').val(),
            organization: $('#organization').val(),
            channel: $('#ytChannel').val(),
        }
        $.ajax({
            url: location.origin + "/liff/userinfo",
            type: 'POST',
            data: data,
            success: function (response) {
                if (response.success) {
                    liff.sendMessages([{
                        type: 'text',
                        text: response.message
                    }])
                    .then(() => {
                        liff.closeWindow();
                    });
                } else {
                    alert(response.message);
                    $('#submitBtn').show();
                    $('#loadBtn').hide();
                }
            },
            error: function (error) {
                console.log('error', error);
            }
        });
    });

    // 設置表單初始值
    // 切記這裡後面的user_info.欄位要跟試算表的欄位名稱一樣！若調整試算表欄位名稱也要同步調整這裡！
    function initDropDowns() {
        let identity = '{{ user_info.identity }}';
        $('#identity').val(identity);
        $('#gender').val('{{ user_info.gender }}');
        $('#college').val('{{ user_info.college }}');
        $('#grade').val('{{ user_info.grade }}');
        $('#schoolName').val('{{ user_info.schoolName }}');
        $('#organization').val('{{ user_info.organization }}');
        $('#studentId').val('{{ user_info.studentId }}');
        $('#extDepartment').val('{{ user_info.extDepartment }}');
        $('#extGrade').val('{{ user_info.extGrade }}');
        $('#ytChannel').val('{{ user_yt.channel }}');

        // 設定顯示的yt會員等級
        const levelMapping = {
            0: '無',
            1: '請老師喝杯水',
            2: '請老師吃便當',
            3: '請老師吃大餐'
        };
        let levelValue = parseInt('{{ user_yt.level }}') || 0;
        let levelName = levelMapping[levelValue];
        $('#ytLevel').empty();
        $('#ytLevel').append(`<option value="${levelValue}" selected>${levelName}</option>`);

        // 如果有學院預設值，觸發更新系所
        // 系統偵測到使用者選擇學院後，會自動更新系所選項。但若是已經有預設值，則不會觸發更新系所，因此需要手動觸發
        let college = $('#college').val();
        if (college) {
            updateDepartmentDropdown();  // 自動更新系所選項
            $('#department').val('{{ user_info.department }}');  // 設置預設的系所
        }

        // 根據身份更新欄位顯示
        updateFieldsBasedOnIdentity(identity);
    }

    // 根據身份顯示或隱藏相關欄位
    function updateFieldsBasedOnIdentity(identity) {
        $('#ntueStudentFields, #externalStudentFields, #socialIndividualFields').hide();
        $('#ntueStudentFields input, #ntueStudentFields select').prop('required', false);
        $('#externalStudentFields input').prop('required', false);
        $('#socialIndividualFields input').prop('required', false);

        if (identity === '國北教大學生') {
            $('#ntueStudentFields').show();
            $('#ntueStudentFields input, #ntueStudentFields select').prop('required', true);
        } else if (identity === '校外學生') {
            $('#externalStudentFields').show();
            $('#externalStudentFields input').prop('required', true);
        } else if (identity === '社會人士' || identity === '國北教大教職員') {
            $('#socialIndividualFields').show();
            $('#socialIndividualFields input').prop('required', true);
        }
    }

    // 清空不相關身份的欄位資料（為避免使用者切換身份後，不相關欄位資料仍保留，例如：從校外學生切換到國北教大學生，校外學生的學校名稱、系所、年級欄位資料仍保留）
    function clearIrrelevantFields(identity) {
        if (identity !== '國北教大學生') {
            $('#studentId').val('');
            $('#college').val('');
            $('#department').val('');
            $('#grade').val('');
        }
        if (identity !== '校外學生') {
            $('#schoolName').val('');
            $('#extDepartment').val('');
            $('#extGrade').val('');
        }
        if (identity !== '社會人士' && identity !== '國北教大教職員') {
            $('#organization').val('');
        }
    }
    // 更新系所下拉選單
    function updateDepartmentDropdown() {
        let college = $('#college').val();
        if (college) {
            let department = colleges[college];  // 根據學院選擇載入對應的系所
            $('#department').empty();
            $('#department').append('<option value="" selected disabled>請選擇系所</option>');
            if (department) {  // 確保 department 不為空
                department.forEach(function (dept) {
                    $('#department').append('<option value="' + dept + '">' + dept + '</option>');
                });
            }
        }
    }
});