#!/usr/bin/env bash
set -euo pipefail
service_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
upstream_dir="$service_dir/.upstream"
upstream_commit=d7a040b4ef85ae081d1838ed1470b8af163e17d4
pnpm_cli="$service_dir/node_modules/pnpm/bin/pnpm.mjs"
if [[ ! -d "$upstream_dir/.git" ]]; then
  git clone --depth 1 --branch 2.0.12 https://github.com/twikoojs/twikoo.git "$upstream_dir"
fi
[[ "$(git -C "$upstream_dir" rev-parse HEAD)" == "$upstream_commit" ]] || { printf '%s\n' 'Unexpected Twikoo source revision' >&2; exit 1; }
cd "$upstream_dir"
node "$pnpm_cli" install --frozen-lockfile
version_state=$(node --input-type=module -e '
import { readFileSync } from "node:fs";
import { PUBLISH_PACKAGES } from "./scripts/release-packages.mjs";
const versions = new Set(PUBLISH_PACKAGES.map(({dir}) => JSON.parse(readFileSync(`${dir}/package.json`, "utf8")).version));
if (versions.size !== 1 || !["0.0.0", "2.0.12"].includes([...versions][0])) throw new Error("Unexpected upstream package versions");
console.log([...versions][0]);
')
if [[ "$version_state" == '0.0.0' ]]; then
  node scripts/release-set-version.mjs 2.0.12
fi
node "$service_dir/scripts/patch-upstream.mjs" "$upstream_dir"
node "$service_dir/scripts/patch-email.mjs" "$upstream_dir"
cp "$service_dir/scripts/templates/cloudflare-email.ts" packages/server-cloudflare/src/mail/cloudflare-email.ts
cp "$service_dir/scripts/templates/mail-runtime.ts" packages/server-common/src/services/mail-runtime.ts
cp "$service_dir/test/cloudflare-sanitizer.test.ts" packages/server-cloudflare/test/blog-sanitizer.test.ts
cp "$service_dir/test/cloudflare-email.test.ts" packages/server-cloudflare/test/blog-email.test.ts
node "$pnpm_cli" -r --filter '@twikoojs/cloudflare...' build
mkdir -p "$service_dir/dist"
cp -R packages/server-cloudflare/dist/. "$service_dir/dist/"
