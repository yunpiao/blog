import test from 'node:test';
import assert from 'node:assert/strict';
import { patchCloudflareMain, applyExactPatch } from '../scripts/patch-upstream.mjs';
import { patchEmailMain, patchEmailTransport, patchEmailExports } from '../scripts/patch-email.mjs';

const main = [
  'import { RES_CODE, createHandler, scaffoldAdapters, setCustomLibs } from "@twikoojs/common";',
  'import { createCloudflareNodemailer } from "./mail/nodemailer";',
  '/** Cloudflare 环境变量与绑定（`wrangler.toml` 的 `[vars]` / `[[d1_databases]]`） */',
  'export interface CloudflareEnvLike {',
  '  setCustomLibs({\n    // 保留 HTTP 邮件通道；常规 SMTP 使用请求内创建和关闭的真实 Nodemailer 连接。',
  '  return async (request, env = {}, executionCtx) => {',
  '  };\n}\n\n/** 默认处理器（模块级懒建：warm isolate 复用同一份装配） */',
].join('\n');

test('mail patch accepts the previous sanitizer patch and both remain idempotent', () => {
  const previous = patchCloudflareMain(main);
  const patched = patchEmailMain(previous);
  assert.equal(patchEmailMain(patched), patched);
  assert.equal(patchCloudflareMain(patched), patched);
  assert.equal(patchCloudflareMain(patchEmailMain(main)), patched);
  assert.match(patched, /withEmailBinding\(env.EMAIL, async/);
  assert.throws(() => patchEmailMain(previous.replace('env = {}', 'env = undefined')), /Unexpected upstream/);
});

test('native email is an explicit transport branch and export patches repeat safely', () => {
  const source = 'import type { NodemailerLike } from "@twikoojs/common";\n      const service = String(mailConfig.service ?? "").toLowerCase();';
  const patched = patchEmailTransport(source);
  assert.equal(patchEmailTransport(patched), patched);
  assert.match(patched, /if \(service === "cloudflare"\) return createEmailTransport\(\);/);
  const exports = 'export { setPostSubmitService, getPostSubmitService } from "./services/post-submit";';
  assert.equal(patchEmailExports(patchEmailExports(exports)), patchEmailExports(exports));
});

test('exact patch counting supports deletions and still rejects mixed or duplicated states', () => {
  const replacements = [['keep old suffix', 'keep'], ['original', 'replacement']];
  assert.equal(applyExactPatch('keep old suffix\noriginal', replacements), 'keep\nreplacement');
  assert.equal(applyExactPatch('keep\nreplacement', replacements), 'keep\nreplacement');
  assert.throws(() => applyExactPatch('keep\noriginal', replacements), /Partially patched/);
  assert.throws(() => applyExactPatch('keep old suffix\nkeep\noriginal', replacements), /Unexpected upstream/);
});
