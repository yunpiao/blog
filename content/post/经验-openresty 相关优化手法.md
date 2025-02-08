---
title: 经验-openresty 相关优化手法
tags:
  - 编程经验
  - lua
date: 2025-02-08T15:09:56+08:00
draft: false
toc: true
slug: 20250208150956
categories:
---
## 1. LUA 层面
### 1.1 尽量使用局部变量, 减少垃圾回收开销
- `local var = value` 替代 `var = value` 
-  外部函数在包初始化的时候直接 `local a = c.a`
### 1.2 使用 table.concat 而不是 .. 字符串拼接
`table.concat({"a", "b", "c"}, "")`
### 1.3 预编译正则表达式
`local re = ngx.re.compile("pattern")`。
### 1.4 确定重复数据的域
将全局可以用到的保存为全局变量, 在初始化的时候加载好, 并确定好最方便查找的结构, 如 ip 地址库
### 1.5 在耗时函数上加一层缓存
如计算 hash 函数, 或者 json decode 后的对象, 空间换时间
### 1.6 使用 LuaJIT FFI 
openresty lua-resty-core 计划使用 ffi 完全替换掉之前的 nginx-lua-module, 性能会有所提升
### 1.7 采样执行一些不重要的函数
如打印错误日志, 当逾期错误日志会频繁打印, 增加一层限制, 固定 100/秒等策略
### 1.8 非必要不 io
不要轻易读写文件和网络, 除非必要, 数据可以缓存本地一份就缓存本地, 不要任何请求都缓存 redis
### 1.9 异步化操作
如有功能耗时严重, 可以异步请求, 如异步写入日志, 异步请求 redis
### 1.10 压缩数据, 批次执行, 适当增大 buffer
批次是效果最好的优化手段, 发送数据或者执行逻辑, 如果能够批次尽量批次执行
### 1.11 lua 有 JIT, 可以即使编译,使用 pcre_jit
函数中尽量不要有 pcall 等无法 JIT 的操作
### 1.12 cosocket 非阻塞 io

### 1.13 使用 ECC 证书而不是 RSA
压测发现, RCC 证书比 RSA 具有更好的性能
### 1.14 发现攻击, 尽早关闭
ngx.exit(444)  连接数多 直接 RST, 缺点没有日志记录

## 2. Nginx 层面 
### 2.1 参数优化
```
worker_processes auto;             # 匹配 CPU 核心数
worker_rlimit_nofile 102400;       # 提高文件描述符限制
events {
    worker_connections 20480;      # 根据系统最大 fd 调整
    use epoll;                     # 高并发场景使用 epoll
}
lua_shared_dict my_cache 100m;     # 缓存配置、限流计数器等
keepalive_timeout 60;              # 保持长连接
client_header_timeout 15s;         # 避免慢客户端攻击
proxy_buffers 8 16k;               # 减少磁盘 IO 使用
sendfile on;                       # 零拷贝传输静态文件
tcp_nopush on;                     # 合并数据包发送
gzip on;                           # 对文本内容启用压缩

```

## 3. Linux 层面
### 3.1 系统参数
```
# 调整 TCP 参数
sysctl -w net.core.somaxconn=65535
sysctl -w net.ipv4.tcp_tw_reuse=1
sysctl -w net.ipv4.tcp_fin_timeout=30
ulimit -n 102400                   # 修改 Nginx 进程的 fd 限制
# 使用大页内存（需 Nginx 支持）
sysctl -w vm.nr_hugepages=1024
# 调整磁盘调度策略（SSD 推荐 noop）
echo noop > /sys/block/sda/queue/scheduler
```

## 4. 监控与分析
- 火焰图 [SystemTap](https://github.com/openresty/openresty-systemtap-toolkit) 分析 Lua/C 代码瓶颈。
- **Lua 内存分析**：`collectgarbage("count")` 监控内存泄漏。
- 压测工具 [wrk](https://github.com/wg/wrk) 
- 指标监控 [prometheus](https://github.com/knyar/nginx-lua-prometheus)
