---
title: 解决 mac 无法被 ssh 免密登录问题
tags: 远程登录, 免密登录, 主目录权限
date: 2024-04-12T10:39:46+08:00
draft: false
hideInList: false
isTop: true
feature: 
toc: true
slug: solve-mac-unable-to-ssh-passwordless-login-issue
datetime: 2024-07-03 20:52
summary: 远程登录加中的mac mini时出现了免密登录的问题, 在执行ssh-copy-id命令后仍然需要输入密码, 经过排查发现是被登录的mac主目录权限不正确导致无法读取authentication文件, 解决方法是修改主目录权限为755.
cover_image_url: ""
---


今天遇到的问题, 我远程登录加中的 mac mini, 虽然有密码管理器, 但是还是没有免密登录快捷. 所以设置免密登录出现了问题, 这里做下记录
<!--more-->

## 现象
`ssh-copy-id a@itx` 执行成功后, 发现执行成功后, 还是需要输入密码
报错如下

```bash
debug1: Next authentication method: publickey
debug1: Offering public key: /Users/xxx/.ssh/id_rsa RSA SHA256:l9F/xxxxx
debug1: Authentications that can continue: publickey,password,keyboard-interactive
```

## 分析
client 端检查咩什么问题, 文件也正确, 所以去服务端排查, 查看 sshd 日志输出, 检查发现
```
Authentication refused: bad ownership or modes for directory /Users/xxx
```

所以, 看起来是由于被登录的 mac 主目录权限不正确, 导致么有读取到 authenticationed file 的原因

## 解决
知道问题后, 一切都迎刃而解
神之一手 

```bash
chmod 755 ~
```