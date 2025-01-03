---
title: Mysql基础知识
tags:
  - linux
  - 运维
  - 杂
date: 2023-07-16T15:57:42+08:00
draft: false
hideInList: false
isTop: false
toc: true
slug: 20240416155743
---
![](https://img.yunpiao.site/blog/202404172143494.png)

# 存储引擎

`show engines;`

5.7版本所有的存储引擎中只有 InnoDB 是事务性存储引擎，也就是说**只有 InnoDB ⽀持事务**。

`show table status like "table_name" ;`

mysql 数据库的 user 表是 MyISAM 存储结构

MyISAM 性能好

**MyISAM和InnoDB区别**

  MyISAM采⽤表级锁(table-level locking)。

  InnoDB⽀持⾏级锁(row-level locking)和表级锁,默认为⾏级锁

MyISAM是MySQL的默认数据库引擎（5.5版之前）。虽然性能极佳，⽽且提供了⼤量的特性，

包括全⽂索引、压缩、空间函数等，但MyISAM不⽀持事务和⾏级锁，⽽且最⼤的缺陷就是崩溃

后⽆法安全恢复。不过，5.5版本之后，MySQL引⼊了InnoDB（事务性数据库引擎），MySQL

5.5版本后默认的存储引擎为InnoDB。

InnoDB 优点

  - 支持行级别锁

  - 支持事务和崩溃后恢复

  - 支持外键

  - ... 等

### 字符集

> MySQL采⽤的是类似继承的⽅式指定字符集的默认值，每个数据库以及每张数据表都有⾃⼰的默认值，他们逐层继承。⽐如：某个库中所有表的默认字符集将是该数据库所指定的字符集（这些表在没有指定字符集的情况下，才会采⽤默认字符集）

### **索引**

> 索引是存储引擎用于提高数据库表的访问速度的一种「数据结构」。



有BTree索引 和 哈希索引, 单条优先的时候选择哈希索引， 否则选择 Btree 索引。

B树中的B+Tree 在两种方式下的实现方式不同

- MyISAM: B+Tree叶节点的data域存放的是数据记录的地址。在索引检索的时候，⾸先按照B+Tree搜索算法搜索索引，如果指定的Key存在，则取出其 data 域的值，然后以 data 域的值为地址读取相应的数据记录。这被称为“⾮聚簇索引”。

- InnoDB: 其数据⽂件本身就是索引⽂件。相⽐MyISAM，索引⽂件和数据⽂件是分离的，其表数据⽂件本身就是按B+Tree组织的⼀个索引结构，树的叶节点data域保存了完整的数据记录。这个索引的key是数据表的主键，因此InnoDB表数据⽂件本身就是主索引。这被称为“聚簇索引（或聚集索引）”。⽽其余的索引都作辅助索引。辅助索引的data域存储相应记录主键的值⽽不是地址，这也是和MyISAM不同的地⽅。**在根据主索引搜索时，直接找到key所在的节点即可取出数据；在根据辅助索引查找时，则需要先取出主键的值，再⾛⼀遍主索引。 因此，在设计表的时候，不建议使⽤过⻓的字段作为主键，也不建议使⽤⾮单调的字段作为主键，这样会造成主索引频繁分裂。 PS：整理⾃《Java⼯程师修炼之道》**

### 缓存

mysql 8.0 版本前会有缓存的概念, 直接返回缓存中的结果

### 事务

**事务四大特征**

- A：Atomic，原子性，将所有SQL作为原子工作单元执行，要么全部执行，要么全部不执行；

- C：Consistent，一致性，事务完成后，所有数据的状态都是一致的，即A账户只要减去了100，B账户则必定加上了100；

- I：Isolation，隔离性，如果有多个事务并发执行，每个事务作出的修改必须与其他事务隔离；

- D：Duration，持久性，即事务完成后，对数据库数据的修改被持久化存储。

单条 SQL 默认是事务的， 称为*`隐式事务`*。 

多条之间使用 BEGIN; COMMIT; 包括

```SQL
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;

-- ROLLBACK回滚事务
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
ROLLBACK;
```


### 事务控制语句：

- BEGIN 或 START TRANSACTION 显式地开启一个事务；

- COMMIT 也可以使用 COMMIT WORK，不过二者是等价的。COMMIT 会提交事务，并使已对数据库进行的所有修改成为永久性的；

- ROLLBACK 也可以使用 ROLLBACK WORK，不过二者是等价的。回滚会结束用户的事务，并撤销正在进行的所有未提交的修改；

- SAVEPOINT identifier，SAVEPOINT 允许在事务中创建一个保存点，一个事务中可以有多个 SAVEPOINT；

- RELEASE SAVEPOINT identifier 删除一个事务的保存点，当没有指定的保存点时，执行该语句会抛出一个异常；

- ROLLBACK TO identifier 把事务回滚到标记点；

- SET TRANSACTION 用来设置事务的隔离级别。InnoDB 存储引擎提供事务的隔离级别有READ UNCOMMITTED、READ COMMITTED、REPEATABLE READ 和 SERIALIZABLE。

### 事务隔离

**并发事务带来的问题**

- 脏读 另一个事务**读到了没提交**的数据

- 丢失修改 两个事务**同时修改**数据造成某一个丢失

- 不可重复读 一个事务读取到了另一个事务**修改**前后的**两个不同值**或**不同数量的数据**

- 幻读 select 某记录是否存在，不存在，准备插入此记录，但**执行 insert 时发现此记录已存在，无法插入**



**MySQL 不同级别对应的并发事务问题**

|Isolation Level|脏读（Dirty Read）|不可重复读（Non Repeatable Read）|幻读（Phantom Read）|
|-|-|-|-|
|Read Uncommitted 读取未提交|Yes|Yes|Yes|
|Read Committed 读取已提交|-|Yes|Yes|
|**Repeatable Read 可重复读（MySQL 默认）**|-|-|Yes|
|Serializable 可串行化|-|-|-|

默认情况下， MySQL 会出现幻读的问题， 但是进行了解决

### **快照读和**当前读

**在读未提交隔离级别下，快照是什么时候生成的？**

没有快照，因为不需要，怎么读都读到最新的。不管是否提交

**在读已提交隔离级别下，快照是什么时候生成的？**

SQL语句开始执行的时候。

**在可重复读隔离级别下，快照是什么时候生成的？**

事务开始的时候



**1.在默认隔离级别下，select 语句默认是快照读**

```Plain Text
select a from t where id = 1
复制代码
```


**2.select 语句加锁是当前读**

```Plain Text
# 共享锁
select a from t where id = 1 lock in share mode;

#排他锁
select a from t where id = 1 for update;
复制代码
```


**3.update 语句是当前读**

```Plain Text
update t set a = a + 1;

```
