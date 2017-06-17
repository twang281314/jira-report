/** 
 * 故事冲刺进度
 */

Date.prototype.Format = function(formatStr) {
    var str = formatStr;
    var Week = ['日', '一', '二', '三', '四', '五', '六'];

    str = str.replace(/yyyy|YYYY/, this.getFullYear());
    str = str.replace(/yy|YY/, (this.getYear() % 100) > 9 ? (this.getYear() % 100).toString() : '0' + (this.getYear() % 100));

    str = str.replace(/MM/, this.getMonth() > 9 ? this.getMonth().toString() : '0' + this.getMonth());
    str = str.replace(/M/g, this.getMonth());

    str = str.replace(/w|W/g, Week[this.getDay()]);

    str = str.replace(/dd|DD/, this.getDate() > 9 ? this.getDate().toString() : '0' + this.getDate());
    str = str.replace(/d|D/g, this.getDate());

    str = str.replace(/hh|HH/, this.getHours() > 9 ? this.getHours().toString() : '0' + this.getHours());
    str = str.replace(/h|H/g, this.getHours());
    str = str.replace(/mm/, this.getMinutes() > 9 ? this.getMinutes().toString() : '0' + this.getMinutes());
    str = str.replace(/m/g, this.getMinutes());

    str = str.replace(/ss|SS/, this.getSeconds() > 9 ? this.getSeconds().toString() : '0' + this.getSeconds());
    str = str.replace(/s|S/g, this.getSeconds());

    return str;
}
var da = new Date(1470344058127).Format("yyyy-MM-dd hh:mm:ss");
console.log(da);


// 初始化echarts图表
var myChart = echarts.init(document.getElementById('mainChart'), 'iscs-theme');
var xAxisdData = [];
var seriesData = [];
var y = 0;

//查询JIRA数据
searchReport = function() {
    //第一次加载设置默认显示
    if (y == 0) {
        var filterId = "10703";
        y = 1;
    } else {
        var filterId = $("#filterList").val();
    }
    $.ajax({
        url: 'api/getStoryReportData',
        method: 'post',
        data: {
            filterId: filterId
        },
        success: function(response) {
            xAxisdData = response.xAxisd;
            seriesData = response.seriesd;
            // 为echarts对象加载数据 
            myChart.setOption({
                title: {
                    text: '故事冲刺进度',
                    // subtext:'原过滤器名：XDW-Sprint2用户故事',
                    x: 'left',
                    align: 'right'
                },
                toolbox: {
                    feature: {
                        magicType: {show: true, type: ['line', 'bar']},
                        saveAsImage: {show: true}
                    }
                },
                color: ['#3398DB'],
                tooltip: {
                    trigger: 'axis',
                    axisPointer: { // 坐标轴指示器，坐标轴触发有效
                        type: 'shadow' // 默认为直线，可选为：'line' | 'shadow'
                    }
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true
                },

                xAxis: [{
                    type: 'value',
                    axisLabel: {
                        formatter: '{value} %'
                    }
                }],
                yAxis: [{
                    type: 'category',
                    data: xAxisdData,
                    axisTick: {
                        alignWithLabel: true
                    }

                }],
                series: [{
                    name: '故事进度(%)',
                    type: 'bar',
                    barWidth: '60%',
                    data: seriesData
                }]

            });
        }
    });

}
// select2
$.ajax({
    url: 'api/getFavoriteFilters',
    method: 'get',
    dataType: 'json',
    success: function(data) {
        $("#filterList").select2({
            data: data,
            placeholder: '请选择过滤器',
            allowClear: true
        })
    }
});

searchReport();