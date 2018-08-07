# APIJSON Auto

自动生成文档、自动管理测试用例 这两个功能 需要部署APIJSON后端，见
[https://github.com/TommyLemon/APIJSON/tree/master/APIJSON-Java-Server](https://github.com/TommyLemon/APIJSON/tree/master/APIJSON-Java-Server)

网页可以不用部署，直接用 http://apijson.cn ，把基地址改为 http://localhost:8080

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
