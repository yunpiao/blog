import test from 'node:test';
import assert from 'node:assert/strict';
import { patchPipeline, patchCloudflareMain } from '../scripts/patch-upstream.mjs';

const original = [
  'logger.warn(`${ip} 当前请求次数为 ${requestTimes[ip]}，已超过最大请求次数`);',
  'logger.verbose(`${ip} 当前请求次数为 ${requestTimes[ip]}`);',
  'logger.verbose("请求函数：", request.body.event, "请求参数：", request.body);',
  'logger.error("请求参数：", request.body);',
  'logger.error("错误信息：", e);',
  '// 只回 code + message：聚合日志含请求参数与来访 IP，留在服务端，不回传前端',
  'logger.verbose("请求返回：", body);',
].join('\n');

test('privacy patch keeps diagnostics and is idempotent', () => {
  const patched = patchPipeline(original);
  assert.doesNotMatch(patched, /请求参数：|请求返回：|\$\{ip\}/);
  assert.match(patched, /logger\.error\("错误信息：", e\);/);
  assert.match(patched, /logger\.verbose\("请求返回码：", body\.code\);/);
  assert.equal(patchPipeline(patched), patched);
});

test('event logs reject objects and truncate long event names', () => {
  const events = [];
  const patched = patchPipeline(original);
  const eventLines = patched.split('\n').filter(line => line.includes('请求函数：'));
  for (const event of [{ secret: 'never log me' }, 'x'.repeat(100)]) {
    const logger = { verbose: (...args) => events.push(args), error: (...args) => events.push(args) };
    new Function('logger', 'request', eventLines.join('\n'))(logger, { body: { event } });
  }
  assert.deepEqual(events.map(args => args[1]), ['invalid', 'invalid', 'x'.repeat(64), 'x'.repeat(64)]);
});

test('upstream drift, duplicate statements and partial patches fail before writing', () => {
  assert.throws(() => patchPipeline(original.replace('请求返回：', '新请求返回：')), /Unexpected upstream/);
  assert.throws(() => patchPipeline(`${original}\nlogger.verbose("请求返回：", body);`), /Unexpected upstream/);
  assert.throws(() => patchPipeline(original.replace('logger.verbose("请求返回：", body);', 'logger.verbose("请求返回码：", body.code);')), /Partially patched/);
});

test('Cloudflare initialization patch is idempotent and rejects changed anchors', () => {
  const source = [
    'import { RES_CODE, createHandler, scaffoldAdapters, setCustomLibs } from "@twikoojs/common";',
    '/** Cloudflare 环境变量与绑定（`wrangler.toml` 的 `[vars]` / `[[d1_databases]]`） */',
    '  setCustomLibs({\n    // 保留 HTTP 邮件通道；常规 SMTP 使用请求内创建和关闭的真实 Nodemailer 连接。',
  ].join('\n');
  const patched = patchCloudflareMain(source);
  assert.equal(patchCloudflareMain(patched), patched);
  assert.equal(patched.split('await getDomPurify(cloudflareCapabilities)').length - 1, 1);
  assert.match(patched, /setCustomLibs\(\{\n    DOMPurify,/);
  assert.throws(() => patchCloudflareMain(source.replace('scaffoldAdapters', 'changedAdapters')), /Unexpected upstream/);
});
