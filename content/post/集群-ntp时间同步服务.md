---
title: 集群-ntp时间同步服务
date: 2022-04-12T10:39:46+08:00
draft: false
toc: true
---
> 本不想做运维的 奈何现在项目缺人手， 不仅需求多， 而且还需要教学弟， 这篇文章主要是记录在分布式集群中出现的hive或者hbase时间同步错误。
<!--more-->

## 首先， 为什么需要时间同步问题
由于不同主机上的时区不同或者就是时间不同，导致各个集群上的时间不一致， 这就会导致--- 查阅了许多资料， 暂时不知道为什么需要时间同步， 不过hive hbaase启动的时候， 都会检查各个节点的时间是否一致， 否则就会报错。

## 其次， 计算机是如何控制时间的
计算机时间分为硬件时间和系统时间。 硬件时间是bios上的硬件电路里面的时钟，
系统时间是指linux系统里维护的时间， 因为不能一直读取硬件时间，所以一般 开机后会进行一次硬件时间到软件时间的同步， 之后两个时间就各自运行，互不干扰， 除非手动同步。
## 手动设置时间
相关命令：
date    修改和显示日期和时间的命令。
hwclock    将当前系统时间写入CMOS的命令，只有root用户才可以使用。
ntpd     NTP服务的守护进程文件，需要先启动它才能提供NTP服务。
ntpdate     客户端时间同步

> 显示硬件时间 #hwclock
> 设置硬件时钟的操作：#hwclock --set --date="09/17/2003 13:26:00"
> 硬件时钟与系统时钟同步：
    # hwclock --hctosys
    上面命令中，--hctosys表示Hardware Clock to SYStem clock。
    系统时钟和硬件时钟同步：
    # hwclock --systohc
校准时区 # ln -s /usr/share/zoneinfo/Asia/Shanghai /etc/localtime


# 如何同步集群时间- NTP
NTP是Server Client运行方式
安装NTP服务
sudo apt-get install ntp
## 配置NTPServer
```
# vi /etc/ntp.conf
restrict 192.168.100.0 mask 255.255.255.0 nomodify     #本地网段授权访问 
```

ntpd启动后，客户机要等几分钟再与其进行时间同步，否则会提示“no server suitable for synchronization found”错误。

## 客户端更新时间
`ntpdate 192.168.100.10`

> 敲完  收工

