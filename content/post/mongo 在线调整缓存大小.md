---
title: 实战-mongo 在线调整缓存大小
tags:
  - 编程经验
  - 线上实战
date: 2024-02-18T18:18:03+08:00
draft: false
toc: true
slug: 20240418181803
feature:
---
记录线上解决 oom 问题
<!--more-->

由于之前的版本没有增加内存限制, mongo 会使用(节点内存-1)/2 内存用 cache, 于是造成了线上环境的 mongo, 内存一直在增加, 隔几天 oom 一次, 由于是副本集的模式, 所以暂时没有什么影响, 这里记录下当时的操作过程

admin 登录 mongo 查看当前 cache 大小
```bash
db.serverStatus().wiredTiger.cache['maximum bytes configured']/1024/1024/1024
# 13
```

设置 wiredTiger cache 大小

db.adminCommand( { "setParameter": 1, "wiredTigerEngineRuntimeConfig": "cache_size=8G"})


由于直接更改这个参数,并不能减少当前节点的内存占用, 这里还是需要重启节点, 好在这一节点是副本节点, 所以使用了最简单粗暴的方法

`kubectl delete pods mongodb-2`

重启后内存降低, 再看内存, 已经不会再涨了