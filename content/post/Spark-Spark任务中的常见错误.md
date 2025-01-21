---
title: Spark任务中的常见错误
date: 2022-10-12T10:39:46+08:00
draft: false
toc: true
---


> 记录遇到过的Spark各种错误
<!--more-->
### 1. Too many open files 
linux 中 一切皆文件， Too many open files 有可能是file， 也有可能是socket。 在这里一般是file， 在HDP集群上， 需要在ulimit里设置最大文件打开数量。 一般建议设置为10240 ， 默认是1024 。 

### 2. OOM

Spark需要有两个关于memory相关的设置项
1) spark.drive.memory
2) spark.execute.memory
一般如果经常需要collect() 等拉回数据到drive的话， spark.drive.memory 的内存需要设置的大点，不过受单机限制， 不能超过单机最大内存

如果遇到execute oom的话， 一般是spark.execute.memory设置过小， 而分配到每个execute的数据量又太大， 或者数据倾斜， 造成某一个execute的数据量太大， 这里有集中解决方法。
1） repartition或者coalesce  将分区降低 
2） 增大spark.execute.memory （可增加core数量）
3） 控制reduce参数 set mapred.reduce.tasks=10 

### 3. filter后数据倾斜
解决方法
使用coalesce 降低分区， 并设置 shuffer=Ture

### 4. join速度慢
如果是大表join小表
解决方法：将小表设置为广播变量, 使用udf进行join
```python
tiny_table = spark.sc.boardcast(tiny_table)
def udf_join_table(big_table_data):
        return tiny_table.value[big_table_data]
```
### 5.shuffle FetchFailedException
  
  org.apache.spark.shuffle.FetchFailedException:
  org.apache.spark.shuffle.MetadataFetchFailedException:   
  Missing an output location for shuffle 0

解决方法：这种问题一般发生在有大量shuffle操作的时候,task不断的failed,然后又重执行，一直循环下去，直到application失败。
一般遇到这种问题提高executor内存即可,同时增加每个executor的cpu,这样不会减少task并行度。

### 6. driver.maxResultSize太小
Caused by: org.apache.spark.SparkException:
 Job aborted due to stage failure: Total size of serialized 
 results of 374 tasks (1026.0 MB) is bigger than
  spark.driver.maxResultSize (1024.0 MB)
解决方法：spark.driver.maxResultSize默认大小为1G 每个Spark action(如collect)所有分区的序列化结果的总大小限制，简而言之就是executor给driver返回的结果过大，报这个错说明需要提高这个值或者避免使用类似的方法，比如countByValue，countByKey等。

将值调大即可

spark.driver.maxResultSize 2g

### 找不到python
java.io.UIException: Cannot run program "python2.7": error=2,没有那个文件或目录
解决方法：execute环境变量问题 查看在环境变量中是否有python2.7

