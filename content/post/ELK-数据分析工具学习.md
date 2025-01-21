---
title: ELK-数据分析工具学习
date: 2022-04-01T10:39:46+08:00
draft: false
tags:
  - 机器学习
categories:
  - 杂技浅尝
toc: true
summary: 这是文章的摘要部分
---
# ELK数据分析工具学习
---
## 学习参考资料
---
ElasticSearch参考手册，学习
http://elasticsearch.cn/book/elasticsearch_definitive_guide_2.x/index.html
DSL查询语法，包括查找（query）、过滤（filter）和聚合（aggs）等。
Logstash参考手册，学习数据导入，包括输入（input）、过滤（filter）和输出（ 
output）等，主要是filter中如何对复杂文本 进行拆分和类型 转化。
http://udn.yyuap.com/doc/logstash-best-practice-cn/index.html


Kibana参考手册，使用Kibana提供的前端界面对数据进行快速展示，主要是对Visulize 模块的使
https://kibana.logstash.es/content/
---
## 安装

  #### 下载

> git clone https://github.com/elastic/stack-docker

#### 安装 docker-compose

> pip install docker-compose

####  修改配置

> 修改docker-compose.yml 中ip 127.0.0.1 为 0.0.0.0

####  启动

> docker-compose up

####  访问

>http://IP:5601

####  登陆

> user=elastic password=changeme

## 参看文献

https://github.com/elastic/stack-docker
http://hao.jobbole.com/kibana/


---
## 基本操作

```bash
curl -XGET 'http://localhost:9200/_count?pretty' -d '
{
    "query": {
        "match_all": {}
    }
}
'
```

```json
{
  "count": 155300,
  "_shards": {
    "total": 79,
    "successful": 44,
    "skipped": 0,
    "failed": 0
  }
}
```


#### 使用put, 指定id
#### 使用post， 自动生成id

```bash
PUT /website/blog/123
{
  "title": "My first blog entry",
  "text":  "Just trying this out...",
  "date":  "2014/01/01"
}

```


```json
{
  "_index": "website",
  "_type": "blog",
  "_id": "R0DpVWEB9_9q-Fol0opS",
  "_version": 1,
  "result": "created",
  "_shards": {
    "total": 2,
    "successful": 1,
    "failed": 0
  },
  "_seq_no": 0,
  "_primary_term": 1
}

```

自动生成的 ID 是 URL-safe、 基于 Base64 编码且长度为20个字符的 GUID 字符串。 这些 GUID 字符串由可修改的 FlakeID 模式生成，这种模式允许多个节点并行生成唯一 ID ，且互相之间的冲突概率几乎为零。

#### 取回文档 根据_index _type _id

```bash
GET /website/blog/123
GET /website/blog/123?_source=title,text
GET /website/blog/123/_source
```

```json
{
  "_index": "website",
  "_type": "blog",
  "_id": "123",
  "_version": 1,
  "found": true,
  "_source": {
    "title": "My first blog entry",
    "text": "Just trying this out...",
    "date": "2014/01/01"
  }
}
```
如果没有 会返回
```bash
{
  "_index": "website",
  "_type": "blog",
  "_id": "123",
  "_version": 1,
  "found": true,
  "_source": {
    "title": "My first blog entry",
    "text": "Just trying this out...",
    "date": "2014/01/01"
  }
}
```

## 检查文档是否存在
```bash
HEAD /website/blog/123?_source
```
```200 - ok```
## 创建新文档

```bash
POST /website/blog/
{ ... }# 自动生成id
PUT /website/blog/123?op_type=create
{ ... }
PUT /website/blog/123/_create
{ ... }
```
```bash
{
    #如果可以创建
    201 Created
    #如果id重复
   "error": {
      "root_cause": [
         {
            "type": "document_already_exists_exception",
            "reason": "[blog][123]: document already exists",
            "shard": "0",
            "index": "website"
         }
      ],
      "type": "document_already_exists_exception",
      "reason": "[blog][123]: document already exists",
      "shard": "0",
      "index": "website"
   },
   "status": 409
}

```

#### 更新文档

