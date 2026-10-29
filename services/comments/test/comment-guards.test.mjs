import test from 'node:test';
import assert from 'node:assert/strict';
import { patchSpamLimits, patchD1Duplicates } from '../scripts/patch-comment-guards.mjs';

test('rate patch is repeatable and rejects changed, duplicate or partial anchors', () => {
  const original = 'if (count > limitPerMinute) {\nif (count > limitPerMinuteAll) {';
  const patched = patchSpamLimits(original);
  assert.equal(patchSpamLimits(patched), patched);
  assert.throws(() => patchSpamLimits(original.replace('count > limitPerMinute)', 'count > 10)')), /Unexpected upstream/);
  assert.throws(() => patchSpamLimits(`${original}\n${original}`), /Unexpected upstream/);
  assert.throws(() => patchSpamLimits(original.replace('count > limitPerMinute)', 'count >= limitPerMinute)')), /Partially patched/);
});

test('D1 patch is repeatable and rejects drift or duplicated insertion blocks', () => {
  const original = [
    '    const columns = [...COMMENT_COLUMN_NAMES, EXTRA_COLUMN];',
    '    await this.stmt(',
    '      `INSERT INTO "comment" (${columns.map((name) => `"${name}"`).join(", ")})` +',
    '        ` VALUES (${columns.map(() => "?").join(", ")})`,',
    '      [...knownValues(doc), JSON.stringify(collectExtra(doc))],',
    '    ).run();',
  ].join('\n');
  const patched = patchD1Duplicates(original);
  assert.equal(patchD1Duplicates(patched), patched);
  assert.throws(() => patchD1Duplicates(original.replace('collectExtra(doc)', 'changed(doc)')), /Unexpected upstream/);
  assert.throws(() => patchD1Duplicates(`${original}\n${original}`), /Unexpected upstream/);
});
