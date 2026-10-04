import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { applyExactPatch } from './patch-upstream.mjs';

const mainReplacements = [
  ['import { createCloudflareNodemailer } from "./mail/nodemailer";',
    'import { createCloudflareNodemailer } from "./mail/nodemailer";\nimport { withEmailBinding, type EmailBinding } from "./mail/cloudflare-email";'],
  ['export interface CloudflareEnvLike {',
    'export interface CloudflareEnvLike {\n  EMAIL?: EmailBinding;'],
  ['  return async (request, env = {}, executionCtx) => {',
    '  return (request, env = {}, executionCtx) => withEmailBinding(env.EMAIL, async () => {'],
  ['  };\n}\n\n/** 默认处理器（模块级懒建：warm isolate 复用同一份装配） */',
    '  });\n}\n\n/** 默认处理器（模块级懒建：warm isolate 复用同一份装配） */'],
];

const transportReplacements = [
  ['import type { NodemailerLike } from "@twikoojs/common";',
    'import type { NodemailerLike } from "@twikoojs/common";\nimport { createEmailTransport } from "./cloudflare-email";'],
  ['      const service = String(mailConfig.service ?? "").toLowerCase();',
    '      const service = String(mailConfig.service ?? "").toLowerCase();\n      if (service === "cloudflare") return createEmailTransport();'],
];

const oldInitialize = `    if (!config || !config.SMTP_USER || !config.SMTP_PASS) {
      throw new Error("数据库配置不存在");
    }
    /** nodemailer 传输配置 */
    const transportConfig: Record<string, unknown> = {
      auth: { user: config.SMTP_USER, pass: config.SMTP_PASS },
    };
    if (config.SMTP_SERVICE) {
      transportConfig.service = config.SMTP_SERVICE;
    } else if (config.SMTP_HOST) {
      transportConfig.host = config.SMTP_HOST;
      transportConfig.port = parseInt(String(config.SMTP_PORT));
      transportConfig.secure = config.SMTP_SECURE === "true";
    } else {
      throw new Error("SMTP 服务器没有配置");
    }
    const nodemailer = await getNodemailer(caps);
    transporter = nodemailer.createTransport(transportConfig);
    try {
      const success = await (transporter as unknown as { verify(): Promise<unknown> }).verify();
      if (success) logger.info("SMTP 邮箱配置正常");
    } catch (error) {
      throw new Error(
        \`SMTP 邮箱配置异常：\${error instanceof Error ? error.message : String(error)}\`,
      );
    }`;

const oldNoticeInitialize = `  if (!transporter && !(await initMailer({ config, caps, logger }))) {
    logger.info("未配置邮箱或邮箱配置有误，不通知");
    return undefined;
  }`;

const oldMasterSend = `  let sendResult: unknown;
  try {
    sendResult = await transporter?.sendMail({
      from: \`"\${config.SENDER_NAME}" <\${config.SENDER_EMAIL}>\`,
      to: toMail,
      subject: emailSubject,
      html: emailContent,
    });
  } catch (e) {
    sendResult = e;
  }
  logger.verbose("博主通知结果：", sendResult);
  return sendResult;`;

const oldReplySend = oldMasterSend
  .replace('to: toMail', 'to: parentComment.mail')
  .replace('博主通知结果：', '回复通知结果：');

const newSend = (category, to) => `  return sendNotification("${category}", config, caps, logger, {
    from: \`"\${config.SENDER_NAME}" <\${config.SENDER_EMAIL}>\`,
    to: ${to},
    subject: emailSubject,
    html: emailContent,
  }${category === 'reply' ? ', mailer' : ''});`;

