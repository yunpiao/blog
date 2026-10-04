// build-upstream.sh copies this file into the pinned Cloudflare package.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getNodemailer,
  resetCustomLibs,
  type CommentDoc,
  type ConfigData,
  type RequestLogger,
} from "@twikoojs/common";
import { cloudflareCapabilities, installCloudflareLibs } from "../src/main";
import { createCloudflareNodemailer } from "../src/mail/nodemailer";
import {
  createEmailTransport,
  toEmailBuilder,
  withEmailBinding,
  type EmailBinding,
  type EmailBuilder,
} from "../src/mail/cloudflare-email";
import { emailTest, sendNotice } from "../../server-common/src/services/notify";
import {
  resetCustomLibs as resetSourceLibs,
  setCustomLibs as setSourceLibs,
} from "../../server-common/src/utils/lib-loader";
import { fetchCalls, useFakeFetch } from "./utils/fake-fetch";

const mail = {
  from: '"Blog" <notify@example.com>',
  to: "reader@example.com",
  subject: "Comment reply",
  html: "<p>Reply body</p>",
};

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
}

function logger() {
  return {
    requestId: "mail-test-request",
    verbose: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
    getText: () => "",
  } satisfies RequestLogger;
}

function config(overrides: ConfigData = {}): ConfigData {
  return {
    SMTP_SERVICE: "cloudflare",
    BLOGGER_EMAIL: "owner@example.com",
    SENDER_EMAIL: "notify@example.com",
    SENDER_NAME: "Blog",
    SITE_NAME: "Test blog",
    SITE_URL: "https://blog.example.com",
    ...overrides,
  };
}

function comment(overrides: CommentDoc = {}): CommentDoc {
  return {
    _id: "comment-1", nick: "Reader", mail: "reader@example.com",
    url: "/article/", comment: "<p>private-comment-body</p>",
    ...overrides,
  };
}

function noticeOptions(overrides: Partial<Omit<Parameters<typeof sendNotice>[0], "logger">> = {}) {
  return {
    comment: comment(), config: config(), caps: cloudflareCapabilities,
    logger: logger(), getParentComment: vi.fn(async () => null as CommentDoc | null),
    ...overrides,
  };
}

beforeEach(() => {
  installCloudflareLibs();
  // The public package is built output; direct service imports use the source
  // loader. Install the same real adapter in both, without mocking notification logic.
  setSourceLibs({ nodemailer: createCloudflareNodemailer() });
});

afterEach(() => {
  resetCustomLibs();
  resetSourceLibs();
  vi.restoreAllMocks();
});

