---
title: ML-spark 使用ml步骤
date: 2019-10-12T10:39:46+08:00
draft: false
tags:
  - 机器学习
categories:
  - 杂技浅尝
toc: true
summary: 这是文章的摘要部分
---

> 使用大数据工具进行数据预测

<!--more-->
```scale
import org.apache.spark.ml.Pipeline
import org.apache.spark.ml.classification._
import org.apache.spark.ml.evaluation.MulticlassClassificationEvaluator
import org.apache.spark.ml.feature.{IndexToString, StringIndexer, VectorAssembler}
import org.apache.spark.ml.param.ParamMap
import org.apache.spark.sql.SQLContext
import org.apache.spark.{SparkConf, SparkContext}
 
 
object ClassificationPipeline {
 def main(args: Array[String]) {
 if (args.length < 1){
 println("Usage:ClassificationPipeline inputDataFile")
 sys.exit(1)
 }
 val conf = new SparkConf().setAppName("Classification with ML Pipeline")
 val sc = new SparkContext(conf)
 val sqlCtx = new SQLContext(sc)
 ```
 
 ## Step 1
读取原始数据
* 3.6216,8.6661,-2.8073,-0.44699,0
 * 4.5459,8.1674,-2.4586,-1.4621,0
 * 3.866,-2.6383,1.9242,0.10645,0
 * 3.4566,9.5228,-4.0112,-3.5944,0
 * 0.32924,-4.4552,4.5718,-0.9888,0
 * ... ...
 */

```scala
 val parsedRDD = sc.textFile(args(0)).map(_.split(",")).map(eachRow => {
 val a = eachRow.map(x => x.toDouble)
 (a(0),a(1),a(2),a(3),a(4))
 })
 val df = sqlCtx.createDataFrame(parsedRDD).toDF(
 "f0","f1","f2","f3","label").cache()
``` 
 
 ## Step 2
 为了容易使用机器学习算法 设置lable index 从0开始 
```scala
val labelIndexer = new StringIndexer()
 .setInputCol("label")
 .setOutputCol("indexedLabel")
 .fit(df)
 ```
 
 ##  Step 3
 定义特征列
 
 ```scala
 
 val vectorAssembler = new VectorAssembler()
 .setInputCols(Array("f0","f1","f2","f3"))
 .setOutputCol("featureVector")
 
```
##  Step 4
创建随机森林分类器
```scala
val rfClassifier = new RandomForestClassifier()
 .setLabelCol("indexedLabel")
 .setFeaturesCol("featureVector")
 .setNumTrees(5)
 ```


## Step 5
转换lable列 到原始数据

```scala
val labelConverter = new IndexToString()
 .setInputCol("prediction")
 .setOutputCol("predictedLabel")
 .setLabels(labelIndexer.labels)
 ```
 
 
 ## Step 6
拆分数据

```scala
val Array(trainingData, testData) = df.randomSplit(Array(0.8, 0.2))`
``` 
 ## Step 7
 创建 ML pipeline .
 
```scala
val pipeline = new Pipeline().setStages(Array(labelIndexer,vectorAssembler,rfClassifier,labelConverter))
 val model = pipeline.fit(trainingData)
```
## Step 8
 设置填充数据预测
 
```scala
val predictionResultDF = model.transform(testData)`
``` 
 
 ##  Step 9
选择标签行

```scala
predictionResultDF.select("f0","f1","f2","f3","label","predictedLabel").show(20)`
```
 
##  Step 10
输出准确率
```scala
val evaluator = new MulticlassClassificationEvaluator()
 .setLabelCol("label")
 .setPredictionCol("prediction")
 .setMetricName("precision")
 val predictionAccuracy = evaluator.evaluate(predictionResultDF)
 println("Testing Error = " + (1.0 - predictionAccuracy))
 ```
 
 ## Step 11
保存模型

```scala
val randomForestModel = model.stages(2).asInstanceOf[RandomForestClassificationModel]
 println("Trained Random Forest Model is:\n" + randomForestModel.toDebugString)
 }
}```