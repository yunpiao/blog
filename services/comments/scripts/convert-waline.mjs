import { createHash } from 'node:crypto';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { marked } from 'marked';

const purify = createDOMPurify(new JSDOM('').window);
const hash = (value) => createHash('sha256').update(value).digest('hex');
const str = (value) => value == null ? '' : String(value);
const bool = (value) => [true, 1, '1', 'true'].includes(value);
const date = (value) => {
  const result = Date.parse(value);
  if (!Number.isFinite(result)) throw new Error('Invalid comment timestamp');
  return result;
};

export function convertWaline(source, publicComments = []) {
  if (source.type !== 'waline' || source.version !== 1 || !Array.isArray(source.data?.Comment)) {
    throw new Error('Expected a Waline v1 full export');
  }
  const users = new Map((source.data.Users ?? []).map(({ objectId, display_name, email, url, avatar, type }) =>
    [objectId, { display_name, email, url, avatar, type }]));
  const published = new Map(publicComments.map((item) => [item.objectId, item]));
  const ids = new Set();
  const result = source.data.Comment.map((item) => {
    if (!item.objectId || ids.has(item.objectId)) throw new Error('Missing or duplicate comment ID');
    ids.add(item.objectId);
    if (!['approved', 'waiting', 'spam'].includes(item.status)) throw new Error('Unknown comment moderation status');
    if (item.user_id && !users.has(item.user_id)) throw new Error('Missing comment author');
    if (typeof item.url !== 'string' || !item.url.startsWith('/') || item.url.startsWith('//')) throw new Error('Invalid comment path');
    const user = users.get(item.user_id);
    const visible = published.get(item.objectId);
    if (visible && visible.orig !== item.comment) throw new Error('Public comment snapshot differs from full export');
    const mail = str(user?.email || item.mail).trim().toLowerCase();
    return {
      _id: item.objectId, uid: '', nick: str(visible?.nick || user?.display_name || item.nick || '匿名'),
      mail, mailMd5: mail ? hash(mail) : '', link: str(visible?.link || user?.url || item.link),
      avatar: str(visible?.avatar || user?.avatar), ua: str(item.ua), ip: str(item.ip), ipRegion: '',
      master: Number(user?.type === 'administrator'), url: item.url,
      href: `https://blog.yunpiao.site${item.url}`,
      comment: purify.sanitize(visible?.comment ?? marked.parse(str(item.comment), { breaks: true }), { FORBID_TAGS: ['style'], FORBID_ATTR: ['style'] }),
      pid: str(item.pid), rid: str(item.rid), like: '[]', top: Number(bool(item.sticky)),
      isSpam: Number(item.status !== 'approved'), created: date(item.insertedAt || item.createdAt), updated: date(item.updatedAt),
      extra: JSON.stringify({ waline: { likeCount: Number(item.like || 0), status: item.status, userId: str(item.user_id) } }),
    };
  });
  const byId = new Map(result.map((item) => [item._id, item]));
  for (const item of result) {
    if (item.rid && !item.pid) item.pid = item.rid;
  }
  for (const item of result) {
    if (!item.pid) continue;
    const seen = new Set([item._id]);
    let parent = item;
    while (parent.pid) {
      const target = byId.get(parent.pid);
      if (!target || target.url !== item.url) throw new Error('Missing or invalid comment reply reference');
      if (seen.has(target._id)) throw new Error('Cyclic comment replies');
      seen.add(target._id);
      parent = target;
    }
    if (item.rid && item.rid !== parent._id) throw new Error('Reply root does not match parent chain');
    item.rid = parent._id;
  }
  return result;
}

export function toInsertBatch(comments) {
  const columns = ['_id','uid','nick','mail','mailMd5','link','avatar','ua','ip','ipRegion','master','url','href','comment','pid','rid','like','top','isSpam','created','updated','extra'];
  const sql = `INSERT INTO comment (${columns.map((key) => `"${key}"`).join(',')}) VALUES (${columns.map(() => '?').join(',')})`;
  return comments.map((item) => ({ sql, params: columns.map((key) => item[key]) }));
}
