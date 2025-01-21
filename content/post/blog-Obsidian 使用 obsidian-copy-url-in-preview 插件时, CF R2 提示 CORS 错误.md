---
title: blog-Obsidian 使用 obsidian-copy-url-in-preview 插件时, CF R2 提示 CORS 错误
tags:
  - 开源工具
  - blog
date: 2024-04-01T14:37:07+08:00
draft: false
toc: true
slug: 20240429143707
feature:
---

<!--more-->
## 1. 起因
我用的 cloudFlare  r2 做图床, 但是发现 Obsidian 复制 oss 图片比较麻烦, 每次复制都需要打开网址, 然后复制, 直接复制的话, 只是复制了 url, 没有办法粘贴到聊天记录中. 
所以开始了折腾之旅

## 2. 开始找插件
使用了 images-tools-kit, 功能挺多,但是发现复制图片提示错误, 弹出不能 copy 图片到剪切板, 直接 打开控制台, 一查看发现 
![网上找的图](https://img.yunpiao.site/2024/04/5ad0b1c603b8335d9e1d175d2282a8d0.png)
==cors 跨域==问题, 想着不应该啊, 这么多人用的东西, 有问题应该早改了, 所以试了下其他的网上图片, 发现是可以的 😂

于是看了 issue, 发现 https://github.com/NomarCub/obsidian-copy-url-in-preview 这个插件, 更加简单, 直接右键可以复制, 比 kit 还简单些, 又安装这个 插件试用, 发现还是同样的错误, 于是开始了上班的摸鱼之旅.

## 3. 开始排查
### 3.1 查看 cf 的 r2 中的跨域配置
![image.png](https://img.yunpiao.site/2024/04/9df0b0b58b834e213daee6055bac28ee.png)
默认是空的, 我在里面添加了如上的策略配置, curl 了下, 发现返回的 header 中已经有了 

![image.png](https://img.yunpiao.site/2024/04/607e982348c1fe9442dcdfe7d0c208cc.png)
### 3.2 接下来再复制的时候, 发现问题还是存在
于是开始查看了下请求, 发现没有红框中的这一条, 于是猜想, 可能是之前的请求已经缓存到磁盘了, 这些请求是没有 Access 的请求字段的
![image.png](https://img.yunpiao.site/2024/04/1eb84c60af397aeca64fe33691e9e654.png)

**解决办法也是很简单的, 勾选上停用缓存, 之后直接复制是可以的**

![image.png](https://img.yunpiao.site/2024/04/a6645c8b320ad4c1332d01a5b239a624.png)

网上也有一些骚操作, 在 url 下加 get 的, 不过不太体面, 我 blog 中太多 url, 还得一个一个改


## 4. 结语
总的来说是个小问题, 问题的原因还是 cf 的 r2, 以为 r2 默认有 header 头接受跨域请求的, 没想到还需要自己配