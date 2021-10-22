/*Copyright ©2017 TommyLemon(https://github.com/TommyLemon/APIAuto)

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

  LANGUAGE_KOTLIN: 'Kotlin',
  LANGUAGE_JAVA: 'Java',
  LANGUAGE_C_SHARP: 'C#',

  LANGUAGE_SWIFT: 'Swift',
  LANGUAGE_OBJECTIVE_C: 'Objective-C',

  LANGUAGE_GO: 'Go',
  LANGUAGE_C_PLUS_PLUS: 'C++',

  LANGUAGE_TYPE_SCRIPT: 'TypeScript',
  LANGUAGE_JAVA_SCRIPT: 'JavaScript',

  LANGUAGE_PHP: 'PHP',
  LANGUAGE_PYTHON: 'Python',

  type: 'JSON',
  database: 'MYSQL',
  schema: 'sys',
  language: 'Kotlin',
  tableList: [],
  thirdParty: 'YAPI',
  thirdPartyApiMap: null,  // {}

  /**生成JSON的注释  TODO 提取  // 单行注释，补充到 TestRecord 的 standard 中，文档也是有版本的
   * @param reqStr //已格式化的JSON String
   * @param tableList
   * @param method
   * @param database
   * @param language
   * @return parseComment
   */
  parseComment: function (reqStr, tableList, method, database, language, isReq, standardObj, isExtract, isWarning) { //怎么都获取不到真正的长度，cols不行，默认20不变，maxLineLength不行，默认undefined不变 , maxLineLength) {
    if (StringUtil.isEmpty(reqStr)) {
      return '';
    }
    method = method || 'get';
    var isRestful = true;

    if (method.startsWith("/")) {
      method = method.substring(1);
    }

    if (method.endsWith("/")) {
      method = method.substring(0, method.length - 1);
    }

    var startName = null;

    var mIndex = method.indexOf('/');
    if (mIndex < 0) {
      isRestful = false;
    }
    else if (APIJSON_METHODS.indexOf(method.substring(0, mIndex)) >= 0) {
      var suffix = method.substring(mIndex + 1);
      method = method.substring(0, mIndex);

      mIndex = suffix.indexOf("/");
      isRestful = mIndex >= 0;

      if (isReq && ! isRestful) {
        var tag = suffix.substring(mIndex + 1)
        var tbl = tag.endsWith("[]") ? tag.substring(0, tag.length - 2) : tag;
        if (JSONObject.isTableKey(tbl)) {
          startName = method == 'put' || method == 'delete' ? tbl : tag;
        }
      }
    }

    if (isRestful != true) {
      method = method.toUpperCase();
    }

    var lines = reqStr.split('\n');
    var line;

    var depth = startName == null ? 0 : 1;
    var names =  startName == null ? [] : [startName];
    var isInSubquery = false;

    var index;
    var key;
    var value;
    var comment;
    var hintComment;

    for (var i = 0; i < lines.length; i ++) {
      line = lines[i].trim() || '';

      //每一种都要提取:左边的key
      index = line.indexOf(': '); //可能是 ' 或 "，所以不好用 ': , ": 判断
      key = index < 0 ? (depth <= 1 && startName != null ? startName : '') : line.substring(1, index - 1);
      var cIndex = line.indexOf('  //');

      comment = '';
      if (cIndex >= 0) {
        if (isExtract && standardObj != null && (depth != 1 || (key != 'code' && key != 'throw'))) {
          comment = line.substring(cIndex + '  //'.length).trim();
          // standardObj = CodeUtil.updateStandardPart(standardObj, names, key, value, comment)
        }

        line = line.substring(0, cIndex).trim();
      }

      if (line.endsWith(',')) {
        line = line.substring(0, line.length - 1);
      }
      line = line.trim();

      if (line.endsWith('{')) { //对象，判断是不是Table，再加对应的注释
        value = {}

        if (depth > 0 && comment.length > 0) {
          standardObj = JSONResponse.updateStandardByPath(standardObj, names, key, value, comment)
        }

        isInSubquery = key.endsWith('@');

        hintComment = CodeUtil.getComment4Request(tableList, names[depth - 1], key, value, method, false, database, language, isReq, names, isRestful, standardObj, isWarning);

        names[depth] = key;
        depth ++;
      }
      else {
        if (line.endsWith('}')) {
          value = {}

          if (depth > 0 && comment.length > 0) {
            standardObj = JSONResponse.updateStandardByPath(standardObj, names, key, value, comment)
          }

          isInSubquery = false;

          if (line.endsWith('{}')) { //对象，判断是不是Table，再加对应的注释
            hintComment = CodeUtil.getComment4Request(tableList, names[depth - 1], key, value, method, false, database, language, isReq, names, isRestful, standardObj, isWarning);
          }
          else {
            depth --;
            names = names.slice(0, depth);

            if (isWarning && i > 0 && i < lines.length - 1) {
              lines[i] = '';  // 节约性能，收尾不能为空，否则外面 trim 一下格式就变了对不上原文本。奇怪的是右大括号 } 总是不走这里
            }
            continue;
          }
        }
        // else if (key == '') { //[ 1, \n 2, \n 3] 跳过
        //   if (depth > 0 && comment.length > 0) {
        //     standardObj = JSONResponse.updateStandardByPath(standardObj, names, 0, '', comment)
        //   }
        //
        //   continue;
        // }
        else {
          if (line.endsWith('[')) { // []  不影响
            value = []

            if (depth > 0 && comment.length > 0) {
              standardObj = JSONResponse.updateStandardByPath(standardObj, names, key, value, comment)
            }

            hintComment = CodeUtil.getComment4Request(tableList, names[depth - 1], key, value, method, false, database, language, isReq, names, isRestful, standardObj, isWarning);

            names[depth] = key;
            depth ++;
          }
          else {
            if (line.endsWith(']')) {
              value = []

              if (depth > 0 && comment.length > 0) {
                standardObj = JSONResponse.updateStandardByPath(standardObj, names, key, value, comment)
              }

              if (line.endsWith('[]')) { //对象，判断是不是Table，再加对应的注释
                hintComment = CodeUtil.getComment4Request(tableList, names[depth - 1], key, value, method, false, database, language, isReq, names, isRestful, standardObj, isWarning);
              }
              else {
                depth --;
                names = names.slice(0, depth);

                if (isWarning && i > 0 && i < lines.length - 1) {
                  lines[i] = '';  // 节约性能，收尾不能为空，否则外面 trim 一下格式就变了对不上原文本。奇怪的是右大括号 } 总是不走这里
                }
                continue;
              }
            }
            else { //其它，直接在后面加上注释
              value = line.substring(index + 2).trim()
              if (value.startsWith('"')) {
                value = value.substring(1, value.lastIndexOf('"'))
              }
              else {
                try {
                  value = JSON.parse(value)
                }
                catch (e) {
                  console.log(e)
                }
              }
            }
            // alert('depth = ' + depth + '; line = ' + line + '; isArray = ' + isArray);
            hintComment = CodeUtil.getComment4Request(tableList, names[depth - 1], key, value, method, isInSubquery, database, language, isReq, names, isRestful, standardObj, isWarning);
          }
        }

        if (depth > 0 && comment.length > 0) {
          standardObj = JSONResponse.updateStandardByPath(standardObj, names, key, value, comment)
        }
      }

      // 普通注释需要完整保留原 JSON，以防预览请求不显示部分 JSON 内容
      if (isWarning && i > 0 && i < lines.length - 1 && StringUtil.isEmpty(hintComment, true)) {
        lines[i] = '';  // 节约性能，收尾不能为空，否则外面 trim 一下格式就变了对不上原文本。奇怪的是右大括号 } 总是不走这里
      }
      else {
        lines[i] += hintComment;
      }
    }

    var apiMap = isRestful ? CodeUtil.thirdPartyApiMap : null;
    var api = apiMap == null ? null : apiMap['/' + method];
    var detail = api == null ? null : api.detail;

    return lines.join('\n') + (StringUtil.isEmpty(detail, true) ? '' : '\n\n/*\n\n' + detail + '\n\n*/');
  },



  /**生成封装 Unity3D-C# 请求 JSON 的代码
   * 只需要把所有 对象标识{} 改为数组标识 []
   * @param name
   * @param reqObj
   * @param depth
   * @return parseCode
   */
  parseCSharpRequest: function(name, reqObj, depth) {
    if (depth == null || depth < 0) {
      depth = 0;
    }

    var isEmpty = true;
    if (reqObj instanceof Array) {
      isEmpty = reqObj.length <= 0;
    }
    else if (reqObj instanceof Object) {
      isEmpty = Object.keys(reqObj).length <= 0;
    }

    var padding = CodeUtil.getBlank(depth);
    var nextPadding = CodeUtil.getBlank(depth + 1);

    return CodeUtil.parseCode(name, reqObj, {

      onParseParentStart: function () {
        return isEmpty ? 'new JObject{' : 'new JObject{\n';
      },

      onParseParentEnd: function () {
        return isEmpty ? '}' : '\n' + padding + '}';
      },

      onParseChildArray: function (key, value, index) {
        return (index > 0 ? ',\n' : '') + nextPadding + '{"' + key + '", ' + CodeUtil.parseCSharpRequest(key, value, depth + 1) + '}';
      },

      onParseChildObject: function (key, value, index) {
        return (index > 0 ? ',\n' : '') + nextPadding + '{"' + key + '", ' + CodeUtil.parseCSharpRequest(key, value, depth + 1) + '}';
      },

      onParseArray: function (key, value, index, isOuter) {
        var isEmpty = value.length <= 0;
        var s = 'new JArray{' + (isEmpty ? '' : '\n');

        var inner = '';
        var innerPadding = isOuter ? nextPadding : CodeUtil.getBlank(depth + 2);
        for (var i = 0; i < value.length; i ++) {
          inner += (i > 0 ? ',\n' : '') + innerPadding + CodeUtil.parseCSharpRequest(null, value[i], depth + (isOuter ? 1 : 2));
        }
        s += inner;

        s += isEmpty ? '}' : '\n' + (isOuter ? padding : nextPadding) + '}';
        return s;
      },

      onParseChildOther: function (key, value, index, isOuter) {
        var v; //避免改变原来的value
        if (value == null) {
          v = 'null';
        }
        else if (value instanceof Array) {
          v = this.onParseArray(key, value, index, isOuter);
        }
        else if (typeof value == 'string') {
          v = '"' + value + '"';
        }
        else {
          v = value
        }

        return (index > 0 ? ',\n' : '') + (key == null ? v : (isOuter ? padding : nextPadding) + '{"' + key + '", ' + v + '}');
      }
    })

  },

  /**生成封装 Web-PHP 请求JSON 的代码
   * 只需要把所有 对象标识{} 改为数组标识 []
   * @param name
   * @param reqObj
   * @param depth
   * @param isSmart
   * @return parseCode
   */
  parsePHPRequest: function(name, reqObj, depth, isSmart) {
    if (depth == null || depth < 0) {
      depth = 0;
    }
    var isEmpty = true;
    if (reqObj instanceof Array) {
      isEmpty = reqObj.length <= 0;
    }
    else if (reqObj instanceof Object) {
      isEmpty = Object.keys(reqObj).length <= 0;
    }

    var padding = CodeUtil.getBlank(depth);
    var nextPadding = CodeUtil.getBlank(depth + 1);
    var quote = isSmart ? "'" : '"';

    return CodeUtil.parseCode(name, reqObj, {

      onParseParentStart: function () {
        if (isSmart) {
          return isEmpty ? '(object) [' : '[\n';
        }
        return isEmpty ? '(object) array(' : 'array(\n';
      },

      onParseParentEnd: function () {
        if (isSmart) {
          return isEmpty ? ']' : '\n' + padding + ']';
        }
        return isEmpty ? ')' : '\n' + padding + ')';
      },

      onParseChildArray: function (key, value, index) {
        return this.onParseChildObject(key, value, index);
      },

      onParseChildObject: function (key, value, index) {
        return this.onParseChildOther(key, value, index);
      },

      onParseArray: function (key, value, index, isOuter) {
        var s = (isSmart ? '[' : 'array(') + (isEmpty ? '' : '\n');

        var inner = '';
        var innerPadding = isOuter ? nextPadding : CodeUtil.getBlank(depth + 2);
        for (var i = 0; i < value.length; i ++) {
          inner += (i > 0 ? ',\n' : '') + innerPadding + CodeUtil.parsePHPRequest(null, value[i], depth + (isOuter ? 1 : 2), isSmart);
        }
        s += inner;

        s += isEmpty ? (isSmart ? ']' : ')') : '\n' + (isOuter ? padding : nextPadding) + (isSmart ? ']' : ')');
        return s;
      },

      onParseChildOther: function (key, value, index, isOuter) {
        var v; //避免改变原来的value
        if (value == null) {
          v = 'null';
        }
        else if (value instanceof Array) {
          v = this.onParseArray(key, value, index, isOuter);
        }
        else if (value instanceof Object) {
          v = CodeUtil.parsePHPRequest(key, value, depth + 1, isSmart);
        }
        else if (typeof value == 'string') {
          log(CodeUtil.TAG, 'parsePHPRequest  for typeof value === "string" >>  ' );
          v = quote + value + quote;
        }
        else {
          v = value
        }
        return (index > 0 ? ',\n' : '') + (key == null ? '' : (isOuter ? padding : nextPadding) + quote + key + quote + ' => ') + v;
      }
    })

  },
  /**生成封装 Web-Python 请求JSON 的代码
   * 转换注释符号和关键词
   * @param reqStr
   * @return
   */
  parsePythonRequest: function(name, reqObj, depth, isSmart, reqStr) {
    if (isSmart != true) {
      if (StringUtil.isEmpty(reqStr, true) && reqObj != null) {
        reqStr = JSON.stringify(reqObj, null, '    ')
      }
      return StringUtil.trim(reqStr).replace(/\/\//g, '#').replace(/null/g, 'None').replace(/false/g, 'False').replace(/true/g, 'True').replace(/\/\*/g, isSmart ? '\'\'\'' : '"""').replace(/\*\//g, isSmart ? '\'\'\'' : '"""').replace(/'/g, '"')
    }

    if (depth == null || depth < 0) {
      depth = 0;
    }

    var isEmpty = true;
    if (reqObj instanceof Array) {
      isEmpty = reqObj.length <= 0;
    }
    else if (reqObj instanceof Object) {
      isEmpty = Object.keys(reqObj).length <= 0;
    }

    var padding = CodeUtil.getBlank(depth);
    var nextPadding = CodeUtil.getBlank(depth + 1);
    var nextNextPadding = CodeUtil.getBlank(depth + 2);
    var nextNextNextPadding = CodeUtil.getBlank(depth + 3);
    var quote = isSmart ? "'" : '"'

    return CodeUtil.parseCode(name, reqObj, {

      onParseParentStart: function () {
        return isEmpty ? '{' : '{\n';
      },

      onParseParentEnd: function () {
        return isEmpty ? '}' : ('\n' + CodeUtil.getBlank(depth) + '}');
      },

      onParseChildArray: function (key, value, index) {
        return (index > 0 ? ',\n' : '') + nextPadding + quote + key + quote + ': ' + CodeUtil.parsePythonRequest(key, value, depth + 1, isSmart);
      },

      onParseChildObject: function (key, value, index) {
        return (index > 0 ? ',\n' : '') + nextPadding + quote + key + quote + ': ' + CodeUtil.parsePythonRequest(key, value, depth + 1, isSmart);
      },

      onParseArray: function (key, value, index, isOuter) {
        var isEmpty = value.length <= 0;
        var s = '[' + (isEmpty ? '' : '\n');

        var inner = '';
        var innerPadding = isOuter ? nextNextPadding : nextNextNextPadding;
        for (var i = 0; i < value.length; i ++) {
          inner += (i > 0 ? ',\n' : '') + innerPadding + CodeUtil.parsePythonRequest(null, value[i], depth + (isOuter ? 1 : 2), isSmart);
        }
        s += inner;

        s += isEmpty ? ']' : '\n' + (isOuter ? nextPadding : nextNextPadding) + ']';
        return s;
      },

      onParseChildOther: function (key, value, index, isOuter) {
        var valStr = (value instanceof Array ? this.onParseArray(key, value, index, true) :CodeUtil.getCode4Value(CodeUtil.LANGUAGE_PYTHON, value, key, depth, isSmart));
        return (index > 0 ? ',\n' : '') + (key == null ? '' : (isOuter ? padding : nextPadding) + quote + key + quote + ': ') + valStr;
      }
    })

  },

  /**封装 生成 iOS-Swift 请求 JSON 的代码
   * 只需要把所有 对象标识{} 改为数组标识 []
   * @param name
   * @param reqObj
   * @param depth
   * @return parseCode
   */
  parseSwiftRequest: function(name, reqObj, depth) {
    if (depth == null || depth < 0) {
      depth = 0;
    }

    var isEmpty = true;
    if (reqObj instanceof Array) {
      isEmpty = reqObj.length <= 0;
    }
    else if (reqObj instanceof Object) {
      isEmpty = Object.keys(reqObj).length <= 0;
    }

    var padding = CodeUtil.getBlank(depth);
    var nextPadding = CodeUtil.getBlank(depth + 1);

    return CodeUtil.parseCode(name, reqObj, {

      onParseParentStart: function () {
        return isEmpty ? '[' : '[\n';
      },

      onParseParentEnd: function () {
        return isEmpty ? ':]' : ('\n' + CodeUtil.getBlank(depth) + ']');
      },

      onParseChildArray: function (key, value, index) {
        return (index > 0 ? ',\n' : '') + nextPadding + '"' + key + '": ' + CodeUtil.parseSwiftRequest(key, value, depth + 1);
      },

      onParseChildObject: function (key, value, index) {
        return (index > 0 ? ',\n' : '') + nextPadding + '"' + key + '": ' + CodeUtil.parseSwiftRequest(key, value, depth + 1);
      },

      onParseArray: function (key, value, index, isOuter) {
        var isEmpty = value.length <= 0;
        var s = '[' + (isEmpty ? '' : '\n');

        var inner = '';
        var innerPadding = isOuter ? nextPadding : CodeUtil.getBlank(depth + 2);
        for (var i = 0; i < value.length; i ++) {
          inner += (i > 0 ? ',\n' : '') + innerPadding + CodeUtil.parseSwiftRequest(null, value[i], depth + (isOuter ? 1 : 2));
        }
        s += inner;

        s += isEmpty ? ']' : '\n' + (isOuter ? padding : nextPadding) + ']';
        return s;
      },

      onParseChildOther: function (key, value, index, isOuter) {
        var v; //避免改变原来的value
        if (value == null) {
          v = 'nil';
        }
        else if (value instanceof Array) {
          v = this.onParseArray(key, value, index, isOuter);
        }
        else if (typeof value == 'string') {
          v = '"' + value + '"';
        }
        else {
          v = value
        }

        return (index > 0 ? ',\n' : '') + (key == null ? '' : (isOuter ? padding : nextPadding) + '"' + key + '": ') + v;
      }
    })

  },

  /**生成封装 Web-Go 请求 JSON 的代码
   * 只需要把所有 对象标识{} 改为数组标识 []
   * @param name
   * @param reqObj
   * @param depth
   * @return parseCode
   */
  parseGoRequest: function(name, reqObj, depth) {
    if (depth == null || depth < 0) {
      depth = 0;
    }

    var isEmpty = true;
    if (reqObj instanceof Array) {
      isEmpty = reqObj.length <= 0;
    }
    else if (reqObj instanceof Object) {
      isEmpty = Object.keys(reqObj).length <= 0;
    }

    var padding = CodeUtil.getBlank(depth);
    var nextPadding = CodeUtil.getBlank(depth + 1);

    return CodeUtil.parseCode(name, reqObj, {

      onParseParentStart: function () {
        return isEmpty ? 'map[string]interface{} {' : 'map[string]interface{} {\n';
      },

      onParseParentEnd: function () {
        return isEmpty ? '}' : ',\n' + padding + '}';
      },

      onParseChildArray: function (key, value, index) {
        return (index > 0 ? ',\n' : '') + nextPadding + '"' + key + '": ' + CodeUtil.parseGoRequest(key, value, depth + 1);
      },

      onParseChildObject: function (key, value, index) {
        return (index > 0 ? ',\n' : '') + nextPadding + '"' + key + '": ' + CodeUtil.parseGoRequest(key, value, depth + 1);
      },

      onParseArray: function (key, value, index, isOuter) {
        var isEmpty = value.length <= 0;
        var s = '[]interface{} {' + (isEmpty ? '' : '\n');

        var inner = '';
        var innerPadding = isOuter ? nextPadding : CodeUtil.getBlank(depth + 2);
        for (var i = 0; i < value.length; i ++) {
          inner += (i > 0 ? ',\n' : '') + innerPadding + CodeUtil.parseGoRequest(null, value[i], depth + (isOuter ? 1 : 2));
        }
        s += inner;

        s += isEmpty ? '}' : ',\n' + (isOuter ? padding : nextPadding) + '}';
        return s;
      },

      onParseChildOther: function (key, value, index, isOuter) {
        var v; //避免改变原来的value
        if (value == null) {
          v = 'nil';
        }
        else if (value instanceof Array) {
          v = this.onParseArray(key, value, index, isOuter);
        }
        else if (typeof value == 'string') {
          v = '"' + value + '"';
        }
        else {
          v = value
        }

        return (index > 0 ? ',\n' : '') + (key == null ? '' : (isOuter ? padding : nextPadding) + '"' + key + '": ') + v;
      }
    })

  },

  /**解析出 生成iOS-Objective-C请求JSON 的代码
   * 只需要把所有 对象标识{} 改为数组标识 []
   * @param name
   * @param reqObj
   * @param depth
   * @return parseCode
   */
  parseObjectiveCRequest: function(name, reqObj, depth) {
    return CodeUtil.parseSwiftRequest(name, reqObj, depth);
  },


  /**解析出 生成Android-Kotlin 请求JSON 的代码
   * @param name
   * @param reqObj
   * @param depth
   * @return parseCode
   * @return isSmart 是否智能
   */
  parseKotlinRequest: function(name, reqObj, depth, isSmart, isArrayItem, useVar4Value, type, host, url, comment, isRESTful) {
    if (depth == null || depth < 0) {
      depth = 0;
    }
    var isEmpty = true;
    if (reqObj instanceof Array) {
      isEmpty = reqObj.length <= 0;
    }
    else if (reqObj instanceof Object) {
      isEmpty = Object.keys(reqObj).length <= 0;
    }

    var padding = CodeUtil.getBlank(depth);
    var nextPadding = CodeUtil.getBlank(depth + 1);
    var nextNextPadding = CodeUtil.getBlank(depth + 2);

    if (depth <= 0) {
      //RESTful 等非 APIJSON 规范的 API <<<<<<<<<<<<<<<<<<<<<<<<<<
      var requestMethod = StringUtil.isEmpty(type, true) || type == 'PARAM' ? 'GET' : 'POST';

      url = url || '';

      var lastIndex = url.lastIndexOf('/');
      var methodUri = url; // lastIndex < 0 ? url : url.substring(lastIndex);
      var methodName = JSONResponse.getVariableName(lastIndex < 0 ? url : url.substring(lastIndex + 1));

      url = url.substring(0, lastIndex);
      lastIndex = url.lastIndexOf('/');
      var varName = JSONResponse.getVariableName(lastIndex < 0 ? url : url.substring(lastIndex + 1));
      var modelName = StringUtil.firstCase(varName, true);

      if (StringUtil.isEmpty(modelName, true) != true) {
        var useStaticClass = type == 'JSON' && !isSmart

        var nextNextNextPadding = CodeUtil.getBlank(depth + 3);
        var nextNextNextNextPadding = CodeUtil.getBlank(depth + 4);

        // var controllerUri = url; // lastIndex < 0 ? '' : url.substring(0, lastIndex);
        var isPost = type != 'PARAM' && (methodUri.indexOf('post') >= 0 || methodUri.indexOf('add') >= 0 || methodUri.indexOf('create') >= 0);
        var isPut = type != 'PARAM' && (methodUri.indexOf('put') >= 0 || methodUri.indexOf('edit') >= 0 || methodUri.indexOf('update') >= 0);
        var isDelete = type != 'PARAM' && (methodUri.indexOf('delete') >= 0 || methodUri.indexOf('remove') >= 0 || methodUri.indexOf('del') >= 0);
        var isWrite = isPost || isPut || isDelete;
        var isGet = !isWrite; // methodUri.indexOf('get') >= 0 || methodUri.indexOf('fetch') >= 0 || methodUri.indexOf('query') >= 0;
        var isList = isGet && (methodUri.indexOf('list') >= 0 || methodUri.indexOf('List') >= 0 || typeof reqObj.pageNum == 'number');

        var dataType = isWrite ? 'Int' : (isList ? 'List<' + modelName + '>' : modelName);

        var requestType = (type == 'JSON' ? (isSmart ? 'RequestBody' : modelName + (isList ? 'List' : '') + 'Request') : (type == 'DATA' ? 'Map<String, RequestBody>' : ''));
        var responseType = modelName + (isList ? 'List' : '') + 'Response';
        var fullResponseType = responseType + '<' + dataType + '>'

        var str = '';
        if (reqObj != null) {
          if (useStaticClass) {
            str += '\nvar request = ' + CodeUtil.parseKotlinRequest(requestType, reqObj, depth, isSmart, isArrayItem, false, type, null, null, null, true);
          }
          else {
            for (var k in reqObj) {
              var v = reqObj[k];

              if (v instanceof Object) {
                var kn = isSmart ? JSONResponse.getVariableName(k) : CodeUtil.getKotlinTypeFromJS(k, v, false, false, false, !isSmart);
                str += '\nvar ' + kn + ' = ' + CodeUtil.parseKotlinRequest(kn, v, depth, isSmart, isArrayItem, false, type, null, null, null, true);
              }
            }
          }
        }

        var s = '//调用示例' + (StringUtil.isEmpty(str, true) ? '' : '\n' + StringUtil.trim(str) + '\n')
          + '\n' + methodName + '(' + (useStaticClass ? 'request' : CodeUtil.getCode4KotlinArgValues(reqObj, true)) + ')'

        if (isSmart) {
          s += '\n' + nextPadding + '.enqueue(object : HttpCallbackImpl<' + fullResponseType + '>() {'
            + '\n' + nextNextPadding + 'override fun onHttpSucceed(data: ' + fullResponseType + ', requestCode: Int) {'
            + '\n' + nextNextNextPadding + 'super.onHttpSucceed(data, requestCode)'
            + '\n' + nextNextNextPadding + '//TODO 继续处理'
            + '\n' + nextNextPadding + '}'
            + '\n' + nextPadding + '})\n\n'
        }
        else {
          s += '\n' + nextPadding + '.enqueue(object : Callback<' + fullResponseType + '>() {'
            + '\n' + nextNextPadding + 'override fun onFailure(call: Call<' + fullResponseType + '>, t: Throwable) {'
            + '\n' + nextNextNextPadding + 'Toast.makeText(context, t.message, Toast.LENGTH_SHORT).show()'
            + '\n' + nextNextNextPadding + '//TODO 继续处理'
            + '\n' + nextNextPadding + '}'
            + '\n' + nextNextPadding + 'override fun onResponse(call: Call<' + fullResponseType + '>, response: Response<' + fullResponseType + '>) {'
            + '\n' + nextNextNextPadding + 'if (! response.isSuccessful()){'
            + '\n' + nextNextNextNextPadding + 'onFailure(call, Exception(response.message()))'
            + '\n' + nextNextNextNextPadding + 'return'
            + '\n' + nextNextNextPadding + '}'
            + '\n' + nextNextNextPadding + 'var body = response.body()'
            + '\n' + nextNextNextPadding + 'if (! body.isSuccess()){'
            + '\n' + nextNextNextNextPadding + 'onFailure(call, Exception(body.msg))'
            + '\n' + nextNextNextNextPadding + 'return'
            + '\n' + nextNextNextPadding + '}\n'
            + '\n' + nextNextNextPadding + 'var data = body.data'
            + '\n' + nextNextNextPadding + '//TODO 继续处理'
            + '\n' + nextNextPadding + '}'
            + '\n' + nextPadding + '})\n\n'
        }

        //这里不用 Query-QueryMap ，而是直接 toJSONString 传给 String，是因为 QueryMap 会用 Retrofit/OKHttp 内部会取出值来拼接
        s += '\n//接口定义'
          + '\n@Keep'
          + '\ninterface ' + modelName + 'Service {  // ApiService {  // 建议统一用这个，方法都放进来'
          + (type == 'JSON' ? '\n' + nextPadding + '@Headers("Content-Type: application/json;charset=UTF-8")' : (type == 'FORM' ? '\n' + nextPadding + '@FormUrlEncoded' : (type == 'DATA' ? '\n' + nextPadding + '@Multipart' : '')))
          + '\n' + nextPadding + '@' + requestMethod + '("' + methodUri + '")'
          + '\n' + nextPadding + 'fun ' + methodName + '(' + (type == 'JSON' ? (isSmart ? '@Body requestBody: ' + requestType : '@Body req: ' + requestType) : (type == 'DATA' ? '@PartMap requestBodyMap: ' + requestType : CodeUtil.getCode4KotlinArgs(reqObj, true, type == 'PARAM' ? 'Query' : 'Field', !isSmart, !isSmart, true))) + '): Call<' + (isSmart ? 'JSONResponse' : fullResponseType) + '>'
          + '\n' +'}\n'
          + '\n/**请求方法'
          + '\n * ' + StringUtil.trim(comment)
          + '\n */'
          + '\n@JvmStatic'
          + '\nfun ' + methodName + '(' + (useStaticClass ? 'request: ' + requestType : CodeUtil.getCode4KotlinArgs(reqObj, true, null, true, false, false)) + '): ' + 'Call<' + (isSmart ? 'JSONResponse' : fullResponseType) + '>' + ' {'
          + '\n' + (useStaticClass ? '' : (type == 'JSON' || type == 'DATA' ? (nextPadding + 'var request = ' + CodeUtil.parseKotlinRequest(name, reqObj, depth + 1, isSmart, isArrayItem, true, type, null, null, null, true)) : '')
              + '\n' + (type != 'JSON' ? '' : '\n' + nextPadding + 'var requestBody = RequestBody.create(MediaType.parse("application/json;charset=UTF-8"), JSON.toJSONString(request))')
          )
          + '\n' + nextPadding + 'var service = RETROFIT.create(' + modelName + 'Service.class)'
          + '\n' + nextPadding + 'return service.' + methodName + '(' + (type == 'JSON' ? (isSmart ? 'requestBody' : 'request') : (type == 'DATA' ? 'request' : CodeUtil.getCode4KotlinArgs(reqObj, false, null, !isSmart, true, true))) + ')'
          + '\n}\n'
          + '\n' + '//Retrofit 实例，全局存一份，可改为单例'
          + '\n' + 'const val RETROFIT = Retrofit.Builder()'
          + '\n' + nextPadding + '.baseUrl("' + StringUtil.trim(host) + '")'
          + '\n' + nextPadding + '.addConverterFactory(GsonConverterFactory.create())'
          + '\n' + nextPadding + '.build()\n'


        if (isSmart) {
          s += '\n' + '//通用 HTTP 回调 API，全局保存一份'
            + '\n@Keep'
            + '\ninterface HttpCallback<D> {'
            + '\n' + nextPadding + 'fun onHttpFailed(code: Int, msg: String)'
            + '\n' + nextPadding + 'fun onHttpSucceed(data: D, requestCode: Int)'
            + '\n' + nextPadding + 'fun showToast(msg: String)'
            + '\n' + nextPadding + 'fun showLoading()'
            + '\n' + nextPadding + 'fun hideLoading()'
            + '\n' + '}\n'
            + '\n//通用 HTTP 回调解析类，全局存一份'
            + '\n@Keep'
            + '\nopen class HttpCallbackImpl<R, D> : Callback<R>, HttpCallback<D> {\n'
            + '\n' + nextPadding + 'companion object {'
            + '\n' + nextNextPadding + 'const val TAG = "HttpCallbackImpl"'
            + '\n' + nextPadding + '}\n'
            + '\n' + nextPadding + 'open var isShowToast: Boolean = true'
            + '\n' + nextPadding + 'open var isShowLoading: Boolean = true'
            + '\n' + nextPadding + 'open var requestCode: Int = 0'
            + '\n' + nextPadding + 'open var callback: Callback<R>? = null'
            + '\n' + nextPadding + 'open var httpCallback: HttpCallback<D>? = null\n'
            + '\n' + nextPadding + 'constructor HttpCallbackImpl(): super() {}'
            + '\n' + nextPadding + 'constructor HttpCallbackImpl(callback: Callback<R>) : this() {'
            + '\n' + nextNextPadding + 'this.callback = callback'
            + '\n' + nextPadding + '}'
            + '\n' + nextPadding + 'constructor HttpCallbackImpl(httpCallback: HttpCallback<D>?) : this() {'
            + '\n' + nextNextPadding + 'this.httpCallback = httpCallback'
            + '\n' + nextPadding + '}'
            + '\n' + nextPadding + 'constructor HttpCallbackImpl(requestCode: Int, httpCallback: HttpCallback<D>?) : this(httpCallback) {'
            + '\n' + nextNextPadding + 'this.requestCode = requestCode'
            + '\n' + nextPadding + '}'
            + '\n' + nextPadding + 'constructor HttpCallbackImpl(isShowLoading: Boolean, httpCallback: HttpCallback<D>?) : this(httpCallback) {'
            + '\n' + nextNextPadding + 'this.isShowLoading = isShowLoading'
            + '\n' + nextPadding + '}'
            + '\n' + nextPadding + 'constructor HttpCallbackImpl(isShowToast: Boolean, isShowLoading: Boolean, httpCallback: HttpCallback<D>?) : this(isShowLoading, httpCallback) {'
            + '\n' + nextNextPadding + 'this.isShowToast = isShowToast'
            + '\n' + nextPadding + '}'
            + '\n' + nextPadding + 'constructor HttpCallbackImpl(requestCode: Int, isShowToast: Boolean, isShowLoading: Boolean, httpCallback: HttpCallback<D>?) : this(isShowToast, isShowLoading, httpCallback) {'
            + '\n' + nextNextPadding + 'this.requestCode = requestCode'
            + '\n' + nextPadding + '}\n\n'
            + '\n' + nextPadding + 'override fun onFailure(call: Call<R>, t: Throwable) {'
            + '\n' + nextNextPadding + 'try {'
            + '\n' + nextNextNextPadding + 'callback?.onFailure(call, t)'
            + '\n' + nextNextNextPadding + 'onHttpFailed(0, t.message)'
            + '\n' + nextNextPadding + '} catch(e: Exception) {'
            + '\n' + nextNextNextPadding + 'Log.e(TAG, "onFailure  catch e: Exception = " + e.message)'
            + '\n' + nextNextNextPadding + 'if (BuildConfig.DEBUG) {'
            + '\n' + nextNextNextNextPadding + 'throw e'
            + '\n' + nextNextNextPadding + '}'
            + '\n' + nextNextNextPadding + 'CrashReport.postCatchedException(e)'
            + '\n' + nextNextPadding + '}'
            + '\n' + nextPadding + '}\n'
            + '\n' + nextPadding + 'override fun onResponse(call: Call<R>, response: Response<' + fullResponseType + '>) {'
            + '\n' + nextNextPadding + 'try {'
            + '\n' + nextNextNextPadding + 'callback?.onResponse(call, response)'
            + '\n' + nextNextNextPadding + 'if (! response.isSuccessful()){'
            + '\n' + nextNextNextNextPadding + 'onFailure(call, Exception(response.message()))'
            + '\n' + nextNextNextNextPadding + 'return'
            + '\n' + nextNextNextPadding + '}'
            + '\n' + nextNextNextPadding + 'var body = response.body()'
            + '\n' + nextNextNextPadding + 'if (body == null || ! body.isSuccess()){'
            + '\n' + nextNextNextNextPadding + 'onFailure(call, Exception(body?.msg ?: "网络异常"))'
            + '\n' + nextNextNextNextPadding + 'return'
            + '\n' + nextNextNextPadding + '}'
            + '\n' + nextNextNextPadding + 'onHttpSucceed(body.data, requestCode)'
            + '\n' + nextNextPadding + '} catch(e: Exception) {'
            + '\n' + nextNextNextPadding + 'Log.e(TAG, "onResponse  catch e: Exception = " + e.message)'
            + '\n' + nextNextNextPadding + 'if (BuildConfig.DEBUG) {'
            + '\n' + nextNextNextNextPadding + 'throw e'
            + '\n' + nextNextNextPadding + '}'
            + '\n' + nextNextNextPadding + 'CrashReport.postCatchedException(e)'
            + '\n' + nextNextPadding + '}'
            + '\n' + nextPadding + '}\n'
            + '\n' + nextPadding + 'override fun onHttpFailed(code: Int, msg: String) {'
            + '\n' + nextNextPadding + 'if (isShowLoading) {'
            + '\n' + nextNextNextPadding + 'hideLoading()'
            + '\n' + nextNextPadding + '}'
            + '\n' + nextNextPadding + 'if (isShowToast) {'
            + '\n' + nextNextNextPadding + 'showToast(msg)'
            + '\n' + nextNextPadding + '}'
            + '\n' + nextNextPadding + 'httpCallback?.onHttpFailed(code, msg)'
            + '\n' + nextPadding + '}\n'
            + '\n' + nextPadding + 'override fun onHttpSucceed(data: D, requestCode: Int) {'
            + '\n' + nextNextPadding + 'if (isShowLoading) {'
            + '\n' + nextNextNextPadding + 'hideLoading()'
            + '\n' + nextNextPadding + '}'
            + '\n' + nextNextPadding + 'httpCallback?.onHttpSucceed(data, requestCode)'
            + '\n' + nextPadding + '}\n'
            + '\n' + nextPadding + 'override fun showToast(msg: String) {'
            + '\n' + nextNextPadding + 'httpCallback?.showToast(msg)'
            + '\n' + nextPadding + '}\n'
            + '\n' + nextPadding + 'override fun showLoading() {'
            + '\n' + nextNextPadding + 'httpCallback?.showLoading()'
            + '\n' + nextPadding + '}\n'
            + '\n' + nextPadding + 'override fun hideLoading() {'
            + '\n' + nextNextPadding + 'httpCallback?.hideLoading()'
            + '\n' + nextPadding + '}\n'
            + '\n' + '}\n'
        }
        else {
          if (isList) {
            modelName += 'List';
            varName += 'List';
          }

          s += '\n\n//回调实体类'
            + '\n@Keep'
            + '\nopen class ' + responseType + '<T> : BaseResponse<T> {'
            + '\n' + nextPadding + '@Transient'
            + '\n' + nextPadding + 'open var ' + varName + ': ' + dataType + CodeUtil.initEmptyValue4Type(dataType, true, true) + '\n'
            + '\n}\n'
            + '\n//通用 HTTP 解析实体基类，全局存一份'
            + '\n@Keep'
            + '\nopen class BaseResponse<T> {'
            + '\n' + nextPadding + '@Transient'
            + '\n' + nextPadding + 'open var code: Int' + CodeUtil.initEmptyValue4Type('Int', true, true) + '\n'
            + '\n' + nextPadding + '@Transient'
            + '\n' + nextPadding + 'open var msg: String' + CodeUtil.initEmptyValue4Type('String', true, true) + '\n'
            + '\n' + nextPadding + '@Transient'
            + '\n' + nextPadding + 'open var data: T? = null\n'
            + '\n' + nextPadding + 'open fun isSuccess(): Boolean {'
            + '\n' + nextNextPadding + 'return code == 200'
            + '\n' + nextPadding + '}\n'
            + '\n' + '}';

        }

        return s + (isSmart || type != 'JSON' ? '' : '\n\n//请求实体类\n' + StringUtil.trim(CodeUtil.parseKotlinClasses(requestType, reqObj, 0, false, false)));
      }
      //RESTful 等非 APIJSON 规范的 API >>>>>>>>>>>>>>>>>>>>>>>>>>
    }

    var useStaticClass = isRESTful && type == 'JSON' && isSmart != true && StringUtil.isEmpty(name, true) != true

    var parentKey = JSONObject.isArrayKey(name)
      ? JSONResponse.getVariableName(CodeUtil.getItemKey(name)) + (depth <= 1 ? '' : depth)
      : CodeUtil.getTableKey(JSONResponse.getVariableName(name));

    return CodeUtil.parseCode(name, reqObj, {

      onParseParentStart: function () {
        if (useStaticClass) {
          return StringUtil.firstCase(JSONResponse.getVariableName(name), true) + '()' + (isEmpty ? '' : '.apply {\n')
        }
        return useVar4Value && type == 'DATA' ? 'mapOf<String, RequestBody>(\n' : (isEmpty ? 'HashMap<String, Any>(' : 'mapOf(\n');
      },

      onParseParentEnd: function () {
        if (useStaticClass) {
          return isEmpty ? '' : '\n' + padding + '}'
        }
        return isEmpty ? ')' : '\n' + padding + ')';
      },

      onParseChildArray: function (key, value, index) {
        if (useVar4Value) {
          return this.onParseChildOther(key, value, index);
        }
        var vn = useStaticClass ? JSONResponse.getVariableName(key) : null
        var kn = useStaticClass ? StringUtil.firstCase(JSONResponse.getVariableName(key), true) : null
        return (index <= 0 ? '' : (useStaticClass ? '\n' : ',\n')) + nextPadding + (useStaticClass ? vn + ' = ' : '"' + key + '" to ') + CodeUtil.parseKotlinRequest(useStaticClass ? kn : key, value, depth + 1, isSmart, isArrayItem, useVar4Value, type, null, null, null, isRESTful);
      },

      onParseChildObject: function (key, value, index) {
        if (useVar4Value) {
          return this.onParseChildOther(key, value, index);
        }
        var vn = useStaticClass ? JSONResponse.getVariableName(key) : null
        var kn = useStaticClass ? StringUtil.firstCase(JSONResponse.getVariableName(key), true) : null
        return (index <= 0 ? '' : (useStaticClass ? '\n' : ',\n')) + nextPadding + (useStaticClass ? vn + ' = ' : '"' + key + '" to ') + CodeUtil.parseKotlinRequest(useStaticClass ? kn : key, value, depth + 1, isSmart, isArrayItem, useVar4Value, type, null, null, null, isRESTful);
      },

      onParseArray: function (key, value, index, isOuter) {
        if (useVar4Value) {
          return this.onParseChildOther(key, value, index, isOuter);
        }

        var isEmpty = value.length <= 0;
        var s = isEmpty ? 'ArrayList<Any>(' : 'listOf(\n';

        if (isEmpty != true) {
          var inner = '';
          var innerPadding = isOuter ? nextPadding : nextNextPadding;

          for (var i = 0; i < value.length; i ++) {
            inner += (i > 0 ? ',\n' : '') + innerPadding + CodeUtil.parseKotlinRequest(null, value[i], depth + (isOuter ? 1 : 2), isSmart, isArrayItem, useVar4Value, type, null, null, null, isRESTful);
          }
          s += inner;
        }

        s += isEmpty ? ')' : ('\n' + (isOuter ? padding : nextPadding) + ')');

        return s;
      },

      onParseChildOther: function (key, value, index, isOuter) {
        var valStr;
        if (useVar4Value != true && value instanceof Array) {
          valStr = this.onParseArray(key, value, index, isOuter);
        }
        else {
          valStr = useVar4Value ? JSONResponse.getVariableName(key) : CodeUtil.getCode4Value(CodeUtil.LANGUAGE_KOTLIN, value);
          if (useVar4Value && type == 'DATA') {
            if (value instanceof Object) {
              valStr = 'JSON.toJSONString(' + valStr + ')';
            }
            valStr = 'RequestBody.create(MediaType.parse("multipart/form-data", ' + valStr + ')';
          }
        }

        return (index <= 0 ? '' : (useStaticClass ? '\n' : ',\n')) + (key == null ? '' : (isOuter ? padding : nextPadding)
            + (useStaticClass ? JSONResponse.getVariableName(key) + ' = ' : '"' + key + '" to ')) + valStr;
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
  parseJavaRequest: function(name, reqObj, depth, isSmart, isArrayItem, useVar4Value, type, url, comment) {
    name = name || 'request'
    if (depth == null || depth < 0) {
      depth = 0;
    }


    var prefix = CodeUtil.getBlank(depth);
    var nextPrefix = CodeUtil.getBlank(depth + 1);
    var nextNextPrefix = CodeUtil.getBlank(depth + 2);

    if (depth <= 0) {
      //RESTful 等非 APIJSON 规范的 API <<<<<<<<<<<<<<<<<<<<<<<<<<
      var requestMethod = StringUtil.isEmpty(type, true) || type == 'PARAM' ? 'GET' : 'POST';

      url = url || '';

      var lastIndex = url.lastIndexOf('/');
      var methodUri = url; // lastIndex < 0 ? url : url.substring(lastIndex);
      var methodName = JSONResponse.getVariableName(lastIndex < 0 ? url : url.substring(lastIndex + 1));

      url = url.substring(0, lastIndex);
      lastIndex = url.lastIndexOf('/');
      var varName = JSONResponse.getVariableName(lastIndex < 0 ? url : url.substring(lastIndex + 1));
      var modelName = StringUtil.firstCase(varName, true);

      if (StringUtil.isEmpty(modelName, true) != true) {
        // var controllerUri = url; // lastIndex < 0 ? '' : url.substring(0, lastIndex);
        var isPost = type != 'PARAM' && (methodUri.indexOf('post') >= 0 || methodUri.indexOf('add') >= 0 || methodUri.indexOf('create') >= 0);
        var isPut = type != 'PARAM' && (methodUri.indexOf('put') >= 0|| methodUri.indexOf('edit') >= 0 || methodUri.indexOf('update') >= 0);
        var isDelete = type != 'PARAM' && (methodUri.indexOf('delete') >= 0 || methodUri.indexOf('remove') >= 0 || methodUri.indexOf('del') >= 0);
        var isWrite = isPost || isPut || isDelete;
        var isGet = ! isWrite; // methodUri.indexOf('get') >= 0 || methodUri.indexOf('fetch') >= 0 || methodUri.indexOf('query') >= 0;
        var isList = isGet && (methodUri.indexOf('list') >= 0 || methodUri.indexOf('List') >= 0 || typeof reqObj.pageNum == 'number');

        var dataType = isWrite ? 'Integer' : (isList ? 'List<' + modelName + '>' : modelName);

        var responseType = modelName + (isList ? 'List' : '') + 'Response';

        var str = '';
        if (reqObj != null) {
          for (var k in reqObj) {
            var v = reqObj[k];

            if (v instanceof Object) {
              str += '\n' + CodeUtil.parseJavaRequest(JSONResponse.getVariableName(k), v, depth, isSmart);
            }
          }
        }

        var s = '//调用示例' + (StringUtil.isEmpty(str, true) ? '' : '\n' + StringUtil.trim(str) + '\n')
          + '\n' + methodName + '(' + CodeUtil.getCode4JavaArgValues(reqObj, true) + ');\n'
          + '\n/**'
          + '\n * ' + StringUtil.trim(comment)
          + '\n */'
          + '\npublic static ' + 'Call<' + (isSmart ? 'JSONResponse' : responseType + '<' + dataType + '>') + '>' + ' ' + methodName + '(' + CodeUtil.getCode4JavaArgs(reqObj, true, null, ! isSmart) + ') {\n'
          + (type == 'JSON' || type == 'DATA' ? CodeUtil.parseJavaRequest(name, reqObj, depth + 1, isSmart, isArrayItem, true, type, url) : '') + '\n'
          + (type == 'JSON' ? '\n' + nextPrefix + 'RequestBody requestBody = RequestBody.create(MediaType.parse("application/json;charset=UTF-8"), JSON.toJSONString(request));' : '')
          + '\n' + nextPrefix + modelName + 'Service service = retrofit.create(' + modelName + 'Service.class);'
          + '\n' + nextPrefix + 'return service.' + methodName + '(' + (type == 'JSON' ? 'requestBody' : (type == 'DATA' ? 'request' : CodeUtil.getCode4JavaArgs(reqObj, false, null, ! isSmart, true, true))) + ');'
          + '\n}\n';

        //这里不用 Query-QueryMap ，而是直接 toJSONString 传给 String，是因为 QueryMap 会用 Retrofit/OKHttp 内部会取出值来拼接
        s += '\npublic interface ' + modelName + 'Service {  // ApiService {  //建议统一用这个，方法都放进来'
          + (type == 'JSON' ? '\n' + nextPrefix + '@Headers("Content-Type: application/json;charset=UTF-8")' : (type == 'FORM' ? '\n' + nextPrefix + '@FormUrlEncoded': (type == 'DATA' ? '\n' + nextPrefix + '@Multipart': '')))
          + '\n' + nextPrefix + '@' + requestMethod + '("' + methodUri + '")'
          + '\n' + nextPrefix + 'Call<' + (isSmart ? 'JSONResponse' : responseType + '<' + dataType + '>') + '>' + ' ' + methodName + '(' + (type == 'JSON' ? '@Body RequestBody requestBody' : (type == 'DATA' ? '@PartMap Map<String, RequestBody> requestBodyMap' : CodeUtil.getCode4JavaArgs(reqObj, true, type == 'PARAM' ? 'Query' : 'Field', ! isSmart, true))) + ');'
          + '\n' + '}';

        if (! isSmart) {
          if (isList) {
            modelName += 'List';
            varName += 'List';
          }

          s += '\n\n' +
            'public class ' + responseType + '<T> extends Response<T> {\n' +
            nextPrefix + 'private ' + dataType + ' ' + varName + ';\n\n' +
            nextPrefix + 'public '+ dataType + ' get' + modelName + '() {\n' +
            nextNextPrefix + 'return ' + varName + ';\n' +
            nextPrefix + '}\n' +
            nextPrefix + 'public ' + responseType + '<T> set' + modelName + '(' + dataType + ' ' + varName + ') {\n' +
            nextNextPrefix + 'this.' + varName + ' = ' + varName + ';\n' +
            nextNextPrefix + 'return this;\n' +
            nextPrefix + '}\n' +
            '}';

          s += '\n\n' +
            'public class Response<T> {\n' +
            nextPrefix + 'private int code;\n' +
            nextPrefix + 'private String msg;\n' +
            nextPrefix + 'private T data;\n\n' +
            nextPrefix + 'public int getCode() {\n' +
            nextNextPrefix + 'return code;\n' +
            nextPrefix + '}\n' +
            nextPrefix + 'public Response<T> setCode(int code) {\n' +
            nextNextPrefix + 'this.code = code;\n' +
            nextNextPrefix + 'return this;\n' +
            nextPrefix + '}\n\n' +
            nextPrefix + 'public String getMsg() {\n' +
            nextNextPrefix + 'return msg;\n' +
            nextPrefix + '}\n' +
            nextPrefix + 'public Response<T> setMsg(String msg) {\n' +
            nextNextPrefix + 'this.msg = msg;\n' +
            nextNextPrefix + 'return this;\n' +
            nextPrefix + '}\n\n' +
            nextPrefix + 'public T getData() {\n' +
            nextNextPrefix + 'return data;\n' +
            nextPrefix + '}\n' +
            nextPrefix + 'public Response<T> setData(T data) {\n' +
            nextNextPrefix + 'this.data = data;\n' +
            nextNextPrefix + 'return this;\n' +
            nextPrefix + '}\n' +
            '}';

        }

        return s;
      }
      //RESTful 等非 APIJSON 规范的 API >>>>>>>>>>>>>>>>>>>>>>>>>>
    }


    var parentKey = JSONObject.isArrayKey(name)
      ? JSONResponse.getVariableName(CodeUtil.getItemKey(name)) + (depth <= 1 ? '' : depth)
      : CodeUtil.getTableKey(JSONResponse.getVariableName(name));

    return CodeUtil.parseCode(name, reqObj, {

      onParseParentStart: function () {
        if (isArrayItem == true) {
          isArrayItem = false;
          return '';
        }
        var s = '\n' + prefix + (useVar4Value && type == 'DATA' ? 'Map<String, RequestBody>' : (isSmart ? 'JSONRequest' : 'Map<String, Object>')) + ' ' + parentKey + ' = new ' + (isSmart ? 'JSONRequest' : 'LinkedHashMap<>') + '();';

        return s;
      },

      onParseParentEnd: function () {
        return '';
      },

      onParseChildArray: function (key, value, index) {
        if (useVar4Value) {
          return this.onParseChildOther(key, value, index);
        }

        var s = '\n\n' + prefix + '{   ' + '// ' + key + ' <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        var count = isSmart ? (value.count || 0) : 0;
        var page = isSmart ? (value.page || 0) : 0;
        var query = isSmart ? value.query : null;
        var join = isSmart ? value.join : null;

        log(CodeUtil.TAG, 'parseJavaRequest  for  count = ' + count + '; page = ' + page);

        if (isSmart) {
          delete value.count;
          delete value.page;
          delete value.query;
          delete value.join;
        }

        s += CodeUtil.parseJavaRequest(key, value, depth + 1, isSmart);

        log(CodeUtil.TAG, 'parseJavaRequest  for delete >> count = ' + count + '; page = ' + page);

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

        s += '\n' + prefix + '}   ' + '// ' + key + ' >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
      },

      onParseChildObject: function (key, value, index) {
        if (useVar4Value) {
          return this.onParseChildOther(key, value, index);
        }

        var s = '\n\n' + prefix + '{   ' + '// ' + key + ' <<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        var isTable = isSmart && JSONObject.isTableKey(JSONResponse.getTableName(key));

        var column = isTable ? value['@column'] : null;
        var group = isTable ? value['@group'] : null;
        var having = isTable ? value['@having'] : null;
        var order = isTable ? value['@order'] : null;
        var combine = isTable ? value['@combine'] : null;
        var schema = isTable ? value['@schema'] : null;
        var database = isTable ? value['@database'] : null;
        var datasource = isTable ? value['@datasource'] : null;
        var raw = isTable ? value['@raw'] : null;
        var role = isTable ? value['@role'] : null;
        var explain = isTable ? value['@explain'] : null;
        var json = isTable ? value['@json'] : null;
        var cache = isTable ? value['@cache'] : null;

        if (isTable) {
          delete value['@column'];
          delete value['@group'];
          delete value['@having'];
          delete value['@order'];
          delete value['@combine'];
          delete value['@schema'];
          delete value['@database'];
          delete value['@datasource'];
          delete value['@raw'];
          delete value['@role'];
          delete value['@explain'];
          delete value['@json'];
          delete value['@cache'];
        }

        s += CodeUtil.parseJavaRequest(key, value, depth + 1, isSmart);

        const name = CodeUtil.getTableKey(JSONResponse.getVariableName(key));
        if (isTable) {
          s = column == null ? s : s + '\n' + nextPrefix + name + '.setColumn(' + CodeUtil.getCode4Value(CodeUtil.LANGUAGE_JAVA, column) + ');';
          s = group == null ? s : s + '\n' + nextPrefix + name + '.setGroup(' + CodeUtil.getCode4Value(CodeUtil.LANGUAGE_JAVA, group) + ');';
          s = having == null ? s : s + '\n' + nextPrefix + name + '.setHaving(' + CodeUtil.getCode4Value(CodeUtil.LANGUAGE_JAVA, having) + ');';
          s = order == null ? s : s + '\n' + nextPrefix + name + '.setOrder(' + CodeUtil.getCode4Value(CodeUtil.LANGUAGE_JAVA, order) + ');';
          s = combine == null ? s : s + '\n' + nextPrefix + name + '.setCombine(' + CodeUtil.getCode4Value(CodeUtil.LANGUAGE_JAVA, combine) + ');';
          s = schema == null ? s : s + '\n' + nextPrefix + name + '.setSchema(' + CodeUtil.getCode4Value(CodeUtil.LANGUAGE_JAVA, schema) + ');';
          s = database == null ? s : s + '\n' + nextPrefix + name + '.setDatabase(' + CodeUtil.getCode4Value(CodeUtil.LANGUAGE_JAVA, database) + ');';
          s = datasource == null ? s : s + '\n' + nextPrefix + name + '.setDatasource(' + CodeUtil.getCode4Value(CodeUtil.LANGUAGE_JAVA, datasource) + ');';
          s = raw == null ? s : s + '\n' + nextPrefix + name + '.setRaw(' + CodeUtil.getCode4Value(CodeUtil.LANGUAGE_JAVA, raw) + ');';
          s = role == null ? s : s + '\n' + nextPrefix + name + '.setRole(' + CodeUtil.getCode4Value(CodeUtil.LANGUAGE_JAVA, role) + ');';
          s = explain == null ? s : s + '\n' + nextPrefix + name + '.setExplain(' + CodeUtil.getCode4Value(CodeUtil.LANGUAGE_JAVA, explain) + ');';
          s = json == null ? s : s + '\n' + nextPrefix + name + '.setJson(' + CodeUtil.getCode4Value(CodeUtil.LANGUAGE_JAVA, json) + ');';
          s = cache == null ? s : s + '\n' + nextPrefix + name + '.setCache(' + CodeUtil.getCode4Value(CodeUtil.LANGUAGE_JAVA, cache) + ');';
        }

        s += '\n\n' + nextPrefix + parentKey + '.put("' + key + '", ' + name + ');';

        s += '\n' + prefix + '}   ' + '// ' + key + ' >>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
      },

      onParseArray: function (key, value, index, isOuter) {
        if (useVar4Value) {
          return this.onParseChildOther(key, value, index, isOuter);
        }

        var s = '\n\n' + prefix + '{   ' + '// ' + key + ' <<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        var varName = JSONResponse.formatKey(key, true, false, false, true, true, true)

        if (isArrayItem != true) {
          s += '\n' + nextPrefix + (isSmart ? 'JSONArray ' : 'List<Object> ') + varName + ' = new ' + (isSmart ? 'JSONArray' : 'ArrayList<>') + '();';
        }

        if (value.length > 0) {
          var itemName = StringUtil.addSuffix(varName, 'Item') + (depth <= 0 ? '' : depth + 1);

          var innerPrefix = CodeUtil.getBlank(depth + 2);
          var inner = '';

          for (var i = 0; i < value.length; i++) {
            if (value[i] instanceof Object == false) {
              inner += '\n' + nextPrefix + varName + '.add(' + CodeUtil.getCode4Value(CodeUtil.LANGUAGE_JAVA, value[i]) + ');';
            }
            else {
              inner += '\n\n' + nextPrefix + '{   ' + '// ' + key + '[' + i + '] <<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

              if (value[i] instanceof Array) {
                inner += '\n' + innerPrefix + (isSmart ? 'JSONArray ' : 'List<Object> ') + itemName + ' = new ' + (isSmart ? 'JSONArray' : 'ArrayList<>') + '();';
              }
              else if (value[i] instanceof Object) {
                inner += '\n' + innerPrefix + (isSmart ? 'JSONObject ' : 'Map<String, Object> ') + itemName + ' = new ' + (isSmart ? 'JSONObject' : 'LinkedHashMap<>') + '();';
              }
              else {
                inner += '//FIXME 这里不可能出现 value[' + i + '] 类型为 ' + (typeof value[i]) + '！'; //不可能
              }

              inner += CodeUtil.getCode4Value(CodeUtil.LANGUAGE_JAVA, value[i], itemName, depth + 1, isSmart, true, CodeUtil.parseJavaRequest);
              inner += '\n' + innerPrefix + varName + '.add(' + itemName + ');';
              inner += '\n' + nextPrefix + '}   ' + '// ' + key + '[' + i + '] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';
            }
          }

          s += inner;
        }

        if (isArrayItem != true) {
          if (reqObj instanceof Array) {
            s += '\n\n' + nextPrefix + parentKey + '.add(' + varName + ');';
          }
          else if (reqObj instanceof Object) {
            s += '\n\n' + nextPrefix + parentKey + '.put("' + key + '", ' + varName + ');';
          }
          else {
            s += '//FIXME 这里不可能出现 reqObj 类型为 ' + (typeof reqObj) + '！'; //不可能
          }
        }

        s += '\n' + prefix + '}   ' + '// ' + key + ' >>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';
        return s;
      },

      onParseChildOther: function (key, value, index, isOuter) {
        if (useVar4Value != true && value instanceof Array) {
          return this.onParseArray(key, value, index, isOuter);
        }

        var valStr = useVar4Value ? JSONResponse.getVariableName(key) : CodeUtil.getCode4Value(CodeUtil.LANGUAGE_JAVA, value);
        if (useVar4Value && type == 'DATA') {
          if (value instanceof Object) {
            valStr = 'JSON.toJSONString(' + valStr + ')';
          }
          valStr = 'RequestBody.create(MediaType.parse("multipart/form-data", ' + valStr + ')';
        }

        if (depth <= 0 && isSmart) {
          if (key == 'tag') {
            return '\n' + parentKey + '.setTag(' + valStr + ');';
          }
          if (key == 'version') {
            return '\n' + parentKey + '.setVersion(' + valStr + ');';
          }
          if (key == 'format') {
            return '\n' + parentKey + '.setFormat(' + valStr + ');';
          }
          if (key == '@schema') {
            return '\n' + parentKey + '.setSchema(' + valStr + ');';
          }
          if (key == '@database') {
            return '\n' + parentKey + '.setDatabase(' + valStr + ');';
          }
          if (key == '@datasource') {
            return '\n' + parentKey + '.setDatasource(' + valStr + ');';
          }
          if (key == '@role') {
            return '\n' + parentKey + '.setRole(' + valStr + ');';
          }
          if (key == '@explain') {
            return '\n' + parentKey + '.setExplain(' + valStr + ');';
          }
        }

        return '\n' + prefix + parentKey + '.put("' + key + '", ' + valStr + ');';
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
  parseCppRequest: function(name, reqObj, depth, isSmart, isArrayItem) {
    name = name || 'request'
    if (depth == null || depth < 0) {
      depth = 0;
    }

    var parentKey = JSONObject.isArrayKey(name)
      ? JSONResponse.getVariableName(CodeUtil.getItemKey(name)) + (depth <= 1 ? '' : depth)
      : CodeUtil.getTableKey(JSONResponse.getVariableName(name));

    var prefix = CodeUtil.getBlank(depth);
    var nextPrefix = CodeUtil.getBlank(depth + 1);

    return (depth > 0 ? "" : "rapidjson::Document document;"
          + "\nrapidjson::Document::AllocatorType& allocator = document.GetAllocator();\n"
      ) + CodeUtil.parseCode(name, reqObj, {

        onParseParentStart: function () {
          if (isArrayItem == true) {
            isArrayItem = false;
            return '';
          }
          return '\n' + prefix + 'rapidjson::Value ' + parentKey + '(rapidjson::kObjectType);';
        },

        onParseParentEnd: function () {
          return '';
        },

        onParseChildArray: function (key, value, index) {
          var name = JSONResponse.getVariableName(CodeUtil.getItemKey(key)) + (depth <= 0 ? '' : depth + 1);

          var s = '\n\n' + prefix + '{   ' + '// ' + key + ' <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';
          s += CodeUtil.parseCppRequest(key, value, depth + 1, isSmart);
          s += '\n\n' + CodeUtil.getBlank(depth + 1) + parentKey + '.AddMember("' + key + '", ' + name + ', allocator);';
          s += '\n' + prefix + '}   ' + '// ' + key + ' >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

          return s;
        },

        onParseChildObject: function (key, value, index) {
          const name = CodeUtil.getTableKey(JSONResponse.getVariableName(key));

          var s = '\n\n' + prefix + '{   ' + '// ' + key + ' <<<<<<<<<<<<<<<<<<<<<<<<<<<<<';
          s += CodeUtil.parseCppRequest(key, value, depth + 1, isSmart);
          s += '\n\n' + nextPrefix + parentKey + '.AddMember("' + key + '", ' + name + ', allocator);';
          s += '\n' + prefix + '}   ' + '// ' + key + ' >>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

          return s;
        },

        onParseArray: function (key, value, index, isOuter) {
          var s = '\n\n' + prefix + '{   ' + '// ' + key + ' <<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

          var varName = JSONResponse.formatKey(key, true, false, false, true, true, true)

          if (isArrayItem != true) {
            s += '\n' + nextPrefix + 'rapidjson::Value ' + varName + '(rapidjson::kArrayType);';
          }

          if (value.length > 0) {
            var itemName = StringUtil.addSuffix(varName, 'Item') + (depth <= 0 ? '' : depth + 1);

            var innerPrefix = CodeUtil.getBlank(depth + 2);
            var inner = '';

            for (var i = 0; i < value.length; i++) {
              if (value[i] instanceof Object == false) {
                inner += '\n' + nextPrefix + varName + '.PushBack(' + CodeUtil.getCode4Value(CodeUtil.LANGUAGE_C_PLUS_PLUS, value[i]) + ', allocator);';
              }
              else {
                inner += '\n\n' + nextPrefix + '{   ' + '// ' + key + '[' + i + '] <<<<<<<<<<<<<<<<<<<<<<<<<<<<<';
                if (value[i] instanceof Array) {
                  inner += '\n' + innerPrefix + 'rapidjson::Value ' + itemName + '(rapidjson::kArrayType);';
                }
                else if (value[i] instanceof Object) {
                  inner += '\n' + innerPrefix + 'rapidjson::Value ' + itemName + '(rapidjson::kObjectType);';
                }
                else {
                  inner += '//FIXME 这里不可能出现 value[' + i + '] 类型为 ' + (typeof value[i]) + '！'; //不可能
                }

                inner += CodeUtil.getCode4Value(CodeUtil.LANGUAGE_C_PLUS_PLUS, value[i], itemName, depth + 1, isSmart, true, CodeUtil.parseCppRequest);
                inner += '\n' + innerPrefix + varName + '.PushBack(' + itemName + ', allocator);';
                inner += '\n' + nextPrefix + '}   ' + '// ' + key + '[' + i + '] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';
              }
            }

            s += inner;
          }

          if (isArrayItem != true) {
            if (reqObj instanceof Array) {
              s += '\n\n' + nextPrefix + parentKey + '.PushBack(' + varName + ', allocator);';
            }
            else if (reqObj instanceof Object) {
              s += '\n\n' + nextPrefix + parentKey + '.AddMember("' + key + '", ' + varName + ', allocator);';
            }
            else {
              s += '//FIXME 这里不可能出现 reqObj 类型为 ' + (typeof reqObj) + '！'; //不可能
            }
          }

          s += '\n' + prefix + '}   ' + '// ' + key + ' >>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';
          return s;
        },

        onParseChildOther: function (key, value, index, isOuter) {
          if (value instanceof Array) {
            return this.onParseArray(key, value, index, isOuter);
          }
          return '\n' + prefix + parentKey + '.AddMember("' + key + '", ' + CodeUtil.getCode4Value(CodeUtil.LANGUAGE_C_PLUS_PLUS, value) + ', allocator);';
        }
      })

  },



  /**生成 iOS-Swift 解析 Response JSON 的代码
   * @param name_
   * @param resObj
   * @param depth
   * @param isSmart
   * @return parseCode
   */
  parseSwiftResponse: function(name_, resObj, depth, isSmart) {
    if (depth == null || depth < 0) {
      depth = 0;
    }

    var name = name_; //解决生成多余的解析最外层的初始化代码
    if (StringUtil.isEmpty(name, true)) {
      name = 'response';
    }

    return CodeUtil.parseCode(name, resObj, {

      onParseParentStart: function () {
        return depth > 0 || StringUtil.isEmpty(name_, true) == false ? '' : CodeUtil.getBlank(depth) + 'let ' + name + ': NSDictionary = try! NSJSONSerialization.JSONObjectWithData(resultJson!, options: .MutableContainers) as! NSDictionary \n';
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
          log(CodeUtil.TAG, 'parseSwiftResponse  for typeof value === "array" >>  ' );

          return this.onParseJSONArray(key, value, index);
        }
        if (value instanceof Object) {
          log(CodeUtil.TAG, 'parseSwiftResponse  for typeof value === "array" >>  ' );

          return this.onParseJSONObject(key, value, index);
        }

        var type = CodeUtil.getSwiftTypeFromJS(key, value);
        var padding = '\n' + CodeUtil.getBlank(depth);
        var varName = JSONResponse.getVariableName(key);

        return padding + 'let ' + varName + ': ' + type + ' = ' + name + '["' + key + '"] as! ' + type
          + padding + 'print("' + name + '.' + varName + ' = " + ' + varName + ');';
      },

      onParseJSONArray: function (key, value, index) {
        value = value || []

        var padding = '\n' + CodeUtil.getBlank(depth);
        var innerPadding = padding + CodeUtil.getBlank(1);

        var k = JSONResponse.getVariableName(key);
        var itemName = StringUtil.addSuffix(k, 'Item') + (depth <= 0 ? '' : depth);

        //还有其它字段冲突以及for循环的i冲突，解决不完的，只能让开发者自己抽出函数  var item = StringUtil.addSuffix(k, 'Item');
        var type = CodeUtil.getSwiftTypeFromJS('item', value[0]);

        var s = '\n' + padding + '// ' + key + ' <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        s += padding + 'let ' + k + ': NSArray = ' + name + '["' + key + '"] as! NSArray';

        s += '\n' + padding + '// TODO 把这段代码抽取一个函数，以免for循环嵌套时 i 冲突 或 id等其它字段冲突';


        var indexName = 'i' + (depth <= 0 ? '' : depth);
        if (isSmart) {
          s += padding + 'for (' + indexName + ', ' + itemName + ') in ' + k + ' {';
        }
        else {
          s += padding + 'let ' + itemName + ': ' + type;
          s += padding + 'for var ' + indexName + ' = 0; ' + indexName + ' < ' + k + '.size(); ' + indexName + '++ {';
          s += innerPadding + itemName + ' = ' + k + '[' + indexName + '] as! ' + type;
        }

        s += innerPadding + 'if (' + itemName + ' == nil) {';
        s += innerPadding + '    continue';
        s += innerPadding + '}';
        s += innerPadding + 'print("\\n' + itemName + ' = ' + k + '[" + ' + indexName + ' + "] = \\n" + ' + itemName + ' + "\\n\\n"' + ')';
        s += innerPadding + '// TODO 你的代码\n';

        //不能生成N个，以第0个为准，可能会不全，剩下的由开发者自己补充。 for (var i = 0; i < value.length; i ++) {
        if (value[0] instanceof Object) {
          s += CodeUtil.parseSwiftResponse(itemName, value[0], depth + 1, isSmart);
        }
        // }

        s += padding + '}';

        s += padding + '// ' + key + ' >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
      },

      onParseJSONObject: function (key, value, index) {
        var padding = '\n' + CodeUtil.getBlank(depth);
        var k = JSONResponse.getVariableName(key);

        var s = '\n' + padding + '// ' + key + ' <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        s += padding + 'let ' + k + ': NSDictionary = ' + name + '["' + key + '"] as! NSDictionary\n'

        s += CodeUtil.parseSwiftResponse(k, value, depth, isSmart);

        s += padding + '// ' + key + ' >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
      }
    })

  },


  /**生成 iOS-CodeUtil.LANGUAGE_OBJECTIVE_C 解析 Response JSON 的代码
   * @param name_
   * @param resObj
   * @param depth
   * @return parseCode
   */
  parseObjectiveCResponse: function(name_, resObj, depth) {
    if (depth == null || depth < 0) {
      depth = 0;
    }

    var name = name_; //解决生成多余的解析最外层的初始化代码
    if (StringUtil.isEmpty(name, true)) {
      name = 'response';
    }

    return CodeUtil.parseCode(name, resObj, {

      onParseParentStart: function () {
        return depth > 0 || StringUtil.isEmpty(name_, true) == false ? '' : CodeUtil.getBlank(depth) + 'let ' + name + ': NSDictionary = try! NSJSONSerialization.JSONObjectWithData(resultJson!, options: .MutableContainers) as! NSDictionary \n';
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
          log(CodeUtil.TAG, 'parseSwiftResponse  for typeof value === "array" >>  ' );

          return this.onParseJSONArray(key, value, index);
        }
        if (value instanceof Object) {
          log(CodeUtil.TAG, 'parseSwiftResponse  for typeof value === "array" >>  ' );

          return this.onParseJSONObject(key, value, index);
        }

        var type = CodeUtil.getSwiftTypeFromJS(key, value);
        var padding = '\n' + CodeUtil.getBlank(depth);
        var varName = JSONResponse.getVariableName(key);

        return padding + 'let ' + varName + ': ' + type + ' = ' + name + '["' + key + '"] as! ' + type
          + padding + 'print("' + name + '.' + varName + ' = " + ' + varName + ');';
      },

      onParseJSONArray: function (key, value, index) {
        value = value || []

        var padding = '\n' + CodeUtil.getBlank(depth);
        var innerPadding = padding + CodeUtil.getBlank(1);

        var k = JSONResponse.getVariableName(key);
        var itemName = StringUtil.addSuffix(k, 'Item') + (depth <= 0 ? '' : depth);

        //还有其它字段冲突以及for循环的i冲突，解决不完的，只能让开发者自己抽出函数  var item = StringUtil.addSuffix(k, 'Item');
        var type = CodeUtil.getSwiftTypeFromJS('item', value[0]);

        var s = '\n' + padding + '// ' + key + ' <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        s += padding + 'let ' + k + ': NSArray = ' + name + '["' + key + '"] as! NSArray';

        s += '\n' + padding + '// TODO 把这段代码抽取一个函数，以免for循环嵌套时 i 冲突 或 id等其它字段冲突';

        s += padding + 'let ' + itemName + ': ' + type;

        var indexName = 'i' + (depth <= 0 ? '' : depth);
        s += padding + 'for (int ' + indexName + ' = 0; ' + indexName + ' < ' + k + '.size(); ' + indexName + '++) {';

        s += innerPadding + itemName + ' = ' + k + '[' + indexName + '] as! ' + type;
        s += innerPadding + 'if (' + itemName + ' == nil) {';
        s += innerPadding + '    continue';
        s += innerPadding + '}';
        s += innerPadding + 'print("\\n' + itemName + ' = ' + k + '[" + ' + indexName + ' + "] = \\n" + ' + itemName + ' + "\\n\\n"' + ')';
        s += innerPadding + '// TODO 你的代码\n';

        //不能生成N个，以第0个为准，可能会不全，剩下的由开发者自己补充。 for (var i = 0; i < value.length; i ++) {
        if (value[0] instanceof Object) {
          s += CodeUtil.parseSwiftResponse(itemName, value[0], depth + 1);
        }
        // }

        s += padding + '}';

        s += padding + '// ' + key + ' >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
      },

      onParseJSONObject: function (key, value, index) {
        var padding = '\n' + CodeUtil.getBlank(depth);
        var k = JSONResponse.getVariableName(key);

        var s = '\n' + padding + '// ' + key + ' <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        s += padding + 'let ' + k + ': NSDictionary = ' + name + '["' + key + '"] as! NSDictionary\n'

        s += CodeUtil.parseSwiftResponse(k, value, depth);

        s += padding + '// ' + key + ' >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
      }
    })

  },


  /**生成 Web-JavaScript 解析 Response JSON 的代码
   * @param name_
   * @param resObj
   * @param depth
   * @param isSmart
   * @return parseCode
   */
  parseJavaScriptResponse: function(name_, resObj, depth, isSmart) {
    if (depth == null || depth < 0) {
      depth = 0;
    }

    var name = name_; //解决生成多余的解析最外层的初始化代码
    if (StringUtil.isEmpty(name, true)) {
      name = 'response';
    }

    var varKey = isSmart ? 'let' : 'var'
    var quote = isSmart ? "'" : '"'

    return CodeUtil.parseCode(name, resObj, {

      onParseParentStart: function () {
        return depth > 0 || StringUtil.isEmpty(name_, true) == false ? '' : CodeUtil.getBlank(depth) + varKey + ' ' + name + ' = JSON.parse(resultJson) \n';
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
          log(CodeUtil.TAG, 'parseJavaScriptResponse  for typeof value === "array" >>  ' );

          return this.onParseJSONArray(key, value, index);
        }
        if (value instanceof Object) {
          log(CodeUtil.TAG, 'parseJavaScriptResponse  for typeof value === "array" >>  ' );

          return this.onParseJSONObject(key, value, index);
        }

        var padding = '\n' + CodeUtil.getBlank(depth);
        var varName = JSONResponse.getVariableName(key);

        return padding + varKey + ' ' + varName + ' = ' + name
          + (isSmart && StringUtil.isName(key) ? '.' + key : '[' + quote + key + quote + ']')
          + padding + 'console.log("' + name + '.' + varName + ' = " + ' + varName + ')';
      },

      onParseJSONArray: function (key, value, index) {
        value = value || []

        var padding = '\n' + CodeUtil.getBlank(depth);
        var innerPadding = padding + CodeUtil.getBlank(1);

        var k = JSONResponse.getVariableName(key);
        var itemName = StringUtil.addSuffix(k, 'Item') + (depth <= 0 ? '' : depth);

        //还有其它字段冲突以及for循环的i冲突，解决不完的，只能让开发者自己抽出函数  var item = StringUtil.addSuffix(k, 'Item');

        var s = '\n' + padding + '// ' + key + ' <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        s += padding + varKey + ' ' + k + ' = ' + name + (isSmart && StringUtil.isName(key) ? '.' + key : '[' + quote + key + quote + ']') + ' || []';

        s += '\n' + padding + '// TODO 把这段代码抽取一个函数，以免for循环嵌套时 i 冲突 或 id等其它字段冲突';

        s += padding + varKey + ' ' + itemName;

        var indexName = 'i' + (depth <= 0 ? '' : depth);
        s += padding + 'for (' + varKey + ' ' + indexName + ' = 0; ' + indexName + ' < ' + k + '.length; ' + indexName + '++) {';

        s += innerPadding + itemName + ' = ' + k + '[' + indexName + ']';
        s += innerPadding + 'if (' + itemName + ' == null) {';
        s += innerPadding + '    continue';
        s += innerPadding + '}';
        s += innerPadding + 'console.log("\\n' + itemName + ' = ' + k + '[" + ' + indexName + ' + "] = \\n" + ' + itemName + ' + "\\n\\n"' + ')';
        s += innerPadding + '// TODO 你的代码\n';

        //不能生成N个，以第0个为准，可能会不全，剩下的由开发者自己补充。 for (var i = 0; i < value.length; i ++) {
        if (value[0] instanceof Object) {
          s += CodeUtil.parseJavaScriptResponse(itemName, value[0], depth + 1, isSmart);
        }
        // }

        s += padding + '}';

        s += padding + '// ' + key + ' >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
      },

      onParseJSONObject: function (key, value, index) {
        var padding = '\n' + CodeUtil.getBlank(depth);
        var k = JSONResponse.getVariableName(key);

        var s = '\n' + padding + '// ' + key + ' <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        s += padding + varKey + ' ' + k + ' = ' + name + (isSmart && StringUtil.isName(key) ? '.' + key : '[' + quote + key + quote + ']') + ' || {} \n'

        s += CodeUtil.parseJavaScriptResponse(k, value, depth, isSmart);

        s += padding + '// ' + key + ' >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
      }
    })

  },

  /**生成 Web-PHP 解析 Response JSON 的代码
   * @param name_
   * @param resObj
   * @param depth
   * @param isSmart
   * @return parseCode
   */
  parsePHPResponse: function(name_, resObj, depth, isSmart) {
    if (depth == null || depth < 0) {
      depth = 0;
    }

    var name = name_; //解决生成多余的解析最外层的初始化代码
    if (StringUtil.isEmpty(name, true)) {
      name = 'response';
    }

    var blank = CodeUtil.getBlank(1);
    var quote = isSmart ? "'" : '"';

    return CodeUtil.parseCode(name, resObj, {

      onParseParentStart: function () {
        return depth > 0 || StringUtil.isEmpty(name_, true) == false ? '' : CodeUtil.getBlank(depth) + '$' + name + ' = json_decode($resultJson, true); \n';
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
          log(CodeUtil.TAG, 'parsePHPResponse  for typeof value === "array" >>  ' );

          return this.onParseJSONArray(key, value, index);
        }
        if (value instanceof Object) {
          log(CodeUtil.TAG, 'parsePHPResponse  for typeof value === "array" >>  ' );

          return this.onParseJSONObject(key, value, index);
        }

        var padding = '\n' + CodeUtil.getBlank(depth);
        var varName = JSONResponse.getVariableName(key);

        return padding + '$' + varName + ' = $' + name + '[' + quote + key + quote + '];'
          + padding + 'echo (' + quote + (isSmart ? '' : '\\') + '$' + name + '->' + (isSmart ? '' : '\\') + '$' + varName + ' = ' + quote + ' . $' + varName + ');';
      },

      onParseJSONArray: function (key, value, index) {
        value = value || []

        var padding = '\n' + CodeUtil.getBlank(depth);
        var innerPadding = padding + CodeUtil.getBlank(1);

        var k = JSONResponse.getVariableName(key);
        var itemName = StringUtil.addSuffix(k, 'Item') + (depth <= 0 ? '' : depth);

        //还有其它字段冲突以及for循环的i冲突，解决不完的，只能让开发者自己抽出函数  var item = StringUtil.addSuffix(k, 'Item');

        var s = '\n' + padding + '// ' + key + ' <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        s += padding + '$' + k + ' = $' + name + '[' + quote + key + quote + ']' + ';';
        s += padding + 'if ($' + k + ' === null) {';
        s += padding + blank + '$' + k + ' = ' + (isSmart ? '[];' : 'array();');
        s += padding + '}\n';

        s += '\n' + padding + '// TODO 把这段代码抽取一个函数，以免for循环嵌套时 i 冲突 或 id等其它字段冲突';

        var indexName = 'i' + (depth <= 0 ? '' : depth);
        if (isSmart) {
          s += padding + 'foreach ($' + k + ' as $' + indexName + ' => $' + itemName + ') {';
        }
        else {
          s += padding + 'for (' + '$' + indexName + ' = 0; $' + indexName + ' < count($' + k + '); $' + indexName + '++) {';
          s += innerPadding + '$' + itemName + ' = $' + k + '[$' + indexName + '];';
        }

        s += innerPadding + 'if ($' + itemName + ' === null) {';
        s += innerPadding + '    continue;';
        s += innerPadding + '}';
        s += innerPadding + 'echo (' + quote + '\\n' + (isSmart ? '' : '\\') + '$' + itemName + ' = ' + (isSmart ? '' : '\\') + '$' + k + '[' + quote + ' . ' + '$' + indexName + ' . ' + quote + '] = \\n' + quote + ' . $' + itemName + ' . ' + quote + '\\n\\n' + quote + ');';
        s += innerPadding + '// TODO 你的代码\n';

        //不能生成N个，以第0个为准，可能会不全，剩下的由开发者自己补充。 for (var i = 0; i < value.length; i ++) {
        if (value[0] instanceof Object) {
          s += CodeUtil.parsePHPResponse(itemName, value[0], depth + 1, isSmart);
        }
        // }

        s += padding + '}';

        s += padding + '// ' + key + ' >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
      },

      onParseJSONObject: function (key, value, index) {
        var padding = '\n' + CodeUtil.getBlank(depth);
        var k = JSONResponse.getVariableName(key);

        var s = '\n' + padding + '// ' + key + ' <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        s += padding + '$' + k + ' = $' + name + '[' + quote + key + quote + '];'
        s += padding + 'if ($' + k + ' === null) {';
        s += padding + blank + '$' + k + ' = (object) ' + (isSmart ? '[];' : 'array();');
        s += padding + '}\n';

        s += CodeUtil.parsePHPResponse(k, value, depth, isSmart);

        s += padding + '// ' + key + ' >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
      }
    })

  },

  /**生成 Web-Go 解析 Response JSON 的代码
   * @param name_
   * @param resObj
   * @param depth
   * @param isSmart
   * @return parseCode
   */
  parseGoResponse: function(name_, resObj, depth, isSmart) {
    if (depth == null || depth < 0) {
      depth = 0;
    }

    var name = name_; //解决生成多余的解析最外层的初始化代码
    if (StringUtil.isEmpty(name, true)) {
      name = 'response';
    }

    var quote = '"'

    return CodeUtil.parseCode(name, resObj, {

      onParseParentStart: function () {
        return depth > 0 || StringUtil.isEmpty(name_, true) == false
          ? ''
          : CodeUtil.getBlank(depth) + name + ' := map[string]interface{} {} \n'
          + CodeUtil.getBlank(depth) + 'json.NewDecoder(bytes.NewBuffer(response.Body)).Decode(&' + name + ') \n';
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
          log(CodeUtil.TAG, 'parseGoResponse  for typeof value === "array" >>  ' );

          return this.onParseJSONArray(key, value, index);
        }
        if (value instanceof Object) {
          log(CodeUtil.TAG, 'parseGoResponse  for typeof value === "array" >>  ' );

          return this.onParseJSONObject(key, value, index);
        }

        var type = CodeUtil.getGoTypeFromJS(key, value);
        var padding = '\n' + CodeUtil.getBlank(depth);
        var varName = JSONResponse.getVariableName(key);

        return padding + varName + ' := ' + name + '[' + quote + key + quote + '].(' + type + ')'
          + padding + 'log.Println("' + name + '.' + varName + ' = " + string(' + varName + '))';
      },

      onParseJSONArray: function (key, value, index) {
        value = value || []

        var padding = '\n' + CodeUtil.getBlank(depth);
        var innerPadding = padding + CodeUtil.getBlank(1);

        var k = JSONResponse.getVariableName(key);
        var itemName = StringUtil.addSuffix(k, 'Item') + (depth <= 0 ? '' : depth);

        //还有其它字段冲突以及for循环的i冲突，解决不完的，只能让开发者自己抽出函数  var item = StringUtil.addSuffix(k, 'Item');
        var type = value[0] == null ? 'interface{}' : CodeUtil.getGoTypeFromJS(key, value[0]);

        var s = '\n' + padding + '// ' + key + ' <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        s += padding + k + ' := ' + name + '[' + quote + key + quote + '].([]interface{})'
        s += padding + 'if ' + k + ' == nil {';
        s += padding + '    ' + k + ' = []interface{} {}';
        s += padding + '}\n';

        s += '\n' + padding + '// TODO 把这段代码抽取一个函数，以免for循环嵌套时 i 冲突 或 id等其它字段冲突';

        var indexName = 'i' + (depth <= 0 ? '' : depth);
        s += padding + 'for ' + indexName + ' := range ' + k + ' {'; // let i in arr; let item of arr

        s += innerPadding + itemName + ' := ' + k + '[' + indexName + '].(' + type + ')';
        s += innerPadding + 'if ' + itemName + ' == nil {';
        s += innerPadding + '    continue';
        s += innerPadding + '}';
        s += innerPadding + 'log.Println("\\n' + itemName + ' = ' + k + '[" + string(' + indexName + ') + "] = \\n" + string(' + itemName + ') + "\\n\\n"' + ')';
        s += innerPadding + '// TODO 你的代码\n';

        //不能生成N个，以第0个为准，可能会不全，剩下的由开发者自己补充。 for (var i = 0; i < value.length; i ++) {
        if (value[0] instanceof Object) {
          s += CodeUtil.parseGoResponse(itemName, value[0], depth + 1, isSmart);
        }
        // }

        s += padding + '}';

        s += padding + '// ' + key + ' >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
      },

      onParseJSONObject: function (key, value, index) {
        var padding = '\n' + CodeUtil.getBlank(depth);
        var k = JSONResponse.getVariableName(key);

        var s = '\n' + padding + '// ' + key + ' <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        s += padding + k + ' := ' + name + '[' + quote + key + quote + '].(map[string]interface{})'
        s += padding + 'if ' + k + ' == nil {';
        s += padding + '    ' + k + ' = map[string]interface{} {}';
        s += padding + '}\n';

        s += CodeUtil.parseGoResponse(k, value, depth, isSmart);

        s += padding + '// ' + key + ' >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
      }
    })

  },

  /**生成 Web-C++ 解析 Response JSON 的代码
   * @param name_
   * @param resObj
   * @param depth
   * @param isSmart
   * @return parseCode
   */
  parseCppResponse: function(name_, resObj, depth, isSmart) {
    if (depth == null || depth < 0) {
      depth = 0;
    }

    var name = name_; //解决生成多余的解析最外层的初始化代码
    if (StringUtil.isEmpty(name, true)) {
      name = 'response';
    }

    var tab = CodeUtil.getBlank(1);
    var blockBlank = tab.substring(1);
    var padding = '\n' + CodeUtil.getBlank(depth);
    var nextPadding = padding + tab;
    var nextNextPadding = nextPadding + tab;

    return CodeUtil.parseCode(name, resObj, {

      onParseParentStart: function () {
        return depth > 0 || StringUtil.isEmpty(name_, true) == false
          ? '' : padding + 'rapidjson::Document response;' + padding + 'response.Parse(resultJson);\n';
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
          log(CodeUtil.TAG, 'parseCppResponse  for typeof value === "array" >>  ' );

          return this.onParseJSONArray(key, value, index);
        }
        if (value instanceof Object) {
          log(CodeUtil.TAG, 'parseCppResponse  for typeof value === "array" >>  ' );

          return this.onParseJSONObject(key, value, index);
        }

        var type = CodeUtil.getCppTypeFromJS(key, value);
        var getter = CodeUtil.getCppGetterFromJS(key, value);
        var padding = '\n' + CodeUtil.getBlank(depth);
        var varName = JSONResponse.getVariableName(key);

        return padding + 'rapidjson::Value& ' + varName + 'Value = ' + name + '["' + key + '"];'
          + padding + type + ' ' + varName + ' = ' + varName + 'Value.IsNull() ? NULL : ' + varName + 'Value.' + getter + '();'
          + padding + 'std::cout << "' + name + '.' + varName
          + ' = " << ' + varName + (value instanceof Object ? '.GetString()' : '') + ' << std::endl;';
      },

      onParseJSONArray: function (key, value, index) {
        value = value || []

        var k = JSONResponse.getVariableName(key);
        var itemName = StringUtil.addSuffix(k, 'Item') + (depth <= 0 ? '' : depth);

        //还有其它字段冲突以及for循环的i冲突，解决不完的，只能让开发者自己抽出函数  var item = StringUtil.addSuffix(k, 'Item');

        var s = '\n' + padding + '{' + blockBlank + '// ' + key + ' <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        s += nextPadding + 'rapidjson::Value& ' + k + 'Value = ' + name + '["' + key + '"];';
        s += nextPadding + 'if (' + k + 'Value.IsNull()) {';
        s += nextNextPadding + k + 'Value.SetArray();';
        s += nextPadding + '}';
        s += nextPadding + 'rapidjson::Value::Array ' + k + ' = ' + k + 'Value.GetArray();';

        s += '\n' + nextPadding + '// TODO 把这段代码抽取一个函数，以免for循环嵌套时 i 冲突 或 id等其它字段冲突';

        var indexName = 'i' + (depth <= 0 ? '' : depth);
        if (isSmart) {
          s += nextPadding + 'int ' + indexName + ' = -1;';
          s += nextPadding + 'for (rapidjson::Value& ' + itemName + 'Value : ' + k + ') {';
          s += nextNextPadding + indexName + ' ++;';
        }
        else {
          s += nextPadding + 'for (int ' + indexName + ' = 0; ' + indexName + ' < ' + k + '.Size(); ' + indexName + '++) {';
          s += nextNextPadding + 'rapidjson::Value& ' + itemName + 'Value = ' + k + '[' + indexName + '];';
        }

        s += nextNextPadding + 'if (' + itemName + 'Value.IsNull()) {';
        s += nextNextPadding + tab + 'continue;';
        s += nextNextPadding + '}';

        var itemType = CodeUtil.getCppTypeFromJS(key, value[0], true);
        var itemGetter = CodeUtil.getCppGetterFromJS(key, value[0], true);
        s += nextNextPadding + itemType + ' ' + itemName + ' = ' + itemName + 'Value.' + itemGetter + '();';

        s += nextNextPadding + '// std::cout << "\\n' + itemName + ' = ' + k + '[" << ' + indexName + ' << "] = \\n" << '
          + itemName + (value instanceof Object ? '.GetString()' : '') + ' << "\\n\\n"' + ' << std::endl;';
        s += nextNextPadding + '// TODO 你的代码\n';

        //不能生成N个，以第0个为准，可能会不全，剩下的由开发者自己补充。 for (var i = 0; i < value.length; i ++) {
        if (value[0] instanceof Object) {
          s += CodeUtil.parseCppResponse(itemName, value[0], depth + 2, isSmart);
        }

        s += nextPadding + '}';

        s += padding + '}' + blockBlank + '// ' + key + ' >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
      },

      onParseJSONObject: function (key, value, index) {
        var k = JSONResponse.getVariableName(key);

        var s = '\n' + padding + '{' + blockBlank + '// ' + key + ' <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        s += nextPadding + 'rapidjson::Value& ' + k + 'Value = ' + name + '["' + key + '"];'
        s += nextPadding + 'if (' + k + 'Value.IsNull()) {';
        s += nextNextPadding + k + 'Value.SetObject();';
        s += nextPadding + '}';
        s += nextPadding + 'rapidjson::Value::Object ' + k + ' = ' + k + 'Value.GetObject();\n';

        s += CodeUtil.parseCppResponse(k, value, depth + 1, isSmart);

        s += padding + '}' + blockBlank + '// ' + key + ' >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
      }
    })

  },


  /**生成 Web-Python 解析 Response JSON 的代码
   * @param name_
   * @param resObj
   * @param depth
   * @param isSmart
   * @return parseCode
   */
  parsePythonResponse: function(name_, resObj, depth, isSmart) {
    if (depth == null || depth < 0) {
      depth = 0;
    }

    var name = name_; //解决生成多余的解析最外层的初始化代码
    if (StringUtil.isEmpty(name, true)) {
      name = 'response';
    }

    var quote = "'";

    return CodeUtil.parseCode(name, resObj, {

      onParseParentStart: function () { //解决生成多余的解析最外层的初始化代码
        return depth > 0 || StringUtil.isEmpty(name_, true) == false ? '' : CodeUtil.getBlank(depth) + name + (isSmart ? '' : ': dict') + ' = json.loads(resultJson) \n';
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
          log(CodeUtil.TAG, 'parsePythonResponse  for typeof value === "array" >>  ' );

          return this.onParseJSONArray(key, value, index);
        }
        if (value instanceof Object) {
          log(CodeUtil.TAG, 'parsePythonResponse  for typeof value === "array" >>  ' );

          return this.onParseJSONObject(key, value, index);
        }

        var type = value == null ? 'any' : CodeUtil.getPythonTypeFromJS(key, value);
        var padding = '\n' + CodeUtil.getBlank(depth);
        var varName = JSONResponse.getVariableName(key);

        return padding + varName + (isSmart ? '' : ': ' + type) + ' = ' + name + '[' + quote + key + quote + ']'
          + padding + 'print(\'' + name + '.' + varName + ' = \' + str(' + varName + '))'
          + padding + 'self.assertEqual(' + varName + ', ' + CodeUtil.getCode4Value(CodeUtil.LANGUAGE_PYTHON, value, key) + ')\n';
      },

      onParseJSONArray: function (key, value, index) {
        value = value || []

        var padding = '\n' + CodeUtil.getBlank(depth);
        var innerPadding = padding + CodeUtil.getBlank(1);

        var k = JSONResponse.getVariableName(key, 'array');
        var itemName = StringUtil.addSuffix(k, 'Item') + (depth <= 0 ? '' : depth);

        //还有其它字段冲突以及for循环的i冲突，解决不完的，只能让开发者自己抽出函数  var item = StringUtil.addSuffix(k, 'Item');
        var type = value[0] == null ? 'any' : CodeUtil.getPythonTypeFromJS(key, value[0]);

        var s = '\n' + padding + '# ' + key + ' <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        //不支持 varname: list[int] 这种语法   s += padding + k + (isSmart ? '' : ': list[' + type + ']') + ' = ' + name + '[' + quote + key + quote + ']'
        s += padding + k + (isSmart ? '' : ': list') + ' = ' + name + '[' + quote + key + quote + ']'
        s += padding + '# self.assertIsNotNone(' + k + ')';
        s += padding + 'if ' + k + ' == None:';
        s += padding + '    ' + k + ' = []\n';

        s += '\n' + padding + '#TODO 把这段代码抽取一个函数，以免for循环嵌套时 i 冲突 或 id等其它字段冲突';

        s += padding + itemName + (isSmart ? '' : ': ' + type) + ' = None';

        var indexName = 'i' + (depth <= 0 ? '' : depth);
        s += padding + 'for ' + indexName + ' in range(len(' + k + ')):'; // let i in arr; let item of arr

        s += innerPadding + itemName + ' = ' + k + '[' + indexName + ']';
        s += innerPadding + 'if ' + itemName + ' == None:';
        s += innerPadding + '    continue';
        s += innerPadding + 'print(\'\\n' + itemName + ' = ' + k + '[\' + str(' + indexName + ') + \'] = \\n\' + str(' + itemName + ') + \'\\n\\n\'' + ')';
        s += innerPadding + '#TODO 你的代码\n';

        //不能生成N个，以第0个为准，可能会不全，剩下的由开发者自己补充。 for (var i = 0; i < value.length; i ++) {
        if (value[0] instanceof Object) {
          s += CodeUtil.parsePythonResponse(itemName, value[0], depth + 1, isSmart);
        }
        // }

        s += padding + '# ' + key + ' >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
      },

      onParseJSONObject: function (key, value, index) {
        var padding = '\n' + CodeUtil.getBlank(depth);
        var k = JSONResponse.getVariableName(key);

        var s = '\n' + padding + '# ' + key + ' <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        s += padding + k + (isSmart ? '' : ': dict') + ' = ' + name + '[' + quote + key + quote + ']'
        s += padding + '# self.assertIsNotNone(' + k + ')';
        s += padding + 'if ' + k + ' == None:';
        s += padding + '    ' + k + ' = {}\n';

        s += CodeUtil.parsePythonResponse(k, value, depth, isSmart);

        s += padding + '# ' + key + ' >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
      }
    })

  },

  /**生成 Web-TypeScript 解析 Response JSON 的代码
   * @param name_
   * @param resObj
   * @param depth
   * @param isSmart
   * @return parseCode
   */
  parseTypeScriptResponse: function(name_, resObj, depth, isSmart) {
    if (depth == null || depth < 0) {
      depth = 0;
    }

    var name = name_; //解决生成多余的解析最外层的初始化代码
    if (StringUtil.isEmpty(name, true)) {
      name = 'response';
    }

    var varKey = isSmart ? 'let' : 'var'
    var quote = isSmart ? "'" : '"'

    return CodeUtil.parseCode(name, resObj, {

      onParseParentStart: function () {
        return depth > 0 || StringUtil.isEmpty(name_, true) == false ? '' : CodeUtil.getBlank(depth) + varKey + ' ' + name + ': object = JSON.parse(resultJson); \n';
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
          log(CodeUtil.TAG, 'parseTypeScriptResponse  for typeof value === "array" >>  ' );

          return this.onParseJSONArray(key, value, index);
        }
        if (value instanceof Object) {
          log(CodeUtil.TAG, 'parseTypeScriptResponse  for typeof value === "array" >>  ' );

          return this.onParseJSONObject(key, value, index);
        }

        var type = value == null ? 'any' : (typeof value);
        var padding = '\n' + CodeUtil.getBlank(depth);
        var varName = JSONResponse.getVariableName(key);

        return padding + varKey + ' ' + varName + ': ' + type + ' = ' + name + '[' + quote + key + quote + '];'
          + padding + 'console.log("' + name + '.' + varName + ' = " + ' + varName + ');';
      },

      onParseJSONArray: function (key, value, index) {
        value = value || []

        var padding = '\n' + CodeUtil.getBlank(depth);
        var innerPadding = padding + CodeUtil.getBlank(1);

        var k = JSONResponse.getVariableName(key);
        var itemName = StringUtil.addSuffix(k, 'Item') + (depth <= 0 ? '' : depth);

        //还有其它字段冲突以及for循环的i冲突，解决不完的，只能让开发者自己抽出函数  var item = StringUtil.addSuffix(k, 'Item');
        var type = value[0] == null ? 'any' : (typeof (value[0]));

        var s = '\n' + padding + '// ' + key + ' <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        s += padding + varKey + ' ' + k + ': ' + type + '[] = ' + name + '[' + quote + key + quote + ']' + ' || []; \n'

        s += '\n' + padding + '// TODO 把这段代码抽取一个函数，以免for循环嵌套时 i 冲突 或 id等其它字段冲突';

        s += padding + varKey + ' ' + itemName + ': ' + type + ';';

        var indexName = 'i' + (depth <= 0 ? '' : depth);
        s += padding + 'for (' + varKey + ' ' + indexName + ' in ' + k + ') {'; // let i in arr; let item of arr

        s += innerPadding + itemName + ' = ' + k + '[' + indexName + '];';
        s += innerPadding + 'if (' + itemName + ' == null) {';
        s += innerPadding + '    continue;';
        s += innerPadding + '}';
        s += innerPadding + 'console.log("\\n' + itemName + ' = ' + k + '[" + ' + indexName + ' + "] = \\n" + ' + itemName + ' + "\\n\\n"' + ');';
        s += innerPadding + '// TODO 你的代码\n';

        //不能生成N个，以第0个为准，可能会不全，剩下的由开发者自己补充。 for (var i = 0; i < value.length; i ++) {
        if (value[0] instanceof Object) {
          s += CodeUtil.parseTypeScriptResponse(itemName, value[0], depth + 1, isSmart);
        }
        // }

        s += padding + '}';

        s += padding + '// ' + key + ' >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
      },

      onParseJSONObject: function (key, value, index) {
        var padding = '\n' + CodeUtil.getBlank(depth);
        var k = JSONResponse.getVariableName(key);

        var s = '\n' + padding + '// ' + key + ' <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        s += padding + varKey + ' ' + k + ': object = ' + name + '[' + quote + key + quote + ']' + ' || {}; \n'

        s += CodeUtil.parseTypeScriptResponse(k, value, depth, isSmart);

        s += padding + '// ' + key + ' >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
      }
    })

  },

  /**生成 Android-Kotlin 解析 Response JSON 的代码
   * 不能像 Java 那样执行 {} 代码段里的代码，所以不能用 Java 那种代码段隔离的方式
   * @param name_
   * @param resObj
   * @param depth
   * @return parseCode
   */
  parseKotlinResponse: function(name_, resObj, depth, isTable, isSmart) {
    if (depth == null || depth < 0) {
      depth = 0;
    }

    var name = name_; //解决生成多余的解析最外层的初始化代码
    if (StringUtil.isEmpty(name, true)) {
      name = 'response';
    }

    var tab = CodeUtil.getBlank(1);
    var blockBlank = tab.substring(1);
    var padding = '\n' + CodeUtil.getBlank(depth);
    var nextPadding = padding + tab;
    var nextNextPadding = nextPadding + tab;

    return CodeUtil.parseCode(name, resObj, {

      onParseParentStart: function () {
        // if (isSmart) { //导致里面的 [] 等字符全都转成 List 等，里面每用一个 key 取值都得 formatArrayKey 或所有对象类型用 JSONReseponse 等，不通用
        //  return depth > 0 ? '' : CodeUtil.getBlank(depth) + 'JSONResponse ' + name + ' = new JSONResponse(resultJson);\n';
        // }
        return depth > 0 || StringUtil.isEmpty(name_, true) == false ? '' : CodeUtil.getBlank(depth) + 'var ' + name + ': JSONObject = JSON.parseObject(resultJson)\n';
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
          log(CodeUtil.TAG, 'parseKotlinResponse  for typeof value === "array" >>  ');

          return this.onParseJSONArray(key, value, index);
        }
        if (value instanceof Object) {
          log(CodeUtil.TAG, 'parseKotlinResponse  for typeof value === "array" >>  ');

          return this.onParseJSONObject(key, value, index);
        }

        var type = CodeUtil.getJavaTypeFromJS(key, value, false, true);
        if (type == 'Object') {
          type = 'Any';
        }
        var varName = JSONResponse.getVariableName(key);

        if (isSmart && isTable) { // JSONObject.isTableKey(name)) {
          return padding + 'var ' + varName + ' = ' + name + '?.get' + StringUtil.firstCase(varName, true) + '()'
            + padding + 'println("' + name + '.' + varName + ' = " + ' + varName + ')';
        } else {
          return padding + 'var ' + varName + ' = ' + name + '?.get'
            + (/[A-Z]/.test(type.substring(0, 1)) ? type : StringUtil.firstCase(type + 'Value', true)) + '("' + key + '")'
            + padding + 'println("' + name + '.' + varName + ' = " + ' + varName + ');';
        }
      },

      onParseJSONArray: function (key, value, index) {
        value = value || []

        var vn = JSONResponse.getVariableName(key);
        var k = vn + (depth <= 0 ? '' : depth);
        var itemName = StringUtil.addSuffix(k, 'Item') + (depth <= 0 ? '' : depth);
        //还有其它字段冲突以及for循环的i冲突，解决不完的，只能让开发者自己抽出函数  var item = StringUtil.addSuffix(k, 'Item');

        var type = CodeUtil.getJavaTypeFromJS(itemName, value[0], true, false);
        if (type == 'Object') {
          type = 'Any';
        }

        var s = '\n' + padding + 'run {' + blockBlank + '// ' + key + ' <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        var t = JSONResponse.getTableName(key);
        if (t.endsWith('[]')) {
          t = t.substring(0, t.length - 2);
        }

        var isTableKey = JSONObject.isTableKey(t);
        if (isTable && isSmart) {
          s += nextPadding + 'var ' + k + ': List<' + (isTableKey ? t : type) + '?>? = ' + name + '?.get' + StringUtil.firstCase(vn, true) + '()'
        }
        else if (isTableKey && isSmart) {
          s += nextPadding + 'var ' + k + ': List<' + t + '?>? = JSON.parseArray(' + name + '?.getString("' + key + '"), ' + t + '::class.java)';
        }
        else {
          s += nextPadding + 'var ' + k + ': JSONArray? = ' + name + '?.getJSONArray("' + key + '")';
        }

        s += nextPadding + 'if (' + k + ' == null) {';
        s += nextNextPadding + k + ' = ' + ((isTable || isTableKey) && isSmart ? 'ArrayList' : 'JSONArray') + '();';
        s += nextPadding + '}\n';

        s += nextPadding + 'var ' + itemName + ': ' + (isTableKey && isSmart ? t : (type == 'Integer' ? 'Int' : type)) + '?';

        var indexName = 'i' + (depth <= 0 ? '' : depth);
        s += nextPadding + 'for (' + indexName + ' in 0..' + k + '.size - 1) {';

        s += nextNextPadding + itemName + ' = ' + k + '?.get' + (((isTable || isTableKey) && isSmart) || type == 'Any' ? '' : type) + '(' + indexName + ')';
        s += nextNextPadding + 'if (' + itemName + ' == null) {';
        s += nextNextPadding + tab + 'continue';
        s += nextNextPadding + '}';
        s += nextNextPadding + 'println("\\n' + itemName + ' = ' + k + '[" + ' + indexName + ' + "] = \\n" + ' + itemName + ' + "\\n\\n"' + ')';
        s += nextNextPadding + '// TODO 你的代码\n';

        //不能生成N个，以第0个为准，可能会不全，剩下的由开发者自己补充。 for (var i = 0; i < value.length; i ++) {
        if (value[0] instanceof Object) {
          s += CodeUtil.parseKotlinResponse(itemName, value[0], depth + 2, isTableKey, isSmart);
        }
        // }

        s += nextPadding + '}';

        s += padding + '}' + blockBlank + '// ' + key + ' >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
      },

      onParseJSONObject: function (key, value, index) {
        var k = JSONResponse.getVariableName(key);

        var s = '\n' + padding + 'run {' + blockBlank + '// ' + key + ' <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        var t = JSONResponse.getTableName(key);
        var isTableKey = JSONObject.isTableKey(t);
        if (isTable && isSmart) {
          s += nextPadding + 'var ' + k + ':' + (isTableKey ? t : 'JSONObject') + '? = ' + name + '?.get' + StringUtil.firstCase(k, true) + '()'
        }
        else if (isTableKey && isSmart) {
          s += nextPadding + 'var ' + k + ':' + t + '? = ' + name + '?.getObject("' + key + '", ' + t + '::class.java)';
        }
        else {
          s += nextPadding + 'var ' + k + ': JSONObject? = ' + name + '?.getJSONObject("' + key + '")'
        }

        s += nextPadding + 'if (' + k + ' == null) {';
        s += nextNextPadding + k + ' = ' + (isTableKey && isSmart ? t : 'JSONObject') + '()';
        s += nextPadding + '}\n';

        s += CodeUtil.parseKotlinResponse(k, value, depth + 1, isTableKey, isSmart);

        s += padding + '}' + blockBlank + '// ' + key + ' >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
      }
    }) + (depth > 0 || ! isSmart ? '' : '\n\n\n' + CodeUtil.parseKotlinClasses('Response', resObj, 0, false, true))

  },


  /**生成 Android-Java 解析 Response JSON 的代码
   * @param name_
   * @param resObj
   * @param depth
   * @param isTable
   * @param isSmart
   * @return parseCode
   */
  parseJavaResponse: function(name_, resObj, depth, isTable, isSmart, onlyParseSimpleValue) {
    if (depth == null || depth < 0) {
      depth = 0;
    }

    var name = name_; //解决生成多余的解析最外层的初始化代码
    if (StringUtil.isEmpty(name, true)) {
      name = 'response';
    }

    var tab = CodeUtil.getBlank(1);
    var blockBlank = tab.substring(1);
    var padding = '\n' + CodeUtil.getBlank(depth);
    var nextPadding = padding + tab;
    var nextNextPadding = nextPadding + tab;

    return CodeUtil.parseCode(name, resObj, {

      onParseParentStart: function () {
        // if (isSmart) { //导致里面的 [] 等字符全都转成 List 等，里面每用一个 key 取值都得 formatArrayKey 或所有对象类型用 JSONReseponse 等，不通用
        //  return depth > 0 ? '' : CodeUtil.getBlank(depth) + 'JSONResponse ' + name + ' = new JSONResponse(resultJson);\n';
        // }
        return depth > 0 || StringUtil.isEmpty(name_, true) == false ? '' : padding + 'JSONObject ' + name + ' = JSON.parseObject(resultJson);\n';
      },

      onParseParentEnd: function () {
        return '';
      },

      onParseChildArray: function (key, value, index) {
        if (onlyParseSimpleValue) {
          return this.onParseChildOther(key, value, index);
        }
        return this.onParseChildObject(key, value, index);
      },

      onParseChildObject: function (key, value, index) {
        if (onlyParseSimpleValue) {
          return this.onParseChildOther(key, value, index);
        }
        return this.onParseJSONObject(key, value, index);
      },

      onParseChildOther: function (key, value, index) {

        if (onlyParseSimpleValue != true) {
          if (value instanceof Array) {
            log(CodeUtil.TAG, 'parseJavaResponse  for typeof value === "array" >>  ' );

            return this.onParseJSONArray(key, value, index);
          }
          if (value instanceof Object) {
            log(CodeUtil.TAG, 'parseJavaResponse  for typeof value === "array" >>  ' );

            return this.onParseJSONObject(key, value, index);
          }
        }

        var type = CodeUtil.getJavaTypeFromJS(key, value, false, ! onlyParseSimpleValue);
        var varName = JSONResponse.getVariableName(key);

        if (isSmart && isTable) { // JSONObject.isTableKey(name)) {
          return padding + type + ' ' + varName + ' = ' + name + '.get' + StringUtil.firstCase(varName, true) + '();'
            + padding + 'System.out.println("' + name + '.' + varName + ' = " + ' + varName + ');';
        } else {
          return padding + type + ' ' + varName + ' = ' + name + '.get'
            + (/[A-Z]/.test(type.substring(0, 1)) ? type : StringUtil.firstCase(type + 'Value', true)) + '("' + key + '");'
            + padding + 'System.out.println("' + name + '.' + varName + ' = " + ' + varName + ');';
        }
      },

      onParseJSONArray: function (key, value, index) {
        if (onlyParseSimpleValue) {
          return this.onParseChildOther(key, value, index);
        }

        value = value || []

        var vn = JSONResponse.getVariableName(key);
        var k = vn + (depth <= 0 ? '' : depth);
        var itemName = StringUtil.addSuffix(k, 'Item') + (depth <= 0 ? '' : depth);
        //还有其它字段冲突以及for循环的i冲突，解决不完的，只能让开发者自己抽出函数  var item = StringUtil.addSuffix(k, 'Item');

        var s = '\n' + padding + '{' + blockBlank + '// ' + key + ' <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        var t = JSONResponse.getTableName(key);
        if (t.endsWith('[]')) {
          t = t.substring(0, t.length - 2);
        }

        var isTableKey = JSONObject.isTableKey(t);

        var itemType = CodeUtil.getJavaTypeFromJS(itemName, value[0], false);
        if (isTable && isSmart) {
          s += nextPadding + 'List<' + (isTableKey ? t : itemType) + '> ' + k + ' = ' + name + '.get' + StringUtil.firstCase(vn, true) + '();'
        }
        else if (isTableKey && isSmart) {
          s += nextPadding + 'List<' + t + '> ' + k + ' = JSON.parseArray(' + name + '.getString("' + key + '"), ' + t + '.class);';
        }
        else {
          s += nextPadding + 'JSONArray ' + k + ' = ' + name + '.getJSONArray("' + key + '");';
        }
        s += nextPadding + 'if (' + k + ' == null) {';
        s += nextNextPadding + k + ' = new ' + ((isTable || isTableKey) && isSmart ? 'ArrayList<>' : 'JSONArray') + '();';
        s += nextPadding + '}\n';

        var indexName = 'i' + (depth <= 0 ? '' : depth);
        s += nextPadding + 'for (int ' + indexName + ' = 0; ' + indexName + ' < ' + k + '.size(); ' + indexName + ' ++) {';

        s += nextNextPadding + (isTableKey && isSmart ? t : itemType) + ' ' + itemName
          + ' = ' + k + '.get' + (((isTable || isTableKey) && isSmart) || itemType == 'Object' ? '' : itemType) + '(' + indexName + ');';
        s += nextNextPadding + 'if (' + itemName + ' == null) {';
        s += nextNextPadding + tab + 'continue;';
        s += nextNextPadding + '}';
        s += nextNextPadding + 'System.out.println("\\n' + itemName + ' = ' + k + '[" + ' + indexName + ' + "] = \\n" + ' + itemName + ' + "\\n\\n"' + ');';
        s += nextNextPadding + '// TODO 你的代码\n';

        //不能生成N个，以第0个为准，可能会不全，剩下的由开发者自己补充。 for (var i = 0; i < value.length; i ++) {
        if (value[0] instanceof Object) {
          s += CodeUtil.parseJavaResponse(itemName, value[0], depth + 2, isTableKey, isSmart);
        }
        // }

        s += nextPadding + '}';

        s += padding + '}' + blockBlank + '// ' + key + ' >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
      },

      onParseJSONObject: function (key, value, index) {
        if (onlyParseSimpleValue) {
          return this.onParseChildOther(key, value, index);
        }

        var k = JSONResponse.getVariableName(key);

        var s = '\n' + padding + '{' + blockBlank + '// ' + key + ' <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        var t = JSONResponse.getTableName(key);
        var isTableKey = JSONObject.isTableKey(t);
        if (isTable && isSmart) {
          s += nextPadding + (isTableKey ? t : 'JSONObject') + ' ' + k + ' = ' + name + '.get' + StringUtil.firstCase(k, true) + '();'
        }
        else if (isTableKey && isSmart) {
          s += nextPadding + t + ' ' + k + ' = ' + name + '.getObject("' + key + '", ' + t + '.class);'
        }
        else {
          s += nextPadding + 'JSONObject ' + k + ' = ' + name + '.getJSONObject("' + key + '");'
        }
        s += nextPadding + 'if (' + k + ' == null) {';
        s += nextNextPadding + k + ' = new ' + (isTableKey && isSmart ? t : 'JSONObject') + '();';
        s += nextPadding + '}\n';

        s += CodeUtil.parseJavaResponse(k, value, depth + 1, isTableKey, isSmart);

        s += padding + '}' + blockBlank + '// ' + key + ' >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
      }
    }) + (depth > 0 || ! isSmart ? '' : '\n\n\n' + CodeUtil.parseKotlinClasses('Response', resObj, 0, false, ! isSmart))

  },


  /**生成 Unity3D-C# 解析 Response JSON 的代码
   * @param name_
   * @param resObj
   * @param depth
   * @return parseCode
   */
  parseCSharpResponse: function(name_, resObj, depth) {
    if (depth == null || depth < 0) {
      depth = 0;
    }

    var name = name_; //解决生成多余的解析最外层的初始化代码
    if (StringUtil.isEmpty(name, true)) {
      name = 'response';
    }
    var blank = CodeUtil.getBlank(1);

    return CodeUtil.parseCode(name, resObj, {

      onParseParentStart: function () {
        return depth > 0 || StringUtil.isEmpty(name_, true) == false ? '' : CodeUtil.getBlank(depth) + 'JObject ' + name + ' = JObject.Parse(resultJson);\n';
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
          log(CodeUtil.TAG, 'parseCSharpResponse  for typeof value === "array" >>  ' );

          return this.onParseJSONArray(key, value, index);
        }
        if (value instanceof Object) {
          log(CodeUtil.TAG, 'parseCSharpResponse  for typeof value === "array" >>  ' );

          return this.onParseJSONObject(key, value, index);
        }

        var type = CodeUtil.getCSharpTypeFromJS(key, value);
        var padding = '\n' + CodeUtil.getBlank(depth);
        var varName = JSONResponse.getVariableName(key);

        return padding + type + ' ' + varName + ' = ' + name + '["' + key + '"]'
          + '.ToObject<' + type + '>()' + ';'
          + padding + 'Console.WriteLine("' + name + '.' + varName + ' = " + ' + varName + ');';
      },

      onParseJSONArray: function (key, value, index) {
        value = value || []

        var padding = '\n' + CodeUtil.getBlank(depth);
        var innerPadding = '\n' + CodeUtil.getBlank(depth + 1);
        var innerPadding2 = '\n' + CodeUtil.getBlank(depth + 2);

        var k = JSONResponse.getVariableName(key) + (depth <= 0 ? '' : depth);
        var itemName = StringUtil.addSuffix(k, 'Item') + (depth <= 0 ? '' : depth);

        //还有其它字段冲突以及for循环的i冲突，解决不完的，只能让开发者自己抽出函数  var item = StringUtil.addSuffix(k, 'Item');
        var type = CodeUtil.getCSharpTypeFromJS('item', value[0]);

        var s = '\n' + padding + '{   // ' + key + ' <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        s += innerPadding + 'JArray ' + k + ' = ' + name + '["' + key + '"].ToObject<JArray>();';
        s += innerPadding + 'if (' + k + ' == null) {';
        s += innerPadding + blank + k + ' = new JArray();';
        s += innerPadding + '}\n';

        s += '\n' + innerPadding + '// TODO 把这段代码抽取一个函数，以免for循环嵌套时 i 冲突 或 id等其它字段冲突';

        s += innerPadding + 'foreach (' + type + ' ' + itemName + ' in ' + k + ') {';

        s += innerPadding2 + 'if (' + itemName + ' == null) {';
        s += innerPadding2 + blank + 'continue;';
        s += innerPadding2 + '}';
        s += innerPadding2 + 'Console.WriteLine("\\n' + itemName + ' in ' + k + ' = \\n" + ' + itemName + ' + "\\n\\n"' + ');';
        s += innerPadding2 + '// TODO 你的代码\n';

        //不能生成N个，以第0个为准，可能会不全，剩下的由开发者自己补充。 for (var i = 0; i < value.length; i ++) {
        if (value[0] instanceof Object) {
          s += CodeUtil.parseCSharpResponse(itemName, value[0], depth + 2);
        }
        // }

        s += innerPadding + '}';

        s += padding + '}   //' + key + ' >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
      },

      onParseJSONObject: function (key, value, index) {
        var padding = '\n' + CodeUtil.getBlank(depth);
        var innerPadding = '\n' + CodeUtil.getBlank(depth + 1);
        var k = JSONResponse.getVariableName(key);

        var s = '\n' + padding + '{   // ' + key + ' <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';

        s += innerPadding + 'JObject ' + k + ' = ' + name + '["' + key + '"].ToObject<JObject>();'
        s += innerPadding + 'if (' + k + ' == null) {';
        s += innerPadding + blank + k + ' = new JObject();';
        s += innerPadding + '}\n';

        s += CodeUtil.parseCSharpResponse(k, value, depth + 1);

        s += padding + '}   //' + key + ' >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
      }
    })

  },



  initEmptyValue4Type: function(type, isSmart, isKotlin) {
    if (isSmart) {
      type = type || ''
      switch (type) {
        case 'Boolean':
          return ' = false';
        case 'Number':
        case 'Integer':
        case 'Int':
          return ' = 0';
        case 'Long':
          return isKotlin ? ' = 0' : ' = 0L';
        case 'Float':
          return ' = 0f';
        case 'Double':
          return isKotlin ? ' = 0.0' : ' = 0d';
        case 'String':
          return ' = ""';
        case 'Array':
        case 'List':
          return isKotlin ? ' = mutableListOf()' : ' = new ArrayList<>()';
        case 'Map':
          return isKotlin ? ' = mutableMapOf()' : ' = new LinkedHashMap<>()';
        case 'Object':
        case 'Any':
          return '? = null';
        default:
          return ' = ' + type + '()';
      }
    }

    return '? = null' + (isSmart ? '' : '  //' + CodeUtil.initEmptyValue4Type(type, true, isKotlin));
  },

  getCode4JavaArgValues: function (reqObj, useVar4ComplexValue) {
    var str = '';
    if (reqObj != null) {
      var first = true;

      for (var k in reqObj) {
        var v = reqObj[k];

        if (useVar4ComplexValue && v instanceof Object) {
          str += (first ? '' : ', ') + JSONResponse.getVariableName(k);
        }
        else {
          str += (first ? '' : ', ') + CodeUtil.getCode4Value(CodeUtil.LANGUAGE_JAVA, v, k, 0);
        }
        first = false;
      }
    }

    return str;
  },

  getCode4KotlinArgValues: function (reqObj, useVar4ComplexValue) {
    var str = '';
    if (reqObj != null) {
      var first = true;

      for (var k in reqObj) {
        var v = reqObj[k];

        if (useVar4ComplexValue && v instanceof Object) {
          str += (first ? '' : ', ') + JSONResponse.getVariableName(k);
        }
        else {
          str += (first ? '' : ', ') + CodeUtil.getCode4Value(CodeUtil.LANGUAGE_KOTLIN, v, k, 0);
        }
        first = false;
      }
    }

    return str;
  },
  /**获取参数代码
   * @param reqObj 对象
   * @param withType 带上类型
   * @param annotionType null, Server: RequestParam, Param; Android: Query, Field, Part, Query-QueryMap, Query-QueryMap(encode=true), Part-PartMap
   * @param rawType true-使用 JDK 有的原始类型，其它-使用 JSONObject, JSONRequest 等第三方库封装类型
   * @param complex2String 将复杂类型转为 String，值转为 toJSONString
   */
  getCode4JavaArgs: function(reqObj, withType, annotationType, rawType, complex2String) {
    var str = '';
    if (reqObj != null) {
      var first = true;

      for (var k in reqObj) {
        var v = reqObj[k];
        var t = withType ? CodeUtil.getJavaTypeFromJS(k, v, false, false, rawType) : null;

        var at = annotationType;
        if (annotationType != null) { //简单数据注解类型-复杂数据注解类型
          var index = annotationType.indexOf('-');
          if (index >= 0) {
            at = v instanceof Object ? annotationType.substring(index + 1, annotationType.length) : annotationType.substring(0, index);
          }
        }

        var vk = JSONResponse.getVariableName(k);

        if (complex2String && v instanceof Object) {
          if (withType) {
            t = 'String';
          }
          else {
            vk = 'JSON.toJSONString(' + vk + ')';
          }
        }

        str += (first ? '' : ', ') + (at == null ? '' : '@' + at + '("' + k + '") ' ) + (t == null ? '' : t + ' ') + vk;
        first = false;
      }
    }

    return str;
  },
  /**获取参数代码
   * @param reqObj 对象
   * @param withType 带上类型
   * @param annotionType null, Server: RequestParam, Param; Android: Query, Field, Part, Query-QueryMap, Query-QueryMap(encode=true), Part-PartMap
   * @param rawType true-使用 JDK 有的原始类型，其它-使用 JSONObject, JSONRequest 等第三方库封装类型
   * @param complex2String 将复杂类型转为 String，值转为 toJSONString
   */
  getCode4KotlinArgs: function(reqObj, withType, annotationType, rawType, isSmart, complex2String) {
    var str = '';
    if (reqObj != null) {
      var first = true;

      for (var k in reqObj) {
        var v = reqObj[k];
        var t = withType ? CodeUtil.getKotlinTypeFromJS(k, v, false, false, rawType, isSmart) : null;

        var at = annotationType;
        if (annotationType != null) { //简单数据注解类型-复杂数据注解类型
          var index = annotationType.indexOf('-');
          if (index >= 0) {
            at = v instanceof Object ? annotationType.substring(index + 1, annotationType.length) : annotationType.substring(0, index);
          }
        }

        var vk = JSONResponse.getVariableName(k);

        if (complex2String && v instanceof Object) {
          if (withType) {
            t = 'String';
          }
          else {
            vk = 'JSON.toJSONString(' + vk + ')';
          }
        }

        str += (first ? '' : ', ') + (at == null ? '' : '@' + at + '("' + k + '") ' ) + vk + (t == null ? '' : ': ' + t + '?');
        first = false;
      }
    }

    return str;
  },


  /**TODO 用带注释的 JSON 来解析，能把注释也带上
   * 生成 Android-Kotlin 解析 Response JSON 的为 class 和 field 的静态代码
   * 不能像 Java 那样执行 {} 代码段里的代码，所以不能用 Java 那种代码段隔离的方式
   * @param name_
   * @param resObj
   * @param depth
   * @return parseCode
   */
  parseKotlinClasses: function(name, resObj, depth, isTable, isSmart) {
    if (depth == null || depth < 0) {
      depth = 0;
    }


    var tab = CodeUtil.getBlank(1);
    var padding = CodeUtil.getBlank(depth);
    var nextPadding = padding + tab;

    return CodeUtil.parseCode(name, resObj, {

      onParseParentStart: function () {
        if (StringUtil.isEmpty(name, true)) {
          return ''
        }

        var s = '\n';
        // if (depth <= 0) {
        //     s += padding + 'package apijson.demo.model\n';
        // }

        var c = CodeUtil.getCommentFromDoc(CodeUtil.tableList, name, null, 'GET', CodeUtil.database, CodeUtil.language, true);
        if (StringUtil.isEmpty(c, true) == false) {
          s += '\n' + CodeUtil.getComment(c, true, padding);
        }

        s += '\n' + padding + '@Keep'
          + '\n' + padding + 'open class ' + name + ' {';

        return s;
      },

      onParseParentEnd: function () {
        return '\n\n' + padding + '}';
      },

      onParseChildArray: function (key, value, index) {
        return this.onParseChildObject(key, value, index);
      },

      onParseChildObject: function (key, value, index) {
        return this.onParseJSONObject(key, value, index);
      },

      onParseChildOther: function (key, value, index) {

        if (value instanceof Array) {
          log(CodeUtil.TAG, 'parseKotlinResponse  for typeof value === "array" >>  ');

          return this.onParseJSONArray(key, value, index);
        }
        if (value instanceof Object) {
          log(CodeUtil.TAG, 'parseKotlinResponse  for typeof value === "array" >>  ');

          return this.onParseJSONObject(key, value, index);
        }

        var type = CodeUtil.getKotlinTypeFromJS(key, value, false, false);
        var varName = JSONResponse.getVariableName(key);

        var s = '\n\n' + nextPadding + '@SerializedName("' + key + '")'
          + '\n' + nextPadding + 'open var ' + varName + ': ' + type + CodeUtil.initEmptyValue4Type(type, isSmart, true)
          + CodeUtil.getComment(CodeUtil.getCommentFromDoc(CodeUtil.tableList, name, key, 'GET', CodeUtil.database, CodeUtil.language, true), false, '  ');
        return s;
      },

      onParseJSONArray: function (key, value, index) {
        value = value || []

        var vn = JSONResponse.getVariableName(key);
        var k = vn + (depth <= 0 ? '' : depth);
        var itemName = StringUtil.firstCase(k, true) + 'Item' + (depth <= 0 ? '' : depth);
        //还有其它字段冲突以及for循环的i冲突，解决不完的，只能让开发者自己抽出函数  var item = StringUtil.addSuffix(k, 'Item');

        var s = '\n\n' + nextPadding + '// ' + key + ' <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';
        s += '\n\n' + nextPadding + '@SerializedName("' + key + '")';

        var t = JSONResponse.getTableName(key);
        var isAPIJSONArray = false
        if (t.endsWith('[]')) {
          t = t.substring(0, t.length - 2);
          isAPIJSONArray = true
        }
        var isTableKey = JSONObject.isTableKey(t);

        var type = value[0] instanceof Object ? (isAPIJSONArray && t.length > 1 ? StringUtil.firstCase(t, true) : itemName) : CodeUtil.getKotlinTypeFromJS(itemName, value[0], false, false);

        s += '\n' + nextPadding + 'open var ' + k + ': List<' + type + '?>' + CodeUtil.initEmptyValue4Type('List', isSmart, true)
          + CodeUtil.getComment(CodeUtil.getCommentFromDoc(CodeUtil.tableList, name, key, 'GET', CodeUtil.database, CodeUtil.language, true), false, '  ');

        if (value[0] instanceof Object) {
          s += CodeUtil.parseKotlinClasses(type, value[0], depth + 1, isTableKey, isSmart);
        }

        s += '\n\n' + nextPadding + '// ' + key + ' >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
      },

      onParseJSONObject: function (key, value, index) {
        var k = JSONResponse.getVariableName(key);
        var s = '\n\n' + nextPadding + '// ' + key + ' <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<';
        var t = JSONResponse.getTableName(key);
        var isAPIJSONArray = false;
        if (t.endsWith('[]')) {
          t = t.substring(0, t.length - 2);
          isAPIJSONArray = true;
        }
        var isTableKey = JSONObject.isTableKey(t);

        var type = (StringUtil.firstCase(t, true) || (isAPIJSONArray ? 'Item' : 'Any'))
        s += '\n\n' + nextPadding + '@SerializedName("' + key + '")'
          + '\n' + nextPadding + 'open var ' + k + ': ' + type + CodeUtil.initEmptyValue4Type(type, isSmart, true)
          + CodeUtil.getComment(CodeUtil.getCommentFromDoc(CodeUtil.tableList, name, key, 'GET', CodeUtil.database, CodeUtil.language, true), false, '  ');

        // if (['Boolean', 'Number', 'Integer', 'Long', 'String', 'List', 'Map', 'Any'].indexOf(type) < 0) {
        if (['Boolean', 'Number', 'Integer', 'Int', 'Long', 'String'].indexOf(type) < 0) {
          s += CodeUtil.parseKotlinClasses(StringUtil.firstCase(type, true), value, depth + 1, isTableKey, isSmart);
        }

        s += '\n\n' + nextPadding + '// ' + key + ' >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n';

        return s;
      }
    })

  },




  /**生成 Server-Java API 相关代码
   * @param type
   * @param url
   * @param reqObj
   * @param isSmart
   * @return
   */
  parseJavaServer: function(type, url, database, schema, reqObj, isSmart) {
    var requestMethod = StringUtil.isEmpty(type, true) || type == 'PARAM' ? 'GET' : 'POST';

    url = url || '';

    var lastIndex = url.lastIndexOf('/');
    var methodUri = lastIndex < 0 ? url : url.substring(lastIndex);
    var methodName = JSONResponse.getVariableName(lastIndex < 0 ? url : url.substring(lastIndex + 1));

    url = url.substring(0, lastIndex);
    lastIndex = url.lastIndexOf('/');
    var varName = JSONResponse.getVariableName(lastIndex < 0 ? url : url.substring(lastIndex + 1));
    var modelName = StringUtil.firstCase(varName, true);

    if (StringUtil.isEmpty(modelName, true)) {
      return '';
    }

    var controllerUri = url; // lastIndex < 0 ? '' : url.substring(0, lastIndex);

    var isPost = type != 'PARAM' && (methodUri.indexOf('post') >= 0 || methodUri.indexOf('add') >= 0 || methodUri.indexOf('create') >= 0);
    var isPut = type != 'PARAM' && (methodUri.indexOf('put') >= 0|| methodUri.indexOf('edit') >= 0 || methodUri.indexOf('update') >= 0);
    var isDelete = type != 'PARAM' && (methodUri.indexOf('delete') >= 0 || methodUri.indexOf('remove') >= 0 || methodUri.indexOf('del') >= 0);
    var isWrite = isPost || isPut || isDelete;
    var isGet = ! isWrite; // methodUri.indexOf('get') >= 0 || methodUri.indexOf('fetch') >= 0 || methodUri.indexOf('query') >= 0;
    var isList = isGet && (methodUri.indexOf('list') >= 0 || methodUri.indexOf('List') >= 0 || typeof reqObj.pageNum == 'number');

    var dataType = isWrite ? 'Integer' : (isList ? 'List<' + modelName + '>' : modelName);

    var params = isList ? (reqObj.params || {}) : null;
    var pageSize = isList ? (reqObj.pageSize || params.pageSize) : null;
    var pageNum = isList ? (reqObj.pageNum || params.pageNum) : null;

    var orderBy = isList ? (reqObj.orderBy) : null;

    /**
     * @param annotionType RequestParam, Param, null
     */
    function getOrderStr(orderBy) {
     if (typeof orderBy == 'string') {
       return orderBy;
     }

     if (orderBy instanceof Array == false && orderBy instanceof Object) {
       var str = '';
       var first = true;
       for (var k in orderBy) {
         var v = orderBy[k];
         str += (first ? '' : ',') + k + ' ' + v;
         first = false;
       }

       return str;
     }

     return null;
    }

    var typeArgStr = CodeUtil.getCode4JavaArgs(reqObj, true, null, ! isSmart);
    var argStr = CodeUtil.getCode4JavaArgs(reqObj, false, null, ! isSmart);

    var code = '@RestController("' + controllerUri + '")\n' +
      'public class ' + modelName + 'Controller {\n' +
      '\n' +
      '    @Autowired\n' +
      '    ' + modelName + 'Service ' + varName + 'Service;\n' +
      '\n' +
      '    @' + (requestMethod == 'POST' ? 'Post' : 'Get') + 'Mapping("' + methodUri + '")  //与下面的 @RequestMapping 任选一个\n' +
      '    //@RequestMapping("' + methodUri + '", method = RequestMethod.' + requestMethod + ')\n' +
      '    public ' + (isSmart && isList ? 'PageInfo<' + modelName + '>' : dataType) + ' ' + methodName + '(' + (type == 'JSON' ? '@RequestBody String body' : CodeUtil.getCode4JavaArgs(reqObj, true, 'RequestParam', ! isSmart)) + ') {\n';

    if (type == 'JSON') {
      //TODO 是否必要转成 User 类？还要考虑 PageHelper 可能是从里面取出来对象
      // var t = JSONResponse.getTableName(key);
      // var isTableKey = JSONObject.isTableKey(t);
      // if (isTable && isSmart) {
      //   code += nextPadding + (isTableKey ? t : 'JSONObject') + ' ' + k + ' = ' + name + '.get' + StringUtil.firstCase(k, true) + '();'
      // }
      // else if (isTableKey && isSmart) {
      //   code += nextPadding + t + ' ' + k + ' = ' + name + '.getObject("' + key + '", ' + t + '.class);'
      // }
      // else {
      //   code += nextPadding + 'JSONObject ' + k + ' = ' + name + '.getJSONObject("' + key + '");'
      // }
      var nextPadding = CodeUtil.getBlank(2);
      var nextNextPadding = CodeUtil.getBlank(3);

      code += nextPadding + 'JSONObject request = JSON.parseObject(body);' + '\n';
      code += nextPadding + 'if (request == null) {' + '\n';
      code += nextNextPadding + 'request = new JSONObject();' + '\n';
      code += nextPadding + '}';

      code += CodeUtil.parseJavaResponse('request', reqObj, 2, false, isSmart, true) + '\n';
    }

    if (isSmart && isList) {
      delete reqObj.params;
      delete reqObj.pageSize;
      delete reqObj.pageNum;

      delete reqObj.orderBy;

      typeArgStr = CodeUtil.getCode4JavaArgs(reqObj, true, null, ! isSmart);
      argStr = CodeUtil.getCode4JavaArgs(reqObj, false, null, ! isSmart);
    }

    var orderStr = getOrderStr(orderBy);
    var isOrderEmpty = StringUtil.isEmpty(orderStr, true);

    if (isSmart && isList) {
      if (pageSize != null) {
        code += '\n        PageHelper.startPage(pageNum, pageSize' + (isOrderEmpty ? '' : ', orderby') + ');';
      }
      else if (isOrderEmpty != true) {
        code += '\n        PageHelper.setOrderBy(' + orderStr + ');';
      }
    }

    code += '\n' +
      '        return ' + (isSmart && isList ? 'new PageInfo(' : '') + varName + 'Service.' + methodName + '(' + argStr + ')' + (isSmart && isList ? ')' : '') + ';\n' +
      '    }\n' +
      '}\n' +
      '\n' +
      'public interface ' + modelName + 'Service {\n' +
      '    ' + dataType + ' ' + methodName + '(' + typeArgStr + ');\n' +
      '}\n' +
      '\n' +
      '@Service\n' +
      'public class ' + modelName + 'ServiceImpl implements ' + modelName + 'Service {\n' +
      '\n' +
      '    @Autowired\n' +
      '    ' + modelName + 'Mapper ' + varName + 'Mapper;\n' +
      '\n' +
      '    @Override\n' +
      '    public ' + dataType + ' ' + methodName + '(' + typeArgStr + ') {\n' +
      '        return ' + varName + 'Mapper.' + methodName + '(' + argStr + ');\n' +
      '    }\n' +
      '}\n' +
      '\n' +
      '@Mapper\n' +
      'public interface ' + modelName + 'Mapper {\n' +
      '    ' + dataType + ' ' + methodName + '(' + CodeUtil.getCode4JavaArgs(reqObj, true, 'Param', ! isSmart) + ');\n' +
      '}';


    if (isList) {
      delete reqObj.params;
      delete reqObj.pageSize;
      delete reqObj.pageNum;

      delete reqObj.orderBy;
    }

    // var columnStr = (StringUtil.isEmpty(colums, true) ? '' : StringUtil.trim(colums));
    var quote = database == 'MYSQL' ? '`' : '"';
    var tablePath = (StringUtil.isEmpty(schema, true) ? '' : quote + schema + quote + '.') + quote + modelName + quote;
    if (isPost) {
      code += '\n\n' +
        '<insert id="' + methodName + '">\n' +
        '    INSERT INTO ' + tablePath;
    }
    else if (isPut) {
      code += '\n\n' +
        '<update id="' + methodName + '">\n' +
        '    UPDATE ' + tablePath;
    }
    else if (isDelete) {
      code += '\n\n' +
        '<delete id="' + methodName + '">\n' +
        '    DELETE FROM ' + tablePath;
    }
    else {
      var colums = Object.keys(reqObj);
      var cs = '';
      if (colums != null && colums.length > 0) {
        for (var i = 0; i < colums.length; i++) {
          cs += (i <= 0 ? '' : ', ') + quote + colums[i] + quote; //需要尽可能保留原字段 [] 肯定不是字段名 JSONResponse.getVariableName(colums[i]) + quote;
        }
      }

      code += '\n\n' +
        '<select id="' + methodName + '" resultMap="' + varName + 'Map">\n' +
        '    SELECT ' + (cs.indexOf(',') < 0 ? '*' : cs) + '\n    FROM ' + tablePath + ' AS ' + quote + modelName + quote;
    }

    function getWhere(reqObj, parent, mustKeys) {
      //性能优化：强制把 id 排在最前面（增删改就不做了，很大可能就是需要按原来顺序）
      var id = reqObj.id;
      var userId = reqObj.userId;
      var user_id = reqObj.user_id;
      var userid = reqObj.userid;
      if (id != undefined || userId != undefined || user_id != undefined || userid != undefined) {
        delete reqObj.id;
        delete reqObj.userId;
        delete reqObj.user_id;
        delete reqObj.userid;

        reqObj = Object.assign({ id: id, userId: userId, user_id: user_id, userid: userid }, reqObj);
      }

      var str = '';
      // 失败的尝试：只有当搜索内容完全一样时，才可能是多个字段任意匹配 var strKeys = [];
      for (var k in reqObj) {
        var v = reqObj[k];
        if (v === undefined) { //null) {
          continue;
        }

        var vn = JSONResponse.getVariableName(k);
        var vnWithPrefix = StringUtil.isEmpty(parent, true) ? vn : parent + '.' + vn;
        var cn = quote + k + quote; //需要尽可能保留原字段 [] 肯定不是字段名 quote + vn + quote;

        if (v instanceof Array) {
          str += '\n' +
            '    AND ' + cn + ' IN \n' +
            '    <foreach item="item" collection="params.' + vnWithPrefix + '" separator="," open="(" close=")" index="index">\n' +
            '        #{ item, jdbcType = ' + (typeof v[0] == 'number' ? 'NUMERIC' : 'VARCHAR' ) + ' }\n' +
            '    </foreach>';
        }
        else if (v instanceof Object) {
          str += getWhere(v, vnWithPrefix);
        }
        else {
          var isMust = mustKeys != null && mustKeys.indexOf(k) >= 0;
          var isStr = typeof v == 'string';
          var isLike = isMust != true && isStr && (v.length > 10 || (StringUtil.isConstName(v) != true));

          //没必要，前面长度+格式判断已经很精准了
          if (isLike != true && isMust != true && isStr) {
            var words = ['content', 'detail', 'descri', 'introduc', 'message', 'msg', 'err', 'comment', 'hint', 'alert', 'announce', 'statement', 'word', 'sentence', 'translat', 'explain']; // ['status', 'state', 'type', 'code', 'verify', 'sex', 'gender']; //, 'group', 'role', 'category', 'job', 'major', 'class', 'course']
            for (var j = 0; j < words.length; j++) {
              if (k.indexOf(words[j]) >= 0 || k.indexOf(StringUtil.firstCase(words[j], true)) >= 0) {
                isLike = true;  //isLike = false;
                break;
              }
            }
          }

          // 失败的尝试：只有当搜索内容完全一样时，才可能是多个字段任意匹配
          // if (isMust != true && isStr && parent == null
          //   && k.indexOf('date') <= 0 && k.indexOf('time') <= 0 && k.indexOf('status') <= 0 && k.indexOf('state') <= 0
          //   && k.indexOf('Date') <= 0 && k.indexOf('Time') <= 0 && k.indexOf('Status') <= 0 && k.indexOf('State') <= 0
          // ) {
          //   strKeys.push(k);
          //   continue;
          // }

          if (isMust) {
            str += '\n' + '    AND ' + cn + ' ' + (isLike ? 'LIKE concat(\'%\', ' : '= ') + '#{ params.' + vnWithPrefix + ' }' + (isLike ? ', \'%\')' : '');
          }
          else {
            str += '\n' +
              '    <if test="params.' + vnWithPrefix + ' != null' + (isLike ? ' and params.' + vnWithPrefix + ' != \'\'' : '') + '">\n' +
              '        AND ' + cn + ' ' + (isLike ? 'LIKE concat(\'%\', ' : '= ') + '#{ params.' + vnWithPrefix + ' }' + (isLike ? ', \'%\')' : '') + '\n' +
              '    </if>';
          }
        }
      }

      // 失败的尝试：只有当搜索内容完全一样时，才可能是多个字段任意匹配
      // var orStr = ''; // Maximum call stack size exceededgetWhere(strPairObj, '', null, 'OR');
      // for (var i = 0; i < strKeys.length; i ++) {
      //   var vn = JSONResponse.getVariableName(strKeys[i]);
      //   var vnWithPrefix = StringUtil.isEmpty(parent, true) ? vn : parent + '.' + vn;
      //
      //   if (strKeys.length <= 1) {  //没必要 OR 连接
      //     str += '\n' +
      //       '    <if test="params.' + vnWithPrefix + ' != null' + (isStr ? ' and params.' + vnWithPrefix + ' != \'\'' : '') + '">\n' +
      //       '        AND ' + vn + ' ' + (isStr ? 'LIKE concat(\'%\', ' : '= ') + '#{ params.' + vnWithPrefix + ' }' + (isStr ? ', \'%\')' : '') + '\n' +
      //       '    </if>';
      //   }
      //   else {
      //     orStr += '\n' +
      //       '        <if test="params.' + vnWithPrefix + ' != null' + (isStr ? ' and params.' + vnWithPrefix + ' != \'\'' : '') + '">\n' +
      //       '            OR ' + vn + ' ' + 'LIKE concat(\'%\', #{ params.' + vnWithPrefix + ' }' + ', \'%\') \n' +
      //       '        </if>';
      //   }
      // }
      // if (StringUtil.isEmpty(orStr, true) != true) {
      //   orStr = '\n    AND ( 1=0 ' + orStr + '\n    )';
      // }

      return StringUtil.isEmpty(str, true) ? '' : (parent != null ? '' : '\n\n    WHERE 1=1 ') + str; // 失败的尝试 + orStr;
    }

    /**必须把所有复杂值处理成 string
     * @param reqObj
     * @param parent
     * @return {string}
     */
    function getValues(reqObj) {
      var prefix = '';
      var suffix = '\n        <trim suffixOverrides=",">';
      for (var k in reqObj) {
        var v = reqObj[k];
        // if (v == null) {
        //   continue;
        // }

        var vn = JSONResponse.getVariableName(k);
        var cn = quote + k + quote; //需要尽可能保留原字段 [] 肯定不是字段名 quote + vn + quote;

        prefix += '\n' +
            '            <if test="params.' + vn + ' != null">\n' +
            '                ' + cn + ', \n' +
            '            </if>';

        suffix += '\n' +
            '            <if test="params.' + vn + ' != null">\n' +
            '                ' + '#{ params.' + vn + ' }, \n' +
            '            </if>';
      }
      suffix += '\n        </trim>';

      if (StringUtil.isEmpty(prefix, true) != true) {
         prefix = '(\n        <trim suffixOverrides=",">' + prefix + '\n        </trim>\n    ) ';
      }

      return prefix + '\n    VALUES(' + suffix + '\n    )';
    }

    /**必须把所有复杂值处理成 string
     * @param reqObj
     * @param parent
     * @return {string}
     */
    function getSet(reqObj) {
      var str = '\n\n    SET ' +
        '\n    <trim suffixOverrides=",">';

      for (var k in reqObj) {
        var v = reqObj[k];
        // if (v == null) {
        //   continue;
        // }

        var vn = JSONResponse.getVariableName(k);
        var cn = quote + k + quote; //需要尽可能保留原字段 [] 肯定不是字段名 quote + vn + quote;

        str += '\n' +
            '        <if test="params.' + vn + ' != null">\n' +
            '            ' + cn + ' = #{ params.' + vn + ' }, \n' +
            '        </if>';
      }
      str += '\n    </trim>';

      return str;
    }

    function getOrder(orderBy, database) {
      var str = '';
      str += '\n\n' +
      '    <if test="orderBy != null and orderBy != \'\'">\n' +
      '        ORDER BY ${ orderBy } \n' +
      '    </if>';

      if (database != 'MYSQL' && database != 'POSTGRESQL' && database != 'SQLITE') {
        str += '\n' +
          '    <if test="orderBy == null or orderBy == \'\'">\n' +
          '        ORDER BY "id" \n' +
          '    </if>';
      }

      return str;
    }

    function getLimit(pageSize, pageNum, isSingle, database) {
      if (database == 'MYSQL' || database == 'POSTGRESQL' || database == 'SQLITE') {
        if (isSingle) {
          return '\n\n' +
            '    LIMIT 1';
        }

        return '\n\n' +
          '    <if test="params.pageSize != null">\n' +
          '        LIMIT #{ params.pageSize }\n' +
          '        <if test="params.pageNum != null and params.pageNum > 1">\n' +
          '            OFFSET #{ params.pageSize*(params.pageNum - 1) } \n' +
          '        </if>\n' +
          '    </if>';
      }

      if (isSingle) {
        return '\n\n' +
          '    FETCH FIRST 1 ROWS ONLY';
      }

      return '\n\n' +
        '    <if test="params.pageSize != null">\n' +
        '        <if test="params.pageNum != null and params.pageNum > 1">\n' +
        '            OFFSET #{ params.pageSize*(params.pageNum - 1) } ROWS \n' +
        '        </if>\n' +
        '        FETCH NEXT #{ params.pageSize } ROWS ONLY \n' +
        '    </if>';
    }

    if (isPost) {
      code += getValues(reqObj);
    }
    else {
      if (isPut) {
        var id = reqObj.id;
        delete reqObj.id;
        code += getSet(reqObj);
        reqObj = { id: id || null };
      }
      else if (isDelete && reqObj.id == undefined) {
        reqObj.id = null;
      }
      code += getWhere(reqObj, null, isPut || isDelete ? ['id'] : null);
    }

    if (isSmart != true && isGet) {
      code += getOrder(orderBy, database);
      code += getLimit(pageSize, pageNum, isList != true && pageSize == null, database);
    }

    if (isPost) {
      code += '\n' + '</insert>';
    }
    else if (isPut) {
      code += '\n' + '</update>';
    }
    else if (isDelete) {
      code += '\n' + '</delete>';
    }
    else {
      code += '\n' + '</select>';
    }

    return code;
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
    // if (reqObj == null || reqObj == '') {
    //   log(CodeUtil.TAG, 'parseCode  reqObj == null || reqObj.isEmpty() >> return null;');
    //   return null;
    // }
    if (reqObj instanceof Object == false || reqObj instanceof Array) { // Array 居然也被判断成 object ！  typeof reqObj != 'object') {
      log(CodeUtil.TAG, 'parseCode  typeof reqObj != object >> return null;');
      // return null;
      return callback.onParseChildOther(name, reqObj, 0, true);
    }
    log(CodeUtil.TAG, '\n\n\n parseCode  name = ' + name + '; reqObj = \n' + format(JSON.stringify(reqObj)));

    var response = callback.onParseParentStart();

    var index = 0; //实际有效键值对key:value的所在reqObj内的位置
    var value;
    for (var key in reqObj) {
      log(CodeUtil.TAG, 'parseCode  for  key = ' + key);
      //key == null || value == null 的键值对被视为无效
      value = key == null ? null : reqObj[key];
      // if (value == null) {
      //   continue;
      // }
      log(CodeUtil.TAG, 'parseCode  for  index = ' + index);

      if (value instanceof Object == false || value instanceof Array) { //typeof value != 'object') {//APIJSON Array转为常规JSONArray
        response += callback.onParseChildOther(key, value, index);
      }
      else { // 其它Object，直接填充
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

    var blank = CodeUtil.getBlank(1);
    var blank2 = CodeUtil.getBlank(2);

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
          + '\n *APIAuto 自动生成 JavaBean\n *主页: https://github.com/TommyLemon/APIAuto'
          + '\n *使用方法：\n *1.修改包名 package \n *2.import 需要引入的类，可使用快捷键 Ctrl+Shift+O '
          + '\n */'
          + '\npackage apijson.demo.server.model;\n\n\n'
          + CodeUtil.getComment(database != 'POSTGRESQL' ? table.table_comment : (item.PgClass || {}).table_comment, true)
          + '\n@MethodAccess'
          + '\npublic class ' + model + ' implements Serializable {'
          + '\n' + blank + 'private static final long serialVersionUID = 1L;';

        //Column[]
        columnList = item['[]'];
        if (columnList != null) {

          console.log('parseJavaBean [] for ' + i + ': columnList = \n' + format(JSON.stringify(columnList)));

          doc += '\n'
            + '\n' + blank + 'public ' + model + '() {'
            + '\n' + blank2 + 'super();'
            + '\n' + blank + '}'
            + '\n' + blank + 'public ' + model + '(long id) {'
            + '\n' + blank2 + 'this();'
            + '\n' + blank2 + 'setId(id);'
            + '\n' + blank + '}'
            + '\n\n'

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
            doc += '\n' + blank + 'private ' + type + ' ' + name + '; ' + CodeUtil.getComment((o || {}).column_comment, false);

          }

          doc += '\n\n'

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
            doc += '\n' + blank + 'public ' + type + ' ' + CodeUtil.getMethodName('get', name) + '() {'
              + '\n' + blank2 + 'return ' + name + ';'
              + '\n' + blank + '}';

            //setter
            doc += '\n' + blank + 'public ' + model + ' ' + CodeUtil.getMethodName('set', name) + '(' + type + ' ' + name + ') {'
              + '\n' + blank2 + 'this.' + name + ' = ' + name + ';'
              + '\n' + blank2 + 'return this;'
              + '\n' + blank + '}\n';

          }
        }

        doc += '\n\n}';

      }
    }
    //[] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

    return doc;
  },

  /**用数据字典转为JavaBean
   * @param docObj
   */
  parseCppStruct: function(docObj, clazz, database) {

    //转为Java代码格式
    var doc = '';
    var item;

    var blank = CodeUtil.getBlank(1);
    var blank2 = CodeUtil.getBlank(2);

    //[] <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    var list = docObj == null ? null : docObj['[]'];
    if (list != null) {
      console.log('parseCppStruct  [] = \n' + format(JSON.stringify(list)));

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

        console.log('parseCppStruct [] for i=' + i + ': table = \n' + format(JSON.stringify(table)));


        doc += '/**'
          + '\n *APIAuto 自动生成 C++ Struct\n *主页: https://github.com/TommyLemon/APIAuto'
          + '\n *使用方法：\n *1.修改包名 namespace \n *2.#include 需要引入的类，可使用快捷键 Ctrl+Shift+O '
          + '\n */\n'
          + '\n#include <string>'
          + '\n#include <map>'
          + '\n#include <array>'
          + '\n#include <vector>'
          + '\n#include <time.h>'
          + '\n\n\nusing namespace std;\n\n\n'
          + CodeUtil.getComment(database != 'POSTGRESQL' ? table.table_comment : (item.PgClass || {}).table_comment, true)
          + '\nstruct ' + model + ' {';

        //Column[]
        columnList = item['[]'];
        if (columnList != null) {

          console.log('parseCppStruct [] for ' + i + ': columnList = \n' + format(JSON.stringify(columnList)));

          var constructor = '\n\n' + blank + model + '()';
          var constructorWithArgs = '\n\n' + blank + model + '(';
          var fields = '\n\n';

          var name;
          var type;

          var first = true;
          for (var j = 0; j < columnList.length; j++) {
            column = (columnList[j] || {}).Column;

            name = CodeUtil.getFieldName(column == null ? null : column.column_name);
            if (name == '') {
              continue;
            }

            column.column_type = CodeUtil.getColumnType(column, database);
            type = CodeUtil.isId(name, column.column_type) ? 'long' : CodeUtil.getCppType(column.column_type, false);

            console.log('parseCppStruct [] for j=' + j + ': column = \n' + format(JSON.stringify(column)));

            constructorWithArgs += (first ? '' : ', ') + type + ' ' + name;
            first = false;
          }

          constructorWithArgs += ')';

          var first2 = true;
          for (var j = 0; j < columnList.length; j++) {
            column = (columnList[j] || {}).Column;

            name = CodeUtil.getFieldName(column == null ? null : column.column_name);
            if (name == '') {
              continue;
            }

            column.column_type = CodeUtil.getColumnType(column, database);
            type = CodeUtil.isId(name, column.column_type) ? 'long' : CodeUtil.getCppType(column.column_type, false);

            console.log('parseCppStruct [] for j=' + j + ': column = \n' + format(JSON.stringify(column)));

            var o = database != 'POSTGRESQL' ? column : (columnList[j] || {}).PgAttribute
            fields += '\n' + blank + type + ' ' + name + '; ' + CodeUtil.getComment((o || {}).column_comment, false);

            constructor += (first2 ? ' : ' : ', ') + name + '()';
            constructorWithArgs += (first2 ? '\n' + blank2 + ': ' : ', ') + name + '(' + name + ')';
            first2 = false;
          }

          constructor += ' {}';
          constructorWithArgs += ' {}';

          doc += constructor + constructorWithArgs + fields;
        }

        doc += '\n\n};';

      }
    }
    //[] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

    return doc;
  },


  /**用数据字典转为JavaBean
   * @param docObj
   */
  parseObjectiveCEntity: function(docObj, clazz, database) {

    //转为Java代码格式
    var doc = '';
    var item;

    var blank = CodeUtil.getBlank(1);
    var blank2 = CodeUtil.getBlank(2);

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
          + '\n *APIAuto 自动生成 JavaBean\n *主页: https://github.com/TommyLemon/APIAuto'
          + '\n *使用方法：\n *1.修改包名 package \n *2.import 需要引入的类，可使用快捷键 Ctrl+Shift+O '
          + '\n */'
          + '\npackage apijson.demo.server.model;\n\n\n'
          + CodeUtil.getComment(database != 'POSTGRESQL' ? table.table_comment : (item.PgClass || {}).table_comment, true)
          + '\n@MethodAccess'
          + '\npublic class ' + model + ' implements Serializable {'
          + '\n' + blank + 'private static final long serialVersionUID = 1L;';

        //Column[]
        columnList = item['[]'];
        if (columnList != null) {

          console.log('parseJavaBean [] for ' + i + ': columnList = \n' + format(JSON.stringify(columnList)));

          doc += '\n'
            + '\n' + blank + 'public ' + model + '() {'
            + '\n' + blank2 + 'super();'
            + '\n' + blank + '}'
            + '\n' + blank + 'public ' + model + '(long id) {'
            + '\n' + blank2 + 'this();'
            + '\n' + blank2 + 'setId(id);'
            + '\n' + blank + '}'
            + '\n\n'

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
            doc += '\n' + blank + 'private ' + type + ' ' + name + '; ' + CodeUtil.getComment((o || {}).column_comment, false);

          }

          doc += '\n\n'

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
            doc += '\n' + blank + 'public ' + type + ' ' + CodeUtil.getMethodName('get', name) + '() {'
              + '\n' + blank2 + 'return ' + name + ';'
              + '\n' + blank + '}';

            //setter
            doc += '\n' + blank + 'public ' + model + ' ' + CodeUtil.getMethodName('set', name) + '(' + type + ' ' + name + ') {'
              + '\n' + blank2 + 'this.' + name + ' = ' + name + ';'
              + '\n' + blank2 + 'return this;'
              + '\n' + blank + '}\n';

          }
        }

        doc += '\n\n}';

      }
    }
    //[] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

    return doc;
  },


  /**用数据字典转为 PHP 实体类
   * @param docObj
   */
  parsePHPEntity: function(docObj, clazz, database) {

    //转为Java代码格式
    var doc = '';
    var item;

    var blank = CodeUtil.getBlank(1);
    var blank2 = CodeUtil.getBlank(2);

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

        console.log('parsePHPEntity [] for i=' + i + ': table = \n' + format(JSON.stringify(table)));


        doc += '<?php'
          + '\n/**'
          + '\n *APIAuto 自动生成 PHP 实体类代码\n *主页: https://github.com/TommyLemon/APIAuto'
          + '\n *使用方法：\n *1.修改包名 namespace \n *2.use 需要引入的类，可使用快捷键 Ctrl+Shift+O '
          + '\n */'
          + '\n\nnamespace apijson\\demo\\server\\model;\n\n\n'
          + CodeUtil.getComment(database != 'POSTGRESQL' ? table.table_comment : (item.PgClass || {}).table_comment, true)
          + '\n/**'
          + '\n * @MethodAccess'
          + '\n */'
          + '\nclass ' + model + ' {';

        //Column[]
        columnList = item['[]'];
        if (columnList != null) {

          console.log('parsePHPEntity [] for ' + i + ': columnList = \n' + format(JSON.stringify(columnList)));

          doc += '\n'
            + '\n' + blank + 'public function construct() {'
            + '\n' + blank2 + 'parent::construct();'
            + '\n' + blank + '}'
            // + '\n' + blank + 'public function construct($id) {' //导致外部 setId 会报错 cannot access empty property $id
            // + '\n' + blank2 + '$this->construct();'
            // + '\n' + blank2 + '$this->setId($id);'
            // + '\n' + blank + '}'
            + '\n\n'

          var name;

          for (var j = 0; j < columnList.length; j++) {
            column = (columnList[j] || {}).Column;

            name = CodeUtil.getFieldName(column == null ? null : column.column_name);
            if (name == '') {
              continue;
            }

            column.column_type = CodeUtil.getColumnType(column, database);


            console.log('parsePHPEntity [] for j=' + j + ': column = \n' + format(JSON.stringify(column)));

            var o = database != 'POSTGRESQL' ? column : (columnList[j] || {}).PgAttribute
            doc += '\n' + blank + 'private $' + name + '; ' + CodeUtil.getComment((o || {}).column_comment, false);

          }

          doc += '\n\n'

          for (var j = 0; j < columnList.length; j++) {
            column = (columnList[j] || {}).Column;

            name = CodeUtil.getFieldName(column == null ? null : column.column_name);
            if (name == '') {
              continue;
            }
            column.column_type = CodeUtil.getColumnType(column, database);

            console.log('parsePHPEntity [] for j=' + j + ': column = \n' + format(JSON.stringify(column)));

            //getter
            doc += '\n' + blank + 'public function ' + CodeUtil.getMethodName('get', name) + '() {'
              + '\n' + blank2 + 'return $' + name + ';'
              + '\n' + blank + '}';

            //setter
            doc += '\n' + blank + 'public function ' + CodeUtil.getMethodName('set', name) + '($' + name + ') {'
              + '\n' + blank2 + '$this->$' + name + ' = $' + name + ';'
              + '\n' + blank2 + 'return $this;'
              + '\n' + blank + '}\n';

          }
        }

        doc += '\n\n}';
        doc += '\n?>';

      }
    }
    //[] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

    return doc;
  },


  /**用数据字典转为JavaBean
   * @param docObj
   */
  parseGoEntity: function(docObj, clazz, database) {

    //转为Java代码格式
    var doc = '';
    var item;

    var blank = CodeUtil.getBlank(1);
    var blank2 = CodeUtil.getBlank(2);

    //[] <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    var list = docObj == null ? null : docObj['[]'];
    if (list != null) {
      console.log('parseGoEntity  [] = \n' + format(JSON.stringify(list)));

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

        console.log('parseGoEntity [] for i=' + i + ': table = \n' + format(JSON.stringify(table)));


        doc += '/**'
          + '\n *APIAuto 自动生成 JavaBean\n *主页: https://github.com/TommyLemon/APIAuto'
          + '\n *使用方法：\n *1.修改包名 package \n *2.import 需要引入的类，可使用快捷键 Ctrl+Shift+O '
          + '\n */'
          + '\npackage model\n\n\n'
          + CodeUtil.getComment(database != 'POSTGRESQL' ? table.table_comment : (item.PgClass || {}).table_comment, true)
          + '\n// @MethodAccess'
          + '\ntype ' + model + ' struct {';

        //Column[]
        columnList = item['[]'];
        if (columnList != null) {

          console.log('parseGoEntity [] for ' + i + ': columnList = \n' + format(JSON.stringify(columnList)));

          var name;
          var type;

          for (var j = 0; j < columnList.length; j++) {
            column = (columnList[j] || {}).Column;

            name = CodeUtil.getFieldName(column == null ? null : column.column_name);
            if (name == '') {
              continue;
            }

            column.column_type = CodeUtil.getColumnType(column, database);
            type = CodeUtil.isId(name, column.column_type) ? 'int64' : CodeUtil.getType4Language(CodeUtil.LANGUAGE_GO, column.column_type, false);


            console.log('parseGoEntity [] for j=' + j + ': column = \n' + format(JSON.stringify(column)));

            var o = database != 'POSTGRESQL' ? column : (columnList[j] || {}).PgAttribute
            doc += '\n' + blank + name + ' ' + type + '  `json:"' + name + '"`  ' + CodeUtil.getComment((o || {}).column_comment, false);

          }

        }

        doc += '\n}';

      }
    }
    //[] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

    return doc;
  },


  /**用数据字典转为JavaBean
   * @param docObj
   */
  parseCSharpEntity: function(docObj, clazz, database) {

    //转为Java代码格式
    var doc = '';
    var item;

    var blank = CodeUtil.getBlank(1);
    var blank2 = CodeUtil.getBlank(2);

    //[] <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    var list = docObj == null ? null : docObj['[]'];
    if (list != null) {
      console.log('parseCSharpEntity  [] = \n' + format(JSON.stringify(list)));

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

        console.log('parseCSharpEntity [] for i=' + i + ': table = \n' + format(JSON.stringify(table)));


        doc += '/**'
          + '\n *APIAuto 自动生成 C# Bean\n *主页: https://github.com/TommyLemon/APIAuto'
          + '\n *使用方法：\n *1.修改包名 namespace \n *2. using 需要引入的类，可使用快捷键 Ctrl+Shift+O '
          + '\n */\n'
          + '\nnamespace apijson.demo.server.model'
          + '\n{'
          + '\n' + blank + '[MethodAccess]'
          + '\n' + blank + '[Serializable]'
          + '\n' + blank + 'public class ' + model + '  ' + CodeUtil.getComment(database != 'POSTGRESQL' ? table.table_comment : (item.PgClass || {}).table_comment, false)
          + '\n' + blank + '{';

        //Column[]
        columnList = item['[]'];
        if (columnList != null) {

          console.log('parseCSharpBean [] for ' + i + ': columnList = \n' + format(JSON.stringify(columnList)));

          doc += '\n'
            + '\n' + blank2 + 'public ' + model + '()'
            + '\n' + blank2 + '{'
            + '\n' + blank2 + '}'
            + '\n' + blank2 + 'public ' + model + '(long id)'
            + '\n' + blank2 + '{'
            + '\n' + blank2 + blank + 'setId(id);'
            + '\n' + blank2 + '}'
            + '\n\n'

          var name;
          var type;

          for (var j = 0; j < columnList.length; j++) {
            column = (columnList[j] || {}).Column;

            name = CodeUtil.getFieldName(column == null ? null : column.column_name);
            if (name == '') {
              continue;
            }

            column.column_type = CodeUtil.getColumnType(column, database);
            type = CodeUtil.isId(name, column.column_type) ? 'Int64' : CodeUtil.getType4Language(CodeUtil.LANGUAGE_C_SHARP, column.column_type, false);


            console.log('parseCSharpBean [] for j=' + j + ': column = \n' + format(JSON.stringify(column)));

            var o = database != 'POSTGRESQL' ? column : (columnList[j] || {}).PgAttribute
            doc += '\n' + blank2 + 'private ' + type + ' ' + name + ' { get; set; } ' + CodeUtil.getComment((o || {}).column_comment, false);

          }

        }

        doc += '\n\n' + blank + '}';
        doc += '\n\n}';

      }
    }
    //[] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

    return doc;
  },


  /**用数据字典转为 TypeScript 类
   * @param docObj
   */
  parseTypeScriptEntity: function(docObj, clazz, database) {

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
          + '\n *APIAuto 自动生成 TypeScript Entity\n *主页: https://github.com/TommyLemon/APIAuto'
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
            type = CodeUtil.isId(name, column.column_type) ? 'number' : CodeUtil.getType4Language(CodeUtil.LANGUAGE_TYPE_SCRIPT, column.column_type, false);

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



  /**用数据字典转为 Python 类
   * @param docObj
   */
  parsePythonEntity: function(docObj, clazz, database) {
    //转为Java代码格式
    var doc = '';
    var item;

    var blank = CodeUtil.getBlank(1);
    var blank2 = CodeUtil.getBlank(2);

    //[] <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    var list = docObj == null ? null : docObj['[]'];
    if (list != null) {
      console.log('parsePythonEntity  [] = \n' + format(JSON.stringify(list)));

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

        console.log('parsePythonEntity [] for i=' + i + ': table = \n' + format(JSON.stringify(table)));


        doc += '/**'
          + '\n *APIAuto 自动生成 Python Entity\n *主页: https://github.com/TommyLemon/APIAuto'
          + '\n *使用方法：\n *1.修改包名 package \n *2.import 需要引入的类，可使用快捷键 Ctrl+Shift+O '
          + '\n */'
          + '\npackage apijson.demo.server.model;\n\n\n'
          + CodeUtil.getComment(database != 'POSTGRESQL' ? table.table_comment : (item.PgClass || {}).table_comment, true)
          + '\n@MethodAccess'
          + '\nclass ' + model + ':';

        //Column[]
        columnList = item['[]'];
        if (columnList != null) {

          console.log('parsePythonEntity [] for ' + i + ': columnList = \n' + format(JSON.stringify(columnList)));

          doc += '\n'
            + '\n' + blank + 'def __init__(self, id: int = 0):'
            + '\n' + blank2 + 'super().__init__()'
            + '\n' + blank2 + 'setId(id)'
            + '\n\n';

          var name;
          var type;

          for (var j = 0; j < columnList.length; j++) {
            column = (columnList[j] || {}).Column;

            name = CodeUtil.getFieldName(column == null ? null : column.column_name);
            if (name == '') {
              continue;
            }

            column.column_type = CodeUtil.getColumnType(column, database);
            type = CodeUtil.getType4Language(CodeUtil.LANGUAGE_PYTHON, column.column_type, false);


            console.log('parseCSharpEntity [] for j=' + j + ': column = \n' + format(JSON.stringify(column)));

            var o = database != 'POSTGRESQL' ? column : (columnList[j] || {}).PgAttribute
            doc += '\n' + blank + name + ': ' + type + ' = None ' + CodeUtil.getComment((o || {}).column_comment, false);

          }

          doc += '\n\n'

          for (var j = 0; j < columnList.length; j++) {
            column = (columnList[j] || {}).Column;

            name = CodeUtil.getFieldName(column == null ? null : column.column_name);
            if (name == '') {
              continue;
            }
            column.column_type = CodeUtil.getColumnType(column, database);
            type = CodeUtil.getType4Language(CodeUtil.LANGUAGE_PYTHON, column.column_type, false);

            console.log('parsePythonEntity [] for j=' + j + ': column = \n' + format(JSON.stringify(column)));

            //getter
            doc += '\n' + blank + 'def ' + CodeUtil.getMethodName('get', name) + '() -> ' + type + ':'
              + '\n' + blank2 + 'return ' + name;

            //setter
            doc += '\n' + blank + 'def ' + CodeUtil.getMethodName('set', name) + '(' + name + ': ' + type + '):'
              + '\n' + blank2 + 'self.' + name + ' = ' + name
              + '\n' + blank2 + 'return this';

          }
        }

        doc += '\n\n}';

      }
    }
    //[] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

    return doc;
  },



  /**用数据字典转为 Swift Entity 类
   * @param docObj
   */
  parseSwiftStruct: function(docObj, clazz, database) {

    //转为Java代码格式
    var doc = '';
    var item;

    var blank = CodeUtil.getBlank(1);
    var blank2 = CodeUtil.getBlank(2);

    //[] <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    var list = docObj == null ? null : docObj['[]'];
    if (list != null) {
      console.log('parseSwiftStruct  [] = \n' + format(JSON.stringify(list)));

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

        console.log('parseSwiftStruct [] for i=' + i + ': table = \n' + format(JSON.stringify(table)));


        doc += '/**'
          + '\n *APIAuto 自动生成 Swift Struct\n *主页: https://github.com/TommyLemon/APIAuto'
          + '\n *使用方法：\n *1.修改包名 package \n *2.import 需要引入的类，可使用快捷键 Ctrl+Shift+O '
          + '\n */'
          + '\npackage apijson.demo.server.model\n\n\n'
          + CodeUtil.getComment(database != 'POSTGRESQL' ? table.table_comment : (item.PgClass || {}).table_comment, true)
          + '\n@MethodAccess'
          + '\nstruct ' + model + ': Codable {';

        //Column[]
        columnList = item['[]'];
        if (columnList != null) {

          console.log('parseSwiftStruct [] for ' + i + ': columnList = \n' + format(JSON.stringify(columnList)));

          var name;
          var type;

          for (var j = 0; j < columnList.length; j++) {
            column = (columnList[j] || {}).Column;

            name = CodeUtil.getFieldName(column == null ? null : column.column_name);
            if (name == '') {
              continue;
            }
            column.column_type = CodeUtil.getColumnType(column, database);
            type = CodeUtil.isId(name, column.column_type) ? 'Int' : CodeUtil.getType4Language(CodeUtil.LANGUAGE_SWIFT, column.column_type, false);

            console.log('parseSwiftStruct [] for j=' + j + ': column = \n' + format(JSON.stringify(column)));

            var o = database != 'POSTGRESQL' ? column : (columnList[j] || {}).PgAttribute
            doc += '\n' + blank + 'var '+ name + ': ' + type + '? ' + CodeUtil.getComment((o || {}).column_comment, false);

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
  parseJavaScriptEntity: function(docObj, clazz, database) {

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
          + '\n *APIAuto 自动生成 JavaScript Entity\n *主页: https://github.com/TommyLemon/APIAuto'
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

    var blank = CodeUtil.getBlank(1);
    var blank2 = CodeUtil.getBlank(2);

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
          + '\n *APIAuto 自动生成 Kotlin Data Class\n *主页: https://github.com/TommyLemon/APIAuto'
          + '\n *使用方法：\n *1.修改包名 package \n *2.import 需要引入的类，可使用快捷键 Ctrl+Shift+O '
          + '\n */'
          + '\npackage apijson.demo.server.model\n\n\n'
          + CodeUtil.getComment(database != 'POSTGRESQL' ? table.table_comment : (item.PgClass || {}).table_comment, true)
          + '\n@MethodAccess'
          + '\nopen class ' + model + ' {';

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
            type = CodeUtil.isId(name, column.column_type) ? 'Long' : CodeUtil.getType4Language(CodeUtil.LANGUAGE_KOTLIN, column.column_type, false);

            console.log('parseKotlinDataClass [] for j=' + j + ': column = \n' + format(JSON.stringify(column)));

            var o = database != 'POSTGRESQL' ? column : (columnList[j] || {}).PgAttribute
            doc += '\n' + blank + 'var '+ name + ': ' + type + '? = null ' + CodeUtil.getComment((o || {}).column_comment, false);

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
      return prefix + '// ' + comment.replace(/\n/g, '  ');
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
  getCode4Value: function (language, value, key, depth, isSmart, isArrayItem, callback) {
    language = language || '';
    if (value == null) {
      switch (language) {
        case CodeUtil.LANGUAGE_KOTLIN:
        case CodeUtil.LANGUAGE_JAVA:
        case CodeUtil.LANGUAGE_C_SHARP:
          break;

        case CodeUtil.LANGUAGE_SWIFT:
        case CodeUtil.LANGUAGE_OBJECTIVE_C:
          return 'nil';

        case CodeUtil.LANGUAGE_GO:
          return 'nil';
        case CodeUtil.LANGUAGE_C_PLUS_PLUS:
          return 'Value().Move()'; //报错：AddMemeber 不允许 NULL ！ 'NULL';

        case CodeUtil.LANGUAGE_TYPE_SCRIPT:
        case CodeUtil.LANGUAGE_JAVA_SCRIPT:
          break;

        case CodeUtil.LANGUAGE_PHP:
          break;
        case CodeUtil.LANGUAGE_PYTHON:
          return 'None';
      }
      return 'null';
    }

    if (value === false) {
      switch (language) {
        case CodeUtil.LANGUAGE_KOTLIN:
        case CodeUtil.LANGUAGE_JAVA:
        case CodeUtil.LANGUAGE_C_SHARP:
          break;

        case CodeUtil.LANGUAGE_SWIFT:
        case CodeUtil.LANGUAGE_OBJECTIVE_C:
          break;

        case CodeUtil.LANGUAGE_GO:
        case CodeUtil.LANGUAGE_C_PLUS_PLUS:
          break;

        //以下都不需要解析，直接用左侧的 JSON
        case CodeUtil.LANGUAGE_TYPE_SCRIPT:
        case CodeUtil.LANGUAGE_JAVA_SCRIPT:
          break;

        case CodeUtil.LANGUAGE_PHP:
          break;
        case CodeUtil.LANGUAGE_PYTHON:
          return 'False';
      }
      return 'false';
    }
    if (value === true) {
      switch (language) {
        case CodeUtil.LANGUAGE_KOTLIN:
        case CodeUtil.LANGUAGE_JAVA:
        case CodeUtil.LANGUAGE_C_SHARP:
          break;

        case CodeUtil.LANGUAGE_SWIFT:
        case CodeUtil.LANGUAGE_OBJECTIVE_C:
          break;

        case CodeUtil.LANGUAGE_GO:
        case CodeUtil.LANGUAGE_C_PLUS_PLUS:
          break;

        case CodeUtil.LANGUAGE_TYPE_SCRIPT:
        case CodeUtil.LANGUAGE_JAVA_SCRIPT:
          break;

        case CodeUtil.LANGUAGE_PHP:
          break;
        case CodeUtil.LANGUAGE_PYTHON:
          return 'True';
      }
      return 'true';
    }

    if (typeof value == 'number') {
      log(CodeUtil.TAG, 'getCode4Value  value == null || typeof value == "boolean" || typeof value == "number"  >>  return value;');
      return value;
    }
    if (typeof value == 'string') {
      log(CodeUtil.TAG, 'getCode4Value  typeof value === "string"  >>  return " + value + ";' );
      if (isSmart && [CodeUtil.LANGUAGE_JAVA_SCRIPT, CodeUtil.LANGUAGE_TYPE_SCRIPT, CodeUtil.LANGUAGE_PHP, CodeUtil.LANGUAGE_PYTHON].indexOf(language) >= 0) {
        return (language == CodeUtil.LANGUAGE_PYTHON ? 'u' : '') + "'" + value + "'";
      }
      return (language == CodeUtil.LANGUAGE_PYTHON ? 'u' : '') + '"' + value + '"';
    }

    if (callback == null) {
      return value;
    }

    depth = (depth || 0)
    return '\n' + CodeUtil.getBlank(depth + 1) + callback(key, value, depth + 1, isSmart, isArrayItem);// + '\n' + CodeUtil.getBlank(depth);
  },

  getJavaTypeFromJS: function (key, value, isArrayItem, baseFirst, rawType, isSmart) {
    var t = JSONResponse.getType(value);
    if (t == 'boolean') {
      return baseFirst ? 'boolean' : 'Boolean';
    }
    if (t == 'number') {
      if (Number.isInteger(value) != true) {
        return baseFirst ? 'double' : 'Double';
      }
    }

    if (t == 'number' || t == 'integer') {
      if (Math.abs(value) >= 2147483647 || CodeUtil.isId(key, 'bigint', isArrayItem)) {
        return baseFirst ? 'long' : 'Long';
      }
      return baseFirst ? 'int' : 'Integer';
    }

    if (t == 'string') {
      return 'String';
    }
    if (t == 'array') {
      return rawType ? 'List<Object>' : (! isSmart ? 'JSONArray' : 'List<' + StringUtil.firstCase(JSONResponse.getTableName(key), true) + '>');
    }
    if (t == 'object') {
      return rawType ? 'Map<String, Object>' : (! isSmart ? 'JSONObject' : StringUtil.firstCase(JSONResponse.getTableName(key), true));
    }

    return 'Object';
  },

  getKotlinTypeFromJS: function (key, value, isArrayItem, baseFirst, rawType, isSmart) {
    var t = JSONResponse.getType(value);
    if (t == 'boolean') {
      return baseFirst ? 'boolean' : 'Boolean';
    }

    if (t == 'number') {
      if (Number.isInteger(value) != true) {
        return baseFirst ? 'double' : 'Double';
      }
    }

    if (t == 'number' || t == 'integer') {
      if (Math.abs(value) >= 2147483647 || CodeUtil.isId(key, 'bigint', isArrayItem)) {
        return baseFirst ? 'long' : 'Long';
      }
      return baseFirst ? 'int' : 'Int';
    }

    if (t == 'string') {
      return 'String';
    }
    if (t == 'array') {
      return rawType ? 'List<Any>' : (! isSmart ? 'JSONArray' : 'List<' + StringUtil.firstCase(JSONResponse.getTableName(key), true) + '>');
    }
    if (t == 'object') {
      return rawType ? 'Map<String, Any>' : (! isSmart ? 'JSONObject' : StringUtil.firstCase(JSONResponse.getTableName(key), true));
    }

    return 'Any';
  },

  getCSharpTypeFromJS: function (key, value, baseFirst) {
    var t = JSONResponse.getType(value);
    if (t == 'boolean') {
      return baseFirst ? 'bool' : 'Boolean';
    }

    if (t == 'number') {
      if (Number.isInteger(value) != true) {
        return baseFirst ? 'double' : 'Double';
      }
    }

    if (t == 'number' || t == 'integer') {
      if (Math.abs(value) >= 2147483647 || CodeUtil.isId(key, 'bigint', isArrayItem)) {
        return baseFirst ? 'long' : 'Int64';
      }
      return baseFirst ? 'int' : 'Int32';
    }

    if (t == 'string') {
      return 'String';
    }
    if (t == 'array') {
      return 'JArray';
    }
    if (t == 'object') {
      return 'JObject';
    }

    return baseFirst ? 'object' : 'Object';
  },

  getSwiftTypeFromJS: function (key, value) {
    var t = JSONResponse.getType(value);
    if (t == 'boolean') {
      return 'Bool';
    }

    if (t == 'number') {
      if (Number.isInteger(value) != true) {
        return 'Double';
      }
    }

    if (t == 'number' || t == 'integer') {
      return 'Int';
    }

    if (t == 'string') {
      return 'String';
    }
    if (t == 'array') {
      return 'NSArray';
    }
    if (t == 'object') {
      return 'NSDictionary';
    }

    return 'NSObject';
  },


  getCppTypeFromJS: function (key, value, isArrayItem) {
    var t = JSONResponse.getType(value);
    if (t == 'boolean') {
      return 'bool';
    }

    if (t == 'number') {
      if (Number.isInteger(value) != true) {
        return 'double';
      }
    }

    if (t == 'number' || t == 'integer') {
      if (Math.abs(value) >= 2147483647 || CodeUtil.isId(key, 'bigint', isArrayItem)) {
        return 'long'
      }
      return 'int';
    }

    if (t == 'string') {
      return 'const char*'; //CLion 报错 'rapidjson::Value::Ch*';
    }
    if (t == 'array') {
      return 'rapidjson::Value::Array';
    }
    if (t == 'object') {
      return 'rapidjson::Value::Object';
    }

    return 'rapidjson::Value&';
  },

  getCppGetterFromJS: function (key, value, isArrayItem) {
    var t = JSONResponse.getType(value);
    if (t == 'boolean') {
      return 'GetBool';
    }

    if (t == 'number') {
      if (Number.isInteger(value) != true) {
        return 'GetDouble';
      }
    }

    if (t == 'number' || t == 'integer') {
      if (Math.abs(value) >= 2147483647 || CodeUtil.isId(key, 'bigint', isArrayItem)) {
        return 'GetInt64';
      }
      return 'GetInt';
    }

    if (t == 'string') {
      return 'GetString';
    }
    if (t == 'array') {
      return 'GetArray';
    }
    if (t == 'object') {
      return 'GetObject';
    }

    return 'Get';
  },

  getPythonTypeFromJS: function (key, value) {
    var t = JSONResponse.getType(value);
    if (t == 'boolean') {
      return 'bool';
    }

    if (t == 'number') {
      if (Number.isInteger(value) != true) {
        return 'double';
      }
    }

    if (t == 'number' || t == 'integer') {
      return 'int';
    }

    if (t == 'string') {
      return 'str';
    }
    if (t == 'array') {
      return 'list';
    }
    if (t == 'object') {
      return 'dict';
    }

    return 'any';
  },

  getGoTypeFromJS: function (key, value) {
    var t = JSONResponse.getType(value);
    if (t == 'boolean') {
      return 'bool';
    }

    if (t == 'number') {
      if (Number.isInteger(value) != true) {
        return 'double';
      }
    }

    if (t == 'number' || t == 'integer') {
      return 'int';
    }

    if (t == 'string') {
      return 'string';
    }
    if (t == 'array') {
      return '[]interface{}';
    }
    if (t == 'object') {
      return 'map[string]interface{}';
    }

    return 'interface{}';
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
    return CodeUtil.getType4Language(CodeUtil.LANGUAGE_JAVA, type, saveLength);
  },
  /**根据数据库类型获取Java类型
   * @param t
   * @param saveLength
   */
  getCppType: function(type, saveLength) {
    return CodeUtil.getType4Language(CodeUtil.LANGUAGE_C_PLUS_PLUS, type, saveLength);
  },
  getType4Language: function(language, type, saveLength) {
    log(CodeUtil.TAG, 'getJavaType  type = ' + type + '; saveLength = ' + saveLength);
    type = StringUtil.noBlank(type);

    var index = type.indexOf('(');

    var t = index < 0 ? type : type.substring(0, index);
    if (t == '' || t == 'object') {
      return CodeUtil.getType4Any(language, '');
    }
    var length = index < 0 || saveLength != true ? '' : type.substring(index);

    if (t.indexOf('char') >= 0 || t.indexOf('text') >= 0 || t == 'enum' || t == 'set') {
      return CodeUtil.getType4String(language, length);
    }
    if (t.indexOf('int') >= 0) {
      return t == 'bigint' ? CodeUtil.getType4Long(language, length) : CodeUtil.getType4Integer(language, length);
    }
    if (t.endsWith('binary') || t.indexOf('blob') >= 0 || t.indexOf('clob') >= 0) {
      return CodeUtil.getType4ByteArray(language, length);
    }
    if (t.indexOf('timestamp') >= 0) {
      return CodeUtil.getType4Timestamp(language, length);
    }

    switch (t) {
      case 'id':
        return CodeUtil.getType4Long(language, length);
      case 'bit':
      case 'bool': //同tinyint
      case 'boolean': //同tinyint
        return CodeUtil.getType4Boolean(language, length);
      case 'datetime':
        return CodeUtil.getType4Timestamp(language, length);
      case 'year':
        return CodeUtil.getType4Date(language, length);
      case 'decimal':
      case 'number':
      case 'numberic':
        return CodeUtil.getType4Decimal(language, length);
      case 'json':
      case 'jsonb':
      case 'array':
        return CodeUtil.getType4Array(language);
      case 'string':
        return CodeUtil.getType4String(language, length);
      default:
        return StringUtil.firstCase(t, true) + length;
    }

  },

  getType4Any: function (language, length) {
    length = length || '';
    switch (language) {
      case CodeUtil.LANGUAGE_KOTLIN:
        return 'Any' + length;
      case CodeUtil.LANGUAGE_JAVA:
        return 'Object' + length;
      case CodeUtil.LANGUAGE_C_SHARP:
        return 'object' + length;

      case CodeUtil.LANGUAGE_SWIFT:
        return 'Any' + length;
      case CodeUtil.LANGUAGE_OBJECTIVE_C:
        return 'NSObject' + length;

      case CodeUtil.LANGUAGE_GO:
        return 'interface{}' + length;
      case CodeUtil.LANGUAGE_C_PLUS_PLUS:
        return 'GenericValue';

      case CodeUtil.LANGUAGE_TYPE_SCRIPT:
      case CodeUtil.LANGUAGE_JAVA_SCRIPT:
        return 'object' + length;

      case CodeUtil.LANGUAGE_PHP:
      case CodeUtil.LANGUAGE_PYTHON:
        return 'any' + length;
    }
    return 'Object' + length;  //以 JSON 类型为准
  },
  getType4Boolean: function (language, length) {
    length = length || '';
    switch (language) {
      case CodeUtil.LANGUAGE_KOTLIN:
      case CodeUtil.LANGUAGE_JAVA:
      case CodeUtil.LANGUAGE_C_SHARP:
        return 'Boolean' + length;

      case CodeUtil.LANGUAGE_SWIFT:
        return 'Bool' + length;
      case CodeUtil.LANGUAGE_OBJECTIVE_C:
        return 'bool' + length;

      case CodeUtil.LANGUAGE_GO:
      case CodeUtil.LANGUAGE_C_PLUS_PLUS:
        return 'bool' + length;

      case CodeUtil.LANGUAGE_TYPE_SCRIPT:
      case CodeUtil.LANGUAGE_JAVA_SCRIPT:
        return 'boolean' + length;

      case CodeUtil.LANGUAGE_PHP:
      case CodeUtil.LANGUAGE_PYTHON:
        return 'bool' + length;
    }
    return 'Boolean' + length;  //以 JSON 类型为准
  },
  getType4Integer: function (language, length) {
    length = length || '';
    switch (language) {
      case CodeUtil.LANGUAGE_KOTLIN:
        return 'Int' + length;
      case CodeUtil.LANGUAGE_JAVA:
        break;
      case CodeUtil.LANGUAGE_C_SHARP:
        return 'Int32' + length;

      case CodeUtil.LANGUAGE_SWIFT:
        return 'Int' + length;
      case CodeUtil.LANGUAGE_OBJECTIVE_C:
        return 'NSInteger' + length;


      case CodeUtil.LANGUAGE_GO:
      case CodeUtil.LANGUAGE_C_PLUS_PLUS:
        return 'int' + length;

      case CodeUtil.LANGUAGE_TYPE_SCRIPT:
      case CodeUtil.LANGUAGE_JAVA_SCRIPT:
        return 'number' + length;

      case CodeUtil.LANGUAGE_PHP:
      case CodeUtil.LANGUAGE_PYTHON:
        return 'int' + length;
    }
    return 'Integer' + length;  //以 JSON 类型为准
  },
  getType4Long: function (language, length) {
    length = length || ''
    switch (language) {
      case CodeUtil.LANGUAGE_KOTLIN:
        return 'Int' + length;
      case CodeUtil.LANGUAGE_JAVA:
        return 'Long' + length;
      case CodeUtil.LANGUAGE_C_SHARP:
        return 'Int64' + length;

      case CodeUtil.LANGUAGE_SWIFT:
      case CodeUtil.LANGUAGE_OBJECTIVE_C:
        return 'Int' + length;

      case CodeUtil.LANGUAGE_GO:
        return 'int64' + length;
      case CodeUtil.LANGUAGE_C_PLUS_PLUS:
        return 'long' + length;

      case CodeUtil.LANGUAGE_TYPE_SCRIPT:
      case CodeUtil.LANGUAGE_JAVA_SCRIPT:
        return 'number' + length;

      case CodeUtil.LANGUAGE_PHP:
      case CodeUtil.LANGUAGE_PYTHON:
        return 'int' + length;
    }
    return CodeUtil.getType4Integer(language, length);
  },

  getType4Decimal: function (language, length) {
    length = length || ''
    switch (language) {
      case CodeUtil.LANGUAGE_KOTLIN:
      case CodeUtil.LANGUAGE_JAVA:
        return 'BigDecimal' + length;
      case CodeUtil.LANGUAGE_C_SHARP:
        return 'decimal' + length;

      case CodeUtil.LANGUAGE_SWIFT:
        return 'Decimal' + length;
      case CodeUtil.LANGUAGE_OBJECTIVE_C:
        return 'NSDecimal' + length;

      case CodeUtil.LANGUAGE_GO:
        return 'float64' + length;
      case CodeUtil.LANGUAGE_C_PLUS_PLUS:
        return 'double' + length;

      case CodeUtil.LANGUAGE_TYPE_SCRIPT:
      case CodeUtil.LANGUAGE_JAVA_SCRIPT:
        return 'number' + length;

      case CodeUtil.LANGUAGE_PHP:
      case CodeUtil.LANGUAGE_PYTHON:
        return 'float' + length;
    }
    return 'Number' + length;  //以 JSON 类型为准
  },
  getType4String: function (language, length) {
    length = length || ''
    switch (language) {
      case CodeUtil.LANGUAGE_KOTLIN:
      case CodeUtil.LANGUAGE_JAVA:
      case CodeUtil.LANGUAGE_C_SHARP:
        break;

      case CodeUtil.LANGUAGE_SWIFT:
        break;
      case CodeUtil.LANGUAGE_OBJECTIVE_C:
        return 'NSString' + length;

      case CodeUtil.LANGUAGE_GO:
      case CodeUtil.LANGUAGE_C_PLUS_PLUS:
        return 'string' + length;

      case CodeUtil.LANGUAGE_TYPE_SCRIPT:
      case CodeUtil.LANGUAGE_JAVA_SCRIPT:
        return 'string' + length;

      case CodeUtil.LANGUAGE_PHP:
        return 'string' + length;
      case CodeUtil.LANGUAGE_PYTHON:
        return 'str' + length;
    }
    return 'String' + length;  //以 JSON 类型为准
  },
  getType4Date: function (language, length) {
    length = length || ''
    switch (language) {
      case CodeUtil.LANGUAGE_KOTLIN:
      case CodeUtil.LANGUAGE_JAVA:
        return 'Date' + length;
      case CodeUtil.LANGUAGE_C_SHARP:
        return 'DateTime' + length;

      case CodeUtil.LANGUAGE_SWIFT:
        return 'Date' + length;
      case CodeUtil.LANGUAGE_OBJECTIVE_C:
        return 'NSDate' + length;

      case CodeUtil.LANGUAGE_GO:
        return 'time.Time' + length;
      case CodeUtil.LANGUAGE_C_PLUS_PLUS:
        return 'tm' + length;

      case CodeUtil.LANGUAGE_JAVA_SCRIPT:
      case CodeUtil.LANGUAGE_TYPE_SCRIPT:
        return 'Date' + length;

      case CodeUtil.LANGUAGE_PHP:
        break;
      case CodeUtil.LANGUAGE_PYTHON:
        return 'datetime' + length;
    }
    return CodeUtil.getType4String(language, length);
  },
  getType4Timestamp: function (language, length) {
    length = length || ''
    switch (language) {
      case CodeUtil.LANGUAGE_KOTLIN:
      case CodeUtil.LANGUAGE_JAVA:
        return 'Timestamp' + length;
      case CodeUtil.LANGUAGE_C_SHARP:
        return 'TimeSpan' + length;

      case CodeUtil.LANGUAGE_SWIFT:
        return 'TimeInterval' + length;
      case CodeUtil.LANGUAGE_OBJECTIVE_C:
        break;

      case CodeUtil.LANGUAGE_GO:
        return 'time.Time' + length;
      case CodeUtil.LANGUAGE_C_PLUS_PLUS:
        return 'time_t' + length;

      case CodeUtil.LANGUAGE_JAVA_SCRIPT:
        return 'string';
      case CodeUtil.LANGUAGE_TYPE_SCRIPT:
        break;

      case CodeUtil.LANGUAGE_PHP:
        break;
      case CodeUtil.LANGUAGE_PYTHON:
        return 'datetime' + length;
    }
    return CodeUtil.getType4Integer(language, length);
  },
  getType4Object: function (language) {
    switch (language) {
      case CodeUtil.LANGUAGE_KOTLIN:
      case CodeUtil.LANGUAGE_JAVA:
        return 'JSONObject';
      case CodeUtil.LANGUAGE_C_SHARP:
        return 'JObject';

      case CodeUtil.LANGUAGE_SWIFT:
        return 'Dictionary';
      case CodeUtil.LANGUAGE_OBJECTIVE_C:
        return 'NSDictionary';

      case CodeUtil.LANGUAGE_GO:
        return 'map[string]interface{}';
      case CodeUtil.LANGUAGE_C_PLUS_PLUS:
        return 'map<string, object>';

      case CodeUtil.LANGUAGE_JAVA_SCRIPT:
      case CodeUtil.LANGUAGE_TYPE_SCRIPT:
        return 'object';

      case CodeUtil.LANGUAGE_PHP:
        return 'object';
      case CodeUtil.LANGUAGE_PYTHON:
        return 'dict[str, any]';
    }
    return 'Object';  //以 JSON 类型为准
  },
  getType4ByteArray: function (language) {
    return 'byte[]';
  },
  getType4Array: function (language) {
    length = length || ''
    switch (language) {
      case CodeUtil.LANGUAGE_KOTLIN:
      case CodeUtil.LANGUAGE_JAVA:
      case CodeUtil.LANGUAGE_C_SHARP:
        return 'List<Object>';

      case CodeUtil.LANGUAGE_SWIFT:
        return 'Array';
      case CodeUtil.LANGUAGE_OBJECTIVE_C:
        return 'NSArray';

      case CodeUtil.LANGUAGE_GO:
        return '[]interface{}';
      case CodeUtil.LANGUAGE_C_PLUS_PLUS:
        return 'vector<object>';

      case CodeUtil.LANGUAGE_JAVA_SCRIPT:
        return 'object[]';
      case CodeUtil.LANGUAGE_TYPE_SCRIPT:
        return 'any[]';

      case CodeUtil.LANGUAGE_PHP:
        return 'any[]';
      case CodeUtil.LANGUAGE_PYTHON:
        return 'list[any]';
    }
    return 'Array';  //以 JSON 类型为准
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
  isId: function (column, type, isArrayItem) {
    if (column == null || type == null || type.indexOf('int') < 0) {
      return false;
    }

    if (isArrayItem) {
      // if (column.endsWith('[]')) {
      //   column = column.substring(0, column.length - '[]'.length);
      // }
      //
      // if (column.endsWith('Item')) {
      //   column = column.substring(0, column.length - 'Item'.length);
      // }
      // else if (column.endsWith('Element')) {
      //   column = column.substring(0, column.length - 'Element'.length);
      // }
      //
      // if (column.endsWith('List')) {
      //   column = column.substring(0, column.length - 'List'.length);
      // }
      // else if (column.endsWith('Array')) {
      //   column = column.substring(0, column.length - 'Array'.length);
      // }
      // else if (column.endsWith('Vector')) {
      //   column = column.substring(0, column.length - 'Vector'.length);
      // }
      // else if (column.endsWith('Set')) {
      //   column = column.substring(0, column.length - 'Set'.length);
      // }
      // else if (column.endsWith('Collection')) {
      //   column = column.substring(0, column.length - 'Collection'.length);
      // }
      // else if (column.endsWith('Arr')) {
      //   column = column.substring(0, column.length - 'Arr'.length);
      // }
      // else if (column.endsWith('s')) {
      //   column = column.substring(0, column.length - 's'.length);
      // }

      while (true) {
        var index = column == null || column.length < 2 ? -1 : column.lastIndexOf('d');
        if (index <= 0) {
          break;
        }

        var prefix = column.substring(index <= 2 ? 0 : index - 2, index);

        if (prefix.endsWith('I') || (prefix.endsWith('i') && /[A-Za-z]/.test(prefix.length < 2 ? '' : prefix.substring(0, 1)) == false)) {

          var suffix = column.length <= index + 1 ? '' : column.substring(index + 1, index + 3);
          var after = suffix.length < 1 ? '' : suffix.substring(0, 1);

          // id%, %_id, %Id%, %ids%, %_ids%, %Ids%
          if (/[a-z]/.test(after) == false || (after == 's' && /[a-z]/.test(suffix.length < 2 ? '' : suffix.substring(1, 2)) == false)) {
            return true;
          }
        }

        column = index < 2 ? null : column.substring(0, index - 2);
      }

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
  JOIN_TYPES: {"@": 'APP', "<": 'LEFT', ">": 'RIGHT', "*": 'CROSS', "&": 'INNER', "|": 'FULL', "!": 'OUTER', "^": 'SIDE', "(": 'ANTI', ")": 'FOREIGN'},
  CACHE_TYPES: ['全部', '磁盘', '内存'],
  SUBQUERY_RANGES: ['ANY', 'ALL'],
  QUERY_TYPE_KEYS: [0, 1, 2],
  CACHE_TYPE_KEYS: [0, 1, 2],
  QUERY_TYPE_CONSTS: ["JSONRequest.QUERY_TABLE", "JSONRequest.QUERY_TOTAL", "JSONRequest.QUERY_ALL"],
  ROLE_KEYS: ['UNKNOWN', 'LOGIN', 'CONTACT', 'CIRCLE', 'OWNER', 'ADMIN'],
  ROLES: {
    UNKNOWN: '未登录',
    LOGIN: '已登录',
    CONTACT: '联系人',
    CIRCLE: '圈子成员',
    OWNER: '拥有者',
    ADMIN: '管理员'
  },
  DATABASE_KEYS: ['MYSQL', 'POSTGRESQL', 'SQLSERVER', 'ORACLE', 'DB2', 'CLICKHOUSE', 'SQLITE'],

  /**获取请求JSON的注释
   * @param tableList
   * @param name
   * @param key
   * @param value
   * @param isInSubquery
   * @param database
   */
  getComment4Request: function (tableList, name, key, value, method, isInSubquery, database, language, isReq, names, isRestful, standardObj, isWarning) {
    // alert('name = ' + name + '; key = ' + key + '; value = ' + value + '; method = ' + method);

    if (key == null) {
      return '';
    }

    var typeOfValue = CodeUtil.getType4Request(value);
    var valuesIsNotString = typeOfValue != 'string';
    var valuesIsNotInteger = typeOfValue != 'integer';
    // var valuesIsNotNumber = valuesIsNotInteger && typeOfValue != 'number';
    var valuesIsNotBoolean = typeOfValue != 'boolean';
    var isValueNotEmpty = valuesIsNotString ? (typeOfValue != 'array' ? value != null : value.length > 0) : StringUtil.isEmpty(value, true) != true;

    if (isRestful == true || (standardObj != null && key.indexOf('@') < 0)) {
      if (StringUtil.isEmpty(key, true)) {
        return '';
      }

      var pathKeys = []; // slice 居然每次都返回数字 1  names == null || names.length < 2 ? null : names.slice(2).push(key)
      if (names != null && names.length > 1) {
        for (var i = 1; i < names.length; i++) {
          pathKeys.push(names[i]);
        }
      }

      // FIXME names 居然出现 ['', 'user', 'user']  if (value instanceof Object == false) {
        pathKeys.push(key);
      // }

      try {
        var c = CodeUtil.getCommentFromDoc(tableList, name, key, method, database, language, isReq != true || isRestful, isReq, pathKeys, isRestful, value == null ? {} : value, true, standardObj, null, isWarning);
        if (isRestful == true || StringUtil.isEmpty(c) == false) {  // TODO 最好都放行，查不到都去数据库查表和字段属性
          if (c.startsWith(' ! ')) {
            return c;
          }
          return StringUtil.isEmpty(c) ? ' ! 字段 ' + key + ' 不存在！' : (isWarning ? '' : CodeUtil.getComment(c, false, '  '));
        }
      }
      catch (e) {
        if (isRestful == true) {
          return e.message;
        }
      }
    }

    if (isRestful != true || isReq != true) {  // 解决 APIJSON 批量 POST/PUT "Table[]": [{ key:value }] 中 {} 及 key:value 不显示注释
      if (StringUtil.isEmpty(key, true)) {
        // 这里处理将不显示表名，且空格少一个不能让注释和下方 key 对齐
        // if ((method == 'POST' || method == 'PUT') && names != null && names.length >= 1 && JSONObject.isArrayKey(name)) {
        //   var aliaIndex = name.indexOf(':');
        //   var objName = name.substring(0, aliaIndex >= 0 ? aliaIndex : name.length - 2);
        //
        //   if (JSONObject.isTableKey(objName)) {
        //     key = objName;
        //   }
        // }
      }
      else if (StringUtil.isEmpty(name, true) && (isReq != true || method == 'POST' || method == 'PUT')
        && names != null && names.length >= 2 && names[names.length - 1] == name) {

        var arrName = names[names.length - 2];

        if (JSONObject.isArrayKey(arrName)) {
          var aliaIndex = arrName.indexOf(':');
          var objName = arrName.substring(0, aliaIndex >= 0 ? aliaIndex : arrName.length - 2);

          if (JSONObject.isTableKey(objName)) {
            name = objName;
          }
        }
      }
    }

    // if (value == null) {
    //  return ' ! key:value 中 key 或 value 任何一个为 null 时，该 key:value 都无效！'
    // }
    if (value instanceof Array) {
      if ((isReq != true || method == 'POST' || method == 'PUT') && JSONObject.isArrayKey(key)) {
        var aliaIndex = key.indexOf(':');
        var objName = key.substring(0, aliaIndex >= 0 ? aliaIndex : key.length - 2);

        if (JSONObject.isTableKey(objName)) {
          var c = CodeUtil.getCommentFromDoc(tableList, objName, null, method, database, language, isReq != true || isRestful, isReq, pathKeys, isRestful, value, null, null, null, isWarning);
          if (c.startsWith(' ! ')) {
            return c;
          }
          return StringUtil.isEmpty(c) ? ' ! 表 ' + objName + ' 不存在！' : (isWarning ? '' : CodeUtil.getComment(
            (aliaIndex < 0 ? '' : '新建别名: ' + key.substring(aliaIndex + 1, key.length - 2) + ' < ') + objName + ': ' + c, false, '  '));
        }
      }

      if (isReq == true && isRestful != true && method != 'POST' && method != 'PUT') {
        return '';
      }
    }
    else if (value instanceof Object) {
      if ((isReq != true || isRestful != true) && StringUtil.isEmpty(key, true)) {
        if (names == null || names.length <= 0) {
          return isReq != true || isWarning ? '' : ' ' + CodeUtil.getComment('根对象，可在内部加 format,tag,version,@role,@database,@schema,@datasource,@explain,@cache 等全局关键词键值对', false, '  ');
        }

        // 解决 APIJSON 批量 POST/PUT "Table[]": [{ key:value }] 中 {} 不显示注释
        if ((isReq != true || method == 'POST' || method == 'PUT') && JSONObject.isArrayKey(name)) {
          var aliaIndex = name.indexOf(':');
          var objName = name.substring(0, aliaIndex >= 0 ? aliaIndex : name.length - 2);

          if (JSONObject.isTableKey(objName)) {
            var c = CodeUtil.getCommentFromDoc(tableList, objName, null, method, database, language, isReq != true || isRestful, isReq, pathKeys, isRestful, value, null, null, null, isWarning);
            if (c.startsWith(' ! ')) {
              return c;
            }
            return StringUtil.isEmpty(c) ? ' ! 表 ' + objName + ' 不存在！' : (isWarning ? '' : ' ' + CodeUtil.getComment(objName + ': ' + c, false, '  '));
          }
        }
      }

      if (isRestful != true && key.endsWith('@')) {
        if (isWarning) {
          return '';
        }

        if (key == '@from@') {
          return CodeUtil.getComment('数据来源：子查询' + (isValueNotEmpty ? '，里面必须有 "from":Table, Table:{}' : '，例如 { "from":"User", "User":{} }'), false, '  ');
        }

        var aliaIndex = name == null ? -1 : name.indexOf(':');
        var objName = aliaIndex < 0 ? name : name.substring(0, aliaIndex);
        if (JSONObject.isTableKey(objName)) {
          return CodeUtil.getComment('子查询，里面必须有 "from":Table, Table:{} < ' + CodeUtil.getCommentFromDoc(tableList, objName, key.substring(0, key.length - 1), method, database, language, isReq != true || isRestful, isReq, pathKeys, isRestful, value, null, null, true, isWarning), false, '  ');
        }
        return CodeUtil.getComment('子查询，可在内部加 from,range 或 数组关键词 等键值对，需要被下面的表字段相关 key 引用赋值', false, '  ');
      }

      if (isRestful != true && JSONObject.isArrayKey(key)) {
        if (method != 'GET' && method != 'GETS') {
          return ' ! key[]:{} 只支持 GET,GETS 方法！';
        }

        if (isWarning) {
          return '';
        }

        key = key.substring(0, key.lastIndexOf('[]'));

        var aliaIndex = key.indexOf(':');
        var objName = aliaIndex < 0 ? key : key.substring(0, aliaIndex);
        var alias = aliaIndex < 0 ? '' : key.substring(aliaIndex + 1, key.length);

        var firstIndex = objName.indexOf('-');
        var firstKey = firstIndex < 0 ? objName : objName.substring(0, firstIndex);
        alias = alias.length <= 0 ? '' : '新建别名: ' + alias + ' < ';
        return CodeUtil.getComment((JSONObject.isTableKey(firstKey) ? '提取' + objName + ' < ' : '') + alias + '数组，可在内部加 count,page,query,join 等关键词键值对', false, '  ');
      }

      var aliaIndex = key.indexOf(':');
      var objName = aliaIndex < 0 ? key : key.substring(0, aliaIndex);

      var isTableKey = JSONObject.isTableKey(objName)
      if (isRestful == true || isTableKey) {
        var c = CodeUtil.getCommentFromDoc(tableList, objName, null, method, database, language, isReq != true || isRestful, isReq, pathKeys, isRestful, value, null, null, null, isWarning);
        if (c.startsWith(' ! ')) {
          return c;
        }
        return StringUtil.isEmpty(c) ? ' ! 表不存在！' : (isWarning ? '' : CodeUtil.getComment(
          (aliaIndex < 0 ? '' : '新建别名: ' + key.substring(aliaIndex + 1, key.length) + ' < ' + objName + ': ') + c, false, '  '));
      }

      if (isWarning != true && isRestful != true && isTableKey != true && StringUtil.isEmpty(objName) != true) {
        return CodeUtil.getComment('普通对象。如果要对应数据库表请把 ' + objName + ' 改成 ' + StringUtil.firstCase(objName, true) + ' 这种以大写字母开头的 APIJSON 表名！数据库表不一样要这样，MySQL 默认大小写不敏感。', false, '  ');
      }

      return '';
    }

    if (isRestful != true && (isInSubquery || JSONObject.isArrayKey(name))) {
      switch (key) {
        case 'count':
          return value != null && valuesIsNotInteger ? ' ! value必须是Integer类型！' : (isWarning ? '' : CodeUtil.getComment('每页数量' + (isValueNotEmpty ? '' : '，例如 5 10 20 等'), false, '  '));
        case 'page':
          if (value != null && valuesIsNotInteger) {
            return ' ! value必须是Integer类型！';
          }
          return value != null && value < 0 ? ' ! 必须 >= 0 ！' : (isWarning ? '' : CodeUtil.getComment('分页页码' + (isValueNotEmpty ? '' : ': 例如 0 1 2 ...'), false, '  '));
        case 'query':
          var query = CodeUtil.QUERY_TYPES[value];
          return StringUtil.isEmpty(query) ? ' ! value必须是[' + CodeUtil.QUERY_TYPE_KEYS.join() + ']中的一种！' : (isWarning ? '' : CodeUtil.getComment('查询内容：0-对象 1-总数和分页详情 2-数据、总数和分页详情', false, '  '));
        case 'join':
          if (valuesIsNotString) {
            return ' ! value必须是String类型！';
          }

          var s = '';
          var must = '';
          var items = value.length < 1 ? null : StringUtil.split(value);
          if (items != null && items.length > 0) {

            var chars = Object.keys(CodeUtil.JOIN_TYPES);

            for (var i = 0; i < items.length; i++) {
              var item = items[i] || '';

              if (item.endsWith('@') != true) {
                return ' ! ' + item + ' 不合法 ! 必须以 @ 结尾' + (isValueNotEmpty ? '' : '，例如 "&/User/id@" ！');
              }

              var index = item.indexOf('/');
              var lastIndex = item.lastIndexOf('/');

              if (index < 0 || lastIndex <= index + 1) {
                return ' ! ' + item + ' 不合法 ! 必须有两个不相邻的 /' + (isValueNotEmpty ? '' : '，例如 "&/User/id@" ！');
              }

              var c = index <= 0 ? '|' : item.substring(0, index);
              if (chars.indexOf(c) < 0) {
                return ' ! JOIN 类型 ' + c + ' 不合法 ! 必须是 [' + chars.join(', ') + '] 中的一种！';
              }

              var t = item.substring(index + 1, lastIndex);
              var ind = t.indexOf(':')
              var a = ind < 0 ? '' : t.substring(ind + 1)
              t = ind < 0 ? t : t.substring(0, ind)

              if (JSONObject.isTableKey(t) != true) {
                return ' ! 表名 ' + t + ' 不合法 ! 必须是 Table 这种大驼峰格式' + (isValueNotEmpty ? '' : '，例如 "User" "Comment" "ViewTable" 等 ！');
              }

              if (isWarning != true) {
                s += CodeUtil.JOIN_TYPES[c] + ' JOIN ' + t + (a.length <= 0 ? '' : ' AS ' + a);
                must += (i > 0 ? ', ' : '，同一层级必须有 "') + t + '":{ "' + item.substring(lastIndex + 1) + '":"/../.." }';
              }
            }
          }

          return isWarning ? '' : CodeUtil.getComment('多表连接：' + (s + must || '例如 &/User/id@,</Comment/momentId@,... ' +
            '对应关系为 @ APP, < LEFT, > RIGHT, * CROSS, & INNER, | FULL, ! OUTER, ^ SIDE, ( ANTI, ) FOREIGN'), false, '  ');
        default:
          if (isInSubquery) {
            switch (key) {
              case 'range':
                if (valuesIsNotString) {
                  return ' ! value必须是String类型！';
                }
                return CodeUtil.SUBQUERY_RANGES.indexOf(value) < 0 ? ' ! value必须是[' + CodeUtil.SUBQUERY_RANGES.join() + ']中的一种！' : (isWarning ? '' : CodeUtil.getComment('比较范围：ANY-任意 ALL-全部', false, '  '));
              case 'from':
                return valuesIsNotString ? ' ! value必须是String类型！' : (isWarning ? '' : CodeUtil.getComment('数据来源' + (isValueNotEmpty ? '，同一层级必须有 "' + value + '":{...}' : '，例如 "User"，同一层级必须有 "User":{...}'), false, '  '));
            }
          }
          break;
      }
      return '';
    }

    var aliaIndex = name == null ? -1 : name.indexOf(':');
    var objName = aliaIndex < 0 ? name : name.substring(0, aliaIndex);

    if (isRestful != true && JSONObject.isTableKey(objName)) {
      switch (key) {
        case '@column':
          return valuesIsNotString ? ' ! value必须是String类型！' : (isWarning ? '' : CodeUtil.getComment('返回字段' + (isValueNotEmpty ? '，可传 字段(:别名)、SQL 函数(:别名，用分号 ; 隔开)、表达式，以及部分 SQL 关键词' : '：例如 "name" "toId:parentId" "id,userId;json_length(praiseUserIdList):praiseCount" 等'), false, '  '));
        case '@from@': //value 类型为 Object 时 到不了这里，已在上方处理
          return valuesIsNotString && typeOfValue != 'object' ? ' ! value必须是String或Object类型！' : (isWarning ? '' : CodeUtil.getComment('数据来源：引用赋值 子查询 "' + value + '@":{...} ', false, '  '));
        case '@group':
          return valuesIsNotString ? ' ! value必须是String类型！' : (isWarning ? '' : CodeUtil.getComment('分组方式' + (isValueNotEmpty ? '' : '，例如 "userId" "momentId,toId" 等'), false, '  '));
        case '@having':
          return valuesIsNotString ? ' ! value必须是String类型！' : (isWarning ? '' : CodeUtil.getComment('聚合函数' + (isValueNotEmpty ? '，可传 SQL 函数(用分号 ; 隔开)、表达式，以及部分 SQL 关键词' : '，例如 "max(id)>100" "length(phone)>0;sum(balance)<=10000" 等'), false, '  '));
        case '@order':
          return valuesIsNotString ? ' ! value必须是String类型！' : (isWarning ? '' : CodeUtil.getComment('排序方式：+升序，-降序' + (isValueNotEmpty ? '' : '，例如 "date-" "name+,id-" 等'), false, '  '));
        case '@combine':  //TODO 解析 value 并直接给出条件组合结果
          return valuesIsNotString ? ' ! value必须是String类型！' : (isWarning ? '' : CodeUtil.getComment('条件组合' + (isValueNotEmpty ? '，| 可省略。合并同类，外层按照 & | ! 顺序，内层按传参顺序组合成 (key0 & key1 & key6 & 其它key) & (key2 | key3 | key7) & !(key4 | key5)' : '，例如 "name$,tag$" "!userId<,!toId" 等'), false, '  '));
        case '@schema':
          return valuesIsNotString ? ' ! value必须是String类型！' : (isWarning ? '' : CodeUtil.getComment('集合空间(数据库名/模式)' + (isValueNotEmpty ? '' : '，例如 "sys" "apijson" "postgres" "dbo" 等'), false, '  '));
        case '@datasource':
          return valuesIsNotString ? ' ! value必须是String类型！' : (isWarning ? '' : CodeUtil.getComment('跨数据源' + (isValueNotEmpty ? '' : '，例如 "DRUID" "HIKARICP" 等'), false, '  '));
        case '@raw':
          return valuesIsNotString ? ' ! value必须是String类型！' : (isWarning ? '' : CodeUtil.getComment('原始SQL片段' + (isValueNotEmpty ? '，由后端 RAW_MAP 代码配置指定 "key0,key1.." 中每个 key 对应 key:"SQL片段" 中的 SQL片段' : '，例如 "@column" "id{},@having" 等'), false, '  '));
        case '@json':
          return valuesIsNotString ? ' ! value必须是String类型！' : (isWarning ? '' : CodeUtil.getComment('转为JSON' + (isValueNotEmpty ? '' : '，例如 "request" "gets,heads" 等'), false, '  '));
        case '@database':
          return CodeUtil.DATABASE_KEYS.indexOf(value) < 0 ? ' ! value必须是[' + CodeUtil.DATABASE_KEYS.join() + ']中的一种！' : (isWarning ? '' : CodeUtil.getComment('数据库类型：例如 "MYSQL" "POSTGRESQL" "SQLSERVER" "ORACLE" "DB2" "CLICKHOUSE" 等', false, '  '));
        case '@role':
          var role = CodeUtil.ROLES[value];
          return StringUtil.isEmpty(role) ? ' ! value必须是[' + CodeUtil.ROLE_KEYS.join() + ']中的一种！' : (isWarning ? '' : CodeUtil.getComment('来访角色：' + role + '，限制可操作的数据，假定真实强制匹配', false, '  '));
        case '@cache':
          var cache = CodeUtil.CACHE_TYPES[value];
          return StringUtil.isEmpty(cache) ? ' ! value必须是[' + CodeUtil.CACHE_TYPE_KEYS.join() + ']中的一种！' : (isWarning ? '' : CodeUtil.getComment('缓存方式：0-全部 1-磁盘 2-内存', false, '  '));
        case '@explain':
          return valuesIsNotBoolean ? ' ! value必须是Boolean类型！' : (isWarning ? '' : CodeUtil.getComment('性能分析：true-开启 false-关闭，返回执行的 SQL 及查询计划', false, '  '));
      }
      if (key.startsWith('@')) {
        if (key.endsWith('()')) {
          return valuesIsNotString ? ' ! value必须是String类型！' : (isWarning ? '' : CodeUtil.getComment('存储过程' + (isValueNotEmpty ? '，触发调用数据库存储过程' : '：例如 "getCommentByUserId(id,@limit,@offset)"'), false, '  '));
        }
        return '';
      }
      var c = CodeUtil.getCommentFromDoc(tableList, objName, key, method, database, language, isReq != true || isRestful, isReq, pathKeys, isRestful, value, null, null, null, isWarning);
      if (c.startsWith(' ! ')) {
        return c;
      }
      return StringUtil.isEmpty(c) ? ' ! 字段不存在！' : (isWarning ? '' : CodeUtil.getComment(c, false, '  '));
    }

    // alert('name = ' + name + '; key = ' + key);
    if (isRestful != true && StringUtil.isEmpty(name)) {
      switch (key) {
        case 'tag':
          return valuesIsNotString ? ' ! value必须是String类型！' : (isWarning ? '' : CodeUtil.getComment('请求标识' + (method == 'GET' || method == 'HEAD' ? '，GET,HEAD 请求不会自动解析，仅为后续迭代可能的手动优化而预留' : (isValueNotEmpty ? '，用来区分不同请求并校验，由后端 Request 表中指定' : '，例如 "User" "Comment[]" "Privacy-CIRCLE" 等')), false, '  '));
        case 'version':
          return valuesIsNotInteger ? ' ! value必须是Integer类型！' : (isWarning ? '' : CodeUtil.getComment('版本号' + (method == 'GET' || method == 'HEAD' ? '，GET,HEAD 请求不会自动解析，仅为后续迭代可能的手动优化而预留' : (isValueNotEmpty ? '，用来使用特定版本的校验规则，由后端 Request 表中指定' : '，例如 1 2 3 等')), false, '  '));
        case 'format':
          return valuesIsNotBoolean ? ' ! value必须是Boolean类型！' : (isWarning ? '' : CodeUtil.getComment('格式化: true-是 false-否，将 TableName 转为 tableName, TableName[] 转为 tableNameList, Table:alias 转为 alias 等小驼峰格式', false, '  '));
        case '@schema':
          return valuesIsNotString ? ' ! value必须是String类型！' : (isWarning ? '' : CodeUtil.getComment('集合空间(数据库名/模式)' + (isValueNotEmpty ? '' : '，例如 "sys" "apijson" "postgres" "dbo" 等'), false, '  '));
        case '@datasource':
          return valuesIsNotString ? ' ! value必须是String类型！' : (isWarning ? '' : CodeUtil.getComment('跨数据源' + (isValueNotEmpty ? '' : '，例如 "DRUID" "HIKARICP" 等'), false, '  '));
        case '@database':
          return CodeUtil.DATABASE_KEYS.indexOf(value) < 0 ? ' ! value必须是[' + CodeUtil.DATABASE_KEYS.join() + ']中的一种！' : (isWarning ? '' : CodeUtil.getComment('数据库' + (isValueNotEmpty ? '' : '，例如 "MYSQL" "POSTGRESQL" "SQLSERVER" "ORACLE" 等'), false, '  '));
        case '@role':
          var role = CodeUtil.ROLES[value];
          return StringUtil.isEmpty(role) ? ' ! value必须是[' + CodeUtil.ROLE_KEYS.join() + ']中的一种！' : (isWarning ? '' : CodeUtil.getComment('默认角色：' + role, false, '  '));
        case '@cache':
          var cache = CodeUtil.CACHE_TYPES[value];
          return StringUtil.isEmpty(cache) ? ' ! value必须是[' + CodeUtil.CACHE_TYPE_KEYS.join() + ']中的一种！' : (isWarning ? '' : CodeUtil.getComment('缓存方式：0-全部 1-磁盘 2-内存', false, '  '));
        case '@explain':
          return valuesIsNotBoolean ? ' ! value必须是Boolean类型！' : (isWarning ? '' : CodeUtil.getComment('性能分析：true-开启 false-关闭，返回执行的 SQL 及查询计划', false, '  '));
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
   * @param language
   * @param onlyTableAndColumn
   * @return {*}
   */
  getCommentFromDoc: function (tableList, tableName, columnName, method, database, language, onlyTableAndColumn, isReq, pathKeys, isRestful, value, ignoreError, standardObj, isSubquery, isWarning) {
    log('getCommentFromDoc  tableName = ' + tableName + '; columnName = ' + columnName
      + '; method = ' + method + '; database = ' + database + '; language = ' + language
      + '; onlyTableAndColumn = ' + onlyTableAndColumn + '; tableList = \n' + JSON.stringify(tableList));

    if (standardObj != null) {
      var targetObj = JSONResponse.getStandardByPath(standardObj, pathKeys);
      var t = targetObj == null ? null : targetObj.type;
      var targetComment = targetObj == null ? null : targetObj.comment;
      var c = targetObj == null ? null : CodeUtil.getType4Language(language, t, true) + (targetObj.notnull ? ', ' : '? ') + StringUtil.trim(targetComment);
      if (CodeUtil.isTypeMatch(t, CodeUtil.getType4Request(value))) {
        c = ' ! value必须是' + CodeUtil.getType4Language(language, t) + '类型！' + (isWarning ? ' ' : CodeUtil.getComment(c, false, '  '));
        if (ignoreError != true) {
          throw new Error(c);
        }

        if (isWarning) {
          return c;
        }
      }

      if (StringUtil.isEmpty(targetComment, true) == false) {  // 如果这里没注释就从数据库/第三方平台取
        return c;
      }
    }

    var typeOfValue = CodeUtil.getType4Request(value);
    var valuesIsNotString = typeOfValue != 'string';
    var valuesIsNotInteger = typeOfValue != 'integer';
    var valuesIsNotNumber = valuesIsNotInteger && typeOfValue != 'number';
    var valuesIsNotArray = typeOfValue != 'array';
    var valuesIsNotObject = typeOfValue != 'object';
    var valuesIsNotStringOrObject = valuesIsNotString && valuesIsNotObject;
    var valuesIsNotStringOrArray = valuesIsNotString && valuesIsNotArray;
    var valuesIsNotStringOrNumber = valuesIsNotString && valuesIsNotNumber;
    var valuesIsNotStringOrNumberOrObject = valuesIsNotStringOrNumber && valuesIsNotObject;
    var valuesIsNotStringOrArrayOrObject = valuesIsNotString && valuesIsNotArray && valuesIsNotObject;
    var isValueNotEmpty = valuesIsNotString ? (typeOfValue != 'array' ? value != null : value.length > 0) : StringUtil.isEmpty(value, true) != true;

    if (isRestful == true && StringUtil.isEmpty(columnName, true) == false && StringUtil.isEmpty(CodeUtil.thirdParty, true) == false) { // } && CodeUtil.thirdParty == 'YAPI') {
      var apiMap = CodeUtil.thirdPartyApiMap;
      if (apiMap == null) {
        // 用 下方 tableList 兜底  return isWarning ? ' ' : '...';
      }
      else {
        var api = apiMap[(method.startsWith('/') ? '' : '/') + method];
        var doc = api == null ? null : (isReq ? (api.request || api.parameters) : api.response);
        if (doc != null) {
          var parentDoc = api;

          if (pathKeys != null && pathKeys.length > 0) {
            for (var i = 0; i < pathKeys.length; i++) {
              var p = pathKeys[i];

              if (doc instanceof Array) {
                var find = false;
                for (var j = 0; j < doc.length; j++) {
                  var d = doc[j];
                  if (d != null && d.name == p) {
                    // parentDoc = doc;
                    doc = d;
                    find = true;
                    break;
                  }
                }

                if (find == false) {
                  doc = null;
                }
              }
              else if (doc instanceof Object) {
                if ((doc.type == 'object' || doc.type == null) && JSONResponse.getType(doc) == 'object') {
                  parentDoc = doc;
                  doc = doc.properties || parentDoc.parameters;
                }
                else if (doc.type == 'array') {
                  parentDoc = doc;
                  doc = doc.items;

                  try {
                    if (p != null && p != '' && Number.isNaN(+p)) {
                      i--;
                    }
                  } catch (e) {
                  }

                  continue;
                }

                if (doc.type != 'object') {
                  parentDoc = doc;
                }

                if (doc instanceof Array) {
                }
                else if (properties instanceof Object) {
                  doc = doc[p];
                }
              }
            }
          }
          else if (doc instanceof Array) {
            doc = null;
          }

          if (doc == null && parentDoc != null) {
            var properties = parentDoc.properties || parentDoc.parameters;
            var required = parentDoc.required;

            var cols = '';
            if (properties instanceof Array) {
              var first = true;
              for (var i = 0; i < properties.length; i ++) {

                var para = properties[i];
                var pn = para == null ? null : para.name;

                if (StringUtil.isEmpty(pn, true) == false) {
                  cols += (first ? '' : ',') + pn;
                  first = false;
                }
              }
            }
            else if (properties instanceof Object) {
              cols = Object.keys(properties).join();
            }

            var musts = required == null ? '' : required.join();

            return ' ! 字段 ' + columnName + ' 不存在！只能是 [' + cols + '] 中的一个！' + (StringUtil.isEmpty(musts, true) ? '' : '其中 [' + musts + '] 必传！');
          }

          var t = doc == null ? null : doc.type;
          var c = doc == null ? null : CodeUtil.getType4Language(language, t, true) + (doc.required ? ', ' : '? ') + StringUtil.trim(doc.description || doc.title);
          if (t == null) {
            // 避免崩溃
          }
          else if (t.endsWith('[]')) {
            t = 'array';
          }
          else if (t == 'integer') {
            t = 'number';
          }

          if (CodeUtil.isTypeMatch(t, CodeUtil.getType4Request(value))) {
            c = ' ! value必须是' + CodeUtil.getType4Language(language, t) + '类型！' + (isWarning ? ' ' : CodeUtil.getComment(c, false, '  '))
            if (ignoreError != true) {
              throw new Error(c);
            }
            return c;
          }
          else {
            if (c != null) {  // 可能存在但只是没注释  StringUtil.isEmpty(c, true) == false) {
              return isWarning ? ' ' : c;
            }
          }

        }

      }

    }

    if (tableList == null || tableList.length <= 0) {
      return isWarning ? ' ' : '...';
    }

    var item;

    var table;
    var columnList;
    var column;
    for (var i = 0; i < tableList.length; i++) {
      item = tableList[i];

      //Table
      table = item == null ? null : (database != 'SQLSERVER' ? item.Table : item.SysTable);
      if (table == null || tableName != CodeUtil.getModelName(table.table_name)) {
        continue;
      }
      log('getDoc [] for i=' + i + ': table = \n' + format(JSON.stringify(table)));

      if (StringUtil.isEmpty(columnName)) {
        return /*没必要，常识，太占地方，而且自动生成代码就有  CodeUtil.getType4Object(language) + ', ' + */ (
          database == 'POSTGRESQL'
            ? (item.PgClass || {}).table_comment
            : (database == 'SQLSERVER'
              ? (item.ExtendedProperty || {}).table_comment
              : table.table_comment
          )
        );
      }

      var at = '';
      var fun = '';
      var key;
      var logic = '';

      var verifyType = isSubquery != true && value != null;

      if (onlyTableAndColumn) {
        key = new String(columnName);
      }
      else {

        //功能符 <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

        if (columnName.endsWith("()")) {//方法，查询完后处理，先用一个Map<key,function>保存？
          if (['GET', 'HEAD'].indexOf(method) < 0) {
            return ' ! 远程函数只能用于 GET,HEAD 请求！！';
          }

          if (value != null && valuesIsNotString) {
            return ' ! value必须是String类型！';
          }
          if (value != null) {
            var startIndex = value.indexOf("(");
            if (startIndex <= 0 || value.endsWith(")") == false) {
              return ' ! value必须符合 fun(arg0,arg1..) 这种格式！且不要有任何多余的空格！';
            }
            var fun = value.substring(0, startIndex);
            if (StringUtil.isName(fun) != true) {
              return '! 函数名' + fun + '不合法！value必须符合 fun(arg0,arg1..) 这种格式！且不要有任何多余的空格！';
            }
          }

          if (isWarning) {
            return ' ';
          }

          var priority = '';
          if (columnName.endsWith("-()")) {
            priority = ' < 在解析所在对象前优先执行';
          }
          else if (columnName.endsWith("+()")) {
            priority = ' < 在解析所在对象后滞后执行';
          }
          else {
            priority = '，执行时机在解析所在对象后，解析子对象前，可以在 () 前用 + - 设置优先级，例如 key-() 优先执行';
          }

          return '远程函数' + (isValueNotEmpty ? '，触发调用后端对应的方法/函数' + priority : '，例如 "isContain(praiseUserIdList,userId)"');
        }

        var hasAt = false;
        if (columnName.endsWith("@")) {//引用，引用对象查询完后处理。fillTarget中暂时不用处理，因为非GET请求都是由给定的id确定，不需要引用
          // 没传 value 进来，不好解析，而且太长导致后面的字段属性被遮住
          // var lastIndex = value.lastIndexOf('/');
          // var refLastPath =
          // at = '引用赋值: ' + tableName + '.' + columnName + '=' + ;
          hasAt = true;

          at = '引用赋值' + (isValueNotEmpty ? (value.startsWith('/') ? '，从对象父级开始的相对(缺省)路径' : '，从最外层开始的绝对(完整)路径') : '，例如 "User/id" "[]/Moment/id" 等');
          columnName = columnName.substring(0, columnName.length - 1);

          if (value != null && valuesIsNotStringOrObject) {
            return ' ! value必须是String或Object类型！';
          }

          verifyType = false;
        }

        if (columnName.endsWith("$")) {//搜索，查询时处理
          if (verifyType && hasAt != true && valuesIsNotStringOrArray) {
              return ' ! value必须是String或Array类型！';
            }

          fun = '模糊搜索' + (isValueNotEmpty ? '' : '，例如 "%c%" "S%" "%end" 等');
          key = columnName.substring(0, columnName.length - 1);
        }
        else if (columnName.endsWith("~")) {//匹配正则表达式，查询时处理
          if (verifyType && hasAt != true && valuesIsNotStringOrArray) {
            return ' ! value必须是String或Array类型！';
          }

          fun = '正则匹配' + (isValueNotEmpty ? '' : '，例如 "C" "^[0-9]+$" "^[a-zA-Z]+$" 等');
          key = columnName.substring(0, columnName.length - 1);
          if (key.endsWith("*")) {
            key = key.substring(0, key.length - 1);
            fun += '(忽略大小写)';
          }
        }
        else if (columnName.endsWith("%")) {//连续范围 BETWEEN AND，查询时处理
          if (verifyType && hasAt != true && valuesIsNotStringOrArray) {
            return ' ! value必须是String或Array类型！';
          }

          fun = '连续范围' + (isValueNotEmpty ? '' : '，例如 "82001,82020" "2018-01-01,2020-01-01" ["1-10", "90-100"] 等');
          key = columnName.substring(0, columnName.length - 1);
        }
        else if (columnName.endsWith("{}")) {//被包含，或者说key对应值处于value的范围内。查询时处理
          if (verifyType && hasAt != true && valuesIsNotStringOrArray) {
            return ' ! value必须是String或Array类型！';
          }

          fun = '匹配 选项/条件' + (isValueNotEmpty ? '' : '，例如 ' + (valuesIsNotString ? '[1, 2, 3] ["%c%", "S%", "%end"] 等' : '">100" "%2=0;<=100000" 等'));
          key = columnName.substring(0, columnName.length - 2);

          verifyType = false;
        }
        else if (columnName.endsWith("<>")) {//包含，或者说value处于key对应值的范围内。查询时处理
          fun = '包含选项' + (isValueNotEmpty ? '' : '，例如 1 "Test" [82001, 82002] 等');
          key = columnName.substring(0, columnName.length - 2);

          verifyType = false;
        }
        else if (columnName.endsWith("}{")) {//存在，EXISTS。查询时处理
          if (verifyType && hasAt != true && isSubquery != true) {
            return ' ! key}{ 后面必须接 @，写成 key}{@:{} 格式！';
          }
          if (verifyType && valuesIsNotObject) {
            return ' ! value必须是Object类型！';
          }

          fun = '是否存在' + (isValueNotEmpty ? '' : '，例如 { "from":"Comment", "Comment":{ "@column":"userId" } }');
          key = columnName.substring(0, columnName.length - 2);

          verifyType = false;
        }
        else if (columnName.endsWith("+")) {//延长，PUT查询时处理
          if (method != 'PUT') {//不为PUT就抛异常
            return ' ! 功能符 + - 只能用于PUT请求！';
          }
          fun = '增加/扩展' + (isValueNotEmpty ? '' : '，例如 1 9.9 "a" [82001, 82002] 等');
          key = columnName.substring(0, columnName.length - 1);
        }
        else if (columnName.endsWith("-")) {//缩减，PUT查询时处理
          if (method != 'PUT') {//不为PUT就抛异常
            return ' ! 功能符 + - 只能用于PUT请求！';
          }
          fun = '减少/去除' + (isValueNotEmpty ? '' : '，例如 1 9.9 "a" [82001, 82002] 等');
          key = columnName.substring(0, columnName.length - 1);
        }
        else if (columnName.endsWith(">=")) {//大于或等于
          if (verifyType && hasAt != true && valuesIsNotStringOrNumber) {
            return ' ! value必须是String或Number类型！';
          }

          fun = '大于或等于' + (isValueNotEmpty ? '' : '，例如 1 9.9 "2020-01-01" 等');
          key = columnName.substring(0, columnName.length - 2);
        }
        else if (columnName.endsWith("<=")) {//小于或等于
          if (verifyType && hasAt != true && valuesIsNotStringOrNumber) {
            return ' ! value必须是String或Number类型！';
          }

          fun = '小于或等于' + (isValueNotEmpty ? '' : '，例如 1 9.9 "2020-01-01" 等');
          key = columnName.substring(0, columnName.length - 2);
        }
        else if (columnName.endsWith(">")) {//大于
          if (verifyType && hasAt != true && valuesIsNotStringOrNumber) {
            return ' ! value必须是String或Number类型！';
          }

          fun = '大于' + (isValueNotEmpty ? '' : '，例如 1 9.9 "2020-01-01" 等');
          key = columnName.substring(0, columnName.length - 1);
        }
        else if (columnName.endsWith("<")) {//小于
          if (verifyType && hasAt != true && valuesIsNotStringOrNumber) {
            return ' ! value必须是String或Number类型！';
          }

          fun = '小于' + (isValueNotEmpty ? '' : '，例如 1 9.9 "2020-01-01" 等');
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
          if (['GET', 'HEAD', 'GETS', 'HEADS', 'PUT', 'DELETE'].indexOf(method) < 0) {//逻辑运算符仅供GET,HEAD方法使用
            return ' ! 逻辑运算符 & | ! 只能用于 GET,HEAD,GETS,HEADS,PUT,DELETE 请求！';
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
      var columnNames = []
      for (var j = 0; j < columnList.length; j++) {
        column = (columnList[j] || {}).Column;
        name = column == null ? null : column.column_name;
        if (name == null || key != name) {
          if (name != null) {
            columnNames.push(name)
          }
          continue;
        }

        var p = (at.length <= 0 ? '' : at + ' < ')
          + (fun.length <= 0 ? '' : fun + ' < ')
          + (logic.length <= 0 ? '' : logic + ' < ');

        var o = database == 'POSTGRESQL'
          ? (columnList[j] || {}).PgAttribute
          : (database == 'SQLSERVER'
              ? (columnList[j] || {}).ExtendedProperty
              : column
          );

        column.column_type = CodeUtil.getColumnType(column, database);
        var t = CodeUtil.getType4Language(language, column.column_type, true);
        var c = (p.length <= 0 ? '' : p + key + ': ') + t + (column.is_nullable == 'YES' ? '? ' : ', ') + (o || {}).column_comment;

        var ct = CodeUtil.getType4Language(CodeUtil.LANGUAGE_JAVA_SCRIPT, column.column_type, false);
        if (verifyType && t != null && CodeUtil.isTypeMatch(ct, CodeUtil.getType4Language(CodeUtil.LANGUAGE_JAVA_SCRIPT, typeOfValue))) {
          // c = ' ! value必须是' + t + '类型！' + CodeUtil.getComment(c, false, '  ')
          // if (ignoreError != true) {
          //   throw new Error(c);
          // }
          return ' ! value必须是' + t + '类型！' + (isWarning ? ' ' : CodeUtil.getComment(c, false, '  '));
        }

        return isWarning ? ' ' : c;
      }

      return onlyTableAndColumn ? '' : ' ! 字段 ' + key + ' 不存在！只能是 [' + columnNames.join() + '] 中的一个！';
    }

    return '';
  },

  getType4Request: function (value) {
    // return t != 'string' ? t : typeof JSON.parse(value);
    if (value instanceof Array) {
      return 'array'
    }
    if (Number.isInteger(value)) {
      return 'integer';
    }
    return typeof value;
  },

  isTypeMatch(targetType, realType) {
    return StringUtil.isEmpty(targetType, true) == false && targetType != realType && (targetType != 'number' || realType != 'integer');
  }

}
