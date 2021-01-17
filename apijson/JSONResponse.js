/*Copyright ©2017 TommyLemon(https://github.com/TommyLemon/APIAuto)

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


function log(msg) {
  // console.log(msg);
}

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
  getVariableName(fullName, listSuffix) {
    if (JSONObject.isArrayKey(fullName)) {
      fullName = StringUtil.addSuffix(fullName.substring(0, fullName.length - 2), listSuffix || "list");
    }
    return JSONResponse.formatKey(fullName, true, true, true, true, true, true);
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
   * @param formatAlias 去除别名分隔符 : ， A:b => AAsB
   * @param formatHyphen 去除分隔符 - ， A-b-cd-Efg => aBCdEfg
   * @param firstCase 第一个单词首字母小写，后面的首字母大写， Ab => ab ; A-b-Cd => aBCd
   * @return name => name; name:alias => alias
   */
  formatKey(fullName, formatAlias, formatAt, formatHyphen, firstCase, formatUnderline, formatFunChar) {
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
  formatAt(key) {
    var k = key.startsWith("@") ? key.substring(1) : key;
    return k; //由 formatFunChar 实现去掉末尾的 @ k.endsWith("@") ? k.substring(0, k.length - 1) : k;
  },
  /**key:alias => keyAsAlias
   * @param key
   * @return
   */
  formatAlias(key) {
    var index = key.indexOf(":");
    return index < 0 ? key : key.substring(0, index) + 'As' + StringUtil.firstCase(key.substring(index + 1), true);
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

  /**A_b_cd_Efg => ABCdEfg
   * @param key
   * @return
   */
  formatUnderline(key, firstCase) {
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
  formatFunChar(key) {
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
  COMPARE_KEY_MORE: 1,
  COMPARE_VALUE_MORE: 1,
  COMPARE_EQUAL_EXCEPTION: 1,
  COMPARE_LENGTH_CHANGE: 2,
  COMPARE_VALUE_CHANGE: 2,
  COMPARE_KEY_LESS: 3,
  COMPARE_TYPE_CHANGE: 4,
  COMPARE_NUMBER_TYPE_CHANGE: 3,
  COMPARE_CODE_CHANGE: 4,
  COMPARE_THROW_CHANGE: 4,

  /**测试compare: 对比 新的请求与上次请求的结果
   0-相同，无颜色；
   1-对象新增字段或数组新增值，绿色；
   2-值改变，蓝色；
   3-对象缺少字段/整数变小数，黄色；
   4-code/值类型 改变，红色；
   */
  compareResponse: function(target, real, folder, isMachineLearning, codeName, exceptKeys) {
    codeName = StringUtil.isEmpty(codeName, true) ? 'code' : codeName;
    var tCode = (target || {})[codeName];
    var rCode = (real || {})[codeName];

    //解决了弹窗提示机器学习更新标准异常，但导致所有项测试结果都变成状态码 code 改变
    // if (real == null) {
    //   return {
    //     code: JSONResponse.COMPARE_ERROR, //未上传对比标准
    //     msg: 'response 为 null！',
    //     path: folder == null ? '' : folder
    //   };
    // }

    if (tCode == null) {
      return {
        code: JSONResponse.COMPARE_NO_STANDARD, //未上传对比标准
        msg: '没有校验标准！',
        path: folder == null ? '' : folder
      };
    }

    var tThrw = target.throw;
    var rThrw = real.throw;

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
          msg: '符合异常分支 ' + codeName + ':' + rCode + (StringUtil.isEmpty(rThrw) ? '' : ', throw:' + rThrw) + ', msg:' + StringUtil.trim(find.msg),
          path: folder == null ? '' : folder
        };
      }

      return rCode != tCode ? {
        code: JSONResponse.COMPARE_CODE_CHANGE,
        msg: '状态码 ' + codeName + ' 改变！',
        path: folder == null ? '' : folder
      } : {
        code: JSONResponse.COMPARE_THROW_CHANGE,
        msg: '异常 throw 改变！',
        path: folder == null ? '' : folder
      };
    }

    delete target[codeName];
    delete real[codeName];

    delete target.throw;
    delete real.throw;

    //可能提示语变化，也要提示
    // delete target.msg;
    // delete real.msg;

    var result = null
    try {
       result = isMachineLearning == true
        ? JSONResponse.compareWithStandard(target, real, folder, exceptKeys)
        : JSONResponse.compareWithBefore(target, real, folder, exceptKeys);
    } finally {
      target[codeName] = tCode;
      real[codeName] = rCode;

      target.throw = tThrw;
      real.throw = rThrw;
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

      each = JSONResponse.compareWithBefore(target[0], all, JSONResponse.getAbstractPath(folder, i), exceptKeys);

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
        if (key == null || (exceptKeys != null && exceptKeys.indexOf(key) >= 0)) {
          continue;
        }

        each = JSONResponse.compareWithBefore(target[key], real[key], JSONResponse.getAbstractPath(folder, key), exceptKeys);
        if (max.code < each.code) {
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


  /**测试compare: 对比 新的请求与从历史请求结果提取的校验模型  TODO 新增 exceptions(删除等部分接口只有第一次成功) 和字符串格式 format(DATE, TIME, NUMBER)
   0-相同，无颜色；
   1-新增字段/新增值，绿色；
   2-值改变，蓝色；
   3-缺少字段/整数变小数，黄色；
   4-类型/code 改变，红色；
   */
  compareWithStandard: function(target, real, folder, exceptKeys) {
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

    var notnull = target.notnull;
    log('compareWithStandard  notnull = target.notnull = ' + notnull + ' >>');

    var type = target.type;
    log('compareWithStandard  type = target.type = ' + type + ' >>');

    var valueLevel = target.valueLevel;
    log('compareWithStandard  valueLevel = target.valueLevel = ' + valueLevel + ' >>');

    var values = target.values;
    log('compareWithStandard  values = target.values = ' + JSON.stringify(values, null, '    ') + ' >>');

    if ((values == null || values[0] == null) && (type == 'object' || type == 'array')) {
      if (notnull == true) { // values{} values&{}
        throw new Error('Standard 在 ' + folder + ' 语法错误，Object 或 Array 在 notnull: true 时 values 必须为有值的数组 !');
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
      log('compareWithStandard  real == null >> return ' + (notnull == true ? 'COMPARE_KEY_LESS' : 'COMPARE_EQUAL'));
      return {
        code: notnull == true ? JSONResponse.COMPARE_KEY_LESS : JSONResponse.COMPARE_EQUAL,
        msg: notnull == true ? '是缺少的' : '结果正确',
        path: notnull == true ? folder : '',
        value: real
      };
    }



    if (type != JSONResponse.getType(real)) { //类型改变
      log('compareWithStandard  type != getType(real) >> return COMPARE_TYPE_CHANGE');
      return {
        code: JSONResponse.COMPARE_TYPE_CHANGE,
        msg: '不是 ' + type + ' 类型',
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

    var each;

    if (type == 'array') { // JSONArray
      log('compareWithStandard  type == array >> ');

      for (var i = 0; i < real.length; i ++) { //检查real的每一项
        log('compareWithStandard  for i = ' + i + ' >> ');

        each = JSONResponse.compareWithStandard(values[0], real[i], JSONResponse.getAbstractPath(folder, i), exceptKeys);

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

      var tks = values == null ? [] : Object.keys(values[0]);
      var tk;
      for (var i = 0; i < tks.length; i++) { //遍历并递归下一层
        tk = tks[i];
        if (tk == null || (exceptKeys != null && exceptKeys.indexOf(tk) >= 0)) {
          continue;
        }
        log('compareWithStandard  for tk = ' + tk + ' >> ');

        each = JSONResponse.compareWithStandard(values[0][tk], real[tk], JSONResponse.getAbstractPath(folder,  tk), exceptKeys);
        if (max.code < each.code) {
          max = each;
        }
        if (max.code >= JSONResponse.COMPARE_TYPE_CHANGE) {
          log('compareWithStandard  max >= COMPARE_TYPE_CHANGE >> return max = ' + max);
          return max;
        }
      }


      //不能注释，前面在 JSONResponse.compareWithStandard(values[0][tk], real[tk]  居然没有判断出来 COMPARE_KEY_MORE
      if (max.code < JSONResponse.COMPARE_KEY_MORE) { //多出key
        log('compareWithStandard  max < COMPARE_KEY_MORE >> ');

        for (var k in real) {
          log('compareWithStandard  for k = ' + k + ' >> ');

          if (k != null && real[k] != null && (values == null || values[0] == null || values[0][k] == null)
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

      var valueCompare = max.code >= JSONResponse.COMPARE_VALUE_CHANGE ? 0 : JSONResponse.compareValue(valueLevel, values, real, target.trend);
      if (valueCompare > 0) {
        max.code = valueCompare;
        max.path = folder;
        max.value = real;

        if (target.valueLevel != 1 || target.type != 'number') {
          max.msg = '值超出范围';
        }
        else if (valueCompare == JSONResponse.COMPARE_VALUE_MORE) {
          max.msg = '值是新增的';
        }
        else {
          var select = (target.trend || {}).select;
          var maxVal = values == null || values.length <= 0 ? null : values[0];
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


  isValueCorrect: function(level, target, real, trend) {
    return JSONResponse.compareValue(level, target, real, trend) <= 0;
  },
  compareValue: function(level, target, real, trend) {
    log('isValueCorrect  \nlevel = ' + level + '; \ntarget = ' + JSON.stringify(target)
      + '\nreal = ' + JSON.stringify(real, null, '    '));
    if (target == null || real == null) {
      log('isValueCorrect  target == null >>  return true;');
      return 0;
    }
    if (level == null) {
      level = 0;
    }

    if (level == 0) {
      if (target.indexOf(real) < 0) { // 'key{}': [0, 1]
        log('isValueCorrect  target.indexOf(real) < 0 >>  return false;');
        return JSONResponse.COMPARE_VALUE_CHANGE;
      }
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

      return target.indexOf(real) >= 0 ? 0 : JSONResponse.COMPARE_VALUE_MORE; // 为了提示上传新值，方便以后校验
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
    log('getType  o = ' + JSON.stringify(o) + '>> return ' + (o instanceof Array ? 'array' : typeof o));

    return o instanceof Array ? 'array' : typeof o;
  },


  /**更新测试标准，通过原来的标准与最新的数据合并来实现
   */
  updateStandard: function(target, real, exceptKeys) {
    if (target instanceof Array) { // JSONArray
      throw new Error("Standard 语法错误，不应该有 array！");
    }
    if (real == null) { //少了key
      log('updateStandard  real == null');
      if (target != null) { //} && target.values != null && target.values[0] != null) {
        log('updateStandard  target != null >> target.notnull = false;');
        target.notnull = false;
      }
      log('updateStandard  return target;');
      return target;
    }

    if (target == null) {
      target = {};
    }

    log('\n\n\n\n\nupdateStandard <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<\n' +
      ' \ntarget = ' + JSON.stringify(target, null, '    ') + '\n\n\nreal = ' + JSON.stringify(real, null, '    '));

    var notnull = target.notnull;
    log('updateStandard  notnull = target.notnull = ' + notnull + ' >>');
    if (notnull == null) {
      notnull = target.notnull = true;
    }

    var type = target.type;
    log('updateStandard  type = target.type = ' + type + ' >>');
    // if (type == null) { //强制用real的类型替代
    type = target.type = JSONResponse.getType(real);
    // }
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

        child = JSONResponse.updateStandard(child, real[i], exceptKeys);
      }
      if (child == null) {
        log('updateStandard  child == null >> child = {}');
        child = {} //啥都确定不了，level为null默认用0替代
      }

      values = [child];
      target = JSONResponse.setValue(target, real.length, lengthLevel == null ? 1 : lengthLevel, lengths, true);
      target = JSONResponse.setValue(target, null, valueLevel, values, false);
    }
    else if (type == 'object') {
      log('updateStandard  type == object >> ');

      target.valueLevel = valueLevel;

      if (values == null) {
        values = [];
      }
      if (values[0] == null) {
        values[0] = {};
      }

      var realKeys = Object.keys(real) || [];
      for(var k2 in values[0]) { //解决real不含k2时导致notnull不能变成false
        // log('updateStandard for k2 in values[0] = ' + k2 + ' >>');
        if (realKeys.indexOf(k2) < 0) {
          // log('updateStandard Object.keys(real).indexOf(k2) < 0 >> real[k2] = null;');
          real[k2] = null;  //TODO delete real[k2] ? 避免多出来 key: null 这种
        }
      }

      for(var k in real) {
        if (k == null || (exceptKeys != null && exceptKeys.indexOf(k) >= 0)) {
          continue
        }

        log('updateStandard for k in real = ' + k + '; values[0][k] = '
          + JSON.stringify(values[0][k], null, '    ') + ';\n real[k] = '  + JSON.stringify(real[k], null, '    ') + ' >>');
        values[0][k] = JSONResponse.updateStandard(values[0][k], real[k], exceptKeys);
      }

      target.values = values;
    }
    else {
      log('updateStandard  type == other >> ');

      if (values == null) {
        values = [];
      }
      if (valueLevel < 1 && type == 'number' && String(real).indexOf('.') >= 0) { //double 1.23
        valueLevel = 1;
      }
      target.values = values;

      target = JSONResponse.setValue(target, JSONResponse.getLength(real), lengthLevel == null ? 1 : lengthLevel, lengths, true);
      target = JSONResponse.setValue(target, real, valueLevel, values, false);
    }

    log('\nupdateStandard >> return target = ' + JSON.stringify(target, null, '    ') + '\n >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> \n\n\n\n\n');

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

    if (type == 'number') {
      log('getLength  type == number >> ');

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
   * @param lengthLevel 0 - [] , 1 - min-max, 2 - "conditions", 3 - 任何值都行
   * @param originLength
   * @return {*}
   */
  setValue: function(target, real, level, origin, isLength) {
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
          if (isLength != true && origin.length > 0 && type == 'number') {
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
        }

        vals = origin;
      }
      else {
        if (real != null) {
          vals.push(real);
        }
      }

      if (vals.length > 1 && (isLength || type == 'number')) {
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
          var realIsNum = typeof real == 'number'
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


  getAbstractPath: function (folder, name) {
    folder = folder == null ? '' : folder;
    name = name == null ? '' : name; //导致 0 变为 ''   name = name || '';
    return StringUtil.isEmpty(folder, true) ? name : folder + '/' + name;
  },

  getShowString(arr, lineItemCount) {
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

          if (containChild != true && (v instanceof Array == false || (onlyKeys != null && onlyKeys.indexOf(name) < 0))) {
            continue
          }

          value[k] = JSONResponse.array2object(v, k, onlyKeys, containChild);
        }
      }
    }

    return value;
  }

}
