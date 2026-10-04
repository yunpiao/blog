import { AsyncLocalStorage } from "node:async_hooks";
import type { NodemailerLike } from "@twikoojs/common";
import { isValidEmail } from "@twikoojs/common";

export interface EmailBuilder {
  from: string | { email: string; name: string };
  to: string;
  subject: string;
  html: string;
}

export interface EmailBinding {
  send(message: EmailBuilder): Promise<{ messageId: string } | void>;
}

const emailContext = new AsyncLocalStorage<{ binding?: EmailBinding }>();

export function withEmailBinding<T>(binding: EmailBinding | undefined, callback: () => T): T {
  return emailContext.run({ binding }, callback);
}

function bindingForRequest(): EmailBinding {
  const binding = emailContext.getStore()?.binding;
  if (!binding || typeof binding.send !== "function") {
    throw Object.assign(new Error("E_EMAIL_BINDING_MISSING"), { code: "E_EMAIL_BINDING_MISSING" });
  }
  return binding;
}

export function toEmailBuilder(input: unknown): EmailBuilder {
  if (!input || typeof input !== "object") throw new Error("E_EMAIL_PAYLOAD_INVALID");
  const mail = input as Record<string, unknown>;
  if (typeof mail.from !== "string" || /[\r\n]/.test(mail.from) ||
      typeof mail.to !== "string" || /[\r\n]/.test(mail.to) || mail.to !== mail.to.trim() || !isValidEmail(mail.to) ||
      typeof mail.subject !== "string" || !mail.subject || /[\r\n]/.test(mail.subject) ||
      typeof mail.html !== "string" || !mail.html) {
    throw new Error("E_EMAIL_PAYLOAD_INVALID");
  }
  const named = /^"([^"\r\n]*)"\s*<([^<>\r\n]+)>$/.exec(mail.from);
  const sender = named ? named[2] : mail.from;
  if (sender !== sender.trim() || !isValidEmail(sender)) throw new Error("E_EMAIL_PAYLOAD_INVALID");
  return {
    from: named ? { email: sender, name: named[1] } : sender,
    to: mail.to,
    subject: mail.subject,
    html: mail.html,
  };
}

export function createEmailTransport(): ReturnType<NodemailerLike["createTransport"]> {
  // Resolve the binding during each call, inside its originating request context.
  // No connection or per-request binding is retained in a module-level transport.
  return {
    async verify() {
      bindingForRequest();
      return true;
    },
    async sendMail(mail) {
      const result = await bindingForRequest().send(toEmailBuilder(mail));
      // Legacy send_email resolves void; the current builder API returns messageId.
      if (result !== undefined && (!result || typeof result.messageId !== "string" || !result.messageId)) {
        throw Object.assign(new Error("E_EMAIL_RESULT_INVALID"), { code: "E_EMAIL_RESULT_INVALID" });
      }
      return { accepted: true, ...(result ? { messageId: result.messageId } : {}) };
    },
  };
}
