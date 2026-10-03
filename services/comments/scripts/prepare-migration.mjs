import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash, randomBytes } from 'node:crypto';
import { resolve, join } from 'node:path';
import { convertWaline, toInsertBatch } from './convert-waline.mjs';

const [sourcePath, publicPath, outputPath] = process.argv.slice(2);
if (!sourcePath || !publicPath || !outputPath) throw new Error('Usage: node scripts/prepare-migration.mjs FULL_EXPORT PUBLIC_BACKUP OUTPUT_DIR');
const output = resolve(outputPath);
await mkdir(output, { recursive: true, mode: 0o700 });
const source = JSON.parse(await readFile(sourcePath, 'utf8'));
const publicData = JSON.parse(await readFile(publicPath, 'utf8'));
const comments = convertWaline(source, publicData.comments);
const password = randomBytes(32).toString('base64url');
const md5 = (value) => createHash('md5').update(value).digest('hex');
const config = {
  ADMIN_PASS: md5(md5(password)),
  SITE_NAME: 'yunpiao 的 Blog', SITE_URL: 'https://blog.yunpiao.site',
  BLOGGER_EMAIL: 'yunpiao111@gmail.com', CORS_ALLOW_ORIGIN: 'https://blog.yunpiao.site',
  SHOW_UA: 'false', SHOW_REGION: 'false', SHOW_DISLIKE: 'false',
  DISPLAYED_FIELDS: 'nick,mail,link', REQUIRED_FIELDS: 'nick', LIMIT_LENGTH: '500',
  CAPTCHA_PROVIDER: 'Cap', COMMENT_PLACEHOLDER: '欢迎留言交流。',
};
// Exclusive creation prevents a rerun from silently replacing the administrator credential.
await writeFile(join(output, 'admin-password.txt'), password + '\n', { mode: 0o600, flag: 'wx' });
await writeFile(join(output, 'config.private.json'), JSON.stringify([{ sql: 'INSERT INTO config (value) VALUES (?)', params: [JSON.stringify(config)] }]), { mode: 0o600, flag: 'wx' });
await writeFile(join(output, 'comments.private.json'), JSON.stringify(toInsertBatch(comments)), { mode: 0o600, flag: 'wx' });
const summary = {
  comments: comments.length,
  pages: new Set(comments.map((item) => item.url)).size,
  replies: comments.filter((item) => item.rid).length,
  approved: comments.filter((item) => !item.isSpam).length,
  previousLikesArchived: source.data.Comment.reduce((total,item) => total + Number(item.like || 0), 0),
  oldUserAccountsArchived: source.data.Users.length,
  oldReactionCountersArchived: source.data.Counter.length,
};
await writeFile(join(output, 'migration-summary.json'), JSON.stringify(summary, null, 2), { mode: 0o600, flag: 'wx' });
console.log(JSON.stringify(summary));
