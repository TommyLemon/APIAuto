const TAG = 'CodeUtil'


function parseJava(name, reqObj) {
  return parseCode(name, reqObj, {

    onParseParent: function (parentKey) {
      return '\nJSONRequest ' + parentKey + ' = new JSONRequest();';
    },

    onParseArray: function (parentKey, key, value) {

      let s = '\n\n//' + key + '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

      const count = value.count || 0;
      const page = value.page || 0;

      log(TAG, 'parseJava  for  count = ' + count + '; page = ' + page);

      delete value.count;
      delete value.page;

      s += parseJava(key, value);

      log(TAG, 'parseJava  for delete >> count = ' + count + '; page = ' + page);

      let prefix = key.substring(0, key.length - 2);

      s += '\n\n'
        + parentKey + '.putAll(' +  getItemKey(key) + '.toArray('
        + count  + ', ' + page + (prefix.length <= 0 ? '' : ', "' + prefix + '"') + '));';

      s += '\n//' + key + '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

      return s;
    },

    onParseObject: function (parentKey, key, value) {
      let s = '\n\n//' + key + '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

      s += parseJava(key, value);
      s += '\n\n' + parentKey + '.put("' + key + '", ' + getTableKey(key) + ');';

      s += '\n//' + key + '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

      return s;
    },

    onParseOther: function (parentKey, key, value) {

      if (typeof value === 'string') {
        log(TAG, 'parseJava  for typeof value === "string" >>  ' );

        value = '"' + value + '"';
      }
      else if (value instanceof Array) {
        log(TAG, 'parseJava  for typeof value === "array" >>  ' );

        value = 'new Object[]{' + value.join() + '}';
      }

      return '\n' + parentKey + '.put("' + key + '", ' + value + ');';
    }
  })

}




/**
 * @param name
 * @param reqObj
 * @param callback Object，带以下回调函数function：
 *                 解析父对象Parent的onParseParent,
 *                 解析APIJSON数组Object的onParseArray,
 *                 解析普通Object的onParseObject,
 *                 解析其它键值对的onParseOther
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
  let parentKey = isArrayKey(name) ? getItemKey(name) : getTableKey(name);

  let response = callback.onParseParent(parentKey);

  let value;
  for (var key in reqObj) {
    log(TAG, 'parseCode  for  key = ' + key);
    value = reqObj[key];
    if (value == null) {
      continue;
    }

    if (value instanceof Object && (value instanceof Array) == false) {//APIJSON Array转为常规JSONArray
      log(TAG, 'parseCode  for typeof value === "object" >>  ' );

      if (isArrayKey(key)) { // APIJSON Array转为常规JSONArray
        log(TAG, 'parseCode  for isArrayKey(key) >>  ' );

        response += callback.onParseArray(parentKey, key, value);
      }
      else { // 常规JSONObject，往下一级提取
        log(TAG, 'parseCode  for isArrayKey(key) == false >>  ' );

        response += callback.onParseObject(parentKey, key, value);
      }
    }
    else { // 其它Object，直接填充

      response += callback.onParseOther(parentKey, key, value);
    }
  }


  log(TAG, 'parseCode  return response = \n' + response + '\n\n\n');
  return response;
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