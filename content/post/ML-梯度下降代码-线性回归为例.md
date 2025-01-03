---
title: ML-梯度下降代码-线性回归为例
date: 2019-10-12T10:39:46+08:00
draft: false
tags:
  - 机器学习
categories:
  - 杂技浅尝
toc: true
summary: 这是文章的摘要部分
---

# 梯度下降代码线性回归为例

## bgd 批量梯度下降
## sbd 随机梯度下降
## mbfd 小批量随机梯度下降


```python
import numpy as np
import random

def gen_line_data(sample_num=100):
    """
    y = 6*x1 + 40*x2
    :return:
    """
    x1 = np.linspace(0, 9, sample_num)
    x2 = np.linspace(4, 13, sample_num)
    x = np.concatenate(([x1], [x2]), axis=0).T
    y = np.dot(x, np.array([, 4]).T)  # y 列向量
    return x, y

def my_bgd(samples, y, step_size=0.01, max_iter_count=10000):
    len_x,dim = samples.shape
    X = samples
    y = y.flatten()
    w = np.zeros((dim,), dtype=np.float32)
    iter_count = 0
    while(iter_count!=max_iter_count):
        # 求出每一维损失
        err = 0 
        error_w = np.zeros((dim,), dtype=np.float32)
        for i in range(len(X)):
            pre_y = np.dot(w.T,X[i])
            for j in range(dim):
                error_w[j] += (y[i]-pre_y) * X[i][j]

        #针对每一维更新w
        for j in range(dim):
            w[j] += error_w[j] * step_size /len_x
        
        #算每次迭代的error function
        for i in range(len(X)):
            pre_y = np.dot(w.T,X[i])
            loss = (1 / (len_x * 2)) * np.power((pre_y - y[i]), 2)
            err += loss
        iter_count += 1
        
    return w

def my_sgd(samples, y, step_size=0.01, max_iter_count=10000):
    len_x,dim = samples.shape
    X = samples
    y = y.flatten()
    w = np.ones((dim,), dtype=np.float32)
    iter_count = 0
    err = 10
    while(err > 0.001 and iter_count!=max_iter_count):
        # 求出每一维损失
        err = 0 
        error_w = np.zeros((dim,), dtype=np.float32)
        for i in range(len(X)):
            pre_y = np.dot(w.T,X[i])
            for j in range(dim):
                error_w[j] += (y[i]-pre_y) * X[i][j]
                w[j] += error_w[j] * step_size /len_x
        
        #算每次迭代的error function
        for i in range(len(X)):
            pre_y = np.dot(w.T,X[i])
            loss = (1 / (len_x * 2)) * np.power((pre_y - y[i]), 2)
            err += loss
        iter_count += 1
    return w

def my_mbgd(samples, y, step_size=0.01, max_iter_count=10000,batch_size=0.2):
    len_x,dim = samples.shape
    X = samples
    y = y.flatten()
    w = np.zeros((dim,), dtype=np.float32)
    iter_count = 0
    while(iter_count!=max_iter_count):
        # 求出每一维损失
        err = 0 
        error_w = np.zeros((dim,), dtype=np.float32)
        index = random.sample(range(len_x),
                              int(np.ceil(len_x * batch_size)))
        batch_samples = samples[index]
        batch_y = y[index]
        
        for i in range(len(batch_samples)):
            predict_y = np.dot(w.T, batch_samples[i])
            for j in range(dim):
                error_w[j] += (batch_y[i] - predict_y) * batch_samples[i][j]

        for j in range(dim):
            w[j] += step_size * error_w[j] / len_x

        for i in range(len_x):
            predict_y = np.dot(w.T, samples[i])
            loss = (1 / (len_x * 2)) * np.power((predict_y - y[i]), 2)
            err += loss

        iter_count += 1
        
    return w

samples, y = gen_line_data()

```


```python
%%time
my_sgd(samples, y)
```
    CPU times: user 108 ms, sys: 4 ms, total: 112 ms
    Wall time: 106 ms
    array([ 5.9729414, 40.014584 ], dtype=float32)


