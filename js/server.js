const Koa = require('koa');
const Vue = require('vue');
const {getRequestFromURL, App} = require('./main');
// const { createBundleRenderer } = require('vue-server-renderer')

const JSONResponse = require('../apijson/JSONResponse');

const app = new Koa();

app.use(async ctx => {
  // ctx.body = 'SSR: ' + JSONResponse.formatArrayKey('User:praise[]', true, true);
  var startTime = (new Date()).getTime();
  App.autoTest(function(process) {
    var curTime = (new Date()).getTime();
    ctx.body = (process || 'Auto testing in node...') + '\nStart Time: ' + startTime
      + '; \nCurrent Time: ' + curTime + '; \n Time Spent: ' + (curTime - startTime)
  })
  ctx.body = 'Auto testing in node...';
});

app.listen(3000);
