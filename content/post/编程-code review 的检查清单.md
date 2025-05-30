---
title: 编程-code review 的检查清单
tags:
  - 编程经验
  - 总结
date: 2024-11-14T11:05:56+08:00
draft: false
toc: true
slug: "20241114150556"
categories:
  - 杂技浅尝
---
# 代码审核清单
## 1. 代码结构

- **代码长度与复杂度**：检查是否有过长的函数或方法，过于复杂的嵌套逻辑，或是入参过多的情况。尽量将长函数拆分成多个小函数，保持代码简洁易懂。
- **重复代码**：是否存在重复代码片段？重复代码应该提取成公共方法或类，减少维护成本。
- **死循环与异常处理**：确保没有不必要的死循环，所有可能的异常都应得到适当的处理和记录。

## 2. 代码注释

- **注释规范**：确保注释简洁明了，特别是在复杂的逻辑部分。注释应清晰地描述为什么这么做，而不仅仅是代码的实现细节。
- **注释位置**：注释应放在合适的位置，避免过于冗长。函数头部、复杂条件判断前、特殊逻辑部分等地方尤为重要。
- **缩进与格式化**：代码的缩进和格式应统一，保持一致的空格键、制表符（tab）使用，符合团队的代码规范。

## 3. 安全性

- **资源关闭**：所有IO操作后，确保资源（如文件、数据库连接等）都被及时关闭，避免资源泄漏。
- **数据类型使用**：避免在不合适的场合使用 `double` 和 `float`，例如在涉及金额计算时，推荐使用 `BigDecimal`。
- **池大小与并发**：合理配置对象池的大小，并发操作中确保线程安全，避免死锁。
- **输入验证与异常处理**：对所有外部输入进行严格检查，避免注入攻击。异常处理时要确保不会泄露敏感信息。
- **日志与敏感信息**：日志记录应避免暴露敏感数据，且日志文件大小和保留天数要有控制。

## 4. 性能

- **SQL 优化**：关注 SQL 执行时间，避免复杂查询，尤其是对大数据集的操作。确保数据库查询已优化并使用预处理语句以防注入。
- **正则表达式性能**：正则表达式可能会影响性能，特别是在处理大量数据时。确保使用合适的正则表达式并进行优化。
- **对象复用与内存管理**：尽量复用对象，避免频繁创建和销毁，特别是在高并发环境下。考虑使用对象池来管理资源。
- **异步处理与锁优化**：使用异步 I/O 来提高性能，锁的粒度应尽可能小，以减少竞争。

## 5. 单元测试

- **可测试性**：确保代码能够被有效单元测试，关键模块应覆盖所有功能，包括异常场景。
- **异常测试**：单元测试不仅要覆盖正常流程，还应验证各种异常场景，确保代码的健壮性。

## 6. 优化

- **替代自定义方案**：考虑使用标准库或已有的高效解决方案，避免重新造轮子。
- **异步处理与缓存**：长时间运行的遍历操作是否可以异步执行？耗时函数是否可以使用缓存（如 LRU 缓存）来减少负载？
- **IO 请求合并**：多个小的 IO 请求是否可以合并成一次请求，以减少通信开销？

## 7. 运维

- **监控与指标暴露**：服务和系统应该有完善的监控，关键指标（如 CPU、内存、磁盘 I/O）要暴露出来。确保 SQL 查询时间、外部调用等重要性能指标可以监控。
- **告警系统**：合理配置告警规则，确保及时发现问题，并能快速响应。告警级别、负责人和通知方式要清晰明确。
- **探活与应急预案**：确保系统有探活机制，能够在出现问题时及时发现，并有预案处理故障。

## 8. 其他

- **业务逻辑与需求一致性**：确认业务实现符合需求，避免功能实现上的偏差。
- **代码可读性与可维护性**：代码应具有良好的可读性，修改点要考虑到对整体系统的影响，尤其是在工具函数和公共方法的修改上。
- **兼容性与异常演练**：不同操作系统、不同网络环境下的兼容性要做好测试。考虑到已知的风险和潜在故障，做好应急演练。
- **代码审查的频率与规模**：每次代码审查的代码行数应控制在200行以内，过多代码的审查容易导致疏漏。

