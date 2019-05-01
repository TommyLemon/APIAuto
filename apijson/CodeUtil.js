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

  /**生成JSON的注释
   * @param reqStr //已格式化的JSON String
   * @param tableList
   * @return parseComment
   */
  parseComment: function (reqStr, tableList, method, database) { //怎么都获取不到真正的长度，cols不行，默认20不变，maxLineLength不行，默认undefined不变 , maxLineLength) {
    if (StringUtil.isEmpty(reqStr)) {
      return '';
    }
    method = method == null ? 'GET' : method.toUpperCase();


    var lines = reqStr.split('\n');
    var line;

    var depth = 0;
    var names = [];
    var isInSubquery = false;

    var index;
    var key;
    var value;

    var comment;
    for (var i = 0; i < lines.length; i ++) {
      line = lines[i].trim();

      //每一种都要提取:左边的key
      index = line == null ? -1 : line.indexOf(': '); //可能是 ' 或 "，所以不好用 ': , ": 判断
      key = index < 0 ? '' : line.substring(1, index - 1);

      if (line.endsWith(',')) {
        line = line.substring(0, line.length - 1);
      }
      line = line.trim();

      if (line.endsWith('{')) { //对象，判断是不是Table，再加对应的注释
        isInSubquery = key.endsWith('@');

        depth ++;
        names[depth] = key;

        comment = CodeUtil.getComment4Request(tableList, names[depth - 1], key, null, method, false, database);
      }
      else {
        if (line.endsWith('}')) {
          isInSubquery = false;

          if (line.endsWith('{}')) { //对象，判断是不是Table，再加对应的注释
            comment = CodeUtil.getComment4Request(tableList, names[depth], key, null, method, false, database);
          }
          else {
            depth --;
            continue;
          }
        }
        else if (key == '') { //[ 1, \n 2, \n 3] 跳过
          continue;
        }
        else { //其它，直接在后面加上注释
          var isArray = line.endsWith('['); // []  不影响
          // alert('depth = ' + depth + '; line = ' + line + '; isArray = ' + isArray);
          comment = value == 'null' ? ' ! null无效' : CodeUtil.getComment4Request(tableList, names[depth], key
            , isArray ? '' : line.substring(index + 2).trim(), method, isInSubquery, database);
        }
      }

      lines[i] += comment;
    }

    return lines.join('\n');
  },

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
          log(CodeUtil.TAG, 'parseSwift  for typeof value === "string" >>  ' );

          v = '"' + value + '"';
        }
        else if (value instanceof Array) {
          log(CodeUtil.TAG, 'parseSwift  for typeof value === "array" >>  ' );

          v = '[' + CodeUtil.getArrayString(value, '...' + name + '/' + key) + ']';
        }
        else {
          v = value
        }

        return (index > 0 ? ',\n' : '') + CodeUtil.getBlank(depth + 1) + '"' + key + '": ' + v;
      }
    })

  },

  /**生成封装 Web-PHP 请求JSON 的代码
   * 只需要把所有 对象标识{} 改为数组标识 []
   * @param name
   * @param reqObj
   * @param depth
   * @return parseCode
   */
  parsePHP: function(name, reqObj, depth) {
    name = name || '';
    if (depth == null || depth < 0) {
      depth = 0;
    }
    var hasContent = false;
    var isEmpty = Object.keys(reqObj).length <= 0;

    return CodeUtil.parseCode(name, reqObj, {

      onParseParentStart: function () {
        return isEmpty ? '(object) array(' : 'array(\n';
      },

      onParseParentEnd: function () {
        return isEmpty ? ')' : '\n' + CodeUtil.getBlank(depth) + ')';
      },

      onParseChildArray: function (key, value, index) {
        hasContent = true;
        return (index > 0 ? ',\n' : '') + CodeUtil.getBlank(depth + 1) + '\'' + key + '\' => ' + CodeUtil.parsePHP(key, value, depth + 1);
      },

      onParseChildObject: function (key, value, index) {
        hasContent = true;
        return (index > 0 ? ',\n' : '') + CodeUtil.getBlank(depth + 1) + '\'' + key + '\' => ' + CodeUtil.parsePHP(key, value, depth + 1);
      },

      onParseChildOther: function (key, value, index) {
        hasContent = true;

        var v; //避免改变原来的value
        if (typeof value == 'string') {
          log(CodeUtil.TAG, 'parsePHP  for typeof value === "string" >>  ' );

          v = '\'' + value + '\'';
        }
        else if (value instanceof Array) {
          log(CodeUtil.TAG, 'parsePHP  for typeof value === "array" >>  ' );

          v = 'array(' + CodeUtil.getArrayString(value, '...' + name + '/' + key) + ')';
        }
        else {
          v = value
        }

        return (index > 0 ? ',\n' : '') + CodeUtil.getBlank(depth + 1) + '\'' + key + '\' => ' + v;
      }
    })

  },

  /**解析出 生成iOS-Swift请求JSON 的代码
   * 只需要把所有 对象标识{} 改为数组标识 []
   * @param name
   * @param reqObj
   * @param depth
   * @return parseCode
   */
  parseObjectiveC: function(name, reqObj, depth) {
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


  /**解析出 生成Android-Kotlin 请求JSON 的代码
   * @param name
   * @param reqObj
   * @param depth
   * @return parseCode
   * @return isSmart 是否智能
   */
  parseKotlin: function(name, reqObj, depth) {
    name = name || '';
    if (depth == null || depth < 0) {
      depth = 0;
    }
    var hasContent = false;
    var isEmpty = Object.keys(reqObj).length <= 0;

    return CodeUtil.parseCode(name, reqObj, {

      onParseParentStart: function () {
        return isEmpty ? 'HashMap<String, Any>(' : 'mapOf(\n';
      },

      onParseParentEnd: function () {
        return isEmpty ? ')' : '\n' + CodeUtil.getBlank(depth) + ')';
      },

      onParseChildArray: function (key, value, index) {
        hasContent = true;
        return (index > 0 ? ',\n' : '') + CodeUtil.getBlank(depth + 1) + '"' + key + '" to ' + CodeUtil.parseKotlin(key, value, depth + 1);
      },

      onParseChildObject: function (key, value, index) {
        hasContent = true;
        return (index > 0 ? ',\n' : '') + CodeUtil.getBlank(depth + 1) + '"' + key + '" to ' + CodeUtil.parseKotlin(key, value, depth + 1);
      },

      onParseChildOther: function (key, value, index) {
        hasContent = true;

        var v; //避免改变原来的value
        if (typeof value == 'string') {
          log(CodeUtil.TAG, 'parseKotlin  for typeof value === "string" >>  ' );

          v = '"' + value + '"';
        }
        else if (value instanceof Array) {
          log(CodeUtil.TAG, 'parseKotlin  for typeof value === "array" >>  ' );

          v = value.length <= 0 ? 'ArrayList<Any>()' : 'listOf(' + CodeUtil.getArrayString(value, '...' + name + '/' + key) + ')';
        }
        else {
          v = value
        }

        return (index > 0 ? ',\n' : '') + CodeUtil.getBlank(depth + 1) + '"' + key + '" to ' + v;
      }
    })

  },


  /**解析出 生成Android-Java请求JSON 的代码
   * @param name
   * @param reqObj
   * @param depth
   * @return parseCode
   * @return isSmart 是否智能
   */
  parseJava: function(name, reqObj, depth, isSmart) {
    name = name || '';
    if (depth == null || depth < 0) {
      depth = 0;
    }

    const parentKey = JSONObject.isArrayKey(name) ? JSONResponse.getVariableName(CodeUtil.getItemKey(name)) + (depth <= 1 ? '' : depth) : CodeUtil.getTableKey(JSONResponse.getVariableName(name));

    const prefix = CodeUtil.getBlank(depth);
    const nextPrefix = CodeUtil.getBlank(depth + 1);

    return CodeUtil.parseCode(name, reqObj, {

      onParseParentStart: function () {
        return '\n' + prefix + (isSmart ? 'JSONRequest' : 'Map<String, Object>') + ' ' + parentKey + ' = new ' + (isSmart ? 'JSONRequest' : 'LinkedHashMap<>') + '();';
      },

      onParseParentEnd: function () {
        return '';
      },

      onParseChildArray: function (key, value, index) {

        var s = '\n\n' + prefix + '{   ' + '//' + key + '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        const count = isSmart ? (value.count || 0) : 0;
        const page = isSmart ? (value.page || 0) : 0;
        const query = isSmart ? value.query : null;
        const join = isSmart ? value.join : null;

        log(CodeUtil.TAG, 'parseJava  for  count = ' + count + '; page = ' + page);

        if (isSmart) {
          delete value.count;
          delete value.page;
          delete value.query;
          delete value.join;
        }

        s += CodeUtil.parseJava(key, value, depth + 1, isSmart);

        log(CodeUtil.TAG, 'parseJava  for delete >> count = ' + count + '; page = ' + page);

        var name = JSONResponse.getVariableName(CodeUtil.getItemKey(key)) + (depth <= 0 ? '' : depth + 1);

        if (isSmart) {
          var alias = key.substring(0, key.length - 2);

          s += '\n\n';
          if (query != null) {
            s += nextPrefix + name + '.setQuery(' + (CodeUtil.QUERY_TYPE_CONSTS[query] || CodeUtil.QUERY_TYPE_CONSTS[0]) + ');\n';
          }
          if (StringUtil.isEmpty(join, true) == false) {
            s += nextPrefix + name + '.setJoin("' + join + '");\n';
          }

          s += nextPrefix + parentKey + '.putAll(' + name + '.toArray('
            + count  + ', ' + page + (alias.length <= 0 ? '' : ', "' + alias + '"') + '));';
        }
        else {
          s += '\n\n' + CodeUtil.getBlank(depth + 1) + parentKey + '.put("' + key + '", ' + name + ');';
        }

        s += '\n' + prefix + '}   ' + '//' + key + '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
      },

      onParseChildObject: function (key, value, index) {
        var s = '\n\n' + prefix + '{   ' + '//' + key + '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        const isTable = isSmart && JSONObject.isTableKey(JSONResponse.getTableName(key));

        const column = isTable ? value['@column'] : null;
        const group = isTable ? value['@group'] : null;
        const having = isTable ? value['@having'] : null;
        const order = isTable ? value['@order'] : null;
        const combine = isTable ? value['@combine'] : null;
        const schema = isTable ? value['@schema'] : null;
        const database = isTable ? value['@database'] : null;
        const role = isTable ? value['@role'] : null;

        if (isTable) {
          delete value['@column'];
          delete value['@group'];
          delete value['@having'];
          delete value['@order'];
          delete value['@combine'];
          delete value['@schema'];
          delete value['@database'];
          delete value['@role'];
        }

        s += CodeUtil.parseJava(key, value, depth + 1, isSmart);

        const name = CodeUtil.getTableKey(JSONResponse.getVariableName(key));
        if (isTable) {
          s = column == null ? s : s + '\n' + nextPrefix + name + '.setColumn(' + CodeUtil.getJavaValue(name, key, column) + ');';
          s = group == null ? s : s + '\n' + nextPrefix + name + '.setGroup(' + CodeUtil.getJavaValue(name, key, group) + ');';
          s = having == null ? s : s + '\n' + nextPrefix + name + '.setHaving(' + CodeUtil.getJavaValue(name, key, having) + ');';
          s = order == null ? s : s + '\n' + nextPrefix + name + '.setOrder(' + CodeUtil.getJavaValue(name, key, order) + ');';
          s = combine == null ? s : s + '\n' + nextPrefix + name + '.setCombine(' + CodeUtil.getJavaValue(name, key, combine) + ');';
          s = schema == null ? s : s + '\n' + nextPrefix + name + '.setSchema(' + CodeUtil.getJavaValue(name, key, schema) + ');';
          s = database == null ? s : s + '\n' + nextPrefix + name + '.setDatabase(' + CodeUtil.getJavaValue(name, key, database) + ');';
          s = role == null ? s : s + '\n' + nextPrefix + name + '.setRole(' + CodeUtil.getJavaValue(name, key, role) + ');';
        }

        s += '\n\n' + nextPrefix + parentKey + '.put("' + key + '", ' + name + ');';

        s += '\n' + prefix + '}   ' + '//' + key + '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
      },

      onParseChildOther: function (key, value, index) {
        if (depth <= 0 && isSmart) {
          if (key == 'tag') {
            return '\n' + parentKey + '.setTag(' + CodeUtil.getJavaValue(name, key, value) + ');';
          }
          if (key == 'version') {
            return '\n' + parentKey + '.setVersion(' + CodeUtil.getJavaValue(name, key, value) + ');';
          }
          if (key == 'format') {
            return '\n' + parentKey + '.setFormat(' + CodeUtil.getJavaValue(name, key, value) + ');';
          }
          if (key == '@schema') {
            return '\n' + parentKey + '.setSchema(' + CodeUtil.getJavaValue(name, key, value) + ');';
          }
          if (key == '@database') {
            return '\n' + parentKey + '.setDatabase(' + CodeUtil.getJavaValue(name, key, value) + ');';
          }
          if (key == '@role') {
            return '\n' + parentKey + '.setRole(' + CodeUtil.getJavaValue(name, key, value) + ');';
          }
        }
        return '\n' + prefix + parentKey + '.put("' + key + '", ' + CodeUtil.getJavaValue(name, key, value) + ');';
      }
    })

  },



  /**TODO 为for循环生成函数
   * 生成 iOS-Swift 解析 Response JSON 的代码
   * @param name
   * @param resObj
   * @param depth
   * @return parseCode
   */
  parseSwiftResponse: function(name, resObj, depth) {
    if (depth == null || depth < 0) {
      depth = 0;
    }

    if (name == null || name == '') {
      name = 'response';
    }

    return CodeUtil.parseCode(name, resObj, {

      onParseParentStart: function () {
        return depth > 0 ? '' : CodeUtil.getBlank(depth) + 'let ' + name + ': NSDictionary = try! NSJSONSerialization.JSONObjectWithData(resultJson!, options: .MutableContainers) as! NSDictionary \n';
      },

      onParseParentEnd: function () {
        return '';
      },

      onParseChildArray: function (key, value, index) {
        return this.onParseChildObject(key, value, index);
      },

      onParseChildObject: function (key, value, index) {
        return this.onParseJSONObject(key, value, index);
      },

      onParseChildOther: function (key, value, index) {

        if (value instanceof Array) {
          log(CodeUtil.TAG, 'parseJavaResponse  for typeof value === "array" >>  ' );

          return this.onParseJSONArray(key, value, index);
        }
        if (value instanceof Object) {
          log(CodeUtil.TAG, 'parseJavaResponse  for typeof value === "array" >>  ' );

          return this.onParseJSONObject(key, value, index);
        }

        var type = CodeUtil.getSwiftTypeFromJS(key, value);

        return '\n' + CodeUtil.getBlank(depth) + 'let ' + JSONResponse.getVariableName(key) + ': ' + type + ' = ' + name + '["' + key + '"] as! ' + type;
      },

      onParseJSONArray: function (key, value, index) {
        value = value || []

        var padding = '\n' + CodeUtil.getBlank(depth);
        var innerPadding = padding + CodeUtil.getBlank(1);
        var k = JSONResponse.getVariableName(key);
        //还有其它字段冲突以及for循环的i冲突，解决不完的，只能让开发者自己抽出函数  var item = StringUtil.addSuffix(k, 'Item');
        var type = CodeUtil.getSwiftTypeFromJS('item', value[0]);

        var s = '\n' + padding + '//' + key + '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        s += padding + 'let ' + k + ': NSArray = ' + name + '["' + key + '"] as! NSArray';

        s += '\n' + padding + '//TODO 把这段代码抽取一个函数，以免for循环嵌套时 i 冲突 或 id等其它字段冲突';

        s += padding + 'let item: ' +  + type;

        s += padding + 'for (int i = 0; i < ' + k + '.size(); i++) {';

        s += innerPadding + 'item = ' + k + '[i] as! ' + type;
        s += innerPadding + 'if (item == nil) {';
        s += innerPadding + '    continue';
        s += innerPadding + '}';
        //不能生成N个，以第0个为准，可能会不全，剩下的由开发者自己补充。 for (var i = 0; i < value.length; i ++) {
        if (value[0] instanceof Object) {
          s += CodeUtil.parseSwiftResponse('item', value[0], depth + 1);
        }
        // }

        s += padding + '}';

        s += padding + '//' + key + '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
      },

      onParseJSONObject: function (key, value, index) {
        var padding = '\n' + CodeUtil.getBlank(depth);
        var k = JSONResponse.getVariableName(key);

        var s = '\n' + padding + '//' + key + '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        s += padding + 'let ' + k + ': NSDictionary = ' + name + '["' + key + '"] as! NSDictionary\n'

        s += CodeUtil.parseSwiftResponse(k, value, depth);

        s += padding + '//' + key + '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
      }
    })

  },
  /**TODO 为for循环生成函数
   * 生成 iOS-Swift 解析 Response JSON 的代码
   * @param name
   * @param resObj
   * @param depth
   * @return parseCode
   */
  parseTypeScriptResponse: function(name, resObj, depth) {
    if (depth == null || depth < 0) {
      depth = 0;
    }

    if (name == null || name == '') {
      name = 'response';
    }

    return CodeUtil.parseCode(name, resObj, {

      onParseParentStart: function () {
        return depth > 0 ? '' : CodeUtil.getBlank(depth) + 'var ' + name + ': object = JSON.parse(resultJson); \n';
      },

      onParseParentEnd: function () {
        return '';
      },

      onParseChildArray: function (key, value, index) {
        return this.onParseChildObject(key, value, index);
      },

      onParseChildObject: function (key, value, index) {
        return this.onParseJSONObject(key, value, index);
      },

      onParseChildOther: function (key, value, index) {

        if (value instanceof Array) {
          log(CodeUtil.TAG, 'parseJavaResponse  for typeof value === "array" >>  ' );

          return this.onParseJSONArray(key, value, index);
        }
        if (value instanceof Object) {
          log(CodeUtil.TAG, 'parseJavaResponse  for typeof value === "array" >>  ' );

          return this.onParseJSONObject(key, value, index);
        }

        var type = (typeof value) || 'any';

        return '\n' + CodeUtil.getBlank(depth) + 'var ' + JSONResponse.getVariableName(key) + ': ' + type + ' = ' + name + '["' + key + '"];';
      },

      onParseJSONArray: function (key, value, index) {
        value = value || []

        var padding = '\n' + CodeUtil.getBlank(depth);
        var innerPadding = padding + CodeUtil.getBlank(1);
        var k = JSONResponse.getVariableName(key);
        //还有其它字段冲突以及for循环的i冲突，解决不完的，只能让开发者自己抽出函数  var item = StringUtil.addSuffix(k, 'Item');
        var type = (typeof value[0]) || 'any';

        var s = '\n' + padding + '//' + key + '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        s += padding + 'var ' + k + ': Array<' + type + '> = ' + name + '["' + key + '"];';

        s += '\n' + padding + '//TODO 把这段代码抽取一个函数，以免for循环嵌套时 i 冲突 或 id等其它字段冲突';

        s += padding + 'var item: ' +  + type + ';';

        s += padding + 'for (int i = 0; i < ' + k + '.length; i++) {';

        s += innerPadding + 'item = ' + k + '[i];';
        s += innerPadding + 'if (item == null) {';
        s += innerPadding + '    continue;';
        s += innerPadding + '}';
        //不能生成N个，以第0个为准，可能会不全，剩下的由开发者自己补充。 for (var i = 0; i < value.length; i ++) {
        if (value[0] instanceof Object) {
          s += CodeUtil.parseTypeScriptResponse('item', value[0], depth + 1);
        }
        // }

        s += padding + '}';

        s += padding + '//' + key + '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
      },

      onParseJSONObject: function (key, value, index) {
        var padding = '\n' + CodeUtil.getBlank(depth);
        var k = JSONResponse.getVariableName(key);

        var s = '\n' + padding + '//' + key + '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        s += padding + 'var ' + k + ': object = ' + name + '["' + key + '"];\n'

        s += CodeUtil.parseTypeScriptResponse(k, value, depth);

        s += padding + '//' + key + '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
      }
    })

  },

  /**TODO 为for循环生成函数
   * 解析出 生成Android-Java返回结果JSON 的代码
   * @param name
   * @param resObj
   * @param depth
   * @return parseCode
   */
  parseJavaResponse: function(name, resObj, depth) {
    if (depth == null || depth < 0) {
      depth = 0;
    }

    if (name == null || name == '') {
      name = 'response';
    }

    return CodeUtil.parseCode(name, resObj, {

      onParseParentStart: function () {
        return depth > 0 ? '' : CodeUtil.getBlank(depth) + 'JSONResponse ' + name + ' = new JSONResponse(resultJson); \n';
      },

      onParseParentEnd: function () {
        return '';
      },

      onParseChildArray: function (key, value, index) {
        return this.onParseChildObject(key, value, index);
      },

      onParseChildObject: function (key, value, index) {
        return this.onParseJSONObject(key, value, index);
      },

      onParseChildOther: function (key, value, index) {

        if (value instanceof Array) {
          log(CodeUtil.TAG, 'parseJavaResponse  for typeof value === "array" >>  ' );

          return this.onParseJSONArray(key, value, index);
        }
        if (value instanceof Object) {
          log(CodeUtil.TAG, 'parseJavaResponse  for typeof value === "array" >>  ' );

          return this.onParseJSONObject(key, value, index);
        }

        var type = CodeUtil.getJavaTypeFromJS(key, value, true);

        return '\n' + CodeUtil.getBlank(depth) + type + ' ' + JSONResponse.getVariableName(key) + ' = ' + name + '.get'
          + (/[A-Z]/.test(type.substring(0, 1)) ? type : StringUtil.firstCase(type + 'Value', true)) + '("' + key + '");';
      },

      onParseJSONArray: function (key, value, index) {
        value = value || []

        var padding = '\n' + CodeUtil.getBlank(depth);
        var innerPadding = padding + CodeUtil.getBlank(1);
        var k = JSONResponse.getVariableName(key);
        //还有其它字段冲突以及for循环的i冲突，解决不完的，只能让开发者自己抽出函数  var item = StringUtil.addSuffix(k, 'Item');
        var type = CodeUtil.getJavaTypeFromJS('item', value[0], false);

        var s = '\n' + padding + '//' + key + '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        s += padding + 'JSONArray ' + k + ' = JSON.nullToEmpty(' + name + '.getJSONArray("' + key + '"));';

        s += '\n' + padding + '//TODO 把这段代码抽取一个函数，以免for循环嵌套时 i 冲突 或 id等其它字段冲突';

        s += padding + type + ' item;';

        s += padding + 'for (int i = 0; i < ' + k + '.size(); i++) {';

        s += innerPadding + 'item = ' + k + '.get' + type + '(i);';
        s += innerPadding + 'if (item == null) {';
        s += innerPadding + '    continue;';
        s += innerPadding + '}';
        //不能生成N个，以第0个为准，可能会不全，剩下的由开发者自己补充。 for (var i = 0; i < value.length; i ++) {
        if (value[0] instanceof Object) {
          s += CodeUtil.parseJavaResponse('item', value[0], depth + 1);
        }
        // }

        s += padding + '}';

        s += padding + '//' + key + '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
      },

      onParseJSONObject: function (key, value, index) {
        var padding = '\n' + CodeUtil.getBlank(depth);
        var k = JSONResponse.getVariableName(key);

        var s = '\n' + padding + '//' + key + '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        s += padding + 'JSONObject ' + k + ' = JSON.nullToEmpty(' + name + '.getJSONObject("' + key + '"));\n'

        s += CodeUtil.parseJavaResponse(k, value, depth);

        s += padding + '//' + key + '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
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
  parseJavaBean: function(docObj, clazz, database) {

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
        model = CodeUtil.getModelName(table == null ? null : table.table_name);
        if (model != clazz) {
          continue;
        }

        console.log('parseJavaBean [] for i=' + i + ': table = \n' + format(JSON.stringify(table)));


        doc += '/**'
          + '\n *APIJSONAuto自动生成JavaBean\n *主页: https://github.com/TommyLemon/APIJSONAuto'
          + '\n *使用方法：\n *1.修改包名package \n *2.import需要引入的类，可使用快捷键Ctrl+Shift+O '
          + '\n */\n'
          + '\npackage apijson.demo.server.model;\n\n\n'
          + CodeUtil.getComment(database != 'POSTGRESQL' ? table.table_comment : (item.PgClass || {}).table_comment, true)
          + '\n@MethodAccess'
          + '\npublic class ' + model + ' implements Serializable {'
          + '\n  private static final long serialVersionUID = 1L;\n';

        //Column[]
        columnList = item['[]'];
        if (columnList != null) {

          console.log('parseJavaBean [] for ' + i + ': columnList = \n' + format(JSON.stringify(columnList)));

          var name;
          var type;

          for (var j = 0; j < columnList.length; j++) {
            column = (columnList[j] || {}).Column;

            name = CodeUtil.getFieldName(column == null ? null : column.column_name);
            if (name == '') {
              continue;
            }

            column.column_type = CodeUtil.getColumnType(column, database);
            type = CodeUtil.isId(name, column.column_type) ? 'Long' : CodeUtil.getJavaType(column.column_type, false);


            console.log('parseJavaBean [] for j=' + j + ': column = \n' + format(JSON.stringify(column)));

            var o = database != 'POSTGRESQL' ? column : (columnList[j] || {}).PgAttribute
            doc += '\n  private ' + type + ' ' + name + '; ' + CodeUtil.getComment((o || {}).column_comment, false);

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
            column = (columnList[j] || {}).Column;

            name = CodeUtil.getFieldName(column == null ? null : column.column_name);
            if (name == '') {
              continue;
            }
            column.column_type = CodeUtil.getColumnType(column, database);
            type = CodeUtil.isId(name, column.column_type) ? 'Long' : CodeUtil.getJavaType(column.column_type, false);

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

        doc += '\n\n}';

      }
    }
    //[] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

    return doc;
  },


  /**用数据字典转为 TypeScript 类
   * @param docObj
   */
  parseTypeScriptClass: function(docObj, clazz, database) {

    //转为Java代码格式
    var doc = '';
    var item;

    //[] <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    var list = docObj == null ? null : docObj['[]'];
    if (list != null) {
      console.log('parseTypeScriptClass  [] = \n' + format(JSON.stringify(list)));

      var table;
      var model;
      var columnList;
      var column;
      for (var i = 0; i < list.length; i++) {
        item = list[i];

        //Table
        table = item == null ? null : item.Table;
        model = CodeUtil.getModelName(table == null ? null : table.table_name);
        if (model != clazz) {
          continue;
        }

        console.log('parseTypeScriptClass [] for i=' + i + ': table = \n' + format(JSON.stringify(table)));


        doc += '/**'
          + '\n *APIJSONAuto自动生成 TypeScript Class\n *主页: https://github.com/TommyLemon/APIJSONAuto'
          + '\n */\n\n\n'
          + CodeUtil.getComment(database != 'POSTGRESQL' ? table.table_comment : (item.PgClass || {}).table_comment, true)
          + '\n@MethodAccess'
          + '\nclass ' + model + ' {\n';

        //Column[]
        columnList = item['[]'];
        if (columnList != null) {

          console.log('parseTypeScriptClass [] for ' + i + ': columnList = \n' + format(JSON.stringify(columnList)));

          var name;
          var type;

          doc += '\n    constructor(';

          for (var j = 0; j < columnList.length; j++) {
            column = (columnList[j] || {}).Column;

            name = CodeUtil.getFieldName(column == null ? null : column.column_name);
            if (name == '') {
              continue;
            }
            column.column_type = CodeUtil.getColumnType(column, database);
            type = CodeUtil.isId(name, column.column_type) ? 'Long' : CodeUtil.getJavaType(column.column_type, false);

            console.log('parseTypeScriptClass [] for j=' + j + ': column = \n' + format(JSON.stringify(column)));

            var o = database != 'POSTGRESQL' ? column : (columnList[j] || {}).PgAttribute
            doc += '\n        public '+ name + ': ' + type + ', ' + CodeUtil.getComment((o || {}).column_comment, false);

          }

          doc += '\n    ) { }';

        }

        doc += '\n\n}';

      }
    }
    //[] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

    return doc;
  },

  /**用数据字典转为 TypeScript 类
   * @param docObj
   */
  parseJavaScriptClass: function(docObj, clazz, database) {

    //转为Java代码格式
    var doc = '';
    var item;

    //[] <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    var list = docObj == null ? null : docObj['[]'];
    if (list != null) {
      console.log('parseJavaScriptClass  [] = \n' + format(JSON.stringify(list)));

      var table;
      var model;
      var columnList;
      var column;
      for (var i = 0; i < list.length; i++) {
        item = list[i];

        //Table
        table = item == null ? null : item.Table;
        model = CodeUtil.getModelName(table == null ? null : table.table_name);
        if (model != clazz) {
          continue;
        }

        console.log('parseJavaScriptClass [] for i=' + i + ': table = \n' + format(JSON.stringify(table)));


        doc += '/**'
          + '\n *APIJSONAuto自动生成 JavaScript Class\n *主页: https://github.com/TommyLemon/APIJSONAuto'
          + '\n */\n\n\n'
          + CodeUtil.getComment(database != 'POSTGRESQL' ? table.table_comment : (item.PgClass || {}).table_comment, true)
          + '\n@MethodAccess'
          + '\nclass ' + model + ' {\n';

        //Column[]
        columnList = item['[]'];
        if (columnList != null) {

          console.log('parseJavaScriptClass [] for ' + i + ': columnList = \n' + format(JSON.stringify(columnList)));

          var name;

          doc += '\n    constructor(';

          for (var j = 0; j < columnList.length; j++) {
            column = (columnList[j] || {}).Column;

            name = CodeUtil.getFieldName(column == null ? null : column.column_name);
            if (name == '') {
              continue;
            }

            console.log('parseJavaScriptClass [] for j=' + j + ': column = \n' + format(JSON.stringify(column)));

            doc += (j <= 0 ? '' : ', ') + name;
          }

          doc += ') {\n';

          for (var j = 0; j < columnList.length; j++) {
            column = (columnList[j] || {}).Column;

            name = CodeUtil.getFieldName(column == null ? null : column.column_name);
            if (name == '') {
              continue;
            }

            console.log('parseJavaScriptClass [] for j=' + j + ': column = \n' + format(JSON.stringify(column)));

            var o = database != 'POSTGRESQL' ? column : (columnList[j] || {}).PgAttribute
            doc += '\n        this.'+ name + ' = ' + name + ' ' + CodeUtil.getComment((o || {}).column_comment, false);

          }

          doc += '\n    }';

        }

        doc += '\n\n}';

      }
    }
    //[] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

    return doc;
  },

  /**用数据字典转为 Kotlin Data 类
   * @param docObj
   */
  parseKotlinDataClass: function(docObj, clazz, database) {

    //转为Java代码格式
    var doc = '';
    var item;

    //[] <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    var list = docObj == null ? null : docObj['[]'];
    if (list != null) {
      console.log('parseKotlinDataClass  [] = \n' + format(JSON.stringify(list)));

      var table;
      var model;
      var columnList;
      var column;
      for (var i = 0; i < list.length; i++) {
        item = list[i];

        //Table
        table = item == null ? null : item.Table;
        model = CodeUtil.getModelName(table == null ? null : table.table_name);
        if (model != clazz) {
          continue;
        }

        console.log('parseKotlinDataClass [] for i=' + i + ': table = \n' + format(JSON.stringify(table)));


        doc += '/**'
          + '\n *APIJSONAuto自动生成JavaBean\n *主页: https://github.com/TommyLemon/APIJSONAuto'
          + '\n *使用方法：\n *1.修改包名package \n *2.import需要引入的类，可使用快捷键Ctrl+Shift+O '
          + '\n */\n'
          + '\npackage apijson.demo.server.model\n\n\n'
          + CodeUtil.getComment(database != 'POSTGRESQL' ? table.table_comment : (item.PgClass || {}).table_comment, true)
          + '\n@MethodAccess'
          + '\ndata class ' + model + ': Serializable {'
          + '\n    private val Long serialVersionUID = 1L\n';

        //Column[]
        columnList = item['[]'];
        if (columnList != null) {

          console.log('parseKotlinDataClass [] for ' + i + ': columnList = \n' + format(JSON.stringify(columnList)));

          var name;
          var type;

          for (var j = 0; j < columnList.length; j++) {
            column = (columnList[j] || {}).Column;

            name = CodeUtil.getFieldName(column == null ? null : column.column_name);
            if (name == '') {
              continue;
            }
            column.column_type = CodeUtil.getColumnType(column, database);
            type = CodeUtil.isId(name, column.column_type) ? 'Long' : CodeUtil.getJavaType(column.column_type, false);

            console.log('parseKotlinDataClass [] for j=' + j + ': column = \n' + format(JSON.stringify(column)));

            var o = database != 'POSTGRESQL' ? column : (columnList[j] || {}).PgAttribute
            doc += '\n    var '+ name + ': ' + type + '? = null ' + CodeUtil.getComment((o || {}).column_comment, false);

          }

        }

        doc += '\n\n}';

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

  /**获取Java的值
   * @param value
   * @return {*}
   */
  getJavaValue: function (name, key, value) {
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
    return v;
  },

  getJavaTypeFromJS: function (key, value, baseFirst) {
    if (typeof value == 'boolean') {
      return baseFirst ? 'boolean' : 'Boolean';
    }
    if (typeof value == 'number') {
      if (String(value).indexOf(".") >= 0) {
        return baseFirst ? 'double' : 'Double';
      }
      if (Math.abs(value) >= 2147483647 || CodeUtil.isId(key, 'bigint')) {
        return baseFirst ? 'long' : 'Long';
      }
      return baseFirst ? 'int' : 'Integer';
    }
    if (typeof value == 'string') {
      return 'String';
    }
    if (value instanceof Array) {
      return 'JSONArray';
    }
    if (value instanceof Object) {
      return 'JSONObject';
    }

    return 'Object';
  },

  getSwiftTypeFromJS: function (key, value) {
    if (typeof value == 'boolean') {
      return 'Bool';
    }
    if (typeof value == 'number') {
      if (String(value).indexOf(".") >= 0) {
        return 'Double';
      }
      return 'Int';
    }
    if (typeof value == 'string') {
      return 'String';
    }
    if (value instanceof Array) {
      return 'NSArray';
    }
    if (value instanceof Object) {
      return 'NSDictionary';
    }

    return 'NSObject';
  },

  getColumnType: function (column, database) {
    if (column == null) {
      return 'text';
    }

    log(CodeUtil.TAG, 'getColumnType  database = ' + database + '; column = ' + JSON.stringify(column, null, '  '));

    if (column.column_type == null) { // && database == 'POSTGRESQL') {
      var dt = column.data_type || '';
      log(CodeUtil.TAG, 'getColumnType  column.data_type = ' + column.data_type);

      var len;
      if (column.character_maximum_length != null) { // dt.indexOf('char') >= 0) {
        log(CodeUtil.TAG, 'getColumnType  column.character_maximum_length != null >>  column.character_maximum_length = ' + column.character_maximum_length);

        len = '(' + column.character_maximum_length + ')';
      }
      else if (column.numeric_precision != null) { // dt.indexOf('int') >= 0) {
        log(CodeUtil.TAG, 'getColumnType  column.numeric_precision != null >>  column.numeric_precision = ' + column.numeric_precision + '; column.numeric_scale = ' + column.numeric_scale);

        len = '(' + column.numeric_precision + (column.numeric_scale == null || column.numeric_scale <= 0 ? '' : ',' + column.numeric_scale) + ')';
      }
      else {
        len = ''
      }

      log(CodeUtil.TAG, 'getColumnType  return dt + len; = ' + (dt + len));
      return dt + len;
    }

    log(CodeUtil.TAG, 'getColumnType  return column.column_type; = ' + column.column_type);
    return column.column_type;
  },

  /**根据数据库类型获取Java类型
   * @param t
   * @param saveLength
   */
  getJavaType: function(type, saveLength) {
    log(CodeUtil.TAG, 'getJavaType  type = ' + type + '; saveLength = ' + saveLength);
    type = StringUtil.noBlank(type);

    var index = type.indexOf('(');

    var t = index < 0 ? type : type.substring(0, index);
    if (t == '') {
      return 'Object';
    }
    var length = index < 0 || saveLength != true ? '' : type.substring(index);

    if (t.indexOf('char') >= 0 || t.indexOf('text') >= 0 || t == 'enum' || t == 'set') {
      return 'String' + length;
    }
    if (t.indexOf('int') >= 0) {
      return (t == 'bigint' ? 'Long' : 'Integer') + length;
    }
    if (t.endsWith('binary') || t.indexOf('blob') >= 0 || t.indexOf('clob') >= 0) {
      return 'byte[]' + length;
    }
    if (t.indexOf('timestamp') >= 0) {
      return 'Timestamp' + length;
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
      case 'numeric':
        return 'BigDecimal' + length;
      case 'json':
      case 'jsonb':
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
        //TODO 不止为什么parseJavaResponse会调用这个函数，先放过  throw new Error('请求JSON中 ' + (path || '""') + ':[] 格式错误！key:[] 的[]中所有元素都不能为对象{}或数组[] ！');
      }
      v = (t == 'string' ? '"' + arr[i] + '"': arr[i]) //只支持基本类型
      s += (i > 0 ? ', ' : '') + v;
    }
    return s;
  },


  /**获取Table变量名
   * @param key
   * @return empty ? 'request' : key
   */
  getTableKey: function(key) {
    key = StringUtil.trim(key);
    return key == '' ? 'request' : StringUtil.firstCase(key, false);//StringUtil.addSuffix(key, 'Request');
  },
  /**获取数组内Object变量名
   * @param key
   * @return empty ? 'item' : key + 'Item' 且首字母小写
   */
  getItemKey: function(key) {
    return StringUtil.addSuffix(key.substring(0, key.length - 2), 'Item');
  },

  /**是否为id
   * @param column
   * @return {boolean}
   */
  isId: function (column, type) {
    if (column == null || type == null || type.indexOf('int') < 0) {
      return false;
    }
    if (column.endsWith('Id')) { // lowerCamelCase
      return true;
    }
    var index = column.lastIndexOf('_'); // snake_case
    var id = index < 0 ? column : column.substring(index + 1);
    return id.toLowerCase() == 'id';
  },



  QUERY_TYPES: ['数据', '数量', '全部'],
  SUBQUERY_RANGES: ['ANY', 'ALL'],
  QUERY_TYPE_KEYS: [0, 1, 2],
  QUERY_TYPE_CONSTS: ["JSONRequest.QUERY_TABLE", "JSONRequest.QUERY_TOTAL", "JSONRequest.QUERY_ALL"],
  REQUEST_ROLE_KEYS: ['UNKNOWN', 'LOGIN', 'CONTACT', 'CIRCLE', 'OWNER', 'ADMIN'],
  REQUEST_ROLE: {
    UNKNOWN: '未登录',
    LOGIN: '已登录',
    CONTACT: '联系人',
    CIRCLE: '圈子成员',
    OWNER: '拥有者',
    ADMIN: '管理员'
  },
  REQUEST_DATABASE_KEYS: ['MYSQL', 'POSTGRESQL', 'ORACLE'],

  /**获取请求JSON的注释
   * @param tableList
   * @param name
   * @param key
   * @param value
   * @param isInSubquery
   * @param database
   */
  getComment4Request: function (tableList, name, key, value, method, isInSubquery, database) {
    // alert('name = ' + name + '; key = ' + key + '; value = ' + value + '; method = ' + method);

    if (key == null) {
      return '';
    }
    // if (value == null) {
    //   return ' ! key:value 中 key 或 value 任何一个为 null 时，该 key:value 都无效！'
    // }

    if (value == null || value instanceof Object) {

      if (key.endsWith('@')) {
        if (key == '@from@') {
          return CodeUtil.getComment('数据来源：匿名子查询，例如 {"from":"Table", "Table":{}}', false, '  ');
        }

        var aliaIndex = name == null ? -1 : name.indexOf(':');
        var objName = aliaIndex < 0 ? name : name.substring(0, aliaIndex);
        if (JSONObject.isTableKey(objName)) {
          return CodeUtil.getComment('子查询 < ' + CodeUtil.getCommentFromDoc(tableList, objName, key.substring(0, key.length - 1), method, database), false, '  ');
        }
        return CodeUtil.getComment('子查询 ' + StringUtil.get(name) + "，需要被下面的表字段相关 key 引用赋值", false, '  ');
      }

      if (JSONObject.isArrayKey(key)) {
        if (method != 'GET') {
          return ' ! key[]:{}只支持GET方法！';
        }

        key = key.substring(0, key.lastIndexOf('[]'));

        var aliaIndex = key.indexOf(':');
        var objName = aliaIndex < 0 ? key : key.substring(0, aliaIndex);
        var alias = aliaIndex < 0 ? '' : key.substring(aliaIndex + 1, key.length);

        var firstIndex = objName.indexOf('-');
        var firstKey = firstIndex < 0 ? objName : objName.substring(0, firstIndex);
        alias = alias.length <= 0 ? '' : '新建别名: ' + alias + ' < ';
        return CodeUtil.getComment((JSONObject.isTableKey(firstKey) ? '提取' + objName + ' < ' : '') + alias + '数组', false, '  ');
      }

      var aliaIndex = key.indexOf(':');
      var objName = aliaIndex < 0 ? key : key.substring(0, aliaIndex);

      if (JSONObject.isTableKey(objName)) {
        var c = CodeUtil.getCommentFromDoc(tableList, objName, null, method, database);
        return StringUtil.isEmpty(c) ? ' ! 表不存在！' : CodeUtil.getComment(
          (aliaIndex < 0 ? '' : '新建别名: ' + key.substring(aliaIndex + 1, key.length) + ' < ' + objName + ': ') + c, false, '  ');
      }

      return '';
    }

    if (isInSubquery || JSONObject.isArrayKey(name)) {
      switch (key) {
        case 'count':
          return CodeUtil.getType4Request(value) != 'number' ? ' ! value必须是Number类型！' : CodeUtil.getComment('最多数量: 例如 5 10 20 ...', false, '  ');
        case 'page':
          if (CodeUtil.getType4Request(value) != 'number') {
            return ' ! value必须是Number类型！';
          }
          return value < 0 ? ' ! 必须 >= 0 ！' : CodeUtil.getComment('分页页码: 例如 0 1 2 ...', false, '  ');
        case 'query':
          var query = CodeUtil.QUERY_TYPES[value];
          return StringUtil.isEmpty(query) ? ' ! value必须是[' + CodeUtil.QUERY_TYPE_KEYS.join() + ']中的一种！' : CodeUtil.getComment('查询内容：0-数据 1-总数 2-全部', false, '  ');
        case 'join':
          return CodeUtil.getType4Request(value) != 'string' ? ' ! value必须是String类型！' : CodeUtil.getComment('多表连接：例如 &/User/id@,</Comment/momentId@,...', false, '  ');
        default:
          if (isInSubquery) {
            switch (key) {
              case 'range':
                if (CodeUtil.getType4Request(value) != 'string') {
                  return ' ! value必须是String类型！';
                }
                return CodeUtil.SUBQUERY_RANGES.indexOf(value.substring(1, value.length - 1)) < 0 ? ' ! value必须是[' + CodeUtil.SUBQUERY_RANGES.join() + ']中的一种！' : CodeUtil.getComment('比较范围：ANY-任意 ALL-全部', false, '  ');
              case 'from':
                return CodeUtil.getType4Request(value) != 'string' ? ' ! value必须是String类型！' : CodeUtil.getComment('数据来源：例如 User，同一层级必须有对应的 "User": {...}', false, '  ');
            }
          }
          break;
      }
      return '';
    }

    var aliaIndex = name.indexOf(':');
    var objName = aliaIndex < 0 ? name : name.substring(0, aliaIndex);

    if (JSONObject.isTableKey(objName)) {
      switch (key) {
        case '@column':
          return CodeUtil.getType4Request(value) != 'string' ? ' ! value必须是String类型！' : CodeUtil.getComment('返回字段：例如 id,name;json_length(contactIdList):contactCount;...', false, '  ');
        case '@from@': //value 类型为 Object 时 到不了这里，已在上方处理
          return CodeUtil.getType4Request(value) != 'string' ? ' ! value必须是String或Object类型！' : CodeUtil.getComment('数据来源：引用赋值 子查询 "' + value.substring(1, value.length - 1) + '@":{...} ', false, '  ');
        case '@group':
          return CodeUtil.getType4Request(value) != 'string' ? ' ! value必须是String类型！' : CodeUtil.getComment('分组方式：例如 userId,momentId,...', false, '  ');
        case '@having':
          return CodeUtil.getType4Request(value) != 'string' ? ' ! value必须是String类型！' : CodeUtil.getComment('SQL函数：例如 max(id)>100;sum(balance)<=10000;...', false, '  ');
        case '@order':
          return CodeUtil.getType4Request(value) != 'string' ? ' ! value必须是String类型！' : CodeUtil.getComment('排序方式：+升序，-降序，例如 name+,date-,...', false, '  ');
        case '@combine':
          return CodeUtil.getType4Request(value) != 'string' ? ' ! value必须是String类型！' : CodeUtil.getComment('条件组合：例如 name?,|tag?,&id{},!id,...', false, '  ');
        case '@schema':
          return CodeUtil.getType4Request(value) != 'string' ? ' ! value必须是String类型！' : CodeUtil.getComment('集合空间：例如 sys apijson ...', false, '  ');
        case '@database':
          try {
            value = value.substring(1, value.length - 1);
          } catch (e) {}
          return CodeUtil.REQUEST_DATABASE_KEYS.indexOf(value) < 0 ? ' ! value必须是[' + CodeUtil.REQUEST_DATABASE_KEYS.join() + ']中的一种！' : CodeUtil.getComment('数据库：例如 MYSQL POSTGRESQL ORACLE ...', false, '  ');
        case '@role':
          try {
            value = value.substring(1, value.length - 1);
          } catch (e) {}
          var role = CodeUtil.REQUEST_ROLE[value];
          return StringUtil.isEmpty(role) ? ' ! value必须是[' + CodeUtil.REQUEST_ROLE_KEYS.join() + ']中的一种！' : CodeUtil.getComment('来访角色：' + role, false, '  ');
      }
      if (key.startsWith('@')) {
        return '';
      }
      var c = CodeUtil.getCommentFromDoc(tableList, objName, key, method, database);
      return StringUtil.isEmpty(c) ? ' ! 字段不存在！' : CodeUtil.getComment(c, false, '  ');
    }

    // alert('name = ' + name + '; key = ' + key);
    if (StringUtil.isEmpty(name)) {
      switch (key) {
        case 'tag':
          if (method == 'GET' || method == 'HEAD') {
            return '';
          }
          return CodeUtil.getType4Request(value) != 'string' ? ' ! value必须是String类型！' : CodeUtil.getComment('请求密钥：例如 User Comment[] Privacy-CIRCLE ...', false, '  ');
        case 'version':
          if (method == 'GET' || method == 'HEAD') {
            return '';
          }
          return CodeUtil.getType4Request(value) != 'number' ? ' ! value必须是Number类型！' : CodeUtil.getComment('版本号: 例如 1 2 3 ...', false, '  ');
        case 'format':
          return CodeUtil.getType4Request(value) != 'boolean' ? ' ! value必须是Boolean类型！' : CodeUtil.getComment('格式化: true-是 false-否', false, '  ');
        case '@schema':
          return CodeUtil.getType4Request(value) != 'string' ? ' ! value必须是String类型！' : CodeUtil.getComment('集合空间：例如 sys apijson ...', false, '  ');
        case '@database':
          try {
            value = value.substring(1, value.length - 1);
          } catch (e) {}
          return CodeUtil.REQUEST_DATABASE_KEYS.indexOf(value) < 0 ? ' ! value必须是[' + CodeUtil.REQUEST_DATABASE_KEYS.join() + ']中的一种！' : CodeUtil.getComment('数据库：例如 MYSQL POSTGRESQL ORACLE ...', false, '  ');
        case '@role':
          try {
            value = value.substring(1, value.length - 1);
          } catch (e) {}
          var role = CodeUtil.REQUEST_ROLE[value];
          return StringUtil.isEmpty(role) ? ' ! value必须是[' + CodeUtil.REQUEST_ROLE_KEYS.join() + ']中的一种！' : CodeUtil.getComment('默认角色：' + role, false, '  ');
      }
    }

    return '';
  },

  /**
   * @param tableList
   * @param tableName
   * @param columnName
   * @param method
   * @param database
   * @param onlyTableAndColumn
   * @return {*}
   */
  getCommentFromDoc: function (tableList, tableName, columnName, method, database, onlyTableAndColumn) {
    log('getCommentFromDoc  tableName = ' + tableName + '; columnName = ' + columnName + '; method = ' + method + '; database = ' + database + '; tableList = \n' + JSON.stringify(tableList));

    if (tableList == null || tableList.length <= 0) {
      return '...';
    }

    var item;

    var table;
    var columnList;
    var column;
    for (var i = 0; i < tableList.length; i++) {
      item = tableList[i];

      //Table
      table = item == null ? null : item.Table;
      if (table == null || tableName != CodeUtil.getModelName(table.table_name)) {
        continue;
      }
      log('getDoc [] for i=' + i + ': table = \n' + format(JSON.stringify(table)));

      if (StringUtil.isEmpty(columnName)) {
        return database != 'POSTGRESQL' ? table.table_comment : (item.PgClass || {}).table_comment;
      }

      var at = '';
      var fun = '';
      var key;
      var logic = '';

      if (onlyTableAndColumn) {
        key = new String(columnName);
      }
      else {

        //功能符 <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

        if (columnName.endsWith("()")) {//方法，查询完后处理，先用一个Map<key,function>保存？
          return '远程函数';
        }


        if (columnName.endsWith("@")) {//引用，引用对象查询完后处理。fillTarget中暂时不用处理，因为非GET请求都是由给定的id确定，不需要引用
          at = '引用赋值';
          columnName = columnName.substring(0, columnName.length - 1);
        }

        if (columnName.endsWith("$")) {//搜索，查询时处理
          fun = '模糊搜索';
          key = columnName.substring(0, columnName.length - 1);
        }
        else if (columnName.endsWith("~")) {//匹配正则表达式，查询时处理
          fun = '正则匹配';
          key = columnName.substring(0, columnName.length - 1);
          if (key.endsWith("*")) {
            key = key.substring(0, key.length - 1);
            fun += '(忽略大小写)';
          }
        }
        else if (columnName.endsWith("%")) {//连续范围 BETWEEN AND，查询时处理
          fun = '连续范围';
          key = columnName.substring(0, columnName.length - 1);
        }
        else if (columnName.endsWith("{}")) {//被包含，或者说key对应值处于value的范围内。查询时处理
          fun = '匹配 选项/条件';
          key = columnName.substring(0, columnName.length - 2);
        }
        else if (columnName.endsWith("<>")) {//包含，或者说value处于key对应值的范围内。查询时处理
          fun = '包含选项';
          key = columnName.substring(0, columnName.length - 2);
        }
        else if (columnName.endsWith("}{")) {//存在，EXISTS。查询时处理
          fun = '是否存在';
          key = columnName.substring(0, columnName.length - 2);
        }
        else if (columnName.endsWith("+")) {//延长，PUT查询时处理
          if (method != 'PUT') {//不为PUT就抛异常
            return ' ! 功能符 + - 只能用于PUT请求！';
          }
          fun = '增加/扩展';
          key = columnName.substring(0, columnName.length - 1);
        }
        else if (columnName.endsWith("-")) {//缩减，PUT查询时处理
          if (method != 'PUT') {//不为PUT就抛异常
            return ' ! 功能符 + - 只能用于PUT请求！';
          }
          fun = '减少/去除';
          key = columnName.substring(0, columnName.length - 1);
        }
        else if (columnName.endsWith(">=")) {//大于或等于
          fun = '大于或等于';
          key = columnName.substring(0, columnName.length - 2);
        }
        else if (columnName.endsWith("<=")) {//小于或等于
          fun = '小于或等于';
          key = columnName.substring(0, columnName.length - 2);
        }
        else if (columnName.endsWith(">")) {//大于
          fun = '大于';
          key = columnName.substring(0, columnName.length - 1);
        }
        else if (columnName.endsWith("<")) {//小于
          fun = '小于';
          key = columnName.substring(0, columnName.length - 1);
        }
        else {
          fun = '';
          key = new String(columnName);
        }


        if (key.endsWith("&")) {
          if (fun.length <= 0) {
            return ' ! 逻辑运算符 & | 后面必须接其它功能符！';
          }
          logic = '符合全部';
        }
        else if (key.endsWith("|")) {
          if (fun.length <= 0) {
            return ' ! 逻辑运算符 & | 后面必须接其它功能符！';
          }
          logic = '符合任意';
        }
        else if (key.endsWith("!")) {
          logic = '都不符合';
        }
        else {
          logic = '';
        }


        if (logic.length > 0) {
          if (method != 'GET' && method != 'HEAD' && method != 'GETS' && method != 'HEADS') {//逻辑运算符仅供GET,HEAD方法使用
            return ' ! 逻辑运算符 & | ! 只能用于查询(GET,HEAD,GETS,HEADS)请求！';
          }
          key = key.substring(0, key.length - 1);
        }

        if (StringUtil.isName(key) == false) {
          return ' ! 字符 ' + key + ' 不合法！';
        }

        //功能符 >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

      }

      columnList = item['[]'];
      if (columnList == null) {
        continue;
      }
      log('getDoc [] for ' + i + ': columnList = \n' + format(JSON.stringify(columnList)));

      var name;
      for (var j = 0; j < columnList.length; j++) {
        column = (columnList[j] || {}).Column;
        name = column == null ? null : column.column_name;
        if (name == null || key != name) {
          continue;
        }

        var p = (at.length <= 0 ? '' : at + ' < ')
          + (fun.length <= 0 ? '' : fun + ' < ')
          + (logic.length <= 0 ? '' : logic + ' < ');

        var o = database != 'POSTGRESQL' ? column : (columnList[j] || {}).PgAttribute

        column.column_type = CodeUtil.getColumnType(column, database);
        return (p.length <= 0 ? '' : p + key + ': ') + CodeUtil.getJavaType(column.column_type, true) + ', ' + (o || {}).column_comment;
      }

      break;
    }

    return '';
  },

  getType4Request: function (value) {
    return typeof JSON.parse(value);
  }

}