---
title: 经验-windows 下权限 ace 的限制
tags:
  - 编程经验
date: 2025-05-23T15:10:24+08:00
draft: false
toc: true
slug: 20250523151024
categories:
---
# 1. 问题
当 一个对象设置 dacl (1. DACL 定义了"谁"可以对资源做"什么"操作) 的时候, 出现参数错误

# 分析

> https://learn.microsoft.com/en-us/troubleshoot/windows-server/windows-security/error-add-user-to-security-permissions

当达到访问控制列表 (ACL) 的最大大小时，就会出现这个问题。ACL 的大小随访问控制条目 (ACE) 的数量和大小而变化。ACL 的最大大小为 64 KB，即大约 1 820 个 ACE。不过，出于性能考虑，最大大小并不实用。
命令将返回 `> The parameter is incorrect.`
# 修复
使用 `dsacls "CN=Deleted Objects,DC=a,DC=com" /resetDefaultDACL` 将 dacl 恢复, 就会正常, 同时之前的数据也会丢失, 但功能正常了

# 优化
在设置 dacl 的时候, 之前的账户可以使用 `dsacls "CN=Deleted Objects,DC=a,DC=com" /r a/user`  删除 user 用户的权限, 防止用户被删除了, 这个数据项还在, 一直累计, 导致最终超过大小限制

# 反思
在一个系统中, 如果一个资源最终会被删除, 则应当设计完整的清理策略, 即对任意一个可能造成持久化的操作都应该配备相应的删除策略
<!--more-->