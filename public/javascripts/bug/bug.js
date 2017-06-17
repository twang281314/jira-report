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



      // select2
      $("#reportTypeList").select2({
          data: [{
              'id': 'reporter',
              'text': '报告人'
          }, {
              'id': 'assignee',
              'text': '经办人'
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

  var option = {

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
  myChart.setOption(option);

  function searchBugReport() {

      var filterId = $('#filterList').val();
      var reportType = $('#reportTypeList').val();
      var bugCreatedTimeBegain = $('#bugCreatedTimeBegain').val();
      var bugCreatedTimeEnd = $('#bugCreatedTimeEnd').val();

      $.ajax({
          url: 'api/getBugReportData',
          type: 'post',
          data: {
              bugCreatedTimeBegain: bugCreatedTimeBegain,
              bugCreatedTimeEnd: bugCreatedTimeEnd,
              reportType: reportType,
              filterId: filterId
          },
          dataType: 'json',
          success: function (response) {

              if (response.success) {

                  option.xAxis.data = response.data.userName;
                  option.series[0].data = response.data.bugSum;
                  myChart.setOption(option);
                  if (response.data.userName.length > 20) {
                      $('#mainChart').css('width', response.data.userName.length * 60);
                      myChart.resize();
                  }
              } else {
                  toastr.error(response.msg);
              }
          }
      });
  }