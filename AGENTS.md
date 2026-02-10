# Blog Project - AGENTS.md

## 项目概览

- **框架**: Hugo
- **主题**: simple (子模块)
- **部署**: blog.yunpiao.site
- **仓库**: https://github.com/yunpiao/blog.git

## 简历系统

### 架构

```
static/resume/index.html    ← 加密后的完整页面（CSS + 密码验证 + AES 密文）
resume-tool.js               ← 加解密工具脚本（提交到 Git）
resume_content.html          ← 临时明文（.gitignore，用完即删）
static/robots.txt            ← 禁止爬虫抓取 /resume/
```

**访问地址**: `https://blog.yunpiao.site/resume/`

### 工作原理

1. 简历 HTML 片段用 CryptoJS AES 加密后嵌入 `static/resume/index.html` 的 `ENCRYPTED_CONTENT` 变量
2. 访问者输入口令后，前端 JS 解密并渲染
3. 认证成功后 localStorage 缓存 24 小时
4. 样式由 `index.html` 的 `<style>` 块控制，与加密内容解耦

### 更新简历流程

**前置条件**: Node.js + `npm install crypto-js`

```bash
# 1. 解密出明文（密码交互输入）
node resume-tool.js decrypt
# → 生成 resume_content.html

# 2. 编辑明文
vim resume_content.html   # 或用任何编辑器

# 3. 加密回去（密码交互输入，自动删除明文）
node resume-tool.js encrypt
# → 更新 static/resume/index.html，删除 resume_content.html

# 4. 本地验证
hugo server -D
# → 访问 http://localhost:1313/resume/ 输入口令验证

# 5. 提交
git add static/resume/index.html
git commit -m "feat: update resume content"
git push
```

### 修改简历样式

样式全部内联在 `static/resume/index.html` 的 `<style>` 块中，修改样式不需要重新加密。

**当前设计风格**: Monochrome
- 字体: Playfair Display (标题衬线) + Inter (正文无衬线)
- 纯黑白配色，零彩色
- 4px 粗黑线分隔 section
- 零圆角，2px 黑色边框
- 标签: 黑底白字 / 白底黑框
- 打印友好

### CSS Class 对照表

| Class | 用途 |
|-------|------|
| `.resume` | 最外层容器 |
| `.header` | 顶部姓名/职位/联系方式 |
| `.header .title` | 职位标题（大写字母间距） |
| `.contact` | 联系方式 flex 容器 |
| `.section` / `.section h2` | 段落及标题（Playfair 衬线 + 4px 下划线） |
| `.tags` / `.tag` | 技能标签（黑框） |
| `.tag.primary` / `.secondary` / `.accent` | 标签变体（黑底白字） |
| `.highlights` / `.highlight-item` | 亮点 2x2 网格（黑框） |
| `.highlight-title` / `.highlight-desc` | 亮点标题（Playfair）/描述 |
| `.job` | 工作经历（左侧 4px 黑线） |
| `.job-company` / `.job-meta` | 公司名（大写）/元信息 |
| `.project` / `.project-title` / `.project-desc` | 项目条目 |
| `.project-section h4` | 项目子标题（大写） |
| `.skills-table` / `.achievements-table` / `.education-table` | 表格（2px 黑线） |
| `.footer` | 页脚（4px 顶线 + 大写） |

### 安全措施

- `resume_content.html` 在 `.gitignore` 中，encrypt 后自动删除
- `<meta name="robots" content="noindex, nofollow">` 阻止搜索引擎
- `static/robots.txt` 中 `Disallow: /resume/`
- 前端 AES 加密（防君子不防小人，密文在前端可见）

## 关键文件

| 文件 | 用途 |
|------|------|
| `hugo.toml` | Hugo 配置 |
| `content/` | 博客文章（Markdown） |
| `content/about.md` | 关于页面 |
| `themes/simple/` | 主题（Git 子模块） |
| `static/resume/index.html` | 加密简历页面 |
| `static/robots.txt` | 爬虫规则 |
| `resume-tool.js` | 简历加解密工具 |

## 常用命令

```bash
hugo server -D              # 本地开发（含草稿）
hugo                        # 构建生产版本
node resume-tool.js decrypt # 解密简历
node resume-tool.js encrypt # 加密简历
```
