/*Copyright ©2017 TommyLemon(https://github.com/TommyLemon/APIJSONAuto)

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use JSONResponse file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.*/


/**parser for json response
 * @author Lemon
 */


//状态信息，非GET请求获得的信息<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

const CODE_SUCCESS = 200; //成功
const CODE_UNSUPPORTED_ENCODING = 400; //编码错误
const CODE_ILLEGAL_ACCESS = 401; //权限错误
const CODE_UNSUPPORTED_OPERATION = 403; //禁止操作
const CODE_NOT_FOUND = 404; //未找到
const CODE_ILLEGAL_ARGUMENT = 406; //参数错误
const CODE_NOT_LOGGED_IN = 407; //未登录
const CODE_TIME_OUT = 408; //超时
const CODE_CONFLICT = 409; //重复，已存在
const CODE_CONDITION_ERROR = 412; //条件错误，如密码错误
const CODE_UNSUPPORTED_TYPE = 415; //类型错误
const CODE_OUT_OF_RANGE = 416; //超出范围
const CODE_NULL_POINTER = 417; //对象为空
const CODE_SERVER_ERROR = 500; //服务器内部错误


const MSG_SUCCEED = "success"; //成功
const MSG_SERVER_ERROR = "Internal Server Error!"; //服务器内部错误


const KEY_CODE = "code";
const KEY_MSG = "msg";
const KEY_ID = "id";
const KEY_ID_IN = KEY_ID + "{}";
const KEY_COUNT = "count";
const KEY_TOTAL = "total";

