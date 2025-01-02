---
title: 实战-mongo 从单个副本修复整个副本集
tags:
  - mongo
date: 2024-07-10T17:07:29+08:00
draft: false
toc: true
slug: 20240710170729
feature:
---
## 背景

Mongo 目前部署方式为三个 mongo data 节点, 一个选举节点, 目前可以容忍四个 pod 中一个 pod 异常后, 服务仍然可以正常运行(原因: 至少三个节点投票才能选举主节点), 但是如果出现有两台 pod 异常后, 整个服务将不可用, 本文档用于记录如何从剩余的一或者两个可用的mongo 节点恢复整个 mongo 集群

  

## 情境说明, 以 mongodb-0 mongodb-2 异常为例

**情境描述**

mongodb-0 mongodb-2 由于各种原因, 已经不可正常服务

原因包括

- Oplog 相差太大, 需要数天时间才能追上现有数据
    
- 节点 pvc 异常
    
- Mongo 卸载后, 重新安装时候先启动 mongo 0, 但是 mongo 0 一直在 oplog 修复数据
    
- Mongo 重新安装, mongo 0 的 pvc 删除后, mongo 0 优先启动, mongo 0 自己选举自己为了 master 节点, 后续启动节点与 mongo 0 分裂为了两个集群
    

  

## 修复步骤 1. 将异常节点 pod 删除, 暂时不启动该节点

因为 pod 不支持临时停止, 临时设置定时脚本强制删除 pod

可以使用 tmux 启动两个 shell ,执行

```Bash

# 每隔0.1s 执行一次删除命令
watch -n 0.1 kubectl delete pods mongodb-0 --force
watch -n 0.1 kubectl delete pods mongodb-2 --force 
```

新启动一个 shell , 删除 pvc, 可以避免启动时候读取 pvc

```Bash
kubectl delete pvc datadir-mongodb-0
kubectl delete pvc datadir-mongodb-2
```

  

## 修复步骤 2. 登录可以正常启动节点 pod, 更新 mongo 副本集配置

登录 mongo 正常节点

```Bash
# 登录正常 pod, mongodb-1 为例, 仅存的正常节点
kubectl exec -it mongodb-1 bash

# 登录 mongo root 账户
mongo -u root -p 4NXcr1rv3zwCsxLugLDw60i8R
```

登录后, 大概率会看到当前节点不是主节点, 是从节点

rs0:SECONDARY>

  

执行下面指令, 修复 mongo

```Bash
# 获取配置
var config = rs.conf()

## 删除不可用节点,删除的原因,  默认情况下需要三个节点投票才能成为主节点, 由于目前健康节点最多是 2 个, 所需需要更新选举为主节点的投票阈值
## 删除后, 投票阈值会变成 2, 会选举出该正常节点为主节点, 后续新加节点, 将从这个节点进行同步数据
config.members = config.members.filter(member => member.host !== "mongodb-0.mongodb-headless.itdr.svc.cluster.local:27017")
config.members = config.members.filter(member => member.host !== "mongodb-2.mongodb-headless.itdr.svc.cluster.local:27017")

## 强制更新配置
rs.reconfig(config, {force: true})

# 查看是否重新选举当前的节点为主节点
rs.status()
```

## 修复步骤 3. 重建异常节点

将修复步骤 1 , 一直循环删除 pod 的命令停止, ctrl + c 停止

等改 mongodb-0 mongodb-2 pod 新建成功, pod 新建后, 由于没有 pvc, 会新建 pvc. Pvc 为空之后, mongo pod 会按照新加副本节的流程加入 mongo 集群, 查看是否重建完成
<!--more-->