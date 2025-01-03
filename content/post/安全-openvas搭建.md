---
title: 安全-openvas搭建
date: 2019-04-12T10:39:46+08:00
draft: false
toc: true
---

<!--more-->

# 1、openvas 简介
Nessus是其中一个最流行的和有强力的漏洞扫描器,尤其是对UNIX系统。它最初是自由和开放源码,但他们在2005年关闭了源代码,在2008年取消了免费的“注册Feed”版本。现在每年花费1200美元。

在Nessus的基础上发展了一个免费开源的分支，OpenVAS 用于管理目标系统的漏洞的同时也可以进行攻击渗透。
# 2、 整体结构
![整体架构][1]

##  采用S/C模式
## Server 层（分为三部分）
>  扫描器-openvas-scanner  
  scanner监听端口为9391, 负责调用各种漏洞检测插件，完成实际的扫描操作。

>   管理器-openvas-manager
监听端口为9390, 负责分配扫描任务，并根据扫描结果生产评估报告。

>  管理者-openvas-administrator
administrator监听端 口为9393, 负责管理配置信息，用户授权等相关工作。

## Client 层(任一都可以)
> openvas-cli(命令行接口):
负责提供从命令行访问OpenVAS服务层程序。

> greenbone-security-assistant(安装助手): 
 负责提供访问OpenVAS服务层的web接口，便于通过浏览器来执行扫描任务，是使用最简便的客户层组件。
 
 >Greenbone-Desktop-Suite(桌面套件):
 负责提供访问OpenVAS服务层的图形程序界面，主要允许在Windows客户机中。

# 3 、OpenVas各组件
### 安装辅助脚本
- openvas-setup:　　　　   执行安装
- openvas-check-setup:　　可以在配置之前使用该工具进行检查，看哪里有问题，有问题的时候根据提示进行fix

### Server 组件
-  openvassd :　　扫描引擎
- openvasmd:　　管理引擎    可以添加用户等操作，详细查看help，
- openvasad　　  认证工具

### 漏洞库同步组件
- openvas-nvt-sync　　　　同步nvt库（用于检测的脚本）
- openvas-scapdata-sync    同步scap数据库（后台采用sqlite）
- openvas-certdata-sync  同步 CERT 公告



# 4、安装
## 源码安装
### 详见Gitlib 安装
http://gitlab.buptnsrc.com/16new/openvas/blob/master/README.md

# 5、漏洞数据（feed）

![同步数据][2]
## 数据来源
### NTVs 数据

 OpenVas 包含了一个 NTVs（ Network Vulnerability Tests）的推送， 持续增长。所有检测方法都是通过NTVs 脚本进行检测的
 
NTVs 所有分类 详见 主机扫描下的可扫描类型

> NTVs 采用 nasl脚本语言编写   nasl 示例
http://wald.intevation.org/scm/viewvco.php/scripts/2008/deb_016_1.nasl




### SCAP 数据
#### 主要包括 
- CVE
- CPE
- OAVL
### CERT 公告数据
- CERT-Bund 公告
- DFN-CERT 公告

## 数据数量（截止到2017.3.10）
- NTVs  截止到2017年 3月 10号 有50391个测试脚本
- CVE数量 29346
- cpe 数量 164099
- OVAL定义数量 28175
- CERT-Bund 公告数量 5629
- DFN-CERT 公告数量 14226

## 更新方式 

### 可以手动或自己编写脚本 在启动服务前更新漏洞库  
### openvas 做了一个更新限制 每天只能更新一次脚本

采用增量更新、 采用更新脚本进行更新
- openvas-nvt-sync　　　　同步nvt库（用于检测的脚本）
- openvas-scapdata-sync    同步scap数据库（后台采用sqlite）
- openvas-certdata-sync  同步 CERT 公告



NTVs 可以离线更新  更新地址为 
http://www.openvas.org/openvas-nvt-feed-current.tar.bz2

## 更新频率
漏洞库openvas feed端 更新频率大约一周一次

# 6、主机扫描

## NTV家族清单（可扫描类型）


 1.	AIX Local Security Checks
 2.	 Amazon Linux Local Security Checks
3.	Brute force attacks
4.	Buffer overflow
5.	CISCO
6.	CentOS Local Security Checks
7.	Citrix Xenserver Local Security Checks
8.	Compliance
9.	Databases
10.	Debian Local Security Checks
11.	Default Accounts
12.	Denial of Service
13.	F5 Local Security Checks
14.	FTP
15.	Fedora Local Security Checks
16.	Finger abuses
17.	Firewalls
18.	FortiOS Local Security Checks
19.	FreeBSD Local Security Checks
20.	Gain a shell remotely
21.	General
22.	Gentoo Local Security Checks
23.	HP-UX Local Security Checks
24.	IT-Grundschutz
25.	IT-Grundschutz-10
26.	IT-Grundschutz-11
27.	IT-Grundschutz-12
28.	IT-Grundschutz-13
29.	JunOS Local Security Checks
30.	Mac OS X Local Security Checks
31.	Mageia Linux Local Security Checks
32.	Malware
33.	Mandrake Local Security Checks
34.	Netware
35.	Nmap NSE
36.	Nmap NSE net
37.	Oracle Linux Local Security Checks
38.	Peer-To-Peer File Sharing
39.	Policy
40.	Port scanners
41.	Privilege escalation
42.	Product detection
43.	RPC
44.	Red Hat Local Security Checks
45.	Remote file access
46.	SMTP problems
47.	SNMP
48.	Service detection
49.	Settings
50.	Slackware Local Security Checks
51.	Solaris Local Security Checks
52.	SuSE Local Security Checks
53.	Ubuntu Local Security Checks
54.	Useless services
55.	VMware Local Security Checks
56.	Web Servers
57.	Web application abuses
58.	Windows
59.	Windows : Microsoft Bulletins


## 漏洞扫描结果示例（Apache 默认文件漏洞）

![检测结果][5]

# 7、结果导出
### 结果可以多种形式导出
- Anonymous XML
- ARF
- CPE
- CSV Hosts
- CSV Results
- HTML
- ITG
- LaTeX
- NBE
- PDF
- SVG
- TXT
- Verinice ISM
- Verinice ITG
- XML

# 8、 参考网址
http://www.freebuf.com/articles/5474.html
http://www.freebuf.com/articles/system/110027.html
https://wizardforcel.gitbooks.io/daxueba-kali-linux-tutorial/content/28.html
http://m.www.cnblogs.com/spacepirate/p/4113626.html
http://atic-tw.blogspot.com/2013/12/kali-openvas.html
http://www.scap.org.cn/article_home_about-scap.html
http://wiki.scap.org.cn/scap/overview

  [1]: img/1489109830456.jpg "1489109830456"
  [2]: img/1489062782315.jpg "同步数据"
  [5]: img/1489132187650.jpg "结果示例"
