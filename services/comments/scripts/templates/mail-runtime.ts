import type { Capabilities } from "../ports/capabilities";
import type { ConfigData } from "../ports/database";
import type { RequestLogger } from "../utils/logger";
import { getNodemailer, type NodemailerLike } from "../utils/lib-loader";

const safeCodes = new Set([
  "E_EMAIL_BINDING_MISSING", "E_EMAIL_PAYLOAD_INVALID", "E_EMAIL_RESULT_INVALID",
  "E_MAIL_CONFIG_INVALID", "E_MAIL_SEND_FAILED", "E_VALIDATION_ERROR", "E_FIELD_MISSING",
  "E_TOO_MANY_RECIPIENTS", "E_SENDER_NOT_VERIFIED", "E_RECIPIENT_NOT_ALLOWED",
  "E_RECIPIENT_SUPPRESSED", "E_SENDER_DOMAIN_NOT_AVAILABLE", "E_CONTENT_TOO_LARGE",
  "E_DELIVERY_FAILED", "E_RATE_LIMIT_EXCEEDED", "E_DAILY_LIMIT_EXCEEDED",
  "E_INTERNAL_SERVER_ERROR", "E_HEADER_NOT_ALLOWED", "E_HEADER_USE_API_FIELD",
  "E_HEADER_VALUE_INVALID", "E_HEADER_VALUE_TOO_LONG", "E_HEADER_NAME_INVALID",
  "E_HEADERS_TOO_LARGE", "E_HEADERS_TOO_MANY",
]);

export function mailErrorCode(error: unknown): string {
  const code = error && typeof error === "object" ? (error as { code?: unknown }).code : undefined;
  if (typeof code === "string" && safeCodes.has(code)) return code;
  if (error instanceof Error && safeCodes.has(error.message)) return error.message;
  return "E_MAIL_SEND_FAILED";
}

export function replyEmailEnabled(config: ConfigData): boolean {
  const setting = config.EMAIL_REPLY_NOTIFY;
  if (setting === "false" || setting === false) return false;
  if (setting === "true" || setting === true) return true;
  return String(config.SMTP_SERVICE ?? "").toLowerCase() !== "cloudflare";
}

export async function createMailer(config: ConfigData, caps: Capabilities): Promise<ReturnType<NodemailerLike["createTransport"]>> {
  try {
    return await initializeMailer(config, caps);
  } catch (error) {
    const code = mailErrorCode(error);
    throw Object.assign(new Error(code), { code });
  }
}

async function initializeMailer(config: ConfigData, caps: Capabilities): Promise<ReturnType<NodemailerLike["createTransport"]>> {
  const service = String(config.SMTP_SERVICE ?? "");
  const cloudflare = service.toLowerCase() === "cloudflare";
  if (!cloudflare && (!config.SMTP_USER || !config.SMTP_PASS)) throw new Error("E_MAIL_CONFIG_INVALID");
  const options: Record<string, unknown> = cloudflare
    ? { service: "cloudflare" }
    : { auth: { user: config.SMTP_USER, pass: config.SMTP_PASS } };
  if (service) options.service = service;
  else if (config.SMTP_HOST) {
    options.host = config.SMTP_HOST;
    options.port = parseInt(String(config.SMTP_PORT));
    options.secure = config.SMTP_SECURE === "true";
  } else throw new Error("E_MAIL_CONFIG_INVALID");
  const nodemailer = await getNodemailer(caps);
  const mailer = nodemailer.createTransport(options);
  if (mailer.verify && await mailer.verify() === false) throw new Error("E_MAIL_CONFIG_INVALID");
  return mailer;
}

export function acceptedMailResult(result: unknown): { accepted: true; messageId?: string } {
  if (result instanceof Error || result === false ||
      (result && typeof result === "object" &&
        ((result as { accepted?: unknown }).accepted === false || (result as { ok?: unknown }).ok === false))) {
    throw new Error("E_MAIL_SEND_FAILED");
  }
  const messageId = result && typeof result === "object" ? (result as { messageId?: unknown }).messageId : undefined;
  // Provider payloads may contain recipients, body text or authentication diagnostics.
  // Return only the acceptance state and a bounded, printable message identifier.
  return {
    accepted: true,
    ...(typeof messageId === "string" && /^[A-Za-z0-9._@<>:+/=-]{1,200}$/.test(messageId) ? { messageId } : {}),
  };
}

export async function sendNotification(
  category: "master" | "reply" | "test",
  config: ConfigData,
  caps: Capabilities,
  logger: RequestLogger,
  mail: unknown,
  preparedMailer?: ReturnType<NodemailerLike["createTransport"]>,
): Promise<unknown> {
  try {
    const mailer = preparedMailer ?? await createMailer(config, caps);
    const sent = await mailer.sendMail(mail);
    const result = acceptedMailResult(sent);
    logger.info("邮件通知已接受", { category, ...result });
    return String(config.SMTP_SERVICE ?? "").toLowerCase() === "cloudflare" ? result : sent;
  } catch (error) {
    const code = mailErrorCode(error);
    logger.error("邮件通知失败", { category, code });
    throw Object.assign(new Error(code), { code });
  }
}
