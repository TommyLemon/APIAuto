const TAG = 'CodeUtil'

/**
 * @param name
 * @param reqObj
 * @return
 */
function parseJava(name, reqObj) {
  if (reqObj == null || reqObj == '') {
    log(TAG, 'parseJava  reqObj == null || reqObj.isEmpty() >> return null;');
    return null;
  }
  if (typeof reqObj != 'object') {
    log(TAG, 'parseJava  typeof reqObj != object >> return null;');
    return null;
  }
  log(TAG, '\n\n\n parseJava  name = ' + name + '; reqObj = \n' + format(JSON.stringify(reqObj)));
  let parentKey = isArrayKey(name) ? getItemKey(name) : getTableKey(name);

  let response = '\n' + 'JSONRequest ' + parentKey + ' = new JSONRequest();';


  let value;
  for (var key in reqObj) {
    log(TAG, 'parseJava  for  key = ' + key);
    value = reqObj[key];
    if (value == null) {
      continue;
    }

    if (value instanceof Object && (value instanceof Array) == false) {//APIJSON Array转为常规JSONArray
      log(TAG, 'parseJava  for typeof value === "object" >>  ' );

      if (isArrayKey(key)) { // APIJSON Array转为常规JSONArray
        log(TAG, 'parseJava  for isArrayKey(key) >>  ' );

        response += '\n' + '\n' + '//' + key + '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        const count = value.count || 0;
        const page = value.page || 0;

        log(TAG, 'parseJava  for  count = ' + count + '; page = ' + page);

        delete value.count;
        delete value.page;

        response += parseJava(key, value);

        log(TAG, 'parseJava  for delete >> count = ' + count + '; page = ' + page);

        let prefix = key.substring(0, key.length - 2);
        response += '\n' + '\n'
          + parentKey + '.putAll(' +  getItemKey(key) + '.toArray('
          + count  + ', ' + page + (prefix.length <= 0 ? '' : ', "' + prefix + '"') + '));';

        response += '\n' + '//' + key + '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>' + '\n';
      }
      else { // 常规JSONObject，往下一级提取
        log(TAG, 'parseJava  for isArrayKey(key) == false >>  ' );

        response += '\n' + '\n' + '//' + key + '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        response += parseJava(key, value);

        response += '\n' + '\n' + parentKey + '.put("' + key + '", ' + getTableKey(key) + ');';
        response += '\n' + '//' + key + '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>' + '\n';
      }
    }
    else { // 其它Object，直接填充
      if (typeof value === 'string') {
        log(TAG, 'parseJava  for typeof value === "string" >>  ' );

        value = '"' + value + '"';
      }
      else if (value instanceof Array) {
        log(TAG, 'parseJava  for typeof value === "array" >>  ' );

        value = 'new Object[]{' + value.join() + '}';
      }

      response += '\n' + parentKey + '.put("' + key + '", ' + value + ');';
    }
  }


  log(TAG, 'parseJava  return response = \n' + response + '\n\n\n');
  return response;
}





/**获取Table变量名
 * @param key
 * @return empty ? 'reqObj' : key + 'Request' 且首字母小写
 */
function getTableKey(key) {
  return addSuffix(key, 'Request');
}
/**获取Table变量名
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
  if (key == null) {
    return false;
  }
  return /^[A-Z][A-Za-z0-9_]*$/.test(key);
}
/**判断key是否为数组名
 * @param key
 * @return
 */
function isArrayKey(key) {
  log(TAG, 'isArrayKey  typeof key = ' + (typeof key));
  if (key == null) {
    return false;
  }
  return key.endsWith('[]');
}