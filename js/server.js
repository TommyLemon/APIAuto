const Koa = require('koa');
const Vue = require('vue');
const {getRequestFromURL, App} = require('./main');
// const { createBundleRenderer } = require('vue-server-renderer')

const JSONResponse = require('../apijson/JSONResponse');

var isLoading = false;
var startTime = 0;
var endTime = 0;
var message = '';
var error = null;
var timeMsg = '';
var progressMsg = '';

var progress = 0;
var accountProgress = 0;
var testCaseProgress = 0;
var deepProgress = 0;
var randomProgress = 0;

const app = new Koa();
app.use(async ctx => {
  console.log(ctx)
  if (ctx.path == '/start' || (isLoading != true && ctx.path == '/')) {
    if (isLoading && ctx.path == '/start') {
      ctx.body = 'Already started auto testing in node, please wait for minutes...';
      ctx.status = 200
      return
    }

    startTime = (new Date()).getTime();
    App.autoTest(function (msg, err) {
      message = msg;
      error = err;
      if (err != null) {
        isLoading = false;
      }

      var curTime = (new Date()).getTime();
      if (endTime <= 0 || isLoading) {
        endTime = curTime;
      }

      timeMsg = '\n\nStart Time: ' + startTime
        + (isLoading ? ('; \nCurrent Time: ' + curTime) : ('; \nEnd Time: ' + endTime))
        + '; \nTime Spent: ' + (endTime - startTime);

      var accountDoneCount = App.currentAccountIndex + 1;
      var accountAllCount = App.accounts.length;

      accountProgress = (accountDoneCount >= accountAllCount ? 1 : accountDoneCount/accountAllCount).toFixed(2);
      testCaseProgress = (App.doneCount >= App.allCount ? 1 : App.doneCount/App.allCount).toFixed(2);
      deepProgress = (App.deepDoneCount >= App.deepAllCount ? 1 : App.deepDoneCount/App.deepAllCount).toFixed(2);
      randomProgress = (App.randomDoneCount >= App.randomAllCount ? 1 : App.randomDoneCount/App.randomAllCount).toFixed(2);
      progress = accountProgress*testCaseProgress*deepProgress*randomProgress;

      if (progress >= 1) {
        isLoading = false;
      }

      progressMsg = '\n\nProgress: ' + (100*progress) + '%'
        + '\nTest Account: ' + accountDoneCount + ' / ' + accountAllCount + ' = ' + (100*accountProgress) + '%'
        + '\nTest Case: ' + App.doneCount + ' / ' + App.allCount + ' = ' + (100*testCaseProgress) + '%'
        + '\nDeep Test Case: ' + App.deepDoneCount + ' / ' + App.deepAllCount + ' = ' + (100*deepProgress) + '%'
        + '\nRandom & Order: ' + App.randomDoneCount + ' / ' + App.randomAllCount + ' = ' + (100*randomProgress) + '%';

      console.log('autoTest callback(' + msg + ')' + timeMsg + progressMsg)
    })
    isLoading = true;

    ctx.status = ctx.response.status = 302;
    ctx.body = 'Auto testing in node...';

    // setTimeout(function () {  // 延迟无效
    ctx.redirect('/status');
    // }, 1000)
  }
  else if (ctx.path == '/status' || (isLoading && ctx.path == '/')) {
    var curTime = (new Date()).getTime();
    timeMsg = '\n\nStart Time: ' + startTime
      + (isLoading ? ('; \nCurrent Time: ' + curTime) : ('; \nEnd Time: ' + endTime))
      + '; \nTime Spent: ' + (endTime - startTime);

    if (progress < 1) {
      // ctx.response.header['refresh'] = "1";
      // ctx.redirect('/status');
    }

    ctx.status = ctx.response.status = 200;  // progress >= 1 ? 200 : 302;
    ctx.body = (message || (progress < 1 ? 'Auto testing in node...' : 'Done auto testing in node.')) + timeMsg + progressMsg;
  }
});

app.listen(3000);
