const Koa = require('koa');
//const cors = require('koa2-cors');
const bodyParser = require('koa-bodyparser');
// const Vue = require('vue');
const {getRequestFromURL, App} = require('./main');
// const { createBundleRenderer } = require('vue-server-renderer')

const JSONResponse = require('../apijson/JSONResponse');
const StringUtil = require('../apijson/StringUtil');

var isCrossEnabled = true; // false;
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

function update() {
  if (isLoading != true) {
    return;
  }

  if (error != null) {
    isLoading = false;
  }

  var curTime = isLoading ? (new Date()).getTime() : null;
  if (endTime <= 0 || isLoading) {
    endTime = curTime;
  }
  var duration = endTime - startTime;
  var dd = new Date(duration + 60000*(new Date().getTimezoneOffset()));

  timeMsg = '\n\nStart Time: ' + startTime + ' = ' + new Date(startTime).toLocaleString()
    + (isLoading ? '; \nCurrent' : '\nEnd') + ' Time: ' + endTime + ' = ' + new Date(endTime).toLocaleString()
    + '; \nTime Spent: ' + duration + ' = ' + dd.getHours() + ":" + dd.getMinutes() + ":" + dd.getSeconds() + "." + dd.getMilliseconds();

  var accountDoneCount = App.currentAccountIndex + 1;
  var accountAllCount = App.accounts.length;

  accountProgress = isCrossEnabled != true || accountAllCount <= 0 || accountDoneCount >= accountAllCount ? 1 : (accountDoneCount/accountAllCount).toFixed(2);
  testCaseProgress = App.doneCount >= App.allCount ? 1 : (App.doneCount/App.allCount).toFixed(2);
  deepProgress = App.deepDoneCount >= App.deepAllCount ? 1 : (App.deepDoneCount/App.deepAllCount).toFixed(2);
  randomProgress = App.randomDoneCount >= App.randomAllCount ? 1 : (App.randomDoneCount/App.randomAllCount).toFixed(2);
  // progress = accountProgress*testCaseProgress*deepProgress*randomProgress;
  progress = accountProgress >= 1 ? 1 : (accountProgress + (accountAllCount <= 0 ? 1 : 1/accountAllCount*(testCaseProgress
    + (App.allCount <= 0 ? 1 : 1/App.allCount*(deepProgress + (App.deepAllCount <= 0 ? 1 : 1/App.deepAllCount*randomProgress))))));

  if (progress >= 1) {
    isLoading = false;
  }

  progressMsg = '\n\nProgress: ' + (100*progress) + '%'
    + '\nTest Account: ' + accountDoneCount + ' / ' + accountAllCount + ' = ' + (100*accountProgress) + '%'
    + '\nTest Case: ' + App.doneCount + ' / ' + App.allCount + ' = ' + (100*testCaseProgress) + '%'
    + '\nDeep Test Case: ' + App.deepDoneCount + ' / ' + App.deepAllCount + ' = ' + (100*deepProgress) + '%'
    + '\nRandom & Order: ' + App.randomDoneCount + ' / ' + App.randomAllCount + ' = ' + (100*randomProgress) + '%';
};

const PORT = 3000;

