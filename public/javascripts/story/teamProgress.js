/** 
 * 故事冲刺进度
 */

// 初始化echarts图表
var myChart = echarts.init(document.getElementById('mainChart'), 'iscs');

var xAxisdData = [];
var seriesprogressData = [];
var seriesstoryData = [];
var y = 0;


var filterId = "10703";
$.ajax({
    url: 'api/getTeamReportData',
    method: 'post',
    data: {
        filterId: filterId
    },
    success: function (response) {
        xAxisdData = response.xAxisd;
        seriesprogressData = response.seriesdprogress;
        seriesstoryData = response.seriesdstory;
        // 为echarts对象加载数据 
        myChart.setOption(
            option = {
                title: {
                    text: 'Team冲刺进度',
                    subtext: ''
                },
                tooltip: {
                    trigger: 'axis'
                },
                legend: {
                    align: 'left',
                    data: ['Team进度(%)', 'Team故事完成率(%)'],
                    show: true
                },
                toolbox: {
                    feature: {
                        // dataView: {
                        //     show: true,
                        //     readOnly: false
                        // },
                        // magicType: {
                        //     show: true,
                        //     type: ['line', 'bar']
                        // },
                        // restore: {
                        //     show: true
                        // },
                        saveAsImage: {
                            show: true
                        }
                    }
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '5%',
                    top: '15%',
                    containLabel: true
                },
                calculable: true,
                xAxis: [{
                    type: 'category',
                    data: xAxisdData,
                    // data : ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
                    boundaryGap: true
                }],
                yAxis: [{
                    type: 'value',
                    axisLabel: {
                        formatter: '{value} %'
                    }
                }],
                series: [{
                    name: 'Team进度(%)',
                    type: 'bar',
                    data: seriesprogressData
                        // data:[2.0, 4.9, 7.0, 23.2, 25.6, 76.7, 135.6, 162.2, 32.6, 20.0, 6.4, 3.3]
                }, {
                    name: 'Team故事完成率(%)',
                    type: 'bar',
                    data: seriesstoryData
                        // data:[2.6, 5.9, 9.0, 26.4, 28.7, 70.7, 175.6, 182.2, 48.7, 18.8, 6.0, 2.3]
                }]
            }
        );
    }
});


// select2
$("#chartTypeList").select2({
    data: [{
        'id': 'bar',
        'text': '条形图'
    }, {
        'id': 'line',
        'text': '折线图'
    }]
});
$.ajax({
    url: 'api/getFavoriteFilters',
    method: 'get',
    dataType: 'json',
    success: function (data) {
        $("#filterList").select2({
            data: data,
            placeholder: '请选择过滤器',
            allowClear: true
        });
        searchReport();
    }
});

function searchReport() {

    myChart.showLoading();
    Pace.start();
    if (y == 0) {
        var filterId = "10703";
        y = 1;
    } else {
        var filterId = $('#filterList').val();
        var chartType = $('#chartTypeList').val();
    }


    $.ajax({
        url: 'api/getTeamReportData',
        method: 'post',
        data: {
            filterId: filterId,

        },

        dataType: 'json',
        success: function (response) {
            myChart.hideLoading();
            Pace.stop();
            if (response.xAxisd) {

                option.xAxis[0].data = response.xAxisd;
                option.series[0].data = response.seriesdprogress;

                option.series[0].type = chartType;
                option.series[1].type = chartType;

                myChart.setOption(option);

            } else {
                toastr.error(response.msg);
            }
        }
    });
}