var JSONResponse = {
  TAG: 'JSONResponse',

  /**是否成功
   * @param code
   * @return
   */
  isSuccess: function(code) {
    return code == CODE_SUCCESS;
  },

  /**校验服务端是否存在table
   * @param count
   * @return
   */
  isExist: function(count) {
    return count > 0;
  },





  /**格式化key名称
   * @param object
   * @return
   */
  formatObject: function(object) {
    //太长查看不方便，不如debug	 log(JSONResponse.TAG, "format  object = \n" + JSON.toJSONString(object));
    if (object == null || object == '') {
      log(JSONResponse.TAG, "format  object == null || object == '' >> return object;");
      return object;
    }
    var formattedObject = {};

    var value;
    for (var key in object) {
      value = object[key];

      if (value instanceof Array) { // JSONArray，遍历来format内部项
        formattedObject[JSONResponse.replaceArray(key)] = JSONResponse.formatArray(value);
      }
      else if (value instanceof Object) { // JSONObject，往下一级提取
        formattedObject[JSONResponse.getSimpleName(key)] = JSONResponse.formatObject(value);
      }
      else { // 其它Object，直接填充
        formattedObject[JSONResponse.getSimpleName(key)] = value;
      }
    }

    //太长查看不方便，不如debug	 log(JSONResponse.TAG, "format  return formattedObject = " + JSON.toJSONString(formattedObject));
    return formattedObject;
  },

  /**格式化key名称
   * @param array
   * @return
   */
  formatArray: function(array) {
    //太长查看不方便，不如debug	 log(JSONResponse.TAG, "format  array = \n" + JSON.toJSONString(array));
    if (array == null || array == '') {
      log(JSONResponse.TAG, "format  array == null || array == '' >> return array;");
      return array;
    }
    var formattedArray = [];

    var value;
    for (var i = 0; i < array.length; i++) {
      value = array[i];
      if (value instanceof Array) { // JSONArray，遍历来format内部项
        formattedArray.push(JSONResponse.formatArray(value));
      }
      else if (value instanceof Object) { // JSONObject，往下一级提取
        formattedArray.push(JSONResponse.formatObject(value));
      }
      else { // 其它Object，直接填充
        formattedArray.push(value);
      }
    }

    //太长查看不方便，不如debug	 log(JSONResponse.TAG, "format  return formattedArray = " + JSON.toJSONString(formattedArray));
    return formattedArray;
  },

  /**替换key+KEY_ARRAY为keyList
   * @param key
   * @return getSimpleName(isArrayKey(key) ? getArrayKey(...) : key) {@link #getSimpleName(String)}
   */
  replaceArray: function(key) {
    if (JSONObject.isArrayKey(key)) {
      key = JSONResponse.getArrayKey(key.substring(0, key.lastIndexOf('[]')));
    }
    return JSONResponse.getSimpleName(key);
  },
  /**获取列表变量名
   * @param key => getNoBlankString(key)
   * @return empty ? "list" : key + "List" 且首字母小写
   */
  getArrayKey: function(key) {
    return StringUtil.addSuffix(key, "List");
  },

  /**获取简单名称
   * @param fullName name 或 name:alias
   * @return name => name; name:alias => alias
   */
  getTableName: function(fullName) {
    //key:alias  -> alias; key:alias[] -> alias[]
    var index = fullName == null ? -1 : fullName.indexOf(":");
    return index < 0 ? fullName : fullName.substring(0, index);
  },

  /**获取简单名称
   * @param fullName name 或 name:alias 或 User-name 或 User-name:alias
   * @return name => name; name:alias 或 User-name:alias => alias; User-name => userName
   */
  getSimpleName: function(fullName) {
    //key:alias -> alias
    var index = fullName == null ? -1 : fullName.indexOf(":");
    if (index >= 0) {
      return fullName.substring(index + 1);
    }

    var left = index < 0 ? fullName : fullName.substring(0, index);

    var first = true;
    var name = '';
    var part;
    do {
      index = left.indexOf("-");
      part = index < 0 ? left : left.substring(0, index);

      name += StringUtil.firstCase(part, ! first);
      left = left.substring(index + 1);

      first = false;
    }
    while (index >=0)

    return name;
  },



  COMPARE_NO_STANDARD: -1,
  COMPARE_EQUAL: 0,
  COMPARE_KEY_MORE: 1,
  COMPARE_VALUE_CHANGE: 2,
  COMPARE_KEY_LESS: 3,
  COMPARE_TYPE_CHANGE: 4,
  COMPARE_NUMBER_TYPE_CHANGE: 3,
  COMPARE_CODE_CHANGE: 4,

  /**测试compare: 对比 新的请求与上次请求的结果
   0-相同，无颜色；
   1-对象新增字段或数组新增值，绿色；
   2-值改变，蓝色；
   3-对象缺少字段/整数变小数，黄色；
   4-code/值类型 改变，红色；
   */
  compareResponse: function(target, real) {
    if (target == null || target.code == null) {
      return JSONResponse.COMPARE_NO_STANDARD; //未上传对比标准（正确的结果）
    }
    if (target.code != real.code) {
      return JSONResponse.COMPARE_CODE_CHANGE;
    }

    delete target.code;
    delete real.code;

    //可能提示语变化，也要提示
    // delete target.msg;
    // delete real.msg;

    return JSONResponse.compare(target, real);
  },

  /**测试compare: 对比 新的请求与上次请求的结果
   0-相同，无颜色；
   1-新增字段/新增值，绿色；
   2-值改变，蓝色；
   3-缺少字段/整数变小数，黄色；
   4-类型/code 改变，红色；
   */
  compare: function(target, real) {
    if (target == null) {
      return real == null ? JSONResponse.COMPARE_EQUAL : JSONResponse.COMPARE_KEY_MORE;
    }
    if (real == null) { //少了key
      return JSONResponse.COMPARE_KEY_LESS;
    }

    var type = typeof target;
    if (type != typeof real) { //类型改变
      return JSONResponse.COMPARE_TYPE_CHANGE;
    }

    var max = JSONResponse.COMPARE_EQUAL;
    var each = JSONResponse.COMPARE_EQUAL;
    if (target instanceof Array) { // JSONArray
      var all = target[0];
      for (var i = 1; i < length; i++) { //合并所有子项, Java类型是稳定的，不会出现两个子项间同名字段对应值类型不一样
        all = JSONResponse.deepMerge(all, target[i]);
      }
      //下载需要看源JSON  real = [all];

      each = JSONResponse.compare(target[0], all);

      if (max < each) {
        max = each;
      }

      if (max < JSONResponse.COMPARE_VALUE_CHANGE) {
        if (target.length != real.length || (JSON.stringify(target) != JSON.stringify(real))) {
          max = JSONResponse.COMPARE_VALUE_CHANGE;
        }
      }
    }
    else if (target instanceof Object) { // JSONObject
      var tks = Object.keys(target);
      var key;
      for (var i = 0; i< tks.length; i++) { //遍历并递归下一层
        key = tks[i];
        if (key == null) {
          continue;
        }

        each = JSONResponse.compare(target[key], real[key]);
        if (max < each) {
          max = each;
        }
        if (max >= JSONResponse.COMPARE_TYPE_CHANGE) {
          break;
        }
      }


      if (max < JSONResponse.COMPARE_KEY_MORE) { //多出key
        for (var k in real) {
          if (k != null && tks.indexOf(k) < 0) {
            max = JSONResponse.COMPARE_KEY_MORE;
          }
        }
      }
    }
    else { // Boolean, Number, String
      if (type == 'number') { //数字类型由整数变为小数
        if (String(target).indexOf('.') < 0 && String(real).indexOf('.') >= 0) {
          return JSONResponse.COMPARE_NUMBER_TYPE_CHANGE;
        }
      }

      if (target !== real) { //值不同
        return JSONResponse.COMPARE_VALUE_CHANGE;
      }
    }

    return max;
  },

  deepMerge: function(left, right) {
    if (left == null) {
      return right;
    }
    if (right == null) {
      return left;
    }

    if (right instanceof Array) {
      var lfirst = left[0];
      if (lfirst instanceof Object) {
        for (var i = 1; i < left.length; i++) {
          lfirst = JSONResponse.deepMerge(lfirst, left[i]);
        }
      }

      var rfirst = right[0];
      if (rfirst instanceof Object) {
        for (var i = 1; i < right.length; i++) {
          rfirst = JSONResponse.deepMerge(rfirst, right[i]);
        }
      }

      var m = JSONResponse.deepMerge(lfirst, rfirst);

      return m == null ? [] : [ m ];
    }

    if (right instanceof Object) {
      var m = JSON.parse(JSON.stringify(left));
      for (var k in right) {
        m[k] = JSONResponse.deepMerge(m[k], right[k]);
      }
      return m;
    }

    return left;
  }


}