var done = false;
const app = new Koa();
// app.use(bodyParser());
app.use(async ctx => {
  console.log(ctx);
  var origin = ctx.get('Origin') || ctx.get('origin');
  console.log('origin = ' + origin);
  ctx.set('Access-Control-Max-Age', "1000000"); // "-1");
  ctx.set('Access-Control-Allow-Origin', origin);
  ctx.set('Access-Control-Allow-Headers', "*");
  ctx.set('Access-Control-Allow-Credentials', 'true');
  ctx.set('Access-Control-Allow-Methods', 'GET,HEAD,POST,PUT,DELETE,OPTIONS,TRACE');
//    ctx.set('Access-Control-Expose-Headers', "*");

  if (ctx.method == null || ctx.method.toUpperCase() == 'OPTIONS') {
     ctx.status = 200;
     return;
  }

  if (ctx.path == '/test/start' || (isLoading != true && ctx.path == '/test')) {
    if (isLoading && ctx.path == '/test/start') {
      ctx.status = 200;
      ctx.body = ctx.response.body = 'Already started auto testing in node, please wait for minutes...';
      return;
    }

    App.isCrossEnabled = isCrossEnabled; // isCrossEnabled = App.isCrossEnabled;
    if (isCrossEnabled) {
      App.currentAccountIndex = -1;
    }

    isLoading = true;
    startTime = (new Date()).getTime();
    endTime = startTime;
    message = '';
    error = null;
    timeMsg = '';
    progressMsg = '';

    progress = 0;
    accountProgress = 0;
    testCaseProgress = 0;
    deepProgress = 0;
    randomProgress = 0;

    update();

    App.key = ctx.query.key;
    if (StringUtil.isNotEmpty(App.key, true)) {
      App.testCaseCount = App.data.testCaseCount = 1000;
      App.randomCount = App.data.randomCount = 200;
      App.randomSubCount = App.data.randomSubCount = 500;
    }

    App.autoTest(function (msg, err) {
      message = msg;
      error = err;
      update();
      console.log('autoTest callback(' + msg + ')' + timeMsg + progressMsg);
      return Number.isNaN(progress) != true && progress >= 1;
    });
    isLoading = true;
    isCrossEnabled = App.isCrossEnabled;

    ctx.status = ctx.response.status = 200; // 302;
    ctx.body = ctx.response.body = JSON.stringify({
      'code': 200,
      'msg': 'Auto testing in node...'
    });

    // setTimeout(function () {  // 延迟无效
    ctx.redirect('/test/status');
    // }, 1000)
  }
  else if (ctx.path == '/test/status' || (isLoading && ctx.path == '/test')) {
    update();
    if (isLoading) {
      // ctx.response.header['refresh'] = "1";
      // ctx.redirect('/status');
    }

    var server = App.server;
    var ind = server == null ? -1 : server.indexOf('?');

    ctx.status = ctx.response.status = 200;  // progress >= 1 ? 200 : 302;
    ctx.body = ctx.response.body = JSON.stringify({
      'code': 200,
      'msg': (message || (progress < 1 || isLoading ? 'Auto testing in node...' : 'Done auto testing in node.')) + timeMsg + progressMsg,
      'progress': progress,
      'reportId': App.reportId,
      'link': server + (ind < 0 ? '?' : '&') + 'reportId=' + App.reportId
    });
  }
  else if (ctx.path == '/test/compare' || ctx.path == '/test/ml') {
    done = false;
//    var json = '';
//    ctx.req.addListener('data', (data) => {
//  		json += data;
//  	})
//  	ctx.req.addListener('end', function() {
//  		console.log(json);
        var body = ctx.body || ctx.req.body || ctx.request.body || {} // || JSON.parse(json) || {};
        console.log(body);
        var isML = ctx.path == '/test/ml' || body.isML;
        var res = body.response;
        var stdd = body.standard;
        var response = typeof res != 'string' ? res : (StringUtil.isEmpty(res, true) ? null : JSON.parse(res));
        var standard = typeof stdd != 'string' ? stdd : (StringUtil.isEmpty(stdd, true) ? null : JSON.parse(stdd));
        console.log('\n\nresponse = ' + JSON.stringify(response));
        console.log('\n\nstdd = ' + JSON.stringify(stdd));
        var compare = JSONResponse.compareResponse(null, standard, response || {}, '', isML, null, null, false) || {}

        if (body.newStandard) {
          compare.newStandard = JSONResponse.updateFullStandard(standard, response, isML)
        }
        console.log('\n\ncompare = ' + JSON.stringify(compare));

        ctx.status = ctx.response.status = 200;
        ctx.body = ctx.response.body = compare == null ? '' : JSON.stringify(compare);
        done = true;
//    })
//    while (true) {
//        if (done) {
//           break;
//        }
//    }
  }
});

app.listen(PORT);

console.log(`已启动 Node HTTP 服务，可以
GET http://localhost:${PORT}/test/start
来启动后台回归测试，或者
GET http://localhost:${PORT}/test/status
来查询测试进度。`);
