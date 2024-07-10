---
title: 如何使用 golang 写单测
tags:
  - 编程经验
date: 2024-04-18T17:09:27+08:00
draft: false
toc: true
slug: 20240418170927
feature: 
categories:
  - 杂技浅尝
---
很多程序员写了几年的代码, 连最基本的单测都不会写, 属实有点说不过去
<!--more-->


生成二进制文件
`go test -c`

指定二进制名称
`go test -c -o `

执行某一个函数测试
`./xx.test -test.run "TestUnitReport$" -test.v`

## 意义
提前发现问题
边界问题
方便在代码出现 bug 时及时调试
为了写单测，会督促大家减少复杂代码的耦合性（代码可单测）

副作用
需要投入时间和精力
测试数据需要频繁维护
一般研发人员不喜欢单测

## 单测在 golang 中的地位
Go语言在工具链和标准库中提供对测试的原生支持，
TestMain函数包含了测试用例的初始化和主函数的测试逻辑。
## 最简单示例-如何写单测

文件目录结构
```bash
➜  util git:(feature/1.3.0) ✗ tree
.
├── utils.go
└── utils_test.go
```

utils.go 的被测函数
```go
// In returns whether item is in array, like keyword `in` in python.
func In(item string, array []string) bool {
	for _, t := range array {
		if item == t {
			return true
		}
	}
	return false
}
```
![image.png](https://img.yunpiao.site/ob/202404181708718.png)

> 手动执行命令为 go test -v -run ^TestIn$


### 自动生成方法 - goland

使用 goland 的生成功能， 生成单测函数
![image.png](https://img.yunpiao.site/ob/20230706114853.png)
模式模板为表驱动测试方式
![image.png](https://img.yunpiao.site/ob/20230706114933.png)

>表驱动测试
表驱动测试本身是编程语言无关的。Go核心团队和Go早期开发者在实践过程中发现表驱动测试十分适合Go代码测试并在标准库和第三方项目中大量使用此种测试设计，这样表驱动测试也就逐渐成为Go的一个惯用法。就像我们从上面的示例中看到的那样，表驱动测试有着诸多优点
![](https://img.yunpiao.site/ob/20230705181049.png)



### 常用的 testing 函数

```python
Fail : 测试失败，测试继续，也就是之后的代码依然会执行
FailNow : 测试失败，测试中断
Log : 输出信息
Logf : 输出格式化的信息
Skip : 相当于 Log + SkipNow
Skipf : 相当于 Logf + SkipNow
SkipNow : 跳过测试，测试中断
Error : 相当于 Log + Fail
Errorf : 相当于 Logf + Fail
Fatal : 相当于 Log + FailNow
Fatalf : 相当于 Logf + FailNow
```

### 单测形式
```go
TestXxxx(t *testing.T)    // 基本测试用例 以验证某个功能是否正常工作。该函数通常包含一个或多个测试用例，用于测试代码的不同方面。测试用例可以使用断言检查程序的预期输出是否与实际输出一致。
BenchmarkXxxx(b *testing.B) // 压力测试的测试用例,验证代码在高负载下的性能表现。压力测试可以使用不同的测试负载来测试代码在不同负载下的响应时间、吞吐量和资源使用情况等
Example_Xxx()  // 测试控制台输出的例子,编写测试示例，以输出预期的控制台输出。这些输出通常用于验证程序是否按照预期的行为执行
TestMain(m *testing.M) // 测试 Main 函数 TestMain函数包含了测试用例的初始化和主函数的测试逻辑。
```


### 其他测试形式
- 包外测试
与包内测试本质是面向实现的白盒测试不同，包外测试的本质是一种面向接口的黑盒测试
Go标准库中包内测试和包外测试的使用情况

包内测试
	优点， 
		内部函数可以直接使用
	不足， 
		测试代码自身需要经常性的维护
		包的循环依赖 使用包外测试 或者调整结构
	
外部测试
	优点
		没有循环依赖
		不需要经常维护
	缺点
		访问有限  解决方法， 通过外部暴露的方式 使用内部包的 _test 文件给外部使用



### 单测组织结构

1. 平铺
	简单 
	独立
	
2. 基于测试套件和测试用例的xUnit实践模式进行组织
![image.png](https://img.yunpiao.site/ob/20230705155338.png)

#### 对比

![image.png](https://img.yunpiao.site/ob/20230705155359.png)


### 测试数据准备

测试固件是指一个人造的、确定性的环境，一个测试用例或一个测试套件（下的一组测试用例）在这个环境中进行测试，其测试结果是可重复的（多次测试运行的结果是相同的）。我们一般使用setUp和tearDown来代表测试固件的创建/设置与拆除/销毁的动作

下面是一些使用测试固件的常见场景：
◦  将一组已知的特定数据加载到数据库中，测试结束后清除这些数据；
◦  复制一组特定的已知文件，测试结束后清除这些文件；
◦  创建伪对象（fake object）或模拟对象（mock object），并为这些对象设定测试时所需的特定数据和期望结果。
![image.png](https://img.yunpiao.site/ob/20230705160127.png)


testdata 文件夹用于存放测试需要的数据
>![image.png](https://img.yunpiao.site/ob/20230707095813.png)


测试代码对外部文件数据的依赖之外，还会经常面对被测代码对外部业务组件或服务的依赖。此外，越是接近业务层，被测代码对外部组件或服务依赖的可能性越大。

使用辅助函数

你不需要一个真实的数据库来满足运行单元测试的需求。
测试代码对外部文件数据的依赖之外，还会经常面对被测代码对外部业务组件或服务的依赖。此外，越是接近业务层，被测代码对外部组件或服务依赖的可能性越大。比如：
◦  被测代码需要连接外部Redis服务；
◦  被测代码依赖一个外部邮件服务器来发送电子邮件；
◦  被测代码需与外部数据库建立连接并进行数据操作；
◦  被测代码使用了某个外部RESTful服务。

![image.png](https://img.yunpiao.site/ob/20230705181409.png)
替身概念
在GitHub上有一个名为gostub（https://github.com/prashantv/gostub）的第三方包可以用于简化stub替身的管理和编写。以上面的例子为例，如果改写为使用gostub的测试，代码如下

![image.png](https://img.yunpiao.site/ob/20230705182354.png)

模糊测试 go-fuzz



单测要做的事就是针对各个函数，构造好运行环境、输入数据、依赖的api、断言好结果

#### 构造运行环境

依赖的redis、api 这些，可以直接通过 测试配置文件 的形式 启动起来，在开发机上搭建好redis、api服务，从真实服务上获取数据，也可以mock掉返回结果
