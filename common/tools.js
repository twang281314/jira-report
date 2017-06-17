/**
 * 工具方法
 */

'use strict';
var _this = this;

/**
 * 对象数组快速排序
 *
 * @param arr Array 对象数组
 * @param key string 用于排序的属性
 * @param dir asc升序、desc降序
 *
 * @example:
 * sort([{name:'b',id:12},{name:'c',id:21},{name:'a',id:2}],'id')
 * sort([{name:'b',id:12},{name:'c',id:21},{name:'a',id:2}],'id','asc')
 * sort([{name:'b',id:12},{name:'c',id:21},{name:'a',id:2}],'id','desc')
 */
exports.sortObj = function(arr, key, dir) {
    key = key || 'id';
    dir = dir || 'asc';
    if (arr.length == 0) return [];

    var left = new Array();
    var right = new Array();
    var pivot = arr[0][key]; //分割值
    var pivotObj = arr[0]; //存储值

    if (dir === 'asc') { //升序
        for (var i = 1; i < arr.length; i++) {
            arr[i][key] < pivot ? left.push(arr[i]) : right.push(arr[i]);
        }
    } else { //降序
        for (var i = 1; i < arr.length; i++) {
            arr[i][key] > pivot ? left.push(arr[i]) : right.push(arr[i]);
        }
    }
    return _this.sortObj(left, key, dir).concat(pivotObj, _this.sortObj(right, key, dir));
}