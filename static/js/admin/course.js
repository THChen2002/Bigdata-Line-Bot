// 課程管理表格類
class CourseTable extends DataTable {
    constructor() {
        super({
            tableId: 'course-table',
            searchId: 'course-search',
            filterPanelId: 'courseFilterPanel',
            tableBodyId: 'course-table-body',
            paginationId: 'pagination',
            itemsPerPage: 10,
            idField: 'course_id' // 課程管理使用 course_id 作為主鍵
        });
        
        this.initCourseSpecificFeatures();
    }
    
    initCourseSpecificFeatures() {
        // 初始化課程特定的篩選器
        this.initFilters();
        
        // 綁定新增課程按鈕
        $('#add-btn').on('click', () => {
            this.showAddCourseModal();
        });
        
        // 綁定篩選器移除事件
        $('#filterBadges').on('click', '.bi-x', (e) => {
            const filterKey = $(e.target).data('filter');
            this.removeFilter(filterKey);
        });
    }
    
    initFilters() {
        const filterContent = `
            <div class="row g-3">
                <div class="col-md-6">
                    <label class="form-label">課程類別</label>
                    <div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="checkbox" id="filter-category-basic" value="基礎">
                            <label class="form-check-label" for="filter-category-basic">基礎</label>
                        </div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="checkbox" id="filter-category-advanced" value="進階">
                            <label class="form-check-label" for="filter-category-advanced">進階</label>
                        </div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="checkbox" id="filter-category-practical" value="實務">
                            <label class="form-check-label" for="filter-category-practical">實務</label>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <label class="form-label">課程類型</label>
                    <div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="checkbox" id="filter-type-required" value="必修">
                            <label class="form-check-label" for="filter-type-required">必修</label>
                        </div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="checkbox" id="filter-type-elective" value="選修">
                            <label class="form-check-label" for="filter-type-elective">選修</label>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        $('#filter-content').html(filterContent);
    }
    
    applyFilters() {
        this.filters = {};
        
        // 收集類別篩選
        const selectedCategories = [];
        $('input[id^="filter-category-"]:checked').each(function() {
            selectedCategories.push($(this).val());
        });
        if (selectedCategories.length > 0) {
            this.filters.category = selectedCategories;
        }
        
        // 收集類型篩選
        const selectedTypes = [];
        $('input[id^="filter-type-"]:checked').each(function() {
            selectedTypes.push($(this).val());
        });
        if (selectedTypes.length > 0) {
            this.filters.type = selectedTypes;
        }
        
        // 應用篩選
        this.filteredData = this.data.filter(item => {
            let match = true;
            
            if (this.filters.category && this.filters.category.length > 0) {
                match = match && this.filters.category.includes(item.category);
            }
            
            if (this.filters.type && this.filters.type.length > 0) {
                match = match && this.filters.type.includes(item.type);
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
    
    renderRow(course) {
        return `
            <tr>
                <td>${course.course_id || ''}</td>
                <td>${course.course_cname || ''}</td>
                <td>${course.course_ename || ''}</td>
                <td>
                    <span class="badge bg-${this.getCategoryBadgeColor(course.category)}">
                        ${course.category || ''}
                    </span>
                </td>
                <td>
                    <span class="badge bg-${this.getTypeBadgeColor(course.type)}">
                        ${course.type || ''}
                    </span>
                </td>
                <td>
                    ${course.cover_url ? 
                        `<img src="${course.cover_url}" alt="封面" class="img-thumbnail" style="width: 50px; height: 50px; object-fit: cover;">` : 
                        '<span class="text-muted">無封面</span>'
                    }
                </td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button type="button" class="btn btn-outline-primary btn-edit" data-id="${course.course_id}" title="編輯">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger btn-delete" data-id="${course.course_id}" title="刪除">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
    
    getCategoryBadgeColor(category) {
        const colors = {
            '基礎': 'primary',
            '進階': 'success',
            '實務': 'warning'
        };
        return colors[category] || 'secondary';
    }
    
    getTypeBadgeColor(type) {
        const colors = {
            '必修': 'danger',
            '選修': 'info'
        };
        return colors[type] || 'secondary';
    }
    
    showAddCourseModal() {
        showEditModal({
            title: '新增課程',
            icon: 'bi-plus-circle',
            fields: [
                {
                    id: 'course_cname',
                    label: '課程名稱(中文)',
                    type: 'text',
                    required: true,
                    placeholder: '請輸入課程中文名稱'
                },
                {
                    id: 'course_ename',
                    label: '課程名稱(英文)',
                    type: 'text',
                    required: true,
                    placeholder: '請輸入課程英文名稱'
                },
                {
                    id: 'category',
                    label: '類別',
                    type: 'select',
                    required: true,
                    options: [
                        {value: '基礎', label: '基礎'},
                        {value: '進階', label: '進階'},
                        {value: '實務', label: '實務'}
                    ]
                },
                {
                    id: 'type',
                    label: '類型',
                    type: 'select',
                    required: true,
                    options: [
                        {value: '必修', label: '必修'},
                        {value: '選修', label: '選修'}
                    ]
                },
                {
                    id: 'cover_url',
                    label: '封面圖片URL',
                    type: 'url',
                    placeholder: 'https://example.com/image.jpg'
                }
            ],
            onSave: (formData) => {
                this.addCourse(formData);
            }
        });
    }
    
    addCourse(courseData) {
        // 生成新的課程ID
        const maxId = Math.max(...this.data.map(c => c.course_id || 0), 0);
        const newCourse = {
            ...courseData,
            course_id: maxId + 1
        };
        
        // 發送 API 請求到後端
        $.ajax({
            url: '/admin/course/add',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(newCourse),
            success: (response) => {
                if (response.success) {
                    this.addItem(newCourse);
                    this.showToast('課程新增成功');
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
            const courseId = $(e.currentTarget).data('id');
            const course = this.data.find(c => c.course_id == courseId);
            if (course) {
                this.showEditCourseModal(course);
            }
        });
        
        // 刪除按鈕
        $(`#${this.options.tableBodyId}`).on('click', '.btn-delete', (e) => {
            const courseId = $(e.currentTarget).data('id');
            const course = this.data.find(c => c.course_id == courseId);
            if (course) {
                this.showDeleteConfirm(course);
            }
        });
    }
    
    showEditCourseModal(course) {
        showEditModal({
            title: '編輯課程',
            icon: 'bi-pencil-square',
            fields: [
                {
                    id: 'course_cname',
                    label: '課程名稱(中文)',
                    type: 'text',
                    required: true,
                    value: course.course_cname
                },
                {
                    id: 'course_ename',
                    label: '課程名稱(英文)',
                    type: 'text',
                    required: true,
                    value: course.course_ename
                },
                {
                    id: 'category',
                    label: '類別',
                    type: 'select',
                    required: true,
                    value: course.category,
                    options: [
                        {value: '基礎', label: '基礎'},
                        {value: '進階', label: '進階'},
                        {value: '實務', label: '實務'}
                    ]
                },
                {
                    id: 'type',
                    label: '類型',
                    type: 'select',
                    required: true,
                    value: course.type,
                    options: [
                        {value: '必修', label: '必修'},
                        {value: '選修', label: '選修'}
                    ]
                },
                {
                    id: 'cover_url',
                    label: '封面圖片URL',
                    type: 'url',
                    value: course.cover_url
                }
            ],
            onSave: (formData) => {
                this.updateCourse(course.course_id, formData);
            }
        });
    }
    
    updateCourse(courseId, updates) {
        $.ajax({
            url: `/admin/course/update/${courseId}`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(updates),
            success: (response) => {
                if (response.success) {
                    this.updateItem(courseId, updates);
                    this.showToast('課程更新成功');
                } else {
                    this.showToast(response.message || '更新失敗', 'error');
                }
            },
            error: () => {
                this.showToast('網路錯誤，請稍後再試', 'error');
            }
        });
    }
    
    showDeleteConfirm(course) {
        this.showConfirmModal({
            title: '刪除課程',
            message: `確定要刪除課程「${course.course_cname}」嗎？此操作無法復原。`,
            confirmText: '刪除',
            confirmClass: 'btn-danger',
            onConfirm: () => {
                this.deleteCourse(course.course_id);
            }
        });
    }
    
    deleteCourse(courseId) {
        $.ajax({
            url: `/admin/course/delete/${courseId}`,
            method: 'DELETE',
            success: (response) => {
                if (response.success) {
                    this.deleteItem(courseId);
                    this.showToast('課程刪除成功');
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

// 初始化課程表格
$(document).ready(function() {
    setActiveNav('nav-course');
    
    const courseTable = new CourseTable();
    
    // 設置初始數據
    if (typeof coursesData !== 'undefined') {
        courseTable.setData(coursesData);
    }
    
    // 綁定行事件
    courseTable.bindRowEvents();
});