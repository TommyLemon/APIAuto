/*Copyright ©2017 TommyLemon(https://github.com/TommyLemon/CVAuto)

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

if (typeof window == 'undefined') {
  try {
    eval(`
      var StringUtil = require("./StringUtil");
      var JSONObject = require("./JSONObject");
      var JSONRequest = require("./JSONRequest");
      var CodeUtil = require("./CodeUtil");
    `)
  } catch (e) {
    console.log(e)
  }
}

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

var FORMAT_ANY = '';
var FORMAT_MONTH = 'YYYY-MM';
var FORMAT_DATE = 'YYYY-MM-DD';
var FORMAT_MINUTE = 'hh:mm';
var FORMAT_TIME = 'hh:mm:ss';
var FORMAT_DATETIME = 'YYYY-MM-DD hh:mm:ss';
var FORMAT_URL = 'URL';
var FORMAT_URI = 'URI';
var FORMAT_FILE_URI = 'file://a/b';
var FORMAT_HTTP = 'http://a.b';
var FORMAT_RPC = 'rpc://a.b';
var FORMAT_PATH = 'root/folder';
var FORMAT_PACKAGE = 'com.package';
var FORMAT_NAME = 'NAME';
var FORMAT_CONST_NAME = 'NAME:CONST';
var FORMAT_BIG_NAME = 'NAME:Big';
var FORMAT_SMALL_NAME = 'NAME:small';
var FORMAT_FILE = '.file';
var FORMAT_IMAGE = '.image';
var FORMAT_AUDIO = '.audio';
var FORMAT_VIDEO = '.video';
var FORMAT_IMAGE_HTTP = 'http://?.image';
var FORMAT_AUDIO_HTTP = 'http://?.audio';
var FORMAT_VIDEO_HTTP = 'http://?.video';
var FORMAT_IMAGE_FILE = 'file://?.image';
var FORMAT_AUDIO_FILE = 'file://?.audio';
var FORMAT_VIDEO_FILE = 'file://?.video';
var FORMAT_PRIORITY_ANY = 0;
var FORMAT_PRIORITY_MONTH = 3;
var FORMAT_PRIORITY_DATE = 2;
var FORMAT_PRIORITY_MINUTE = 3;
var FORMAT_PRIORITY_TIME = 2;
var FORMAT_PRIORITY_DATETIME = 1;
var FORMAT_PRIORITY_URL = 2;
var FORMAT_PRIORITY_URI = 1;
var FORMAT_PRIORITY_FILE_URI = 2;
var FORMAT_PRIORITY_HTTP = 2;
var FORMAT_PRIORITY_RPC = 2;
var FORMAT_PRIORITY_PATH = 1;
var FORMAT_PRIORITY_PACKAGE = 1;
var FORMAT_PRIORITY_NAME = 1;
var FORMAT_PRIORITY_CONST_NAME = 2;
var FORMAT_PRIORITY_BIG_NAME = 2;
var FORMAT_PRIORITY_SMALL_NAME = 2;
var FORMAT_PRIORITY_FILE = 1;
var FORMAT_PRIORITY_IMAGE = 2;
var FORMAT_PRIORITY_AUDIO = 2;
var FORMAT_PRIORITY_VIDEO = 2;
var FORMAT_PRIORITY_IMAGE_HTTP = 3;
var FORMAT_PRIORITY_AUDIO_HTTP = 3;
var FORMAT_PRIORITY_VIDEO_HTTP = 3;
var FORMAT_PRIORITY_IMAGE_FILE = 3;
var FORMAT_PRIORITY_AUDIO_FILE = 3;
var FORMAT_PRIORITY_VIDEO_FILE = 3;

var FORMAT_PRIORITIES = { // 在 JSONResponse 中定义，会导致存不进值，因为 FORMAT_ANY 等 key 还没初始化
  [FORMAT_ANY]: FORMAT_PRIORITY_ANY,
  [FORMAT_MONTH]: FORMAT_PRIORITY_MONTH,
  [FORMAT_DATE]: FORMAT_PRIORITY_DATE,
  [FORMAT_MINUTE]: FORMAT_PRIORITY_MINUTE,
  [FORMAT_TIME]: FORMAT_PRIORITY_TIME,
  [FORMAT_DATETIME]: FORMAT_PRIORITY_DATETIME,
  [FORMAT_URL]: FORMAT_PRIORITY_URL,
  [FORMAT_URI]: FORMAT_PRIORITY_URI,
  [FORMAT_FILE_URI]: FORMAT_PRIORITY_FILE_URI,
  [FORMAT_RPC]: FORMAT_PRIORITY_RPC,
  [FORMAT_HTTP]: FORMAT_PRIORITY_HTTP,
  [FORMAT_PATH]: FORMAT_PRIORITY_PATH,
  [FORMAT_PACKAGE]: FORMAT_PRIORITY_PACKAGE,
  [FORMAT_NAME]: FORMAT_PRIORITY_NAME,
  [FORMAT_BIG_NAME]: FORMAT_PRIORITY_BIG_NAME,
  [FORMAT_SMALL_NAME]: FORMAT_PRIORITY_SMALL_NAME,
  [FORMAT_PRIORITY_CONST_NAME]:  FORMAT_PRIORITY_CONST_NAME,
  [FORMAT_FILE]: FORMAT_PRIORITY_FILE,
  [FORMAT_IMAGE]: FORMAT_PRIORITY_IMAGE,
  [FORMAT_AUDIO]: FORMAT_PRIORITY_AUDIO,
  [FORMAT_VIDEO]: FORMAT_PRIORITY_VIDEO,
  [FORMAT_IMAGE_HTTP]: FORMAT_PRIORITY_IMAGE_HTTP,
  [FORMAT_AUDIO_HTTP]: FORMAT_PRIORITY_AUDIO_HTTP,
  [FORMAT_VIDEO_HTTP]: FORMAT_PRIORITY_VIDEO_HTTP,
  [FORMAT_IMAGE_FILE]: FORMAT_PRIORITY_IMAGE_FILE,
  [FORMAT_AUDIO_FILE]: FORMAT_PRIORITY_AUDIO_FILE,
  [FORMAT_VIDEO_FILE]: FORMAT_PRIORITY_VIDEO_FILE,
};

var FORMAT_VERIFIERS = {
  [FORMAT_IMAGE_HTTP]: StringUtil.isImageHttpUrl,
  [FORMAT_AUDIO_HTTP]: StringUtil.isAudioHttpUrl,
  [FORMAT_VIDEO_HTTP]: StringUtil.isVideoHttpUrl,
  [FORMAT_IMAGE_FILE]: StringUtil.isImageFilePath,
  [FORMAT_AUDIO_FILE]: StringUtil.isAudioFilePath,
  [FORMAT_VIDEO_FILE]: StringUtil.isVideoFilePath,
  [FORMAT_MONTH]: StringUtil.isMonth,
  [FORMAT_DATE]: StringUtil.isDate,
  [FORMAT_MINUTE]: StringUtil.isMinute,
  [FORMAT_TIME]: StringUtil.isTime,
  [FORMAT_DATETIME]: StringUtil.isDatetime,
  [FORMAT_FILE_URI]: StringUtil.isFileUri,
  [FORMAT_RPC]: StringUtil.isRpcUrl,
  [FORMAT_HTTP]: StringUtil.isHttpUrl,
  [FORMAT_URL]: StringUtil.isUrl,
  [FORMAT_URI]: StringUtil.isUri,
  [FORMAT_PATH]: StringUtil.isPath,
  [FORMAT_PACKAGE]: StringUtil.isPackage,
  [FORMAT_IMAGE]: StringUtil.isImage,
  [FORMAT_AUDIO]: StringUtil.isAudio,
  [FORMAT_VIDEO]: StringUtil.isVideo,
  [FORMAT_FILE]: StringUtil.isFile,
  [FORMAT_BIG_NAME]: StringUtil.isBigName,
  [FORMAT_SMALL_NAME]: StringUtil.isSmallName,
  [FORMAT_NAME]: StringUtil.isName,
};



function log(msg) {
  // console.log(msg);
}

var JSONResponse = {
  TAG: 'JSONResponse',

  KEY_CODE: 'code',
  KEY_MSG: 'msg',
  KEY_THROW: 'throw',
  CODE_SUCCESS: 200,
  /**是否成功
   * @param code
   * @return
   */
  isSuccess: function(obj) {
    if (obj == null) {
      return false
    }

    if (obj instanceof Array == false && obj instanceof Object) {
      return obj[JSONResponse.KEY_CODE] == JSONResponse.CODE_SUCCESS;
    }

    return obj == JSONResponse.CODE_SUCCESS
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
  getVariableName: function(fullName, listSuffix) {
    if (StringUtil.isEmpty(fullName, true)) {
       return null;
    }
    if (JSONObject.isArrayKey(fullName)) {
      fullName = StringUtil.addSuffix(fullName.substring(0, fullName.length - 2), listSuffix || "list");
    }
    var n = JSONResponse.formatKey(fullName, true, true, true, true, true, true);
    return /0-9/.test(n.substring(0, 1)) ? '_' + n : n;
  },

  /**格式化数组的名称 key[] => keyList; key:alias[] => aliasList; Table-column[] => tableColumnList
   * @param key empty ? "list" : key + "List" 且首字母小写
   * @return {@link #formatKey(String, boolean, boolean, boolean)} formatColon = false, formatAt = true, formatHyphen = true, firstCase = true
   */
  formatArrayKey: function(key) {
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
  formatObjectKey: function(key) {
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
  formatOtherKey: function(fullName) {
    return JSONResponse.formatKey(fullName, false, true, false, false); //节约性能，除了关键词 @key ，一般都符合变量命名规范，不符合也原样返回便于调试
  },

  /**格式化名称
   * @param fullName name 或 name:alias
   * @param formatAt 去除前缀 @ ， @a => a
   * @param formatAlias 去除别名分隔符 : ， A:b => AAsB
   * @param formatHyphen 去除分隔符 - ， A-b-cd-Efg => aBCdEfg
   * @param firstCase 第一个单词首字母小写，后面的首字母大写， Ab => ab ; A-b-Cd => aBCd
   * @return name => name; name:alias => alias
   */
  formatKey: function(fullName, formatAlias, formatAt, formatHyphen, firstCase, formatUnderline, formatFunChar) {
    if (fullName == null) {
      log(JSONResponse.TAG, "formatKey  fullName == null >> return null;");
      return null;
    }

    if (formatAlias) {
      fullName = JSONResponse.formatAlias(fullName);
    }
    if (formatAt) { //关键词只去掉前缀，不格式化单词，例如 @a-b 返回 a-b ，最后不会调用 setter
      fullName = JSONResponse.formatAt(fullName);
    }
    if (formatHyphen) {
      fullName = JSONResponse.formatHyphen(fullName, firstCase);
    }
    if (formatUnderline) {
      fullName = JSONResponse.formatUnderline(fullName, true);
    }
    if (formatFunChar) {
      fullName = JSONResponse.formatFunChar(fullName, true);
    }

    return firstCase ? StringUtil.firstCase(fullName) : fullName; //不格式化普通 key:value (value 不为 [], {}) 的 key
  },

  /**"@key" => "key"
   * @param key
   * @return
   */
  formatAt: function(key) {
    var k = key.startsWith("@") ? key.substring(1) : key;
    return k; //由 formatFunChar 实现去掉末尾的 @ k.endsWith("@") ? k.substring(0, k.length - 1) : k;
  },
  /**key:alias => keyAsAlias
   * @param key
   * @return
   */
  formatAlias: function(key) {
    var index = key.indexOf(":");
    return index < 0 ? key : key.substring(0, index) + 'As' + StringUtil.firstCase(key.substring(index + 1), true);
  },

  /**A-b-cd-Efg => ABCdEfg
   * @param key
   * @return
   */
  formatHyphen: function(key, firstCase) {
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

  /**A_b_cd_Efg => ABCdEfg
   * @param key
   * @return
   */
  formatUnderline: function(key, firstCase) {
    var first = true;
    var index;

    var name = "";
    var part;
    do {
      index = key.indexOf("_");
      part = index < 0 ? key : key.substring(0, index);

      name += firstCase && first == false ? StringUtil.firstCase(part, true) : part;
      key = key.substring(index + 1);

      first = false;
    }
    while (index >= 0);

    return name;
  },

  /**id{} => idIn; userId@ => userIdAt; ...
   * @param key
   * @return
   */
  formatFunChar: function(key) {
    var name = key.replace(/@/g, 'At');
    name = name.replace(/{}/g, 'In')
    name = name.replace(/}{/g, 'Exists')
    name = name.replace(/\(\)/g, 'Function')
    name = name.replace(/\[\]/g, 'List')
    name = name.replace(/\$/g, 'Search')
    name = name.replace(/~/g, 'Regexp')
    name = name.replace(/:/g, 'As')
    name = name.replace(/\+/g, 'Add')
    name = name.replace(/-/g, 'Remove')
    name = name.replace(/>=/g, 'Gte')
    name = name.replace(/<=/g, 'Lte')
    name = name.replace(/>/g, 'Gt')
    name = name.replace(/</g, 'Lt')
    name = name.replace(/&/g, 'And')
    name = name.replace(/\|/g, 'Or')
    name = name.replace(/!/g, 'Not')
    return name;
  },

  COMPARE_ERROR: -2,
  COMPARE_NO_STANDARD: -1,
  COMPARE_EQUAL: 0,
  COMPARE_VALUE_REPEAT: 0, // 通过后置脚本改为 1/2 来开启。场景太少了，除了分布式 id 外，即便是订单状态，那也是有一段时间内停留在同一个状态，而且最多存 20 个值，也很难命中各种结果  1 // 2
  COMPARE_KEY_MORE: 1,
  COMPARE_VALUE_MORE: 2,
  COMPARE_EQUAL_EXCEPTION: 3,
  COMPARE_LENGTH_CHANGE: 4,
  COMPARE_VALUE_CHANGE: 5,
  COMPARE_VALUE_EMPTY: 6,
  COMPARE_KEY_LESS: 7,
  COMPARE_FORMAT_CHANGE: 8,
  COMPARE_NUMBER_TYPE_CHANGE: 9,
  COMPARE_TYPE_CHANGE: 10,
  COMPARE_CODE_CHANGE: 11,
  COMPARE_THROW_CHANGE: 12,

  getCompareShowObj: function(cmp, status, response) {
     var it = cmp;
     var p = cmp.path
     it.compareType = cmp.code;
     it.compareMessage = (StringUtil.isEmpty(p, true) ? '' : p + '  ') + (cmp.msg || '查看结果')
     switch (it.code) {
            case JSONResponse.COMPARE_ERROR:
              it.compareColor = 'red'
              it.hintMessage = (status != null && status != 200 ? status + ' ' : '') + '请求出错！'
              break;
            case JSONResponse.COMPARE_NO_STANDARD:
              it.compareColor = 'green'
              it.hintMessage = '确认正确后点击[对的，纠正]'
              break;
            case JSONResponse.COMPARE_KEY_MORE:
            case JSONResponse.COMPARE_VALUE_MORE:
            case JSONResponse.COMPARE_EQUAL_EXCEPTION:
              it.compareColor = 'green'
              it.hintMessage = '新增字段/新增值 等'
              break;
            case JSONResponse.COMPARE_LENGTH_CHANGE:
            case JSONResponse.COMPARE_VALUE_CHANGE:
              it.compareColor = 'blue'
              it.hintMessage = '值改变 等'
              break;
            case JSONResponse.COMPARE_VALUE_EMPTY:
            case JSONResponse.COMPARE_KEY_LESS:
              it.compareColor = 'orange'
              it.hintMessage = '缺少字段/整数变小数 等'
              break;
            case JSONResponse.COMPARE_FORMAT_CHANGE:
            case JSONResponse.COMPARE_NUMBER_TYPE_CHANGE:
            case JSONResponse.COMPARE_TYPE_CHANGE:
            case JSONResponse.COMPARE_CODE_CHANGE:
            case JSONResponse.COMPARE_THROW_CHANGE:
              var code = response == null ? null : response[JSONResponse.KEY_CODE]
              it.compareColor = 'red'
              it.hintMessage = (code != null && code != JSONResponse.CODE_SUCCESS
               ? code + ' ' : (status != null && status != 200 ? status + ' ' : '')) + '状态码/异常/值类型 改变等'
              break;
            default:
              it.compareColor = 'white'
              it.hintMessage = '结果正确'
              break;
          }
    return it;
  },

  /**测试compare: 对比 新的请求与上次请求的结果
   0-相同，无颜色；
   1-对象新增字段或数组新增值，绿色；
   2-值改变，蓝色；
   3-对象缺少字段/整数变小数，黄色；
   4-code/值类型 改变，红色；
   */
  compareResponse: function(res, target, real, folder, isMachineLearning, codeName, exceptKeys, ignoreTrend, noBizCode) {
    target = target || {}
    var tStatus = target.status || 200;
    var rStatus = (res || {}).status;
    if (rStatus != null && rStatus != tStatus) {
      return {
        code: JSONResponse.COMPARE_CODE_CHANGE,
        msg: 'HTTP Status Code 改变！' + tStatus + ' -> ' + rStatus,
        path: ''
      }
    }
    codeName = StringUtil.isEmpty(codeName, true) ? JSONResponse.KEY_CODE : codeName;
    var tCode = (isMachineLearning != true && noBizCode) ? 0 : (target || {})[codeName];
    var rCode = noBizCode ? tCode : (real || {})[codeName];

    //解决了弹窗提示机器学习更新标准异常，但导致所有项测试结果都变成状态码 code 改变
    // if (real == null) {
    //   return {
    //     code: JSONResponse.COMPARE_ERROR, //未上传对比标准
    //     msg: 'response 为 null！',
    //     path: folder == null ? '' : folder
    //   };
    // }

    if (tCode == null) {
      if (typeof rCode == 'number' && (rCode%10 != 0 || (rCode >= 400 && rCode < 600))) {
        return {
          code: JSONResponse.COMPARE_CODE_CHANGE, //未上传对比标准
          msg: '没有校验标准，且状态码 ' + rCode + ' 在 [400, 599] 内或不是 0, 200 等以 0 结尾的数',
          path: folder == null ? '' : folder
        };
      }

      if (real != null && real.throw != null) {
        return {
          code: JSONResponse.COMPARE_CODE_CHANGE, //未上传对比标准
          msg: '没有校验标准，且 throw 是 ' + real.throw,
          path: folder == null ? '' : folder
        };
      }

      if (real == null || real.data == null) {
        return {
          code: JSONResponse.COMPARE_KEY_LESS, //未上传对比标准
          msg: '没有校验标准，且缺少有效 data 值',
          path: folder == null ? '' : folder
        };
      }

      return {
        code: JSONResponse.COMPARE_NO_STANDARD, //未上传对比标准
        msg: '没有校验标准！',
        path: folder == null ? '' : folder
      };
    }

    var tThrw = target.throw;
    var rThrw = noBizCode ? tThrw : real.throw;

    var exceptions = target.exceptions || [];
    if (rCode != tCode || rThrw != tThrw) {

      var find = null;
      for (var i = 0; i < exceptions.length; i++) {
        var ei = exceptions[i];
        if (ei != null && ei[codeName] == rCode && ei.throw == rThrw) {
          find = ei;
          break;
        }
      }

      if (find != null) {
        return {
          code: JSONResponse.COMPARE_EQUAL_EXCEPTION,
          msg: '符合异常分支 ' + rCode + (StringUtil.isEmpty(rThrw) ? '' : ' ' + rThrw + ':') + ' ' + StringUtil.trim(find.msg),
          path: folder == null ? '' : folder
        };
      }

      return rCode != tCode ? {
        code: JSONResponse.COMPARE_CODE_CHANGE,
        msg: '状态码 ' + codeName + ' 改变！' + tCode + ' -> ' + rCode,
        path: folder == null ? '' : folder
      } : {
        code: JSONResponse.COMPARE_THROW_CHANGE,
        msg: '异常 throw 改变！' + tThrw + ' -> ' + rThrw,
        path: folder == null ? '' : folder
      };
    }

    if (noBizCode != true) {
        delete target[codeName];
        delete real[codeName];
        delete target.throw;
        delete real.throw;
    }

    //可能提示语变化，也要提示
    // delete target.msg;
    // delete real.msg;

    var result = null
    try {
       result = isMachineLearning == true
        ? JSONResponse.compareWithStandard(target, real, folder, exceptKeys, ignoreTrend)
        : JSONResponse.compareWithBefore(target, real, folder, exceptKeys);
    } finally {
      if (isMachineLearning || noBizCode != true) {
        target[codeName] = tCode;
      }
      if (noBizCode != true) {
        real[codeName] = rCode;
        target.throw = tThrw;
        real.throw = rThrw;
      }
    }

    if (exceptions.length > 0 && (target.repeat || 0) <= 0 && (result || {}).code < JSONResponse.COMPARE_VALUE_CHANGE) {
      return {
        code: JSONResponse.COMPARE_VALUE_CHANGE,
        msg: '状态码' + codeName + ' 违背首次成功、后续失败的趋势',
        path: folder == null ? '' : folder
      }
    }

    return result;
  },

  /**测试compare: 对比 新的请求与上次请求的结果
   0-相同，无颜色；
   1-新增字段/新增值，绿色；
   2-值改变，蓝色；
   3-缺少字段/整数变小数，黄色；
   4-类型/code 改变，红色；
   */
  compareWithBefore: function(target, real, folder, exceptKeys) {
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

    var max = {
      code: JSONResponse.COMPARE_EQUAL,
      msg: '结果正确',
      path: '', //导致正确时也显示 folder,
      value: null //导致正确时也显示  real
    };

    var type = JSONResponse.getType(target); // typeof target;
    var realType = JSONResponse.getType(real);
    if (type != realType) { //类型改变
      if (type != "integer" || realType != "number") {
        return {
          code: JSONResponse.COMPARE_TYPE_CHANGE,
          msg: '值类型改变！' + type + " -> " + realType,
          path: folder,
          value: real
        };
      }

      max.code = JSONResponse.COMPARE_NUMBER_TYPE_CHANGE;
      max.msg = '整数变小数';
      max.path = folder;
      max.value = real;
    }

    // var max = JSONResponse.COMPARE_EQUAL;
    // var each = JSONResponse.COMPARE_EQUAL;

    if (target instanceof Array) { // JSONArray
      if (max.code < JSONResponse.COMPARE_KEY_LESS && real.length < target.length) {
        max = {
          code: JSONResponse.COMPARE_KEY_LESS,
          msg: '是缺少的',
          path: JSONResponse.getAbstractPath(folder, real.length),
          value: target[real.length]
        }
      }
      else if (max.code < JSONResponse.COMPARE_KEY_MORE && real.length > target.length) {
        max = {
          code: JSONResponse.COMPARE_KEY_MORE,
          msg: '是新增的',
          path: JSONResponse.getAbstractPath(folder, target.length),
          value: real[target.length]
        }
      }

      var minLen = Math.min(target.length, real.length)
      for (var i = 0; i < minLen; i++) { //合并所有子项, Java类型是稳定的，不会出现两个子项间同名字段对应值类型不一样
        var each = JSONResponse.compareWithBefore(target[i], real[i], JSONResponse.getAbstractPath(folder, i), exceptKeys);

        var code = each == null ? 0 : each.code;
        if (max.code < code) {
          max = each;
        }

        if (max.code >= JSONResponse.COMPARE_TYPE_CHANGE) {
          break;
        }
      }
    }
    else if (target instanceof Object) { // JSONObject
      var tks = Object.keys(target);
      var key;
      for (var i = 0; i < tks.length; i++) { //遍历并递归下一层
        key = tks[i];
        if (key == null || (exceptKeys != null && exceptKeys.indexOf(key) >= 0)) {
          continue;
        }

        var each = JSONResponse.compareWithBefore(target[key], real[key], JSONResponse.getAbstractPath(folder, key), exceptKeys);
        var code = each == null ? 0 : each.code;

        if (max.code < code) {
          max = each;
        }

        if (max.code >= JSONResponse.COMPARE_TYPE_CHANGE) {
          break;
        }
      }

      if (max.code < JSONResponse.COMPARE_KEY_MORE) { //多出key
        for (var k in real) {
          if (k != null && real[k] != null && target[k] == null) { //解决 null 值总是提示是新增的，且无法纠错 tks.indexOf(k) < 0) {
            max.code = JSONResponse.COMPARE_KEY_MORE;
            max.msg = '是新增的';
            max.path = JSONResponse.getAbstractPath(folder, k);
            max.value = real[k];
            break;
          }
        }
      }
    }
    else { // Boolean, Number, String
      if (max.code < JSONResponse.COMPARE_NUMBER_TYPE_CHANGE && type == 'number') { //数字类型由整数变为小数
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
      if (left instanceof Array) {
        left = left.concat(right);
      }
      else if (left instanceof Object) {
        for (let i = 0; i < right.length; i++) {
          var k = i + '';
          left[k] = Object.assign(left[k], right[i]);
        }
      }
      else {
        left = [left].concat(right);
      }

      return left;
      // var lfirst = left[0];
      // if (lfirst instanceof Object) {
      //   for (var i = 1; i < left.length; i++) {
      //     lfirst = JSONResponse.deepMerge(lfirst, left[i]);
      //   }
      // }
      //
      // var rfirst = right[0];
      // if (rfirst instanceof Object) {
      //   for (var i = 1; i < right.length; i++) {
      //     rfirst = JSONResponse.deepMerge(rfirst, right[i]);
      //   }
      // }
      //
      // var m = JSONResponse.deepMerge(lfirst, rfirst);
      //
      // return m == null ? [] : [ m ];
    }
    else if (right instanceof Object) {
      if (left instanceof Array) {
        left.push(right);
      }
      else if (left instanceof Object) {
        left = Object.assign(left, right);
        var m = left; // parseJSON(JSON.stringify(left));

        for (var k in right) {
          m[k] = JSONResponse.deepMerge(m[k], right[k]);
        }
        left = m;
      }
      else {
        left = Object.assign({'0$left': left}, right);
      }
    }
    else if (left instanceof Array) {
      left.push(right);
    }
    else if (left instanceof Object) {
      left[Object.keys(left).length + '$right'] = right;
    }
    else {
      return right;
    }

    return left;
  },


  /**测试compare: 对比 新的请求与从历史请求结果提取的校验模型  TODO 新增 exceptions(删除等部分接口只有第一次成功) 和字符串格式 format(DATE, TIME, NUMBER)
   0-相同，无颜色；
   1-新增字段/新增值，绿色；
   2-值改变，蓝色；
   3-缺少字段/整数变小数，黄色；
   4-类型/code 改变，红色；
   */
  compareWithStandard: function(target, real, folder, exceptKeys, ignoreTrend, callback) {
    folder = folder == null ? '' : folder;

    if (target == null) {
      return {
        code: real == null ? JSONResponse.COMPARE_EQUAL : JSONResponse.COMPARE_KEY_MORE,
        msg: real == null ? '结果正确' : '是新增的',
        path: real == null ? '' : folder,
        value: real
      };
    }
    if (target instanceof Array) { // JSONArray
      throw new Error('Standard 在 ' + folder + ' 语法错误，不应该有 array！');
    }

    log('\n\n\n\n\ncompareWithStandard <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<\n' +
      ' \ntarget = ' + JSON.stringify(target, null, '    ') + '\n\n\nreal = ' + JSON.stringify(real, null, '    '));

    var guess = target.guess;
    log('compareWithStandard  guess = target.guess = ' + guess + ' >>');

    var notNull = target.notNull;
    log('compareWithStandard  notNull = target.notNull = ' + notNull + ' >>');

    var notEmpty = target.notEmpty;
    log('compareWithStandard  notEmpty = target.notEmpty = ' + notEmpty + ' >>');

    var type = target.type;
    log('compareWithStandard  type = target.type = ' + type + ' >>');

    var valueLevel = target.valueLevel;
    log('compareWithStandard  valueLevel = target.valueLevel = ' + valueLevel + ' >>');

    var values = target.values;
    log('compareWithStandard  values = target.values = ' + JSON.stringify(values, null, '    ') + ' >>');
    var firstVal = values == null || values.length <= 0 ? null : values[0];

    if (firstVal == null && (type == 'object' || type == 'array')) {
      if (notNull == true) { // values{} values&{}
        throw new Error('Standard 在 ' + folder + ' 语法错误，Object 或 Array 在 notNull: true 时 values 必须为有值的数组 !');
      }

      log('compareWithStandard  values == null; real ' + (real == null ? '=' : '!') + '= null >> return ' + (real == null ? 'COMPARE_EQUAL' : 'COMPARE_KEY_MORE'));
      return {
        code: real == null ? JSONResponse.COMPARE_EQUAL : JSONResponse.COMPARE_KEY_MORE,
        msg: real == null ? '结果正确' : '是新增的',
        path: real == null ? '' : folder,
        value: real
      };
    }

    if (real == null) { //少了key
      log('compareWithStandard  real == null >> return ' + (notNull == true ? 'COMPARE_KEY_LESS' : 'COMPARE_EQUAL'));
      return {
        code: notNull == true ? JSONResponse.COMPARE_KEY_LESS : JSONResponse.COMPARE_EQUAL,
        msg: notNull == true ? '是缺少的' : '结果正确',
        path: notNull == true ? folder : '',
        value: real
      };
    }

    if (notEmpty == true && typeof real != 'boolean' && typeof real != 'number' && StringUtil.isEmpty(real, true)) { // 空
      log('compareWithStandard  notEmpty == true && StringUtil.isEmpty(real, true) >> return COMPARE_VALUE_EMPTY');
      return {
        code: JSONResponse.COMPARE_VALUE_EMPTY,
        msg: '是空的',
        path: folder,
        value: real
      };
    }

    var max = {
      code: JSONResponse.COMPARE_EQUAL,
      msg: '结果正确',
      path: '', //导致正确时也显示 folder,
      value: null //导致正确时也显示  real
    };

    var realType = JSONResponse.getType(real);
    if (type != null && type != 'undefined' && type != realType && (type != 'number' || realType != 'integer')) { //类型改变
      log('compareWithStandard  type != undefined && type != realType && (type != number || realType != integer) >> return COMPARE_TYPE_CHANGE');

      max = {
        code: JSONResponse.COMPARE_TYPE_CHANGE,
        msg: '不是 ' + type + ' 类型',
        path: folder,
        value: real
      };

      if (guess != true) {
        return max;
      }

      max.code -= 1;
    }


    var each;

    if (type == 'array') { // JSONArray
      log('compareWithStandard  type == array >> ');

      for (var i = 0; i < real.length; i ++) { //检查real的每一项
        log('compareWithStandard  for i = ' + i + ' >> ');

        each = JSONResponse.compareWithStandard(firstVal, real[i], JSONResponse.getAbstractPath(folder, i), exceptKeys, ignoreTrend);

        if (max.code < each.code) {
          max = each;
        }
        if (max.code >= JSONResponse.COMPARE_TYPE_CHANGE) {
          log('compareWithStandard  max >= COMPARE_TYPE_CHANGE >> return max = ' + max);
          return max;
        }
      }

      if (max.code < JSONResponse.COMPARE_LENGTH_CHANGE
        && JSONResponse.isValueCorrect(target.lengthLevel, target.lengths, real.length) != true) {
        var lengths = target.lengths
        var maxVal = lengths == null || lengths.length <= 0 ? null : lengths[0];
        var minVal = lengths == null || lengths.length <= 0 ? null : lengths[lengths.length - 1];

        max.code = JSONResponse.COMPARE_LENGTH_CHANGE;
        max.msg = '长度 ' + real.length + ' 超出范围 [' + minVal + ', ' + maxVal + ']';
        max.path = folder;
        max.value = real.length;
      }
    }
    else if (type == 'object') { // JSONObject
      log('compareWithStandard  type == object >> ');

      var tks = values == null ? [] : Object.keys(firstVal);
      var tk;
      for (var i = 0; i < tks.length; i++) { //遍历并递归下一层
        tk = tks[i];
        if (tk == null || (exceptKeys != null && exceptKeys.indexOf(tk) >= 0)) {
          continue;
        }
        log('compareWithStandard  for tk = ' + tk + ' >> ');

        each = JSONResponse.compareWithStandard(firstVal[tk], real[tk], JSONResponse.getAbstractPath(folder, tk), exceptKeys);
        if (max.code < each.code) {
          max = each;
        }
        if (max.code >= JSONResponse.COMPARE_TYPE_CHANGE) {
          log('compareWithStandard  max >= COMPARE_TYPE_CHANGE >> return max = ' + max);
          return max;
        }
      }


      //不能注释，前面在 JSONResponse.compareWithStandard(firstVal[tk], real[tk]  居然没有判断出来 COMPARE_KEY_MORE
      if (max.code < JSONResponse.COMPARE_KEY_MORE) { //多出key
        log('compareWithStandard  max < COMPARE_KEY_MORE >> ');

        for (var k in real) {
          log('compareWithStandard  for k = ' + k + ' >> ');

          if (k != null && real[k] != null && (firstVal == null || firstVal[k] == null)
            && (exceptKeys == null || exceptKeys.indexOf(tk) >= 0)) { //解决 null 值总是提示是新增的，且无法纠错 tks.indexOf(k) < 0) {
            log('compareWithStandard  k != null && tks.indexOf(k) < 0 >> max = COMPARE_KEY_MORE;');

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
      log('compareWithStandard  type == boolean | number | string >> ');

      if (max.code < JSONResponse.COMPARE_TYPE_CHANGE && type == 'string') {
        var format = target.format;
        if (typeof format == 'string' && FORMAT_PRIORITIES[format] != null) {
          var verifier = max.code < JSONResponse.COMPARE_FORMAT_CHANGE && StringUtil.isNotEmpty(format, true)
              ? FORMAT_VERIFIERS[format] : null;
          if (typeof verifier == 'function' && verifier(real) != true) {
              max.code = JSONResponse.COMPARE_FORMAT_CHANGE - (guess != true ? 0 : 1);
              max.msg = '不是 ' + format + " 格式！";
              max.path = folder;
              max.value = real;
          }
        }
        else if (format instanceof Array == false && format instanceof Object) {
          try {
            var realObj = parseJSON(real);
            var result = JSONResponse.compareWithStandard(format, realObj, folder, exceptKeys, ignoreTrend);
            if (guess == true) {
              result.code -= 1;
            }

            if (result.code > max.code) {
              max = result;
            }
          } catch (e) {
            log(e)
          }
        }
      }

      var valueCompare = max.code >= JSONResponse.COMPARE_VALUE_CHANGE
          ? 0 : JSONResponse.compareValue(valueLevel, values, real, target.trend, target.repeat);

      if (valueCompare > 0) {
        max.code = valueCompare;
        max.path = folder;
        max.value = real;

        var isNum = CodeUtil.isTypeMatch('number', type)

        if (isNum && valueCompare == JSONResponse.COMPARE_VALUE_REPEAT && (target.repeat == null || target.repeat <= 0)
            && values != null && values.indexOf(real) >= 0) {
          max.msg = '值与历史值重复：' + real;
        }
        else if (target.valueLevel != 1 || isNum != true) {
          max.msg = '值超出范围';
        }
        else if (valueCompare == JSONResponse.COMPARE_VALUE_MORE) {
          max.msg = '值是新增的';
        }
        else {  // 刚上传完是不是不应该对比？还是 ignoreTrend = ">,<,!" 忽略特定的对比？因为很可能是原来的
          var select = ignoreTrend ? null : (target.trend || {}).select;
          var maxVal = firstVal;
          var minVal = values == null || values.length <= 0 ? null : values[values.length - 1];

          if (select == '>') {
            max.msg = '值违背必增趋势 > ' + maxVal;
          }
          else if (select == '>=') {
            max.msg = '值违背增长趋势 >= ' + maxVal;
          }
          else if (select == '<') {
            max.msg = '值违背必减趋势 < ' + minVal;
          }
          else if (select == '<=') {
            max.msg = '值违背缩减趋势 <= ' + minVal;
          }
          else {
            max.msg = '值超出范围 [' + minVal + ', ' + maxVal + ']';
          }
        }
      }

      if (max.code < JSONResponse.COMPARE_LENGTH_CHANGE) {
        log('compareWithStandard  max < COMPARE_LENGTH_CHANGE >> ');

        var realLength = JSONResponse.getLength(real);
        log('compareWithStandard  realLength = ' + realLength + ' >> ');

        if (realLength != null && JSONResponse.isValueCorrect(target.lengthLevel, target.lengths, realLength) != true) {
          var lengths = target.lengths
          var maxVal = lengths == null || lengths.length <= 0 ? null : lengths[0];
          var minVal = lengths == null || lengths.length <= 0 ? null : lengths[lengths.length - 1];

          max.code = JSONResponse.COMPARE_LENGTH_CHANGE;
          max.msg = '长度 ' + realLength + ' 超出范围 [' + minVal + ', ' + maxVal + ']';
          max.path = folder;
          max.value = realLength;
        }
      }
    }

    log('\ncompareWithStandard >> return max = ' + max + '\n >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> \n\n\n\n\n');
    return max;
  },


  isValueCorrect: function(level, target, real, trend, repeat) {
    return JSONResponse.compareValue(level, target, real, trend, repeat) <= 0;
  },
  compareValue: function(level, target, real, trend, repeat) {
    log('isValueCorrect  \nlevel = ' + level + '; \ntarget = ' + JSON.stringify(target)
      + '\nreal = ' + JSON.stringify(real, null, '    '));
    if (target == null || real == null) {
      log('isValueCorrect  target == null >>  return true;');
      return 0;
    }
    if (level == null) {
      level = 0;
    }
    if (repeat == null) {
      repeat = 0;
    }

    if (level == 0) {
      if (target.indexOf(real) < 0) { // 'key{}': [0, 1]
        log('isValueCorrect  target.indexOf(real) < 0 >>  return false;');
        return JSONResponse.COMPARE_VALUE_CHANGE;
      }

      return repeat <= 0 && typeof real == 'number' ? JSONResponse.COMPARE_VALUE_REPEAT : 0;
    }
    else if (level == 1) { //real <= max; real >= min
      if (target.length <= 0) {
        log('isValueCorrect  target.length <= 0  >> return true;');
        return 0;
      }

      var max = target[0]
      if (target.length == 1) {
        log('isValueCorrect  target.length == 1  >> return max == real;');
        return max == real ? 0 : JSONResponse.COMPARE_VALUE_CHANGE;
      }
      var min = target[target.length - 1]
      if (max == null || min == null) {
        log('isValueCorrect  max == null || min == null 这种情况不该出现！！！updateStandard 不应该把 null 值设置进去！  >>  return false;');
        alertOfDebug('isValueCorrect  max == null || min == null 这种情况不该出现！！！updateStandard 不应该把 null 值设置进去！');
        return JSONResponse.COMPARE_VALUE_CHANGE;
      }

      //趋势分析，新值落在五个区域之一的次数，"trend":{ "select": ">", "above": 5, "top":4, "center":3, "bottom":2, "below":1 }
      var select = (trend || {}).select
      if (select == '>' && max >= real) { // above，例如 自增主键、创建时间 等总是递增
        log('isValueCorrect  select == > && max >= real  >>  return false;');
        return JSONResponse.COMPARE_VALUE_CHANGE;
      }
      else if (select == '>=' && max > real) { // top or above，例如 统计不删改字段的 总数、总金额 等总是不变或增长
        log('isValueCorrect  select == >= && max > real  >>  return false;');
        return JSONResponse.COMPARE_VALUE_CHANGE;
      }
      else if (select == '<' && min <= real) { // below，例如 电池寿命 等总是递减
        log('isValueCorrect  select == < && min <= real  >>  return false;');
        return JSONResponse.COMPARE_VALUE_CHANGE;
      }
      else if (select == '<=' && min < real) { // bottom or below，例如 促销活动倒计时 等总是总是不变或减小
        log('isValueCorrect  select == <= && min < real  >>  return false;');
        return JSONResponse.COMPARE_VALUE_CHANGE;
      }
      else if (select == null || select == '%') { // center
        log('isValueCorrect  select == null || select == %  >> ');
        if (max < real) {
          log('isValueCorrect  max < real  >>  return false;');
          return JSONResponse.COMPARE_VALUE_CHANGE;
        }
        if (min > real) {
          log('isValueCorrect  min > real  >>  return false;');
          return JSONResponse.COMPARE_VALUE_CHANGE;
        }

        return 0;
      }

      return target.indexOf(real) < 0 ? JSONResponse.COMPARE_VALUE_MORE
          : (repeat <= 0 && typeof real == 'number' ? JSONResponse.COMPARE_VALUE_REPEAT : 0); // 为了提示上传新值，方便以后校验
    }
    else if (level == 2) {
      for (var i = 0; i < target.length; i ++) {

        if (eval(real + target[i]) != true) {
          log('isValueCorrect  eval(' + (real + target[i]) + ') != true >>  return false;');
          return JSONResponse.COMPARE_VALUE_CHANGE;
        }
      }
    }
    else {
      //不限
    }

    log('isValueCorrect >> return true;');
    return 0;
  },

  getType: function(o) { //typeof [] = 'object'
    if (o == null) {
      return 'object'; // FIXME return null
    }

    if (o instanceof Array) {
      return 'array';
    }

    if (JSONResponse.isBoolean(o)) {
      return 'boolean';
    }

    if (JSONResponse.isInteger(o)) {
      return 'integer';
    }

    if (JSONResponse.isNumber(o)) {
      return 'number';
    }

    if (JSONResponse.isString(o)) {
      return 'string';
    }

    return typeof o;
  },

  isObject: function(o) {
    return o instanceof Array == false && o instanceof Object;
  },

  isArray: function(o) {
    return o instanceof Array;
  },
  isString: function(o) {
    return typeof o == 'string' || o instanceof String;
  },
  isNumber: function(o) {
    return typeof o == 'number' || o instanceof Number;
  },
  isInteger: function(o) {
    return Number.isInteger(o);
  },
  isBoolean: function(o) {
    return typeof o == 'boolean' || o instanceof Boolean;
  },


  updateFullStandard: function (standard, currentResponse, isML, noBizCode) {
    if (currentResponse == null) {
      return standard;
    }

    if (standard == null) {
      standard = {};
    }

    var code = currentResponse.code;
    var thrw = currentResponse.throw;
    var msg = currentResponse.msg;

    var hasCode = standard.code != null;
    var isCodeChange = noBizCode != true && standard.code != code;
    var exceptions = standard.exceptions || [];

    delete currentResponse.code; //code必须一致
    delete currentResponse.throw; //throw必须一致

    var find = false;
    if (isCodeChange && hasCode) {  // 走异常分支
      for (var i = 0; i < exceptions.length; i++) {
        var ei = exceptions[i];
        if (ei != null && ei.code == code && ei.throw == thrw) {
          find = true;
          ei.repeat = (ei.repeat || 0) + 1;  // 统计重复出现次数
          break;
        }
      }

      if (find) {
        delete currentResponse.msg;
      }
    }

    var stddObj = isML ? (isCodeChange && hasCode ? standard : JSONResponse.updateStandard(standard, currentResponse)) : {};

//    if (noBizCode != true) {
        currentResponse.code = code;
        currentResponse.throw = thrw;
//    }

    if (hasCode || isML) {
      stddObj.code = code || 0;
    }

    if (isCodeChange) {
      if (hasCode != true) {  // 走正常分支
        stddObj.throw = thrw;
      }
      else {  // 走异常分支
        currentResponse.msg = msg;

        if (find != true) {
          exceptions.push({
            code: code,
            'throw': thrw,
            msg: msg
          })

          stddObj.exceptions = exceptions;
        }
      }
    }
    else {
      stddObj.repeat = (stddObj.repeat || 0) + 1;  // 统计重复出现次数
    }

    return stddObj;
  },

  /**更新测试标准，通过原来的标准与最新的数据合并来实现
   */
  updateStandard: function(target, real, exceptKeys, ignoreTrend, key) {
    if (target instanceof Array) { // JSONArray
      throw new Error("Standard 语法错误，不应该有 array！");
    }
    if (real == null && StringUtil.isEmpty(key, true)) { // 少了key
      log('updateStandard real == null && StringUtil.isEmpty(key, true) >> return target;');
      return target;
    }

    if (target == null) {
      target = {};
    }

    log('\n\n\n\n\nupdateStandard <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<\n' +
      ' \ntarget = ' + JSON.stringify(target, null, '    ') + '\n\n\nreal = ' + JSON.stringify(real, null, '    '));

    var notNull = target.notNull;
    log('updateStandard  notNull = target.notNull = ' + notNull + ' >>');
    if (notNull == null) {
      notNull = target.notNull = real != null;
    }

    var notEmpty = target.notEmpty;
    log('updateStandard  notEmpty = target.notEmpty = ' + notEmpty + ' >>');
    if (real != null && typeof real != 'boolean' && typeof real != 'number') {
      notEmpty = target.notEmpty = StringUtil.isNotEmpty(real, true);
    }

    var type = target.type;
    if (type == null || type == 'undefined') {
      target.type = type = null;
    }

    var rtype = JSONResponse.getType(real);
    if ((rtype == null || real == null) && StringUtil.isEmpty(type, true) && StringUtil.isNotEmpty(key, true)) {
      target.guess = true;
      if (StringUtil.isBoolKey(key)) {
        target.type = 'boolean';
      }
      else if (StringUtil.isDateKey(key)) {
        target.type = 'integer'; // 'string';
        if (target.format == null) {
          target.format = FORMAT_DATE;
        }
      }
      else if (StringUtil.isTimeKey(key)) {
        target.type = 'integer'; // 'string';
        if (target.format == null) {
          target.format = FORMAT_TIME;
        }
      }
      else if (StringUtil.isUrlKey(key)) {
        target.type = 'string';
        if (target.format == null) {
          target.format = FORMAT_HTTP;
        }
      }
      else if (StringUtil.isUriKey(key)) {
        target.type = 'string';
        if (target.format == null) {
          target.format = FORMAT_URI;
        }
      }
      else if (StringUtil.isPathKey(key)) {
        target.type = 'string';
        if (target.format == null) {
          target.format = FORMAT_PATH;
        }
      }
      else if (StringUtil.isNameKey(key)) {
        target.type = 'string';
        if (target.format == null) {
          target.format = FORMAT_BIG_NAME;
        }
      }
      else if (StringUtil.isDictKey(key) || StringUtil.isMapKey(key) || StringUtil.isObjKey(key)) {
        target.type = 'object';
      }
      else if (StringUtil.isCollectionKey(key)) {
        target.type = 'array';
      }
      else if (StringUtil.isPriceKey(key) || StringUtil.isPercentKey(key) || StringUtil.isAmountKey(key)
         || StringUtil.isMoneyKey(key) || StringUtil.isCashKey(key) || StringUtil.isDiscountKey(key)
         || StringUtil.isDecimalKey(key) || StringUtil.isFloatKey(key) || StringUtil.isDoubleKey(key)
      ) {
        target.type = 'number';
      }
      else if (StringUtil.isNumKey(key) || StringUtil.isCountKey(key) || StringUtil.isPageKey(key)
         || StringUtil.isSizeKey(key) || StringUtil.isCapKey(key) || StringUtil.isIntKey(key) || StringUtil.isLongKey(key)
         || StringUtil.isLevelKey(key)|| StringUtil.isGradeKey(key) || StringUtil.isScoreKey(key) || StringUtil.isTotalKey(key)
         || StringUtil.isIdKey(key) || StringUtil.isHashKey(key)
      ) {
        target.type = 'integer';
      }
      else if (StringUtil.isStrKey(key)) {
        target.type = 'string';
      }
      else {
        var cm = StringUtil.CATEGORY_MAP;
        if (cm == null || Object.keys(cm).length <= 0) {
            cm = {}
            var tcks = StringUtil.TYPE_CATEGORY_KEYS || {};
            for (var k in tcks) {
              var arr = tcks[k] || [];
              for (var i = 0; i < arr.length; i++) {
                var k2 = arr[i];
                cm[k2] = k;
              }
            }

            StringUtil.CATEGORY_MAP = cm;
        }

        for (var k in cm) {
          if (StringUtil.isKeyOfCategory(key, k)) {
            target.type = cm[k];
            break;
          }
        }
      }

    }
    else {
      target.guess = rtype == null || real == null ? (ignoreTrend ? target.guess : false) : undefined;
    }

    if (real == null) { // 少了key
      log('updateStandard  real == null >> return target;');
      return target;
    }

    log('updateStandard  type = target.type = ' + type + ' >>');
    if (type == null || CodeUtil.isTypeMatch(target.type, rtype) != true) { //强制用real的类型替代
      type = target.type = rtype;
    }
    log('updateStandard  type = target.type = getType(real) = ' + type + ' >>');


    var lengthLevel = target.lengthLevel;
    var lengths = target.lengths;
    log('updateStandard  lengthLevel = target.lengthLevel = ' + lengthLevel + ' >>');
    log('updateStandard  lengths = target.lengths = ' + lengths + ' >>');


    var valueLevel = target.valueLevel;
    var values = target.values;
    log('updateStandard  valueLevel = target.valueLevel = ' + valueLevel + ' >>');
    log('updateStandard  values = target.values = ' + JSON.stringify(values, null, '    ') + ' >>');

    if (valueLevel == null) {
      log('updateStandard  valueLevel == null >> valueLevel = target.valueLevel = 0;');
      valueLevel = target.valueLevel = 0;
    }


    if (type == 'array') {
      log('updateStandard  type == array >> ');

      if (values == null) {
        values = [];
      }
      if (values[0] == null) {
        values[0] = {};
      }

      var child = values[0];
      for (var i = 0; i < real.length; i ++) {
        log('updateStandard for i = ' + i + '; child = '
          + JSON.stringify(child, null, '    ') + ';\n real[i] = '  + JSON.stringify(real[i], null, '    ') + ' >>');

        child = JSONResponse.updateStandard(child, real[i], exceptKeys, true, key == null ? 'item' : key + 'Item');  //FIXME ignoreTrend 固定取 true 导致批量创建后多个 id [1,2,3] -> [3,4,5] 漏报趋势异常
      }
      if (child == null) {
        log('updateStandard  child == null >> child = {}');
        child = {} //啥都确定不了，level为null默认用0替代
      }

      values = [child];
      target = JSONResponse.setValue(target, real.length, lengthLevel == null ? 1 : lengthLevel, lengths, true, true);
      target = JSONResponse.setValue(target, null, valueLevel, values, false, ignoreTrend);
    }
    else if (type == 'object') {
      log('updateStandard  type == object >> ');

      target.valueLevel = valueLevel;


      if (values == null) {
        values = [];
      }

      var firstVal = values[0];
      if (firstVal == null) {
        values[0] = firstVal = {};
      }

      var realKeys = Object.keys(real) || [];
      for(var k2 in firstVal) { //解决real不含k2时导致notnull不能变成false
        // log('updateStandard for k2 in firstVal = ' + k2 + ' >>');
        if (realKeys.indexOf(k2) < 0) {
          // log('updateStandard Object.keys(real).indexOf(k2) < 0 >> real[k2] = null;');
          // 解决总是报错缺少字段  delete real[k2];  // 解决总是多出来 key: null    real[k2] = null;

          if (firstVal[k2] == null) {
            firstVal[k2] = { notNull: false };
          }
          else {
            firstVal[k2].notNull = false;
          }
        }
      }

      for(var k in real) {
        if (k == null || (exceptKeys != null && exceptKeys.indexOf(k) >= 0)) {
          continue
        }

        log('updateStandard for k in real = ' + k + '; firstVal[k] = '
          + JSON.stringify(firstVal[k], null, '    ') + ';\n real[k] = '  + JSON.stringify(real[k], null, '    ') + ' >>');
        firstVal[k] = JSONResponse.updateStandard(firstVal[k], real[k], exceptKeys, ignoreTrend, k);
      }

      target.values = values;
    }
    else {
      log('updateStandard  type == other >> ');
      if (type == 'string') {
        var format = target.format;
        try {
          var priority = format == null ? null : FORMAT_PRIORITIES[format]
          if (priority == null) {
            priority = Number.MAX_SAFE_INTEGER;
          }

          var format2 = null;
          var priorities = FORMAT_PRIORITIES;
          var verifiers = FORMAT_VERIFIERS;
          for (var fmt in verifiers) {
            try {
              var verifier = verifiers[fmt];
              var pty = priorities[fmt];
              if (pty == null) {
                pty = Number.MAX_SAFE_INTEGER - 1;
              }

              if (pty < priority && typeof verifier == 'function' && (
                  priorities[format2] == null || pty > priorities[format2])
              ) {
                if (verifier(real)) {
                  target.format = format2 = fmt;
                }
              }
            }
            catch (e) {
              log(e)
            }
          }

          if (priority > 0 && format2 == null) {
            throw new Error("try other format");
          }
        } catch (e) {
          log(e)
          try {
            var realObj = parseJSON(real);
            var format2 = JSONResponse.updateStandard(target.format, realObj, exceptKeys, ignoreTrend, key);
            if (format2 != null) {
              target.format = format2;
            }
          } catch (e2) {
            log(e2)
            target.format = ''
          }
        }
      }

      if (values == null) {
        values = [];
      }
      if (valueLevel < 1 && type == 'number' && ! Number.isSafeInteger(real)) { //double 1.23
        valueLevel = 1;
      }
      target.values = values;

      target = JSONResponse.setValue(target, JSONResponse.getLength(real), lengthLevel == null ? 1 : lengthLevel, lengths, true, true);
      target = JSONResponse.setValue(target, real, valueLevel, values, false, ignoreTrend);
    }

    log('\nupdateStandard >> return target = ' + JSON.stringify(target, null, '    ') + '\n >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> \n\n\n\n\n');

    return target;
  },

  /**根据 APIJSON 引用赋值路径精准地获取值
   */
  getValByPath: function(target, pathKeys, isTry) {
    if (target == null) {
      return null;
    }

    var tgt = target;
    var depth = pathKeys == null ? 0 : pathKeys.length
    if (depth <= 0) {
      return target;
    }

    for (var i = 0; i < depth; i ++) {
      if (tgt == null) {
        return null;
      }

      var k = pathKeys[i];
      if (k == null) {
        return null;
      }
      k = decodeURI(k)

      if (tgt instanceof Object) {
        if (k == '') {
          if (tgt instanceof Array) {
              k = 0;
          } else {
              ks = Object.keys(tgt);
              k = ks == null ? null : ks[0];
              if (k == null) {
                return null;
              }
          }
        }
        else {
          k = decodeURI(k)
          if (tgt instanceof Array) {
            try {
              var n = Number.parseInt(k);
              if (Number.isSafeInteger(n)) {
                k = n >= 0 ? n : n + tgt.length;
              }
            } catch (e) {
            }
          }
        }

        tgt = tgt[k];

        continue;
      }

      if (isTry != true) {
        throw new Error('getValByPath 语法错误，' + k + ': value 中 value 类型应该是 Object 或 Array ！');
      }

      return null;
    }

    return tgt;
  },

  /**根据 APIJSON 引用赋值路径精准地修改值
   */
  setValByPath: function(target, pathKeys, val, isTry) {
    var depth = pathKeys == null ? 0 : pathKeys.length
    if (depth <= 0) {
      return target;
    }

    var tgt = target;
    var parent = target;
    for (var i = 0; i < depth - 1; i ++) {
      var k = pathKeys[i];
      if (k == null) {
        return null;
      }
      k = decodeURI(k);

      if (tgt instanceof Object) {
        if (k == '') {
          if (tgt instanceof Array) {
              k = 0;
          } else {
              ks = Object.keys(tgt);
              k = ks == null ? null : ks[0];
              if (k == null) {
                return null;
              }
          }
        }
        else {
          if (tgt instanceof Array) {
            try {
              var n = Number.parseInt(k);
              if (Number.isSafeInteger(n)) {
                k = n >= 0 ? n : n + tgt.length;
              }
            } catch (e) {
            }
          }
        }

        parent = tgt;
        tgt = tgt[k];
        continue;
      }

      if (tgt == null) {
        try {
          var n = Number.parseInt(k);
          if (Number.isSafeInteger(n)) {
            k = n >= 0 ? n : n + tgt.length;
          }
        } catch (e) {
        }

        tgt = Number.isInteger(k) ? [] : {};
        if (i == 0 && parent == null) {
          parent = target = tgt;
        } else {
          parent[k] = tgt;
        }

        parent = tgt;
        tgt = tgt[k];

        continue;
      }

      if (isTry != true) {
        throw new Error('setValByPath 语法错误，' + k + ': value 中 value 类型应该是 Object 或 Array ！');
      }

      return null;
    }

    tgt[pathKeys[depth - 1]] = val;

    return target;
  },

  /**根据路径精准地更新测试标准中的键值对
   */
  getStandardByPath: function(target, pathKeys) {
    if (target instanceof Array) { // JSONArray
      var path = pathKeys == null ? null : path.join('/')
      throw new Error('Standard 语法错误，' + path + ': value 中 value 类型不应该是 Array！');
    }
    if (target == null) {
      return null;
    }

    var tgt = target;
    var depth = pathKeys == null ? 0 : pathKeys.length
    if (depth <= 0) {
      return target;
    }

    for (var i = 0; i < depth; i ++) {
      if (tgt == null) {
        return null;
      }

      var k = pathKeys[i];
      if (k == null) {
        return null;
      }

      if (k == '') {
        k = 0;
      }
      else {
        k = decodeURI(k)
        if (tgt instanceof Array) {
            try {
              var n = Number.parseInt(k);
              if (Number.isSafeInteger(n)) {
                k = n > 0 ? n : n + tgt.length;
              }
            } catch (e) {
            }
        }
      }

      if (tgt instanceof Array == false && tgt instanceof Object) {
        if (tgt.values == null) {
          return null;
        }

        var child = tgt.values[0];
        if (child == null) {
          return null;
        }

        tgt = child[k];
      }
      else {
        throw new Error('Standard 语法错误，' + k + ': value 中 value 类型应该是 Object ！');
      }
    }

    return tgt;
  },


  /**根据路径精准地更新测试标准中的键值对
   */
  updateStandardByPath: function(target, names, key, real, comment) {
    if (target instanceof Array) { // JSONArray
      throw new Error('Standard 语法错误，' + key + ': value 中 value 类型不应该是 Array！');
    }
    if (target == null) {
      target = {};
    }

    var tgt = target;
    var depth = names == null ? 0 : names.length
    if (depth <= 1 && (key == null || key == '')) {
      return target;
    }

    for (var i = 1; i < depth + 1; i ++) {
      var k = i >= depth ? key : names[i];
      if (k == null) {
        return target;
      }

      if (k == '') {
        k = 0;
      }
      else {
        try {
          var n = Number.parseInt(k);
          if (Number.isSafeInteger(n)) {
            k = 0;
          }
        } catch (e) {
        }
      }

      if (tgt instanceof Array == false && tgt instanceof Object) {
        if (tgt.values == null) {
          tgt.values = [];
        }

        var child = tgt.values[0];
        if (child == null) {
          child = {};
          child.type = typeof k == 'number' ? 'array' : 'number';  // TODO 没看懂为啥是 array
          child.notNull = false;
          tgt.values[0] = child;
        }

        if (child[k] == null) {
          child[k] = {};
        }

        tgt = child[k];
      }
      else {
        throw new Error('Standard 语法错误，' + k + ': value 中 value 类型应该是 Object ！');
      }
    }

    comment = comment == null ? '' : comment.trim();

    if (tgt == null) {
      tgt = {};
    }
    var ind = comment.indexOf(', ')
    if (ind < 0) {
      ind = comment.indexOf(',')
    }

    var prefix = ind <= 0 ? '' : comment.substring(0, ind).trim()
    comment = ind < 0 ? comment : comment.substring(ind + 1)
    var nullable = prefix.endsWith('?')
    var notEmpty = prefix.endsWith('!')
    var name = nullable || notEmpty ? prefix.substring(0, prefix.length - 1) : prefix
    if (StringUtil.isName(name)) {
       tgt.name = name
    } else {
       nullable = notEmpty = null
    }

    tgt.type = JSONResponse.getType(real)
    tgt.notNull = notEmpty == true || nullable == false || (nullable == null && real != null)
    tgt.notEmpty = notEmpty == true || (notEmpty == null && StringUtil.isNotEmpty(real))
    tgt.comment = comment

    return target;
  },


  getLength: function(value) {
    var type = JSONResponse.getType(value);
    if (type == 'array') {
      log('getLength  type == array >> return value.length = ' + value.length);
      return value.length;
    }
    if (type == 'object') {
      log('getLength  type == object >> return null;');
      return null;
    }

    if (CodeUtil.isTypeMatch('number', type)) {
      log('getLength  CodeUtil.isTypeMatch(number, type) >> ');

      var rs = String(value);

      //Double 比较整数长度
      var index = rs.indexOf(".");
      if (index >= 0) {
        rs = rs.substring(0, index);
      }

      log('getLength >> return rs.length = ' + rs.length);
      return rs.length
    }

    if (type == 'string') {
      log('getLength  type == string >> return value.length = ' + value.length);
      return value.length
    }

    //Boolean 不需要比较长度
    log('getLength  type == other >> return null;');
    return null;
  },

  /**
   * @param target
   * @param value
   * @param level 0 - [] , 1 - min-max, 2 - "conditions", 3 - 任何值都行
   * @param origin
   * @param isLength
   * @param ignoreTrend  解决在一次结果中多个值会自己与自己比较分析趋势，导致一直误报违背趋势
   * @return {*}
   */
  setValue: function(target, real, level, origin, isLength, ignoreTrend) {
    log('setValue  level = ' + level + '; isLength = ' + isLength
      + ' ;\n target = ' + JSON.stringify(target, null, '    ')
      + ' ;\n real = ' + JSON.stringify(real, null, '    ')
      + ' ;\n origin = ' + JSON.stringify(origin, null, '    ')
      +  ' >> ');

    if (target == null) {
      target = {};
    }

    // 导致出错，必须设置里面的 leval, values 等字段
    // if (real == null) {
    //   return target;
    // }

    var type = target.type;
    log('setValue  type = target.type = ' + type + ' >> ');

    if (level == null) {
      level = 0;
    }

    // 似乎无论怎样都要把 real 加进 values  if (isLength || (type != 'object' || type != 'array')) {

      var levelName = isLength != true ? 'valueLevel' : 'lengthLevel';
      target[levelName] = level;
      if (level >= 3) { //无限
        return target;
      }

      //String 类型在 长度超过一定值 或 不是 常量名 时，改成 无限模型
      //不用 type 判断类型，这样可以保证 lengthType 不会自动升级
      if (isLength != true && typeof real == 'string' && (real.length > 20 || StringUtil.isConstName(real) != true)) {
        if (level != 2) { //自定义模型不受影响
          target[levelName] = 3;
        }
        return target;
      }

      var vals = [];

      if (level == 0 || level == 1) {
        if (origin == null) {
          origin = [];
        }

        if (real != null) {
          //趋势分析，新值落在五个区域之一的次数，"trend":{ "select": ">", "above": 5, "top":4, "center":3, "bottom":2, "below":1 }
          if (ignoreTrend != true && isLength != true && origin.length > 0 && CodeUtil.isTypeMatch('number', type)) {
            log('setValue  isLength != true && origin.length > 0  >> ');

            var trend = target.trend || {};
            var select = trend.select;

            log('setValue  trend.select = ' + select + '  >> ');
            if (trend.select != '%') {  // 不再统计，可以保证容易调整判断逻辑
              log('setValue  trend.select != %  >> ');

              var above = trend.above || 0;
              var top = trend.top || 0;
              var center = trend.center || 0;
              var bottom = trend.bottom || 0;
              var below = trend.below || 0;

              log('setValue  BEFORE  select: ' + select + ', above: ' + above + ', top: ' + top + ', center: ' + center + ', bottom: ' + bottom + ', below: ' + below + ' >>');

              if (real > origin[0]) {
                trend.above = above = above + 1;
              }
              else if (real == origin[0]) {
                trend.top = top = top + 1;
              }
              else if (real == origin[origin.length - 1]) {
                trend.bottom = bottom = bottom + 1;
              }
              else if (real < origin[origin.length - 1]) {
                trend.below = below = below + 1;
              }
              else {
                trend.center = center = center + 1;
              }

              // = null 还有在下面判断，否则会把 trend.select 从非 null 值又设置回 null。  var select = null;
              if (center > 0) {
                select = '%';  // level: 1 时永远是 % 兜底 above + below <= 0 ? '%' : '~';
              }
              else if (bottom + below <= 0) {
                if (trend.above > 0) {
                  select = trend.top > 0 ? '>=' : '>';
                }
              }
              else if (top + above <= 0) {
                if (trend.below > 0) {
                  select = trend.bottom > 0 ? '<=' : '<';
                }
              }

              if (trend.select == null || trend.select == select) {
                // || (trend.select == '<' && select == '<=')
                // || (trend.select == '>' && select == '>=')) {
                log('setValue  trend.select == null || trend.select == select  >>  trend.select = select;');
                trend.select = select;
              }
              else if (trend.select == '<') { // 已简化
                log('setValue  trend.select == <  >> trend.select = select == <= ? select : %;');
                trend.select = select == '<=' ? select : '%';
              }
              else if (trend.select == '>') { // 已简化
                log('setValue  trend.select == >  >> trend.select = select == >= ? select : %;');
                trend.select = select == '>=' ? select : '%';
              }
              else {  // 其它情况都未被了 递增或递减 的趋势，只能用 [min, max] 这种包括在内的区间范围
                log('setValue  else  >> trend.select = %;');
                trend.select = '%';
              }

              log('setValue  AFTER  select: ' + trend.select + ', above: ' + trend.above + ', top: ' + trend.top
                + ', center: ' + trend.center + ', bottom: ' + trend.bottom + ', below: ' + trend.below + ' >>');
              target.trend = trend;
            }

          }

          if (origin.indexOf(real) < 0) {
            origin.push(real);
          }
          else {
            var repeat = target.repeat == null ? 0 : target.repeat
            target.repeat = repeat + 1
          }
        }

        vals = origin;
      }
      else {
        if (real != null) {
          vals.push(real);
        }
      }

      if (vals.length > 1 && (isLength || CodeUtil.isTypeMatch('number', type))) {
        vals = vals.sort(function (x, y) { //倒序排列，一般都是用最大长度(数据count，字符串长度等)
          if (x < y) {
            return 1;
          }
          if (x > y) {
            return -1;
          }
          return 0;
        })
      }

      var name = isLength != true ? 'values' : 'lengths';
      log('setValue  name = ' + name + '; vals = ' + JSON.stringify(vals, null, '    ') + ' >> ');

      switch (level) {
        case 0:
        case 1:
          var realIsNum = CodeUtil.isTypeMatch('number', typeof real)
          //当 离散区间模型 可取值超过最大数量时自动转为 连续区间模型
          var maxCount = isLength ? 3 : JSONResponse.getMaxValueCount(type);
          var extraCount = maxCount <= 0 ? 0 : vals.length - maxCount;
          if (extraCount > 0 && level < 1) {
            if (realIsNum != true) {  // 只有数字才可能有连续区间模型
              target[levelName] = 3;
              return target;
            }

            target[levelName] = 1;  // 只有数字才可能有连续区间模型
          }
          else if (level < 1 && realIsNum && (real < -10 || real > 10000 || Number.isSafeInteger(real) != true)) {
            target[levelName] = 1;  // 超出了正常的枚举值范围
          }

          //从中间删除多余的值
          while (extraCount > 0) {
            vals.splice(Math.ceil(vals.length/2), 1);
            extraCount -= 1;
          }
          target[name] = vals;
          break;
        case 2: //自定义的复杂条件，一般是准确的，不会纠错
          // target[name] = (StringUtil.isEmpty(origin, true) ? '' : origin + ',')
          //   + ('<=' + vals[0] + (vals.length <= 1 ? '' : ',>=' + vals[vals.length - 1]));
          break;
      }
    // }

    return target;
  },

  getMaxValueCount: function(type) {
    switch (type) {
      case 'boolean':
        return 2;
      case 'number':
        return 10;
      case 'string':
        return 10;
    }

    return 0;
  },


  getAbstractPath: function (folder, name, divider) {
    folder = folder == null ? '' : folder;
    name = name == null ? '' : name; //导致 0 变为 ''   name = name || '';
    divider = divider == null ? '/' : divider;
    return StringUtil.isEmpty(folder, true) ? name : folder + divider + name;
  },

  getShowString: function(arr, lineItemCount) {
    if (arr == null || arr.length <= 0) {
      return '';
    }
    if (lineItemCount == null || lineItemCount <= 0) {
      return arr.join();
    }

    var s2 = '';
    for (var i = 0; i < arr.length; i += lineItemCount) {
      var lineArr = arr.slice(i, i < arr.length - lineItemCount ? (i + lineItemCount) : arr.length);
      s2 += (i > 0 ? '<br/>' : '') + lineArr.join();
    }

    return s2;
  },

  /** [1, true, 'a', {}, []] => { '0': 1, '1': true, '2': 'a', '3': {}, '4': [] }
   * @param value
   * @param name
   * @param onlyKeys
   * @param containChild
   * @return {*}
   */
  array2object: function (value, name, onlyKeys, containChild) {
    if (value instanceof Array) {
      if (onlyKeys == null || onlyKeys.indexOf(name) >= 0) {
        var obj = {}
        for (var i = 0; i < value.length; i++) {
          obj[String(i)] = containChild ? JSONResponse.array2object(value[i], i, onlyKeys, containChild) : value[i];
        }
        return obj;
      }

      for (var i = 0; i < value.length; i++) {
        value[i] = JSONResponse.array2object(value[i], i, onlyKeys, containChild);
      }
    }
    else if (value instanceof Object) {
      for (var k in value) {
        if (k != null) {
          var v = value[k]

          if (containChild != true && (v instanceof Object == false || (onlyKeys != null && onlyKeys.indexOf(name) < 0))) {
            continue
          }

          value[k] = JSONResponse.array2object(v, k, onlyKeys, containChild);
        }
      }
    }

    return value;
  },

  getXYWHD: function (bbox) {
    if (bbox == null) {
      return null;
    }
    if (JSONResponse.isString(bbox)) {
      bbox = StringUtil.split(bbox, ',', true);
    }
    if (bbox instanceof Array) {
      return [+ (bbox[0] || 0), + (bbox[1] || 0), + (bbox[2] || 0), + (bbox[3] || 0), + (bbox[4] || 0)];
    }

    var x = bbox.x || bbox.x0 || bbox.x1 || bbox.startX || bbox.xStart || bbox.leftTopX || bbox.topLeftX || bbox.start_x || bbox.x_start || bbox.left_top_x || bbox.top_left_x || 0;
    var y = bbox.y || bbox.y0 || bbox.y1 || bbox.startY || bbox.yStart || bbox.leftTopY || bbox.topLeftY || bbox.start_y || bbox.y_start || bbox.left_top_y || bbox.top_left_y || 0;
    var w = bbox.w || bbox.width || ((bbox.x2 || bbox.x1 || bbox.rbx || bbox.brx || bbox.endX || bbox.xEnd || bbox.rightBottomX || bbox.bottomRightX || bbox.end_x || bbox.x_end || bbox.right_bottom_x || bbox.bottom_right_x || 0) - x);
    var h = bbox.h || bbox.height || ((bbox.y2 || bbox.y1 || bbox.rby || bbox.bry || bbox.endY || bbox.yEnd || bbox.rightBottomY || bbox.bottomRightY || bbox.end_y || bbox.y_end || bbox.right_bottom_y || bbox.bottom_right_y || 0) - y);
    var d = bbox.degree || bbox.angle || bbox.rotate || bbox.perspective || bbox.d || bbox.r || bbox.p || bbox.a;
    return [+ (x || 0), + (y || 0), + (w || 0), + (h || 0), + (d || 0)];
  },
  /**
   * 计算两个 bbox（[x, y, w, h, r]）的 IoU
   */
  computeIoU: function(b1, b2) {
    const [x1, y1, w1, h1, d1] = JSONResponse.getXYWHD(b1);
    const [x2, y2, w2, h2, d2] = JSONResponse.getXYWHD(b2);

    const xA = Math.max(x1, x2);
    const yA = Math.max(y1, y2);
    const xB = Math.min(x1 + w1, x2 + w2);
    const yB = Math.min(y1 + h1, y2 + h2);

    const interW = xB - xA;
    const interH = yB - yA;

    if (interW <= 0 || interH <= 0) return 0;

    const interArea = interW * interH;
    const unionArea = w1 * h1 + w2 * h2 - interArea;
    const dd = (1 - Math.abs(d1 - d2)/180);

    return (interArea / unionArea) * dd;
  },

  /**
   * 根据 IoU 过滤掉重复框，生成差异框集合
   * @returns [{...box, isBefore: true/false}]
   */
  filterDiffBoxes: function(before, after, { iouThreshold = 0.5 } = {}) {
    if (JSONObject.len(before) <= 0) {
      return after;
    }
    if (JSONObject.len(after) <= 0) {
      return before;
    }

    const usedAfter = new Set();
    const diff = [];

    before.forEach(b1 => {
      const match = after.find((b2, i) => {
        const iou = JSONResponse.computeIoU((b1.bbox || {}).box || b1.box || b1.bbox || [], (b2.bbox || {}).box || b2.box || b2.bbox || []);
        if (iou >= iouThreshold && ! usedAfter.has(i)) {
          usedAfter.add(i);
          return true;
        }
        return false;
      });

      if (! match) {
        diff.push({ ...b1, isBefore: true });
      }
    });

    after.forEach((b2, i) => {
      if (! usedAfter.has(i)) {
        diff.push({ ...b2, isBefore: false });
      }
    });

    return diff;
  },

  clamp: function(num, min, max) {
    return Math.min(Math.max(num, min), max);
  },
  /**
   * 对原始颜色做偏移，红移和蓝移大致 20%
   * @param {number[]} color RGBA数组 [r,g,b,a]
   * @param {'red'|'blue'} mode
   * @param {number} alphaFactor 透明度缩放因子，例如1.2 或 0.7
   * @returns {number[]} 新的RGBA颜色数组
   */
   shiftColor: function(color, mode, alphaFactor = 1) {
    let [r, g, b, a] = color;
    const shiftRatio = 0.2; // 20%

    if (mode === 'red') {
      // 红移：增加红色，减少蓝色和绿色
      r = JSONResponse.clamp(r * (1 + shiftRatio), 0, 255);
      g = JSONResponse.clamp(g * (1 - shiftRatio), 0, 255);
      b = JSONResponse.clamp(b * (1 - shiftRatio), 0, 255);
    } else if (mode === 'blue') {
      // 蓝移：增加蓝色，减少红色和绿色
      r = JSONResponse.clamp(r * (1 - shiftRatio), 0, 255);
      g = JSONResponse.clamp(g * (1 - shiftRatio), 0, 255);
      b = JSONResponse.clamp(b * (1 + shiftRatio), 0, 255);
    }

    // 透明度缩放后裁剪
    a = JSONResponse.clamp(a * alphaFactor, 0, 255);

    return [Math.round(r), Math.round(g), Math.round(b), Math.round(a)];
  },
  /**
   * 根据模式对颜色整体亮度做调整
   * @param {number[]} color RGBA数组 [r,g,b,a]
   * @param {'darken'|'brighten'} mode
   * @param {number} alphaFactor 透明度缩放因子
   * @returns {number[]} 新的RGBA颜色数组
   */
  adjustBrightness: function(color, mode, alphaFactor = 1) {
    let [r, g, b, a] = color;
    let factor = 1;
    if (mode === 'darken') {
      factor = 0.8; // 变暗淡 80%
    } else if (mode === 'brighten') {
      factor = 1.2; // 变高亮 120%
    }
    r = JSONResponse.clamp(r * factor, 0, 255);
    g = JSONResponse.clamp(g * factor, 0, 255);
    b = JSONResponse.clamp(b * factor, 0, 255);
    a = JSONResponse.clamp(a * alphaFactor, 0, 255);
    return [Math.round(r), Math.round(g), Math.round(b), Math.round(a)];
  },

  isInsideBox: function(x, y, [bx, by, bw, bh]) {
    return x >= bx && x <= bx + bw && y >= by && y <= by + bh;
  },
  isOnBorder: function(x, y, [bx, by, bw, bh], range) {
    if (range == null || range <= 0) {
      range = 0.3*Math.min(bh, bw);
    }
    var xr = Math.min(range, 0.5*bw);
    var yr = Math.min(range, 0.5*bh);
    return JSONResponse.isInsideBox(x, y, [bx, by, bw, bh])
        && ! JSONResponse.isInsideBox(x, y, [bx + xr, by + yr, bw - 2*xr, bh - 2*yr]);
  },

  getPolygons: function (detection) {
    if (! JSONResponse.isObject(detection)) {
      return null;
    }

    return detection.polygons
  },
  getLines: function (detection) {
    if (! JSONResponse.isObject(detection)) {
      return null;
    }

    return detection.lines || detection.keyLines || detection.key_lines
  },
  getPoints: function (detection) {
    if (! JSONResponse.isObject(detection)) {
      return null;
    }

    return detection.points || detection.keyPoints || detection.key_points
  },
  getBboxes: function (detection) {
    if (! JSONResponse.isObject(detection)) {
      return null;
    }

    return detection.bboxes || detection.boxes || detection.targets
  },
  getBbox: function (item) {
    if (item instanceof Array || JSONResponse.isString(item)) {
      return item;
    }
    if (! JSONResponse.isObject(item)) {
      return null;
    }

    var bb = JSONResponse.getBbox(item.bbox);
    if (bb instanceof Object || JSONResponse.isString(bb)) {
      return bb;
    }

    return item.bbox || item.box || item
  },
  getScore: function (item) {
    return item.score || item.probability || item.possibility || item.feasibility || item.eventuality || item.odds || item.prob || item.possib || item.feasib || item.eventual;
  },

  drawDetections: function(canvas, detection, options, img, ctx) {
    if (!detection || typeof detection !== 'object') {
      console.error('drawDetections: invalid detection input');
      return;
    }

    const height = canvas.height || (img || {}).height;
    const width = canvas.width || (img || {}).width;
    const fontSize = Math.max(12, Math.min(48, height * 0.05));

    const isRoot = ctx == null;
    if (isRoot) {
      ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, width, height);
    }
    ctx.lineWidth = Math.max(1, Math.min(8, height * 0.005));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textBaseline = 'top';

    const placedLabels = [];
    const rotateBoxes = options.rotateBoxes || false;
    const rotateText = options.rotateText || false;
    const showLabelBackground = options.labelBackground || false;
    const hoverBoxId = options.hoverBoxId || null;
    const visiblePaths = options.visiblePaths || null;
    const stage = options.stage;
    const isDiff = stage === 'diff';
    const markable = options.markable || stage === 'after';

    const nw = img == null ? 0 : (img.naturalWidth || 0);
    const nh = img == null ? 0 : (img.naturalHeight || 0);
    const xRate = nw < 1 ? 1 : width/nw;
    const yRate = nh < 1 ? 1 : height/nh;

    // Draw bboxes
    var bboxes = JSONResponse.getBboxes(detection) || []
    bboxes?.forEach((item, index) => {
      const isHovered = item.id === hoverBoxId;
      const visible = ! visiblePaths || visiblePaths.length <= 0 || visiblePaths.includes(item.path || item.id);
      if (! visible) {
        return;
      }

      var [x, y, w, h, d] = JSONResponse.getXYWHD(JSONResponse.getBbox(item) || []);
      const isRate = Math.abs(x) < 1 && Math.abs(y) < 1 && Math.abs(w) < 1 && Math.abs(h) < 1;
      x = isRate ? x*width : x*xRate;
      y = isRate ? y*height : y*yRate;
      w = isRate ? w*width : w*xRate;
      h = isRate ? h*height : h*yRate;
      const angle = item.degree || item.rotate || item.angle || item.perspective || d || 0;

      var color = item.color;
      if (options.styleOverride) {
        const override = options.styleOverride(item, item.isBefore);
        if (override && override.color) {
          color = override.color;
        }
      }

      const [r, g, b, a] = color || [0, 255, 0, 255];
      const rgba = `rgba(${r}, ${g}, ${b}, ${Math.min(0.5, a / 255)})`;

      const reversedRgba = `rgba(${255 - r}, ${255 - g}, ${255 - b}`; // , 0.2`; // ${1 - a/255})`;
      // const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      const backgroundFill = rgba; // 还是有些看不清 luma > 186 ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)';

      ctx.strokeStyle = isHovered ? reversedRgba : rgba;
      ctx.fillStyle = rgba;

      // Draw horizontal box
      ctx.strokeRect(x, y, w, h);

      // Optionally draw rotated box
      if (rotateBoxes && angle !== 0) {
        ctx.save();
        ctx.translate(x + w / 2, y + h / 2);
        ctx.rotate((angle * Math.PI) / 180);
        ctx.strokeRect(-w / 2, -h / 2, w, h);
        ctx.restore();
      }

      // Label
      const label = (isDiff ? (item.isBefore ? '- ' : '+ ') : '') + `${item.ocr || item.label || ''}-${item.id || ''} ${((JSONResponse.getScore(item) || 0)*100).toFixed(0)}%${angle == 0 ? '' : ' ' + Math.round(angle) + '°'}`;
      // ctx.font = 'bold 36px';
      // const size = ctx.measureText(label);
      // const textHeight = size.height || height*0.1; // Math.max(height*0.1, size.height);
      // 让字号约为 canvas 高度的 2%，并限定 12~48px
      ctx.font = `bold ${fontSize}px sans-serif`;
      const size = ctx.measureText(label);
      // 自动从 font 里提取 px 字号
      const fontMatch = ctx.font.match(/(\d+)px/);
      const textHeight = fontMatch ? parseInt(fontMatch[1]) : 36;  // fallback 到 36px
      const textWidth = size.width; // *textHeight/size.height;
      const padding = 2;

      let positions = [
        [x, y - textHeight - padding],
        [x + w - textWidth, y - textHeight - padding],
        [x, y + h + padding],
        [x + w - textWidth, y + h + padding]
      ];

      let labelX = x, labelY = y - textHeight - padding;
      for (const [lx, ly] of positions) {
        const overlaps = placedLabels.some(({ x: ox, y: oy, w: ow, h: oh }) =>
            lx < ox + ow && lx + textWidth > ox && ly < oy + oh && ly + textHeight > oy
        );
        if (! overlaps && lx >= 0 && ly >= 0 && lx + textWidth <= canvas.width && ly + textHeight <= canvas.height) {
          labelX = lx;
          labelY = ly;
          break;
        }
      }

      placedLabels.push({ x: labelX, y: labelY, w: textWidth, h: textHeight });

      ctx.save();
      if (rotateText && angle !== 0) {
        ctx.translate(labelX + textWidth / 2, labelY + textHeight / 2);
        ctx.rotate((angle * Math.PI) / 180);
        ctx.translate(-textWidth / 2, -textHeight / 2);
        labelX = 0;
        labelY = 0;
      }

      if (showLabelBackground) {
        ctx.fillStyle = backgroundFill;
        ctx.fillRect(labelX - 2, labelY - 1, textWidth + 4, textHeight + 2);
      }

      ctx.fillStyle = showLabelBackground ? reversedRgba : rgba;
      ctx.fillText(label, labelX, labelY);
      ctx.restore();

      if (markable) {
        // 绘制 √ 和 ×
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = item.correct === false ? 'red' : 'green';
        const checkX = labelX + textWidth + 4;
        const checkY = labelY;
        ctx.fillText(item.correct === false ? '×' : '√', checkX, checkY);

        // 记录点击区域
        if (!canvas._clickAreas) {
          canvas._clickAreas = [];
        }
        canvas._clickAreas.push({x: checkX, y: checkY, w: 16, h: textHeight, item});
      }

      JSONResponse.drawDetections(canvas, item, options, img, ctx);
    });

    // Draw lines
    var lines = JSONResponse.getLines(detection);
    if (lines instanceof Array) {
      lines?.forEach((item) => {
        var [x, y, w, h, d] = JSONResponse.getXYWHD(item);
        const isRate = Math.abs(x) < 1 && Math.abs(y) < 1 && Math.abs(w) < 1 && Math.abs(h) < 1;
        x = isRate ? x*width : x*xRate;
        y = isRate ? y*height : y*yRate;
        w = isRate ? w*width : w*xRate;
        h = isRate ? h*height : h*yRate;

        const color = item.color || detection.color || detection.bbox?.color;
        const rgba = color == null || color.length <= 0 ? null : `rgba(${color.join(',')})`;
        if (rgba != null) {
          ctx.fillStyle = rgba;
          ctx.strokeStyle = rgba;
        }

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y + h);
        ctx.stroke();

        if (isRoot) {
          const label = (isDiff ? (item.isBefore || detection.isBefore ? '- ' : '+ ') : '')
              + `${item.label || ''}-${item.id || item.idx || detection.id || detection.idx || ''} `
              + `${((JSONResponse.getScore(item) || 0)*100).toFixed(0)}%`;
          ctx.font = `${Math.max(16, height*0.015)}px sans-serif`;
          ctx.fillText(label, x + 3, y + 3);
        }
      });
    }

    // Draw points
    var points = JSONResponse.getPoints(detection);
    if (points instanceof Array) {
      points?.forEach((item) => {
        var [x, y, w, h, d] = JSONResponse.getXYWHD(item);
        const isRate = Math.abs(x) < 1 && Math.abs(y) < 1 && Math.abs(w) < 1 && Math.abs(h) < 1;
        x = isRate ? x*width : x*xRate;
        y = isRate ? y*height : y*yRate;

        const color = item.color || detection.color || detection.bbox?.color;
        const rgba = color == null || color.length <= 0 ? null : `rgba(${color.join(',')})`;
        if (rgba != null) {
          ctx.fillStyle = rgba;
          ctx.strokeStyle = rgba;
        }

        ctx.beginPath();
        ctx.arc(x, y, Math.max(2, height*0.005), 0, 2*Math.PI);
        ctx.fill();

        if (isRoot) {
          const label = (isDiff ? (item.isBefore || detection.isBefore ? '- ' : '+ ') : '')
              + `${item.label || ''}-${item.id || item.idx || detection.id || detection.idx || ''} `
              + `${((JSONResponse.getScore(item) || 0)*100).toFixed(0)}%`;
          ctx.font = `${Math.max(16, height*0.015)}px sans-serif`;
          ctx.fillText(label, x + 3, y + 3);
        }
      });
    }

    // Draw polygons
    var polygons = JSONResponse.getPolygons(detection);
    if (polygons instanceof Array && polygons?.length > 1) {
      ctx.beginPath();
      polygons.forEach((item, i) => {
        var [x, y, w, h, d] = JSONResponse.getXYWHD(item);
        const isRate = Math.abs(x) < 1 && Math.abs(y) < 1 && Math.abs(w) < 1 && Math.abs(h) < 1;
        x = isRate ? x*width : x*xRate;
        y = isRate ? y*height : y*yRate;

        if (i === 0) {
          ctx.moveTo(x, y);
        }
        else {
          ctx.lineTo(x, y);
        }
      });
      ctx.closePath();
      ctx.stroke();
    }
  }

};

if (typeof module == 'object') {
  module.exports = JSONResponse;
}
