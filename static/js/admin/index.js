let membersChartInstance = null;

// 上方儀錶板渲染
function renderDashboardWithCounts(levelCounts) {
    const totalMembers = (levelCounts["1"] || 0) + (levelCounts["2"] || 0) + (levelCounts["3"] || 0);
    $('#total-members-card').text(totalMembers);
    $('#non-members-card').text(levelCounts["0"] || 0);
    $('#level1-card').text(levelCounts["1"] || 0);
    $('#level2-card').text(levelCounts["2"] || 0);
    $('#level3-card').text(levelCounts["3"] || 0);
}

// 渲染會員人數圖表
function renderChart(levelCounts) {
    const ctx = document.getElementById('membersChart').getContext('2d');
    if(membersChartInstance) {
        membersChartInstance.destroy();
    }
    membersChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['請老師喝杯水 (Lv1)', '請老師吃便當 (Lv2)', '請老師吃大餐 (Lv3)'],
            datasets: [{
                label: '會員人數',
                data: [levelCounts["1"] || 0, levelCounts["2"] || 0, levelCounts["3"] || 0],
                backgroundColor: [
                    'rgba(13, 110, 253, 0.6)',
                    'rgba(25, 135, 84, 0.6)',
                    'rgba(255, 193, 7, 0.6)'
                ],
                borderColor: [
                    'rgb(13, 110, 253)',
                    'rgb(25, 135, 84)',
                    'rgb(255, 193, 7)'
                ],
                borderWidth: 1.5,
                borderRadius: 5,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#e9ecef'
                    },
                    ticks: {
                        precision: 0,
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#343a40',
                    titleFont: { size: 14 },
                    bodyFont: { size: 12 },
                    padding: 10,
                    cornerRadius: 4,
                    displayColors: false,
                }
            }
        }
    });
}

$(document).ready(function() {
    renderDashboardWithCounts(levelCounts);
    renderChart(levelCounts);
    setActiveNav('nav-dashboard');
});