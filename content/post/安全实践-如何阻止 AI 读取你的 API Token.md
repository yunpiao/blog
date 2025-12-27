---
title: 安全实践-禁止 ClaudeCode 读取 ApiToken
tags: []
date: 2025-12-27T14:31:39+08:00
draft: false
toc: true
slug: 20251227143139
categories:
---
# Claude Code 密钥防护：如何阻止 AI 读取你的 API Token

## 背景

使用 Claude Code 的时候，我一直心里有个疑虑：这玩意儿的权限太大了。我所有的 API Token 都被它读取过，在分享的对话记录里也全都输出了。更要命的是，我用的还是第三方供应商，所以我的密钥完全是裸奔在他们的平台上。

> 这让我很不安，甚至觉得自己像个傻子。我的公网项目、我的网络资产，通通暴露给别人。作为一个专业工程师，这是不能容忍的。

所以我需要想个办法，在多端 Claude Code 上加一些限制，但又要方便执行一些需要密钥的命令——比如自动配置 DNS、自动部署 Workers。

## 方案探索（踩坑记录）

### 方案一：Bitwarden MCP

刚开始我想用 Bitwarden 的密钥管理 CLI。后来查了一下它还有个 MCP 集成，但仔细了解后发现，那个 MCP 是把所有密码都给 Claude Code。

这是个很蠢的设计。

### 方案二：文件权限 + permissions.deny

```json
{
  "permissions": {
    "deny": ["Read(~/.secrets/**)"]
  }
}
```

**问题**：这只阻止了 `Read` 工具，AI 仍然可以用 `Bash` 工具执行 `cat ~/.secrets/xxx`。

堵了前门，人家走后门。

### 方案三：PreToolUse Hook 拦截

Claude Code 支持 Hooks，可以在工具调用前拦截。写个脚本检测敏感命令：

```javascript
if (/\.secrets/i.test(command)) {
  console.error("安全阻止: 禁止访问 .secrets 目录");
  process.exit(2);
}
```

**问题**：AI 可以生成一个脚本文件，然后执行脚本来读取。

```bash
echo 'cat ~/.secrets/token' > /tmp/read.sh
sh /tmp/read.sh
```

道高一尺魔高一丈。

### 方案四：进程隔离 + 环境变量

我觉得最好的方式还是进程隔离，用环境变量的方式。但环境变量只允许通过 hook 的方式在执行 shell 命令前加载，执行完之后取消，这样才是最安全的。

进程隔离需要在 macOS 和 Linux 上都通用，所以考虑用 setUID 这种方式。把密钥编译成一个 Go 二进制文件，通过密钥管理工具获取后设置成环境变量，运行完再退出。

### 方案五：Infisical（最终方案）

发现了 Infisical——一个开源的 secrets 管理平台：

1. **云端存储**：secrets 不在本地
2. **本机登录**：`infisical login` 后会话缓存在 `~/.infisical/`
3. **CLI 注入**：`infisical run -- your-command` 自动注入环境变量

**关键洞察**：只要阻止 AI 调用 `infisical` 命令，就能实现完美隔离。

## 最终方案架构

```
┌─────────────────────────────────────────────────────┐
│                 用户侧                              │
├─────────────────────────────────────────────────────┤
│  1. infisical login        (本机登录一次)           │
│  2. infisical run -- cmd   (注入 secrets 执行)      │
│  3. Secrets 存储在 Infisical 云端                   │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│                AI 隔离层                            │
├─────────────────────────────────────────────────────┤
│  Layer 1: permissions.deny                          │
│           - Read(~/.infisical/**)                   │
│           - Read(~/.secrets/**)                     │
├─────────────────────────────────────────────────────┤
│  Layer 2: PreToolUse Hook (Bash)                    │
│           - 命令中出现 "infisical" → 阻止           │
│           - 访问敏感目录 → 阻止                     │
├─────────────────────────────────────────────────────┤
│  Layer 3: PreToolUse Hook (Write/Edit)              │
│           - 写入包含 "infisical" 的脚本 → 阻止      │
└─────────────────────────────────────────────────────┘
```

## 具体实现

### 配置 permissions.deny

编辑 `~/.claude/settings.json`：

```json
{
  "permissions": {
    "deny": [
      "Read(~/.secrets/**)",
      "Read(~/.infisical/**)",
      "Read(./.env)",
      "Read(./.env.*)"
    ]
  }
}
```

### PreToolUse Hook

创建 `~/.cc-tool/pre-tool-security-hook.js`：

