# 2026-10-04 评论邮件通过 Cloudflare 绑定发送

状态：采用；生产启用结果以[部署与恢复说明](../../services/comments/2026-10-04-部署与恢复说明.md)为准。

## 决策

Twikoo 2.0.12 的 Cloudflare 适配器增加 `SMTP_SERVICE=cloudflare` 通道，使用 Worker 原生 `EMAIL` 绑定发送通知，复用现有邮件模板和评论通知流程。该通道不需要 `SMTP_USER`、`SMTP_PASS` 或额外 API Token。

当前账号未订阅 Workers Paid，Email Routing 已启用，博主邮箱已验证。先启用免费博主通知：绑定只允许从 `comments@yunpiao.site` 发往 `yunpiao111@gmail.com`。`EMAIL_REPLY_NOTIFY=false` 明确关闭访客回复邮件；不能把不允许发送的访客邮件改投博主邮箱。

Cloudflare 向任意访客邮箱发信要求 Workers Paid 和 Email Sending 发件域接入。这会新增付费订阅，需用户明确同意后再解除收件地址限制并启用回复通知。该决策不自动升级套餐。

## 实现约束

- 通过固定上游版本的精确、幂等补丁接入，匹配失败时停止构建。
- 每次请求通过 AsyncLocalStorage 绑定当前 `EMAIL`，避免并发通知使用其他请求的绑定。传输器不缓存跨请求连接，后台通知继续由 `ctx.waitUntil` 托管。
- 缺少绑定、非法地址和发送失败必须明确报错；不填写虚假凭据，不在失败后自动换通道或重发。
- 日志记录通知类别、接受状态、消息 ID 和安全错误码，不记录收件地址、正文、令牌或完整供应商响应。
- D1 只更新邮件相关字段，使用 `json_set` 和目标字段旧值校验，保留其他配置。恢复快照只保存这些字段，不导出完整管理配置。

## 验证与限制

测试覆盖新留言通知、回复开关、父评论收件人选择、自回复跳过、绑定隔离、发送失败日志和补丁幂等性。生产使用独立测试路径上的留言触发真实通知，再检查发送日志；评论提交成功不等于邮件发送成功，发信服务接受也不等于已进入收件箱。

`ctx.waitUntil` 不提供持久化重试队列。当前实现遇到发送失败会记录错误，但不会自动补发。公开历史评论不会因启用通知而批量发送邮件。

## 依据

- [Cloudflare Email Service 定价与收件人限制](https://developers.cloudflare.com/email-service/platform/pricing/)
- [Workers 发信接口](https://developers.cloudflare.com/email-service/api/send-emails/workers-api/)
- [发信绑定的地址限制](https://developers.cloudflare.com/email-service/configuration/send-bindings/)
