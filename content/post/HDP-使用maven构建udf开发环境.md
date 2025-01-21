---
title: 大数据-HDP使用maven构建udf开发环境
date: 2022-04-01T00:00:00+08:00
draft: false
tags:
  - 机器学习
categories:
  - 杂技浅尝
toc: true
summary: 这是文章的摘要部分
---
环境： 
-  idea 2017
- maven 4.0
- hive 	1.2.1.2.6
- win10

## 创建maven项目

```xml

<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>hive</groupId>
    <artifactId>udf</artifactId>
    <version>1.0-SNAPSHOT</version>
    <packaging>jar</packaging>

    <name>hive</name>
    <url>http://maven.apache.org</url>

    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.apache.hive</groupId>
            <artifactId>hive-exec</artifactId>
            <version>0.13.0</version>
        </dependency>
    </dependencies>

</project>

```
等待安装好依赖

## 编写UDF函数

编写一个生成MD5函数

```java
public class my_udf extends UDF {

    public String my_udf(String s) {
        return getMD5(s);
    }
    public static String getMD5(String str) {
        try {
            // 生成一个MD5加密计算摘要
            MessageDigest md = MessageDigest.getInstance("MD5");
            // 计算md5函数
            md.update(str.getBytes());
            // digest()最后确定返回md5 hash值，返回值为8为字符串。因为md5 hash值是16位的hex值，实际上就是8位的字符
            // BigInteger函数则将8位的字符串转换成16位hex值，用字符串来表示；得到字符串形式的hash值
            return new BigInteger(1, md.digest()).toString(16);
        } catch (Exception e) {
            System.out.print("MD5加密出现错误");
        }
        return "error";
    }


}

```
## 生成jar包

idea 里面直接点package

## 上传jar包




使用jar文件
```sql
add jar hdfs:///user/admin/udf-md5.jar;
create temporary function my_udf as 'my_udf';
select my_udf(word_count.column1) from word_count limit 5

```