---
title: ML-文本相似度
date: 2019-10-12T10:39:46+08:00
draft: false
tags:
  - 机器学习
categories:
  - 杂技浅尝
toc: true
summary: 这是文章的摘要部分
---
>  局部敏感哈希(LSH)




<!--more-->
## 文本相识度
计算文档文本相识度 主要方法
- 欧氏距离
- 编辑距离
- 余弦距离
- Jaccard 距离

距离越近 相识度越高  负比

相识度公式

## 文档的Shingling

为了计算  所以需要文档划分为小的短字符的集合 即子串 

#### k-Shingling 就是k个集合为一起的子串

{"a, b", "b,c"} 

k的选取视情况而定
## 最小hash
假设我们有这样4篇文档（分词后）：

s1 = "我 减肥"
s2= "要"
s3 = "他 减肥 成功"
s4 = "我 要 减肥"
　　为方便叙述，我们取k=1，这时shingle全集为{我，他，要，减肥，成功}，将文档表示成特征矩阵，行代表shingle元素，列代表文档，只有文档j出现元素i时，矩阵M[i][j]=1，否则M[i][j] = 0.
　　实际上，真正计算的过程中矩阵不是这样表示的，因为数据很稀疏。得到矩阵表示后，我们来看最小hash的定义。



最小hash定义为：特征矩阵按行进行一个随机的排列后，第一个列值为1的行的行号。举例说明如下，假设之前的特征矩阵按行进行的一个随机排列如下：

最小哈希值：h(S1)=3，h(S2)=5，h(S3)=1，h(S4)=2.

　　为什么定义最小hash？事实上，两列的最小hash值就是这两列的Jaccard相似度的一个估计，换句话说，两列最小hash值同等的概率与其相似度相等，即P(h(Si)=h(Sj)) = sim(Si,Sj)。为什么会相等？我们考虑Si和Sj这两列，它们所在的行的所有可能结果可以分成如下三类：

　　（1）A类：两列的值都为1；

　　（2）B类：其中一列的值为0，另一列的值为1；

　　（3）C类：两列的值都为0.

　　特征矩阵相当稀疏，导致大部分的行都属于C类，但只有A、B类行的决定sim(Si,Sj)，假定A类行有a个，B类行有b个，那么sim(si,sj)=a/(a+b)。现在我们只需要证明对矩阵行进行随机排列，两个的最小hash值相等的概率P(h(Si)=h(Sj))=a/(a+b)，如果我们把C类行都删掉，那么第一行不是A类行就是B类行，如果第一行是A类行那么h(Si)=h(Sj)，因此P(h(Si)=h(Sj))=P(删掉C类行后，第一行为A类)=A类行的数目/所有行的数目=a/(a+b)，这就是最小hash的神奇之处。
  
  

  [1]: https://www.github.com/yunpiao/md/raw/img/1489672370555.jpg "1489672370555.jpg"
  [2]: https://www.github.com/yunpiao/md/raw/img/1489672846511.jpg "1489672846511.jpg"
  [3]: https://www.github.com/yunpiao/md/raw/img/1489673031988.jpg "1489673031988.jpg"