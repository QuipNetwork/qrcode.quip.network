# qrcode.quip.network

Make Quip-branded QR codes in the browser. Type a URL, select a border and a
style, and download a 1024 px PNG. The page decodes each code before it allows
the download.

## Development

    bun install
    bunx playwright install chromium
    bun run dev

## Checks

    bun run lint
    bun run typecheck
    bun run test

## License

AGPL-3.0-or-later. See `LICENSE`.
