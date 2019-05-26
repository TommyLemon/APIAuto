
(function () {
  Vue.component('vue-item', {
    props: ['jsondata', 'theme'],
    template: '#item-template'
  })

  Vue.component('vue-outer', {
    props: ['jsondata', 'isend', 'theme'],
    template: '#outer-template'
  })

  Vue.component('vue-expand', {
    props: [],
    template: '#expand-template'
  })

  Vue.component('vue-val', {
    props: ['field', 'val', 'isend', 'theme'],
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
            break

          case 'Null':
            return 'null'
            break

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
      Vue.prototype.onRenderJSONItem = function (val, key) {
        if (key == null) {
          return true
        }
        if (key == '_$_table_$_') {
          // return true
          return false
        }

        try {
          if (val instanceof Array == false) {

            var aliaIndex = key.indexOf(':');
            var objName = aliaIndex < 0 ? key : key.substring(0, aliaIndex);

            if (JSONObject.isTableKey(objName)) {
              val._$_table_$_ = objName
              // val = Object.assign({ _$_table_$_: objName }, val) //解决多显示一个逗号 ,

              // this._$_table_$_ = key  TODO  不影响 JSON 的方式，直接在组件读写属性
              // alert('this._$_table_$_ = ' + this._$_table_$_)
            }
          }
          else if (val[0] instanceof Object && (val[0] instanceof Array == false) && JSONObject.isArrayKey(key)) {
            // alert('onRenderJSONItem  key = ' + key + '; val = ' + JSON.stringify(val))

            key = key.substring(0, key.lastIndexOf('[]'));

            var aliaIndex = key.indexOf(':');
            var objName = aliaIndex < 0 ? key : key.substring(0, aliaIndex);

            var firstIndex = objName.indexOf('-');
            var firstKey = firstIndex < 0 ? objName : objName.substring(0, firstIndex);

            if (JSONObject.isTableKey(firstKey)) {
              for (var i = 0; i < val.length; i++) {
                val[i]._$_table_$_ = firstKey

                // this.$children[i]._$_table_$_ = key
                // alert('this.$children[i]._$_table_$_ = ' + this.$children[i]._$_table_$_)
              }
            }
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

          var table = null
          var column = null
          if (val instanceof Object && (val instanceof Array == false)) {
            var aliaIndex = key.indexOf(':');
            var objName = aliaIndex < 0 ? key : key.substring(0, aliaIndex);

            if (JSONObject.isTableKey(objName)) {
              table = objName
              // table = this._$_table_$_
            }
            else {
              var parent = $event.currentTarget.parentElement.parentElement
              var valString = parent.textContent

              // alert('valString = ' + valString)

              var i = valString.indexOf('"_$_table_$_":  "')
              if (i >= 0) {
                valString = valString.substring(i + '"_$_table_$_":  "'.length)
                // alert('valString = ' + valString)
                i = valString.indexOf('"')
                if (i >= 0) {
                  table = valString.substring(0, i)
                }
              }

              column = key
            }
          }
          else {
            if (val instanceof Array && JSONObject.isArrayKey(key)) {
              key = key.substring(0, key.lastIndexOf('[]'));

              var aliaIndex = key.indexOf(':');
              var objName = aliaIndex < 0 ? key : key.substring(0, aliaIndex);

              var firstIndex = objName.indexOf('-');
              var firstKey = firstIndex < 0 ? objName : objName.substring(0, firstIndex);

              if (JSONObject.isTableKey(firstKey)) {
                table = firstKey

                if (firstIndex > 0) {
                  objName = objName.substring(firstIndex + 1);
                  firstIndex = objName.indexOf('-');
                  column = firstIndex < 0 ? objName : objName.substring(0, firstIndex)

                  var s0 = this.getResponseHint({}, table, $event)
                  if (StringUtil.isEmpty(s0, true) == false) {
                    s = s0 + '  -  '
                  }
                }
              }

            }
            else {

              var parent = $event.currentTarget.parentElement.parentElement
              var valString = parent.textContent

              // alert('valString = ' + valString)

              var i = valString.indexOf('"_$_table_$_":  "')
              if (i >= 0) {
                valString = valString.substring(i + '"_$_table_$_":  "'.length)
                // alert('valString = ' + valString)
                i = valString.indexOf('"')
                if (i >= 0) {
                  table = valString.substring(0, i)
                }
              }

              // table = parent._$_table_$_

              column = key
            }
          }
          // alert('setResponseHint  table = ' + table + '; column = ' + column)

          var c = CodeUtil.getCommentFromDoc(docObj == null ? null : docObj['[]'], table, column, App.getMethod(), App.database, true);

          if (StringUtil.isEmpty(c, true) == false) {
            s += (StringUtil.isEmpty(column) ? table : column) + ': ' + c
          }
        }
        catch (e) {
          s += '\n' + e.message
        }

        return s;
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
      urlComment: '',
      historys: [],
      history: {name: '请求0'},
      remotes: [],
      locals: [],
      testCases: [],
      accounts: [
        {
          'isLoggedIn': false,
          'name': '测试账号',
          'phone': '13000082001',
          'password': '123456'
        }
      ],
      currentAccountIndex: 0,
      tests: [],
      testProcess: '机器学习:已关闭',
      compareColor: '#0000',
      isDelayShow: false,
      isSaveShow: false,
      isExportShow: false,
      isTestCaseShow: false,
      isLoginShow: false,
      isConfigShow: false,
      isAdminOperation: false,
      loginType: 'login',
      isExportRemote: false,
      isRegister: false,
      isMLEnabled: false,
      isLocalShow: false,
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
      host: '',
      database: 'MYSQL',// 'POSTGRESQL',
      schema: 'sys',
      server: 'http://vip.apijson.org',
      language: 'Java'
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
            App.jsonhtml = jsonlint.parse(this.jsoncon)
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

        vUrlComment.value = isSingle || StringUtil.isEmpty(App.urlComment, true) ? '' : vUrl.value + CodeUtil.getComment(App.urlComment, false, '  ');
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

      getRequest: function (json) {
        var s = App.toDoubleJSON(json);
        try {
          return jsonlint.parse(s);
        }
        catch (e) {
          log('main.getRequest', 'try { return jsonlint.parse(s); \n } catch (e) {\n' + e.message)
          log('main.getRequest', 'return jsonlint.parse(App.removeComment(s));')
          return jsonlint.parse(App.removeComment(s));
        }
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
      showExport: function (show, isRemote) {
        if (show) {
          if (isRemote) { //共享测试用例
            if (App.isTestCaseShow) {
              alert('请先输入请求内容！')
              return
            }
            if (App.view != 'code') {
              alert('请先测试请求，确保是正确可用的！')
              return
            }
            var tag = App.getTag()
            App.exTxt.name = App.getMethod() + (StringUtil.isEmpty(tag, true) ? '' : ' ' + tag)
          }
          else { //下载到本地
            if (App.isTestCaseShow) { //文档
              App.exTxt.name = 'APIJSON自动化文档 ' + App.formatDateTime()
            }
            else if (App.view == 'markdown' || App.view == 'output') {
              var suffix
              switch (App.language) {
                case 'Java':
                  suffix = '.java';
                  break;
                case 'Swift':
                  suffix = '.swift';
                  break;
                case 'Kotlin':
                  suffix = '.kt';
                  break;
                case 'Objective-C':
                  suffix = '.h';
                  break;
                case 'C#':
                  suffix = '.cs';
                  break;
                case 'PHP':
                  suffix = '.php';
                  break;
                case 'Go':
                  suffix = '.go';
                  break;
                //以下都不需要解析，直接用左侧的 JSON
                case 'JavaScript':
                  suffix = '.js';
                  break;
                case 'TypeScript':
                  suffix = '.ts';
                  break;
                case 'Python':
                  suffix = '.py';
                  break;
                default:
                  suffix = '.java';
                  break;
              }

              App.exTxt.name = 'User' + suffix
              alert('自动生成模型代码，可填类名后缀:\n'
                + '.java(Java), .kt(Kotlin), .swift(Swift) , .h(Objective-C),  .m(Objective-C),'
                + '\n.ts(TypeScript), .js(JavaScript, .cs(C#), .php(PHP), python(Python), .go(Go)');
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
        if (show) {
          App.exTxt.index = index
          switch (index) {
            case 0:
            case 1:
            case 2:
            case 4:
              App.exTxt.name = index == 0 ? App.database : (index == 1 ? App.schema : (index == 2 ? App.language : App.server))
              App.isConfigShow = true

              if (index == 0) {
                alert('可填数据库:\nMYSQL,POSTGRESQL')
              }
              else if (index == 2) {
                alert('自动生成代码，可填语言:\nJava,Kotlin,Swift,Objective-C,\nTypeScript,JavaScript,C#,PHP,Python,Go')
              }
              break
            case 3:
              App.host = App.getBaseUrl()
              App.showUrl(false, new String(vUrl.value).substring(App.host.length)) //没必要导致必须重新获取 Response，App.onChange(false)
              break
            case 5:
              App.getCurrentUser(true)
              break
            case 6:
              App.showAndSend('/get', {
                'Goods[]': {
                  'count': 0,
                  'Goods': {
                    '@column': 'name,detail'
                  }
                }
              }, true)
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
      },

      // 保存当前的JSON
      save: function () {
        if (App.history.name.trim() === '') {
          Helper.alert('名称不能为空！', 'danger')
          return
        }
        var val = {
          name: App.history.name,
          url: '/' + this.getMethod(),
          request: inputted
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
      remove: function (item, index, isRemote) {
        if (isRemote == null || isRemote == false) { //null != false
          localforage.removeItem(item.key, function () {
            App.historys.splice(index, 1)
          })
        } else {
          if (App.isLocalShow) {
            App.locals.splice(index, 1)
            return
          }

          App.isTestCaseShow = false

          var url = App.server + '/delete'
          var req = {
            'Document': {
              'id': item.Document == null ? 0 : item.Document.id
            },
            'tag': 'Document'
          }
          App.request(true, url, req, function (url, res, err) {
            App.onResponse(url, res, err)

            var rpObj = res.data

            if (rpObj != null && rpObj.Document != null && rpObj.Document.code == 200) {
              App.remotes.splice(index, 1)
              App.showTestCase(true, App.isLocalShow)
            }
          })
        }
      },

      // 根据历史恢复数据
      restoreRemote: function (item) {
        this.restore(item.Document)
      },
      // 根据历史恢复数据
      restore: function (item) {
        localforage.getItem(item.key || '', function (err, value) {
          var branch = new String(item.url || '/get')
          if (branch.startsWith('/') == false) {
            branch = '/' + branch
          }

          App.urlComment = item.name;
          App.showUrl(false, branch)

          App.showTestCase(false, App.isLocalShow)
          vInput.value = item.request
          App.onChange(false)
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
      exportTxt: function () {
        App.isExportShow = false

        if (App.isExportRemote == false) { //下载到本地

          if (App.isTestCaseShow) { //文档
            saveTextAs('# ' + App.exTxt.name + '\n主页: https://github.com/TommyLemon/APIJSON'
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
            else if  (clazz.endsWith('.h')) {
              txt += CodeUtil.parseObjectiveCEntityH(docObj, clazz.substring(0, clazz.length - 2), App.database)
            }
            else if  (clazz.endsWith('.m')) {
              txt += CodeUtil.parseObjectiveCEntityM(docObj, clazz.substring(0, clazz.length - 2), App.database)
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
            else if  (clazz.endsWith('.js')) {
              txt += CodeUtil.parseJavaScriptEntity(docObj, clazz.substring(0, clazz.length - 3), App.database)
            }
            else if  (clazz.endsWith('.ts')) {
              txt += CodeUtil.parseTypeScriptEntity(docObj, clazz.substring(0, clazz.length - 3), App.database)
            }
            else if (clazz.endsWith('.py')) {
              txt += CodeUtil.parsePythonBean(docObj, clazz.substring(0, clazz.length - 3), App.database)
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
              case 'Java':
                s += '(Java):\n\n' + CodeUtil.parseJavaResponse('', res, 0, false, ! isSingle)
                break;
              case 'Swift':
                s += '(Swift):\n\n' + CodeUtil.parseSwiftResponse('', res, 0, isSingle)
                break;
              case 'Kotlin':
                s += '(Kotlin):\n\n' + CodeUtil.parseKotlinResponse('', res, 0, false, ! isSingle)
                break;
              case 'Objective-C':
                s += '(Objective-C):\n\n' + CodeUtil.parseObjectiveCResponse('', res, 0)
                break;
              case 'C#':
                s += '(C#):\n\n' + CodeUtil.parseCSharpResponse('', res, 0)
                break;
              case 'PHP':
                s += '(PHP):\n\n' + CodeUtil.parsePHPResponse('', res, 0, isSingle)
                break;
              case 'Go':
                s += '(Go):\n\n' + CodeUtil.parseGoResponse('', res, 0)
                break;
              case 'JavaScript':
                s += '(JavaScript):\n\n' + CodeUtil.parseJavaScriptResponse('', res, 0, isSingle)
                break;
              case 'TypeScript':
                s += '(TypeScript):\n\n' + CodeUtil.parseTypeScriptResponse('', res, 0, isSingle)
                break;
              case 'Python':
                s += '(Python):\n\n' + CodeUtil.parsePythonResponse('', res, 0)
                break;
              default:
                s += ':\n没有生成代码，可能生成代码(封装,解析)的语言配置错误。 \n';
                break;
            }

            saveTextAs('# ' + App.exTxt.name + '\n主页: https://github.com/TommyLemon/APIJSON'
              + '\n\nURL: ' + vUrl.value
              + '\n\nRequest:\n' + vInput.value
              + '\n\n\nResponse:\n' + App.jsoncon
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

          App.isTestCaseShow = false

          var currentAccount = App.accounts[App.currentAccountIndex];

          var url = App.server + '/post'
          var req = {
            'Document': {
              'userId': App.User.id,
              'testAccountId': currentAccount.isLoggedIn ? currentAccount.id : null,
              'name': App.exTxt.name,
              'url': '/' + App.getMethod(),
              'request': App.toDoubleJSON(inputted)
            },
            'tag': 'Document'
          }

          App.request(true, url, req, function (url, res, err) {
            App.onResponse(url, res, err)

            var rpObj = res.data

            if (rpObj != null && rpObj.Document != null && rpObj.Document.code == 200) {
              App.remotes = []
              App.showTestCase(true, false)
            }
          })
        }
      },

      // 保存配置
      saveConfig: function () {
        App.isConfigShow = false

        if (App.exTxt.index <= 2) {
          switch (App.exTxt.index) {
            case 0:
              App.database = App.exTxt.name
              App.saveCache('', 'database', App.database)

              doc = null
              var item = App.accounts[App.currentAccountIndex]
              item.isLoggedIn = false
              App.onClickAccount(App.currentAccountIndex, item)
              break;
            case 1:
              App.schema = App.exTxt.name
              App.saveCache('', 'schema', App.schema)

              doc = null
              var item = App.accounts[App.currentAccountIndex]
              item.isLoggedIn = false
              App.onClickAccount(App.currentAccountIndex, item)
              break;
            case 2:
              App.language = App.exTxt.name
              App.saveCache('', 'language', App.language)

              doc = null
              App.onChange(false)
              break;
          }
        }
        else {
          App.server = App.exTxt.name
          App.saveCache('', 'server', App.server)

          // App.remotes = []
          // App.Privacy = {}
          // App.showTestCase(false, false) //App.showTestCase(true)
          App.logout(true)
        }
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






      onClickAccount: function (index, item) {
        if (this.currentAccountIndex == index) {
          this.setRememberLogin(item.remember)
          vAccount.value = item.phone
          vPassword.value = item.password

          if (item.isLoggedIn) {
            //logout FIXME 没法自定义退出，浏览器默认根据url来管理session的
            this.logout(false, function (url, res, err) {
              App.onResponse(url, res, err)

              item.isLoggedIn = false
              App.saveCache(App.getBaseUrl(), 'currentAccountIndex', App.currentAccountIndex)
              App.saveCache(App.getBaseUrl(), 'accounts', App.accounts)
            });
          }
          else {
            //login
            this.login(false, function (url, res, err) {
              App.onResponse(url, res, err)

              item.isLoggedIn = true

              var data = res.data || {}
              var user = data.code == 200 ? data.user : null
              if (user != null) {
                item.name = user.name
                item.remember = data.remember

                App.saveCache(App.getBaseUrl(), 'currentAccountIndex', App.currentAccountIndex)
                App.saveCache(App.getBaseUrl(), 'accounts', App.accounts)
              }
            });
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
        item.isLoggedIn = false
        this.onClickAccount(index, item)
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
        App.isTestCaseShow = show
        App.isLocalShow = isLocal

        vOutput.value = show ? '' : (output || '')
        App.showDoc()

        if (isLocal) {
          App.testCases = App.locals || []
          return
        }
        App.testCases = App.remotes || []

        if (show && App.testCases.length <= 0) {
          App.isTestCaseShow = false

          var url = App.server + '/get'
          var req = {
            '[]': {
              'count': 0,
              'Document': {
                '@order': 'version-,date-',
                'userId': App.User.id
              },
              'TestRecord': {
                'documentId@': '/Document/id',
                '@order': 'date-',
                '@column': 'id,userId,documentId,response',
                'userId': App.User.id
              }
            },
            '@role': 'login'
          }

          App.onChange(false)
          App.request(true, url, req, function (url, res, err) {
            App.onResponse(url, res, err)

            var rpObj = res.data

            if (rpObj != null && rpObj.code === 200) {
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
        localStorage.setItem(url, JSON.stringify(cache))
      },
      getCache: function (url, key) {
        var cache = localStorage.getItem(url)
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
        App.isLoginShow = show
        App.isAdminOperation = isAdmin

        if (show != true) {
          return
        }

        var user = isAdmin ? App.User : null //add account   App.accounts[App.currentAccountIndex]

        // alert("showLogin  isAdmin = " + isAdmin + "; user = \n" + JSON.stringify(user, null, '    '))

        if (user == null) {
          user = {
            phone: 13000082001,
            password: 123456
          }
        }

        this.setRememberLogin(user.remember)
        vAccount.value = user.phone
        vPassword.value = user.password
      },

      setRememberLogin(remember) {
        vRemember.checked = remember || false
      },

      /**登录
       */
      login: function (isAdminOperation, callback) {
        App.isLoginShow = false

        const req = {
          type: 0, // 登录方式，非必须 0-密码 1-验证码
          phone: vAccount.value,
          password: vPassword.value,
          version: 1, // 全局默认版本号，非必须
          remember: vRemember.checked,
          defaults: {
            '@database': App.database,
            '@schema': App.schema
          }
        }

        if (isAdminOperation) {
          App.request(isAdminOperation, App.server + '/login', req, function (url, res, err) {
            if (callback) {
              callback(url, res, err)
              return
            }

            var rpObj = res.data || {}

            if (rpObj.code != 200) {
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

              //查询余额
              App.request(true, App.server + '/gets', {
                'Privacy': {
                  'id': user.id
                },
                'tag': 'Privacy'
              }, function (url, res, err) {
                var data = res.data || {}
                if (data.code == 200 && data.Privacy != null) {
                  App.Privacy = data.Privacy
                }
              })


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
            if (data.code == 200) {
              var user = data.user || {}
              App.accounts.push( {
                isLoggedIn: true,
                id: user.id,
                name: user.name,
                phone: req.phone,
                password: req.password,
                remember: data.remember
              })
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
              phone: vAccount.value,
              _password: vPassword.value
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

          if (rpObj != null && rpObj.code === 200) {
            alert('注册成功')

            var privacy = rpObj.Privacy || {}

            vAccount.value = privacy.phone
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
              phone: vAccount.value,
              _password: vPassword.value
            }
          },
          null, '    ')
        App.showTestCase(false, App.isLocalShow)
        App.onChange(false)
        App.send(isAdminOperation, function (url, res, err) {
          App.onResponse(url, res, err)

          var rpObj = res.data

          if (rpObj != null && rpObj.code === 200) {
            alert('重置密码成功')

            var privacy = rpObj.Privacy || {}

            vAccount.value = privacy.phone
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
          this.request(isAdminOperation, App.server + '/logout', req, function (url, res, err) {
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
            phone: vAccount.value
          },
          null, '    ')
        App.showTestCase(false, App.isLocalShow)
        App.onChange(false)
        App.send(isAdminOperation, function (url, res, err) {
          App.onResponse(url, res, err)

          var data = res.data || {}
          var obj = data.code == 200 ? data.verify : null
          var verify = obj == null ? null : obj.verify
          if (verify != null) { //FIXME isEmpty校验时居然在verify=null! StringUtil.isEmpty(verify, true) == false) {
            vVerify.value = verify
          }
        })
      },

      /**获取当前用户
       */
      getCurrentUser: function (isAdminOperation, callback) {
        App.showUrl(isAdminOperation, '/gets')
        vInput.value = JSON.stringify(
          {
            Privacy: {
              id: App.User.id
            },
            tag: 'Privacy'
          },
          null, '    ')
        App.showTestCase(false, App.isLocalShow)
        App.onChange(false)
        App.send(isAdminOperation, function (url, res, err) {
          if (callback) {
            callback(url, res, err)
            return
          }

          App.onResponse(url, res, err)
          if (isAdminOperation) {
            var data = res.data || {}
            if (data.code == 200 && data.Privacy != null) {
              App.Privacy = data.Privacy
            }
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
          before = App.toDoubleJSON(before);
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
            afterObj = jsonlint.parse(App.removeComment(before));
            after = JSON.stringify(afterObj, null, "    ");
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

          vInput.value = before;
          vSend.disabled = false;
          vOutput.value = output = 'OK，请点击 [发送请求] 按钮来测试。[点击这里查看视频教程](http://i.youku.com/apijson)' + code;


          App.showDoc()

          try {
            var m = App.getMethod();
            var c = isSingle ? '' : CodeUtil.parseComment(after, docObj == null ? null : docObj['[]'], m, App.database)

            if (isSingle != true && afterObj.tag == null) {
              m = m == null ? 'GET' : m.toUpperCase()
              if (['GETS', 'HEADS', 'POST', 'PUT', 'DELETE'].indexOf(m) >= 0) {
                c += ' ! 非开放请求必须设置 tag ！例如 "tag": "User"'
              }
            }
            vComment.value = c
            vUrlComment.value = isSingle || StringUtil.isEmpty(App.urlComment, true) ? '' : vUrl.value + CodeUtil.getComment(App.urlComment, false, '  ');

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
            msg: 'JSON格式错误！请检查并编辑请求！\n\n如果JSON中有注释，请 手动删除 或 点击左边的 \'/" 按钮 来去掉。\n\n' + e.message
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

        // 删除注释 <<<<<<<<<<<<<<<<<<<<<

        var input = this.removeComment(vInput.value);
        if (vInput.value != input) {
          vInput.value = input
        }

        // 删除注释 >>>>>>>>>>>>>>>>>>>>>


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
        this.onHandle(vInput.value)

        clearTimeout(handler);

        var req = this.getRequest(vInput.value);

        var url = StringUtil.get(this.host) + new String(vUrl.value)
        url = url.replace(/ /g, '')


        vOutput.value = "requesting... \nURL = " + url;
        this.view = 'output';


        this.setBaseUrl()
        this.request(isAdminOperation, url, req, callback)

        this.locals = this.locals || []
        if (this.locals.length >= 1000) { //最多1000条，太多会很卡
          this.locals.splice(999, this.locals.length - 999)
        }
        var method = App.getMethod()
        this.locals.unshift({
          'Document': {
            'userId': App.User.id,
            'name': App.formatDateTime() + (StringUtil.isEmpty(req.tag, true) ? '' : ' ' + req.tag),
            'url': '/' + method,
            'request': JSON.stringify(req, null, '    ')
          }
        })
        App.saveCache('', 'locals', this.locals)
      },

      //请求
      request: function (isAdminOperation, url, req, callback) {
        // axios.defaults.withcredentials = true
        axios({
          method: 'post',
          url: StringUtil.noBlank(url),
          data: req,
          withCredentials: true
        })
          .then(function (res) {
            res = res || {}
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

                App.accounts[App.currentAccountIndex].isLoggedIn = false
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
          if (isSingle && data.code == 200) { //不格式化错误的结果
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
      doOnKeyUp: function (event) {
        var keyCode = event.keyCode ? event.keyCode : (event.which ? event.which : event.charCode);
        if (keyCode == 13) { // enter
          this.send(false);
        }
        else {
          App.urlComment = '';
          this.onChange(true);
        }
      },


      /**转为请求代码
       * @param rq
       */
      getCode: function (rq) {
        var s = '\n\n\n### 请求代码(自动生成) \n';
        switch (App.language) {
          case 'Java':
            s += '\n#### <= Android-Java: 同名变量需要重命名'
              + ' \n ```java \n'
              + StringUtil.trim(CodeUtil.parseJava(null, JSON.parse(rq), 0, isSingle))
              + '\n ``` \n注：' + (isSingle ? '用了 APIJSON 的 JSONRequest 类，也可使用其它类封装，只要 JSON 有序就行\n' : 'LinkedHashMap&lt;&gt;() 可替换为 fastjson 中的 JSONObject(true) 等有序JSON构造方法\n');
            break;
          case 'Swift':
            s += '\n#### <= iOS-Swift: 空对象用 [ : ]'
              + '\n ```swift \n'
              + CodeUtil.parseSwift(null, JSON.parse(rq), 0)
              + '\n ``` \n注：对象 {} 用 ["key": value]，数组 [] 用 [value0, value1]\n';
            break;
          case 'Kotlin':
            s += '\n#### <= Android-Kotlin: 空对象用 HashMap&lt;String, Any&gt;()，空数组用 ArrayList&lt;Any&gt;()\n'
              + '```kotlin \n'
              + CodeUtil.parseKotlin(null, JSON.parse(rq), 0)
              + '\n ``` \n注：对象 {} 用 mapOf("key": value)，数组 [] 用 listOf(value0, value1)\n';
            break;
          case 'Objective-C':
            s += '\n#### <= iOS-Objective-C \n ```objective-c \n'
              + CodeUtil.parseObjectiveC(null, JSON.parse(rq))
              + '\n ```  \n';
            break;
          case 'C#':
            s += '\n#### <= Unity3D-C\#: 键值对用 {"key", value}' +
              '\n ```csharp \n'
              + CodeUtil.parseCSharp(null, JSON.parse(rq), 0)
              + '\n ``` \n注：对象 {} 用 new JObject{{"key", value}}，数组 [] 用 new JArray{value0, value1}\n';
            break;
          case 'PHP':
            s += '\n#### <= Web-PHP: 空对象用 (object) ' + (isSingle ? '[]' : 'array()')
              + ' \n ```php \n'
              + CodeUtil.parsePHP(null, JSON.parse(rq), 0, isSingle)
              + '\n ``` \n注：对象 {} 用 ' + (isSingle ? '[\'key\' => value]' : 'array("key" => value)') + '，数组 [] 用 ' + (isSingle ? '[value0, value1]\n' : 'array(value0, value1)\n');
            break;
          case 'Go':
            s += '\n#### <= Web-Go: 对象 key: value 会被强制排序，每个 key: value 最后都要加逗号 ","'
              + ' \n ```go \n'
              + CodeUtil.parseGo(null, JSON.parse(rq), 0)
              + '\n ``` \n注：对象 {} 用 map[string]interface{} {"key": value}，数组 [] 用 []interface{} {value0, value1}\n';
            break;
          //以下都不需要解析，直接用左侧的 JSON
          case 'JavaScript':
          case 'TypeScript':
          case 'Python':
            break;
          default:
            s += '\n没有生成代码，可能生成代码(封装,解析)的语言配置错误。\n';
            break;
        }
        s += '\n#### <= Web-JavaScript/TypeScript/Python: 和左边的请求 JSON 一样 \n';

        s += '\n\n#### 开放源码 '
          + '\nAPIJSON 接口工具: [https://github.com/TommyLemon/APIJSONAuto](https://github.com/TommyLemon/APIJSONAuto) '
          + '\nAPIJSON -Java版: [https://github.com/TommyLemon/APIJSON](https://github.com/TommyLemon/APIJSON) '
          + '\nAPIJSON - C# 版: [https://github.com/liaozb/APIJSON.NET](https://github.com/liaozb/APIJSON.NET) '
          + '\nAPIJSON - PHP版: [https://github.com/qq547057827/apijson-php](https://github.com/qq547057827/apijson-php) '
          + '\nAPIJSON -Node版: [https://github.com/TEsTsLA/apijson](https://github.com/TEsTsLA/apijson) '
          + '\nAPIJSON - Go 版: [https://github.com/crazytaxi824/APIJSON](https://github.com/crazytaxi824/APIJSON) '
          + '\nAPIJSON -Python: [https://github.com/zhangchunlin/uliweb-apijson](https://github.com/zhangchunlin/uliweb-apijson) ';

        return s;
      },


      /**显示文档
       * @param d
       **/
      setDoc: function (d) {
        if (d == null || d == '') {
          return false;
        }
        doc = d;
        vOutput.value += (
          '\n\n\n## 文档 \n\n 通用文档见 [APIJSON通用文档](https://github.com/TommyLemon/APIJSON/blob/master/Document.md#3.2) \n### 数据字典\n自动查数据库表和字段属性来生成 \n\n' + d
        );

        App.view = 'markdown';
        markdownToHTML(vOutput.value);
        return true;
      },


      /**
       * 获取文档
       */
      getDoc: function (callback) {


        App.request(false, this.getBaseUrl() + '/get', {
          '@database': App.database,
          '[]': {
            'count': 0,
            'Table': {
              'table_schema': App.schema,
              'table_type': 'BASE TABLE',
              'table_name!$': ['\\_%', 'sys\\_%', 'system\\_%'],
              '@order': 'table_name+',
              '@column': App.database == 'POSTGRESQL' ? 'table_name' : 'table_name,table_comment'
            },
            'PgClass': App.database != 'POSTGRESQL' ? null : {
              'relname@': '/Table/table_name',
              //FIXME  多个 schema 有同名表时数据总是取前面的  不属于 pg_class 表 'nspname': App.schema,
              '@column': 'oid;obj_description(oid):table_comment'
            },
            '[]': {
              'count': 0,
              'Column': {
                'table_schema': App.schema,
                'table_name@': '[]/Table/table_name',
                '@column': App.database == 'POSTGRESQL'
                  ? 'column_name;data_type;numeric_precision,numeric_scale,character_maximum_length'
                  : 'column_name,column_type,column_comment'
              },
              'PgAttribute': App.database != 'POSTGRESQL' ? null : {
                'attrelid@': '[]/PgClass/oid',
                'attname@': '/Column/column_name',
                'attnum>': 0,
                '@column': 'col_description(attrelid,attnum):column_comment'
              }
            }
          },
          'Access[]': {
            'count': 0,
            'Access': {
              '@column': 'schema,name,alias,get,head,gets,heads,post,put,delete',
              '@order': 'date-,name+',
              'name()': 'getWithDefault(alias,name)',
              'r0()': 'removeKey(alias)'
            }
          },
          'Function[]': {
            'count': 0,
            'Function': {
              '@order': 'date-,name+',
              '@column': 'name,arguments,demo,detail',
              'demo()': 'getFunctionDemo()',
              'detail()': 'getFunctionDetail()',
              'r0()': 'removeKey(name)',
              'r1()': 'removeKey(arguments)'
            }
          },
          'Request[]': {
            'count': 0,
            'Request': {
              '@order': 'version-,method-'
            }
          }
        }, function (url, res, err) {
          if (err != null || res == null || res.data == null) {
            log('getDoc  err != null || res == null || res.data == null >> return;');
            return;
          }

//      log('getDoc  docRq.responseText = \n' + docRq.responseText);
          docObj = res.data;

          //转为文档格式
          var doc = '';
          var item;

          //[] <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
          var list = docObj == null ? null : docObj['[]'];
          if (list != null) {
            log('getDoc  [] = \n' + format(JSON.stringify(list)));

            var table;
            var columnList;
            var column;
            for (var i = 0; i < list.length; i++) {
              item = list[i];

              //Table
              table = item == null ? null : item.Table;
              if (table == null) {
                continue;
              }
              log('getDoc [] for i=' + i + ': table = \n' + format(JSON.stringify(table)));


              doc += '### ' + (i + 1) + '. ' + CodeUtil.getModelName(table.table_name) + '\n#### 说明: \n'
                + App.toMD(App.database != 'POSTGRESQL' ? table.table_comment : (item.PgClass || {}).table_comment);

              //Column[]
              doc += '\n\n#### 字段: \n 名称  |  类型  |  最大长度  |  详细说明' +
                ' \n --------  |  ------------  |  ------------  |  ------------ ';

              columnList = item['[]'];
              if (columnList == null) {
                continue;
              }
              log('getDoc [] for ' + i + ': columnList = \n' + format(JSON.stringify(columnList)));

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
                type = CodeUtil.getJavaType(column.column_type, false);
                length = CodeUtil.getMaxLength(column.column_type);

                log('getDoc [] for j=' + j + ': column = \n' + format(JSON.stringify(column)));

                var o = App.database != 'POSTGRESQL' ? column : (columnList[j] || {}).PgAttribute

                doc += '\n' + name + '  |  ' + type + '  |  ' + length + '  |  ' + App.toMD((o || {}).column_comment);

              }

              doc += '\n\n\n';

            }

          }

          //[] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>



          //Access[] <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
          list = docObj == null ? null : docObj['Access[]'];
          if (list != null) {
            log('getDoc  Access[] = \n' + format(JSON.stringify(list)));

            doc += '\n\n\n\n\n\n\n\n\n### 访问权限\n自动查 Access 表写入的数据来生成\n'
              + ' \n 表名(Schema)  |  允许 get 的角色  |  允许 head 的角色  |  允许 gets 的角色  |  允许 heads 的角色  |  允许 post 的角色  |  允许 put 的角色  |  允许 delete 的角色  |  表名(Schema)'
              + ' \n --------  |  ---------  |  ---------  |  ---------  |  ---------  |  ---------  |  ---------  |  --------- | --------  ';

            for (var i = 0; i < list.length; i++) {
              item = list[i];
              if (item == null) {
                continue;
              }
              log('getDoc Access[] for i=' + i + ': item = \n' + format(JSON.stringify(item)));


              doc += '\n' + (item.name + '(' + item.schema + ')')
                + '  |  ' + JSONResponse.getShowString(JSON.parse(item.get))
                + '  |  ' + JSONResponse.getShowString(JSON.parse(item.head))
                + '  |  ' + JSONResponse.getShowString(JSON.parse(item.gets))
                + '  |  ' + JSONResponse.getShowString(JSON.parse(item.heads))
                + '  |  ' + JSONResponse.getShowString(JSON.parse(item.post))
                + '  |  ' + JSONResponse.getShowString(JSON.parse(item.put))
                + '  |  ' + JSONResponse.getShowString(JSON.parse(item.delete))
                + '  |  ' + (item.name + '(' + item.schema + ')');
            }

            doc += '\n' //避免没数据时表格显示没有网格
          }

          //Access[] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>


          //Function[] <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
          list = docObj == null ? null : docObj['Function[]'];
          if (list != null) {
            log('getDoc  Function[] = \n' + format(JSON.stringify(list)));

            doc += '\n\n\n\n\n\n\n\n\n### 远程函数\n自动查 Function 表写入的数据来生成\n'
              + ' \n 说明  |  示例'
              + ' \n --------  |  -------------- ';

            for (var i = 0; i < list.length; i++) {
              item = list[i];
              if (item == null) {
                continue;
              }
              log('getDoc Function[] for i=' + i + ': item = \n' + format(JSON.stringify(item)));


              doc += '\n' + item.detail + '  |  ' + JSON.stringify(item.demo);
            }

            doc += '\n' //避免没数据时表格显示没有网格
          }

          //Function[] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>


          //Request[] <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
          list = docObj == null ? null : docObj['Request[]'];
          if (list != null) {
            log('getDoc  Request[] = \n' + format(JSON.stringify(list)));

            doc += '\n\n\n\n\n\n\n\n\n### 非开放请求\n自动查 Request 表写入的数据来生成\n'
              + ' \n 版本  |  方法  |  数据和结构'
              + ' \n --------  |  ------------  |  ------------  |  ------------ ';

            for (var i = 0; i < list.length; i++) {
              item = list[i];
              if (item == null) {
                continue;
              }
              log('getDoc Request[] for i=' + i + ': item = \n' + format(JSON.stringify(item)));


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

      toDoubleJSON: function (json) {
        if (json != null && json.indexOf("'") >= 0) {
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
          while (s.indexOf('|') >= 0) {
            s = s.replace('|', '\|');
          }
          while (s.indexOf('\n') >= 0) {
            s = s.replace('\n', ' <br /> ');
          }
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
            if (k == null || k == '' || k == 'ADD' || k == 'REMOVE' || k == 'REPLACE' || k == 'PUT') {
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
        }

        log('getStructure  return obj; = \n' + format(JSON.stringify(obj)));

        if (tag != null) {
          //补全省略的Table
          if (this.isTableKey(tag) && obj[tag] == null) {
            log('getStructure  isTableKey(tag) && obj[tag] == null >>>>> ');
            var realObj = {};
            realObj[tag] = obj;
            obj = realObj;
            log('getStructure  realObj = \n' + JSON.stringify(realObj));
          }
          obj.tag = tag; //补全tag
        }

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

      enableML: function (enable) {
        App.isMLEnabled = enable
        App.testProcess = enable ? '机器学习:已开启,按量付费' : '机器学习:已关闭'
        App.saveCache(App.server, 'isMLEnabled', enable)
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
      test: function () {
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
        const allCount = list.length;
        doneCount = 0

        if (allCount <= 0) {
          alert('请先获取测试用例文档\n点击[查看共享]图标按钮')
          return
        }
        App.testProcess = '正在测试: ' + 0 + '/' + allCount

        for (var i = 0; i < allCount; i ++) {
          const item = list[i]
          const document = item == null ? null : item.Document
          if (document == null || document.name == null) {
            doneCount ++
            continue
          }
          if (document.url == '/login' || document.url == '/logout') { //login会导致登录用户改变为默认的但UI上还显示原来的，单独测试OWNER权限时能通过很困惑
            App.log('test  document.url == "/login" || document.url == "/logout" >> continue')
            doneCount ++
            continue
          }
          App.log('test  document = ' + JSON.stringify(document, null, '  '))

          // App.restore(item)
          // App.onChange(false)

          App.request(false, baseUrl + document.url, App.getRequest(document.request), function (url, res, err) {

            try {
              App.onResponse(url, res, err)
              App.log('test  App.request >> res.data = ' + JSON.stringify(res.data, null, '  '))
            } catch (e) {
              App.log('test  App.request >> } catch (e) {\n' + e.message)
            }
            const response = JSON.stringify(res.data || {})
            const releaseResponse = App.removeDebugInfo(JSON.parse(response))

            const it = item || {} //请求异步
            const d = it.Document || {} //请求异步
            const tr = it.TestRecord || {} //请求异步

            if (App.isMLEnabled != true) {
              const standardKey = App.isMLEnabled == true ? 'standard' : 'response';
              const standard = StringUtil.isEmpty(tr[standardKey], true) ? null : JSON.parse(tr[standardKey]);

              tr.compare = JSONResponse.compareResponse(standard, releaseResponse, '', App.isMLEnabled) || {}
              App.onTestResponse(allCount, it, d, tr, response, tr.compare || {});
            }
            else {
              App.request(false, App.server + '/get/testcompare/ml', {
                "documentId": d.id,
                "response": releaseResponse
              }, function (url, res, err) {
                var data = res.data || {}
                if (data.code != 200) {
                  App.onResponse(url, res, err)
                  return
                }
                App.onTestResponse(allCount, it, d, tr, response, data.compare || {});
              })
            }
          })
        }
      },

      onTestResponse: function(allCount, it, d, tr, response, cmp) {

        doneCount ++
        App.testProcess = doneCount >= allCount ? (App.isMLEnabled ? '机器学习:已开启,按量付费' : '机器学习:已关闭') : '正在测试: ' + doneCount + '/' + allCount

        App.log('doneCount = ' + doneCount + '; d.name = ' + d.name + '; tr.compareType = ' + tr.compareType)

        tr.compare = cmp;

        it.compareType = tr.compare.code;
        it.hintMessage = tr.compare.path + '  ' + tr.compare.msg;
        switch (it.compareType) {
          case JSONResponse.COMPARE_NO_STANDARD:
            it.compareColor = 'white'
            it.compareMessage = '确认正确后点击[这是对的]'
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
            it.compareColor = 'yellow'
            it.compareMessage = '缺少字段/整数变小数'
            break;
          case JSONResponse.COMPARE_TYPE_CHANGE:
            it.compareColor = 'red'
            it.compareMessage = 'code/值类型 改变'
            break;
          default:
            it.compareColor = 'white'
            it.compareMessage = '查看结果'
            break;
        }
        it.Document = d
        it.TestRecord = tr

        var tests = App.tests || {}
        tests[d.id] = response
        App.tests = tests
        // App.showTestCase(true)

      },

      /**移除调试字段
       * @param obj
       */
      removeDebugInfo: function (obj) {
        if (obj != null) {
          delete obj["sql:generate/cache/execute/maxExecute"]
          delete obj["depth:count/max"]
          delete obj["time:start/duration/end"]
        }
        return obj
      },

      /**
       * @param index
       * @param item
       */
      downloadTest: function (index, item) {
        item = item || {}
        var document = item.Document = item.Document || {}
        var testRecord = item.TestRecord = item.TestRecord || {}

        saveTextAs(
          '# APIJSON自动化回归测试-前\n主页: https://github.com/TommyLemon/APIJSON'
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
          var tests = App.tests || {}
          saveTextAs(
            '# APIJSON自动化回归测试-后\n主页: https://github.com/TommyLemon/APIJSON'
            + '\n\n接口名称: \n' + (document.version > 0 ? 'V' + document.version : 'V*') + ' ' + document.name
            + '\n返回结果: \n' + JSON.stringify(JSON.parse(tests[document.id] || '{}'), null, '    ')
            , '测试：' + document.name + '-后.txt'
          )


          if (StringUtil.isEmpty(testRecord.standard, true) == false) {
            setTimeout(function () {
              var tests = App.tests || {}
              saveTextAs(
                '# APIJSON自动化回归测试-标准\n主页: https://github.com/TommyLemon/APIJSON'
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
      handleTest: function (right, index, item) {
        item = item || {}
        var document = item.Document = item.Document || {}
        var testRecord = item.TestRecord = item.TestRecord || {}

        if (right) {
          var tests = App.tests || {}
          testRecord.response = tests[document.id]
        }

        if (right != true) {
          var isBefore = item.showType != 'before'
          item.showType = isBefore ? 'before' : 'after'
          Vue.set(App.remotes, index, item);

          App.view = 'code'
          App.jsoncon = isBefore ? (testRecord.response || '') : (App.tests[document.id] || '')
        }
        else {
          const isML = App.isMLEnabled

          var url
          var req
          if (isML != true) {
            var response = StringUtil.isEmpty(testRecord.response, true) ? null : JSON.parse(testRecord.response);
            var standard = StringUtil.isEmpty(testRecord.standard, true) ? null : JSON.parse(testRecord.standard);

            var code = response.code;
            delete response.code; //code必须一致，下面没用到，所以不用还原

            var stddObj = isML ? JSONResponse.updateStandard(standard || {}, response) : {};
            stddObj.code = code;
            var stdd = isML ? JSON.stringify(stddObj) : null;

            url = App.server + '/post'
            req = {
              TestRecord: {
                userId: App.User.id, //TODO 权限问题？ item.userId,
                documentId: document.id,
                compare: JSON.stringify(testRecord.compare || {}),
                response: testRecord.response
              },
              tag: 'TestRecord'
            }
          }
          else {
            url = App.server + '/post/testrecord/ml'
            req = {
              documentId: document.id
            }
          }

          App.request(true, url, req, function (url, res, err) {
            App.onResponse(url, res, err)

            var data = res.data || {}
            if (data.code != 200) {
              if (isML) {
                alert('机器学习更新标准 异常：\n' + data.msg)
              }
            }
            else {
              item.compareType = 0
              item.compareMessage = '查看结果'
              item.compareColor = 'white'
              item.hintMessage = '结果正确'
              testRecord.compare = {}
              // testRecord.standard = stdd
              App.showTestCase(true, false)
            }

          })

        }
      },

      //显示详细信息, :data-hint :data, :hint 都报错，只能这样
      setRequestHint(index, item) {
        var d = item == null ? null : item.Document;
        var r = d == null ? null : d.request;
        this.$refs.testCaseTexts[index].setAttribute('data-hint', r == null ? '' : JSON.stringify(this.getRequest(r), null, ' '));
      },
      //显示详细信息, :data-hint :data, :hint 都报错，只能这样
      setTestHint(index, item) {
        var h = item == null ? null : item.hintMessage;
        this.$refs.testResultButtons[index].setAttribute('data-hint', h || '');
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
          this.database = database
        }
        var schema = this.getCache('', 'schema')
        if (StringUtil.isEmpty(schema, true) == false) {
          this.schema = schema
        }
        var language = this.getCache('', 'language')
        if (StringUtil.isEmpty(language, true) == false) {
          this.language = language
        }
        var server = this.getCache('', 'server')
        if (StringUtil.isEmpty(server, true) == false) {
          this.server = server
        }

        this.locals = this.getCache('', 'locals') || []
      } catch (e) {
        console.log('created  try { ' +
          '\nvar schema = this.getCache(, schema)' +
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
        this.isMLEnabled = this.getCache(this.server, 'isMLEnabled')
        this.testProcess = this.isMLEnabled ? '机器学习:已开启,按量付费' : '机器学习:已关闭'
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
