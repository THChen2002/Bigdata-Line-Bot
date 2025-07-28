$(document).ready(function() {
    const $btns = $('.newsCategoryList .news-category-btn');
    const $table = $('#newsTable tbody');
    
    $btns.on('click', function() {
        const cat = $(this).data('category');
        $btns.removeClass('active');
        $(this).addClass('active');
        
        let visibleCount = 0;
        
        // 移除之前動態添加的"沒有消息"行
        $('.dynamic-no-news').remove();
        
        // 處理有 data-category 的行
        $('#newsTable tbody tr[data-category]').each(function() {
            if (cat === '全部' || $(this).data('category') === cat) {
                $(this).show();
                visibleCount++;
            } else {
                $(this).hide();
            }
        });
        
        const $noNewsRow = $('.no-news-row');
        if (cat === '全部') {
            $noNewsRow.show();
        } else {
            $noNewsRow.hide();
            if (visibleCount === 0) {
                const noResultsRow = `
                    <tr class="dynamic-no-news">
                        <td colspan="4" class="text-center text-muted">目前沒有【${cat}】分類的消息</td>
                    </tr>
                `;
                $table.append(noResultsRow);
            }
        }
    });
    
    // 預設選中全部
    $btns.first().addClass('active');
});