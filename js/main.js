
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
      isSaveShow: false,
      isExportShow: false,
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
        $('.icon-square-min').show()
        $('.icon-square-plus').hide()
        $('.expand-view').show()
        $('.fold-view').hide()

        App.isExpand = true;
      },

      // 全部折叠
      collapseAll: function () {
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
        }
      },
      //获取基地址
      getBaseUrl: function () {
        var url = new String(vUrl.value)
        while (url.endsWith('/')) {
          url = url.substring(0, url.length - 1)
        }
        var index = url.lastIndexOf('/')
        url = index < 0 ? url : url.substring(0, index)
        return url == '' ? URL_BASE : url
      },
      //获取操作方法
      getMethod: function () {
        var url = vUrl.value
        var index = url == null ? -1 : url.lastIndexOf('/')
        return index < 0 ? '' : url.substring(index + 1)
      },

      // 显示保存弹窗
      showSave: function (show) {
        if (show) {
          App.history.name = '请求 ' + App.getMethod() + ' ' + App.formatTime() //不自定义名称的都是临时的，不需要时间太详细
        }
        App.isSaveShow = show
      },

      // 显示导出弹窗
      showExport: function (show) {
        if (show) {
          if (App.view == 'markdown' || App.view == 'output') {
            App.exTxt.name = 'APIJSON自动化文档 ' + App.formatDateTime()
          } else {
            App.exTxt.name = 'APIJSON测试 ' + App.getMethod() + ' ' + App.formatDateTime()
          }
        }
        App.isExportShow = show
      },

      // 保存当前的JSON
      save: function () {
        if (App.history.name.trim() === '') {
          Helper.alert('名称不能为空！', 'danger')
          return
        }
        var val = {
          name: App.history.name,
          url: vUrl.value,
          data: inputted
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
      remove: function (item, index) {
        localforage.removeItem(item.key, function () {
          App.historys.splice(index, 1)
        })
      },

      // 根据历史恢复数据
      restore: function (item) {
        localforage.getItem(item.key, function (err, value) {
          vUrl.value = item.url || URL_GET
          vInput.value = item.data
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
        if (App.view == 'markdown' || App.view == 'output') {
          saveTextAs(App.exTxt.name + '(https://github.com/TommyLemon/APIJSON)'
            + '\n\nBASE_URL: ' + this.getBaseUrl()
            + '\n\n\n## 文档(Markdown格式，可用工具预览) \n\n' + doc
            , App.exTxt.name + '.txt')
        } else {
          saveTextAs(App.exTxt.name + '(https://github.com/TommyLemon/APIJSON)'
            + '\n\nURL: ' + vUrl.value
            + '\n\nRequest:\n' + vInput.value
            + '\n\n\nResponse:\n' + App.jsoncon
            , App.exTxt.name + '.txt')
        }
        App.showExport(false)
      },

      // 切换主题
      switchTheme: function (index) {
        this.checkedTheme = index
        localforage.setItem('#theme', index)
      },

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


      // APIJSON <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<


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
        App.onChange(false)
        App.send(function (url, res, err) {
          App.User = {}
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
        App.onChange(false)
        App.send()
      },

      /**计时回调
       */
      onHandle: function (before) {
        if (inputted != before) {
          clearTimeout(handler);
          return;
        }

        App.view = 'output';
        vOutput.value = 'resolving...';

        //格式化输入代码
        try {
          if (before.indexOf("'") >= 0) {
            before = before.replace(/'/g, '"');
          }
          log('onHandle  before = \n' + before);
          before = JSON.stringify(jsonlint.parse(before), null, "    "); //用format不能catch！

          //关键词let在IE和Safari上不兼容
          var code = "";
          var err = null;
          try {
            code = this.getCode(before); //必须在before还是用 " 时使用，后面用会因为解析 ' 导致失败
          } catch(e) {
            err = e;
            code = "\n\n\n建议:\n使用其它浏览器，例如 谷歌Chrome、火狐FireFox 或者 微软Edge， 因为这样能自动生成请求代码.\n\n\n";
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
          vOutput.value = 'OK，请点击 [发送请求] 按钮来测试。' + code + (err != null ? '' : before + '\n ```');


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

        handler = setTimeout(function () {
          App.onHandle(inputted);
        }, delay ? 2*1000 : 0);
      },

      /**单双引号切换
       */
      transfer: function () {
        isSingle = ! isSingle;

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
        clearTimeout(handler);

        var real = new String(vInput.value);
        if (real.indexOf("'") >= 0) {
          real = real.replace(/'/g, "\"");
        }
        var req = JSON.parse(real);

        var url = vUrl.value;
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
            json = formatObject(json);
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
        return '\n\n\n ### 请求代码 \n\n #### Java:\n ```java \n' +
          parseJava(null, JSON.parse(rq)) +
          '\n ``` \n\n #### JavaScript:\n ```javascript \n';
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
              'TABLE_NAME!$': '\\_%',
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
          var docRp = res.data;

          //转为文档格式
          var doc = '';
          var item;

          //[] <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
          var list = docRp == null ? null : docRp['[]'];
          if (list != null) {
            log('getDoc  [] = \n' + format(JSON.stringify(list)));

            var table;
            var columnList;
            var column;
            for (var i = 0; i < list.length; i++) {
              item = list[i];

              //Table
              table = item.Table;
              if (table == null) {
                table = {};
              }
              log('getDoc [] for i=' + i + ': table = \n' + format(JSON.stringify(table)));


              doc += '### ' + (i + 1) + '. ' + table.TABLE_NAME + '\n #### 说明: \n' + App.toMD(table.TABLE_COMMENT);

              //Column[]
              doc += '\n\n #### 字段: \n 名称  |  类型  |  可为null  |  说明' +
                ' \n --------  |  ------------  |  ------------  |  ------------ ';

              columnList = item['Column[]'];
              if (columnList == null) {
                continue;
              }
              log('getDoc [] for ' + i + ': columnList = \n' + format(JSON.stringify(columnList)));


              for (var j = 0; j < columnList.length; j++) {
                column = columnList[j];
                if (column == null) {
                  continue;
                }

                log('getDoc [] for j=' + j + ': column = \n' + format(JSON.stringify(column)));

                doc += '\n' + column.COLUMN_NAME + '  |  ' + column.COLUMN_TYPE
                  + '  |  ' + column.IS_NULLABLE + '  |  ' + App.toMD(column.COLUMN_COMMENT);

              }

              doc += '\n\n\n';

            }

          }

          //[] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>


          //Request[] <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
          list = docRp == null ? null : docRp['Request[]'];
          if (list != null) {
            log('getDoc  Request[] = \n' + format(JSON.stringify(list)));

            doc += '\n\n\n\n\n\n\n\n\n ### 非开放请求的格式(GET,HEAD方法不受限，可传任意结构、内容)'
              + ' \n 版本  |  方法  |  tag  |  结构及内容'
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
