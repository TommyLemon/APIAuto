## 1.自动生成代码
https://github.com/TommyLemon/APIAuto/blob/master/apijson/CodeUtil.js

![](https://github.com/TommyLemon/StaticResources/blob/master/APIAuto/APIJSON_generate_code_4_entity.png?raw=true)
![](https://github.com/TommyLemon/StaticResources/blob/master/APIAuto/APIJSON_generate_code_4_request_json.png?raw=true)
![](https://github.com/TommyLemon/StaticResources/blob/master/APIAuto/APIJSON_generate_code_4_response_json.png?raw=true)
Java, Kotlin, Swift, C#, PHP, Go, JavaScript, TypeScript, Python <br />
模型类 Entity、封装请求 JSON、解析结果 JSON 等代码。

## 2.自动生成注释
https://github.com/TommyLemon/APIAuto/blob/master/apijson/CodeUtil.js

parseComment, getComment4Request, getCommentFromDoc <br />
* 对左侧请求 JSON 自动在每行右边生成字段的类型、长度、描述等
* 对右侧结果 JSON 自动在光标移到字段时显示类型、长度、描述等

## 3.自动静态检查 
https://github.com/TommyLemon/APIAuto/blob/master/apijson/CodeUtil.js

parseComment <br />
* 自动检查请求 JSON 是否符合 JSON 的格式
* 自动检查表对象里的字段是否在表里真实存在
* 自动检查 APIJSON 关键词对应的值是否合法

## 4.自动化接口测试
https://github.com/TommyLemon/APIAuto/blob/master/apijson/JSONResponse.js

#### 前后对比测试  compareWithBefore
不用写任何代码，只需要点一下 回测测试的图标按钮 （左区域右上角，类似刷新的图标），
就会自动测试所有测试用例（除了登录和退出登录），并对比每一个测试用例前后两次请求的结果，然后给出结论：正确、新增字段、缺少字段、值改变、类型改变、状态码改变等。
每一个测试用例测完后都会有 左侧按钮用于显示测试结果和切换前后的请求结果，右侧按钮用于 纠错，中间的是下载按钮用于下载两次的请求，背景色用于标记接口变更的严重程度。
如果这次的结果是对的，可以点击 [对的，纠错] 按钮来上传新的正确结果作为后续的对比标准。

#### 机器学习测试  compareWithStandard, updateStandard
在 前后对比测试 的基础上，提取返回结果 Response JSON 的校验模型，包括每一层的所有键值对的名称、类型、长度、取值范围等。
它还能精准定位到数组内的数据，[]/7/Comment/id，原来只能到 []。
在第一次会生成校验模型，这时就已经比前后对比测试有约 20% 的准确度提升，随着纠错次数增加，模型会更新地越来越精准，
一般一个测试用例达到 12 次后就会相当于高级测试工程师编写测试代码达到的效果。

开启并使用机器测试：<br />
1.点击右区域 第 3 个图标按钮（本地保存，点击查看共享），会进入测试用例界面；<br />
2.点击 切换机器学习的按钮（机器学习：已关闭），会开启机器学习；<br />
3.点击左区域 最右侧的图标按钮（回归测试）。

#### 总结
以前编写测试代码来实现自动化测试，解决手动测试的繁琐、无聊、易出错；APIAuto 的自动化接口回归测试连代码都不用写了。
不仅能节约大量的测试代码开发成本，省去接口测试与接口开发人员的沟通时间，避免各种原来导致的误会、争吵等；
还能通过每次改动代码后跑一遍测试，及时且提前(在同事、领导、用户发现前)发现bug，减少后续发现甚至在线上发生问题导致大量损失的风险。

![](https://github.com/TommyLemon/StaticResources/blob/master/APIAuto/APIJSONAuto_Enterprise_Git_Commit_About_Mathine_Learning.png?raw=true)
![](https://github.com/TommyLemon/StaticResources/blob/master/APIAuto/APIJSON_Server_Enterprise_Git_Commit_About_Machine_Learning.png?raw=true)

之前 机器学习测试 是作为一个付费功能在 APIAuto-自动化接口管理平台 上使用，从 2018年11月6日 开始上线，现如今我已将全部相关代码开源。
原来是作为私有仓库托管在码云 Gitee 上 <br />
https://gitee.com/TommyLemon/APIJSONAuto-Enterprise  <br />
现在这个仓库也公开了，单独维护了两年，和开源版本的 APIAuto(原名 APIJSONAuto) 至少有大半年没同步了，
所以今天花了几小时把机器学习相关代码提取出来，整合到开源的 APIAuto 里面的 JSONResponse.js 了。

## 5.对开源的感慨
如果我把维护、推广开源项目的时间用在看各种大厂面经上，或许这次手 Q 部门四面就不会挂得这么不甘心。

国内开源做得很艰难，我和很多开源作者有过交流，发现他们和我一样，总是遇到各种莫名其妙的鄙视(国外的月亮就是圆)，甚至人身攻击，发博客帖子推广下自己的项目总是遇到各种各样的喷子，写好的项目和功能介绍等文档不看，Demo 也不试试，更不用说看源码了，连项目是什么，解决什么问题的都不知道，就开始一副好为人师的样子指指点点，还各种喷不到点；Star 少的说你这项目都没人用，Star 多就质疑是不是淘宝买的，有时候真想把 [博客](https://my.oschina.net/tommylemon)、[Star History](https://star-history.t9t.io/#APIJSON/APIJSON)、 [Star 关注者信息](https://haochuan9421.github.io/stargazers/#/) 的链接甩过去给他看(当然也是被某些人带坏了风气，这种大家见一个举报一个就好)；Issue 少是没人用看不上，Issue 多是 bug 多不敢用，把 [第三方代码扫描结果](https://github.com/APIJSON/APIJSON/issues/48) 发出来又说 “千行 BUG 率约 1.5，不算什么特别严谨可靠吧……”，我只想说 “Talk is useless, show me your code”。

还有伸手党特别多，文档懒得看，Demo 懒得用，Issue 懒得搜，一个个在群里随时随地 @ 作者，完全没有打扰人家上班或者休息的愧疚，有的没有感谢作者辛勤付出就算了，甚至一边理直气壮地免费用着开源软件，一边对作者蛮横无理地各种要求甚至各种指责。我去你谁啊，你付费购买了我的技术支持了还是我欠你钱了？怎么一个个都把自己当成大爷了呢？你一发消息我就得马上回复，一有问题就专门腾出时间一对一远程协助？我就不是正常人，不用上班不用吃饭不用休息了？

国内大部门作者都是用自己的业余休息时间去做开源的，如果作者把时间精力花在外包等别的副业，或者好好准备面试跳槽，或者就是休息放松娱乐，完全可以过得比较滋润；有些作者专职做开源，可能有人觉得挺挣钱，实际上其中绝大部分项目包括打赏、付费服务等各种开源收入连服务器及域名租赁费，甚至网费电费不够付的，能勉强维持收支平衡的都少之又少，很多都需要接外包才能维持团队的运作和自己生活的开支。开源作者们大部分是一腔热血为了回馈开源社区，有很多坚持不下的就默默退出了，还剩一部分仍然在长期“亏损”的状态下持续投入时间精力，甚至物力财力，这些作者真的可以说是用爱发电了。即便人家是为了名气或者 KPI，或者商业开源，那也总比人家不开源，你连用都没得用抄都没得抄要好吧？

或许是因为国内开源发展还在比较早的阶段，或许是因为整个网络风气比较浮躁和粗俗，才造成了以上各种不文明、不友好的现象，让众多开源作者们心寒。
希望大家对国内开源多一些理解和支持，多多参与到开源项目的贡献中，维持甚至增强 开源贡献社区、社区回馈开源 的良性循环，谢谢！
