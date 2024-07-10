---
title: golang max proc 默认设置在 k8s 中的坑
tags: Kubernetes, Golang, CPU context switching
date: 2024-06-05T15:29:41+08:00
draft: false
toc: true
slug: golang-max-proc-default-setting-in-k8s-pit
feature: 
datetime: 2024-07-03 20:47
summary: In a Kubernetes (k8s) pod, a Golang program's P (processor) count is determined by the number of cores on the physical machine, causing high CPU context switching. By using the 'go.uber.org/automaxprocs' library, this issue can be resolved by automatically setting the maximum P count based on container limits.
cover_image_url: ""
---

<!--more-->

## 问题
对于在物理机上, golang 程序对于 GMP 中 P 的数量是由 cpu 的核心数来确定的, 但是这种行为在 k8s pod 中会出现问题,  pod 中一般会设置 pod 的 limit 信息, 距离 一个 pods 的最大 cpu 使用量为 4 个核心, 但是由于这台物理机是 16 核的, 所以在 GMP 初始化的时候, P 的数量会变成 16. 

这种异常会对 cpu 密集的应用程序造成大量的 cpu 切换成本. 

pod 资源配置
```yaml
    Limits:
      cpu:     4
      memory:  8Gi
    Requests:
      cpu:        500m
      memory:     500Mi
```

测试使用 golang 运行得到的 GOMAXPROCS 参数, 这里发现是 16, 而不是 pod 上的 4
```bash
/tmp # ./t1
GOMAXPROCS: 16
```

## 解决
这种常见问题, 一般都有现成的方案

```
	_ "go.uber.org/automaxprocs" // 根据容器配额设置 maxprocs
```

在 main 函数中引入该库就可以解决该问题, 

## 分析

该库使用 `/proc/$PID/cgroup` 这个文件解析当前的 cpu 信息, 再通过该信息设置最大 P 数量. 

研发同学在进行云原生或者微服务改造的时候, 如果对于 k8s 机制不了解, 是不会进行以上修改的, 甚至如果没有分析过性能, 问题都发现不了. 所以我这边始终认为研发和运维不应该太割裂, 研发应该具备基本的运维能力, 且对于自身服务部署的环境相当熟悉. 