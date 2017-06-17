/**
 * 
 * 3Team进度
 */
// 初始化echarts图表
var myChart = echarts.init(document.getElementById('mainChart'), 'iscs-theme');

var filterId = "303";
Pace.start();
$.ajax({
    url: 'api/getDashboardReportData',
    method: 'post',
    data: {
        filterId: filterId
    },
    success: function (response) {
        Pace.stop();
        // 为echarts对象加载数据 
        myChart.setOption({
            title: {
                text: ' lineGraph-等海星把过滤器的JQL写好在做。'
            },
            tooltip: {
                trigger: 'axis'
            },
            legend: {
                data: ['Step Start', 'Step Middle', 'Step End']
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            toolbox: {
                feature: {
                    saveAsImage: {}
                }
            },
            xAxis: {
                type: 'category',
                data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            },
            yAxis: {
                type: 'value'
            },
            series: [{
                name: 'Step Start',
                type: 'line',
                step: 'start',
                data: [120, 132, 101, 134, 90, 230, 210]
            }, {
                name: 'Step Middle',
                type: 'line',
                step: 'middle',
                data: [220, 282, 201, 234, 290, 430, 410]
            }, {
                name: 'Step End',
                type: 'line',
                step: 'end',
                data: [450, 432, 401, 454, 590, 530, 510]
            }]
        });
    }
});