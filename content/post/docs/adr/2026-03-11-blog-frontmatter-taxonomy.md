# ADR 2026-03-11: Blog Front Matter Taxonomy Cleanup

## Status

Accepted

## Context

当前仓库是博客内容源，不是完整站点工程。历史文章来自多轮迁移和补写，front matter 口径已经出现明显漂移：

- 一部分文章缺少 `slug`
- 一部分文章缺少 `<!--more-->`
- 一部分文章的 `categories` 字段存在，但没有实际分类值
- 历史文章里仍保留旧分类，如 `杂技浅尝`、`技术折腾`、`生活`

这次调整分两批完成：

- 第一批：补 `slug`、补 `<!--more-->`、填充空的 `categories`
- 第二批：统一历史旧 `categories`、清理占位 `summary`、清理重复 `<!--more-->`、修复明显脏标题

## Decision

### 1. `slug` 生成规则

- 只补缺失的 `slug`
- 从现有 `date` 派生
- 格式固定为 `YYYYMMDDHHMMSS`
- 不改已有 `slug`，即便其年份和 `date` 不一致，也留到后续单独治理

### 2. `<!--more-->` 插入规则

- 只补缺失的文章
- 不插在 front matter 内
- 优先插在开头导语或第一个完整信息块之后
- 如果文章开头没有自然导语，则插在第一个可读信息块之后，保证首页摘要和 RSS 摘要至少可读

### 3. `categories` 规则

- `categories` 最终只允许以下 6 个专题：
  - `Security`
  - `Backend`
  - `Kubernetes`
  - `Data/ML`
  - `Infra/Ops`
  - `Project Retrospective`
- 技术文章必须收口到上述 6 类之一
- 非技术文章不强行归类，直接移除 `categories` 字段

### 4. `summary` 规则

- 删除明显的占位摘要，例如 `这是文章的摘要部分`
- 摘要优先由 `<!--more-->` 控制，不保留无信息量的占位字段

### 5. 重复 `<!--more-->` 规则

- 每篇文章最多保留一个 `<!--more-->`
- 如果同一篇文章存在多个摘要截断点，保留位置更合理的那个，删除其余重复项

### 6. 标题清理规则

- 只清理明显脏 token，不做风格化重写
- 本批次仅处理：
  - 前缀 `blog-`
  - 中间或前缀 `todo-`
  - 误带上的 `.md`

### 7. 本批次不处理的内容

- 不统一历史 `tags`
- 不修复已有 `slug` 与 `date` 的年份不一致问题
- 不做标题风格统一，只修脏数据
- 不调整文章正文论述内容，只处理 front matter 和摘要截断点

## Rationale

- 先补齐缺失字段，收益最高，风险最低
- `slug` 从 `date` 派生，后续迁移到 Hugo 或其他静态站点时规则最稳定
- `categories` 收敛到 6 类，方便后续做专题页、导航和归档
- 占位 `summary` 和重复 `<!--more-->` 会直接污染首页摘要与 RSS，需要清掉
- 标题脏 token 会影响列表观感和 SEO 展示，但不值得为此重写所有标题

## Consequences

- 新增或修复后的文章会更容易被首页、RSS、专题页消费
- 历史旧分类会被消除，但非技术文章可能没有 `categories`
- 后续如果要进一步统一风格，还可以再做一轮标题和标签体系治理
