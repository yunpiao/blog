import { bindings, defineConfig } from 'cf/config';

export default defineConfig({
  accountId: '51c7def6f7d5521a2435c3b51997954a',
  worker: {
    name: 'blog-comments-twikoo',
    entrypoint: 'dist/index.js',
    compatibilityDate: '2026-09-01',
    compatibilityFlags: ['nodejs_compat'],
    workersDev: true,
    domains: ['comments.yunpiao.site'],
    previewUrls: false,
    env: {
      DB: bindings.d1({ name: 'blog-comments-twikoo', id: '7862e74a-e4e5-4352-a9fc-a47efae9a200' }),
    },
    observability: { enabled: true, redactQueryString: true, logs: { enabled: true, invocationLogs: true } },
  },
});
