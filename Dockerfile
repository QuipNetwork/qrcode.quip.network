# SPDX-License-Identifier: AGPL-3.0-or-later
# Local dev image: oven/bun 1.4.2 (matches netlify.toml and CI) plus the
# system libraries headless Chromium needs. Browsers themselves download
# into a named volume at first use; see ./run.
FROM docker.io/oven/bun:1.4.2
RUN bunx --package playwright@1.63.0 playwright install-deps chromium
