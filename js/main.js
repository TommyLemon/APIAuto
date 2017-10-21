'use strict';

(function () {
  var ApiUrl = 'https://api.awesomes.cn'
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

  let initJson = {}

  // 主题 [key, String, Number, Boolean, Null, link-link, link-hover]
  let themes = [
    ['#92278f', '#3ab54a', '#25aae2', '#f3934e', '#f34e5c', '#717171'],
    ['rgb(19, 158, 170)', '#cf9f19', '#ec4040', '#7cc500', 'rgb(211, 118, 126)', 'rgb(15, 189, 170)'],
    ['#886', '#25aae2', '#e60fc2', '#f43041', 'rgb(180, 83, 244)', 'rgb(148, 164, 13)'],
    ['rgb(97, 97, 102)', '#cf4c74', '#20a0d5', '#cd1bc4', '#c1b8b9', 'rgb(25, 8, 174)']
  ]




  // APIJSON <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
  let inputted
  let handler
  let doc

  let isSingle = true

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
      history: {name: ''},
      isSaveShow: false,
      isExportTxtShow: false,
      exTxt: {
        name: 'JSONON'
      },
      themes: themes,
      checkedTheme: 0,
      shareKey: '', // 分享后返回的ID
      isSharing: false,
      isExpand: true
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

      // 清空
      clearAll: function () {
        App.jsoncon = ''
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

      // 保存当前的JSON
      save: function () {
        if (App.history.name.trim() === '') {
          Helper.alert('名称不能为空！', 'danger')
          return
        }
        var val = {
          name: App.history.name,
          data: App.jsoncon
        }
        var key = String(Date.now())
        localforage.setItem(key, val, function (err, value) {
          Helper.alert('保存成功！', 'success')
          App.isSaveShow = false
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
          App.jsoncon = item.data
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
        saveTextAs(App.jsoncon, App.exTxt.name + '.txt')
        App.isExportTxtShow = false
      },

      // 切换主题
      switchTheme: function (index) {
        this.checkedTheme = index
        localforage.setItem('#theme', index)
      },

      // 获取分享的链接
      shareUrl: function (key) {
        return `${window.location.origin}?key=${key}`
      },

      // 分享
      share: function () {
        let con = App.jsoncon
        if (con.trim() === '') {
          return
        }
        App.isSharing = true
        $.ajax({
          type: 'POST',
          url: `${ApiUrl}/json`,
          contentType: 'application/json; charset=utf-8',
          data: JSON.stringify({con: con, key: App.shareKey}),
          success: (data) => {
            App.isSharing = false
            App.shareKey = uuidv1()
            if (data.status) {
              Helper.alert('分享成功，已将链接复制到剪贴板，只能保存24小时', 'success')
            } else {
            }
          }
        })
      },

// APIJSON <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

      /**转至主页
       */
      toMainPage: function () {
        window.open('https://github.com/TommyLemon/APIJSON');
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
          console.log('onHandle  before = \n' + before);
          before = JSON.stringify(JSON.parse(before), null, "    "); //用format不能catch！

          //关键词let在IE和Safari上不兼容
          var code = "";
          try {
            code = this.getCode(before); //必须在before还是用 " 时使用，后面用会因为解析 ' 导致失败
          } catch(e) {
            code = "\n\n\n建议:\n使用其它浏览器，例如 谷歌Chrome、火狐FireFox 或者 微软Edge， 因为它们能自动生成请求代码.\n\n\n";
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
          vOutput.value = "OK，请点击 [发送请求] 按钮来测试。" + code + before;


          if (this.setDoc(doc) == false) {
            let this_ = this;
            this.getDoc(function (d) {
              this_.setDoc(d);
            });
          }

        } catch(e) {
          console.log(e);
          vSend.disabled = true;
          vOutput.value = "JSON格式错误！请检查并编辑请求！";
        }
      },


      /**输入内容改变
       */
      onChange: function (delay) {
        inputted = new String(vInput.value);
        clearTimeout(handler);

        let this_ = this;
        handler = setTimeout(function () {
          this_.onHandle(inputted);
        }, delay ? 2*1000 : 0);
      },

      /**单双引号切换
       */
      transfer: function () {
        isSingle = ! isSingle;
        this.onChange();
      },

      /**发送请求
       */
      send: function () {
        clearTimeout(handler);

        var real = new String(vInput.value);
        if (real.indexOf("'") >= 0) {
          real = real.replace(/'/g, "\"");
        }
        var json = JSON.parse(real);

        var url = vUrl.value;
        vOutput.value = "requesting... \nURL = " + url;
        App.view = 'output';

        var rq = request(url, json, true, function () {
          if (rq.readyState !== 4) {
            return;
          }

          if (rq.status === 200) {
            var response = rq.responseText;
            if (isSingle) {
              response = formatObject(JSON.parse(rq.responseText));
              response = JSON.stringify(response);
            }
            App.jsoncon = format(response);
            App.view = 'code';
          } else {
            vOutput.value = "Response(GET):\nurl = " + rq.url + "\nstatus = " + rq.status + "\nerror = " + rq.error;
          }
        });
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
        return '\n\n\n ==================== Java请求代码 ==================== \n' +
          parseJava(null, JSON.parse(rq)) +
          '\n\n ================== JavaScript请求代码 ================== \n';
      },


      /**显示文档
       * @param d
       **/
      setDoc: function (d) {
        if (d == null || d == '') {
          return false;
        }
        doc = d;
        vOutput.value += '\n\n\n ## 文档(可用Markdown在线工具查看) \n\n' + d;
        return true;
      },


      /**
       * 获取文档
       */
      getDoc: function (callback) {
        let this_ = this;
        let docRq = request(URL_GET, {
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
              '@order': 'method-'
            }
          }
        }, true, function () {
          if (docRq.readyState !== 4) {
            return;
          }
          if (docRq.status !== 200) {
            console.log('getDoc  docRq.status !== 200 >> return;');
            return;
          }

//      console.log('getDoc  docRq.responseText = \n' + docRq.responseText);
          var docRp = JSON.parse(docRq.responseText);

          //转为文档格式
          var doc = '';
          var item;

          //[] <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
          var list = docRp == null ? null : docRp['[]'];
          if (list != null) {
            console.log('getDoc  [] = \n' + format(JSON.stringify(list)));

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
              console.log('getDoc [] for i=' + i + ': table = \n' + format(JSON.stringify(table)));


              doc += '### ' + (i + 1) + '. ' + table.TABLE_NAME + '\n #### 说明: \n' + this_.toMD(table.TABLE_COMMENT);

              //Column[]
              doc += '\n\n #### 字段: \n 名称  |  类型  |  可为null  |  说明' +
                ' \n --------  |  ------------  |  ------------  |  ------------ ';

              columnList = item['Column[]'];
              if (columnList == null) {
                continue;
              }
              console.log('getDoc [] for ' + i + ': columnList = \n' + format(JSON.stringify(columnList)));


              for (var j = 0; j < columnList.length; j++) {
                column = columnList[j];
                if (column == null) {
                  continue;
                }

                console.log('getDoc [] for j=' + j + ': column = \n' + format(JSON.stringify(column)));

                doc += '\n' + column.COLUMN_NAME + '  |  ' + column.COLUMN_TYPE
                  + '  |  ' + column.IS_NULLABLE + '  |  ' + this_.toMD(column.COLUMN_COMMENT);

              }

              doc += '\n\n\n';

            }

          }

          //[] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>


          //Request[] <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
          list = docRp == null ? null : docRp['Request[]'];
          if (list != null) {
            console.log('getDoc  Request[] = \n' + format(JSON.stringify(list)));

            doc += '\n\n\n\n\n\n\n\n\n ### 非开放请求的格式(GET,HEAD方法不受限，可传任意结构、内容) \n 方法  |  tag  |  结构及内容' +
              ' \n --------  |  ------------  |  ------------ ';

            for (var i = 0; i < list.length; i++) {
              item = list[i];
              if (item == null) {
                continue;
              }
              console.log('getDoc Request[] for i=' + i + ': item = \n' + format(JSON.stringify(item)));


              doc += '\n' + item.method + '  |  ' + item.tag + '  |  ' + JSON.stringify(this_.getStructure(item.structure));
            }

            doc += '\n\n\n\n\n\n\n';
          }


          //Request[] >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>



          callback(doc);

//      console.log('getDoc  callback(doc); = \n' + doc);
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
       * @return {*}
       */
      getStructure: function (obj) {
        if (obj == null) {
          return null;
        }

        console.log('getStructure  obj = \n' + format(JSON.stringify(obj)));

        if (obj instanceof Array) {
          for (let i = 0; i < obj.length; i++) {
            obj[i] = this.getStructure(obj[i]);
          }
        }
        else if (obj instanceof Object) {
          let v;
          let nk;
          for (let k in obj) {
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

        console.log('getStructure  return obj; = \n' + format(JSON.stringify(obj)));

        return obj;
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
        let th = this.themes[this.checkedTheme]
        let result = {}
        let index = 0;
        ['key', 'String', 'Number', 'Boolean', 'Null', 'link-link'].forEach(key => {
          result[key] = th[index]
          index++
        })
        return result
      }
    },
    created () {
      this.listHistory()
      let clipboard = new Clipboard('.copy-btn')
      let sps = window.location.href.split('?key=')
      let jsonID = sps[sps.length - 1]
      this.shareKey = uuidv1()
      if (sps.length > 1 && jsonID.length > 5) {
        $.get(`${ApiUrl}/json?key=${jsonID}`, function (data) {
          if (data.status) {
            App.jsoncon = data.item.con
          }
        })
      }

      this.transfer();

    }
  })
})()
