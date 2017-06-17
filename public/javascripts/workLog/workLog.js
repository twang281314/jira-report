 function showWorkLogDetail(guid, name) {

     var details = JSON.parse(decodeURIComponent($('#' + guid).html()));
     var workLogDetailArray = details.details;

     var dataSet = [];
     var issueIds = [];

     details.details.forEach(function (item) {
         var obj = {};
         obj.issueId = item.issueId;
         obj.updated = moment(item.updated).format('YYYY-MM-DD HH:MM:ss');
         obj.comment = item.comment || '';
         obj.timeSpendSeconds = item.timeSpendSeconds + 'h';
         issueIds.push(item.issueId);
         dataSet.push(obj);
     });

     //通过issueId获取issueKey,生成超链接
     $.ajax({
         type: "post",
         url: "api/getIssueKeysByIssueIds",
         data: {
             issueIds: issueIds.join(',')
         },
         dataType: "json",
         success: function (response) {
             if (response.success) {

                 dataSet.forEach(function (item) {
                     item.issueKey = _.find(response.data, function (value) {
                         return value.issueId == item.issueId;
                     }).issueKey;
                 });

                 $('#workLogDetail').html('<table id="tableWorklog"  class="table table-bordered table-striped " width="100%"></table>');

                 $('#tableWorklog').DataTable({
                     paging: false,
                     searching: false,
                     info: false,
                     sort: false,
                     data: dataSet,
                     columns: [{
                         data: "issueKey",
                         title: "关键字"
                     }, {
                         data: "updated",
                         title: "日期"
                     }, {
                         data: "comment",
                         title: "描述"
                     }, {
                         data: "timeSpendSeconds",
                         title: "已用"
                     }],
                     columnDefs: [{
                         targets: [0],
                         width: '80px',
                         render: function (data, type, full, meta) {
                             return '<a href="http://jira.iscs.com.cn/browse/' + data + '" target="_blank">' + data + '</a>';
                         }
                     }, {
                         targets: [3],
                         width: '30px'
                     }]
                 });

                 layer.open({
                     title: "查看详情-" + name,
                     area: ['800px'],
                     type: 1,
                     scrollbar: false,
                     content: $('#workLogDetail')
                 });
             } else {
                 toastr.error(response.msg);
             }
         }
     });
 }

 //查询按钮
 function searchWorkLogReport() {
     var workStartTimeBegain = $('#workStartTimeBegain').val();
     var workStartTimeEnd = $('#workStartTimeEnd').val();
     var userName = $('#userList').val();
     var groupName = $('#groupList').val();
     Pace.start();
     $.ajax({
         type: "post",
         url: "api/getWorkLogReportData",
         data: {
             userName: userName,
             groupName: groupName,
             workStartTimeBegain: workStartTimeBegain,
             workStartTimeEnd: workStartTimeEnd
         },
         dataType: "json",
         success: function (response) {

             if (response.success) {
                 response.data.columnDefs.forEach(function (item) {
                     item.render = function (data, type, full, meta) {
                      
                         if (type == "display") { //只在显示时需要格式化
                             if (item.type == 'date') {
                                 var str = encodeURIComponent(JSON.stringify(full[item.columnName]));
                                 var guid = item.columnName + "_" + meta.row;
                                 if (data) {
                                     //  return data;
                                     return '<a href="javascript:void(0)" onclick="showWorkLogDetail(\'' + guid + '\',\'' + full.displayName + '\')">' +
                                         data + '</a><div id=\"' + guid + '\" style="display:none" >' + str + '</div>';
                                 } else {
                                     return data;
                                 }
                             } else if (item.type == 'name') {
                                 if (full.avatarUrl) {
                                     return "<img src='" + full.avatarUrl + "' width='16' height='16'/>" + ' ' + data;
                                 }
                                 return "<img src='http://jira.iscs.com.cn/secure/useravatar?size=xsmall&avatarId=10122'width='16' height='16'/>" + data;
                             } else {
                                 return data;
                             }
                         }
                         return data;
                     };
                 });

                 $('#tableDiv').html('<table id="workLogReport" class="table table-bordered table-striped"> </table>');
                 var table = $('#workLogReport').DataTable({
                     language: {
                         url: '/plugins/datatables/i18n/zh-CN.json'
                     },
                     ordering: true,
                     fixedColumns: true,
                     processing: true,
                     //  scrollY: "300px",
                     scrollX: true,
                     data: response.data.data,
                     columns: response.data.columns,
                     columnDefs: response.data.columnDefs

                 });
                 new $.fn.dataTable.FixedColumns(table, {
                     leftColumns: 2,
                     rightColumns: 0
                 });
                 Pace.stop();
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
         autoclose: true, //选择之后是否关闭日期选项
         todayHighlight: true, //当为true的时候高亮
         keyboardNavigation: true,
     });

     $('#workStartTimeBegain').val(moment().add(-7, 'days').format('YYYY-MM-DD'));
     $('#workStartTimeEnd').val(moment().format('YYYY-MM-DD'));

     searchWorkLogReport();
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

 function formatRepo(repo) {
     if (repo.loading) return repo.name;

     repo.text = repo.html;
     repo.id = repo.name;

     var markup = '<div class="clearfix">' +
         '<div">' + repo.displayName + '</div>' +
         '<div>' + repo.html + '</div>' +
         '</div>';
     return markup;
 }

 function formatRepoSelection(repo) {
     return repo.name || repo.key;
 }

 $("#userList").select2({
     placeholder: '请选择用户',
     language: "zh-CN",
     allowClear: true,
     ajax: {
         url: "api/getUserList",
         dataType: 'json',
         delay: 250,
         data: function (params) {
             return {
                 q: params.term
             };
         },
         processResults: function (data, params) {
             return {
                 results: data.items
             };
         },
         cache: true
     },
     escapeMarkup: function (markup) {
         return markup;
     },
     minimumInputLength: 1,
     templateResult: formatRepo,
     templateSelection: formatRepoSelection
 });