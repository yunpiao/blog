import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { applyExactPatch } from './patch-upstream.mjs';

// 检查发生在新增前，已有数量等于上限时就必须拒绝。
const spamReplacements = [
  ['if (count > limitPerMinute) {', 'if (count >= limitPerMinute) {'],
  ['if (count > limitPerMinuteAll) {', 'if (count >= limitPerMinuteAll) {'],
];

// 保留普通导入路径，仅为服务端生成 ID 的新留言增加原子去重。
const d1Before = [
  '    const columns = [...COMMENT_COLUMN_NAMES, EXTRA_COLUMN];',
  '    await this.stmt(',
  '      `INSERT INTO "comment" (${columns.map((name) => `"${name}"`).join(", ")})` +',
  '        ` VALUES (${columns.map(() => "?").join(", ")})`,',
  '      [...knownValues(doc), JSON.stringify(collectExtra(doc))],',
  '    ).run();',
].join('\n');

const d1After = [
  '    const columns = [...COMMENT_COLUMN_NAMES, EXTRA_COLUMN];',
  '    const insert = `INSERT INTO "comment" (${columns.map((name) => `"${name}"`).join(", ")})`;',
  '    const placeholders = columns.map(() => "?").join(", ");',
  '    const values = [...knownValues(doc), JSON.stringify(collectExtra(doc))];',
  '    // 同一次写语句内判断，避免先查后写在并发请求中都通过。',
  '    // 带 ID 的历史导入保持原行为；空 IP 无法可靠区分访客，跳过去重。',
  '    if (data._id == null && doc.ip && typeof doc.created === "number" && doc.created > 0) {',
  '      const fields = ["nick", "mail", "url", "pid", "rid", "comment"];',
  '      const same = fields.map((name) => `COALESCE("${name}", \'\') = ?`).join(" AND ");',
  '      const inserted = await this.stmt(',
  '        insert + ` SELECT ${placeholders} WHERE NOT EXISTS (` +',
  '          `SELECT 1 FROM "comment" WHERE "ip" = ? AND "created" > ? AND ${same}) RETURNING "_id"`,',
  '        [...values, doc.ip, doc.created - 600000, ...fields.map((name) => toText(doc[name]))],',
  '      ).first<string>("_id");',
  '      if (!inserted) throw new Error("请勿重复提交相同评论，请稍后再试");',
  '    } else {',
  '      await this.stmt(insert + ` VALUES (${placeholders})`, values).run();',
  '    }',
].join('\n');

/** 修复两个十分钟窗口的限流边界。 */
export const patchSpamLimits = source => applyExactPatch(source, spamReplacements);

/** 为 D1 新留言增加十分钟窗口内的原子去重。 */
export const patchD1Duplicates = source => applyExactPatch(source, [[d1Before, d1After]]);

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.length !== 3) throw new Error('Usage: patch-comment-guards.mjs UPSTREAM_DIRECTORY');
  const patches = [
    ['packages/server-common/src/services/spam.ts', patchSpamLimits],
    ['packages/server-cloudflare/src/database/d1.ts', patchD1Duplicates],
  ].map(([relativePath, transform]) => {
    const target = resolve(process.argv[2], relativePath);
    const original = readFileSync(target, 'utf8');
    return { target, original, patched: transform(original) };
  });
  // 所有文件验证成功后才写入，避免上游变化留下部分补丁。
  for (const { target, original, patched } of patches) {
    if (patched !== original) writeFileSync(target, patched);
  }
  console.log('Verified comment duplicate and rate-limit guards');
}
