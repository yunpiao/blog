.PHONY: help install upstream test test-upstream build deploy

help:
	@printf '%s\n' 'install: install deployment tools' 'upstream: build pinned official Twikoo' 'test: validate migration and patches' 'test-upstream: run Cloudflare tests and typecheck after upstream build' 'build: build Cloudflare Worker' 'deploy: deploy Cloudflare Worker'

install:
	npm ci

upstream:
	bash scripts/build-upstream.sh

test:
	npm test

test-upstream:
	cd .upstream && node ../node_modules/pnpm/bin/pnpm.mjs --filter @twikoojs/cloudflare test
	cd .upstream && node ../node_modules/pnpm/bin/pnpm.mjs --filter @twikoojs/cloudflare typecheck

build:
	npm run build

deploy:
	npm run deploy