describe("Cloudflare email binding", () => {
  it("converts plain and named senders, forwarding only supported fields", () => {
    expect(toEmailBuilder({ ...mail, bcc: "unexpected@example.com" })).toEqual({
      ...mail, from: { email: "notify@example.com", name: "Blog" },
    });
    expect(toEmailBuilder({ ...mail, from: "notify@example.com" })).toEqual({
      ...mail, from: "notify@example.com",
    });
  });

  it.each([
    null,
    { ...mail, from: "notify@example.com\r\nBcc: other@example.com" },
    { ...mail, from: '"Blog" <invalid>' },
    { ...mail, to: "one@example.com,two@example.com" },
    { ...mail, to: "reader@example.com\r\nBcc: other@example.com" },
    { ...mail, to: " reader@example.com" },
    { ...mail, to: "reader@example.com " },
    { ...mail, subject: "Reply\nInjected: value" },
    { ...mail, subject: "" },
    { ...mail, html: "" },
  ])("rejects malformed payload %# before sending", async input => {
    const binding = { send: vi.fn(async (_sent: EmailBuilder) => ({ messageId: "unused" })) };
    await expect(withEmailBinding(binding, () => createEmailTransport().sendMail(input)))
      .rejects.toThrow("E_EMAIL_PAYLOAD_INVALID");
    expect(binding.send).not.toHaveBeenCalled();
  });

  it("fails closed without a request binding, including after a scope ends", async () => {
    const transport = createEmailTransport();
    const binding = { send: vi.fn(async (_sent: EmailBuilder) => ({ messageId: "unused" })) };
    await expect(withEmailBinding(binding, () => transport.verify?.())).resolves.toBe(true);
    expect(binding.send).not.toHaveBeenCalled();
    await expect(transport.verify?.()).rejects.toMatchObject({ code: "E_EMAIL_BINDING_MISSING" });
    await expect(transport.sendMail(mail)).rejects.toMatchObject({ code: "E_EMAIL_BINDING_MISSING" });
  });

  it.each([
    { result: { messageId: "message-123" }, expected: { accepted: true, messageId: "message-123" } },
    { result: undefined, expected: { accepted: true } },
  ])("accepts the current and legacy binding result %#", async ({ result, expected }) => {
    const binding = { send: vi.fn(async (_sent: EmailBuilder) => result) };
    const actual = await withEmailBinding(binding, () => createEmailTransport().sendMail(mail));
    expect(actual).toEqual(expected);
    expect(binding.send).toHaveBeenCalledExactlyOnceWith(toEmailBuilder(mail));
  });

  it("rejects a malformed provider success response", async () => {
    const binding = { send: async () => ({ messageId: "" }) };
    await expect(withEmailBinding(binding, () => createEmailTransport().sendMail(mail)))
      .rejects.toMatchObject({ code: "E_EMAIL_RESULT_INVALID" });
  });

  it("propagates a provider failure unchanged for the notification layer", async () => {
    const failure = Object.assign(new Error("provider diagnostic"), { code: "E_DELIVERY_FAILED" });
    const binding = { send: async () => { throw failure; } };
    await expect(withEmailBinding(binding, () => createEmailTransport().sendMail(mail))).rejects.toBe(failure);
  });

  it("isolates concurrent bindings even when a shared transport resumes out of order", async () => {
    const releaseFirst = deferred();
    const transport = createEmailTransport();
    const firstBinding = { send: vi.fn(async (_sent: EmailBuilder) => ({ messageId: "first" })) };
    const secondBinding = { send: vi.fn(async (_sent: EmailBuilder) => ({ messageId: "second" })) };
    const first = withEmailBinding(firstBinding, async () => {
      await releaseFirst.promise;
      return transport.sendMail({ ...mail, subject: "First request" });
    });
    try {
      await expect(withEmailBinding(secondBinding, async () => {
        await Promise.resolve();
        return transport.sendMail({ ...mail, subject: "Second request" });
      })).resolves.toEqual({ accepted: true, messageId: "second" });
    } finally {
      releaseFirst.resolve();
    }
    await expect(first).resolves.toEqual({ accepted: true, messageId: "first" });
    expect(firstBinding.send).toHaveBeenCalledExactlyOnceWith(toEmailBuilder({ ...mail, subject: "First request" }));
    expect(secondBinding.send).toHaveBeenCalledExactlyOnceWith(toEmailBuilder({ ...mail, subject: "Second request" }));
  });

  it("installs the explicit cloudflare channel without SMTP credentials", async () => {
    const binding = { send: vi.fn(async (_sent: EmailBuilder) => ({ messageId: "installed" })) };
    await withEmailBinding(binding, async () => {
      const nodemailer = await getNodemailer(cloudflareCapabilities);
      const transport = nodemailer.createTransport({ service: "cloudflare" });
      await expect(transport.verify?.()).resolves.toBe(true);
      await expect(transport.sendMail(mail)).resolves.toEqual({ accepted: true, messageId: "installed" });
    });
    expect(binding.send).toHaveBeenCalledExactlyOnceWith(toEmailBuilder(mail));
  });

  it("retains each binding in waitUntil-style work after both request callbacks return", async () => {
    const firstGate = deferred();
    const secondGate = deferred();
    const firstBinding = { send: vi.fn(async (_sent: EmailBuilder) => ({ messageId: "background-first" })) };
    const secondBinding = { send: vi.fn(async (_sent: EmailBuilder) => ({ messageId: "background-second" })) };
    const background: Promise<unknown>[] = [];
    const transport = createEmailTransport();
    const firstResponse = withEmailBinding(firstBinding, () => {
      background.push((async () => {
        await firstGate.promise;
        return transport.sendMail({ ...mail, subject: "Background first" });
      })());
      return "request-first-complete";
    });
    const secondResponse = withEmailBinding(secondBinding, () => {
      background.push((async () => {
        await secondGate.promise;
        return transport.sendMail({ ...mail, subject: "Background second" });
      })());
      return "request-second-complete";
    });
    expect([firstResponse, secondResponse]).toEqual(["request-first-complete", "request-second-complete"]);
    expect(firstBinding.send).not.toHaveBeenCalled();
    expect(secondBinding.send).not.toHaveBeenCalled();
    try {
      secondGate.resolve();
      await expect(background[1]).resolves.toEqual({ accepted: true, messageId: "background-second" });
    } finally {
      firstGate.resolve();
    }
    await expect(background[0]).resolves.toEqual({ accepted: true, messageId: "background-first" });
    expect(firstBinding.send).toHaveBeenCalledExactlyOnceWith(toEmailBuilder({ ...mail, subject: "Background first" }));
    expect(secondBinding.send).toHaveBeenCalledExactlyOnceWith(toEmailBuilder({ ...mail, subject: "Background second" }));
    await expect(transport.verify?.()).rejects.toMatchObject({ code: "E_EMAIL_BINDING_MISSING" });
  });
});

