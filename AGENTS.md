# AGENTS.md

## Overview

Static Vite + TypeScript site. No server code. Netlify builds it with
`bun install --frozen-lockfile && bun run build` and publishes `dist`.

## Commands

The host has no JS/TS tooling. Run everything inside the Podman container
(the working directory is mounted at `/app`) via the `./run` helper, which
uses the `docker.io/oven/bun:1.4.2` image (matching `netlify.toml`):

    ./run bun install
    ./run bunx playwright install chromium   # once, for browser tests
    ./run bun run dev
    ./run bun run test        # Vitest browser mode, headless Chromium
    ./run bun run lint
    ./run bun run typecheck
    ./run bun run format
    brew install zbar    # once, for zbarimg (host tool, used outside the container)
    ./run bun scripts/acceptance.ts <site-url>   # download each test URL's PNG and decode it with zbarimg

prek runs format, lint, typecheck, and test before each commit
(`prek install` once per clone).

## CI

`.gitlab-ci.yml` runs one `test` job on merge requests and on the default
branch, in the `oven/bun:1.4.2` image (matching `netlify.toml`'s
`BUN_VERSION`): `bun install --frozen-lockfile`, Playwright's Chromium
install, then `format:check`, `lint`, `typecheck`, and `test`. This is the
gate before a deploy; the pre-commit hook alone does not run on a merge
commit made outside a clone with the hook installed.

## Constraints

- TypeScript stays on 6.0.x. typescript-eslint 8.70.1 does not support 6.1 or later.
- QR text is UTF-8. `src/render.ts` replaces the library's 8-bit default encoder.
- Every source file starts with an SPDX-License-Identifier line in its
  comment syntax (`// ...` in `.ts`/`.js`, `/* ... */` in `.css`, `<!-- ... -->`
  in `.html`).

## Brand assets

| File                             | Source                                                               |
| -------------------------------- | -------------------------------------------------------------------- |
| `public/brand/gradient-a.png`    | https://quip.network/images/brand/gradients/gradianta.png            |
| `public/brand/gradient-b.png`    | https://quip.network/images/brand/gradients/gradiantb.png            |
| `public/brand/gradient-c.png`    | https://quip.network/images/brand/gradients/gradiantc.png            |
| `public/brand/gradient-d.png`    | https://quip.network/images/brand/gradients/gradiantd.png            |
| `public/brand/icon-standard.svg` | https://quip.network/images/brand/quip-icon-standard-XL-on-light.svg |
| `public/brand/icon-inverse.svg`  | https://quip.network/images/brand/quip-icon-inverse-XL-on-light.svg  |

All come from https://quip.network/media-kit/.
