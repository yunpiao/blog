---
title: 经验-cursor 如何有效使用
tags: 
date: 2025-06-04T15:01:26+08:00
draft: false
toc: true
slug: 20250604150126
categories:
---
>  目前使用 cursor 做程序的实践, cursor 版本: 0.50.7

三大件 MCP + Doc + Rules
  
## 1. MCP 使用
MCP（Model Context Protocol）是 Cursor 提供的一种机制，允许 AI 助手通过外部服务器获取实时、准确的文档或数据，以增强代码生成的质量。以下是你提到的三个 MCP 的使用实践：

### 1.1 deepwiki
概述： Deepwiki MCP 是一个开源工具，用于从 GitHub 仓库或 Deepwiki 网站（deepwiki.com）获取最新的文档或代码库内容，特别适合需要爬取 GitHub 仓库文档的场景。它通过 MCP 协议将爬取的内容转换为 Markdown 格式，供 Cursor 使用
**使用方法：**
- 在 Cursor 中输入类似 use deepwiki https://deepwiki.com/shadcn-ui/ui 的提示，获取指定 Deepwiki 页面内容。
- 支持单页或多页爬取，例如 use deepwiki multiple pages https://deepwiki.com/shadcn-ui/ui。
- 可指定爬取深度和输出格式（单一文档或按页面分割）。

### 1.2 context7
Context7 MCP 是 Upstash 提供的服务，专注于为 LLMs 提供版本特定的最新文档和代码示例，解决 AI 模型生成过时或错误代码的问题。它与 Cursor、Windsurf 等 MCP 兼容客户端无缝集成。
**使用方法：**
- 在 Cursor 提示中添加 use context7，例如：`Create a Next.js API route with Hono. use context7` Context7 将从官方文档拉取最新代码示例，注入到 LLM 的上下文。    
- 支持版本特定的文档查询，例如指定 Next.js 或 React Query 的具体版本
### 1.3 mcp-feedback-enhanced
在AI辅助开发工具中实现人机协作工作流。通过引导AI与用户确认而不是进行推测性操作，它可以将多达25个工具调用 consolidation 成一个以反馈为导向的请求，从而大大降低平台成本。
**使用方法:**
- 配合 rules 使用, llm 制定多个计划, 调用该工具与用户进行确认, 确认后继续执行, 节省请求数
### 1.4 示例
```json
{  
    "mcpServers": {  
        "deepwiki": {  
            "command": "npx",  
            "args": [  
                "-y",  
                "mcp-deepwiki@latest"  
            ]  
        },  
        "context7": {  
            "command": "npx",  
            "args": [  
                "-y",  
                "@upstash/context7-mcp"  
            ],  
            "env": {  
                "DEFAULT_MINIMUM_TOKENS": "6000"  
            }  
        },  
        "mcp-feedback-enhanced": {  
            "command": "uvx",  
            "args": [  
                "--python",  如果你是远程连接的, 最好加上这个参数
                "/home/yunpiao/anaconda3/bin/python",  如果你是远程连接的, 最好加上这个参数
                "mcp-feedback-enhanced@latest"  
            ],  
            "env": {  
                "FORCE_WEB": "true",  
                "MCP_DEBUG": "false"  
            },  
            "timeout": 600,  
            "autoApprove": [  
                "interactive_feedback"  
            ]  
        }  
    }  
}}

```

## 2. Doc
Cursor 0.50.7 支持多种方式获取文档，以增强 AI 助手的上下文准确性。以下是你提到的三种方式：
### 2.1 自带的 docs 文档
Cursor 内置了 @ 语法，可直接调用特定库或框架的官方文档。例如，@nginx 会从官方来源获取 Nginx 的最新文档。


### 2.2 增加网页文档(爬虫方式-官方支持)
Cursor 0.50.7 支持通过爬虫方式从指定网页获取文档，官方提供了集成工具，允许用户指定 URL 并将内容注入 LLM 上下文。
cursor 命令输入框(crtl+shift+p 打开)中填写 `>Add New Custom Docs`, 之后填写需要进行爬取的网站, 例如`https://nginx.org/en/docs/`
### 2.3 增加 github 文档, 使用 deepwiki 方式
对于一些没有文档的 github\gitlab 项目可以使用 deepwiki 转换成 wiki, 用于添加 doc
> 最简单方法, 更改域名中的 github 为 deepwiki , 然后添加到 custom doc 里面

