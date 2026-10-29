import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const service = fileURLToPath(new URL('..', import.meta.url));
const upstream = resolve(process.env.TWIKOO_SOURCE || resolve(service, '.upstream'));

// 执行实际上游函数，只替换其 import 依赖。SQLite 执行完整 D1 SQL。
// 本测试不连接生产服务，不替代上游 Vitest、类型检查或真实 Cap 验收。
function loadSource(path, names, dependencies = {}) {
  const source = stripTypeScriptTypes(readFileSync(resolve(upstream, path), 'utf8'))
    .replace(/^import\s[\s\S]*?;\s*$/gm, '')
    .replace(/^export /gm, '');
  return new Function(...Object.keys(dependencies), `${source}\nreturn {${names.join(',')}};`)(...Object.values(dependencies));
}

const symbols = loadSource('packages/server-common/src/ports/database.ts', ['ABSENT', 'GT', 'LT', 'NOT']);
const schema = loadSource('packages/server-cloudflare/src/database/schema.ts', ['ensureSchema']);
const geo = loadSource('packages/server-cloudflare/src/geo/region-store.ts', ['lookupRegion', 'rememberRegion']);
const { D1Database } = loadSource('packages/server-cloudflare/src/database/d1.ts', ['D1Database'], { ...symbols, ...schema, ...geo });
const { limitFilter, preCheckSpam, checkCapCaptcha } = loadSource('packages/server-common/src/services/spam.ts', ['limitFilter', 'preCheckSpam', 'checkCapCaptcha'], { ...symbols });
const logger = { info() {}, warn() {}, verbose() {}, error() {} };

/** SQLite 绑定具有与 D1 相同的 prepare、bind、first、all、run 接口。 */
async function fixture() {
  const sqlite = new DatabaseSync(':memory:');
  const binding = {
    prepare(sql) {
      let values = [];
      return {
        bind(...params) { values = params; return this; },
        async first(column) { const row = sqlite.prepare(sql).get(...values); return row ? (column ? row[column] : row) : null; },
        async all() { return { results: sqlite.prepare(sql).all(...values) }; },
        async run() { const result = sqlite.prepare(sql).run(...values); return { success: true, meta: { changes: Number(result.changes) } }; },
      };
    },
  };
  const db = new D1Database(binding);
  await db.init();
  return { db, binding, close: () => sqlite.close() };
}

/** 使用固定服务端时间构造留言，测试不依赖真实等待。 */
function comment(overrides = {}) {
  return { uid: 'visitor', nick: '访客', mail: '', ip: '192.0.2.1', url: '/post/example/', comment: '<p>谢谢分享</p>', created: 1792964355778, updated: 1792964355778, ...overrides };
}

test('同一访客二十八秒后重复提交只保留一条', async () => {
  const f = await fixture();
  try {
    await f.db.addComment(comment());
    await assert.rejects(f.db.addComment(comment({ created: 1792964383058, uid: 'renewed-cookie' })), /重复提交/);
    assert.equal(await f.db.countComments({}), 1);
  } finally { f.close(); }
});

test('两个独立适配器的并发重复写入只有一次成功', async () => {
  const f = await fixture();
  try {
    const other = new D1Database(f.binding);
    const results = await Promise.allSettled([f.db.addComment(comment()), other.addComment(comment())]);
    assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
    assert.match(results.find(r => r.status === 'rejected')?.reason.message || '', /重复提交/);
    assert.equal(await f.db.countComments({}), 1);
  } finally { f.close(); }
});

test('已被审核隐藏的相同留言仍参与去重', async () => {
  const f = await fixture();
  try {
    const first = await f.db.addComment(comment());
    await f.db.updateComment(first._id, { isSpam: true });
    await assert.rejects(f.db.addComment(comment()), /重复提交/);
    assert.equal((await f.db.getComment(first._id)).isSpam, true);
  } finally { f.close(); }
});

test('十分钟边界外可再发表，边界内仍拒绝', async () => {
  const f = await fixture();
  try {
    const first = comment();
    await f.db.addComment(first);
    await assert.rejects(f.db.addComment(comment({ created: first.created + 599999 })), /重复提交/);
    await f.db.addComment(comment({ created: first.created + 600000 }));
    assert.equal(await f.db.countComments({}), 2);
  } finally { f.close(); }
});

test('不同访客、文章、回复对象或正文可正常发表', async () => {
  for (const different of [
    { ip: '192.0.2.2' }, { nick: '另一位访客' }, { mail: 'visitor@example.com' },
    { url: '/post/another/' }, { pid: 'other-parent' }, { rid: 'other-thread' },
    { comment: '<p>请问这个规则如何配置？</p>' },
  ]) {
    const f = await fixture();
    try {
      await f.db.addComment(comment());
      await f.db.addComment(comment(different));
      assert.equal(await f.db.countComments({}), 2);
    } finally { f.close(); }
  }
});

test('带既有 ID 的历史导入保留重复正文及原 ID', async () => {
  const f = await fixture();
  try {
    await f.db.bulkAddComments([comment({ _id: 'history-a' }), comment({ _id: 'history-b' })]);
    assert.deepEqual((await f.db.getAllComments()).map(c => c._id).sort(), ['history-a', 'history-b']);
  } finally { f.close(); }
});

