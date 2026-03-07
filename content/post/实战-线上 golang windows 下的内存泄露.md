---
title: 实战-线上 golang windows 下的内存泄露
tags:
  - 线上实战
  - go
  - cgo
date: 2024-04-25T00:00:00+08:00
draft: false
toc: true
isTop: false
slug: 20240425152836
feature:
---

<!--more-->
## 1. 背景
今天遇到了一个客户问题, 用户说我们这边的程序占用的内存越来越多, 我们的程序是通过 windows server 托管的, 使用 golang 编译成 exe 后, 使用安装器安装到用户 windows 服务器上的, 理论上只是一个心跳 + 信息收集用的, 不会占用太多内存. 

不过当看到用户 64G 内存马上满了之后, 意识到肯定是哪里出了问题 😱

## 2. 复现步骤
找了公司里面几台安装的比较久的 exe 看了下, 运行一两个月后, 内存确实到了 1 G 左右. 😂 这个时候只能一步一步排查哪里出问题了

### 排查第一步
首先想到的是 Pprof 神器, `fmt.Println(http.ListenAndServe("0.0.0.0:6063", nil))` 一把梭之后, dump 查看内存占用
![image.png](https://img.yunpiao.site/2024/04/8a504070cec1b40230b963234e228b9c.png)
一顿操作猛如虎, 一看内存几百K, 这什么都没有

想到可能是使用了 CGO, 这部分内存是没办法在 pprof 中观察到的, 于是开启了第二步

### 排查第二步
神器 windbg, 想到可以转储内存, 之后通过分析内存中的内容, 就可以知道都是那些内容占据的内存了
首先转储内存, 直接在任务管理器中操作转储
![image.png](https://img.yunpiao.site/2024/04/2d0917cc85ea0215e3df0fbcdc9682ab.png)

下载 windbg, 并打开转储文件
https://learn.microsoft.com/zh-cn/windows-hardware/drivers/debugger/ 可以从微软这里下载, 不过这个版本比较新了, 一些命令可能与旧版本不兼容, 我是 google 下载的之前版本

![image.png](https://img.yunpiao.site/2024/04/8804be6b3c0fae9403f3cc50a8bf0c4b.png)
#### 分析前的 windbg 配置工作
分析前, 需要将 window 的符号配置路径, 可以在 windbg 中输入下面的命令进行加载
```powershell
.sympath SRV*c:\mySymbols*http://msdl.microsoft.com/download/symbols
!sym noisy
.reload
```

然后加载转储文件使用如下的命令进行分析

常用的 windbg 命令
```bash
!analyse -v 先大致分析下


!heap -s 查看内存分布
0:000> !heap -s
LFH Key                   : 0x311c1eaa657dc8ce
Termination on corruption : ENABLED
          Heap     Flags   Reserv  Commit  Virt   Free  List   UCR  Virt  Lock  Fast 
                            (k)     (k)    (k)     (k) length      blocks cont. heap 
-------------------------------------------------------------------------------------
0000000001980000 00000002   32552  20420  32552    479   896     6    0      2   LFH
0000000000010000 00008000      64      4     64      2     1     1    0      0      
0000000000320000 00001002    7216   3236   7216     37     6     4    0      6   LFH
0000000028670000 00001002      60     16     60      5     2     1    0      0      
00000000287f0000 00001002      60      8     60      5     1     1    0      0      
-------------------------------------------------------------------------------------


!heap -stat -h 0000000001980000 参看Heap
    size     #blocks     total     ( %) (percent of total busy bytes)
    118 d - e38  (20.12)
    8e4 1 - 8e4  (12.58)
    800 1 - 800  (11.32)
    400 2 - 800  (11.32)
    782 1 - 782  (10.62)
    50 f - 4b0  (6.63)
    410 1 - 410  (5.75)
    238 1 - 238  (3.14)
    1e0 1 - 1e0  (2.65)
    1b0 1 - 1b0  (2.39)
    20 a - 140  (1.77)
    100 1 - 100  (1.41)
    68 2 - d0  (1.15)
    3e 3 - ba  (1.03)
    98 1 - 98  (0.84)
    30 3 - 90  (0.80)
    44 2 - 88  (0.75)
    42 2 - 84  (0.73)
    40 2 - 80  (0.71)
    3c 2 - 78  (0.66)

!heap -flt s 118 查看 118 大小的数据里面有什么, 什么都没看出来
    _HEAP @ 1980000
              HEAP_ENTRY Size Prev Flags            UserPtr UserSize - state
        00000000019819d0 0012 0000  [00]   00000000019819e0    00118 - (busy)
        0000000001981b50 0012 0012  [00]   0000000001981b60    00118 - (busy)
        0000000001981fc0 0012 0012  [00]   0000000001981fd0    00118 - (busy)
        0000000001982140 0012 0012  [00]   0000000001982150    00118 - (busy)
        0000000001982380 0012 0012  [00]   0000000001982390    00118 - (busy)
        0000000001983090 0012 0012  [00]   00000000019830a0    00118 - (busy)
        00000000019832c0 0012 0012  [00]   00000000019832d0    00118 - (busy)
        0000000001983520 0012 0012  [00]   0000000001983530    00118 - (busy)
        0000000001983730 0012 0012  [00]   0000000001983740    00118 - (busy)
        0000000001984650 0012 0012  [00]   0000000001984660    00118 - (busy)
        0000000001984cf0 0012 0012  [00]   0000000001984d00    00118 - (busy)
        0000000001984fa0 0012 0012  [00]   0000000001984fb0    00118 - (busy)
        0000000001987640 0012 0012  [00]   0000000001987650    00118 - (busy)
    _HEAP @ 10000
    _HEAP @ 320000
    _HEAP @ 28670000
    _HEAP @ 287f0000

```
🥲 看了下 分布很均匀, 看不出来到底是那种类型数据, 似乎没有有用的特征信息, 推断可能是内核态的进程了, 太费事了, 于是想到了万能的笨方法

### 排查第三步 逐步尝试,  查看哪个函数消耗的内存
由于代码量不大, 相关的 cgo 函数就那么几个. 所以可以直接遍历, 定位内存泄露函数

```go
for i := 0; i < 10000000; i++ {
	fmt.Printf("TestXXX: %#v\n", getXXX())
	fmt.Printf("TestXXX: %#v\n", getXXX1())
	fmt.Printf("TestXXX: %#v\n", getXXX2())
}
```
写一个单测, 直接运行, 查看内存变化
最后确实定位到了问题点,  程序中使用了 `# DsGetDomainControllerInfoW` 函数, 使用了系统调用去获取了 windows server 的信息, 但是信息是 dll 中申请的, golang 这边管理不了, 后续要手动使用 `# DsFreeDomainControllerInfoW` 系统调用手动释放, 😒 真是 fuck, 不过好在这部分代码不是我写的, 可以甩锅 😁

具体的函数使用说明 https://learn.microsoft.com/zh-cn/windows/win32/api/ntdsapi/nf-ntdsapi-dsgetdomaincontrollerinfoa


## 3. windows 下进程内存的观测方法
### 3.1. windows 自带性能监视器
![image.png](https://img.yunpiao.site/2024/04/c92d19e2f758f5279d15cc45dacbd45c.png)
![image.png](https://img.yunpiao.site/2024/04/d5122413822424eb971b279002d3fecd.png)
一般来说, 自带的已经可以了, 但是不足之处是, 无法查看具体的数值, 只有统计值

### 3.2. 使用 windows exporter 查看进程状态
https://github.com/prometheus-community/windows_exporter
直接从 release 下载最新版本, 在 windows 上运行, 注意默认情况下, 是不会监控进程相关的指标的, 需要在启动命令中增加相关参数

启动命令
```bash
.\windows_exporter.exe --collectors.enabled "process" --collector.process.include="firefox.+"
```

默认的采集端是 9182, 在 prometheus 中配置采集对象

prometheus.yml
```yaml
global:
  scrape_interval:     60s
  evaluation_interval: 60s
 
scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets: ['localhost:9182']
        labels:
          instance: prometheus
```

最后在 grafana 中观察就可以看到指定进程的内存占用情况
![image.png](https://img.yunpiao.site/2024/04/beedd3c83ac4b8311a922d34038c1f00.png)

具体的指标项为 `windows_process_working_set_private_bytes`, 通过 grafana 可以只管查看到具体的内存占用数据
