# yunpiao's Blog

个人博客，基于 [Hugo](https://gohugo.io/) 构建。

**在线访问**: [https://blog.yunpiao.site/](https://blog.yunpiao.site/)

## 本地运行

```bash
# 克隆仓库（包含子模块）
git clone --recursive https://github.com/yunpiao/blog.git

# 启动本地服务
hugo server -D
```

## 技术栈

- **框架**: Hugo
- **主题**: simple

## License

MIT

## 评论与留言板

评论由 Twikoo 2.0.12、Cloudflare Workers 和 D1 提供。留言板复用全站页面布局，局部优化仅作用于评论区域。

- [迁移决策与数据边界](docs/adr/2026-10-04-博客评论迁移到Cloudflare.md)
- [部署、布局维护、验收与恢复说明](services/comments/2026-10-04-部署与恢复说明.md)
- [页面布局维护约定](AGENTS.md#页面布局与评论样式)

## 博客 AI 搜索

导航栏的「AI 搜索」进入 `/ai-search/`，使用 Cloudflare 官方聊天组件，根据已索引的公开文章回答问题并引用原文。组件固定为 `@cloudflare/ai-search-snippet` 0.0.43，按需从 Cloudflare 搜索端点加载。

- 页面：`content/ai-search.md`、`themes/simple/layouts/page/ai-search.html`。
- 客户端与样式：`static/js/ai-search.js`、`static/css/ai-search.css`。
- 0.0.43 的全页聊天组件侧栏固定为 280px；客户端为其 Shadow DOM 补充小屏样式，手机只显示当前对话。官方组件不自动识别裸网址，客户端仅将回答中的本站文章网址转为链接，保留已有 Markdown 链接与代码文本。升级组件时应复查相关选择器、原文链接、清空按钮和手机宽度。
- 公开端点：`hugo.toml` 的 `[params.aiSearch].publicEndpoint`，不使用前端 API 密钥。
- AI Search：`default / proud-bush-8be7`，网站来源为 `blog.yunpiao.site`。仅索引 `**/post/*/`，排除 `**/post/page/**`；不索引简历、对话页和标签目录。使用 trigram 关键词检索与 OR 匹配，再由模型根据检索片段生成回答；向量入库确认异常期间关闭向量检索。
- 端点仅开放搜索与聊天，MCP 关闭；总限流 30 次 / 分钟。正式域名允许 `https://blog.yunpiao.site`，本地验证允许 `http://localhost:1313`。
- 搜索、模型调用受 Cloudflare 当前套餐额度与费用约束。CORS 限制浏览器来源，不是身份认证。

验证使用 `node --check static/js/ai-search.js`、`hugo`，并在 `hugo server` 下实际提问，确认回答及原文链接。关闭入口时可以撤去菜单和页面，同时在 Cloudflare 关闭该实例的 Public Endpoints。
