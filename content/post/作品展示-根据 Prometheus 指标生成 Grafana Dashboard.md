---
title: 作品展示-根据 Prometheus 指标生成 Grafana Dashboard
tags:
  - 编程
  - 个人作品
date: 2025-12-17T14:00:51+08:00
draft: false
toc: true
slug: 20251217140051
categories:
  - 技术折腾
---
![image.png](https://img.yunpiao.site/2025/12/2e64cc88473573bd13ffeeca91d93ca6.png)


最近参加了 Kaggle 的 Gemini 3 竞赛，做了个小工具：把 Prometheus 的 /metrics 输出直接转成可导入的 Grafana Dashboard JSON。

### 为什么做这个

手写 Grafana Dashboard 挺烦的。每次新服务上线，要对着 metrics 列表一个个配 panel、写 PromQL、调布局。重复劳动，没什么技术含量。
想法很简单：把 metrics 丢给 LLM，让它帮我生成。

### 实现思路

分两步走：
**第一步：生成 Plan**
把 metrics 喂给 Gemini，让它分析应该建哪些分类（比如 HTTP、内存、磁盘），每个分类下放哪些 panel，用什么图表类型（timeseries、stat、gauge）。
这一步输出的是一个可编辑的计划，不是最终 JSON。用户可以调整：删掉不需要的 panel、改标题、换图表类型。


**第二步：生成 Dashboard JSON**
确认 plan 后，并行请求 Gemini 生成每个 panel 的具体配置：PromQL 查询、单位、阈值等。最后组装成完整的 Grafana Dashboard JSON。

### 踩的坑

LLM 生成的 PromQL 经常有问题：

1. **`{__name__=~"metric_a|metric_b"}`** —— 这种写法在 Grafana 里会报 "vector cannot contain metrics with the same labelset"
2. **`rate(...) by (label)`** —— 语法错误，应该是 `sum by (label) (rate(...))`

加了一层后处理，自动修复这些常见错误。

LLM 生成的 json 是有问题的, 也加了自动修复


> 想想还是使用 Using tools 比较方便, 直接 DSL, 之后根据这个 DSL 去生成 json, 必将让 LLM 生成 json 还是不是靠谱, 上下文一长, LLM 就智障了

### 功能点
#### 1. 智能解析
- 自动识别 metric 类型（counter, gauge, histogram）
- 提取所有标签
- 保留帮助文档
#### 2. AI 分析
- 识别监控模式（RED, USE, Golden Signals）
- 规划仪表盘结构
- 建议可视化类型
#### 3. 精确生成
- **Counter** → `rate()` 查询
- **Gauge** → 直接查询
- **Histogram** → `histogram_quantile()` 计算百分位数
- 自动配置单位、图例、颜色
#### 4. 完整输出
- 标准 Grafana Dashboard JSON
- 自动布局
- 即导即用
### Demo
![image.png](https://img.yunpiao.site/2025/12/2896686d10021c18e3ec0ed1dd6a1d37.png)

- **在线体验**：[https://aistudio.google.com/apps/drive/1nfv58w41dTsheBGzBJ7JhrojZxoPgn-B](https://aistudio.google.com/apps/drive/1nfv58w41dTsheBGzBJ7JhrojZxoPgn-B)
- **YouTube**：[https://youtu.be/p6b3z5gSCtY](https://youtu.be/p6b3z5gSCtY)
- **源码**：[https://github.com/yunpiao/Grafana-Dashboard-Generator-Gemini](https://github.com/yunpiao/Grafana-Dashboard-Generator-Gemini)

---

### 顺便做了个工具

参加比赛的时候想看看别人都做了什么，发现 Kaggle 上直接翻挺费劲的，4000 多条 writeup。
就爬下来整理了一下，做了个浏览器：[https://kaggle-gemini3-writeups-explorer.streamlit.app/](https://kaggle-gemini3-writeups-explorer.streamlit.app/)
按分类筛选、搜索、随机抽取都行。如果你也在找 AI 应用的灵感，可以翻翻

本次所有参赛的词云
![image.png](https://img.yunpiao.site/2025/12/b50c9bbae6651cf9a8b3646fa0ea82f5.png)


---
<!--more-->