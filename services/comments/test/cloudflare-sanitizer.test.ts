// build-upstream.sh copies this test into the pinned Cloudflare package.
import { describe, expect, it } from "vitest";
import { getDomPurify, resetCustomLibs } from "@twikoojs/common";
import { cloudflareCapabilities, installCloudflareLibs } from "../src/main";

describe("isolate-scoped sanitizer", () => {
  it("reuses the same instance across concurrent requests and library reinstalls", async () => {
    installCloudflareLibs();
    const first = await getDomPurify(cloudflareCapabilities);
    const instances = await Promise.all(Array.from({ length: 40 }, async () => {
      installCloudflareLibs();
      return getDomPurify(cloudflareCapabilities);
    }));
    expect(instances.every(instance => instance === first)).toBe(true);
    resetCustomLibs();
    installCloudflareLibs();
    expect(await getDomPurify(cloudflareCapabilities)).toBe(first);
  });

  it("does not share per-call options or sanitized content", async () => {
    installCloudflareLibs();
    const outputs = await Promise.all(Array.from({ length: 40 }, async (_, index) => {
      const purifier = await getDomPurify(cloudflareCapabilities);
      const dirty = `<p data-item="${index}">message-${index}</p><img src=x onerror=alert(1)><script>alert(2)</script>`;
      return purifier.sanitize(dirty, index % 2 ? { FORBID_TAGS: ["img"] } : {});
    }));
    outputs.forEach((html, index) => {
      expect(html).toContain(`message-${index}</p>`);
      expect(html).not.toMatch(/onerror|<script|alert\(/);
      expect(html.includes("<img")).toBe(index % 2 === 0);
      expect(html.match(/message-/g)).toHaveLength(1);
    });
  });

  it("retains the comment XSS policy after a less restrictive import call", async () => {
    installCloudflareLibs();
    const purifier = await getDomPurify(cloudflareCapabilities);
    const dirty = '<p style="color:red">safe</p><style>body{display:none}</style><svg><g onload="alert(1)"></g></svg><a href="javascript:alert(2)">link</a>';
    expect(purifier.sanitize(dirty)).toContain('style="color:red"');
    const strict = purifier.sanitize(dirty, { FORBID_TAGS: ["style"], FORBID_ATTR: ["style"] });
    expect(strict).toContain("safe</p>");
    expect(strict).not.toMatch(/style|onload|javascript:|alert\(/);
    expect(purifier.sanitize(dirty)).toContain('style="color:red"');
  });
});
