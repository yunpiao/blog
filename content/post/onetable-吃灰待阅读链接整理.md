---
title: onetable-吃灰待阅读链接整理
tags:
  - 学习笔记
date: 2025-08-27T17:22:41+08:00
draft: false
toc: true
slug: 20250827172241
categories:
  - 技术洞察
---
> 🥲 虚假学习 
> onetable 里面太多链接了, 都是待阅读的, 太多看不完, 看完了又很快忘记了,  所以我想先记一个流水账, 准备后期用 Gemini 全部整理一遍再阅读了

## 👋同时推荐下我的 chrome 小工具(如果我的 blog 有人看的话)
[网页 AI 转写器](https://chromewebstore.google.com/detail/%E7%BD%91%E9%A1%B5-ai-%E8%BD%AC%E5%86%99%E5%99%A8/agfhhpkboppfaehehhicoojiaikholal) 类似阅读模式, 生成一个清爽版的阅读版本,  比较好的是, 可以使用自己账号的 Gemini, DeepSeek 等 AI 工具 
### 一、软件架构与系统设计

#### A. 通用原则与高阶概念
*   **高可用与可扩展性**
    *   [亿级流量系统架构设计系列——1.核心设计原则](https://mp.weixin.qq.com/s/KO793LjRtbDhrH-HGgVmyA)
    *   [1.1 云计算的演进变革 | 深入高可用系统原理与设计](https://www.thebyte.com.cn/architecture/history.html#_1-1-2-%E8%99%9A%E6%8B%9F%E5%8C%96%E6%8A%80%E6%9C%AF%E6%88%90%E7%86%9F)
    *   [「异地多活」参考资料](https://www.yuque.com/kaito-djycs/kb/gw7kbw)
    *   [搞懂异地多活，看这篇就够了 | Kaito's Blog](http://kaito-kidd.com/2021/10/15/what-is-the-multi-site-high-availability-design/)
    *   [5.3.2 TCC | 深入高可用系统原理与设计](https://www.thebyte.com.cn/distributed-transaction/TCC.html)
    *   [万字详解高可用架构设计-腾讯云开发者社区-腾讯云](https://cloud.tencent.com/developer/article/2485144)
    *   [万字详解高可用架构设计 - 高可用架构 - 瓦斯阅读](https://qnmlgb.tech/articles/6785a452003b07f9af672fa9/)

*   **设计原则与模式**
    *   [系统设计原则周期表](https://github.com/jarulraj/periodic-table)
    *   [这次才真正懂了“组织架构决定技术架构”](https://mp.weixin.qq.com/s/HKTPSUMiJOaeufLJ2ifJQg?clicktime=1750656720&enterid=1750656720&exptype=unsubscribed_card_recommend_article_u2i_mainprocess_coarse_sort_pcfeeds&ranksessionid=1750656710_1&scene=169&subscene=200)
    *   [复杂度是不灭的，只会转移，难道一切都是徒劳的吗？ - 知乎](https://zhuanlan.zhihu.com/p/138145081)
    *   [架构设计-复杂度是不灭的 - 知乎](https://zhuanlan.zhihu.com/p/410049005)
    *   [软件开发中的抽象泄露法则](https://mp.weixin.qq.com/s/ChNm8lgJkGg57pFCnmGp8w)
    *   [【图文】系统设计面经：7大Facebook系统设计面试问题及答案(2023) – 篱笆教育](https://www.libaedu.com/info/541.html)
    *   [我最喜欢的软件架构模式 | 作者：Matt Bentley](https://freedium.cfd/https://levelup.gitconnected.com/my-favourite-software-architecture-patterns-0e57073b4be1)
    *   [system-design-101: 用视觉和简单的术语解释复杂的系统。帮助你准备系统设计面试。](https://github.com/ByteByteGoHq/system-design-101?tab=readme-ov-file#communication-protocols)
    *   [《软件设计的哲学》中的思想](https://www.16elt.com/2024/09/25/first-book-of-byte-sized-tech/index.html)
    *   [系统设计面试必读](https://github.com/summerjava/system-design-interview)
    *   [实现架构策略](https://blog.thepete.net/blog/2019/12/09/delivering-on-an-architecture-strategy/)
    *   [撰写技术设计文档。工程洞察](https://medium.com/machine-words/writing-technical-design-docs-71f446e42f2e#id_token=eyJhbGciOiJSUzI1NiIsImtpZCI6ImRkMTI1ZDVmNDYyZmJjNjAxNGFlZGFiODFkZGYzYmNlZGFiNzA4NDciLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIyMTYyOTYwMzU4MzQtazFrNnFlMDYwczJ0cDJhMmphbTRsamRjbXMwMHN0dGcuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiIyMTYyOTYwMzU4MzQtazFrNnFlMDYwczJ0cDJhMmphbTRsamRjbXMwMHN0dGcuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTAzNDcwMTQ5ODM3NTY1MjA1OTQiLCJlbWFpbCI6Inl1bnBpYW8xMTFAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5iZiI6MTczNjkzMTQ5NSwibmFtZSI6IuS6kemjmCIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NKRGlGSVNPWHo1VUctYlZJMktteTlXWXVLd01jZzJ2c1h4Z2c0SHBNSTZmckxQcS1vPXM5Ni1jIiwiZ2l2ZW5_bmFtZSI6IumjmCIsImZhbWlseV9uYW1lIjoi5LqRIiwiaWF0IjoxNzM2OTMxNzk1LCJleHAiOjE3MzY5MzUzOTUsImp0aSI6IjExNDY5Y2Q3ZDk0ZjczZGE1OGQ2YTM3NDc1Nzc0OGIzMmJjMGM4N2MifQ.eT3NapOSAhG7CLgiSfJszIN8atBQ2v41q4KKztzk0ycPAMhsQFzvmvXvFyKrnsIUMTiybOqHuaQnBssDg15eFO-jO80pvpi60fTj_bXVRGNScH8bK53sSKbOYYwzoTSrW86qXTIx0ww_bzqVlhFSwhZH9eP7GKQ9G04srDKnwYoaKgk3ploFBe-Aaeemr_9JeCfFnAgutzBzRYmFZGKfBa5rRNZvZYtG8Az94Z3-t9CHMGos1daY0FLq6IEHy5P8LBHjTRsNTflKGbs7fF2VcO0N62nev4F44rxz6WhqeL6fMvQzVLsrrrGiDebt4mtHWQXQ1c3HxFhJnJvQT-59hA)
    *   [学习拥有工程愿景](https://unwiredcouch.com/2018/01/03/engineering-vision.html)
    *   [运行更少的软件 - Intercom博客](https://www.intercom.com/blog/run-less-software/)
    *   [没有银弹——软件工程的本质与偶然](https://s3.amazonaws.com/systemsandpapers/papers/Frederick_Brooks_87-No_Silver_Bullet_Essence_and_Accidents_of_Software_Engineering.pdf)

*   **单体 vs. 微服务**
    *   [“骑手与大象”架构：超越微服务与单体之争的务实之道？ - Tony Bai](https://tonybai.com/2025/06/17/rider-elephant-arch/)
    *   [Sand Magician 在 X 上的讨论：“也不知道过去几年这股奇怪的“微服务”风潮是怎么起来的...”](https://x.com/sandmagician/status/1593469165892820992?t=w1FZjG0Pyyq-EFQRpXtYGQ&s=09)
    *   [一个包含10个微服务的示例云原生应用，展示了Kubernetes、Istio和gRPC。](https://github.com/GoogleCloudPlatform/microservices-demo)

*   **领域驱动设计 (DDD)**
    *   [浅谈DDD领域驱动设计架构](https://mp.weixin.qq.com/s?__biz=MzkxMjQzMjA0OQ==&mid=2247485358&idx=1&sn=79e1be9140334d4487b337a839cbb9eb&chksm=c07b43c736985e6de2df61d832b7cf3352c19ee1bd3fc5428316b83b644c68dda4c248a85189&xtrack=1&scene=90&subscene=93&sessionid=1738464877&flutter_pos=0&clicktime=1738464880&enterid=1738464880&finder_biz_enter_id=4&ranksessionid=1738464872&ascene=56&fasttmpl_type=0&fasttmpl_fullversion=7572126-zh_CN-zip&fasttmpl_flag=0&realreporttime=1738464880740#rd)
    *   [关于 DDD 的认知与思考 | xyZGHio](https://xyzghio.xyz/BasisOfDDD/)
    *   [DDD领域驱动设计入门与实践：从概念到代码示例 - 开发技术 - 冷月清谈](https://www.xinfinite.net/t/topic/8701/)
    *   [领域驱动设计40个核心概念精粹 - 开发技术 - 冷月清谈](https://www.xinfinite.net/t/topic/9771/)
    *   [两种常用代码范式：领域模型驱动与过程驱动 - 开发技术 - 冷月清谈](https://www.xinfinite.net/t/topic/9190/)

#### B. 特定系统案例
*   [标签系统的架构设计与实现](https://mp.weixin.qq.com/s/yfsw11CQhwWORgNCpPDVQQ)
*   [微信读书后台架构演进之路](https://mp.weixin.qq.com/s/jpTezo6097QymO0GODidqw)
*   [系统架构设计全解：从思维到实践 - 开发技术 - 冷月清谈](https://www.xinfinite.net/t/topic/9528/)
*   [Bigtable: 一个针对结构化数据的分布式存储系统](https://static.googleusercontent.com/media/research.google.com/en//archive/bigtable-osdi06.pdf)

### 二、编程语言与框架

#### A. Go语言
*   [GCP大面积故障，Go语言是“元凶”还是“背锅侠”？ - Tony Bai](https://tonybai.com/2025/06/16/go-avoid-critical-incident/)
*   [在go中使用Semaphoregroup | 虫子樱桃](https://czyt.tech/post/use-semaphoregroup-in-go/)
*   [分类 - Go进阶训练营 - Mohuishou](https://lailin.xyz/categories/Go%E8%BF%9B%E9%98%B6%E8%AE%AD%E7%BB%83%E8%90%A5/#board)
*   [对象池 - Go优化指南](https://goperf.dev/01-common-patterns/object-pooling/)
*   [Go+, LLM+MCP与架构分享](http://open.qiniu.us/gop-ai-and-arch.pdf)
*   [Golang 中预分配 slice 内存对性能的影响（续） | Oilbeater 的自习室](https://oilbeater.com/2024/01/09/alloc-slice-for-golang-2-md/#bytebufferpool)
*   [Go中的错误处理：新的?操作符](https://pub.huizhou92.com/error-handling-in-go-the-new-operator-da92a0207b1e)
*   [GO LANG 错误处理 — 改进版 (必看模式)](https://medium.com/@kartik11buttan/golang-error-handling-improvised-must-pattern-d867dc09c646)
*   [分析Go应用程序：CPU、内存和并发洞察](https://medium.com/@norbert.jakubczak/profiling-go-applications-cpu-memory-and-concurrency-insights-442a6e9c6979)
*   [在生产环境中运行Go服务的经验教训](https://levelup.gitconnected.com/lessons-from-running-go-services-in-production-for-2-years-b4741f7bce13)
*   [Go 编程语言博客](https://go.dev/blog/)
*   [Go 代码阅读不再难，goanalysis 工具帮你忙](https://mp.weixin.qq.com/s/E0mtD46vMjK16mpS3B8BWw)
*   [Go encoding/json/v2提案：JSON处理新引擎 | Tony Bai](https://tonybai.com/2025/02/05/go-encoding-json-v2-proposal-json-processing-new-engine/)
*   [Go语言实例教程从入门到进阶](https://github.com/pibigstar/go-demo/tree/master)
*   [Go1.24 新特性：sync.Map 性能提高、Go mod 增加 tool 指令、net/http 协议优化等](https://mp.weixin.qq.com/s/57c2cWs8oM7FA80ZKThNHw)
*   [Uber Go 语言编码规范中文版](https://github.com/xxjwxc/uber_go_guide_cn)
*   [Go 语言 Channel 实现原理精要 | Go 语言设计与实现](https://draveness.me/golang/docs/part3-runtime/ch06-concurrency/golang-channel/)
*   [Go 语言设计与实现](https://draveness.me/golang/)
*   [Go应用监控：编译时插桩方案详解 - 开发技术 - 冷月清谈](https://www.xinfinite.net/t/topic/9372/)
*   [Go应用崩溃案例分析：编译时插桩与竞态检测的冲突 - 开发技术 - 冷月清谈](https://www.xinfinite.net/t/topic/9753/)

#### B. Python
*   [一个灵活、自适应的动态文本分类系统](https://github.com/codelion/adaptive-classifier)
*   [自适应分类器：动态文本分类与持续学习](https://huggingface.co/blog/codelion/adaptive-classifier)
*   [Python 之 Weak Ref 弱引用 | xyZGHio](https://xyzghio.xyz/WeakRefOfPy/)

#### C. Rust
*   [HelixDB: 一个强大的开源图向量数据库，使用Rust构建](https://github.com/HelixDB/helix-db)
*   [Rust std fs 比 Python 慢！真的吗！？](https://mp.weixin.qq.com/s/m-IBomxu88DlNcEyOgyOew?poc_token=HCmbCWijoK2KhnnZCS8X8c4TB6w37nkMPxaMDK8J)
*   [Rust 杀死了我的 Go 微服务（它罪有应得）](https://medium.com/@hrshh17softdev/rust-killed-my-go-microservice-and-it-deserved-it-c9fef79c0abb)

#### D. Web与前端
*   [终极 Next.js 入门套件](https://github.com/michaelshimeles/nextjs-starter-kit)
*   [用第一性原理从零推导前端知识体系](https://juejin.cn/post/7471300010601218057)

### 三、DevOps、云与基础设施

#### A. Kubernetes、Docker与容器化
*   [滴滴弹性云基于 K8S 的调度实践](https://mp.weixin.qq.com/s/nMSIsS72fSXGqJO9Vy_Pfw)
*   [Docker 的终结？开发者改变运行时的原因](https://medium.com/@devlink/the-end-of-docker-the-reasons-behind-developers-changing-their-runtimes-4b7697846f6f)
*   [没有 Docker 的 Kubernetes 是未来 — 你准备好了吗？](https://medium.com/@kanishksinghpujari/kubernetes-without-docker-is-the-future-are-you-ready-f63a9a7746de)
*   [一切都很好，直到 Kubernetes 说‘没有更多的CPU了’](https://blog.zeptonow.com/everything-was-fine-until-kubernetes-said-no-more-cpu-3768cda76326)
*   [5个你不知道的秘密Kubernetes技巧](https://blog.devgenius.io/5-secret-kubernetes-tricks-you-didnt-know-6d930dfdfffa)
*   [Kubernetes中的CPU限制：为什么你的Pod空闲但仍被节流](https://medium.com/@alexandru.lazarev/cpu-limits-in-kubernetes-why-your-pod-is-idle-but-still-throttled-a-deep-dive-into-what-really-136c0cdd62ff)
*   [K8S 部署nfs服务器-腾讯云开发者社区-腾讯云](https://cloud.tencent.com/developer/article/1914388)
*   [【Kubernetes】K8s笔记（十四）：PersistentVolume 使用网络共享存储（NFS） - 博客园](https://www.cnblogs.com/joexu01/p/16836482.html)
*   [在k8s集群使用nfs卷.md](https://github.com/usualheart/install_k8s_official/blob/master/nfs-k8s/%E5%9C%A8k8s%E9%9B%86%E7%BE%A4%E4%BD%BF%E7%94%A8nfs%E5%8D%B7.md)
*   [使用 Terraform 构建的带有 Istio 的本地 kubernetes 集群](https://github.com/madduci/kind-with-mesh)
*   [kubectl 创建 Pod 背后到底发生了什么？ · 云原生实验室](https://icloudnative.io/posts/what-happens-when-k8s/)
*   [Kubernetes RBAC 101: 如何通过 OIDC 强化集群安全](https://www.cloudnative101.net/posts/kubernetes-rbac-oidc-security-guide/)
*   [服务网格Istio入门-详细记录Kubernetes安装Istio并使用 - 博客园](https://www.cnblogs.com/larrydpk/p/15116902.html)
*   [Kubernetes Pod扩容预热陷阱：如何避免5xx错误和CPU飙升？-CSDN博客](https://blog.csdn.net/heian_99/article/details/145473811)
*   [Kubernetes 核心资源对象详解 - 开发技术 - 冷月清谈](https://www.xinfinite.net/t/topic/8735/)
*   [OpenAI服务中断引发的思考：如何保障大规模K8s集群的稳定性？ - 开发技术 - 冷月清谈](https://www.xinfinite.net/t/topic/9615/)
*   [Docker 镜像与仓库管理实战指南 - 开发技术 - 冷月清谈](https://www.xinfinite.net/t/topic/8797/)

#### B. 云原生与服务网格 (Istio)
*   [Istio / 流量管理](https://istio.io/latest/zh/docs/concepts/traffic-management/)
*   [教程 | Kiali](https://kiali.io/docs/tutorials/)
*   [Istio / 架构](https://istio.io/latest/zh/docs/ops/deployment/architecture/)
*   [Envoy | 深入架构原理与实践](https://www.thebyte.com.cn/MicroService/Envoy.html#%E9%85%8D%E7%BD%AE%E9%9B%86%E7%BE%A4)
*   [Istio / Ingress 网关](https://istio.io/latest/zh/docs/tasks/traffic-management/ingress/ingress-control/#determining-the-ingress-ip-and-ports)
*   [1.4 云原生的目标 | 深入高可用系统原理与设计](https://www.thebyte.com.cn/architecture/target.html)
*   [云原生技术与应用入门指南 - 开发技术 - 冷月清谈](https://www.xinfinite.net/t/topic/9086/)
*   [云原生入门指南：核心概念及应用 - 开发技术 - 冷月清谈](https://www.xinfinite.net/t/topic/8713/)

#### C. 数据库与存储
*   [PostgreSQL Internals](https://www.interdb.jp/pg/index.html?s=09)
*   [我从构建生产数据库中学到的42件事](https://dirtysalt.github.io/html/42-things-I-learned-from-building-a-production-database.html)
*   [Memcached的存储原理解析 | codedump notes](https://www.codedump.info/post/20210701-memcached/)
*   [VictoriaMetrics: 快速、经济高效的监控解决方案和时间序列数据库](https://github.com/VictoriaMetrics/VictoriaMetrics)
*   [OpenAI：将PostgreSQL伸缩至新阶段](https://mp.weixin.qq.com/s/ykrasJ2UeKZAMtHCmtG93Q)
*   [万字长文：大规模 Elasticsearch 高可用集群环境调优实践-腾讯云开发者社区-腾讯云](https://cloud.tencent.com/developer/article/1831763)
*   [4 Elasticsearch高可用分布式集群 | 跨境互联网](https://www.kuajingnet.com/pages/es/2b2926/)
*   [ElasticSearch 集群高可用存储架构 - 墨天轮](https://www.modb.pro/db/115009)
*   [Elastic Search 存储方式 | Lv's Blogs](https://lvqiushi.github.io/2021/03/29/elastic%20search/)
*   [下次再见啦 - k8s 分布式存储平台 -- Longhorn](https://www.cnblogs.com/misakivv/p/18436873#tid-ixWChf)
*   [时序数据库 | ELKstack 中文指南](https://hezhiqiang.gitbook.io/elkstack/elasticsearch/other/rrd)
*   [大数据 - 时间序列数据库的选择条件 - SegmentFault 思否](https://segmentfault.com/a/1190000002690600)
*   [从自建到云端：数据库迁移实践指南 - 开发技术 - 冷月清谈](https://www.xinfinite.net/t/topic/9246/)
*   [Redis 原理深度解析：从单机到集群，探索高性能缓存之道 - 开发技术 - 冷月清谈](https://www.xinfinite.net/t/topic/8722/)
*   [Elasticsearch分布式搜索引擎解析 - 开发技术 - 冷月清谈](https://www.xinfinite.net/t/topic/8721/)
*   [数据库查询优化实战：从71.7万/秒到1.4万/秒 - 开发技术 - 冷月清谈](https://www.xinfinite.net/t/topic/9674/)
*   [AtomixDB：一个用 Go 编写的持久化关系型数据库](https://github.com/Sahilb315/AtomixDB)
*   [分布式系统架构7：本地缓存 - 卷福同学 - 博客园](https://www.cnblogs.com/dnboy/p/18676548)

#### D. 监控、可观测性与稳定性
*   [稳定性，难的不是技术，而是](https://mp.weixin.qq.com/s/9rAhbG6lu-flNIGQEF5w0g)
*   [从滴滴的故障我们能学到什么](https://mp.weixin.qq.com/s/KFZCQFP1oB5YOrT3tHBRCQ)
*   [1分钟定位应用“错慢”根因：链路诊断最佳实践 - 开发技术 - 冷月清谈](https://www.xinfinite.net/t/topic/9519/)
*   [Prometheus 监控实战：架构解析与告警配置 - 开发技术 - 冷月清谈](https://www.xinfinite.net/t/topic/8780/)
*   [Skywalking全链路跟踪：从架构到实践 - 开发技术 - 冷月清谈](https://www.xinfinite.net/t/topic/8692/)
*   [分布式系统监控应急的1-5-10实践 - 开发技术 - 冷月清谈](https://www.xinfinite.net/t/topic/8674/)

#### E. 网络与协议
*   [四层负载均衡漫谈 | 卡瓦邦噶！](https://www.kawabangga.com/posts/5301)
*   [2023年API协议的演变格局 | Postman博客](https://blog.postman.com/api-protocols-in-2023/)
*   [ByteByteGo | API与Web开发](https://bytebytego.com/guides/api-web-development/)
*   [ByteByteGo | 2023年API协议的演变格局](https://bytebytego.com/guides/the-evolving-landscape-of-api-protocols-in-2023/)
*   [VXLAN 基础教程：在 Linux 上配置 VXLAN 网络](https://juejin.cn/post/6844904133430870029)
*   [从零开始彻底搞懂NAT！一文吃透网络地址转换的所有秘密](https://telegra.ph/%E4%BB%8E%E9%9B%B6%E5%BC%80%E5%A7%8B%E5%BD%BB%E5%BA%95%E6%90%9E%E6%87%82NAT%E4%B8%80%E6%96%87%E5%90%83%E9%80%8F%E7%BD%91%E7%BB%9C%E5%9C%B0%E5%9D%80%E8%BD%AC%E6%8D%A2%E7%9A%84%E6%89%80%E6%9C%89%E7%A7%98%E5%AF%86-02-09)
*   [Linux网络性能终极指南](https://ntk148v.github.io/posts/linux-network-performance-ultimate-guide/#linux-network-packet-reception)
*   [从铜线到云端：网络技术的跨越与未来趋势](https://mp.weixin.qq.com/s?__biz=MzIzOTU0NTQ0MA==&mid=2247545415&idx=1&sn=bf661ba9be517a431858c8952aae6ef8&chksm=e92a0f48de5d865e84f88c47b88e972d9fe22d59ec4fba30650c9904ad2a0cb79cf55d923670&scene=58&subscene=0#rd)

#### F. 虚拟化与Linux内核
*   [Linux页面缓存系列 | Viacheslav Biriukov](https://biriukov.dev/docs/page-cache/)
*   [QEMU虚拟化安全的攻击面探索与思考 | CTF导航](https://www.ctfiot.com/46220.html)
*   [KVM | 云安全攻防入门](https://lzcloudsecurity.gitbook.io/yun-an-quan-gong-fang-ru-men/di-wu-zhang-si-you-yun-yu-xu-ni-hua-gong-fang/kvm)
*   [<转>virsh使用qemu+tcp访问远程libvirtd](https://blog.csdn.net/qq_21398167/article/details/48291065)
*   [kvm libvirt qemu实践系列(一)-kvm介绍 | opengers](https://opengers.github.io/virtualization/kvm-libvirt-qemu-1/)
*   [linux - KVM虚拟化系统解决方案（三）--使用libvirt创建和管理虚拟机 - SegmentFault 思否](https://segmentfault.com/a/1190000044794136)
*   [KVM管理工具libvirt.md](https://github.com/0voice/kernel_awsome_feature/blob/main/KVM%E7%AE%A1%E7%90%86%E5%B7%A5%E5%85%B7libvirt.md)
*   [Linux 核心設計: Scheduler(7): sched_ext - HackMD](https://hackmd.io/@RinHizakura/r1uSVAWwp)
*   [简介 | 千行代码实现操作系统](https://operating-system-in-1000-lines.vercel.app/zh/)

### 四、算法与数据结构
*   [分享丨【算法题单】动态规划- 力扣（LeetCode）](https://leetcode.cn/discuss/post/3581838/fen-xiang-gun-ti-dan-dong-tai-gui-hua-ru-007o/)
*   [单调栈 - OI Wiki](https://oi-wiki.org/ds/monotonous-stack/)
*   [🔥 LeetCode 热题 HOT 100](https://leetcode.cn/problem-list/v4lGiYux/)
*   [LeetCode 第 207 题：“课程表”题解 | LeetCode 题解](https://liweiwei1419.github.io/leetcode-solution-blog/leetcode-problemset/topological-sort/0207-course-schedule.html#%E6%96%B9%E6%B3%95%E4%B8%80%EF%BC%9A%E6%8B%93%E6%89%91%E6%8E%92%E5%BA%8F%EF%BC%88kahn-%E7%AE%97%E6%B3%95%EF%BC%89)
*   [有关动态规划 - PaperHammer - 博客园](https://www.cnblogs.com/PaperHammer/p/16187703.html)
*   [代码随想录 - 背包问题](https://programmercarl.com/%E8%83%8C%E5%8C%85%E6%80%BB%E7%BB%93%E7%AF%87.html#%E8%83%8C%E5%8C%85%E9%80%92%E6%8E%A8%E5%85%AC%E5%BC%8F)
*   [拓展：最近公共祖先系列解题框架 | labuladong 的算法笔记](https://labuladong.online/algo/practice-in-action/lowest-common-ancestor-summary/)
*   [二叉树系列算法核心纲领 | labuladong 的算法笔记](https://labuladong.online/algo/essential-technique/binary-tree-summary/#%E5%90%8E%E5%BA%8F%E4%BD%8D%E7%BD%AE%E7%9A%84%E7%89%B9%E6%AE%8A%E4%B9%8B%E5%A4%84)
*   [速成读者学习规划 | labuladong 的算法笔记](https://labuladong.online/algo/intro/quick-learning-plan/#%E4%BA%8C%E5%8F%89%E6%A0%91-%E9%80%92%E5%BD%92%E6%80%9D%E6%83%B3)
*   [二叉树心法（思路篇） | labuladong 的算法笔记](https://labuladong.online/algo/data-structure/binary-tree-part1/)
*   [二叉树心法（构造篇） | labuladong 的算法笔记](https://labuladong.online/algo/data-structure/binary-tree-part2/#%E9%80%9A%E8%BF%87%E5%90%8E%E5%BA%8F%E5%92%8C%E4%B8%AD%E5%BA%8F%E9%81%8D%E5%8E%86%E7%BB%93%E6%9E%9C%E6%9E%84%E9%80%A0%E4%BA%8C%E5%8F%89%E6%A0%91)

### 五、人工智能与机器学习

#### A. 大语言模型与生成式AI (Gemini等)
*   [陆奇最新演讲实录：我的大模型世界观](https://mp.weixin.qq.com/s/_ZvyxRpgIA4L4pqfcQtPTQ)
*   [构建智能代理的实用指南](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf)
*   [Claude 的 MCP (模型上下文协议）有啥用？ - 少数派](https://sspai.com/post/94360)
*   [MCP 是什么，现状和未来 | OneV's Den](https://onevcat.com/2025/02/mcp/)

#### B. AI工具与应用
*   [我对各种 AI Coding Agent 工具的看法 - XX's Blog](https://xxchan.me/ai/2025/06/08/ai-coding.html)
*   [2025 年的 AI 协助编程观察 – Yachen's Blog](https://yachen.com/2025/06/06/2025-ai/)
*   [AI 编码的隐藏成本 – Terrible Software](https://terriblesoftware.org/2025/04/23/the-hidden-cost-of-ai-coding/)
*   [一人公司 AI 工具系列](https://github.com/cyfyifanchen/one-person-company?tab=readme-ov-file#-%E7%BD%91%E7%AB%99%E7%B3%BB%E5%88%97---%E4%B8%80%E9%94%AE%E7%94%9F%E6%88%90%E7%BD%91%E7%AB%99)
*   [我用来大幅提高生产力的5个NotebookLM技巧](https://www.xda-developers.com/notebooklm-tips-use-to-supercharge-productivity/)
*   [大语言模型实战](https://github.com/wangwei1237/LLM_in_Action)
*   [𝕏 上有个大佬分享了 AI-Coding 的 9 个大坑 - 即刻App](https://m.okjike.com/originalPosts/67db6c218a65f4381a051a0c)

#### C. 概念与理论
*   [图解GPT-2 (可视化Transformer语言模型)](https://jalammar.github.io/illustrated-gpt2/)
*   [图解Word2vec](https://jalammar.github.io/illustrated-word2vec/)

### 六、安全
*   [Safe3/openresty-manager: 最简单、强大、美观的主机管理面板](https://github.com/Safe3/openresty-manager)
*   [Safe3/uuWAF: 行业领先的免费、高性能、AI和语义技术的Web应用防火墙](https://github.com/Safe3/uuWAF/tree/main)
*   [域环境密码凭证获取 | LuckySec](http://www.luckysec.cn/posts/d4130481.html)
*   [Active Directory DACL 攻击 < BorderGate](https://www.bordergate.co.uk/dacl-attacks/)
*   [HTB — Sauna | 21/100](https://medium.com/@Inching-Towards-Intelligence/htb-sauna-21-100-b31eb39d1309)
*   [安全KER - 安全资讯平台](https://www.anquanke.com/subject.html?id=193604)
*   [云原生安全速查表 | Threezh1'Blog](https://threezh1.com/2021/02/26/%E4%BA%91%E5%8E%9F%E7%94%9F%E5%AE%89%E5%85%A8Cheat_Sheet/)
*   [代码混淆101：揭开恶意代码背后的技巧](https://socket.dev/blog/obfuscation-101-the-tricks-behind-malicious-code)
*   [虚拟化安全指南 | Red Hat 产品文档](https://docs.redhat.com/zh-cn/documentation/red_hat_enterprise_linux/7/html-single/virtualization_security_guide/index#sVirt-Labels-NFS)

### 七、职业、生产力与个人成长

#### A. 职业建议与面试
*   [2025 最新校招面试题合集](https://github.com/0voice/Campus_recruitment_interview_questions)
*   [Carolyn 在 X 上的分享：我的面试学习方式...](https://x.com/CicidaMay/status/1957806596529979754?t=1xpegQ4Ony8dXU7glnKQAQ&s=09)
*   [软件技术人员的瓶颈，为35岁之后做准备 - 知乎](https://zhuanlan.zhihu.com/p/498762187)
*   [用随机梯度下降来优化人生 - 知乎](https://zhuanlan.zhihu.com/p/414009313)
*   [Chris Hladczuk 在 X 上的提问：“你最好的职业建议是什么？”](https://x.com/chrishlad/status/1502650707274608644)
*   [五家大型矽谷公司的軟體工程師面試經驗 ：Google Facebook LinkedIn AirBnb Quora](https://holyisland.blog/many-interview-in-2018/)
*   [142个资源助你精通编程面试](https://medium.com/better-programming/the-software-engineering-study-guide-bac25b8b61eb)
*   [142个资源助你精通编程面试 (备用链接)](https://readmedium.com/en/https:/medium.com/better-programming/the-software-engineering-study-guide-bac25b8b61eb)
*   [Better Programming 博客](https://betterprogramming.pub/)
*   [技术面试通过的注意事项 | Freedium](https://freedium.cfd/https://medium.com/better-programming/the-dos-and-donts-for-passing-your-technical-interview-1f2503c10733)
*   [高效工程师.md](https://gist.github.com/rondy/af1dee1d28c02e9a225ae55da2674a6f)
*   [45 分钟模拟面试(编程、系统设计)+职业发展建议 | 小赖子的英国生活和资讯](https://justyy.com/archives/65890)
*   [你的公司需要初级开发者](https://softwaredoug.com/blog/2024/09/07/your-team-needs-juniors)

#### B. 生产力与知识管理
*   [林云的马六甲XMA游记](https://linyun.craft.me/6nOmzcJzxGYW3l)
*   [关于 | Divio 文档](https://docs.divio.com/documentation-system/)
*   [精选数字花园/第二大脑的排名列表](https://github.com/lyz-code/best-of-digital-gardens?tab=readme-ov-file)
*   [计算机科学的第二大脑 | 工程洞见](https://notes.yxy.ninja/)
*   [Swyx 创意展示](https://www.swyx.io/ideas)
*   [关于 Yak Shaving (剃牦牛毛)](https://antfu.me/posts/about-yak-shaving-zh)
*   [如何破除写博客的焦虑 - 安全代码](https://www.usmacd.com/cn/write_blog_afraid/)
*   [知识管理的效率陷阱 - 安全代码](https://www.usmacd.com/cn/PKM_faults/)

#### C. 博客、思想领袖与阅读清单
*   [中文博客琅琊榜，只收录精品独立博客](https://github.com/qianguyihao/blog-list)
*   [独立开发产品变现周刊，每周五发布](https://github.com/ljinkai/weekly?tab=readme-ov-file)
*   [Skywind Inside - 写自己的代码，让别人猜去吧](https://skywind.me/blog/)
*   [每周收藏 16](https://www.edony.ink/private/weekly-collections-16/)
*   [帖子 | Vale.Rocks](https://vale.rocks/posts)
*   [Simon Willison: TIL (今天我学到了)](https://til.simonwillison.net/)
*   [程序员阅读清单：我喜欢的 100 篇技术文章（1-20） | Piglei](https://www.piglei.com/articles/programmer-reading-list-1/)
*   [实现者、解决者和发现者](https://rkoutnik.com/2016/04/21/implementers-solvers-and-finders.html)
*   [那些投递过阮一峰的作品](https://ruanyf.aolifu.org/)
*   [一个副业应用的开发心得](https://javayhu.com/2018-nian-yi-ge-xiao-fu-ye-de-kai-fa-xin-de/)
*   [每周精选文章 - BestBlogs.dev](https://www.bestblogs.dev/newsletter)
*   [订阅源 - BestBlogs.dev](https://www.bestblogs.dev/sources)
*   [工程博客聚合](https://engineeringblogs.xyz/)

### 八、工具、项目与资源

#### A. 开源项目与工具
*   [快速创建令人惊叹的博客封面图片](https://github.com/rutikwankhade/CoverView)
*   [Coverview - 为你的博客文章创建封面图片现在超级简单](https://coverview.vercel.app/editor)
*   [nicekate/qwen-tts 文本转语音项目](https://github.com/nicekate/qwen-tts)
*   [Apache Fluss: 为实时分析构建的流式存储](https://github.com/apache/fluss)
*   [低延迟编程研讨会演示文稿](https://github.com/maciekgajewski/LowLatencyProgrammingPresentation)
*   [点云压缩库](https://github.com/facontidavide/cloudini)
*   [一个使用 @antvis 生成可视化图表的模型上下文协议服务器](https://github.com/antvis/mcp-server-chart)
*   [Excalidraw 在线画图工具](https://excalidraw.com/)
*   [使用 LLM 平台总结和快速阅读 Telegram 消息](https://github.com/ShiFangJuMie/Telegram_Messages_Helper)
*   [TikZJax - 在网页上渲染LaTeX/TikZ图形](https://tikzjax.com/)
*   [一个使Wasm模块在轻量级虚拟机沙箱中运行的Rust库](https://github.com/hyperlight-dev/hyperlight-wasm)
*   [一个用于十亿级语料库的软、快速模式匹配器](https://github.com/softmatcha/softmatcha)
*   [SoftMatcha](https://softmatcha.github.io/)
*   [一个基于 NextJS + Cloudflare 技术栈构建的可爱消息推送服务](https://github.com/beilunyang/moepush)

#### B. 学习平台与社区
*   [领英企业服务](https://www.linkedin.cn/)
*   [LINUX DO - 新的理想型社区](https://linux.do/)
*   [欢迎来到 Rands 领导力 Slack](https://randsinrepose.com/welcome-to-rands-leadership-slack/)
*   [Goodreads | 遇见你的下一本最爱书](https://www.goodreads.com/)

#### C. 新闻、聚合器与社交媒体
*   [X 链接](https://x.com/ZHO_ZHO_ZHO/status/1958539464994959715?t=h7x3PNmRN8uhhE9mtWLJBA&s=09)
*   [象牙山刘能 在 X 上的讨论](https://x.com/disksing/status/1555444153588543488?t=qYBjGXvR3v9o0yOY_lxYeQ&s=09)
*   [Twitter | 书签 — 熊布朗（Peng.G）](https://me.deeptoai.com/bookmarks/twitter)
*   [Susan STEM 在 X 上的讨论](https://x.com/feltanimalworld/status/1932809547409711462)
*   [KIWI 在 X 上的分享](https://x.com/kiwiflysky/status/1928615865148170246?t=2zgR17qoPdPIPuMzLtKdYA&s=09)
*   [Mr Panda 在 X 上的讨论](https://x.com/PandaTalk8/status/1932373997796401322)
*   [Reddit 热门10篇文章](https://topsub.cc/)
*   [获取 Perplexity AI PRO 12个月 – 90%折扣 [限时抢购]](https://www.reddit.com/r/SaaSMarketing/comments/1l4426n/get_perplexity_ai_pro_for_12_months_90_off_flash/)
*   [企业网络设计、支持和讨论](https://www.reddit.com/r/networking/)
*   [《一切 DevOps》](https://www.reddit.com/r/devops/)
*   [r/SideProject - 分享副项目的社区](https://www.reddit.com/r/SideProject/)
*   [显示 | Hacker News](https://news.ycombinator.com/show)
*   [daily.dev | 开发者共同成长之地](https://app.daily.dev/?ua=true)

### 九、杂项文章与博客

#### A. 技术深度剖析与故事
*   [每个程序员都应该知道的数字（按年份）](https://colin-scott.github.io/personal_website/research/interactive_latency.html)
*   [周刊（第21期）：Lamport时钟介绍 | codedump notes](https://www.codedump.info/post/20220703-weekly-21/)
*   [周刊（第22期）：图解一致性模型](https://mp.weixin.qq.com/s/Wv8VWEq7GFz5hJQ_iOtqsw)
*   [周刊（第23期）：图解Blink-Tree：B+Tree的一种并发优化结构和算法](https://mp.weixin.qq.com/s/Yb6OcCoM_Hhc4U8ESTYVbg)
*   [周刊（第24期）：sqlite并发读写的演进之路](https://mp.weixin.qq.com/s/9Y1EfzM5cups9oklByAW5Q)
*   [给孩子的睡前故事：存储引擎](https://docs.google.com/presentation/d/14KkpQamsTSxhvliYUUXOGAQ_C61v0BHsefZ344HUGB8/mobilepresent?slide=id.p)
*   [选择的维度 | codedump notes](https://www.codedump.info/post/20210803-choice-dimension/)
*   [我与Canonical面试过程的经历](https://dustri.org/b/my-experience-with-canonicals-interview-process.html)
*   [软件工程是个面包机](https://drmingdrmer.github.io/tech/bla/2018/09/27/toaster.html)
*   [离开Mapbox 12年后的反思 | trash moon](https://trashmoon.com/blog/2022/reflections-on-12-years-at-mapbox/)
*   [从我离开的地方](https://antirez.com/news/144)
*   [软件开发者应该学习的10件事](https://cacm.acm.org/research/10-things-software-developers-should-learn-about-learning/)
*   [自由软件为谁而生？](https://tante.cc/2025/03/03/who-is-free-software-for/)

#### B. 商业与副业项目
*   [2025全新影视解说流量变现课 - A姐分享](https://www.ahhhhfs.com/72138/)
*   [锦时 · 产品工具箱：20+实用工具，助力产品经理高效工作 - A姐分享](https://www.ahhhhfs.com/72154/)
*   [关于你的点子](https://sideproject.guide/idea)
*   [如何致富](https://nav.al/rich)
*   [《我也有话要说 - 普通人的讲演技能》 · 千万别装](http://xiaolai.co/books/eba39b60cf1c0a10a097db8570d55b54/ch01.html)
*   [笑来搜](http://xiaolai.co/search)

#### C. 其他有趣链接
*   [从中医角度认识教师职业对人的消耗 - 小红书](https://www.xiaohongshu.com/explore/68416462000000000303d149)
*   [《Vibe Coding》教会你用AI写代码 必读神书 - 小红书](https://www.xiaohongshu.com/explore/680fbbea000000002002bfcd)
*   [人生的意义是什么？这是我听过最好的答案](https://mp.weixin.qq.com/s/3evxgF7amcXc7aTAqvxeuw?ref=edony.ink)
*   [怎样避免成为【喂养一线城市】的饲料 - 即刻App](https://m.okjike.com/originalPosts/67fdcdd94bfcd3978461ffbd?ref=edony.ink)
*   [原子能的个人空间-哔哩哔哩视频](https://space.bilibili.com/162183)
*   [【干货、万字长文】远不止B=MAP：《福格行为模型》到底讲了什么？ - 知乎](https://zhuanlan.zhihu.com/p/462990256)
*   [如何发现一个20岁时就值得投资的人](https://mp.weixin.qq.com/s/VgY-Lx_VDwccpXgsruWoRg)
*   [万言万当，不如一默 - 谢益辉](https://yihui.org/cn/2020/07/silence/)
*   [马斯克的哲学 - 安全代码](https://www.usmacd.com/cn/elon_philosophy/)
*   [当所有人都在卷大模型，他们在拆解原子级痛点 - 🍺 IceBeer](https://www.icebeer.top/%E5%BD%93%E6%89%80%E6%9C%89%E4%BA%BA%E9%83%BD%E5%9C%A8%E5%8D%B7%E5%A4%A7%E6%A8%A1%E5%9E%8B%EF%BC%8C%E4%BB%96%E4%BB%AC%E5%9C%A8%E6%8B%86%E8%A7%A3%E5%8E%9F%E5%AD%90%E7%BA%A7%E7%97%9B%E7%82%B9/)


<!--more-->