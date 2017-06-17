function searchWorkReport() {

    myChart.showLoading();
    Pace.start();
    // var filterId = $('#filterList').val();
    var chartType = $('#chartTypeList').val();
    var workStartTimeBegain = $('#workStartTimeBegain').val();
    var workStartTimeEnd = $('#workStartTimeEnd').val();
    var groupName = $('#groupList').val();

    $.ajax({
        url: 'api/getWorkReportData',
        method: 'post',
        data: {
            workStartTimeBegain: workStartTimeBegain,
            workStartTimeEnd: workStartTimeEnd,
            groupName: groupName
        },
        dataType: 'json',
        success: function (response) {
            Pace.stop();
            myChart.hideLoading();
            if (response.success) {
                $('#mainChart').css('width', response.data.userName.length * 60);
                option.xAxis.data = response.data.userName;
                option.series[0].data = response.data.timeSpent;
                // option.series[0].data = response.aggregatetimeoriginalestimate;
                // option.series[1].data = response.timeTrackingSpent;
                // option.series[2].data = response.timeSpent;
                option.series[0].type = chartType;
                // option.series[1].type = chartType;
                $('#timeSpentSecondsAverage').val(response.data.timeSpentSecondsAverage);
                myChart.setOption(option);
                myChart.resize();
                //toastr.info(response.msg);
            } else {
                toastr.error(response.msg);
            }
        }
    });
}

$(function () {

    //Date picker
    $('#workStartTimeBegain').datepicker({
        language: 'zh-CN',
        autoclose: true
    });
    $('#workStartTimeEnd').datepicker({
        language: 'zh-CN',
        autoclose: true
    });

    $('#workStartTimeBegain').val(moment().add(-7, 'days').format('YYYY-MM-DD'));

    //iCheck for checkbox and radio inputs
    $('input[type="checkbox"].minimal, input[type="radio"].minimal').iCheck({
        checkboxClass: 'icheckbox_minimal-blue',
        radioClass: 'iradio_minimal-blue'
    });
    //Red color scheme for iCheck
    $('input[type="checkbox"].minimal-red, input[type="radio"].minimal-red').iCheck({
        checkboxClass: 'icheckbox_minimal-red',
        radioClass: 'iradio_minimal-red'
    });
    //Flat red color scheme for iCheck
    $('input[type="checkbox"].flat-red, input[type="radio"].flat-red').iCheck({
        checkboxClass: 'icheckbox_flat-green',
        radioClass: 'iradio_flat-green'
    });

    searchWorkReport();
});

// 基于准备好的dom，初始化echarts图表
var myChart = echarts.init(document.getElementById('mainChart'), 'iscs');

var option = {
    title: {
        text: '累计有效工作量',
        x: 'center',
        align: 'right'
    },
    tooltip: {
        // show:true,
        // formatter: function(params){
        //    console.log(params.value);
        // },
        trigger: 'axis',
        axisPointer: { // 坐标轴指示器，坐标轴触发有效
            type: 'shadow' // 默认为直线，可选为：'line' | 'shadow'
        }
    },
    toolbox: {
        // y: 'bottom',
        left: 'right',
        feature: {
            saveAsImage: {
                pixelRatio: 2
            }
        }
    },
    grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
    },
    xAxis: {
        type: 'category',
        data: []
            // axisLabel: {
            //     rotate: 45, //刻度旋转45度角
            //     textStyle: {
            //         color: "red",
            //         fontSize: 16
            //     }
            // },
    },
    yAxis: [{
        type: 'value'
    }],
    series: [{
            name: '工作量',
            type: 'bar',
            data: [],
            markPoint: {
                symbol: 'image://images/good.png',
                symbolOffset: [0, -30],
                data: [{
                    type: 'max',
                    name: '最大值'
                }]
            },
            markLine: {
                data: [{
                    type: 'average',
                    name: '团队投入均值',
                    lineStyle: {
                        normal: {
                            color: 'gray',
                            type: 'solid',
                            width: 4
                        }
                    },
                    label: {
                        normal: {
                            show: true,
                            position: 'middle',
                            formatter: function (params) {
                                return params.name + ':' + params.value + 'h';
                            }
                        }
                    }
                }]
            },
        }
        //, {
        //     name: '实际工作量',
        //     type: 'bar',
        //     data: []
        // }, {
        //     name: '日志工作量',
        //     type: 'bar',
        //     data: []
        // }
    ]
};

// 为echarts对象加载数据 
myChart.setOption(option);

// select2
$("#chartTypeList").select2({
    data: [{
        'id': 'bar',
        'text': '柱状图'
    }, {
        'id': 'line',
        'text': '折线图'
    }]
});

//用户组
$.ajax({
    url: 'api/getGroupList',
    method: 'get',
    dataType: 'json',
    success: function (data) {
        $("#groupList").select2({
            data: data,
            placeholder: '请选择用户组',
            allowClear: true
        });
        $("#groupList").val(null).trigger("change");
    }
});

// $.ajax({
//     url: 'api/getFavoriteFilters',
//     method: 'get',
//     dataType: 'json',
//     success: function (data) {
//         $("#filterList").select2({

//             data: data,
//             placeholder: '请选择过滤器',
//             allowClear: true
//         });
//         searchWorkReport();
//     }
// });


//点击 团队投入均值 复选框
$('#averageChk').on('ifChanged', function () {
    if ($('#averageChk').is(':checked')) {
        option.series[0].markLine.data.push({
            type: 'average',
            name: '团队投入均值',
            lineStyle: {
                normal: {
                    color: 'gray',
                    type: 'solid',
                    width: 4
                }
            },
            label: {
                normal: {
                    show: true,
                    position: 'middle',
                    formatter: function (params) {
                        return params.name + ':' + params.value + 'h';
                    }
                }
            }
        });
        myChart.setOption(option);
    } else {
        var dataArray = [];
        dataArray = option.series[0].markLine.data;
        var dataArrayNew = _.remove(dataArray, function (n) {
            return n.name == '团队投入均值';
        });
        debugger;
        myChart.setOption(option);
    }
});

//点击 组织资源基准值 复选框
$('#baseSpentChk').on('ifChanged', function () {
    if ($('#baseSpentChk').is(':checked')) {
        option.series[0].markLine.data.push({
            name: '组织资源基准值',
            yAxis: Number($('#baseSpent').val()),
            lineStyle: {
                normal: {
                    color: 'green',
                    type: 'solid',
                    width: 4
                }
            },
            label: {
                normal: {
                    show: true,
                    position: 'middle',
                    formatter: function (params) {
                        return params.name + ':' + params.value + 'h';
                    }
                }
            }
        });
        myChart.setOption(option);
    } else {
        var dataArray = [];
        dataArray = option.series[0].markLine.data;
        _.remove(dataArray, function (n) {
            return n.name == '组织资源基准值';
        });
        myChart.setOption(option);
    }
});