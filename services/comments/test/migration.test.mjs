import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { convertWaline, toInsertBatch } from '../scripts/convert-waline.mjs';

const comment = (extra = {}) => ({ objectId: 'root', nick: '访客', comment: '**你好**', url: '/post/a/', status: 'approved', insertedAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-02T00:00:00.000Z', ...extra });
const source = (comments, users = []) => ({ type: 'waline', version: 1, data: { Comment: comments, Users: users } });

test('preserves article, reply identity, timestamps and registered author attribution', () => {
  const result = convertWaline(source([comment({ user_id: 'u' }), comment({objectId:'reply',pid:'root',rid:'root'})], [{objectId:'u',display_name:'作者',type:'administrator'}]));
  assert.equal(result[0].nick, '作者');
  assert.equal(result[0].master, 1);
  assert.equal(result[1].pid, 'root');
  assert.equal(result[1].rid, 'root');
  assert.equal(result[0].created, Date.parse('2024-01-01T00:00:00.000Z'));
  assert.equal(result[0].comment, '<p><strong>你好</strong></p>\n');
});
test('sanitizes historical Markdown and does not expose credential data', () => {
  const [result] = convertWaline(source([comment({comment:'<img src=x onerror="alert(1)"><style>body{display:none}</style><a href="javascript:alert(1)">link</a>',sticky:'0',like:2})]));
  assert.doesNotMatch(result.comment, /onerror|<style|javascript:/);
  assert.equal(result.top, 0);
  assert.equal(result.like, '[]');
  assert.equal(JSON.parse(result.extra).waline.likeCount, 2);
});
test('rejects duplicate, cross-page, dangling and cyclic reply relations', () => {
  assert.throws(() => convertWaline(source([comment(),comment()])), /duplicate/);
  assert.throws(() => convertWaline(source([comment({pid:'absent'})])), /Missing/);
  assert.throws(() => convertWaline(source([comment(),comment({objectId:'reply',url:'/other/',pid:'root',rid:'root'})])), /reference/);
  assert.throws(() => convertWaline(source([comment({pid:'reply'}),comment({objectId:'reply',pid:'root'})])), /Cyclic/);
  assert.throws(() => convertWaline(source([comment(),comment({objectId:'b',rid:'a'}),comment({objectId:'a',rid:'root'})])), /root/);
  assert.throws(() => convertWaline(source([comment(),comment({objectId:'a',pid:'b',rid:'root'}),comment({objectId:'b',pid:'a',rid:'root'})])), /Cyclic/);
});
test('moderation is retained and malformed status fails', () => {
  assert.equal(convertWaline(source([comment({status:'waiting'})]))[0].isSpam, 1);
  assert.throws(() => convertWaline(source([comment({status:'unknown'})])), /status/);
});
test('preserves Waline line breaks and verified public rendering', () => {
  assert.match(convertWaline(source([comment({comment:'第一行\n第二行'})]))[0].comment, /第一行<br>第二行/);
  const original=comment({comment:':smile:'});
  const [result]=convertWaline(source([original]), [{objectId:'root',orig:':smile:',comment:'<p>😄</p>'}]);
  assert.equal(result.comment, '<p>😄</p>');
  assert.throws(() => convertWaline(source([original]), [{objectId:'root',orig:'changed',comment:'old'}]), /snapshot differs/);
});
test('parameterized import round-trips quotes and refuses duplicate import', () => {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
  const batch = toInsertBatch(convertWaline(source([comment({nick:"O'Reilly",comment:"'; DROP TABLE comment; --"})])));
  for (const {sql,params} of batch) db.prepare(sql).run(...params);
  assert.equal(db.prepare('SELECT nick FROM comment').get().nick, "O'Reilly");
  assert.throws(() => db.prepare(batch[0].sql).run(...batch[0].params), /UNIQUE/);
  db.close();
});