```bash
PUT /website/blog/123
{
  "title": "My first blog entry",
  "text":  "I am starting to get the hang of this...",
  "date":  "2014/01/02"
}
```
```json
{
  "_index": "website",
  "_type": "blog",
  "_id": "123",
  "_version": 2,#版本会变成version2
  "result": "updated",#更改为Update
  "_shards": {
    "total": 2,
    "successful": 1,
    "failed": 0
  },
  "_seq_no": 1,
  "_primary_term": 1
}
```

#### 删除文档
```bash
DELETE /website/blog/123
```
```
#存在
{
{
  "_index": "website",
  "_type": "blog",
  "_id": "123",
  "_version": 3,
  "result": "deleted",
  "_shards": {
    "total": 2,
    "successful": 1,
    "failed": 0
  },
  "_seq_no": 2,
  "_primary_term": 1
}
}
#不存在
{
  "found" :    false,
  "_index" :   "website",
  "_type" :    "blog",
  "_id" :      "123",
  "_version" : 4
}
```

#### 并发中遇到的问题
>悲观并发控制

这种方法被关系型数据库广泛使用，它假定有变更冲突可能发生，因此阻塞访问资源以防止冲突。 一个典型的例子是读取一行数据之前先将其锁住，确保只有放置锁的线程能够对这行数据进行修改。
>乐观并发控制

Elasticsearch 中使用的这种方法假定冲突是不可能发生的，并且不会阻塞正在尝试的操作。 然而，如果源数据在读写当中被修改，更新将会失败。应用程序接下来将决定该如何解决冲突。 例如，可以重试更新、使用新的数据、或者将相关情况报告给用户。

#### 乐观并发控制
利用 _version 号来确保 应用中相互冲突的变更不会导致数据丢失。我们通过指定想要修改文档的 version 号来达到这个目的。

#### 实例流程
1.创建一个文档
```bash
PUT /website/blog/1/_create
{
  "title": "My first blog entry",
  "text":  "Just trying this out..."
}
```
version 版本号是 1
2.重建索引保存修改 指定version
```bash
PUT /website/blog/1?version=1 
{
  "title": "My first blog entry",
  "text":  "Starting to get the hang of this..."
}
```
version=2
如果version 已经是2了，再对version1进行修改，
 ```json
 {
  "error": {
    "root_cause": [
      {
        "type": "version_conflict_engine_exception",
        "reason": "[blog][1]: version conflict, current version [2] is different than the one provided [1]",
        "index_uuid": "_1drhEbXTB-rHBomeP7cJw",
        "shard": "3",
        "index": "website"
      }
    ],
    "type": "version_conflict_engine_exception",
    "reason": "[blog][1]: version conflict, current version [2] is different than the one provided [1]",
    "index_uuid": "_1drhEbXTB-rHBomeP7cJw",
    "shard": "3",
    "index": "website"
  },
  "status": 409
}
```
## 使用外部版本号 更新版本号
只有当前版本号小于更新版本号的时候，才会更新成功

```bash
PUT /website/blog/2?version=10&version_type=external
{
  "title": "My first external blog entry",
  "text":  "This is a piece of cake..."
}

```

```json
{
  "_index": "website",
  "_type": "blog",
  "_id": "2",
  "_version": 10,
  "result": "created",
  "_shards": {
    "total": 2,
    "successful": 1,
    "failed": 0
  },
  "_seq_no": 0,
  "_primary_term": 1
}
# 如果不小于
{
  "error": {
    "root_cause": [
      {
        "type": "version_conflict_engine_exception",
        "reason": "[blog][2]: version conflict, current version [10] is higher or equal to the one provided [10]",
        "index_uuid": "_1drhEbXTB-rHBomeP7cJw",
        "shard": "2",
        "index": "website"
      }
    ],
    "type": "version_conflict_engine_exception",
    "reason": "[blog][2]: version conflict, current version [10] is higher or equal to the one provided [10]",
    "index_uuid": "_1drhEbXTB-rHBomeP7cJw",
    "shard": "2",
    "index": "website"
  },
  "status": 409
}
```
#### 更新文档
```bash
POST /website/blog/1/_update
{
   "doc" : {
      "tags" : [ "testing" ],
      "views": 0
   }
}
```
