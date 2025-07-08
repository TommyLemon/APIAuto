
(function () {
  const DEBUG = false // true
  const IS_NODE = typeof window == 'undefined'
  const IS_BROWSER = typeof window == 'object'

  if (IS_NODE) {  // 解决在 Node 环境下缺少相关变量/常量/函数导致报错
    try {
      eval(`
        var alert = function(msg) {console.log('alert: ' + msg)};
        // var console = {log: function(msg) {}};

        var vUrl = {value: 'http://localhost:8080/get'};
        var vUrlComment = {value: ''};
        var vTransfer = {value: '', disabled: false};
        var vType = {value: 'JSON'};
        var vSend = {value: '', disabled: false};

        var vInput = {value: ''};
        var vWarning = {value: ''};
        var vComment = {value: ''};
        var vHeader = {value: ''};
        var vRandom = {value: ''};
        var vScript = {value: ''};
        var vOutput = {value: ''};

        var vAccount = {value: ''};
        var vPassword = {value: ''};
        var vVerify = {value: ''};
        var vRemember = {checked: true}

        var vRequestMarkdown = {value: ''};
        var vMarkdown = {value: ''};
        var vPage = {value: '0'};
        var vCount = {value: '100'};
        var vSearch = {value: ''};
        var vTestCasePage = {value: '0'};
        var vTestCaseCount = {value: '100'};
        var vTestCaseSearch = {value: ''};
        var vRandomPage = {value: '0'};
        var vRandomCount = {value: '100'};
        var vRandomSearch = {value: ''};
        var vRandomSubPage = {value: '0'};
        var vRandomSubCount = {value: '100'};
        var vRandomSubSearch = {value: ''};

        var Vue = require('./vue.min'); // 某些版本不兼容 require('vue');
        var StringUtil = require('../apijson/StringUtil');
        var CodeUtil = require('../apijson/CodeUtil');
        var JSONObject = require('../apijson/JSONObject');
        var JSONResponse = require('../apijson/JSONResponse');
        var JSONRequest = require('../apijson/JSONRequest');
        var localforage = require('./localforage.min');
        var clipboard = require('./clipboard.min');
        var jsonlint = require('./jsonlint');
        var JSON5 = require('json5');
        // var window = {};
        // var $ = require('./jquery').jQuery;
        // var $ = {
        //   isEmptyObject: function (obj) {
        //     return obj == null || Object.keys(obj).length <= 0;
        //   }
        // };

        // var LocalStorage = require('node-localstorage').LocalStorage;
        // var localStorage = new LocalStorage('./scratch');
        var localStorage = {
          getItem: function (key) {},
          setItem: function (key, value) {}
        }
        // var difflib = require('./difflib');
        // var diffview = require('./diffview');
        // var editor = require('./editor');
        // var FileSaver = require('./FileSaver');
        // var helper = require('./helper');
        // var jquery = require('./jquery');
        // var jsonlint = require('./jsonlint');
        // var parse = require('./parse');
        // var uuid = require('./uuid');

        var axios = require('axios');
        var editormd = null;
      `)
    } catch (e) {
      console.log(e)
    }
  }

  function log(msg) {
    if (DEBUG) {
      console.log(msg)
    }
  }

  Vue.component('vue-item', {
    props: ['jsondata', 'theme', 'thiz'],
    template: '#item-template'
  })

  Vue.component('vue-outer', {
    props: ['jsondata', 'isend', 'thiz', 'path', 'theme'],
    template: '#outer-template'
  })

  Vue.component('vue-expand', {
    props: [],
    template: '#expand-template'
  })

  Vue.component('vue-val', {
    props: ['field', 'val', 'isend', 'thiz', 'path', 'theme'],
    template: '#val-template'
  })

  Vue.use({
    install: function (Vue, options) {

      // 判断数据类型
      Vue.prototype.getTyp = function (val) {
        return toString.call(val).split(']')[0].split(' ')[1]
      }

      // 判断是否是对象或者数组，以对下级进行渲染
      Vue.prototype.isObjectArr = function (val) {
        return ['Object', 'Array'].indexOf(this.getTyp(val)) > -1
      }

      // 折叠
      Vue.prototype.fold = function ($event) {
        var target = Vue.prototype.expandTarget($event)
        target.siblings('svg').show()
        target.hide().parent().siblings('.expand-view').hide()
        target.parent().siblings('.fold-view').show()
      }
      // 展开
      Vue.prototype.expand = function ($event) {
        var target = Vue.prototype.expandTarget($event)
        target.siblings('svg').show()
        target.hide().parent().siblings('.expand-view').show()
        target.parent().siblings('.fold-view').hide()
      }

      //获取展开折叠的target
      Vue.prototype.expandTarget = function ($event) {
        switch($event.target.tagName.toLowerCase()) {
          case 'use':
            return $($event.target).parent()
          case 'label':
            return $($event.target).closest('.fold-view').siblings('.expand-wraper').find('.icon-square-plus').first()
          default:
            return $($event.target)
        }
      }

      // 格式化值
      Vue.prototype.formatVal = function (val) {
        switch(Vue.prototype.getTyp(val)) {
          case 'String':
            return '"' + val + '"'
          case 'Null':
            return 'null'
          default:
            return val
        }
      }

      // 判断值是否是链接
      Vue.prototype.isaLink = function (val) {
        return /^((https|http|ftp|rtsp|mms)?:\/\/)[^\s]+/.test(val)
      }

      // 计算对象的长度
      Vue.prototype.objLength = function (obj) {
        return Object.keys(obj).length
      }

      /**渲染 JSON key:value 项
       * @author TommyLemon
       * @param val
       * @param key
       * @return {boolean}
       */
      Vue.prototype.onRenderJSONItem = function (val, key, path) {
        if (isSingle || key == null) {
          return true
        }
        if (key == '_$_this_$_') {
          // return true
          return false
        }

        var method = App.getMethod();
        var isRestful = ! JSONObject.isAPIJSONPath(method);

        try {
          if (val instanceof Array) {
              // alert('onRenderJSONItem  key = ' + key + '; val = ' + JSON.stringify(val))

              var ckey = key == null ? null : key.substring(0, key.lastIndexOf('[]'));

              var aliaIndex = ckey == null ? -1 : ckey.indexOf(':');
              var objName = aliaIndex < 0 ? ckey : ckey.substring(0, aliaIndex);

              var firstIndex = objName == null ? -1 : objName.indexOf('-');
              var firstKey = firstIndex < 0 ? objName : objName.substring(0, firstIndex);

              for (var i = 0; i < val.length; i++) {
                var cPath = (StringUtil.isEmpty(path, false) ? '' : path + '/') + key;

                var vi = val[i]

                if (JSONResponse.isObject(vi) && JSONObject.isTableKey(firstKey || '', vi, isRestful)) {
                  // var newVal = parseJSON(JSON.stringify(val[i]))
                  if (vi == null) {
                    continue
                  }

                  var curPath = cPath + '/' + i;
                  var curTable = firstKey;
                  var thiz = {
                    _$_path_$_: curPath,
                    _$_table_$_: curTable
                  };

                  var newVal = {};
                  for (var k in vi) {
                    newVal[k] = vi[k]; //提升性能
                    if (App.isFullAssert) {
                        try {
                          var cri = App.currentRemoteItem || {};
                          var tr = cri.TestRecord || {};
                          var d = cri.Document || {};
                          var standard = App.isMLEnabled ? tr.standard : tr.response;
                          var standardObj = StringUtil.isEmpty(standard, true) ? null : parseJSON(standard);
                          var tests = App.tests[String(App.currentAccountIndex)] || {};
                          var responseObj = (tests[d.id] || {})[0]

                          var pathUri = (StringUtil.isEmpty(curPath, false) ? '' : curPath + '/') + k;
                          var pathKeys = StringUtil.split(pathUri, '/');
                          var target = App.isMLEnabled ? JSONResponse.getStandardByPath(standardObj, pathKeys) : JSONResponse.getValByPath(standardObj, pathKeys);
                          var real = JSONResponse.getValByPath(responseObj, pathKeys);
                          var cmp = App.isMLEnabled ? JSONResponse.compareWithStandard(target, real, pathUri) : JSONResponse.compareWithBefore(target, real, pathUri);
//                          cmp.path = pathUri;
                          var cmpShowObj = JSONResponse.getCompareShowObj(cmp);
                          thiz[k] = [cmpShowObj.compareType, cmpShowObj.compareColor, cmpShowObj.compareMessage];
                          var countKey = '_$_' + cmpShowObj.compareColor + 'Count_$_';
                          thiz[countKey] = thiz[countKey] == null ? 1 : thiz[countKey] + 1;
                        } catch (e) {
                          thiz[k] = [JSONResponse.COMPARE_ERROR, 'red', e.message];
                          var countKey = '_$_redCount_$_';
                          thiz[countKey] = thiz[countKey] == null ? 1 : thiz[countKey] + 1;
                        }
                    }

                    delete vi[k]
                  }

                  vi._$_this_$_ = JSON.stringify(thiz)
                  for (var k in newVal) {
                    vi[k] = newVal[k]
                  }
                }
                else {
                  this.onRenderJSONItem(vi, '' + i, cPath);
                }

                // this.$children[i]._$_this_$_ = key
                // alert('this.$children[i]._$_this_$_ = ' + this.$children[i]._$_this_$_)
              }
          }
          else if (val instanceof Object) {
            var aliaIndex = key == null ? -1 : key.indexOf(':');
            var objName = aliaIndex < 0 ? key : key.substring(0, aliaIndex);

            // var newVal = parseJSON(JSON.stringify(val))

            var curPath = (StringUtil.isEmpty(path, false) ? '' : path + '/') + key;
            var curTable = JSONObject.isTableKey(objName, val, isRestful) ? objName : null;
            var thiz = {
              _$_path_$_: curPath,
              _$_table_$_: curTable
            };

            var newVal = {};
            for (var k in val) {
              newVal[k] = val[k]; //提升性能
              if (App.isFullAssert) {
                  try {
                    var cri = App.currentRemoteItem || {};
                    var tr = cri.TestRecord || {};
                    var d = cri.Document || {};
                    var standard = App.isMLEnabled ? tr.standard : tr.response;
                    var standardObj = StringUtil.isEmpty(standard, true) ? null : parseJSON(standard);
                    var tests = App.tests[String(App.currentAccountIndex)] || {};
                    var responseObj = (tests[d.id] || {})[0]

                    var pathUri = (StringUtil.isEmpty(curPath, false) ? '' : curPath + '/') + k;
                    var pathKeys = StringUtil.split(pathUri, '/');
                    var target = App.isMLEnabled ? JSONResponse.getStandardByPath(standardObj, pathKeys) : JSONResponse.getValByPath(standardObj, pathKeys);
                    var real = JSONResponse.getValByPath(responseObj, pathKeys);
            //              c = JSONResponse.compareWithBefore(target, real, path);
                    var cmp = App.isMLEnabled ? JSONResponse.compareWithStandard(target, real, pathUri) : JSONResponse.compareWithBefore(target, real, pathUri);
//                    cmp.path = pathUri;
                    var cmpShowObj = JSONResponse.getCompareShowObj(cmp);
                    thiz[k] = [cmpShowObj.compareType, cmpShowObj.compareColor, cmpShowObj.compareMessage];
                    var countKey = '_$_' + cmpShowObj.compareColor + 'Count_$_';
                    thiz[countKey] = thiz[countKey] == null ? 1 : thiz[countKey] + 1;
                  } catch (e) {
                    thiz[k] = [JSONResponse.COMPARE_ERROR, 'red', e.message];
                    var countKey = '_$_redCount_$_';
                    thiz[countKey] = thiz[countKey] == null ? 1 : thiz[countKey] + 1;
                  }
              }

              delete val[k];
            }

            val._$_this_$_ = JSON.stringify(thiz)
            for (var k in newVal) {
              val[k] = newVal[k];
            }

            // val = Object.assign({ _$_this_$_: objName }, val) //解决多显示一个逗号 ,

            // this._$_this_$_ = key  TODO  不影响 JSON 的方式，直接在组件读写属性
            // alert('this._$_this_$_ = ' + this._$_this_$_)
          }

        } catch (e) {
          if (DEBUG) {
            alert('onRenderJSONItem  try { ... } catch (e) {\n' + e.message)
          } else {
            console.log(e)
          }
        }

        return true

      }


      /**显示 Response JSON 的注释
       * @author TommyLemon
       * @param val
       * @param key
       * @param $event
       */
      Vue.prototype.setResponseHint = function (val, key, $event, isAssert, color) {
        console.log('setResponseHint')
        this.$refs.responseKey.setAttribute('data-hint', isSingle ? '' : this.getResponseHint(val, key, $event, isAssert, color));
      }
      /**获取 Response JSON 的注释
       * 方案一：
       * 拿到父组件的 key，逐层向下传递
       * 问题：拿不到爷爷组件 "Comment[]": [ { "id": 1, "content": "content1" }, { "id": 2 }... ]
       *
       * 方案二：
       * 改写 jsonon 的 refKey 为 key0/key1/.../refKey
       * 问题：遍历，改 key；容易和特殊情况下返回的同样格式的字段冲突
       *
       * 方案三：
       * 改写 jsonon 的结构，val 里加 .path 或 $.path 之类的隐藏字段
       * 问题：遍历，改 key；容易和特殊情况下返回的同样格式的字段冲突
       *
       * @author TommyLemon
       * @param val
       * @param key
       * @param $event
       */
      Vue.prototype.getResponseHint = function (val, key, $event, isAssert, color) {
        // alert('setResponseHint  key = ' + key + '; val = ' + JSON.stringify(val))

        var s = ''

        try {
          var standardObj = null;
          try {
            var currentItem = App.isTestCaseShow ? App.remotes[App.currentDocIndex] : App.currentRemoteItem;
            standardObj = parseJSON(((currentItem || {}).TestRecord || {}).standard);
          } catch (e3) {
            log(e3)
          }

          var path = null
          var table = null
          var column = null

          var method = App.isTestCaseShow ? ((App.currentRemoteItem || {}).Document || {}).url : App.getMethod();
          var isRestful = ! JSONObject.isAPIJSONPath(method);

          if (val instanceof Object && (val instanceof Array == false)) {

            var parent = $event.currentTarget.parentElement.parentElement
            var valString = parent.textContent

            // alert('valString = ' + valString)

            var i = valString.indexOf('"_$_this_$_":')
            if (i >= 0) {
              valString = valString.substring(i + '"_$_this_$_":'.length)
              i = valString.indexOf('}"')
              var i2 = valString.indexOf('"{')
              if (i >= 0 && i2 >= 0 && i2 < i) {
                valString = valString.substring(i2 + 1, i + 1)
                // alert('valString = ' + valString)
                var _$_this_$_ = parseJSON(valString) || {}
                path = _$_this_$_._$_path_$_
                table = _$_this_$_._$_table_$_
              }

              var aliaIndex = key == null ? -1 : key.indexOf(':');
              var objName = aliaIndex < 0 ? key : key.substring(0, aliaIndex);

              if (JSONObject.isTableKey(objName, val, isRestful)) {
                table = objName
              }
              else if (JSONObject.isTableKey(table, val, isRestful)) {
                column = key
              }

              // alert('path = ' + path + '; table = ' + table + '; column = ' + column)
            }
          }
          else {
            var parent = $event.currentTarget.parentElement.parentElement
            var valString = parent.textContent

            // alert('valString = ' + valString)

            var i = valString.indexOf('"_$_this_$_":')
            if (i >= 0) {
              valString = valString.substring(i + '"_$_this_$_":'.length)
              i = valString.indexOf('}"')
              var i2 = valString.indexOf('"{')
              if (i >= 0 && i2 >= 0 && i2 < i) {
                valString = valString.substring(i2 + 1, i + 1)
                // alert('valString = ' + valString)
                var _$_this_$_ = parseJSON(valString) || {}
                path = _$_this_$_ == null ? '' : _$_this_$_._$_path_$_
                table = _$_this_$_ == null ? '' : _$_this_$_._$_table_$_
              }
            }

            if (val instanceof Array && JSONObject.isArrayKey(key, val, isRestful)) {
              var key2 = key == null ? null : key.substring(0, key.lastIndexOf('[]'));

              var aliaIndex = key2 == null ? -1 : key2.indexOf(':');
              var objName = aliaIndex < 0 ? key2 : key2.substring(0, aliaIndex);

              var firstIndex = objName == null ? -1 : objName.indexOf('-');
              var firstKey = firstIndex < 0 ? objName : objName.substring(0, firstIndex);

              // alert('key = ' + key + '; firstKey = ' + firstKey + '; firstIndex = ' + firstIndex)
              if (JSONObject.isTableKey(firstKey || '', null, isRestful)) {
                table = firstKey

                var s0 = '';
                if (firstIndex > 0) {
                  objName = objName.substring(firstIndex + 1);
                  firstIndex = objName.indexOf('-');
                  column = firstIndex < 0 ? objName : objName.substring(0, firstIndex)

                  var pathUri = (StringUtil.isEmpty(path) ? '' : path + '/') + key;

                  var c = CodeUtil.getCommentFromDoc(docObj == null ? null : docObj['[]'], table, column, method, App.database, App.language, true, false, pathUri.split('/'), isRestful, val, true, standardObj); // this.getResponseHint({}, table, $event
                  s0 = column + (StringUtil.isEmpty(c, true) ? '' : ': ' + c)
                }

                var pathUri = (StringUtil.isEmpty(path) ? '' : path + '/') + (StringUtil.isEmpty(column) ? key : column);
                var c;
                if (isAssert) {
                    try {
                      var tr = App.currentRemoteItem.TestRecord || {};
                      var d = App.currentRemoteItem.Document || {};
                      var standard = App.isMLEnabled ? tr.standard : tr.response;
                      var standardObj = StringUtil.isEmpty(standard, true) ? null : parseJSON(standard);
                      var tests = App.tests[String(App.currentAccountIndex)] || {};
                      var responseObj = (tests[d.id] || {})[0]

                      var pathKeys = StringUtil.split(pathUri, '/');
                      var target = App.isMLEnabled ? JSONResponse.getStandardByPath(standardObj, pathKeys) : JSONResponse.getValByPath(standardObj, pathKeys);
                      var real = JSONResponse.getValByPath(responseObj, pathKeys);
        //              c = JSONResponse.compareWithBefore(target, real, path);
                      var cmp = App.isMLEnabled ? JSONResponse.compareWithStandard(target, real, path) : JSONResponse.compareWithBefore(target, real, path);
//                      cmp.path = pathUri;
                      return JSONResponse.getCompareShowObj(cmp);
                    } catch (e) {
                      s += '\n' + e.message
                    }
                } else {
                    c = CodeUtil.getCommentFromDoc(docObj == null ? null : docObj['[]'], table, isRestful ? key : null, method, App.database, App.language, true, false, pathUri.split('/'), isRestful, val, true, standardObj);
                }

                s = (StringUtil.isEmpty(path) ? '' : path + '/') + key + ' 中 '
                  + (
                    StringUtil.isEmpty(c, true) ? '' : table + ': '
                      + c + ((StringUtil.isEmpty(s0, true) ? '' : '  -  ' + s0) )
                  );

                return s;
              }
              //导致 key[] 的 hint 显示为  key[]key[]   else {
              //   s = (StringUtil.isEmpty(path) ? '' : path + '/') + key
              // }
            }
            else {
              if (isRestful || JSONObject.isTableKey(table)) {
                column = key
              }
              // alert('path = ' + path + '; table = ' + table + '; column = ' + column)
            }
          }
          // alert('setResponseHint  table = ' + table + '; column = ' + column)

          var pathUri = (StringUtil.isEmpty(path) ? '' : path + '/') + key;
          var c;
          if (isAssert) {
            try {
              var tr = App.currentRemoteItem.TestRecord || {};
              var d = App.currentRemoteItem.Document || {};
              var standard = App.isMLEnabled ? tr.standard : tr.response;
              var standardObj = StringUtil.isEmpty(standard, true) ? null : parseJSON(standard);
              var tests = App.tests[String(App.currentAccountIndex)] || {};
              var responseObj = (tests[d.id] || {})[0]

              var pathKeys = StringUtil.split(pathUri, '/');
              var target = App.isMLEnabled ? JSONResponse.getStandardByPath(standardObj, pathKeys) : JSONResponse.getValByPath(standardObj, pathKeys);
              var real = JSONResponse.getValByPath(responseObj, pathKeys);
//              c = JSONResponse.compareWithBefore(target, real, path);
              var cmp = App.isMLEnabled ? JSONResponse.compareWithStandard(target, real, path) : JSONResponse.compareWithBefore(target, real, path);
//              cmp.path = pathUri;
              return JSONResponse.getCompareShowObj(cmp);
            } catch (e) {
              s += '\n' + e.message
            }
          } else {
            c = CodeUtil.getCommentFromDoc(docObj == null ? null : docObj['[]'], table, isRestful ? key : column, method, App.database, App.language, true, false, pathUri.split('/'), isRestful, val, true, standardObj);
          }

          s += pathUri + (StringUtil.isEmpty(c, true) ? '' : ': ' + c)
        }
        catch (e) {
          s += '\n' + e.message
        }

        return s;
      },

      /**显示 Response JSON 的注释
       * @author TommyLemon
       * @param val
       * @param key
       * @param $event
       */
      Vue.prototype.setResponseCounts = function (val, key, $event, isAssert) {
        console.log('setResponseCounts')
        this.$refs.responseGreenAssert.setAttribute('data-content', isSingle ? '' : this.getResponseGreenCount(val, key, $event));
        this.$refs.responseBlueAssert.setAttribute('data-content', isSingle ? '' : this.getResponseBlueCount(val, key, $event));
        this.$refs.responseOrangeAssert.setAttribute('data-content', isSingle ? '' : this.getResponseOrangeCount(val, key, $event));
        this.$refs.responseRedAssert.setAttribute('data-content', isSingle ? '' : this.getResponseRedCount(val, key, $event));
      },
      /**获取 Response 断言失败 的数量
       * @author TommyLemon
       * @param val
       * @param key
       * @param $event
       */
      Vue.prototype.setResponseAllCount = function (val, key, $event) {
        return this.setResponseHint(val, key, $event, true, 'all')
      },
      /**获取 Response 断言失败 的数量
       * @author TommyLemon
       * @param val
       * @param key
       * @param $event
       */
      Vue.prototype.getResponseAllCount = function (val, key, $event) {
        return this.getResponseGreenCount(val, key, $event) + this.getResponseBlueCount(val, key, $event) + this.getResponseOrangeCount(val, key, $event) + this.getResponseRedCount(val, key, $event);
      },
      Vue.prototype.setResponseColorCount = function (val, key, $event) {
        console.log('setResponseColorCount')
        var assert = isSingle ? null : this.getResponseHint(val, key, $event, true, 'all')
        var responseAssert = $event.target; // this.$refs.responseAssert
//        responseAssert.innerText = (StringUtil.trim(assert.count) || '1');
//        $(responseAssert).attr('data-hint', assert == null ? '' : StringUtil.trim(assert.hintMessage));
//        responseAssert.setAttribute('data-content', assert == null ? '' : (StringUtil.trim(assert.count) || '1'));
        responseAssert.setAttribute('data-hint', assert == null ? '' : StringUtil.trim(assert.compareMessage));
//        $(responseAssert).attr('background', assert == null ? '' : assert.compareColor);
//        $(responseAssert).attr('visibility', assert == null || assert.code == 0 ? 'hidden' : 'show');
      },
      Vue.prototype.setResponseCount = function (val, key, $event, color) {
        console.log('setResponseCount')
//        var count = isSingle ? 0 : this.getResponseCount(val, key, $event, color)
        var assert = isSingle ? null : this.getResponseHint(val, key, $event, true, 'all')
        var responseAssert = $event.target; // this.$refs['response' + StringUtil.firstCase(color, true) + 'Assert']
//        responseAssert.innerText = (StringUtil.trim(assert.count) || '1');
        $(responseAssert).attr('data-hint', assert == null ? '' : StringUtil.trim(assert.compareMessage));
//        responseAssert.setAttribute('data-content', assert == null ? '' : (StringUtil.trim(assert.count) || '1'));
//        responseAssert.setAttribute('data-hint', assert == null ? '' : StringUtil.trim(assert.hintMessage));
//        $(responseAssert).attr('background', assert == null ? '' : assert.compareColor);
//        $(responseAssert).attr('visibility', assert == null || assert.code == 0 ? 'hidden' : 'show');
      },
      Vue.prototype.getResponseCount = function (val, key, $event, color) {
        return this.getResponseHint(val, key, $event, true, color)
      },
      Vue.prototype.setResponseGreenCount = function (val, key, $event, isAssert) {
        this.setResponseCount(val, key, $event, 'green')
      },
      Vue.prototype.getResponseGreenCount = function (val, key, $event) {
        return this.getResponseHint(val, key, $event, true, 'green')
      },
      Vue.prototype.setResponseBlueCount = function (val, key, $event, isAssert) {
        this.setResponseCount(val, key, $event, 'blue')
      },
      Vue.prototype.getResponseBlueCount = function (val, key, $event) {
        return this.getResponseHint(val, key, $event, true, 'blue')
      },
      Vue.prototype.setResponseOrangeCount = function (val, key, $event, isAssert) {
        this.setResponseCount(val, key, $event, 'orange')
      },
      Vue.prototype.getResponseOrangeCount = function (val, key, $event) {
        return this.getResponseHint(val, key, $event, true, 'orange')
      },
      Vue.prototype.setResponseRedCount = function (val, key, $event, isAssert) {
        this.setResponseCount(val, key, $event, 'red')
      },
      Vue.prototype.getResponseRedCount = function (val, key, $event) {
        return this.getResponseHint(val, key, $event, true, 'red')
      }
    }
  })


  var initJson = {}

// 主题 [key, String, Number, Boolean, Null, link-link, link-hover]
  var themes = [
    ['#92278f', '#3ab54a', '#25aae2', '#f3934e', '#f34e5c', '#717171'],
    ['rgb(19, 158, 170)', '#cf9f19', '#ec4040', '#7cc500', 'rgb(211, 118, 126)', 'rgb(15, 189, 170)'],
    ['#886', '#25aae2', '#e60fc2', '#f43041', 'rgb(180, 83, 244)', 'rgb(148, 164, 13)'],
    ['rgb(97, 97, 102)', '#cf4c74', '#20a0d5', '#cd1bc4', '#c1b8b9', 'rgb(25, 8, 174)']
  ]




// APIJSON <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

  var ERR_MSG = `出现了一些问题，可以按照以下步骤解决：
1.检查网络连接是否畅通，可用浏览器打开右侧地址： https://www.baidu.com/s?wd=%22APIJSON%22
2.检查 URL 是否为一个可用的 域名/IPV4 地址，可用浏览器打开试试：正常返回结果 或 非 GET 请求返回 Whitelabel Error Page，一般都没问题
3.开启或关闭 右上方 设置>托管服务器代理，然后再试：如果开启后才通应该是 CORS 跨域问题；关闭后才通应该是用外网服务代理来访问内网导致，可退出登录后修改退关服务器地址为内网的 APIJSON 代理服务地址
4.Disable 关闭 VPN 等 电脑/手机/平板 上的网络代理软件 App 客户端，或者切换代理服务器地址，然后再试
5.按 Fn+F12 或 右键网页>Inspect 检查 查看 Network 接口调用信息和 Console 控制台日志
6.查看请求目标服务器上的日志，优先找异常报错内容
7.改用 Postman 等其它 HTTP API 接口工具测试同一个接口
8.再试一次

# 问题与解答大全(可截屏后 New issue 上报问题等待解答)：
https://github.com/TommyLemon/APIAuto/issues

如果是请求 APIJSON 后端服务，则使用以下链接：
https://github.com/Tencent/APIJSON/issues

There may be something wrong, you can follow by the steps:
1. Check whether the network connection is available, you can open the address with a browser: https://www.google.com/search?q=%22APIJSON%22
2. Check whether the URL is an available domain name/IPV4 address, try opening it with a browser: if return the result normally or return a Whitelabel Error Page for a non-GET request, generally the URL is available
3. Turn it on or off at the top right, Settings>Server Proxy, and try again: If it is enabled, it should be a CORS cross-domain problem; and if it is turned off, it should be caused by using an external network service proxy to access the intranet, You can log out and modify the logout server address to the APIJSON proxy service address of the intranet
4. Disable the network proxy software App client on the computer/phone/tablet such as VPN, or switch the proxy server address, and then try again
5. Press Fn+F12 or right-click the webpage>Inspect to view the Network interface call information and Console console log
6. Check the log on the request target server, and give priority to find the abnormal error content
7. Use other HTTP API tools such as Postman to test the same interface
8. Try again

# Questions and answers (you can report the problem after taking a screenshot and wait for the answer):
https://github.com/TommyLemon/APIAuto/issues

If you are requesting an APIJSON backend service, use the following link:
https://github.com/Tencent/APIJSON/issues
`;


  function getRequestFromURL(url_, tryParse) {
    var url = url_ || window.location.search;

    var index = url == null ? -1 : url.indexOf("?")
    if(index < 0) { //判断是否有参数
      return null;
    }

    var theRequest = null;
    var str = url.substring(index + 1);  //从第一个字符开始 因为第0个是?号 获取所有除问号的所有符串
    var arr = str.split("&");  //截除“&”生成一个数组

    var len = arr == null ? 0 : arr.length;
    for(var i = 0; i < len; i++) {
      var part = arr[i];
      var ind = part == null ? -1 : part.indexOf("=");
      if (ind <= 0) {
        continue
      }

      if (theRequest == null) {
        theRequest = {};
      }

      var v = decodeURIComponent(part.substring(ind+1));
      if (tryParse == true) {
        try {
          v = parseJSON(v)
        }
        catch (e) {
          console.log(e)
        }
      }

      theRequest[part.substring(0, ind)] = v;
    }

    return theRequest;
  }


  function markdownToHTML(md, isRequest) {
    if (typeof editormd == 'undefined' || editormd == null) {
      return;
    }

    if (isRequest) {
      vRequestMarkdown.innerHTML = '';
    }
    else {
      vMarkdown.innerHTML = '';
    }
    editormd.markdownToHTML(isRequest ? 'vRequestMarkdown' : "vMarkdown", {
      markdown        : md ,//+ "\r\n" + $("#append-test").text(),
      //htmlDecode      : true,       // 开启 HTML 标签解析，为了安全性，默认不开启
      htmlDecode      : "style,script,iframe",  // you can filter tags decode
      //toc             : false,
      tocm            : true,    // Using [TOCM]
      //tocContainer    : "#custom-toc-container", // 自定义 ToC 容器层
      //gfm             : false,
      tocDropdown     : true,
      // markdownSourceCode : true, // 是否保留 Markdown 源码，即是否删除保存源码的 Textarea 标签
      taskList        : true,
      tex             : true,  // 默认不解析
      flowChart       : true,  // 默认不解析
      sequenceDiagram : true,  // 默认不解析
    });
  }



  var PLATFORM_POSTMAN = 'POSTMAN'
  var PLATFORM_SWAGGER = 'SWAGGER'
  var PLATFORM_YAPI = 'YAPI'
  var PLATFORM_RAP = 'RAP'

  var REQUEST_TYPE_PARAM = 'PARAM'  // GET ?a=1&b=c&key=value
  var REQUEST_TYPE_FORM = 'FORM'  // POST x-www-form-urlencoded
  var REQUEST_TYPE_DATA = 'DATA'  // POST form-data
  var REQUEST_TYPE_JSON = 'JSON'  // POST application/json
  var REQUEST_TYPE_GRPC = 'GRPC'  // POST application/json
  var REQUEST_TYPE_GET = 'GET'  // GET ?a=1&b=c&key=value
  var REQUEST_TYPE_POST = 'POST'  // POST application/json
  var REQUEST_TYPE_PUT = 'PUT'  // PUT
  var REQUEST_TYPE_PATCH = 'PATCH'  // PATCH
  var REQUEST_TYPE_DELETE = 'DELETE'  // DELETE
  var REQUEST_TYPE_HEAD = 'HEAD'  // HEAD
  var REQUEST_TYPE_OPTIONS = 'OPTIONS'  // OPTIONS
  var REQUEST_TYPE_TRACE = 'TRACE'  // TRACE
  var HTTP_METHODS = [REQUEST_TYPE_GET, REQUEST_TYPE_POST, REQUEST_TYPE_PUT, REQUEST_TYPE_PATCH, REQUEST_TYPE_DELETE, REQUEST_TYPE_HEAD, REQUEST_TYPE_OPTIONS, REQUEST_TYPE_TRACE]
  var HTTP_POST_TYPES = [REQUEST_TYPE_POST, REQUEST_TYPE_JSON, REQUEST_TYPE_FORM, REQUEST_TYPE_DATA, REQUEST_TYPE_GRPC]
  var HTTP_URL_ARG_TYPES = [REQUEST_TYPE_GET, REQUEST_TYPE_PARAM, REQUEST_TYPE_FORM]
  var HTTP_JSON_TYPES = [REQUEST_TYPE_POST, REQUEST_TYPE_JSON, REQUEST_TYPE_GRPC]
  var HTTP_FORM_DATA_TYPES = [REQUEST_TYPE_DATA, REQUEST_TYPE_PUT, REQUEST_TYPE_DELETE]
  var HTTP_CONTENT_TYPES = [REQUEST_TYPE_PARAM, REQUEST_TYPE_FORM, REQUEST_TYPE_DATA, REQUEST_TYPE_JSON, REQUEST_TYPE_GRPC]

  var CONTENT_TYPE_MAP = {
    // 'PARAM': 'text/plain',
    'FORM': 'application/x-www-form-urlencoded',
    'DATA': 'multipart/form-data',
    'JSON': 'application/json',
    'GRPC': 'application/json',
  }
  var CONTENT_VALUE_TYPE_MAP = {
    'text/plain': 'JSON',
    'application/x-www-form-urlencoded': 'FORM',
    'multipart/form-data': 'DATA',
    'application/json': 'JSON'
  }

  var IGNORE_HEADERS = ['status code', 'remote address', 'referrer policy', 'connection', 'content-length'
    , 'content-type', 'date', 'keep-alive', 'proxy-connection', 'set-cookie', 'vary', 'accept', 'cache-control', 'dnt'
    , 'host', 'origin', 'pragma', 'referer', 'user-agent']

  var PRE = 'PRE' // PRE()
  var CUR = 'CUR' // CUR()
  var NEXT = 'NEXT' // NEXT()

  var PRE_REQ = 'PRE_REQ' // PRE_REQ('[]/page')
  var PRE_ARG = 'PRE_ARG' // PRE_ARG('[]/page')
  var PRE_RES = 'PRE_RES' // PRE_RES('[]/0/User/id')
  var PRE_DATA = 'PRE_DATA' // PRE_DATA('[]/0/User/id')
  var CTX_GET = 'CTX_GET' // CTX_GET('key')
  var CUR_REQ = 'CUR_REQ' // CUR_REQ('User/id')
  var CUR_ARG = 'CUR_ARG' // CUR_REQ('User/id')
  var CUR_RES = 'CUR_RES' // CUR_RES('[]/0/User/id')
  var CUR_DATA = 'CUR_DATA' // CUR_DATA('[]/0/User/id')
  var CTX_PUT = 'CTX_PUT' // CTX_PUT('key', val)

  function get4Path(obj, path, defaultVal, msg) {
    var val = path == null || path == '' ? obj : JSONResponse.getValByPath(obj, StringUtil.split(path, '/'))
    if (val == null && defaultVal == undefined) {
      throw new Error('找不到 ' + path + ' 对应在 obj 中的非 null 值！' + StringUtil.get(msg))
    }
    return val
  }

  function put4Path(obj, key, val, msg) {
    if (obj == null) {
      throw new Error('obj = null ！不能 put ' + key + ' ！' + StringUtil.get(msg))
    }
    obj[key] = val
  }

  var RANDOM_DB = 'RANDOM_DB'
  var RANDOM_IN = 'RANDOM_IN'
  var RANDOM_INT = 'RANDOM_INT'
  var RANDOM_NUM = 'RANDOM_NUM'
  var RANDOM_STR = 'RANDOM_STR'
  var RANDOM_BAD = 'RANDOM_BAD'
  var RANDOM_BAD_BOOL = 'RANDOM_BAD_BOOL'
  var RANDOM_BAD_NUM = 'RANDOM_BAD_NUM'
  var RANDOM_BAD_STR = 'RANDOM_BAD_STR'
  var RANDOM_BAD_IN = 'RANDOM_BAD_IN'
  var RANDOM_BAD_ARR = 'RANDOM_BAD_ARR'
  var RANDOM_BAD_OBJ = 'RANDOM_BAD_OBJ'

  var ORDER_DB = 'ORDER_DB'
  var ORDER_IN = 'ORDER_IN'
  var ORDER_INT = 'ORDER_INT'
  var ORDER_BAD = 'ORDER_BAD'
  var ORDER_BAD_BOOL = 'ORDER_BAD_BOOL'
  var ORDER_BAD_NUM = 'ORDER_BAD_NUM'
  var ORDER_BAD_STR = 'ORDER_BAD_STR'
  var ORDER_BAD_IN = 'ORDER_BAD_IN'
  var ORDER_BAD_ARR = 'ORDER_BAD_ARR'
  var ORDER_BAD_OBJ = 'ORDER_BAD_OBJ'

  var ORDER_MAP = {}

  var BAD_BOOLS = [null, undefined, false, true, -1, 0, 1, 2, 3.14, 'null', 'undefined', 'None', 'nil', 'false', 'true',
   '-1', '0', '1', '2', '3.14', '', ' ', '\\t', '\\r', '\\n', '\\a', '\\b', '\\v', '\\f', 'a', 'dY', [], {}, '[]', '{}']
  var BAD_NUMS = BAD_BOOLS.concat([
   -2049, -1025, -13, 13, 1025, 2049, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.MIN_SAFE_INTEGER,
   Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER - 1, Number.MAX_SAFE_INTEGER + 1,
   '-2049', '-1025', '-13', '13', '1025', '2049', 'Number.NaN', 'Number.POSITIVE_INFINITY', 'Number.NEGATIVE_INFINITY',
    'Number.MIN_SAFE_INTEGER', 'Number.MAX_SAFE_INTEGER', '' + Number.MIN_SAFE_INTEGER, '' + Number.MAX_SAFE_INTEGER
  ])
  var BAD_STRS = BAD_NUMS.concat([
     '`', '~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '=', '+', '[', ']', '{', '}', ';', ':',
     "'", '\\"', ',', '.', '<', '>', '/', '?', '\\t\\r\\n\\a\\b\\v\\f', '`~!@#$%^&*()-_=+[]{};:\'\\",.<>/?',
     'qwertyuiopasdfghjklzxcvbnm', 'MNBVCZLKJHGFDSAPOIUYTREWQ', 'ä½ å¥½', 'ÄãºÃ', '浣犲ソ', '�����',
     '鐢辨湀瑕佸ソ濂藉涔犲ぉ澶╁悜涓?', '����Ҫ�¨²�ѧϰ������', 'ç”±æœˆè¦�å¥½å¥½å­¦ä¹ å¤©å¤©å�‘ä¸Š', 'ÓÉÔÂÒªºÃºÃÑ§Ï°ÌìÌìÏòÉÏ',
     '由月要好好学习天天向??', '锟斤拷锟斤拷要锟矫猴拷学习锟斤拷锟斤拷锟斤拷'
  ])
  // FIXME 打开时直接卡死崩溃
  var sl = Math.min(10, Math.floor(BAD_STRS.length/5))
  for (var i = 0; i < sl; i ++) {
     var v = BAD_STRS[i]
     for (var j = 0; j < sl; j ++) {
         BAD_STRS.push(v + BAD_STRS[j])
     }
  }
  var sl2 = Math.min(5, Math.floor(sl/5))
  for (var i = 0; i < sl2; i ++) {
      var v = BAD_STRS[i]
      for (var j = 0; j < sl2; j ++) {
          var v2 = v + BAD_STRS[j]
          for (var k = 0; k < sl2; k ++) {
            BAD_STRS.push(v2 + BAD_STRS[k])
          }
      }
  }

  var BAD_ARRS = []
  for (var i = 0; i < BAD_STRS.length; i ++) {
    BAD_ARRS.push([BAD_STRS[i]])
  }
  // FIXME 打开时直接卡死崩溃
  var al = Math.min(10, Math.floor(BAD_STRS.length/5))
  for (var i = 0; i < al; i ++) {
      var v = BAD_STRS[i]
      for (var j = 0; j < al; j ++) {
        BAD_ARRS.push([v, BAD_STRS[j]])
      }
  }
  var al2 = Math.min(3, Math.floor(al/5))
  for (var i = 0; i < al2; i ++) {
      var v = BAD_STRS[i]
      for (var j = 0; j < al2; j ++) {
          var v2 = BAD_STRS[j]
          for (var k = 0; k < al2; k ++) {
            BAD_ARRS.push([v, v2, BAD_STRS[k]])
          }
      }
  }

  var BAD_OBJS = []
  var ol = Math.min(10, Math.floor(BAD_STRS.length/5))
  for (var i = 10; i < ol; i ++) { // 太多就导致 RANDOM_BAD 基本每次随机出来都是对象
    var k = BAD_STRS[i]
    var key = k == undefined ? 'undefined' : (typeof k == 'string' ? k : JSON.stringify(k))
    for (var j = 0; j < ol; j ++) {
        BAD_OBJS.push({[key]: BAD_STRS[j]})
    }
  }
  // FIXME 打开时直接卡死崩溃
  for (var i = 0; i < ol; i ++) {
    var k = BAD_STRS[i]
    var key = k == undefined ? 'undefined' : (typeof k == 'string' ? k : JSON.stringify(k))
    for (var j = 0; j < ol; j ++) {
      var val = BAD_STRS[j]

      for (var i2 = 0; i2 < ol; i2 ++) {
        var k2 = BAD_STRS[i2]
        var key2 = k2 == undefined ? 'undefined' : (typeof k2 == 'string' ? k2 : JSON.stringify(k))
        for (var j2 = 0; j2 < ol; j2 ++) {
            BAD_OBJS.push({[key]: val, [key2]: BAD_STRS[j2]})
        }
      }
    }
  }
//  var ol = Math.min(10, Math.floor(BAD_OBJS.length/5))
//  for (var i = 0; i < ol; i ++) {
//      var v = BAD_OBJS[BAD_OBJS.length - i]
//      for (var j = 0; j < ol; j ++) {
//        BAD_OBJS.push(Object.assign(v, BAD_OBJS[BAD_OBJS.length - j]))
//      }
//  }
//  var ol2 = Math.min(2, Math.floor(ol/5))
//  for (var i = 0; i < ol2; i ++) {
//      var v = BAD_OBJS[BAD_OBJS.length - i]
//      for (var j = 0; j < ol2; j ++) {
//          var v2 = Object.assign(v, BAD_OBJS[BAD_OBJS.length - j])
//          for (var k = 0; k < ol2; k ++) {
//            BAD_OBJS.push(Object.assign(v2, BAD_OBJS[BAD_OBJS.length - k]))
//          }
//      }
//  }

  var BADS = BAD_STRS.concat(BAD_ARRS).concat(BAD_OBJS)

  var PRIME_INTS = [
  1, 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97
  , 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199
  , 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293
  , 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397
  , 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499
  , 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599
  , 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691
  , 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797
  , 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887
  , 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997
  , 1009, 1013, 1019, 1021, 1031, 1033, 1039, 1049, 1051, 1061, 1063, 1069, 1087, 1091, 1093, 1097
  , 1103, 1109, 1117, 1123, 1129, 1151, 1153, 1163, 1171, 1181, 1187, 1193
  , 1201, 1213, 1217, 1223, 1229, 1231, 1237, 1249, 1259, 1277, 1279, 1283, 1289, 1291, 1297
  , 1301, 1303, 1307, 1319, 1321, 1327, 1361, 1367, 1373, 1381, 1399
  , 1409, 1423, 1427, 1429, 1433, 1439, 1447, 1451, 1453, 1459, 1471, 1481, 1483, 1487, 1489, 1493, 1499
  , 1511, 1523, 1531, 1543, 1549, 1553, 1559, 1567, 1571, 1579, 1583, 1597
  , 1601, 1607, 1609, 1613, 1619, 1621, 1627, 1637, 1657, 1663, 1667, 1669, 1693, 1697, 1699
  , 1709, 1721, 1723, 1733, 1741, 1747, 1753, 1759, 1777, 1783, 1787, 1789
  , 1801, 1811, 1823, 1831, 1847, 1861, 1867, 1871, 1873, 1877, 1879, 1889
  , 1901, 1907, 1913, 1931, 1933, 1949, 1951, 1973, 1979, 1987, 1993, 1997, 1999
  ]
  function randomPrimeInt() {
    return PRIME_INTS[randomInt(0, PRIME_INTS.length - 1)]
  }
  function randomInt(min, max) {
    return randomNum(min, max, 0);
  }
  function randomNum(min, max, precision) {
    // 0 居然也会转成  Number.MIN_SAFE_INTEGER ！！！
    // start = start || Number.MIN_SAFE_INTEGER
    // end = end || Number.MAX_SAFE_INTEGER

    if (min == null) {
      min = 0 // Number.MIN_SAFE_INTEGER
    }
    if (max == null) {
      max = Number.MAX_SAFE_INTEGER
    }
    if (precision == null) {
      precision = 2
    }

    return + ((max - min)*Math.random() + min).toFixed(precision)
  }
  function randomStr(minLength, maxLength, availableChars) {
    return 'Ab_Cd' + randomNum()
  }
  function randomIn(...args) {
    return args == null || args.length <= 0 ? null : args[randomInt(0, args.length - 1)]
  }
  function randomBad(defaultArgs, ...args) {
    if (defaultArgs == null) {
      defaultArgs = BADS
    }

    if (args == null || args.length <= 0) {
      return defaultArgs[randomInt(0, defaultArgs.length - 1)]
    }

    args = []
    for (var i = 0; i < defaultArgs.length; i++) {
      args.push(defaultArgs[i])
    }

    return args[randomInt(0, args.length - 1)]
  }
  function randomBadBool(...args) {
    return randomBad(BAD_BOOLS, args)
  }
  function randomBadNum(...args) {
    return randomBad(BAD_NUMS, args)
  }
  function randomBadStr(...args) {
    return randomBad(BAD_STRS, args)
  }
  function randomBadArr(...args) {
    return randomBad(BAD_ARRS, args)
  }
  function randomBadObj(...args) {
    return randomBad(BAD_OBJS, args)
  }

  function orderInt(desc, index, min, max) {
    if (min == null) {
      min = 0 // Number.MIN_SAFE_INTEGER
    }
    if (max == null) {
      max = Number.MAX_SAFE_INTEGER
    }

    if (desc) {
      return max - index%(max - min + 1)
    }
    return min + index%(max - min + 1)
  }
  function orderIn(desc, index, ...args) {
    // alert('orderIn  index = ' + index + '; args = ' + JSON.stringify(args));
    index = index || 0;
    return args == null || args.length <= index ? null : args[desc ? args.length - 1 - index : index];
  }
  function orderBad(defaultArgs, desc, index, ...args) {
    // alert('orderIn  index = ' + index + '; args = ' + JSON.stringify(args));
    if (defaultArgs == null) {
      defaultArgs = BADS
    }

    index = index || 0;
    if (args == null || args.length <= 0) {
      return defaultArgs[desc ? defaultArgs.length - index : index]
    }

    args = []
    for (var i = 0; i < defaultArgs.length; i++) {
      args.push(defaultArgs[i])
    }

    return args[desc ? args.length - index : index]
  }
  function orderBadBool(desc, index, ...args) {
    return orderBad(BAD_BOOLS, desc, index, ...args)
  }
  function orderBadNum(desc, index, ...args) {
    return orderBad(BAD_NUMS, desc, index, ...args)
  }
  function orderBadStr(desc, index, ...args) {
    return orderBad(BAD_STRS, desc, index, ...args)
  }
  function orderBadArr(desc, index, ...args) {
    return orderBad(BAD_ARRS, desc, index, ...args)
  }
  function orderBadObj(desc, index, ...args) {
    return orderBad(BAD_OBJS, desc, index, ...args)
  }

  function getOrderIndex(randomId, line, argCount, step) {
    // alert('randomId = ' + randomId + '; line = ' + line + '; argCount = ' + argCount);
    // alert('ORDER_MAP = ' + JSON.stringify(ORDER_MAP, null, '  '));

    if (randomId == null) {
      randomId = 0;
    }
    if (ORDER_MAP == null) {
      ORDER_MAP = {};
    }
    if (ORDER_MAP[randomId] == null) {
      ORDER_MAP[randomId] = {};
    }

    var orderIndex = ORDER_MAP[randomId][line];
    // alert('orderIndex = ' + orderIndex)

    if (orderIndex == null || orderIndex < -1) {
      orderIndex = -1;
    }
    if (argCount == null) {
      argCount = 0;
    }
    if (step == null) {
      step = 1;
    }

    orderIndex ++
    ORDER_MAP[randomId][line] = orderIndex;
    orderIndex = argCount <= 0 ? step*orderIndex : step*orderIndex%argCount;

    // alert('orderIndex = ' + orderIndex)
    // alert('ORDER_MAP = ' + JSON.stringify(ORDER_MAP, null, '  '));
    return orderIndex;
  }
  //这些全局变量不能放在data中，否则会报undefined错误

  var BREAK_ALL = 'BREAK_ALL'
  var BREAK_LAST = 'BREAK_LAST'

  var baseUrl
  var inputted
  var handler
  var errHandler
  var docObj
  var doc
  var output

  var isSingle = true

  var currentTarget = vInput;
  var isInputValue = false;
  var isClickSelectInput = false;
  var selectionStart = 0;
  var selectionEnd = 0;

  function newDefaultScript() {
    return { // index.html 中 v-model 绑定，不能为 null
      case: {
        0: {
          pre: { // 可能有 id
            script: '' // index.html 中 v-model 绑定，不能为 null
          },
          post: {
            script: ''
          }
        },
        1560244940013: {
          pre: { // 可能有 id
            script: '' // index.html 中 v-model 绑定，不能为 null
          },
          post: {
            script: ''
          }
        }
      },
      account: {
        0: {
          pre: {
            script: ''
          },
          post: {
            script: ''
          }
        },
        82001: {
          pre: {
            script: ''
          },
          post: {
            script: ''
          }
        }
      },
      global: {
        0: {
          pre: {
            script: ''
          },
          post: {
            script: ''
          }
        }
      }
    }
  }

// APIJSON >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

  var App = {
    el: '#app',
    data: {
      baseview: 'formater',
      view: 'output',
      jsoncon: JSON.stringify(initJson),
      jsonhtml: initJson,
      compressStr: '',
      error: {},
      requestVersion: 3,
      requestCount: 1,
      urlComment: '一对多关联查询。可粘贴浏览器/抓包工具/接口工具 的 Network/Header/Content 等请求信息，自动填充到界面，格式为 key: value',
      selectIndex: 0,
      allowMultiple: true,
      isFullScreen: false,
      hoverIds: { before: null, diff: null, after: null },
      detection: {
        isShowNum: false,
        total: 10,

        afterThreshold: 35,
        afterCorrect: 9,
        afterWrong: 1,
        afterMiss: 1,
        afterRecall: 9/(9+1),
        afterRecallStr: (100*this.afterRecall).toFixed(0) + '%',
        afterPrecision: 9/(9+1),
        afterPrecisionStr: (100*this.afterPrecision).toFixed(0) + '%',
        afterF1: 2*(this.afterRecall*this.afterPrecision)/(this.afterRecall + this.afterPrecision),
        afterF1Str: (100*this.afterF1).toFixed(0) + '%',
        after: { bboxes: [] },

        beforeThreshold: 30,
        beforeCorrect: 8,
        beforeWrong: 3,
        beforeMiss: 2,
        beforeRecall: 8/(8+3),
        beforeRecallStr: (100*this.beforeRecall).toFixed(0) + '%',
        beforePrecision: 8/(8+2),
        beforePrecisionStr: (100*this.beforePrecision).toFixed(0) + '%',
        beforeF1: 2*(this.beforeRecall*this.beforePrecision)/(this.beforeRecall + this.beforePrecision),
        beforeF1Str: (100*this.beforeF1).toFixed(0) + '%',
        before: { bboxes: [] },

        diffThreshold: 90,
        diffCorrectStr: '+' + 1,
        diffWrongStr: '-' + 2,
        diffMissStr: '-' + 1,
        diffRecallStr: '+' + (100*(this.afterRecall - this.beforeRecall)).toFixed(0) + '%',
        diffPrecisionStr: '+' + (100*(this.afterPrecision - this.beforePrecision)).toFixed(0) + '%',
        diffF1: '+' + (100*(this.afterF1 - this.beforeF1)).toFixed(0) + '%',
        diffF1Str: '+' + (100*this.diffF1).toFixed(0) + '%',
        diff: { bboxes: [] },
      },
      img: '', // 'img/Screenshot_2020-11-07-16-35-27-473_apijson.demo.jpg',
      file: 'Screenshot_2020-11-07-16-35-27-473_apijson.demo.jpg',
      visiblePaths: [],
      imgMap: {},
      canvasMap: {},
      options: [], // [{name:"id", type: "integer", comment:"主键"}, {name:"name", type: "string", comment:"用户名称"}],
      historys: [],
      history: {name: '请求0'},
      remotes: [],
      locals: [],
      chainPaths: [],
      casePaths: [],
      chainGroups: [],
      caseGroups: [],
      testCases: [],
      randoms: [],
      randomSubs: [],
      account: '13000082001',
      password: '123456',
      logoutSummary: {},
      accounts: [
        {
          'id': 82001,
          'isLoggedIn': false,
          'name': '测试账号1',
          'phone': '13000082001',
          'password': '123456'
        },
        {
          'id': 82002,
          'isLoggedIn': false,
          'name': '测试账号2',
          'phone': '13000082002',
          'password': '123456'
        },
        {
          'id': 82003,
          'isLoggedIn': false,
          'name': '测试账号3',
          'phone': '13000082003',
          'password': '123456'
        }
      ],
      otherEnvTokenMap: {},
      otherEnvCookieMap: {},
      allSummary: {},
      currentAccountIndex: 0,
      currentChainGroupIndex: -1,
      currentDocIndex: -1,
      currentRandomIndex: -1,
      currentRandomSubIndex: -1,
      tests: { '-1':{}, '0':{}, '1':{}, '2': {} },
      crossProcess: '交叉账号:已关闭',
      testProcess: '机器学习:已关闭',
      randomTestTitle: '图片',
      testRandomCount: 1,
      testRandomProcess: '',
      compareColor: '#0000',
      scriptType: 'case',
      scriptBelongId: 0,
      scripts: newDefaultScript(),
      retry: 0, // 每个请求前的等待延迟
      wait: 0, // 每个请求前的等待延迟
      timeout: null, // 每个请求的超时时间
      loadingCount: 0,
      isPreScript: true,
      isRandomTest: false,
      isDelayShow: false,
      isSaveShow: false,
      isExportShow: false,
      isExportCheckShow: false,
      isExportRandom: false,
      isExportScript: false,
      isOptionListShow: false,
      isTestCaseShow: false,
      isHeaderShow: false,
      isScriptShow: false,
      isRandomShow: true,  // 默认展示
      isRandomListShow: true,
      isRandomSubListShow: false,
      isRandomEditable: false,
      isCaseGroupEditable: false,
      isLoginShow: false,
      isConfigShow: false,
      isDeleteShow: false,
      groupShowType: 0,
      caseShowType: 0,
      chainShowType: 0,
      statisticsShowType: 0,
      currentHttpResponse: {},
      currentDocItem: {},
      currentRemoteItem: {
        "Document":  {
          "id": 1560244940013 ,
          "userId": 82001 ,
          "testAccountId": 82001 ,
          "version": 3 ,
          "name": "测试查询" ,
          "method": "POST" ,
          "type": "JSON" ,
          "url": "/get" ,
          "date": "2019-06-11 17:22:20.0",
// 导致清空文本后，在说明文档后面重叠显示这个绿色注释          "detail": `
// 以上 JSON 文本支持 JSON5 格式。清空文本内容可查看规则。
// 注释可省略。行注释前必须有两个空格；段注释必须在 JSON 下方。
//
// ## 快捷键
// Ctrl + I 或 Command + I 格式化 JSON
//
// #### 右上角设置项 > 预览请求输入框，显示对应的预览效果`
        },
        "TestRecord":  {
          "id": 1615135440014 ,
          "userId": 82001 ,
          "documentId": 1560244940013
        }
      },
      currentRandomItem: {},
      isAdminOperation: false,
      loginType: 'login',
      isExportRemote: false,
      isRegister: false,
      isCrossEnabled: false,
      isMLEnabled: false,
      isDelegateEnabled: false,
      isEnvCompareEnabled: false,
      isPreviewEnabled: false,
      isStatisticsEnabled: false,
      isEncodeEnabled: true,
      isEditResponse: false,
      isLocalShow: false,
      isChainShow: false,
      uploadTotal: 0,
      uploadDoneCount: 0,
      uploadFailCount: 0,
      uploadRandomCount: 0,
      exTxt: {
        name: 'APIJSON测试',
        label: '发布简单接口',
        button: '保存',
        index: 0
      },
      themes: themes,
      checkedTheme: 0,
      isExpand: true,
      reportId: null,
      User: {
        id: 0,
        name: '',
        head: ''
      },
      Privacy: {
        id: 0,
        balance: null //点击更新提示需要判空 0.00
      },
      method: REQUEST_TYPE_POST,
      methods: null, // HTTP_METHODS,
      type: REQUEST_TYPE_JSON,
      types: null, // [ REQUEST_TYPE_PARAM, REQUEST_TYPE_JSON, REQUEST_TYPE_FORM, REQUEST_TYPE_DATA],  // 很多人喜欢用 GET 接口测试，默认的 JSON 看不懂 , REQUEST_TYPE_FORM, REQUEST_TYPE_DATA,  REQUEST_TYPE_GRPC ],  //默认展示
      host: '',
      database: 'MYSQL', // 查文档必须，除非后端提供默认配置接口  // 用后端默认的，避免用户总是没有配置就问为什么没有生成文档和注释  'MYSQL',// 'POSTGRESQL',
      schema: 'sys',  // 查文档必须，除非后端提供默认配置接口  // 用后端默认的，避免用户总是没有配置就问为什么没有生成文档和注释   'sys',
      otherEnv: 'http://localhost:8080',  // 其它环境服务地址，用来对比当前的
      server: 'http://apijson.cn:9090', // 'http://localhost:8080', //  Chrome 90+ 跨域问题非常难搞，开发模式启动都不行了
      // server: 'http://47.74.39.68:9090',  // apijson.org
      projectHost: {host: 'http://apijson.cn:8080', project: 'APIJSON.cn'},  // apijson.cn
      thirdParty: 'SWAGGER /v2/api-docs',  //apijson.cn
      // thirdParty: 'RAP /repository/joined /repository/get',
      // thirdParty: 'YAPI /api/interface/list_menu /api/interface/get',
      projectHosts: [
         {host: 'http://localhost:8080', project: 'Localhost'},
         {host: 'http://apijson.cn:8080', project: 'APIJSON.cn'},
         {host: 'http://apijson.cn:9090', project: 'APIJSON.cn:9090'}
      ],
      language: CodeUtil.LANGUAGE_KOTLIN,
      header: {},
      page: 0,
      count: 50,
      search: '',
      chainGroupPage: 0,
      chainGroupPages: {},
      chainGroupCount: 0,
      chainGroupCounts: {},
      chainGroupSearch: '',
      chainGroupSearches: {},
      caseGroupPage: 0,
      caseGroupPages: {},
      caseGroupCount: 0,
      caseGroupCounts: {},
      caseGroupSearch: '',
      caseGroupSearches: {},
      testCasePage: 0,
      testCasePages: {},
      testCaseCount: 50,
      testCaseCounts: {},
      testCaseSearch: '',
      testCaseSearches: {},
      randomPage: 0,
      randomCount: 50,
      randomSearch: '',
      randomSubPage: 0,
      randomSubCount: 50,
      randomSubSearch: '',
      doneCount: 0,
      allCount: 0,
      deepDoneCount: 0,
      deepAllCount: 0,
      randomDoneCount: 0,
      randomAllCount: 0,
      coverage: {
        json: {},
        html: ''
      }
    },

    methods: {
      // 全部展开
      expandAll: function () {
        if (this.view != 'code') {
          alert('请先获取正确的JSON Response！')
          return
        }

        $('.icon-square-min').show()
        $('.icon-square-plus').hide()
        $('.expand-view').show()
        $('.fold-view').hide()

        this.isExpand = true;
      },

      // 全部折叠
      collapseAll: function () {
        if (this.view != 'code') {
          alert('请先获取正确的JSON Response！')
          return
        }

        $('.icon-square-min').hide()
        $('.icon-square-plus').show()
        $('.expand-view').hide()
        $('.fold-view').show()

        this.isExpand = false;
      },

      // diff
      diffTwo: function () {
        var oldJSON = {}
        var newJSON = {}
        this.view = 'code'
        try {
          oldJSON = jsonlint.parse(this.jsoncon)
        } catch (ex) {
          this.view = 'error'
          this.error = {
            msg: '原 JSON 解析错误\r\n' + ex.message
          }
          return
        }

        try {
          newJSON = jsonlint.parse(this.jsoncon)
        } catch (ex) {
          this.view = 'error'
          this.error = {
            msg: '新 JSON 解析错误\r\n' + ex.message
          }
          return
        }

        var base = difflib.stringAsLines(JSON.stringify(oldJSON, '', 4))
        var newtxt = difflib.stringAsLines(JSON.stringify(newJSON, '', 4))
        var sm = new difflib.SequenceMatcher(base, newtxt)
        var opcodes = sm.get_opcodes()
        $('#diffoutput').empty().append(diffview.buildView({
          baseTextLines: base,
          newTextLines: newtxt,
          opcodes: opcodes,
          baseTextName: '原 JSON',
          newTextName: '新 JSON',
          contextSize: 2,
          viewType: 0
        }))
      },

      baseViewToDiff: function () {
        this.baseview = 'diff'
        this.diffTwo()
      },

      // 回到格式化视图
      baseViewToFormater: function () {
        this.baseview = 'formater'
        this.view = 'code'
        this.showJsonView()
      },

      // 根据json内容变化格式化视图
      showJsonView: function () {
        if (this.baseview === 'diff') {
          return
        }
        try {
          if (this.jsoncon.trim() === '') {
            this.view = 'empty'
          } else {
            this.view = 'code'

            var ret = this.jsoncon
            try {
              ret = jsonlint.parse(this.jsoncon)
            } catch (ex) {
              log(ex)
            }

            var method = this.getMethod();  // m 已经 toUpperCase 了
            var isRestful = ! JSONObject.isAPIJSONPath(method);

            var path = null;
            var key = null;

            if (isSingle || ! JSONResponse.isObject(vi)) {
              var val = ret;
              if (isSingle != true && val instanceof Array) {
                  // alert('onRenderJSONItem  key = ' + key + '; val = ' + JSON.stringify(val))
                  var ckey = key == null ? null : key.substring(0, key.lastIndexOf('[]'));

                  var aliaIndex = ckey == null ? -1 : ckey.indexOf(':');
                  var objName = aliaIndex < 0 ? ckey : ckey.substring(0, aliaIndex);

                  var firstIndex = objName == null ? -1 : objName.indexOf('-');
                  var firstKey = firstIndex < 0 ? objName : objName.substring(0, firstIndex);

                  for (var i = 0; i < val.length; i++) {
                    var vi = val[i]

                    if (JSONResponse.isObject(vi) && JSONObject.isTableKey(firstKey || '', vi, isRestful)) {

                      var curPath = '' + i;
                      var curTable = firstKey;
                      var thiz = {
                        _$_path_$_: curPath,
                        _$_table_$_: curTable
                      };

                      var newVal = {};
                      for (var k in vi) {
                        newVal[k] = vi[k]; //提升性能
                        if (this.isFullAssert) {
                            try {
                              var cri = this.currentRemoteItem || {};
                              var tr = cri.TestRecord || {};
                              var d = cri.Document || {};
                              var standard = this.isMLEnabled ? tr.standard : tr.response;
                              var standardObj = StringUtil.isEmpty(standard, true) ? null : parseJSON(standard);
                              var tests = this.tests[String(this.currentAccountIndex)] || {};
                              var responseObj = (tests[d.id] || {})[0]

                              var pathUri = (StringUtil.isEmpty(curPath, false) ? '' : curPath + '/') + k;
                              var pathKeys = StringUtil.split(pathUri, '/');
                              var target = this.isMLEnabled ? JSONResponse.getStandardByPath(standardObj, pathKeys) : JSONResponse.getValByPath(standardObj, pathKeys);
                              var real = JSONResponse.getValByPath(responseObj, pathKeys);
                              var cmp = this.isMLEnabled ? JSONResponse.compareWithStandard(target, real, pathUri) : JSONResponse.compareWithBefore(target, real, pathUri);
//                              cmp.path = pathUri;
                              var cmpShowObj = JSONResponse.getCompareShowObj(cmp);
                              thiz[k] = [cmpShowObj.compareType, cmpShowObj.compareColor, cmpShowObj.compareMessage];
                              var countKey = '_$_' + cmpShowObj.compareColor + 'Count_$_';
                              thiz[countKey] = thiz[countKey] == null ? 1 : thiz[countKey] + 1;
                            } catch (e) {
                              thiz[k] = [JSONResponse.COMPARE_ERROR, 'red', e.message];
                              var countKey = '_$_redCount_$_';
                              thiz[countKey] = thiz[countKey] == null ? 1 : thiz[countKey] + 1;
                            }
                        }

                        delete vi[k]
                      }

                      vi._$_this_$_ = JSON.stringify(thiz)
                      for (var k in newVal) {
                        vi[k] = newVal[k]
                      }
                    }

                  }
                }

                this.jsonhtml = val;
            }
            else {
                var thiz = {
                   _$_path_$_: null,
                   _$_table_$_: null
                };

                for (var k in ret) {
                  if (this.isFullAssert) {
                      try {
                        var cri = this.currentRemoteItem || {};
                        var tr = cri.TestRecord || {};
                        var d = cri.Document || {};
                        var standard = this.isMLEnabled ? tr.standard : tr.response;
                        var standardObj = StringUtil.isEmpty(standard, true) ? null : parseJSON(standard);
                        var tests = this.tests[String(this.currentAccountIndex)] || {};
                        var responseObj = (tests[d.id] || {})[0]

                        var pathUri = k;
                        var pathKeys = StringUtil.split(pathUri, '/');
                        var target = this.isMLEnabled ? JSONResponse.getStandardByPath(standardObj, pathKeys) : JSONResponse.getValByPath(standardObj, pathKeys);
                        var real = JSONResponse.getValByPath(responseObj, pathKeys);
                //              c = JSONResponse.compareWithBefore(target, real, path);
                        var cmp = this.isMLEnabled ? JSONResponse.compareWithStandard(target, real, pathUri) : JSONResponse.compareWithBefore(target, real, pathUri);
//                        cmp.path = pathUri;
                        var cmpShowObj = JSONResponse.getCompareShowObj(cmp);
                        thiz[k] = [cmpShowObj.compareType, cmpShowObj.compareColor, cmpShowObj.compareMessage];
                        var countKey = '_$_' + cmpShowObj.compareColor + 'Count_$_';
                        thiz[countKey] = thiz[countKey] == null ? 1 : thiz[countKey] + 1;
                      } catch (e) {
                        thiz[k] = [JSONResponse.COMPARE_ERROR, 'red', e.message];
                        var countKey = '_$_redCount_$_';
                        thiz[countKey] = thiz[countKey] == null ? 1 : thiz[countKey] + 1;
                      }
                  }
                }

                this.jsonhtml = Object.assign({
                    _$_this_$_: JSON.stringify(thiz)
                }, ret)
            }

          }
        } catch (ex) {
          this.view = 'error'
          this.error = {
            msg: ex.message
          }
        }
      },


      showUrl: function (isAdminOperation, branchUrl) {
        if (StringUtil.isEmpty(this.host, true)) {  //显示(可编辑)URL Host
          if (isAdminOperation != true) {
            baseUrl = this.getBaseUrl(vUrl.value, true)
          }
          vUrl.value = (isAdminOperation ? this.server : baseUrl) + branchUrl
        }
        else {  //隐藏(固定)URL Host
          if (isAdminOperation) {
            this.host = this.server
          }
          vUrl.value = branchUrl
        }

        vUrlComment.value = isSingle || StringUtil.isEmpty(this.urlComment, true)
          ? '' : CodeUtil.getBlank(StringUtil.length(vUrl.value), 1) + CodeUtil.getComment(this.urlComment, false, ' ')
          + ' - ' + (this.requestVersion > 0 ? 'V' + this.requestVersion : 'V*');
      },

      //设置基地址
      setBaseUrl: function () {
        if (StringUtil.isEmpty(this.host, true) != true) {
          return
        }
        // 重新拉取文档
        var bu = this.getBaseUrl(vUrl.value, true)
        if (baseUrl != bu) {
          baseUrl = bu
          doc = null //这个是本地的数据库字典及非开放请求文档
          this.saveCache('', 'URL_BASE', baseUrl)

          //已换成固定的管理系统URL

          // this.remotes = []

          // var index = baseUrl.indexOf(':') //http://localhost:8080
          // this.server = (index < 0 ? baseUrl : baseUrl.substring(0, baseUrl)) + ':9090'

          var accounts = []
          if (StringUtil.isNotEmpty(bu, true)) {
            accounts = this.getCache(bu, 'accounts', [])
//            for (var i = 0; i < accounts.length; i ++) {
//               var ats = accounts[i]
//               if (ats == null || (StringUtil.isNotEmpty(ats.baseUrl, true) && ats.baseUrl != bu)) {
//
//               }
//            }
          }
          else {
              var baseUrls = this.getCache('', 'baseUrls', [])
              for (var i = 0; i < baseUrls.length; i ++) {
                var bu2 = baseUrls[i]
                var ats = this.getCache(bu2, 'accounts', [])
//                accounts.push({
//                  baseUrl: bu2,
//                  id: 0,
//                  phone: 0,
//                  name: ''
//                })
                accounts = accounts.concat(ats)
              }
          }

          if (accounts.length >= 1) {
            this.accounts = accounts
          }
        }
      },
      getUrl: function () {
        var url = StringUtil.get(this.host) + vUrl.value
        return url.replaceAll(' ', '')
      },
      //获取基地址
      getBaseUrl: function (url_, fixed) {
        var url = StringUtil.trim(url_ != undefined ? url_ : vUrl.value)
        var length = this.getBaseUrlLength(url)
        if (length <= 0 && url_ == undefined) {
          var account = this.getCurrentAccount()
          if (account != null) {
            return account.baseUrl || ''
          }
        }

        url = length <= 0 ? '' : url.substring(0, length)
        return url == '' ? (fixed != true ? URL_BASE : '') : url
      },
      //获取基地址长度，以://后的第一个/分割baseUrl和method
      getBaseUrlLength: function (url_) {
        var url = StringUtil.trim(url_)
        var index = url.indexOf(' ')
        if (index >= 0) {
          return index + 1
        }

        index = url.indexOf('://')
        if (index < 0) {
          return 0
        }

        var rest = url.substring(index + 3)
        var ind = rest.indexOf('/')

        return ind < 0 ? url.length : index + 3 + ind
      },
      //获取操作方法
      getMethod: function (url, noQuery) {
        var url = StringUtil.get(url == null ? vUrl.value : url).trim()
        var index = this.getBaseUrlLength(url)
        url = index <= 0 ? url : url.substring(index)
        index = noQuery ? url.indexOf("?") : -1
        if (index >= 0) {
          url = url.substring(0, index)
        }
        return url.startsWith('/') ? url.substring(1) : url
      },
      getBranchUrl: function (url) {
        var url = StringUtil.get(url == null ? vUrl.value : url).trim()
        var index = this.getBaseUrlLength(url)
        url = index <= 0 ? url : url.substring(index)
        return url.startsWith('/') ? url : '/' + url
      },
      //获取请求的tag
      getTag: function () {
        var req = null;
        try {
          req = this.getRequest(vInput.value);
        } catch (e) {
          log('main.getTag', 'try { req = this.getRequest(vInput.value); \n } catch (e) {\n' + e.message)
        }
        return req == null ? null : req.tag
      },

      getRequest: function (json, defaultValue, isRaw) {  // JSON5 兜底，减少修改范围  , isSingle) {
        if (JSONResponse.isString(json) != true) {
          return json == null ? defaultValue : json
        }
        var s = isRaw != true && isSingle ? this.switchQuote(json) : json; // this.toDoubleJSON(json, defaultValue);
        if (StringUtil.isEmpty(s, true)) {
          return defaultValue
        }
        try {
          return jsonlint.parse(s);
        }
        catch (e) {
          log('main.getRequest', 'try { return jsonlint.parse(s); \n } catch (e) {\n' + e.message)
          log('main.getRequest', 'return JSON5.parse(s);')
          return JSON5.parse(s);  // jsonlint.parse(this.removeComment(s));
        }
      },
      getExtraComment: function(json) {
        var it = json != null ? json : StringUtil.trim(vInput.value);

        var start = it.lastIndexOf('\n/*');
        var end = it.lastIndexOf('\n*/');

        return start < 0 || end <= start ? null : it.substring(start + '\n/*'.length, end);
      },

      getHeader: function (text) {
        var header = {}
        var hs = StringUtil.isEmpty(text, true) ? null : StringUtil.split(text, '\n')

        if (hs != null && hs.length > 0) {
          var item
          for (var i = 0; i < hs.length; i++) {
            item = hs[i] || ''

            // 解决整体 trim 后第一行  // 被当成正常的 key 路径而不是注释
            var index = StringUtil.trim(item).startsWith('//') ? 0 : item.lastIndexOf(' //')  // 不加空格会导致 http:// 被截断  ('//')  //这里只支持单行注释，不用 removeComment 那种带多行的去注释方式
            var item2 = index < 0 ? item : item.substring(0, index)
            item2 = item2.trim()
            if (item2.length <= 0) {
              continue;
            }

            index = item2.indexOf(':')
            if (index <= 0) {
              throw new Error('请求头 Request Header 输入错误！请按照每行 key: value 的格式输入，不要有多余的换行或空格！'
                + '\n错误位置: 第 ' + (i + 1) + ' 行'
                + '\n错误文本: ' + item)
            }

            var val = item2.substring(index + 1, item2.length)

            var ind = val.indexOf('(')  //一定要有函数是为了避免里面是一个简短单词和 CVAuto 代码中变量冲突
            if (ind > 0 && val.indexOf(')') > ind) {  //不从 0 开始是为了保证是函数，且不是 (1) 这种单纯限制作用域的括号
              try {
                val = eval(val)
              }
              catch (e) {
                this.log("getHeader  if (hs != null && hs.length > 0) { ... if (ind > 0 && val.indexOf(')') > ind) { ... try { val = eval(val) } catch (e) = " + e.message)
              }
            }

            header[StringUtil.trim(item2.substring(0, index))] = val
          }
        }

        return header
      },

      // 分享 CVAuto 特有链接，打开即可还原分享人的 JSON 参数、设置项、搜索关键词、分页数量及页码等配置
      shareLink: function (isRandom) {
        var settingStr = null
        try {
          settingStr = JSON.stringify({
            requestVersion: this.requestVersion,
            requestCount: this.requestCount,
            isTestCaseShow: this.isTestCaseShow,
            // isHeaderShow: this.isHeaderShow,
            // isRandomShow: this.isRandomShow,
            isRandomListShow: this.isRandomShow ? this.isRandomListShow : undefined,
            isRandomSubListShow: this.isRandomListShow ? this.isRandomSubListShow : undefined,
            // isRandomEditable: this.isRandomEditable,
            isCrossEnabled: this.isCrossEnabled,
            isMLEnabled: this.isMLEnabled,
            isDelegateEnabled: this.isDelegateEnabled,
            isPreviewEnabled: this.isPreviewEnabled,
            isStatisticsEnabled: this.isStatisticsEnabled,
            isEncodeEnabled: this.isEncodeEnabled,
            isEditResponse: this.isEditResponse,
            isLocalShow: this.isTestCaseShow ? this.isLocalShow : undefined,
            page: this.page,
            count: this.count,
            testCasePage: this.testCasePage,
            testCaseCount: this.testCaseCount,
            testRandomCount: this.testRandomCount,
            randomPage: this.randomPage,
            randomCount: this.randomCount,
            randomSubPage: this.randomSubPage,
            randomSubCount: this.randomSubCount,
            host: StringUtil.isEmpty(this.host, true) ? undefined : encodeURIComponent(this.host),
            search: StringUtil.isEmpty(this.search, true) ? undefined : encodeURIComponent(this.search),
            testCaseSearch: StringUtil.isEmpty(this.testCaseSearch, true) ? undefined : this.testCaseSearch,
            randomSearch: StringUtil.isEmpty(this.randomSearch, true) ? undefined : encodeURIComponent(this.randomSearch),
            randomSubSearch: StringUtil.isEmpty(this.randomSubSearch, true) ? undefined : encodeURIComponent(this.randomSubSearch)
          })
        } catch (e) {
          log(e)
        }

        // 实测 561059 长度的 URL 都支持，只是输入框显示长度约为 2000
        window.open(this.getShareLink(
          isRandom
          , null
          , null
          , null
          , this.isTestCaseShow || StringUtil.isEmpty(vHeader.value, true) ? null : encodeURIComponent(StringUtil.trim(vHeader.value))
          // , this.isTestCaseShow || StringUtil.isEmpty(vRandom.value, true) ? null : encodeURIComponent(StringUtil.trim(vRandom.value))
          , settingStr
        ))
      },
      getShareLink: function (isRandom, json, url, type, header, random, setting) {
        var jsonStr = json == null ? null : (typeof json == 'string' ? json : JSON.stringify(json))
        if (this.isTestCaseShow != true && jsonStr == null) { // StringUtil.isEmpty(jsonStr)
          try {
            jsonStr = JSON.stringify(encode(parseJSON(vInput.value)))
          } catch (e) {  // 可能包含注释
            log(e)
            jsonStr = encode(StringUtil.trim(vInput.value))
          }
        }

        var headerStr = header

        var randomStr = random

        // URL 太长导致打不开标签
        var settingStr = setting

        var href = window.location.href || 'http://apijson.cn/api'
        var ind = href == null ? -1 : href.indexOf('?')  // url 后带参数只能 encodeURIComponent

        return (ind < 0 ? href : href.substring(0, ind))
          + (this.view != 'code' ? "?send=false" : (isRandom ? "?send=random" : "?send=true"))
          + "&type=" + StringUtil.trim(type == null ? REQUEST_TYPE_JSON : type)
          + "&url=" + encodeURIComponent(StringUtil.trim(url == null ? vUrl.value : url))
          + (jsonStr == null ? '' : "&json=" + jsonStr)
          + (headerStr == null ? '' : "&header=" + headerStr)
          + (randomStr == null ? '' : "&random=" + randomStr)
          + (settingStr == null ? '' : "&setting=" + settingStr)

      },

      onClickSelectInput: function (item, index) {
        isClickSelectInput = true;
        this.selectInput(item, index, true);
      },
      selectInput: function (item, index, isDone) { // , isValue) {
        var target = currentTarget = currentTarget || vInput; // currentTarget = target;
        var isValue = isInputValue; // isInputValue = isValue;

        // 失去焦点后拿不到有效值
        // var selectionStart = target.selectionStart;
        // var selectionEnd = target.selectionEnd;

        var text = StringUtil.get(target.value);
        var before = text.substring(0, selectionStart);
        var after = text.substring(selectionEnd);

        var name = item == null ? '' : StringUtil.get(item.name);
        target.value = text = before + name + after
        if (target == vScript) { // 不这样会自动回滚
          this.scripts[this.scriptType][this.scriptBelongId][this.isPreScript ? 'pre' : 'post'].script = text
        }
        else if (target == vInput) {
          inputted = target.value;
        }

        if (isDone) {
          this.options = [];

          target.focus();
          try {
            selectionStart = target.selectionStart = selectionEnd + (isClickSelectInput ? (name.length - (isValue ? 4 : 0)) : 0)
                + (isValue ? (after.startsWith(',') ? 1 : 0) : (target == vInput || target == vScript ? 3 : 2));
            selectionEnd = target.selectionEnd = selectionStart + (isValue ? 0 : 4)
          } catch (e) {
            console.log(e)
          }
          isClickSelectInput = false;
          // vOption.focusout()

          if (this.isChainShow && this.isTestCaseShow) {
            this.addCase2Chain(item.value)
            return
          }

          if (isInputValue != true) {
            this.showOptions(target, text, before + name + (isSingle ? "'" : '"') + ': ', after.substring(3), true);
          }
        } else {
          target.selectionStart = selectionStart;
          selectionEnd = target.selectionEnd = selectionStart + name.length;
          isClickSelectInput = false;
        }
      },

      // 显示保存弹窗
      showSave: function (show) {
        if (show) {
          if (this.isTestCaseShow) {
            alert('请先输入请求内容！')
            return
          }

          var tag = this.getTag()
          this.history.name = (this.urlComment || this.getMethod() + (StringUtil.isEmpty(tag, true) ? '' : ' ' + tag)) + ' ' + this.formatTime() //不自定义名称的都是临时的，不需要时间太详细
        }
        this.isSaveShow = show
      },

      // 显示导出弹窗
      showExport: function (show, isRemote, isRandom, isScript) {
        if (show) {
          // this.isExportCheckShow = isRemote

          if (isRemote) { //共享测试用例
            this.isExportRandom = isRandom
            this.isExportScript = isScript

            // if (isRandom != true) {  // 分享搜索关键词和分页信息也挺好 } && this.isTestCaseShow != true) {  // 没有拿到列表，没用
              // setTimeout(function () {
              //   App.shareLink(App.isRandomTest)
              // }, 1000)
            // }

            if (this.isTestCaseShow) {
              alert('请先输入请求内容！')
              return
            }

            if (this.view == 'error') {  // this.view != 'code') {
              alert('发现错误，请输入正确的内容！')  // alert('请先测试请求，确保是正确可用的！')
              return
            }
            if (isRandom) {
              this.exTxt.name = '随机配置 ' + this.formatDateTime()
            }
            else if (isScript) { // 避免 APIJSON 启动报错  '执行脚本 ' + this.formatDateTime()
              this.exTxt.name = this.scriptType + (this.isPreScript ? 'Pre' : 'Post') + this.getCurrentScriptBelongId()
            }
            else {
              if (this.isEditResponse) {
                this.isExportRemote = isRemote
                this.exportTxt()
                return
              }

              // var tag = this.getTag()
              this.exTxt.name = this.urlComment || ''  // 避免偷懒不输入名称  this.getMethod() + (StringUtil.isEmpty(tag, true) ? '' : ' ' + tag)
            }
          }
          else { //下载到本地
            if (this.isTestCaseShow) { //文档
              this.exTxt.name = 'APIJSON自动化文档 ' + this.formatDateTime()
            }
            else if (this.view == 'markdown' || this.view == 'output') {
              var suffix
              switch (this.language) {
                case CodeUtil.LANGUAGE_KOTLIN:
                  suffix = '.kt';
                  break;
                case CodeUtil.LANGUAGE_JAVA:
                  suffix = '.java';
                  break;
                case CodeUtil.LANGUAGE_C_SHARP:
                  suffix = '.cs';
                  break;

                case CodeUtil.LANGUAGE_SWIFT:
                  suffix = '.swift';
                  break;
//                case CodeUtil.LANGUAGE_OBJECTIVE_C:
//                  suffix = '.h';
//                  break;

                case CodeUtil.LANGUAGE_GO:
                  suffix = '.go';
                  break;
                case CodeUtil.LANGUAGE_C_PLUS_PLUS:
                  suffix = '.cpp';
                  break;

                case CodeUtil.LANGUAGE_TYPE_SCRIPT:
                  suffix = '.ts';
                  break;
                case CodeUtil.LANGUAGE_JAVA_SCRIPT:
                  suffix = '.js';
                  break;

                case CodeUtil.LANGUAGE_PHP:
                  suffix = '.php';
                  break;
                case CodeUtil.LANGUAGE_PYTHON:
                  suffix = '.py';
                  break;
                default:
                  suffix = '.java';
                  break;
              }

              this.exTxt.name = 'User' + suffix
              alert('自动生成模型代码，可填类名后缀:\n'
                + 'Kotlin.kt, Java.java, Swift.swift, C#.cs, Go.go, TypeScript.ts, '
                + '\nJavaScript.js, PHP.php, Python.py, C++.cpp');
            }
            else {
              this.exTxt.name = 'APIJSON测试 ' + this.getMethod() + ' ' + this.formatDateTime()
            }
          }
        }

        this.isExportShow = show
        this.isExportRemote = isRemote
      },

      // 显示配置弹窗
      showConfig: function (show, index) {
        this.isConfigShow = false
        if (this.isTestCaseShow) {
          if (index == 3 || index == 4 || index == 5 || index == 10 || index == 13 || index == 16) {
            this.showTestCase(false, false)
          }
        }

        if (show) {
          this.exTxt.button = index == 8 ? '上传' : '切换'
          this.exTxt.index = index
          switch (index) {
            case 0:
            case 1:
            case 2:
            case 6:
            case 16:
            case 7:
            case 8:
            case 15:
              this.exTxt.name = index == 0 ? this.database : (index == 1 ? this.schema : (index == 2 ? this.language
                  : (index == 6 ? this.server : (index == 8 ? this.thirdParty : (index == 15 ? this.otherEnv
                   : (index == 16 ? (this.methods || []).join() : (this.types || []).join()))))))
              this.isConfigShow = true

              if (index == 0) {
                alert('可填数据库:\n' + CodeUtil.DATABASE_KEYS.join())
              }
              else if (index == 2) {
                alert('自动生成代码，可填语言:\nKotlin,Java,Swift,C#,Go,TypeScript,\nJavaScript,PHP,Python,C++')
              }
              else if (index == 16) {
                alert('多个方法用 , 隔开，可填方法: ' + HTTP_METHODS.join())
              }
              else if (index == 7) {
                alert('多个类型用 , 隔开，可填类型:\nPARAM(GET ?a=1&b=c&key=value),\nJSON(POST application/json),\nFORM(POST x-www-form-urlencoded),\nDATA(POST form-data),\nGRPC(POST application/json 需要 GRPC 服务开启反射)')
              }
              else if (index == 8) {
                this.isHeaderShow = true

                alert('例如：\nSWAGGER http://apijson.cn:8080/v2/api-docs\nSWAGGER /v2/api-docs  // 省略 Host\nSWAGGER /  // 省略 Host 和 分支 URL\nRAP /repository/joined /repository/get\nYAPI /api/interface/list_menu /api/interface/get\nPOSTMAN https://www.postman.com/collections/cd72b75c6a985f7a9737\nPOSTMAN /cd72b75c6a985f7a9737')

                try {
                  this.getThirdPartyApiList(this.thirdParty, function (platform, docUrl, listUrl, itemUrl, url_, res, err) {
                    CodeUtil.thirdParty = platform
                    var data = err != null ? null : (res || {}).data;
                    var code = data == null ? null : data.errCode || data.errcode || data.err_code

                    if (err != null || (code != null && code != 0)) {
                      App.isHeaderShow = true
                      App.isRandomShow = false
                      alert('请把 YApi/Rap/Swagger/Postman 等网站的有效 Cookie 粘贴到请求头 Request Header 输入框后再试！')
                    }

                    App.onResponse(url_, res, err)
                    return false
                  }, function (platform, docUrl, listUrl, itemUrl, url_, res, err) {
                    var data = (res || {}).data
                    var apiMap = CodeUtil.thirdPartyApiMap || {}

                    if (platform == PLATFORM_POSTMAN) {
                      var apis = data.item || data.requests
                      if (apis != null) {
                        for (var i = 0; i < apis.length; i++) {
                          var item = apis[i]
                          var req = item == null ? null : item.request
                          var urlObj = req.url || {}
                          var path = urlObj.path
                          var url = path instanceof Array ? '/' + path.join('/') : (typeof urlObj == 'string' ? urlObj : urlObj.raw)
                          if (StringUtil.isEmpty(url, true)) {
                            url = item.url
                          }
                          if (url != null && url.startsWith('{{url}}')) {
                            url = url.substring('{{url}}'.length)
                          }
                          url = App.getBranchUrl(url)

                          if (StringUtil.isEmpty(url, true)) {
                            continue
                          }

                          var name = item.name

                          apiMap[url] = {
                            name: name,
                            request: req,
                            response: item.response == null || item.response.length <= 0 ? null : item.response[0],
                            detail: name
                          }
                        }
                      }

                      return true
                    }
                    else if (platform == PLATFORM_SWAGGER) {
                      var apis = data == null ? null : data.paths
                      if (apis != null) {
                        // var i = 0
                        for (var url in apis) {
                          var item = apis[url]
                          apiMap[url] = item.post || item.get || item.put || item.delete
                        }
                      }
                    }
                    else if (platform == PLATFORM_RAP) {
                    }
                    else if (platform == PLATFORM_YAPI) {
                      var api = (data || {}).data
                      var url = api == null || api.path == null ? null : StringUtil.noBlank(api.path).replace(/\/\//g, '/')
                      if (StringUtil.isEmpty(url, true)) {
                        return
                      }

                      var typeAndParam = App.parseYApiTypeAndParam(api)

                      var name = StringUtil.trim(api.username) + ': ' + StringUtil.trim(api.title)
                      apiMap[url] = {
                        name: name,
                        request: typeAndParam.param,
                        response: api.res_body == null ? null : parseJSON(api.res_body),
                        detail: name
                        + '\n' + (api.up_time == null ? '' : (typeof api.up_time != 'number' ? api.up_time : new Date(1000*api.up_time).toLocaleString()))
                        + '\nhttp://apijson.cn/yapi/project/1/interface/api/' + api._id
                        + '\n\n' + (StringUtil.isEmpty(api.markdown, true) ? StringUtil.trim(api.description) : api.markdown.trim().replace(/\\_/g, '_'))
                      }
                    }
                    else {
                      alert('第三方平台只支持 Postman, Swagger, Rap, YApi ！')
                      return true
                    }

                    CodeUtil.thirdPartyApiMap = apiMap
                    App.saveCache(App.thirdParty, 'thirdPartyApiMap', apiMap);

                    return true
                  })
                } catch (e) {
                  console.log('created  try { ' +
                    '\nthis.User = this.getCache(this.server, User) || {}' +
                    '\n} catch (e) {\n' + e.message)
                }

              }
              break
            case 3:
              this.host = this.getBaseUrl()
              this.showUrl(false, StringUtil.get(vUrl.value).substring(this.host.length)) //没必要导致必须重新获取 Response，this.onChange(false)
              break
            case 4:
              this.isHeaderShow = show
              this.saveCache('', 'isHeaderShow', show)
              break
            case 13:
              this.isScriptShow = show
              this.saveCache('', 'isScriptShow', show)
              this.listScript()
              break
            case 5:
              this.isRandomShow = show
              this.saveCache('', 'isRandomShow', show)
              break
            case 9:
              this.isDelegateEnabled = show
              this.saveCache('', 'isDelegateEnabled', show)
              break
            case 14:
              this.isEnvCompareEnabled = show
              this.saveCache('', 'isEnvCompareEnabled', show)

              // this.enableML(false)
              break
            case 10:
              this.isPreviewEnabled = show
              this.saveCache('', 'isPreviewEnabled', show)

              this.onChange(false)
              break
            case 17:
              this.isStatisticsEnabled = show
              this.saveCache('', 'isStatisticsEnabled', show)

              this.isTestCaseShow = false
              // this.resetTestCount(this.currentAccountIndex)

              this.remotes = null
              this.reportId = 0
              this.showTestCase(true, false)
              break
            case 12:
              this.isEncodeEnabled = show
              this.saveCache('', 'isEncodeEnabled', show)
              break
            case 11:
              var did = ((this.currentRemoteItem || {}).Document || {}).id
              if (did == null) {
                alert('请先选择一个已上传的用例！')
                return
              }

              this.isEditResponse = show
              // this.saveCache('', 'isEditResponse', show)

              vInput.value = ((this.view != 'code' || StringUtil.isEmpty(this.jsoncon, true) ? null : this.jsoncon)
                || (this.currentRemoteItem.TestRecord || {}).response) || ''

              vHeader.value = (this.currentRemoteItem.TestRecord || {}).header || ''

              this.isTestCaseShow = false
              this.onChange(false)
              break
          }
        }
        else if (index == 3) {
          var host = StringUtil.get(this.host)
          var branch = StringUtil.get(vUrl.value)
          this.host = ''
          vUrl.value = host + branch //保证 showUrl 里拿到的 baseUrl = this.host (http://apijson.cn:8080/put /balance)
          this.setBaseUrl() //保证自动化测试等拿到的 baseUrl 是最新的
          this.showUrl(false, branch) //没必要导致必须重新获取 Response，this.onChange(false)
        }
        else if (index == 4) {
          this.isHeaderShow = show
          this.saveCache('', 'isHeaderShow', show)
        }
        else if (index == 13) {
          this.isScriptShow = show
          this.saveCache('', 'isScriptShow', show)
        }
        else if (index == 5) {
          this.isRandomShow = show
          this.saveCache('', 'isRandomShow', show)
        }
        else if (index == 9) {
          this.isDelegateEnabled = show
          this.saveCache('', 'isDelegateEnabled', show)
        }
        else if (index == 10) {
          this.isPreviewEnabled = show
          this.saveCache('', 'isPreviewEnabled', show)
          // vRequestMarkdown.innerHTML = ''
        }
        else if (index == 17) {
          this.isStatisticsEnabled = show
          this.saveCache('', 'isStatisticsEnabled', show)
        }
        else if (index == 14) {
          this.isEnvCompareEnabled = show
          this.saveCache('', 'isEnvCompareEnabled', show)
          this.enableML(this.isMLEnabled)
        }
        else if (index == 12) {
          this.isEncodeEnabled = show
          this.saveCache('', 'isEncodeEnabled', show)
        }
        else if (index == 11) {
          this.isEditResponse = show
          // this.saveCache('', 'isEditResponse', show)

          vInput.value = (this.currentRemoteItem.Document || {}).request || ''
          vHeader.value = (this.currentRemoteItem.Document || {}).header || ''

          this.isTestCaseShow = false
          this.onChange(false)
        }
      },

      // 显示删除弹窗
      showDelete: function (show, item, index, isRandom, isChainGroup) {
        this.isDeleteShow = show
        this.isDeleteRandom = isRandom
        this.isDeleteChainGroup = isChainGroup
        this.exTxt.name = '请输入' + (isRandom ? '随机配置' : (isChainGroup ? '分组' : '接口')) + '名来确认'
        if (isRandom) {
          this.currentRandomItem = Object.assign(item, {
            index: index
          })
        }
        else {
          this.currentDocItem = Object.assign(item, {
            index: index
          })
        }
      },

      // 删除接口文档
      deleteDoc: function () {
        var isDeleteRandom = this.isDeleteRandom
        var isDeleteChainGroup = this.isDeleteChainGroup
        var item = (isDeleteRandom ? this.currentRandomItem : this.currentDocItem) || {}
        var doc = (isDeleteRandom ? item.Random : (isDeleteChainGroup ? item.Chain : item.Document)) || {}

        var type = isDeleteRandom ? '随机配置' : (isDeleteChainGroup ? '分组' : '接口')
        if ((isDeleteChainGroup && doc.groupId == null) || (isDeleteChainGroup != true && doc.id == null)) {
          alert('未选择' + type + '或' + type + '不存在！')
          return
        }
        if ((isDeleteChainGroup && doc.groupName != this.exTxt.name) || (isDeleteChainGroup != true && doc.name != this.exTxt.name)) {
          alert('输入的' + type + '名和要删除的' + type + '名不匹配！')
          return
        }

        this.showDelete(false, {})

        this.isTestCaseShow = false
        this.isRandomListShow = false
        var isChainShow = this.isChainShow

        var url = this.server + '/delete'
        var req = isDeleteRandom ? {
          format: false,
          'Random': {
            'id': doc.id
          },
          'tag': 'Random'
        } : (isDeleteChainGroup || isChainShow ? {
          format: false,
          'Chain': {
            'id': isDeleteChainGroup ? null : doc.id,
            'groupId': isDeleteChainGroup ? doc.groupId : null
          },
          'tag': isDeleteChainGroup ? 'Chain-group' : 'Chain'
        } : {
          format: false,
          'Document': {
            'id': doc.id
          },
          'tag': 'Document'
        })
        this.adminRequest(url, req, {}, function (url, res, err) {
          App.onResponse(url, res, err)

          var data = res.data || {}

          if (isDeleteRandom) {
            if (data.Random != null && JSONResponse.isSuccess(data.Random)) {
              if (((item.Random || {}).toId || 0) <= 0) {
                App.randoms.splice(item.index, 1)
              }
              else {
                App.randomSubs.splice(item.index, 1)
              }
              // App.showRandomList(true, App.currentRemoteItem)
            }
          }
          else if (isDeleteChainGroup) {
            App.chainGroups.splice(item.index, 1)
            App.selectChainGroup(App.currentChainGroupIndex, null)
          }
          else {
            if (data.Document != null && JSONResponse.isSuccess(data.Document)) {
              App.remotes.splice(item.index, 1)
              App.showTestCase(true, App.isLocalShow)
            }
          }
        })
      },

      // 保存当前的JSON
      save: function () {
        if (this.history.name.trim() === '') {
          Helper.alert('名称不能为空！', 'danger')
          return
        }
        var val = {
          name: this.history.name,
          detail: this.history.name,
          type: this.type,
          url: '/' + this.getMethod(),
          request: inputted,
          response: this.jsoncon,
          header: vHeader.value,
          // random: vRandom.value,
          scripts: this.scripts
        }
        var key = String(Date.now())
        localforage.setItem(key, val, function (err, value) {
          Helper.alert('保存成功！', 'success')
          App.showSave(false)
          val.key = key
          App.historys.push(val)
        })
      },

      // 清空本地历史
      clearLocal: function () {
        this.locals.splice(0, this.locals.length) //UI无反应 this.locals = []
        this.saveCache('', 'locals', [])
      },

      // 删除已保存的
      remove: function (item, index, isRemote, isRandom, isProject, isChainGroup) {
        if (isRemote == null || isRemote == false) { //null != false
          if (isProject) {
            this.projectHosts.splice(index, 1)
            this.saveCache('', 'projectHosts', this.projectHosts)
            return
          }

          localforage.removeItem(item.key, function () {
            App.historys.splice(index, 1)
          })
        } else {
          if (this.isLocalShow) {
            this.locals.splice(index, 1)
            this.saveCache('', 'locals', this.locals)
            return
          }

          if (isRandom && (((item || {}).Random || {}).id || 0) <= 0) {
            this.randomSubs.splice(index, 1)
            return
          }

          this.showDelete(true, item, index, isRandom, isChainGroup)
        }
      },

      // 根据参数注入用例恢复数据
      restoreRandom: function (index, item) {
        this.currentRandomIndex = index
        this.currentRandomItem = item
        this.isRandomListShow = false
        this.isRandomSubListShow = false
        var random = (item || {}).Random || {}
        this.randomTestTitle = random.name
        this.testRandomCount = random.count
        // vRandom.value = StringUtil.get(random.config)

        var response = ((item || {}).TestRecord || {}).response
        if (StringUtil.isEmpty(response, true) == false) {
            this.jsoncon = StringUtil.trim(response)
            this.view = 'code'
        }
      },
      // 根据测试用例/历史记录恢复数据
      restoreRemoteAndTest: function (index, item) {
        this.restoreRemote(index, item, true)
      },
      // 根据测试用例/历史记录恢复数据
      restoreRemote: function (index, item, test, showRandom) {
        this.currentDocIndex = index
        this.currentRemoteItem = item
        if (showRandom != null) {
           this.isRandomShow = showRandom
           this.isRandomListShow = showRandom
        }
        this.restore(item, ((item || {}).TestRecord || {}).response, true, test)
      },
      // 根据历史恢复数据
      restore: function (item, response, isRemote, test) {
        this.isEditResponse = false

        item = item || {}
        var doc = item
        var docId = doc.id || 0

        var scripts = item.scripts
        if (isRemote) {
          var originItem = item
          item.random = (originItem.Random || {}).config

          doc = item.Document || {}
          docId = doc.id || 0

          var pre = Object.assign({
            'script': ''
          }, item['Script:pre'] || {})
          var post = Object.assign({
            'script': ''
          }, item['Script:post'] || {})

          var preId = pre.id
          var postId = post.id
          if (docId > 0 && (preId == null || postId == null)) {
            // var accountId = this.getCurrentAccountId();
            const cri = this.currentRemoteItem || {}
            const chain = cri.Chain || {}
            const cId = chain.id || 0

            this.request(true, REQUEST_TYPE_POST, REQUEST_TYPE_JSON, '/get', {
              'Script:pre': preId != null ? undefined : {
                'ahead': 1,
                // 'testAccountId': 0,
                'chainId': cId,
                'documentId': docId,
                '@order': 'date-'
              },
              'Script:post': postId != null ? undefined : {
                'ahead': 0,
                // 'testAccountId': 0,
                'chainId': cId,
                'documentId': docId,
                '@order': 'date-'
              }
            }, {}, function (url, res, err) {
              var data = res.data
              if (JSONResponse.isSuccess(data) != true) {
                App.log(err != null ? err : (data == null ? '' : data.msg))
                return
              }

              // var scripts = item.scripts || {}
              var scripts = originItem.scripts || {}
              // var ss = scripts.case
              // if (ss == null) {
              //   scripts.case = ss = {}
              // }

              // var bs = ss[docId]
              // if (bs == null) {
              //   ss[docId] = bs = {}
              // }

              var bs = scripts

              var pre = data['Script:pre']
              if (pre != null && pre.script != null) {
                bs.pre = originItem['Script:pre'] = data['Script:pre']
              }

              var post = data['Script:post']
              if (post != null && post.script != null) {
                bs.post = originItem['Script:post'] = data['Script:post']
              }

              originItem.scripts = scripts

              App.changeScriptType(App.scriptType)
              App.scripts.case[docId] = scripts
            })
          }

          if (scripts == null) {
            scripts = {
              pre: pre,
              post: post
            }
          }
          item.scripts = scripts

          item = doc
          this.scripts.case[docId] = scripts
        }
        else {
          this.scripts = scripts
        }

        // localforage.getItem(item.key || '', function (err, value) {
          var branch = StringUtil.get(item.url || '/get')
          if (branch.startsWith('/') == false) {
            branch = '/' + branch
          }

          this.method = item.method;
          this.type = item.type;
          this.urlComment = item.name;
          this.requestVersion = item.version;
          this.showUrl(false, branch)

          this.showTestCase(false, this.isLocalShow)
          vInput.value = StringUtil.get(item.request)
          vHeader.value = StringUtil.get(item.header)
          // vRandom.value = StringUtil.get(item.random)
          this.changeScriptType(this.scriptType)

          this.onChange(false)

          if (isRemote) {
            this.randoms = []
            this.showRandomList(this.isRandomListShow, item)
          }

          if (test) {
            this.send(false)
          }
          else {
            if (StringUtil.isEmpty(response, true) == false) {
              setTimeout(function () {
                App.jsoncon = StringUtil.trim(response)
                App.view = 'code'
              }, 500)
            }
          }

        // })
      },

      onClickHost: function(index, item) {
        this.projectHost = item = item || {}
        this.isTestCaseShow = false

        this.host = ''
        var bu = this.getBranchUrl()

        vUrl.value = item.host + bu
        this.showUrl(false, bu)

        this.saveCache('', 'URL_BASE', baseUrl)
        this.saveCache('', 'projectHost', this.projectHost)
      },

      listProjectHost: function() {
        var req = {
            'TestRecord[]': {
                'count': 0,
                'TestRecord': {
                    '@column': 'DISTINCT host,project',
                    '@from@': {
                        'join': '&/Document',
                        'TestRecord': {
                            '@column': 'host,documentId',
                            '@group': 'host,documentId',
                            'host{}': 'length(host)>2'
                        },
                        'Document': {
                            'id@': '/TestRecord/documentId',
                            '@column': "ifnull(project,''):project",
                            '@group': 'project',
//                            'project{}': 'length(project)>0'
                        }
                    }
                }
            }
        }

        this.request(true, REQUEST_TYPE_POST, REQUEST_TYPE_JSON, this.server + '/get', req, {}, function (url, res, err) {
          var data = res.data
          if (JSONResponse.isSuccess(data) != true) {
            App.log(err != null ? err : (data == null ? '' : data.msg))
            return
          }

          var projectHosts = App.getCache('', 'projectHosts', [])
          var list = data['TestRecord[]'] || []
//          var phs = []
//          for (var i = 0; i < list.length; i ++) {
//            var item = list[i] || {}
//            var host = (item.TestRecord || {}).host
//            if (StringUtil.isEmpty(host, true)) {
//              continue
//            }
//
//            phs.push({ 'host': host, 'project': (item.Document || {}).project })
//          }

          App.projectHosts = projectHosts.concat(list)
        })
      },

      syncProjectHost: function(index, item) {
        var rawProject = item == null ? null : item.rawProject
        var project = item == null ? null : item.project

        var list = this.testCases
        var count = list == null ? 0 : list.length
        if (count <= 0) {
          alert('没有可操作的用例！请先查询用例，保证有至少一个显示！')
          return
        }

        var ids = []
        for (var i = 0; i < count; i ++) {
           var item = list[i]
           var doc = item == null ? null : item.Document
           var id = doc == null ? null : doc.id
           if (id == null || id <= 0) {
             continue
           }

           ids.push(id)
        }

        var req = {
          'Document': {
            'id{}': ids,
            'project{}': [null, '', rawProject],
            'project': project || ''
          },
          'tag': 'Document-project[]'
        }

        this.adminRequest('/put', req, {}, function (url, res, err) {
          App.onResponse(url, res, err)
          var data = res.data
          if (JSONResponse.isSuccess(data)) {
             App.listProjectHost()
          }
        })
      },

      // 获取所有保存的json
      listHistory: function () {
        localforage.iterate(function (value, key, iterationNumber) {
          if (key[0] !== '#') {
            value.key = key
            App.historys.push(value)
          }
          if (key === '#theme') {
            // 设置默认主题
            App.checkedTheme = value
          }
        })
      },

      // 导出文本
      exportTxt: function (btnIndex) {
        if (btnIndex == null) {
          btnIndex = 0
        }

        if (btnIndex == 1 && this.isExportRandom != true) {
          this.shareLink(this.isRandomTest)
          return
        }

        this.isExportShow = false

        if (this.isExportRemote == false) { //下载到本地

          if (this.isTestCaseShow) { //文档
            saveTextAs('# ' + this.exTxt.name + '\n主页: https://github.com/Tencent/APIJSON'
              + '\n\nBASE_URL: ' + this.getBaseUrl()
              + '\n\n\n## 测试用例(Markdown格式，可用工具预览) \n\n' + this.getDoc4TestCase()
              + '\n\n\n\n\n\n\n\n## 文档(Markdown格式，可用工具预览) \n\n' + doc
              , this.exTxt.name + '.txt')
          }
          else if (this.view == 'markdown' || this.view == 'output') { //model
            var clazz = StringUtil.trim(this.exTxt.name)

            var txt = '' //配合下面 +=，实现注释判断，一次全生成，方便测试
            if (clazz.endsWith('.java')) {
              txt += CodeUtil.parseJavaBean(docObj, clazz.substring(0, clazz.length - 5), this.database)
            }
            else if (clazz.endsWith('.swift')) {
              txt += CodeUtil.parseSwiftStruct(docObj, clazz.substring(0, clazz.length - 6), this.database)
            }
            else if (clazz.endsWith('.kt')) {
              txt += CodeUtil.parseKotlinDataClass(docObj, clazz.substring(0, clazz.length - 3), this.database)
            }
            else if  (clazz.endsWith('.m')) {
              txt += CodeUtil.parseObjectiveCEntity(docObj, clazz.substring(0, clazz.length - 2), this.database)
            }
            else if  (clazz.endsWith('.cs')) {
              txt += CodeUtil.parseCSharpEntity(docObj, clazz.substring(0, clazz.length - 3), this.database)
            }
            else if  (clazz.endsWith('.php')) {
              txt += CodeUtil.parsePHPEntity(docObj, clazz.substring(0, clazz.length - 4), this.database)
            }
            else if  (clazz.endsWith('.go')) {
              txt += CodeUtil.parseGoEntity(docObj, clazz.substring(0, clazz.length - 3), this.database)
            }
            else if  (clazz.endsWith('.cpp')) {
              txt += CodeUtil.parseCppStruct(docObj, clazz.substring(0, clazz.length - 4), this.database)
            }
            else if  (clazz.endsWith('.js')) {
              txt += CodeUtil.parseJavaScriptEntity(docObj, clazz.substring(0, clazz.length - 3), this.database)
            }
            else if  (clazz.endsWith('.ts')) {
              txt += CodeUtil.parseTypeScriptEntity(docObj, clazz.substring(0, clazz.length - 3), this.database)
            }
            else if (clazz.endsWith('.py')) {
              txt += CodeUtil.parsePythonEntity(docObj, clazz.substring(0, clazz.length - 3), this.database)
            }
            else {
              alert('请正确输入对应语言的类名后缀！')
            }

            if (StringUtil.isEmpty(txt, true)) {
              alert('找不到 ' + clazz + ' 对应的表！请检查数据库中是否存在！\n如果不存在，请重新输入存在的表；\n如果存在，请刷新网页后重试。')
              return
            }
            saveTextAs(txt, clazz)
          }
          else {
            var res = parseJSON(this.jsoncon)
            res = this.removeDebugInfo(res)

            var s = ''
            switch (this.language) {
              case CodeUtil.LANGUAGE_KOTLIN:
                s += '(Kotlin):\n\n' + CodeUtil.parseKotlinResponse('', res, 0, false, ! isSingle)
                break;
              case CodeUtil.LANGUAGE_JAVA:
                s += '(Java):\n\n' + CodeUtil.parseJavaResponse('', res, 0, false, ! isSingle)
                break;
              case CodeUtil.LANGUAGE_C_SHARP:
                s += '(C#):\n\n' + CodeUtil.parseCSharpResponse('', res, 0)
                break;

              case CodeUtil.LANGUAGE_SWIFT:
                s += '(Swift):\n\n' + CodeUtil.parseSwiftResponse('', res, 0, isSingle)
                break;
//              case CodeUtil.LANGUAGE_OBJECTIVE_C:
//                s += '(Objective-C):\n\n' + CodeUtil.parseObjectiveCResponse('', res, 0)
//                break;

              case CodeUtil.LANGUAGE_GO:
                s += '(Go):\n\n' + CodeUtil.parseGoResponse('', res, 0)
                break;
              case CodeUtil.LANGUAGE_C_PLUS_PLUS:
                s += '(C++):\n\n' + CodeUtil.parseCppResponse('', res, 0, isSingle)
                break;

              case CodeUtil.LANGUAGE_TYPE_SCRIPT:
                s += '(TypeScript):\n\n' + CodeUtil.parseTypeScriptResponse('', res, 0, isSingle)
                break;
              case CodeUtil.LANGUAGE_JAVA_SCRIPT:
                s += '(JavaScript):\n\n' + CodeUtil.parseJavaScriptResponse('', res, 0, isSingle)
                break;

              case CodeUtil.LANGUAGE_PHP:
                s += '(PHP):\n\n' + CodeUtil.parsePHPResponse('', res, 0, isSingle)
                break;
              case CodeUtil.LANGUAGE_PYTHON:
                var isML = this.isMLEnabled
                var tr = (this.currentRemoteItem || {}).TestRecord || {}
                var stddObj = isML ? JSONResponse.updateFullStandard(parseJSON(tr.standard), res, isML) : null
                var resObj = isML ? stddObj : (res || parseJSON(tr.response))
                s += '(Python):\n\n' + CodeUtil.parsePythonResponse('', resObj, 0, ! isSingle, isML)
                break;
              default:
                s += ':\n没有生成代码，可能生成代码(封装,解析)的语言配置错误。 \n';
                break;
            }

            saveTextAs('# ' + this.exTxt.name + '\n主页: https://github.com/Tencent/APIJSON'
              + '\n\n\nURL: ' + StringUtil.get(vUrl.value)
              + '\n\n\nHeader:\n' + StringUtil.get(vHeader.value)
              + '\n\n\nRequest:\n' + StringUtil.get(vInput.value)
              + '\n\n\nResponse:\n' + StringUtil.get(this.jsoncon)
              + '\n\n\n## 解析 Response 的代码' + s
              , this.exTxt.name + '.txt')
          }
        }
        else { //上传到远程服务器
          var id = this.User == null ? null : this.User.id
          if (id == null || id <= 0) {
            alert('请先登录！')
            return
          }

          const project = (this.projectHost || {}).project

          const isExportRandom = this.isExportRandom
          const isExportScript = this.isExportScript

          const cri = this.currentRemoteItem || {}
          const chain = cri.Chain || {}
          const currentAccountId = this.getCurrentAccountId()
          const doc = cri.Document || {}
          const tr = cri.TestRecord || {}
          const cgId = chain.groupId || 0
          const cId = chain.id || 0
          const did = isExportRandom && btnIndex == 1 ? null : doc.id

          if (isExportScript) {
            const extName = this.exTxt.name;
            const scriptType = this.scriptType
            const script = ((this.scripts[scriptType] || {})[this.getCurrentScriptBelongId()] || {})[this.isPreScript ? 'pre' : 'post'] || {};
            const sid = script.id
            const url = sid == null ? '/post' : '/put'
            const req = {
              format: false,
              'Script': Object.assign({
                'id': sid == null ? undefined : sid,
                'simple': 1,
                'ahead': this.isPreScript ? 1 : 0,
                'chainGroupId': cgId,
                'chainId': cId,
                'documentId': did == null || scriptType != 'case' ? 0 : did,
                'testAccountId': scriptType != 'account' ? 0 : currentAccountId,
                'name': extName,
                'script': vScript.value
              }, script),
              'tag': 'Script'
            }

            this.request(true, REQUEST_TYPE_POST, REQUEST_TYPE_JSON, url, req, {}, function (url, res, err) {
              App.onResponse(url, res, err)

              var data = res.data || {}
              var isPut = url.indexOf('/put') >= 0
              var ok = JSONResponse.isSuccess(data)
              alert((isPut ? '修改' : '上传') + (ok ? '成功' : '失败！\n' + StringUtil.get(err != null ? err.message : data.msg)))

              if (ok && ! isPut) {
                script.id = (data.Script || {}).id
              }
            })

            return
          }

          const isEditResponse = this.isEditResponse
          const isReleaseRESTful = isExportRandom && btnIndex == 1 && ! isEditResponse

          const path = this.getMethod();
          const methodInfo = isReleaseRESTful ? (JSONObject.parseUri(path, true) || {}) : {};
          if (isReleaseRESTful) {
            var isRestful = methodInfo.isRestful;
            var tag = methodInfo.tag;
            var table = methodInfo.table;

            if (isRestful) {
              alert('请求 URL 格式不是 APIJSON 万能通用接口！必须为 /get/user 这种 /{method}/{tag} 格式！其中 method 只能为 [' + APIJSON_METHODS.join() + '] 中的一个，tag 不能为 Table, Table[] 这种与 APIJSON 简单接口冲突的格式！ ')
              return
            }
            if (StringUtil.isEmpty(tag, true)) {
              alert('请求 URL 缺少 tag！必须为 /get/user 这种 /{method}/{tag} 格式！其中 method 只能为 [' + APIJSON_METHODS.join() + '] 中的一个，tag 不能为 Table, Table[] 这种与 APIJSON 简单接口冲突的格式！ ')
              return
            }
            if (JSONObject.isTableKey(table)) {
              alert('请求 URL 中的字符 ' + table + ' 与 APIJSON 简单接口冲突！必须为 /get/user 这种 /{method}/{tag} 格式！其中 method 只能为 [' + APIJSON_METHODS.join() + '] 中的一个，tag 不能为 Table, Table[] 这种与 APIJSON 简单接口冲突的格式！ ')
              return
            }
          }

          if ((isExportRandom != true || btnIndex == 1) && StringUtil.isEmpty(this.exTxt.name, true)) {
            alert('请输入接口名！')
            return
          }

          if (isExportRandom && btnIndex <= 0 && did == null) {
            alert('请先上传测试用例！')
            return
          }

          this.isTestCaseShow = false

          const currentResponse = this.view != 'code' || StringUtil.isEmpty(this.jsoncon, true) ? {} : this.removeDebugInfo(parseJSON(this.jsoncon));

          const after = isSingle ? this.switchQuote(inputted) : inputted;  // this.toDoubleJSON(inputted);
          const inputObj = this.getRequest(after, {});

          const rawInputStr = JSON.stringify(inputObj)

          var commentObj = null;
          if (isExportRandom != true) {
            var commentStddObj = null
            try {
              commentStddObj = parseJSON(isEditResponse ? tr.standard : doc.standard);
            }
            catch(e) {
              log(e)
            }

            var code_ = inputObj.code
            if (isEditResponse) {
              inputObj.code = null  // delete inputObj.code
            }

            commentObj = JSONResponse.updateStandard(commentStddObj, inputObj);
            CodeUtil.parseComment(after, docObj == null ? null : docObj['[]'], path, this.database, this.language, isEditResponse != true, commentObj, true);

            if (isEditResponse) {
              inputObj.code = code_
            }
          }

          var rawRspStr = JSON.stringify(currentResponse || {})
          const code = currentResponse.code;
          const thrw = currentResponse.throw;
          delete currentResponse.code; // currentResponse.code = null; //code必须一致
          delete currentResponse.throw; // currentResponse.throw = null; // throw必须一致

          const isML = this.isMLEnabled;
          const stddObj = isML ? JSONResponse.updateStandard({}, currentResponse) : {};
          stddObj.status = (this.currentHttpResponse || {}).status || 200;
          stddObj.code = code || 0;
          stddObj.throw = thrw;
          currentResponse.code = code;
          currentResponse.throw = thrw;

          var config = '' // vRandom.value;
          const mapReq = {};
          const mustKeys = [];
          const typeObj = {};
          const refuseKeys = [];

          if (isReleaseRESTful) {
            var mapReq2 = {}

            var cfgLines = StringUtil.split(config, '\n', true);
            var newCfg = '';
            if (cfgLines != null) {
              for (var i = 0; i < cfgLines.length; i++) {
                var cfgLine = cfgLines[i];
                var ind = cfgLine == null ? -1 : cfgLine.indexOf(': ');
                if (ind <= 0) {
                  continue;
                }

                var cInd = cfgLine.indexOf('//');
                if (cInd >= 0 && cInd <= ind) {
                  continue;
                }

                var k = cfgLine.substring(0, ind).replaceAll('/', '.'); // .trim();
                var ks = StringUtil.split(k, '.')
                var p = inputObj;
                for (var j = 0; j < ks.length - 1; j ++) {
                  if (p == null) {
                    break;
                  }

                  var jk = ks[j];
                  p = jk == null ? null : p[jk];
                }

                var v = p == null ? null : p[ks[ks.length - 1]];
                mapReq[k] = v;
                mapReq2[k] = v;

                // 智能判断 count, @key 等
                if (k.startsWith('@') || k.endsWith('[].count') || k.endsWith('[].query') || ['format', 'version'].indexOf(k) >= 0) {
                  refuseKeys.push('!' + k);
                }
                else {
                  mustKeys.push(k);
                }

                var t = JSONResponse.getType(v);
                typeObj[k] = t == 'integer' ? 'NUMBER' : (t == 'number' ? 'DECIMAL' : t.toUpperCase());

                newCfg += (i <= 0 ? '' : '\n') + k + ': ' + cfgLine.substring(ind+2).trim();
              }

              refuseKeys.push('!');
              config = newCfg;
            }

            commentObj = JSONResponse.updateStandard({}, mapReq2);
          }

          var callback = function (randomName, constConfig, constJson) {
            // 用现成的测试过的更好，Response 与 Request 严格对应
            // var mapReq = {};
            // if (isExportRandom && btnIndex == 1) {
            //
            //   var mapReq2 = {}
            //   var cfgLines = StringUtil.split(constConfig, '\n', true);
            //   if (cfgLines != null) {
            //     for (var i = 0; i < cfgLines.length; i++) {
            //       var cfgLine = cfgLines[i];
            //       var ind = cfgLine == null ? -1 : cfgLine.indexOf(': ');
            //       if (ind <= 0) {
            //         continue;
            //       }
            //
            //       var k = cfgLine.substring(0, ind).replaceAll('/', '.'); // .trim();
            //       var v = cfgLine.substring(ind + 1).trim();
            //       try {
            //         v = parseJSON(v);
            //       }
            //       catch (e) {
            //         log(e)
            //       }
            //
            //       mapReq[k] = v
            //       mapReq2[k] = v
            //     }
            //   }
            //
            //   commentObj = JSONResponse.updateStandard({}, mapReq2);
            // }

            const userId = App.User.id;
            const methods = App.methods;
            const method = App.isShowMethod() ? App.method : null;
            const extName = App.exTxt.name;
            const baseUrl = App.getBaseUrl();
            const url = (isReleaseRESTful ? baseUrl : App.server) + (isExportRandom || isEditResponse || did == null ? '/post' : '/put')
            const reqObj = btnIndex <= 0 ? constJson : mapReq
            const req = isExportRandom && btnIndex <= 0 ? {
              format: false,
              'Random': {
                userId: userId,
                toId: 0,
                chainGroupId: cgId,
                chainId: cId,
                documentId: did,
                count: App.requestCount,
                name: App.exTxt.name,
                config: config
              },
              'TestRecord': {
                'userId': userId,
                'documentId': did,
                'host': StringUtil.isEmpty(baseUrl, true) ? null : baseUrl,
                'chainGroupId': cgId,
                'chainId': cId,
                'response': rawRspStr,
                'standard': isML ? JSON.stringify(stddObj) : null
              },
              'tag': 'Random'
            } : {
              format: false,
              'Document': isEditResponse ? null : {
                'id': did == null ? undefined : did,
                'userId': userId,
                'project': StringUtil.isEmpty(project, true) ? null : project,
//                'testAccountId': currentAccountId,
//                'chainGroupId': cgId,
                'operation': CodeUtil.getOperation(path, reqObj),
                'name': extName,
                'method': method,
                'type': App.type,
                'url': '/' + path, // 'url': isReleaseRESTful ? ('/' + methodInfo.method + '/' + methodInfo.tag) : ('/' + path),
                'request': JSON.stringify(reqObj, null, '    '),
                'apijson': btnIndex <= 0 ? undefined : JSON.stringify(constJson, null, '    '),
                'standard': commentObj == null ? null : JSON.stringify(commentObj, null, '    '),
                'header': vHeader.value,
                'detail': App.getExtraComment() || ((App.currentRemoteItem || {}).Document || {}).detail,
              },
              'TestRecord': isEditResponse != true && did != null ? null : {
                'userId': userId,
//                'chainGroupId': cgId,
                'documentId': isEditResponse ? did : undefined,
                'randomId': 0,
                'host': baseUrl,
//                'testAccountId': currentAccountId,
                'response': isEditResponse ? rawInputStr : rawRspStr,
                'standard': isML || isEditResponse ? JSON.stringify(isEditResponse ? commentObj : stddObj) : undefined,
                // 没必要，直接都在请求中说明，查看也方便 'detail': (isEditResponse ? App.getExtraComment() : null) || ((App.currentRemoteItem || {}).TestRecord || {}).detail,
              },
              'tag': isEditResponse ? 'TestRecord' : 'Document'
            }

            App.request(true, REQUEST_TYPE_POST, REQUEST_TYPE_JSON, url, req, {}, function (url, res, err) {
              App.onResponse(url, res, err)

              var data = res.data || {}

              if (isExportRandom && btnIndex <= 0) {
                if (JSONResponse.isSuccess(data)) {
                  App.randoms = []
                  App.showRandomList(true, (App.currentRemoteItem || {}).Document)
                }
              }
              else {
                var isPut = url.indexOf('/put') >= 0

                if (JSONResponse.isSuccess(data) != true) {
                  if (isPut) {  // 修改失败就转为新增
                    App.currentRemoteItem = null;
                    alert('修改失败，请重试(自动转为新增)！' + StringUtil.trim(data.msg))
                  }
                }
                else {
                  App.remotes = []
                  App.showTestCase(true, false)

                  if (isPut) {  // 修改失败就转为新增
                    alert('修改成功')
                    return
                  }

                  if (isReleaseRESTful) {
                    var structure = {"MUST": mustKeys.join(), "TYPE": typeObj, "REFUSE": refuseKeys.join()};

                    var reqObj = {
                      format: false,
                      Request: {
                        method: StringUtil.toUpperCase(methodInfo.method),
                        tag: methodInfo.tag,
                        structure: JSON.stringify(structure, null, '    '),
                        detail: extName
                      },
                      tag: 'Request'
                    };

                    App.request(true, REQUEST_TYPE_POST, REQUEST_TYPE_JSON, baseUrl + '/post', reqObj, {}, function (url, res, err) {
                      if (res.data != null && res.data.Request != null && JSONResponse.isSuccess(res.data.Request)) {
                        alert('已自动生成并上传 Request 表校验规则配置:\n' + JSON.stringify(reqObj.Request, null, '  '))
                      }
                      else {
                        var reqStr = JSON.stringify(reqObj, null, '  ');
                        console.log('已自动生成，但上传以下 Request 表校验规则配置失败，可能需要手动加表记录:\nPOST ' + baseUrl + '/post' + '\n' + reqStr)
                        alert('已自动生成，但上传以下 Request 表校验规则配置失败，可能需要手动加表记录，如未自动复制可在控制台复制:\n' + reqStr)
                        navigator.clipboard.writeText(reqStr);
                      }
                      App.onResponse(url, res, err)
                    })
                  }

                  //自动生成随机配置（遍历 JSON，对所有可变值生成配置，排除 @key, key@, key() 等固定值）

                  const isGenerate = StringUtil.isEmpty(config, true);
                  var req = isGenerate != true ? null : (isReleaseRESTful ? mapReq : App.getRequest(vInput.value, {}))
                  App.newAndUploadRandomConfig(baseUrl, req, (data.Document || {}).id, config, App.requestCount, function (url, res, err) {



                        if (res.data != null && res.data.Random != null && JSONResponse.isSuccess(res.data.Random)) {
                          alert('已' + (isGenerate ? '自动生成并' : '') + '上传随机配置:\n' + config)
                          App.isRandomListShow = true
                        }
                        else {
                          alert((isGenerate ? '已自动生成，但' : '') + '上传以下随机配置失败:\n' + config)
                          // vRandom.value = config
                        }
                        App.onResponse(url, res, err)
                  }, isReleaseRESTful)
                }
              }
            })
          };

          if (btnIndex == 1) {
            // this.parseRandom(inputObj, config, null, true, true, false, callback)
            callback(null, null, inputObj)
          }
          else {
            callback(null, null, inputObj)
          }

        }
      },
      newAndUploadRandomConfig: function(baseUrl, req, documentId, config, count, callback, isReleaseRESTful) {
        if (documentId == null) {
          return
        }
        const isGenerate = StringUtil.isEmpty(config, true);
        var configs = isGenerate ? [] : [config]
        if (isGenerate) {
          var config = StringUtil.trim(this.newRandomConfig(null, '', req, false))
          if (StringUtil.isEmpty(config, true)) {
            return;
          }

          configs.push(config)
          config2 = StringUtil.trim(this.newRandomConfig(null, '', req, true))
          if (StringUtil.isNotEmpty(config2, true)) {
            configs.push(config2)
          }
        }

        for (var i = 0; i < configs.length; i ++) {
          const config = configs[i]
          this.request(true, REQUEST_TYPE_POST, REQUEST_TYPE_JSON, (isReleaseRESTful ? baseUrl : this.server) + '/post', {
            format: false,
            Random: {
              documentId: documentId,
              count: count,
              name: '默认配置' + (isGenerate ? '(上传测试用例时自动生成)' : ''),
              config: config
            },
            TestRecord: {
              host: baseUrl,
              response: ''
            },
            tag: 'Random'
          }, {}, callback)
        }
      },

      onClickAddRandom: function (randomIndex, randomSubIndex) {
         // if (this.isRandomListShow || this.isRandomSubListShow) {
         //    this.randomTestTitle = null;
         //    this.isRandomListShow = false;
         //    this.isRandomSubListShow = false;
         // } else if (StringUtil.isEmpty(vRandom.value, true)) {
         //    var req = this.getRequest(vInput.value, {})
         //    vRandom.value = StringUtil.trim(this.newRandomConfig(null, '', req, Math.random() >= 0.5, Math.random() >= 0.3, Math.random() >= 0.8))
         // } else {
         //    this.showExport(true, true, true)
         // }

         this.currentRandomIndex = randomIndex;
         this.currentRandomSubIndex = randomSubIndex;
         this.allowMultiple = randomIndex == null || randomIndex < 0;
         const fileInput = document.getElementById('imageInput');
         fileInput.click();
      },

      newRandomConfig: function (path, key, value, isRand, isBad, noDeep, isConst) {
        if (key == null) {
          return ''
        }
        if (path == '' && (key == 'tag' || key == 'version' || key == 'format')) {
          return ''
        }

        var config = ''
        var childPath = path == null || path == '' ? key : path + '/' + key
        var prefix = childPath + ': '

        var isPositive = Math.random() >= 0.3
        var offset = (isPositive ? '+' : '') + (isPositive ? 1 : -1)*randomPrimeInt()

        if (value instanceof Array) {
          if (isConst) {
               config += prefix + '[]'
               for (var i = 0; i < value.length; i ++) {
                  var cfg = this.newRandomConfig(childPath, '' + i, value[i], isRand, isBad, noDeep, isConst)
                  config += '\n' + (StringUtil.isEmpty(cfg, true) ? 'null' : cfg.trim())
               }
               return config
          }
          if (isBad && noDeep && StringUtil.isNotEmpty(childPath, true)) {
            return prefix + (isRand ? 'RANDOM_BAD_ARR' : 'ORDER_BAD_ARR' + offset) + '()'
          }

          if (Math.random() >= 7) {
              var val
              if (value.length <= 0) {
                val = ''
              }
              else {
                if (value.length <= 1) {
                  val = ', ' + JSON.stringify(value)
                }
                else if (value.length <= 2) {
                  val = ', ' + JSON.stringify([value[0]]) + ', ' + JSON.stringify([value[1]]) + ', ' + JSON.stringify(value)
                }
                else {
                  val = ', ' + JSON.stringify([value[0]]) + ', ' + JSON.stringify([value[value.length - 1]]) + ', ' + JSON.stringify([value[Math.floor(value.length / 2)]]) + ', ' + JSON.stringify(value)
                }
              }

              config += prefix + (isRand ? 'RANDOM_IN' : 'ORDER_IN') + '(undefined, null, false, true, -1025, 0, [], {}, 1, 3.14, "null", "undefined", Number.MAX_SAFE_INTEGER, "-1025", "0", "" + Number.MAX_SAFE_INTEGER, "[", "]", "{", "}", "1", "3.14", "true", "false"' + val + ')'
          }
          else {
              config += prefix + '[]'

              var l = randomInt(0, 13)
              for (var i = 0; i < l; i ++) {
                 var cfg = this.newRandomConfig(childPath, '' + i, value[i], isRand, isBad, noDeep, isConst)
                 if (StringUtil.isEmpty(cfg, true)) {
                   break
                 }

                 config += '\n' + cfg.trim()
              }
          }

          return config
        }
        else if (value instanceof Object) {
          if (isBad && noDeep && StringUtil.isNotEmpty(childPath, true)) {
            return prefix + (isRand ? 'RANDOM_BAD_OBJ' : 'ORDER_BAD_OBJ' + offset) + '()'
          }

          for (var k in value) {
            var v = value[k]

            var isAPIJSONArray = isConst == false && v instanceof Object && v instanceof Array == false
              && k.startsWith('@') == false && (k.endsWith('[]') || k.endsWith('@'))

            if (isAPIJSONArray) {
              if (k.endsWith('@')) {
                delete v.from
                delete v.range
              }

              prefix = '\n' + (childPath == null || childPath == '' ? '' : childPath + '/') + k + '/'
              if (v.hasOwnProperty('page')) {
                config += prefix + 'page: ' + (isRand ? 'RANDOM_INT' : 'ORDER_INT') + '(0, 10)'
                delete v.page
              }
              if (v.hasOwnProperty('count')) {
                config += prefix + 'count: ' + (isRand ? 'RANDOM_IN' : 'ORDER_IN') + '(undefined, null, 0, 1, 5, 10, 20'
                  + ([0, 1, 5, 10, 20].indexOf(v.count) >= 0 ? ')' : ', ' + v.count + ')')
                delete v.count
              }
              if (v.hasOwnProperty('query')) {
                config += prefix + 'query: ' + (isRand ? 'RANDOM_IN' : 'ORDER_IN') + '(undefined, null, 0, 1, 2)'
                delete v.query
              }
            }

            var cfg = this.newRandomConfig(childPath, k, v, isRand, isBad, noDeep, isConst)
            if (StringUtil.isNotEmpty(cfg, true)) {
              config += '\n' + cfg
            }
          }

          return config
        }
        else {
          if (isConst) {
            return prefix + JSON.stringify(value) // 会自动给 String 加 ""
          }
          //自定义关键词
          if (key.startsWith('@')) {
            return config
          }

          if (typeof value == 'boolean') {
            if (isBad) {
              return prefix + (isRand ? 'RANDOM_BAD_BOOL' : 'ORDER_BAD_BOOL' + offset) + '()'
            }

            config += prefix + (isRand ? 'RANDOM_IN' : 'ORDER_IN') + '(undefined, null, false, true)'
          }
          else if (typeof value == 'number') {
            if (isBad) {
              return prefix + (isRand ? 'RANDOM_BAD_NUM' : 'ORDER_BAD_NUM' + offset) + '()'
            }

            var isId = key == 'id' || key.endsWith('Id') || key.endsWith('_id') || key.endsWith('_ID')
            if (isId) {
              config += prefix + (isRand ? 'RANDOM_IN' : 'ORDER_IN') + '(undefined, null, ' + value + ')'
              if (value >= 1000000000) { //PHP 等语言默认精确到秒 1000000000000) {
                config += '\n// 可替代上面的 ' + prefix + 'RANDOM_INT(' + Math.round(0.9 * value) + ', ' + Math.round(1.1 * value) + ')'
              }
              else {
                config += '\n// 可替代上面的 ' + prefix + 'RANDOM_INT(1, ' + (10 * value) + ')'
              }
            }
            else {
              var valStr = String(value)
              var dotIndex = valStr.indexOf('.')
              var hasDot = dotIndex >= 0
              var keep = dotIndex < 0 ? 2 : valStr.length - dotIndex - 1

              if (value < 0) {
                config += prefix + (hasDot ? 'RANDOM_NUM' : 'RANDOM_INT') + '(' + (100 * value) + (hasDot ? ', 0, ' + keep + ')' : ', 0)')
              }
              else if (value > 0 && value < 1) {  // 0-1 比例
                config += prefix + 'RANDOM_NUM(0, 1, ' + keep + ')'
              }
              else if ((hasDot && value > 0 && value <= 100) || (hasDot != true && value > 5 && value <= 100)) {  // 10% 百分比
                config += prefix + (hasDot ? 'RANDOM_NUM(0, 100, ' + keep + ')' : 'RANDOM_INT(0, 100)')
              }
              else {
                config += prefix + (dotIndex < 0 && value <= 10
                      ? (isRand ? 'RANDOM_INT' : 'ORDER_INT') + '(0, 10)'
                      : ((hasDot ? 'RANDOM_NUM' : 'RANDOM_INT') + '(0, ' + 100 * value + (hasDot ? ', ' + keep + ')' : ')'))
                  )
                var hasDot = String(value).indexOf('.') >= 0

                if (value < 0) {
                  config += '\n// 可替代上面的 ' + prefix + (hasDot ? 'RANDOM_NUM' : 'RANDOM_INT') + '(' + (100 * value) + ', 0)'
                }
                else if (value > 0 && value < 1) { // 0-1 比例
                  config += '\n// 可替代上面的 ' + prefix + 'RANDOM_NUM(0, 1)'
                }
                else if (value >= 0 && value <= 100) { // 10% 百分比
                  config += '\n// 可替代上面的 ' + prefix + 'RANDOM_INT(0, 100)'
                }
                else {
                  config += '\n// 可替代上面的 ' + prefix + (hasDot != true && value < 10 ? (isRand ? 'RANDOM_INT' : 'ORDER_INT') + '(0, 9)' : ((hasDot ? 'RANDOM_NUM' : 'RANDOM_INT') + '(0, ' + 100 * value + ')'))
                }
              }
            }
          }
          else if (typeof value == 'string') {
            if (isBad) {
              return prefix + (isRand ? 'RANDOM_BAD_STR' : 'ORDER_BAD_STR' + offset) + '()'
            }

            //引用赋值 || 远程函数 || 匹配条件范围
            if (key.endsWith('@') || key.endsWith('()') || key.endsWith('{}')) {
              return config
            }

            config += prefix + (isRand ? 'RANDOM_IN' : 'ORDER_IN') + '(undefined, null, ""' + (value == '' ? ')' : ', "' + value + '")')
          }
          else {
            if (isBad) {
              return prefix + (isRand ? 'RANDOM_BAD' : 'ORDER_BAD' + offset) + '()'
            }

            config += prefix + (isRand ? 'RANDOM_IN' : 'ORDER_IN') + '(undefined, null' + (value == null ? ')' : ', ' + JSON.stringify(value) + ')')
          }

        }

        return config
      },



      // 保存配置
      saveConfig: function () {
        this.isConfigShow = this.exTxt.index == 8

        switch (this.exTxt.index) {
          case 0:
            this.database = CodeUtil.database = this.exTxt.name
            this.saveCache('', 'database', this.database)

            doc = null
            var item = this.accounts[this.currentAccountIndex]
            item.isLoggedIn = false
            this.onClickAccount(this.currentAccountIndex, item)
            break
          case 1:
            this.schema = CodeUtil.schema = this.exTxt.name
            this.saveCache('', 'schema', this.schema)

            doc = null
            var item = this.accounts[this.currentAccountIndex]
            item.isLoggedIn = false
            this.onClickAccount(this.currentAccountIndex, item)
            break
          case 2:
            this.language = CodeUtil.language = this.exTxt.name
            this.saveCache('', 'language', this.language)

            doc = null
            this.onChange(false)
            break
          case 6:
            this.server = this.exTxt.name
            this.saveCache('', 'server', this.server)
            this.logout(true)
            break
          case 16:
            this.methods = StringUtil.split(this.exTxt.name, ',', true)
            this.saveCache('', 'methods', this.methods)
            break
          case 7:
            this.types = StringUtil.split(this.exTxt.name, ',', true)
            this.saveCache('', 'types', this.types)
            break
          case 15:
            this.otherEnv = StringUtil.get(this.exTxt.name)
            this.saveCache('', 'otherEnv', this.otherEnv)
            break
          case 8:
            var thirdParty = this.exTxt.name
            this.getThirdPartyApiList(thirdParty, function (platform, docUrl, listUrl, itemUrl, url_, res, err) {
              var jsonData = (res || {}).data
              var isJSONData = jsonData instanceof Object
              if (isJSONData == false) {  //后面是 URL 才存储；是 JSON 数据则不存储
                App.thirdParty = thirdParty
                App.saveCache('', 'thirdParty', App.thirdParty)
              }

              const header = App.getHeader(vHeader.value)

              if (platform == PLATFORM_SWAGGER) {
                var swaggerCallback = function (url_, res, err) {
                  if (App.isSyncing) {
                    alert('正在同步，请等待完成')
                    return
                  }
                  App.isSyncing = true
                  App.onResponse(url_, res, err)

                  var apis = (res.data || {}).paths
                  if (apis == null) { // || apis.length <= 0) {
                    App.isSyncing = false
                    alert('没有查到 Swagger 文档！请开启跨域代理，并检查 URL 是否正确！')
                    return
                  }
                  App.exTxt.button = '...'

                  App.resetUploading()

                  var item
                  // var i = 0
                  for (var url in apis) {
                    item = apis[url]
                    //导致 url 全都是一样的  setTimeout(function () {
                    if (App.uploadSwaggerApi(url, item, 'get')
                      || App.uploadSwaggerApi(url, item, 'post')
                      || App.uploadSwaggerApi(url, item, 'put')
                      || App.uploadSwaggerApi(url, item, 'delete')
                    ) {}
                    // }, 100*i)
                    // i ++
                  }
                }

                if (isJSONData) {
                  swaggerCallback(docUrl, { data: jsonData }, null)
                }
                else {
                  App.request(false, REQUEST_TYPE_GET, REQUEST_TYPE_PARAM, docUrl, {}, header, swaggerCallback)
                }
              }
              else if (platform == PLATFORM_RAP || platform == PLATFORM_YAPI || platform == PLATFORM_POSTMAN) {
                var isRap = platform == PLATFORM_RAP
                var isPostman = isRap != true && platform == PLATFORM_POSTMAN

                var itemCallback = function (url, res, err) {
                  try {
                    App.onResponse(url, res, err)
                  } catch (e) {}

                  var data = res.data == null ? null : (isPostman ? (res.data.item || res.data.requests)  : res.data.data)
                  if (isRap || isPostman) {
                    var modules = data == null ? null : (isRap ? data.modules : data)
                    if (modules != null) {
                      for (var i = 0; i < modules.length; i++) {
                        var it = modules[i] || {}
                        if (isPostman) {
                          App.uploadPostmanApi(it)
                          continue
                        }

                        var interfaces = it.interfaces || []

                        for (var j = 0; j < interfaces.length; j++) {
                          App.uploadRapApi(interfaces[j])
                        }
                      }
                    }
                  }
                  else {
                    App.uploadYApi(data)
                  }
                }

                if (isJSONData) {
                  App.resetUploading()

                  itemCallback(itemUrl, { data: jsonData }, null)
                }
                else {
                  App.request(false, REQUEST_TYPE_GET, REQUEST_TYPE_PARAM, listUrl, {}, header, function (url_, res, err) {
                    if (App.isSyncing) {
                      alert('正在同步，请等待完成')
                      return
                    }
                    App.isSyncing = true
                    App.onResponse(url_, res, err)

                    var apis = res.data == null ? null : (isPostman ? res.data.item : res.data.data)
                    if (apis == null) { // || apis.length <= 0) {
                      App.isSyncing = false
                      alert('没有查到 ' + (isRap ? 'Rap' : 'YApi') + ' 文档！请开启跨域代理，并检查 URL 是否正确！')
                      return
                    }
                    App.exTxt.button = '...'

                    App.resetUploading()

                    if (isPostman) {
                      itemCallback(itemUrl, { data: res.data }, null)
                      return
                    }

                    for (var url in apis) {
                      var item = apis[url] || {}

                      var list = (isRap ? [ { _id: item.id } ] : (item == null ? null : item.list)) || []
                      for (let i1 = 0; i1 < list.length; i1++) {
                        var listItem1 = list[i1]
                        if (listItem1 == null || listItem1._id == null) {
                          App.log('listItem1 == null || listItem1._id == null >> continue')
                          continue
                        }

                        App.request(false, REQUEST_TYPE_GET, REQUEST_TYPE_PARAM, itemUrl + '?id=' + listItem1._id, {}, header, itemCallback)
                      }

                    }
                  })

                }

              }
              else {
                alert('第三方平台只支持 Postman, Swagger, Rap, YApi ！')
              }

              return true
            })

            break
        }
      },
      resetUploading: function() {
        App.uploadTotal = 0 // apis.length || 0
        App.uploadDoneCount = 0
        App.uploadFailCount = 0
        App.uploadRandomCount = 0
      },

      getThirdPartyApiList: function (thirdParty, listCallback, itemCallback) {
        this.parseThirdParty(thirdParty, function (platform, jsonData, docUrl, listUrl, itemUrl) {
          var isJSONData = jsonData instanceof Object

          const header = App.getHeader(vHeader.value)

          if (platform == PLATFORM_POSTMAN) {
            if (isJSONData) {
              listCallback(platform, docUrl, listUrl, itemUrl, itemUrl, { data: jsonData }, null)
            }
            else {
              App.request(false, REQUEST_TYPE_GET, REQUEST_TYPE_PARAM, docUrl, {}, header, function (url_, res, err) {
                if (listCallback != null && listCallback(platform, docUrl, listUrl, itemUrl, url_, res, err)) {
                  return
                }

                if (itemCallback != null) {
                  itemCallback(platform, docUrl, listUrl, itemUrl, itemUrl, res, err)
                }
              })
            }
          }
          else if (platform == PLATFORM_SWAGGER) {
            if (isJSONData) {
              listCallback(platform, docUrl, listUrl, itemUrl, itemUrl, { data: jsonData }, null)
            }
            else {
              App.request(false, REQUEST_TYPE_GET, REQUEST_TYPE_PARAM, docUrl, {}, header, function (url_, res, err) {
                if (listCallback != null && listCallback(platform, docUrl, listUrl, itemUrl, url_, res, err)) {
                  return
                }

                if (itemCallback != null) {
                  itemCallback(platform, docUrl, listUrl, itemUrl, itemUrl, res, err)
                }
              })
            }
          }
          else if (platform == PLATFORM_RAP || platform == PLATFORM_YAPI) {
            var isRap = platform == PLATFORM_RAP

            if (isJSONData) {
              if (listCallback != null && listCallback(platform, docUrl, listUrl, itemUrl, listUrl, {data: [jsonData]}, null)) {
                return
              }

              if (itemCallback != null) {
                itemCallback(platform, docUrl, listUrl, itemUrl, itemUrl, {data: jsonData}, null)
              }
            }
            else {
              App.request(false, REQUEST_TYPE_GET, REQUEST_TYPE_PARAM, listUrl, {}, header, function (url_, res, err) {
                if (listCallback != null && listCallback(platform, docUrl, listUrl, itemUrl, url_, res, err)) {
                  return
                }

                var apis = (res.data || {}).data
                if (apis == null) { // || apis.length <= 0) {
                  alert('没有查到 ' + (isRap ? 'Rap' : 'YApi') + ' 文档！' +
                    '\n请开启跨域代理，并检查 URL 是否正确！' +
                    '\nYApi/Rap/Swagger/Postman 网站的 Cookie 必须粘贴到请求头 Request Header 输入框！')
                  return
                }

                var item
                for (var url in apis) {
                  item = apis[url] || {}

                  var list = (isRap ? [ { _id: item.id } ] : (item == null ? null : item.list)) || []
                  for (let i1 = 0; i1 < list.length; i1++) {
                    var listItem1 = list[i1]
                    if (listItem1 == null || listItem1._id == null) {
                      App.log('listItem1 == null || listItem1._id == null >> continue')
                      continue
                    }

                    // var p = listItem1.path == null ? null : StringUtil.noBlank(listItem1.path).replaceAll('//', '/')
                    // if (p == null) {
                    //   continue
                    // }

                    App.request(false, REQUEST_TYPE_GET, REQUEST_TYPE_PARAM, itemUrl + '?id=' + listItem1._id, {}, header, function (url_, res, err) {
                      if (itemCallback != null) {
                        itemCallback(platform, docUrl, listUrl, itemUrl, url_, res, err)
                      }
                    })
                  }

                }
              })
            }
          }
          else {
            alert('第三方平台只支持 Postman, Swagger, Rap, YApi ！')
          }
        })

      },

      parseThirdParty: function (thirdParty, callback) {
        var tp = StringUtil.trim(thirdParty)
        var index = tp.indexOf(' ')
        var platform = index < 0 ? PLATFORM_SWAGGER : tp.substring(0, index).toUpperCase()
        var docUrl = index <= 0 ? tp.trim() : tp.substring(index + 1).trim()

        var jsonData = null
        try {
          jsonData = parseJSON(docUrl)
        }
        catch (e) {}

        var host = this.getBaseUrl()
        var listUrl = null
        var itemUrl = null

        if (platform == PLATFORM_POSTMAN) {
          if (docUrl.startsWith('/') || docUrl.indexOf('://') < 0) {
            docUrl = 'https://www.postman.com' + (docUrl.startsWith('/collections') ? '' : '/collections') + (docUrl.startsWith('/') ? '' : '/') + docUrl
          }
          listUrl = docUrl
        }
        else if (platform == PLATFORM_SWAGGER) {
          if (docUrl == '/') {
            docUrl += 'v2/api-docs'
          }
          if (docUrl.startsWith('/')) {
            docUrl = host + docUrl
          }
        }
        else if (platform == PLATFORM_RAP || platform == PLATFORM_YAPI) {
          var isRap = platform == PLATFORM_RAP
          index = docUrl.indexOf(' ')
          listUrl = index < 0 ? docUrl + (isRap ? '/repository/joined' : '/api/interface/list_menu') : docUrl.substring(0, index).trim()
          itemUrl = index < 0 ? docUrl + (isRap ? '/repository/get' : '/api/interface/get') : docUrl.substring(index + 1).trim()

          if (listUrl.startsWith('/')) {
            listUrl = host + listUrl
          }
          if (itemUrl.startsWith('/')) {
            itemUrl = host + itemUrl
          }
        }

        callback(platform, jsonData, docUrl, listUrl, itemUrl)
      },

      /**上传 Postman API
       * @param docItem
       * @param callback
       */
      uploadPostmanApi: function(docItem) {
        var api = docItem
        if (api == null) {
          log('postApi', 'api == null  >> return')
          this.exTxt.button = 'All:' + this.uploadTotal + '\nDone:' + this.uploadDoneCount + '\nFail:' + this.uploadFailCount
          return false
        }

        this.uploadTotal ++

        var request = api.request || {}
        var response = api.response || []
        var body = request.body || {}
        var json = body.raw || api.rawModeData
        var options = body.options || {}
        var language = (options.raw || {}).language

        var method = api.method || request.method
        var type = REQUEST_TYPE_JSON
        switch (method || '') {
          case 'GET':
            type = REQUEST_TYPE_PARAM
            break
          case 'POST':
            switch (language || '') {
              case 'form-data': // FIXME
                type = REQUEST_TYPE_DATA
                break
              case 'form-url-encoded': // FIXME
                type = REQUEST_TYPE_FORM
                break
              // case 'json':  //JSON
              default:
                type = REQUEST_TYPE_JSON
                break
            }
            break
          default:
            type = REQUEST_TYPE_JSON
            break
        }


        var urlObj = request.url || {}
        var path = urlObj.path
        var url = path instanceof Array ? '/' + path.join('/') : (typeof urlObj == 'string' ? urlObj : urlObj.raw)
        if (StringUtil.isEmpty(url, true)) {
          url = api.url
        }
        if (url != null && url.startsWith('{{url}}')) {
          url = url.substring('{{url}}'.length)
        }

        var parameters = api.queryParams || request.queryParams || (urlObj instanceof Object ? urlObj.query : null)
        var parameters2 = []
        if (parameters != null && parameters.length > 0) {

          for (var k = 0; k < parameters.length; k++) {
            var paraItem = parameters[k] || {}
            var name = paraItem.key || ''
            if (StringUtil.isEmpty(name, true)) {
              continue
            }

            var val = paraItem.value
            if (val == '{{' + name + '}}') {
              val = null
            }

            //转成和 Swagger 一样的字段及格式
            paraItem.name = name
            paraItem.type = paraItem.type == 'Number' ? 'integer' : StringUtil.toLowerCase(paraItem.type)
            paraItem.default = val

            parameters2.push(paraItem)
          }
        }

        var header = ''
        var headers = request.header || api.headerData || []
        if (headers != null && headers.length > 0) {
          for (var k = 0; k < headers.length; k++) {
            var paraItem = headers[k] || {}
            var name = paraItem.key || ''
            if (StringUtil.isEmpty(name, true)) {
              continue
            }

            var val = paraItem.value
            header += (k <= 0 ? '' : '\n') + name + ': ' + (val == null ? '' : val)
                + (StringUtil.isEmpty(paraItem.description, true) ? '' : ' // ' + paraItem.description)
          }
        }

        if (StringUtil.isEmpty(header, true)) {
          header = api.headers
        }

        return this.uploadThirdPartyApi(method, type, api.name || request.name, url, parameters2, json, header
          , api.description || request.description, null, response == null ? null : response[0])
      },

      /**上传 Swagger API
       * @param url
       * @param docItem
       * @param method
       * @param callback
       */
      uploadSwaggerApi: function(url, docItem, method) {
        method = method || 'get'
        var api = docItem == null ? null : docItem[method]
        if (api == null) {
          log('postApi', 'api == null  >> return')
          this.exTxt.button = 'All:' + this.uploadTotal + '\nDone:' + this.uploadDoneCount + '\nFail:' + this.uploadFailCount
          return false
        }

        this.uploadTotal ++

        var parameters = api.parameters || []
        var parameters2 = []
        if (parameters != null && parameters.length > 0) {

          for (var k = 0; k < parameters.length; k++) {
            var paraItem = parameters[k] || {}
            var name = paraItem.name || ''
            if (name == 'mock') {
              continue
            }

            parameters2.push(paraItem)
          }
        }

        return this.uploadThirdPartyApi(method, method == 'get' ? REQUEST_TYPE_PARAM : REQUEST_TYPE_JSON
          , api.summary, url, parameters2, null, api.headers, api.description)
      },


      /**上传 Rap API
       * @param docItem
       */
      uploadRapApi: function(docItem) {
        var api = docItem
        if (api == null) {
          log('postApi', 'api == null  >> return')
          this.exTxt.button = 'All:' + this.uploadTotal + '\nDone:' + this.uploadDoneCount + '\nFail:' + this.uploadFailCount
          return false
        }

        this.uploadTotal ++

        var method = REQUEST_TYPE_POST
        var type
        switch ((api.summary || {}).requestParamsType || '') {
          case 'QUERY_PARAMS':
            method = REQUEST_TYPE_GET
            type = REQUEST_TYPE_PARAM
            break
          case 'BODY_PARAMS':
            method = REQUEST_TYPE_POST
            switch ((api.summary || {}).bodyOption || '') {
              case 'FORM_DATA':
                type = REQUEST_TYPE_DATA
                break
              case 'FORM_URLENCODED':
                type = REQUEST_TYPE_FORM
                break
              // case 'RAW':  //JSON
              default:
                type = REQUEST_TYPE_JSON
                break
            }
            break
          default:
            method = REQUEST_TYPE_POST
            type = REQUEST_TYPE_JSON
            break
        }

        var header = ''

        var parameters = api.properties

        var parameters2 = []
        if (parameters != null && parameters.length > 0) {

          for (var k = 0; k < parameters.length; k++) {

            var paraItem = parameters[k] || {}
            var name = paraItem.name || ''
            if (StringUtil.isEmpty(name, true) || paraItem.scope != 'request') {
              continue
            }

            var val = paraItem.value

            if (paraItem.pos == 1) { //header
              header += (k <= 0 ? '' : '\n') + name + ': ' + (val == null ? '' : val)
                + (StringUtil.isEmpty(paraItem.description, true) ? '' : '  // ' + paraItem.description)
              continue
            }

            //转成和 Swagger 一样的字段及格式
            paraItem.type = paraItem.type == 'Number' ? 'integer' : StringUtil.toLowerCase(paraItem.type)
            paraItem.default = val

            parameters2.push(paraItem)
          }
        }

        return this.uploadThirdPartyApi(method, type, api.name, api.url, parameters2, null, header, api.description)
      },

      /**上传 YApi
       * @param docItem
       */
      uploadYApi: function(docItem) {
        var api = docItem
        if (api == null) {
          log('postApi', 'api == null  >> return')
          this.exTxt.button = 'All:' + this.uploadTotal + '\nDone:' + this.uploadDoneCount + '\nFail:' + this.uploadFailCount
          return false
        }

        this.uploadTotal++

        var headers = api.req_headers || []
        var header = ''
        for (var i = 0; i < headers.length; i ++) {
          var item = headers[i];
          var name = item == null ? null : item.name
          if (name == null) {
            continue
          }
          header += (i <= 0 ? '' : '\n') + name + ': ' + item.value
            + (StringUtil.isEmpty(item.description, true) ? '' : '  // ' + item.description)
        }

        var typeAndParam = this.parseYApiTypeAndParam(api)

        return this.uploadThirdPartyApi(
          typeAndParam.method, typeAndParam.type, api.title, api.path, typeAndParam.param, null, header
          ,  (StringUtil.trim(api.username) + ': ' + StringUtil.trim(api.title)
          + '\n' + (api.up_time == null ? '' : (typeof api.up_time != 'number' ? api.up_time : new Date(1000*api.up_time).toLocaleString()))
          + '\nhttp://apijson.cn/yapi/project/1/interface/api/' + api._id
          + '\n\n' + (StringUtil.isEmpty(api.markdown, true) ? StringUtil.trim(api.description) : api.markdown.trim().replace(/\\_/g, '_')))
          , api.username
        )
      },


      parseYApiTypeAndParam: function (api) {
        if (api == null) {
          return {}
        }

        var type
        var parameters
        switch (api.req_body_type || '') {
          case 'form':
            type = REQUEST_TYPE_FORM
            parameters = api.req_body_form
            break
          case 'data':
            type = REQUEST_TYPE_DATA
            parameters = api.req_params
            break
          case 'query':
            type = REQUEST_TYPE_PARAM
            parameters = api.req_query
            break
          default:
            type = REQUEST_TYPE_JSON
            parameters = api.req_body_other == null ? null : parseJSON(api.req_body_other)

            var params = parameters.properties || {}
            var required = parameters.required || []
            var newParams = []
            for (var k in params) {  //TODO 递归里面的子项
              var item = params[k]
              item.name = k
              item.required = required.indexOf(k) >= 0
              newParams.push(item)
            }
            parameters = newParams
            break
        }

        var parameters2 = []
        if (parameters != null && parameters.length > 0) {
          //过滤掉无效的，避免多拼接 , 导致 req 不是合法 JSON
          for (var k = 0; k < parameters.length; k++) {
            var paraItem = parameters[k] || {}
            var name = paraItem.name || ''
            if (StringUtil.isEmpty(name, true)) {
              continue
            }

            //转成和 Swagger 一样的字段及格式
            paraItem.url = paraItem.path

            var val = (paraItem.mock || {}).mock
            if (val == null && type == 'array') {
              val = []
              var it = paraItem.items || {}
              var v = it == null ? null : (it.mock || {}).mock
              val.push(v)
            }
            paraItem.default = val

            parameters2.push(paraItem)
          }
        }

        return {
          type: type,
          param: parameters2
        }
      },

      generateValue: function (t, n, isSQL) {
        if (t == 'boolean') {
          return true
        }
        if (t == 'integer') {
          return n == 'pageSize' ? 10 : 1
        }
        if (t == 'number') {
          return n == 'pageSize' ? 10 : 1
        }
        if (t == 'string') {  // TODO
          return ''
        }
        if (t == 'object') {
          return {}
        }
        if (t == 'array') {
          return []
        }
        var suffix = n != null && n.length >= 3 ? n.substring(n.length - 3).toLowerCase() : null
        if (suffix == 'dto') {
          return {}
        }

        return null
      },

      //上传第三方平台的 API 至 CVAuto
      uploadThirdPartyApi: function(method, type, name, url, parameters, json, header, description, creator, data) {
        if (typeof json == 'string') {
          json = parseJSON(json)
        }
        const reqObj = json || {}

        var req = '{'

        var isJSONEmpty = json == null || Object.keys(json).length <= 0
        if (parameters != null && parameters.length > 0) {
          for (var k = 0; k < parameters.length; k++) {
            var paraItem = parameters[k] || {}
            var n = paraItem.name || ''  //传进来前已过滤，这里只是避免万一为 null 导致后面崩溃
            var val = paraItem.default
            var t = paraItem.type || typeof val

            if (val == undefined) {
              val = this.generateValue(t, n)
              reqObj[n] = val
            }

            reqObj[n] = val

            if (typeof val == 'string' && (StringUtil.isEmpty(t, true) || t == 'string')) {
              val = isJSONEmpty ? ('"' + val.replace(/"/g, '\\"') + '"') : val
            }
            else if (val instanceof Object) {
              val = JSON.stringify(val, null, '    ')
            }

            if (isJSONEmpty) {
              req += '\n    "' + n + '": ' + val + (k < parameters.length - 1 ? ',' : '')
                + ' // ' + (paraItem.required ? '必填。 ' : '') + StringUtil.trim(paraItem.description)
            } else {
              url += (k <= 0 && url.indexOf('?') < 0 ? '?' : '&') + n + '=' + (val == null ? '' : val)
            }
          }

        }

        req += '\n}'

        if (isJSONEmpty != true) {
          req = JSON.stringify(json, null, '    ')
        }

        var commentObj = JSONResponse.updateStandard({}, reqObj);
        CodeUtil.parseComment(req, null, url, this.database, this.language, true, commentObj, true)
        var standard = this.isMLEnabled ? JSONResponse.updateStandard({}, data) : null

        name = StringUtil.get(name)
        if (name.length > 100) {
          name = name.substring(0, 60) + ' ... ' + name.substring(70, 100)
        }

        var currentAccountId = this.getCurrentAccountId()
        const baseUrl = this.getBaseUrl(url)
        const path = this.getBranchUrl(url)
        var callback = function (url, res, err) {
            var data = res.data
            var did = data.Document == null ? null : data.Document.id
            const isRandom = did != null && did > 0
            var config = isRandom ? StringUtil.trim(App.newRandomConfig(null, '', reqObj, false, null, null, true)) : null
            App.request(true, REQUEST_TYPE_POST, REQUEST_TYPE_JSON, App.server + '/post', {
              format: false,
              'Document': isRandom ? undefined : {
                'creator': creator,
                'testAccountId': currentAccountId,
                'method': StringUtil.isEmpty(method, true) ? null : method.trim().toUpperCase(),
                'operation': CodeUtil.getOperation(path.substring(1), reqObj),
                'type': type,
                'name': StringUtil.get(name),
                'url': path,
                'request': reqObj == null ? null : JSON.stringify(reqObj, null, '    '),
                'standard': commentObj == null ? null : JSON.stringify(commentObj, null, '    '),
                'header': StringUtil.isEmpty(header, true) ? null : StringUtil.trim(header),
                'detail': StringUtil.trim(description).replaceAll('*/', '* /')
              },
              'Random': isRandom ? {
                toId: 0,
                documentId: did,
                count: 1,
                name: '常量取值 ' + App.formatDateTime(),
                config: config
              } : undefined,
              'TestRecord': {
                'randomId': 0,
                'host': StringUtil.isEmpty(baseUrl, true) ? null : baseUrl,
                'testAccountId': currentAccountId,
                'response': data == null ? '' : JSON.stringify(data, null, '    '),
                'standard': standard == null ? '' : JSON.stringify(standard, null, '    '),
              },
              'tag': isRandom ? 'Random' : 'Document'
            }, {}, function (url, res, err) {
              //太卡 App.onResponse(url, res, err)
              var data = res.data || {}
              var tblObj = isRandom ? data.Random : data.Document
              if (tblObj.id != null && tblObj.id > 0) {
                App.uploadDoneCount ++
                if (isRandom) {
                  App.uploadRandomCount ++
                }
              } else {
                App.uploadFailCount ++
              }

              if (isRandom != true) {
                App.newAndUploadRandomConfig(baseUrl, reqObj, tblObj.id, null, 5)
              }
              App.exTxt.button = 'All:' + App.uploadTotal + '\nDone:' + App.uploadDoneCount + '\nFail:' + App.uploadFailCount
              if (App.uploadDoneCount + App.uploadFailCount >= App.uploadTotal) {
                alert('导入完成，其中 ' + App.uploadRandomCount + ' 个用例已存在，改为生成和上传了参数注入配置')
                App.isSyncing = false
                App.testCasePage = 0
                App.isRandomShow = true
                App.isRandomListShow = true
                App.showTestCase(false, false)
                App.remotes = []
                App.showTestCase(true, false)
              }
            })
        }
        if (JSONObject.isAPIJSONPath(path)) {
          callback(url, {}, null)
        }
        else {
            this.request(true, REQUEST_TYPE_POST, REQUEST_TYPE_JSON, this.server + '/get/Document?format=false&@role=OWNER', {
               url: path,
               method: StringUtil.isEmpty(method, true) ? null : method.trim().toUpperCase()
            }, {}, callback)
        }

        return true
      },

      // 切换主题
      switchTheme: function (index) {
        this.checkedTheme = index
        localforage.setItem('#theme', index)
      },


      // APIJSON <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

      //格式化日期
      formatDate: function (date) {
        if (date == null) {
          date = new Date()
        }
        return date.getFullYear() + '-' + this.fillZero(date.getMonth() + 1) + '-' + this.fillZero(date.getDate())
      },
      //格式化时间
      formatTime: function (date) {
        if (date == null) {
          date = new Date()
        }
        return this.fillZero(date.getHours()) + ':' + this.fillZero(date.getMinutes()) + ':' + this.fillZero(date.getSeconds())
      },
      formatDateTime: function (date) {
        if (date == null) {
          date = new Date()
        }
        return this.formatDate(date) + ' ' + this.formatTime(date)
      },
      //填充0
      fillZero: function (num, n) {
        if (num == null) {
          num = 0
        }
        if (n == null || n <= 0) {
          n = 2
        }
        var len = num.toString().length;
        while(len < n) {
          num = "0" + num;
          len++;
        }
        return num;
      },


      saveAccounts: function() {
          baseUrl = this.getBaseUrl()
          this.saveCache(baseUrl, 'currentAccountIndex', this.currentAccountIndex)

          var accounts = this.accounts || []
          var accountMap = {}
          for (var i = 0; i < accounts.length; i ++) {
              var account = accounts[i]
              if (account == null || account.phone == null) {
                continue
              }

              var bu = account.baseUrl || baseUrl
              var list = accountMap[bu] || []

              var find = false
              for (var j = 0; j < list.length; j ++) {
                  var act = list[j]
                  if (act == null) {
                      continue
                  }

                  if (act.baseUrl == bu && act.phone == account.phone) {
                      find = true
                      break
                  }
              }

              if (find != true) {
                   list.push(account)
                   accountMap[bu] = list
              }
          }

          for (var k in accountMap) {
              this.saveCache(k, 'accounts', accountMap[k])
          }
      },

      onClickAccount: function (index, item, callback) {
        var accounts = this.accounts
        var num = accounts == null ? 0 : accounts.length
        if (index < 0 || index >= num) {
          item = this.getCurrentAccount()
          if (item != null && item.isLoggedIn) {
            //logout FIXME 没法自定义退出，浏览器默认根据url来管理session的
            this.logout(false, function (url, res, err) {
              App.onResponse(url, res, err)

              item.isLoggedIn = false
              App.saveAccounts()

              App.changeScriptType(App.scriptType)

              if (callback != null) {
                callback(false, index, err)
              }
            });
          } else {
            if (callback != null) {
              callback(false, index)
            }
          }

          this.currentAccountIndex = index
          this.changeScriptType(App.scriptType)
          return
        }

        if (this.currentAccountIndex == index) {
          if (item == null) {
            if (callback != null) {
              callback(false, index)
            }
          }
          else {
            this.setRememberLogin(item.remember)
            this.account = item.phone
            this.password = item.password

            if (item.isLoggedIn) {
              //logout FIXME 没法自定义退出，浏览器默认根据url来管理session的
              this.logout(false, function (url, res, err) {
                App.onResponse(url, res, err)

                item.isLoggedIn = false
                App.saveAccounts()
                App.changeScriptType(App.scriptType)

                if (callback != null) {
                  callback(false, index, err)
                }
              });

              this.currentAccountIndex = -1
              this.changeScriptType(App.scriptType)
            }
            else {
              //login
              this.login(false, function (url, res, err) {
                App.onResponse(url, res, err)

                var data = res.data || {}
                var user = data.user || data.userObj || data.userObject || data.userRsp || data.userResp || data.userBean || data.userData || data.data || data.User || data.Data
                if (user == null) {
                  if (callback != null) {
                    callback(false, index, err)
                  }
                }
                else {
                  var headers = res.headers || {}
                  baseUrl = App.getBaseUrl(vUrl.value)

                  item.baseUrl = item.baseUrl || baseUrl
                  item.id = user.id || user.userId || user.user_id || user.userid  // TODO 工具函数直接遍历 key 判断可能的名称
                  item.name = user.name || user.nickname || user.nickName || user.user_name || user.username || user.userName
//                  item.phone = user.phone = user.mobile || user.mobileNo || user.mobileNum || user.mobileNumber || user.phone || user.phoneNo || user.phoneNum || user.phoneNumber || user.mobile_no || user.mobile_num || user.mobile_number || user.phone_no || user.phone_num || user.phone_number
                  item.remember = data.remember
                  item.isLoggedIn = true
                  item.token = headers.token || headers.Token || data.token || data.Token || user.token || user.Token || user.accessToken || user.access_token || data.accessToken || data.access_token
                  item.cookie = res.cookie || headers.cookie || headers.Cookie || headers['set-cookie'] || headers['Set-Cookie']

                  App.accounts[App.currentAccountIndex] = item
                  App.saveAccounts()

                  App.changeScriptType(App.scriptType)

                  if (callback != null) {
                      callback(true, index, err)
                  }
                }
              });
            }

          }

          return;
        }

        //退出当前账号
        var c = this.currentAccountIndex
        var it = c == null || this.accounts == null ? null : this.accounts[c];
        if (it != null) { //切换 BASE_URL后 it = undefined 导致UI操作无法继续
          it.isLoggedIn = false  //异步导致账号错位 this.onClickAccount(c, this.accounts[c])
        }

        //切换到这个tab
        this.currentAccountIndex = index
        this.changeScriptType(App.scriptType)

        //目前还没做到同一标签页下测试账号切换后，session也跟着切换，所以干脆每次切换tab就重新登录
        if (item != null) {
          item.isLoggedIn = false
          this.onClickAccount(index, item, callback)
        }
        else {
          if (callback != null) {
              callback(false, index)
          }
        }
      },

      removeAccountTab: function () {
        if (this.accounts.length <= 1) {
          alert('至少要 1 个测试账号！')
          return
        }

        this.accounts.splice(this.currentAccountIndex, 1)
        if (this.currentAccountIndex >= this.accounts.length) {
          this.currentAccountIndex = this.accounts.length - 1
        }

        this.saveAccounts()
      },
      addAccountTab: function () {
        this.showLogin(true, false)
      },

      showCompare4TestCaseList: function (show) {
        var testCases = show ? App.testCases : null
        var allCount = testCases == null ? 0 : testCases.length
        App.allCount = allCount
        if (allCount > 0) {

          var accountIndex = (this.accounts[this.currentAccountIndex] || {}).isLoggedIn ? this.currentAccountIndex : -1
          this.currentAccountIndex = accountIndex  //解决 onTestResponse 用 -1 存进去， handleTest 用 currentAccountIndex 取出来为空
//          var account = this.accounts[accountIndex]
//          baseUrl = this.getBaseUrl()

          var reportId = this.reportId
          if (reportId == null || Number.isNaN(reportId)) {
            reportId = null
          }

          var tests = this.tests[String(accountIndex)] // FIXME  account.phone + '@' + (account.baseUrl || baseUrl)]
          if ((reportId != null && reportId >= 0) || (tests != null && JSONObject.isEmpty(tests) != true)) {
            for (var i = 0; i < allCount; i++) {
              var item = testCases[i]
              var d = item == null ? null : item.Document
              if (d == null || d.id == null) {
                continue
              }

              if (reportId != null && reportId >= 0) {
                var tr = item.TestRecord || {}
                var rsp = parseJSON(tr.response)
                tests[d.id] = [rsp]

                var cmp = parseJSON(tr.compare)
                if (cmp == null || Object.keys(cmp).length <= 0) {
                  cmp = JSONResponse.compareWithBefore(null, null)
                }

                this.onTestResponse(null, allCount, testCases, i, item, d, item.Random, tr, rsp, cmp, false, accountIndex, true);
                continue
              }

              this.compareResponse(null, allCount, testCases, i, item, (tests[d.id] || {})[0], false, accountIndex, true)
            }
          }
        }
      },

      onClickChainPath: function (index, path) {
        var chainPaths = this.chainPaths
        this.chainPaths = chainPaths.slice(0, index)
        this.selectChainGroup(0, path)
      },
      isChainGroupShow: function () {
        return this.chainShowType != 1 && (this.chainGroups.length > 0) // || this.chainPaths.length <= 0)
      },
      isChainItemShow: function () {
        return this.chainShowType != 2 || (this.chainGroups.length <= 0 && this.chainPaths.length > 0)
      },
      selectChainGroup: function (index, group) {
        this.currentChainGroupIndex = index
        this.currentDocIndex = -1
        this.isCaseGroupEditable = false

        if (group == null) {
          if (index == null) {
            index = this.chainPaths.length - 1
            group = this.chainPaths[index]
          } else {
            this.chainPaths = []
          }
        } else {
          this.chainPaths = [group] // .push(group)
        }

       this.casePaths = this.chainPaths

        var groupId = group == null ? 0 : group.groupId
        if (groupId != null && groupId > 0) { // group != null && groupId == 0) {
//          this.chainGroups = []
          this.remotes = this.testCases = (this.chainGroups[index] || {})['[]'] || []
//          this.showTestCase(true, false, null)
          return
        }

        var isMLEnabled = this.isMLEnabled
        var userId = this.User.id
        var project = this.projectHost.project
        baseUrl = this.getBaseUrl(vUrl.value, true)

        var key = groupId + ''
        var page = this.chainGroupPage = this.chainGroupPages[key] || 0
        var count = this.chainGroupCount = this.chainGroupCounts[key] || 0
        var search = this.chainGroupSearch = this.chainGroupSearches[key] || ''

        search = StringUtil.isEmpty(search, true) ? null : '%' + StringUtil.trim(search).replaceAll('_', '\\_').replaceAll('%', '\\%') + '%'
        var req = {
          format: false,
          '[]': {
            'count': count || 0,
            'page': page || 0,
            'Chain': {
              'userId': userId,
              'toGroupId': groupId,
              'groupName$': search,
//              '@raw': '@column',
              '@column': "groupId;any_value(groupName):groupName;count(*):count",
              '@group': 'groupId',
              '@order': 'groupId-',
//              'documentId>': 0
            },
            '[]': {
              'count': 0, //200 条测试直接卡死 0,
              'page': 0,
              'join': '&/Document',
              'Chain': {
                // TODO 后续再支持嵌套子组合 'toGroupId': groupId,
                'userId': userId,
                'groupId@': '[]/Chain/groupId',
                '@column': "id,groupId,documentId,randomId,rank",
                '@order': 'rank+,id+',
                'documentId>': 0
              },
              'Document': {
                'id@': '/Chain/documentId',
                // '@column': 'id,userId,version,date,name,operation,method,type,url,request,apijson,standard', // ;substr(url,' + (StringUtil.length(groupUrl) + 2) + '):substr',
                '@order': 'version-,date-',
                'userId': userId,
                'project': StringUtil.isEmpty(project, true) ? null : project,
                'name$': search,
                'operation$': search,
                'url$': search,
                // 'group{}': group == null || StringUtil.isNotEmpty(groupUrl) ? null : 'length(group)<=0',
                // 'group{}': group == null ? null : (group.groupName == null ? "=null" : [group.groupName]),
                '@combine': search == null ? null : 'name$,operation$,url$',
//                'method{}': methods == null || methods.length <= 0 ? null : methods,
//                'type{}': types == null || types.length <= 0 ? null : types,
                '@null': 'sqlauto', //'sqlauto{}': '=null'
                // '@having': StringUtil.isEmpty(groupUrl) ? null : "substring_index(substr,'/',1)<0"
              },
              'Random':  {
//                'id@': '/Chain/randomId',
                'toId': 0,
                'chainId@': '/Chain/id',
                'documentId@': '/Document/id',
                'userId': userId,
                '@order': 'date-'
              },
              'TestRecord': {
                'chainId@': '/Chain/id',
                'documentId@': '/Document/id',
                'userId': userId,
                'host': StringUtil.isEmpty(baseUrl, true) ? null : baseUrl,
//                'testAccountId': this.getCurrentAccountId(),
                'randomId': 0,
//                'reportId': reportId <= 0 ? null : reportId,
//                'invalid': reportId == null ? 0 : null,
                '@order': 'date-',
                '@column': 'id,userId,documentId,testAccountId,reportId,duration,minDuration,maxDuration,total,correct,wrong,miss,score,iou,recall,precision,f1,response' + (this.isStatisticsEnabled ? ',compare' : '')+ (isMLEnabled ? ',standard' : ''),
                'standard{}': isMLEnabled ? (this.database == 'SQLSERVER' ? 'len(standard)>2' : 'length(standard)>2') : null  //用 MySQL 5.6   '@having': this.isMLEnabled ? 'json_length(standard)>0' : null
              },
              'Script:pre': {
                'ahead': 1,
                // 'testAccountId': 0,
                'chainId@': '/Chain/id',
                'documentId@': '/Document/id',
                '@order': 'date-'
              },
              'Script:post': {
                'ahead': 0,
                // 'testAccountId': 0,
                'chainId@': '/Chain/id',
                'documentId@': '/Document/id',
                '@order': 'date-'
              }
            },
          },
          '@role': IS_NODE ? null : 'LOGIN',
          key: IS_NODE ? this.key : undefined  // 突破常规查询数量限制
        }

        if (IS_BROWSER) {
          this.onChange(false)
        }

        this.request(true, REQUEST_TYPE_POST, REQUEST_TYPE_JSON, this.server + '/get', req, {}, function (url, res, err) {
          App.onResponse(url, res, err)
          var data = res.data
          if (JSONResponse.isSuccess(data) == false) {
            alert('获取场景用例分组失败！\n' + (err != null ? err.message : (data || '').msg))
            if (IS_BROWSER) { // 解决一旦错了，就只能清缓存
              App.chainGroupCount = 50
              App.chainGroupPage = 0
              App.chainGroupSearch = ''
              App.chainGroupCounts = {}
              App.chainGroupPages = {}
              App.chainGroupSearches = {}

              App.saveCache(App.server, 'chainGroupCount', App.chainGroupCount)
              App.saveCache(App.server, 'chainGroupPage', App.chainGroupPage)
              App.saveCache(App.server, 'chainGroupSearch', App.chainGroupSearch)
              App.saveCache(App.server, 'chainGroupCounts', App.chainGroupCounts)
              App.saveCache(App.server, 'chainGroupPages', App.chainGroupPages)
              App.saveCache(App.server, 'chainGroupSearches', App.chainGroupSearches)
            }
            return
          }

          var chainGroups = App.chainGroups = data['[]'] || []
          var count = chainGroups.length
          var index = App.currentChainGroupIndex
          if (index == null || index < 0 || index >= count) {
             App.currentChainGroupIndex = index = 0
          }

          var item = chainGroups[index] || {}
          if (item.Chain != null) {
            App.chainPaths.push(item.Chain)
          }
          App.remotes = App.testCases = item['[]'] || []
          App.isTestCaseShow = true
//          App.showTestCase(true, false, null)
        })
      },

      addCase2Chain: function (item) {
        var id = item == null ? null : item.id
        if (id == null || id <= 0) {
          alert('请选择有效的用例！')
          return
        }

        var group = (this.chainGroups[this.currentChainGroupIndex] || {}).Chain
        if (group == null) {
          var index = this.chainPaths.length - 1
          group = this.chainPaths[index]
        }

        var groupId = group == null ? 0 : group.groupId
        if (groupId == null || groupId <= 0) {
          alert('请选择有效的场景串联用例分组！')
          return
        }

        var nextIndex = this.currentDocIndex
        var nextChain = nextIndex == null || nextIndex < 0 ? null : (this.testCases[nextIndex] || {}).Chain
        var nextRank = nextChain == null ? null : nextChain.rank

        var groupName = group.groupName
        var isAdd = true
        this.request(true, REQUEST_TYPE_POST, REQUEST_TYPE_JSON, this.server + '/post', {
          Chain: {
            'rank': this.formatDateTime(StringUtil.isEmpty(nextRank, true) ? null : new Date(new Date(nextRank).getTime() - 10)),
            'groupName': groupName,
            'groupId': groupId,
            'documentId': item.id
          },
          tag: 'Chain'
        }, {}, function (url, res, err) {
          App.onResponse(url, res, err)
          var isOk = JSONResponse.isSuccess(res.data)

          var msg = isOk ? '' : ('\nmsg: ' + StringUtil.get((res.data || {}).msg))
          if (err != null) {
            msg += '\nerr: ' + err.msg
          }
          alert((isAdd ? '新增' : '修改') + (isOk ? '成功' : '失败') + (isAdd ? '! \n' :'！\ngroupId: ' + groupId) + '\ngroupName: ' + groupName + msg)

          App.isCaseGroupEditable = ! isOk
          if (isOk) {
//          App.remotes = App.testCases = []
//          App.showTestCase(true, false, null)
            App.selectChainGroup(App.currentChainGroupIndex, null)
          }
        })
      },

      onClickPath: function (index, path) {
        if (this.isChainShow) {
          this.onClickChainPath(index, path)
          return
        }

        var paths = this.casePaths
        this.casePaths = paths.slice(0, index)
        this.selectCaseGroup(0, path)
      },
      isCaseGroupShow: function () {
        if (this.isChainShow) {
          return this.isChainGroupShow()
        }

        return this.caseShowType != 1 && (this.caseGroups.length > 0 || this.casePaths.length <= 0)
      },
      isCaseItemShow: function () {
        if (this.isChainShow) {
          return this.isChainItemShow()
        }

        return this.caseShowType != 2 || (this.caseGroups.length <= 0 && this.casePaths.length > 0)
      },
      getCaseGroupShowName: function(index, item) {
        if (StringUtil.isNotEmpty(item.groupName, true)) {
          return item.groupName
        }
        if (StringUtil.isEmpty(item.groupUrl, true)) {
          return '-'
        }

        var prev = index <= 0 ? null : (this.casePaths[index-1] || {}).groupUrl
        return item.groupUrl.substring(prev == null ? 1 : prev.length + 1)
      },
      selectCaseGroup: function (index, group) {
        if (this.isChainShow) {
          this.selectChainGroup(index, group)
          return
        }

        this.isCaseGroupEditable = false

        if (group == null) {
          if (index == null) {
            index = this.casePaths.length - 1
            group = this.casePaths[index]
          } else {
            this.casePaths = []
          }
        } else {
          this.casePaths.push(group)
        }

        var groupUrl = group == null ? '' : (group.groupUrl || '')
        if (group != null && StringUtil.isEmpty(groupUrl)) {
          this.caseGroups = []
          this.remotes = App.testCases = []
          this.showTestCase(true, false, null)
          return
        }

        var project = (this.projectHost || {}).project

        var page = this.caseGroupPage = this.caseGroupPages[groupUrl] || 0
        var count = this.caseGroupCount = this.caseGroupCounts[groupUrl] || 0
        var search = this.caseGroupSearch = this.caseGroupSearches[groupUrl] || ''

        search = StringUtil.isEmpty(search, true) ? null : '%' + StringUtil.trim(search).replaceAll('_', '\\_').replaceAll('%', '\\%') + '%'
        var req = {
          format: false,
          'Document[]': {
            'count': count || 0,
            'page': page || 0,
            'Document': {
              '@from@': {
                'Document': {
                  '@raw': '@column',
                  '@column': "substr(url,1,length(url)-length(substring_index(url,'/',-1))-1):groupUrl;group:groupName", // (CASE WHEN length(`group`) > 0 THEN `group` ELSE '-' END):name",
                  'userId': this.User.id,
                  'project': StringUtil.isEmpty(project, true) ? null : project,
                  'group$': search,
                  'url$': search,
                  // 'url&$': StringUtil.isEmpty(groupUrl) ? null : [groupUrl.replaceAll('_', '\\_').replaceAll('%', '\\%') + '/%'],
                  '@combine': search == null ? null : 'group$,url$',
                  '@null': 'sqlauto', //'sqlauto{}': '=null',
                  'url{}': 'length(url)>0',
                  'url&$': StringUtil.isEmpty(groupUrl) ? null : [groupUrl.replaceAll('_', '\\_').replaceAll('%', '\\%') + '/%']
                  // 'group{}': group == null || StringUtil.isNotEmpty(groupUrl) ? null : 'length(group)<=0' // SQL WHERE 条件不用别名
                  // '@having': "length(url)>0" //  StringUtil.isEmpty(groupUrl) ? "length(url)>0" : "(url = '" + groupUrl.replaceAll("'", "\\'") + "')"
                }
              },
              'groupUrl&$': StringUtil.isEmpty(groupUrl) ? null : [groupUrl.replaceAll('_', '\\_').replaceAll('%', '\\%') + '/%'],
              'groupName$': search,
              'groupUrl$': search,
              '@combine': search == null ? null : 'groupName$,groupUrl$',
              '@column': "groupName,groupUrl;any_value(groupName):rawName;length(groupName):groupNameLen;length(groupUrl):groupUrlLen;count(*):count",
              '@group': 'groupName,groupUrl',
              '@order': 'groupNameLen+,groupName-,groupUrlLen+,groupUrl+',
            }
          },
          '@role': IS_NODE ? null : 'LOGIN',
          key: IS_NODE ? this.key : undefined  // 突破常规查询数量限制
        }

        if (IS_BROWSER) {
          this.onChange(false)
        }

        this.request(true, REQUEST_TYPE_POST, REQUEST_TYPE_JSON, this.server + '/get', req, {}, function (url, res, err) {
          App.onResponse(url, res, err)
          var data = res.data
          if (JSONResponse.isSuccess(data) == false) {
            alert('获取用例分组失败！\n' + (err != null ? err.message : (data || '').msg))
            if (IS_BROWSER) { // 解决一旦错了，就只能清缓存
              App.caseGroupCount = 50
              App.caseGroupPage = 0
              App.caseGroupSearch = ''
              App.caseGroupCounts = {}
              App.caseGroupPages = {}
              App.caseGroupSearches = {}

              App.saveCache(App.server, 'caseGroupCount', App.caseGroupCount)
              App.saveCache(App.server, 'caseGroupPage', App.caseGroupPage)
              App.saveCache(App.server, 'caseGroupSearch', App.caseGroupSearch)
              App.saveCache(App.server, 'caseGroupCounts', App.caseGroupCounts)
              App.saveCache(App.server, 'caseGroupPages', App.caseGroupPages)
              App.saveCache(App.server, 'caseGroupSearches', App.caseGroupSearches)
            }
            return
          }

          App.caseGroups = data['Document[]'] || []
          App.remotes = App.testCases = []
          App.showTestCase(true, false, null)
        })
      },

      switchCaseShowType: function () {
        if (this.isLocalShow) {
          alert('只有远程用例才能切换！')
          return
        }

        if (this.isChainShow) {
            this.chainShowType = (this.chainShowType + 1)%3
            if (this.chainShowType != 1 && this.chainPaths.length <= 0 && this.chainGroups.length <= 0) {
              this.selectChainGroup(-1, null)
            }
            return
        }

        this.caseShowType = (this.caseShowType + 1)%3
        if (this.caseShowType != 1 && this.casePaths.length <= 0 && this.caseGroups.length <= 0) {
          this.selectCaseGroup(-1, null)
        }
      },

      onClickPathRoot: function () {
        var isChainShow = this.isChainShow
//        var paths = isChainShow ? this.chainPaths : this.casePaths
        var paths = isChainShow ? [] : this.casePaths
        if (paths.length <= 0) {
          var type = this.groupShowType = (this.groupShowType + 1)%3
          this.isChainShow = type == 1
          this.isLocalShow = type == 2

          this.testCases = this.remotes = []
          if (type == 1 && this.chainGroups.length <= 0) {
            this.selectChainGroup(-1, null)
          }
          else if (type == 0 && this.caseGroups.length <= 0) {
            this.selectCaseGroup(-1, null)
          }
          else {
            this.showTestCase(true, this.isLocalShow)
          }
        }
        else if (isChainShow) {
          this.selectChainGroup(-1, null)
        }
        else {
          this.selectCaseGroup(-1, null)
        }
      },

      getCaseCountStr: function() {
        var isChainShow = this.isChainShow
        var isCaseGroupShow = this.isCaseGroupShow()
        var isLocalShow = this.isLocalShow
        var caseShowType = this.caseShowType
        var caseGroups = (isChainShow ? this.chainGroups : this.caseGroups) || []
        var testCases = this.testCases || []

        if (isLocalShow) {
          return '(' + testCases.length + ')'
        }

        return '(' + (isCaseGroupShow ? caseGroups.length : '')
            + (caseShowType == 0 && isCaseGroupShow ? '|' : '')
            + (caseShowType == 2 && (isCaseGroupShow) ? '' : testCases.length) + ')';

        // 以下代码不知道为啥结果显示不对
        // var isCaseGroupShow = this.isCaseGroupShow()
        // var isCaseItemShow = this.isCaseItemShow()
        // var caseGroups = (this.isChainShow ? this.chainGroups : this.caseGroups) || []
        //
        // return '(' + (isCaseGroupShow ? caseGroups.length : '')
        //     + (isCaseGroupShow && isCaseItemShow ? '|' : '')
        //     + (isCaseItemShow ? '' : testCases.length) + ')';
      },

      //显示远程的测试用例文档
      showTestCase: function (show, isLocal, callback, group) {
        this.isTestCaseShow = show
        this.isLocalShow = isLocal

        if (IS_BROWSER) {
          vOutput.value = show ? '' : (output || '')
          this.showDoc()
        }

        if (isLocal) {
          this.testCases = this.locals || []
          return
        }

        this.testCases = this.remotes || []
        this.getCurrentSummary().summaryType = 'total' // this.onClickSummary('total', true)

        if (show) {
          var testCases = this.testCases
          var allCount = testCases == null ? 0 : testCases.length
          App.allCount = allCount
          if (allCount > 0) {
            if (! (this.isAllSummaryShow() || this.isCurrentSummaryShow())) {
              this.showCompare4TestCaseList(show)
            }
            return;
          }

          var project = (this.projectHost || {}).project

          // this.isTestCaseShow = false
          var reportId = this.reportId

          var methods = this.methods
          var types = this.types

          var isChainShow = this.isChainShow
          var paths = isChainShow ? this.chainPaths : this.casePaths
          var index = paths.length - 1
          group = group != null ? group : paths[index]
          var groupId = group == null ? 0 : (group.groupId || 0)
          var groupUrl = group == null ? '' : (group.groupUrl || '')
          var groupKey = isChainShow ? groupId + '' : groupUrl

          var page = this.testCasePage = this.testCasePages[groupKey] || 0
          var count = this.testCaseCount = this.testCaseCounts[groupKey] || 100
          var search = this.testCaseSearch = this.testCaseSearches[groupKey] || ''

          search = StringUtil.isEmpty(search, true) ? null : '%' + StringUtil.trim(search).replaceAll('_', '\\_').replaceAll('%', '\\%') + '%'

          var url = this.server + '/get'
          var userId = this.User.id

          this.coverage = {}
          this.view = 'markdown'
          var req = {
            format: false,
            '[]': {
              'count': count || 100, //200 条测试直接卡死 0,
              'page': page || 0,
              'join':  isChainShow ? '&/Document,@/Random' : '@/TestRecord,@/Script:pre,@/Script:post',
              'Chain': isChainShow ? {
                // TODO 后续再支持嵌套子组合 'toGroupId': groupId,
                'groupId': groupId,
                '@column': "id,groupId,documentId,randomId,documentName,randomName,rank", // ;unix_timestamp(rank):rank",
                '@order': 'rank+,id+',
                'documentId>': 0
              } : null,
              'Document': {
                'id@': isChainShow ? '/Chain/documentId' : null,
                // '@column': 'id,userId,version,date,name,operation,method,type,url,request,apijson,standard', // ;substr(url,' + (StringUtil.length(groupUrl) + 2) + '):substr',
                '@order': 'version-,date-',
                'userId': userId,
                'project': StringUtil.isEmpty(project, true) ? null : project,
                'name$': search,
                'operation$': search,
                'url$': search,
                'url|$': StringUtil.isEmpty(groupUrl) ? null : [groupUrl, groupUrl.replaceAll('_', '\\_').replaceAll('%', '\\%') + '/%'],
                // 'group{}': group == null || StringUtil.isNotEmpty(groupUrl) ? null : 'length(group)<=0',
                // 'group{}': group == null ? null : (group.groupName == null ? "=null" : [group.groupName]),
                '@combine': search == null ? null : 'name$,operation$,url$',
                'method{}': methods == null || methods.length <= 0 ? null : methods,
                'type{}': types == null || types.length <= 0 ? null : types,
                '@null': 'sqlauto', //'sqlauto{}': '=null'
                // '@having': StringUtil.isEmpty(groupUrl) ? null : "substring_index(substr,'/',1)<0"
              },
              'Random': isChainShow ? {
                'id@': '/Chain/randomId',
                'toId': 0, // isChainShow ? 0 : null,
//                'chainId@': isChainShow ? '/Chain/id' : null,
//                'documentId@': isChainShow ? null : '/Document/documentId',
                'userId': userId
              }: null,
              'TestRecord': {
                'chainId@': isChainShow ? '/Chain/id' : null,
                'chainId': isChainShow ? null : 0,
                'documentId@': '/Document/id',
                'userId': userId,
                'host': StringUtil.isEmpty(baseUrl, true) ? null : baseUrl,
//                'testAccountId': this.getCurrentAccountId(),
                'randomId': 0,
                'reportId': reportId <= 0 ? null : reportId,
                'invalid': reportId == null ? 0 : null,
                '@order': 'date-',
                '@column': 'id,userId,documentId,testAccountId,reportId,duration,minDuration,maxDuration,response' + (this.isStatisticsEnabled ? ',compare' : '')+ (this.isMLEnabled ? ',standard' : ''),
                'standard{}': this.isMLEnabled ? (this.database == 'SQLSERVER' ? 'len(standard)>2' : 'length(standard)>2') : null  //用 MySQL 5.6   '@having': this.isMLEnabled ? 'json_length(standard)>0' : null
              },
              'Script:pre': {
                'ahead': 1,
                // 'testAccountId': 0,
                'chainId@': isChainShow ? '/Chain/id' : null,
                'chainId': isChainShow ? null : 0,
                'documentId@': '/Document/id',
                '@order': 'date-'
              },
              'Script:post': {
                'ahead': 0,
                // 'testAccountId': 0,
                'chainId@': isChainShow ? '/Chain/id' : null,
                'chainId': isChainShow ? null : 0,
                'documentId@': '/Document/id',
                '@order': 'date-'
              }
            },
            '@role': IS_NODE ? null : 'LOGIN',
            key: IS_NODE ? this.key : undefined  // 突破常规查询数量限制
          }

          if (IS_BROWSER) {
            this.onChange(false)
          }

          this.request(true, REQUEST_TYPE_POST, REQUEST_TYPE_JSON, url, req, {}, function (url, res, err) {
            App.isTestCaseShow = false
            if (callback) {
              callback(url, res, err)
              return
            }

            App.onTestCaseListResponse(show, url, res, err)
          })
        } else if (callback != null) {
          callback(null, {}, null)
        }
      },

      lastCaseReqTime: 0,
      onTestCaseListResponse: function(show, url, res, err) {
        var time = res == null || res.config == null || res.config.metadata == null ? 0 : (res.config.metadata.startTime || 0)
        if (time < this.lastCaseReqTime) {
          return
        }

        this.lastCaseReqTime = time;

        this.onResponse(url, res, err)

        var data = res.data

        if (JSONResponse.isSuccess(data)) {
          this.isTestCaseShow = true
          this.isLocalShow = false
          this.testCases = App.remotes = data['[]']
          this.getCurrentRandomSummary().summaryType = 'total' // App.onClickSummary('total', true)
          if (this.isChainShow && this.currentChainGroupIndex >= 0) {
            var chain = this.chainGroups[this.currentChainGroupIndex]
            if (chain != null) {
              chain['[]'] = this.testCases
            }
          }

          if (IS_BROWSER) {
            vOutput.value = show ? '' : (output || '')
            this.showDoc()
          }

          this.showCompare4TestCaseList(show)

          //this.onChange(false)
        } else if (IS_BROWSER) { // 解决一旦错了，就只能清缓存
          this.testCaseCount = 50
          this.testCasePage = 0
          this.testCaseSearch = ''
          this.testCasePages = {}
          this.testCaseCounts = {}
          this.testCaseSearches = {}

          this.saveCache(this.server, 'testCasePage', this.testCasePage)
          this.saveCache(this.server, 'testCaseCount', this.testCaseCount)
          this.saveCache(this.server, 'testCaseSearch', this.testCaseSearch)
          this.saveCache(this.server, 'testCasePages', null)
          this.saveCache(this.server, 'testCaseCounts', null)
          this.saveCache(this.server, 'testCaseSearches', null)
        }
      },

      onClickLogoutSummary: function (color) {
        this.onClickSummary(color, false, -1)
      },
      onClickAllSummary: function (color) {
        this.onClickSummary(color, false, this.accounts.length) // this.currentAccountIndex)
      },
      onClickCurrentSummary: function (color) {
        this.onClickSummary(color, false, this.currentAccountIndex)
      },
      onClickSummary: function (color, isRandom, accountIndex) {
        var isCur = this.currentAccountIndex == accountIndex
        if (! isCur) {
          this.onClickAccount(accountIndex, accountIndex < 0 ? this.logoutSummary : this.accounts[accountIndex])
        }
        // this.currentAccountIndex = accountIndex
        // this.isTestCaseShow = false

        var isSub = this.isRandomSubListShow
        var arr = isRandom ? (isSub ? this.currentRandomItem.subs : this.currentRemoteItem.randoms) : this.remotes;
        var list = []
        if (color == null || color == 'total') {
          list = arr
          if (isCur) {
            this.statisticsShowType = (this.statisticsShowType + 1)%3;
          }
        } else if (arr != null) {
          for (var i = 0; i < arr.length; i++) {
            var obj = arr[i]
            if (obj == null) {
              continue
            }

            var count = isRandom && obj.Random != null ? obj.Random.count : (isRandom ? null : obj.totalCount)
            if (count != null && count > (isRandom ? 1 : 0)) {
              var sum = obj[color + 'Count']
              if (sum != null && sum > 0) {
                list.push(obj)
              }
              continue
            }

            if (obj.compareColor == color) {
              list.push(obj)
            }
          }
        }

        if (isRandom) {
          if (isSub) {
            this.currentRandomItem.summaryType = color
            this.randomSubs = list
          } else {
            this.currentRemoteItem.summaryType = color
            this.randoms = list
          }
        } else {
          var summary = this.getSummary(accountIndex) || {}
          summary.summaryType = color
          this.testCases = list
          this.isTestCaseShow = true
          // this.showTestCase(true, false)
        }
      },

      showCompare4RandomList: function (show, isSub) {
        this.getCurrentRandomSummary().summaryType = 'total'

        var randoms = show ? (isSub ? this.randomSubs : this.randoms) : null
        var randomCount = randoms == null ? 0 : randoms.length
        if (randomCount > 0) {
          var accountIndex = (this.accounts[this.currentAccountIndex] || {}).isLoggedIn ? this.currentAccountIndex : -1
          this.currentAccountIndex = accountIndex  //解决 onTestResponse 用 -1 存进去， handleTest 用 currentAccountIndex 取出来为空
          var docId = ((this.currentRemoteItem || {}).Document || {}).id

          var tests = (this.tests[String(accountIndex)] || {})[docId]
          if (tests != null && JSONObject.isEmpty(tests) != true) {
            // if (! isSub) {
            //   this.resetCount(this.currentRemoteItem, true, isSub, accountIndex)
            // }

            for (var i = 0; i < randomCount; i++) {
              var item = randoms[i]
              var r = item == null ? null : item.Random
              if (r == null || r.id == null) {
                continue
              }

              this.resetCount(item, true, isSub, accountIndex)

              var subCount = r.count || 0
              if (subCount == 1) {
                this.compareResponse(null, randomCount, randoms, i, item, tests[r.id], true, accountIndex, true)
              }
              else if (subCount > 1) {
                var subRandoms = item['[]'] || []
                var subSize = Math.min(subRandoms.length, subCount)
                for (var j = 0; j < subSize; j++) {
                  var subItem = subRandoms[j]
                  var sr = subItem == null ? null : subItem.Random
                  if (sr == null || sr.id == null) {
                    continue
                  }

                  this.compareResponse(null, subSize, subRandoms, j, subItem, tests[sr.id > 0 ? sr.id : (sr.toId + '' + sr.id)], true, accountIndex, true)
                }
              }
            }
          }
        }
      },

      //显示远程的随机配置文档
      showRandomList: function (show, item, isSub, callback) {
        this.isRandomEditable = false
        this.isRandomListShow = show && ! isSub
        this.isRandomSubListShow = show && isSub
        if (! isSub) {
          this.randomSubs = []
        }

        if (IS_BROWSER) {
          vOutput.value = show ? '' : (output || '')
          this.showDoc()
        }

        var randoms = []
        if (this.randomPage == 0 && ! isSub) {
          randoms = (this.currentRemoteItem || {}).randoms || []
        }
        else if (this.randomSubPage == 0 && isSub) {
          randoms = (this.currentRandomItem || {}).subs || []
        }

        if (isSub) {
          this.randomSubs = randoms
        }
        else {
          this.randoms = randoms
        }

        this.getCurrentRandomSummary().summaryType = 'total' // this.onClickSummary('total', true)
        if (! this.isRandomSummaryShow()) {
          this.showCompare4RandomList(show, isSub)
        }

        if (show && this.isRandomShow && randoms.length <= 0 && item != null && item.id != null) {
          this.isRandomListShow = false

          var subSearch = StringUtil.isEmpty(this.randomSubSearch, true)
            ? null : '%' + StringUtil.trim(this.randomSubSearch) + '%'
          var search = isSub ? subSearch : (StringUtil.isEmpty(this.randomSearch, true)
            ? null : '%' + StringUtil.trim(this.randomSearch) + '%')

          var url = this.server + '/get'
          baseUrl = this.getBaseUrl(vUrl.value, true)
          const cri = this.currentRemoteItem || {}
          const chain = cri.Chain || {}
          const cId = chain.id || 0

          var req = {
            '[]': {
              'count': (isSub ? this.randomSubCount : this.randomCount) || 100,
              'page': (isSub ? this.randomSubPage : this.randomPage) || 0,
              'Random': {
                'toId': isSub ? item.id : 0,
                'chainId': cId,
                'documentId': isSub ? null : item.id,
                '@order': "date-",
                'name$': search,
                '@combine': 'file[>,img[>',
                'file[>': 0,
                'img[>': 0
              },
              'TestRecord': {
                'randomId@': '/Random/id',
//                'testAccountId': this.getCurrentAccountId(),
                'host': StringUtil.isEmpty(baseUrl, true) ? null : baseUrl,
                '@order': 'date-'
              },
              '[]': isSub ? null : {
                'count': this.randomSubCount || 100,
                'page': this.randomSubPage || 0,
                'Random': {
                  'toId@': '[]/Random/id',
                  'chainId': cId,
                  'documentId': item.id,
                  '@order': "date-",
                  'name$': subSearch
                },
                'TestRecord': {
                  'randomId@': '/Random/id',
//                  'testAccountId': this.getCurrentAccountId(),
                  'host': StringUtil.isEmpty(baseUrl, true) ? null : baseUrl,
                  '@order': 'date-'
                }
              }
            },
            key: IS_NODE ? this.key : undefined  // 突破常规查询数量限制
          }

          if (IS_BROWSER) {
            this.onChange(false)
          }

          this.request(true, REQUEST_TYPE_POST, REQUEST_TYPE_JSON, url, req, {}, function (url, res, err) {
            if (callback) {
              callback(url, res, err)
              return
            }
            App.onRandomListResponse(show, isSub, url, res, err)
          })
        } else if (callback) {
          callback(null, {}, null)
        }
      },

      onRandomListResponse: function (show, isSub, url, res, err) {
        res = res || {}

        App.onResponse(url, res, err)

        var data = res.data

        if (JSONResponse.isSuccess(data)) {
          App.isRandomListShow = ! isSub
          App.isRandomSubListShow = isSub
          if (isSub) {
            if (App.currentRandomItem == null) {
              App.currentRandomItem = {}
            }
            App.randomSubs = App.currentRandomItem.subs = App.currentRandomItem['[]'] = data['[]']
          }
          else {
            if (App.currentRemoteItem == null) {
              App.currentRemoteItem = {}
            }
            App.randoms = App.currentRemoteItem.randoms = data['[]']
          }
          this.getCurrentRandomSummary().summaryType = 'total' // App.onClickSummary('total', true)

          if (IS_BROWSER) {
            vOutput.value = show ? '' : (output || '')
            App.showDoc()
          }

          // if (! this.isRandomSummaryShow()) {
            App.showCompare4RandomList(show, isSub)
          // }

          //App.onChange(false)
        }
      },

      // 设置文档
      showDoc: function () {
        if (this.setDoc(doc) == false) {
          this.getDoc(function (d) {
            App.setDoc(d);
          });
        }
      },


      saveCache: function (url, key, value) {
        var cache = this.getCache(url);
        cache[key] = value
        localStorage.setItem('APIAuto:' + url, JSON.stringify(cache))
      },
      getCache: function (url, key, defaultValue) {
        var cache = localStorage.getItem('APIAuto:' + url)
        try {
          cache = parseJSON(cache)
        } catch(e) {
          this.log('login  this.send >> try { cache = parseJSON(cache) } catch(e) {\n' + e.message)
        }
        cache = cache || {}
        var val = key == null ? cache : cache[key]
        return val == null && defaultValue != null ? defaultValue : val
      },

      getCurrentDocumentId: function() {
        var d = (this.currentRemoteItem || {}).Document
        return d == null ? null : d.id;
      },
      getCurrentRandomId: function() {
        var r = (this.currentRandomItem || {}).Random
        return r == null ? null : r.id;
      },
      getCurrentScriptBelongId: function() {
        return this.getScriptBelongId(this.scriptType)
      },
      getScriptBelongId: function(scriptType) {
        var st = scriptType;
        var bid = st == 'global' ? 0 : ((st == 'account' ? this.getCurrentAccountId() : this.getCurrentDocumentId()) || 0)
        return bid
      },
      listScript: function() {
        var req = {
          'Script:pre': {
            'ahead': 1,
            'testAccountId': 0,
            'documentId': 0,
            '@order': 'date-'
          },
          'Script:post': {
            'ahead': 0,
            'testAccountId': 0,
            'documentId': 0,
            '@order': 'date-'
          }
        }

        var accounts = this.accounts || []
        for (let i = 0; i < accounts.length; i++) {
          var a = accounts[i]
          var id = a == null ? null : a.id
          if (id == null) {
            continue
          }

          req['account_' + id] = { // 用数字被居然强制格式化到 JSON 最前
            'Script:pre': {
              'ahead': 1,
              'testAccountId': id,
              'documentId': 0,
              '@order': 'date-'
            },
            'Script:post': {
              'ahead': 0,
              'testAccountId': id,
              'documentId': 0,
              '@order': 'date-'
            }
          }
        }

        this.request(true, REQUEST_TYPE_POST, REQUEST_TYPE_JSON, '/get', req, {}, function (url, res, err) {
          var data = res.data
          if (JSONResponse.isSuccess(data) != true) {
            App.log(err != null ? err : (data == null ? '' : data.msg))
            return
          }

          var scripts = App.scripts || {}
          var ss = scripts.global
          if (ss == null) {
            scripts.global = ss = {}
          }

          var bs = ss['0'] || {}
          if (bs == null) {
            ss['0'] = bs = {}
          }

          var pre = data['Script:pre']
          if (pre != null && pre.script != null) {
            bs.pre = data['Script:pre']
          }
          var post = data['Script:post']
          if (post != null && post.script != null) {
            bs.post = data['Script:post']
          }

          // delete data['Script:pre']
          // delete data['Script:post']

          var cs = scripts.account
          if (cs == null) {
            scripts.account = cs = {}
          }

          for (let key in data) {
            var val = data[key]
            var pre = val == null || key.startsWith('account_') != true ? null : val['Script:pre']
            if (pre == null) {
              continue
            }

            var post = val['Script:post']

            var bs = cs[key.substring('account_'.length)]

            if (pre != null) { // && pre.script != null) {
              bs.pre = pre
            }
            if (post != null) { // && post.script != null) {
              bs.post = post
            }
          }

          App.scripts = Object.assign(newDefaultScript(), scripts)
        })
      },


      /**登录确认
       */
      confirm: function () {
        switch (this.loginType) {
          case 'login':
            this.login(this.isAdminOperation)
            break
          case 'register':
            this.register(this.isAdminOperation)
            break
          case 'forget':
            this.resetPassword(this.isAdminOperation)
            break
        }
      },

      showLogin: function (show, isAdmin) {
        this.isLoginShow = show
        this.isAdminOperation = isAdmin

        if (show != true) {
          return
        }

        var user = isAdmin ? this.User : null  // add account   this.accounts[this.currentAccountIndex]

        // alert("showLogin  isAdmin = " + isAdmin + "; user = \n" + JSON.stringify(user, null, '    '))

        if (user == null || StringUtil.isEmpty(user.phone, true)) {
          user = {
            phone: '13000082001',
            password: '123456'
          }
        }

        this.setRememberLogin(user.remember)
        this.account = user.phone
        this.password = user.password

        var schemas = StringUtil.isEmpty(this.schema, true) ? null : StringUtil.split(this.schema)

        const req = {
          type: 0, // 登录方式，非必须 0-密码 1-验证码
          // asDBAccount: ! isAdminOperation,  // 直接 /execute 接口传 account, password
          phone: this.account,
          password: this.password,
          version: 1, // 全局默认版本号，非必须
          remember: vRemember.checked,
          format: false,
          defaults: isAdmin ? {
            key: IS_NODE ? this.key : undefined  // 突破常规查询数量限制
          } : {
            '@database': StringUtil.isEmpty(this.database, true) ? undefined : this.database,
            '@schema': schemas == null || schemas.length != 1 ? undefined : this.schema
          }
        }

        this.isHeaderShow = true
        this.isRandomShow = true
        this.isRandomListShow = false

        if (IS_BROWSER && ! isAdmin) {
          this.prevMethod = this.method
          this.prevType = this.type

          this.prevUrl = vUrl.value
          this.prevUrlComment = vUrlComment.value
          this.prevInput = vInput.value
          this.prevComment = vComment.value
          this.prevWarning = vWarning.value
          this.prevRandom = '' // vRandom.value
          this.prevHeader = vHeader.value
          this.prevScript = vScript.value

          this.method = REQUEST_TYPE_POST
          this.type = REQUEST_TYPE_JSON
          this.showUrl(isAdmin, '/login')
          vInput.value = JSON.stringify(req, null, '    ')

          this.testRandomCount = 1
          // vRandom.value = `phone: App.account\npassword: App.password\nremember: vRemember.checked`
        }

        this.scripts = newDefaultScript()
        this.method = REQUEST_TYPE_POST
        this.type = REQUEST_TYPE_JSON
        this.showTestCase(false, this.isLocalShow)
        if (IS_BROWSER) {
          this.onChange(false)
        }
      },

      setRememberLogin: function (remember) {
        vRemember.checked = remember || false
      },

      getCurrentAccount: function() {
        return this.accounts == null ? null : this.accounts[this.currentAccountIndex]
      },
      getCurrentAccountId: function() {
        var a = this.getCurrentAccount()
        return a != null && a.isLoggedIn ? a.id : null
      },

      /**登录
       */
      login: function (isAdminOperation, callback) {
        this.isEditResponse = false
        var schemas = StringUtil.isEmpty(this.schema, true) ? null : StringUtil.split(this.schema)

        const req = {
          type: 0, // 登录方式，非必须 0-密码 1-验证码
          // asDBAccount: ! isAdminOperation,  // 直接 /execute 接口传 account, password
          phone: this.account,
          password: this.password,
          version: 1, // 全局默认版本号，非必须
          remember: vRemember.checked,
          format: false,
          defaults: isAdminOperation ? {
            key: IS_NODE ? this.key : undefined  // 突破常规查询数量限制
          } : {
            '@database': StringUtil.isEmpty(this.database, true) ? undefined : this.database,
            '@schema': schemas == null || schemas.length != 1 ? undefined : this.schema
          }
        }

        if (isAdminOperation) {
          this.isLoginShow = false
          this.request(isAdminOperation, REQUEST_TYPE_POST, REQUEST_TYPE_JSON, this.server + '/login', req, this.getHeader(vHeader.value), function (url, res, err) {
            if (callback) {
              callback(url, res, err)
              return
            }

            App.onLoginResponse(isAdminOperation, req, url, res, err);
          })
        }
        else {
          function recover() {
            App.isLoginShow = false

            if (App.prevUrl != null) {
              App.method = App.prevMethod || REQUEST_TYPE_POST
              App.type = App.prevType || REQUEST_TYPE_JSON

              vUrl.value = App.prevUrl || (URL_BASE + '/get')
              vUrlComment.value = App.prevUrlComment || ''
              vComment.value = App.prevComment || ''
              vWarning.value = App.prevWarning || ''
              vInput.value = App.prevInput || '{}'
              // vRandom.value = App.prevRandom || ''
              vHeader.value = App.prevHeader || ''
              vScript.value = App.prevScript || ''

              App.prevUrl = null
            }
          }

          const baseUrl = this.getBaseUrl()

          if (IS_BROWSER && callback == null) {
            var item
            for (var i in this.accounts) {
              item = this.accounts[i]
              if (item != null && baseUrl == item.baseUrl && req.phone == item.phone) {
                recover()
                alert(req.phone +  ' 已在测试账号中！')
                // this.currentAccountIndex = i
                item.remember = vRemember.checked
                this.onClickAccount(i, item)
                return
              }
            }
          }

          this.scripts = newDefaultScript()

          const isLoginShow = this.isLoginShow
          var curUser = this.getCurrentAccount() || {}
          const loginMethod = (isLoginShow ? this.method : curUser.loginMethod) || REQUEST_TYPE_POST
          const loginType = (isLoginShow ? this.type : curUser.loginType) || REQUEST_TYPE_JSON
          const loginUrl = (isLoginShow ? this.getBranchUrl() : curUser.loginUrl) || '/login'
          const loginReq = (isLoginShow ? this.getRequest(vInput.value) : curUser.loginReq) || req
          // const loginRandom = (isLoginShow ? vRandom.value : curUser.loginRandom) || ''
          const loginRandom = (isLoginShow ? '' : curUser.loginRandom) || ''
          const loginHeader = (isLoginShow ? this.getHeader(vHeader.value) : curUser.loginHeader) || {}

          function loginCallback(url, res, err, random) {
            recover()
            if (callback) {
              callback(url, res, err)
            } else {
              App.onLoginResponse(isAdminOperation, req, url, res, err, loginMethod, loginType, loginUrl, loginReq, loginRandom, loginHeader)
            }

            if (App.prevUrl != null) {
              App.method = App.prevMethod || REQUEST_TYPE_POST
              App.type = App.prevType || REQUEST_TYPE_JSON

              vUrl.value = App.prevUrl || (URL_BASE + '/get')
              vUrlComment.value = App.prevUrlComment || ''
              vComment.value = App.prevComment || ''
              vWarning.value = App.prevWarning || ''
              vInput.value = App.prevInput || '{}'
              // vRandom.value = App.prevRandom || ''
              vHeader.value = App.prevHeader || ''
              vScript.value = App.prevScript || ''

              App.prevUrl = null
            }
          }

          if (isLoginShow) {
            this.isLoginShow = false

            this.testRandomWithText(true, loginCallback)
            return
          }

          this.scripts = newDefaultScript()

          this.parseRandom(loginReq, loginRandom, 0, true, false, false, function(randomName, constConfig, constJson) {
              App.request(isAdminOperation, loginMethod, loginType, baseUrl + loginUrl, constJson, loginHeader, function (url, res, err) {
                if (App.isEnvCompareEnabled != true) {
                  loginCallback(url, res, err, null, loginMethod, loginType, loginUrl, constJson, loginHeader)
                  return
                }

                App.request(isAdminOperation, loginMethod, loginType, App.getBaseUrl(App.otherEnv) + loginUrl
                    , loginReq, loginHeader, function(url_, res_, err_) {
                      var data = res_.data
                      var user = data.user || data.userObj || data.userObject || data.userRsp || data.userResp || data.userBean || data.userData || data.data || data.User || data.Data
                      if (user != null) {
                        var headers = res.headers || {}
                        App.otherEnvTokenMap[req.phone + '@' + baseUrl] = headers.token || headers.Token || data.token || data.Token || user.token || user.Token
                        App.otherEnvCookieMap[req.phone + '@' + baseUrl] = res.cookie || headers.cookie || headers.Cookie || headers['set-cookie'] || headers['Set-Cookie']
                        App.saveCache(App.otherEnv, 'otherEnvTokenMap', App.otherEnvTokenMap)
                        App.saveCache(App.otherEnv, 'otherEnvCookieMap', App.otherEnvCookieMap)
                      }

                      if (callback) {
                        callback(url, res, err)
                        return
                      }

                      App.onResponse(url_, res_, err_);
                      App.onLoginResponse(isAdminOperation, req, url, res, err, loginMethod, loginType, loginUrl, constJson, loginRandom, loginHeader)
                    }, App.scripts)
              })
          })
        }
      },

      onLoginResponse: function(isAdmin, req, url, res, err, loginMethod, loginType, loginUrl, loginReq, loginRandom, loginHeader) {
        res = res || {}
        if (isAdmin) {
          var data = res.data || {}

          var user = data.user || data.userObj || data.userObject || data.userRsp || data.userResp || data.userBean || data.userData || data.data || data.User || data.Data
          if (user == null) {
            alert('登录失败，请检查网络后重试。\n' + data.msg + '\n详细信息可在浏览器控制台查看。')
            App.onResponse(url, res, err)
          }
          else {
            if (user != null) {
              var headers = res.headers || {}
              user.remember = data.remember
              user.phone = req.mobile || req.mobileNo || req.mobileNum || req.mobileNumber || req.phone || req.phoneNo || req.phoneNum || req.phoneNumber || req.mobile_no || req.mobile_num || req.mobile_number || req.phone_no || req.phone_num || req.phone_number
              user.password = req.password
              user.token = headers.token || headers.Token || data.token || data.Token || user.token || user.Token || user.accessToken || user.access_token || data.accessToken || data.access_token
              user.cookie = res.cookie || headers.cookie || headers.Cookie || headers['set-cookie'] || headers['Set-Cookie']
              App.User = user
            }

            //保存User到缓存
            App.saveCache(App.server, 'User', user)

            if (App.currentAccountIndex == null || App.currentAccountIndex < 0) {
              App.currentAccountIndex = 0
            }
            var item = App.accounts[App.currentAccountIndex]
            item.isLoggedIn = false
            App.onClickAccount(App.currentAccountIndex, item) //自动登录测试账号

            if (user.id > 0) {
              if (App.isChainShow && App.chainShowType != 1 && App.chainPaths.length <= 0 && App.chainGroups.length <= 0) {
                App.selectChainGroup(-1, null)
              }
              if (App.caseShowType != 1 && App.casePaths.length <= 0 && App.caseGroups.length <= 0) {
                App.selectCaseGroup(-1, null)
              }
              App.showTestCase(true, false)
            }
          }
        } else {
          App.onResponse(url, res, err)

          //由login按钮触发，不能通过callback回调来实现以下功能
          var data = res.data || {}
          if (JSONResponse.isSuccess(data)) {
            var headers = res.headers || {}
            var user = data.user || data.userObj || data.userObject || data.userRsp || data.userResp || data.userBean || data.userData || data.data || data.User || data.Data
            App.accounts.push({
              isLoggedIn: true,
              baseUrl: App.getBaseUrl(),
              id: user.id,
              name: user.name || user.nickname || user.nickName || user.user_name || user.username || user.userName,
              phone: req.phone,
              password: req.password,
              remember: data.remember,
              loginMethod: loginMethod,
              loginType: loginType,
              loginUrl: loginUrl,
              loginReq: loginReq,
              loginRandom: loginRandom,
              loginHeader: loginHeader,
              cookie: res.cookie || headers.cookie,
              token: headers.token || headers.Token || data.token || data.Token || user.token || user.Token || user.accessToken || user.access_token || data.accessToken || data.access_token
            })

            var lastItem = App.accounts[App.currentAccountIndex]
            if (lastItem != null) {
              lastItem.isLoggedIn = false
            }

            App.currentAccountIndex = App.accounts.length - 1
            App.saveAccounts()
            App.listScript()
          }
        }
      },

      /**注册
       */
      register: function (isAdminOperation) {
        this.scripts = newDefaultScript()
        this.showUrl(isAdminOperation, '/register')
        vInput.value = JSON.stringify(
          {
            Privacy: {
              phone: this.account,
              _password: this.password
            },
            User: {
              name: 'APIJSONUser'
            },
            verify: vVerify.value
          },
          null, '    ')
        this.showTestCase(false, false)
        this.onChange(false)
        this.send(isAdminOperation, function (url, res, err) {
          App.onResponse(url, res, err)

          var data = res.data

          if (JSONResponse.isSuccess(data)) {
            alert('注册成功')

            var privacy = data.Privacy || {}

            App.account = privacy.phone
            App.loginType = 'login'
          }
        }, this.scripts)
      },

      /**重置密码
       */
      resetPassword: function (isAdminOperation) {
        this.scripts = newDefaultScript()
        this.showUrl(isAdminOperation, '/put/password')
        vInput.value = JSON.stringify(
          {
            verify: vVerify.value,
            Privacy: {
              phone: this.account,
              _password: this.password
            }
          },
          null, '    ')
        this.showTestCase(false, this.isLocalShow)
        this.onChange(false)
        this.send(isAdminOperation, function (url, res, err) {
          App.onResponse(url, res, err)

          var data = res.data

          if (JSONResponse.isSuccess(data)) {
            alert('重置密码成功')

            var privacy = data.Privacy || {}

            App.account = privacy.phone
            App.loginType = 'login'
          }
        }, this.scripts)
      },

      /**退出
       */
      logout: function (isAdminOperation, callback) {
        this.isEditResponse = false
        var req = {}

        if (isAdminOperation) {
          // alert('logout  isAdminOperation  this.saveCache(this.server, User, {})')
          this.delegateId = null
          this.saveCache(this.server, 'delegateId', null)

          this.saveCache(this.server, 'User', {})
        }

        // alert('logout  isAdminOperation = ' + isAdminOperation + '; url = ' + url)
        if (isAdminOperation) {
          this.request(isAdminOperation, REQUEST_TYPE_POST, REQUEST_TYPE_JSON, this.server + '/logout'
              , req, this.getHeader(vHeader.value), function (url, res, err) {
            if (callback) {
              callback(url, res, err)
              return
            }

            // alert('logout  clear admin ')

            App.clearUser()
            App.onResponse(url, res, err)
            App.showTestCase(false, App.isLocalShow)
          })
        }
        else {
          this.scripts = newDefaultScript()
          this.showUrl(isAdminOperation, '/logout')
          vInput.value = JSON.stringify(req, null, '    ')
          this.method = REQUEST_TYPE_POST
          this.type = REQUEST_TYPE_JSON
          this.showTestCase(false, this.isLocalShow)
          this.onChange(false)
          this.send(isAdminOperation, function (url, res, err) {
            if (App.isEnvCompareEnabled != true) {
              if (callback) {
                callback(url, res, err)
              }
              return
            }

            App.request(isAdminOperation, REQUEST_TYPE_POST, REQUEST_TYPE_JSON, App.getBaseUrl(App.otherEnv) + '/logout'
                , req, App.getHeader(vHeader.value), function (url_, res_, err_) {
              if (callback) {
                callback(url, res, err)
                return
              }
            })

          }, this.scripts)
        }
      },

      /**获取验证码
       */
      getVerify: function (isAdminOperation) {
        this.scripts = newDefaultScript()
        this.showUrl(isAdminOperation, '/post/verify')
        var type = this.loginType == 'login' ? 0 : (this.loginType == 'register' ? 1 : 2)
        vInput.value = JSON.stringify(
          {
            type: type,
            phone: this.account
          },
          null, '    ')
        this.showTestCase(false, this.isLocalShow)
        this.onChange(false)
        this.send(isAdminOperation, function (url, res, err) {
          App.onResponse(url, res, err)

          var data = res.data || {}
          var obj = JSONResponse.isSuccess(data) ? data.verify : null
          var verify = obj == null ? null : obj.verify
          if (verify != null) { //FIXME isEmpty校验时居然在verify=null! StringUtil.isEmpty(verify, true) == false) {
            vVerify.value = verify
          }
        }, this.scripts)
      },

      clearUser: function () {
        this.User.id = 0
        this.Privacy = {}
        this.casePaths = []
        this.caseGroups = []
        this.remotes = []
        // 导致刚登录成功就马上退出 this.delegateId = null
        this.saveCache(this.server, 'User', this.User) //应该用lastBaseUrl,baseUrl应随watch输入变化重新获取
        // this.saveCache(this.server, 'delegateId', this.delegateId) //应该用lastBaseUrl,baseUrl应随watch输入变化重新获取
      },

      /**计时回调
       */
      onHandle: function (before) {
        if (IS_NODE) {
          return;
        }

        this.isDelayShow = false
        if (inputted != before) {
          clearTimeout(handler);
          return;
        }

        this.view = 'output';
        vComment.value = '';
        vWarning.value = '';
        // vUrlComment.value = '';
        vOutput.value = 'resolving...';

        //格式化输入代码
        try {
          try {
            this.header = this.getHeader(vHeader.value)
          } catch (e2) {
            this.isHeaderShow = true
            vHeader.select()
            throw new Error(e2.message)
          }

          before = StringUtil.trim(before);

          var afterObj;
          var after;
          var code = '';

          if (StringUtil.isEmpty(before)) {
            afterObj = {};
            after = '';
          } else {
            before = StringUtil.trim(before); // this.toDoubleJSON(StringUtil.trim(before));
            log('onHandle  before = \n' + before);

            var json = isSingle ? this.switchQuote(before) : before;
            try {
              afterObj = jsonlint.parse(json);
              after = JSON.stringify(afterObj, null, "    ");
              before = isSingle ? this.switchQuote(after) : after;
            }
            catch (e) {
              log('main.onHandle', 'try { return jsonlint.parse(before); \n } catch (e) {\n' + e.message)
              log('main.onHandle', 'return jsonlint.parse(this.removeComment(before));')

              try {
                afterObj = JSON5.parse(json);  // jsonlint.parse(this.removeComment(before));
                after = JSON.stringify(afterObj, null, "    ");
              } catch (e2) {
                throw new Error('请求 JSON 格式错误！请检查并编辑请求！\n\n如果JSON中有注释，请 手动删除 或 点击左边的 \'/" 按钮 来去掉。\n\n' + e.message + '\n\n' + e2.message)
              }
            }

            //关键词let在IE和Safari上不兼容
            if (this.isEditResponse != true) {
              try {
                code = this.getCode(after); //必须在before还是用 " 时使用，后面用会因为解析 ' 导致失败
              } catch (e) {
                code = '\n\n\n建议:\n使用其它浏览器，例如 谷歌Chrome、火狐FireFox 或者 微软Edge， 因为这样能自动生成请求代码.'
                  + '\nError:\n' + e.message + '\n\n\n';
              }
            }

            var selectionStart = vInput.selectionStart
            var selectionEnd = vInput.selectionEnd
            vInput.value = before
              + '\n\n\n                                                                                                       '
              + '                                                                                                       \n';  //解决遮挡

            vInput.selectionStart = selectionStart
            vInput.selectionEnd = selectionEnd
            vInput.setSelectionRange(selectionStart, selectionEnd)
          }

          vSend.disabled = false;

          if (this.isEditResponse != true) {
            vOutput.value = output = '登录后点 ↑ 上方左侧最后图标按钮可查看用例列表，点上方右侧中间图标按钮可上传用例并且添加到列表中 ↑ \nOK，请点左上方 [发送请求] 按钮来测试。[点击这里查看视频教程](https://i.youku.com/i/UNTg1NzI1MjQ4MA==/videos?spm=a2hzp.8244740.0.0)' + code;

            this.showDoc()
          }

          var docKey = this.isEditResponse ? 'TestRecord' : 'Document';
          var currentItem = (this.currentRemoteItem || {})[docKey] || {}
          var detail = currentItem.detail;
          var extraComment = this.getExtraComment()

          try {
            var standardObj = null;
            try {
              standardObj = parseJSON(currentItem.standard);
            } catch (e3) {
              log(e3)
            }

            var isAPIJSONRouter = false;
            try {
              var apijson = parseJSON(currentItem.apijson);
              isAPIJSONRouter = JSONResponse.isObject(apijson)
            } catch (e3) {
              log(e3)
            }

            var m = this.getMethod();
            var w = isSingle || this.isEditResponse ? '' : StringUtil.trim(CodeUtil.parseComment(after, docObj == null ? null : docObj['[]'], m, this.database, this.language, this.isEditResponse != true, standardObj, null, true, isAPIJSONRouter));
            var c = isSingle ? '' : StringUtil.trim(CodeUtil.parseComment(after, docObj == null ? null : docObj['[]'], m, this.database, this.language, this.isEditResponse != true, standardObj, null, null, isAPIJSONRouter));

            //TODO 统计行数，补全到一致 vInput.value.lineNumbers
            if (isSingle != true) {
              if (afterObj.tag == null) {
                m = m == null ? 'GET' : m.toUpperCase()
                if (['GETS', 'HEADS', 'POST', 'PUT', 'DELETE'].indexOf(m) >= 0) {
                  w += ' ! 非开放请求必须设置 tag ！例如 "tag": "User"'
                  c += ' ! 非开放请求必须设置 tag ！例如 "tag": "User"'
                }
              }

              if (StringUtil.isEmpty(detail, true)) {
                c += extraComment == null ? '' : ('\n\n/*' + extraComment + '\n*/');
              } else {
                c += '\n\n/*' + (extraComment == null ? '' : extraComment + '\n\n') + detail + '\n*/';
              }
            }


            vWarning.value = w
              + '\n\n\n                                                                                                       '
              + '                                                                                                       \n';  //解决遮挡
            vComment.value = c
              + '\n\n\n                                                                                                       '
              + '                                                                                                       \n';  //解决遮挡

            vUrlComment.value = isSingle || StringUtil.isEmpty(this.urlComment, true)
              ? '' : CodeUtil.getBlank(StringUtil.length(vUrl.value), 1) + CodeUtil.getComment(this.urlComment, false, ' ')
              + ' - ' + (this.requestVersion > 0 ? 'V' + this.requestVersion : 'V*');

            if (! isSingle) {
              var method = this.getMethod();  // m 已经 toUpperCase 了
              var isRestful = ! JSONObject.isAPIJSONPath(method);
              if (isRestful != true) {
                method = method.toUpperCase();
              }
              var apiMap = isRestful ? CodeUtil.thirdPartyApiMap : null;
              var api = apiMap == null ? null : apiMap['/' + method];
              var name = api == null ? null : api.name;
              if (StringUtil.isEmpty(name, true) == false) {
                this.urlComment = name;
                vUrlComment.value = CodeUtil.getBlank(StringUtil.length(vUrl.value), 1) + CodeUtil.getComment(this.urlComment, false, ' ')
              }
            }

            onScrollChanged()
            onURLScrollChanged()
          } catch (e) {
            log('onHandle   try { vComment.value = CodeUtil.parseComment >> } catch (e) {\n' + e.message);
          }

          if (this.isPreviewEnabled) {
            try {
              // 去掉前面的 JSON
              var raw = StringUtil.trim(isSingle ? vInput.value : vComment.value);
              var start = raw.lastIndexOf('\n/*')
              var end = raw.lastIndexOf('\n*/')
              var ct = start < 0 || end <= start ? '' : StringUtil.trim(raw.substring(start + '\n/*'.length, end))

              markdownToHTML('```js\n' + (start < 0 || end <= start ? raw : raw.substring(0, start)) + '\n```\n'
                + (StringUtil.isEmpty(ct, true) ? '' : ct + '\n\n```js\n' + ct + '\n```\n'), true);
            } catch (e3) {
              log(e3)
            }
          }

          if (this.isEditResponse) {
            this.view = 'code';
            this.jsoncon = after
          }

        } catch(e) {
          log(e)
          vSend.disabled = true

          this.view = 'error'
          this.error = {
            msg: e.message
          }
        }
      },


      /**输入内容改变
       */
      onChange: function (delay) {
        this.setBaseUrl();

        if (IS_NODE || document.activeElement == vOption || this.options.length > 0) {
          return;
        }

        inputted = StringUtil.get(vInput.value);
        vComment.value = '';
        vWarning.value = '';
        // vUrlComment.value = '';

        clearTimeout(handler);

        this.isDelayShow = delay;

        if (delay) {
          handler = setTimeout(function () {
            App.onHandle(inputted);
          }, 2000);
        } else {
          this.onHandle(inputted);
        }
      },

      /**单双引号切换
       */
      transfer: function () {
        isSingle = ! isSingle;

        vInput.value = this.switchQuote(vInput.value);

        this.isTestCaseShow = false;

        // // 删除注释 <<<<<<<<<<<<<<<<<<<<<
        //
        // var input = this.removeComment(vInput.value);
        // if (vInput.value != input) {
        //   vInput.value = input
        // }
        //
        // // 删除注释 >>>>>>>>>>>>>>>>>>>>>

        this.onChange(false);

        var list = docObj == null ? null : docObj['[]'];
        if (list != null && list.length > 0) {
          this.onDocumentListResponse('', {data: docObj}, null, function (d) {
            App.setDoc(d);
          });
        }
      },

      isShowMethod: function() {
        return this.methods == null || this.methods.length != 1
      },
      isShowType: function() {
        return this.types == null || this.types.length != 1
      },

      /**请求类型切换
       */
      changeMethod: function () {
        var methods = this.methods
        var count = methods == null ? 0 : methods.length
        if (count <= 0) {
          methods = HTTP_METHODS
          count = HTTP_METHODS.length
        }

        if (count > 1) {
          var index = methods.indexOf(this.method) + 1
          CodeUtil.method = this.method = methods[index % count]
        }
        this.onChange(false);
      },

      /**获取显示的请求方法名称
       */
      getMethodName: function (method, type) {
        method = StringUtil.trim(method)
        if (method.length > 0) {
          return method
        }

        return [REQUEST_TYPE_GET, REQUEST_TYPE_PARAM].indexOf(type) < 0 ? REQUEST_TYPE_POST : REQUEST_TYPE_GET
      },
      /**获取显示的请求类型名称
       */
      getTypeName: function (type, method) {
        var t = type
        if (StringUtil.isEmpty(t, true)) {
          if (StringUtil.isEmpty(method, true)) {
            t = REQUEST_TYPE_JSON
          }
          else if (method == REQUEST_TYPE_GET) {
            t = REQUEST_TYPE_PARAM
          }
          else if (method == REQUEST_TYPE_POST) {
            t = REQUEST_TYPE_JSON
          }
          else {
            t = REQUEST_TYPE_DATA
          }
        }

//        var methods = this.methods
//        if (this.isShowMethod()) {
//          return t
//        }
//
//        var ts = this.types
//        if (ts == null || ts.length <= 1 || (ts.length <= 2 && ts.indexOf(REQUEST_TYPE_PARAM) >= 0 && ts.indexOf(REQUEST_TYPE_GRPC) < 0)) {
//          return t == REQUEST_TYPE_PARAM ? 'GET' : 'POST'
//        }
        return t
      },
      /**请求类型切换
       */
      changeType: function () {
        var types = this.types
        var count = types == null ? 0 : types.length
        if (count <= 0) {
          types = HTTP_CONTENT_TYPES
          count = HTTP_CONTENT_TYPES.length
        }

        if (count > 1) {
          var index = types.indexOf(this.type) + 1
          this.type = types[index % count]
          CodeUtil.type = this.type;
        }

        var url = StringUtil.get(vUrl.value)
        var index = url.indexOf('?')
        if (index >= 0) {
          var paramObj = getRequestFromURL(url.substring(index), true)
          vUrl.value = url.substring(0, index)
          if (paramObj != null && JSONObject.isEmpty(paramObj) == false) {
            var originVal = this.getRequest(vInput.value, {});
            var isConflict = false;

            if (JSONObject.isEmpty(originVal) == false) {
              for (var k in paramObj) {
                if (originVal.hasOwnProperty(k)) {
                  isConflict = true;
                  break;
                }
              }
            }

            if (isConflict) {
              vInput.value = JSON.stringify(paramObj, null, '    ') + '\n\n// FIXME 从 URL 上的参数转换过来，需要与下面原来的字段合并为一个 JSON：\n\n' + StringUtil.get(vInput.value)
            }
            else {
              vInput.value = JSON.stringify(Object.assign(originVal, paramObj), null, '    ')
            }
          }
          clearTimeout(handler)  //解决 vUrl.value 和 vInput.value 变化导致刷新，而且会把 vInput.value 重置，加上下面 onChange 再刷新就卡死了
        }

        this.onChange(false);
      },

      changeScriptType: function (type) {
        type = type || 'case'
        if (type == 'account') {
          var id = this.getCurrentAccountId()
          if (id == null || id <= 0) {
            type = 'case'
          }
        }

        this.scriptBelongId = 0 // 解决可能的报错
        this.scriptType = type
        var bid = this.getCurrentScriptBelongId()

        var scripts = this.scripts
        if (scripts == null) {
          scripts = newDefaultScript()
          this.scripts = scripts
        }
        var ss = scripts[type]
        if (ss == null) {
          ss = {
            0: {
              pre: { // 可能有 id
                script: '' // index.html 中 v-model 绑定，不能为 null
              },
              post: {
                script: ''
              }
            },
            [bid]: {
              pre: { // 可能有 id
                script: '' // index.html 中 v-model 绑定，不能为 null
              },
              post: {
                script: ''
              }
            }
          }
          scripts[type] = ss
        }

        var bs = ss[bid]
        if (bs == null) {
          bs = {
            pre: { // 可能有 id
              script: '' // index.html 中 v-model 绑定，不能为 null
            },
            post: {
              script: ''
            }
          }
          ss[bid] = bs
        }
        var pre = bs.pre
        if (pre == null) {
          pre = {
            script: ''
          }
          bs.pre = pre
        }
        if (pre.script == null) {
          pre.script = ''
        }

        var post = bs.post
        if (post == null) {
          post = {
            script: ''
          }
          bs.post = post
        }
        if (post.script == null) {
          post.script = ''
        }

        this.scriptBelongId = bid
      },
      changeScriptPriority: function (isPre) {
        this.isPreScript = isPre == true
        this.changeScriptType(this.scriptType)
      },

      /**
       * 删除注释
       */
      removeComment: function (json) {
        var reg = /("([^\\\"]*(\\.)?)*")|('([^\\\']*(\\.)?)*')|(\/{2,}.*?(\r|\n))|(\/\*(\n|.)*?\*\/)/g // 正则表达式
        try {
          return StringUtil.get(json).replace(reg, function(word) { // 去除注释后的文本
            return /^\/{2,}/.test(word) || /^\/\*/.test(word) ? "" : word;
          })
        } catch (e) {
          log('transfer  delete comment in json >> catch \n' + e.message);
        }
        return json;
      },

      handleFileSelect: function(event) {
        const isSub = this.isRandomSubListShow;
        const items = (isSub ? this.randomSubs : this.randoms) || [];
        const cri = this.currentRandomItem || {}
        const doc = (this.currentRemoteItem || {}).Document || {}
        const random = cri.Random || {}
        const ind = isSub && this.currentRandomSubIndex != null ? this.currentRandomSubIndex : this.currentRandomIndex;

        var selectedFiles = Array.from(event.target.files);
        // const previewList = document.getElementById('previewList');
        // previewList.innerHTML = '';

        selectedFiles.forEach((file, i) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            // const img = document.createElement('img');
            // img.src = e.target.result;
            // img.style.height = '100%';
            // img.style.margin = '1px';
            // previewList.appendChild(img);

            const index = ind != null && ind >= 0 ? ind : items.length;
            var item = JSONResponse.deepMerge({
              Random: {
                id: -(index || 0) - 1, //表示未上传
                toId: random.id,
                userId: random.userId || doc.userId,
                documentId: random.documentId || doc.id,
                count: 1,
                name: '分析位于 ' + index + ' 的这张图片',
                img: e.target.result,
                config: ''
              }
            }, items[index] || {});
            item.status = 'uploading';

            const r = item.Random || {};
            r.name = r.file = file.name;
            r.size = file.size;
            r.width = file.width;
            r.height = file.height;

            items[index] = item;

            if (isSub) {
              this.randomSubs = items;
            }
            else {
              this.randoms = items;
            }

            try {
              Vue.set(items, index, item);
            } catch (e) {
              console.error(e)
            }

            const formData = new FormData();
            formData.append('file', file);

            fetch(this.server + '/upload', {
              method: 'POST',
              body: formData
            })
                .then(response => response.json())
                .then(data => {
                  var path = data.path;
                  if (StringUtil.isEmpty(path, true) || data.size == null) {
                    throw new Error('上传失败！' + JSON.stringify(data || {}));
                  }

                  console.log('Upload successful:', data);
                  item.status = 'done';
                  r.img = (path.startsWith('/') ? App.server + path : path) || r.img;

                  try {
                    Vue.set(items, index, item);
                  } catch (e) {
                    console.error(e)
                  }

                  App.updateRandom(r)
                })
                .catch(error => {
                  console.error('Upload failed:', error);
                  item.status = 'failed';
                });
          };
          reader.readAsDataURL(file);
        });
      },

      uploadImage: function(randomIndex, randomSubIndex) {
        const isSub = randomSubIndex != null;
        const items = (isSub ? this.randomSubs : this.randoms) || [];
        const cri = this.currentRandomItem || {}
        const ind = isSub && randomSubIndex != null ? randomSubIndex : randomIndex;
        const item = items[ind] || {}
        const random = item.Random || {}

        if (StringUtil.isEmpty(item.img)) {
          alert('Please select an image file.');
          this.onClickAddRandom(randomIndex, randomSubIndex)
          return;
        }

        const formData = new FormData();
        formData.append('file', item.img);

        fetch(this.server + '/upload', {
          method: 'POST',
          body: formData
        })
            .then(response => response.json())
            .then(data => {
              var path = data.path;
              if (StringUtil.isEmpty(path, true) || data.size == null) {
                throw new Error('上传失败！' + JSON.stringify(data || {}));
              }

              console.log('Upload successful:', data);
              item.status = 'done';
              const img = (path.startsWith('/') ? App.server + path : path) || item.img || '';
              var keys = StringUtil.split(data.path, '/');
              var fn = keys == null ? null : keys[keys.length - 1];
              random.name = random.file = StringUtil.isEmpty(fn, true) ? fn : random.file;
              App.img = random.img = img;
              random.size = (data.size || (StringUtil.length(img) * (3/4)) - (img.endsWith('==') ? 2 : 1));
              random.width = data.width || random.width;
              random.height = data.height || random.height;
              try {
                Vue.set(items, ind, item);
              } catch (e) {
                console.error(e)
              }

              App.updateRandom(random) // event 无效 App.doOnKeyUp(event, 'random', false, item)
            })
            .catch(error => {
              console.error('Upload failed:', error);
              alert('Failed to upload image.');
              item.status = 'failed';
            });
      },

      updateRandom: function (random) {
        if (random == null) {
          alert('上传/修改图片失败, random == null!');
          return
        }

        var id = random.id
        var isPost = id == null || id <= 0
        var r = isPost ? JSON.parse(JSON.stringify(random)) : random;
        if (isPost) {
          r.id = undefined
        }

        this.request(true, REQUEST_TYPE_POST, REQUEST_TYPE_JSON, this.server + (isPost ? '/post' : '/put'), {
          Random: r,
          TestRecord: isPost ? {
            response: '',
          } : undefined,
          tag: 'Random'
        }, {}, function (url, res, err) {
          App.onResponse(url, res, err)
          var data = res.data
          var isOk = JSONResponse.isSuccess(data)

          var msg = isOk ? '' : ('\nmsg: ' + StringUtil.get((data || {}).msg))
          if (err != null) {
            msg += '\nerr: ' + err.msg
            alert((isPost ? '新增' : '修改') + (isOk ? '成功' : '失败') + '\nname: ' + random.name + msg)
          }
          if (isPost) {
            random.id = (data.Random || {}).id
          }
          App.isRandomEditable = ! isOk
        })
      },

      syncCanvasSize: function(stage) {
        const img = this.imgMap[stage];
        const canvas = this.canvasMap[stage];
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        this.draw(stage);

        const realWidth = this.isFullScreen ? 0 : (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth || 1920);
        const maxTextWidth = realWidth <= 0 ? 0 : Math.max(vAfterTitle.clientWidth || 0, vDiffTitle.clientWidth || 0, vBeforeTitle.clientWidth || 0);
        const imgWidth = maxTextWidth <= 0 ? 0 :  Math.max(maxTextWidth, img.width || vAfter.width || vDiff.width || vBefore.width || realWidth/(window.devicePixelRatio*3));
        if (imgWidth <= 0 || imgWidth >= 700) {
          return;
        }

        this.moveSplit(Math.min(0.7, Math.max(0.3, (imgWidth + 450)/realWidth)));
      },
      getCanvasXY: function(stage, event) {
        const el = this.canvasMap[stage];
        const rect = el.getBoundingClientRect();
        return [event.clientX - rect.left, event.clientY - rect.top];
      },

      draw: function(stage) {
        const detection = this.detection || {};
        const img = this.imgMap[stage];
        const canvas = this.canvasMap[stage];
        const det = detection[stage];
        const isDiff = stage === 'diff';

        JSONResponse.drawDetections(canvas, det, {
          hoverBoxId: this.hoverIds[stage],
          visiblePaths: this.visiblePaths,
          labelBackground: true,
          rotateBoxes: true,
          rotateText: false,
          stage: stage,
          markable: stage == 'after', // 'diff',
          styleOverride: isDiff ? (box, isBefore) => {
            if (! box.color) { // 防止空色
              box.color = [255, 255, 255, 128]
            };
            // 以原始颜色为基准，做红移或蓝移，透明度相对调节
            // return { color: JSONResponse.shiftColor(box.color, isBefore ? 'red' : 'blue', isBefore ? 1.2 : 0.8) };  // 红移，透明度放大20%；蓝移，透明度缩小 20%
            return { color: JSONResponse.adjustBrightness(box.color, isBefore ? 'darken' : 'brighten', isBefore ? 1.2 : 0.8) };  // 暗移，透明度放大20%；亮移，透明度缩小 20%
          } : null
        }, img);
      },
      drawAll: function() {
        ['before', 'diff', 'after'].forEach(stage => this.draw(stage));
      },
      compute: function() {
        const detection = this.detection || {};
        var total = detection.total;
        ['before', 'after'].forEach(stage => {
          var det2 = detection[stage]
          var correctCount = 0;
          var wrongCount = 0;
          const bboxes = JSONResponse.getBboxes(det2) || [];
          bboxes.forEach(bbox => {
            if (bbox.correct === false) {
              wrongCount ++;
            } else {
              correctCount ++;
            }
          })

          detection[stage + 'Correct'] = correctCount;
          detection[stage + 'Wrong'] = wrongCount;
          detection[stage + 'Miss'] = total - correctCount;
          var recall = detection[stage + 'Recall'] = correctCount/total;
          var precision = detection[stage + 'Precision'] = correctCount/(correctCount + wrongCount);
          var f1 = detection[stage + 'F1'] = (2*recall*precision)/(recall + precision);
          detection[stage + 'RecallStr'] = (100*recall).toFixed(0) + '%';
          detection[stage + 'PrecisionStr'] = (100*precision).toFixed(0) + '%';
          detection[stage + 'F1Str'] = (100*f1).toFixed(0) + '%';
        })

        if (total <= 0) {
          detection.total = total = detection.afterCorrect || detection.beforeCorrect;
        }

        var diffCorrect = detection.afterCorrect - detection.beforeCorrect;
        var diffWrong = detection.afterWrong - detection.beforeWrong;
        var diffMiss = detection.afterMiss - detection.beforeMiss;
        var diffRecall = detection.afterRecall - detection.beforeRecall;
        var diffPrecision = detection.afterPrecision - detection.beforePrecision;
        var diffF1 = detection.afterF1 - detection.beforeF1;
        detection['diffCorrectStr'] = diffCorrect >= 0 ? '+' + diffCorrect : diffCorrect;
        detection['diffWrongStr'] = diffWrong >= 0 ? '+' + diffWrong : diffWrong;
        detection['diffMissStr'] = diffMiss >= 0 ? '+' + diffMiss : diffMiss;
        detection['diffRecallStr'] = (diffRecall >= 0 ? '+' : '') + (100*diffRecall).toFixed(0) + '%';
        detection['diffPrecisionStr'] = (diffPrecision >= 0 ? '+' : '') + (100*diffPrecision).toFixed(0) + '%';
        detection['diffF1Str'] = (diffF1 >= 0 ? '+' : '') + (100*diffF1).toFixed(0) + '%';
        this.detection = detection;
      },
      processDiffAndAutoMark: function() {
        var detection = this.detection || {};
        const beforeBoxes = JSONResponse.getBboxes(detection.before) || [];   // 上次参考结果
        const afterBoxes = JSONResponse.getBboxes(detection.after) || [];    // 当前检测结果
        const iouThreshold = (detection.diffThreshold || 90) / 100;

        const diffBoxes = [];
        const total = detection.total || 0;
        var correctCount = 0;
        var file = StringUtil.trim(this.file).replaceAll(/'images'/ig, '').replaceAll(/'image'/ig, '').replaceAll(/'img'/ig, '')
            .replaceAll(/'pictures'/ig, '').replaceAll(/'picture'/ig, '').replaceAll(/'pic'/ig, '')
            .replaceAll(/'photos'/ig, '').replaceAll(/'photo'/ig, '')
            .replaceAll(/'downloads'/ig, '').replaceAll(/'download'/ig, '')
            .replaceAll(/'files'/ig, '').replaceAll(/'file'/ig, '')
            .replaceAll(/'Unknown'/ig, '').replaceAll(/'Unknow'/ig, '')
            .replaceAll(/'Unnamed'/ig, '').replaceAll(/'Unname'/ig, '')
            .replaceAll(/'no name'/ig, '').replaceAll(/'Test'/ig, '')
            .replaceAll(/'examples'/ig, '').replaceAll(/'example'/ig, '')
            .replaceAll(/'new'/ig, '').replaceAll('测试', '')
            .replaceAll('未命名', '').replaceAll('未知', '')
            .replaceAll('示例', '').replaceAll('新建', '')
            .replaceAll('图片', '');

        var dotInd = file.lastIndexOf('.');
        file = dotInd >= 0 ? file.substring(0, dotInd).trim() : file.trim();

        afterBoxes.forEach(curBox => {
          let bestIou = 0;
          let bestRef = null;

          beforeBoxes.forEach(refBox => {
            var curBbox = JSONResponse.getXYWHD(JSONResponse.getBbox(curBox));
            var refBbox = JSONResponse.getXYWHD(JSONResponse.getBbox(refBox));
            const iou = JSONResponse.computeIoU(curBbox, refBbox);
            if (iou > bestIou) {
              bestIou = iou;
              bestRef = refBox;
            }
          });

          var label = curBox.label;
          if (bestIou >= iouThreshold && bestRef != null) {
            // 如果匹配到：标签一致→继承correct，标签不同→打X
            curBox.correct = label === bestRef.label ? bestRef.correct : ! bestRef.correct;
            bestRef.match = (bestRef.match || 0) + 1;
          } else {
            // 没有匹配→打X
            var matchFile = StringUtil.isNotEmpty(file, true) && (
                (StringUtil.isNotEmpty(label, true) && file.indexOf(label) >= 0)
                || (StringUtil.isNotEmpty(curBox.ocr, true) && file.indexOf(curBox.ocr) >= 0)
            );
            // curBox.correct = total == 1 ? matchFile : (matchFile || total <= 0 || correctCount < total ? true : curBox.correct);
            curBox.correct = total == 1 ? matchFile : (matchFile ? true : curBox.correct);
          }

          if (curBox.correct) {
            correctCount ++;
          }

          // diff 结果逻辑：只把差异明显的保存到 diff
          if (iouThreshold <= 0 || bestIou < iouThreshold || bestRef == null || label !== bestRef.label) {
            diffBoxes.push({
              ...curBox,
              isBefore: false
            });
          }
        });

        beforeBoxes.forEach(refBox => {
          if (refBbox != null && (refBbox.match == null || refBbox.match <= 0)) {
            diffBoxes.push({
              ...refBox,
              isBefore: true
            });
          }
        });

        // 如果需要也展示 before 中 unmatched 的box，可遍历 beforeBoxes 进行差异补充
        var diff = this.detection.diff || {};
        diff.bboxes = diffBoxes;
        this.$set(this.detection, 'diff', { bboxes: diffBoxes });
        this.$set(this.detection, 'after', { bboxes: afterBoxes });  // 确保 after 被更新到 Vue
        this.drawAll();
        this.compute();
        this.detection.diff = diff;
        return diff;
      },

      exportJSON: function () {
        const jsonStr = JSON.stringify(this.detection, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'detection_export.json';
        a.click();
        URL.revokeObjectURL(url);
      },

      /**
       * 修正光标坐标与 canvas 标签位置对应的问题
       * 需要考虑 canvas 在页面上显示尺寸与实际 canvas 尺寸比例的缩放
       */
      getCanvasXY: function(stage, event) {
        const canvas = this.canvasMap[stage];
        const rect = canvas.getBoundingClientRect();

        // canvas 上的实际像素坐标需要根据缩放计算
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        return [x, y];
      },

      onMousemove: function(stage, event) {
        const img = this.imgMap[stage];
        const canvas = this.canvasMap[stage];
        const [x, y] = this.getCanvasXY(stage, event);
        let found = null;
        var bboxes = JSONResponse.getBboxes(this.detection[stage]) || []
        let len = bboxes.length;
        var range = ((canvas || {}).height || (img || {}).height || 240) * (len <= 1 ? 0.5 : (len <= 5 ? 0.1/len : 0.02));
        for (const item of bboxes) {
          var bbox = JSONResponse.getXYWHD(JSONResponse.getBbox(item));
          if (JSONResponse.isOnBorder(x, y, bbox, range)) {
            found = item.id;
            break;
          }
        }
        this.$set(this.hoverIds, stage, found);
        this.draw(stage);
      },
      onClickFullScreen: function(event) {
        var isFullScreen = this.isFullScreen = ! this.isFullScreen;
        this.isRandomShow = ! isFullScreen;
        vContainer.style.display = isFullScreen ? '' : 'flex';
        const realWidth = isFullScreen ? 0 : (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth || 1920);
        const maxTextWidth = realWidth <= 0 ? 0 : Math.max(vAfterTitle.clientWidth || 0, vDiffTitle.clientWidth || 0, vBeforeTitle.clientWidth || 0);
        const imgWidth = maxTextWidth <= 0 ? 0 :  Math.max(maxTextWidth, Math.min(700, vAfter.width || vDiff.width || vBefore.width || realWidth/(window.devicePixelRatio*3)));
        this.moveSplit(isFullScreen ? 0.73 : Math.min(0.6, Math.max(0.3, (imgWidth + 450)/realWidth)));
        event?.preventDefault();
      },
      /**
       * 在 drawDetections 里绘制标签按钮时也需要保证位置和点击检测使用相同的坐标体系
       * 例如点击 √ / × 时：
       */
      onClick: function(stage, event) {
        const img = this.imgMap[stage];
        const canvas = this.canvasMap[stage];
        const [x, y] = this.getCanvasXY(stage, event);
        const bboxes = JSONResponse.getBboxes(this.detection[stage]) || []
        let len = bboxes.length;
        var range = ((canvas || {}).height || (img || {}).height || 240) * (len <= 1 ? 0.5 : (len <= 5 ? 0.1/len : 0.02));
        for (const item of bboxes) {
          const [bx, by, bw, bh, d] = JSONResponse.getXYWHD(JSONResponse.getBbox(item));
          const labelX = bx + bw + 4; // 和 drawDetections 中计算按钮位置保持一致
          const labelY = by; // 同上

          const size = 16; // 按钮点击区域大小
          if (x >= labelX && x <= labelX + size && y >= labelY && y <= labelY + size) {
            item.correct = true;
            break;
          }

          if (x >= labelX + size + 4 && x <= labelX + size * 2 + 4 && y >= labelY && y <= labelY + size) {
            item.correct = false;
            break;
          }

          // 其它情况，检测是否点击到框内
          if (JSONResponse.isOnBorder(x, y, [bx, by, bw, bh], range)) {
            item.correct = item.correct === false ? true : false;
            break;
          }
        }

        this.draw(stage);
        this.compute();
      },

      showAndSend: function (branchUrl, req, isAdminOperation, callback) {
        this.showUrl(isAdminOperation, branchUrl)
        vInput.value = JSON.stringify(req, null, '    ')
        this.showTestCase(false, this.isLocalShow)
        this.onChange(false)
        this.send(isAdminOperation, callback)
      },

      /**发送请求
       */
      send: function(isAdminOperation, callback, caseScript_, accountScript_, globalScript_, ignorePreScript) {
        if (this.isTestCaseShow) {
          alert('请先输入请求内容！')
          return
        }

        if (StringUtil.isEmpty(this.host, true)) {
          var url = StringUtil.get(vUrl.value)
          if (url.startsWith('/') != true && url.startsWith('http://') != true && url.startsWith('https://') != true) {
            alert('URL 缺少 http:// 或 https:// 前缀，可能不完整或不合法，\n可能使用同域的 Host，很可能访问出错！')
          }
        }
        else {
          if (StringUtil.get(vUrl.value).indexOf('://') >= 0) {
            alert('URL Host 已经隐藏(固定) 为 \n' + this.host + ' \n将会自动在前面补全，导致 URL 不合法访问出错！\n如果要改 Host，右上角设置 > 显示(编辑)URL Host')
          }
        }

        this.onHandle(vInput.value)

        clearTimeout(handler)

        if (this.isEditResponse) {
          this.onChange(false)
          return
        }

        var header
        try {
          header = this.getHeader(vHeader.value)
        } catch (e) {
          // alert(e.message)
          return
        }

        var req = this.getRequest(vInput.value, {})

        var url = this.getUrl()

        vOutput.value = "requesting... \nURL = " + url

        errHandler = function () {
          vOutput.value = "requesting... \nURL = " + url + "\n\n可能" + ERR_MSG
        }
        setTimeout(errHandler, 5000)
        this.view = 'output';

        var caseScript = (caseScript_ != null ? caseScript_ : ((this.scripts || {}).case || {})[this.getCurrentDocumentId() || 0]) || {}

        var method = this.isShowMethod() ? this.method : null

        this.setBaseUrl()
        this.request(isAdminOperation, method, this.type, url, req, isAdminOperation ? {} : header, callback, caseScript, accountScript_, globalScript_, ignorePreScript)

        var baseUrls = this.getCache('', 'baseUrls', [])
        var bu = this.getBaseUrl(url)
        if (StringUtil.isNotEmpty(bu, true) && baseUrls.indexOf(bu) < 0) {
          baseUrls.push(bu)
          this.saveCache('', 'baseUrls', baseUrls)
          var projectHosts = this.projectHosts || []
          var projectHost = this.projectHost || {}
          var find = false
          for (var j = 0; j < projectHosts.length; j ++) {
              var pjt = projectHosts[j]
              if (pjt == null || StringUtil.isEmpty(pjt.host, true)) {
                 continue
              }

              if (pjt.url == projectHost.host) {
                  find = true
                  break
              }
          }

          if (find != true) {
             projectHosts.push({host: bu, project: projectHost.project})
             this.projectHosts = projectHosts
             this.saveCache('', 'projectHosts', projectHosts)
          }

        }

        this.locals = this.locals || []
        if (this.locals.length >= 1000) { //最多1000条，太多会很卡
          this.locals.splice(900, this.locals.length - 900)
        }
        var path = this.getMethod()
        this.locals.unshift({
          'Document': {
            'userId': this.User.id,
            'project': (this.projectHost || {}).project,
            'name': this.formatDateTime() + ' ' + (this.urlComment || StringUtil.trim(req.tag)),
            'operation': CodeUtil.getOperation(path, req),
            'method': method,
            'type': this.type,
            'url': '/' + path,
            'request': JSON.stringify(req, null, '    '),
            'header': vHeader.value,
            'scripts': this.scripts
          }
        })
        this.saveCache('', 'locals', this.locals)
      },

      adminRequest: function (url, req, header, callback) {
        this.request(true, REQUEST_TYPE_POST, REQUEST_TYPE_JSON, url, req, header, callback)
      },

      //请求
      request: function (isAdminOperation, method, type, url, req, header, callback, caseScript_, accountScript_, globalScript_, ignorePreScript, timeout_, wait_, retry_) {
        this.loadingCount ++

        const isEnvCompare = this.isEnvCompareEnabled

        const scripts = (isAdminOperation || caseScript_ == null ? null : this.scripts) || {}
        const globalScript = (isAdminOperation ? null : (globalScript_ != null ? globalScript_ : (scripts.global || {})[0])) || {}
        const accountScript = (isAdminOperation ? null : (accountScript_ != null ? accountScript_ : (scripts.account || {})[this.getCurrentAccountId() || 0])) || {}
        const caseScript = (isAdminOperation ? null : caseScript_) || {}
        const timeout = timeout_ != null ? timeout_ : this.timeout
        const wait = wait_ != null ? wait_ : (this.wait || 0)
        var retry = retry_ != null ? retry_ : (this.retry || 0)

        var evalPostScript = function () {}

        const onHttpResponse = function (res) {
          App.currentHttpResponse = res
          clearTimeout(errHandler)
          var postEvalResult = evalPostScript(url, res, null)
          if (postEvalResult == BREAK_ALL) {
            return
          }

          App.loadingCount --
          res = res || {}

          if (isDelegate) {
            var hs = res.headers || {}
            var delegateId = hs['Apijson-Delegate-Id'] || hs['apijson-delegate-id']

            if (delegateId != null) {
              if (isEnvCompare) {
                if (delegateId != App.otherEnvDelegateId) {
                  App.otherEnvDelegateId = delegateId
                  App.saveCache(App.server, 'otherEnvDelegateId', delegateId)
                }
              } else {
                if (delegateId != App.delegateId) {
                  App.delegateId = delegateId
                  App.saveCache(App.server, 'delegateId', delegateId)
                }
              }
            }
          }

          //any one of then callback throw error will cause it calls then(null)
          // if ((res.config || {}).method == 'options') {
          //   return
          // }
          if (DEBUG) {
            log('send >> success:\n' + JSON.stringify(res.data, null, '    '))
          }

          //未登录，清空缓存
          if (res.data != null && res.data.code == 407) {
            // alert('request res.data != null && res.data.code == 407 >> isAdminOperation = ' + isAdminOperation)
            if (isAdminOperation) {
              // alert('request App.User = {} App.server = ' + App.server)

              App.clearUser()
            }
            else {
              // alert('request App.accounts[App.currentAccountIndex].isLoggedIn = false ')
              var account = App.accounts[App.currentAccountIndex]
              if (account != null) {
                account.isLoggedIn = false
              }
            }
          }

          if (postEvalResult == BREAK_LAST) {
            return
          }

          if (callback != null) {
            callback(url, res, null)
            return
          }
          App.onResponse(url, res, null)
        }

        const onHttpCatch = function (err) {
          if (retry != null && retry > 0 && retryReq(err)) {
            return;
          }

          var errObj = err instanceof Array == false && err instanceof Object ? err : {}
          var res = {status: errObj.status || (errObj.response || {}).status, request: {url: url, headers: header, data: req}, data: (errObj.response || {}).data}
          App.currentHttpResponse = res

          var postEvalResult = evalPostScript(url, res, err)
          if (postEvalResult == BREAK_ALL) {
            return
          }

          App.loadingCount --

          log('send >> error:\n' + err)
          if (isAdminOperation) {
            App.delegateId = null
          }

          if (postEvalResult == BREAK_LAST) {
            return
          }

          if (callback != null) {
            callback(url, res, err)
            return
          }

          if (typeof App.autoTestCallback == 'function') {
            App.autoTestCallback('Error when testing: ' + err + '.\nurl: ' + url + ' \nrequest: \n' + JSON.stringify(req, null, '    '), err)
          }

          App.onResponse(url, {request: {url: url, headers: header, data: req}}, err)
        }

        var retryReq = function (err) {
          if (retry == null || retry < 0) {
            onHttpCatch(err)
            return false
          }

          retry --
          try {
            setTimeout(function () {
              sendRequest(isAdminOperation, method, type, url, req, header, callback)
            }, wait < 0 ? 0 : wait)
          } catch (e) {
            App.log('request retryReq retry = ' + retry + ' >> try {\n' +
                '            sendRequest(isAdminOperation, method, type, url, req, header, callback)\n' +
                '          } catch (e) = ' + e.message)
            return retryReq(err)
          }

          return true
        }

        var sendRequest = function (isAdminOperation, method, type, url, req, header, callback) {
          var hs = ""
          if (isDelegate && header != null) {
            for (var k in header) {
                var v = k == null ? null : header[k]
                if (k == null || k.toLowerCase() == 'apijson-delegate-id') {
                    continue
                }
                hs += '\n' + k + ': ' + (v instanceof Object ? JSON.stringify(v) : v)
            }
          }

          var isParam = HTTP_URL_ARG_TYPES.indexOf(type) >= 0

          if (req != null && JSONResponse.getType(req) == 'object') { // 支持 URL 里有 Path Variable，例如 http://apijson.cn:8080/{method}/{table}
            var ind = -1 // 支持 ?id={id} 这种动态参数  url.indexOf('?')
            var uri = ind < 0 ? url : url.substring(0, ind)

            var newReq = {}
            for (var k in req) {
                var v = k == null ? null : req[k]
                var kind = uri.indexOf('{' + k + '}')
                if (kind >= 0) {
                  if (v instanceof Array) {
                    var multiInd = uri.indexOf(':=')
                  }

                  uri = uri.replaceAll('${' + k + '}', v).replaceAll('{{' + k + '}}', v).replaceAll('{' + k + '}', v)
                  continue
                }

                newReq[k] = v
            }

            url = uri + (ind < 0 ? '' : url.substring(ind))
            req = newReq
          }

          axios.interceptors.request.use(function (config) {
            config.metadata = { startTime: new Date().getTime()}
            return config;
          }, function (error) {
            return Promise.reject(error);
          });
          axios.interceptors.response.use(function (response) {
            response.config.metadata.endTime = new Date().getTime()
            response.duration = response.config.metadata.endTime - response.config.metadata.startTime
            return response;
          }, function (error) {
            error.config.metadata.endTime = new Date().getTime();
            error.duration = error.config.metadata.endTime - error.config.metadata.startTime;
            return Promise.reject(error);
          });

          // axios.defaults.withcredentials = true
          axios({
            method: method != null ? method : (HTTP_METHODS.indexOf(type) >= 0 ? type.toLowerCase() : (type == REQUEST_TYPE_PARAM ? 'get' : 'post')),
            url: (isDelegate ? (
                  App.server + '/delegate?$_type=' + (type || REQUEST_TYPE_JSON)
                  + (StringUtil.isEmpty(App.delegateId, true) ? '' : '&$_delegate_id=' + App.delegateId)
                  + '&$_delegate_url=' + encodeURIComponent(url)
                  + (StringUtil.isEmpty(hs, true) ? '' : '&$_headers=' + encodeURIComponent(hs.trim()))
                ) : (
                  App.isEncodeEnabled ? encodeURI(url) : url
                )
            ),
            params: isParam ? req : null,
            data: HTTP_JSON_TYPES.indexOf(type) >= 0 ? req : (HTTP_FORM_DATA_TYPES.indexOf(type) >= 0 ? toFormData(req) : null),
            headers: header,  //Accept-Encoding（HTTP Header 大小写不敏感，SpringBoot 接收后自动转小写）可能导致 Response 乱码
            withCredentials: true, //Cookie 必须要  type == REQUEST_TYPE_JSON
            // crossDomain: true
            timeout: timeout
          })
            .then(onHttpResponse)
            .catch(onHttpCatch)
        }

        var evalScript = isAdminOperation || caseScript_ == null ? function () {} : function (isPre, code, res, err) {
          var logger = console.log
          console.log = function(msg) {
            logger(msg)
            vOutput.value = StringUtil.get(msg)
          }

          App.view = 'output'
          vOutput.value = ''

          try {
//             var s = `(function () {
// var App = ` + App + `;
//
// var type = ` + type + `;
// var url = ` + url + `;
// var req = ` + (req == null ? null : JSON.stringify(req)) + `;
// var header = ` + (header == null ? null : JSON.stringify(header)) + `;
//
// ` + (isPre ? '' : `
// // var res = ` + (res == null ? null : JSON.stringify(res)) + `;
// var data = ` + (res == null || res.data == null ? null : JSON.stringify(res.data)) + `;
// var err = ` + (err == null ? null : JSON.stringify(err)) + `;
//
// `) + code + `
//           })()`
//
//             eval(s)

            var isTest = false;
            var isInject = false;
            var data = res == null ? null : res.data
            var result = eval(code)
            console.log = logger
            return result
          }
          catch (e) {
            console.log(e);
            console.log = logger

            App.loadingCount --

            // TODO if (isPre) {
            App.view = 'error'
            App.error = {
              msg: '执行脚本报错：\n' + e.message
            }

            if (callback != null) {
              callback(url, res, e)
            } else {
              // catch 中也 evalScript 导致死循环
              // if (isPre != true) {
              //   throw e
              // }

              // TODO 右侧底部新增断言列表
              App.onResponse(url, null, new Error('执行脚本报错：\n' + e.message)) // this.onResponse is not a function
              // callback = function (url, res, err) {}  // 仅仅为了后续在 then 不执行 onResponse
            }
          }

          return BREAK_ALL
        }

        // const preScript = function () {
        //   if (isAdminOperation) {
        //     return
        //   }

          var preScript = ''

          var globalPreScript = isAdminOperation || ignorePreScript || caseScript_ == null ? null : StringUtil.trim((globalScript.pre || {}).script)
          if (StringUtil.isNotEmpty(globalPreScript, true)) {
            preScript += globalPreScript + '\n\n' // evalScript(true, globalPreScript)
          }

          var accountPreScript = isAdminOperation || ignorePreScript || caseScript_ == null ? null : StringUtil.trim((accountScript.pre || {}).script)
          if (StringUtil.isNotEmpty(accountPreScript, true)) {
            preScript += accountPreScript + '\n\n' // evalScript(true, accountPreScript)
          }

          var casePreScript = isAdminOperation || ignorePreScript || caseScript_ == null ? null : StringUtil.trim((caseScript.pre || {}).script)
          if (StringUtil.isNotEmpty(casePreScript, true)) {
            preScript += casePreScript + '\n\n' // evalScript(true, casePreScript)
          }

          var preEvalResult = null;
          if (StringUtil.isNotEmpty(preScript, true)) {
            preEvalResult = evalScript(true, preScript)
          }

        // }

        evalPostScript = isAdminOperation || caseScript_ == null ? function () {} : function (url, res, err) {
          var postScript = ''

          var casePostScript = StringUtil.trim((caseScript.post || {}).script)
          if (StringUtil.isNotEmpty(casePostScript, true)) {
            postScript += casePostScript + '\n\n' // evalScript(false, casePostScript, res, err)
          }

          var accountPostScript = StringUtil.trim((accountScript.post || {}).script)
          if (StringUtil.isNotEmpty(accountPostScript, true)) {
            postScript += accountPostScript + '\n\n' // evalScript(false, accountPostScript, res, err)
          }

          var globalPostScript = StringUtil.trim((globalScript.post || {}).script)
          if (StringUtil.isNotEmpty(globalPostScript, true)) {
            postScript += globalPostScript + '\n\n' // evalScript(false, globalPostScript, res, err)
          }

          if (StringUtil.isNotEmpty(postScript, true)) {
            if (StringUtil.isNotEmpty(preScript, true)) { // 如果有副作用代码，则通过判断 if (isPre) {..} 在里面执行
              postScript = preScript + '\n\n// request >>>>>>>>>>>>>>>>>>>>>>>>>> response \n\n' + postScript
            }

            return evalScript(false, postScript, res, err)
          }

          return null;
        }

        if (preEvalResult == BREAK_ALL) {
          return
        }

        type = type || REQUEST_TYPE_JSON
        url = StringUtil.noBlank(url)
        if (url.startsWith('/')) {
          url = (isAdminOperation ? this.server : this.getBaseUrl()) + url
        }

        var isDelegate = (isAdminOperation == false && this.isDelegateEnabled)
         || (isAdminOperation && (url.indexOf('://apijson.cn:9090') > 0 || url.indexOf('.devin.ai') > 0))

        if (header != null && header.Cookie != null) {
          if (isDelegate) {
            header['Set-Cookie'] = header.Cookie
            delete header.Cookie
          }
          else if (IS_BROWSER) {
            document.cookie = header.Cookie
          }
        } else if (IS_NODE) {
          var curUser = isAdminOperation ? this.User : this.getCurrentAccount()
          if (curUser != null && curUser[isEnvCompare ? 'phone' : 'cookie'] != null) {
            if (header == null) {
              header = {}
            }

            // Node 环境内通过 headers 设置 Cookie 无效
            header.Cookie = isEnvCompare ? this.otherEnvCookieMap[curUser.phone + '@' + baseUrl] : curUser.cookie
          }
        }

        var delegateId = isEnvCompare ? this.otherEnvDelegateId : this.delegateId
        if (isDelegate && delegateId != null && (header == null || header['Apijson-Delegate-Id'] == null)) {
          if (header == null) {
            header = {};
          }
          header['Apijson-Delegate-Id'] = delegateId
        }


        if (IS_NODE) {
          if (DEBUG) {
            log('req = ' + JSON.stringify(req, null, '  '))
          }
          // 低版本 node 报错 cannot find module 'node:url' ，高版本报错 TypeError: axiosCookieJarSupport is not a function
          //   const axiosCookieJarSupport = require('axios-cookiejar-support').default;
          //   const tough = require('tough-cookie');
          //   axiosCookieJarSupport(axios);
          //   const cookieJar = new tough.CookieJar();
          //   axios.defaults.jar = cookieJar;
          //   axios.defaults.withCredentials = true;

          // const {parse, stringify, toJSON, fromJSON} = require('flatted');
          // JSON.stringify = stringify;
          // JSON.parse = parse;

          // const CircularJSON = require('circular-json');
          // JSON.stringify = CircularJSON.stringify;
          // JSON.parse = CircularJSON.parse;
        }

        if (preEvalResult == BREAK_LAST) {
          return
        }

        retryReq()
      },

      lastReqTime: 0,
      /**请求回调
       */
      onResponse: function (url, res, err) {
        if (res == null) {
          res = {}
        } else {
          var time = res.config == null || res.config.metadata == null ? null : res.config.metadata.startTime;
          if (time != null && time > 0 && time < this.lastReqTime) {
            return
          }

          this.lastReqTime = time == null || time <= 0 ? 0 : time;
        }

        if (DEBUG) {
          log('onResponse url = ' + url + '\nerr = ' + err + '\nreq = \n'
            + (res.request == null || res.request.data == null ? 'null' : JSON.stringify(res.request.data))
            + '\n\nres = \n' + (res.data == null ? 'null' : JSON.stringify(res.data))
          )
        }

        if (err != null) {
          if (IS_BROWSER) {
            var errObj = err instanceof Array == false && err instanceof Object ? err : {}
            var data = (errObj.response || {}).data
            var msg = typeof data == 'string' ? StringUtil.trim(data) : JSON.stringify(data, null, '    ')
            msg = "Response:\nurl = " + url + "\nerror = " + err.message + (StringUtil.isEmpty(msg) ? '' : '\n\n' + msg) + '\n\n' + ERR_MSG
            // vOutput.value = "Response:\nurl = " + url + "\nerror = " + err.message;
            this.view = 'error';
            this.error = {
              msg: msg
            }
            this.output = msg
          }
        }
        else {
          if (IS_BROWSER) {
            var data = res.data || {}
            var isStr = typeof data == 'string'
            if (isSingle && (isStr != true) && data instanceof Object && (data instanceof Array == false) && JSONResponse.isSuccess(data)) { //不格式化错误的结果
              data = JSONResponse.formatObject(data);
            }
            this.jsoncon = isStr ? data : JSON.stringify(data, null, '    ')
            this.view = 'code' // isStr ? 'output' : 'code'

            vOutput.value = isStr ? data : ''
          }

          // 会导致断言用了这个
          // if (this.currentRemoteItem == null) {
          //   this.currentRemoteItem = {}
          // }
          // if (this.currentRemoteItem.TestRecord == null) {
          //   this.currentRemoteItem.TestRecord = {}
          // }
          // this.currentRemoteItem.TestRecord.response = data
        }
      },


      /**处理复制事件
       * @param event
       */
      doOnCopy: function(event) {
        var target = event.target;
        var selectionStart = target.selectionStart;
        var selectionEnd = target.selectionEnd;

        if (target == vUrl) {
          try {
            var contentType = CONTENT_TYPE_MAP[this.type];
            var json = this.getRequest(vInput.value)
            var header = this.getHeader(vHeader.value);
            var headerStr = '';
            if (header != null) {
              for (var k in header) {
                var v = header[k];
                headerStr += '\n' + k + ': ' + StringUtil.get(v);
              }
            }

            console.log('复制时自动转换:\n'
            + `Request URL: ` + vUrl.value + `
Request Method: ` + (this.type == REQUEST_TYPE_PARAM ? 'GET' : 'POST') + (StringUtil.isEmpty(contentType, true) ? '' : `
Content-Type: ` + contentType) + (StringUtil.isEmpty(headerStr, true) ? '' : headerStr)
              + '\n\n' + JSON.stringify(json));
          } catch (e) {
            log(e)
          }
        }
        else if (target == vHeader || target == vRandom) {  // key: value 转 { "key": value }
          if (selectionStart < 0 || selectionStart <= selectionEnd) {
            try {
              var selection = selectionStart < 0 ? target.value : StringUtil.get(target.value).substring(selectionStart, selectionEnd);
              var lines = StringUtil.split(selection, '\n');
              var json = {};

              for (var i = 0; i < lines.length; i ++) {
                var l = StringUtil.trim(lines[i]) || '';
                if (l.startsWith('//')) {
                  continue;
                }

                var ind = l.lastIndexOf(' //');
                l = ind < 0 ? l : StringUtil.trim(l.substring(0, ind));

                ind = l.indexOf(':');
                if (ind >= 0) {
                  var left = target == vHeader ? StringUtil.trim(l.substring(0, ind)) : l.substring(0, ind);
                  json[left] = StringUtil.trim(l.substring(ind + 1));
                }
              }

              if (Object.keys(json).length > 0) {
                var txt = JSON.stringify(json)
                console.log('复制时自动转换:\n' +  txt)
                navigator.clipboard.writeText(selection + '\n\n' + txt);
                alert('复制内容最后拼接了，控制台 Console 也打印了：\n' + txt);
              }
            } catch (e) {
              log(e)
            }
          }
        }

      },

      /**处理粘贴事件
       * @param event
       */
      doOnPaste: function(event) {
        var paste = (event.clipboardData || window.clipboardData || navigator.clipboard).getData('text');
        var target = event.target;
        var selectionStart = target.selectionStart;
        var selectionEnd = target.selectionEnd;

        if (StringUtil.isNotEmpty(paste, true) && (StringUtil.isEmpty(target.value, true)
          || selectionStart <= 0 && selectionEnd >= StringUtil.get(target.value).length)) {
          if (target == vUrl) {  // TODO 把 Chrome 或 Charles 等抓到的 Response Header 和 Content 自动粘贴到 vUrl, vHeader
            try {
              if (paste.trim().indexOf('\n') > 0) {  // 解决正常的 URL 都粘贴不了
                var contentStart = 0;
                var lines = StringUtil.split(paste, '\n');
                var header = '';

                for (var i = 0; i < lines.length; i++) {
                  var l = StringUtil.trim(lines[i]);
                  var ind = l.indexOf(':');
                  var left = ind < 0 ? '' : StringUtil.trim(l.substring(0, ind));

                  if (/^[a-zA-Z0-9\- ]+$/g.test(left)) {
                    var lowerKey = left.toLowerCase();
                    var value = l.substring(ind + 1).trim();

                    if (lowerKey == 'host') {
                      this.setBaseUrl(value.endsWith(':443') ? 'https://' + value.substring(0, value.length - ':443'.length) : 'http://' + value);
                      event.preventDefault();
                    }
                    else if (lowerKey == 'request method') {
                      value = value.toUpperCase();
                      this.method = value
                      this.type = value == 'GET' ? 'PARAM' : (value == 'POST' ? 'JSON' : value);
                      event.preventDefault();
                    }
                    else if (lowerKey == 'content-type') {
                      var type = vType.value != 'JSON' ? null : CONTENT_VALUE_TYPE_MAP[value];
                      if (StringUtil.isEmpty(type, true) != true) {
                        this.type = type;
                        event.preventDefault();
                      }
                    }
                    else if (lowerKey == 'request url') {
                      vUrl.value = value;
                      event.preventDefault();
                    }
                    else if (StringUtil.isEmpty(lowerKey, true) || lowerKey.startsWith('accept-')
                      || lowerKey.startsWith('access-control-') || IGNORE_HEADERS.indexOf(lowerKey) >= 0) {
                      // 忽略
                    }
                    else {
                      header += '\n' + left + ': ' + StringUtil.trim(l.substring(ind + 1));
                    }

                    contentStart += lines[i].length + 1;
                  }
                  else {
                    if (ind <= 0 || StringUtil.isEmpty(l) || l.startsWith('HTTP/') || l.startsWith('HTTPS/')) {  // HTTP/1.1 200
                      contentStart += lines[i].length + 1;
                      continue;
                    }

                    var ind = l.indexOf(' ');
                    var m = ind < 0 ? '' : StringUtil.trim(l.substring(0, ind));
                    if (APIJSON_METHODS.indexOf(m.toLowerCase()) >= 0) {  // POST /gets HTTP/1.1
                      contentStart += lines[i].length + 1;
                      var t = m.toUpperCase()
                      this.method = t
                      this.type = t == 'GET' ? 'PARAM' : (t == 'POST' ? 'JSON' : t);

                      l = l.substring(ind).trim();
                      ind = l.indexOf(' ');
                      var url = ind < 0 ? l : l.substring(0, ind);
                      if (url.length > 0 && url != '/') {
                        vUrl.value = this.getBaseUrl() + (url.startsWith('/') ? url : '/' + url);
                      }

                      event.preventDefault();
                      continue;
                    }

                    var content = StringUtil.trim(paste.substring(contentStart));
                    var json = null;
                    try {
                      json = JSON5.parse(content);  // { "a":1, "b": "c" }
                    }
                    catch (e) {
                      log(e)
                      try {
                        json = getRequestFromURL('?' + content, true);  // a=1&b=c
                      } catch (e2) {
                        log(e2)
                      }
                    }

                    vInput.value = json == null ? '' : JSON.stringify(json, null, '    ');
                    event.preventDefault();
                    break;
                  }

                }

                if (StringUtil.isEmpty(header, true) != true) {
                  vHeader.value = StringUtil.trim(header);
                  event.preventDefault();
                }
              }
            }
            catch (e) {
              log(e)
            }
          }
          else if (target == vHeader || target == vRandom) {  // { "key": value } 转 key: value
            try {
              var json = JSON5.parse(paste);
              var newStr = '';
              for (var k in json) {
                var v = json[k];
                if (v instanceof Object || v instanceof Array) {
                  v = JSON.stringify(v);
                }
                newStr += '\n' + k + ': ' + (target != vHeader && typeof v == 'string' ? "'" + v.replaceAll("'", "\\'") + "'" : StringUtil.get(v));
              }
              target.value = StringUtil.trim(newStr);
              event.preventDefault();
            }
            catch (e) {
              log(e)
            }
          }
          else if (target == vInput) {  // key: value 转 { "key": value }
            try {
              try {
                JSON5.parse(paste);  // 正常的 JSON 就不用转了
              }
              catch (e) {
                var lines = StringUtil.split(paste, '\n');
                var json = {};

                for (var i = 0; i < lines.length; i++) {
                  var l = StringUtil.trim(lines[i]) || '';
                  if (l.startsWith('//')) {
                    continue;
                  }

                  var ind = l.lastIndexOf(' //');
                  l = ind < 0 ? l : StringUtil.trim(l.substring(0, ind));

                  ind = l.indexOf(':');
                  if (ind >= 0) {
                    var left = target == vHeader ? StringUtil.trim(l.substring(0, ind)) : l.substring(0, ind);
                    if (left.indexOf('=') >= 0 || left.indexOf('&') >= 0) {
                      try {
                        json = getRequestFromURL('?' + paste, true);
                        if (Object.keys(json).length > 0) {
                          break;
                        }
                      } catch (e2) {
                        log(e)
                      }
                    }

                    json[left] = StringUtil.trim(l.substring(ind + 1));
                  }
                }

                if (Object.keys(json).length <= 0) {
                  json = getRequestFromURL('?' + paste, true);
                }

                if (Object.keys(json).length > 0) {
                  vInput.value = JSON.stringify(json, null, '    ');
                  event.preventDefault();
                }
              }
            }
            catch (e) {
              log(e)
            }
          }
        }

      },

      /**处理按键事件
       * @param event
       */
      doOnKeyUp: function (event, type, isFilter, item) {
        var keyCode = event.keyCode ? event.keyCode : (event.which ? event.which : event.charCode);
        var isEnter = keyCode == 13

        if (type == 'ask') {
          if (isEnter) {
            event.preventDefault();

            if (event.shiftKey) {
              vAskAI.value = StringUtil.trim(vAskAI.value) + '\n'
              return
            }

            var query = vAskAI.value = StringUtil.trim(vAskAI.value)

            var isRes = false;

            if (StringUtil.isEmpty(query)) {
              var view = this.view;
              var isCode = view == 'code'

// 太长             var output = view == 'error' || view == 'output' ? this.output : null;
              var output = view == 'error' ? this.output : null;
              var d = view == 'markdown' || view == 'html' ? doc : null;

              var res = isCode ? JSON.parse(this.jsoncon) : null;
//              res = this.removeDebugInfo(res);
              if (JSONResponse.isObject(res)) {
                  delete res['trace:stack']
                  delete res['debug:info|help']
              }
              var resStr = res == null ? null : JSON.stringify(res)

              var headers = isCode ? (this.currentHttpResponse || {}).headers : null
              var headerStr = ''
              if (headers != null) {
                  for (var k in headers) {
                    var v = headers[k];
                    headerStr += '\n' + k + ': ' + StringUtil.get(v);
                  }
              }

              var curItem = (this.isTestCaseShow != true ? this.currentRandomItem : this.remotes[this.currentDocIndex]) || {}
              var curDoc = curItem.Document || {}
              var curRecord = curItem.TestRecord || {}
              var curRandom = curItem.Random || {}

//              var isRandom = this.isTestCaseShow != true && this.isRandomShow == true
//              var tests = this.tests[String(this.currentAccountIndex)] || {}
//              var currentResponse = (tests[isRandom ? random.documentId : document.id] || {})[
//                  isRandom ? (random.id > 0 ? random.id : (random.toId + '' + random.id)) : 0
//              ]
//
//              resStr = currentResponse != null ? JSON.stringify(currentResponse) : curRecord.response;

              if (this.isTestCaseShow != true) {
                  vAskAI.value = "### Request:\n" + this.method + " " + this.type + " " + this.getUrl()
                              + (StringUtil.isEmpty(vHeader.value) ? '' : "\n" + StringUtil.trim(vHeader.value))
                              + (StringUtil.isEmpty(vInput.value) ? '' : "\n\n```js\n" + StringUtil.trim(vInput.value) + '\n```')
                              + (isCode ? "\n\n### Response: " : '')
                              + (StringUtil.isEmpty(headerStr) ? '' : '\n' + StringUtil.trim(headerStr))
                              + (StringUtil.isEmpty(resStr) ? '' : "\n\n```js\n" + resStr + '\n```')
                              + (StringUtil.isEmpty(vAskAI.value) ? '' : '\n\n' + StringUtil.trim(vAskAI.value)) + '\n'
                              + (StringUtil.isEmpty(output) ? '' : '\n\n### 提示信息: \n' + StringUtil.trim(output))
                              // 太长 + (StringUtil.isEmpty(d) ? '' : '\n\n### 文档: \n' + d)
                              + '\n'
              } else {
                  vAskAI.value = "### Request:\n" + curDoc.method + " " + curDoc.type + " " + (this.getBaseUrl() + curDoc.url)
                              + (StringUtil.isEmpty(curDoc.header) ? '' : "\n" + StringUtil.trim(curDoc.header))
                              + (StringUtil.isEmpty(curDoc.request) ? '' : "\n\n```js\n" + StringUtil.trim(curDoc.request) + '\n```')
                              + (isCode ? "\n\n### Response: " : '')
                              + (StringUtil.isEmpty(curRecord.header) ? '' : '\n' + StringUtil.trim(curRecord.header))
                              + (StringUtil.isEmpty(resStr) ? '' : "\n\n```js\n" + resStr + '\n```')
                              + (StringUtil.isEmpty(vAskAI.value) ? '' : '\n\n' + StringUtil.trim(vAskAI.value)) + '\n'
                              + (StringUtil.isEmpty(output) ? '' : '\n\n### 提示信息: \n' + StringUtil.trim(output))
                              // 太长 + (StringUtil.isEmpty(d) ? '' : '\n\n### 文档: \n' + d)
                              + '\n'
              }

              isRes = true;
            }

            const user_query = StringUtil.trim(vAskAI.value);
            if (StringUtil.isEmpty(user_query)) {
              alert('请输入问题！')
              return;
            }

            function onMessage(item) {
              var data2 = item == null ? null : item.data
              if (data2 == null || item.type != 'chunk') {
                return;
              }

              var answer = StringUtil.get(typeof data2 == 'string' ? data2 : (data instanceof Array ? data2.join() : JSON.stringify(data2)))
                .replaceAll('/wiki/Tencent/APIJSON#', 'https://deepwiki.com/Tencent/APIJSON/').replaceAll('/wiki/TommyLemon/APIAuto#', 'https://deepwiki.com/TommyLemon/APIAuto/');
              App.view = 'markdown';
              vOutput.value += answer;
              markdownToHTML(vOutput.value)
            }

            function queryResult() {
                App.request(true, REQUEST_TYPE_GET, REQUEST_TYPE_PARAM, 'https://api.devin.ai/ada/query/' + App.uuid, {}, {}, function (url, res, err) {
//                    App.onResponse(url, res, err)
                    var data = res.data || {}
//                    var isOk = JSONResponse.isSuccess(data)

                    var msg = ''; // isOk ? '' : ('\nmsg: ' + StringUtil.get(data.msg))
                    if (err != null) {
                        msg += '\nerr: ' + err.message
                        vOutput.value = err.message
                        App.view = 'error';
                        return
                    }

                    var queries = data.queries || []
                    var last = queries[queries.length - 1] || {}
                    var query = last.user_query || user_query
                    var response = last.response || []
                    var answer = '#### ' + query + '\n<br/>';
                    for (var i = 0; i < response.length; i ++) {
                      //                      onMessage(response[i])
                      var item = response[i];
                      var data2 = item == null ? null : item.data;
                      if (data2 == null || item.type != 'chunk') {
                          continue;
                      }

                      answer += '\n' + StringUtil.trim(typeof data2 == 'string' ? data2 : (data2 instanceof Array ? data2.join() : JSON.stringify(data2)))
                        .replaceAll('/wiki/Tencent/APIJSON#', 'https://deepwiki.com/Tencent/APIJSON/').replaceAll('/wiki/TommyLemon/APIAuto#', 'https://deepwiki.com/TommyLemon/APIAuto/');
                    }

                    answer += '\n<br/>\n';

                    App.view = 'markdown';
                    vOutput.value = answer;
                    markdownToHTML(answer); // vOutput.value)
                })

//                App.uuid = null; // 解决第一次后的都不生效
                vAskAI.value = '';
            }

            function askAI() {
              vOutput.value = '#### ' + user_query + '\n<br/>';
              App.loadingCount ++;
              const ws = new WebSocket('wss://api.devin.ai/ada/ws/query/' + App.uuid);

              // 连接成功
              ws.onopen = () => {
                console.log('WebSocket connected');
                // 这里通常不需要主动发送内容，除非协议需要
              };

              // 收到消息
              ws.onmessage = (event) => {
                try {
                  const data = JSON.parse(event.data);
                  console.log('Message:', data);
                  onMessage(data)

                  if (data.type === 'chunk') {
                    console.log('Chunk Data:', data.data);
                  }
                } catch (err) {
                  console.error('Failed to parse message:', event.data);
                }
              };

              // 连接关闭
              ws.onclose = () => {
                console.log('WebSocket closed');
                App.loadingCount --;
                queryResult();
              };

              // 错误处理
              ws.onerror = (err) => {
                console.error('WebSocket error:', err);
                queryResult();
              };

            }

            // 可能少调用了 https://api2.amplitude.com/2/httpapi 导致不能同一个会话二次请求
//            if (StringUtil.isEmpty(this.uuid, true)) {
               try {
                 this.uuid = crypto.randomUUID();
               } catch (e) {
                 console.error('Failed to generate UUID:', e);
                 this.uuid = '';
               }

              if (StringUtil.isEmpty(this.uuid, true)) {
                this.uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                  var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                  return v.toString(16);
                });
              }
//            }

            this.request(true, REQUEST_TYPE_POST, REQUEST_TYPE_JSON, 'https://api.devin.ai/ada/query', {
              "engine_id": vDeepSearch.checked ? "agent" : "multihop",
              "user_query": "<relevant_context>" + (isRes ? "这是用 HTTP 接口工具 TommyLemon/APIAuto 发请求后的响应结果，分析并" : "") + "用中文回答：</relevant_context><br/>\n" + user_query,
              "keywords": [],
              "repo_names": JSONObject.isAPIJSONPath(this.getMethod()) ? [
                "Tencent/APIJSON", "TommyLemon/APIAuto"
              ] : ["TommyLemon/APIAuto"],
              "additional_context": "",
              "query_id": this.uuid,
              "use_notes": false,
              "generate_summary": false
            }, {}, function (url, res, err) {
              App.onResponse(url, res, err)
              var data = res.data || {}
//              var isOk = JSONResponse.isSuccess(data)

              var msg = ''; // isOk ? '' : ('\nmsg: ' + StringUtil.get(data.msg))
              if (err != null) {
                msg += '\nerr: ' + err.message
                vOutput.value = err.message
                App.view = 'error';
                return
              }

              askAI();
            })
          }
          return
        }

        if (type == 'option') {
          if (isEnter) {
            this.selectInput(item);
          }
          return
        }

        if (type == 'project') {
          if (isEnter || item.host == (this.projectHost || {}).host) {
            this.projectHost = {project: item.project}
            this.saveCache('', 'projectHost', this.projectHost)
          }
          return
        }

        var project = (this.projectHost || {}).project

        if (isFilter && (type == 'caseGroup' || type == 'chainGroup')) {
          this.isCaseGroupEditable = true
//          this.isChainGroupEditable = true
        }

        var obj = event.srcElement ? event.srcElement : event.target;
        if ($(obj).attr('id') == 'vUrl') {
          vUrlComment.value = ''
          this.currentDocItem = null
          this.currentRemoteItem = null
        }

        if (isEnter) { // enter
          if (isFilter) {
            this.onFilterChange(type)
            return
          }

          if (type == null) {
// 无效，这时已经换行了           if (event.target == vUrl) {
//               event.preventDefault();
//            }
            this.send(false);
            return
          }

          if (type == 'chainGroupAdd' || type == 'chainGroup') {
            var isAdd = type == 'chainGroupAdd'
            var groupName = item == null ? null : item.groupName
            if (StringUtil.isEmpty(groupName)) {
               alert('请输入名称!')
               return
            }

            var groupId = item == null ? null : item.groupId
            if (groupId == null || groupId <= 0) {
              if (! isAdd) {
                alert('请选择有效的列表项!')
                return
              }

              groupId = new Date().getTime()
            }

            //修改 Document
            this.request(true, REQUEST_TYPE_POST, REQUEST_TYPE_JSON, this.server + (isAdd ? '/post' : '/put'), {
              Chain: {
                'groupName': groupName,
                'groupId': isAdd ? groupId : null,
                'groupId{}': isAdd ? null : [groupId]
              },
              tag: 'Chain-group'
            }, {}, function (url, res, err) {
              App.onResponse(url, res, err)
              var isOk = JSONResponse.isSuccess(res.data)

              var msg = isOk ? '' : ('\nmsg: ' + StringUtil.get((res.data || {}).msg))
              if (err != null) {
                msg += '\nerr: ' + err.msg
              }
              alert((isAdd ? '新增' : '修改') + (isOk ? '成功' : '失败') + (isAdd ? '! \n' :'！\ngroupId: ' + groupId) + '\ngroupName: ' + groupName + msg)

              App.isCaseGroupEditable = ! isOk
            })

            return
          }

          if (type == 'chainAdd') {
            var groupName = item == null ? null : item.groupName
            if (StringUtil.isEmpty(groupName)) {
               alert('请输入名称!')
               return
            }

            var search = StringUtil.isEmpty(groupName, true) ? null : '%' + StringUtil.trim(groupName).replaceAll('_', '\\_').replaceAll('%', '\\%') + '%'
            var methods = this.methods
            var types = this.types

            //修改 Document
            this.request(true, REQUEST_TYPE_POST, REQUEST_TYPE_JSON, this.server + '/get', {
                format: false,
                'Document[]': {
                  'count': 100, //200 条测试直接卡死 0,
                  'page': 0,
                  'Document': {
                    '@column': 'id,userId,version,date,name,operation,method,type,url,request,apijson',
                    '@order': 'version-,date-',
                    'userId': this.User.id,
                    'project': StringUtil.isEmpty(project, true) ? null : project,
                    'name$': search,
                    'operation$': search,
                    'url$': search,
                    // 'group{}': group == null || StringUtil.isNotEmpty(groupUrl) ? null : 'length(group)<=0',
                    // 'group{}': group == null ? null : (group.groupName == null ? "=null" : [group.groupName]),
                    '@combine': search == null ? null : 'name$,operation$,url$',
                    'method{}': methods == null || methods.length <= 0 ? null : methods,
                    'type{}': types == null || types.length <= 0 ? null : types,
                    '@null': 'sqlauto', //'sqlauto{}': '=null'
                    // '@having': StringUtil.isEmpty(groupUrl) ? null : "substring_index(substr,'/',1)<0"
                  }
                }
            }, {}, function (url, res, err) {
              App.onResponse(url, res, err)
              var isOk = JSONResponse.isSuccess(res.data)

              var msg = isOk ? '' : ('\nmsg: ' + StringUtil.get((res.data || {}).msg))
              if (err != null) {
                msg += '\nerr: ' + err.msg
              }
              if (! isOk) {
                alert(isOk ? '选择右侧接口来添加' : '查询失败！\ngroupName: ' + groupName + msg)
                return
              }

              var list = res.data['Document[]'] || []
              var options = []
              for (var i = 0; i < list.length; i ++) {
                  var item = list[i] || {}
                  options.push({
                        name: '[' + item.method + '][' + item.type + ']', // + item.name + ' ' + item.url,
                        type: item.name,
                        comment: item.url,
                        value: item
                     }
                  )
              }

              App.options = options
              document.activeElement = vOption // vChainAdd.focusout()
              currentTarget = vChainAdd
              vOption.focus()
              //              App.showOptions(target, text, before, after);

            })

            return
          }

          if (type == 'caseGroup') {
            var groupUrl = item == null ? null : item.groupUrl
            var rawName = item == null ? null : item.rawName
            // if (StringUtil.isEmpty(url)) {
            //   alert('请选择有效的选项！item.url == null !')
            //   return
            // }

            //修改 Document
            this.request(true, REQUEST_TYPE_POST, REQUEST_TYPE_JSON, this.server + '/put', {
              Document: {
                'project': StringUtil.isEmpty(project, true) ? null : project,
                'group': item.groupName,
                '@raw': '@key',
                '@key':"url:substr(url,1,length(url)-length(substring_index(url,'/',-1))-1)",
                'url{}': [groupUrl],
                'group{}': rawName == null ? "=null" : [rawName]
              },
              tag: 'Document-group'
            }, {}, function (url, res, err) {
              App.onResponse(url, res, err)
              var isOk = JSONResponse.isSuccess(res.data)

              var msg = isOk ? '' : ('\nmsg: ' + StringUtil.get((res.data || {}).msg))
              if (err != null) {
                msg += '\nerr: ' + err.msg
              }
              alert('修改' + (isOk ? '成功' : '失败') + '！\ngroupUrl: ' + item.groupUrl + '\ngroupName: ' + item.groupName + '\nrawName: ' + item.rawName + msg)

              App.isCaseGroupEditable = ! isOk
            })

            return
          }

          if (type == 'random' || type == 'randomSub') {
            var r = item == null ? null : item.Random
            if (r == null || r.id == null) {
              alert('请选择有效的选项！item.Random.id == null !')
              return
            }

            //修改 Random 的 count
            this.request(true, REQUEST_TYPE_POST, REQUEST_TYPE_JSON, this.server + '/put', {
              Random: {
                id: r.id,
                count: r.count,
                name: r.name,
                img: r.img,
                file: r.file,
                size: r.size,
                width: r.width,
                height: r.height
              },
              tag: 'Random'
            }, {}, function (url, res, err) {
              App.onResponse(url, res, err)
              var isOk = JSONResponse.isSuccess(res.data)

              var msg = isOk ? '' : ('\nmsg: ' + StringUtil.get((res.data || {}).msg))
              if (err != null) {
                msg += '\nerr: ' + err.msg
              }
              alert('修改' + (isOk ? '成功' : '失败') + '！\nurl: ' + item.url + '\nname: ' + r.name + msg)

              App.isRandomEditable = ! isOk
            })

            return
          }

          if (type == 'randomKeyPath') {
            var d = (this.currentRemoteItem || {}).Document
            if (d == null || d.id == null) {
              alert('请选择有效的用例！item.Document.id == null !')
              return
            }

            var path = (item || {}).path || vRandomKeyPath.value || 'image'
            if (StringUtil.isEmpty(path, true)) {
              alert('请输入有效的图片 JSON key 路径！以 / 分隔，key 中 / 等特殊字符需要 encodeURLComponent 转义')
              return
            }

            //修改 Document 的 path
            this.request(true, REQUEST_TYPE_POST, REQUEST_TYPE_JSON, this.server + '/put', {
              Document: {
                id: d.id,
                path: path,
              },
              tag: 'Document'
            }, {}, function (url, res, err) {
              App.onResponse(url, res, err)
              var isOk = JSONResponse.isSuccess(res.data)

              var msg = isOk ? '' : ('\nmsg: ' + StringUtil.get((res.data || {}).msg))
              if (err != null) {
                msg += '\nerr: ' + err.msg
              }
              alert('修改' + (isOk ? '成功' : '失败') + '！\npath: ' + path)

              App.isRandomEditable = ! isOk
            })

            return
          }

        }
        else {
          if (isFilter) {
            return
          }
          if (type == 'random' || type == 'randomSub') {
            this.isRandomEditable = true
            return
          }
          if (type == 'document' || type == 'testCase') {
            return
          }

          this.urlComment = '';
          this.requestVersion = '';
          this.onChange(true);
        }
      },

      pageDown: function(type) {
        type = type || ''
        var page
        switch (type) {
          case 'caseGroup':
            page = this.caseGroupPage
            break
          case 'testCase':
            page = this.testCasePage
            break
          case 'random':
            page = this.randomPage
            break
          case 'randomSub':
            page = this.randomSubPage
            break
          default:
            page = this.page
            break
        }

        if (page == null) {
          page = 0
        }

        if (page > 0) {
          page --
          switch (type) {
            case 'caseGroup':
              this.caseGroupPage = page
              break
            case 'testCase':
              this.testCasePage = page
              break
            case 'random':
              this.randomPage = page
              break
            case 'randomSub':
              this.randomSubPage = page
              break
            default:
              this.page = page
              break
          }

          this.onFilterChange(type)
        }
      },
      pageUp: function(type) {
        type = type || ''
        switch (type) {
          case 'caseGroup':
            this.caseGroupPage ++
            break
          case 'testCase':
            this.testCasePage ++
            break
          case 'random':
            this.randomPage ++
            break
          case 'randomSub':
            this.randomSubPage ++
            break
          default:
            this.page ++
            break
        }
        this.onFilterChange(type)
      },
      onFilterChange: function(type) {
        type = type || ''
        if (type == 'testCase' || type == 'caseGroup' || type == 'chainGroup') {
          var isChainShow = this.isChainShow
          var paths = isChainShow ? this.chainPaths : this.casePaths
          var index = paths.length - 1
          var group = paths[index]
          var groupId = group == null ? 0 : (group.groupId || 0)
          var groupUrl = group == null ? '' : (group.groupUrl || '')
          var groupKey = isChainShow ? groupId + '' : groupUrl

          if (type == 'chainGroup') {
            this.chainGroupPages[groupKey] = this.chainGroupPage
            this.chainGroupCounts[groupKey] = this.chainGroupCount
            this.chainGroupSearches[groupKey] = this.chainGroupSearch
            if (index < 0) {
              this.saveCache(this.server, 'chainGroupPage', this.chainGroupPage)
              this.saveCache(this.server, 'chainGroupCount', this.chainGroupCount)
              // this.saveCache(this.server, 'chainGroupSearch', this.chainGroupSearch)
            }
            this.saveCache(this.server, 'chainGroupPages', this.chainGroupPages)
            this.saveCache(this.server, 'chainGroupCounts', this.chainGroupCounts)
            // this.saveCache(this.server, 'chainGroupSearches', this.chainGroupSearches)

            this.selectChainGroup(this.currentChainGroupIndex, null)
          }
          else if (type == 'caseGroup') {
            this.caseGroupPages[groupKey] = this.caseGroupPage
            this.caseGroupCounts[groupKey] = this.caseGroupCount
            this.caseGroupSearches[groupKey] = this.caseGroupSearch
            if (index < 0) {
              this.saveCache(this.server, 'caseGroupPage', this.caseGroupPage)
              this.saveCache(this.server, 'caseGroupCount', this.caseGroupCount)
              // this.saveCache(this.server, 'caseGroupSearch', this.caseGroupSearch)
            }
            this.saveCache(this.server, 'caseGroupPages', this.caseGroupPages)
            this.saveCache(this.server, 'caseGroupCounts', this.caseGroupCounts)
            // this.saveCache(this.server, 'caseGroupSearches', this.caseGroupSearches)

            this.selectCaseGroup()
          }
          else {
            this.testCasePages[groupKey] = this.testCasePage
            this.testCaseCounts[groupKey] = this.testCaseCount
            this.testCaseSearches[groupKey] = this.testCaseSearch

            if (index < 0) {
              this.saveCache(this.server, 'testCasePage', this.testCasePage)
              this.saveCache(this.server, 'testCaseCount', this.testCaseCount)
            }
            this.saveCache(this.server, 'testCasePages', this.testCasePages)
            this.saveCache(this.server, 'testCaseCounts', this.testCaseCounts)
            // this.saveCache(this.server, 'testCaseSearches', this.testCaseSearches)

            this.resetTestCount(this.currentAccountIndex)

            this.isStatisticsEnabled = false
            this.remotes = null
            this.showTestCase(true, false)
          }
        }
        else if (type == 'random') {
          this.saveCache(this.server, 'randomPage', this.randomPage)
          this.saveCache(this.server, 'randomCount', this.randomCount)

          this.resetTestCount(this.currentAccountIndex, true)

          var cri = this.currentRemoteItem || {}
          cri.randoms = null
          this.randoms = null
          this.showRandomList(true, cri.Document, false)
        }
        else if (type == 'randomSub') {
          this.saveCache(this.server, 'randomSubPage', this.randomSubPage)
          this.saveCache(this.server, 'randomSubCount', this.randomSubCount)

          this.resetTestCount(this.currentAccountIndex, true, true)

          var cri = this.currentRandomItem || {}
          this.randomSubs = null
          this.showRandomList(true, cri.Random, true)
        }
        else {
            docObj = null
            doc = null
            this.saveCache(this.server, 'page', this.page)
            this.saveCache(this.server, 'count', this.count)
            // this.saveCache(this.server, 'docObj', null)
            // this.saveCache(this.server, 'doc', null)

            this.onChange(false)

            //虽然性能更好，但长时间没反应，用户会觉得未生效
            // this.getDoc(function (d) {
            //   // vOutput.value = 'resolving...';
            //   App.setDoc(d)
            //   App.onChange(false)
            // });
        }
      },

      /**转为请求代码
       * @param rq
       */
      getCode: function (rq) {
        var s = '\n\n\n### 请求代码(自动生成) \n';
        switch (this.language) {
          case CodeUtil.LANGUAGE_KOTLIN:
            s += '\n#### <= Android-Kotlin: 空对象用 HashMap&lt;String, Any&gt;()，空数组用 ArrayList&lt;Any&gt;()\n'
              + '```kotlin \n'
              + CodeUtil.parseKotlinRequest(null, parseJSON(rq), 0, isSingle, false, false, this.type, this.getBaseUrl(), '/' + this.getMethod(), this.urlComment)
              + '\n ``` \n注：对象 {} 用 mapOf("key": value)，数组 [] 用 listOf(value0, value1)\n';
            break;
          case CodeUtil.LANGUAGE_JAVA:
            s += '\n#### <= Android-Java: 同名变量需要重命名'
              + ' \n ```java \n'
              + StringUtil.trim(CodeUtil.parseJavaRequest(null, parseJSON(rq), 0, isSingle, false, false, this.type, '/' + this.getMethod(), this.urlComment))
              + '\n ``` \n注：' + (isSingle ? '用了 APIJSON 的 JSONRequest, JSONResponse 类，也可使用其它类封装，只要 JSON 有序就行\n' : 'LinkedHashMap&lt;&gt;() 可替换为 fastjson 的 JSONObject(true) 等有序JSON构造方法\n');

            var serverCode = CodeUtil.parseJavaServer(this.type, '/' + this.getMethod(), this.database, this.schema, parseJSON(rq), isSingle);
            if (StringUtil.isEmpty(serverCode, true) != true) {
              s += '\n#### <= Server-Java: RESTful 等非 APIJSON 规范的 API'
                + ' \n ```java \n'
                + serverCode
                + '\n ``` \n注：' + (isSingle ? '分页和排序用了 Mybatis-PageHelper，如不需要可在生成代码基础上修改\n' : '使用 SSM(Spring + SpringMVC + Mybatis) 框架 \n');
            }
            break;
          case CodeUtil.LANGUAGE_C_SHARP:
            s += '\n#### <= Unity3D-C\\#: 键值对用 {"key", value}' +
              '\n ```csharp \n'
              + CodeUtil.parseCSharpRequest(null, parseJSON(rq), 0)
              + '\n ``` \n注：对象 {} 用 new JObject{{"key", value}}，数组 [] 用 new JArray{value0, value1}\n';
            break;

          case CodeUtil.LANGUAGE_SWIFT:
            s += '\n#### <= iOS-Swift: 空对象用 [ : ]'
              + '\n ```swift \n'
              + CodeUtil.parseSwiftRequest(null, parseJSON(rq), 0)
              + '\n ``` \n注：对象 {} 用 ["key": value]，数组 [] 用 [value0, value1]\n';
            break;
//          case CodeUtil.LANGUAGE_OBJECTIVE_C:
//            s += '\n#### <= iOS-Objective-C \n ```objective-c \n'
//              + CodeUtil.parseObjectiveCRequest(null, parseJSON(rq))
//              + '\n ```  \n';
//            break;

          case CodeUtil.LANGUAGE_GO:
            s += '\n#### <= Web-Go: 对象 key: value 会被强制排序，每个 key: value 最后都要加逗号 ","'
              + ' \n ```go \n'
              + CodeUtil.parseGoRequest(null, parseJSON(rq), 0)
              + '\n ``` \n注：对象 {} 用 map[string]interface{} {"key": value}，数组 [] 用 []interface{} {value0, value1}\n';
            break;
          case CodeUtil.LANGUAGE_C_PLUS_PLUS:
            s += '\n#### <= Web-C++: 使用 RapidJSON'
              + ' \n ```cpp \n'
              + StringUtil.trim(CodeUtil.parseCppRequest(null, parseJSON(rq), 0, isSingle))
              + '\n ``` \n注：std::string 类型值需要判断 RAPIDJSON_HAS_STDSTRING\n';
            break;

          case CodeUtil.LANGUAGE_PHP:
            s += '\n#### <= Web-PHP: 空对象用 (object) ' + (isSingle ? '[]' : 'array()')
              + ' \n ```php \n'
              + CodeUtil.parsePHPRequest(null, parseJSON(rq), 0, isSingle)
              + '\n ``` \n注：对象 {} 用 ' + (isSingle ? '[\'key\' => value]' : 'array("key" => value)') + '，数组 [] 用 ' + (isSingle ? '[value0, value1]\n' : 'array(value0, value1)\n');
            break;

          case CodeUtil.LANGUAGE_PYTHON:
            s += '\n#### <= Web-Python: 注释符用 \'\\#\''
              + ' \n ```python \n'
              + CodeUtil.parsePythonRequest(null, parseJSON(rq), 0, isSingle, vInput.value)
              + '\n ``` \n注：关键词转换 null: None, false: False, true: True';
            break;

          //以下都不需要解析，直接用左侧的 JSON
          case CodeUtil.LANGUAGE_TYPE_SCRIPT:
          case CodeUtil.LANGUAGE_JAVA_SCRIPT:
          //case CodeUtil.LANGUAGE_PYTHON:
            s += '\n#### <= Web-JavaScript/TypeScript: 和左边的请求 JSON 一样 \n';
            break;
          default:
            s += '\n没有生成代码，可能生成代码(封装,解析)的语言配置错误。\n';
            break;
        }

        if (((this.User || {}).id || 0) > 0) {
          s += '\n\n#### 开放源码 '
            + '\nAPIJSON 接口测试: https://github.com/TommyLemon/APIAuto '
            + '\nAPIJSON 单元测试: https://github.com/TommyLemon/UnitAuto '
            + '\nAPIJSON 中文文档: https://github.com/vincentCheng/apijson-doc '
            + '\nAPIJSON 英文文档: https://github.com/ruoranw/APIJSONdocs '
            + '\nAPIJSON 官方网站: https://github.com/APIJSON/apijson.cn '
            + '\nAPIJSON -Java版: https://github.com/Tencent/APIJSON '
            + '\nAPIJSON - C# 版: https://github.com/liaozb/APIJSON.NET '
            + '\nAPIJSON - Go 版: https://github.com/glennliao/apijson-go '
            + '\nAPIJSON - PHP版: https://github.com/kvnZero/hyperf-APIJSON '
            + '\nAPIJSON -Node版: https://github.com/kevinaskin/apijson-node '
            + '\nAPIJSON -Python: https://github.com/zhangchunlin/uliweb-apijson '
            + '\n感谢热心的作者们的贡献，GitHub 右上角点 ⭐Star 支持下他们吧 ^_^';
        }

        return s;
      },


      /**显示文档
       * @param d
       **/
      setDoc: function (d) {
        if (d == null) { //解决死循环 || d == '') {
          return false;
        }
        doc = d;
        var url = StringUtil.trim((this.coverage || {}).url)
        if (url != null && url.startsWith('/')) {
          url = this.getBaseUrl() + url
          this.view = 'html'
          vHtml.innerHTML = '<iframe width="100%" height="100%" src="' + url + '"></iframe><br>'
          return true
        }
        var html = null // (this.coverage || {}).html
        if (StringUtil.isEmpty(html) != true) {
          this.view = 'html'
          vHtml.innerHTML = html
          return true
        }
        vOutput.value = (StringUtil.isEmpty(url, true) ? (StringUtil.isEmpty(html, true) ? '' : StringUtil.trim(html) + '<br>') : '<iframe src="' + url + '"></iframe><br>')
          + (this.isTestCaseShow ? '' : output) + (
          '\n\n\n## 文档 \n\n 通用文档见 [APIJSON通用文档](https://github.com/Tencent/APIJSON/blob/master/Document.md#3.2) \n### 数据字典\n自动查数据库表和字段属性来生成 \n\n' + d
          + '<h3 align="center">关于</h3>'
          + '<p align="center">APIAuto-机器学习 HTTP 接口工具'
          + '<br>机器学习零代码测试、生成代码与静态检查、生成文档与光标悬浮注释'
          + '<br>由 <a href="https://github.com/TommyLemon/APIAuto" target="_blank">APIAuto(前端网页工具)</a>, <a href="https://github.com/Tencent/APIJSON" target="_blank">APIJSON(后端接口服务)</a> 等提供技术支持'
          + '<br>遵循 <a href="http://www.apache.org/licenses/LICENSE-2.0" target="_blank">Apache-2.0 开源协议</a>'
          + '<br>Copyright &copy; 2017-' + new Date().getFullYear() + ' Tommy Lemon'
          + '<br><a href="https://beian.miit.gov.cn/" target="_blank"><span >粤ICP备18005508号-1</span></a>'
          + '</p><br><br>'
        );

        this.view = 'markdown';
        markdownToHTML(vOutput.value);
        return true;
      },


      /**
       * 获取文档
       */
      getDoc: function (callback) {

      	var isTSQL = ['ORACLE', 'DAMENG'].indexOf(this.database) >= 0
      	var isNotTSQL = ! isTSQL

        var count = this.count || 100  //超过就太卡了
        var page = this.page || 0

        var schemas = StringUtil.isEmpty(this.schema, true) ? null : StringUtil.split(this.schema)

        var search = StringUtil.isEmpty(this.search, true) ? null : '%' + StringUtil.trim(this.search) + '%'
        this.request(false, REQUEST_TYPE_POST, REQUEST_TYPE_JSON, this.getBaseUrl() + '/get', {
          format: false,
          '@database': StringUtil.isEmpty(this.database, true) ? undefined : this.database,
          // '@schema': StringUtil.isEmpty(this.schema, true) ? undefined : this.schema,
          'sql@': {
            'from': 'Access',
            'Access': {
              '@column': 'name'
            }
          },
          'Access[]': {
            'count': count,
            'page': page,
            'Access': {
              '@column': 'name,alias,post,put,delete,get,gets,head,heads',
              '@order': 'date-,name+',
              'name$': search,
              'alias$': search,
              '@combine': search == null ? null : 'name$,alias$',
            }
          },
          '[]': {
            'count': count,
            'page': page,
            'Table': isTSQL || this.database == 'SQLSERVER' ? null : {
              'table_schema{}': schemas,
              'table_type': 'BASE TABLE',
              // 'table_name!$': ['\\_%', 'sys\\_%', 'system\\_%'],
              'table_name$': search,
              'table_comment$': this.database == 'POSTGRESQL' ? null : search,
              '@combine': search == null || this.database == 'POSTGRESQL' ? null : 'table_name$,table_comment$',
              'table_name{}@': 'sql',
              '@order': 'table_name+', //MySQL 8 SELECT `table_name` 返回的仍然是大写的 TABLE_NAME，需要 AS 一下
              '@column': (schemas != null && schemas.length == 1 ? '' : 'table_schema:table_schema,') + (this.database == 'POSTGRESQL' ? 'table_name' : 'table_name:table_name,table_comment:table_comment')
            },
            'PgClass': this.database != 'POSTGRESQL' ? null : {
              'relname@': '/Table/table_name',
              //FIXME  多个 schema 有同名表时数据总是取前面的  不属于 pg_class 表 'nspname': this.schema,
              '@column': 'oid;obj_description(oid):table_comment'
            },
            'SysTable': this.database != 'SQLSERVER' ? null : {
              'name!$': [
                '\\_%',
                'sys\\_%',
                'system\\_%'
              ],
              '@order': 'name+',
              '@column': 'name:table_name,object_id'
            },
            'ExtendedProperty': this.database != 'SQLSERVER' ? null : {
              '@order': 'name+',
              'major_id@': '/SysTable/object_id',
              '@column': 'value:table_comment'
            },
            "join": isNotTSQL ? null : {
              "&/AllTableComment": {
                'table_name$': search,
                'table_comment$': search,
                '@combine': search == null ? null : 'table_name$,table_comment$',
              }
            },
            "AllTable": isNotTSQL ? null : {
              "@order": "TABLE_NAME+",
              "@column": "TABLE_NAME:table_name",
              'TABLE_NAME{}@': 'sql'
            },
            "AllTableComment": isNotTSQL ? null : {
              "TABLE_TYPE": "TABLE",
              "TABLE_NAME@": "/AllTable/TABLE_NAME",
              "@column": "COMMENTS:table_comment"
            },
            '[]': {
              'count': 0,
              'Column': isTSQL ? null : {
                'table_schema{}': schemas,
                'table_schema@': schemas != null && schemas.length == 1 ? null : '[]/Table/table_schema',
                'table_name@': this.database != 'SQLSERVER' ? '[]/Table/table_name' : "[]/SysTable/table_name",
                "@order": this.database != 'SQLSERVER' ? null : "table_name+",
                '@column': this.database == 'POSTGRESQL' || this.database == 'SQLSERVER'  //MySQL 8 SELECT `column_name` 返回的仍然是大写的 COLUMN_NAME，需要 AS 一下
                  ? 'column_name;data_type;numeric_precision,numeric_scale,character_maximum_length'
                  : 'column_name:column_name,column_type:column_type,is_nullable:is_nullable,column_default:column_default,column_comment:column_comment'
              },
              'PgAttribute': this.database != 'POSTGRESQL' ? null : {
                'attrelid@': '[]/PgClass/oid',
                'attname@': '/Column/column_name',
                'attnum>': 0,
                '@column': 'col_description(attrelid,attnum):column_comment'
              },
              'SysColumn': this.database != 'SQLSERVER' ? null : {
                'object_id@': '[]/SysTable/object_id',
                'name@': '/Column/column_name',
                '@order': 'object_id+',
                '@column': 'object_id,column_id'
              },
              'ExtendedProperty': this.database != 'SQLSERVER' ? null : {
                '@order': 'major_id+',
                'major_id@': '/SysColumn/object_id',
                'minor_id@': '/SysColumn/column_id',
                '@column': 'value:column_comment'
              },
              "AllColumn": isNotTSQL ? null : {
                "TABLE_NAME@": "[]/AllTable/table_name",
                "@column": "COLUMN_NAME:column_name,DATA_TYPE:column_type"
              },
              "AllColumnComment": isNotTSQL ? null : {
                "TABLE_NAME@": "[]/AllTable/table_name",
                "COLUMN_NAME@": "/AllColumn/column_name",
                "@column": "COMMENTS:column_comment"
              }
            }
          },
          'Function[]': {
            'count': count,
            'page': page,
            'Function': {
              '@order': 'date-,name+',
              '@column': 'name,arguments,returnType,demo,detail,detail:rawDetail',
              'demo()': 'getFunctionDemo()',
              'detail()': 'getFunctionDetail()',
              'name$': search,
              'detail$': search,
              '@combine': search == null ? null : 'name$,detail$',
            }
          },
          'Request[]': {
            'count': count,
            'page': page,
            'Request': {
              '@order': 'version-,method-',
              '@json': 'structure',
              'tag$': search,
              // 界面又不显示这个字段，搜出来莫名其妙 'detail$': search,
              // '@combine': search == null ? null : 'tag$,detail$',
            }
          }
        }, {}, function (url, res, err) {
          App.onDocumentListResponse(url, res, err, callback)
        })
      },

      lastDocReqTime: 0,
      onDocumentListResponse: function(url, res, err, callback) {
        if (err != null || res == null || res.data == null) {
          log('getDoc  err != null || res == null || res.data == null >> return;');
          if (callback != null) {
            callback('')
          }
          return;
        }

        var time = res.config == null || res.config.metadata == null ? 0 : (res.config.metadata.startTime || 0)
        if (time < this.lastDocReqTime) {
          return
        }

        this.lastDocReqTime = time;

//        log('getDoc  docRq.responseText = \n' + docRq.responseText);
        docObj = res.data || {};  //避免后面又调用 onChange ，onChange 又调用 getDoc 导致死循环

        var map = {};

        //Access[] <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
        var ad = ''
        var list = docObj == null ? null : docObj['Access[]'];
        CodeUtil.accessList = list;
        if (list != null) {
          if (DEBUG) {
            log('getDoc  Access[] = \n' + format(JSON.stringify(list)));
          }

          ad += '\n\n\n\n\n\n\n\n\n### 访问权限\n自动查 Access 表写入的数据来生成\n'
            + ' \n 表名  |  允许 POST<br>的角色  |  允许 PUT<br>的角色  |  允许 DELETE<br>的角色  |  允许 GET<br>的角色  |  允许 GETS<br>的角色  |  允许 HEAD<br>的角色  |  允许 HEADS<br>的角色  |  表名'
            + ' \n --------  |  ---------  |  ---------  |  ---------  |  ---------  |  ---------  |  ---------  |  --------- | --------  ';

          for (var i = 0; i < list.length; i++) {
            var item = list[i];
            if (item == null) {
              continue;
            }
            if (DEBUG) {
              log('getDoc Access[] for i=' + i + ': item = \n' + format(JSON.stringify(item)));
            }

            var name = StringUtil.isEmpty(item.alias, true) ? StringUtil.firstCase(item.name, true) : item.alias
            map[StringUtil.toLowerCase(item.schema) + '.' + StringUtil.toLowerCase(item.name)] = item

            function getShowString(method, lineItemCount) {
              var roles = item[method] == null ? null : parseJSON(item[method])
              var rs = []
              if (roles != null) {
                var schemaStr = StringUtil.isEmpty(item.schema) ? 'null' : "'" + item.schema + "'"
                for (var j = 0; j < roles.length; j++) {
                  var r = roles[j] || ''
                  rs.push('<a href="javascript:void(0)" onclick="window.App.onClickAccess(' + i + ',\'' + name + '\',' + schemaStr + ',\'' + method + '\',\'' + r + '\')">' + r + '</a>')
                }
              }
              return JSONResponse.getShowString(rs, lineItemCount)
            }

            ad += '\n' + (name) //右上角设置指定了 Schema  + '(' + item.schema + ')')
              + '  |  ' + getShowString('post', 1)
              + '  |  ' + getShowString('put', 1)
              + '  |  ' + getShowString('delete', 1)
              + '  |  ' + getShowString('get', 2)
              + '  |  ' + getShowString('gets', 2)
              + '  |  ' + getShowString('head', 2)
              + '  |  ' + getShowString('heads', 2)
              + '  |  ' + (name); //右上角设置指定了 Schema  + '(' + item.schema + ')');

            if (i % 5 == 4) {
              ad += ' \n **表名**  |  **允许 POST**<br>**的角色**  |  **允许 PUT**<br>**的角色**  |  **允许 DELETE**<br>**的角色**   |  **允许 GET**<br>**的角色**  |  **允许 GETS**<br>**的角色**  |  **允许 HEAD**<br>**的角色**  |  **允许 HEADS**<br>**的角色** |  表名'
            }
          }

          // ad += ' \n 表名  |  允许 post<br>的角色  |  允许 put<br>的角色  |  允许 delete<br>的角色   |  允许 get<br>的角色  |  允许 gets<br>的角色  |  允许 head<br>的角色  |  允许 heads<br>的角色 |  表名'

          ad += '\n' //避免没数据时表格显示没有网格
        }
        var accessMap = CodeUtil.accessMap = map;
        //Access[] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>


        //转为文档格式
          var doc = '';

          //[] <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
          list = docObj == null ? null : docObj['[]'];
          map = {};
          CodeUtil.tableList = list;
          if (list != null) {
            if (DEBUG) {
              log('getDoc  [] = \n' + format(JSON.stringify(list)));
            }

            for (var i = 0; i < list.length; i++) {
              var item = list[i];

              //Table
              var table = item == null ? null : (App.database != 'SQLSERVER' ? item.Table : item.SysTable);
              if (table == null) {
                continue;
              }
              if (DEBUG) {
                log('getDoc [] for i=' + i + ': table = \n' + format(JSON.stringify(table)));
              }

              var table_comment = App.database == 'POSTGRESQL'
                ? (item.PgClass || {}).table_comment
                : (App.database == 'SQLSERVER'
                    ? (item.ExtendedProperty || {}).table_comment
                    : table.table_comment
                );
              // item.Table.table_name = table.table_name
              // item.Table.table_comment = table_comment

              var schema = table.table_schema
              var modelName = App.getModelName(i)
              map[StringUtil.toLowerCase(schema) + '.' + StringUtil.toLowerCase(modelName)] = table

              // TODO 对 isAPIJSON 和 isRESTful 生成不一样的
              doc += '\n### ' + (i + 1) + '. ' + modelName
                + (StringUtil.isEmpty(schema, true) ? '' : ': { @schema: ' + schema + ' }')
                + ' - <a href="javascript:void(0)" onclick="window.App.onClickPost(' + i + ',\'' + modelName + '\')">POST</a>'
                + ' <a href="javascript:void(0)" onclick="window.App.onClickPut(' + i + ',\'' + modelName + '\')">PUT</a>'
                + ' <a href="javascript:void(0)" onclick="window.App.onClickDelete(' + i + ',\'' + modelName + '\')">DELETE</a>'
                + ' <a href="javascript:void(0)" onclick="window.App.onClickGet(' + i + ',\'' + modelName + '\')">GET</a>'
                + ' <a href="javascript:void(0)" onclick="window.App.onClickGets(' + i + ',\'' + modelName + '\')">GETS</a>'
                + ' <a href="javascript:void(0)" onclick="window.App.onClickHead(' + i + ',\'' + modelName + '\')">HEAD</a>'
                + ' <a href="javascript:void(0)" onclick="window.App.onClickHeads(' + i + ',\'' + modelName + '\')">HEADS</a>'
                + '\n' + App.toMD(table_comment);

              //Column[]
              doc += '\n\n 名称  |  类型  |  最大长度  |  详细说明' +
                ' \n --------  |  ------------  |  ------------  |  ------------ ';

              var columnList = item['[]'];
              if (columnList == null) {
                continue;
              }
              if (DEBUG) {
                log('getDoc [] for ' + i + ': columnList = \n' + format(JSON.stringify(columnList)));
              }

              for (var j = 0; j < columnList.length; j++) {
                var column = (columnList[j] || {})[App.database != 'SQLSERVER' ? 'Column' : 'SysColumn'];
                var name = column == null ? null : column.column_name;
                if (name == null) {
                  continue;
                }

                column.column_type = CodeUtil.getColumnType(column, App.database);
                var type = CodeUtil.getType4Language(App.language, column.column_type, false);
                var length = CodeUtil.getMaxLength(column.column_type);

                if (DEBUG) {
                  log('getDoc [] for j=' + j + ': column = \n' + format(JSON.stringify(column)));
                }

                var o = App.database == 'POSTGRESQL'
                  ? (columnList[j] || {}).PgAttribute
                  : (App.database == 'SQLSERVER'
                      ? (columnList[j] || {}).ExtendedProperty
                      : column
                  );
                var column_comment = (o || {}).column_comment
                var column_default = column.column_default

                // column.column_comment = column_comment
                doc += '\n' + ' <a href="javascript:void(0)" onclick="window.App.onClickColumn(' + i + ",'" + modelName + "'," + j + ",'" + name + "'" + ')">' + name + '</a>'
                  + '  |  ' + type.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '  |  ' + length + '  |  ' + App.toMD(column_comment);

              }

              doc += '\n\n\n';

            }

          }
          CodeUtil.tableMap = map;
          //[] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

          doc += ad;

          //Function[] <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
          list = docObj == null ? null : docObj['Function[]'];
          CodeUtil.functionList = list;
          if (list != null) {
            if (DEBUG) {
              log('getDoc  Function[] = \n' + format(JSON.stringify(list)));
            }

            doc += '\n\n\n\n\n\n\n\n\n### 远程函数\n自动查 Function 表写入的数据来生成\n'
              + ' \n 说明  |  示例'
              + ' \n --------  |  -------------- ';

            for (var i = 0; i < list.length; i++) {
              var item = list[i];
              var name = item == null ? null : item.name;
              if (StringUtil.isEmpty(name, true)) {
                continue;
              }
              if (DEBUG) {
                log('getDoc Function[] for i=' + i + ': item = \n' + format(JSON.stringify(item)));
              }

              map[name] = item

              var demoStr = JSON.stringify(item.demo)

              // doc += '\n' + item.detail + '  |  ' + ' <a href="javascript:void(0)" onclick="window.App.onClickFunction(' + i + ",'"
              //   + demoStr.replaceAll("'", "\'") + ')">' + demoStr + '</a>';
              doc += '\n' + name + '(' + StringUtil.get(item.arguments) + '): '
                + CodeUtil.getType4Language(App.language, item.returnType) + ', ' + (item.rawDetail || item.detail)
                + '  |  ' + ' <a href="javascript:void(0)" onclick="window.App.onClickFunction(' + i + ')">' + demoStr + '</a>';
            }

            doc += '\n' //避免没数据时表格显示没有网格
          }
          CodeUtil.functionMap = map;
          //Function[] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>


          //Request[] <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
          list = docObj == null ? null : docObj['Request[]'];
          map = {};
          CodeUtil.requestList = list;
          if (list != null) {
            if (DEBUG) {
              log('getDoc  Request[] = \n' + format(JSON.stringify(list)));
            }

            doc += '\n\n\n\n\n\n\n\n\n### 非开放请求\n自动查 Request 表写入的数据来生成\n'
              + ' \n 版本  |  方法  |  请求标识  |  数据和结构'
              + ' \n --------  |  ------------  |  ------------  |  ------------  |  ------------ ';

            for (var i = 0; i < list.length; i++) {
              var item = list[i];
              if (item == null) {
                continue;
              }
              if (DEBUG) {
                log('getDoc Request[] for i=' + i + ': item = \n' + format(JSON.stringify(item)));
              }

              map[item.version + '.' + item.method + '.' + item.tag] = item

              var jsonStr = JSON.stringify(App.getStructure(false, null, item.structure, item.method, item.tag, item.version))

              doc += '\n' + item.version + '  |  ' + item.method + '  |  ' + item.tag
                + '  |  ' + ' <a href="javascript:void(0)" onclick="window.App.onClickRequest(' + i + ')">' + jsonStr + '</a>'
            }

            doc += '\n注: \n1.GET,HEAD方法不受限，可传任何 数据、结构。\n2.可在最外层传版本version来指定使用的版本，不传或 version <= 0 则使用最新版。\n\n\n\n\n\n\n';
          }
          CodeUtil.requestMap = map;


          //Request[] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

          App.onChange(false);

          if (callback != null) {
            callback(doc);
          }

//      	  log('getDoc  callback(doc); = \n' + doc);
      },

      getTableKey: function(database) {
        database = database || this.database
        return this.database == 'SQLSERVER' ? 'SysTable' : (['ORALCE', 'DAMENG'].indexOf(database) >= 0 ? 'AllTable' : 'Table')
      },
      getColumnKey: function(database) {
        database = database || this.database
        return this.database == 'SQLSERVER' ? 'SysColumn' : (['ORALCE', 'DAMENG'].indexOf(database) >= 0 ? 'AllColumn' : 'Column')
      },
      getTableObj: function(tableIndex) {
        var list = docObj == null ? null : docObj['[]']
        var item = list == null ? null : list[tableIndex]
        return item == null ? null : item[this.getTableKey()];
      },
      getColumnList: function(tableIndex) {
        var list = docObj == null ? null : docObj['[]']
        var item = list == null ? null : list[tableIndex]
        return item == null ? null : item['[]']
      },
      getColumnListWithModelName: function(modelName, schemaName) {
        var list = docObj == null ? null : docObj['[]']
        if (list != null) {
          for (var i = 0; i < list.length; i++) {
            var table = this.getTableObj(i)
            if (table != null && this.getModelName(i) == modelName
              && (schemaName == null || table.table_schema == schemaName)) {
              return list[i]['[]']
            }
          }
        }
        return null
      },
      getTableByName: function(tableName, schemaName) {
        var list = docObj == null ? null : docObj['[]']
        if (list != null) {
          for (var i = 0; i < list.length; i++) {
            var table = this.getTableObj(i)
            if (table != null && table.table_name == tableName
              && (schemaName == null || table.table_schema == schemaName)) {
              return table
            }
          }
        }

        return null
      },
      getTableByModelName: function(modelName, schemaName) {
        var list = docObj == null ? null : docObj['[]']
        if (list != null) {
          for (var i = 0; i < list.length; i++) {
            var table = this.getTableObj(i)
            if (table != null && this.getModelName(i) == modelName
              && (schemaName == null || table.table_schema == schemaName)) {
              return table
            }
          }
        }
        return null
      },
      getColumnTypeWithModelName: function(columnName, modelName, schemaName) {
        var columnList = this.getColumnListWithModelName(modelName, schemaName)
        if (columnList != null) {
          for (var j = 0; j < columnList.length; j++) {
            var column = this.getColumnObj(columnList, j)
            if (column != null && column.column_name == columnName) {
              return column
            }
          }
        }
        return null
      },
      getColumnObj: function(columnList, columnIndex) {
        return columnList == null ? null : (columnList[columnIndex] || {})[this.getColumnKey()];
      },
      getAccessObj: function(index) {
        var list = docObj == null ? null : docObj['Access[]']
        return list == null ? null : list[index];
      },
      getFunctionObj: function(index) {
        var list = docObj == null ? null : docObj['Function[]']
        return list == null ? null : list[index];
      },
      getFunctionByName: function(functionName) {
        var list = docObj == null ? null : docObj['Function[]']
        if (list != null) {
          for (var i = 0; i < list.length; i++) {
            var fun = this.getFunctionObj(i)
            if (fun != null && fun.name == functionName) {
              return fun
            }
          }
        }
        return null
      },
      getRequestObj: function(index) {
        var list = docObj == null ? null : docObj['Request[]']
        return list == null ? null : list[index];
      },
      getRequestBy: function(method, tag, version) {
        var list = docObj == null ? null : docObj['Request[]']
        if (list != null) {
          for (var i = 0; i < list.length; i++) {
            var req = this.getRequestObj(i)
            if (req != null && req.method == method && req.tag == tag && (
              version == null || req.version == version)) {
              return req
            }
          }
        }
        return null
      },
      getSchemaName: function(tableIndex) {
        var table = this.getTableObj(tableIndex)
        var sch = table == null ? null : table.table_shema
        if (StringUtil.isNotEmpty(sch)) {
          return sch
        }

        var schemas = StringUtil.isEmpty(this.schema, true) ? null : StringUtil.split(this.schema)
        return schemas == null || schemas.length != 1 ? null : this.schema
      },
      getTableName: function(tableIndex) {
        var table = this.getTableObj(tableIndex)
        return table == null ? '' : table.table_name
      },
      getColumnName: function(columnList, columnIndex) {
        var column = this.getColumnObj(columnList, columnIndex)
        return column == null ? '' : column.column_name
      },
      getModelName: function(tableIndex) {
        var table = this.getTableObj(tableIndex)
        var table_name = table == null ? null : table.table_name

        var accessMap = table_name == null ? null : CodeUtil.accessMap
        var access = accessMap == null ? null : accessMap[StringUtil.toLowerCase(table.table_schema) + '.' + StringUtil.toLowerCase(table_name)]
        var alias = access == null ? null : access.alias

        return StringUtil.isEmpty(alias, true) ? StringUtil.firstCase(table_name, true) : alias
      },
      getModelNameByTableName: function(tableName, schemaName) {
        var table = this.getTableByName(tableName, schemaName)
        var table_name = table == null ? null : table.table_name

        var accessMap = table_name == null ? null : CodeUtil.accessMap
        var access = accessMap == null ? null : accessMap[StringUtil.toLowerCase(table.table_schema) + '.' + StringUtil.toLowerCase(table_name)]
        var alias = access == null ? null : access.alias

        return StringUtil.isEmpty(alias, true) ? StringUtil.firstCase(table_name, true) : alias
      },

      onClickPost: function (tableIndex, modelName, schemaName, role) {
        this.handleClickPost(this.getColumnList(tableIndex), modelName || this.getModelName(tableIndex), schemaName, role)
      },
      handleClickPost: function (columnList, modelName, schemaName, role) {
        if (columnList == null) {
          columnList = this.getColumnListWithModelName(modelName, schemaName)
        }

        var tbl = {}

        if (columnList != null && columnList.length > 0) {
          for (var j = 0; j < columnList.length; j++) {
            var column = this.getColumnObj(columnList, j)
            var name = column == null ? null : column.column_name;
            if (name == null || name.toLowerCase() == "id") {
              continue;
            }

            var val = column.column_default
            if (val == null) {
              var column_type = CodeUtil.getColumnType(column, this.database);
              var type = CodeUtil.getType4Language(CodeUtil.LANGUAGE_JAVA_SCRIPT, column_type, false);
              val = this.generateValue(type, name)
            }

            tbl[name] = val
          }
        }

        if (StringUtil.isNotEmpty(schemaName, true)) {
          tbl['@schema'] = schemaName
        }
        if (StringUtil.isNotEmpty(role, true)) {
          tbl['@role'] = role
        }

        var json = isSingle ? tbl : {}
        if (! isSingle) {
          json[modelName] = tbl
          json.tag = modelName
          json['@explain'] = true
        }

        var s = JSON.stringify(json, null, '    ')
        this.showCRUD('/post' + (isSingle ? '/' + modelName : ''), isSingle ? this.switchQuote(s) : s)
      },

      onClickGet: function (tableIndex, modelName, schemaName, role) {
        this.handleClickGet(this.getColumnList(tableIndex), modelName || this.getModelName(tableIndex), schemaName, role)
      },
      handleClickGet: function (columnList, modelName, schemaName, role) {
        if (columnList == null) {
          columnList = this.getColumnListWithModelName(modelName, schemaName)
        }

        var idName = 'id'
        var userIdName = 'userId'
        var dateName = 'date'
        var s = ''
        if (columnList != null && columnList.length > 0) {
          for (var j = 0; j < columnList.length; j++) {
            var column = this.getColumnObj(columnList, j)
            var name = column == null ? null : column.column_name;
            if (name == null) {
              continue;
            }

            var ln = name.replaceAll('_', '').toLowerCase()
            if (name.toLowerCase() == "id") {
              idName = name
            }
            else if (ln == "userid") {
              userIdName = name
            }
            else if (("date", "time", "createtime", "createat", "createat", "createdat").indexOf(ln) >= 0) {
              dateName = name
            }

            s += (j <= 0 ? '' : ',') + name
          }
        }

        var arrName = modelName + '[]'

        this.showCRUD('/get' + (isSingle ? '/' + arrName + '?total@=' + arrName + '/total' + '&info@=' + arrName + '/info' : ''),
          isSingle ? `{
    '` + modelName + `': {` + (StringUtil.isEmpty(role, true) ? '' : `
        '@role': '` + role + "',") + (StringUtil.isEmpty(schemaName, true) ? '' : `
        '@schema': '` + schemaName + "',") + `
        '@column': '` + s + `',
        '@order': '` + idName + `-', // '@group': '` + userIdName + `',
        '` + idName + `>': 10, // '@column': '` + userIdName + `;avg(` + idName + `)',
        '` + dateName + `{}': '!=null' // '@having': 'avg(` + idName + `)>10'
    },
    'count': 10,
    'page': 0,
    'query': 2
}` : `{
    "` + modelName + `[]": {
        "` + modelName + `": {` + (StringUtil.isEmpty(role, true) ? '' : `
            "@role": "` + role + '",') + (StringUtil.isEmpty(schemaName, true) ? '' : `
            "@schema": "` + schemaName + '",') + `
            "@column": "` + s + `",
            "@order": "` + idName + `-", // "@group": "` + userIdName + `",
            "` + idName + `>": 10, // "@column": "` + userIdName + `;avg(` + idName + `)",
            "` + dateName + `{}": "!=null" // "@having": "avg(` + idName + `)>10"
        },
        "count": 10,
        "page": 0,
        "query": 2
    },
    "total@": "` + modelName + `[]/total",
    "info@": "` + modelName + `[]/info",
    "@explain": true
}`)
      },

      onClickPut: function (tableIndex, modelName, schemaName, role) {
        this.handleClickPut(this.getColumnList(tableIndex), modelName || this.getModelName(tableIndex), schemaName, role)
      },
      handleClickPut: function (columnList, modelName, schemaName, role) {
        if (columnList == null) {
          columnList = this.getColumnListWithModelName(modelName, schemaName)
        }

        var tbl = {
          "id{}": [
            1,
            2,
            4,
            12,
            470,
            82011,
            82012
          ]
        }

        if (columnList != null && columnList.length > 0) {
          for (var j = 0; j < columnList.length; j++) {
            var column = this.getColumnObj(columnList, j)
            var name = column == null ? null : column.column_name;
            if (name == null) {
              continue;
            }

            var val = column.column_default
            if (val == null) {
              var column_type = CodeUtil.getColumnType(column, this.database);
              var type = CodeUtil.getType4Language(CodeUtil.LANGUAGE_JAVA_SCRIPT, column_type, false);
              val = this.generateValue(type, name)
            }

            tbl[name] = val
          }
        }

        if (StringUtil.isNotEmpty(schemaName, true)) {
          tbl['@schema'] = schemaName
        }
        if (StringUtil.isNotEmpty(role, true)) {
          tbl['@role'] = role
        }

        var json = isSingle ? tbl : {}
        if (! isSingle) {
          json[modelName] = tbl
          json.tag = modelName
          json['@explain'] = true
        }

        var s = JSON.stringify(json, null, '    ')
        this.showCRUD('/put' + (isSingle ? '/' + modelName + '[]' : ''), isSingle ? this.switchQuote(s) : s)
      },

      onClickDelete: function (tableIndex, modelName, schemaName, role) {
        this.handleClickDelete(this.getColumnList(tableIndex), modelName || this.getModelName(tableIndex), schemaName, role)
      },
      handleClickDelete: function (columnList, modelName, schemaName, role) {
        this.handleClickGetsOrDelete(false, columnList, modelName, schemaName, role)
      },
      handleClickGetsOrDelete: function (isGets, columnList, modelName, schemaName, role) {
        if (columnList == null) {
          columnList = this.getColumnListWithModelName(modelName, schemaName)
        }

        var isSchemaEmpty = StringUtil.isEmpty(schemaName, true)
        var isRoleEmpty = StringUtil.isEmpty(role, true)

        this.showCRUD((isGets ? '/gets' : '/delete') + (isSingle ? '/' + modelName : ''),
          isSingle ? `{
    'id': 1` + (StringUtil.isEmpty(schemaName, true) ? '' : `,
    '@schema': '` + schemaName + "'") + (StringUtil.isEmpty(role, true) ? '' : `,
    '@role': '` + role + "'") + `
}` : `{
    "` + modelName + `": {
        "id": 1` + (StringUtil.isEmpty(schemaName, true) ? '' : `,
        "@schema": "` + schemaName + '"') + (StringUtil.isEmpty(role, true) ? '' : `,
        "@role": "` + role + '"') + `
    },
    "tag": "` + modelName + `",
    "@explain": true
}`)
      },

      onClickGets: function (tableIndex, modelName, schemaName, role) {
        this.handleClickGets(this.getColumnList(tableIndex), modelName || this.getModelName(tableIndex), schemaName, role)
      },
      handleClickGets: function (columnList, modelName, schemaName, role) {
        this.handleClickGetsOrDelete(true, columnList, modelName, schemaName, role)
      },

      onClickHead: function (tableIndex, modelName, schemaName, role) {
        this.handleClickHead(this.getColumnList(tableIndex), modelName || this.getModelName(tableIndex), schemaName, role)
      },
      handleClickHead: function (columnList, modelName, schemaName, role) {
        this.handleClickHeadOrHeads(false, columnList, modelName, schemaName, role)
      },
      onClickHeads: function (tableIndex, modelName, schemaName, role) {
        this.handleClickHeads(this.getColumnList(tableIndex), modelName || this.getModelName(tableIndex), schemaName, role)
      },
      handleClickHeads: function (columnList, modelName, schemaName, role) {
        this.handleClickHeadOrHeads(true, columnList, modelName, schemaName, role)
      },
      handleClickHeadOrHeads: function (isHeads, columnList, modelName, schemaName, role) {
        if (columnList == null) {
          columnList = this.getColumnListWithModelName(modelName, schemaName)
        }

        this.showCRUD((isHeads ? '/heads' : '/head') + (isSingle ? '/' + modelName : ''),
          isSingle ? `{
    'userId': 82001` + (StringUtil.isEmpty(schemaName, true) ? '' : `,
    '@schema': '` + schemaName + "'") + (StringUtil.isEmpty(role, true) ? '' : `,
    '@role': '` + role + "'") + `
}` : `{
    "` + modelName + `": {
        "userId": 82001` + (StringUtil.isEmpty(schemaName, true) ? '' : `,
        "@schema": "` + schemaName + '"') + (StringUtil.isEmpty(role, true) ? '' : `,
        "@role": "` + role + '"') + `
    },` + (isHeads ? `
    "tag": "` + modelName + `",` : '') + `
    "@explain": true
}`)
      },

      onClickColumn: function (tableIndex, modelName, columnIndex, columnName) {
        modelName = modelName || this.getModelName(tableIndex)
        if (StringUtil.isEmpty(columnName, true)) {
          var columnList = this.getColumnList(tableIndex)
          columnName = columnName || this.getColumnName(columnList, columnIndex)
        }

        var arrName = modelName + '[]'

        this.showCRUD('/get' + (isSingle ? '/' + arrName + '?total@=' + arrName + '/total' + '&info@=' + arrName + '/info' : ''),
          isSingle ? `{
    '` + modelName + `': {
        '@column': 'DISTINCT ` + columnName + `',
        '@order': '` + columnName + `+', // '@order': 'id-'
    },
    'count': 0,
    'page': 0,
    'query': 2
}` : `{
    "` + modelName + '-' + columnName + `[]": {
        "` + modelName + `": {
            "@column": "DISTINCT ` + columnName + `",
            "@order": "` + columnName + `+", // "@order": "id-"
        },
        "count": 0,
        "page": 0,
        "query": 2
    },
    "total@": "` + modelName + '-' + columnName + `[]/total",
    "info@": "` + modelName + '-' + columnName + `[]/info",
    "@explain": true
}`)
      },

      onClickAccess: function (index, model, schema, method, role) {
        if (StringUtil.isEmpty(model, true) || StringUtil.isEmpty(schema, true) || StringUtil.isEmpty(method, true) || StringUtil.isEmpty(role, true)) {
          // var access = this.getAccessObj(index)
          // model = this.getModelNameByTableName()
        }

        method = StringUtil.toLowerCase(method)
        switch (method) {
          case 'get':
            this.handleClickGet(null, model, schema, role)
            break
          case 'gets':
            this.handleClickGets(null, model, schema, role)
            break
          case 'head':
            this.handleClickHead(null, model, schema, role)
            break
          case 'heads':
            this.handleClickHeads(null, model, schema, role)
            break
          case 'post':
            this.handleClickPost(null, model, schema, role)
            break
          case 'put':
            this.handleClickPut(null, model, schema, role)
            break
          case 'delete':
            this.handleClickDelete(null, model, schema, role)
            break
        }
      },

      onClickFunction: function (index, demo) {
        if (StringUtil.isEmpty(demo, true)) {
          var fun = this.getFunctionObj(index)
          demo = JSON.stringify(fun.demo, null, '    ')  // this.getFunctionDemo(fun)
        }

        this.showCRUD('/get', isSingle ? this.switchQuote(demo) : demo)
      },

      onClickRequest: function (index, method, tag, version, jsonStr) {
        if (StringUtil.isEmpty(method, true) || StringUtil.isEmpty(tag, true) || StringUtil.isEmpty(jsonStr, true)) {
          var fun = this.getRequestObj(index)
          method = fun.method || 'get'
          tag = fun.tag
          version = fun.version
          if (StringUtil.isEmpty(jsonStr, true)) {
            var json = this.getStructure(true, null, fun.structure, method, tag, version, isSingle, true)
            jsonStr = json == null ? '' : JSON.stringify(json, null, '    ')
          }
        }

        vInput.value = ''
        this.showCRUD(
          '/' + StringUtil.toLowerCase(method) + (isSingle ? '/' + tag + (version == null ? '' : '?version=' + version) : '')
          , isSingle ? this.switchQuote(jsonStr) : jsonStr
        )
      },

      showCRUD: function (url, json) {
        if (url == this.getBranchUrl()) {
          var origin = this.getRequest(vInput.value)
          if (origin != null && Object.keys(origin).length > 0) {
            json = this.getRequest(json)
            if (json == null || Object.keys(json).length <= 0
              || (json instanceof Array != true && json instanceof Object)) {
              json = Object.assign(origin, json)
              json = JSON.stringify(json, null, '    ')
            }
          }
        }

        this.method = REQUEST_TYPE_POST
        this.type = REQUEST_TYPE_JSON
        this.showUrl(false, url)
        this.urlComment = ''
        vInput.value = StringUtil.trim(json)
        this.showTestCase(false, this.isLocalShow)
        this.onChange(false)
      },

      getTotalAndCoverageString: function(typeName, count, total) {
    	  count = count || 0
    	  total = total || 0
        if (count > total) {
          count = total
        }
    	  return '共 ' + total + ' 个' + (typeName || '子项') + '，覆盖 ' + count  + ' 个'
		  + (Number.isInteger(total) != true || total <= 0 ? '' : '，覆盖率 ' + (100*count/total).toFixed(2) + '%');
      },
      getRealClassTotal: function(data, packageName) {
    	if (data == null) {
    		return 0;
    	}
    	var packageList = data.packageList
    	var len = packageList == null ? 0 : packageList.length
  		if (StringUtil.isEmpty(packageName, true)) {
  			return Math.max(data.classTotal || 0, len);
  		}
    	if (len <= 0) {
    		return 0;
    	}
  		for (var i in packageList) {
  			var pkgObj = packageList[i]
  			if (pkgObj != null && pkgObj['package'] == packageName) {
  				return Math.max(pkgObj.classTotal || 0, (pkgObj.classList || []).length || 0);
  			}
  		}
  		return 0;
	  },
	  getRealMethodTotal: function(data, packageName, className) {
		    if (data == null) {
	    	 return 0;
	      }
	    	var packageList = data.packageList
	    	var len = packageList == null ? 0 : packageList.length
  			if (StringUtil.isEmpty(packageName, true)) {
  				if (StringUtil.isEmpty(className, true)) {
  					return Math.max(data.classTotal || 0, len);
  				}
  				return 0;
  			}
	    	if (len <= 0) {
	    		return 0;
	    	}
		  for (var i in packageList) {
			  var pkgObj = packageList[i]
			  if (pkgObj != null && pkgObj['package'] == packageName) {
				  var classList = pkgObj.classList
				  var len2 = classList == null ? 0 : classList.length
				  if (StringUtil.isEmpty(className, true)) {
					 return Math.max(data.methodTotal || 0, len2);
				  }
				  if (len2 <= 0) {
			    	  return 0;
			      }
				  for (var j in classList) {
					  var clsObj = classList[j]
					  if (clsObj != null && clsObj['class'] == className) {
						  return Math.max(clsObj.methodTotal || 0, (clsObj.methodList || []).length || 0);
					  }
				  }
			  }
		  }
		  return 0;
	   },
     toDoubleJSON: function (json, defaultValue) {
        if (StringUtil.isEmpty(json)) {
          return defaultValue == null ? '{}' : JSON.stringify(defaultValue)
        }
        else if (json.indexOf("'") >= 0) {
          json = json.replace(/'/g, '"');
        }
        return json;
      },

      switchQuote: function (before) {
        if (before == null) {
          return before;
        }

        var newBefore = '';
        for (var i = 0; i < before.length; i++) {
          var chr = before.substring(i, i + 1); // .charAt(i);
          if (chr == '"') {
            newBefore += "'"; // chr = "'";
          }
          else if (chr == "'") {
            newBefore += '"'; // chr = '"';
          }
          else {
            newBefore += chr;
          }
        }
        return newBefore;
      },

      /**转为Markdown格式
       * @param s
       * @return {*}
       */
      toMD: function (s) {
        if (s == null) {
          return ''
        }

        if (s instanceof Object) {
          s = JSON.stringify(s)
        }

        if (typeof s != 'string') {
          return StringUtil.get(s)
        }

        //无效
        s = s.replace(/\|/g, '\|');
        s = s.replace(/\n/g, ' <br /> ');
        // s = s.replace(/ /g, '&ensp;');
        return s;
      },

      /**处理请求结构
       */
      getStructure: function (isDemo, name, obj, method, tag, version, unwrap) {
        if (obj == null) {
          return null;
        }

        if (DEBUG) {
          log('getStructure  tag = ' + tag + '; version = ' + version + '; isDemo = ' + isDemo + '; obj = \n' + format(obj));
        }

        method = method == null ? 'GET' : method.trim().toUpperCase()

        var isArrayKey = tag != null && tag.endsWith('[]');
        var isMultiArrayKey = isArrayKey && tag.endsWith(":[]")
        var isTableKey = false
        var tableName = tag
        if (tag != null) { //补全省略的Table
          var key = isArrayKey ? tag.substring(0, tag.length - (tag.endsWith(':[]') ? 3 : 2)) : tag;
          if (this.isTableKey(key)) {
            isTableKey = true
            tableName = key
            // name = key
          }
        }

        var newObj = {}

        if (obj instanceof Array) {
          for (var i = 0; i < obj.length; i++) {
            newObj[i] = this.getStructure(isDemo, i + '', obj[i], method);
          }
        }
        else if (obj instanceof Object) {
          var refuseKeys = null

          for (var k in obj) {
            if (k == null || k == '' || k == 'INSERT' || k == 'REMOVE' || k == 'REPLACE' || k == 'UPDATE') {
              continue;
            }

            var v = obj[k];
            if (v == null) {
              continue;
            }

            var nk = k;

            if (isDemo) {
              nk = null
              if (k == 'REFUSE') {
                refuseKeys = StringUtil.isEmpty(v, true) ? null : StringUtil.split(v)
              }
              else if (k == 'MUST' || k == 'UNIQUE') {
                var ks = StringUtil.isEmpty(v, true) ? null : StringUtil.split(v)
                if (ks != null) {
                  for (var j = 0; j < ks.length; j++) {
                    var kj = ks[j]
                    newObj[kj] = this.generateValue(CodeUtil.getType4Language(CodeUtil.LANGUAGE_JAVA_SCRIPT
                      , CodeUtil.getColumnType(this.getColumnTypeWithModelName(kj, tableName), this.database)), kj)
                  }
                }
              }
              else if (k == 'VERIFY') { // 后续会用数据字典填空
                nk = null
                // for (var kj in v) { // 还得把功能符去掉 {} $ > <= ...
                //   newObj[kj] = this.generateValue(CodeUtil.getType4Language(CodeUtil.LANGUAGE_JAVA_SCRIPT
                //     , CodeUtil.getColumnType(this.getColumnTypeWithModelName(kj, tableName), this.database)), kj)
                // }
              }
              else if (k == 'TYPE') {
                for (var kj in v) {
                  newObj[kj] = this.generateValue(CodeUtil.getType4Language(CodeUtil.LANGUAGE_JAVA_SCRIPT, v[kj]), kj)
                }
              }
              else {
                nk = k
              }
            }
            else {
              if (k == 'REFUSE') {
                nk = '不能传';
              } else if (k == 'MUST') {
                nk = '必须传';
              } else if (k == 'UNIQUE') {
                nk = '不重复';
              } else if (k == 'VERIFY') {
                nk = '满足条件';
              } else if (k == 'TYPE') {
                nk = '满足类型';
              } else {
                nk = k;
              }
            }

            if (nk != null) {
              if (v instanceof Object && (v instanceof Array == false)) {
                v = this.getStructure(isDemo, nk, v, method);
              }
              else if (v === '!') {
                v = '非必须传的字段';
              }

              if (v != null) {
                newObj[nk] = v;
              }
            }
          }

          var isPutOrDel = method == 'PUT' || method == 'DELETE'
          var isPostOrPutMulti = isMultiArrayKey && (method == 'POST' || method == 'PUT')
          var isGetOrGetsMulti = isArrayKey && (method == 'GET' || method == 'GETS')
          var mustHasKey = tableName + (isPostOrPutMulti || isGetOrGetsMulti ? '[]' : '')
          var isFulfill = name == null && isTableKey && (isPostOrPutMulti || newObj[mustHasKey] == null)
          if (isFulfill && (isPostOrPutMulti || ! isArrayKey)) {
            name = tableName
          }

          if (isDemo && this.isTableKey(name) && (refuseKeys == null || refuseKeys.indexOf('!') < 0)) {
            var columnList = this.getColumnListWithModelName(name)
            if (columnList != null) {
              var s = ''
              for (var i = 0; i < columnList.length; i++) {
                var column = this.getColumnObj(columnList, i)
                var cn = column == null ? null : column.column_name

                if (cn == null || cn.startsWith('_') || (method == 'POST' && cn.toLowerCase() == 'id') || (refuseKeys != null && refuseKeys.indexOf(cn) >= 0)) {
                  continue
                }

                if (method == 'GET' || method == 'GETS') {
                  s += (i <= 0 ? '' : ',') + cn
                } else {
                  var nv = this.generateValue(CodeUtil.getType4Language(CodeUtil.LANGUAGE_JAVA_SCRIPT, CodeUtil.getColumnType(column, this.database)), cn)
                  if (nv != null || newObj[cn] == null) {
                    newObj[cn] = nv
                  }
                }
              }
            }

            if (method == 'GET' || method == 'GETS') {
              newObj['@column'] = s
            }
          }

          if (isFulfill) { //补全省略的Table
            var realObj = {};
            if (isArrayKey) { //自动为 tag = Comment:[] 的 { ... } 新增键值对 "Comment[]":[] 为 { "Comment[]":[], ... }
              if (isPostOrPutMulti) {
                var reqObj = isDemo ? this.getRequestBy(method, tableName) : null
                var childStruct = reqObj == null ? null : reqObj.structure
                if (childStruct != null && childStruct[tableName] != null) {
                  childStruct = childStruct[tableName]
                }

                newObj = childStruct == null ? newObj : Object.assign(
                  this.getStructure(isDemo, null, childStruct, reqObj.method, null, null, true), newObj
                )

                delete newObj[mustHasKey]
                realObj[mustHasKey] = isDemo ? [newObj, newObj] : [newObj];
              }
              else if (unwrap || isPutOrDel) {
                if (isDemo && isPutOrDel && newObj['id{}'] == null) {
                  newObj['id{}'] = [
                    1,
                    2,
                    4,
                    12,
                    470,
                    82011,
                    82012
                  ]
                }
                realObj[mustHasKey] = newObj;
              }
              else {
                realObj[mustHasKey] = newObj
              }
              newObj = realObj
            }
            else if (unwrap != true) { //自动为 tag = Comment 的 { ... } 包一层为 { "Comment": { ... } }
              if (isPutOrDel) {
                if (isDemo && newObj.id == null) {
                  newObj.id = 1
                }
              }

              realObj[mustHasKey] = newObj;
              newObj = realObj;
            }
          }

        }

        if (tag != null && unwrap != true) {
          newObj.tag = tag; //补全tag
        }
        if (version != null && unwrap != true) {
          newObj.version = version;
        }

        if (DEBUG) {
          log('getStructure  return newObj = \n' + format(newObj));
        }

        return newObj;
      },

      /**判断key是否为表名，用CodeUtil里的同名函数会在Safari上报undefined
       * @param key
       * @return
       */
      isTableKey: function (key) {
        log('isTableKey  typeof key = ' + (typeof key));
        if (key == null) {
          return false;
        }
        return /^[A-Z][A-Za-z0-9_]*$/.test(key);
      },

      log: function (msg) {
        // this.log('Main.  ' + msg)
      },

      getDoc4TestCase: function () {
        var list = this.remotes || []
        var doc = ''
        var item
        for (var i = 0; i < list.length; i ++) {
          item = list[i] == null ? null : list[i].Document
          if (item == null || item.name == null) {
            continue
          }
          doc += '\n\n#### ' + (item.version > 0 ? 'V' + item.version : 'V*') + ' ' + item.name  + '    ' + item.url
          doc += '\n```json\n' + item.request + '\n```\n'
        }
        return doc
      },

      enableCross: function (enable) {
        this.isCrossEnabled = enable
        this.crossProcess = enable ? '交叉账号:已开启' : '交叉账号:已关闭'
        this.saveCache(this.server, 'isCrossEnabled', enable)
      },

      enableML: function (enable) {
        this.isMLEnabled = enable
        this.testProcess = enable ? '机器学习:已开启' : '机器学习:已关闭'
        this.saveCache(this.server, 'isMLEnabled', enable)
        // if (enable) {
        //   this.isEnvCompareEnabled = false
        //   this.saveCache(this.server, 'isEnvCompareEnabled', this.isEnvCompareEnabled)
        // }

        this.resetTestCount(this.currentAccountIndex)

        this.remotes = null
        this.showTestCase(true, false)
      },

      resetTestCount: function (accountIndex, isRandom, isSub) {
        if (isRandom) {
          this.resetCount(isSub ? this.currentRandomItem : this.currentRemoteItem, isRandom, isSub, accountIndex)
          return
        }

        if (accountIndex == -1) {
          this.logoutSummary = this.resetCount(this.logoutSummary, false, false, accountIndex)
        }
        else if (accountIndex >= 0 && accountIndex < (this.accounts || []).length) {
          var accountItem = this.resetCount(this.getSummary(accountIndex), false, false, accountIndex)
          this.accounts[accountIndex] = accountItem
        }
      },

      onClickTestScript: function () {
        var logger = console.log
        console.log = function(msg) {
          logger(msg)
          vOutput.value = StringUtil.get(msg)
        }

        this.view = 'output'
        vOutput.value = ''

        try {
          var isTest = true
          var isPre = this.isPreScript

          var isAdminOperation = false
          var type = this.type
          var url = this.getUrl()
          var req = this.getRequest(vInput.value, {})
          var header = this.getHeader(vHeader.value)
          var callback = null

          var data = isPre ? undefined : (this.jsoncon == null ? null : parseJSON(this.jsoncon))
          var res = isPre ? undefined : {
            data: data
          }
          var err = isPre ? undefined : null

          var sendRequest = function (isAdminOperation, method, type, url, req, header, callback) {
            App.request(isAdminOperation, method, type, url, req, header, callback)
          }

          eval(vScript.value);
        }
        catch(e) {
          console.log(e);
          console.log = logger

          this.view = 'error'
          this.error = {
            msg: '执行脚本报错：\n' + e.message
          }
        }

        console.log = logger
      },

      /**参数注入，动态替换键值对
       * @param show
       */
      onClickTestRandom: function (isCross, callback) {
        this.isRandomTest = true
        this.isStatisticsEnabled = true
        this.testRandom(! this.isRandomListShow && ! this.isRandomSubListShow, this.isRandomListShow, this.isRandomSubListShow, null, isCross, true, callback)
      },
      testRandom: function (show, testList, testSubList, limit, isCross, isManual, callback) {
        this.isRandomEditable = false
        if (testList != true && testSubList != true) {
          this.testRandomProcess = ''
          this.testRandomWithText(show, callback)
        }
        else {
          var baseUrl = StringUtil.trim(this.getBaseUrl())
          if (baseUrl == '') {
            if (callback) {
              callback(true, 0, '请先输入有效的URL！')
            } else {
              alert('请先输入有效的URL！')
            }
            return
          }
          //开放测试
          // if (baseUrl.indexOf('/apijson.cn') >= 0 || baseUrl.indexOf('/39.108.143.172') >= 0) {
          //   alert('请把URL改成你自己的！\n例如 http://localhost:8080')
          //   return
          // }
          // if (baseUrl.indexOf('/apijson.org') >= 0) {
          //   alert('请把URL改成 http://apijson.cn:8080 或 你自己的！\n例如 http://localhost:8080')
          //   return
          // }

          const list = (testSubList ? App.randomSubs : App.randoms) || []
          var allCount = 0  // list.length
          for (let i = 0; i < list.length; i++) {
            const item = list[i]
            const random = item == null ? null : item.Random
            allCount += (random == null || random.count == null ? 0 : random.count)
          }

          App.randomAllCount = allCount
          App.randomDoneCount = 0

          if (allCount <= 0) {
            if (callback) {
              callback(true, 0, '请先获取随机配置\n点击[查看列表]按钮')
            } else {
              alert('请先获取随机配置\n点击[查看列表]按钮')
            }
            return
          }

          this.testRandomProcess = '正在测试: ' + 0 + '/' + allCount
          var summaryItem = (testSubList ? this.currentRandomItem : this.currentRemoteItem) || {}
          if (isManual) {
            this.resetCount(summaryItem, true, testSubList, this.currentAccountIndex)
          } else {
            summaryItem.whiteCount = 0
            summaryItem.greenCount = 0
            summaryItem.blueCount = 0
            summaryItem.orangeCount = 0
            summaryItem.redCount = 0
          }
          summaryItem.totalCount = allCount

          var methods = this.methods
          var method = this.isShowMethod() ? this.method : null
          var type = this.type
          var json = this.getRequest(vInput.value, {})
          var url = this.getUrl()
          var header = this.getHeader(vHeader.value)

          ORDER_MAP = {}  //重置

          for (var i = 0; i < (limit != null ? limit : list.length); i ++) {  //limit限制子项测试个数
            const item = list[i]
            const random = item == null ? null : item.Random
            if (random == null || random.name == null) {
              App.randomDoneCount ++
              continue
            }
            if (DEBUG) {
              this.log('test  random = ' + JSON.stringify(random, null, '  '))
            }

            const index = i

            const itemAllCount = random.count || 0
            // allCount += (itemAllCount - 1)  // 为什么减 1？因为初始化时 var allCount = list.length

            // UI 往上顶出屏幕
            // try {
            //   document.getElementById((testSubList ?  'randomSubItem' : 'randomItem') + index).scrollIntoView()
            // } catch (e) {
            //   console.log(e)
            // }

            App[testSubList ? 'currentRandomSubIndex' : 'currentRandomIndex'] = index
            try {
              this.testRandomSingle(show, false, itemAllCount > 1 && ! testSubList, item, method, type, url, json, header, isCross, isManual, function (url, res, err) {
                var data = null
                if (res instanceof Object) {  // 可能通过 onTestResponse 返回的是 callback(true, 18, null)
                  data = res.data
                  try {
                    App.onResponse(url, res, err)
                    if (DEBUG) {
                      App.log('test  App.request >> res.data = ' + (data == null ? 'null' : JSON.stringify(data, null, '  ')))
                    }
                  } catch (e) {
                    App.log('test  App.request >> } catch (e) {\n' + e.message)
                  }
                }

                App.compareResponse(res, allCount, list, index, item, data, true, App.currentAccountIndex, false, err, null, isCross, callback)
                return true
              })
            }
            catch (e) {
              this.compareResponse(null, allCount, list, index, item, data, true, this.currentAccountIndex, false, e, null, isCross, callback)
            }
          }
        }
      },
      /**参数注入，动态替换键值对
       * @param show
       * @param callback
       */
      testRandomSingle: function (show, testList, testSubList, item, method, type, url, json, header, isCross, isManual, callback) {
        item = item || {}

        // 保证能调用自定义函数等 <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
        const scripts = this.scripts || {}
        const globalScript = (scripts.global || {})[0] || {}
        const accountScript = (scripts.account || {})[this.getCurrentAccountId() || 0] || {}
        const caseScript = (scripts.case || {})[this.getCurrentDocumentId() || 0] || {}

        var preScript = ''

        var globalPreScript = StringUtil.trim((globalScript.pre || {}).script)
        if (StringUtil.isNotEmpty(globalPreScript, true)) {
          preScript += globalPreScript + '\n\n'
        }

        var accountPreScript = StringUtil.trim((accountScript.pre || {}).script)
        if (StringUtil.isNotEmpty(accountPreScript, true)) {
          preScript += accountPreScript + '\n\n'
        }

        var casePreScript = StringUtil.trim((caseScript.pre || {}).script)
        if (StringUtil.isNotEmpty(casePreScript, true)) {
          preScript += casePreScript + '\n\n'
        }
        // 保证能调用自定义函数等 >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>


        var random = item.Random = item.Random || {}
        var subs = item['[]'] || []
        var existCount = subs.length
        subs = existCount <= 0 ? subs : parseJSON(JSON.stringify(subs))

        var count = random.count || 0
        var respCount = 0;

        for (var i = 0; i < count; i ++) {
          // var constConfig = i < existCount ? ((subs[i] || {}).Random || {}).config : this.getRandomConstConfig(random.config, random.id) //第1遍，把 key : expression 改为 key : value
          // var constJson = this.getRandomJSON(parseJSON(JSON.stringify(json)), constConfig, random.id) //第2遍，用新的 random config 来修改原 json

          const which = i;
          var rawConfig = testSubList && i < existCount ? ((subs[i] || {}).Random || {}).config : random.config
          rawConfig = (StringUtil.isEmpty(rawConfig, true) ? '' : rawConfig + '\n') + vRandomKeyPath.value + ': '
              + JSON.stringify(this.host.indexOf('localhost') >= 0 || this.host.indexOf('127.0.0.1') >= 0 ? (item.img || this.img) : random.img)

          var cb = function (url, res, err) {
            if (callback != null) {
              callback(url, res, err, random)
            }
            else {
              App.onResponse(url, res, err)
            }
          };

          try {
            this.parseRandom(
              parseJSON(JSON.stringify(json)), rawConfig, random.id
              , ! testSubList, testSubList && i >= existCount, testSubList && i >= existCount
              , function (randomName, constConfig, constJson) {

                respCount ++;

                if (testSubList) {  //在原来已上传的基础上，生成新的
                  if (which >= existCount) {
                    //异步导致顺序错乱 subs.push({
                    subs[which] = {
                      Random: {
                        id: -i - 1, //表示未上传
                        toId: random.id == null ? 1 : random.id,  // 1 为了没选择测试用例时避免用 toId 判断子项错误
                        userId: random.userId,
                        documentId: random.documentId,
                        count: 1,
                        name: randomName || 'Temp ' + i,
                        config: constConfig
                      },
                      //不再需要，因为子项里前面一部分就是已上传的，而且这样更准确，交互更直观
                      // TestRecord: {  //解决子项始终没有对比标准
                      //   id: 0, //不允许子项撤回 tr.id, //表示未上传
                      //   userId: random.userId,
                      //   documentId: random.documentId,
                      //   testAccountId: tr.testAccountId,
                      //   randomId: -i - 1,
                      //   response: tr.response,
                      //   standard: tr.standard,
                      //   date: tr.date,
                      //   compare: tr.compare
                      // }
                    // })
                    };
                  }
                }
                else {
                  if (show == true) {
                    vInput.value = JSON.stringify(constJson, null, '    ');
                    App.send(false, cb, caseScript);
                  }
                  else {
                    App.request(false, method, type, url, constJson, header, cb, caseScript);
                  }
                }

                if (testSubList && respCount >= count) {  // && which >= count - 1) {
                  if (App.currentRandomItem == null) {
                    App.currentRandomItem = {}
                  }
                  App.randomSubs = App.currentRandomItem.subs = subs
                  App.getCurrentRandomSummary().summaryType = 'total' // App.onClickSummary('total', true)
                  if (App.isRandomListShow == true) {
                    App.resetCount(item, true, false, App.currentAccountIndex)
                    item.subs = subs
                  }
                  if (respCount == count) {
                    App.testRandom(false, false, true, count, isCross, isManual, callback)
                  }
                }

              },
              preScript
            );
          }
          catch (e) {
            cb(url, {}, e)
          }

        }  // for

      },

      resetParentCount: function (item, cri, isRandom, accountIndex) {
        if (cri == null || item == null) {
          return
        }

        if (item.whiteCount == null || item.whiteCount < 0) {
          item.whiteCount = 0
        }
        if (item.greenCount == null || item.greenCount < 0) {
          item.greenCount = 0
        }
        if (item.blueCount == null || item.blueCount < 0) {
          item.blueCount = 0
        }
        if (item.orangeCount == null || item.orangeCount < 0) {
          item.orangeCount = 0
        }
        if (item.redCount == null || item.redCount < 0) {
          item.redCount = 0
        }

        if (cri.whiteCount == null) {
          cri.whiteCount = 0
        }
        if (cri.greenCount == null) {
          cri.greenCount = 0
        }
        if (cri.blueCount == null) {
          cri.blueCount = 0
        }
        if (cri.orangeCount == null) {
          cri.orangeCount = 0
        }
        if (cri.redCount == null) {
          cri.redCount = 0
        }

        cri.whiteCount -= item.whiteCount
        cri.greenCount -= item.greenCount
        cri.blueCount -= item.blueCount
        cri.orangeCount -= item.orangeCount
        cri.redCount -= item.redCount
        // cri.totalCount -= item.totalCount

        // var isTestCase = isRandom != true && item.Document != null && accountIndex < (this.accounts || []).length

        if (cri.whiteCount < 0) {
          cri.whiteCount = 0 // isTestCase ? item.whiteCount : 0
        }
        if (cri.greenCount < 0) {
          cri.greenCount = 0 // isTestCase ? item.greenCount : 0
        }
        if (cri.blueCount < 0) {
          cri.blueCount = 0 // isTestCase ? item.blueCount : 0
        }
        if (cri.orangeCount < 0) {
          cri.orangeCount = 0 // isTestCase ? item.orangeCount : 0
        }
        if (cri.redCount < 0) {
          cri.redCount = 0 // isTestCase ? item.redCount : 0
        }
        // if (cri.totalCount < 0) {
        //   cri.totalCount = 0
        // }

        cri.totalCount = cri.whiteCount + cri.greenCount + cri.blueCount + cri.orangeCount + cri.redCount
      },
      resetCount: function (item, isRandom, isSub, accountIndex) {
        if (item == null) {
          this.log('resetCount  randomItem == null >> return')
          return item
        }

        if (isRandom) {
          var cri = isSub ? this.currentRandomItem : this.currentRemoteItem
          if (cri != null && (cri != item || cri.id != item.id)) {
            this.resetParentCount(item, cri, isRandom, accountIndex)
          }

          cri = this.currentRandomItem
          if (isSub && cri != null && (cri != item || cri.id != item.id)) {
            this.resetParentCount(item, cri, isRandom, accountIndex)
          }
        }

        var accounts = this.accounts
        var num = accounts == null ? 0 : accounts.length
        if (accountIndex < num) { //  && accountIndex != this.currentAccountIndex) {
          var cs = this.getSummary(accountIndex)
          if (cs != null && (cs != item || cs.id != item.id)) {
            this.resetParentCount(item, cs, false, accountIndex)
          }
        }

        if (accountIndex < num) {
          var als = this.getAllSummary()
          // 不知道为啥总是不对
          // if (als != null && (als != item || als.id != item.id)) {
          //   this.resetParentCount(item, als, false, accountIndex)
          // }

          // 改用以下方式
          var whiteCount = 0
          var greenCount = 0
          var blueCount = 0
          var orangeCount = 0
          var redCount = 0
          // var totalCount = 0
          for (var i = -1; i < num; i++) {
            var cs = this.getSummary(i)
            if (cs == null) {
              continue
            }

            if (cs.whiteCount == null || cs.whiteCount < 0) {
              cs.whiteCount = 0
            }
            if (cs.greenCount == null || cs.greenCount < 0) {
              cs.greenCount = 0
            }
            if (cs.blueCount == null || cs.blueCount < 0) {
              cs.blueCount = 0
            }
            if (cs.orangeCount == null || cs.orangeCount < 0) {
              cs.orangeCount = 0
            }
            if (cs.redCount == null || cs.redCount < 0) {
              cs.redCount = 0
            }
            if (cs.totalCount == null || cs.totalCount < 0) {
              cs.totalCount = cs.whiteCount + cs.greenCount + cs.blueCount + cs.orangeCount + cs.redCount
            }

            whiteCount += cs.whiteCount
            greenCount += cs.greenCount
            blueCount += cs.blueCount
            orangeCount += cs.orangeCount
            redCount += cs.redCount
            // totalCount += cs.totalCount
          }

          als.whiteCount = whiteCount
          als.greenCount = greenCount
          als.blueCount = blueCount
          als.orangeCount = orangeCount
          als.redCount = redCount
          als.totalCount = whiteCount + greenCount + blueCount + orangeCount + redCount // totalCount
        }

        // var isTop = isRandom != true && item.Document == null && item.Random == null && accountIndex < (this.accounts || []).length

        item.whiteCount = 0
        item.greenCount = 0
        item.blueCount = 0
        item.orangeCount = 0
        item.redCount = 0
        item.totalCount = 0
        return item
      },

      /**参数注入，动态替换键值对
       * @param show
       * @param callback
       */
      testRandomWithText: function (show, callback) {
        try {
          var count = this.testRandomCount || 0;
          this.isRandomSubListShow = count > 1;
          this.currentRandomItem = {
            Random: {
              toId: 0, // ((this.currentRandomItem || {}).Random || {}).id || 0,
              userId: (this.User || {}).id,
              count: count,
              name: this.randomTestTitle,
              config: '', // vRandom.value
            },
            totalCount: count
          }

          this.testRandomSingle(show, false, this.isRandomSubListShow, this.currentRandomItem,
            this.isShowMethod() ? this.method : null, this.type, this.getUrl()
            , this.getRequest(vInput.value, {}), this.getHeader(vHeader.value), false, false, callback
          )
        }
        catch (e) {
          log(e)
          vSend.disabled = true

          this.view = 'error'
          this.error = {
            msg: e.message
          }

          this.isRandomShow = true
          // vRandom.select()
        }
      },

      /**
       *  与 getRandomJSON 合并，返回一个
       *  {
       *    name: 'long 1, long 2', // 自动按 type0 value0, type1, value1 格式
       *    config: {}, //const config
       *    json: {} //const json
       *  }
       */
      /**参数注入，动态替换键值对
       * @param show
       * @param callback
       */
      parseRandom: function (json, config, randomId, generateJSON, generateConfig, generateName, callback, preScript, ctx) {
        var lines = config == null ? null : config.trim().split('\n')
        if (lines == null || lines.length <= 0) {
          // return null;
          callback('', '', json);
          return
        }
        json = json || {};

        baseUrl = this.getBaseUrl();

        var reqCount = lines.length; //有无效的行  lines.length;  //等待次数
        var respCount = 0;

        randomId = randomId || 0;
        var randomNameKeys = []
        var constConfigLines = [] //TODO 改为 [{ "rawPath": "User/id", "replacePath": "User/id@", "replaceValue": "RANDOM_INT(1, 10)", "isExpression": true }] ?

        // alert('< json = ' + JSON.stringify(json, null, '    '))

        for (let i = 0; i < reqCount; i ++) {
          const which = i;
          const lineItem = lines[i] || '';

          // remove comment   // 解决整体 trim 后第一行  // 被当成正常的 key 路径而不是注释
          const commentIndex = StringUtil.trim(lineItem).startsWith('//') ? 0 : lineItem.lastIndexOf(' //'); //  -1; // eval 本身支持注释 eval('1 // test') = 1 lineItem.indexOf(' //');
          const line = commentIndex < 0 ? lineItem : lineItem.substring(0, commentIndex).trim();

          if (line.length <= 0) {
            respCount ++;
            if (i >= lines.length - 1 && respCount >= reqCount) {
              var cn = randomNameKeys.join(', ')
              if (cn.length > 50) {
                cn = cn.substring(0, 30) + ' ..' + randomNameKeys.length + '.. ' + cn.substring(cn.length - 12)
              }
              callback(cn, constConfigLines.join('\n'), json);
            }
            continue;
          }

          // path User/id  key id@
          const index = line.indexOf(': '); //APIJSON Table:alias 前面不会有空格 //致后面就接 { 'a': 1} 报错 Unexpected token ':'   lastIndexOf(': '); // indexOf(': '); 可能会有 Comment:to
          const p_k = line.substring(0, index);
          const bi = -1;  //没必要支持，用 before: undefined, after: .. 同样支持替换，反而这样导致不兼容包含空格的 key   p_k.indexOf(' ');
          const path = decodeURI(bi < 0 ? p_k : p_k.substring(0, bi)); // User/id

          const pathKeys = path.split('/')
          if (pathKeys == null || pathKeys.length <= 0) {
            throw new Error('参数注入 第 ' + (i + 1) + ' 行格式错误！\n字符 ' + path + ' 不符合 JSON 路径的格式 key0/key1/../targetKey !' +
              '\n每个随机变量配置都必须按照\n  key0/key1/../targetKey replaceKey: value  // 注释\n的格式！' +
              '\n注意冒号 ": " 左边 0 空格，右边 1 空格！其中 replaceKey 可省略。' +
              '\nkey: {} 中最外层常量对象 {} 必须用括号包裹为 ({})，也就是 key: ({}) 这种格式！' +
              '\nkey: 多行代码 必须用 function f() { var a = 1; return a; } f() 这种一行代码格式！');
          }

          const lastKeyInPath = pathKeys[pathKeys.length - 1]
          const customizeKey = bi > 0;
          const key = customizeKey ? p_k.substring(bi + 1) : lastKeyInPath;
          if (key == null || key.trim().length <= 0) {
            throw new Error('参数注入 第 ' + (i + 1) + ' 行格式错误！\n字符 ' + key + ' 不是合法的 JSON key!' +
              '\n每个随机变量配置都必须按照\n  key0/key1/../targetKey replaceKey: value  // 注释\n的格式！' +
              '\n注意冒号 ": " 左边 0 空格，右边 1 空格！其中 replaceKey 可省略。' +
              '\nkey: {} 中最外层常量对象 {} 必须用括号包裹为 ({})，也就是 key: ({}) 这种格式！' +
              '\nkey: 多行代码 必须用 function f() { var a = 1; return a; } f() 这种一行代码格式！');
          }

          // value RANDOM_DB
          const value = line.substring(index + ': '.length);

          var invoke = function (val, which, p_k, pathKeys, key, lastKeyInPath) {
            try {
              if (generateConfig) {
                var configVal;
                if (val instanceof Object) {
                  configVal = JSON.stringify(val);
                }
                else if (typeof val == 'string') {
                  configVal = '"' + val + '"';
                }
                else {
                  configVal = val;
                }
                constConfigLines[which] = p_k + ': ' + configVal;
              }

              if (generateName) {
                var s = val == undefined ? 'undefined' : (typeof val == 'string' && val != '' ? val : JSON.stringify(val)); // null 可以正常转为字符串
                if (val instanceof Array) {
                  valStr = val.length <= 1 ? s : '[' + val.length + ' .. ' + s.substring(1, s.length - 1) + ']';
                }
                else if (val instanceof Object) {
                  var kl = Object.keys(val).length;
                  valStr = kl <= 1 ? s : '{' + kl + ' .. ' + s.substring(1, s.length - 1) + '}';
                }
                else {
                  valStr = s;
                }

                if (valStr.length > 13) {
                  valStr = valStr.substring(0, 5) + '..';
                }
                randomNameKeys[which] = valStr;
              }

              if (generateJSON) {
                //先按照单行简单实现
                //替换 JSON 里的键值对 key: value
                var parent = json;
                var current = null;
                for (var j = 0; j < pathKeys.length - 1; j ++) {
                  current = parent[pathKeys[j]]
                  if (current == null) {
                    current = parent[pathKeys[j]] = {}
                  }
                  if (parent instanceof Object == false) {
                    throw new Error('参数注入 第 ' + (i + 1) + ' 行格式错误！路径 ' + path + ' 中' +
                      ' pathKeys[' + j + '] = ' + pathKeys[j] + ' 在实际请求 JSON 内对应的值不是对象 {} 或 数组 [] !');
                  }
                  parent = current;
                }

                if (current == null) {
                  current = json;
                }
                // alert('< current = ' + JSON.stringify(current, null, '    '))

                if (key != lastKeyInPath || current.hasOwnProperty(key) == false) {
                  delete current[lastKeyInPath];
                }

                current[key] = val;
              }

            }
            catch (e) {
              throw new Error('第 ' + (which + 1) + ' 行随机配置 key: value 后的 value 不合法！ \nerr: ' + e.message)
            }

            respCount ++;
            if (respCount >= reqCount) {
              var cn = randomNameKeys.join(', ')
              if (cn.length > 50) {
                cn = cn.substring(0, 30) + ' ..' + randomNameKeys.length + '.. ' + cn.substring(cn.length - 12)
              }
              callback(cn, constConfigLines.join('\n'), json);
            }
          };


          const start = value.indexOf('(');
          const end = value.lastIndexOf(')');

          var request4Db = function(tableName, which, p_k, pathKeys, key, lastKeyInPath, isRandom, isDesc, step) {
            // const tableName = JSONResponse.getTableName(pathKeys[pathKeys.length - 2]);
            vOutput.value = 'requesting value for ' + tableName + '/' + key + ' from database...';

            const args = StringUtil.split(value.substring(start + 1, end)) || [];
            var min = StringUtil.trim(args[0]);
            var max = StringUtil.trim(args[1]);
            var table = StringUtil.trim(args[2]) || '';
            var column = StringUtil.trim(args[3]) || '';

            min = min == '' || min == 'null' || min == 'undefined' ? null : +min;
            max = max == '' || max == 'null' || max == 'undefined' ? null : +max;

            if ((table.startsWith('"') && table.endsWith('"')) || (table.startsWith("'") && table.endsWith("'"))) {
              table = table.substring(1, table.length - 1);
            }
            if ((column.startsWith('"') && column.endsWith('"')) || (column.startsWith("'") && column.endsWith("'"))) {
              column = column.substring(1, column.length - 1);
            }

            const finalTableName = StringUtil.isEmpty(table, true) ? tableName : table;
            const finalColumnName = StringUtil.isEmpty(column, true) ? lastKeyInPath : column;

            const tableReq = {
              '@column': isRandom ? finalColumnName : ('DISTINCT ' + finalColumnName),
              '@order': isRandom ? 'rand()' : (finalColumnName + (isDesc ? '-' : '+'))
            };
            tableReq[finalColumnName + '>='] = min;
            tableReq[finalColumnName + '<='] = max;

            const req = {};
            const listName = isRandom ? null : finalTableName + '-' + finalColumnName + '[]';
            const orderIndex = isRandom ? null : getOrderIndex(randomId, line, null)

            if (isRandom) {
              req[finalTableName] = tableReq;
            }
            else {
              // 从数据库获取时不考虑边界，不会在越界后自动循环
              var listReq = {
                count: 1, // count <= 100 ? count : 0,
                page: (step*orderIndex) % 100  //暂时先这样，APIJSON 应该改为 count*page <= 10000  //FIXME 上限 100 怎么破，lastKeyInPath 未必是 id
              };
              listReq[finalTableName] = tableReq;
              req[listName] = listReq;
            }

            // reqCount ++;
            App.request(true, REQUEST_TYPE_POST, REQUEST_TYPE_JSON, baseUrl + '/get', req, {}, function (url, res, err) {
              // respCount ++;
              try {
                App.onResponse(url, res, err)
              } catch (e) {}

              var data = (res || {}).data || {}
              if (JSONResponse.isSuccess(data) != true) {
                respCount = -reqCount;
                vOutput.value = '参数注入 为第 ' + (which + 1) + ' 行\n  ' + p_k + '  \n获取数据库数据 异常：\n' + data.msg;
                alert(StringUtil.get(vOutput.value));
                return
                // throw new Error('参数注入 为\n  ' + tableName + '/' + key + '  \n获取数据库数据 异常：\n' + data.msg)
              }

              if (isRandom) {
                invoke((data[finalTableName] || {})[finalColumnName], which, p_k, pathKeys, key, lastKeyInPath);
              }
              else {
                var val = (data[listName] || [])[0];
                //越界，重新获取
                if (val == null && orderIndex > 0 && ORDER_MAP[randomId] != null && ORDER_MAP[randomId][line] != null) {
                  ORDER_MAP[randomId][line] = null;  //重置，避免还是在原来基础上叠加
                  request4Db(JSONResponse.getTableName(pathKeys[pathKeys.length - 2]), which, p_k, pathKeys, key, lastKeyInPath, false, isDesc, step);
                }
                else {
                  invoke(val, which, p_k, pathKeys, key, lastKeyInPath);
                }
              }

              // var list = data[listName] || [];
              //代码变化会导致缓存失效，而且不好判断，数据量大会导致页面很卡 ORDER_MAP[randomId][line].list = list;
              //
              // if (step == null) {
              //   invoke('randomIn(' + list.join() + ')');
              // }
              // else {
              //   invoke('orderIn(' + isDesc + ', ' + step*getOrderIndex(randomId, line, list.length) + list.join() + ')');
              // }

            })
          };



          //支持 1, "a" 这种原始值
          // if (start < 0 || end <= start) {  //(1) 表示原始值  start*end <= 0 || start >= end) {
          //   throw new Error('参数注入 第 ' + (i + 1) + ' 行格式错误！字符 ' + value + ' 不是合法的随机函数!');
          // }

          var toEval = value;
          if (start > 0 && end > start) {

            var funWithOrder = value.substring(0, start);
            var splitIndex = funWithOrder.indexOf('+');

            var isDesc = false;
            if (splitIndex < 0) {  // -(1+2) 这种是表达式，不能作为函数   splitIndex <= 0) {
              splitIndex = funWithOrder.indexOf('-');
              isDesc = splitIndex > 0;
            }

            var fun = splitIndex < 0 ? funWithOrder : funWithOrder.substring(0, splitIndex);

            if (fun.startsWith('ORDER_') && /^[_A-Z]+$/g.test(fun)) { // [ORDER_DB, ORDER_IN, ORDER_INT].indexOf(fun) >= 0) {  //顺序函数
              var stepStr = splitIndex < 0 ? null : funWithOrder.substring(splitIndex + 1, funWithOrder.length);
              var step = stepStr == null || stepStr.length <= 0 ? 1 : +stepStr; //都会自动忽略空格 Number(stepStr); //Number.parseInt(stepStr); //+stepStr;

              if (Number.isSafeInteger(step) != true || step <= 0
                || (StringUtil.isEmpty(stepStr, false) != true && StringUtil.isNumber(stepStr) != true)
              ) {
                throw new Error('参数注入 第 ' + (i + 1) + ' 行格式错误！路径 ' + path + ' 中字符 ' + stepStr + ' 不符合跨步 step 格式！'
                  + '\n顺序整数 和 顺序取值 可以通过以下格式配置 升降序 和 跨步：'
                  + '\n  ORDER_DB+step(arg0, arg1...)\n  ORDER_DB-step(arg0, arg1...)'
                  + '\n  ORDER_INT+step(arg0, arg1...)\n  ORDER_INT-step(arg0, arg1...)'
                  + '\n  ORDER_IN+step(start, end)\n  ORDER_IN-step(start, end)'
                  + '\n其中：\n  + 为升序，后面没有 step 时可省略；\n  - 为降序，不可省略；' + '\n  step 为跨步值，类型为 正整数，默认为 1，可省略。'
                  + '\n+，-，step 前后都不能有空格等其它字符！');
              }

              if (fun == ORDER_DB) {
                request4Db(JSONResponse.getTableName(pathKeys[pathKeys.length - 2]), which, p_k, pathKeys, key, lastKeyInPath, false, isDesc, step); //request4Db(key + (isDesc ? '-' : '+'), step);
                continue;
              }

              var args = StringUtil.split(value.substring(start + 1, end))

              toEval = (fun == ORDER_IN ? 'orderIn' : (fun == ORDER_INT ? 'orderInt' : (fun == ORDER_BAD_BOOL ? 'orderBadBool' : (fun == ORDER_BAD_NUM
               ? 'orderBadNum' : (fun == ORDER_BAD_STR ? 'orderBadStr' : (fun == ORDER_BAD_ARR ? 'orderBadArr' : (fun == ORDER_BAD_OBJ ? 'orderBadObj' : 'orderBad')))))))
                + '(' + (fun == ORDER_BAD ? 'BADS, ' : '') + isDesc + ', ' + getOrderIndex(
                  randomId, line
                  , (fun == ORDER_INT || args == null ? 0 : args.length)
                  + (fun == ORDER_BAD_BOOL ? BAD_BOOLS.length : (fun == ORDER_BAD_NUM ? BAD_NUMS.length : (fun == ORDER_BAD_STR
                   ? BAD_STRS.length : (fun == ORDER_BAD_ARR ? BAD_ARRS.length : (fun == ORDER_BAD_OBJ ? BAD_OBJS.length : (fun == ORDER_BAD ? BADS.length : 0))))))
                  , step
                ) + ', ' + value.substring(start + 1);
            }
            else {  //随机函数
              if (fun == PRE_REQ) {
                toEval = 'get4Path(((ctx || {}).pre || {}).req, ' + (value == 'PRE_REQ()' ? JSON.stringify(path) : '') + value.substring(start + 1);
              }
              else if (fun == PRE_ARG) {
                toEval = 'get4Path(((ctx || {}).pre || {}).arg, ' + (value == 'PRE_ARG()' ? JSON.stringify(path) : '') + value.substring(start + 1);
              }
              else if (fun == PRE_RES) {
                toEval = 'get4Path(((ctx || {}).pre || {}).res, ' + (value == 'PRE_RES()' ? JSON.stringify(path) : '') + value.substring(start + 1);
              }
              else if (fun == PRE_DATA) {
                toEval = 'get4Path(((ctx || {}).pre || {}).data, ' + (value == 'PRE_DATA()' ? JSON.stringify(path) : '') + value.substring(start + 1);
              }
              else if (fun == CTX_GET) {
                toEval = 'get4Path((ctx || {}).ctx, ' + (value == 'CTX_GET()' ? JSON.stringify(path) : '') + value.substring(start + 1);
              }
              else if (fun == CTX_PUT) {
                var as = StringUtil.split(value.substring(start + 1, end), ', ') || []
                if (as.length >= 2) {
                  as[1] = 'get4Path(((ctx || {}).pre || {}).data, ' + StringUtil.trim(as[1]) + ')'
                }
                toEval = 'put4Path((ctx || {}).ctx, ' + (value == 'CTX_PUT()' ? JSON.stringify(path) : '') + as.join(', ') + value.substring(end);
              }
              else if (fun == CUR_REQ) {
                toEval = 'get4Path(((ctx || {}).cur || {}).req, ' + (value == 'CUR_REQ()' ? JSON.stringify(path) : '') + value.substring(start + 1);
              }
              else if (fun == CUR_ARG) {
                toEval = 'get4Path(((ctx || {}).cur || {}).arg, ' + (value == 'CUR_ARG()' ? JSON.stringify(path) : '') + value.substring(start + 1);
              }
              else if (fun == CUR_RES) {
                toEval = 'get4Path(((ctx || {}).cur || {}).res, ' + (value == 'CUR_RES()' ? JSON.stringify(path) : '') + value.substring(start + 1);
              }
              else if (fun == CUR_DATA) {
                toEval = 'get4Path(((ctx || {}).cur || {}).data, ' + (value == 'CUR_DATA()' ? JSON.stringify(path) : '') + value.substring(start + 1);
              }
              else {
                  fun = funWithOrder;  //还原，其它函数不支持 升降序和跨步！

                  if (fun == RANDOM_DB) {
                    request4Db(JSONResponse.getTableName(pathKeys[pathKeys.length - 2]), which, p_k, pathKeys, key, lastKeyInPath, true); //'random()');
                    continue;
                  }

                  if (fun == RANDOM_IN) {
                    toEval = 'randomIn' + value.substring(start);
                  }
                  else if (fun == RANDOM_INT) {
                    toEval = 'randomInt' + value.substring(start);
                  }
                  else if (fun == RANDOM_NUM) {
                    toEval = 'randomNum' + value.substring(start);
                  }
                  else if (fun == RANDOM_STR) {
                    toEval = 'randomStr' + value.substring(start);
                  }
                  else if (fun == RANDOM_BAD) {
                    toEval = 'randomBad' + value.substring(start);
                  }
                  else if (fun == RANDOM_BAD_BOOL) {
                    toEval = 'randomBadBool' + value.substring(start);
                  }
                  else if (fun == RANDOM_BAD_NUM) {
                    toEval = 'randomBadNum' + value.substring(start);
                  }
                  else if (fun == RANDOM_BAD_STR) {
                    toEval = 'randomBadStr' + value.substring(start);
                  }
                  else if (fun == RANDOM_BAD_ARR) {
                    toEval = 'randomBadArr' + value.substring(start);
                  }
                  else if (fun == RANDOM_BAD_OBJ) {
                    toEval = 'randomBadObj' + value.substring(start);
                  }
              }

            }

          }

          var isInject = true;
          var isPre = false; // 避免执行副作用代码 true;
          var isTest = false;
          var method = null;
          var type = null;
          var url = null;
          var req = null;
          var header = null;
          var res = {};
          var data = res.data;
          var err = null;
          invoke(eval(StringUtil.trim(preScript) + '\n;\n(' + toEval + ')'), which, p_k, pathKeys, key, lastKeyInPath);

          // alert('> current = ' + JSON.stringify(current, null, '    '))
        }

      },

      moveSplit: function (rate) {
        // 自动往右移动，避免断言结果遮挡太多接口名称、URL
        rate = rate || 0.4;

        var split_obj = IS_BROWSER ? $('.splitx') : null
        var split_obj_left = split_obj == null ? 0 : parseInt(split_obj.css('left'))
        var width = split_obj_left <= 0 ? 0 : (window.innerWidth || 1280)
        if (width > 0) {
          var w = rate*width;
          // 构造事件比较麻烦，即便用 JQuery 也是
          // split_obj[0].dispatchEvent(new TouchEvent('', new class implements TouchEventInit{
          //   clientX: w
          // }()))

          var left_ele = $('.side-left')
          var right_ele = $('.side-right')

          // var left_width = left_ele.width()
          // var right_width = right_ele.width()
          //
          // var right_left = parseInt(right_ele.css('left'))

          split_obj.css('left', w)
          left_ele.width(w);
          right_ele.width(width - w).css('left', w);
          // right_ele.width(right_width - left_ele.width() + left_width).css('left', right_left + left_ele.width() - left_width);
        }
      },

      onClickSend: function () {
        this.isRandomTest = false
        this.send(false)
      },
      onClickTest: function (callback) {
        this.isRandomTest = false
        this.isStatisticsEnabled = true
        this.reportId = new Date().getTime()
        this.caseShowType = 1

        this.moveSplit(0.6)

        var isCross = this.isCrossEnabled
        var accountIndex = isCross ? -1 : this.currentAccountIndex

        var accounts = this.accounts
        var num = accounts == null ? 0 : accounts.length

        var cases = this.isChainShow ? this.chainGroups : this.remotes
        var total = cases == null ? 0 : cases.length

        var als = this.getAllSummary()
        als = this.resetCount(als, false, false, num)
        als.totalCount = isCross ? (num + 1)*total : total

        if (isCross) {
          for (var i = -1; i < num; i++) {
            var cs = this.getSummary(i)
            cs = this.resetCount(cs, false, false, i)
            cs.totalCount = total
          }
        } else {
          var cs = this.getSummary(accountIndex)
          cs = this.resetCount(cs, false, false, accountIndex)
          cs.totalCount = total
        }

        this.coverage = {}
        this.request(false, REQUEST_TYPE_POST, REQUEST_TYPE_JSON, this.getBaseUrl() + '/coverage/start', {}, {}, function (url, res, err) {
          try {
            App.onResponse(url, res, err)
            if (DEBUG) {
              App.log('test  App.request >> res.data = ' + JSON.stringify(res.data, null, '  '))
            }
          } catch (e) {
            App.log('test  App.request >> } catch (e) {\n' + e.message)
          }
          App.test(false, accountIndex, isCross, callback)
        })
      },
      /**回归测试
       * 原理：
       1.遍历所有上传过的测试用例（URL+请求JSON）
       2.逐个发送请求
       3.对比同一用例的先后两次请求结果，如果不一致，就在列表中标记对应的用例(× 蓝黄红色下载(点击下载两个文件) √)。
       4.如果这次请求结果正确，就把请求结果保存到和公司开发环境服务器的APIJSON Server，并取消标记

       compare: 新的请求与上次请求的对比结果
       0-相同，无颜色；
       1-对象新增字段或数组新增值，绿色；
       2-值改变，蓝色；
       3-对象缺少字段/整数变小数，黄色；
       4-code/值类型 改变，红色；
       */
      test: function (isRandom, accountIndex, isCross, callback) {
        var accounts = this.accounts || []
        // alert('test  accountIndex = ' + accountIndex)
        if (accountIndex == null) {
          accountIndex = -1 //isCross ? -1 : 0
        }

        if (isCross) {
          var isCrossDone = accountIndex >= accounts.length
          this.crossProcess = isCrossDone ? '交叉账号:已开启' : ('交叉账号: ' + (accountIndex + 1) + '/' + accounts.length)
          if (isCrossDone) {
            this.testProcess = (this.isMLEnabled ? '机器学习:已开启' : '机器学习:已关闭')
            this.testRandomProcess = ''
            if (accountIndex == accounts.length) {
              this.currentAccountIndex = accounts.length - 1  // -1 导致最后右侧显示空对象

              if (callback) {
                callback('已完成账号交叉测试: 退出登录状态 和 每个账号登录状态')
              } else {
                alert('已完成账号交叉测试: 退出登录状态 和 每个账号登录状态')
              }

              if (callback != this.autoTestCallback && typeof this.autoTestCallback == 'function') {
                this.autoTestCallback('已完成账号交叉测试: 退出登录状态 和 每个账号登录状态')
              }
            }
            return
          }

          if (callback != this.autoTestCallback && typeof this.autoTestCallback == 'function') {
            this.autoTestCallback('正在账号交叉测试 ')
          }
        }

        var baseUrl = StringUtil.trim(this.getBaseUrl())
        if (baseUrl == '') {
          if (callback) {
            callback('请先输入有效的URL！')
          } else {
            alert('请先输入有效的URL！')
          }
          return
        }
        //开放测试
        // if (baseUrl.indexOf('/apijson.cn') >= 0 || baseUrl.indexOf('/39.108.143.172') >= 0) {
        //   alert('请把URL改成你自己的！\n例如 http://localhost:8080')
        //   return
        // }
        // if (baseUrl.indexOf('/apijson.org') >= 0) {
        //   alert('请把URL改成 http://apijson.cn:8080 或 你自己的！\n例如 http://localhost:8080')
        //   return
        // }

        const list = (isRandom ? this.randoms : (this.isChainShow ? (
            this.isChainGroupShow() ? this.chainGroups : [this.chainGroups[this.currentChainGroupIndex]]
          ) : this.remotes)
        ) || []

        var allCount = list.length
        App.doneCount = 0
        App.deepAllCount = 0
        App.randomDoneCount = 0
        if (isRandom != true) {
          App.allCount = allCount
        }

        // var cs = this.getSummary(accountIndex)
        // if (isCross && cs.totalCount <= 0) {
        //   cs = this.resetCount(cs)
        //   cs.totalCount = allCount
        // }
        //
        // var als = this.getAllSummary()
        // if (als.totalCount <= 0) {
        //   als = this.resetCount(als)
        //   als.totalCount = allCount
        // }

        if (allCount <= 0) {
          if (callback) {
            callback('请先获取测试用例文档\n点击[查看用例列表]图标按钮')
          } else {
            alert('请先获取测试用例文档\n点击[查看用例列表]图标按钮')
          }
          return
        }

        if (this.isChainShow) {
            for (var i = 0; i < list.length; i++) {
                var item = list[i]
                var stepList = item['[]'] || []
                var stepCount = stepList == null ? 0 : stepList.length
                allCount += (stepCount - 1)
            }
        }

        if (isCross) {
          if (accountIndex < 0 && accounts[this.currentAccountIndex] != null) {  //退出登录已登录的账号
            accounts[this.currentAccountIndex].isLoggedIn = true
          }
          var index = accountIndex < 0 ? this.currentAccountIndex : accountIndex
          this.onClickAccount(index, accounts[index], function (isLoggedIn, index, err) {
            // if (index >= 0 && isLoggedIn == false) {
            //   alert('第 ' + index + ' 个账号登录失败！' + (err == null ? '' : err.message))
            //   App.test(isRandom, accountIndex + 1)
            //   return
            // }
            App.showTestCase(true, false)
            App.startTest(list, allCount, isRandom, accountIndex, isCross, callback)
          })
        }
        else {
          this.startTest(list, allCount, isRandom, accountIndex, isCross, callback)
        }
      },

      startTestChain: function (list, allCount, index, item, prev, ctx, isRandom, accountIndex, isCross, callback) {
         if (list == null || index == null || index >= list.length) {
           return
         }

         var cur = item = item || {}
         cur.index = index
//         item.pre = pre // list[index - 1]

         var doc = item.Document || {}
         var method = cur.method = doc.method
         var type = cur.type = doc.type
         var url = cur.url = doc.url
         var json = cur.arg = this.getRequest(doc.request, {})
         var req = cur.req = {
           method: method,
           url: url,
           header: doc.header,
           data: json
         }
         var header = cur.header = doc.header
//
//         this.parseRandom(json, rawConfig, random.id, true, false, function (randomName, constConfig, constJson) {
             this.startTestSingle(list, allCount, index, item, isRandom, accountIndex, isCross, callback
               , function(res, allCount, list, index, response, cmp, isRandom, accountIndex, justRecoverTest, isCross) {

               res = res || {}
               var config = res.config || {}
               cur.arg = App.getRequest(config.data || config.params, {})
               cur.req = {
                 method: method,
                 url: config.url,
                 header: config.header,
                 arg: cur.arg
               }
               cur.status = res.status
               cur.statusText = res.statusText
               cur.res = res
               cur.data = res.data
               App.startTestChain(list, allCount, index + 1, list[index + 1], item, ctx, isRandom, accountIndex, isCross, callback)
             }, ctx)
             return true
//         })
      },

      isFullAssert: true,
      toTestDocIndexes: [],

      startTest: function (list, allCount, isRandom, accountIndex, isCross, callback) {
        this.testProcess = '正在测试: ' + 0 + '/' + allCount
        this.toTestDocIndexes = []

        if (callback != this.autoTestCallback && typeof this.autoTestCallback == 'function') {
          this.autoTestCallback(this.testProcess)
        }

        var isChainShow = this.isChainShow
        baseUrl = StringUtil.trim(this.getBaseUrl())

        for (var i = 0; i < list.length; i++) {
            const item = list[i]
            if (isChainShow) {
//               this.showTestCase(true, false, function(url, res, err) {
                  var stepList = item['[]'] // res.data['[]']
                  var stepCount = stepList == null ? 0 : stepList.length
                  this.startTestChain(stepList, stepCount, 0, stepCount <= 0 ? null : stepList[0], null, { Chain: item }, isRandom, accountIndex, isCross, callback)
//               }, item)
               continue
            }

            this.startTestSingle(list, allCount, i, item, isRandom, accountIndex, isCross, callback)
        }
      },

      startTestSingle: function (list, allCount, index, item, isRandom, accountIndex, isCross, callback, singleCallback, ctx) {
          this.isFullAssert = false
          try {
            const isMLEnabled = this.isMLEnabled
            const standardKey = isMLEnabled != true ? 'response' : 'standard'

            const otherEnv = this.otherEnv;
            const otherBaseUrl = this.isEnvCompareEnabled && StringUtil.isNotEmpty(otherEnv, true) ? this.getBaseUrl(otherEnv) : null
            const isEnvCompare = StringUtil.isNotEmpty(otherBaseUrl, true) // 对比自己也行，看看前后两次是否幂等  && otherBaseUrl != baseUrl

            const document = item == null ? null : item.Document
            if (document == null || document.name == null) {
              if (isRandom) {
                App.randomDoneCount ++
              } else {
                App.doneCount ++
              }

              return
            }
            if (document.url == '/login' || document.url == '/logout') { //login会导致登录用户改变为默认的但UI上还显示原来的，单独测试OWNER权限时能通过很困惑
              this.log('startTestSingle  document.url == "/login" || document.url == "/logout" >> continue')
              if (isRandom) {
                App.randomDoneCount ++
              } else {
                App.doneCount ++
              }

              return
            }

            if (DEBUG) {
              this.log('startTestSingle  document = ' + JSON.stringify(document, null, '  '))
            }

            var hdr = null
            try {
              hdr = this.getHeader(document.header)
            } catch (e) {
              this.log('startTestSingle try { header = this.getHeader(document.header) } catch (e) { \n' + e.message)
            }
            const header = hdr

            const caseScript = {
              pre: (item['Script:pre'] || {}),
              post: (item['Script:post'] || {})
            }

            const method = document.method
            const type = document.type
            const req = this.getRequest(document.request, null, true)
            const otherEnvUrl = isEnvCompare ? (otherBaseUrl + document.url) : null
            const curEnvUrl = baseUrl + document.url
            const cur = item
            const pre = list[index - 1] || {} // item.pre = item.pre || list[index - 1] || {}
//            const ctx = item.ctx = item.ctx || {}

            var random = item.Random || {}
            this.parseRandom(req, random.config, random.id, true, false, false, function(randomName, constConfig, constJson) {
                App.request(false, method, type, isEnvCompare ? otherEnvUrl : curEnvUrl, constJson, header, function (url, res, err) {
                  try {
                    App.onResponse(url, res, err)
                    if (DEBUG) {
                      App.log('startTestSingle  App.request >> res.data = ' + JSON.stringify(res.data, null, '  '))
                    }
                  } catch (e) {
                    App.log('startTestSingle  App.request >> } catch (e) {\n' + e.message)
                  }

                  if (isEnvCompare != true) {
                    App.compareResponse(res, allCount, list, index, item, res.data, isRandom, accountIndex, false, err, null, isCross, callback, singleCallback)
                    return
                  }

                  const otherErr = err
                  const rsp = App.removeDebugInfo(res.data)
                  const rspStr = JSON.stringify(rsp)
                  const tr = item.TestRecord || {}
                  if (isMLEnabled) {
                    tr.response = rspStr
                  }
                  tr[standardKey] = isMLEnabled ? JSON.stringify(JSONResponse.updateFullStandard({}, rsp, isMLEnabled)) : rspStr // res.data
                  item.TestRecord = tr

                  App.request(false, method, type, curEnvUrl, constJson, header, function (url, res, err) {
                    try {
                      App.onResponse(url, res, err)
                      if (DEBUG) {
                        App.log('startTestSingle  App.request >> res.data = ' + JSON.stringify(res.data, null, '  '))
                      }
                    } catch (e) {
                      App.log('startTestSingle  App.request >> } catch (e) {\n' + e.message)
                    }

                    App.compareResponse(res, allCount, list, index, item, res.data, isRandom, accountIndex, false, err || otherErr, null, isCross, callback, singleCallback)
                  }, caseScript)

                }, caseScript)
            }, (caseScript.pre || {}).script, {
                list: list,
                allCount: allCount,
                index: index,
                cur: cur,
                pre: pre,
                ctx: ctx
            })
          }
          catch(e) {
            this.compareResponse(null, allCount, list, index, item, null, isRandom, accountIndex, false, e, null, isCross, callback, singleCallback)
          }

      },

      compareResponse: function (res, allCount, list, index, item, response, isRandom, accountIndex, justRecoverTest, err, ignoreTrend, isCross, callback, singleCallback) {
        var it = item || {} //请求异步
        var cri = this.currentRemoteItem || {} //请求异步
        var d = (isRandom ? cri.Document : it.Document) || {} //请求异步
        var r = it.Random || {} // isRandom ? it.Random : null //请求异步
        var tr = it.TestRecord || {} //请求异步

        var bdt = tr.duration || 0
        it.durationBeforeShowStr = bdt <= 0 ? '' : (bdt < 1000 ? bdt + 'ms' : (bdt < 1000*60 ? (bdt/1000).toFixed(1) + 's' : (bdt <= 1000*60*60 ? (bdt/1000/60).toFixed(1) + 'm' : '>1h')))
        try {
          var durationInfo = response == null ? null : response['time:start|duration|end|parse|sql']
          it.durationInfo = durationInfo
          if (durationInfo == null) {
            throw new Error("response['time:start|duration|end|parse|sql'] is null!");
          }

          var di = durationInfo.substring(durationInfo.indexOf('|') + 1)
          it.duration = di.substring(0, di.indexOf('|') || di.length) || 0
          var dt = + it.duration
          it.duration = dt
          it.durationShowStr = dt <= 0 ? '' : (dt < 1000 ? dt + 'ms' : (dt < 1000*60 ? (dt/1000).toFixed(1) + 's' : (dt <= 1000*60*60 ? (dt/1000/60).toFixed(1) + 'm' : '>1h')))
          var min = tr.minDuration == null || tr.minDuration <= 0 ? 20 : tr.minDuration
          var max = tr.maxDuration == null || tr.maxDuration <= 0 ? 200 : tr.maxDuration
          it.durationColor = dt < min ? 'green' : (dt > 2*max ? 'red' : (dt > max + min ? 'orange' : (dt > max ? 'blue' : 'black')))
          it.durationHint = dt < min ? '很快：比以往 [' + min + 'ms, ' + max + 'ms] 最快还更快' : (dt > 2*max ? '非常慢：比以往 [' + min + 'ms, ' + max + 'ms] 最慢的两倍还更慢'
            : (dt > max + min ? '比较慢：比以往 [' + min + 'ms, ' + max + 'ms] 最快与最慢之和(平均值两倍)还更慢'
              : (dt > max ? '有点慢：比以往 [' + min + 'ms, ' + max + 'ms] 最慢还更慢' : '正常：在以往 [' + min + 'ms, ' + max + 'ms] 最快和最慢之间')))
        }
        catch (e) {
          // log(e)
          it.durationShowStr = it.durationShowStr || it.duration
          it.durationHint = it.durationHint || '最外层缺少字段 "time:start|duration|end|parse|sql"，无法对比耗时'
        }

        if (err != null) {
          var status = res == null ? null : res.status
          var rsp = (err.response || {}).data || {}
          tr.compare = {
            code: JSONResponse.COMPARE_ERROR, //请求出错
            msg: StringUtil.trim(StringUtil.trim(rsp.code) + ' ' + StringUtil.trim(rsp.message || rsp.reason)) || err.message || '请求出错！',
            path: (status != null && status != 200 ? status + ' ' : '') + err.message
          }
        }
        else {
          var isML = this.isMLEnabled
          var standardKey = isML ? 'standard' : 'response'
          var stdd = tr[standardKey]
          if (isRandom) {
            stdd = stdd || ((this.currentRemoteItem || {}).TestRecord || {})[standardKey]
          }

          var standard = typeof stdd != 'string' ? stdd : (StringUtil.isEmpty(stdd, true) ? null : parseJSON(stdd))
          tr.compare = JSONResponse.compareResponse(res, standard, this.removeDebugInfo(response) || {}, '', isML, null, null, ignoreTrend) || {}
          tr.compare.duration = it.durationHint
        }

        this.onTestResponse(res, allCount, list, index, it, d, r, tr, response, tr.compare || {}, isRandom, accountIndex, justRecoverTest, isCross, callback, singleCallback);
      },

      onTestResponse: function(res, allCount, list, index, it, d, r, tr, response, cmp, isRandom, accountIndex, justRecoverTest, isCross, callback, singleCallback) {
        this.isFullAssert = false
        tr = tr || {}
        cmp = cmp || {}
        tr.compare = cmp
        var status = res == null ? null : res.status

        it = it || {}
        var p = cmp.path
        it.compareType = cmp.code;
        it.compareMessage = (StringUtil.isEmpty(p, true) ? '' : p + '  ') + (cmp.msg || '查看结果')
        switch (it.compareType) {
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

        if (isRandom) {
          r = r || {}
          it.Random = r

          this.updateToRandomSummary(it, 1, accountIndex)
        }
        else {
          d = d || {}
          it.Document = d

          this.updateToSummary(it, 1, accountIndex)
        }
        it.TestRecord = tr

        Vue.set(list, index, it)

        if (justRecoverTest) {
          // callback(isRandom, allCount)
          return
        }

        if (isRandom) {
          App.randomDoneCount ++
        } else {
          App.doneCount ++
        }

        var doneCount = isRandom ? App.randomDoneCount : App.doneCount
        if (isRandom) {
          this.testRandomProcess = doneCount >= allCount ? '' : ('正在测试: ' + doneCount + '/' + allCount)
        } else {
          this.testProcess = doneCount >= allCount ? (this.isMLEnabled ? '机器学习:已开启' : '机器学习:已关闭') : '正在测试: ' + doneCount + '/' + allCount
        }

        if (doneCount < allCount && callback != this.autoTestCallback && typeof this.autoTestCallback == 'function') {
          this.autoTestCallback('正在测试')
        }

        this.log('doneCount = ' + doneCount + '; d.name = ' + (isRandom ? r.name : d.name) + '; it.compareType = ' + it.compareType)

        var documentId = isRandom ? r.documentId : d.id
        if (this.tests == null) {
          this.tests = {}
        }

        var accountIndexStr = String(accountIndex)
        if (this.tests[accountIndexStr] == null) {
          this.tests[accountIndexStr] = {}
        }

        var tests = this.tests[accountIndexStr] || {}
        var t = tests[documentId]
        if (t == null) {
          t = tests[documentId] = {}
        }
        t[isRandom ? (r.id > 0 ? r.id : (r.toId + '' + r.id)) : 0] = response

        if (isRandom != true && it.compareColor != 'red') {
          if (this.toTestDocIndexes == null) {
            this.toTestDocIndexes = []
          }
          this.toTestDocIndexes.push(index);
        }

        this.tests[accountIndexStr] = tests
        if (DEBUG) {
          this.log('tests = ' + JSON.stringify(tests, null, '    '))
        }
        // this.showTestCase(true)

        if (singleCallback != null && singleCallback(res, allCount, list, index, response, cmp, isRandom, accountIndex, justRecoverTest, isCross)) {
           return
        }

        if (doneCount >= allCount) {  // 导致不继续测试  App.doneCount == allCount) {
          if (callback != null && callback(isRandom, allCount)) {
            return
          }

          // alert('onTestResponse  accountIndex = ' + accountIndex)

          const deepAllCount = this.toTestDocIndexes == null ? 0 : this.toTestDocIndexes.length
          App.deepAllCount = deepAllCount
          if (isRandom != true && deepAllCount > 0 && ! this.isChainShow) { // 自动给非 红色 报错的接口跑参数注入
            App.deepDoneCount = 0;
            this.startRandomTest4Doc(list, this.toTestDocIndexes, 0, deepAllCount, accountIndex, isCross)
          } else if (isCross && doneCount == allCount && accountIndex <= this.accounts.length) {
            this.test(false, accountIndex + 1, isCross)
          }
        }
      },

      startRandomTest4Doc: function (list, indexes, position, deepAllCount, accountIndex, isCross) {
        const accInd = accountIndex
        var callback = function (isRandom, allCount, msg) {
          log("startRandomTest4Doc  callback isRandom = " + isRandom + "; allCount = " + allCount + "; msg = " + msg)
          if (App.randomDoneCount < App.randomAllCount) {
            return true
          }

          App.randomDoneCount = App.randomAllCount

          App.deepDoneCount ++
          const deepDoneCount = App.deepDoneCount
          const autoTestCallback = App.autoTestCallback

          App.testProcess = deepDoneCount < deepAllCount ? ('正在深度测试: ' + deepDoneCount + '/' + deepAllCount) : (App.isMLEnabled ? '机器学习:已开启' : '机器学习:已关闭')
          App.testRandomProcess = App.randomDoneCount >= App.randomAllCount ? '' : ('正在测试: ' + App.randomDoneCount + '/' + App.randomAllCount)

          setTimeout(function () {
            App.isTestCaseShow = true

            if (typeof autoTestCallback == 'function') {
              autoTestCallback('正在深度测试')
            }

            if (deepDoneCount < deepAllCount) {
              setTimeout(function () {
                App.startRandomTest4Doc(list, indexes, position + 1, deepAllCount, accInd, isCross)
              }, IS_NODE ? 200 : 1000)
            } else {
              App.testRandomProcess = ''
              if (isCross) {
                if (deepDoneCount == deepAllCount) {
                  App.test(false, accInd + 1, isCross)
                }
              } else {
                if (deepDoneCount == deepAllCount) {
                  alert('已完成回归测试')
                  if (typeof autoTestCallback == 'function') {
                    autoTestCallback('已完成回归测试')
                  }

                  App.request(false, REQUEST_TYPE_POST, REQUEST_TYPE_JSON, App.getBaseUrl() + '/coverage/report', {}, {}, function (url, res, err) {
                    try {
                      App.onResponse(url, res, err)
                      if (DEBUG) {
                        App.log('test  App.request >> res.data = ' + JSON.stringify(res.data, null, '  '))
                      }
                    } catch (e) {
                      App.log('test  App.request >> } catch (e) {\n' + e.message)
                    }

                    App.coverage = res.data
                    if (IS_BROWSER) {
                      setTimeout(function () {
                        var url = StringUtil.trim((App.coverage || {}).url)
                        if (StringUtil.isEmpty(url, false)) {
                          url = App.getBaseUrl() + "/htmlcov/index.html"
                        }
                        if (url.startsWith('/')) {
                          url = App.getBaseUrl() + url
                        }
                        window.open(url)
                      }, 2000)
                    }
                  })
                }
              }
            }
          }, IS_NODE ? 200 : 1000)

          return true
        }

        try {
          var index = indexes[position]
          var it = list[index] || {}

          if (IS_BROWSER) {
            try {
              document.getElementById('docItem' + index).scrollIntoView()
            } catch (e) {
              console.log(e)
            }
          }

          this.restoreRemote(index, it, false)

          this.randoms = []
          this.isRandomShow = true
          this.isRandomEditable = true
          this.isRandomListShow = false
          this.isRandomSubListShow = false
          this.showRandomList(true, it.Document, false, function (url, res, err) {
            try {
              App.onRandomListResponse(true, false, url, res, err)
            } catch (e) {
              log(e)
            }

            App.testRandom(false, true, false, null, isCross, false, callback)
          })
        } catch (e2) {
          log(e2)
          callback(true, deepAllCount)
        }
      },

      getSummary: function (accountIndex) {
        if (accountIndex == -1) {
          return this.getLogoutSummary()
        }
        var accounts = this.accounts || []
        if (accountIndex == accounts.length) {
          return this.getAllSummary()
        }

        if (accountIndex < 0 || accountIndex >= accounts.length) {
          return {}
        }

        var ci = this.accounts[accountIndex]
        return ci || {}
      },

      getLogoutSummary: function () {
        return this.logoutSummary || {}
      },
      getCurrentSummary: function () {
        return this.getSummary(this.currentAccountIndex) || {}
      },
      getAllSummary: function () {
        return this.allSummary || {}
      },

      getCurrentRandomSummary: function () {
        return (this.isRandomSubListShow ? this.currentRandomItem : this.currentRemoteItem) || {}
      },

      getStatisticsShowStr: function (count, total) {
        if (count == null) {
          count = 0;
        }
        if (total == null) {
          total = 0;
        }

        var showType = this.statisticsShowType;
        if (showType == 0) {
          return '' + count;
        }
        return Math.round(total <= 0 ? 0 : count*1000/total)/10 + '%' + (showType == 1 ? '' : ' ' + count)
      },

      getLogoutSummaryTotalText: function () {
        return this.getStatisticsShowStr(this.getLogoutSummary().totalCount, this.getAllSummary().totalCount)
      },

      getLogoutSummaryWhiteText: function () {
        var summary = this.getLogoutSummary()
        return this.getStatisticsShowStr(summary.whiteCount, summary.totalCount)
      },
      getLogoutSummaryGreenText: function () {
        var summary = this.getLogoutSummary()
        return this.getStatisticsShowStr(summary.greenCount, summary.totalCount)
      },
      getLogoutSummaryBlueText: function () {
        var summary = this.getLogoutSummary()
        return this.getStatisticsShowStr(summary.blueCount, summary.totalCount)
      },
      getLogoutSummaryOrangeText: function () {
        var summary = this.getLogoutSummary()
        return this.getStatisticsShowStr(summary.orangeCount, summary.totalCount)
      },
      getLogoutSummaryRedText: function () {
        var summary = this.getLogoutSummary()
        return this.getStatisticsShowStr(summary.redCount, summary.totalCount)
      },

      getSummaryTotalText: function (index) {
        return this.getStatisticsShowStr(this.getSummary(index).totalCount, this.getAllSummary().totalCount)
      },
      getSummaryWhiteText: function (index) {
        var summary = this.getSummary(index)
        return this.getStatisticsShowStr(summary.whiteCount, summary.totalCount)
      },
      getSummaryGreenText: function (index) {
        var summary = this.getSummary(index)
        return this.getStatisticsShowStr(summary.greenCount, summary.totalCount)
      },
      getSummaryBlueText: function (index) {
        var summary = this.getSummary(index)
        return this.getStatisticsShowStr(summary.blueCount, summary.totalCount)
      },
      getSummaryOrangeText: function (index) {
        var summary = this.getSummary(index)
        return this.getStatisticsShowStr(summary.orangeCount, summary.totalCount)
      },
      getSummaryRedText: function (index) {
        var summary = this.getSummary(index)
        return this.getStatisticsShowStr(summary.redCount, summary.totalCount)
      },

      getCurrentSummaryTotalText: function () {
        return this.getStatisticsShowStr(this.getCurrentSummary().totalCount, this.getAllSummary().totalCount)
      },
      getCurrentSummaryWhiteText: function () {
        var summary = this.getCurrentSummary()
        return this.getStatisticsShowStr(summary.whiteCount, summary.totalCount)
      },
      getCurrentSummaryGreenText: function () {
        var summary = this.getCurrentSummary()
        return this.getStatisticsShowStr(summary.greenCount, summary.totalCount)
      },
      getCurrentSummaryBlueText: function () {
        var summary = this.getCurrentSummary()
        return this.getStatisticsShowStr(summary.blueCount, summary.totalCount)
      },
      getCurrentSummaryOrangeText: function () {
        var summary = this.getCurrentSummary()
        return this.getStatisticsShowStr(summary.orangeCount, summary.totalCount)
      },
      getCurrentSummaryRedText: function () {
        var summary = this.getCurrentSummary()
        return this.getStatisticsShowStr(summary.redCount, summary.totalCount)
      },

      getAllSummaryTotalText: function () {
        return this.getStatisticsShowStr(this.getAllSummary().totalCount, this.getAllSummary().totalCount)
      },
      getAllSummaryWhiteText: function () {
        var summary = this.getAllSummary()
        return this.getStatisticsShowStr(summary.whiteCount, summary.totalCount)
      },
      getAllSummaryGreenText: function () {
        var summary = this.getAllSummary()
        return this.getStatisticsShowStr(summary.greenCount, summary.totalCount)
      },
      getAllSummaryBlueText: function () {
        var summary = this.getAllSummary()
        return this.getStatisticsShowStr(summary.blueCount, summary.totalCount)
      },
      getAllSummaryOrangeText: function () {
        var summary = this.getAllSummary()
        return this.getStatisticsShowStr(summary.orangeCount, summary.totalCount)
      },
      getAllSummaryRedText: function () {
        var summary = this.getAllSummary()
        return this.getStatisticsShowStr(summary.redCount, summary.totalCount)
      },

      isSummaryShow: function (accountIndex) {
        if (accountIndex == -1) {
          return this.isLogoutSummaryShow()
        }
        var accounts = this.accounts
        if (accountIndex == accounts.length) {
          return this.isAllSummaryShow()
        }

        if (accountIndex < 0 || accountIndex >= accounts.length) {
          return false
        }

        // var ci = this.isTestCaseShow ? this.accounts[accountIndex] : null
        var ci = this.accounts[accountIndex]
        return ci != null && ci.totalCount != null && ci.totalCount > 0
      },
      isLogoutSummaryShow: function () {
        // var ci = this.isCrossEnabled != true ? null : this.logoutSummary
        var ci = this.logoutSummary
        return ci != null && ci.totalCount != null && ci.totalCount > 0
      },
      isCurrentSummaryShow: function () {
        return this.isSummaryShow(this.currentAccountIndex)
      },
      isAllSummaryShow: function () {
        // var ci = this.isCrossEnabled != true ? null : this.allSummary
        var ci = this.allSummary
        return ci != null && ci.totalCount != null && ci.totalCount > 0
      },
      isRandomSummaryShow: function () {
        var ci = this.isRandomListShow || this.isRandomSubListShow ? this.getCurrentRandomSummary() : null
        return ci != null && ci.totalCount != null && ci.totalCount > 0
      },

      updateSummary: function (item, change, key) {
        if (change == null || key == null) {
          return item
        }

        if (item == null) {
          item = {}
        }

        var count = item[key]
        if (count == null || count < 0) {
          count = 0
        }
        count += change

        item[key] = count

        // 对于 Random 进入子项再退出后有时显示居然不准
        // if (cri.totalCount == null) {
        //   cri.totalCount = 0
        // }
        // cri.totalCount += change
        // if (cri.totalCount < 0) {
        //   cri.totalCount = 0
        // }
        item.totalCount = item.whiteCount + item.greenCount + item.blueCount + item.orangeCount + item.redCount

        return item
      },

      //更新父级总览数据
      updateToSummary: function (item, change, accountIndex) {
        if (item == null || change == null) {
          return
        }

        var key = item.compareColor + 'Count'
        this.allSummary = this.updateSummary(this.allSummary, change, key)

        if (accountIndex == -1) {
          this.logoutSummary = this.updateSummary(this.logoutSummary, change, key)
        }
        else if (accountIndex >= 0 && accountIndex < this.accounts.length) {
          var accountItem = this.updateSummary(this.getSummary(accountIndex), change, key)
          this.accounts[accountIndex] = accountItem
        }
      },
      updateToRandomSummary: function (item, change, accountIndex) {
        var random = item == null || change == null ? null : item.Random
        if (random == null) {
          return
        }

        if (random.count == 1 || (random.id != null && random.id < 0)) {
          var key = item.compareColor + 'Count'
          this.updateToSummary(item, change, accountIndex)

          var curRandom = this.isRandomListShow || this.currentRandomItem == null ? null : this.currentRandomItem.Random
          var isTemp = curRandom != null && (curRandom.id == null || curRandom.id < 0)
          var cri = this.updateSummary(isTemp ? this.currentRandomItem : this.currentRemoteItem, change, key)  // this.getCurrentRandomSummary())

          if (isTemp) {
            this.currentRandomItem = cri
            this.updateSummary(this.currentRemoteItem, change, key)
          } else {
            this.currentRemoteItem = cri
            Vue.set(this.testCases, this.currentDocIndex, cri)
          }

          var toId = random.toId
          if (toId != null && toId > 0) {
            for (var i in this.randoms) {
              var toIt = this.randoms[i]
              if (toIt != null && toIt.Random != null && toIt.Random.id == toId) {

                var toRandom = toIt.Random
                var id = toRandom == null ? 0 : toRandom.id
                var count = id == null || id <= 0 ? 0 : toRandom.count
                if (count != null && count > 1) {
                  toIt = this.updateSummary(toIt, change, key)
                  Vue.set(this.randoms, i, toIt)
                }

                break
              }
            }
          }
        }
      },

      /**移除调试字段
       * @param obj
       */
      removeDebugInfo: function (obj) {
        if (obj != null) {
          delete obj["trace"]
          // 保留 delete obj["sql:generate|cache|execute|maxExecute"]
          // 保留 delete obj["depth:count|max"]
          delete obj["time"]
          delete obj["timestamp"]
          delete obj["time:start|duration|end"]
          delete obj["time:start|duration|end|parse|sql"]
          // 保留 delete obj["throw"]
          // 保留 delete obj["trace:throw"]
          delete obj["trace:stack"]
          delete obj["stack"]
          delete obj["debug:info|help"]
        }
        return obj
      },

      /**
       * @param index
       * @param item
       */
      downloadTest: function (index, item, isRandom) {
        item = item || {}
        var document;
        if (isRandom) {
          document = this.currentRemoteItem || {}
        }
        else {
          document = item.Document = item.Document || {}
        }
        var random = isRandom ? item.Random : null
        var testRecord = item.TestRecord = item.TestRecord || {}

        saveTextAs(
          '# APIJSON自动化回归测试-前\n主页: https://github.com/Tencent/APIJSON'
          + '\n\n接口名称: \n' + (document.version > 0 ? 'V' + document.version : 'V*') + ' ' + document.name
          + '\n返回结果: \n' + JSON.stringify(parseJSON(testRecord.response || '{}'), null, '    ')
          , '测试：' + document.name + '-前.txt'
        )

        /**
         * 浏览器不允许连续下载，saveTextAs也没有回调。
         * 在第一个文本里加上第二个文本的信息？
         * beyond compare会把第一个文件的后面一段与第二个文件匹配，
         * 导致必须先删除第一个文件内的后面与第二个文件重复的一段，再重新对比。
         */
        setTimeout(function () {
          var tests = App.tests[String(App.currentAccountIndex)] || {}
          saveTextAs(
            '# APIJSON自动化回归测试-后\n主页: https://github.com/Tencent/APIJSON'
            + '\n\n接口名称: \n' + (document.version > 0 ? 'V' + document.version : 'V*') + ' ' + document.name
            + '\n返回结果: \n' + JSON.stringify(tests[document.id][isRandom ? random.id : 0] || {}, null, '    ')
            , '测试：' + document.name + '-后.txt'
          )


          if (StringUtil.isEmpty(testRecord.standard, true) == false) {
            setTimeout(function () {
              saveTextAs(
                '# APIJSON自动化回归测试-标准\n主页: https://github.com/Tencent/APIJSON'
                + '\n\n接口名称: \n' + (document.version > 0 ? 'V' + document.version : 'V*') + ' ' + document.name
                + '\n测试结果: \n' + JSON.stringify(testRecord.compare || '{}', null, '    ')
                + '\n测试标准: \n' + JSON.stringify(parseJSON(testRecord.standard || '{}'), null, '    ')
                , '测试：' + document.name + '-标准.txt'
              )
            }, 5000)
          }

        }, 5000)

      },

      /**
       * @param index
       * @param item
       */
      handleTest: function (right, index, item, path, isRandom, isDuration, isCross) {
        item = item || {}
        var random = item.Random = item.Random || {}
        var document;
        if (isRandom) {
          if ((random.count || 0) > 1) {
            this.currentRandomIndex = index
            // this.currentRandomSubIndex = -1
            this.restoreRandom(index, item)
            this.randomSubs = (item.subs || item['[]']) || []
            this.isRandomSubListShow = true
            this.getCurrentRandomSummary().summaryType = 'total'
            return
          }

          this.currentRandomSubIndex = index
          document = this.currentRemoteItem || {}

          vBefore.src = vDiff.src = vAfter.src = this.img = random.img;
        }
        else {
          this.currentDocIndex = index
          this.currentRemoteItem = item
          // this.currentRandomIndex = -1
          // this.currentRandomSubIndex = -1
          document = item.Document = item.Document || {}
        }

        this.isFullAssert = true

        var testRecord = item.TestRecord = item.TestRecord || {}
        var pathKeys = StringUtil.split(path, '/') || [];
        var pathNames = pathKeys.slice(0, pathKeys.length - 1);
        var lastKey = pathKeys[pathKeys.length - 1];

        var tests = this.tests[String(this.currentAccountIndex)] || {}
        var currentResponse = (tests[isRandom ? random.documentId : document.id] || {})[
          isRandom ? (random.id > 0 ? random.id : (random.toId + '' + random.id)) : 0
        ]

        if (pathKeys.length > 0) {
          var curRsp = StringUtil.isEmpty(testRecord.response) ? {} : parseJSON(testRecord.response);
          JSONResponse.setValByPath(curRsp, pathKeys, JSONResponse.getValByPath(currentResponse, pathKeys));
          currentResponse = curRsp;
        }

        const rawRspStr = currentResponse == null ? null : JSON.stringify(currentResponse)

        const list = isRandom ? (random.toId == null || random.toId <= 0 ? this.randoms : this.randomSubs) : this.testCases

        var isBefore = item.showType == 'before'
        this.file = random.file;
        if (right != true) {
          item.showType = isBefore ? 'after' : 'before'
          Vue.set(list, index, item);

          var res = isBefore ? rawRspStr : testRecord.response
          if (isRandom && ! isBefore) {
            res = res || ((this.currentRemoteItem || {}).TestRecord || {}).response
          }

          this.view = 'code'
          this.jsoncon = res || ''

          if (isRandom) {
            //FIXME 仅测试用
            var before = parseJSON(testRecord.response) || {
              bboxes: [{
                id: 1, label: '湘A580319X', score: 0.95, angle: 10, color: [255, 0, 70, 128], bbox: [100, 105, 400, 300]
              }, {
                id: 2, label: "person", score: 0.77, color: [131, 90, 120, 16], bbox: [125, 40, 200, 300]
              }, {
                id: 3, label: "car", score: 0.49, color: [62, 170, 0, 99], bbox: [800, 500, 400, 200]
              }, {
                id: 4, label: "person", score: Math.random(), color: [131, 90, 120, 16], bbox: [1920*Math.random(), 1080*Math.random(), 300*Math.random(), 800*Math.random()]
              }],
              lines: [
                [100, 100, 600, 600],
                [300, 200, 1000, 900],
                [1920*Math.random(), 1080*Math.random(), 1920*Math.random(), 1080*Math.random()]
              ],
              polygons: [
                [100, 100], [500, 160], [900, 200], [400, 900],
                [1920*Math.random(), 1080*Math.random()], [1920*Math.random(), 1080*Math.random()], [100, 100]
              ]
            };
            // var after = currentResponse || {
            var after = {
              bboxes: [{
                id: 1, label: '湘A5883I9X', score: 0.6, angle: 11, color: [255, 0, 70, 128], bbox: [100, 105, 400, 300]
              }, {
                id: 2, label: '粤Y1702Y5ZQ', score: 0.79, angle: 360*Math.random(), color: [255, 0, 70, 128], bbox: [1920*Math.random(), 1080*Math.random(), 600*Math.random(), 300*Math.random()]
              }, {
                id: 3, label: "person", score: 0.82, color: [131, 90, 120, 16], bbox: [126, 39, 200, 300]
              }, {
                id: 4, label: "car", score: 0.49, color: [62, 170, 0, 99], bbox: [800, 500, 400, 200]
              }, {
                id: 5, label: "person", score: Math.random(), color: [131, 90, 120, 16], bbox: [1920*Math.random(), 1080*Math.random(), 300*Math.random(), 800*Math.random()]
              }, {
                id: 6, label: "person", score: Math.random(), color: [131, 90, 120, 16], bbox: [1920*Math.random(), 1080*Math.random(), 300*Math.random(), 800*Math.random()]
              }, {
                id: 7, label: "dog", score: Math.random(), color: [255*Math.random(), 255*Math.random(), 255*Math.random(), 100*Math.random()], bbox: [1920*Math.random(), 1080*Math.random(), 600*Math.random(), 400*Math.random()]
              }],
              lines: [
                [100, 100, 600, 600],
                [300, 200, 1200, 700],
                [1920*Math.random(), 1080*Math.random(), 1920*Math.random(), 1080*Math.random()],
                [1920*Math.random(), 1080*Math.random(), 1920*Math.random(), 1080*Math.random()]
              ],
              polygons: [
                [100, 100], [500, 160], [900, 200], [400, 900],
                [1920*Math.random(), 1080*Math.random()], [1920*Math.random(), 1080*Math.random()], [100, 100]
              ]
            };

            const detection = this.detection || {};
            if (testRecord.total != null && testRecord.total > 0) {
              detection.total = testRecord.total;
            } else {
              testRecord.total = detection.total;
            }

            detection.beforeCorrect = testRecord.correct;
            detection.beforeWrong = testRecord.wrong;
            detection.beforeMiss = testRecord.miss;

            if (testRecord.score != null && testRecord.score > 0) {
              detection.afterThreshold = detection.beforeThreshold = testRecord.score;
            } else {
              testRecord.score = detection.beforeThreshold || detection.afterThreshold || 30;
            }

            if (testRecord.iou != null && testRecord.iou > 0) {
              detection.diffThreshold = testRecord.iou;
            } else {
              testRecord.iou = detection.diffThreshold || 90;
            }

            detection.beforeRecall = testRecord.recall;
            detection.beforePrecision = testRecord.precision;
            detection.beforeF1 = testRecord.f1;
            detection.before = before;
            detection.after = after;

            this.detection = detection;

            // var diff = this.processDiff();
            // this.processAutoMark();
            // this.drawAll();
            var diff = this.processDiffAndAutoMark();

            // var diff = JSONResponse.deepMerge(JSON.parse(JSON.stringify(before)), JSON.parse(JSON.stringify(after)));

            // this.drawDetections(vBefore, vBeforeCanvas, before); // FIXME
            // this.drawDetections(vDiff, vDiffCanvas, diff);
            // this.drawDetections(vAfter, vAfterCanvas, after);
          }
        }
        else {
          var url;

          if (isBefore) { //撤回原来错误提交的校验标准
            if (isDuration) {
              alert('撤回上次的耗时需要删除上次的对比标准，请点左边 [错的，撤回] 按钮')
              return
            }

            url = this.server + '/delete'
            const req = {
              TestRecord: {
                id: testRecord.id, //TODO 权限问题？ item.userId,
              },
              tag: 'TestRecord'
            }

            this.request(true, REQUEST_TYPE_POST, REQUEST_TYPE_JSON, url, req, {}, function (url, res, err) {
              App.onResponse(url, res, err)

              var data = res.data || {}
              if (JSONResponse.isSuccess(data) != true && testRecord!= null && testRecord.id != null) {
                alert('撤回最新的校验标准 异常：\n' + data.msg)
                return
              }

              if (isRandom) {
                App.updateToRandomSummary(item, -1, App.currentAccountIndex)
              } else {
                App.updateToSummary(item, -1, App.currentAccountIndex)
              }

              if (isDuration) {
                item.durationColor = 'black'
                item.durationHint = '正常：在以往最快和最慢之间'
              }
              else {
                item.compareType = JSONResponse.COMPARE_NO_STANDARD
                item.compareMessage = '查看结果'
                item.compareColor = 'white'
                item.hintMessage = '没有校验标准！'
                item.TestRecord = null
              }

              App.updateTestRecord(0, list, index, item, rawRspStr == null ? null : parseJSON(rawRspStr), isRandom, true, App.currentAccountIndex, isCross)
            })
          }
          else { //上传新的校验标准
            // if (isRandom && random.id <= 0) {
            //   alert('请先上传这个配置！')
            //   App.currentRandomItem = random
            //   App.showExport(true, false, true)
            //   return
            // }
            var isML = this.isMLEnabled;  // 异常分支不合并内容，只记录 code, throw, msg 等关键信息

            var standard;
            var stddObj;

            var minDuration = testRecord.minDuration
            var maxDuration = testRecord.maxDuration
            if (isDuration) {
              if (item.duration == null) {  // 没有获取到
                alert('最外层缺少字段 "time:start|duration|end|parse|sql"，无法对比耗时！')
                return
              }
              else if (maxDuration == null && minDuration == null) {
                maxDuration = item.duration
                minDuration = Math.round(maxDuration*0.8)
              }
              else if (maxDuration == null && minDuration != null) {
                maxDuration = Math.max(minDuration, item.duration)
                testRecord.minDuration = Math.min(minDuration, item.duration)
              }
              else if (minDuration == null && maxDuration != null) {
                minDuration = Math.min(maxDuration, item.duration)
                testRecord.maxDuration = Math.max(maxDuration, item.duration)
              }
              else if (maxDuration > 0 && maxDuration < item.duration) {
                maxDuration = item.duration
              }
              else if (minDuration > 0 && minDuration > item.duration) {
                minDuration = item.duration
              }
              else {  // 已经在正常范围中，不需要纠错
                alert('耗时已经在正常范围中，不需要纠错！')
                return
              }
            }
            else {
              standard = (StringUtil.isEmpty(testRecord.standard, true) ? null : parseJSON(testRecord.standard)) || {}
              if (pathKeys.length <= 0) {
                stddObj = JSONResponse.updateFullStandard(standard, rawRspStr == null ? null : parseJSON(rawRspStr), isML)
              } else if (isML) {
                stddObj = JSONResponse.updateStandardByPath(standard, pathNames, lastKey, rawRspStr == null ? null : parseJSON(rawRspStr))
              }
            }

            const isNewRandom = isRandom && random.id <= 0
            const baseUrl = this.getBaseUrl()
            const userId = this.User.id
            const cri = this.currentRemoteItem || {}
            const chain = cri.Chain || {}
            const cgId = chain.groupId || 0
            const cId = chain.id || 0
            const detection = this.detection || {};

            //TODO 先检查是否有重复名称的！让用户确认！
            // if (isML != true) {
            url = this.server + '/post'
            const req = {
              Random: isNewRandom != true ? null : {
                toId: random.toId,
                userId: userId,
                chainGroupId: cgId,
                chainId: cId,
                documentId: random.documentId,
                name: random.name,
                count: random.count,
                config: random.config
              },
              TestRecord: isDuration ? Object.assign(testRecord, {
                id: undefined,
                reportId: this.reportId,
                host: baseUrl,
                userId: userId,
                testAccountId: this.getCurrentAccountId(),
                chainGroupId: cgId,
                chainId: cId,
                duration: item.duration,
                minDuration: minDuration,
                maxDuration: maxDuration,
                compare: JSON.stringify(testRecord.compare || {}),
              }) : {
                userId: userId,
                chainGroupId: cgId,
                chainId: cId,
                documentId: isNewRandom ? null : (isRandom ? random.documentId : document.id),
                randomId: isRandom && ! isNewRandom ? random.id : null,
                reportId: this.reportId,
                host: baseUrl,
                testAccountId: this.getCurrentAccountId(),
                total: detection.total,
                correct: detection.afterCorrect,
                wrong: detection.afterWrong,
                miss: detection.afterMiss,
                score: detection.afterThreshold,
                iou: detection.diffThreshold,
                recall: detection.afterRecall,
                precision: detection.afterPrecision,
                f1: detection.afterF1,
                compare: JSON.stringify(testRecord.compare || {}),
                response: rawRspStr,
                standard: isML ? JSON.stringify(stddObj) : null
              },
              tag: isNewRandom ? 'Random' : 'TestRecord'
            }
            // }
            // else {
            //   url = this.server + '/post/testrecord/ml'
            //   req = {
            //     documentId: document.id
            //   }
            // }

            this.request(true, REQUEST_TYPE_POST, REQUEST_TYPE_JSON, url, req, {}, function (url, res, err) {
              App.onResponse(url, res, err)

              var data = res.data || {}
              if (JSONResponse.isSuccess(data) != true) {
                if (isML) {
                  alert('机器学习更新标准 异常：\n' + data.msg)
                }
              }
              else {
                if (isRandom) {
                  App.updateToRandomSummary(item, -1, App.currentAccountIndex)
                } else {
                  App.updateToSummary(item, -1, App.currentAccountIndex)
                }

                var testRecord = item.TestRecord || {}
                if (isDuration) {
                  item.durationColor = 'black'
                  item.durationHint = '正常：在以往最快和最慢之间'
                }
                else {
                  item.compareType = JSONResponse.COMPARE_EQUAL
                  item.compareMessage = '查看结果'
                  item.compareColor = 'white'
                  item.hintMessage = '结果正确'

                  testRecord.compare = {
                    code: 0,
                    msg: '结果正确'
                  }
                  testRecord.response = rawRspStr
                  // testRecord.standard = stdd
                }

                if (isRandom) {
                  var r = req == null ? null : req.Random
                  if (r != null && (data.Random || {}).id != null) {
                    r.id = data.Random.id
                    item.Random = r
                  }
                  if ((data.TestRecord || {}).id != null) {
                    testRecord.id = data.TestRecord.id
                    if (r != null) {
                      testRecord.randomId = r.id
                    }
                  }
                }
                item.TestRecord = testRecord


                // if (! isNewRandom) {
                //   if (isRandom) {
                //     App.showRandomList(true, App.currentRemoteItem)
                //   }
                //   else {
                //     App.showTestCase(true, false)
                //   }
                // }

                App.updateTestRecord(0, list, index, item, rawRspStr == null ? null : parseJSON(rawRspStr), isRandom, true, App.currentAccountIndex, isCross)
              }

            })

          }
        }
      },

      updateTestRecord: function (allCount, list, index, item, response, isRandom, ignoreTrend, accountIndex, isCross) {
        item = item || {}
        var doc = (isRandom ? item.Random : item.Document) || {}

        this.request(true, REQUEST_TYPE_POST, REQUEST_TYPE_JSON, this.server + '/get', {
          TestRecord: {
            documentId: isRandom ? doc.documentId : doc.id,
            randomId: isRandom ? doc.id : null,
            testAccountId: this.getCurrentAccountId(),
            'invalid': 0,
            'host': this.getBaseUrl(),
            '@order': 'date-',
            '@column': 'id,userId,testAccountId,documentId,randomId,reportId,duration,minDuration,maxDuration,total,correct,wrong,miss,score,iou,recall,precision,f1,response' + (this.isMLEnabled ? ',standard' : ''),
            'standard{}': this.isMLEnabled ? (this.database == 'SQLSERVER' ? 'len(standard)>2' : 'length(standard)>2') : null  // '@having': this.isMLEnabled ? 'json_length(standard)>0' : null
          }
        }, {}, function (url, res, err) {
          App.onResponse(url, res, err)

          var data = (res || {}).data || {}
          if (JSONResponse.isSuccess(data) != true) {
            alert('获取最新的校验标准 异常：\n' + data.msg)
            return
          }

          item.TestRecord = data.TestRecord
          App.compareResponse(res, allCount, list, index, item, response, isRandom, accountIndex, true, err, ignoreTrend, isCross);
        })
      },

      //显示详细信息, :data-hint :data, :hint 都报错，只能这样
      setRequestHint: function(index, item, isRandom) {
        item = item || {}
        var d = isRandom ? item.Random : item.Document;
        // var r = d == null ? null : (isRandom ? d.config : d.request);
        // this.$refs[isRandom ? 'randomTexts' : 'testCaseTexts'][index].setAttribute('data-hint', r == null ? '' : (isRandom ? r : JSON.stringify(this.getRequest(r), null, ' ')));

        if (isRandom) {
          var toId = (d == null ? null : d.toId) || 0
          var eles = this.$refs[toId <= 0 ? 'randomTexts' : 'randomSubTexts'];
          var ele = eles == null ? null : eles[index];
          if (ele == null) {
            return;
          }
          ele.setAttribute('data-hint', (d || {}).config == null ? '' : d.config);
        }
        else {
          var eles = this.$refs['testCaseTexts'];
          var ele = eles == null ? null : eles[index];
          if (ele == null) {
            return;
          }
          ele.setAttribute('data-hint', StringUtil.isEmpty(d.request, true) ? '' : JSON.stringify(this.getRequest(d.request, {}, true), null, ' '));
        }
      },

      //显示详细信息, :data-hint :data, :hint 都报错，只能这样
      setTestHint: function(index, item, isRandom, isDuration, isHandle) {
        item = item || {};
        var toId = isRandom ? ((item.Random || {}).toId || 0) : 0;
        var h = isDuration ? item.durationHint : (isHandle ? item.compareMessage : item.hintMessage);
        var eles = this.$refs['test' + (isRandom ? (toId <= 0 ? 'Random' : 'RandomSub') : '') + (isHandle ? 'Handle' : 'Result') + (isDuration ? 'Duration' : '') + 'Buttons'];
        var ele = eles == null ? null : eles[index];
        if (ele == null) {
          return;
        }
        ele.setAttribute('data-hint', h || '');
      },

      handleTestArg: function(hasTestArg, rawReq, delayTime, callback) {
        if (hasTestArg && IS_BROWSER) {
          vUrlComment.value = ""
          vComment.value = ""
          vWarning.value = ""
        }

        if (IS_BROWSER) {
          App.onChange(false)
        }

        if (hasTestArg && rawReq.send != "false" && rawReq.send != "null") {
          setTimeout(function () {
            if (rawReq.send == 'random') {
              App.onClickTestRandom(App.isCrossEnabled, callback)
            } else if (App.isTestCaseShow) {
              App.onClickTest(callback)
            } else {
              App.send(false, callback)
            }

            var url = vUrl.value || ''
            if (IS_BROWSER && (rawReq.jump == "true" || rawReq.jump == "null"
              || (rawReq.jump != "false" && App.isTestCaseShow != true && rawReq.send != 'random'
                && (url.endsWith("/get") || url.endsWith("/head"))
              )
            )) {
              setTimeout(function () {
                window.open(vUrl.value + "/" + encodeURIComponent(JSON.stringify(encode(parseJSON(vInput.value)))))
              }, 2000)
            }
          }, Math.max(2000, delayTime))
        }
      },

      autoTest: function(callback, delayTime, isTest, rawReq, setting) {
        this.autoTestCallback = callback

        if (delayTime == null) {
          delayTime = 0
        }

        if (isTest == null) {
          isTest = true
        }

        if (rawReq == null) {
          rawReq = {
            send: true,
            type: REQUEST_TYPE_JSON,
            url: 'http://localhost:8080/get'
          }
        }

        if (setting == null) {
          setting = StringUtil.isEmpty(rawReq.setting, true) ? null : parseJSON(StringUtil.trim(rawReq.setting, true))
        }

        if (setting == null) {
          setting = {
            isLocalShow: false,
            isTestCaseShow: true,
            isRandomShow: true,
            isRandomListShow: true,
            isRandomSubListShow: false,
            isMLEnabled: true,
            isCrossEnabled: true,
            // testCaseCount: 100,
            testCasePage: 0,
            // randomCount: 100,
            randomPage: 0,
          }
        }

        rawReq.setting = setting

        this.isLocalShow = setting.isLocalShow
        this.isTestCaseShow = setting.isTestCaseShow
        this.isRandomShow = setting.isRandomShow
        this.isRandomListShow = setting.isRandomListShow
        this.isRandomSubListShow = setting.isRandomSubListShow
        this.isMLEnabled = setting.isMLEnabled
        this.isCrossEnabled = setting.isCrossEnabled
        // this.testCaseCount = setting.testCaseCount
        this.testCasePage = setting.testCasePage
        // this.randomCount = setting.randomCount
        this.randomPage = setting.randomPage
        this.server = 'http://localhost:8080' // this.getBaseUrl()

        // if (this.isCrossEnabled) {
        //   this.currentAccountIndex = -1
        // }

        this.login(true, function (url, res, err) {
          if (setting.isRandomShow && setting.isRandomListShow) {
            delayTime += Math.min(5000, (App.isMLEnabled ? 50 : 20) * (setting.randomCount || App.randomCount) + 1000)
            App.isRandomShow = true
            App.isRandomEditable = true
            App.isRandomListShow = false
            App.isRandomSubListShow = false
            // App.showRandomList(false, setting.isRandomSubListShow ? App.currentRandomItem : null, setting.isRandomSubListShow)
            App.showRandomList(true, setting.isRandomSubListShow ? (App.currentRandomItem || {}).Random : (App.currentRemoteItem || {}).Document, setting.isRandomSubListShow, function (url, res, err) {
              App.onRandomListResponse(true, setting.isRandomSubListShow, url, res, err)
              App.handleTestArg(isTest, rawReq, delayTime, callback)
            })
          }
          else {  // if (setting.isTestCaseShow) {
            delayTime += Math.min(5000, (App.isMLEnabled ? 30 : 10) * (setting.testCaseCount || App.testCaseCount) + 1000)

            // App.login(true)
            App.onLoginResponse(true, {
              type: 0, // 登录方式，非必须 0-密码 1-验证码
              phone: App.account,
              password: App.password,
              version: 1, // 全局默认版本号，非必须
              remember: vRemember.checked,
              format: false
            }, url, res, err)

            App.showTestCase(true, setting.isLocalShow, function (url, res, err) {
              App.onTestCaseListResponse(IS_BROWSER, url, res, err)
              App.isTestCaseShow = true
              App.handleTestArg(isTest, rawReq, delayTime, callback)
            })
          }

        })
      },

      toPathValuePairMap: function (json, path, map) {
        if (map == null) {
          map = {}
        }
        if (json == null) {
          return map
        }

        if (json instanceof Array) {
          for (var i = 0; i < json.length; i++) {
            var p = StringUtil.isEmpty(path) ? '' + i : path + '/' + i
            map = this.toPathValuePairMap(json[i], p, map)
          }
        }
        else if (json instanceof Object) {
          for (var k in json) {
            var p = StringUtil.isEmpty(path) ? k : path + '/' + k
            map = this.toPathValuePairMap(json[k], p, map)
          }
        }
        else {
          map[path == null ? '' : path] = json
        }

        return map
      },

      showOptions: function(target, text, before, after, isValue, filter) {
        currentTarget = target;
        isInputValue = isValue;
        selectionStart = target.selectionStart;
        selectionEnd = target.selectionEnd;
        App.selectIndex = -1;

        clearTimeout(handler);

        // var posX = 0, posY = 0;

        // var event = window.event;
        // if (event.pageX || event.pageY) {
        //   posX = event.pageX;
        //   posY = event.pageY;
        // }
        // else if (event.clientX || event.clientY) {
        //   posX = event.clientX + document.documentElement.scrollLeft + document.body.scrollLeft;
        //   posY = event.clientY + document.documentElement.scrollTop + document.body.scrollTop;
        // }
        // else if (target.offsetHeight || target.offsetWidth) {
        //   // posX = target.offsetHeight;
        //   // posY = target.offsetWidth;
        // }
        //
        // vOption.style.left = posX + 'px';
        // vOption.style.top = posY + 'px';


        var options = App.options;
        if (options.length > 0 && StringUtil.isNotEmpty(filter, true)) {
          var newOptions = [];
          for (var i = 0; i < options.length; i++) {
            var opt = options[i];
            var name = opt == null ? null : opt.name;
            if (name != null && name.indexOf(filter) >= 0) {
              newOptions.push(opt);
            }
          }

          // App.options = [];
          App.options = newOptions;
        }
        else {
          App.options = [];

          var stringType = CodeUtil.getType4Language(App.language, "string")
          var objectType = CodeUtil.getType4Language(App.language, "object")
          var arrayType = CodeUtil.getType4Language(App.language, "array")
          var varcharType = CodeUtil.getType4Language(App.language, "varchar")
          var intType = CodeUtil.getType4Language(App.language, "int")
          var booleanType = CodeUtil.getType4Language(App.language, "boolean")
          var isReq = App.isEditResponse != true

          if (target == vHeader) {
            if (isValue != true) {
              App.options = [
                {
                  name: "Cookie",
                  type: stringType,
                  comment: "指定 Cookie"
                }, {
                  name: "Set-Cookie",
                  type: stringType,
                  comment: "设置 Cookie"
                }, {
                  name: "Add-Cookie",
                  type: stringType,
                  comment: "添加 Cookie"
                }, {
                  name: "Token",
                  type: stringType,
                  comment: "指定 Token"
                }, {
                  name: "Authorization",
                  type: stringType,
                  comment: "授权"
                }, {
                  name: "Authentication",
                  type: stringType,
                  comment: "鉴权"
                }, {
                  name: "Content-Type",
                  type: stringType,
                  comment: "数据类型"
                }, {
                  name: "Accept",
                  type: stringType,
                  comment: "接收格式"
                }, {
                  name: "Accept-Encoding",
                  type: stringType,
                  comment: "接收编码"
                }, {
                  name: "Accept-Language",
                  type: stringType,
                  comment: "接收语言"
                }, {
                  name: "Cache-Control",
                  type: stringType,
                  comment: "缓存控制"
                }, {
                  name: "Connection",
                  type: stringType,
                  comment: "连接控制"
                }, {
                  name: "Keep-Alive",
                  type: stringType,
                  comment: "保持连接"
                }];
            }
          }
          else if (target == vRandom || target == vScript) {
            if (target == vScript) {
              App.options = [
                {
                  name: "type",
                  type: stringType,
                  comment: '请求格式类型：PARAM, JSON, FORM, DATA'
                },{
                  name: "url",
                  type: stringType,
                  comment: '请求地址，例如 http://localhost:8080/get '
                },{
                  name: "req",
                  type: objectType,
                  comment: '请求参数，例如 { format: true, "User": { "id": 82001 } } '
                },{
                  name: "header",
                  type: objectType,
                  comment: '请求头，例如 Cookie: abc123 '
                }];

              if (isValue) {
                App.options.push({
                  name: "callback(url, res, err)",
                  type: objectType,
                  comment: '回调函数'
                })
                App.options.push({
                  name: "sendRequest(isAdminOperation, method, type, url, req, header, callback)",
                  type: objectType,
                  comment: '真正发送请求函数'
                })
                App.options.push({
                  name: "App.request(isAdminOperation, method, type, url, req, header, callback)",
                  type: objectType,
                  comment: '包装发送请求函数'
                })
                App.options.push({
                  name: "if () {\n    \n} else if () {\n    \n} else {\n    \n}",
                  type: objectType,
                  comment: '包装发送请求函数'
                })
                App.options.push({
                  name: "switch () {\n    case 1:\n        \n        break\n    case 2:\n        \n        break\n    default:\n        \n        break\n}",
                  type: objectType,
                  comment: '包装发送请求函数'
                })
                App.options.push({
                  name: "try {\n    \n} catch(e) {\n    console.log(e)\n}",
                  type: objectType,
                  comment: '包装发送请求函数'
                })
                App.options.push({
                  name: "{}", type: objectType, comment: '对象'
                })
                App.options.push({
                    name: "[]", type: arrayType, comment: '数组'
                })
                App.options.push({
                    name: "undefined", name: "undefined", comment: '未定义'
                })
              }
              else {
                App.options.push({
                  name: "callback",
                  type: objectType,
                  comment: '回调函数 function(url, res, err) {} '
                })
              }
            }

            if (isValue != true) {
              var standardObj = null;
              try {
                var currentItem = App.isTestCaseShow ? App.remotes[App.currentDocIndex] : App.currentRemoteItem;
                standardObj = parseJSON(((currentItem || {})[isReq ? 'Document' : 'TestRecord'] || {}).standard);
              } catch (e3) {
                log(e3)
              }
              if (standardObj == null) {
                standardObj = JSONResponse.updateStandard({},
                  isReq ? App.getRequest(vInput.value) : App.jsoncon == null ? null : parseJSON(App.jsoncon)
                )
              }

              var method = App.isTestCaseShow ? ((App.currentRemoteItem || {}).Document || {}).url : App.getMethod();
              var isRestful = ! JSONObject.isAPIJSONPath(method);
              var ind = method == null ? -1 : method.lastIndexOf('/');
              var ind2 = ind < 0 ? -1 : method.substring(0, ind).lastIndexOf('/');
              var table = method == null ? null : (ind < 0 ? method : (isRestful
                ? StringUtil.firstCase(method.substring(ind2+1, ind), true) : method.substring(ind+1))
              );

              var tableList = docObj == null ? null : docObj['[]']
              var isAPIJSONRouter = false // TODO

              var json = App.getRequest(vInput.value)
              var map = App.toPathValuePairMap(json) || {}
              for (var path in map) {
                if (StringUtil.isEmpty(path)) {
                  continue
                }

                var ks = StringUtil.split(path, '/')
                var tbl = ks.length < 2 ? table : ks[ks.length - 2]

                var v = map[path]
                var t = v == null ? null : CodeUtil.getType4Request(v)
                var k = ks[ks.length - 1]

                App.options.push({
                  name: target != vScript ? path : JSONResponse.formatKey(ks.join('_'), true, true, true, true, true, true),
                  type: t == null ? null : (t == 'string' ? stringType : (t == 'integer' ? intType : CodeUtil.getType4Language(App.language, t))),
                  comment: CodeUtil.getComment4Request(tableList, tbl, k, v, method, false, App.database, App.language
                    , isReq, ks, isRestful, standardObj, false, isAPIJSONRouter)
                })
              }
            }
            else if (target == vRandom) {
              App.options = [
                {
                  name: "ORDER_DB(-10, 100000, 'Comment', 'id')",
                  type: stringType,
                  comment: "从数据库顺序取值 function(min:Integer, max:Integer, table:String, column:String) 可使用 ORDER_DB+2(0, 100) 间隔 step = 2 位来升序取值"
                }, {
                  name: "ORDER_IN(true, 1, 'a')",
                  type: stringType,
                  comment: "从选项内顺序取值 function(val0:Any, val1:Any ...) 可使用 ORDER_INT-3(0, 100) 间隔 step = -3 位来降序取值"
                }, {
                  name: "ORDER_INT(-10, 100)",
                  type: stringType,
                  comment: "从范围内顺序取值 function(min:Integer, max:Integer) 可使用 ORDER_IN+(0, 100) 间隔 step = 1 位来升序取值"
                }, {
                  name: "RANDOM_DB(-10, 100000, 'Comment', 'id')",
                  type: stringType,
                  comment: "从数据库随机取值 function(min:Integer, max:Integer, table:String, column:String)"
                }, {
                  name: "RANDOM_IN(true, 1, 'a')",
                  type: stringType,
                  comment: "从选项内随机取值 function(val0:Any, val1:Any ...)"
                }, {
                  name: "RANDOM_INT(-10, 100)",
                  type: stringType,
                  comment: "从范围内随机取整数 function(min:Integer, max:Integer)"
                }, {
                  name: "RANDOM_NUM(-9.9, 99.99)",
                  type: stringType,
                  comment: "从范围内随机取小数 function(min:Number, max:Number, precision:Integer)"
                }, {
                  name: "RANDOM_STR()",
                  type: stringType,
                  comment: "从长度范围内随机取字符串 function(minLength:Integer, maxLength:Integer, regexp:String)"
                }, {
                  name: "undefined", type: "undefined", comment: '未定义'
                }, {
                  name: "Math.round(100*Math.random())", type: stringType, comment: '自定义代码'
                }
              ]

              if (App.isChainShow) {
                  App.options = [
                    {
                      name: "PRE_DATA('[]/0/User/id')",
                      type: stringType,
                      comment: "从上个请求的返回结果中取值 function(path:String?, defaultVal:Any?, msg:String?)"
                    }, {
                      name: "PRE_ARG('[]/page')",
                      type: stringType,
                      comment: "从上个请求的参数中取值 function(path:String?, defaultVal:Any?, msg:String?)"
                    }, {
                      name: "CTX_GET('userId')",
                      type: stringType,
                      comment: "在上下文存放键值对 function(key:String?, defaultVal:Any?, msg:String?)"
                    }, {
                      name: "CTX_PUT('userId', 'User/id', 'CUR_DATA')",
                      type: stringType,
                      comment: "在上下文存放键值对 function(key:String, val:Any, from:String?, msg:String?)"
                    }, {
                      name: "PRE_RES('[]/page')",
                      type: stringType,
                      comment: "从上个请求的 Response 对象中取值 function(path:String, defaultVal:Any?, msg:String?)"
                    }, {
                      name: "PRE_REQ('isMale')",
                      type: stringType,
                      comment: "从上个请求 Request 对象中取值 function(path:String, defaultVal:Any?, msg:String?)"
                    }, {
                      name: "CUR_ARG('[]/count')",
                      type: stringType,
                      comment: "从当前请求的参数中取值 function(path:String, defaultVal:Any?, msg:String?)"
                    }, {
                      name: "CUR_REQ('[]/count')",
                      type: stringType,
                      comment: "从当前请求的 Request 对象中取值 function(path:String, defaultVal:Any?, msg:String?)"
                    }, {
                      name: "CUR_DATA('[]/count')",
                      type: stringType,
                      comment: "从当前请求的返回结果中取值 function(path:String?, defaultVal:Any?, msg:String?)"
                    }, {
                      name: "CUR_RES('[]/count')",
                      type: stringType,
                      comment: "从当前请求的 Response 对象中取值 function(path:String, defaultVal:Any?, msg:String?)"
                    }
                  ].concat(App.options || [])
              }
            }
            else {
              App.options.push({
                name: isSingle ? "res.key" : "res['key']", type: stringType, comment: '从上个请求的结果中取值'
              })
            }
          }
          else if (target == vInput) {
          var quote = isSingle ? "'" : '"';

          var table = null;
          var isArrayKey = false;
          var isSubqueryKey = false;

          var prev = before;
          while (prev != null && prev.length > 0) {
            var lastIndex = prev.lastIndexOf('{');
            prev = prev.substring(0, lastIndex).trimRight();

            if (prev.endsWith(':')) {
              prev = prev.substring(0, prev.length - 1).trimRight();
              var endsWithDoubleQuote = prev.endsWith('"')

              if (endsWithDoubleQuote || prev.endsWith("'")) {
                prev = prev.substring(0, prev.length - 1);
                lastIndex = prev.lastIndexOf('\n');

                var lastLine = prev.substring(lastIndex + 1, prev.length);
                var ind = lastLine.lastIndexOf(endsWithDoubleQuote ? '"' : "'");
                table = ind < 0 ? null : lastLine.substring(ind + 1, lastLine.length);

                if (App.isTableKey(table)) {
                  break;
                }
                if (table != null && table.endsWith('[]')) {
                  isArrayKey = true;
                  break;
                }
                if (table != null && table.endsWith('@')) {
                  isSubqueryKey = true;
                  break;
                }

                prev = lastIndex <= 0 ? '' : prev.substring(0, lastIndex);
              }
            }
          }

          if (isValue) {
            var lastIndex = before.lastIndexOf('\n');
            var lastLine = before.substring(lastIndex + 1, before.length);
            lastIndex = lastLine.lastIndexOf(':');
            lastLine = lastIndex < 0 ? '' : lastLine.substring(0, lastIndex).trim();

            var endsWithDoubleQuote = lastLine.endsWith('"')
            if (endsWithDoubleQuote || lastLine.endsWith("'")) {
              lastLine = lastLine.substring(0, lastLine.length - 1);
            }
            var ind = lastLine.lastIndexOf(endsWithDoubleQuote ? '"' : "'");
            var key = ind < 0 ? null : lastLine.substring(ind + 1, lastLine.length);

            var isArrayKey = JSONObject.isArrayKey(key)
            if (isArrayKey || App.isTableKey(key)) {
              table = key;
              if (isArrayKey) {
                ind = key.indexOf('-');
                if (ind < 0) {
                  ind = key.indexOf(':');
                }
                table = key.substring(0, ind < 0 ? key.length - 2 : ind);
              }

              App.options = [{
                name: "{}",
                type: objectType,
                comment: (isArrayKey ? '数组 < ' + table + ': ' : '') + StringUtil.trim((App.getTableByModelName(table) || {}).table_comment)
              }]
            } else {
              switch (key) {
                case '@from@':
                  App.options = [{
                    name: "{}",
                    type: objectType,
                    comment: '数据来源'
                  }];
                  break;
                case '@combine':
                case '@raw':
                  var isRaw = key == '@raw';

                  var end = before.lastIndexOf('{');
                  var start = after.indexOf('}');
                  var s = (end < 0 ? before : before.substring(end)) + after.substring(0, start + 1);
                  var json = App.getRequest(s, {});

                  var ks = '';
                  var first = true;
                  for (var k in json) {
                    if (StringUtil.isNotEmpty(k, true) && (isRaw || (k.startsWith('@') != true && key.indexOf('()') < 0))) {
                      if (isRaw != true) {
                        if (k.endsWith('@')) {
                          k = k.substring(0, k.length - 1);
                        }

                        var lk = k.toLowerCase()
                        if (lk == 'id' || lk.replaceAll('_', '') == 'userid') {
                          continue;
                        }
                      }

                      App.options.push({
                        name: quote + k + quote,
                        type: stringType,
                        comment: isRaw ? '原始SQL片段' : '条件组合'
                      });

                      ks += (first ? '' : (isRaw ? ',' : ' | ')) + k;
                      first = false;
                    }
                  }
                  ;

                  if (StringUtil.isNotEmpty(ks, true)) {
                    App.options.push({
                      name: quote + ks + quote,
                      type: stringType,
                      comment: isRaw ? '原始SQL片段' : '条件组合'
                    });
                  }
                  break;
                case '@schema':
                  var schemas = StringUtil.split(App.schema);
                  if (schemas != null) {
                    for (var i = 0; i < schemas.length; i++) {
                      var sch = schemas[i];
                      if (StringUtil.isNotEmpty(sch, true)) {
                        App.options.push({
                          name: quote + sch + quote,
                          type: stringType,
                          comment: '集合空间(数据库名/模式)'
                        });
                      }
                    }
                  }
                  break;
                case '@database':
                  App.options = [{
                    name: isSingle ? "'MYSQL'" : '"MYSQL"',
                    type: stringType,
                    comment: 'MySQL'
                  }, {
                    name: isSingle ? "'POSTGRESQL'" : '"POSTGRESQL"',
                    type: stringType,
                    comment: 'PostgreSQL'
                  }, {
                    name: isSingle ? "'SQLSERVER'" : '"SQLSERVER"',
                    type: stringType,
                    comment: 'SQLServer'
                  }, {
                    name: isSingle ? "'ORACLE'" : '"ORACLE"',
                    type: stringType,
                    comment: 'Oracle'
                  }, {
                    name: isSingle ? "'DB2'" : '"DB2"',
                    type: stringType,
                    comment: 'DB2'
                  }, {
                    name: isSingle ? "'DAMENG'" : '"DAMENG"',
                    type: stringType,
                    comment: '达梦数据库'
                  }, {
                    name: isSingle ? "'CLICKHOUSE'" : '"CLICKHOUSE"',
                    type: stringType,
                    comment: 'ClickHouse'
                  }, {
                    name: isSingle ? "'SQLITE'" : '"SQLITE"',
                    type: stringType,
                    comment: 'SQLite'
                  }, {
                    name: isSingle ? "'TDENGINE'" : '"TDENGINE"',
                    type: stringType,
                    comment: 'TDengine'
                  }];
                  break;
                case '@role':
                  App.options = [{
                    name: isSingle ? "'UNKNOWN'" : '"UNKNOWN"',
                    type: stringType,
                    comment: '来访角色: 未登录'
                  }, {
                    name: isSingle ? "'LOGIN'" : '"LOGIN"',
                    type: stringType,
                    comment: '来访角色: 已登录'
                  }, {
                    name: isSingle ? "'CIRCLE'" : '"CIRCLE"',
                    type: stringType,
                    comment: '来访角色: 圈子成员'
                  }, {
                    name: isSingle ? "'CONTACT'" : '"CONTACT"',
                    type: stringType,
                    comment: '来访角色: 联系人'
                  }, {
                    name: isSingle ? "'OWNER'" : '"OWNER"',
                    type: stringType,
                    comment: '来访角色: 拥有者'
                  }, {
                    name: isSingle ? "'ADMIN'" : '"ADMIN"',
                    type: stringType,
                    comment: '来访角色: 管理员'
                  }];
                  break;
                case '@cache':
                  App.options = [{
                    name: "0",
                    type: intType,
                    comment: '缓存方式: 全部'
                  }, {
                    name: "1",
                    type: intType,
                    comment: '缓存方式: 磁盘'
                  }, {
                    name: "2",
                    type: intType,
                    comment: '缓存方式: 内存'
                  }];
                  break;
                case 'count':
                case 'page':
                  var isPage = key == 'page';
                  for (var i = 0; i < 100; i++) {
                    App.options.push({
                      name: StringUtil.get(i), // 直接用数字导致重复生成 JSON
                      type: intType,
                      comment: isPage ? '分页页码' : '每页数量'
                    });
                  }
                  break;
                case 'tag':
                case 'version':
                  var isVersion = key == 'version';
                  var requestList = docObj == null ? null : docObj['Request[]'];
                  if (requestList != null) {
                    for (var i = 0; i < requestList.length; i++) {
                      var item = requestList[i];
                      if (item == null) {
                        continue;
                      }

                      App.options.push({
                        name: isVersion ? item.version : item.tag,
                        type: intType,
                        comment: isVersion ? '请求版本' : '请求标识'
                      });
                    }
                  }
                  break;
                case 'query':
                  App.options = [{
                    name: "0",
                    type: intType,
                    comment: '查询内容: 数据'
                  }, {
                    name: "1",
                    type: intType,
                    comment: '查询内容: 数量'
                  }, {
                    name: "2",
                    type: intType,
                    comment: '查询内容: 全部'
                  }];
                  break;
                case 'range':
                  App.options = [{
                    name: quote + "ANY" + quote,
                    type: stringType,
                    comment: '比较范围: 任意'
                  }, {
                    name: quote + "ALL" + quote,
                    type: stringType,
                    comment: '比较范围: 全部'
                  }];
                  break;
                case 'compat':
                  App.options = [{
                    name: "true",
                    type: booleanType,
                    comment: '兼容统计: 开启'
                  }, {
                    name: "false",
                    type: booleanType,
                    comment: '兼容统计: 关闭'
                  }];
                  break;
                case '@explain':
                  App.options = [{
                    name: "true",
                    type: booleanType,
                    comment: '性能分析: 开启'
                  }, {
                    name: "false",
                    type: booleanType,
                    comment: '性能分析: 关闭'
                  }];
                  break;
                case '':
                  App.options = [{
                    name: "true",
                    type: booleanType,
                    comment: '性能分析: 开启'
                  }, {
                    name: "false",
                    type: booleanType,
                    comment: '性能分析: 关闭'
                  }];
                  break;
                default:
                  if (key.endsWith('()')) {
                    if (key.startsWith('@')) {
                      App.options = [{
                        name: quote + 'fun(arg0,arg1)' + quote,
                        type: stringType,
                        comment: '存储过程'
                      }];
                    } else {
                      var functionList = docObj == null ? null : docObj['Function[]'];
                      if (functionList != null) {
                        for (var i = 0; i < functionList.length; i++) {
                          var item = functionList[i];
                          var name = item == null ? null : item.name;
                          if (StringUtil.isEmpty(name, true)) {
                            continue;
                          }

                          App.options.push({
                            name: quote + name + '(' + StringUtil.trim(item.arguments) + ')' + quote,
                            type: CodeUtil.getType4Language(App.language, item.returnType),
                            comment: item.rawDetail || item.detail
                          });
                        }
                      }
                    }
                  }
                  break;
              }

              var columnList = App.getColumnListWithModelName(table);
              if (columnList != null) {
                var isHaving = key == '@having';
                var arr = ['max', 'min', 'sum', 'avg', 'length', 'len', 'json_length'];

                var ks = '';
                var first = true;
                for (var j = 0; j < columnList.length; j++) {
                  var column = App.getColumnObj(columnList, j)
                  var name = column == null ? null : column.column_name;
                  if (StringUtil.isEmpty(name, true)) {
                    continue;
                  }

                  var k = name;
                  switch (key) {
                    case '@having':
                      var which = Math.floor(arr.length * Math.random());
                      k = arr[which] + '(' + name + ')' + (Math.random() < 0.2 ? '<82010' : (Math.random() < 0.5 ? '>3' : '%2=0'));
                      break;
                    case '@order':
                      k = name + (Math.random() < 0.2 ? '' : (Math.random() < 0.5 ? '-' : '+'));
                      break;
                    case '@cast':
                      var t = column.column_type;
                      var ind = t == null ? -1 : t.indexOf('(');
                      k = name + ':' + StringUtil.toUpperCase(ind < 0 ? t : t.substring(0, ind));
                      break;
                    // case '@column':
                    // case '@group':
                    // case '@json':
                    // case '@null':
                    default:
                      k = name;
                      break;
                  }

                  App.options.push({
                    name: quote + k + quote,
                    type: CodeUtil.getType4Language(App.language, column.column_type),
                    comment: column.column_comment
                  })

                  ks += (first ? '' : (isHaving ? ';' : ',')) + k;
                  first = false;
                }

                App.options.push({
                  name: quote + ks + quote,
                  type: stringType,
                  comment: '所有字段组合'
                })
              }
            }
          } else {
            App.options = [
              {
                name: "@column",
                type: varcharType,
                comment: "返回字段"
              },
              {name: "@from@", type: objectType, comment: "数据来源"},
              {
                name: "@group",
                type: varcharType,
                comment: "分组方式"
              }, {
                name: "@having",
                type: varcharType,
                comment: "聚合函数"
              }, {
                name: "@order",
                type: varcharType,
                comment: "排序方式"
              }, {
                name: "@combine",
                type: varcharType,
                comment: "条件组合"
              }, {
                name: "@raw",
                type: varcharType,
                comment: "原始SQL片段"
              }, {
                name: "@json",
                type: varcharType,
                comment: "转为JSON"
              }, {
                name: "@null",
                type: varcharType,
                comment: "NULL值字段"
              },
              {name: "@cast", type: varcharType, comment: "类型转换"},
              {
                name: "@schema",
                type: varcharType,
                comment: "集合空间(数据库名/模式)"
              }, {
                name: "@database",
                type: varcharType,
                comment: "数据库类型"
              }, {
                name: "@datasource",
                type: varcharType,
                comment: "跨数据源"
              },
              {name: "@role", type: varcharType, comment: "来访角色"},
              {
                name: "@cache",
                type: varcharType,
                comment: "缓存方式"
              }, {
                name: "@explain",
                type: varcharType,
                comment: "性能分析"
              }, {
                name: "key-()",
                type: varcharType,
                comment: "远程函数: 优先执行"
              }, {
                name: "key()",
                type: varcharType,
                comment: "远程函数"
              }, {
                name: "key+()",
                type: varcharType,
                comment: "远程函数: 延后执行"
              }, {
                name: "@key-()",
                type: varcharType,
                comment: "存储过程: 优先执行"
              }, {
                name: "@key()",
                type: varcharType,
                comment: "存储过程"
              }, {
                name: "@key+()",
                type: varcharType,
                comment: "存储过程: 延后执行"
              },
            ];

            if (isArrayKey) {
              App.options = [
                {name: "count", type: intType, comment: "每页数量"},
                {name: "page", type: intType, comment: "分页页码"},
                {name: "query", type: intType, comment: "查询内容"},
                {name: "compat", type: booleanType, comment: "兼容统计"},
                {name: "join", type: varcharType, comment: "联表查询"},
                {name: "[]", type: arrayType, comment: "数组对象"},
              ];
            } else if (isSubqueryKey) {
              App.options = [
                {
                  name: "from",
                  type: varcharType,
                  comment: "主表名称"
                },
                {name: "count", type: intType, comment: "每页数量"},
                {name: "page", type: intType, comment: "分页页码"},
                {
                  name: "range",
                  type: varcharType,
                  comment: "比较范围"
                }, {
                  name: "join",
                  type: varcharType,
                  comment: "联表查询"
                },
              ];
            } else if (App.isTableKey(table)) {
              var columnList = App.getColumnListWithModelName(table);
              if (columnList != null) {
                for (var j = 0; j < columnList.length; j++) {
                  var column = App.getColumnObj(columnList, j)
                  var name = column == null ? null : column.column_name;
                  if (StringUtil.isEmpty(name, true)) {
                    continue;
                  }

                  App.options.push({
                    name: name,
                    type: CodeUtil.getType4Language(App.language, column.column_type),
                    comment: column.column_comment
                  })
                }

                var arr = ['{}', '$', '~', '<>', '>', '<', '<=', '>=', '!', '}{', '%', '&$', '|{}', '!~', '+', '-'];
                for (var j = 0; j < columnList.length; j++) {
                  var column = App.getColumnObj(columnList, j)
                  var name = column == null ? null : column.column_name;
                  if (StringUtil.isEmpty(name, true)) {
                    continue;
                  }

                  var which = Math.floor(arr.length * Math.random());
                  App.options.push({
                    name: name + arr[which],
                    type: CodeUtil.getType4Language(App.language, column.column_type),
                    comment: column.column_comment
                  })
                }
              }
            } else {
              App.options.push([
                {name: "format", type: varcharType, comment: "格式化"},
                {name: "tag", type: varcharType, comment: "请求标识"},
                {name: "version", type: varcharType, comment: "请求版本"},
                {name: "[]", type: arrayType, comment: "数组对象"},
              ])
            }

            if (App.isTableKey(table) != true) {
              var tableList = docObj['[]']
              if (tableList != null) {
                for (var j = 0; j < tableList.length; j++) {
                  var tableObj = App.getTableObj(j);
                  var name = tableObj == null ? null : App.getModelNameByTableName(tableObj.table_name);
                  if (StringUtil.isEmpty(name, true)) {
                    continue;
                  }

                  App.options.push({
                    name: name,
                    type: objectType,
                    comment: tableObj.table_comment
                  })
                }
              }
            }

          }
          }
        }

        if (App.options.length > 0) {
          vOption.focus();
        }
        else {
          target.focus();
        }
      }
    },
    watch: {
      jsoncon: function () {
        this.showJsonView()
      }
    },
    computed: {
      theme: function () {
        var th = this.themes[this.checkedTheme]
        var result = {}
        var index = 0;
        ['key', 'String', 'Number', 'Boolean', 'Null', 'link-link'].forEach(function(key) {
          result[key] = th[index]
          index++
        })
        return result
      }
    },
    mounted: function () {
      this.imgMap = {
        before: vBefore || document.getElementById("vBefore"),
        diff: vDiff || document.getElementById("vDiff"),
        after: vAfter || document.getElementById("vAfter")
      };
      this.canvasMap = {
        before: vBeforeCanvas || document.getElementById("vBeforeCanvas"),
        diff: vDiffCanvas || document.getElementById("vDiffCanvas"),
        after: vAfterCanvas || document.getElementById("vAfterCanvas")
      };
    },
    created: function  () {
      try { //可能URL_BASE是const类型，不允许改，这里是初始化，不能出错
        var url = this.getCache('', 'URL_BASE')
        if (StringUtil.isEmpty(url, true) == false) {
          URL_BASE = url
        }
        var database = this.getCache('', 'database')
        if (StringUtil.isEmpty(database, true) == false) {
          this.database = CodeUtil.database = database
        }
        var schema = this.getCache('', 'schema')
        if (StringUtil.isEmpty(schema, true) == false) {
          this.schema = CodeUtil.schema = schema
        }
        var language = this.getCache('', 'language')
        if (StringUtil.isEmpty(language, true) == false) {
          this.language = CodeUtil.language = language
        }

        var methods = this.getCache('', 'methods')
        this.methods = methods instanceof Array ? methods : StringUtil.split(methods, ',', true)
        var types = this.getCache('', 'types')
        this.types = types instanceof Array ? types : StringUtil.split(types, ',', true)

        var otherEnv = this.getCache('', 'otherEnv')
        if (StringUtil.isEmpty(otherEnv, true) == false) {
          this.otherEnv = otherEnv
        }
        var server = this.getCache('', 'server')
        if (StringUtil.isEmpty(server, true) == false) {
          this.server = server
        }
        var thirdParty = this.getCache('', 'thirdParty')
        if (StringUtil.isEmpty(thirdParty, true) == false) {
          this.thirdParty = thirdParty
        }

        this.locals = this.getCache('', 'locals', [])

        this.isDelegateEnabled = this.getCache('', 'isDelegateEnabled', this.isDelegateEnabled)
        this.isEncodeEnabled = this.getCache('', 'isEncodeEnabled', this.isEncodeEnabled)
        this.isEnvCompareEnabled = this.getCache('', 'isEnvCompareEnabled', this.isEnvCompareEnabled)
        //预览了就不能编辑了，点开看会懵 this.isPreviewEnabled = this.getCache('', 'isPreviewEnabled', this.isPreviewEnabled)
        this.isStatisticsEnabled = false // 解决每次都查不到有效 Response this.getCache('', 'isStatisticsEnabled', this.isStatisticsEnabled)
        this.isHeaderShow = this.getCache('', 'isHeaderShow', this.isHeaderShow)
        this.isRandomShow = this.getCache('', 'isRandomShow', this.isRandomShow)
      } catch (e) {
        console.log('created  try { ' +
          '\nvar url = this.getCache(, url) ...' +
          '\n} catch (e) {\n' + e.message)
      }
      try { //这里是初始化，不能出错
        var projectHost = this.getCache('', 'projectHost')
        if (projectHost != null) {
            this.projectHost = projectHost
        }

        var projectHosts = this.getCache('', 'projectHosts')
        if (projectHosts != null && projectHosts.length >= 1) {
          this.projectHosts = projectHosts
        }
      } catch (e) {
        console.log('created  try { ' +
          '\nvar projectHosts = this.getCache("", projectHosts)' +
          '\n} catch (e) {\n' + e.message)
      }
      try { //这里是初始化，不能出错
        var accounts = this.getCache(URL_BASE, 'accounts')
        if (accounts != null && accounts.length >= 1) {
          this.accounts = accounts
          this.currentAccountIndex = this.getCache(URL_BASE, 'currentAccountIndex')
        }
      } catch (e) {
        console.log('created  try { ' +
          '\nvar accounts = this.getCache(URL_BASE, accounts)' +
          '\n} catch (e) {\n' + e.message)
      }
      try { //这里是初始化，不能出错
        var otherEnvTokenMap = this.getCache(this.otherEnv, 'otherEnvTokenMap')
        if (otherEnvTokenMap != null) {
          this.otherEnvTokenMap = otherEnvTokenMap
        }
      } catch (e) {
        console.log('created  try { ' +
            '\nvar otherEnvTokenMap = this.getCache(this.otherEnv, otherEnvTokenMap)' +
            '\n} catch (e) {\n' + e.message)
      }
      try { //这里是初始化，不能出错
        var otherEnvCookieMap = this.getCache(this.otherEnv, 'otherEnvCookieMap')
        if (otherEnvCookieMap != null) {
          this.otherEnvCookieMap = otherEnvCookieMap
        }
      } catch (e) {
        console.log('created  try { ' +
            '\nvar otherEnvCookieMap = this.getCache(this.otherEnv, otherEnvCookieMap)' +
            '\n} catch (e) {\n' + e.message)
      }

      try { //可能URL_BASE是const类型，不允许改，这里是初始化，不能出错
        this.User = this.getCache(this.server, 'User', {})
        this.isCrossEnabled = this.getCache(this.server, 'isCrossEnabled', this.isCrossEnabled)
        this.isMLEnabled = this.getCache(this.server, 'isMLEnabled', this.isMLEnabled)
        this.crossProcess = this.isCrossEnabled ? '交叉账号:已开启' : '交叉账号:已关闭'
        this.testProcess = this.isMLEnabled ? '机器学习:已开启' : '机器学习:已关闭'
        // this.host = this.getBaseUrl()

        this.page = this.getCache(this.server, 'page', this.page)
        this.count = this.getCache(this.server, 'count', this.count)

        this.caseGroupPage = this.getCache(this.server, 'caseGroupPage', this.caseGroupPage)
        this.caseGroupCount = this.getCache(this.server, 'caseGroupCount', this.caseGroupCount)
        this.caseGroupSearch = this.getCache(this.server, 'caseGroupSearch', this.caseGroupSearch)
        this.caseGroupPages = this.getCache(this.server, 'caseGroupPages', this.caseGroupPages)
        this.caseGroupCounts = this.getCache(this.server, 'caseGroupCounts', this.caseGroupCounts)
        this.caseGroupSearches = this.getCache(this.server, 'caseGroupSearches', this.caseGroupSearches)

        this.testCasePage = this.getCache(this.server, 'testCasePage', this.testCasePage)
        this.testCaseCount = this.getCache(this.server, 'testCaseCount', this.testCaseCount)
        this.testCasePages = this.getCache(this.server, 'testCasePages', this.testCasePages)
        this.testCaseCounts = this.getCache(this.server, 'testCaseCounts', this.testCaseCounts)
        this.testCaseSearches = this.getCache(this.server, 'testCaseSearches', this.testCaseSearches)

        this.randomPage = this.getCache(this.server, 'randomPage', this.randomPage)
        this.randomCount = this.getCache(this.server, 'randomCount', this.randomCount)
        this.randomSubPage = this.getCache(this.server, 'randomSubPage', this.randomSubPage)
        this.randomSubCount = this.getCache(this.server, 'randomSubCount', this.randomSubCount)

        this.delegateId = this.getCache(this.server, 'delegateId', this.delegateId)
        this.otherEnvDelegateId = this.getCache(this.server, 'otherEnvDelegateId', this.otherEnvDelegateId)

        CodeUtil.thirdPartyApiMap = this.getCache(this.thirdParty, 'thirdPartyApiMap')
      } catch (e) {
        console.log('created  try { ' +
          '\nthis.User = this.getCache(this.server, User, {})' +
          '\n} catch (e) {\n' + e.message)
      }

      try {
        var accounts = this.accounts
        var num = accounts == null ? 0 : accounts.length
        for (var i = -1; i <= num; i++) {
          this.resetCount(this.getSummary(i), false, false, i)
        }
      } catch (e) {
        console.log('created  try { ' +
          '\nthis.User = this.getCache(this.server, User, {})' +
          '\n} catch (e) {\n' + e.message)
      }

      //无效，只能在index里设置 vUrl.value = this.getCache('', 'URL_BASE')

      this.listHistory()
//      if (this.isScriptShow) {
        this.changeScriptType()
        this.listScript()
//      }

      var isLoggedIn = this.User != null && this.User.id != null && this.User.id > 0
      if (isLoggedIn) {
          this.listProjectHost()

          if (this.caseShowType != 1 && this.casePaths.length <= 0 && this.caseGroups.length <= 0) {
            this.selectCaseGroup(-1, null)
          }
      }

      var rawReq = getRequestFromURL()
      if (rawReq == null || (StringUtil.isEmpty(rawReq.type, true) && StringUtil.isEmpty(rawReq.reportId, true))) {
        this.transfer()

        if (isLoggedIn) {
          setTimeout(function () {
            App.showTestCase(true, false)  // 本地历史仍然要求登录  this.User == null || this.User.id == null)
          }, 1000)
        }
      }
      else {
        setTimeout(function () {
          isSingle = ! isSingle

          var hasTestArg = false  // 避免 http://localhost:63342/APIAuto/index.html?_ijt=fh8di51h7qip2d1s3r3bqn73nt 这种无意义参数
          if (StringUtil.isNotEmpty(rawReq.method, true)) {
            hasTestArg = true
            App.method = StringUtil.toUpperCase(rawReq.method, true)
            if (App.methods == null) {
               App.methods = [App.method]
            }
            else if (App.methods.indexOf(App.method) < 0) {
              App.methods.push(App.method)
            }
          }
          if (StringUtil.isNotEmpty(rawReq.type, true)) {
            hasTestArg = true
            App.type = StringUtil.toUpperCase(rawReq.type, true)
            if (App.types == null) {
               App.types = [App.type]
            }
            else if (App.types.indexOf(App.type) < 0) {
              App.types.push(App.type)
            }
          }

          if (StringUtil.isNotEmpty(rawReq.url, true)) {
            hasTestArg = true
            vUrl.value = StringUtil.trim(rawReq.url)
          }

          var decode = false
          if (StringUtil.isNotEmpty(rawReq.decode, true)) {
            hasTestArg = true
            decode = rawReq.decode == 'true'
          }

          if (StringUtil.isNotEmpty(rawReq.json, true)) {
            hasTestArg = true
            vInput.value = StringUtil.trim(decode ? rawReq.json.replaceAll('\\\\', '') : rawReq.json)
          }

          if (StringUtil.isNotEmpty(rawReq.header, true)) {
            hasTestArg = true
            vHeader.value = StringUtil.trim(rawReq.header, true)
            App.isHeaderShow = true
          }

          if (StringUtil.isNotEmpty(rawReq.random, true)) {
            hasTestArg = true
            // vRandom.value = StringUtil.trim(rawReq.random, true)
            App.isRandomShow = true
            App.isRandomListShow = false
          }

          if (StringUtil.isNotEmpty(rawReq.reportId, true)) {
            try {
              App.reportId = + StringUtil.trim(rawReq.reportId, true)
              if (Number.isNaN(App.reportId)) {
                throw new Error('URL query 中 reportId= 的值必须是 0 以上整数！')
              }
              App.isStatisticsEnabled = true
              App.isRandomShow = true
              App.isRandomListShow = false
              App.showTestCase(true, false)
            } catch (e) {
              App.onResponse(null, {}, e)
              alert(e)
            }
          }

          var delayTime = 0

          // URL 太长导致截断和乱码
          if (StringUtil.isNotEmpty(rawReq.setting, true)) {
            var save = rawReq.save == 'true'
            try {
              var setting = parseJSON(StringUtil.trim(rawReq.setting, true)) || {}

              if ((setting.count != null && setting.count != App.count)
                || (setting.page != null && setting.page != App.page)
                || (setting.search != null && setting.search != App.search)) {
                delayTime += Math.min(5000, 30*(setting.count) + 1000)
                App.setDoc("");
                App.getDoc(function (d) {
                  App.setDoc(d);
                })
              }

              for (var k in setting) {
                var v = k == null ? null : setting[k]
                if (v == null) {
                  continue
                }
                App[k] = v  // App.$data[k] = app[k]

                if (save) {
                  App.saveCache('', k, v)
                }
              }

              if (setting.isTestCaseShow || (setting.isRandomShow && setting.isRandomListShow)) {
                var isTest = hasTestArg
                hasTestArg = false

                App.autoTest(null, delayTime, isTest, rawReq, setting)
              }
            } catch (e) {
              log(e)
            }
          }

          App.handleTestArg(hasTestArg, rawReq, delayTime)
        }, 2000)

      }


      // 快捷键 CTRL + I 格式化 JSON
      document.addEventListener('keydown', function(event) {
        // alert(event.key) 小写字母 i 而不是 KeyI
        if (this.isFullScreen && (event.key == 'Esc' || event.keyCode == 27)) {
          this.isFullScreen = false;
          return;
        }

        var target = event.target;
        if ([vAskAI, vSearch, vTestCaseSearch, vCaseGroupSearch
          , vChainGroupSearch, vChainGroupAdd, vChainAdd
          , vAfterTotal, vAfterThreshold, vRandomKeyPath
        ].indexOf(target) >= 0) {
          return
        }

        var keyCode = event.keyCode;
        var isEnter = keyCode === 13;
        if (isEnter && target == vUrl) {
          App.send(false);
          event.preventDefault();
          return
        }
        var isDel = keyCode === 8 || keyCode === 46; // backspace 和 del
        var isChar = (keyCode >= 48 && keyCode <= 90) || (keyCode >= 106 && keyCode <= 111) || (keyCode >= 186 && keyCode <= 222);

        currentTarget = target;

        if (keyCode === 27) {  // ESC
          if (document.activeElement == vOption || App.options.length > 0) {
            App.options = [];
            if (target != null) {
              target.focus();
            }
            return;
          }
        }
        else if (keyCode === 40 || keyCode === 38) {  // 方向键 上 和 下
          if (document.activeElement == vOption || App.options.length > 0) {
            // currentTarget = target;
            if (keyCode === 38) {
              if (App.selectIndex >= 0) {
                App.selectIndex --
                App.selectInput(App.selectIndex < 0 ? null : App.options[App.selectIndex], App.selectIndex)
              }
            } else if (App.selectIndex < App.options.length) {
              App.selectIndex ++
              App.selectInput(App.selectIndex >= App.options.length ? null : App.options[App.selectIndex], App.selectIndex)
            }

            // var options = document.activeElement == vOption || App.options.length > 0 ? App.options : null; // vOption.options : null;
            // if (options != null) {
            //   for (var i = 0; i < options.length; i++) {
            //     var opt = options[i]
            //     if (opt != null && (opt.selected || i == App.selectIndex)) {
            //       if (keyCode === 38) {
            //         if (i > 0) {
            //           opt.selected = false
            //           options[i - 1].selected = true
            //           App.selectInput(App.options[i - 1], i - 1)
            //         }
            //       } else {
            //         if (i < options.length - 1) {
            //           opt.selected = false
            //           options[i + 1].selected = true
            //           App.selectInput(App.options[i + 1], i + 1)
            //         }
            //       }
            //
            //       break
            //     }
            //   }

            event.preventDefault();
            return;
            // }
          }
        }
        else if (isEnter || isDel) { // enter || delete
          if (document.activeElement == vOption || App.options.length > 0) { // hasFocus is undefined   vOption.hasFocus()) {

            var options = vOption.options || App.options
            if (options != null && options.length > 0) {
              if (isDel) {
                var selectionStart = target.selectionStart;
                var selectionEnd = target.selectionEnd;

                var text = StringUtil.get(target.value);
                var before = text.substring(0, selectionStart);
                var after = text.substring(selectionEnd);

                App.showOptions(target, text, before, after);
              }
              else {
                event.preventDefault();

                for (var i = 0; i < options.length; i++) {
                  var opt = options[i]
                  if (opt != null && (opt.selected || i == App.selectIndex)) {
                    // currentTarget = target;
                    App.selectInput(App.options[i], i, true);
                    return;
                  }
                }

                App.selectIndex - 1;
                App.options = [];
              }
            }

            return;
          }

          if (target == vUrl) {
          }
          else if (target != null && target != vOption) {
            var selectionStart = target.selectionStart;
            var selectionEnd = target.selectionEnd;

            var text = StringUtil.get(target.value);
            var before = text.substring(0, selectionStart);
            var after = text.substring(selectionEnd);

            var firstIndex = isEnter ? after.indexOf('\n') : -1;
            var firstLine = firstIndex <= 0 ? '' : after.substring(0, firstIndex);
            var tfl = firstLine.trimLeft();

            var hasRight = tfl.length > 0;
            if (isEnter && hasRight != true) {
              var aft = after.substring(firstIndex + 1);
              var fi = aft.indexOf('\n');
              tfl = fi < 0 ? aft : aft.substring(0, fi);
            }

            // var lastLineStart = isEnter && tfl.length > 0 ? -1 : before.lastIndexOf('\n') + 1;
            var lastLineStart = before.lastIndexOf('\n') + 1;
            var lastLine = lastLineStart < 0 ? '' : before.substring(lastLineStart);

            var prefixEnd = 0;
            for (var i = 0; i < lastLine.length; i++) {
              if (lastLine.charAt(i).trim().length > 0) {
                if (isDel) {
                  prefixEnd = 0;
                }
                break;
              }

              prefixEnd += 1;
            }


            var prefix = prefixEnd <= 0 ? '' : lastLine.substring(0, prefixEnd);

            var isStart = false;
            var isEnd = false;
            var hasPadding = false;
            var hasComma = false;
            var isVar = false;
            var isJSON = false;
            var hasNewKey = null;
            if (isEnter) {
              isEnd = tfl.startsWith(']') || tfl.startsWith('}')
              var tll = lastLine.trimRight();
              if (target != vInput) {
                hasNewKey = ! hasRight;
              }
              else if (isEnd || hasRight || tll.endsWith('[')) {
                hasNewKey = false;
              }
              // else if (tll.indexOf('":') > 1 || tll.indexOf("':") > 1) {
              else if (tll.indexOf(':') > 1) { // (target == vInput ? 1 : 0) || (target == vScript && tll.indexOf('=') > 0)) {
                hasNewKey = true;
              }
              // else {
              //   var ind = tll.indexOf(':')
              //   if (ind > 0) {
              //     var ind2 = tll.indexOf('"')
              //   }
              // }

              var lastInd = tfl.lastIndexOf('(');
              isVar = target == vScript && (before.indexOf('{') < 0 || (lastInd > 0 && tfl.endsWith('{') && tfl.lastIndexOf(')') > lastInd));
              isJSON = target == vInput || (isVar != true && target == vScript);

              isStart = tll.endsWith('{') || tll.endsWith('[');
              hasPadding = hasRight != true && isStart;

              tll = before.trimRight();
              hasComma = isJSON && isStart != true && isEnd != true && hasRight != true && tll.endsWith(',') != true;
              if (hasComma) {
                for (var i = before.length; i >= 0; i--) {
                  if (before.charAt(i).trim().length > 0) {
                    break;
                  }

                  selectionStart -= 1;
                }

                before = tll + ',';
                selectionStart += 1;
              }

              if (hasNewKey == null) {
                hasNewKey = tll.endsWith('{');
              }

            }

            if (prefix.length > 0 || (isEnter && target != vInput)) {
              if (isEnter) {
                // if (target == vScript) {
                //   hasNewKey = false // TODO 把全局定义的 function, variable 等放到 options。 var value = fun()
                //   target.value = before + '\n' + prefix + (hasPadding ? '    ' : '')
                //     + (isEnd ? after : (hasRight ? (hasPadding ? tfl : tfl) : '') + '\n' + after.substring(firstIndex + 1)
                //     );
                //   target.selectionEnd = target.selectionStart = selectionStart + prefix.length + 1 + (hasPadding ? 4 : 0);
                // }
                // else {
                  var newText = before + '\n' + prefix + (hasPadding ? '    ' : '')
                    + (hasNewKey ? (isJSON != true ? (isVar ? 'var ' : '') : (isSingle ? "''" : '""'))
                      + (isVar ? ' = ' : ': ') + (target == vHeader ? '' : 'null') + (hasComma || isEnd || isJSON != true ? '' : ',') : '')
                    + (isEnd ? after : (hasRight ? (hasPadding ? tfl.trimLeft() : tfl) : '') + '\n' + after.substring(firstIndex + 1)
                    );
                  target.value = newText
                  if (target == vScript) { // 不这样会自动回滚
                    App.scripts[App.scriptType][App.scriptBelongId][App.isPreScript ? 'pre' : 'post'].script = newText
                  }

                  target.selectionEnd = target.selectionStart = selectionStart + prefix.length + (hasComma && isJSON ? 1 : 0)
                    + (hasNewKey ? 1 : 0) + (hasPadding ? 4 : 0) + (isVar ? 4 : (isJSON ? 1 : 0));
                // }
                event.preventDefault();

                if (hasNewKey) {
                  App.showOptions(target, text, before, after);
                  if (target == vInput) {
                    inputted = target.value;
                  }
                  return;
                }
              }
              else if (isDel) {
                var newStr = (selectionStart == selectionEnd ? StringUtil.get(before.substring(0, lastLineStart - 1) + ' ') : before) + after;
                target.value = newStr;
                if (target == vScript) { // 不这样会自动回滚
                  App.scripts[App.scriptType][App.scriptBelongId][App.isPreScript ? 'pre' : 'post'].script = newStr
                }

                target.selectionEnd = target.selectionStart = selectionStart == selectionEnd ? lastLineStart - 1 : selectionStart;
                event.preventDefault();
              }

              if (target == vInput) {
                inputted = target.value;
              }
            }
          }
        }
        else if (target != null && keyCode === 9) {  // Tab 加空格
          try {
            var selectionStart = target.selectionStart;
            var selectionEnd = target.selectionEnd;

            var text = StringUtil.get(target.value);
            var before = text.substring(0, selectionStart);
            var after = text.substring(selectionEnd);

            var ind = before.lastIndexOf('\n');
            var start = ind < 0 ? 0 : ind + 1;
            ind = after.indexOf('\n');
            var end = ind < 0 ? text.length : selectionEnd + ind - 1;

            var selection = text.substring(start, end);
            var lines = StringUtil.split(selection, '\n');

            var newStr = text.substring(0, start);

            var prefix = '    ';
            var prefixLen = prefix.length;
            for (var i = 0; i < lines.length; i ++) {
              var l = lines[i] || '';
              if (i > 0) {
                newStr += '\n';
              }

              newStr += prefix + l;
              if (i <= 0) {
                selectionStart += prefixLen;
              }
              selectionEnd += prefixLen;
            }

            newStr += text.substring(end);

            target.value = newStr;
            if (target == vScript) { // 不这样会自动回滚
              App.scripts[App.scriptType][App.scriptBelongId][App.isPreScript ? 'pre' : 'post'].script = newStr
            }

            event.preventDefault();
            if (target == vInput) {
              inputted = newStr;
            }

            target.selectionStart = selectionStart;
            target.selectionEnd = selectionEnd;
          } catch (e) {
            log(e)
          }
        }
        else if ((event.ctrlKey || event.metaKey) && keyCode == 83) { // Ctrl + S 保存
          App.showSave(true)
          event.preventDefault()
        }
        else if (target != null && (event.ctrlKey || event.metaKey) && ([68, 73, 191].indexOf(keyCode) >= 0 || (isChar != true && event.shiftKey != true))) {
          var selectionStart = target.selectionStart;
          var selectionEnd = target.selectionEnd;

          // 这里拿不到 clipboardData  if (keyCode === 86) {

          if (keyCode === 73) {  // Ctrl + 'I'  格式化
            try {
              if (target == vInput) {
                var json = JSON.stringify(JSON5.parse(vInput.value), null, '    ');
                vInput.value = inputted = isSingle ? App.switchQuote(json) : json;
              }
              else {
                var lines = StringUtil.split(target.value, '\n');
                var newStr = '';

                for (var i = 0; i < lines.length; i ++) {
                  var l = StringUtil.trim(lines[i]) || '';
                  if (l.startsWith('//')) {
                   continue;
                  }

                  var ind = l.lastIndexOf(' //');
                  l = ind < 0 ? l : StringUtil.trim(l.substring(0, ind));

                  if (target == vHeader || target == vRandom) {
                    ind = l.indexOf(':');
                    if (ind >= 0) {
                      var left = target == vHeader ? StringUtil.trim(l.substring(0, ind)) : l.substring(0, ind);
                      l = left + ': ' + StringUtil.trim(l.substring(ind + 1));
                    }
                  }

                  if (l.length > 0) {
                    newStr += '\n' + l;
                  }
                }

                newStr = StringUtil.trim(newStr);
                target.value = newStr;
                if (target == vScript) { // 不这样会自动回滚
                  App.scripts[App.scriptType][App.scriptBelongId][App.isPreScript ? 'pre' : 'post'].script = newStr
                }
              }
            } catch (e) {
              log(e)
            }
          }
          else if (target != null && keyCode === 191) {  // Ctrl + '/' 注释与取消注释
            try {
              var text = StringUtil.get(target.value);
              var before = text.substring(0, selectionStart);
              var after = text.substring(selectionEnd);

              var ind = before.lastIndexOf('\n');
              var start = ind < 0 ? 0 : ind + 1;
              ind = after.indexOf('\n');
              var end = ind < 0 ? text.length : selectionEnd + ind - 1;

              var selection = text.substring(start, end);
              var lines = StringUtil.split(selection, '\n');

              var newStr = text.substring(0, start);

              var commentSign = '//'
              var commentSignLen = commentSign.length

              for (var i = 0; i < lines.length; i ++) {
                var l = lines[i] || '';
                if (i > 0) {
                  newStr += '\n';
                }

                if (StringUtil.trim(l).startsWith(commentSign)) {
                  var ind = l.indexOf(commentSign);
                  var suffix = l.substring(ind + commentSignLen);
                  if (suffix.startsWith(' ')) {
                    suffix = suffix.substring(1);
                    if (i <= 0) {
                      selectionStart -= 1;
                    }
                    selectionEnd -= 1;
                  }

                  newStr += StringUtil.get(l.substring(0, ind)) + StringUtil.get(suffix)
                  if (i <= 0) {
                    selectionStart -= commentSignLen;
                  }
                  selectionEnd -= commentSignLen;
                }
                else {
                  newStr += commentSign + ' ' + l;
                  if (i <= 0) {
                    selectionStart += commentSignLen + 1;
                  }
                  selectionEnd += commentSignLen + 1;
                }
              }

              newStr += text.substring(end);

              target.value = newStr;
              if (target == vScript) { // 不这样会自动回滚
                App.scripts[App.scriptType][App.scriptBelongId][App.isPreScript ? 'pre' : 'post'].script = newStr
              }

              if (target == vInput) {
                inputted = newStr;
              }
            } catch (e) {
              log(e)
            }
          }
          else if (target != null && keyCode == 68) {  // Ctrl + 'D' 删除行
            try {
              var text = StringUtil.get(target.value);
              var before = text.substring(0, selectionStart);
              var after = text.substring(selectionEnd);

              var lastIndex = before.lastIndexOf('\n');
              var firstIndex = after.indexOf('\n');

              var newStr = (lastIndex < 0 ? '' : before.substring(0, lastIndex)) + '\n' + after.substring(firstIndex + 1);
              target.value = newStr;
              if (target == vScript) { // 不这样会自动回滚
                App.scripts[App.scriptType][App.scriptBelongId][App.isPreScript ? 'pre' : 'post'].script = newStr
              }

              selectionEnd = selectionStart = lastIndex + 1;
              event.preventDefault();

              if (target == vInput) {
                inputted = newStr;
              }
            } catch (e) {
              log(e)
            }
          }

          target.selectionStart = selectionStart;
          target.selectionEnd = selectionEnd;
        }
        else if (target != null && (event.shiftKey || isChar)) {
          if (isChar && App.options.length > 0) {
            var key = StringUtil.get(event.key);

            var selectionStart = target.selectionStart;
            var selectionEnd = target.selectionEnd;

            var text = StringUtil.get(target.value);
            var before = text.substring(0, selectionStart);
            var after = text.substring(selectionEnd);
            var selection = text.substring(selectionStart, selectionEnd);
            text = before + (isInputValue && selection == 'null' ? '' : selection) + key + after;

            target.value = text;
            if (target == vScript) { // 不这样会自动回滚
              App.scripts[App.scriptType][App.scriptBelongId][App.isPreScript ? 'pre' : 'post'].script = text
            }

            target.selectionStart = selectionStart;
            target.selectionEnd = (isInputValue && selection == 'null' ? selectionStart : selectionEnd) + key.length;
            event.preventDefault();

            App.showOptions(target, text, before, after, isInputValue, key);
          }

          return;
        }

        App.selectIndex = -1;
        App.options = [];
      })
    }
  }

  if (IS_BROWSER) {
    App = new Vue(App)
    window.App = App
  }
  else {
    var methods = App.methods
    if (methods instanceof Object && (methods instanceof Array == false)) {
      App = Object.assign(App, methods)
    }
    App.autoTest = App.autoTest || methods.autoTest

    var data = App.data
    if (data instanceof Object && (data instanceof Array == false)) {
      App = Object.assign(App, data)
    }

    module.exports = {getRequestFromURL, App}
  }

})()

// APIJSON >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