const notificationReplacements = [
  ['import type { NodemailerLike } from "../utils/lib-loader";',
    'import { createMailer, mailErrorCode, replyEmailEnabled, sendNotification } from "./mail-runtime";'],
  ['import { getHtmlToText, getNodemailer, getPushoo } from "../utils/lib-loader";',
    'import { getHtmlToText, getPushoo } from "../utils/lib-loader";'],
  ['/** 已初始化的邮件传输器（进程级缓存；emailTest 前重置） */\nlet transporter: ReturnType<NodemailerLike["createTransport"]> | null = null;',
    '// Each notification creates a configuration wrapper; request bindings and connections are never cached.'],
  [oldInitialize, '    await createMailer(config, caps);'],
  ['    const message = e instanceof Error ? e.message : String(e);',
    '    const message = mailErrorCode(e);'],
  ['      throw e;', '      throw new Error(message);'],
  [`  const { comment, config, caps, logger } = options;\n${oldNoticeInitialize}`,
    '  const { comment, config, caps, logger } = options;'],
  [`${oldNoticeInitialize}\n  const parentComment = await getParentComment(currentComment);`,
    '  const mailer = await createMailer(config, caps);\n  const parentComment = await getParentComment(currentComment);'],
  ['  const { currentComment, config, caps, logger, getParentComment } = options;',
    '  const { currentComment, config, caps, logger, getParentComment } = options;\n  if (!replyEmailEnabled(config)) {\n    logger.info("回复邮件通知已关闭");\n    return undefined;\n  }'],
  ['    logger.warn("博主邮箱格式不合法，跳过发送博主通知：", toMail);',
    '    logger.warn("博主邮箱格式不合法，跳过发送博主通知");'],
  ['    logger.warn("回复通知邮箱格式不合法，跳过发送回复通知：", parentComment.mail);',
    '    logger.warn("回复通知邮箱格式不合法，跳过发送回复通知");'],
  [oldMasterSend, newSend('master', 'toMail')],
  [oldReplySend, newSend('reply', 'parentComment.mail')],
  ['    // 邮件测试前清除 transporter，保证读取的是最新的配置\n    transporter = null;\n    await initMailer({ config, throwErr: true, caps, logger });',
    '    // Resolve a fresh mailer for this request and the current configuration.'],
  ['    const t = transporter as ReturnType<NodemailerLike["createTransport"]> | null;\n    const sendResult = await t?.sendMail({',
    '    const sendResult = await sendNotification("test", config, caps, logger, {'],
  ['    res.message = e instanceof Error ? e.message : String(e);',
    '    const code = mailErrorCode(e);\n    res.message = String(config.SMTP_SERVICE ?? "").toLowerCase() !== "cloudflare" && code === "E_MAIL_CONFIG_INVALID"\n      ? "数据库配置不存在"\n      : code;'],
];

export const patchEmailMain = source => applyExactPatch(source, mainReplacements);
export const patchEmailTransport = source => applyExactPatch(source, transportReplacements);
export const patchEmailNotifications = source => applyExactPatch(source, notificationReplacements);
export const patchEmailExports = source => applyExactPatch(source, [
  ['export { setPostSubmitService, getPostSubmitService } from "./services/post-submit";',
    'export { setPostSubmitService, getPostSubmitService } from "./services/post-submit";\nexport { isValidEmail } from "./services/comment-dto";'],
]);

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.length !== 3) throw new Error('Usage: patch-email.mjs UPSTREAM_DIRECTORY');
  const patches = [
    ['packages/server-cloudflare/src/main.ts', patchEmailMain],
    ['packages/server-cloudflare/src/mail/nodemailer.ts', patchEmailTransport],
    ['packages/server-common/src/services/notify.ts', patchEmailNotifications],
    ['packages/server-common/src/index.ts', patchEmailExports],
  ].map(([relativePath, transform]) => {
    const target = resolve(process.argv[2], relativePath);
    const original = readFileSync(target, 'utf8');
    return { target, original, patched: transform(original) };
  });
  for (const { target, original, patched } of patches) {
    if (patched !== original) writeFileSync(target, patched);
  }
  console.log('Verified Cloudflare email and notification patches');
}
