import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// These exact replacements apply only to the pinned Twikoo 2.0.12 pipeline.
// Keep request IDs and error diagnostics without logging comments or auth data.
const pipelineReplacements = [
  ['logger.warn(`${ip} 当前请求次数为 ${requestTimes[ip]}，已超过最大请求次数`);',
    'logger.warn(`当前请求次数为 ${requestTimes[ip]}，已超过最大请求次数`);'],
  ['logger.verbose(`${ip} 当前请求次数为 ${requestTimes[ip]}`);',
    'logger.verbose(`当前请求次数为 ${requestTimes[ip]}`);'],
  ['logger.verbose("请求函数：", request.body.event, "请求参数：", request.body);',
    'logger.verbose("请求函数：", typeof request.body.event === "string" ? request.body.event.slice(0, 64) : "invalid");'],
  ['logger.error("请求参数：", request.body);',
    'logger.error("请求函数：", typeof request.body.event === "string" ? request.body.event.slice(0, 64) : "invalid");'],
  ['logger.verbose("请求返回：", body);',
    'logger.verbose("请求返回码：", body.code);'],
  ['// 只回 code + message：聚合日志含请求参数与来访 IP，留在服务端，不回传前端',
    '// 只回 code + message：错误详情留在服务端，不回传前端'],
];

const cloudflareReplacements = [
  ['import { RES_CODE, createHandler, scaffoldAdapters, setCustomLibs } from "@twikoojs/common";',
    'import { RES_CODE, createHandler, scaffoldAdapters, setCustomLibs, getDomPurify } from "@twikoojs/common";'],
  ['/** Cloudflare 环境变量与绑定（`wrangler.toml` 的 `[vars]` / `[[d1_databases]]`） */',
    '// Initialize once per isolate, outside request CPU time. sanitize() is synchronous.\nconst DOMPurify = await getDomPurify(cloudflareCapabilities);\n\n/** Cloudflare 环境变量与绑定（`wrangler.toml` 的 `[vars]` / `[[d1_databases]]`） */'],
  ['  setCustomLibs({\n    // 保留 HTTP 邮件通道；常规 SMTP 使用请求内创建和关闭的真实 Nodemailer 连接。',
    '  setCustomLibs({\n    DOMPurify,\n    // 保留 HTTP 邮件通道；常规 SMTP 使用请求内创建和关闭的真实 Nodemailer 连接。'],
];

export function applyExactPatch(source, replacements) {
  const states = replacements.map(([before, after]) => {
    // Insertions retain old anchors; deletions retain part of the old statement.
    // Count only spans that are not contained in the opposite complete form.
    const originalSource = after.includes(before) ? source.split(after).join('') : source;
    const patchedSource = before.includes(after) ? source.split(before).join('') : source;
    const originalCount = originalSource.split(before).length - 1;
    const patchedCount = patchedSource.split(after).length - 1;
    if (originalCount === 1 && patchedCount === 0) return 'original';
    if (originalCount === 0 && patchedCount === 1) return 'patched';
    throw new Error(`Unexpected upstream statement: ${before}`);
  });
  if (new Set(states).size !== 1) throw new Error('Partially patched upstream source');
  if (states[0] === 'patched') return source;
  return replacements.reduce((result, [before, after]) => result.replace(before, after), source);
}

export const patchPipeline = source => applyExactPatch(source, pipelineReplacements);
export const patchCloudflareMain = source => applyExactPatch(source, cloudflareReplacements);

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.length !== 3) throw new Error('Usage: patch-upstream.mjs UPSTREAM_DIRECTORY');
  const patches = [
    ['packages/server-common/src/core/pipeline.ts', patchPipeline],
    ['packages/server-cloudflare/src/main.ts', patchCloudflareMain],
  ].map(([relativePath, transform]) => {
    const target = resolve(process.argv[2], relativePath);
    const original = readFileSync(target, 'utf8');
    return { target, original, patched: transform(original) };
  });
  // Validate every file before writing any, so upstream drift does not leave partial patches.
  for (const { target, original, patched } of patches) {
    if (patched !== original) writeFileSync(target, patched);
  }
  console.log('Verified Twikoo privacy and sanitizer initialization patches');
}