## 3. Rules 
### 3.1 针对项目设置user cursor rules

我现在使用的 rules, 找不出出处了, 好像在一个回复里扒出来的, 如果这个有版权的话, 可以联系我删除
```
你是Cursor IDE的AI编程助手，遵循核心工作流（研究->构思->计划->执行->评审）用中文协助用户，面向专业程序员，交互应简洁专业，避免不必要解释。

[沟通守则]
1.  响应以模式标签 `[模式：X]` 开始，初始为 `[模式：研究]`。
2.  核心工作流严格按 `研究->构思->计划->执行->评审` 顺序流转，用户可指令跳转。

[核心工作流详解]
1.  `[模式：研究]`：理解需求。
2.  `[模式：构思]`：提供至少两种可行方案及评估（例如：`方案1：描述`）。
3.  `[模式：计划]`：将选定方案细化为详尽、有序、可执行的步骤清单（含原子操作：文件、函数/类、逻辑概要；预期结果；新库用`Context7`查询）。不写完整代码。完成后用`interactive-feedback`请求用户批准。
4.  `[模式：执行]`：必须用户批准方可执行。严格按计划编码执行。计划简要（含上下文和计划）存入`./issues/任务名.md`。关键步骤后及完成时用`interactive-feedback`反馈。
5.  `[模式：评审]`：对照计划评估执行结果，报告问题与建议。完成后用`interactive-feedback`请求用户确认。

[快速模式]
`[模式：快速]`：跳过核心工作流，快速响应。完成后用`interactive-feedback`请求用户确认。

[主动反馈与MCP服务]
* **通用反馈**：研究/构思遇疑问时，使用 `interactive_feedback` 征询意见。任务完成（对话结束）前也需征询。
* **MCP服务**：
    * `interactive_feedback`: 用户反馈。
    * `Context7`: 查询最新库文档/示例。
    * 优先使用MCP服务。
```
### 3.2 自动生成 cursor rules
llm 对话框中输入`/Generate Cursor Rules`, 会生成一份 project rules, 记得设置这个 rules 属性为 always, 这种 rules 可以让 llm 保持一致性, 不至于每次对话都跟换了一个新手一样
### 3.3. 设置项目背景 cursor rules

可以将自己的编程习惯再新建一个 rules, 可以帮助 llm 生成符合你要求的代码
```
### 微信小程序最佳实践规则集 

```yaml
version: 1
rules:
  # ========== 性能优化规则 ==========
  # 图片优化
  - name: "optimize-images"
    pattern: |
      <image\s+src="(.+?)"\s*/>
    replacement: |
      <image src="{{_match_1}}" mode="widthFix" lazy-load="true" />
    message: "图片应启用懒加载和适当模式"
    severity: warning
    scope: 
      files: ["*.wxml"]

  # 减少setData数据量
  - name: "minimal-setdata"
    pattern: |
      this\.setData\(\s*\{[^}]*[^}]{100,}\s*\}\s*\)
    message: "setData数据不应超过100字符，仅更新必要字段"
    severity: error

  # 防抖节流
  - name: "debounce-events"
    pattern: |
      (bindtap|bindinput|bindscroll)="(\w+)\"
    replacement: |
      {{_match_1}}="debounce({{_match_2}})"
    message: "高频事件(如滚动、输入)应添加防抖/节流"
    severity: warning

  # ========== 代码规范规则 ==========
  # 组件命名规范
  - name: "component-naming"
    pattern: |
      Component\(\{\s*properties:\s*\{\s*([a-z]\w+)\s*:
    replacement: |
      properties: {
        {{ regex_replace(_match_1, '^.', _match_1 | lower) }}: 
    message: "组件属性名应使用小驼峰命名法"
    severity: warning

### 使用效果验证
1. 在WXML中写`<image src="...">`会触发优化建议
2. 在JS中写`this.setData({ largeData })`会检查数据量
3. API调用不加错误处理会显示错误提示
4. 敏感信息检测会阻止提交含`token='...'`的代码

> 最佳实践：结合微信开发者工具的"代码质量扫描"和"性能分析"功能，定期检查规则执行效果，根据项目需求调整规则强度。


```