describe("comment notification policy", () => {
  it("sends a new comment to BLOGGER_EMAIL without SMTP_USER or SMTP_PASS", async () => {
    const binding = { send: vi.fn(async (_sent: EmailBuilder) => ({ messageId: "master-accepted" })) };
    const options = noticeOptions();
    await withEmailBinding(binding, () => sendNotice(options));
    expect(binding.send).toHaveBeenCalledTimes(1);
    expect(binding.send.mock.calls[0]?.[0]).toMatchObject({
      from: { email: "notify@example.com", name: "Blog" }, to: "owner@example.com",
    });
    expect(options.getParentComment).not.toHaveBeenCalled();
    expect(options.logger.info).toHaveBeenCalledWith(expect.any(String), {
      category: "master", accepted: true, messageId: "master-accepted",
    });
  });

  it.each([undefined, "false", false])("does not look up or email a parent when reply notifications are disabled (%s)", async setting => {
    const binding = { send: vi.fn(async (_sent: EmailBuilder) => ({ messageId: "master-only" })) };
    const settings = config(setting === undefined ? {} : { EMAIL_REPLY_NOTIFY: setting });
    const options = noticeOptions({ config: settings, comment: comment({ pid: "parent-1" }) });
    await withEmailBinding(binding, () => sendNotice(options));
    expect(binding.send).toHaveBeenCalledTimes(1);
    expect(binding.send.mock.calls[0]?.[0]).toMatchObject({ to: "owner@example.com" });
    expect(options.getParentComment).not.toHaveBeenCalled();
  });

  it("emails the direct parent only after reply notifications are explicitly enabled", async () => {
    const binding = { send: vi.fn(async (_sent: EmailBuilder) => ({ messageId: "accepted" })) };
    const options = noticeOptions({
      config: config({ EMAIL_REPLY_NOTIFY: "true" }),
      comment: comment({ pid: "parent-1", rid: "root-1" }),
      getParentComment: vi.fn(async () => comment({ _id: "parent-1", mail: "parent@example.com" })),
    });
    await withEmailBinding(binding, () => sendNotice(options));
    expect(options.getParentComment).toHaveBeenCalledExactlyOnceWith(options.comment);
    expect(binding.send.mock.calls.map(([sent]) => sent.to).sort())
      .toEqual(["owner@example.com", "parent@example.com"]);
  });

  it.each(["reader@example.com", "owner@example.com", "invalid", null])("skips self replies, blogger parents, invalid addresses and missing parents (%s)", async parentMail => {
    const binding = { send: vi.fn(async (_sent: EmailBuilder) => ({ messageId: "master-only" })) };
    const options = noticeOptions({
      config: config({ EMAIL_REPLY_NOTIFY: "true" }), comment: comment({ pid: "parent-1" }),
      getParentComment: vi.fn(async () => parentMail === null ? null : comment({ mail: parentMail })),
    });
    await withEmailBinding(binding, () => sendNotice(options));
    expect(binding.send).toHaveBeenCalledTimes(1);
    expect(binding.send.mock.calls[0]?.[0]).toMatchObject({ to: "owner@example.com" });
  });

  it("does not notify the blogger about their own comment", async () => {
    const binding = { send: vi.fn(async (_sent: EmailBuilder) => ({ messageId: "unused" })) };
    await withEmailBinding(binding, () => sendNotice(noticeOptions({ comment: comment({ mail: "owner@example.com" }) })));
    expect(binding.send).not.toHaveBeenCalled();
  });

  it("preserves the default reply behavior for an existing non-Cloudflare channel", async () => {
    useFakeFetch(() => ({ status: 200, json: { id: "resend-accepted" } }));
    await sendNotice(noticeOptions({
      config: config({ SMTP_SERVICE: "Resend", SMTP_USER: "test-account", SMTP_PASS: "synthetic-test-token" }),
      comment: comment({ pid: "parent-1" }),
      getParentComment: vi.fn(async () => comment({ mail: "parent@example.com" })),
    }));
    expect(fetchCalls().map(call => call.body.to).sort()).toEqual(["owner@example.com", "parent@example.com"]);
  });

  it("awaits a successful reply after master delivery fails, and logs only a safe failure code", async () => {
    const replyEntered = deferred();
    const releaseReply = deferred();
    const failure = Object.assign(new Error("owner@example.com private-comment-body synthetic-secret-token"), {
      code: "E_RECIPIENT_NOT_ALLOWED", response: { token: "synthetic-secret-token" },
    });
    const binding: EmailBinding = { send: vi.fn(async sent => {
      if (sent.to === "owner@example.com") throw failure;
      replyEntered.resolve();
      await releaseReply.promise;
      return { messageId: "reply-accepted" };
    }) };
    const options = noticeOptions({
      config: config({ EMAIL_REPLY_NOTIFY: "true" }), comment: comment({ pid: "parent-1" }),
      getParentComment: vi.fn(async () => comment({ mail: "parent@example.com" })),
    });
    let settled = false;
    const delivery = withEmailBinding(binding, () => sendNotice(options)).then(() => { settled = true; });
    try {
      await replyEntered.promise;
      expect(settled).toBe(false);
    } finally {
      releaseReply.resolve();
    }
    await expect(delivery).resolves.toBeUndefined();
    expect(options.logger.error).toHaveBeenCalledWith(expect.any(String), {
      category: "master", code: "E_RECIPIENT_NOT_ALLOWED",
    });
    const logs = JSON.stringify([options.logger.info.mock.calls, options.logger.warn.mock.calls,
      options.logger.verbose.mock.calls, options.logger.error.mock.calls]);
    expect(logs).toContain("reply-accepted");
    expect(logs).not.toMatch(/owner@example\.com|parent@example\.com|private-comment-body|synthetic-secret-token/);
  });

  it("does not reuse a previous request's binding or changed sender settings", async () => {
    const firstBinding = { send: vi.fn(async (_sent: EmailBuilder) => ({ messageId: "first" })) };
    const secondBinding = { send: vi.fn(async (_sent: EmailBuilder) => ({ messageId: "second" })) };
    await withEmailBinding(firstBinding, () => sendNotice(noticeOptions()));
    await withEmailBinding(secondBinding, () => sendNotice(noticeOptions({
      config: config({ SENDER_EMAIL: "changed@example.com", BLOGGER_EMAIL: "new-owner@example.com" }),
    })));
    expect(firstBinding.send).toHaveBeenCalledTimes(1);
    expect(secondBinding.send).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      from: { email: "changed@example.com", name: "Blog" }, to: "new-owner@example.com",
    }));
  });

  it("restricts EMAIL_TEST to administrators and reports acceptance without provider details", async () => {
    const binding = { send: vi.fn(async (_sent: EmailBuilder) => ({
      messageId: "test-accepted", token: "synthetic-provider-token", to: "owner@example.com", html: "private-provider-body",
    })) };
    const options = { config: config(), caps: cloudflareCapabilities, logger: logger(), isAdminUser: false };
    await withEmailBinding(binding, async () => {
      expect(await emailTest(options)).toMatchObject({ message: "请先登录" });
      expect(binding.send).not.toHaveBeenCalled();
      expect(await emailTest({ ...options, isAdminUser: true })).toEqual({
        result: { accepted: true, messageId: "test-accepted" },
      });
    });
    expect(binding.send).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ to: "owner@example.com" }));
    expect(JSON.stringify(options.logger.info.mock.calls)).not.toMatch(/owner@example\.com|synthetic-provider-token|private-provider-body/);
  });

  it.each([
    { code: "E_DELIVERY_FAILED", expected: "E_DELIVERY_FAILED" },
    { code: "owner@example.com synthetic-provider-token", expected: "E_MAIL_SEND_FAILED" },
  ])("redacts EMAIL_TEST provider failures ($expected)", async ({ code, expected }) => {
    const failure = Object.assign(new Error("owner@example.com synthetic-provider-token private-provider-body"), { code });
    const binding = { send: async () => { throw failure; } };
    const options = { config: config(), caps: cloudflareCapabilities, logger: logger(), isAdminUser: true };
    const response = await withEmailBinding(binding, () => emailTest(options));
    expect(response).toEqual({ message: expected });
    expect(options.logger.error).toHaveBeenCalledWith(expect.any(String), { category: "test", code: expected });
    expect(JSON.stringify(options.logger.error.mock.calls)).not.toMatch(/owner@example\.com|synthetic-provider-token|private-provider-body/);
  });
});
