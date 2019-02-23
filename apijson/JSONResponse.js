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
        formattedObject[JSONResponse.formatArrayKey(key)] = JSONResponse.formatArray(value);
      }
      else if (value instanceof Object) { // JSONObject，往下一级提取
        formattedObject[JSONResponse.formatObjectKey(key)] = JSONResponse.formatObject(value);
      }
      else { // 其它Object，直接填充
        formattedObject[JSONResponse.formatOtherKey(key)] = value;
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

  /**获取简单名称
   * @param fullName name 或 name:alias
   * @return name => name; name:alias => alias
   */
  getTableName: function(fullName) {
    //key:alias  -> alias; key:alias[] -> alias[]
    var index = fullName == null ? -1 : fullName.indexOf(":");
    return index < 0 ? fullName : fullName.substring(0, index);
  },

  /**获取变量名
   * @param fullName
   * @return {@link #formatKey(String, boolean, boolean, boolean)} formatColon = true, formatAt = true, formatHyphen = true, firstCase = true
   */
  getVariableName(fullName) {
    if (JSONObject.isArrayKey(fullName)) {
      fullName = StringUtil.addSuffix(fullName.substring(0, fullName.length - 2), "list");
    }
    return JSONResponse.formatKey(fullName, true, true, true, true);
  },

  /**格式化数组的名称 key[] => keyList; key:alias[] => aliasList; Table-column[] => tableColumnList
   * @param key empty ? "list" : key + "List" 且首字母小写
   * @return {@link #formatKey(String, boolean, boolean, boolean)} formatColon = false, formatAt = true, formatHyphen = true, firstCase = true
   */
  formatArrayKey(key) {
    if (JSONObject.isArrayKey(key)) {
      key = StringUtil.addSuffix(key.substring(0, key.length - 2), "list");
    }
    var index = key == null ? -1 : key.indexOf(":");
    if (index >= 0) {
      return key.substring(index + 1); //不处理自定义的
    }

    return JSONResponse.formatKey(key, false, true, true, true); //节约性能，除了表对象 Table-column:alias[] ，一般都符合变量命名规范
  },

  /**格式化对象的名称 name => name; name:alias => alias
   * @param key name 或 name:alias
   * @return {@link #formatKey(String, boolean, boolean, boolean)} formatColon = false, formatAt = true, formatHyphen = false, firstCase = true
   */
  formatObjectKey(key) {
    var index = key == null ? -1 : key.indexOf(":");
    if (index >= 0) {
      return key.substring(index + 1); //不处理自定义的
    }

    return JSONResponse.formatKey(key, false, true, false, true); //节约性能，除了表对象 Table:alias ，一般都符合变量命名规范
  },

  /**格式化普通值的名称 name => name; name:alias => alias
   * @param fullName name 或 name:alias
   * @return {@link #formatKey(String, boolean, boolean, boolean)} formatColon = false, formatAt = true, formatHyphen = false, firstCase = false
   */
  formatOtherKey(fullName) {
    return JSONResponse.formatKey(fullName, false, true, false, false); //节约性能，除了关键词 @key ，一般都符合变量命名规范，不符合也原样返回便于调试
  },

  /**格式化名称
   * @param fullName name 或 name:alias
   * @param formatAt 去除前缀 @ ， @a => a
   * @param formatColon 去除分隔符 : ， A:b => b
   * @param formatHyphen 去除分隔符 - ， A-b-cd-Efg => aBCdEfg
   * @param firstCase 第一个单词首字母小写，后面的首字母大写， Ab => ab ; A-b-Cd => aBCd
   * @return name => name; name:alias => alias
   */
  formatKey(fullName, formatColon, formatAt, formatHyphen, firstCase) {
    if (fullName == null) {
      log(TAG, "formatKey  fullName == null >> return null;");
      return null;
    }

    if (formatColon) {
      fullName = JSONResponse.formatColon(fullName);
    }
    if (formatAt) { //关键词只去掉前缀，不格式化单词，例如 @a-b 返回 a-b ，最后不会调用 setter
      fullName = JSONResponse.formatAt(fullName);
    }
    if (formatHyphen) {
      fullName = JSONResponse.formatHyphen(fullName, firstCase);
    }

    return firstCase ? StringUtil.firstCase(fullName) : fullName; //不格式化普通 key:value (value 不为 [], {}) 的 key
  },

  /**"@key" => "key"
   * @param key
   * @return
   */
  formatAt(key) {
    var k = key.startsWith("@") ? key.substring(1) : key;
    return k.endsWith("@") ? k.substring(0, k.length - 1) : k;
  },
  /**key:alias => alias
   * @param key
   * @return
   */
  formatColon(key) {
    var index = key.indexOf(":");
    return index < 0 ? key : key.substring(index + 1);
  },

  /**A-b-cd-Efg => ABCdEfg
   * @param key
   * @return
   */
  formatHyphen(key, firstCase) {
    var first = true;
    var index;

    var name = "";
    var part;
    do {
      index = key.indexOf("-");
      part = index < 0 ? key : key.substring(0, index);

      name += firstCase && first == false ? StringUtil.firstCase(part, true) : part;
      key = key.substring(index + 1);

      first = false;
    }
    while (index >= 0);

    return name;
  },


  COMPARE_NO_STANDARD: -1,
  COMPARE_EQUAL: 0,
  COMPARE_KEY_MORE: 1,
  COMPARE_LENGTH_CHANGE: 2,
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
  compareResponse: function(target, real, folder, isMachineLearning) {
    if (target == null || target.code == null) {
      return {
        code: JSONResponse.COMPARE_NO_STANDARD, //未上传对比标准
        msg: '没有校验标准！',
        path: folder == null ? '' : folder
      };
    }
    if (target.code != real.code) {
      return {
        code: JSONResponse.COMPARE_CODE_CHANGE,
        msg: '状态码改变！',
        path: folder == null ? '' : folder
      };
    }

    var tCode = target.code;
    var rCode = real.code;

    delete target.code;
    delete real.code;

    //可能提示语变化，也要提示
    // delete target.msg;
    // delete real.msg;

    var result = JSONResponse.compareWithBefore(target, real, folder);

    target.code = tCode;
    real.code = rCode;

    return result;
  },

  /**测试compare: 对比 新的请求与上次请求的结果
   0-相同，无颜色；
   1-新增字段/新增值，绿色；
   2-值改变，蓝色；
   3-缺少字段/整数变小数，黄色；
   4-类型/code 改变，红色；
   */
  compareWithBefore: function(target, real, folder) {
    folder = folder == null ? '' : folder;

    if (target == null) {
      return {
        code: real == null ? JSONResponse.COMPARE_EQUAL : JSONResponse.COMPARE_KEY_MORE,
        msg: real == null ? '结果正确' : '是新增的',
        path: real == null ? '' : folder,
        value: real
      };
    }
    if (real == null) { //少了key
      return {
        code: JSONResponse.COMPARE_KEY_LESS,
        msg: '是缺少的',
        path: folder,
        value: real
      };
    }

    var type = typeof target;
    if (type != typeof real) { //类型改变
      return {
        code: JSONResponse.COMPARE_TYPE_CHANGE,
        msg: '值改变',
        path: folder,
        value: real
      };
    }

    // var max = JSONResponse.COMPARE_EQUAL;
    // var each = JSONResponse.COMPARE_EQUAL;

    var max = {
      code: JSONResponse.COMPARE_EQUAL,
      msg: '结果正确',
      path: '', //导致正确时也显示 folder,
      value: null //导致正确时也显示  real
    };

    var each;

    if (target instanceof Array) { // JSONArray
      var all = target[0];
      for (var i = 1; i < length; i++) { //合并所有子项, Java类型是稳定的，不会出现两个子项间同名字段对应值类型不一样
        all = JSONResponse.deepMerge(all, target[i]);
      }
      //下载需要看源JSON  real = [all];

      each = JSONResponse.compareWithBefore(target[0], all, JSONResponse.getAbstractPath(folder, i));

      if (max.code < each.code) {
        max = each;
      }

      if (max.code < JSONResponse.COMPARE_VALUE_CHANGE) {
        if (target.length != real.length || (JSON.stringify(target) != JSON.stringify(real))) {
          max.code = JSONResponse.COMPARE_VALUE_CHANGE;
          max.msg = '值改变';
          max.path = folder;
          max.value = real;
        }
      }
    }
    else if (target instanceof Object) { // JSONObject
      var tks = Object.keys(target);
      var key;
      for (var i = 0; i < tks.length; i++) { //遍历并递归下一层
        key = tks[i];
        if (key == null) {
          continue;
        }

        each = JSONResponse.compareWithBefore(target[key], real[key], JSONResponse.getAbstractPath(folder, key));
        if (max.code < each.code) {
          max = each;
        }
        if (max.code >= JSONResponse.COMPARE_TYPE_CHANGE) {
          break;
        }
      }


      if (max.code < JSONResponse.COMPARE_KEY_MORE) { //多出key
        for (var k in real) {
          if (k != null && tks.indexOf(k) < 0) {
            max.code = JSONResponse.COMPARE_KEY_MORE;
            max.msg = '是新增的';
            max.path = JSONResponse.getAbstractPath(folder,  k);
            max.value = real[k];
            break;
          }
        }
      }
    }
    else { // Boolean, Number, String
      if (type == 'number') { //数字类型由整数变为小数
        if (String(target).indexOf('.') < 0 && String(real).indexOf('.') >= 0) {
          max.code = JSONResponse.COMPARE_NUMBER_TYPE_CHANGE;
          max.msg = '整数变小数';
          max.path = folder;
          max.value = real;
        }
      }

      if (max.code < JSONResponse.COMPARE_VALUE_CHANGE && target !== real) { //值不同
        max.code = JSONResponse.COMPARE_VALUE_CHANGE;
        max.msg = '值改变';
        max.path = folder;
        max.value = real;
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
  },


  getAbstractPath: function (folder, name) {
    folder = folder == null ? '' : folder;
    name = name == null ? '' : name; //导致 0 变为 ''   name = name || '';
    return StringUtil.isEmpty(folder, true) ? name : folder + '/' + name;
  },

  getShowString(arr) {
    if (arr == null || arr.length <= 0) {
      return '';
    }
    return arr.join();
  },

  log(msg) {
    // console.log(msg);
  }

}