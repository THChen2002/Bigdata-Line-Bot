// 學院與系所對應資料
const colleges = {
    "教育學院": ["課傳與教學傳播科技所", "教育經營與管理所", "教育系", "幼兒與家庭教育所", "特教系", "心理諮商系", "社會與區域發展學系"],
    "理學院": ["數學暨資訊教育學系", "資訊科學系", "體育學系", "自然科學教育學系", "數位科技設計學系"],
    "人文藝術學院": ["語文創作系", "兒童英語創作系", "藝術與造型設計學系", "台灣文化研究所", "音樂系", "文化創意產業經營系"],
    "國際學位學程": ["當代藝術評論與策展研究全英語碩士學程", "學習與教學國際碩士學位學程", "東南亞區域管理碩士學位學程"]
};

// YouTube 會員等級對應
const levelMapping = {
    0: '無',
    1: '請老師喝杯水',
    2: '請老師吃便當',
    3: '請老師吃大餐'
};

// 設定 select 預設值
function setSelectDefaultValue(selectId, defaultValue) {
    if (defaultValue && defaultValue !== '') {
        $(selectId).val(defaultValue);
    }
}

// 動態生成 select 選項並設定預設值
function populateSelectWithOptions(selectId, options, defaultValue) {
    const $select = $(selectId);
    $select.empty();
    $select.append('<option value="" selected disabled>請選擇</option>');
    
    if (options && Array.isArray(options)) {
        options.forEach(option => {
            $select.append(`<option value="${option}">${option}</option>`);
        });
    }
    
    if (defaultValue && defaultValue !== '') {
        $select.val(defaultValue);
    }
}

// 根據身份更新欄位顯示
function updateFieldsBasedOnIdentity(identity) {
    // 隱藏所有身份相關欄位
    $('#ntueStudentFields, #externalStudentFields, #socialIndividualFields').addClass('d-none');
    $('#ntueStudentFields input, #ntueStudentFields select').prop('required', false);
    $('#externalStudentFields input').prop('required', false);
    $('#socialIndividualFields input').prop('required', false);

    // 根據身份顯示對應欄位
    if (identity === '國北教大學生') {
        $('#ntueStudentFields').removeClass('d-none');
        $('#ntueStudentFields input, #ntueStudentFields select').prop('required', true);
    } else if (identity === '校外學生') {
        $('#externalStudentFields').removeClass('d-none');
        $('#externalStudentFields input').prop('required', true);
    } else if (identity === '社會人士' || identity === '國北教大教職員') {
        $('#socialIndividualFields').removeClass('d-none');
        $('#socialIndividualFields input').prop('required', true);
    }
}

// 清空不相關身份的欄位資料
function clearIrrelevantFields(identity) {
    if (identity !== '國北教大學生') {
        $('#studentId, #college, #department, #grade').val('');
    }
    if (identity !== '校外學生') {
        $('#schoolName, #extDepartment, #extGrade').val('');
    }
    if (identity !== '社會人士' && identity !== '國北教大教職員') {
        $('#organization').val('');
    }
}

// 更新系所下拉選單
function updateDepartmentDropdown() {
    const college = $('#college').val();
    if (college) {
        const departments = colleges[college];
        populateSelectWithOptions('#department', departments, user_info.department);
    }
}

// 設定 YouTube 會員等級顯示
function setYoutubeLevel() {
    const levelValue = parseInt(user_yt.level) || 0;
    const levelName = levelMapping[levelValue];
    $('#ytLevel').empty();
    $('#ytLevel').append(`<option value="${levelValue}" selected>${levelName}</option>`);
}

// 初始化表單下拉選單
function initDropDowns() {
    // 設定 select 預設值
    setSelectDefaultValue('#identity', user_info.identity);
    setSelectDefaultValue('#gender', user_info.gender);
    setSelectDefaultValue('#college', user_info.college);
    setSelectDefaultValue('#grade', user_info.grade);
    
    // 設定其他 input 欄位
    $('#schoolName').val(user_info.schoolName);
    $('#organization').val(user_info.organization);
    $('#studentId').val(user_info.studentId);
    $('#extDepartment').val(user_info.extDepartment);
    $('#extGrade').val(user_info.extGrade);
    $('#ytChannel').val(user_yt.channel);

    // 設定 YouTube 會員等級
    setYoutubeLevel();

    // 如果有學院預設值，更新系所選項
    if (user_info.college) {
        updateDepartmentDropdown();
        setSelectDefaultValue('#department', user_info.department);
    }

    // 根據身份更新欄位顯示
    updateFieldsBasedOnIdentity(user_info.identity);
}

// 處理表單提交
function handleFormSubmit(e) {
    e.preventDefault();
    
    // 驗證表單
    if (!this.checkValidity()) {
        e.stopPropagation();
        $(this).addClass('was-validated');
        return;
    }

    // 顯示載入狀態
    $('#submitBtn').addClass('d-none');
    $('#loadBtn').removeClass('d-none');

    // 收集表單資料
    const data = {
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
    };

    // 發送 AJAX 請求
    $.ajax({
        url: location.origin + "/liff/userinfo",
        type: 'POST',
        data: data,
        success: function (response) {
            if (response.success) {
                liff.sendMessages([{
                    type: 'text',
                    text: response.message
                }]).then(() => {
                    liff.closeWindow();
                });
            } else {
                alert(response.message);
                $('#submitBtn').removeClass('d-none');
                $('#loadBtn').addClass('d-none');
            }
        },
        error: function (error) {
            console.log('error', error);
        }
    });
}

// 處理身份選擇變化
function handleIdentityChange() {
    const selectedIdentity = $(this).val();
    updateFieldsBasedOnIdentity(selectedIdentity);
    
    // 僅在身份選擇後清空不相關欄位資料
    if (selectedIdentity) {
        clearIrrelevantFields(selectedIdentity);
    }
}

// 處理學院選擇變化
function handleCollegeChange() {
    if ($('#college').val() === '') {
        $('#department').empty();
        $('#department').append('<option value="" selected disabled>請選擇系所</option>');
        return;
    }
    updateDepartmentDropdown();
}

// 初始化事件監聽器
function initEventListeners() {
    // Identity 下拉選單變化
    $('#identity').change(handleIdentityChange);

    // 學院選擇變化
    $('#college').change(handleCollegeChange);

    // 表單提交
    $('form').submit(handleFormSubmit);
}

// 頁面載入完成後初始化
$(document).ready(function () {
    initDropDowns();
    initEventListeners();
});