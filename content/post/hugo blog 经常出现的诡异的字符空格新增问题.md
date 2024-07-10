---
title: hugo blog 经常出现的诡异的字符空格新增问题
tags: hugo主题, 字间空格, 解决办法
date: 2024-04-16T15:10:29+08:00
draft: false
hideInList: false
isTop: false
toc: true
cover:
  image: https://cdn.sspai.com/2021/07/10/4924403d889cd827d6637a5efb6c5ce2.png?imageMogr2/auto-orient/quality/95/thumbnail/!1420x708r/gravity/Center/crop/1420x708/interlace/1
slug: hugo-blog-
feature: 
datetime: 2024-07-03 20:52
summary: 删除网页中引入的自动化工具pangu.min.js以解决网页自动加入空格的问题
cover_image_url: ""
---
hugo 主题相关问题
<!--more-->
# 1. 现象
网页刚打开时候的现象
![image.png](https://img.yunpiao.site/ob/202404161513483.png)
等待几秒后, 突然变化了, 自动加了空格, 这种变化很是恼人

![image.png](https://img.yunpiao.site/ob/202404161512326.png)


# 2. 分析
看了下 blog 的源文档, 中英文之间是没有空格的, 所以这里肯定是什么工具自动加的 空格, 虽然是好事, 但是这种体验, 真的是垃圾


# 3. 解决
google 后看到, 大部分前端是引入的 `pangu.min.js` 进行的自动化, 所以解决办法也很简单

1. ctrl + f  pangu.min.js
2. 找到主题中的 <script type="text/javascript" src="/pangu.min.js"></script>, 直接删除
3. 世界清净
