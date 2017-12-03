const TAG = 'CodeUtil'

/**解析出 生成iOS-Swift请求JSON 的代码
 * 只需要把所有 对象标识{} 改为数组标识 []
 * @param name
 * @param reqObj
 * @param depth
 * @return parseCode
 */
function parseSwift(name, reqObj, depth) {
  name = name || '';
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

        v = '[' + getArrayString(value, '...' + name + '/' + key) + ']';
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
  name = name || '';
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

        v = 'new Object[]{' + getArrayString(value, '...' + name + '/' + key) + '}';
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
 * @param path
 */
function getArrayString(arr, path) {
  if (arr == null || arr.length <= 0) {
    return arr;
  }

  let s = '';
  let v;
  let t;
  for (var i = 0; i < arr.length; i ++) {
    t = typeof arr[i];
    if (t == 'object' || t == 'array') {
      throw new Error('请求JSON中 ' + (path || '""') + ':[] 格式错误！key:[] 的[]中所有元素都不能为对象{}或数组[] ！');
    }
    v = (t == 'string' ? '"' + arr[i] + '"': arr[i]) //只支持基本类型
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




/**用数据字典转为JavaBean
 * @param docObj
 */
function parseJavaBean(docObj) {

  //转为Java代码格式
  var doc = '';
  var item;

  //[] <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
  var list = docObj == null ? null : docObj['[]'];
  if (list != null) {
    console.log('parseJavaBean  [] = \n' + format(JSON.stringify(list)));

    var table;
    var model;
    var columnList;
    var column;
    for (var i = 0; i < list.length; i++) {
      item = list[i];

      //Table
      table = item == null ? null : item.Table;
      model = getModelName(table == null ? null : table.TABLE_NAME);
      if (model == '') {
        continue;
      }

      console.log('parseJavaBean [] for i=' + i + ': table = \n' + format(JSON.stringify(table)));


      doc += '\n/**\n * ' + table.TABLE_COMMENT + '\n */'
        + '\n@MethodAccess'
        + '\npublic class ' + model + ' {'
        + '\n  private static final long serialVersionUID = 1L;\n\n';

      //Column[]
      columnList = item['Column[]'];
      if (columnList != null) {

        console.log('parseJavaBean [] for ' + i + ': columnList = \n' + format(JSON.stringify(columnList)));

        var name;
        var type;

        for (var j = 0; j < columnList.length; j++) {
          column = columnList[j];

          name = getFieldName(column == null ? null : column.COLUMN_NAME);
          if (name == '') {
            continue;
          }
          type = getJavaType(column.COLUMN_TYPE);


          console.log('parseJavaBean [] for j=' + j + ': column = \n' + format(JSON.stringify(column)));

          doc += '\n  /**\n   * ' + column.COLUMN_COMMENT + '\n   */'
            + '\n  private ' + type + ' ' + name + ';';

        }

        doc += '\n\n'
          + '\n  public ' + model + '() {'
          + '\n    super();'
          + '\n  }'
          + '\n  public ' + model + '(long id) {'
          + '\n    this();'
          + '\n    setId(id);'
          + '\n  }'
          + '\n\n\n'


        for (var j = 0; j < columnList.length; j++) {
          column = columnList[j];

          name = getFieldName(column == null ? null : column.COLUMN_NAME);
          if (name == '') {
            continue;
          }
          type = getJavaType(column.COLUMN_TYPE);

          console.log('parseJavaBean [] for j=' + j + ': column = \n' + format(JSON.stringify(column)));

          type = getJavaType(column.COLUMN_TYPE);

          //getter
          doc += '\n  public ' + type + ' ' + getMethodName('get', name) + '() {'
            + '\n    return ' + name + ';\n  }\n';

          //setter
          doc += '\n  public ' + model + ' ' + getMethodName('set', name) + '(' + type + ' ' + name + ') {'
            + '\n    this.' + name + ' = ' + name + ';'
            + '\n    return this;\n  }\n';

        }
      }

      doc += '\n\n}\n\n\n';

    }

    //[] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

    return doc;
  }


  /**获取model类名
   * @param tableName
   * @return {*}
   */
  function getModelName(tableName) {
    var model = tableName == null ? '' : tableName.trim();
    if (model == '') {
      return model;
    }
    var lastIndex = model.lastIndexOf('_');
    if (lastIndex >= 0) {
      model = model.substring(lastIndex + 1);
    }
    return firstCase(model, true);
  }
  /**获取model成员变量名
   * @param columnName
   * @return {*}
   */
  function getFieldName(columnName) {
    var field = columnName == null ? '' : columnName.replace(' ', '');
    if (field == '') {
      return field;
    }
    return firstCase(field, false);
  }
  /**获取model方法名
   * @param prefix 前缀，一般是get,set等
   * @param field
   * @return {*}
   */
  function getMethodName(prefix, field) {
    if (field.startsWith('_')) {
      field = '_' + field; //get_name 会被fastjson解析为name而不是_name，所以要多加一个_
    }
    return prefix + firstCase(field, true);
  }



  /**根据数据库类型获取Java类型
   * @param t
   */
  function getJavaType(t) {
    if (t == null) {
      return 'Object';
    }
    t = t.replace(' ', '');

    var index = t.indexOf('(');
    if (index >= 0) {
      t = t.substring(0, index);
    }

    if (t == '') {
      return 'Object';
    }
    if (t.endsWith('char') || t.endsWith('text') || t == 'enum' || t == 'set') {
      return 'String';
    }
    if (t.endsWith('int') || t == 'integer') {
      return t == 'bigint' ? 'Long' : 'Integer';
    }
    if (t.endsWith('binary') || t.endsWith('blob')) {
      return 'byte[]';
    }

    switch (t) {
      case 'id':
        return 'Long';
      case 'bit':
        return 'Boolean';
      case 'bool': //同tinyint
      case 'boolean': //同tinyint
        return 'Integer';
      case 'datetime':
        return 'Timestamp';
      case 'year':
        return 'Date';
      case 'decimal':
        return 'BigDecimal';
      case 'json':
        return 'List<String>';
      default:
        return firstCase(t, true);
    }

  }


}