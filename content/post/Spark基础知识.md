---
title: Spark基础知识
date: 2022-08-12T10:39:46+08:00
draft: false
toc: true
---
<!--more-->
## 1. Spark介绍

**Apache Spark**是一个[开源](https://zh.wikipedia.org/wiki/%E5%BC%80%E6%BA%90 "开源")集群运算框架，最初是由加州大学柏克莱分校AMPLab所开发。相对于[Hadoop](https://zh.wikipedia.org/wiki/Apache_Hadoop "Apache Hadoop")的[MapReduce](https://zh.wikipedia.org/wiki/MapReduce "MapReduce")会在运行完工作后将中介数据存放到磁盘中，Spark使用了存储器内运算技术，能在数据尚未写入硬盘时即在存储器内分析运算。Spark在存储器内运行程序的运算速度能做到比Hadoop MapReduce的运算速度快上100倍，即便是运行程序于硬盘时，Spark也能快上10倍速度。<sup>[[1]](https://zh.wikipedia.org/wiki/Apache_Spark#cite_note-1)</sup>Spark允许用户将数据加载至集群存储器，并多次对其进行查询，非常适合用于[机器学习](https://zh.wikipedia.org/wiki/%E6%9C%BA%E5%99%A8%E5%AD%A6%E4%B9%A0 "机器学习")算法。<sup>[[2]](https://zh.wikipedia.org/wiki/Apache_Spark#cite_note-2)</sup>
<!--more-->
使用Spark需要搭配集群管理员和分布式存储系统。Spark支持独立模式（本地Spark集群）、[Hadoop YARN](https://zh.wikipedia.org/wiki/Apache_Hadoop "Apache Hadoop")或[Apache Mesos](https://zh.wikipedia.org/wiki/Apache_Mesos "Apache Mesos")的集群管理。<sup>[[3]](https://zh.wikipedia.org/wiki/Apache_Spark#cite_note-3)</sup>在分布式存储方面，Spark可以和[HDFS](https://zh.wikipedia.org/wiki/Apache_Hadoop "Apache Hadoop")<sup>[[4]](https://zh.wikipedia.org/wiki/Apache_Spark#cite_note-4)</sup>、 [Cassandra](https://zh.wikipedia.org/wiki/Apache_Cassandra "Apache Cassandra")<sup>[[5]](https://zh.wikipedia.org/wiki/Apache_Spark#cite_note-5)</sup> 、[OpenStack Swift](<https://zh.wikipedia.org/wiki/OpenStack#Object_Storage_(Swift)> "OpenStack")和[Amazon S3](https://zh.wikipedia.org/wiki/Amazon_S3)等接口搭载。 Spark也支持伪分布式（pseudo-distributed）本地模式，不过通常只用于开发或测试时以本机文件系统取代分布式存储系统。在这样的情况下，Spark仅在一台机器上使用每个CPU核心运行程序。

在2014年有超过465位贡献家投入Spark开发<sup>[[6]](https://zh.wikipedia.org/wiki/Apache_Spark#cite_note-6)</sup>，让其成为[Apache软件基金会](https://zh.wikipedia.org/wiki/Apache%E8%BB%9F%E4%BB%B6%E5%9F%BA%E9%87%91%E6%9C%83 "Apache软件基金会")以及[大数据](https://zh.wikipedia.org/wiki/%E5%B7%A8%E9%87%8F%E8%B3%87%E6%96%99 "大数据")众多开源项目中最为活跃的项目。

Spark特点：

运行速度快：采用DAG（Directed Acyclic Graph，有向无环图）执行引擎，以支持循环数据流与内存计算，基于内存的执行速度可比Hadoop MR快上百倍，基于磁盘的速度也能快十倍。
容易使用：支持Scala、Java、Python和R语言进行编程。
通用性：提供完整而强大的技术栈，包括SQL查询，流失计算、机器学习和图算法组件。
运行模式多样：可运行于独立的集群模式中、Hadoop中、也可运行在Amazon EC2云环境中，可访问HDFS、Cassandra、HBase、Hive等数据源。

语言 scale 面向对象和函数式编程语言 运行在JVM上，兼容Java程序，能融合到Hadoop生态圈；具有强大的并发性，支持分布式系统。

## 2.Spark与其他组件对比

### Spark与Hadoop相比：

其计算模式也属于MR，但不局限与此，还提供多种数据集操作类型（RDD操作），编程模型更加灵活；
Spark提供内存计算，中间结果放在内存中，IO开销，延迟低，拥有更高地迭代运算效率；
基于DAG任务调度执行机制，由于MR迭代执行机制。
使用Hadoop需要编写不少相对底层的代码，而Spark提供高层次、简洁的API。
Spark主要替代Hadoop中的MR，而不能完全替代Hadoop，它很好地融入了Hadoop生态圈，可借助于YARN实现资源调度管理，借助HDFS实现分布式存储。
Hadoop可使用廉价、异构的机器实现分布式存储和计算，而Spark对硬件（内存、CPU）要求稍高

## Spark运行模式

Spark的设计遵循“一个软件栈满足不同应用场景”的理念。其生态系统主要包含Spark Core、Spark SQL、Spark Streaming、MLLib和GraphX等组件。

Spark Core：包含了Spark的基本功能，如内存计算、任务调度、部署模式、故障恢复、存储管理等。Spark建立在统一的抽象RDD之上，使其可以基本一致的方式应对不同的大数据处理场景。通常所说的Apache Spark，就是指Spark Core；
Spark SQL：它允许开发人员直接处理RDD，也可查询Hive、HBase等外部数据源。它的一个重要特点是能够统一处理关系表和RDD，使开发人员使用SQL命令进行查询，并进行复杂的数据分析；
Spark Streaming：支持高吞吐量、可容错处理的实时流数据处理，其核心思路是将流式计算分解成一系列短小的批处理作业。支持多种数据输入源，如Kafka、Flume、和TCP套接字。
MLlib（机器学习）：提供常用的机器学习算法，含聚类、分类、回归、协同过滤。
GraphX（图计算）：是Spark中用于图计算的API，可认为是Pregel在Spark上的重写和优化。
![spark应用场景](https://upload-images.jianshu.io/upload_images/10970403-9392787513c4dd23.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

### spark基本组件

RDD：Resillient Distributed DataSet，弹性分布式数据集，是分布式内存的一个抽象概念，提供一种高度受限的共享内存模型；
DAG：Directed Acyclic Graph，有向无环图，反映RDD之间的依赖关系；
Executor：运行在工作节点（Worker Node）上的一个进程，负责运行Task；
Application：用户编写的Spark应用程序；
Job：一个Job含多个RDD及作用于RDD上的各种操作；
Stage：是Job的基本调度单位，一个Job分为多组Task，每组Task被称为Stage，或者称为TaskSet，代表了一组关联的、相互之间没有Shuffle依赖关系的任务组成的任务集；
Task：运行在Executor上的工作单元。

### Spark运行架

集群资源管理器（Cluster Manager），可以是Spark自带的资源管理器，也可是YARN、Mesos等资源管理框架；
工作节点（WorkNode）：运行作业任务；
每个应用的任务控制节点（Driver）
每个工作节点上负责具体任务的执行进程（Executor）

在Spark中，一个Application由一个Driver和若干个Job构成，一个Job由多个Stage构成构成，一个Stage由多个没有Shuffle关系的Task组成。当执行Application时，Driver会向集群资源管理器申请资源，启动Executor，并向Executor发送应用程序代码和文件，然后在Executor上执行Task，运行结束后，执行结果返回给Driver，或者写到HDFS或者其他数据库中。

### spark 运行流程

![Spark运行框架](https://upload-images.jianshu.io/upload_images/10970403-6e9c202626e9b817.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- 提交Application后, Drive创建 一个SparkContext, 简称sc, sc负责与集群管理组件通信,包括资源申请, 任务分配, 任务监控等

- 资源管理器为Executor分配资源 启动Executor进程 并发心跳包到资源管理器

- SparkContext根据RDD的依赖关系构建DAG图，DAG图提交给DAGScheduler进行解析，将DAG图分解成Stage，并计算Stage间的依赖关系，然后将一个个TaskSet（即Stage）提交给底层调度器TaskScheduler进行处理；Executor向SparkContext申请Task，TaskScheduler将Task发放给Executor运行，同时，SparkContext将应用程序代码发送给Executor；

- Task在Executor上运行，结果反馈给TaskScheduler，然后反馈给DAGScheduler-，运行完毕后写入数据，并释放资源。

## Spark设计与原理

Spark的核心是建立在统一的抽象RDD上，使Spark的各个组件无缝进行集成，在同一个应用程序中完成大数据计算任务。不同的RDD间的转换操作形成依赖关系，可实现管道化，避免中间结果的存储，降低数据复制、磁盘IO和序列化开销。

### RDD

一个RDD是一个分布式对象集合，只读的分区记录集合。每个RDD可分成多个分区，每个分区是一个数据集片段，不同分区可保存到集群中不同的节点上，从而在集群的不同节点上并行计算。RDD是高度受限的共享内存模型，即RDD是只读的记录分区的集合，不能直接修改，只能基于稳定的物理存储中的数据集创建RDD，或者通过在其他RDD上执行确定的转换操作（如map、join、group by）而创建新的RDD。

RDD提供了“动作”（Action）和“转换”（Transformation），动作（count、collect等）用于执行计算并指定输出的形式，接受RDD，但是返回非RDD，而输出一个值或结果；转换（map、filter、groupBy、join）指定RDD间的相互依赖关系，接受RDD并返回RDD。RDD提供的API都是类似于map、filter、groupBy、join的粗粒度数据转换操作，不是针对某个数据项的细粒度修改。因此，RDD适合于对数据集中元素执行相同操作的批处理应用，而不适于需要异步、细粒度转换的应用。

RDD采用惰性调用，即在RDD执行过程中，真正的计算发生在RDD的动作操作，对于之前的所有转换操作，Spark只记录RDD生成的轨迹，即相互间的依赖关系，而不会触发真正的计算。进行动作操作的时候，Spark会根据RDD的依赖关系生成DAG，并从起点开始真正的计算。Spark根据RDD的依赖关系生成DAG，其中的逻辑处理成为一个Lineage（血缘关系），即DAG拓扑排序的结果。通过血缘关系连起来的RDD操作可实现管道化（pipeline），避免多次转换操作之间的数据同步等待，不会产生过多的中间数据，管道化后，一个操作的结果直接管道式地流入下一个操作。管道化也保证了每个操作在处理逻辑上的单一性，不像MR那样，为减少MR过程，在单个MR中写入复杂的逻辑。

#### rdd 特点

高效的容错性。现有的分布式共享内存，KV存储，内存数据库等，为实现容错，须在集群节点之间进行数据复制或记录日志，这样节点间会有大量的数据传输。对于数据密集型应用而言会带来很大的开销。而在RDD的设计中，数据只读，不可修改。若需修改数据，须从父RDD转换到子RDD，在不同的RDD间建立血缘关系。所以，RDD天生具有容错机制，不需通过数据冗余的方式（如检查点）实现容错，只需通过RDD父子依赖（血缘）关系重新计算得到丢失的分区来实现容错，无需回归整个系统，避免数据复制的高开销，且重算可在不同节点间并行进行，实现高效容错。RDD依赖关系只需记录粗粒度转换操作，不需记录具体的数据和各种细粒度操作日志，降低了数据密集型应用的容错开销。
中间结果持久化到内存。数据在内存中多个RDD操作之间进行传递，不需“落地”到磁盘，避免不必要的磁盘IO开销。
存放的数据可是Java对象，避免不必要的对象序列化和反序列化。

![宽依赖和窄依赖](https://upload-images.jianshu.io/upload_images/10970403-e050577e50da9dac.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
宽窄依赖关系，使Spark具有天生的容错性，加快了Spark的执行速度。当RDD部分分区数据丢失时，可通过血缘关系获取足够的信息来重新运算和恢复丢失的数据分区，从而带来性能提升。窄依赖的失败更为高效，它只需根据父RDD分区重新计算丢失的分区即可，且可在不同的节点并行计算。

### Stage划分

Spark根据RDD的依赖关系生成DAG，在分析RDD中分区之间的依赖关系划分Stage。划分方法：在DAG中进行反向解析，遇到宽依赖就断开，遇到窄依赖就把当前的RDD加入到Stage中；将窄依赖尽量划分到同一个Stage中，可实现流水线计算。
Stage的类型包括两种：ShuffleMapStage和ResultStage。

ShuffleMapStage：不是最终的Stage，它之后还有其他Stage。它的输出需要经过Shuffle过程，作为后续Stage的输入；此Stage以Shuffle为输出边界，起输入边界可从外部获取数据，也可是另一个ShuffleMapStage的输出，其输出可是另一个Stage的开始。一个Job里可能有，也可能没有该类型的Stage；
ResultStage：最终的Stage，没有输出，而是直接产生结果或存储。其输入边界可是从外部获取数据，也可是另一个ShuffleMapStage的输出。一个Job中必定有该类型的Stage。

### RDD运行过程

- 创建RDD对象；
- SparkContext负责计算RDD之间的依赖关系，构建DAG；
- DAGScheduler负责将DAG图分解成多个Stage，每个Stage中含多个Task，每个Task会被TaskScheduler分发给各个WorkNode上的Executor去执行。

  ![RDD在Spark中的运行过程](http://upload-images.jianshu.io/upload_images/10970403-69352791b0ddbb74?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

### DataFrame

### Hive On Spark

Spark SQL增加SchemaRDD（即带有Schema信息的RDD），使得可执行SQL语句。Spark SQL的数据即可来自RDD，也可来自Hive、HDFS、Cassandra等外部数据源，还可以是Json格式的数据。Spark SQL支持Scala、Java、Python语言。

![Spark SQL架构](http://upload-images.jianshu.io/upload_images/10970403-990ca4bcf33f8673?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

## Spark On Yarn

## Spark Streaming

## Spark部署

![image.png](https://upload-images.jianshu.io/upload_images/10970403-57feec355db9e5b3.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

## Spark 调优