```javascript
#!/usr/bin/env node
const fs = require('fs');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const hookData = JSON.parse(input);
    const result = checkToolUse(hookData);

    if (result.blocked) {
      console.error(result.reason);
      process.exit(2);
    }
    process.exit(0);
  } catch (err) {
    process.exit(0);
  }
});

function checkToolUse(hookData) {
  const toolName = hookData.tool_name || '';
  const toolInput = hookData.tool_input || {};

  // 检查 Write/Edit 工具
  if (toolName === 'Write' || toolName === 'Edit') {
    const content = toolInput.content || toolInput.new_string || '';
    const filePath = toolInput.file_path || '';

    if (/infisical/i.test(content)) {
      const scriptExtensions = /\.(sh|bash|zsh|py|rb|pl|js|ts)$/i;
      const hasShebang = /^#!.*\/(bash|sh|zsh|python|ruby|perl|node)/i.test(content);

      if (scriptExtensions.test(filePath) || hasShebang) {
        return {
          blocked: true,
          reason: `安全阻止: 禁止写入包含 infisical 命令的脚本`
        };
      }
    }
    return { blocked: false };
  }

  // 检查 Bash 工具
  if (toolName !== 'Bash') {
    return { blocked: false };
  }

  const command = toolInput.command || '';

  // 阻止 infisical 命令 - 任何形式
  if (/infisical/i.test(command)) {
    return {
      blocked: true,
      reason: `安全阻止: 禁止任何涉及 infisical 的命令`
    };
  }

  // 阻止访问敏感目录
  const sensitivePatterns = [
    /~\/\.secrets/i,
    /~\/\.infisical/i,
    /\$HOME\/\.secrets/i,
    /\$HOME\/\.infisical/i,
  ];

  for (const pattern of sensitivePatterns) {
    if (pattern.test(command)) {
      return {
        blocked: true,
        reason: `安全阻止: 检测到访问敏感目录的命令`
      };
    }
  }

  return { blocked: false };
}
```

### 配置 Hooks

在 `~/.claude/settings.json` 中添加：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{
          "type": "command",
          "command": "node ~/.cc-tool/pre-tool-security-hook.js"
        }]
      },
      {
        "matcher": "Write",
        "hooks": [{
          "type": "command",
          "command": "node ~/.cc-tool/pre-tool-security-hook.js"
        }]
      },
      {
        "matcher": "Edit",
        "hooks": [{
          "type": "command",
          "command": "node ~/.cc-tool/pre-tool-security-hook.js"
        }]
      }
    ]
  }
}
```

## 验证测试

重启 Claude Code 后测试：

```
⏺ Bash(infisical --version)
  ⎿  Error: 安全阻止: 禁止任何涉及 infisical 的命令

⏺ Bash(echo "infisical secrets list" | sh)
  ⎿  Error: 安全阻止: 禁止任何涉及 infisical 的命令

⏺ Bash(python3 -c "import os; os.system('infisical --version')")
  ⎿  Error: 安全阻止: 禁止任何涉及 infisical 的命令

⏺ Read(~/.infisical/credentials.json)
  ⎿  Error reading file
```

## 使用方式

用户正常使用 Infisical 注入 secrets：

```bash
# 执行需要 CF_API_TOKEN 的脚本
infisical run --env=prod --projectId=xxx -- ./scripts/update-dns.sh

# 部署到 Cloudflare Workers
infisical run --env=prod --projectId=xxx -- wrangler deploy
```

AI 可以帮你写脚本、调试逻辑，但无法获取实际的 token 值。

## 还能继续绕过吗？

当然可以。AI 还能尝试生成绕过检测的脚本，写入后执行，还是能获取到。

最终极的方案还是之前想的那种：用一个二进制文件，只有特定用户、特定脚本才能执行，做 setUID 转换后才能运行命令。

但对于日常使用来说，当前方案已经足够了。核心原则是：

**任何时候，不要让机密明文出现在 AI 的对话框里。**

## 总结

| 方案                      | 问题             |
| ----------------------- | -------------- |
| 文件权限                    | AI 可以用 Bash 读取 |
| permissions.deny        | 只阻止 Read 工具    |
| PreToolUse Hook         | AI 可以写脚本绕过     |
| Bitwarden MCP           | 直接把密码给 AI，蠢    |
| **Infisical + 多层 Hook** | ✅ 基本够用         |

安全从来不是单点防护，而是纵深防御。每一层都可能被绕过，但层层叠加后，攻击成本会指数级上升。

当然，这只是针对 Claude Code 的安全。如果我自己用命令行，当然也能获取到。好处是 Claude Code 这个安全隐患已经被解除了。

就这。<!--more-->