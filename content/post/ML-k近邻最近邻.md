---
title: ML-k近邻最近邻
date: 2022-04-12T10:39:46+08:00
draft: false
tags: KNN, 距离度量, KD树
categories:
  - 杂技浅尝
toc: true
summary: KNN是一种基于样本的模型，根据距离最相近的K个样本的类别归类新样本。常见的距离度量方法有欧氏距离、曼哈顿距离、切比雪夫距离和余弦夹角。选择合适的K值和实现KD树的算法可以改进KNN的性能。
slug: ml-k-nearest-neighbor
datetime: 2024-07-03 20:45
cover_image_url: ""
---
#1.KNN介绍
#1.KNN介绍
k临近算法 也叫Knn 是一种基于样本的模型,当K取值为1时 
算法原理是 对于新的实例, 在训练集中找到距离最相近的K个样本,根据这K个样本的所属的类别,来归类这个新样本.
采取多数表决机制. 多数表决等价于经验风险最小化

![维基百科的图](https://img.yunpiao.site/blog/10970403-3494d30474e703c0.png)
#2.K近邻的距离度量方法
由于KNN是基于实例的, 所以要进行距离度量,常见的距离度量方法有
- 欧氏距离
![欧氏距离.png](https://img.yunpiao.site/blog/10970403-79f24173b0389bac.png)

- 曼哈顿距离
曼哈顿距离 指的是在坐标轴上的投影距离
二维空间点的曼哈顿距离 
`|x1-x2|+|y1-y2|`

![曼哈顿距离](https://img.yunpiao.site/blog/10970403-893e4d97a6e7fd5f.png)


- 切比雪夫距离
![切比雪夫距离](https://img.yunpiao.site/blog/10970403-0b654d5c17edb603.png)
- 余弦夹角
![余弦夹角](https://img.yunpiao.site/blog/10970403-3ad6e72cb1d3b98d.png)

![各种距离的算法实现.png](https://img.yunpiao.site/blog/10970403-f6f5006ba8a70bac.png)
![image.png](https://img.yunpiao.site/blog/10970403-1b2a37afdc3c1fbc.png)


还有许多距离算法 以后再慢慢写

# 3 k值的选择
# 4 算法实现 KD树

## knn的实现方法
###  1. 线性扫描
线性扫描是对整个数据集进行遍历,计算每个输入实例与数据集的向量距离,时间复杂度很高.
### - 2. kd树
对k维空间中的数据进行存储,并进行检索的树形数据结构

![k维生成kd树的例子](https://img.yunpiao.site/blog/10970403-045993663759a999.png)

![检索kd树的例子](https://img.yunpiao.site/blog/10970403-bb12a10cf3070ef9.png)


参考网址 
- http://blog.csdn.net/v_july_v/article/details/8203674

