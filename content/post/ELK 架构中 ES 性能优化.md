---
title: ELK 架构中 ES 性能优化
tags:
  - elastic
  - 性能优化
date: 2024-08-28T13:38:44+08:00
draft: false
toc: true
slug: 20240828133844
feature: 
categories:
  - 杂技浅尝
---
## 1. 背景

由于目前日志采集流程中, 经常遇到用户磁盘 IO 占用超过 90% 以上的场景, 但是观察其日志量大约在 2k~5k 之间, 整体数据量不大, 所以针对该问题进行了一系列的压测和实验验证,最后得出这篇优化建议文档

<!--more-->

## 2. 压测前期准备
### 2.1 制造大量日志
该阶段为数据源输入阶段, 为了避免瓶颈在数据制造侧, 所以需要保证 filebeat 具有足够的日志制造能力
最后效果, filebeat 可以达到 70k QPS 的数据发往logstash . (真实数据可以更高, 70k qps 是因为目前单实例 logstash 的 CPU 计算瓶颈, logstash 配置的 output 为空的情况下)

### 2.2 logstash 侧降低副本, 调整资源限制
Logstash 主要是 cpu 密集型服务, 数据传输到 es 的时候为了观察方便, 设置 logstash 副本数为 1, 并将 cpu 的 limit 开放到 12 core. 同时为了避免影响到 es, 将 该单实例 logstash 部署到 master 节点
**验证性能方案**
不断调节 logstash 配置, 找出性能消耗较大的配置项
### 2.3 es 侧配置等保持不变
根据之前的推断, 磁盘 io 主要由于 es index 写入进行的消耗, 所以 es 是本次调节的重点, 暂时保持配置不变, 在验证过程中不断调节 es 配置
### 2.4 其他调整
1. 其他无关服务关闭, 卸载 mongo, Redis .  等无关服务
## 3. 压测步骤
1. 关闭 logstash 到 es 的输出, 通过 logstash 的 metrics 观察不同配置对 logstash 处理能力的影响
2. Logstash 配置不变情况下, 调节 es index 生命周期策略等配置, 通过 es 的 metrics 观察不同配置对 doc 数量和 磁盘 io 的影响
## 4. 优化建议
### 4.1 logstash 优化
#### 4.1.1 删除 logstsh 大量字段删除操作, 移动到 filebeat 侧进行 
mutate remove_field 处理消耗大量 cpu, 可以将部分操作移动到 filebeat 中
#### 4.1.2 优化 logstash 配置参数, 提升每批次处理量 (优先)

```bash
pipeline.batch.size: 500
pipeline.batch.delay: 200
```
空间换时间, 内存会有小幅上升, 但是会提升 cpu 处理效率

#### 4.1.3 优化 if else 处理逻辑(暂缓)
由于 logstash 没有 switch 等语句, 只能嵌套多个 if else. 所以可以将中日志频率高的 event code 放在前面
#### 4.1.4 使用 logstash pipeline, 避免多个数据源的相互影响(暂缓)
Logstash 提供了 logstash pipeline 机制, 避免 filter 之间的相互影响
参考: https://www.elastic.co/guide/en/logstash/current/configuration.html
### 4.2 es 优化
#### 4.2.1 index segment分段设置 等参数优化 (优先)
索引模版增加 合并相关参数
```json
{
  "index": {
    "codec": "best_compression", 
    "mapping": {
      "total_fields": {
        "limit": "10000"
      }
    },
    "refresh_interval": "30s",
    "translog": {
      "flush_threshold_size": "512mb",
      "sync_interval": "10s",
      "durability": "async"
    },
    "merge": {
      "scheduler": {
        "max_thread_count": "1"
      },
      "policy": {
        "floor_segment": "2mb",
        "max_merge_at_once": "5",
        "max_merged_segment": "5gb"
      }
    }
  }
}
```

将各个索引模版增加以上参数, 各参数解释
- "codec": "best_compression",  // 使用最佳压缩方式, 节省磁盘和 io 性能, 会稍微影响读取性能, 但是目前场景为写多读少
-  "refresh_interval": "30s",  // 增加刷新间隔, 避免频繁刷新, 占用磁盘 io, 数据最大 30s 后可被检索
-  "translog.flush_threshold_size": "128mb", // 设置事务日志（translog）达到多大时进行刷新（flush）
-  "translog.sync_interval": "10s",// 定事务日志同步到磁盘的频率, 10s 内的数据可能在宕机时候丢失
-  "translog.durability": "async", // async 表示异步持久化，事务日志不会立即同步到磁盘，而是根据 translog.sync_interval 的设置进行同步
-  "merge.scheduler.max_thread_count": 1, // 较高的线程数可以加快合并速度，但也会增加磁盘 IO。设置为 1 表示只使用一个线程进行合并
-  "merge.policy.floor_segment": "2mb", // 小于此大小的段将被优先合并，以减少段的数量并提高查询性能。
-  "merge.policy.max_merge_at_once": "5",  // 较高的值可以减少段的数量，但也会增加合并操作的 I/O 负载
-  "merge.policy.max_merged_segment": "5gb"  // 较大的段可以减少段的数量，但也会增加单个段的大小，可能影响查询性能。
#### 4.2.2 生命周期策略关闭强制合并 (优先)
关闭强制合并, 避免在 index 读写较高时, 进行合并操作, 可以在空闲时段离线进行合并操作

#### 4.2.3 增加温阶段, 在温阶段中, 合并 segement 和降低副本数(暂缓)
将临近删除的数据, 增加温阶段, 合并 segement 和降低副本数, 以此达到降低磁盘使用量的目的

## 5. 最终效果

硬盘: 机械硬盘, vmware 虚拟盘
Logstash 配置: 单实例 12 核 8g
ES data 配置: 双实例 12 核 8g
极限情况下(磁盘 io 成为瓶颈的情况下)
峰值: 12k qps
平均值: 9k qps

**收益**
优化前 峰值 5k qps
优化后 峰值 12k qps

## 6.  关于这次优化的问题解答
1. 为什么之前 io 负载高
	1. 频繁的 merge 造成, io 进程多, 同时还有强制合并
2. 为什么 logstash 内存高
	1. jvm 直接占用内存, 不是实际使用的内存
	2. 实际要看 jvm 内的指标量
3. 什么是 segement, 为什么要合并, 什么时候合并
	1.  Elasticsearch 中，段是一个倒排索引的基本单元
	2. es 会自动和手动合并 segement
	3. segement 不变, 只能被合并, 合并可以通过参数调节
	4.- 数据首先写入内存缓冲区，然后定期刷新到新的段中
	5. 分配和段的管理是由底层的 Lucene 库自动处理的
4. ingest 是什么, pipeline 是做什么的
	1. 用于在数据被索引之前对其进行预处理, 与处理数据用的
	2. pipeline 是一系列处理器（processors）的集合

## 7. 最佳实践
- 尽量批量发送数据到 Elasticsearch。
- 数据预处理尽可能在数据产生侧完成。
- 每个 Elasticsearch shard 的建议大小为 50GB。
- 不重要的数据可不保留副本。
- Elasticsearch 的 segment 合并会严重占用磁盘 IO，对于不需要实时处理的数据，可以减缓合并频率。
- Logstash 是 CPU 密集型应用，一般不需要大量内存。
- Filebeat 功能强大，可以处理一些数据缓存等任务。








