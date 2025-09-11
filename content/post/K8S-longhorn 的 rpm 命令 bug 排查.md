---
title: K8S-longhorn 的 rpm 命令 bug 排查
tags:
  - k8s
  - Longhorn
  - 问题排查
date: 2025-09-11T11:24:56+08:00
draft: false
toc: true
slug: 20250911112456
categories:
---
>  怎么稀奇古怪的问题都被我遇到啊 😧
### 一、现象：诡异的内存增长

最近，观察到一个奇怪的现象：在用户私有化部署环境中, `longhorn-manager` pod 所在的节点内存使用率会持续飙升，最终达到 100%，导致节点和 `longhorn-manager` 本身无响应。

通过 `top` 和 `ps` 等工具深入排查，发现节点上出现了大量的 `rpm -q iscsi-initiator-utils` 进程。这些进程不断累积，似乎在等待某个锁或资源，最终耗尽了所有可用内存。

从 `longhorn-manager` 的日志中，可以看到类似以下的错误信息，显示 `rpm` 命令执行超时或失败，并伴随着数据库损坏的错误。

```log
time="2024-12-19T12:35:56Z" level=debug msg="Package nfs-utils is not found in node xxx" func="controller.(*NodeController).syncPackagesInstalled" file="node_controller.go:997" controller=longhorn-node error="failed to execute: /usr/bin/nsenter [nsenter --mount=/host/proc/3013255/ns/mnt --net=/host/proc/3013255/ns/net rpm -q nfs-utils], output package nfs-utils is not installed\n, stderr error: rpmdb: BDB0113 Thread/process 667765/140606332983168 failed: BDB1507 Thread died in Berkeley DB library\nerror: db5 error(-30973) from dbenv->failchk: BDB0087 DB_RUNRECOVERY: Fatal error, run database recovery\nerror: cannot open Packages index using db5 - (-30973)\nerror: cannot open Packages database in /var/lib/rpm\nerror: rpmdb: BDB0113 Thread/process 667765/140606332983168 failed: BDB1507 Thread died in Berkeley DB library\nerror: db5 error(-30973) from dbenv->failchk: BDB0087 DB_RUNRECOVERY: Fatal error, run database recovery\nerror: cannot open Packages index using db5 - (-30973)\nerror: cannot open Packages database in /var/lib/rpm\n: exit status 1" node=xxx
```

显然，`longhorn-manager` 正在持续、高频地调用 `rpm -q` 来检查软件包的安装状态，而这个操作在高并发下导致了宿主机的 RPM 数据库损坏和进程挂起。

### 二、排查：追根溯源

问题的关键在于定位 `longhorn-manager` 为何如此频繁地执行 `rpm` 查询。

通过分析 GitHub 上的相关 Issue 和社区讨论，发现 Longhorn 的 `node_controller` 中有一个名为 `syncPackagesInstalled` 的环境检查函数。 这个函数的设计初衷是定期确认每个节点上是否安装了 Longhorn 运行所必需的依赖包，例如 `iscsi-initiator-utils`, `nfs-utils`, `cryptsetup` 等。

在之前的版本中，它的实现方式是直接调用宿主机系统的包管理器（如 `rpm` 或 `dpkg`）来查询包是否存在。 这种方式虽然直接，但存在几个致命缺陷：

1.  **性能开销大**：每次查询都需要与包管理器的数据库进行交互，这是一个相对较重的操作。
2.  **锁竞争**：当 `longhorn-manager` 高频发起检查，或者宿主机上同时有其他进程（如 `dnf-automatic`）在操作 RPM 数据库时，很容易引发锁竞争，导致进程挂起。
3.  **可靠性差**：一旦 RPM 数据库因任何原因出现问题，这种检查机制就会完全失效，并可能加剧数据库的损坏，形成恶性循环。

在的案例中，正是这种“重量级”的检查机制，导致了大量 `rpm` 进程堆积，最终耗尽系统资源。

### 三、原因：不恰当的依赖检查方式

根本原因在于 Longhorn 使用了一种不恰当的方式来验证依赖项的可用性。

Longhorn 实际上关心的不是“软件包是否被 RPM 数据库记录为已安装”，而是“其功能所需的二进制文件是否存在且可执行”。例如，它需要的是 `iscsiadm` 这个命令，而不是 `iscsi-initiator-utils` 这个包名本身。

直接查询包管理器是一种间接且脆弱的验证方法。更健壮、更轻量的方式应该是直接检查所需命令是否存在于系统的 `PATH` 中。

还有其他原因
longhorn 里面没有设置默认的资源限制, 私有化部署的时候也没有限制, 倒是一个 pod 打垮一个节点
rpm 的问题, rpm 的调用并不是特别高频, 可以 rpm 的 db 出现了问题, rpm 太脆弱

### 四、社区解决办法：从“查包”到“查命令”

社区和开发人员也意识到了这个问题，并迅速给出了解决方案。在最新的代码提交中，Longhorn 彻底改变了依赖检查的逻辑。

新的实现方式摒弃了对 `rpm`, `dpkg` 等包管理器的直接调用，转而使用更简单、更高效的 `command -v <executable>` 命令来检查所需的可执行文件是否存在。

这个修复已经通过 Pull Request 合并，并计划在后续版本（如 v1.7.3 和 v1.8.0）中提供。

---
#### 线上解决方法
客户那边是私有化部署, 所以并不能直接升级
##### 临时解决
`rpm --rebuilddb` 修复受损的 rpm db 数据
##### 后续优化
部署包升级到 longhorn 版本到 1.7.3 

### 五、总结

- 不要相信任何的开源包, 一定要设置内存限制
- 出了问题先找 issue, 可能就是一个已知 bug
- 即使是小的泄露, 也会堆积占用大量的内存
<!--more-->