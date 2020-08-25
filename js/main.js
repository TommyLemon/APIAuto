
(function () {
  Vue.component('vue-item', {
    props: ['jsondata', 'theme'],
    template: '#item-template'
  })

  Vue.component('vue-outer', {
    props: ['jsondata', 'isend', 'path', 'theme'],
    template: '#outer-template'
  })

  Vue.component('vue-expand', {
    props: [],
    template: '#expand-template'
  })

  Vue.component('vue-val', {
    props: ['field', 'val', 'isend', 'path', 'theme'],
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
        var mIndex = method == null ? -1 : method.indexOf('/');
        var isRestful = mIndex > 0 && mIndex < method.length - 1;

        try {
          if (val instanceof Array) {
            if (val[0] instanceof Object && (val[0] instanceof Array == false) && JSONObject.isArrayKey(key, null, isRestful)) {
              // alert('onRenderJSONItem  key = ' + key + '; val = ' + JSON.stringify(val))

              var ckey = key.substring(0, key.lastIndexOf('[]'));

              var aliaIndex = ckey.indexOf(':');
              var objName = aliaIndex < 0 ? ckey : ckey.substring(0, aliaIndex);

              var firstIndex = objName.indexOf('-');
              var firstKey = firstIndex < 0 ? objName : objName.substring(0, firstIndex);

              for (var i = 0; i < val.length; i++) {
                var cPath = (StringUtil.isEmpty(path, false) ? '' : path + '/') + key;

                if (JSONObject.isTableKey(firstKey, val, isRestful)) {
                  // var newVal = JSON.parse(JSON.stringify(val[i]))

                  var newVal = {}
                  for (var k in val[i]) {
                    newVal[k] = val[i][k] //提升性能
                    delete val[i][k]
                  }

                  val[i]._$_this_$_ = JSON.stringify({
                    path: cPath + '/' + i,
                    table: firstKey
                  })

                  for (var k in newVal) {
                    val[i][k] = newVal[k]
                  }
                }
                else {
                  this.onRenderJSONItem(val[i], '' + i, cPath);
                }

                // this.$children[i]._$_this_$_ = key
                // alert('this.$children[i]._$_this_$_ = ' + this.$children[i]._$_this_$_)
              }
            }
          }
          else if (val instanceof Object) {
            var aliaIndex = key.indexOf(':');
            var objName = aliaIndex < 0 ? key : key.substring(0, aliaIndex);

            // var newVal = JSON.parse(JSON.stringify(val))

            var newVal = {}
            for (var k in val) {
              newVal[k] = val[k] //提升性能
              delete val[k]
            }

            val._$_this_$_ = JSON.stringify({
              path: (StringUtil.isEmpty(path, false) ? '' : path + '/') + key,
              table: JSONObject.isTableKey(objName, val, isRestful) ? objName : null
            })

            for (var k in newVal) {
              val[k] = newVal[k]
            }

            // val = Object.assign({ _$_this_$_: objName }, val) //解决多显示一个逗号 ,

            // this._$_this_$_ = key  TODO  不影响 JSON 的方式，直接在组件读写属性
            // alert('this._$_this_$_ = ' + this._$_this_$_)
          }


        } catch (e) {
          alert('onRenderJSONItem  try { ... } catch (e) {\n' + e.message)
        }

        return true

      }


      /**显示 Response JSON 的注释
       * @author TommyLemon
       * @param val
       * @param key
       * @param $event
       */
      Vue.prototype.setResponseHint = function (val, key, $event) {
        console.log('setResponseHint')
        this.$refs.responseKey.setAttribute('data-hint', isSingle ? '' : this.getResponseHint(val, key, $event));
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
      Vue.prototype.getResponseHint = function (val, key, $event) {
        // alert('setResponseHint  key = ' + key + '; val = ' + JSON.stringify(val))

        var s = ''

        try {

          var path = null
          var table = null
          var column = null

          var method = App.getMethod();
          var mIndex = method == null ? -1 : method.indexOf('/');
          var isRestful = mIndex > 0 && mIndex < method.length - 1;

          if (val instanceof Object && (val instanceof Array == false)) {

            var parent = $event.currentTarget.parentElement.parentElement
            var valString = parent.textContent

            // alert('valString = ' + valString)

            var i = valString.indexOf('"_$_this_$_":  "')
            if (i >= 0) {
              valString = valString.substring(i + '"_$_this_$_":  "'.length)
              i = valString.indexOf('}"')
              if (i >= 0) {
                valString = valString.substring(0, i + 1)
                // alert('valString = ' + valString)
                var _$_this_$_ = JSON.parse(valString) || {}
                path = _$_this_$_.path
                table = _$_this_$_.table
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

            var i = valString.indexOf('"_$_this_$_":  "')
            if (i >= 0) {
              valString = valString.substring(i + '"_$_this_$_":  "'.length)
              i = valString.indexOf('}"')
              if (i >= 0) {
                valString = valString.substring(0, i + 1)
                // alert('valString = ' + valString)
                var _$_this_$_ = JSON.parse(valString) || {}
                path = _$_this_$_.path
                table = _$_this_$_.table
              }
            }

            if (val instanceof Array && JSONObject.isArrayKey(key, val, isRestful)) {
              var key2 = key == null ? null : key.substring(0, key.lastIndexOf('[]'));

              var aliaIndex = key2 == null ? -1 : key2.indexOf(':');
              var objName = aliaIndex < 0 ? key2 : key2.substring(0, aliaIndex);

              var firstIndex = objName == null ? -1 : objName.indexOf('-');
              var firstKey = firstIndex < 0 ? objName : objName.substring(0, firstIndex);

              // alert('key = ' + key + '; firstKey = ' + firstKey + '; firstIndex = ' + firstIndex)
              if (JSONObject.isTableKey(firstKey, null, isRestful)) {
                table = firstKey

                var s0 = '';
                if (firstIndex > 0) {
                  objName = objName.substring(firstIndex + 1);
                  firstIndex = objName.indexOf('-');
                  column = firstIndex < 0 ? objName : objName.substring(0, firstIndex)

                  var pathUri = (StringUtil.isEmpty(path) ? '' : path + '/') + key;

                  var c = CodeUtil.getCommentFromDoc(docObj == null ? null : docObj['[]'], table, column, App.getMethod(), App.database, App.language, true, false, pathUri.split('/'), isRestful, val); // this.getResponseHint({}, table, $event
                  s0 = column + (StringUtil.isEmpty(c, true) ? '' : ': ' + c)
                }

                var pathUri = (StringUtil.isEmpty(path) ? '' : path + '/') + (StringUtil.isEmpty(column) ? key : column);

                var c = CodeUtil.getCommentFromDoc(docObj == null ? null : docObj['[]'], table, isRestful ? key : null, App.getMethod(), App.database, App.language, true, false, pathUri.split('/'), isRestful, val);
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
          var c = CodeUtil.getCommentFromDoc(docObj == null ? null : docObj['[]'], table, isRestful ? key : column, method, App.database, App.language, true, false, pathUri.split('/'), isRestful, val);

          s += pathUri + (StringUtil.isEmpty(c, true) ? '' : ': ' + c)
        }
        catch (e) {
          s += '\n' + e.message
        }

        return s;
      }

    }
  })


  var DEBUG = false

  var initJson = {}

// 主题 [key, String, Number, Boolean, Null, link-link, link-hover]
  var themes = [
    ['#92278f', '#3ab54a', '#25aae2', '#f3934e', '#f34e5c', '#717171'],
    ['rgb(19, 158, 170)', '#cf9f19', '#ec4040', '#7cc500', 'rgb(211, 118, 126)', 'rgb(15, 189, 170)'],
    ['#886', '#25aae2', '#e60fc2', '#f43041', 'rgb(180, 83, 244)', 'rgb(148, 164, 13)'],
    ['rgb(97, 97, 102)', '#cf4c74', '#20a0d5', '#cd1bc4', '#c1b8b9', 'rgb(25, 8, 174)']
  ]




// APIJSON <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

  var PLATFORM_POSTMAN = 'POSTMAN'
  var PLATFORM_SWAGGER = 'SWAGGER'
  var PLATFORM_YAPI = 'YAPI'
  var PLATFORM_RAP = 'RAP'

  var REQUEST_TYPE_PARAM = 'PARAM'  // GET ?a=1&b=c&key=value
  var REQUEST_TYPE_FORM = 'FORM'  // POST x-www-form-urlencoded
  var REQUEST_TYPE_DATA = 'DATA'  // POST form-data
  var REQUEST_TYPE_JSON = 'JSON'  // POST application/json
  var REQUEST_TYPE_GRPC = 'GRPC'  // POST application/json

  var RANDOM_DB = 'RANDOM_DB'
  var RANDOM_IN = 'RANDOM_IN'
  var RANDOM_INT = 'RANDOM_INT'
  var RANDOM_NUM = 'RANDOM_NUM'
  var RANDOM_STR = 'RANDOM_STR'

  var ORDER_DB = 'ORDER_DB'
  var ORDER_IN = 'ORDER_IN'
  var ORDER_INT = 'ORDER_INT'

  var ORDER_MAP = {}

  function randomInt(min, max) {
    return randomNum(min, max, 0);
  }
  function randomNum(min, max, precision) {
    // 0 居然也会转成  Number.MIN_SAFE_INTEGER ！！！
    // start = start || Number.MIN_SAFE_INTEGER
    // end = end || Number.MAX_SAFE_INTEGER

    if (min == null) {
      min = Number.MIN_SAFE_INTEGER
    }
    if (max == null) {
      max = Number.MAX_SAFE_INTEGER
    }
    if (precision == null) {
      precision = 2
    }

    return + ((max - min)*Math.random() + min).toFixed(precision);
  }
  function randomStr(minLength, maxLength, availableChars) {
    return 'Ab_Cd' + randomNum();
  }
  function randomIn(...args) {
    return args == null || args.length <= 0 ? null : args[randomInt(0, args.length - 1)];
  }

  function orderInt(desc, index, min, max) {
    if (min == null) {
      min = Number.MIN_SAFE_INTEGER
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
    return args == null || args.length <= index ? null : args[desc ? args.length - index : index];
  }

  function getOrderIndex(randomId, line, argCount) {
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

    orderIndex ++
    orderIndex = argCount == null || argCount <= 0 ? orderIndex : orderIndex%argCount;
    ORDER_MAP[randomId][line] = orderIndex;

    // alert('orderIndex = ' + orderIndex)
    // alert('ORDER_MAP = ' + JSON.stringify(ORDER_MAP, null, '  '));
    return orderIndex;
  }
  //这些全局变量不能放在data中，否则会报undefined错误

  var baseUrl
  var inputted
  var handler
  var docObj
  var doc
  var output

  var isSingle = true

  var doneCount

// APIJSON >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

  var App = new Vue({
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
      urlComment: '关联查询 Comment.userId = User.id',
      historys: [],
      history: {name: '请求0'},
      remotes: [],
      locals: [],
      testCases: [],
      randoms: [],
      randomSubs: [],
      account: '13000082001',
      password: '123456',
      accounts: [
        {
          'isLoggedIn': false,
          'name': '测试账号1',
          'phone': '13000082001',
          'password': '123456'
        },
        {
          'isLoggedIn': false,
          'name': '测试账号2',
          'phone': '13000082002',
          'password': '123456'
        },
        {
          'isLoggedIn': false,
          'name': '测试账号3',
          'phone': '13000082003',
          'password': '123456'
        }
      ],
      currentAccountIndex: 0,
      tests: { '-1':{}, '0':{}, '1':{}, '2': {} },
      crossProcess: '交叉账号:已关闭',
      testProcess: '机器学习:已关闭',
      randomTestTitle: '随机测试 Random Test',
      testRandomCount: 1,
      testRandomProcess: '',
      compareColor: '#0000',
      isDelayShow: false,
      isSaveShow: false,
      isExportShow: false,
      isExportRandom: false,
      isTestCaseShow: false,
      isHeaderShow: false,
      isRandomShow: true,  //默认展示
      isRandomListShow: false,
      isRandomSubListShow: false,
      isRandomEditable: false,
      isLoginShow: false,
      isConfigShow: false,
      isDeleteShow: false,
      currentDocItem: {},
      currentRemoteItem: {},
      currentRandomItem: {},
      isAdminOperation: false,
      loginType: 'login',
      isExportRemote: false,
      isRegister: false,
      isCrossEnabled: false,
      isMLEnabled: false,
      isDelegateEnabled: false,
      isLocalShow: false,
      uploadTotal: 0,
      uploadDoneCount: 0,
      uploadFailCount: 0,
      exTxt: {
        name: 'APIJSON测试',
        button: '保存',
        index: 0
      },
      themes: themes,
      checkedTheme: 0,
      isExpand: true,
      User: {
        id: 0,
        name: '',
        head: ''
      },
      Privacy: {
        id: 0,
        balance: null //点击更新提示需要判空 0.00
      },
      type: REQUEST_TYPE_JSON,
      types: [ REQUEST_TYPE_JSON, REQUEST_TYPE_PARAM ],  //默认展示
      host: '',
      database: 'MYSQL',// 'POSTGRESQL',
      schema: 'sys',
      server: 'http://apijson.org:9090',  //apijson.org:8000
      // server: 'http://47.74.39.68:9090',  // apijson.org
      // thirdParty: 'SWAGGER /v2/api-docs',  //apijson.org:8000
      // thirdParty: 'RAP /repository/joined /repository/get',
      thirdParty: 'YAPI /api/interface/list_menu /api/interface/get',
      language: CodeUtil.LANGUAGE_KOTLIN,
      header: {},
      page: 0,
      count: 100,
      search: '',
      testCasePage: 0,
      testCaseCount: 50,
      testCaseSearch: '',
      randomPage: 0,
      randomCount: 50,
      randomSearch: '',
      randomSubPage: 0,
      randomSubCount: 50,
      randomSubSearch: ''
    },
    methods: {

      // 全部展开
      expandAll: function () {
        if (App.view != 'code') {
          alert('请先获取正确的JSON Response！')
          return
        }

        $('.icon-square-min').show()
        $('.icon-square-plus').hide()
        $('.expand-view').show()
        $('.fold-view').hide()

        App.isExpand = true;
      },

      // 全部折叠
      collapseAll: function () {
        if (App.view != 'code') {
          alert('请先获取正确的JSON Response！')
          return
        }

        $('.icon-square-min').hide()
        $('.icon-square-plus').show()
        $('.expand-view').hide()
        $('.fold-view').show()

        App.isExpand = false;
      },

      // diff
      diffTwo: function () {
        var oldJSON = {}
        var newJSON = {}
        App.view = 'code'
        try {
          oldJSON = jsonlint.parse(App.jsoncon)
        } catch (ex) {
          App.view = 'error'
          App.error = {
            msg: '原 JSON 解析错误\r\n' + ex.message
          }
          return
        }

        try {
          newJSON = jsonlint.parse(App.jsoncon)
        } catch (ex) {
          App.view = 'error'
          App.error = {
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
        App.baseview = 'diff'
        App.diffTwo()
      },

      // 回到格式化视图
      baseViewToFormater: function () {
        App.baseview = 'formater'
        App.view = 'code'
        App.showJsonView()
      },

      // 根据json内容变化格式化视图
      showJsonView: function () {
        if (App.baseview === 'diff') {
          return
        }
        try {
          if (this.jsoncon.trim() === '') {
            App.view = 'empty'
          } else {
            App.view = 'code'

            if (isSingle) {
              App.jsonhtml = jsonlint.parse(this.jsoncon)
            }
            else {
              App.jsonhtml = Object.assign({
                _$_this_$_: JSON.stringify({
                  path: null,
                  table: null
                })
              }, jsonlint.parse(this.jsoncon))
            }

          }
        } catch (ex) {
          App.view = 'error'
          App.error = {
            msg: ex.message
          }
        }
      },


      showUrl: function (isAdminOperation, branchUrl) {
        if (StringUtil.isEmpty(this.host, true)) {  //显示(可编辑)URL Host
          if (isAdminOperation != true) {
            baseUrl = this.getBaseUrl()
          }
          vUrl.value = (isAdminOperation ? App.server : baseUrl) + branchUrl
        }
        else {  //隐藏(固定)URL Host
          if (isAdminOperation) {
            this.host = App.server
          }
          vUrl.value = branchUrl
        }

        vUrlComment.value = isSingle || StringUtil.isEmpty(App.urlComment, true)
          ? '' : vUrl.value + CodeUtil.getComment(App.urlComment, false, '  ')
          + ' - ' + (App.requestVersion > 0 ? 'V' + App.requestVersion : 'V*');
      },

      //设置基地址
      setBaseUrl: function () {
        if (StringUtil.isEmpty(this.host, true) != true) {
          return
        }
        // 重新拉取文档
        var bu = this.getBaseUrl()
        if (baseUrl != bu) {
          baseUrl = bu;
          doc = null //这个是本地的数据库字典及非开放请求文档
          this.saveCache('', 'URL_BASE', baseUrl)

          //已换成固定的管理系统URL

          // this.remotes = []

          // var index = baseUrl.indexOf(':') //http://localhost:8080
          // App.server = (index < 0 ? baseUrl : baseUrl.substring(0, baseUrl)) + ':9090'

        }
      },
      getUrl: function () {
        var url = StringUtil.get(this.host) + new String(vUrl.value)
        return url.replace(/ /g, '')
      },
      //获取基地址
      getBaseUrl: function () {
        var url = new String(vUrl.value).trim()
        var length = this.getBaseUrlLength(url)
        url = length <= 0 ? '' : url.substring(0, length)
        return url == '' ? URL_BASE : url
      },
      //获取基地址长度，以://后的第一个/分割baseUrl和method
      getBaseUrlLength: function (url_) {
        var url = StringUtil.trim(url_)
        var index = url.indexOf(' ')
        if (index >= 0) {
          return index + 1
        }

        index = url.indexOf('://')
        return index < 0 ? 0 : index + 3 + url.substring(index + 3).indexOf('/')
      },
      //获取操作方法
      getMethod: function () {
        var url = new String(vUrl.value).trim()
        var index = this.getBaseUrlLength(url)
        url = index <= 0 ? url : url.substring(index)
        return url.startsWith('/') ? url.substring(1) : url
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

      getRequest: function (json, defaultValue) {
        var s = App.toDoubleJSON(json, defaultValue);
        if (StringUtil.isEmpty(s, true)) {
          return defaultValue
        }
        try {
          return jsonlint.parse(s);
        }
        catch (e) {
          log('main.getRequest', 'try { return jsonlint.parse(s); \n } catch (e) {\n' + e.message)
          log('main.getRequest', 'return jsonlint.parse(App.removeComment(s));')
          return jsonlint.parse(App.removeComment(s));
        }
      },
      getHeader: function (text) {
        var header = {}
        var hs = StringUtil.isEmpty(text, true) ? null : StringUtil.split(text, '\n')

        if (hs != null && hs.length > 0) {
          var item
          for (var i = 0; i < hs.length; i++) {
            item = hs[i]
            var index = item.indexOf('//')  //这里只支持单行注释，不用 removeComment 那种带多行的去注释方式
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

            var ind = val.indexOf('(')  //一定要有函数是为了避免里面是一个简短单词和 APIAuto 代码中变量冲突
            if (ind > 0 && val.indexOf(')') > ind) {  //不从 0 开始是为了保证是函数，且不是 (1) 这种单纯限制作用域的括号
              try {
                val = eval(val)
              }
              catch (e) {
                App.log("getHeader  if (hs != null && hs.length > 0) { ... if (ind > 0 && val.indexOf(')') > ind) { ... try { val = eval(val) } catch (e) = " + e.message)
              }
            }

            header[StringUtil.trim(item2.substring(0, index))] = val
          }
        }

        return header
      },

      // 显示保存弹窗
      showSave: function (show) {
        if (show) {
          if (App.isTestCaseShow) {
            alert('请先输入请求内容！')
            return
          }

          var tag = App.getTag()
          App.history.name = App.getMethod() + (StringUtil.isEmpty(tag, true) ? '' : ' ' + tag) + ' ' + App.formatTime() //不自定义名称的都是临时的，不需要时间太详细
        }
        App.isSaveShow = show
      },

      // 显示导出弹窗
      showExport: function (show, isRemote, isRandom) {
        if (show) {
          if (isRemote) { //共享测试用例
            App.isExportRandom = isRandom
            if (App.isTestCaseShow) {
              alert('请先输入请求内容！')
              return
            }
            if (App.view != 'code') {
              alert('请先测试请求，确保是正确可用的！')
              return
            }
            if (isRandom) {
              App.exTxt.name = '随机配置 ' + App.formatDateTime()
            }
            else {
              var tag = App.getTag()
              App.exTxt.name = App.getMethod() + (StringUtil.isEmpty(tag, true) ? '' : ' ' + tag)
            }
          }
          else { //下载到本地
            if (App.isTestCaseShow) { //文档
              App.exTxt.name = 'APIJSON自动化文档 ' + App.formatDateTime()
            }
            else if (App.view == 'markdown' || App.view == 'output') {
              var suffix
              switch (App.language) {
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
                case CodeUtil.LANGUAGE_OBJECTIVE_C:
                  suffix = '.h';
                  break;

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

              App.exTxt.name = 'User' + suffix
              alert('自动生成模型代码，可填类名后缀:\n'
                + 'Kotlin.kt, Java.java, Swift.swift, Objective-C.m, C#.cs, Go.go,'
                + '\nTypeScript.ts, JavaScript.js, PHP.php, Python.py, C++.cpp');
            }
            else {
              App.exTxt.name = 'APIJSON测试 ' + App.getMethod() + ' ' + App.formatDateTime()
            }
          }
        }
        App.isExportShow = show
        App.isExportRemote = isRemote
      },

      // 显示配置弹窗
      showConfig: function (show, index) {
        App.isConfigShow = false
        if (App.isTestCaseShow) {
          if (index == 3 || index == 4 || index == 5 || index == 10) {
            App.showTestCase(false, false)
          }
        }

        if (show) {
          App.exTxt.button = index == 8 ? '上传' : '切换'
          App.exTxt.index = index
          switch (index) {
            case 0:
            case 1:
            case 2:
            case 6:
            case 7:
            case 8:
              App.exTxt.name = index == 0 ? App.database : (index == 1 ? App.schema : (index == 2
                ? App.language : (index == 6 ? App.server : (index == 8 ? App.thirdParty : (App.types || []).join()))))
              App.isConfigShow = true

              if (index == 0) {
                alert('可填数据库:\nMYSQL,POSTGRESQL,SQLSERVER,ORACLE,DB2,SQLITE')
              }
              else if (index == 2) {
                alert('自动生成代码，可填语言:\nKotlin,Java,Swift,Objective-C,C#,Go,\nTypeScript,JavaScript,PHP,Python,C++')
              }
              else if (index == 7) {
                alert('多个类型用 , 隔开，可填类型:\nPARAM(GET ?a=1&b=c&key=value),\nJSON(POST application/json),\nFORM(POST x-www-form-urlencoded),\nDATA(POST form-data)')
              }
              else if (index == 8) {
                alert('例如：\nSWAGGER http://apijson.cn:8080/v2/api-docs\nSWAGGER /v2/api-docs  // 省略 Host\nSWAGGER /  // 省略 Host 和 分支 URL\nRAP /repository/joined /repository/get\nYAPI /api/interface/list_menu /api/interface/get')

                try {
                  App.getThirdPartyApiList(this.thirdParty, function (platform, docUrl, listUrl, itemUrl, url_, res, err) {
                    CodeUtil.thirdParty = platform
                    App.onResponse(url_, res, err)
                    return false
                  }, function (platform, docUrl, listUrl, itemUrl, url_, res, err) {
                    var data = (res || {}).data
                    var apiMap = CodeUtil.thirdPartyApiMap || {}

                    if (platform == PLATFORM_POSTMAN) {
                      alert('尚未开发 ' + PLATFORM_POSTMAN)
                      return true
                    }
                    else if (platform == PLATFORM_SWAGGER) {
                    }
                    else if (platform == PLATFORM_RAP) {
                    }
                    else if (platform == PLATFORM_YAPI) {
                      var api = (data || {}).data
                      var typeAndParam = App.parseYApiTypeAndParam(api)
                      api = api || {}
                      var url = api.path

                      apiMap[url] = {
                        request: typeAndParam.param,
                        response: api.res_body == null ? null : JSON.parse(api.res_body)
                      }
                    }
                    else {
                      alert('第三方平台只支持 Postman, Swagger, Rap, YApi ！')
                      return true
                    }

                    CodeUtil.thirdPartyApiMap = apiMap
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
              App.host = App.getBaseUrl()
              App.showUrl(false, new String(vUrl.value).substring(App.host.length)) //没必要导致必须重新获取 Response，App.onChange(false)
              break
            case 4:
              App.isHeaderShow = show
              App.saveCache('', 'isHeaderShow', show)
              break
            case 5:
              App.isRandomShow = show
              App.saveCache('', 'isRandomShow', show)
              break
            case 9:
              App.isDelegateEnabled = show
              App.saveCache('', 'isDelegateEnabled', show)
              break
          }
        }
        else if (index == 3) {
          var host = StringUtil.get(App.host)
          var branch = new String(vUrl.value)
          App.host = ''
          vUrl.value = host + branch //保证 showUrl 里拿到的 baseUrl = App.host (http://apijson.cn:8080/put /balance)
          App.setBaseUrl() //保证自动化测试等拿到的 baseUrl 是最新的
          App.showUrl(false, branch) //没必要导致必须重新获取 Response，App.onChange(false)
        }
        else if (index == 4) {
          App.isHeaderShow = show
          App.saveCache('', 'isHeaderShow', show)
        }
        else if (index == 5) {
          App.isRandomShow = show
          App.saveCache('', 'isRandomShow', show)
        }
        else if (index == 9) {
          App.isDelegateEnabled = show
          App.saveCache('', 'isDelegateEnabled', show)
        }
      },

      // 显示删除弹窗
      showDelete: function (show, item, index, isRandom) {
        this.isDeleteShow = show
        this.isDeleteRandom = isRandom
        this.exTxt.name = '请输入' + (isRandom ? '随机配置' : '接口') + '名来确认'
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
        var item = (isDeleteRandom ? this.currentRandomItem : this.currentDocItem) || {}
        var doc = (isDeleteRandom ? item.Random : item.Document) || {}

        var type = isDeleteRandom ? '随机配置' : '接口'
        if (doc.id == null) {
          alert('未选择' + type + '或' + type + '不存在！')
          return
        }
        if (doc.name != this.exTxt.name) {
          alert('输入的' + type + '名和要删除的' + type + '名不匹配！')
          return
        }

        this.showDelete(false, {})

        this.isTestCaseShow = false
        this.isRandomListShow = false

        var url = this.server + '/delete'
        var req = isDeleteRandom ? {
          format: false,
          'Random': {
            'id': doc.id
          },
          'tag': 'Random'
        } : {
          format: false,
          'Document': {
            'id': doc.id
          },
          'tag': 'Document'
        }
        this.request(true, REQUEST_TYPE_JSON, url, req, {}, function (url, res, err) {
          App.onResponse(url, res, err)

          var rpObj = res.data || {}

          if (isDeleteRandom) {
            if (rpObj.Random != null && rpObj.Random.code == CODE_SUCCESS) {
              if (((item.Random || {}).toId || 0) <= 0) {
                App.randoms.splice(item.index, 1)
              }
              else {
                App.randomSubs.splice(item.index, 1)
              }
              // App.showRandomList(true, App.currentRemoteItem)
            }
          } else {
            if (rpObj.Document != null && rpObj.Document.code == CODE_SUCCESS) {
              App.remotes.splice(item.index, 1)
              App.showTestCase(true, App.isLocalShow)
            }
          }
        })
      },

      // 保存当前的JSON
      save: function () {
        if (App.history.name.trim() === '') {
          Helper.alert('名称不能为空！', 'danger')
          return
        }
        var val = {
          name: App.history.name,
          type: App.type,
          url: '/' + this.getMethod(),
          request: inputted,
          response: App.jsoncon,
          header: vHeader.value,
          random: vRandom.value
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
      remove: function (item, index, isRemote, isRandom) {
        if (isRemote == null || isRemote == false) { //null != false
          localforage.removeItem(item.key, function () {
            App.historys.splice(index, 1)
          })
        } else {
          if (this.isLocalShow) {
            this.locals.splice(index, 1)
            return
          }

          if (isRandom && (((item || {}).Random || {}).id || 0) <= 0) {
            this.randomSubs.splice(index, 1)
            return
          }

          this.showDelete(true, item, index, isRandom)
        }
      },

      // 根据随机测试用例恢复数据
      restoreRandom: function (item) {
        this.currentRandomItem = item
        this.isRandomListShow = false
        this.isRandomSubListShow = false
        var random = (item || {}).Random || {}
        this.randomTestTitle = random.name
        this.testRandomCount = random.count
        vRandom.value = StringUtil.get(random.config)

        var response = ((item || {}).TestRecord || {}).response
        if (StringUtil.isEmpty(response, true) == false) {
            App.jsoncon = StringUtil.trim(response)
            App.view = 'code'
        }
      },
      // 根据测试用例/历史记录恢复数据
      restoreRemoteAndTest: function (item) {
        this.restoreRemote(item, true)
      },
      // 根据测试用例/历史记录恢复数据
      restoreRemote: function (item, test) {
        this.currentRemoteItem = item
        this.restore((item || {}).Document, ((item || {}).TestRecord || {}).response, true, test)
      },
      // 根据历史恢复数据
      restore: function (item, response, isRemote, test) {
        item = item || {}
        // localforage.getItem(item.key || '', function (err, value) {
          var branch = new String(item.url || '/get')
          if (branch.startsWith('/') == false) {
            branch = '/' + branch
          }

          App.type = item.type;
          App.urlComment = item.name;
          App.requestVersion = item.version;
          App.showUrl(false, branch)

          App.showTestCase(false, App.isLocalShow)
          vInput.value = StringUtil.get(item.request)
          vHeader.value = StringUtil.get(item.header)
          vRandom.value = StringUtil.get(item.random)
          App.onChange(false)

          if (isRemote) {
            App.randoms = []
            App.showRandomList(App.isRandomListShow, item)
          }

          if (test) {
            App.send(false)
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
      exportTxt: function () {
        App.isExportShow = false

        if (App.isExportRemote == false) { //下载到本地

          if (App.isTestCaseShow) { //文档
            saveTextAs('# ' + App.exTxt.name + '\n主页: https://github.com/APIJSON/APIJSON'
              + '\n\nBASE_URL: ' + this.getBaseUrl()
              + '\n\n\n## 测试用例(Markdown格式，可用工具预览) \n\n' + App.getDoc4TestCase()
              + '\n\n\n\n\n\n\n\n## 文档(Markdown格式，可用工具预览) \n\n' + doc
              , App.exTxt.name + '.txt')
          }
          else if (App.view == 'markdown' || App.view == 'output') { //model
            var clazz = StringUtil.trim(App.exTxt.name)

            var txt = '' //配合下面 +=，实现注释判断，一次全生成，方便测试
            if (clazz.endsWith('.java')) {
              txt += CodeUtil.parseJavaBean(docObj, clazz.substring(0, clazz.length - 5), App.database)
            }
            else if (clazz.endsWith('.swift')) {
              txt += CodeUtil.parseSwiftStruct(docObj, clazz.substring(0, clazz.length - 6), App.database)
            }
            else if (clazz.endsWith('.kt')) {
              txt += CodeUtil.parseKotlinDataClass(docObj, clazz.substring(0, clazz.length - 3), App.database)
            }
            else if  (clazz.endsWith('.m')) {
              txt += CodeUtil.parseObjectiveCEntity(docObj, clazz.substring(0, clazz.length - 2), App.database)
            }
            else if  (clazz.endsWith('.cs')) {
              txt += CodeUtil.parseCSharpEntity(docObj, clazz.substring(0, clazz.length - 3), App.database)
            }
            else if  (clazz.endsWith('.php')) {
              txt += CodeUtil.parsePHPEntity(docObj, clazz.substring(0, clazz.length - 4), App.database)
            }
            else if  (clazz.endsWith('.go')) {
              txt += CodeUtil.parseGoEntity(docObj, clazz.substring(0, clazz.length - 3), App.database)
            }
            else if  (clazz.endsWith('.cpp')) {
              txt += CodeUtil.parseCppStruct(docObj, clazz.substring(0, clazz.length - 4), App.database)
            }
            else if  (clazz.endsWith('.js')) {
              txt += CodeUtil.parseJavaScriptEntity(docObj, clazz.substring(0, clazz.length - 3), App.database)
            }
            else if  (clazz.endsWith('.ts')) {
              txt += CodeUtil.parseTypeScriptEntity(docObj, clazz.substring(0, clazz.length - 3), App.database)
            }
            else if (clazz.endsWith('.py')) {
              txt += CodeUtil.parsePythonEntity(docObj, clazz.substring(0, clazz.length - 3), App.database)
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
            var res = JSON.parse(App.jsoncon)
            res = this.removeDebugInfo(res)

            var s = ''
            switch (App.language) {
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
              case CodeUtil.LANGUAGE_OBJECTIVE_C:
                s += '(Objective-C):\n\n' + CodeUtil.parseObjectiveCResponse('', res, 0)
                break;

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
                s += '(Python):\n\n' + CodeUtil.parsePythonResponse('', res, 0, isSingle)
                break;
              default:
                s += ':\n没有生成代码，可能生成代码(封装,解析)的语言配置错误。 \n';
                break;
            }

            saveTextAs('# ' + App.exTxt.name + '\n主页: https://github.com/APIJSON/APIJSON'
              + '\n\n\nURL: ' + StringUtil.get(vUrl.value)
              + '\n\n\nHeader:\n' + StringUtil.get(vHeader.value)
              + '\n\n\nRequest:\n' + StringUtil.get(vInput.value)
              + '\n\n\nResponse:\n' + StringUtil.get(App.jsoncon)
              + '\n\n\n## 解析 Response 的代码' + s
              , App.exTxt.name + '.txt')
          }
        }
        else { //上传到远程服务器
          var id = App.User == null ? null : App.User.id
          if (id == null || id <= 0) {
            alert('请先登录！')
            return
          }
          var isExportRandom = App.isExportRandom
          var did = ((App.currentRemoteItem || {}).Document || {}).id
          if (isExportRandom && did == null) {
            alert('请先共享测试用例！')
            return
          }

          App.isTestCaseShow = false

          var currentAccountId = App.getCurrentAccountId()
          var currentResponse = StringUtil.isEmpty(App.jsoncon, true) ? {} : App.removeDebugInfo(JSON.parse(App.jsoncon));

          var code = currentResponse.code;
          var thrw = currentResponse.throw;
          delete currentResponse.code; //code必须一致
          delete currentResponse.throw; //throw必须一致

          var isML = App.isMLEnabled;
          var stddObj = isML ? JSONResponse.updateStandard({}, currentResponse) : {};
          stddObj.code = code;
          stddObj.throw = thrw;
          currentResponse.code = code;
          currentResponse.throw = thrw;

          var url = App.server + '/post'
          var req = isExportRandom ? {
            format: false,
            'Random': {
              toId: 0,
              documentId: did,
              count: App.requestCount,
              name: App.exTxt.name,
              config: vRandom.value
            },
            'TestRecord': {
              'userId': App.User.id,
              'response': JSON.stringify(currentResponse),
              'standard': isML ? JSON.stringify(stddObj) : null
            },
            'tag': 'Random'
          } : {
            format: false,
            'Document': {
              'userId': App.User.id,
              'testAccountId': currentAccountId,
              'name': App.exTxt.name,
              'type': App.type,
              'url': '/' + App.getMethod(),
              'request': App.toDoubleJSON(inputted),
              'header': vHeader.value
            },
            'TestRecord': {
              'randomId': 0,
              'userId': App.User.id,
              'host': App.getBaseUrl(),
              'testAccountId': currentAccountId,
              'response': JSON.stringify(currentResponse),
              'standard': isML ? JSON.stringify(stddObj) : null
            },
            'tag': 'Document'
          }

          App.request(true, REQUEST_TYPE_JSON, url, req, {}, function (url, res, err) {
            App.onResponse(url, res, err)

            var rpObj = res.data || {}

            if (isExportRandom) {
              if (rpObj.Random != null && rpObj.Random.code == CODE_SUCCESS) {
                App.randoms = []
                App.showRandomList(true, (App.currentRemoteItem || {}).Document)
              }
            }
            else {
              if (rpObj.Document != null && rpObj.Document.code == CODE_SUCCESS) {
                App.remotes = []
                App.showTestCase(true, false)


                //自动生成随机配置（遍历 JSON，对所有可变值生成配置，排除 @key, key@, key() 等固定值）
                var req = App.getRequest(vInput.value, {})
                var config = StringUtil.trim(App.newRandomConfig(null, '', req))
                if (config == '') {
                  return;
                }

                App.request(true, REQUEST_TYPE_JSON, App.server + '/post', {
                  format: false,
                  'Random': {
                    documentId: rpObj.Document.id,
                    count: App.requestCount,
                    name: '默认配置(上传测试用例时自动生成)',
                    config: config
                  },
                  TestRecord: {
                    host: App.getBaseUrl(),
                    response: ''
                  },
                  'tag': 'Random'
                }, {}, function (url, res, err) {
                  if (res.data != null && res.data.Random != null && res.data.Random.code == CODE_SUCCESS) {
                    alert('已自动生成并上传随机配置:\n' + config)
                    App.isRandomListShow = true
                  }
                  else {
                    alert('已自动生成，但上传以下随机配置失败:\n' + config)
                    vRandom.value = config
                  }
                  App.onResponse(url, res, err)
                })
              }
            }
          })
        }
      },

      newRandomConfig: function (path, key, value) {
        if (key == null) {
          return ''
        }
        if (path == '' && (key == 'tag' || key == 'version' || key == 'format')) {
          return ''
        }

        var config = ''
        var childPath = path == null || path == '' ? key : path + '/' + key
        var prefix = '\n' + childPath + ': '

        if (value instanceof Array) {
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
          config += prefix + 'ORDER_IN(undefined, null, []' + val + ')'
        }
        else if (value instanceof Object) {
          for(var k in value) {
            var v = value[k]

            var isAPIJSONArray = v instanceof Object && v instanceof Array == false
              && k.startsWith('@') == false && (k.endsWith('[]') || k.endsWith('@'))
            if (isAPIJSONArray) {
              if (k.endsWith('@')) {
                delete v.from
                delete v.range
              }

              prefix = '\n' + (childPath == null || childPath == '' ? '' : childPath + '/') + k + '/'
              if (v.hasOwnProperty('page')) {
                config += prefix + 'page : ' + 'ORDER_INT(0, 10)'
                delete v.page
              }
              if (v.hasOwnProperty('count')) {
                config += prefix + 'count : ' + 'ORDER_IN(undefined, null, 0, 1, 5, 10, 20'
                  + ([0, 1, 5, 10, 20].indexOf(v.count) >= 0 ? ')' : ', ' + v.count + ')')
                delete v.count
              }
              if (v.hasOwnProperty('query')) {
                config += prefix + 'query : ' + 'ORDER_IN(undefined, null, 0, 1, 2)'
                delete v.query
              }
            }

            config += App.newRandomConfig(childPath, k, v)
          }
        }
        else {
          //自定义关键词
          if (key.startsWith('@')) {
            return config
          }

          if (typeof value == 'boolean') {
            config += prefix + 'ORDER_IN(undefined, null, false, true)'
          }
          else if (typeof value == 'number') {
            var isId = key == 'id' || key.endsWith('Id') || key.endsWith('_id') || key.endsWith('_ID')
            if (isId) {
              config += prefix + 'ORDER_IN(undefined, null, ' + value + ')'
              if (value >= 1000000000) { //PHP 等语言默认精确到秒 1000000000000) {
                config += '\n// 可替代上面的 ' + prefix.substring(1) + 'RANDOM_INT(' + Math.round(0.9 * value) + ', ' + Math.round(1.1 * value) + ')'
              }
              else {
                config += '\n// 可替代上面的 ' + prefix.substring(1) + 'RANDOM_INT(1, ' + (10 * value) + ')'
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
                      ? 'ORDER_INT(0, 10)'
                      : ((hasDot ? 'RANDOM_NUM' : 'RANDOM_INT') + '(0, ' + 100 * value + (hasDot ? ', ' + keep + ')' : ')'))
                  )
                var hasDot = String(value).indexOf('.') >= 0

                if (value < 0) {
                  config += '\n// 可替代上面的 ' + prefix.substring(1) + (hasDot ? 'RANDOM_NUM' : 'RANDOM_INT') + '(' + (100 * value) + ', 0)'
                }
                else if (value > 0 && value < 1) {  // 0-1 比例
                  config += '\n// 可替代上面的 ' + prefix.substring(1) + 'RANDOM_NUM(0, 1)'
                }
                else if (value >= 0 && value <= 100) {  // 10% 百分比
                  config += '\n// 可替代上面的 ' + prefix.substring(1) + 'RANDOM_INT(0, 100)'
                }
                else {
                  config += '\n// 可替代上面的 ' + prefix.substring(1) + (hasDot != true && value < 10 ? 'ORDER_INT(0, 9)' : ((hasDot ? 'RANDOM_NUM' : 'RANDOM_INT') + '(0, ' + 100 * value + ')'))
                }
              }
            }
          }
          else if (typeof value == 'string') {
            //引用赋值 || 远程函数 || 匹配条件范围
            if (key.endsWith('@') || key.endsWith('()') || key.endsWith('{}')) {
              return config
            }

            config += prefix + 'ORDER_IN(undefined, null, ""' + (value == '' ? ')' : ', "' + value + '")')
          }
          else {
            config += prefix + 'ORDER_IN(undefined, null' + (value == null ? ')' : ', ' + JSON.stringify(value) + ')')
          }

        }

        return config
      },



      // 保存配置
      saveConfig: function () {
        App.isConfigShow = App.exTxt.index == 8

        switch (App.exTxt.index) {
          case 0:
            App.database = CodeUtil.database = App.exTxt.name
            App.saveCache('', 'database', App.database)

            doc = null
            var item = App.accounts[App.currentAccountIndex]
            item.isLoggedIn = false
            App.onClickAccount(App.currentAccountIndex, item)
            break
          case 1:
            App.schema = CodeUtil.schema = App.exTxt.name
            App.saveCache('', 'schema', App.schema)

            doc = null
            var item = App.accounts[App.currentAccountIndex]
            item.isLoggedIn = false
            App.onClickAccount(App.currentAccountIndex, item)
            break
          case 2:
            App.language = CodeUtil.language = App.exTxt.name
            App.saveCache('', 'language', App.language)

            doc = null
            App.onChange(false)
            break
          case 6:
            App.server = App.exTxt.name
            App.saveCache('', 'server', App.server)
            App.logout(true)
            break
          case 7:
            App.types = StringUtil.split(App.exTxt.name)
            App.saveCache('', 'types', App.types)
            break
          case 8:
            App.getThirdPartyApiList(App.exTxt.name, function (platform, docUrl, listUrl, itemUrl, url_, res, err) {
              var jsonData = (res || {}).data
              var isJSONData = jsonData instanceof Object
              if (isJSONData == false) {  //后面是 URL 才存储；是 JSON 数据则不存储
                App.thirdParty = thirdParty
                App.saveCache('', 'thirdParty', App.thirdParty)
              }

              if (platform == PLATFORM_POSTMAN) {
                alert('尚未开发 ' + PLATFORM_POSTMAN)
              }
              else if (platform == PLATFORM_SWAGGER) {
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

                  App.uploadTotal = 0 // apis.length || 0
                  App.uploadDoneCount = 0
                  App.uploadFailCount = 0

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
                  App.request(false, REQUEST_TYPE_PARAM, docUrl, {}, {}, swaggerCallback)
                }
              }
              else if (platform == PLATFORM_RAP || platform == PLATFORM_YAPI) {
                var isRap = platform == PLATFORM_RAP

                var itemCallback = function (url, res, err) {
                  try {
                    App.onResponse(url, res, err)
                  } catch (e) {}

                  var data = res.data == null ? null : res.data.data
                  if (isRap) {
                    var modules = data == null ? null : data.modules
                    if (modules != null) {
                      for (var i = 0; i < modules.length; i++) {
                        var it = modules[i] || {}
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
                  itemCallback(itemUrl, { data: jsonData }, null)
                }
                else {
                  App.request(false, REQUEST_TYPE_PARAM, listUrl, {}, {}, function (url_, res, err) {
                    if (App.isSyncing) {
                      alert('正在同步，请等待完成')
                      return
                    }
                    App.isSyncing = true
                    App.onResponse(url_, res, err)

                    var apis = (res.data || {}).data
                    if (apis == null) { // || apis.length <= 0) {
                      App.isSyncing = false
                      alert('没有查到 ' + (isRap ? 'Rap' : 'YApi') + ' 文档！请开启跨域代理，并检查 URL 是否正确！')
                      return
                    }
                    App.exTxt.button = '...'

                    App.uploadTotal = 0 // apis.length || 0
                    App.uploadDoneCount = 0
                    App.uploadFailCount = 0

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

                        App.request(false, REQUEST_TYPE_PARAM, itemUrl + '?id=' + listItem1._id, {}, {}, itemCallback)
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

      getThirdPartyApiList: function (thirdParty, listCallback, itemCallback) {
        App.parseThirdParty(thirdParty, function (platform, jsonData, docUrl, listUrl, itemUrl) {
          var isJSONData = jsonData instanceof Object

          if (platform == PLATFORM_POSTMAN) {
            alert('尚未开发 ' + PLATFORM_POSTMAN)
          }
          else if (platform == PLATFORM_SWAGGER) {
            if (isJSONData) {
              listCallback(platform, docUrl, listUrl, itemUrl, itemUrl, { data: jsonData }, null)
            }
            else {
              App.request(false, REQUEST_TYPE_PARAM, docUrl, {}, {}, function (url_, res, err) {
                if (listCallback != null) {
                  listCallback(platform, docUrl, listUrl, itemUrl, url_, res, err)
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
              App.request(false, REQUEST_TYPE_PARAM, listUrl, {}, {}, function (url_, res, err) {
                if (listCallback != null && listCallback(platform, docUrl, listUrl, itemUrl, url_, res, err)) {
                  return
                }

                var apis = (res.data || {}).data
                if (apis == null) { // || apis.length <= 0) {
                  alert('没有查到 ' + (isRap ? 'Rap' : 'YApi') + ' 文档！请开启跨域代理，并检查 URL 是否正确！')
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

                    App.request(false, REQUEST_TYPE_PARAM, itemUrl + '?id=' + listItem1._id, {}, {}, function (url_, res, err) {
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
          jsonData = JSON.parse(docUrl)
        }
        catch (e) {}

        var host = App.getBaseUrl()
        var listUrl = null
        var itemUrl = null

        if (platform == PLATFORM_SWAGGER) {
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
          App.exTxt.button = 'All:' + App.uploadTotal + '\nDone:' + App.uploadDoneCount + '\nFail:' + App.uploadFailCount
          return false
        }

        App.uploadTotal ++

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

        return App.uploadThirdPartyApi(method == 'get' ? REQUEST_TYPE_PARAM : REQUEST_TYPE_JSON
          , api.summary, url, parameters2, api.headers, api.description)
      },


      /**上传 Rap API
       * @param docItem
       */
      uploadRapApi: function(docItem) {
        var api = docItem
        if (api == null) {
          log('postApi', 'api == null  >> return')
          App.exTxt.button = 'All:' + App.uploadTotal + '\nDone:' + App.uploadDoneCount + '\nFail:' + App.uploadFailCount
          return false
        }

        App.uploadTotal ++

        var type
        switch ((api.summary || {}).requestParamsType || '') {
          case 'QUERY_PARAMS':
            type = REQUEST_TYPE_PARAM
            break
          case 'BODY_PARAMS':
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

        return App.uploadThirdPartyApi(type, api.name, api.url, parameters2, header, api.description)
      },

      /**上传 YApi
       * @param docItem
       */
      uploadYApi: function(docItem) {
        var api = docItem
        if (api == null) {
          log('postApi', 'api == null  >> return')
          App.exTxt.button = 'All:' + App.uploadTotal + '\nDone:' + App.uploadDoneCount + '\nFail:' + App.uploadFailCount
          return false
        }

        App.uploadTotal++

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

        var typeAndParam = App.parseYApiTypeAndParam(api)

        return App.uploadThirdPartyApi(typeAndParam.type, api.title, api.path, typeAndParam.param, header
          , StringUtil.isEmpty(api.markdown, true) ? api.description : api.markdown)
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
            parameters = api.req_body_other == null ? null : JSON.parse(api.req_body_other)

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

      //上传第三方平台的 API 至 APIAuto
      uploadThirdPartyApi: function(type, name, url, parameters, header, description) {
        var req = '{'

        if (parameters != null && parameters.length > 0) {
          for (var k = 0; k < parameters.length; k++) {
            var paraItem = parameters[k] || {}
            var n = paraItem.name || ''  //传进来前已过滤，这里只是避免万一为 null 导致后面崩溃
            var t = paraItem.type || ''
            var val = paraItem.default

            if (val == undefined) {
              if (t == 'boolean') {
                val = 'true'
              }
              if (t == 'integer') {
                val = n == 'pageSize' ? '10' : '1'
              }
              else if (t == 'string') {
                val = '""'
              }
              else if (t == 'object') {
                val = '{}'
              }
              else if (t == 'array') {
                val = '[]'
              }
              else {
                var suffix = n.length >= 3 ? n.substring(n.length - 3).toLowerCase() : null
                if (suffix == 'dto') {
                  val = '{}'
                } else {
                  val = 'null'
                }
              }
            }
            else if (typeof val == 'string' && (StringUtil.isEmpty(t, true) || t == 'string')) {
              val = '"' + val + '"'
            }
            else if (val instanceof Object) {
              val = JSON.stringify(val, null, '    ')
            }

            req += '\n    "' + n + '": ' + val + (k < parameters.length - 1 ? ',' : '')
              + '  // ' + (paraItem.required ? '必填。 ' : '') + StringUtil.trim(paraItem.description)
          }

        }

        req += '\n}'

        if (StringUtil.isEmpty(description, true) == false) {
          req += '\n/**\n\n' + StringUtil.trim(description) + '\n\n*/'
        }


        var currentAccountId = App.getCurrentAccountId()
        App.request(true, REQUEST_TYPE_JSON, App.server + '/post', {
          format: false,
          'Document': {
            'testAccountId': currentAccountId,
            'type': type,
            'name': StringUtil.get(name),
            'url': url,
            'request': req,
            'header': StringUtil.isEmpty(header, true) ? null : StringUtil.trim(header)
          },
          'TestRecord': {
            'randomId': 0,
            'host': App.getBaseUrl(),
            'testAccountId': currentAccountId,
            'response': ''
          },
          'tag': 'Document'
        }, {}, function (url, res, err) {
          //太卡 App.onResponse(url, res, err)
          if (res.data != null && res.data.Document != null && res.data.Document.code == CODE_SUCCESS) {
            App.uploadDoneCount ++
          } else {
            App.uploadFailCount ++
          }

          App.exTxt.button = 'All:' + App.uploadTotal + '\nDone:' + App.uploadDoneCount + '\nFail:' + App.uploadFailCount
          if (App.uploadDoneCount + App.uploadFailCount >= App.uploadTotal) {
            alert('导入完成')
            App.isSyncing = false
            App.showTestCase(false, false)
            App.remotes = []
            App.showTestCase(true, false)
          }
        })

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
        return date.getFullYear() + '-' + App.fillZero(date.getMonth() + 1) + '-' + App.fillZero(date.getDate())
      },
      //格式化时间
      formatTime: function (date) {
        if (date == null) {
          date = new Date()
        }
        return App.fillZero(date.getHours()) + ':' + App.fillZero(date.getMinutes())
      },
      formatDateTime: function (date) {
        if (date == null) {
          date = new Date()
        }
        return App.formatDate(date) + ' ' + App.formatTime(date)
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






      onClickAccount: function (index, item, callback) {
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
                App.saveCache(App.getBaseUrl(), 'currentAccountIndex', App.currentAccountIndex)
                App.saveCache(App.getBaseUrl(), 'accounts', App.accounts)

                if (callback != null) {
                  callback(false, index, err)
                }
              });
            }
            else {
              //login
              this.login(false, function (url, res, err) {
                App.onResponse(url, res, err)

                var data = res.data || {}
                var user = data.code == CODE_SUCCESS ? data.user : null
                if (user == null) {
                  if (callback != null) {
                    callback(false, index, err)
                  }
                }
                else {
                  item.name = user.name
                  item.remember = data.remember
                  item.isLoggedIn = true

                  App.saveCache(App.getBaseUrl(), 'currentAccountIndex', App.currentAccountIndex)
                  App.saveCache(App.getBaseUrl(), 'accounts', App.accounts)

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
        if (App.accounts.length <= 1) {
          alert('至少要 1 个测试账号！')
          return
        }

        App.accounts.splice(App.currentAccountIndex, 1)
        if (App.currentAccountIndex >= App.accounts.length) {
          App.currentAccountIndex = App.accounts.length - 1
        }

        App.saveCache(App.getBaseUrl(), 'currentAccountIndex', App.currentAccountIndex)
        App.saveCache(App.getBaseUrl(), 'accounts', App.accounts)
      },
      addAccountTab: function () {
        App.showLogin(true, false)
      },


      //显示远程的测试用例文档
      showTestCase: function (show, isLocal) {
        this.isTestCaseShow = show
        this.isLocalShow = isLocal

        vOutput.value = show ? '' : (output || '')
        this.showDoc()

        if (isLocal) {
          this.testCases = this.locals || []
          return
        }
        this.testCases = this.remotes || []

        if (show) {
          var testCases = this.testCases
          var allCount = testCases == null ? 0 : testCases.length
          if (allCount > 0) {
            var accountIndex = (this.accounts[this.currentAccountIndex] || {}).isLoggedIn ? this.currentAccountIndex : -1
            this.currentAccountIndex = accountIndex  //解决 onTestResponse 用 -1 存进去， handleTest 用 currentAccountIndex 取出来为空

            var tests = this.tests[String(accountIndex)] || {}
            if (tests != null && $.isEmptyObject(tests) != true) {
              for (var i = 0; i < allCount; i++) {
                var item = testCases[i]
                if (item == null) {
                  continue
                }
                var d = item.Document || {}
                this.compareResponse(allCount, testCases, i, item, (tests[d.id] || {})[0], false, accountIndex, true)
              }
            }
            return;
          }

          this.isTestCaseShow = false

          var search = StringUtil.isEmpty(this.testCaseSearch, true) ? null : '%' + StringUtil.trim(this.testCaseSearch) + '%'
          var url = this.server + '/get'
          var req = {
            format: false,
            '[]': {
              'count': this.testCaseCount || 100, //200 条测试直接卡死 0,
              'page': this.testCasePage || 0,
              'Document': {
                '@order': 'version-,date-',
                'userId': this.User.id,
                'name$': search,
                'url$': search,
                '@combine':  search == null ? null : 'name$,url$'
              },
              'TestRecord': {
                'documentId@': '/Document/id',
                'testAccountId': this.getCurrentAccountId(),
                'randomId': 0,
                '@order': 'date-',
                '@column': 'id,userId,documentId,response' + (this.isMLEnabled ? ',standard' : ''),
                'userId': this.User.id,
                '@having': this.isMLEnabled ? 'length(standard)>2' : null  //用 MySQL 5.6   '@having': App.isMLEnabled ? 'json_length(standard)>0' : null
              }
            },
            '@role': 'LOGIN'
          }

          this.onChange(false)
          this.request(true, REQUEST_TYPE_JSON, url, req, {}, function (url, res, err) {
            App.onResponse(url, res, err)

            var rpObj = res.data

            if (rpObj != null && rpObj.code === CODE_SUCCESS) {
              App.isTestCaseShow = true
              App.isLocalShow = false
              App.testCases = App.remotes = rpObj['[]']
              vOutput.value = show ? '' : (output || '')
              App.showDoc()

              //App.onChange(false)
            }
          })
        }
      },

      //显示远程的随机配置文档
      showRandomList: function (show, item, isSub) {
        this.isRandomEditable = false
        this.isRandomListShow = show && ! isSub
        this.isRandomSubListShow = show && isSub
        if (! isSub) {
          this.randomSubs = []
        }

        vOutput.value = show ? '' : (output || '')
        this.showDoc()

        this.randoms = this.randoms || []

        if (show && this.isRandomShow && this.randoms.length <= 0 && item != null && item.id != null) {
          this.isRandomListShow = false

          var subSearch = StringUtil.isEmpty(this.randomSubSearch, true)
            ? null : '%' + StringUtil.trim(this.randomSubSearch) + '%'
          var search = isSub ? subSearch : (StringUtil.isEmpty(this.randomSearch, true)
            ? null : '%' + StringUtil.trim(this.randomSearch) + '%')

          var url = App.server + '/get'
          var req = {
            '[]': {
              'count': (isSub ? this.randomSubCount : this.randomCount) || 100,
              'page': (isSub ? this.randomSubPage : this.randomPage) || 0,
              'Random': {
                'toId': isSub ? item.id : 0,
                'documentId': isSub ? null : item.id,
                '@order': "date-",
                'name$': search
              },
              'TestRecord': {
                'randomId@': '/Random/id',
                'testAccountId': App.getCurrentAccountId(),
                'host': App.getBaseUrl(),
                '@order': 'date-'
              },
              '[]': isSub ? null : {
                'count': this.randomSubCount || 100,
                'page': this.randomSubPage || 0,
                'Random': {
                  'toId@': '[]/Random/id',
                  'documentId': item.id,
                  '@order': "date-",
                  'name$': subSearch
                },
                'TestRecord': {
                  'randomId@': '/Random/id',
                  'testAccountId': App.getCurrentAccountId(),
                  'host': App.getBaseUrl(),
                  '@order': 'date-'
                }
              }
            }
          }

          this.onChange(false)
          this.request(true, REQUEST_TYPE_JSON, url, req, {}, function (url, res, err) {
            App.onResponse(url, res, err)

            var rpObj = res.data

            if (rpObj != null && rpObj.code === CODE_SUCCESS) {
              App.isRandomListShow = ! isSub
              App.isRandomSubListShow = isSub
              if (isSub) {
                if (App.currentRandomItem == null) {
                  App.currentRandomItem = {}
                }
                App.randomSubs = App.currentRandomItem.subs = App.currentRandomItem['[]'] = rpObj['[]']
              }
              else {
                App.randoms = rpObj['[]']
              }

              vOutput.value = show ? '' : (output || '')
              App.showDoc()

              //App.onChange(false)
            }
          })
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
      getCache: function (url, key) {
        var cache = localStorage.getItem('APIAuto:' + url)
        try {
          cache = JSON.parse(cache)
        } catch(e) {
          App.log('login  App.send >> try { cache = JSON.parse(cache) } catch(e) {\n' + e.message)
        }
        cache = cache || {}
        return key == null ? cache : cache[key]
      },

      /**登录确认
       */
      confirm: function () {
        switch (App.loginType) {
          case 'login':
            App.login(App.isAdminOperation)
            break
          case 'register':
            App.register(App.isAdminOperation)
            break
          case 'forget':
            App.resetPassword(App.isAdminOperation)
            break
        }
      },

      showLogin(show, isAdmin) {
        this.isLoginShow = show
        this.isAdminOperation = isAdmin

        if (show != true) {
          return
        }

        var user = isAdmin ? App.User : null  // add account   App.accounts[App.currentAccountIndex]

        // alert("showLogin  isAdmin = " + isAdmin + "; user = \n" + JSON.stringify(user, null, '    '))

        if (user == null || StringUtil.isEmpty(user.phone, true)) {
          user = {
            phone: 13000082001,
            password: 123456
          }
        }

        this.setRememberLogin(user.remember)
        this.account = user.phone
        this.password = user.password
      },

      setRememberLogin(remember) {
        vRemember.checked = remember || false
      },

      getCurrentAccount: function() {
        return App.accounts == null ? null : App.accounts[App.currentAccountIndex]
      },
      getCurrentAccountId: function() {
        var a = App.getCurrentAccount()
        return a != null && a.isLoggedIn ? a.id : null
      },

      /**登录
       */
      login: function (isAdminOperation, callback) {
        App.isLoginShow = false

        const req = {
          type: 0, // 登录方式，非必须 0-密码 1-验证码
          phone: App.account,
          password: App.password,
          version: 1, // 全局默认版本号，非必须
          remember: vRemember.checked,
          format: false,
          defaults: {
            '@database': App.database,
            '@schema': App.schema
          }
        }

        if (isAdminOperation) {
          App.request(isAdminOperation, REQUEST_TYPE_JSON, App.server + '/login', req, {}, function (url, res, err) {
            if (callback) {
              callback(url, res, err)
              return
            }

            var rpObj = res.data || {}

            if (rpObj.code != CODE_SUCCESS) {
              alert('登录失败，请检查网络后重试。\n' + rpObj.msg + '\n详细信息可在浏览器控制台查看。')
            }
            else {
              var user = rpObj.user || {}

              if (user.id > 0) {
                user.remember = rpObj.remember
                user.phone = req.phone
                user.password = req.password
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
            }

          })
        }
        else {
          if (callback == null) {
            var item
            for (var i in App.accounts) {
              item = App.accounts[i]
              if (item != null && req.phone == item.phone) {
                alert(req.phone +  ' 已在测试账号中！')
                // App.currentAccountIndex = i
                item.remember = vRemember.checked
                App.onClickAccount(i, item)
                return
              }
            }
          }

          App.showUrl(isAdminOperation, '/login')

          vInput.value = JSON.stringify(req, null, '    ')
          App.type = REQUEST_TYPE_JSON
          App.showTestCase(false, App.isLocalShow)
          App.onChange(false)
          App.send(isAdminOperation, function (url, res, err) {
            if (callback) {
              callback(url, res, err)
              return
            }

            App.onResponse(url, res, err)

            //由login按钮触发，不能通过callback回调来实现以下功能
            var data = res.data || {}
            if (data.code == CODE_SUCCESS) {
              var user = data.user || {}
              App.accounts.push({
                isLoggedIn: true,
                id: user.id,
                name: user.name,
                phone: req.phone,
                password: req.password,
                remember: data.remember
              })

              var lastItem = App.accounts[App.currentAccountIndex]
              if (lastItem != null) {
                lastItem.isLoggedIn = false
              }

              App.currentAccountIndex = App.accounts.length - 1

              App.saveCache(App.getBaseUrl(), 'currentAccountIndex', App.currentAccountIndex)
              App.saveCache(App.getBaseUrl(), 'accounts', App.accounts)
            }
          })
        }
      },

      /**注册
       */
      register: function (isAdminOperation) {
        App.showUrl(isAdminOperation, '/register')
        vInput.value = JSON.stringify(
          {
            Privacy: {
              phone: App.account,
              _password: App.password
            },
            User: {
              name: 'APIJSONUser'
            },
            verify: vVerify.value
          },
          null, '    ')
        App.showTestCase(false, false)
        App.onChange(false)
        App.send(isAdminOperation, function (url, res, err) {
          App.onResponse(url, res, err)

          var rpObj = res.data

          if (rpObj != null && rpObj.code === CODE_SUCCESS) {
            alert('注册成功')

            var privacy = rpObj.Privacy || {}

            App.account = privacy.phone
            App.loginType = 'login'
          }
        })
      },

      /**重置密码
       */
      resetPassword: function (isAdminOperation) {
        App.showUrl(isAdminOperation, '/put/password')
        vInput.value = JSON.stringify(
          {
            verify: vVerify.value,
            Privacy: {
              phone: App.account,
              _password: App.password
            }
          },
          null, '    ')
        App.showTestCase(false, App.isLocalShow)
        App.onChange(false)
        App.send(isAdminOperation, function (url, res, err) {
          App.onResponse(url, res, err)

          var rpObj = res.data

          if (rpObj != null && rpObj.code === CODE_SUCCESS) {
            alert('重置密码成功')

            var privacy = rpObj.Privacy || {}

            App.account = privacy.phone
            App.loginType = 'login'
          }
        })
      },

      /**退出
       */
      logout: function (isAdminOperation, callback) {
        var req = {}

        if (isAdminOperation) {
          // alert('logout  isAdminOperation  this.saveCache(App.server, User, {})')
          this.saveCache(App.server, 'User', {})
        }

        // alert('logout  isAdminOperation = ' + isAdminOperation + '; url = ' + url)
        if (isAdminOperation) {
          this.request(isAdminOperation, REQUEST_TYPE_JSON, App.server + '/logout', req, {}, function (url, res, err) {
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
          App.showUrl(isAdminOperation, '/logout')
          vInput.value = JSON.stringify(req, null, '    ')
          this.type = REQUEST_TYPE_JSON
          this.showTestCase(false, App.isLocalShow)
          this.onChange(false)
          this.send(isAdminOperation, callback)
        }
      },

      /**获取验证码
       */
      getVerify: function (isAdminOperation) {
        App.showUrl(isAdminOperation, '/post/verify')
        var type = App.loginType == 'login' ? 0 : (App.loginType == 'register' ? 1 : 2)
        vInput.value = JSON.stringify(
          {
            type: type,
            phone: App.account
          },
          null, '    ')
        App.showTestCase(false, App.isLocalShow)
        App.onChange(false)
        App.send(isAdminOperation, function (url, res, err) {
          App.onResponse(url, res, err)

          var data = res.data || {}
          var obj = data.code == CODE_SUCCESS ? data.verify : null
          var verify = obj == null ? null : obj.verify
          if (verify != null) { //FIXME isEmpty校验时居然在verify=null! StringUtil.isEmpty(verify, true) == false) {
            vVerify.value = verify
          }
        })
      },

      clearUser: function () {
        App.User.id = 0
        App.Privacy = {}
        App.remotes = []
        App.saveCache(App.server, 'User', App.User) //应该用lastBaseUrl,baseUrl应随watch输入变化重新获取
      },

      /**计时回调
       */
      onHandle: function (before) {
        this.isDelayShow = false
        if (inputted != before) {
          clearTimeout(handler);
          return;
        }

        App.view = 'output';
        vComment.value = '';
        vUrlComment.value = '';
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

          before = App.toDoubleJSON(StringUtil.trim(before));
          log('onHandle  before = \n' + before);

          var afterObj;
          var after;
          try {
            afterObj = jsonlint.parse(before);
            after = JSON.stringify(afterObj, null, "    ");
            before = after;
          }
          catch (e) {
            log('main.onHandle', 'try { return jsonlint.parse(before); \n } catch (e) {\n' + e.message)
            log('main.onHandle', 'return jsonlint.parse(App.removeComment(before));')

            try {
              afterObj = jsonlint.parse(App.removeComment(before));
              after = JSON.stringify(afterObj, null, "    ");
            } catch (e2) {
              throw new Error('请求 JSON 格式错误！请检查并编辑请求！\n\n如果JSON中有注释，请 手动删除 或 点击左边的 \'/" 按钮 来去掉。\n\n' + e2.message)
            }
          }

          //关键词let在IE和Safari上不兼容
          var code = '';
          try {
            code = this.getCode(after); //必须在before还是用 " 时使用，后面用会因为解析 ' 导致失败
          } catch(e) {
            code = '\n\n\n建议:\n使用其它浏览器，例如 谷歌Chrome、火狐FireFox 或者 微软Edge， 因为这样能自动生成请求代码.'
              + '\nError:\n' + e.message + '\n\n\n';
          }

          if (isSingle) {
            if (before.indexOf('"') >= 0) {
              before = before.replace(/"/g, "'");
            }
          }
          else {
            if (before.indexOf("'") >= 0) {
              before = before.replace(/'/g, '"');
            }
          }

          vInput.value = StringUtil.trim(before)
            + '\n                                                                                                       '
            + '                                                                                                       \n';  //解决遮挡
          vSend.disabled = false;
          vOutput.value = output = 'OK，请点击 [发送请求] 按钮来测试。[点击这里查看视频教程](http://i.youku.com/apijson)' + code;


          App.showDoc()

          try {
            var m = App.getMethod();
            var c = isSingle ? '' : StringUtil.trim(CodeUtil.parseComment(after, docObj == null ? null : docObj['[]'], m, App.database, App.language, '/' + App.getMethod(), true))
              + '\n                                                                                                       '
              + '                                                                                                       \n';  //解决遮挡
            //TODO 统计行数，补全到一致 vInput.value.lineNumbers

            if (isSingle != true && afterObj.tag == null) {
              m = m == null ? 'GET' : m.toUpperCase()
              if (['GETS', 'HEADS', 'POST', 'PUT', 'DELETE'].indexOf(m) >= 0) {
                c += ' ! 非开放请求必须设置 tag ！例如 "tag": "User"'
              }
            }
            vComment.value = c
            vUrlComment.value = isSingle || StringUtil.isEmpty(App.urlComment, true)
              ? '' : vUrl.value + CodeUtil.getComment(App.urlComment, false, '  ')
              + ' - ' + (App.requestVersion > 0 ? 'V' + App.requestVersion : 'V*');

            onScrollChanged()
            onURLScrollChanged()
          } catch (e) {
            log('onHandle   try { vComment.value = CodeUtil.parseComment >> } catch (e) {\n' + e.message);
          }
        } catch(e) {
          log(e)
          vSend.disabled = true

          App.view = 'error'
          App.error = {
            msg: e.message
          }
        }
      },


      /**输入内容改变
       */
      onChange: function (delay) {
        this.setBaseUrl();
        inputted = new String(vInput.value);
        vComment.value = '';
        vUrlComment.value = '';

        clearTimeout(handler);

        this.isDelayShow = delay;

        handler = setTimeout(function () {
          App.onHandle(inputted);
        }, delay ? 2*1000 : 0);
      },

      /**单双引号切换
       */
      transfer: function () {
        isSingle = ! isSingle;

        this.isTestCaseShow = false

        // // 删除注释 <<<<<<<<<<<<<<<<<<<<<
        //
        // var input = this.removeComment(vInput.value);
        // if (vInput.value != input) {
        //   vInput.value = input
        // }
        //
        // // 删除注释 >>>>>>>>>>>>>>>>>>>>>

        this.onChange(false);
      },

      /**获取显示的请求类型名称
       */
      getTypeName: function (type) {
        var ts = this.types
        var t = type || REQUEST_TYPE_JSON
        if (ts == null || ts.length <= 1 || (ts.length <= 2 && ts.indexOf(REQUEST_TYPE_PARAM) >= 0 && ts.indexOf(REQUEST_TYPE_GRPC) < 0)) {
          return t == REQUEST_TYPE_PARAM ? 'GET' : 'POST'
        }
        return t
      },
      /**请求类型切换
       */
      changeType: function () {
        var count = this.types == null ? 0 : this.types.length
        if (count > 1) {
          var index = this.types.indexOf(this.type)
          index++;
          this.type = this.types[index % count]
        }

        var url = StringUtil.get(vUrl.value)
        var index = url.indexOf('?')
        if (index >= 0) {
          var params = StringUtil.split(url.substring(index + 1), '&')

          var paramObj = {}
          var p
          var v
          var ind
          if (params != null) {
            for (var i = 0; i < params.length; i++) {
              p = params[i]
              ind = p == null ? -1 : p.indexOf('=')
              if (ind < 0) {
                continue
              }

              v = p.substring(ind + 1)
              try {
                v = JSON.parse(v)
              }
              catch (e) {}

              paramObj[p.substring(0, ind)] = v
            }
          }

          vUrl.value = url.substring(0, index)
          if ($.isEmptyObject(paramObj) == false) {
            vInput.value = '//TODO 从 URL 上的参数转换过来：\n' +  JSON.stringify(paramObj, null, '    ') + '\n//FIXME 需要与下面原来的字段合并为一个 JSON：\n' + StringUtil.get(vInput.value)
          }
          clearTimeout(handler)  //解决 vUrl.value 和 vInput.value 变化导致刷新，而且会把 vInput.value 重置，加上下面 onChange 再刷新就卡死了
        }

        CodeUtil.type = this.type;
        this.onChange(false);
      },

      /**
       * 删除注释
       */
      removeComment: function (json) {
        var reg = /("([^\\\"]*(\\.)?)*")|('([^\\\']*(\\.)?)*')|(\/{2,}.*?(\r|\n))|(\/\*(\n|.)*?\*\/)/g // 正则表达式
        try {
          return new String(json).replace(reg, function(word) { // 去除注释后的文本
            return /^\/{2,}/.test(word) || /^\/\*/.test(word) ? "" : word;
          })
        } catch (e) {
          log('transfer  delete comment in json >> catch \n' + e.message);
        }
        return json;
      },

      showAndSend: function (branchUrl, req, isAdminOperation, callback) {
        App.showUrl(isAdminOperation, branchUrl)
        vInput.value = JSON.stringify(req, null, '    ')
        App.showTestCase(false, App.isLocalShow)
        App.onChange(false)
        App.send(isAdminOperation, callback)
      },

      /**发送请求
       */
      send: function(isAdminOperation, callback) {
        if (this.isTestCaseShow) {
          alert('请先输入请求内容！')
          return
        }

        if (StringUtil.isEmpty(App.host, true)) {
          if (StringUtil.get(vUrl.value).startsWith('http://') != true && StringUtil.get(vUrl.value).startsWith('https://') != true) {
            alert('URL 缺少 http:// 或 https:// 前缀，可能不完整或不合法，\n可能使用同域的 Host，很可能访问出错！')
          }
        }
        else {
          if (StringUtil.get(vUrl.value).indexOf('://') >= 0) {
            alert('URL Host 已经隐藏(固定) 为 \n' + App.host + ' \n将会自动在前面补全，导致 URL 不合法访问出错！\n如果要改 Host，右上角设置 > 显示(编辑)URL Host')
          }
        }

        this.onHandle(vInput.value)

        clearTimeout(handler)

        var header
        try {
          header = this.getHeader(vHeader.value)
        } catch (e) {
          // alert(e.message)
          return
        }

        var req = this.getRequest(vInput.value)

        var url = this.getUrl()

        vOutput.value = "requesting... \nURL = " + url
        this.view = 'output';


        this.setBaseUrl()
        this.request(isAdminOperation, this.type, url, req, isAdminOperation ? {} : header, callback)

        this.locals = this.locals || []
        if (this.locals.length >= 1000) { //最多1000条，太多会很卡
          this.locals.splice(999, this.locals.length - 999)
        }
        var method = App.getMethod()
        this.locals.unshift({
          'Document': {
            'userId': App.User.id,
            'name': App.formatDateTime() + (StringUtil.isEmpty(req.tag, true) ? '' : ' ' + req.tag),
            'type': App.type,
            'url': '/' + method,
            'request': JSON.stringify(req, null, '    '),
            'header': vHeader.value
          }
        })
        App.saveCache('', 'locals', this.locals)
      },

      //请求
      request: function (isAdminOperation, type, url, req, header, callback) {
        type = type || REQUEST_TYPE_JSON

        if (header != null && header.Cookie != null) {
          if (this.isDelegateEnabled) {
            header['Set-Cookie'] = header.Cookie
            delete header.Cookie
          }
          else {
            document.cookie = header.Cookie
          }
        }

        // axios.defaults.withcredentials = true
        axios({
          method: (type == REQUEST_TYPE_PARAM ? 'get' : 'post'),
          url: (isAdminOperation == false && this.isDelegateEnabled ? (this.server + '/delegate?' + (type == REQUEST_TYPE_GRPC ? '$_type=GRPC&' : '') + '$_delegate_url=') : '' ) + StringUtil.noBlank(url),
          params: (type == REQUEST_TYPE_PARAM || type == REQUEST_TYPE_FORM ? req : null),
          data: (type == REQUEST_TYPE_JSON || type == REQUEST_TYPE_GRPC ? req : (type == REQUEST_TYPE_DATA ? toFormData(req) : null)),
          headers: header,  //Accept-Encoding（HTTP Header 大小写不敏感，SpringBoot 接收后自动转小写）可能导致 Response 乱码
          withCredentials: true, //Cookie 必须要  type == REQUEST_TYPE_JSON
          crossDomain: true
        })
          .then(function (res) {
            res = res || {}
	    //any one of then callback throw error will cause it calls then(null)
            // if ((res.config || {}).method == 'options') {
            //   return
            // }
            log('send >> success:\n' + JSON.stringify(res, null, '    '))

            //未登录，清空缓存
            if (res.data != null && res.data.code == 407) {
              // alert('request res.data != null && res.data.code == 407 >> isAdminOperation = ' + isAdminOperation)
              if (isAdminOperation) {
                // alert('request App.User = {} App.server = ' + App.server)

                App.clearUser()
              }
              else {
                // alert('request App.accounts[App.currentAccountIndex].isLoggedIn = false ')

                if (App.accounts[App.currentAccountIndex] != null) {
                  App.accounts[App.currentAccountIndex].isLoggedIn = false
                }
              }
            }

            if (callback != null) {
              callback(url, res, null)
              return
            }
            App.onResponse(url, res, null)
          })
          .catch(function (err) {
            log('send >> error:\n' + err)
            if (callback != null) {
              callback(url, {}, err)
              return
            }
            App.onResponse(url, {}, err)
          })
      },


      /**请求回调
       */
      onResponse: function (url, res, err) {
        if (res == null) {
          res = {}
        }
        log('onResponse url = ' + url + '\nerr = ' + err + '\nres = \n' + JSON.stringify(res))
        if (err != null) {
          vOutput.value = "Response:\nurl = " + url + "\nerror = " + err.message;
        }
        else {
          var data = res.data || {}
          if (isSingle && data.code == CODE_SUCCESS) { //不格式化错误的结果
            data = JSONResponse.formatObject(data);
          }
          App.jsoncon = JSON.stringify(data, null, '    ');
          App.view = 'code';
          vOutput.value = '';
        }
      },


      /**处理按键事件
       * @param event
       */
      doOnKeyUp: function (event, type, isFilter, item) {
        var keyCode = event.keyCode ? event.keyCode : (event.which ? event.which : event.charCode);
        if (keyCode == 13) { // enter
          if (isFilter) {
            this.onFilterChange(type)
            return
          }

          if (type == null) {
            this.send(false);
            return
          }

          if (type == 'random' || type == 'randomSub') {

            var r = item == null ? null : item.Random
            if (r == null || r.id == null) {
              alert('请选择有效的选项！item.Random.id == null !')
              return
            }

            //修改 Random 的 count
            this.request(true, REQUEST_TYPE_JSON, this.server + '/put', {
              Random: {
                id: r.id,
                count: r.count,
                name: r.name
              },
              tag: 'Random'
            }, {}, function (url, res, err) {

              var isOk = (res.data || {}).code == CODE_SUCCESS

              var msg = isOk ? '' : ('\nmsg: ' + StringUtil.get((res.data || {}).msg))
              if (err != null) {
                msg += '\nerr: ' + err.msg
              }
              alert('修改' + (isOk ? '成功' : '失败')
                + '！\ncount: ' + r.count + '\nname: ' + r.name
                + msg
              )

              App.isRandomEditable = !isOk
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
        switch (type) {
          case 'testCase':
            this.saveCache(this.server, 'testCasePage', this.testCasePage)
            this.saveCache(this.server, 'testCaseCount', this.testCaseCount)

            this.remotes = null
            this.showTestCase(true, false)
            break
          case 'random':
            this.saveCache(this.server, 'randomPage', this.randomPage)
            this.saveCache(this.server, 'randomCount', this.randomCount)

            this.randoms = null
            this.showRandomList(true, (this.currentRemoteItem || {}).Document, false)
            break
          case 'randomSub':
            this.saveCache(this.server, 'randomSubPage', this.randomSubPage)
            this.saveCache(this.server, 'randomSubCount', this.randomSubCount)

            this.randomSubs = null
            this.showRandomList(true, (this.currentRemoteItem || {}).Random, true)
            break
          default:
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
            break
        }
      },

      /**转为请求代码
       * @param rq
       */
      getCode: function (rq) {
        var s = '\n\n\n### 请求代码(自动生成) \n';
        switch (App.language) {
          case CodeUtil.LANGUAGE_KOTLIN:
            s += '\n#### <= Android-Kotlin: 空对象用 HashMap&lt;String, Any&gt;()，空数组用 ArrayList&lt;Any&gt;()\n'
              + '```kotlin \n'
              + CodeUtil.parseKotlinRequest(null, JSON.parse(rq), 0, isSingle, false, false, App.type, App.getBaseUrl(), '/' + App.getMethod(), App.urlComment)
              + '\n ``` \n注：对象 {} 用 mapOf("key": value)，数组 [] 用 listOf(value0, value1)\n';
            break;
          case CodeUtil.LANGUAGE_JAVA:
            s += '\n#### <= Android-Java: 同名变量需要重命名'
              + ' \n ```java \n'
              + StringUtil.trim(CodeUtil.parseJavaRequest(null, JSON.parse(rq), 0, isSingle, false, false, App.type, '/' + App.getMethod(), App.urlComment))
              + '\n ``` \n注：' + (isSingle ? '用了 APIJSON 的 JSONRequest, JSONResponse 类，也可使用其它类封装，只要 JSON 有序就行\n' : 'LinkedHashMap&lt;&gt;() 可替换为 fastjson 的 JSONObject(true) 等有序JSON构造方法\n');

            var serverCode = CodeUtil.parseJavaServer(App.type, '/' + App.getMethod(), App.database, App.schema, JSON.parse(rq), isSingle);
            if (StringUtil.isEmpty(serverCode, true) != true) {
              s += '\n#### <= Server-Java: RESTful 等非 APIJSON 规范的 API'
                + ' \n ```java \n'
                + serverCode
                + '\n ``` \n注：' + (isSingle ? '分页和排序用了 Mybatis-PageHelper，如不需要可在生成代码基础上修改\n' : '使用 SSM(Spring + SpringMVC + Mybatis) 框架 \n');
            }
            break;
          case CodeUtil.LANGUAGE_C_SHARP:
            s += '\n#### <= Unity3D-C\#: 键值对用 {"key", value}' +
              '\n ```csharp \n'
              + CodeUtil.parseCSharpRequest(null, JSON.parse(rq), 0)
              + '\n ``` \n注：对象 {} 用 new JObject{{"key", value}}，数组 [] 用 new JArray{value0, value1}\n';
            break;

          case CodeUtil.LANGUAGE_SWIFT:
            s += '\n#### <= iOS-Swift: 空对象用 [ : ]'
              + '\n ```swift \n'
              + CodeUtil.parseSwiftRequest(null, JSON.parse(rq), 0)
              + '\n ``` \n注：对象 {} 用 ["key": value]，数组 [] 用 [value0, value1]\n';
            break;
          case CodeUtil.LANGUAGE_OBJECTIVE_C:
            s += '\n#### <= iOS-Objective-C \n ```objective-c \n'
              + CodeUtil.parseObjectiveCRequest(null, JSON.parse(rq))
              + '\n ```  \n';
            break;

          case CodeUtil.LANGUAGE_GO:
            s += '\n#### <= Web-Go: 对象 key: value 会被强制排序，每个 key: value 最后都要加逗号 ","'
              + ' \n ```go \n'
              + CodeUtil.parseGoRequest(null, JSON.parse(rq), 0)
              + '\n ``` \n注：对象 {} 用 map[string]interface{} {"key": value}，数组 [] 用 []interface{} {value0, value1}\n';
            break;
          case CodeUtil.LANGUAGE_C_PLUS_PLUS:
            s += '\n#### <= Web-C++: 使用 RapidJSON'
              + ' \n ```cpp \n'
              + StringUtil.trim(CodeUtil.parseCppRequest(null, JSON.parse(rq), 0, isSingle))
              + '\n ``` \n注：std::string 类型值需要判断 RAPIDJSON_HAS_STDSTRING\n';
            break;

          case CodeUtil.LANGUAGE_PHP:
            s += '\n#### <= Web-PHP: 空对象用 (object) ' + (isSingle ? '[]' : 'array()')
              + ' \n ```php \n'
              + CodeUtil.parsePHPRequest(null, JSON.parse(rq), 0, isSingle)
              + '\n ``` \n注：对象 {} 用 ' + (isSingle ? '[\'key\' => value]' : 'array("key" => value)') + '，数组 [] 用 ' + (isSingle ? '[value0, value1]\n' : 'array(value0, value1)\n');
            break;

          case CodeUtil.LANGUAGE_PYTHON:
            s += '\n#### <= Web-Python: 注释符用 \'\#\''
              + ' \n ```python \n'
              + CodeUtil.parsePythonRequest(null, JSON.parse(rq), 0, isSingle, vInput.value)
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

        s += '\n\n#### 开放源码 '
          + '\nAPIJSON 接口工具: https://github.com/TommyLemon/APIAuto '
          + '\nAPIJSON 官方文档: https://github.com/vincentCheng/apijson-doc '
          + '\nAPIJSON 英文文档: https://github.com/ruoranw/APIJSONdocs '
          + '\nAPIJSON 官方网站: https://github.com/APIJSON/apijson.org '
          + '\nAPIJSON -Java版: https://github.com/APIJSON/APIJSON '
          + '\nAPIJSON - C# 版: https://github.com/liaozb/APIJSON.NET '
          + '\nAPIJSON - PHP版: https://github.com/qq547057827/apijson-php '
          + '\nAPIJSON -Node版: https://github.com/kevinaskin/apijson-node '
          + '\nAPIJSON - Go 版: https://github.com/crazytaxi824/APIJSON '
          + '\nAPIJSON -Python: https://github.com/zhangchunlin/uliweb-apijson '
          + '\n感谢热心的作者们的贡献，GitHub 右上角点 ⭐Star 支持下他们吧 ^_^';

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
        vOutput.value += (
          '\n\n\n## 文档 \n\n 通用文档见 [APIJSON通用文档](https://github.com/APIJSON/APIJSON/blob/master/Document.md#3.2) \n### 数据字典\n自动查数据库表和字段属性来生成 \n\n' + d
          + '<h3 align="center">简介</h3>'
          + '<p align="center">本站为 APIAuto-自动化接口管理平台'
          + '<br>提供 接口和文档托管、机器学习自动化测试、自动生成文档和代码 等服务'
          + '<br>由 <a href="https://github.com/TommyLemon/APIAuto" target="_blank">APIAuto(前端网页工具)</a>, <a href="https://github.com/APIJSON/APIJSON" target="_blank">APIJSON(后端接口服务)</a> 等提供技术支持'
          + '<br>遵循 <a href="http://www.apache.org/licenses/LICENSE-2.0" target="_blank">Apache-2.0 开源协议</a>'
          + '<br>Copyright &copy; 2016-' + new Date().getFullYear() + ' Tommy Lemon<br><br></p>'
        );

        App.view = 'markdown';
        markdownToHTML(vOutput.value);
        return true;
      },


      /**
       * 获取文档
       */
      getDoc: function (callback) {

        var count = this.count || 100  //超过就太卡了
        var page = this.page || 0

        var search = StringUtil.isEmpty(this.search, true) ? null : '%' + StringUtil.trim(this.search) + '%'
        this.request(false, REQUEST_TYPE_JSON, this.getBaseUrl() + '/get', {
          format: false,
          '@database': this.database,
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
              '@column': 'name,alias,get,head,gets,heads,post,put,delete',
              '@order': 'date-,name+',
              'name()': 'getWithDefault(alias,name)',
              'r0()': 'removeKey(alias)',
              'name$': search,
              'alias$': search,
              '@combine': search == null ? null : 'name$,alias$',
            }
          },
          '[]': {
            'count': count,
            'page': page,
            'Table': this.database == 'SQLSERVER' ? null : {
              'table_schema': this.schema,
              'table_type': 'BASE TABLE',
              // 'table_name!$': ['\\_%', 'sys\\_%', 'system\\_%'],
              'table_name$': search,
              'table_comment$': this.database == 'POSTGRESQL' ? null : search,
              '@combine': search == null || this.database == 'POSTGRESQL' ? null : 'table_name$,table_comment$',
              'table_name{}@': 'sql',
              '@order': 'table_name+', //MySQL 8 SELECT `table_name` 返回的仍然是大写的 TABLE_NAME，需要 AS 一下
              '@column': this.database == 'POSTGRESQL' ? 'table_name' : 'table_name:table_name,table_comment:table_comment'
            },
            'PgClass': this.database != 'POSTGRESQL' ? null : {
              'relname@': '/Table/table_name',
              //FIXME  多个 schema 有同名表时数据总是取前面的  不属于 pg_class 表 'nspname': App.schema,
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
            '[]': {
              'count': 0,
              'Column': {
                'table_schema': this.schema,
                'table_name@': this.database != 'SQLSERVER' ? '[]/Table/table_name' : "[]/SysTable/table_name",
                "@order": this.database != 'SQLSERVER' ? null : "table_name+",
                '@column': this.database == 'POSTGRESQL' || this.database == 'SQLSERVER'  //MySQL 8 SELECT `column_name` 返回的仍然是大写的 COLUMN_NAME，需要 AS 一下
                  ? 'column_name;data_type;numeric_precision,numeric_scale,character_maximum_length'
                  : 'column_name:column_name,column_type:column_type,column_comment:column_comment'
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
              }
            }
          },
          'Function[]': {
            'count': count,
            'page': page,
            'Function': {
              '@order': 'date-,name+',
              '@column': 'name,arguments,demo,detail',
              'demo()': 'getFunctionDemo()',
              'detail()': 'getFunctionDetail()',
              'r0()': 'removeKey(name)',
              'r1()': 'removeKey(arguments)',
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
          if (err != null || res == null || res.data == null) {
            log('getDoc  err != null || res == null || res.data == null >> return;');
            callback('')
            return;
          }

//      log('getDoc  docRq.responseText = \n' + docRq.responseText);
          docObj = res.data || {};  //避免后面又调用 onChange ，onChange 又调用 getDoc 导致死循环

          //转为文档格式
          var doc = '';
          var item;

          //[] <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
          var list = docObj == null ? null : docObj['[]'];
          CodeUtil.tableList = list;
          if (list != null) {
            if (DEBUG) {
              log('getDoc  [] = \n' + format(JSON.stringify(list)));
            }

            var table;
            var columnList;
            var column;
            for (var i = 0; i < list.length; i++) {
              item = list[i];

              //Table
              table = item == null ? null : (App.database != 'SQLSERVER' ? item.Table : item.SysTable);
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

              doc += '### ' + (i + 1) + '. ' + CodeUtil.getModelName(table.table_name) + '\n#### 说明: \n'
                + App.toMD(table_comment);


              //Column[]
              doc += '\n\n#### 字段: \n 名称  |  类型  |  最大长度  |  详细说明' +
                ' \n --------  |  ------------  |  ------------  |  ------------ ';

              columnList = item['[]'];
              if (columnList == null) {
                continue;
              }
              if (DEBUG) {
                log('getDoc [] for ' + i + ': columnList = \n' + format(JSON.stringify(columnList)));
              }

              var name;
              var type;
              var length;
              for (var j = 0; j < columnList.length; j++) {
                column = (columnList[j] || {}).Column;
                name = column == null ? null : column.column_name;
                if (name == null) {
                  continue;
                }

                column.column_type = CodeUtil.getColumnType(column, App.database);
                type = CodeUtil.getType4Language(App.language, column.column_type, false);
                length = CodeUtil.getMaxLength(column.column_type);

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

                // column.column_comment = column_comment
                doc += '\n' + name + '  |  ' + type + '  |  ' + length + '  |  ' + App.toMD(column_comment);

              }

              doc += '\n\n\n';

            }

          }

          //[] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>



          //Access[] <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
          list = docObj == null ? null : docObj['Access[]'];
          if (list != null) {
            if (DEBUG) {
              log('getDoc  Access[] = \n' + format(JSON.stringify(list)));
            }

            doc += '\n\n\n\n\n\n\n\n\n### 访问权限\n自动查 Access 表写入的数据来生成\n'
              + ' \n 表名  |  允许 get<br>的角色  |  允许 head<br>的角色  |  允许 gets<br>的角色  |  允许 heads<br>的角色  |  允许 post<br>的角色  |  允许 put<br>的角色  |  允许 delete<br>的角色  |  表名'
              + ' \n --------  |  ---------  |  ---------  |  ---------  |  ---------  |  ---------  |  ---------  |  --------- | --------  ';

            for (var i = 0; i < list.length; i++) {
              item = list[i];
              if (item == null) {
                continue;
              }
              if (DEBUG) {
                log('getDoc Access[] for i=' + i + ': item = \n' + format(JSON.stringify(item)));
              }

              doc += '\n' + (item.name) //右上角设置指定了 Schema  + '(' + item.schema + ')')
                + '  |  ' + JSONResponse.getShowString(JSON.parse(item.get), 2)
                + '  |  ' + JSONResponse.getShowString(JSON.parse(item.head), 2)
                + '  |  ' + JSONResponse.getShowString(JSON.parse(item.gets), 2)
                + '  |  ' + JSONResponse.getShowString(JSON.parse(item.heads), 2)
                + '  |  ' + JSONResponse.getShowString(JSON.parse(item.post), 1)
                + '  |  ' + JSONResponse.getShowString(JSON.parse(item.put), 1)
                + '  |  ' + JSONResponse.getShowString(JSON.parse(item.delete), 1)
                + '  |  ' + (item.name); //右上角设置指定了 Schema  + '(' + item.schema + ')');
            }

            doc += ' \n 表名  |  允许 get<br>的角色  |  允许 head<br>的角色  |  允许 gets<br>的角色  |  允许 heads<br>的角色  |  允许 post<br>的角色  |  允许 put<br>的角色  |  允许 delete<br>的角色  |  表名'

            doc += '\n' //避免没数据时表格显示没有网格
          }

          //Access[] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>


          //Function[] <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
          list = docObj == null ? null : docObj['Function[]'];
          if (list != null) {
            if (DEBUG) {
              log('getDoc  Function[] = \n' + format(JSON.stringify(list)));
            }

            doc += '\n\n\n\n\n\n\n\n\n### 远程函数\n自动查 Function 表写入的数据来生成\n'
              + ' \n 说明  |  示例'
              + ' \n --------  |  -------------- ';

            for (var i = 0; i < list.length; i++) {
              item = list[i];
              if (item == null) {
                continue;
              }
              if (DEBUG) {
                log('getDoc Function[] for i=' + i + ': item = \n' + format(JSON.stringify(item)));
              }

              doc += '\n' + item.detail + '  |  ' + JSON.stringify(item.demo);
            }

            doc += '\n' //避免没数据时表格显示没有网格
          }

          //Function[] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>


          //Request[] <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
          list = docObj == null ? null : docObj['Request[]'];
          if (list != null) {
            if (DEBUG) {
              log('getDoc  Request[] = \n' + format(JSON.stringify(list)));
            }

            doc += '\n\n\n\n\n\n\n\n\n### 非开放请求\n自动查 Request 表写入的数据来生成\n'
              + ' \n 版本  |  方法  |  数据和结构'
              + ' \n --------  |  ------------  |  ------------  |  ------------ ';

            for (var i = 0; i < list.length; i++) {
              item = list[i];
              if (item == null) {
                continue;
              }
              if (DEBUG) {
                log('getDoc Request[] for i=' + i + ': item = \n' + format(JSON.stringify(item)));
              }

              doc += '\n' + item.version + '  |  ' + item.method
                + '  |  ' + JSON.stringify(App.getStructure(item.structure, item.tag));
            }

            doc += '\n注: \n1.GET,HEAD方法不受限，可传任何 数据、结构。\n2.可在最外层传版本version来指定使用的版本，不传或 version <= 0 则使用最新版。\n\n\n\n\n\n\n';
          }


          //Request[] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

          App.onChange(false);


          callback(doc);

//      log('getDoc  callback(doc); = \n' + doc);
        });

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

      /**转为Markdown格式
       * @param s
       * @return {*}
       */
      toMD: function (s) {
        if (s == null) {
          s = '';
        }
        else {
          //无效
          s = s.replace(/\|/g, '\|');
          s = s.replace(/\n/g, ' <br /> ');
        }

        return s;
      },

      /**处理请求结构
       * @param obj
       * @param tag
       * @return {*}
       */
      getStructure: function (obj, tag) {
        if (obj == null) {
          return null;
        }

        log('getStructure  tag = ' + tag + '; obj = \n' + format(JSON.stringify(obj)));

        if (obj instanceof Array) {
          for (var i = 0; i < obj.length; i++) {
            obj[i] = this.getStructure(obj[i]);
          }
        }
        else if (obj instanceof Object) {
          var v;
          var nk;
          for (var k in obj) {
            if (k == null || k == '' || k == 'INSERT' || k == 'REMOVE' || k == 'REPLACE' || k == 'UPDATE') {
              delete obj[k];
              continue;
            }

            v = obj[k];
            if (v == null) {
              delete obj[k];
              continue;
            }

            if (k == 'DISALLOW') {
              nk = '不能传';
            }
            else if (k == 'NECESSARY') {
              nk = '必须传';
            }
            else if (k == 'UNIQUE') {
              nk = '不重复';
            }
            else if (k == 'VERIFY') {
              nk = '满足条件';
            }
            else if (k == 'TYPE') {
              nk = '满足类型';
            }
            else {
              nk = null;
            }

            if (v instanceof Object) {
              v = this.getStructure(v);
            }
            else if (v === '!') {
              v = '非必须传的字段';
            }

            if (nk != null) {
              obj[nk] = v;
              delete obj[k];
            }
          }

          if (tag != null && obj[tag] == null) { //补全省略的Table
            var isArrayKey = tag.endsWith(":[]");  //JSONObject.isArrayKey(tag);
            var key = isArrayKey ? tag.substring(0, tag.length - 3) : tag;

            if (this.isTableKey(key)) {
              if (isArrayKey) { //自动为 tag = Comment:[] 的 { ... } 新增键值对 "Comment[]":[] 为 { "Comment[]":[], ... }
                obj[key + "[]"] = [];
              }
              else { //自动为 tag = Comment 的 { ... } 包一层为 { "Comment": { ... } }
                var realObj = {};
                realObj[tag] = obj;
                obj = realObj;
              }
            }
          }

        }

        obj.tag = tag; //补全tag

        log('getStructure  return obj; = \n' + format(JSON.stringify(obj)));

        return obj;
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
        // App.log('Main.  ' + msg)
      },

      getDoc4TestCase: function () {
        var list = App.remotes || []
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
        this.saveCache(App.server, 'isCrossEnabled', enable)
      },

      enableML: function (enable) {
        this.isMLEnabled = enable
        this.testProcess = enable ? '机器学习:已开启' : '机器学习:已关闭'
        this.saveCache(App.server, 'isMLEnabled', enable)
        this.remotes = null
        this.showTestCase(true, false)
      },

      /**随机测试，动态替换键值对
       * @param show
       */
      onClickTestRandom: function () {
        this.testRandom(! this.isRandomListShow && ! this.isRandomSubListShow, this.isRandomListShow, this.isRandomSubListShow)
      },
      testRandom: function (show, testList, testSubList, limit) {
        this.isRandomEditable = false
        if (testList != true && testSubList != true) {
          this.testRandomProcess = ''
          this.testRandomWithText(show, null)
        }
        else {
          var baseUrl = StringUtil.trim(this.getBaseUrl())
          if (baseUrl == '') {
            alert('请先输入有效的URL！')
            return
          }
          //开放测试
          // if (baseUrl.indexOf('/apijson.cn') >= 0 || baseUrl.indexOf('/39.108.143.172') >= 0) {
          //   alert('请把URL改成你自己的！\n例如 http://localhost:8080')
          //   return
          // }
          if (baseUrl.indexOf('/apijson.org') >= 0) {
            alert('请把URL改成 http://apijson.cn:8080 或 你自己的！\n例如 http://localhost:8080')
            return
          }

          const list = (testSubList ? this.randomSubs : this.randoms) || []
          var allCount = list.length
          doneCount = 0

          if (allCount <= 0) {
            alert('请先获取随机配置\n点击[查看列表]按钮')
            return
          }
          this.testRandomProcess = '正在测试: ' + 0 + '/' + allCount

          if (testSubList) {
            this.resetCount(this.currentRandomItem)
          }

          var json = this.getRequest(vInput.value) || {}
          var url = this.getUrl()
          var header = this.getHeader(vHeader.value)

          ORDER_MAP = {}  //重置

          for (var i = 0; i < (limit != null ? limit : list.length); i ++) {  //limit限制子项测试个数
            const item = list[i]
            const random = item == null ? null : item.Random
            if (random == null || random.name == null) {
              doneCount ++
              continue
            }
            this.log('test  random = ' + JSON.stringify(random, null, '  '))

            const index = i

            const itemAllCount = random.count || 0
            allCount += (itemAllCount - 1)

            this.testRandomSingle(show, false, itemAllCount > 1 && ! testSubList, item, this.type, url, json, header, function (url, res, err) {

              doneCount ++
              App.testRandomProcess = doneCount >= allCount ? '' : ('正在测试: ' + doneCount + '/' + allCount)
              try {
                App.onResponse(url, res, err)
                App.log('test  App.request >> res.data = ' + JSON.stringify(res.data, null, '  '))
              } catch (e) {
                App.log('test  App.request >> } catch (e) {\n' + e.message)
              }

              App.compareResponse(allCount, list, index, item, res.data, true, App.currentAccountIndex, false, err)
            })
          }
        }
      },
      /**随机测试，动态替换键值对
       * @param show
       * @param callback
       */
      testRandomSingle: function (show, testList, testSubList, item, type, url, json, header, callback) {
        item = item || {}
        var random = item.Random = item.Random || {}
        var subs = item['[]'] || []
        var existCount = subs.length
        subs = existCount <= 0 ? subs : JSON.parse(JSON.stringify(subs))

        var count = random.count || 0
        var respCount = 0;

        for (var i = 0; i < count; i ++) {
          // var constConfig = i < existCount ? ((subs[i] || {}).Random || {}).config : this.getRandomConstConfig(random.config, random.id) //第1遍，把 key : expression 改为 key : value
          // var constJson = this.getRandomJSON(JSON.parse(JSON.stringify(json)), constConfig, random.id) //第2遍，用新的 random config 来修改原 json

          const which = i;
          var rawConfig = testSubList && i < existCount ? ((subs[i] || {}).Random || {}).config : random.config
          this.parseRandom(
            JSON.parse(JSON.stringify(json)), rawConfig, random.id
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
                var cb = function (url, res, err) {
                  if (callback != null) {
                    callback(url, res, err, random)
                  }
                  else {
                    App.onResponse(url, res, err)
                  }
                };

                if (show == true) {
                  vInput.value = JSON.stringify(constJson, null, '    ');
                  App.send(false, cb);
                }
                else {
                  App.request(false, type, url, constJson, header, cb);
                }
              }

              if (testSubList && respCount >= count) { // && which >= count - 1) {
                App.randomSubs = subs
                if (App.isRandomListShow == true) {
                  App.resetCount(item)
                  item.subs = subs
                }
                App.testRandom(false, false, true, count)
              }

            }
          );

        }  //for

    },

      resetCount: function (randomItem) {
        if (randomItem == null) {
          App.log('resetCount  randomItem == null >> return')
          return
        }
        randomItem.totalCount = 0
        randomItem.whiteCount = 0
        randomItem.greenCount = 0
        randomItem.blueCount = 0
        randomItem.orangeCount = 0
        randomItem.redCount = 0
      },

      /**随机测试，动态替换键值对
       * @param show
       * @param callback
       */
      testRandomWithText: function (show, callback) {
        try {
          var count = this.testRandomCount || 0;
          this.isRandomSubListShow = count > 1;
          this.testRandomSingle(show, false, this.isRandomSubListShow, {
              Random: {
                toId: 0, // ((this.currentRandomItem || {}).Random || {}).id || 0,
                userId: (this.User || {}).id,
                count: count,
                name: this.randomTestTitle,
                config: vRandom.value
              }
            },
            this.type, this.getUrl(), this.getRequest(vInput.value), this.getHeader(vHeader.value), callback
          )
        }
        catch (e) {
          log(e)
          vSend.disabled = true

          App.view = 'error'
          App.error = {
            msg: e.message
          }

          this.isRandomShow = true
          vRandom.select()
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
      /**随机测试，动态替换键值对
       * @param show
       * @param callback
       */
      parseRandom: function (json, config, randomId, generateJSON, generateConfig, generateName, callback) {
        var lines = config == null ? null : config.trim().split('\n')
        if (lines == null || lines.length <= 0) {
          // return null;
          callback(null, null, null);
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

          // remove comment
          const commentIndex = lineItem.indexOf('//');
          const line = commentIndex < 0 ? lineItem : lineItem.substring(0, commentIndex).trim();

          if (line.length <= 0) {
            respCount ++;
            if (i >= lines.length - 1 && respCount >= reqCount) {
              callback(randomNameKeys.join(', '), constConfigLines.join('\n'), json);
            }
            continue;
          }

          // path User/id  key id@
          const index = line.indexOf(': '); //APIJSON Table:alias 前面不会有空格 //致后面就接 { 'a': 1} 报错 Unexpected token ':'   lastIndexOf(': '); // indexOf(': '); 可能会有 Comment:to
          const p_k = line.substring(0, index);
          const bi = p_k.indexOf(' ');
          const path = bi < 0 ? p_k : p_k.substring(0, bi); // User/id

          const pathKeys = path.split('/')
          if (pathKeys == null || pathKeys.length <= 0) {
            throw new Error('随机测试 第 ' + (i + 1) + ' 行格式错误！\n字符 ' + path + ' 不符合 JSON 路径的格式 key0/key1/../targetKey !' +
              '\n每个随机变量配置都必须按照\n  key0/key1/../targetKey replaceKey: value  // 注释\n的格式！' +
              '\n注意冒号 ": " 左边 0 空格，右边 1 空格！其中 replaceKey 可省略。' +
              '\nkey: {} 中最外层常量对象 {} 必须用括号包裹为 ({})，也就是 key: ({}) 这种格式！' +
              '\nkey: 多行代码 必须用 function f() { var a = 1; return a; } f() 这种一行代码格式！');
          }

          const lastKeyInPath = pathKeys[pathKeys.length - 1]
          const customizeKey = bi > 0;
          const key = customizeKey ? p_k.substring(bi + 1) : lastKeyInPath;
          if (key == null || key.trim().length <= 0) {
            throw new Error('随机测试 第 ' + (i + 1) + ' 行格式错误！\n字符 ' + key + ' 不是合法的 JSON key!' +
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
                  configVal = val
                }
                constConfigLines[which] = p_k + ': ' + configVal;
              }

              if (generateName) {
                var valStr;
                if (val instanceof Array) {
                  valStr = '[' + val.length + ']';
                }
                else if (val instanceof Object) {
                  valStr = '{...}';
                }
                else if (typeof val == 'boolean') {
                  valStr = '' + val;
                }
                else {
                  valStr = new String(val);
                  if (valStr.length > 13) {
                    valStr = valStr.substring(0, 5) + '...';
                  }
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
                    throw new Error('随机测试 第 ' + (i + 1) + ' 行格式错误！路径 ' + path + ' 中' +
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
              callback(randomNameKeys.join(', '), constConfigLines.join('\n'), json);
            }
          };


          const start = value.indexOf('(');
          const end = value.lastIndexOf(')');

          var request4Db = function(tableName, which, p_k, pathKeys, key, lastKeyInPath, isRandom, isDesc, step) {
            // const tableName = JSONResponse.getTableName(pathKeys[pathKeys.length - 2]);
            vOutput.value = 'requesting value for ' + tableName + '/' + key + ' from database...';

            const args = StringUtil.split(value.substring(start + 1, end)) || [];
            const min = StringUtil.isEmpty(args[0], true) ? null : +args[0];
            const max = StringUtil.isEmpty(args[1], true) ? null : +args[1]

            const tableReq = {
              '@column': lastKeyInPath,
              '@order': isRandom ? 'rand()' : (lastKeyInPath + (isDesc ? '-' : '+'))
            };
            tableReq[lastKeyInPath + '>='] = min;
            tableReq[lastKeyInPath + '<='] = max;

            const req = {};
            const listName = isRandom ? null : tableName + '-' + lastKeyInPath + '[]';
            const orderIndex = isRandom ? null : getOrderIndex(randomId, line, null)

            if (isRandom) {
              req[tableName] = tableReq;
            }
            else {
              // 从数据库获取时不考虑边界，不会在越界后自动循环
              var listReq = {
                count: 1, // count <= 100 ? count : 0,
                page: (step*orderIndex) % 100  //暂时先这样，APIJSON 应该改为 count*page <= 10000  //FIXME 上限 100 怎么破，lastKeyInPath 未必是 id
              };
              listReq[tableName] = tableReq;
              req[listName] = listReq;
            }

            // reqCount ++;
            App.request(true, REQUEST_TYPE_JSON, baseUrl + '/get', req, {}, function (url, res, err) {
              // respCount ++;
              try {
                App.onResponse(url, res, err)
              } catch (e) {}

              var data = (res || {}).data || {}
              if (data.code != CODE_SUCCESS) {
                respCount = -reqCount;
                vOutput.value = '随机测试 为第 ' + (which + 1) + ' 行\n  ' + p_k + '  \n获取数据库数据 异常：\n' + data.msg;
                alert(StringUtil.get(vOutput.value));
                return
                // throw new Error('随机测试 为\n  ' + tableName + '/' + key + '  \n获取数据库数据 异常：\n' + data.msg)
              }

              if (isRandom) {
                invoke((data[tableName] || {})[lastKeyInPath], which, p_k, pathKeys, key, lastKeyInPath);
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
          //   throw new Error('随机测试 第 ' + (i + 1) + ' 行格式错误！字符 ' + value + ' 不是合法的随机函数!');
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

            if ([ORDER_DB, ORDER_IN, ORDER_INT].indexOf(fun) >= 0) {  //顺序函数
              var stepStr = splitIndex < 0 ? null : funWithOrder.substring(splitIndex + 1, funWithOrder.length);
              var step = stepStr == null || stepStr.length <= 0 ? 1 : +stepStr; //都会自动忽略空格 Number(stepStr); //Number.parseInt(stepStr); //+stepStr;

              if (Number.isSafeInteger(step) != true || step <= 0
                || (StringUtil.isEmpty(stepStr, false) != true && StringUtil.isNumber(stepStr) != true)
              ) {
                throw new Error('随机测试 第 ' + (i + 1) + ' 行格式错误！路径 ' + path + ' 中字符 ' + stepStr + ' 不符合跨步 step 格式！'
                  + '\n顺序整数 和 顺序取值 可以通过以下格式配置 升降序 和 跨步：'
                  + '\n  ODER_REAL+step(arg0, arg1...)\n  ODER_REAL-step(arg0, arg1...)'
                  + '\n  ODER_INT+step(arg0, arg1...)\n  ODER_INT-step(arg0, arg1...)'
                  + '\n  ODER_IN+step(start, end)\n  ODER_IN-step(start, end)'
                  + '\n其中：\n  + 为升序，后面没有 step 时可省略；\n  - 为降序，不可省略；' + '\n  step 为跨步值，类型为 正整数，默认为 1，可省略。'
                  + '\n+，-，step 前后都不能有空格等其它字符！');
              }

              if (fun == ORDER_DB) {
                request4Db(JSONResponse.getTableName(pathKeys[pathKeys.length - 2]), which, p_k, pathKeys, key, lastKeyInPath, false, isDesc, step); //request4Db(key + (isDesc ? '-' : '+'), step);
                continue;
              }

              toEval = (fun == ORDER_IN ? 'orderIn' : 'orderInt')
                + '(' + isDesc + ', ' + step*getOrderIndex(
                  randomId, line
                  , fun == ORDER_INT ? 0 : StringUtil.split(value.substring(start + 1, end)).length
                ) + ', ' + value.substring(start + 1);
            }
            else {  //随机函数
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

            }

          }

          invoke(eval(toEval), which, p_k, pathKeys, key, lastKeyInPath);

          // alert('> current = ' + JSON.stringify(current, null, '    '))
        }

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
      test: function (isRandom, accountIndex) {
        var accounts = this.accounts || []
        // alert('test  accountIndex = ' + accountIndex)
        var isCrossEnabled = this.isCrossEnabled
        if (accountIndex == null) {
          accountIndex = -1 //isCrossEnabled ? -1 : 0
        }
        if (isCrossEnabled) {
          var isCrossDone = accountIndex >= accounts.length
          this.crossProcess = isCrossDone ? (isCrossEnabled ? '交叉账号:已开启' : '交叉账号:已关闭') : ('交叉账号: ' + (accountIndex + 1) + '/' + accounts.length)
          if (isCrossDone) {
            alert('已完成账号交叉测试: 退出登录状态 和 每个账号登录状态')
            return
          }
        }

        var baseUrl = StringUtil.trim(App.getBaseUrl())
        if (baseUrl == '') {
          alert('请先输入有效的URL！')
          return
        }
        //开放测试
        // if (baseUrl.indexOf('/apijson.cn') >= 0 || baseUrl.indexOf('/39.108.143.172') >= 0) {
        //   alert('请把URL改成你自己的！\n例如 http://localhost:8080')
        //   return
        // }
        if (baseUrl.indexOf('/apijson.org') >= 0) {
          alert('请把URL改成 http://apijson.cn:8080 或 你自己的！\n例如 http://localhost:8080')
          return
        }

        const list = App.remotes || []
        const allCount = list.length
        doneCount = 0

        if (allCount <= 0) {
          alert('请先获取测试用例文档\n点击[查看共享]图标按钮')
          return
        }

        if (isCrossEnabled) {
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
            App.startTest(list, allCount, isRandom, accountIndex)
          })
        }
        else {
          App.startTest(list, allCount, isRandom, accountIndex)
        }
      },

      startTest: function (list, allCount, isRandom, accountIndex) {
        this.testProcess = '正在测试: ' + 0 + '/' + allCount

        for (var i = 0; i < allCount; i++) {
          const item = list[i]
          const document = item == null ? null : item.Document
          if (document == null || document.name == null) {
            doneCount++
            continue
          }
          if (document.url == '/login' || document.url == '/logout') { //login会导致登录用户改变为默认的但UI上还显示原来的，单独测试OWNER权限时能通过很困惑
            App.log('test  document.url == "/login" || document.url == "/logout" >> continue')
            doneCount++
            continue
          }
          App.log('test  document = ' + JSON.stringify(document, null, '  '))

          const index = i

          var header = null
          try {
            header = App.getHeader(document.header)
          } catch (e) {
            App.log('test  for ' + i + ' >> try { header = App.getHeader(document.header) } catch (e) { \n' + e.message)
          }

          App.request(false, document.type, baseUrl + document.url, App.getRequest(document.request), header, function (url, res, err) {

            try {
              App.onResponse(url, res, err)
              App.log('test  App.request >> res.data = ' + JSON.stringify(res.data, null, '  '))
            } catch (e) {
              App.log('test  App.request >> } catch (e) {\n' + e.message)
            }

            App.compareResponse(allCount, list, index, item, res.data, isRandom, accountIndex, false, err)
          })
        }

      },

      compareResponse: function (allCount, list, index, item, response, isRandom, accountIndex, justRecoverTest, err) {
        var it = item || {} //请求异步
        var d = (isRandom ? App.currentRemoteItem.Document : it.Document) || {} //请求异步
        var r = isRandom ? it.Random : null //请求异步
        var tr = it.TestRecord || {} //请求异步

        if (err != null) {
          tr.compare = {
            code: JSONResponse.COMPARE_ERROR, //请求出错
            msg: '请求出错！',
            path: err.message + '\n\n'
          }
        }
        else {
          var standardKey = App.isMLEnabled != true ? 'response' : 'standard'
          var standard = StringUtil.isEmpty(tr[standardKey], true) ? null : JSON.parse(tr[standardKey])
          tr.compare = JSONResponse.compareResponse(standard, App.removeDebugInfo(response) || {}, '', App.isMLEnabled) || {}
        }

        App.onTestResponse(allCount, list, index, it, d, r, tr, response, tr.compare || {}, isRandom, accountIndex, justRecoverTest);
      },

      onTestResponse: function(allCount, list, index, it, d, r, tr, response, cmp, isRandom, accountIndex, justRecoverTest) {
        tr = tr || {}
        tr.compare = cmp;

        it = it || {}
        it.compareType = tr.compare.code;
        it.hintMessage = tr.compare.path + '  ' + tr.compare.msg;
        switch (it.compareType) {
          case JSONResponse.COMPARE_ERROR:
            it.compareColor = 'red'
            it.compareMessage = '请求出错！'
            break;
          case JSONResponse.COMPARE_NO_STANDARD:
            it.compareColor = 'green'
            it.compareMessage = '确认正确后点击[对的，纠正]'
            break;
          case JSONResponse.COMPARE_KEY_MORE:
            it.compareColor = 'green'
            it.compareMessage = '新增字段/新增值'
            break;
          case JSONResponse.COMPARE_VALUE_CHANGE:
            it.compareColor = 'blue'
            it.compareMessage = '值改变'
            break;
          case JSONResponse.COMPARE_KEY_LESS:
            it.compareColor = 'orange'
            it.compareMessage = '缺少字段/整数变小数'
            break;
          case JSONResponse.COMPARE_TYPE_CHANGE:
            it.compareColor = 'red'
            it.compareMessage = '状态码/异常/值类型 改变'
            break;
          default:
            it.compareColor = 'white'
            it.compareMessage = '查看结果'
            break;
        }

        if (isRandom) {
          r = r || {}
          it.Random = r

          this.updateToRandomSummary(it, 1)
        }
        else {
          it.Document = d
        }
        it.TestRecord = tr

        Vue.set(list, index, it)

        if (justRecoverTest) {
          return
        }

        doneCount ++
        this.testProcess = doneCount >= allCount ? (this.isMLEnabled ? '机器学习:已开启' : '机器学习:已关闭') : '正在测试: ' + doneCount + '/' + allCount

        this.log('doneCount = ' + doneCount + '; d.name = ' + (isRandom ? r.name : d.name) + '; it.compareType = ' + it.compareType)

        var documentId = isRandom ? r.documentId : d.id
        if (this.tests == null) {
          this.tests = {}
        }
        if (this.tests[String(accountIndex)] == null) {
          this.tests[String(accountIndex)] = {}
        }

        var tests = this.tests[String(accountIndex)] || {}
        var t = tests[documentId]
        if (t == null) {
          t = tests[documentId] = {}
        }
        t[isRandom ? (r.id > 0 ? r.id : (r.toId + '' + r.id)) : 0] = response

        this.tests[String(accountIndex)] = tests
        this.log('tests = ' + JSON.stringify(tests, null, '    '))
        // this.showTestCase(true)

        if (doneCount >= allCount && this.isCrossEnabled && isRandom != true) {
          // alert('onTestResponse  accountIndex = ' + accountIndex)
          //TODO 自动给非 红色 报错的接口跑随机测试

          this.test(false, accountIndex + 1)
        }
      },

      //更新父级总览数据
      updateToRandomSummary: function (item, change) {
        var random = item == null || change == null ? null : item.Random
        var toId = random == null ? null : random.toId
        if (toId != null && toId > 0) {

          for (var i in App.randoms) {

            var toIt = App.randoms[i]
            if (toIt != null && toIt.Random != null && toIt.Random.id == toId) {

              var toRandom = toIt.Random
              var id = toRandom == null ? 0 : toRandom.id
              var count = id == null || id <= 0 ? 0 : toRandom.count
              if (count != null && count > 1) {
                var key = item.compareColor + 'Count'
                if (toIt[key] == null) {
                  toIt[key] = 0
                }
                toIt[key] += change
                if (toIt[key] < 0) {
                  toIt[key] = 0
                }

                if (toIt.totalCount == null) {
                  toIt.totalCount = 0
                }
                toIt.totalCount += change
                if (toIt.totalCount < 0) {
                  toIt.totalCount = 0
                }
              }

              Vue.set(App.randoms, i, toIt)

              break;
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
          delete obj["sql:generate|cache|execute|maxExecute"]
          delete obj["depth:count|max"]
          delete obj["time:start|duration|end"]
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
          document = App.currentRemoteItem || {}
        }
        else {
          document = item.Document = item.Document || {}
        }
        var random = isRandom ? item.Random : null
        var testRecord = item.TestRecord = item.TestRecord || {}

        saveTextAs(
          '# APIJSON自动化回归测试-前\n主页: https://github.com/APIJSON/APIJSON'
          + '\n\n接口名称: \n' + (document.version > 0 ? 'V' + document.version : 'V*') + ' ' + document.name
          + '\n返回结果: \n' + JSON.stringify(JSON.parse(testRecord.response || '{}'), null, '    ')
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
            '# APIJSON自动化回归测试-后\n主页: https://github.com/APIJSON/APIJSON'
            + '\n\n接口名称: \n' + (document.version > 0 ? 'V' + document.version : 'V*') + ' ' + document.name
            + '\n返回结果: \n' + JSON.stringify(tests[document.id][isRandom ? random.id : 0] || {}, null, '    ')
            , '测试：' + document.name + '-后.txt'
          )


          if (StringUtil.isEmpty(testRecord.standard, true) == false) {
            setTimeout(function () {
              saveTextAs(
                '# APIJSON自动化回归测试-标准\n主页: https://github.com/APIJSON/APIJSON'
                + '\n\n接口名称: \n' + (document.version > 0 ? 'V' + document.version : 'V*') + ' ' + document.name
                + '\n测试结果: \n' + JSON.stringify(testRecord.compare || '{}', null, '    ')
                + '\n测试标准: \n' + JSON.stringify(JSON.parse(testRecord.standard || '{}'), null, '    ')
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
      handleTest: function (right, index, item, isRandom) {
        item = item || {}
        var random = item.Random = item.Random || {}
        var document;
        if (isRandom) {
          if ((random.count || 0) > 1) {
            this.restoreRandom(item)
            this.randomSubs = (item.subs || item['[]']) || []
            this.isRandomSubListShow = true
            return
          }

          document = this.currentRemoteItem || {}
        }
        else {
          document = item.Document = item.Document || {}
        }
        var testRecord = item.TestRecord = item.TestRecord || {}

        var tests = this.tests[String(this.currentAccountIndex)] || {}
        var currentResponse = (tests[isRandom ? random.documentId : document.id] || {})[
          isRandom ? (random.id > 0 ? random.id : (random.toId + '' + random.id)) : 0
        ] || {}

        const list = isRandom ? (random.toId == null || random.toId <= 0 ? this.randoms : this.randomSubs) : this.testCases

        var isBefore = item.showType == 'before'
        if (right != true) {
          item.showType = isBefore ? 'after' : 'before'
          Vue.set(list, index, item);

          var res = isBefore ? JSON.stringify(currentResponse) : testRecord.response

          this.view = 'code'
          this.jsoncon = res || ''
        }
        else {
          var url

          if (isBefore) { //撤回原来错误提交的校验标准
            url = this.server + '/delete'
            const req = {
              TestRecord: {
                id: testRecord.id, //TODO 权限问题？ item.userId,
              },
              tag: 'TestRecord'
            }

            this.request(true, REQUEST_TYPE_JSON, url, req, {}, function (url, res, err) {
              App.onResponse(url, res, err)

              var data = res.data || {}
              if (data.code != CODE_SUCCESS && testRecord!= null && testRecord.id != null) {
                alert('撤回最新的校验标准 异常：\n' + data.msg)
                return
              }

              if (isRandom) {
                App.updateToRandomSummary(item, -1)
              }
              item.compareType = JSONResponse.COMPARE_NO_STANDARD
              item.compareMessage = '查看结果'
              item.compareColor = 'white'
              item.hintMessage = '没有校验标准！'
              item.TestRecord = null

              App.updateTestRecord(0, list, index, item, currentResponse, isRandom, App.currentAccountIndex, true)
            })
          }
          else { //上传新的校验标准
            // if (isRandom && random.id <= 0) {
            //   alert('请先上传这个配置！')
            //   App.currentRandomItem = random
            //   App.showExport(true, false, true)
            //   return
            // }


            var standard = StringUtil.isEmpty(testRecord.standard, true) ? null : JSON.parse(testRecord.standard);
            var code = currentResponse.code;
            var thrw = currentResponse.throw;
            delete currentResponse.code; //code必须一致
            delete currentResponse.throw; //throw必须一致

            var isML = this.isMLEnabled;
            var stddObj = isML ? JSONResponse.updateStandard(standard || {}, currentResponse) : {};
            stddObj.code = code;
            currentResponse.code = code;
            stddObj.throw = thrw;
            currentResponse.throw = thrw;

            const isNewRandom = isRandom && random.id <= 0

            //TODO 先检查是否有重复名称的！让用户确认！
            // if (isML != true) {
            url = this.server + '/post'
            const req = {
              Random: isNewRandom != true ? null : {
                toId: random.toId,
                userId: App.User.id,
                documentId: random.documentId,
                name: random.name,
                count: random.count,
                config: random.config
              },
              TestRecord: {
                userId: App.User.id, //TODO 权限问题？ item.userId,
                documentId: isNewRandom ? null : (isRandom ? random.documentId : document.id),
                randomId: isRandom && ! isNewRandom ? random.id : null,
                host: App.getBaseUrl(),
                compare: JSON.stringify(testRecord.compare || {}),
                response: JSON.stringify(currentResponse || {}),
                standard: isML ? JSON.stringify(stddObj) : null
              },
              tag: isNewRandom ? 'Random' : 'TestRecord'
            }
            // }
            // else {
            //   url = App.server + '/post/testrecord/ml'
            //   req = {
            //     documentId: document.id
            //   }
            // }

            this.request(true, REQUEST_TYPE_JSON, url, req, {}, function (url, res, err) {
              App.onResponse(url, res, err)

              var data = res.data || {}
              if (data.code != CODE_SUCCESS) {
                if (isML) {
                  alert('机器学习更新标准 异常：\n' + data.msg)
                }
              }
              else {
                if (isRandom) {
                  App.updateToRandomSummary(item, -1)
                }

                item.compareType = JSONResponse.COMPARE_EQUAL
                item.compareMessage = '查看结果'
                item.compareColor = 'white'
                item.hintMessage = '结果正确'
                var testRecord = item.TestRecord || {}
                testRecord.compare = {
                  code: 0,
                  msg: '结果正确'
                }
                testRecord.response = JSON.stringify(currentResponse)
                // testRecord.standard = stdd

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


                //
                // if (! isNewRandom) {
                //   if (isRandom) {
                //     App.showRandomList(true, App.currentRemoteItem)
                //   }
                //   else {
                //     App.showTestCase(true, false)
                //   }
                // }

                App.updateTestRecord(0, list, index, item, currentResponse, isRandom)
              }

            })

          }
        }
      },

      updateTestRecord: function (allCount, list, index, item, response, isRandom) {
        item = item || {}
        var doc = (isRandom ? item.Random : item.Document) || {}

        this.request(true, REQUEST_TYPE_JSON, this.server + '/get', {
          TestRecord: {
            documentId: isRandom ? doc.documentId : doc.id,
            randomId: isRandom ? doc.id : null,
            testAccountId: App.getCurrentAccountId(),
            'host': App.getBaseUrl(),
            '@order': 'date-',
            '@column': 'id,userId,documentId,randomId,response' + (App.isMLEnabled ? ',standard' : ''),
            '@having': App.isMLEnabled ? 'length(standard)>2' : null  // '@having': App.isMLEnabled ? 'json_length(standard)>0' : null
          }
        }, {}, function (url, res, err) {
          App.onResponse(url, res, err)

          var data = (res || {}).data || {}
          if (data.code != CODE_SUCCESS) {
            alert('获取最新的校验标准 异常：\n' + data.msg)
            return
          }

          item.TestRecord = data.TestRecord
          App.compareResponse(allCount, list, index, item, response, isRandom, App.currentAccountIndex, true, err);
        })
      },

      //显示详细信息, :data-hint :data, :hint 都报错，只能这样
      setRequestHint(index, item, isRandom) {
        item = item || {}
        var d = isRandom ? item.Random : item.Document;
        // var r = d == null ? null : (isRandom ? d.config : d.request);
        // this.$refs[isRandom ? 'randomTexts' : 'testCaseTexts'][index].setAttribute('data-hint', r == null ? '' : (isRandom ? r : JSON.stringify(this.getRequest(r), null, ' ')));

        if (isRandom) {
          var toId = (d == null ? null : d.toId) || 0
          this.$refs[toId <= 0 ? 'randomTexts' : 'randomSubTexts'][index].setAttribute('data-hint', (d || {}).config == null ? '' : d.config);
        }
        else {
          this.$refs['testCaseTexts'][index].setAttribute('data-hint', JSON.stringify(this.getRequest(d.request), null, ' '));
        }
      },

      //显示详细信息, :data-hint :data, :hint 都报错，只能这样
      setTestHint(index, item, isRandom) {
        item = item || {};
        var toId = isRandom ? ((item.Random || {}).toId || 0) : 0;
        var h = item.hintMessage;
        this.$refs[isRandom ? (toId <= 0 ? 'testRandomResultButtons' : 'testRandomSubResultButtons') : 'testResultButtons'][index].setAttribute('data-hint', h || '');
      },

// APIJSON >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

    },
    watch: {
      jsoncon: function () {
        App.showJsonView()
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
    created () {
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
        var types = this.getCache('', 'types')
        if (types != null && types.length > 0) {
          this.types = types
        }
        var server = this.getCache('', 'server')
        if (StringUtil.isEmpty(server, true) == false) {
          this.server = server
        }
        var thirdParty = this.getCache('', 'thirdParty')
        if (StringUtil.isEmpty(thirdParty, true) == false) {
          this.thirdParty = thirdParty
        }

        this.locals = this.getCache('', 'locals') || []

        this.isDelegateEnabled = this.getCache('', 'isDelegateEnabled') || this.isDelegateEnabled
        this.isHeaderShow = this.getCache('', 'isHeaderShow') || this.isHeaderShow
        this.isRandomShow = this.getCache('', 'isRandomShow') || this.isRandomShow
      } catch (e) {
        console.log('created  try { ' +
          '\nvar url = this.getCache(, url) ...' +
          '\n} catch (e) {\n' + e.message)
      }
      try { //这里是初始化，不能出错
        var accounts = this.getCache(URL_BASE, 'accounts')
        if (accounts != null) {
          this.accounts = accounts
          this.currentAccountIndex = this.getCache(URL_BASE, 'currentAccountIndex')
        }
      } catch (e) {
        console.log('created  try { ' +
          '\nvar accounts = this.getCache(URL_BASE, accounts)' +
          '\n} catch (e) {\n' + e.message)
      }

      try { //可能URL_BASE是const类型，不允许改，这里是初始化，不能出错
        this.User = this.getCache(this.server, 'User') || {}
        this.isCrossEnabled = this.getCache(this.server, 'isCrossEnabled') || this.isCrossEnabled
        this.isMLEnabled = this.getCache(this.server, 'isMLEnabled') || this.isMLEnabled
        this.crossProcess = this.isCrossEnabled ? '交叉账号:已开启' : '交叉账号:已关闭'
        this.testProcess = this.isMLEnabled ? '机器学习:已开启' : '机器学习:已关闭'
        // this.host = this.getBaseUrl()
        this.page = this.getCache(this.server, 'page') || this.page
        this.count = this.getCache(this.server, 'count') || this.count
        this.testCasePage = this.getCache(this.server, 'testCasePage') || this.testCasePage
        this.testCaseCount = this.getCache(this.server, 'testCaseCount') || this.testCaseCount
        this.randomPage = this.getCache(this.server, 'randomPage') || this.randomPage
        this.randomCount = this.getCache(this.server, 'randomCount') || this.randomCount
        this.randomSubPage = this.getCache(this.server, 'randomSubPage') || this.randomSubPage
        this.randomSubCount = this.getCache(this.server, 'randomSubCount') || this.randomSubCount

      } catch (e) {
        console.log('created  try { ' +
          '\nthis.User = this.getCache(this.server, User) || {}' +
          '\n} catch (e) {\n' + e.message)
      }


      //无效，只能在index里设置 vUrl.value = this.getCache('', 'URL_BASE')
      this.listHistory()
      this.transfer()

    }
  })
})()
