---
title: 数据-redis 使用经验总结
tags:
  - 后端
  - redis
date: 2024-11-06T10:39:55+08:00
draft: false
toc: true
slug: 20241106103955
categories: 
---
# 记录工作中总结的 redis 相关知识
<!--more-->
## redis 底层数据接口对应关系

![image.png](https://img.yunpiao.site/ob/20230920094241.png)


## redis 如何保存数据
采用了哈希表来保存所有的键值对 一个哈希表对应了多个哈希桶 哈希桶中的entry元素中保存了*key和*value指针，分别指向了实际的键和值 通过链式冲突解决冲突

为了避免链式冲突解决方法上的不足 rehash ， 增加哈希桶数量
1. 两个 hash 操作， a 需要扩容， b 申请两倍的空间
2. a 重新映射并赋值拷贝
3. 释放 a 的空间

问题 复制的时候需要时间 可能会阻塞线程 无法服务请求


## 为什么采用 单线程
指的是 网络 io 和 键值对读写  持久化和集群数据是由额外的进程完成
避免并发带来的数据共享问题， redis 性能瓶颈不在于读写， 网络、cpu 才是瓶颈

6.0 引入多进程， 网络 io 到实际的读写还是单线程，但是网络性能提升， 性能瓶颈出现在了网络 io 上， 多 io 处理网络请求， 提高网络处理并行度， 但是读写命令还是单线程

## 为什么快
io 多路复用 并发处理客户端请求， 提升吞吐率
一个进程多个 io 流， select epoll 机制， 内核会一直监听多个套接字请求， 有请求到来， 交给 redis 处理
基于内存 操作迅速
底层数据结构 高效， 单进程 无竞争

## 重启后数据丢失问题
AOF RDB 
AOF 先执行命令 在写入内存 再记录日志

什么时候写入磁盘
![image.png](https://img.yunpiao.site/ob/20230920100522.png)

每条数据都会记录， 数据会越来越大， 

### AOF 重写机制 
主线程 fork 后台 bgrewriteof 
根据所有键值创建一个新的 AOF 文件， 
重写前 拷贝主线程内存 拷贝页表， 不影响主线程的情况下， 逐一拷贝数据到重写， 如果有新的写命令 先放入缓存区， 完成后写入日志

### RDB 快照
日志比较多的时候， 启动会比较慢， 全量快照， 两个命令生成， save 和 bgsave， 主线程中执行， 导致阻塞， bgsave， 子进程 避免阻塞， 
借用操作系统的写时复制， 快照期间还是可以正常写入， 

主要流程为：
- bgsave子进程是由主线程fork出来的，可以共享主线程的所有内存数据。
- bgsave子进程运行后，开始读取主线程的内存数据，并把它们写入RDB文件中。
- 如果主线程对这些数据都是读操作，例如A，那么主线程和bgsave子进程互不影响。
- 如果主线程需要修改一块数据，如C，这块数据会被复制一份，生成数据的副本，然主线程在这个副本上进行修改；bgsave子进程可以把原来的数据C写入RDB文件。

## 写时复制
>	通过 `fork()` 来创建一个子进程时，操作系统需要将父进程虚拟内存空间中的大部分内容全部复制到子进程中（主要是数据段、堆、栈；代码段共享）。这个操作不仅非常耗时，而且会浪费大量物理内存。引入了写时复制技术。内核不会复制进程的整个地址空间，而是只复制其页表，`fork` 之后的父子进程的地址空间指向同样的物理内存页 然而只要有一个进程试图写入共享区域的某个页面，那么就会为这个进程创建该页面的一个新副本。写时复制技术将内存页的复制延迟到第一次写入时，更重要的是，在很多情况下不需要复制。这节省了大量时间，充分使用了稀有的物理内存。
> 原理
	`fork()` 之后，内核会把父进程的所有内存页都标记为**只读**。一旦其中一个进程尝试写入某个内存页，就会触发一个保护故障（缺页异常），此时会陷入内核。
	内核将拦截写入，并为尝试写入的进程创建这个页面的一个**新副本**，恢复这个页面的**可写权限**，然后重新执行这个写操作，这时就可以正常执行了。
 内存页本来被父子进程应用， 两个引用， 创建新副本后， 引用 -1 ， 如果页面只有一个引用， 则直接修改数据

### 优缺点
优点：减少不必要的资源分配，节省宝贵的物理内存。
缺点：如果在子进程存在期间发生了大量写操作，那么会频繁地产生页面错误，不断陷入内核，复制页面。这反而会降低效率。

> golang 中也有这样的使用， string，array 也是写时复制
快照全量有压力，Redis采用了增量快照，在做一次全量快照后，后续的快照只对修改的数据进行记录，需要记住哪些数据被修改了
在Redis4.0提出了混合使用AOF和RDB快照的方法，也就是两次RDB快照期间的所有命令操作由AOF日志文件进行记录。这样的好处是RDB快照不需要很频繁的执行，可以避免频繁fork对主线程的影响，而且AOF日志也只记录两次快照期间的操作，不用记录所有操作，

##  混合持久化
    - 在Redis 4.0及以上版本中，可以同时使用RDB和AOF进行持久化。
    - **优化**:
        - 结合RDB的快速启动和AOF的数据完整性优势。
        - 在发生故障时，可以使用RDB快速恢复大部分数据，然后使用AOF重放最近的写入操作。
## redis 数据同步
第一次数据同步， 发送 rdb 文件
级联的“主-从-从”模式
手动选择一个从库，用来同步其他从库的数据，以减少主库生成RDB文件和传输RDB文件的压力；
这样从库就可以知道在进行数据同步的时候，不需要和主库直接交互，只需要和选择的从库进行写操作同步就可以了，从而减少主库的压力
## redis 的增量同步
在 redis 中 .offsetrepl_backlog_buffer是一个环形的缓冲区，如果从库断开时间太长导致自己的offset被覆盖了，就只能再次全量同步了。
全量同步是自动的
### **数据一致性问题**
当从服务器已经完成和主服务的数据同步之后，再新增的命令会以异步的方式发送至从服务器，在这个过程中主从同步会有短暂的数据不一致，如在这个异步同步发生之前主服务器宕机了，会造成数据不一致。


## redis 事务
使用 lua 脚本是简单直接的方法, 但是用户程序中需要对 lua 脚本进行校验, 避免出现注入的情况
正常方式是使用
- MULTI 开启
- EXEC commit
- WATCH 查看是否变更, 变更事务会打断
- DISCARD 取消事务
- UNWATCH 取消所有监视

> 注意 事务中的命令 redis 都会执行, 不管对错, Redis 不会停止命令的处理
> 注意 redis 不算满足了原子性

## 大 key 问题
`redis-cli -h b.redis -p 1959 --bigkeys` 使用该命令查看都有哪些大 key , 程序频繁请求大 key 会出现问题, 一个是内存问题, 一个是网络问题, 同时会阻塞其他请求, 这种大 key 需要尽量避免, 防止出现问题, 可以通过加 lru 或者拆分去解决


## redis 的高可用
常用的有 
redis cluster, 好像问题较多, 没有具体使用过
twemproxy 不算集群方案, 属于前置加了一层 hash 分片处理
哨兵模式, 客户端程序容易出问题, 主从切换的时候, 客户端需要及时切换, 不是所有客户端都支持, 可以把这一层切换到 haproxy 中去执行, 其他客户端直联 haproxy, 故障后 haproxy 自动切换连接的 redis

## 哨兵模式下的从服务器只读性
默认在情况下，处于复制模式的主服务器既可以执行写操作也可以执行读操作，而从服务器则只能执行读操作。

可以在从服务器上执行 `config set replica-read-only no` 命令，使从服务器开启写模式，但需要注意以下几点：
-   在从服务器上写的数据不会同步到主服务器；
-   当键值相同时主服务器上的数据可以覆盖从服务器；
-   在进行完整数据同步时，从服务器数据会被清空。

## redis 哨兵模式的风险点
 1. 三个节点请情况下, 哨兵挂了两个， 也会有问题，是指至少两个哨兵认为需要切换才切换主备， 则两台哨兵挂了 则不会切换
 2. redis 哨兵模式， 三个机器全量数据， 数据过多则会消耗内存

## redis scan
scan 如何实现的, 参考: https://my.oschina.net/liboware/blog/5371977
生产环境用 scan 禁止 keys
### scan 用法
```lua
local cursor = "0"  -- 初始化游标
repeat
    -- 扫描匹配的键
    local resp = redis.call('SCAN', cursor, 'MATCH', 'authToken*', 'COUNT', 10000) -- count 表示 hash 槽遍历的数量, 不是返回的 key 的数量
    cursor = tonumber(resp[1])  -- 获取新的游标
    local dataList = resp[2]  -- 获取扫描到的键

    -- 遍历所有符合条件的键
    for i = 1, #dataList do
        local d = dataList[i]
        local ttl = redis.call('TTL', d)

        -- 如果 TTL 为 -1（没有过期时间），则删除该键
        if ttl == -1 then
            redis.call('DEL', d)
        end
    end
until cursor == 0  -- 如果游标为 0，表示扫描完成

return 'all finished'
```

## redis 删除大 key
1. 逐渐删除, 使用 hscan 等小批量删除
2. 使用 unlink , 异步删除
## redis 压测

```bash
redis  和 tewmproxy 极限性能
redis-benchmark -h node -p 8985 -t set,lpush -n 10000 -q
redis-benchmark -h node -p 8985 -t set, INCR, hincrby,expireat -n 300000 -q
redis-benchmark -h node -p 8985 -n 100000 -q script load "redis.call('hincrby','foo','foo','1') redis.call('expire','foo',10)"
redis-benchmark -h node -p 8099 -t set,lpush -n 10000 -q
redis-benchmark -s ./twemproxy/data/yjsv5-rate-limit-twemproxy.sock -t set,lpush -n 10000 -q
redis-benchmark  -s ./twemproxy/data/yjsv5-rate-limit-twemproxy.sock -n 100000 -q script load "redis.call('hincrby','foo','foo','1') redis.call('expire','foo',10)"
```

## redis 内部过期策略
1. 每次访问 key 检查是否过期
2. 启动时注册定期函数, 每周期循环 随机获取一批 key 检查是否过期

## redis 的 rehash 机制
Redis 的 rehash 过程是为了扩展或收缩哈希表，以保持高效的查找、插入和删除操作。为了避免一次性 rehash 带来的性能开销，Redis 采用渐进式 rehash
 redis 还在处理请求 每处理一次请求 将该 entry 拷贝到 b hash ， 为了避免一直没有请求 周期性的搬移一些数据到 hash b

### 1. 触发 rehash
rehash 通常在以下两种情况下触发：
1. **哈希表负载因子过高**：哈希表中的键值对数量接近或超过哈希表容量。
2. **哈希表负载因子过低**：在大量键值对被删除后，哈希表的利用率下降到一定程度。
### 2. 哈希表结构
在 Redis 中，每个 `dict`（字典）包含两个哈希表实例 `ht[0]` 和 `ht[1]`，rehash 过程中会使用这两个哈希表：
- `ht[0]`：现有的哈希表。
- `ht[1]`：rehash 过程中使用的新哈希表。
### 3. 渐进式 rehash 过程
渐进式 rehash 通过在常规操作（如插入、删除、查找）中逐步迁移键值对，以避免一次性 rehash 导致的性能抖动。


## redigo  并发使用
不使用连接池的话 redigo 并发（redigo 执行 Do Send 命令的时候不能并发）下会 redis conn 出错断开。


## redis 问题排查

**info Clients**
-   connected_clients  当前正在连接数量
**redis 抓包**
```
sudo tcpdump -i any tcp and port 6379 -n -nn -s0 -tttt -w redis.cap
```
**查看当前连接**
```
redis-cli  -a "password"  CLIENT LIST|grep -v watch | sort -t " " -k 1
netstat -na | grep 6379 | grep TIME_WAIT | wc -l
```

**空闲连接 自动断开时间**
```bash
config get timeout
config set timeout 600
```

