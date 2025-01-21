---
title: 基于链接的粒子群优化（LBPSO）的无监督文本聚类特征选择方法
date: 2018-06-12T10:39:46+08:00
draft: false
series:
  - Blog养成记
categories:
  - 杂技浅尝
toc: true
tags:
  - 论文
---
论文阅读
<!--more-->

论文目录结构
```bash
- 介绍
- 背景
  - 文本聚类
    token化
    去停用词
    提取词干
    加权
    向量化
  - 二进制粒子群优化算法
    - 粒子群优化算法
    - 全局最好
    - local best
    - 二元粒子群优化
  - 无尺度网络
  - kmeans
  - 提出的方法
    - 邻居选择策略
    - 无尺度网络
    - 链接矩阵计算
    - 粒子重要性计算
    - 解决方案
    - 目标函数
    - 交叉与变异
  - 提出的特征选择方法
    - 特征选择算法
    - LPSO算法与文本聚类算法的集成
  - 实验
  - 数据集
  - 评估指标
  - 评估结果
  - 结论

```
论文 https://www.sciencedirect.com/science/article/pii/S0167739X17321854?via%3Dihub
Link based BPSO for feature selection in big data text clustering
文本特征选择  
特征选择搜索策略 分为三类 - 过滤器
不使用学习算法 - 包装器
使用学习算法 顺序算法和启发式算法 包装方法在分类准确性方面优于过滤方法
顺序方法
我们从空集开始，在每一步中添加一些特征，直到达到最大目标函数值。
启发式方法
评估是在不同的特征子集上执行的，以优化目标函数值 - 嵌入式
将特征选择算法和学习模型结合 适中的计算成本实现高精度或良好性能（例如支持向量机和最小二乘回归

特征选择方法包括
https://blog.csdn.net/kebu12345678/article/details/78485093
https://www.jianshu.com/p/ea48441d44a5
https://blog.csdn.net/oanqoanq/article/details/9238817
https://blog.csdn.net/shuzfan/article/details/52993427
互信息
顺序搜索 顺序前向和后向特征选择（SFS，SBS）以克服特征选择问题
卡方检验
pedersen
术语强度 tewm strength
信息增益
主成分分析
神经网络

特征选择是一种离散优化问题。文献中已经提出了各种类型的搜索技术，例如顺序前向和后向特征选择（SFS，SBS）以克服特征选择问题。但是，这些技术可能有早熟收敛问题或计算复杂度较高。为了缓解这些问题，基于群体解算器的演化计算（EC）技术为离散优化问题产生了较少计算成本的最优解。这些技术已被广泛用于寻找全球最佳并日益流行的人气。有许多元启发式算法，如粒子群算法[ 15,16 ]，人工蜂群（ABC）[ 17]，遗传算法（GA）[ 18,19 ]和蚁群优化[ 20 ]等[ 21,22 ]用于特征选择问题。

粒子群优化算法高效稳健的基于种群的优化算法

PSO算法是一种高效的文本聚类区域特征选择算法
https://www.zhihu.com/question/23103725
https://wenku.baidu.com/view/cd9bdbc7a1c7aa00b52acbe8.html
我们在BPSO中引入了一种新的邻居选择策略用于文本聚类中的特征选择。该算法充分利用了每个特征的区分能力，充分考虑了每个特征的相关性和冗余性。最后使用两个遗传算子来避免停滞问题并探索全局最优解。此外，平均绝对差值（MAD）用于评估粒子的适应性。

text clustering, basic binary PSO,
introduction to scale free networks and its Barabasi & Albert (BA)
model and gives a brief introduction to k-means algorithm.
Albert-László Barabási 和Réka Albert为了解释幂律的产生机制，提出了无标度网络模型（BA模型）。BA模型具有两个特性，其一是增长性，所谓增长性是指网络规模是在不断的增大的，在研究的网络当中，网络的节点是不断的增加的；其二就是优先连接机制，这个特性是指网络当中不断产生的新的节点更倾向于和那些连接度较大的节点相连接。BA模型对很多的现象都是可以解释的，例如研究生对导师的选择，在这个网络当中，研究生和导师都是不断增加的，而研究生总是倾向于选择已经带过很多研究生的导师。

二进制离散粒子群优化算法
https://zh.wikipedia.org/wiki/%E6%97%A0%E5%B0%BA%E5%BA%A6%E7%BD%91%E7%BB%9C
https://www.cnblogs.com/LonelyEnvoy/p/5981449.html
https://blog.csdn.net/google19890102/article/details/30044945
http://www.cnblogs.com/21207-iHome/p/6062535.html
https://blog.csdn.net/qq_27755195/article/details/62216762

聚类 聚类步骤

1. token 分词
2. 停用词
3. Stemming 词干提取
   https://segmentfault.com/a/1190000003839093

4. 加权转化为向量

二进制粒子群优化

无标度BA模型
网络在自然界和社会中无处不在，描述了各种复杂的系统，即通过化学相互作用连接基因或蛋白质的遗传网络，由通过社会关系相互作用的个体组成的社会网络等。尽管它们多样性，但大多数出现在自然界中的网络遵循普遍的组织原则。特别是，已经发现许多科学兴趣的网络本质上是无标度的。本文展示了PSO群体中无标度网络的结构特征。[图3](https://www.sciencedirect.com/science/article/pii/S0167739X17321854?via%3Dihub#fig3)显示了无标度网络的一个例子。

k-means

提出方法

Neighbourhood selection strategy in PSO

无尺度拓扑结构
Computation of link matrix
Particle importance calculation

Solution representation

目标函数
使用了遗传算法的交叉和变异操作 交叉运算符 突变因子

特征选择算法

LPSO与k-均值文本聚类算法的集成

经过预处理，提出的算法用于从原始特征空间中选择新的信息特征子集。这些特征不仅提高了聚类算法的效率，而且降低了计算复杂度。本文采用集成链路邻居策略的改进BPSO（LBPSO）算法进行特征选择。最后，k -means文本聚类算法在特征的信息子集上执行。一个完整的文本聚类过程和流程图
![特征子集选择过程](http://upload-images.jianshu.io/upload_images/10970403-13d529af0f4a9c36.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

实验及结果评估

标准

- 准确性
- 归一化需信息
- 纯度
- rand index指数
