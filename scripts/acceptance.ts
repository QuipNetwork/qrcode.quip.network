// SPDX-License-Identifier: AGPL-3.0-or-later
/// <reference types="node" />
// Usage: bun scripts/acceptance.ts https://qrcode.quip.network/
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import { TEST_URLS } from "../tests/fixtures";

const site = process.argv[2];
if (!site) {
  console.error("Usage: bun scripts/acceptance.ts <site-url>");
  process.exit(2);
}

const outDir = "acceptance-output";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
let failures = 0;
try {
  const page = await browser.newPage({ acceptDownloads: true });
  await page.goto(site);

  for (const url of TEST_URLS) {
    await page.fill("#url", url);
    await page.waitForFunction(
      (expected) => {
        const preview = document.querySelector("#preview");
        const status = document.querySelector("#status");
        return (
          preview?.getAttribute("data-encoded") === expected &&
          status?.getAttribute("data-state") === "ok"
        );
      },
      url,
      { timeout: 60_000 },
    );
    const [download] = await Promise.all([page.waitForEvent("download"), page.click("#download")]);
    const file = join(outDir, download.suggestedFilename());
    await download.saveAs(file);

    // zbarimg exits 4 when it finds no code in the image, instead of printing an empty result.
    let decoded: string;
    try {
      decoded = execFileSync("zbarimg", ["-q", "--raw", file], { encoding: "utf8" }).trim();
    } catch {
      failures++;
      console.log(`FAIL ${file} -> no code found`);
      continue;
    }
    const ok = decoded === url;
    if (!ok) failures++;
    console.log(`${ok ? "PASS" : "FAIL"} ${file} -> ${decoded}`);
  }
} finally {
  await browser.close();
}

process.exit(failures === 0 ? 0 : 1);
