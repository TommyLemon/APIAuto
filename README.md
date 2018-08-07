# APIJSON Auto
自动化接口管理工具，支持自动生成文档与注释、自动生成代码、自动化回归测试、自动静态检查等。

## 部署方法

自动生成文档、自动管理测试用例 这两个功能 需要部署APIJSON后端，见
[https://github.com/TommyLemon/APIJSON/tree/master/APIJSON-Java-Server](https://github.com/TommyLemon/APIJSON/tree/master/APIJSON-Java-Server)

网页可以直接下载源码解压后访问index.html，<br />
也可以直接用 http://apijson.cn ，把基地址改为你主机的地址(例如http://localhost:8080)即可。

## develop and deploy
Some resources such as font and svg must be run at a server. I recommand to use [webon](https://github.com/bimohxh/webon)

### install webon
[webon](https://github.com/bimohxh/webon) is help to develop and deploy a static site.
run
```
npm install webon -g
```

### configuration
You need to do some configuration with `webon init`

### development
Just run 
```
webon s
```

### deploy
```
webon deploy
```

## Thanks to
#### jsonon
#### editor.md
#### vue.js
