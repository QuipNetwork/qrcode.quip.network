# AGENTS.md

## Overview

Static Vite + TypeScript site. No server code. Netlify builds it with
`bun install && bun run build` and publishes `dist`.

## Commands

    bun install
    bunx playwright install chromium   # once, for browser tests
    bun run dev
    bun run test        # Vitest browser mode, headless Chromium
    bun run lint
    bun run typecheck
    bun run format

prek runs format, lint, typecheck, and test before each commit
(`prek install` once per clone).

## Constraints

- TypeScript stays on 6.0.x. typescript-eslint 8.70.1 does not support 6.1 or later.
- QR text is UTF-8. `src/render.ts` replaces the library's 8-bit default encoder.
- Every source file starts with `// SPDX-License-Identifier: AGPL-3.0-or-later`.

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
