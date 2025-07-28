$(document).ready(function() {
    // 初始化變數
    let currentFields = [];
    
    // collection autocomplete
    bindAutocomplete('#collectionInput', allCollections, '#collection-autocomplete');

    // 排序欄位 autocomplete
    bindAutocomplete('#orderFieldInput', currentFields || [], '#orderfield-autocomplete');
    
    $('#collectionInput').on('input', function() {
        const collection = $(this).val().trim();
        if (!allCollections.includes(collection)) {
            currentFields = [];
            $('.field-autocomplete').empty().hide();
            $('.condition-field').val('');
            // 清空排序欄位
            $('#orderFieldInput').val("");
            $('#orderfield-autocomplete').empty().hide();
            return;
        }
        $.get(`/admin/api/firebase/fields?collection=${encodeURIComponent(collection)}`, function(res) {
            if (res.success) {
                currentFields = res.fields;
                $('.condition-field').val('');
                $('.field-autocomplete').empty().hide();
                // 重新綁定所有 .condition-field autocomplete
                $('.condition-field').each(function() {
                    const $input = $(this);
                    const id = $input.attr('id');
                    const dropdownId = id ? `#field-autocomplete-${id.split('-').pop()}` : null;
                    if (dropdownId) {
                        $input.off('input focus keydown');
                        bindAutocomplete($input, currentFields, dropdownId);
                    }
                });
                // 重新綁定排序欄位 autocomplete
                $('#orderFieldInput').off('input focus keydown');
                bindAutocomplete('#orderFieldInput', currentFields, '#orderfield-autocomplete');
            }
        });
    });

    // 查詢表單送出
    $('#queryForm').on('submit', function(e) {
        e.preventDefault();
        const collection = $('#collectionInput').val().trim();
        if (!allCollections.includes(collection)) {
            showToast('請選擇有效的 Collection 名稱', 'warning');
            return;
        }
        // 組合多條件
        const conditions = [];
        $('#query-conditions-area .query-condition-row').each(function() {
            const field = $(this).find('.condition-field').val().trim();
            const op = $(this).find('.condition-op').val();
            let value = $(this).find('.condition-value').val().trim();
            if (!field) return;
            if (value === 'true') value = true;
            else if (value === 'false') value = false;
            else if (!isNaN(value) && value !== '') value = Number(value);
            conditions.push({ field, op, value });
        });
        const limit = Number($('#limitInput').val()) || undefined;
        // 取得排序欄位與方式
        const orderField = $('#orderFieldInput').val().trim();
        const orderDirection = $('#orderDirectionInput').val();
        let order_by = undefined;
        if (orderField) order_by = [orderField, orderDirection];
        fetch(`/admin/api/firebase/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ collection, conditions, limit, order_by })
        })
        .then(r => r.json()).then(res => {
            if (res.success) renderTable(res.data, collection);
            else showToast(res.message || '查詢失敗', 'error');
        });
    });

    // 動態增刪查詢條件
    let fieldCounter = 0;
    $('#addConditionBtn').on('click', function() {
        fieldCounter++;
        const fieldId = `condition-field-${fieldCounter}`;
        const dropdownId = `field-autocomplete-${fieldCounter}`;
        const $row = $(
            `<div class="row g-2 align-items-center mb-2 query-condition-row">
                <div class="col-md-3 position-relative">
                    <input type="text" class="form-control condition-field" id="${fieldId}" placeholder="欄位名稱">
                    <div id="${dropdownId}" class="field-autocomplete" style="position:relative;"></div>
                </div>
                <div class="col-md-2">
                    <select class="form-select condition-op">
                        <option value="==">==</option>
                        <option value=">">&gt;</option>
                        <option value=">=">&gt;=</option>
                        <option value="<">&lt;</option>
                        <option value="<=">&lt;=</option>
                        <option value="!=">!=</option>
                        <option value="in">in</option>
                        <option value="not-in">not-in</option>
                        <option value="array_contains">array_contains</option>
                        <option value="array_contains_any">array_contains_any</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <input type="text" class="form-control condition-value" placeholder="請輸入值">
                </div>
                <div class="col-md-1">
                    <button type="button" class="btn btn-outline-danger btn-sm btn-remove-condition" title="移除條件">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
            </div>`
        );
        $('#query-conditions-area').append($row);
        if (currentFields.length) {
            // 移除舊的事件綁定，避免重複綁定
            $(`#${fieldId}`).off('input focus keydown');
            bindAutocomplete(`#${fieldId}`, currentFields, `#${dropdownId}`);
        }
    });
    // 刪除條件
    $('#query-conditions-area').on('click', '.btn-remove-condition', function() {
        $(this).closest('.query-condition-row').remove();
    });

    // 動態增刪條件時也要重新綁定
    $('#query-conditions-area').on('focus', '.condition-field', function() {
        const $input = $(this);
        const id = $input.attr('id');
        const dropdownId = `#field-autocomplete-${id.split('-').pop()}`;
        if (currentFields.length) {
            // 移除舊的事件綁定，避免重複綁定
            $input.off('input focus keydown');
            bindAutocomplete($input, currentFields, dropdownId);
        }
    });

    // 初始第一行也要有 autocomplete
    fieldCounter = 1;
    const fieldId = `condition-field-1`;
    const dropdownId = `field-autocomplete-1`;
    $('#query-conditions-area .condition-field').attr('id', fieldId);
    $('#query-conditions-area .col-md-3').addClass('position-relative').append(`<div id="${dropdownId}" class="field-autocomplete" style="position:relative;"></div>`);
    if (currentFields.length) {
        // 移除舊的事件綁定，避免重複綁定
        $(`#${fieldId}`).off('input focus keydown');
        bindAutocomplete(`#${fieldId}`, currentFields, `#${dropdownId}`);
    }
});