test('包含引号的正文使用绑定参数，首次成功而重复被拒绝', async () => {
  const f = await fixture();
  try {
    const data = comment({ comment: "<p>O'Reilly '; DROP TABLE comment; --</p>" });
    await f.db.addComment(data);
    await assert.rejects(f.db.addComment(data), /重复提交/);
    assert.equal((await f.db.getAllComments())[0].comment, data.comment);
  } finally { f.close(); }
});

test('每个 IP 到达配置上限即拒绝，低于上限可继续', async () => {
  const f = await fixture();
  try {
    const config = { LIMIT_PER_MINUTE: '2', LIMIT_PER_MINUTE_ALL: '0' };
    await f.db.addComment(comment({ _id: 'rate-1', created: Date.now() }));
    await limitFilter({ db: f.db, config, ip: '192.0.2.1' });
    await f.db.addComment(comment({ _id: 'rate-2', created: Date.now() }));
    await assert.rejects(limitFilter({ db: f.db, config, ip: '192.0.2.1' }), /发言频率过高/);
    await limitFilter({ db: f.db, config, ip: '192.0.2.2' });
  } finally { f.close(); }
});

test('全站到达配置上限即拒绝，零值保留关闭限流的语义', async () => {
  const f = await fixture();
  try {
    await f.db.addComment(comment({ _id: 'global-1', created: Date.now() }));
    const config = { LIMIT_PER_MINUTE: '0', LIMIT_PER_MINUTE_ALL: '1' };
    await assert.rejects(limitFilter({ db: f.db, config, ip: '192.0.2.2' }), /评论太火爆/);
    await limitFilter({ db: f.db, config: { LIMIT_PER_MINUTE: '0', LIMIT_PER_MINUTE_ALL: '0' }, ip: '192.0.2.2' });
  } finally { f.close(); }
});

test('匿名发表仍经过 Cap 校验，去重拒绝后不重复派发通知', async () => {
  const f = await fixture();
  let dispatched = 0;
  let verified = 0;
  const used = new Set();
  // 只替换 Cap 的密码学验证器；实际提交处理器和验证码分发、错误传播均执行。
  const { commentSubmit } = loadSource('packages/server-common/src/handlers/comment-submit.ts', ['commentSubmit'], {
    RES_CODE: { SUCCESS: 0 },
    validate(event, fields) { for (const field of fields) if (!event[field]) throw new Error(`missing ${field}`); },
    getDomPurify: async () => ({ sanitize: value => value }),
    md5: value => value, sha256: value => value, normalizeMail: value => value.trim().toLowerCase(),
    equalsMail: (a, b) => Boolean(a && b && a.toLowerCase() === b.toLowerCase()),
    isValidEmail: () => true, isQQ: () => false, isAdmin: () => false,
    limitFilter, preCheckSpam, checkCapCaptcha,
    isBuiltinCap: () => true, databaseCapStorage: value => value, createCap: value => value,
    validateToken: async (_cap, token) => { verified++; if (used.has(token)) return false; used.add(token); return true; },
  });
  const ctx = {
    config: { CAPTCHA_PROVIDER: 'Cap', LIMIT_PER_MINUTE: '0', LIMIT_PER_MINUTE_ALL: '0' },
    accessToken: 'visitor', logger,
    request: { ip: '192.0.2.1', body: { url: '/post/example/', ua: 'test', nick: '访客', mail: '', comment: '<p>谢谢分享</p>' } },
    adapters: { database: f.db, capabilities: {}, postSubmit: { async dispatch() { dispatched++; } } },
  };
  try {
    await assert.rejects(commentSubmit(ctx), /token 缺失/);
    assert.equal(await f.db.countComments({}), 0);
    ctx.request.body.capToken = 'fresh-1';
    assert.equal((await commentSubmit(ctx)).code, 0);
    assert.equal(dispatched, 1);
    await assert.rejects(commentSubmit(ctx), /验证码/);
    ctx.request.body.capToken = 'fresh-2';
    ctx.request.body._id = 'untrusted-client-id';
    await assert.rejects(commentSubmit(ctx), /重复提交/);
    assert.equal(await f.db.countComments({}), 1);
    assert.equal(dispatched, 1);
    ctx.request.body.capToken = 'fresh-3';
    ctx.request.body.comment = '<p>请问规则顺序如何影响结果？</p>';
    await commentSubmit(ctx);
    assert.equal(dispatched, 2);
    assert.equal(verified, 4);
    assert.equal((await f.db.getAllComments()).every(c => c.mail === '' && c.isSpam === false), true);
  } finally { f.close(); }
});

test('现有违禁词和人工审核仍能标记垃圾', () => {
  assert.equal(preCheckSpam({ comment: '推广 example.invalid', nick: '访客' }, { FORBIDDEN_WORDS: 'example.invalid' }, logger), true);
  assert.equal(preCheckSpam({ comment: '正常留言', nick: '访客' }, { AKISMET_KEY: 'MANUAL_REVIEW' }, logger), true);
  assert.equal(preCheckSpam({ comment: '请问如何配置', nick: '访客' }, {}, logger), false);
});
