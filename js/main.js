
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

  var isSingle = true

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
      historys: [],
      history: {name: '请求0'},
      remotes: [],
      isDelayShow: false,
      isSaveShow: false,
      isExportShow: false,
      isRemoteShow: false,
      isExportRemote: false,
      exTxt: {
        name: 'APIJSON测试'
      },
      themes: themes,
      checkedTheme: 0,
      isExpand: true,
      User: {
        id: 0,
        name: '',
        head: ''
      }
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


      //设置基地址
      setBaseUrl: function () {
        // 重新拉取文档
        if (baseUrl != this.getBaseUrl()) {
          baseUrl = this.getBaseUrl();
          doc = null
          this.User = this.getCache(baseUrl, 'User') || {}
          this.remotes = []
        }
      },
      //获取基地址
      getBaseUrl: function () {
        var url = new String(vUrl.value).trim()
        var index = this.getBaseUrlLength(url)
        url = index <= 0 ? url : url.substring(0, index)
        return url == '' ? URL_BASE : url
      },
      //获取基地址长度，优先以空格分割baseUrl和method，其次用 /
      getBaseUrlLength: function (url_) {
        var url = url_ == null ? '' : new String(url_)
        var index = url.indexOf(' ')
        if (index <= 0) {
          while (url.endsWith('/')) {
            url = url.substring(0, url.length - 1)
          }
          index = url.lastIndexOf('/')
        }
        return index
      },
      //获取操作方法
      getMethod: function () {
        var url = new String(vUrl.value).trim()
        var index = this.getBaseUrlLength(url)
        url = index < 0 ? '' : url.substring(index + 1)
        return url.startsWith('/') ? url.substring(1) : url
      },

      // 显示保存弹窗
      showSave: function (show) {
        if (show) {
          if (App.isRemoteShow) {
            alert('请先输入请求内容！')
            return
          }

          App.history.name = '请求 ' + App.getMethod() + ' ' + App.formatTime() //不自定义名称的都是临时的，不需要时间太详细
        }
        App.isSaveShow = show
      },

      // 显示导出弹窗
      showExport: function (show, isRemote) {
        if (show) {
          if (isRemote) { //共享测试用例
            if (App.isRemoteShow) {
              alert('请先输入请求内容！')
              return
            }
            if (App.view != 'code') {
              alert('请先测试请求，确保是正确可用的！')
              return
            }
            App.exTxt.name = App.getMethod() + '请求'
          }
          else { //下载到本地
            if (App.isRemoteShow) { //文档
              App.exTxt.name = 'APIJSON自动化文档 ' + App.formatDateTime()
            }
            else if (App.view == 'markdown' || App.view == 'output') {
              App.exTxt.name = 'APIJSON自动生成model ' + App.formatDateTime()
            }
            else {
              App.exTxt.name = 'APIJSON测试 ' + App.getMethod() + ' ' + App.formatDateTime()
            }
          }
        }
        App.isExportShow = show
        App.isExportRemote = isRemote
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

      // 删除已保存的
      remove: function (item, index, isRemote) {
        if (isRemote == null || isRemote == false) { //null != false
          localforage.removeItem(item.key, function () {
            App.historys.splice(index, 1)
          })
        } else {
          App.isRemoteShow = false

          baseUrl = App.getBaseUrl()
          vUrl.value = baseUrl + '/delete'
          vInput.value = JSON.stringify(
            {
              'Document': {
                'id': item.id
              },
              'tag': 'Document'
            },
            null, '    ')
          App.onChange(false)
          App.send(function (url, res, err) {
            App.onResponse(url, res, err)

            var rpObj = res.data

            if (rpObj != null && rpObj.Document != null && rpObj.Document.code == 200) {
              App.remotes = []
              App.showRemote(true)
            }
          })
        }
      },

      // 根据历史恢复数据
      restore: function (item) {
        localforage.getItem(item.key, function (err, value) {
          baseUrl = App.getBaseUrl()
          var branch = new String(item.url || '/get')
          if (branch.startsWith('/') == false) {
            branch = '/' + branch
          }
          if (branch.lastIndexOf('/') > 0) { //不只一个 / ，需要用空格分割baseUrl和branchUrl
            branch = ' ' + branch
          }
          vUrl.value = baseUrl + branch
          App.showRemote(false)
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

          if (App.isRemoteShow) { //文档
            saveTextAs('# ' + App.exTxt.name + '\n主页: https://github.com/TommyLemon/APIJSON'
              + '\n\nBASE_URL: ' + this.getBaseUrl()
              + '\n\n\n## 测试用例(Markdown格式，可用工具预览) \n\n' + App.getDoc4TestCase()
              + '\n\n\n\n\n\n\n\n## 文档(Markdown格式，可用工具预览) \n\n' + doc
              , App.exTxt.name + '.txt')
          }
          else if (App.view == 'markdown' || App.view == 'output') { //model
            saveTextAs('# ' + App.exTxt.name + '\n主页: https://github.com/TommyLemon/APIJSON'
              + '\n\n\n## 使用方法\n1.新建java文件，例如A.java <br/> \n2.将以下与A同名的class代码复制粘贴到A文件内 <br/> \n3.import需要引入的类，可使用快捷键Ctrl+Shift+O <br/> '
              + '\n\n## Java model类 \n\n' + CodeUtil.parseJavaBean(docObj)
              , App.exTxt.name + '.txt')
          }
          else {
            saveTextAs('# ' + App.exTxt.name + '\n主页: https://github.com/TommyLemon/APIJSON'
              + '\n\nURL: ' + vUrl.value
              + '\n\nRequest:\n' + vInput.value
              + '\n\n\nResponse:\n' + App.jsoncon
              , App.exTxt.name + '.txt')
          }
        }
        else { //上传到远程服务器
          var id = App.User == null ? null : App.User.id
          if (id == null || id <= 0) {
            alert('请先登录！')
            return
          }

          App.isRemoteShow = false

          vInput.value = JSON.stringify(
            {
              'Document': {
                'userId': App.User.id,
                'name': App.exTxt.name,
                'url': '/' + App.getMethod(),
                'request': App.toDoubleJSON(inputted)
              },
              'tag': 'Document'
            },
            null, '    ')
          baseUrl = App.getBaseUrl()
          vUrl.value = baseUrl + '/post'

          App.onChange(false)
          App.send(function (url, res, err) {
            App.onResponse(url, res, err)

            var rpObj = res.data

            if (rpObj != null && rpObj.Document != null && rpObj.Document.code == 200) {
              App.remotes = []
              App.showRemote(true)
            }
          })
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




      //显示远程的测试用例文档
      showRemote: function (show) {
        App.isRemoteShow = show
        App.view = 'markdown'

        if (show && App.remotes.length <= 0) {
          App.isRemoteShow = false

          vUrl.value = baseUrl + '/get'
          vInput.value = JSON.stringify(
            {
              'Document[]': {
                'Document': {
                  '@role': 'login',
                  '@order': 'version-,date-'
                }
              }
            },
            null, '    ')
          App.onChange(false)
          App.send(function (url, res, err) {
            App.onResponse(url, res, err)

            var rpObj = res.data

            if (rpObj != null && rpObj.code === 200) {
              App.isRemoteShow = true
              App.view = 'markdown' //貌似未生效，或者被后面的操作覆盖
              App.remotes = rpObj['Document[]']

              //App.onChange(false)
            }
          })
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
          console.log('login  App.send >> try { cache = JSON.parse(cache) } catch(e) {\n' + e.message)
        }
        cache = cache || {}
        return key == null ? cache : cache[key]
      },


      /**登录
       */
      login: function () {
        vUrl.value = baseUrl + '/login'
        vInput.value = JSON.stringify(
          {
            type: 0, // 登录方式，非必须 0-密码 1-验证码
            phone: '13000082001',
            password: '123456',
            version: 1 // 全局默认版本号，非必须
          },
          null, '    ')
        App.showRemote(false)
        App.onChange(false)
        App.send(function (url, res, err) {
          App.onResponse(url, res, err)

          var rpObj = res.data

          if (rpObj != null && rpObj.code === 200) {
            var user = rpObj.User || {}

            if (user.id > 0) {
              App.User = user
            }


            //保存User到缓存
            App.saveCache(App.getBaseUrl(), 'User', user)
          }
        })
      },

      /**退出
       */
      logout: function () {
        this.saveCache(App.getBaseUrl(), 'User', {})

        vUrl.value = baseUrl + '/logout'
        vInput.value = '{}'
        App.showRemote(false)
        App.onChange(false)
        App.send(function (url, res, err) {
          App.User = {}
          App.remotes = []
          App.onResponse(url, res, err)
        })
      },


      /**获取当前用户
       */
      getCurrentUser: function () {
        vUrl.value = this.getBaseUrl() + '/gets'
        vInput.value = JSON.stringify(
          {
            Privacy: {
              id: App.User.id
            },
            tag: 'Privacy'
          },
          null, '    ')
        App.showRemote(false)
        App.onChange(false)
        App.send()
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
        vOutput.value = 'resolving...';

        //格式化输入代码
        try {
          before = App.toDoubleJSON(before);
          log('onHandle  before = \n' + before);
          before = JSON.stringify(jsonlint.parse(before), null, "    "); //用format不能catch！

          //关键词let在IE和Safari上不兼容
          var code = '';
          try {
            code = this.getCode(before); //必须在before还是用 " 时使用，后面用会因为解析 ' 导致失败
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
          vOutput.value = 'OK，请点击 [发送请求] 按钮来测试。' + code;


          // 设置文档
          if (App.setDoc(doc) == false) {
            this.getDoc(function (d) {
              App.setDoc(d);
            });
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

        this.isRemoteShow = false

        // 删除注释 <<<<<<<<<<<<<<<<<<<<<

        var input = new String(vInput.value);

        var reg = /("([^\\\"]*(\\.)?)*")|('([^\\\']*(\\.)?)*')|(\/{2,}.*?(\r|\n))|(\/\*(\n|.)*?\*\/)/g // 正则表达式
        try {
          input = input.replace(reg, function(word) { // 去除注释后的文本
            return /^\/{2,}/.test(word) || /^\/\*/.test(word) ? "" : word;
          })

          if (vInput.value != input) {
            vInput.value = input
          }
        } catch (e) {
          log('transfer  delete comment in json >> catch \n' + e.message)
        }

        // 删除注释 >>>>>>>>>>>>>>>>>>>>>


        this.onChange();
      },

      /**发送请求
       */
      send: function (callback) {
        if (App.isRemoteShow) {
          alert('请先输入请求内容！')
          return
        }
        this.onHandle(vInput.value)

        clearTimeout(handler);

        var real = new String(vInput.value);
        if (real.indexOf("'") >= 0) {
          real = real.replace(/'/g, "\"");
        }
        var req = JSON.parse(real);

        var url = new String(vUrl.value)
        url = url.replace(/ /g, '')
        vOutput.value = "requesting... \nURL = " + url;
        App.view = 'output';


        this.setBaseUrl()

        App.request(url, req, callback)
      },

      //
      request: function (url, req, callback) {
        // axios.defaults.withcredentials = true
        axios({
          method: 'post',
          url: url,
          data: req,
          withCredentials: true
        })
          .then(function (res) {
            log('send >> success:\n' + JSON.stringify(res, null, '    '))

            //未登录，清空缓存
            if (res != null && res.data != null && res.data.code == 407) {
              App.User = {}
              App.remotes = []
              App.saveCache(baseUrl, 'User', {}) //应该用lastBaseUrl,baseUrl应随watch输入变化重新获取
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
              callback(url, null, err)
              return
            }
            App.onResponse(url, null, err)
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
          var json = res.data
          if (isSingle) {
            json = JSONResponse.formatObject(json);
          }
          App.jsoncon = JSON.stringify(json, null, '    ');
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
          this.send();
        }
      },


      /**转为请求代码
       * @param rq
       */
      getCode: function (rq) {
        return '\n\n\n### 请求代码 \n\n#### <= Android-Java: 同名变量需要重命名\n ```java \n'
          + CodeUtil.parseJava(null, JSON.parse(rq))
          + '\n ``` \n注：用了APIJSON的JSONRequest类。也可使用其它方式，只要JSON有序就行。'
          + '\n\n#### <= iOS-Swift: 所有对象标识{}改为数组标识[]\n ```swift \n'
          + CodeUtil.parseSwift(null, JSON.parse(rq))
          + '\n ``` \n注：空对象请用 [:] 表示。 \n\n#### <= Web-JavaScript: 和左边的请求JSON一样 \n';
      },


      /**显示文档
       * @param d
       **/
      setDoc: function (d) {
        if (d == null || d == '') {
          return false;
        }
        doc = d;
        vOutput.value += ('\n\n\n## 文档 \n\n' + d);

        App.view = 'markdown';
        markdownToHTML(vOutput.value);
        return true;
      },


      /**
       * 获取文档
       */
      getDoc: function (callback) {
        App.request(this.getBaseUrl() + '/get', {
          '[]': {
            'Table': {
              'TABLE_SCHEMA': 'sys',
              'TABLE_TYPE': 'BASE TABLE',
              'TABLE_NAME!$': ['\\_%', 'sys\\_%', 'system\\_%'],
              '@order': 'TABLE_NAME+',
              '@column': 'TABLE_NAME,TABLE_COMMENT'
            },
            'Column[]': {
              'Column': {
                'TABLE_NAME@': '[]/Table/TABLE_NAME',
                '@column': 'COLUMN_NAME,COLUMN_TYPE,IS_NULLABLE,COLUMN_COMMENT'
              }
            }
          },
          'Request[]': {
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


              doc += '### ' + (i + 1) + '. ' + table.TABLE_NAME + '\n#### 说明: \n' + App.toMD(table.TABLE_COMMENT);

              //Column[]
              doc += '\n\n#### 字段: \n 名称  |  类型(长度)  |  可为null  |  说明' +
                ' \n --------  |  ------------  |  ------------  |  ------------ ';

              columnList = item['Column[]'];
              if (columnList == null) {
                continue;
              }
              log('getDoc [] for ' + i + ': columnList = \n' + format(JSON.stringify(columnList)));

              var type;
              for (var j = 0; j < columnList.length; j++) {
                column = columnList[j];
                if (column == null) {
                  continue;
                }
                type = name == 'id' ? 'Long' : CodeUtil.getJavaType(column.COLUMN_TYPE, true);

                log('getDoc [] for j=' + j + ': column = \n' + format(JSON.stringify(column)));

                doc += '\n' + column.COLUMN_NAME + '  |  ' + type
                  + '  |  ' + (column.IS_NULLABLE == 'NO' ? '否' : '是') + '  |  ' + App.toMD(column.COLUMN_COMMENT);

              }

              doc += '\n\n\n';

            }

          }

          //[] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>


          //Request[] <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
          list = docObj == null ? null : docObj['Request[]'];
          if (list != null) {
            log('getDoc  Request[] = \n' + format(JSON.stringify(list)));

            doc += '\n\n\n\n\n\n\n\n\n### 非开放请求的格式(GET,HEAD方法不受限，可传任意结构、数据)'
              + ' \n 版本  |  方法  |  tag  |  结构及数据'
              + ' \n --------  |  ------------  |  ------------  |  ------------ ';

            for (var i = 0; i < list.length; i++) {
              item = list[i];
              if (item == null) {
                continue;
              }
              log('getDoc Request[] for i=' + i + ': item = \n' + format(JSON.stringify(item)));


              doc += '\n' + item.version + '  |  ' + item.method + '  |  ' + item.tag
                + '  |  ' + JSON.stringify(App.getStructure(item.structure, item.tag));
            }

            doc += '\n注: 可在最外层传版本version来指定使用的版本，不传或 version <= 0 则使用最新版。\n\n\n\n\n\n\n';
          }


          //Request[] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>



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

        //补全省略的Table
        if (this.isTableKey(tag) && obj[tag] == null) {
          log('getStructure  isTableKey(tag) && obj[tag] == null >>>>> ');
          var realObj = {};
          realObj[tag] = obj;
          obj = realObj;
          log('getStructure  realObj = \n' + JSON.stringify(realObj));
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
        console.log('Main.  ' + msg)
      },

      getDoc4TestCase: function () {
        var list = App.remotes || []
        var doc = ''
        var item
        for (var i = 0; i < list.length; i ++) {
          item = list[i]
          if (item == null || item.name == null) {
            continue
          }
          doc += '\n\n#### ' + (item.version > 0 ? 'V' + item.version : 'V*') + ' ' + item.name  + '    ' + item.url
          doc += '\n```json\n' + JSON.stringify(JSON.parse(item.request), null, '    ') + '\n```\n'
        }
        return doc
      }
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
      this.listHistory()
      this.transfer()
    }
  })
})()
