const TAG = 'CodeUtil'

/**解析出 生成iOS-Swift请求JSON 的代码
 * 只需要把所有 对象标识{} 改为数组标识 []
 * @param name
 * @param reqObj
 * @param depth
 * @return parseCode
 */
function parseSwift(name, reqObj, depth) {
  if (depth == null || depth < 0) {
    depth = 0;
  }
  var hasContent = false;

  return parseCode(name, reqObj, {

    onParseParentStart: function () {
      return '[\n';
    },

    onParseParentEnd: function () {
      return (hasContent ? '\n' : getBlank(depth + 1) + ':\n') + getBlank(depth) + ']';
    },

    onParseChildArray: function (key, value, index) {
      hasContent = true;
      return (index > 0 ? ',\n' : '') + getBlank(depth + 1) + '"' + key + '": ' + parseSwift(key, value, depth + 1);
    },

    onParseChildObject: function (key, value, index) {
      hasContent = true;
      return (index > 0 ? ',\n' : '') + getBlank(depth + 1) + '"' + key + '": ' + parseSwift(key, value, depth + 1);
    },

    onParseChildOther: function (key, value, index) {
      hasContent = true;

      let v; //避免改变原来的value
      if (typeof value == 'string') {
        log(TAG, 'parseJava  for typeof value === "string" >>  ' );

        v = '"' + value + '"';
      }
      else if (value instanceof Array) {
        log(TAG, 'parseJava  for typeof value === "array" >>  ' );

        v = '[' + getArrayString(value) + ']';
      }
      else {
        v = value
      }

      return (index > 0 ? ',\n' : '') + getBlank(depth + 1) + '"' + key + '": ' + v;
    }
  })

}



/**解析出 生成Android-Java请求JSON 的代码
 * @param name
 * @param reqObj
 * @param depth
 * @return parseCode
 */
function parseJava(name, reqObj, depth) {
  if (depth == null || depth < 0) {
    depth = 0;
  }

  const parentKey = isArrayKey(name) ? getItemKey(name) : getTableKey(name);

  return parseCode(name, reqObj, {

    onParseParentStart: function () {
      return '\nJSONRequest ' + parentKey + ' = new JSONRequest();';
    },

    onParseParentEnd: function () {
      return '';
    },

    onParseChildArray: function (key, value, index) {

      let s = '\n\n//' + key + '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

      const count = value.count || 0;
      const page = value.page || 0;

      log(TAG, 'parseJava  for  count = ' + count + '; page = ' + page);

      delete value.count;
      delete value.page;

      s += parseJava(key, value, depth + 1);

      log(TAG, 'parseJava  for delete >> count = ' + count + '; page = ' + page);

      let prefix = key.substring(0, key.length - 2);

      s += '\n\n'
        + parentKey + '.putAll(' +  getItemKey(key) + '.toArray('
        + count  + ', ' + page + (prefix.length <= 0 ? '' : ', "' + prefix + '"') + '));';

      s += '\n//' + key + '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

      return s;
    },

    onParseChildObject: function (key, value, index) {
      let s = '\n\n//' + key + '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

      s += parseJava(key, value, depth + 1);
      s += '\n\n' + parentKey + '.put("' + key + '", ' + getTableKey(key) + ');';

      s += '\n//' + key + '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

      return s;
    },

    onParseChildOther: function (key, value, index) {

      let v; //避免改变原来的value
      if (typeof value == 'string') {
        log(TAG, 'parseJava  for typeof value === "string" >>  ' );

        v = '"' + value + '"';
      }
      else if (value instanceof Array) {
        log(TAG, 'parseJava  for typeof value === "array" >>  ' );

        v = 'new Object[]{' + getArrayString(value) + '}';
      }
      else {
        v = value
      }

      return '\n' + parentKey + '.put("' + key + '", ' + v + ');';
    }
  })

}






