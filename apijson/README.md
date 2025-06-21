## 1.自动生成代码
https://github.com/TommyLemon/CVAuto/blob/master/apijson/CodeUtil.js

![](https://github.com/TommyLemon/StaticResources/blob/master/CVAuto/CVAuto_generate_code_4_request_json.jpg?raw=true)
![](https://github.com/TommyLemon/StaticResources/blob/master/CVAuto/CVAuto_generate_code_4_entity.jpg?raw=true)
![](https://github.com/TommyLemon/StaticResources/blob/master/CVAuto/CVAuto_generate_code_4_response_json.jpg?raw=true)
Java, Kotlin, Swift, C#, PHP, Go, JavaScript, TypeScript, Python <br />
模型类 Entity、封装请求 JSON、解析结果 JSON 等代码。 <br />
<br />

## 2.自动生成注释
https://github.com/TommyLemon/CVAuto/blob/master/apijson/CodeUtil.js

![](https://github.com/TommyLemon/StaticResources/blob/master/CVAuto/CVAuto_generate_comment_4_request_and_response.jpg?raw=true)
parseComment, getComment4Request, getCommentFromDoc <br />
* 对左侧请求 JSON 自动在每行右边生成字段的类型、长度、描述等
* 对右侧结果 JSON 自动在光标移到字段时显示类型、长度、描述等
<br />

## 3.自动静态检查 
https://github.com/TommyLemon/CVAuto/blob/master/apijson/CodeUtil.js

![](https://github.com/TommyLemon/StaticResources/blob/master/CVAuto/CVAuto_static_checking.jpg?raw=true)
parseComment <br />
* 自动检查请求 JSON 是否符合 JSON 的格式
* 自动检查表对象里的字段是否在表里真实存在
* 自动检查 APIJSON 关键词对应的值是否合法
<br />

## 4.自动化接口测试
https://github.com/TommyLemon/CVAuto/blob/master/apijson/JSONResponse.js

#### 前后对比测试  compareWithBefore
![](https://github.com/TommyLemon/StaticResources/blob/master/CVAuto/CVAuto_test_compare_with_before.jpg?raw=true)
不用写任何代码，只需要点一下 回测测试的图标按钮 （左区域右上角，类似刷新的图标），<br />
就会自动测试所有测试用例（除了登录和退出登录），并对比每一个测试用例前后两次请求的结果，<br />
然后给出结论：结果正确、新增字段、缺少字段、值改变、值类型改变、状态码改变等。<br />
每一个测试用例测完后都会有 左侧按钮用于显示测试结果和切换前后的请求结果，<br />
右侧按钮用于 纠错，中间的是下载按钮用于下载两次的请求，背景色用于标记接口变更的严重程度。<br />
如果这次的结果是对的，可以点击 [对的，纠错] 按钮来上传新的正确结果作为后续的对比标准。

#### 机器学习测试  compareWithStandard, updateStandard
![](https://github.com/TommyLemon/StaticResources/blob/master/CVAuto/CVAuto_test_machine_learning.jpg?raw=true) 
![](https://github.com/TommyLemon/StaticResources/blob/master/CVAuto/CVAuto_machine_learning_design.jpg?raw=true) 
在 前后对比测试 的基础上，通过 简单统计 + 场景优化 来提取返回结果 Response JSON 的校验模型，<br />
包括每一层的所有键值对的名称、类型、长度、取值范围等，它还能精准定位到数组内的数据，<br />
例如 []/7/Comment/id，原来的 前后对比测试 只能到 []。<br />
在第一次会生成校验模型，这时就已经比前后对比测试有约 20% 的准确度提升，<br />
随着纠错次数增加，模型会更新地越来越精准，一般一个测试用例达到 12 次后，<br />
就会相当于高级测试工程师对每个接口根据具体的业务需求来编写测试代码所能达到的效果。

开启和使用机器测试：<br />
1.点击右区域 第 3 个图标按钮（点击查看共享），会进入测试用例界面；<br />
2.点击 切换机器学习的按钮（机器学习：已关闭），会开启机器学习；<br />
3.点击左区域 最右侧的图标按钮（回归测试）。

#### 总结
以前编写测试代码来实现自动化测试，解决手动测试的繁琐、无聊、易出错；<br />
CVAuto 的自动化接口回归测试连代码都不用写了，点点按钮就能完成整个自动化测试过程。<br />
不仅能节约大量的测试代码开发成本，省去接口测试与接口开发人员的沟通时间，避免各种原来导致的误会、争吵等；<br />
还能通过每次改动代码后跑一遍测试，及时且提前(在同事、领导、用户发现前)发现bug，<br />
减少后续发现甚至在线上发生问题导致大量损失的风险。

![](https://github.com/TommyLemon/StaticResources/blob/master/CVAuto/APIJSONAuto_Enterprise_Git_Commit_About_Mathine_Learning.jpg?raw=true)
![](https://github.com/TommyLemon/StaticResources/blob/master/CVAuto/APIJSON_Server_Enterprise_Git_Commit_About_Machine_Learning.jpg?raw=true)

之前 机器学习测试 是作为一个付费功能在 CVAuto-自动化接口管理平台 上使用，<br />
从 2018年11月6日 开始上线，一年时间才两个付费用户充了几百元。<br />
现在也不像以前那样时间相对比较充裕了，我已将全部相关代码免费开源。<br />
原来是作为私有仓库托管在码云 Gitee 上 <br />
https://gitee.com/TommyLemon/APIJSONAuto-Enterprise  <br />
现在这个仓库也公开了，单独维护了两年，和开源版本的 CVAuto(原名 APIJSONAuto) 至少有大半年没同步了，<br />
花了几小时把机器学习相关代码提取出来，整合到开源的 CVAuto 里面的 JSONResponse.js 了。<br />
<br />
纯手写算法，没有用任何第三方库。

#### 目前仍然存在一些待优化的点：
1.每次只会显示最严重、最靠前的的一个 键值对/数组元素值，更新模型却会把所有 键值对/数组元素值 认为是正确的而一起更新<br />
解决方案：<br />
牺牲一些性能，把所有有问题的 键值对/数组元素值 全都用一个数组记录，每次递归都传递这个值。<br />
为了让 UI 显示比较简洁，可以只显示最严重的 键值对/数组元素值，下载的测试标准文本里显示所有有问题的 键值对/数组元素值。<br />
<br />

2.一些接口有流程上的先后顺序，需要先调用某个，再取出值作为参数调用另一个<br />
解决方案：<br />
UI 上支持添加工作流，设置好顺序以及每个接口按路径取出对应的值，再按路径替换下一个接口请求 JSON 里的值，然后一键顺序调用。<br />
<br />
