  $(function () {
      //Date picker
      $('#bugCreatedTimeBegain').datepicker({
          language: 'zh-CN',
          autoclose: true
      });
      $('#bugCreatedTimeEnd').datepicker({
          language: 'zh-CN',
          autoclose: true, //选择之后是否关闭日期选项
          todayHighlight: true, //当为true的时候高亮
          keyboardNavigation: true,
      });

      $('#bugCreatedTimeBegain').val(moment().add(-7, 'days').format('YYYY-MM-DD'));
      $('#bugCreatedTimeEnd').val(moment().format('YYYY-MM-DD'));

      $("#chartTypeList").select2({
          data: [{
              'id': 'pie',
              'text': '饼图'
          }, {
              'id': 'bar',
              'text': '柱状图'
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
              searchBugReport();
          }
      });


  });



  // 初始化echarts图表
  var myChart = echarts.init(document.getElementById('mainChart'), 'iscs');

  var optionPie = {
      title: {
          text: 'Bug状态统计',
          subtext: '',
          x: 'center'
      },
      toolbox: {
          feature: {
              saveAsImage: {
                  show: true
              }
          }
      },
      tooltip: {
          trigger: 'item',
          formatter: "{a} <br/>{b} : {c} ({d}%)"
      },
      legend: {
          orient: 'vertical',
          left: 'left',
          data: []
      },
      series: [{
          name: 'Bug数量',
          type: 'pie',
          radius: '55%',
          center: ['50%', '60%'],
          data: [],
          itemStyle: {
              emphasis: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
          }
      }]
  };

  var option = {

      tooltip: {
          trigger: 'axis',
          axisPointer: { // 坐标轴指示器，坐标轴触发有效
              type: 'shadow' // 默认为直线，可选为：'line' | 'shadow'
          }
      },
      toolbox: {
          feature: {
              magicType: {
                  show: true,
                  type: ['line', 'bar']
              },
              saveAsImage: {
                  show: true
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
          data: [],
          axisTick: {
              alignWithLabel: true
          }
      },
      yAxis: [{
          type: 'value'
      }],
      series: [{
          name: 'bug数量',
          type: 'bar',
          data: []
      }]
  };


  // 为echarts对象加载数据 
  myChart.setOption(optionPie);

  function searchBugReport() {

      var filterId = $('#filterList').val();
      var chartType = $('#chartTypeList').val();
      var bugCreatedTimeBegain = $('#bugCreatedTimeBegain').val();
      var bugCreatedTimeEnd = $('#bugCreatedTimeEnd').val();

      $.ajax({
          url: 'api/getBugStatusReportData',
          type: 'post',
          data: {
              bugCreatedTimeBegain: bugCreatedTimeBegain,
              bugCreatedTimeEnd: bugCreatedTimeEnd,
              filterId: filterId
          },
          dataType: 'json',
          success: function (response) {

              if (response.success) {

                  optionPie.series[0].data = response.data.pieData;
                  optionPie.legend.data = response.data.statusName;
                  option.xAxis.data = response.data.statusName;
                  option.series[0].data = response.data.bugSum;

                  if (chartType == 'pie') {
                      myChart.clear();
                      myChart.setOption(optionPie);
                  } else {
                      myChart.clear();
                      myChart.setOption(option);
                      if (response.data.statusName.length > 20) {
                          $('#mainChart').css('width', response.data.userName.length * 60);
                          myChart.resize();
                      }
                  }

              } else {
                  toastr.error(response.msg);
              }
          }
      });
  }

  //图表类型 改变
  $('#chartTypeList').on('change', function (evt) {

      var chartType = $('#chartTypeList').val();

      if (chartType == 'pie') {
          myChart.clear();
          myChart.setOption(optionPie);
      } else {
          myChart.clear();
          myChart.setOption(option);
      }
  });