/**解析出 生成请求JSON 的代码
 * @param name
 * @param reqObj
 * @param callback Object，带以下回调函数function：
 *                 解析父对象Parent的onParseParentStart和onParseParentEnd,
 *                 解析APIJSON数组Object的onParseArray,
 *                 解析普通Object的onParseObject,
 *                 解析其它键值对的onParseOther.
 *
 *                 其中每个都必须返回String，空的情况下返回'' -> response += callback.fun(...)
 * @return
 */
function parseCode(name, reqObj, callback) {
  if (reqObj == null || reqObj == '') {
    log(TAG, 'parseCode  reqObj == null || reqObj.isEmpty() >> return null;');
    return null;
  }
  if (typeof reqObj != 'object') {
    log(TAG, 'parseCode  typeof reqObj != object >> return null;');
    return null;
  }
  log(TAG, '\n\n\n parseCode  name = ' + name + '; reqObj = \n' + format(JSON.stringify(reqObj)));

  let response = callback.onParseParentStart();

  let index = 0; //实际有效键值对key:value的所在reqObj内的位置
  let value;
  for (var key in reqObj) {
    log(TAG, 'parseCode  for  key = ' + key);
    //key == null || value == null 的键值对被视为无效
    value = key == null ? null : reqObj[key];
    if (value == null) {
      continue;
    }

    log(TAG, 'parseCode  for  index = ' + index);

    if (value instanceof Object && (value instanceof Array) == false) {//APIJSON Array转为常规JSONArray
      log(TAG, 'parseCode  for typeof value === "object" >>  ' );

      if (isArrayKey(key)) { // APIJSON Array转为常规JSONArray
        log(TAG, 'parseCode  for isArrayKey(key) >>  ' );

        response += callback.onParseChildArray(key, value, index);
      }
      else { // 常规JSONObject，往下一级提取
        log(TAG, 'parseCode  for isArrayKey(key) == false >>  ' );

        response += callback.onParseChildObject(key, value, index);
      }
    }
    else { // 其它Object，直接填充

      response += callback.onParseChildOther(key, value, index);
    }

    index ++;
  }


  response += callback.onParseParentEnd();

  log(TAG, 'parseCode  return response = \n' + response + '\n\n\n');
  return response;
}


/**根据层级获取键值对前面的空格
 * @param depth
 * @return {string}
 */
function getBlank(depth) {
  let s = '';
  for (var i = 0; i < depth; i ++) {
    s += '    ';
  }
  return s;
}

/**根据数组arr生成用 , 分割的字符串
 * 直接用 join 会导致里面的 String 没有被 "" 包裹
 * @param arr
 */
function getArrayString(arr) {
  if (arr == null || arr.length <= 0) {
    return arr;
  }

  let s = '';
  let v;
  for (var i = 0; i < arr.length; i ++) {
    v = (typeof arr[i] == 'string' ? '"' + arr[i] + '"': arr[i]) //只支持基本类型
    s += (i > 0 ? ', ' : '') + v;
  }
  return s;
}


/**获取Table变量名
 * @param key
 * @return empty ? 'reqObj' : key + 'Request' 且首字母小写
 */
function getTableKey(key) {
  return addSuffix(key, 'Request');
}
/**获取数组内Object变量名
 * @param key
 * @return empty ? 'reqObj' : key + 'Request' 且首字母小写
 */
function getItemKey(key) {
  return addSuffix(key.substring(0, key.length - 2), 'Item');
}
/**判断key是否为表名
 * @param key
 * @return
 */
function isTableKey(key) {
  log(TAG, 'isTableKey  typeof key = ' + (typeof key));
  return key != null && /^[A-Z][A-Za-z0-9_]*$/.test(key);
}
/**判断key是否为数组名
 * @param key
 * @return
 */
function isArrayKey(key) {
  log(TAG, 'isArrayKey  typeof key = ' + (typeof key));
  return key != null && key.endsWith('[]');
}