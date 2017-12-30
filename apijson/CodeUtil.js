/*Copyright ©2017 TommyLemon(https://github.com/TommyLemon/APIJSONAuto)

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use CodeUtil file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.*/


/**util for generate code
 * @author Lemon
 */
var CodeUtil = {
  TAG: 'CodeUtil',

  /**解析出 生成iOS-Swift请求JSON 的代码
   * 只需要把所有 对象标识{} 改为数组标识 []
   * @param name
   * @param reqObj
   * @param depth
   * @return parseCode
   */
  parseSwift: function(name, reqObj, depth) {
    name = name || '';
    if (depth == null || depth < 0) {
      depth = 0;
    }
    var hasContent = false;

    return CodeUtil.parseCode(name, reqObj, {

      onParseParentStart: function () {
        return '[\n';
      },

      onParseParentEnd: function () {
        return (hasContent ? '\n' : CodeUtil.getBlank(depth + 1) + ':\n') + CodeUtil.getBlank(depth) + ']';
      },

      onParseChildArray: function (key, value, index) {
        hasContent = true;
        return (index > 0 ? ',\n' : '') + CodeUtil.getBlank(depth + 1) + '"' + key + '": ' + CodeUtil.parseSwift(key, value, depth + 1);
      },

      onParseChildObject: function (key, value, index) {
        hasContent = true;
        return (index > 0 ? ',\n' : '') + CodeUtil.getBlank(depth + 1) + '"' + key + '": ' + CodeUtil.parseSwift(key, value, depth + 1);
      },

      onParseChildOther: function (key, value, index) {
        hasContent = true;

        var v; //避免改变原来的value
        if (typeof value == 'string') {
          log(CodeUtil.TAG, 'parseJava  for typeof value === "string" >>  ' );

          v = '"' + value + '"';
        }
        else if (value instanceof Array) {
          log(CodeUtil.TAG, 'parseJava  for typeof value === "array" >>  ' );

          v = '[' + CodeUtil.getArrayString(value, '...' + name + '/' + key) + ']';
        }
        else {
          v = value
        }

        return (index > 0 ? ',\n' : '') + CodeUtil.getBlank(depth + 1) + '"' + key + '": ' + v;
      }
    })

  },



  /**解析出 生成Android-Java请求JSON 的代码
   * @param name
   * @param reqObj
   * @param depth
   * @return parseCode
   */
  parseJava: function(name, reqObj, depth) {
    name = name || '';
    if (depth == null || depth < 0) {
      depth = 0;
    }

    const parentKey = JSONObject.isArrayKey(name) ? CodeUtil.getItemKey(name) : CodeUtil.getTableKey(name);

    return CodeUtil.parseCode(name, reqObj, {

      onParseParentStart: function () {
        return '\nJSONRequest ' + parentKey + ' = new JSONRequest();';
      },

      onParseParentEnd: function () {
        return '';
      },

      onParseChildArray: function (key, value, index) {

        var s = '\n\n//' + key + '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        const count = value.count || 0;
        const page = value.page || 0;

        log(CodeUtil.TAG, 'parseJava  for  count = ' + count + '; page = ' + page);

        delete value.count;
        delete value.page;

        s += CodeUtil.parseJava(key, value, depth + 1);

        log(CodeUtil.TAG, 'parseJava  for delete >> count = ' + count + '; page = ' + page);

        var prefix = key.substring(0, key.length - 2);

        s += '\n\n'
          + parentKey + '.putAll(' +  CodeUtil.getItemKey(key) + '.toArray('
          + count  + ', ' + page + (prefix.length <= 0 ? '' : ', "' + prefix + '"') + '));';

        s += '\n//' + key + '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
      },

      onParseChildObject: function (key, value, index) {
        var s = '\n\n//' + key + '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        s += CodeUtil.parseJava(key, value, depth + 1);
        s += '\n\n' + parentKey + '.put("' + key + '", ' + CodeUtil.getTableKey(key) + ');';

        s += '\n//' + key + '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
      },

      onParseChildOther: function (key, value, index) {

        var v; //避免改变原来的value
        if (typeof value == 'string') {
          log(CodeUtil.TAG, 'parseJava  for typeof value === "string" >>  ' );

          v = '"' + value + '"';
        }
        else if (value instanceof Array) {
          log(CodeUtil.TAG, 'parseJava  for typeof value === "array" >>  ' );

          v = 'new Object[]{' + CodeUtil.getArrayString(value, '...' + name + '/' + key) + '}';
        }
        else {
          v = value
        }

        return '\n' + parentKey + '.put("' + key + '", ' + v + ');';
      }
    })

  },






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
  parseCode: function(name, reqObj, callback) {
    if (reqObj == null || reqObj == '') {
      log(CodeUtil.TAG, 'parseCode  reqObj == null || reqObj.isEmpty() >> return null;');
      return null;
    }
    if (typeof reqObj != 'object') {
      log(CodeUtil.TAG, 'parseCode  typeof reqObj != object >> return null;');
      return null;
    }
    log(CodeUtil.TAG, '\n\n\n parseCode  name = ' + name + '; reqObj = \n' + format(JSON.stringify(reqObj)));

    var response = callback.onParseParentStart();

    var index = 0; //实际有效键值对key:value的所在reqObj内的位置
    var value;
    for (var key in reqObj) {
      log(CodeUtil.TAG, 'parseCode  for  key = ' + key);
      //key == null || value == null 的键值对被视为无效
      value = key == null ? null : reqObj[key];
      if (value == null) {
        continue;
      }

      log(CodeUtil.TAG, 'parseCode  for  index = ' + index);

      if (value instanceof Object && (value instanceof Array) == false) {//APIJSON Array转为常规JSONArray
        log(CodeUtil.TAG, 'parseCode  for typeof value === "object" >>  ' );

        if (JSONObject.isArrayKey(key)) { // APIJSON Array转为常规JSONArray
          log(CodeUtil.TAG, 'parseCode  for JSONObject.isArrayKey(key) >>  ' );

          response += callback.onParseChildArray(key, value, index);
        }
        else { // 常规JSONObject，往下一级提取
          log(CodeUtil.TAG, 'parseCode  for JSONObject.isArrayKey(key) == false >>  ' );

          response += callback.onParseChildObject(key, value, index);
        }
      }
      else { // 其它Object，直接填充

        response += callback.onParseChildOther(key, value, index);
      }

      index ++;
    }


    response += callback.onParseParentEnd();

    log(CodeUtil.TAG, 'parseCode  return response = \n' + response + '\n\n\n');
    return response;
  },









  /**用数据字典转为JavaBean
   * @param docObj
   */
  parseJavaBean: function(docObj) {

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
        model = CodeUtil.getModelName(table == null ? null : table.TABLE_NAME);
        if (model == '') {
          continue;
        }

        console.log('parseJavaBean [] for i=' + i + ': table = \n' + format(JSON.stringify(table)));


        doc += '\n```java\n\n' + CodeUtil.getComment(table.TABLE_COMMENT, true)
          + '\n@MethodAccess'
          + '\npublic class ' + model + ' implements Serializable {'
          + '\n  private static final long serialVersionUID = 1L;\n';

        //Column[]
        columnList = item['Column[]'];
        if (columnList != null) {

          console.log('parseJavaBean [] for ' + i + ': columnList = \n' + format(JSON.stringify(columnList)));

          var name;
          var type;

          for (var j = 0; j < columnList.length; j++) {
            column = columnList[j];

            name = CodeUtil.getFieldName(column == null ? null : column.COLUMN_NAME);
            if (name == '') {
              continue;
            }
            type = name == 'id' ? 'Long' : CodeUtil.getJavaType(column.COLUMN_TYPE, false);


            console.log('parseJavaBean [] for j=' + j + ': column = \n' + format(JSON.stringify(column)));

            doc += '\n  private ' + type + ' ' + name + '; ' + CodeUtil.getComment(column.COLUMN_COMMENT, false);

          }

          doc += '\n\n'
            + '\n  public ' + model + '() {'
            + '\n    super();'
            + '\n  }'
            + '\n  public ' + model + '(long id) {'
            + '\n    this();'
            + '\n    setId(id);'
            + '\n  }'
            + '\n\n\n\n'


          for (var j = 0; j < columnList.length; j++) {
            column = columnList[j];

            name = CodeUtil.getFieldName(column == null ? null : column.COLUMN_NAME);
            if (name == '') {
              continue;
            }
            type = name == 'id' ? 'Long' : CodeUtil.getJavaType(column.COLUMN_TYPE);

            console.log('parseJavaBean [] for j=' + j + ': column = \n' + format(JSON.stringify(column)));

            //getter
            doc += '\n  public ' + type + ' ' + CodeUtil.getMethodName('get', name) + '() {'
              + '\n    return ' + name + ';\n  }\n';

            //setter
            doc += '\n  public ' + model + ' ' + CodeUtil.getMethodName('set', name) + '(' + type + ' ' + name + ') {'
              + '\n    this.' + name + ' = ' + name + ';'
              + '\n    return this;\n  }\n';

          }
        }

        doc += '\n\n}\n\n```\n\n\n';

      }
    }
    //[] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

    return doc;
  },


  /**获取model类名
   * @param tableName
   * @return {*}
   */
  getModelName: function(tableName) {
    var model = StringUtil.noBlank(tableName);
    if (model == '') {
      return model;
    }
    var lastIndex = model.lastIndexOf('_');
    if (lastIndex >= 0) {
      model = model.substring(lastIndex + 1);
    }
    return StringUtil.firstCase(model, true);
  },
  /**获取model成员变量名
   * @param columnName
   * @return {*}
   */
  getFieldName: function(columnName) {
    return StringUtil.firstCase(StringUtil.noBlank(columnName), false);
  },
  /**获取model方法名
   * @param prefix @NotNull 前缀，一般是get,set等
   * @param field @NotNull
   * @return {*}
   */
  getMethodName: function(prefix, field) {
    if (field.startsWith('_')) {
      field = '_' + field; //get_name 会被fastjson解析为name而不是_name，所以要多加一个_
    }
    return prefix + StringUtil.firstCase(field, true);
  },

  /**获取注释
   * @param comment
   * @param multiple 多行
   * @param prefix 多行注释的前缀，一般是空格
   * @return {*}
   */
  getComment: function(comment, multiple, prefix) {
    comment = comment == null ? '' : comment.trim();
    if (prefix == null) {
      prefix = '';
    }
    if (multiple == false) {
      return prefix + '//' + comment.replace(/\n/g, '  ');
    }


    //多行注释，需要每行加 * 和空格

    var newComment = prefix + '/**';
    var index;
    do {
      newComment += '\n';
      index = comment.indexOf('\n');
      if (index < 0) {
        newComment += prefix + ' * ' + comment;
        break;
      }
      newComment += prefix + ' * ' + comment.substring(0, index);
      comment = comment.substring(index + 2);
    }
    while(comment != '')

    return newComment + '\n' + prefix + ' */';
  },



  /**根据数据库类型获取Java类型
   * @param t
   * @param saveLength
   */
  getJavaType: function(type, saveLength) {
    type = StringUtil.noBlank(type);

    var index = type.indexOf('(');

    var t = index < 0 ? type : type.substring(0, index);
    if (t == '') {
      return 'Object';
    }
    var length = index < 0 || saveLength != true ? '' : type.substring(index);

    if (t.endsWith('char') || t.endsWith('text') || t == 'enum' || t == 'set') {
      return 'String' + length;
    }
    if (t.endsWith('int') || t == 'integer') {
      return (t == 'bigint' ? 'Long' : 'Integer') + length;
    }
    if (t.endsWith('binary') || t.endsWith('blob')) {
      return 'byte[]' + length;
    }

    switch (t) {
      case 'id':
        return 'Long' + length;
      case 'bit':
        return 'Boolean' + length;
      case 'bool': //同tinyint
      case 'boolean': //同tinyint
        return 'Integer' + length;
      case 'datetime':
        return 'Timestamp' + length;
      case 'year':
        return 'Date' + length;
      case 'decimal':
        return 'BigDecimal' + length;
      case 'json':
        return 'List<String>' + length;
      default:
        return StringUtil.firstCase(t, true) + length;
    }

  },

  /**获取字段对应值的最大长度
   * @param columnType
   * @return {string}
   */
  getMaxLength: function (columnType) {
    var index = columnType == null ? -1 : columnType.indexOf('(');
    return index < 0 ? '不限' : columnType.substring(index + 1, columnType.length - (columnType.endsWith(')') ? 1 : 0));
  },


  /**根据层级获取键值对前面的空格
   * @param depth
   * @return {string}
   */
  getBlank: function(depth) {
    var s = '';
    for (var i = 0; i < depth; i ++) {
      s += '    ';
    }
    return s;
  },

  /**根据数组arr生成用 , 分割的字符串
   * 直接用 join 会导致里面的 String 没有被 "" 包裹
   * @param arr
   * @param path
   */
  getArrayString: function(arr, path) {
    if (arr == null || arr.length <= 0) {
      return arr;
    }

    var s = '';
    var v;
    var t;
    for (var i = 0; i < arr.length; i ++) {
      t = typeof arr[i];
      if (t == 'object' || t == 'array') {
        throw new Error('请求JSON中 ' + (path || '""') + ':[] 格式错误！key:[] 的[]中所有元素都不能为对象{}或数组[] ！');
      }
      v = (t == 'string' ? '"' + arr[i] + '"': arr[i]) //只支持基本类型
      s += (i > 0 ? ', ' : '') + v;
    }
    return s;
  },


  /**获取Table变量名
   * @param key
   * @return empty ? 'reqObj' : key + 'Request' 且首字母小写
   */
  getTableKey: function(key) {
    return StringUtil.addSuffix(key, 'Request');
  },
  /**获取数组内Object变量名
   * @param key
   * @return empty ? 'reqObj' : key + 'Request' 且首字母小写
   */
  getItemKey: function(key) {
    return StringUtil.addSuffix(key.substring(0, key.length - 2), 'Item');
  },

  /**是否为id
   * @param column
   * @return {boolean}
   */
  isId: function (column) {
    if (column == null) {
      return false;
    }
    if (column.endsWith('Id')) { // lowerCamelCase
      return true;
    }
    var index = column.lastIndexOf('_'); // snake_case
    var id = index < 0 ? column : column.substring(index + 1);
    return id.toLowerCase() == 'id';
  }

}