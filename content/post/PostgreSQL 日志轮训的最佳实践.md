---
title: PostgreSQL 日志轮训的最佳实践
tags:
  - "#运维经验"
date: 2025-05-15T17:39:13+08:00
draft: false
toc: true
slug: 20250515173913
categories:
---
- 文件变量名用作日志轮转时进行清理历史文件的作用, 比如 ‘postgresql-%H.log’ 每小时一个文件, 第二天会对前一天的日志进行覆盖
- 日志轮转时机可以配置根据时间和大小, log_rotation_age log_rotation_size 参数
- log_truncate_on_rotation 仅对“时间轮转”有效，新的同名文件会覆盖旧文件, 用于清理旧日志
- 这种限制理论最大文件数量限制将会是 log_rotation_age * 文件名循环中的一个环中的文件数
- 这种方法不完美, 没有办法硬限制, 最优方案是使用 logrotate  优化表达, 注意还是原格式, 只修改少量词语
## logrotate 限制日志大小的 6 个关键指令

| 指令                       | 版本   | 作用                      | 常见写法         |
| ------------------------ | ---- | ----------------------- | ------------ |
| size \<N\>               | 所有   | 当当前文件 ≥ N 时立即轮转         | size 100M    |
| maxsize \<N\>            | ≥3.8 | 若文件 ≥ N 则轮转，否则即使到周期也不轮转 | maxsize 500M |
| minsize \<N\>            | ≥3.8 | 文件 ≥ N 且到周期才轮转          | minsize 20M  |
| rotate \<N\>             | 所有   | 仅保留 N 份旧日志（配合压缩可近似控制总量） | rotate 7     |
| maxage \<N\>             | 所有   | 旧日志达 N 天即淘汰             | maxage 30    |
| compress / delaycompress | 所有   | 压缩旧档、延迟一天再压缩            | compress     |
> size 与 maxsize 的区别：
> • size 触发轮转后，接下来仍按周期继续；
> • maxsize 触发轮转后，会重置周期计时，直到再次满足 maxsize 或到下次周期。
PostgreSQL 日志的推荐模板（单文件 ≤100 MB，总量 ≈2.4 GB/天）


## 配置示例
```bash
/var/log/pg_log/postgresql-*.log {
    daily                  # 每天检查一次
    size 100M              # 单文件 ≥100 MB 就轮转
    rotate 24              # 最多保留 24 份（≈1 天内文件）
    compress               # 旧日志 gzip
    delaycompress          # 延迟一天再压缩，便于排查
    dateext                # 追加时间戳防止重名
    missingok              # 无日志也不报错
    notifempty             # 空文件不轮转
    su postgres postgres   # 切换用户，保持属主
    postrotate
        /usr/bin/pg_ctl -D /storage/db/vpostgres reload
    endscript
}

```

**效果**

硬约束：任何单个日志不超过 100 MB。
软约束：若日志写入 <100 MB/小时，则一天 ≤2.4 GB；峰值高于 100 MB/小时时可能略超，但依旧可控。
24 份之外的文件自动删除；配合 compress 实际磁盘占用更小。




<!--more-->