// 動態產生表格
function renderTable(data, collection) {
    const $thead = $('#firebaseTable thead').empty();
    const $tbody = $('#firebaseTable tbody').empty();
    if (!data || !data.length) {
        $thead.append('<tr><th>Document ID</th><th>資料內容</th><th style="width: 15%; text-align:center;">操作</th></tr>');
        $tbody.append('<tr><td colspan="3" class="text-center text-muted">查無資料</td></tr>');
        return;
    }
    // 收集所有 key，排除 doc_id
    let allKeys = new Set();
    data.forEach(row => {
        Object.keys(row.data).forEach(k => allKeys.add(k));
    });
    allKeys.delete('doc_id');
    allKeys = Array.from(allKeys);
    // 產生表頭
    let headHtml = '<tr><th>Document ID</th>';
    allKeys.forEach(k => { headHtml += `<th>${k}</th>`; });
    headHtml += '<th style="width: 15%; text-align:center;">操作</th></tr>';
    $thead.append(headHtml);
    // 產生每一列
    data.forEach(row => {
        const docId = row.doc_id;
        const doc = row.data;
        let rowHtml = `<tr><td class="align-middle">${docId}</td>`;
        allKeys.forEach(k => {
            const val = doc[k];
            if (typeof val === 'object' && val !== null) {
                rowHtml += `<td><pre class="mb-0" style="white-space:pre-wrap;">${JSON.stringify(val, null, 2)}</pre></td>`;
            } else {
                rowHtml += `<td>${val === undefined ? '' : val}</td>`;
            }
        });
        rowHtml += `<td class="text-center" style="white-space:nowrap;">
          <div class="d-flex align-items-center justify-content-center gap-2 flex-nowrap">
            <span class="btn-edit edit-firebase text-primary" data-id="${docId}" data-json='${JSON.stringify(doc)}'>
              <i class="bi bi-pencil-square me-1"></i>編輯
            </span>
            <span class="btn-delete delete-firebase text-danger" data-id="${docId}">
              <i class="bi bi-trash me-1"></i>刪除
            </span>
          </div>
        </td></tr>`;
        $tbody.append(rowHtml);
    });
    // 綁定編輯事件
    $('#firebaseTable .edit-firebase').off('click').on('click', function() {
        const docId = $(this).data('id');
        const data = $(this).data('json');
        // 動態產生欄位
        const fields = [
            { id: 'docId', label: 'Document ID', type: 'text', required: true, readonly: true }
        ];
        Object.entries(data).forEach(([key, value]) => {
            if (key === 'doc_id') return; // 排除 doc_id
            let type = 'text';
            if (typeof value === 'boolean') type = 'checkbox';
            else if (typeof value === 'number') type = 'number';
            else if (typeof value === 'object' && value !== null) type = 'textarea';
            fields.push({ id: key, label: key, type, required: false, value: (type === 'textarea' ? JSON.stringify(value, null, 2) : value) });
        });
        const formData = { docId };
        Object.entries(data).forEach(([key, value]) => {
            if (typeof value === 'boolean') {
                formData[key] = value;
            } else if (typeof value === 'object' && value !== null) {
                formData[key] = JSON.stringify(value, null, 2);
            } else {
                formData[key] = value;
            }
        });
        showEditModal({
            title: '編輯資料',
            icon: 'bi-pencil-square',
            fields: fields,
            data: formData,
            onSave: function(formData) {
                const updateData = {};
                fields.forEach(field => {
                    let val;
                    if (field.type === 'checkbox') {
                        val = $(`#${field.id}`).is(':checked');
                    } else if (field.type === 'number') {
                        val = $(`#${field.id}`).val();
                        val = val === '' ? null : Number(val);
                    } else if (field.type === 'textarea') {
                        const raw = $(`#${field.id}`).val();
                        try { val = JSON.parse(raw); } catch { val = raw; }
                    } else {
                        val = $(`#${field.id}`).val();
                    }
                    if (field.id !== 'docId') updateData[field.id] = val;
                });
                fetch(`/admin/api/firebase/update`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ collection, docId, data: updateData })
                })
                .then(r => r.json()).then(res => {
                    if (res.success) {
                        showToast('更新成功');
                        $('#queryForm').submit();
                    } else showToast(res.message || '更新失敗', 'error');
                });
            }
        });
    });

    // 綁定刪除事件
    $('#firebaseTable .delete-firebase').off('click').on('click', function() {
        const docId = $(this).data('id');
        showConfirmModal({
            title: '刪除資料',
            message: `確定要刪除 Document ID: <code>${docId}</code> 嗎？`,
            confirmText: '刪除',
            confirmClass: 'btn-danger',
            onConfirm: function() {
                fetch(`/admin/api/firebase/delete`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ collection, docId })
                })
                .then(r => r.json()).then(res => {
                    if (res.success) {
                        showToast('刪除成功');
                        $('#queryForm').submit();
                    } else showToast(res.message || '刪除失敗', 'error');
                });
            }
        });
    });
} 