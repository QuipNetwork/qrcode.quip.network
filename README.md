# qrcode.quip.network

Make Quip-branded QR codes in the browser. Type a URL, select a border and a
style, and download a 1024 px PNG. The page decodes each code before it allows
the download.

## Development

The host needs no JS/TS tooling. Every command runs inside a Podman
container (the working directory is mounted at `/app`) via `./run`:

    ./run bun install
    ./run bunx playwright install chromium
    ./run bun run dev

## Checks

    ./run bun run lint
    ./run bun run typecheck
    ./run bun run test

## License

AGPL-3.0-or-later. See `LICENSE`.
