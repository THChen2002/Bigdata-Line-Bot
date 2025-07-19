// 開課管理表格類
class CourseOpenTable extends DataTable {
    constructor() {
        super({
            tableId: 'course-open-table',
            searchId: 'course-open-search',
            filterPanelId: 'courseOpenFilterPanel',
            tableBodyId: 'course-open-table-body',
            paginationId: 'pagination',
            itemsPerPage: 10
        });
        
        this.courses = []; // 課程資料
        this.initCourseOpenSpecificFeatures();
    }
    
    initCourseOpenSpecificFeatures() {
        // 初始化開課特定的篩選器
        this.initFilters();
        
        // 綁定新增開課按鈕
        $('#add-btn').on('click', () => {
            this.showAddCourseOpenModal();
        });
        
        // 綁定篩選器移除事件
        $('#filterBadges').on('click', '.bi-x', (e) => {
            const filterKey = $(e.target).data('filter');
            this.removeFilter(filterKey);
        });
    }
    
    setCourses(courses) {
        this.courses = courses;
    }
    
    getCourseName(courseId) {
        const course = this.courses.find(c => c.course_id == courseId);
        return course ? course.course_cname : `課程ID: ${courseId}`;
    }
    
    initFilters() {
        const filterContent = `
            <div class="row g-3">
                <div class="col-md-6">
                    <label class="form-label">學年</label>
                    <div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="checkbox" id="filter-year-110" value="110">
                            <label class="form-check-label" for="filter-year-110">110學年</label>
                        </div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="checkbox" id="filter-year-111" value="111">
                            <label class="form-check-label" for="filter-year-111">111學年</label>
                        </div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="checkbox" id="filter-year-112" value="112">
                            <label class="form-check-label" for="filter-year-112">112學年</label>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <label class="form-label">學期</label>
                    <div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="checkbox" id="filter-semester-1" value="1">
                            <label class="form-check-label" for="filter-semester-1">第一學期</label>
                        </div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="checkbox" id="filter-semester-2" value="2">
                            <label class="form-check-label" for="filter-semester-2">第二學期</label>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <label class="form-label">星期</label>
                    <div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="checkbox" id="filter-week-一" value="一">
                            <label class="form-check-label" for="filter-week-一">星期一</label>
                        </div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="checkbox" id="filter-week-二" value="二">
                            <label class="form-check-label" for="filter-week-二">星期二</label>
                        </div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="checkbox" id="filter-week-三" value="三">
                            <label class="form-check-label" for="filter-week-三">星期三</label>
                        </div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="checkbox" id="filter-week-四" value="四">
                            <label class="form-check-label" for="filter-week-四">星期四</label>
                        </div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="checkbox" id="filter-week-五" value="五">
                            <label class="form-check-label" for="filter-week-五">星期五</label>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        $('#filter-content').html(filterContent);
    }
    
    applyFilters() {
        this.filters = {};
        
        // 收集學年篩選
        const selectedYears = [];
        $('input[id^="filter-year-"]:checked').each(function() {
            selectedYears.push($(this).val());
        });
        if (selectedYears.length > 0) {
            this.filters.year = selectedYears;
        }
        
        // 收集學期篩選
        const selectedSemesters = [];
        $('input[id^="filter-semester-"]:checked').each(function() {
            selectedSemesters.push($(this).val());
        });
        if (selectedSemesters.length > 0) {
            this.filters.semester = selectedSemesters;
        }
        
        // 收集星期篩選
        const selectedWeeks = [];
        $('input[id^="filter-week-"]:checked').each(function() {
            selectedWeeks.push($(this).val());
        });
        if (selectedWeeks.length > 0) {
            this.filters.week = selectedWeeks;
        }
        
        // 應用篩選
        this.filteredData = this.data.filter(item => {
            let match = true;
            
            if (this.filters.year && this.filters.year.length > 0) {
                match = match && this.filters.year.includes(String(item.year));
            }
            
            if (this.filters.semester && this.filters.semester.length > 0) {
                match = match && this.filters.semester.includes(String(item.semester));
            }
            
            if (this.filters.week && this.filters.week.length > 0) {
                match = match && this.filters.week.includes(item.week);
            }
            
            return match;
        });
        
        this.currentPage = 1;
        this.render();
        this.toggleFilterPanel();
        this.updateFilterBadges();
    }
    
    removeFilter(filterKey) {
        delete this.filters[filterKey];
        
        // 清除對應的 checkbox
        $(`input[id^="filter-${filterKey}-"]`).prop('checked', false);
        
        this.applyFilters();
    }
    
    renderRow(courseOpen) {
        const courseName = this.getCourseName(courseOpen.course_id);
        const timeInfo = `${courseOpen.week} ${courseOpen.start_class}-${courseOpen.end_class}節`;
        const semesterInfo = `${courseOpen.year}學年第${courseOpen.semester}學期`;
        
        return `
            <tr>
                <td>${courseOpen.id || ''}</td>
                <td>${courseOpen.course_id || ''}</td>
                <td>${courseName}</td>
                <td>${courseOpen.professor || ''}</td>
                <td>
                    <span class="badge bg-info">${courseOpen.classroom || ''}</span>
                </td>
                <td>
                    <span class="badge bg-warning">${timeInfo}</span>
                </td>
                <td>
                    <span class="badge bg-success">${semesterInfo}</span>
                </td>
                <td>
                    <span class="badge bg-primary">${courseOpen.credit || ''} 學分</span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button type="button" class="btn btn-outline-primary btn-edit" data-id="${courseOpen.id}" title="編輯">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger btn-delete" data-id="${courseOpen.id}" title="刪除">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
    
    showAddCourseOpenModal() {
        const courseOptions = this.courses.map(course => ({
            value: course.course_id,
            label: `${course.course_id} - ${course.course_cname}`
        }));
        
        showEditModal({
            title: '新增開課',
            icon: 'bi-plus-circle',
            fields: [
                {
                    id: 'course_id',
                    label: '課程',
                    type: 'select',
                    required: true,
                    options: courseOptions
                },
                {
                    id: 'professor',
                    label: '教授',
                    type: 'text',
                    required: true,
                    placeholder: '請輸入教授姓名'
                },
                {
                    id: 'classroom',
                    label: '教室',
                    type: 'text',
                    required: true,
                    placeholder: '例如：F401B'
                },
                {
                    id: 'year',
                    label: '學年',
                    type: 'text',
                    required: true,
                    placeholder: '請輸入學年，例如：112'
                },
                {
                    id: 'semester',
                    label: '學期',
                    type: 'select',
                    required: true,
                    options: [
                        {value: '1', label: '第一學期'},
                        {value: '2', label: '第二學期'}
                    ]
                },
                {
                    id: 'week',
                    label: '星期',
                    type: 'select',
                    required: true,
                    options: [
                        {value: '一', label: '星期一'},
                        {value: '二', label: '星期二'},
                        {value: '三', label: '星期三'},
                        {value: '四', label: '星期四'},
                        {value: '五', label: '星期五'}
                    ]
                },
                {
                    id: 'start_class',
                    label: '開始節次',
                    type: 'select',
                    required: true,
                    options: [
                        {value: '0M', label: '第0M節'},
                        {value: '01', label: '第01節'},
                        {value: '02', label: '第02節'},
                        {value: '03', label: '第03節'},
                        {value: '04', label: '第04節'},
                        {value: '0N', label: '第0N節'},
                        {value: '05', label: '第05節'},
                        {value: '06', label: '第06節'},
                        {value: '07', label: '第07節'},
                        {value: '08', label: '第08節'},
                        {value: '0E', label: '第0E節'},
                        {value: '09', label: '第09節'},
                        {value: '10', label: '第10節'},
                        {value: '11', label: '第11節'},
                        {value: '12', label: '第12節'}
                    ]
                },
                {
                    id: 'end_class',
                    label: '結束節次',
                    type: 'select',
                    required: true,
                    options: [
                        {value: '0M', label: '第0M節'},
                        {value: '01', label: '第01節'},
                        {value: '02', label: '第02節'},
                        {value: '03', label: '第03節'},
                        {value: '04', label: '第04節'},
                        {value: '0N', label: '第0N節'},
                        {value: '05', label: '第05節'},
                        {value: '06', label: '第06節'},
                        {value: '07', label: '第07節'},
                        {value: '08', label: '第08節'},
                        {value: '0E', label: '第0E節'},
                        {value: '09', label: '第09節'},
                        {value: '10', label: '第10節'},
                        {value: '11', label: '第11節'},
                        {value: '12', label: '第12節'}
                    ]
                },
                {
                    id: 'credit',
                    label: '學分',
                    type: 'number',
                    required: true,
                    placeholder: '請輸入學分數'
                },
                {
                    id: 'class',
                    label: '適用年級',
                    type: 'text',
                    placeholder: '例如：大三、碩一'
                }
            ],
            onSave: (formData) => {
                this.addCourseOpen(formData);
            }
        });
    }
    
    addCourseOpen(courseOpenData) {
        // 生成新的開課ID
        const maxId = Math.max(...this.data.map(c => c.id || 0), 0);
        const newCourseOpen = {
            ...courseOpenData,
            id: maxId + 1
        };
        
        // 發送 API 請求到後端
        $.ajax({
            url: '/admin/course_open/add',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(newCourseOpen),
            success: (response) => {
                if (response.success) {
                    this.addItem(newCourseOpen);
                    this.showToast('開課記錄新增成功');
                } else {
                    this.showToast(response.message || '新增失敗', 'error');
                }
            },
            error: () => {
                this.showToast('網路錯誤，請稍後再試', 'error');
            }
        });
    }
    
    // 綁定編輯和刪除事件
    bindRowEvents() {
        // 編輯按鈕
        $(`#${this.options.tableBodyId}`).on('click', '.btn-edit', (e) => {
            const courseOpenId = $(e.currentTarget).data('id');
            const courseOpen = this.data.find(c => c.id == courseOpenId);
            if (courseOpen) {
                this.showEditCourseOpenModal(courseOpen);
            }
        });
        
        // 刪除按鈕
        $(`#${this.options.tableBodyId}`).on('click', '.btn-delete', (e) => {
            const courseOpenId = $(e.currentTarget).data('id');
            const courseOpen = this.data.find(c => c.id == courseOpenId);
            if (courseOpen) {
                this.showDeleteConfirm(courseOpen);
            }
        });
    }
    
    showEditCourseOpenModal(courseOpen) {
        const courseOptions = this.courses.map(course => ({
            value: course.course_id,
            label: `${course.course_id} - ${course.course_cname}`
        }));
        
        showEditModal({
            title: '編輯開課',
            icon: 'bi-pencil-square',
            fields: [
                {
                    id: 'course_id',
                    label: '課程',
                    type: 'select',
                    required: true,
                    value: courseOpen.course_id,
                    options: courseOptions
                },
                {
                    id: 'professor',
                    label: '教授',
                    type: 'text',
                    required: true,
                    value: courseOpen.professor
                },
                {
                    id: 'classroom',
                    label: '教室',
                    type: 'text',
                    required: true,
                    value: courseOpen.classroom
                },
                {
                    id: 'year',
                    label: '學年',
                    type: 'select',
                    required: true,
                    value: courseOpen.year,
                    options: [
                        {value: '110', label: '110學年'},
                        {value: '111', label: '111學年'},
                        {value: '112', label: '112學年'},
                        {value: '113', label: '113學年'}
                    ]
                },
                {
                    id: 'semester',
                    label: '學期',
                    type: 'select',
                    required: true,
                    value: courseOpen.semester,
                    options: [
                        {value: '1', label: '第一學期'},
                        {value: '2', label: '第二學期'}
                    ]
                },
                {
                    id: 'week',
                    label: '星期',
                    type: 'select',
                    required: true,
                    value: courseOpen.week,
                    options: [
                        {value: '一', label: '星期一'},
                        {value: '二', label: '星期二'},
                        {value: '三', label: '星期三'},
                        {value: '四', label: '星期四'},
                        {value: '五', label: '星期五'}
                    ]
                },
                {
                    id: 'start_class',
                    label: '開始節次',
                    type: 'select',
                    required: true,
                    value: courseOpen.start_class,
                    options: Array.from({length: 14}, (_, i) => ({
                        value: String(i + 1).padStart(2, '0'),
                        label: `第${i + 1}節`
                    }))
                },
                {
                    id: 'end_class',
                    label: '結束節次',
                    type: 'select',
                    required: true,
                    value: courseOpen.end_class,
                    options: Array.from({length: 14}, (_, i) => ({
                        value: String(i + 1).padStart(2, '0'),
                        label: `第${i + 1}節`
                    }))
                },
                {
                    id: 'credit',
                    label: '學分',
                    type: 'number',
                    required: true,
                    value: courseOpen.credit
                },
                {
                    id: 'class',
                    label: '適用年級',
                    type: 'text',
                    value: courseOpen.class
                }
            ],
            onSave: (formData) => {
                this.updateCourseOpen(courseOpen.id, formData);
            }
        });
    }
    
    updateCourseOpen(courseOpenId, updates) {
        $.ajax({
            url: `/admin/course_open/update/${courseOpenId}`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(updates),
            success: (response) => {
                if (response.success) {
                    this.updateItem(courseOpenId, updates);
                    this.showToast('開課記錄更新成功');
                } else {
                    this.showToast(response.message || '更新失敗', 'error');
                }
            },
            error: () => {
                this.showToast('網路錯誤，請稍後再試', 'error');
            }
        });
    }
    
    showDeleteConfirm(courseOpen) {
        const courseName = this.getCourseName(courseOpen.course_id);
        this.showConfirmModal({
            title: '刪除開課記錄',
            message: `確定要刪除課程「${courseName}」的開課記錄嗎？此操作無法復原。`,
            confirmText: '刪除',
            confirmClass: 'btn-danger',
            onConfirm: () => {
                this.deleteCourseOpen(courseOpen.id);
            }
        });
    }
    
    deleteCourseOpen(courseOpenId) {
        $.ajax({
            url: `/admin/course_open/delete/${courseOpenId}`,
            method: 'DELETE',
            success: (response) => {
                if (response.success) {
                    this.deleteItem(courseOpenId);
                    this.showToast('開課記錄刪除成功');
                } else {
                    this.showToast(response.message || '刪除失敗', 'error');
                }
            },
            error: () => {
                this.showToast('網路錯誤，請稍後再試', 'error');
            }
        });
    }
}

// 初始化開課表格
$(document).ready(function() {
    setActiveNav('nav-course-open');
    
    const courseOpenTable = new CourseOpenTable();
    
    // 設置課程資料
    if (typeof coursesData !== 'undefined') {
        courseOpenTable.setCourses(coursesData);
    }
    
    // 設置初始數據
    if (typeof courseOpenData !== 'undefined') {
        courseOpenTable.setData(courseOpenData);
    }
    
    // 綁定行事件
    courseOpenTable.bindRowEvents();
}); 