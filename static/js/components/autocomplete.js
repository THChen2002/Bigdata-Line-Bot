/**
 * 綁定 input 的 autocomplete 下拉提示（支援鍵盤導航）
 * @param {string|jQuery} $input - input selector 或 jQuery 物件
 * @param {Array<string>} dataList - 可選項目陣列
 * @param {string} dropdownId - autocomplete 容器 id（如 #collection-autocomplete）
 */
function bindAutocomplete($input, dataList, dropdownId) {
    $input = $($input);
    let selectedIndex = -1;
    let currentMatches = [];
    let isSelecting = false; // 標誌，防止選擇時重新顯示選單

    function updateDropdown() {
        if (isSelecting) return; // 如果正在選擇，不更新選單
        
        const val = $input.val().toLowerCase();
        currentMatches = dataList.filter(c => c.toLowerCase().includes(val));
        let html = '';
        if (val && currentMatches.length) {
            html = '<div class="list-group position-absolute w-100" style="z-index:1000;">' +
                currentMatches.map((c, index) => 
                    `<button type="button" class="list-group-item list-group-item-action ${index === selectedIndex ? 'active' : ''}" data-index="${index}">${c}</button>`
                ).join('') +
                '</div>';
            $(dropdownId).html(html).show();
        } else {
            $(dropdownId).hide();
        }
    }

    function selectItem(index) {
        if (index >= 0 && index < currentMatches.length) {
            isSelecting = true; // 設置標誌
            $input.val(currentMatches[index]);
            $(dropdownId).hide();
            selectedIndex = -1;
            // 觸發 input 事件以觸發其他相關邏輯
            $input.trigger('input');
            // 延遲重置標誌
            setTimeout(() => {
                isSelecting = false;
            }, 200);
        }
    }

    function highlightItem(index) {
        selectedIndex = index;
        $(dropdownId).find('.list-group-item').removeClass('active');
        $(dropdownId).find(`[data-index="${index}"]`).addClass('active');
    }

    $input.on('input focus', function() {
        selectedIndex = -1;
        updateDropdown();
    });

    $input.on('keydown', function(e) {
        const $dropdown = $(dropdownId);
        if (!$dropdown.is(':visible') || currentMatches.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, currentMatches.length - 1);
                highlightItem(selectedIndex);
                break;
            case 'ArrowUp':
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                if (selectedIndex === -1) {
                    $(dropdownId).find('.list-group-item').removeClass('active');
                } else {
                    highlightItem(selectedIndex);
                }
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0) {
                    selectItem(selectedIndex);
                } else if (currentMatches.length === 1) {
                    // 如果只有一個匹配項，直接選擇
                    selectItem(0);
                } else {
                    // 如果沒有選中任何項目，隱藏選單
                    $dropdown.hide();
                    selectedIndex = -1;
                }
                // 確保選單隱藏
                $(dropdownId).hide();
                break;
            case 'Escape':
                e.preventDefault();
                $dropdown.hide();
                selectedIndex = -1;
                break;
        }
    });

    $(dropdownId).on('click', '.list-group-item', function() {
        const index = parseInt($(this).data('index'));
        selectItem(index);
    });

    $(document).on('click', function(e) {
        if (!$(e.target).closest($input).length && !$(e.target).closest(dropdownId).length) {
            $(dropdownId).hide();
            selectedIndex = -1;
        }
    });
} 