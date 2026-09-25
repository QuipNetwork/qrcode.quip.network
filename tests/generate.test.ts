// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from "vitest";
import { ICON_RATIOS, generate } from "../src/generate";
import type { Border } from "../src/render";
import { STYLES } from "../src/styles";
import { decode, toGray } from "../src/verify";
import { LONG_URL, TEST_URLS } from "./fixtures";

const BORDERS: readonly Border[] = ["white", "black", "transparent"];

describe("generate", () => {
  it("returns empty for empty data", async () => {
    expect(await generate({ data: "", border: "white", style: STYLES[0]! })).toEqual({
      ok: false,
      reason: "empty",
    });
  });

  it("returns too-long past QR capacity", async () => {
    const result = await generate({ data: "x".repeat(1300), border: "white", style: STYLES[0]! });
    expect(result).toEqual({ ok: false, reason: "too-long" });
  });

  it("returns unscannable when no ratio passes", async () => {
    const result = await generate({
      data: TEST_URLS[0]!,
      border: "white",
      style: STYLES[0]!,
      ratios: [0.6],
    });
    expect(result).toEqual({ ok: false, reason: "unscannable" });
  });

  it("uses the full icon size for a short URL", async () => {
    const result = await generate({ data: TEST_URLS[0]!, border: "white", style: STYLES[0]! });
    expect(result.ok && result.iconRatio).toBe(ICON_RATIOS[0]);
    expect(result.ok && result.shrunk).toBe(false);
  });

  it("shrinks the icon for the long URL", async () => {
    // STYLES[5] is "c-inverse": the cut-out icon leaves enough of the QR data
    // intact that LONG_URL scans at the full ratio for every "-inverse" style
    // (verified for all 4 gradients), so it can never exercise the shrink
    // path. STYLES[4] ("c-standard", the butterfly icon) does need to shrink.
    const result = await generate({ data: LONG_URL, border: "white", style: STYLES[4]! });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.iconRatio).toBeLessThan(ICON_RATIOS[0]!);
      expect(result.shrunk).toBe(true);
    }
  });

  it("round-trips non-ASCII text", async () => {
    const data = "https://quip.network/ünïcode-€";
    const result = await generate({ data, border: "white", style: STYLES[0]! });
    expect(result.ok).toBe(true);
    if (result.ok) expect(await decode(toGray(result.canvas))).toContain(data);
  });

  it("round-trips every test URL, border, and style", async () => {
    for (const data of TEST_URLS) {
      for (const border of BORDERS) {
        for (const style of STYLES) {
          const result = await generate({ data, border, style });
          expect(result.ok, `${data} ${border} ${style.id}`).toBe(true);
          if (result.ok) {
            expect(result.canvas.width).toBe(1024);
            expect(await decode(toGray(result.canvas))).toContain(data);
          }
        }
      }
    }
    // 7 URLs x 3 borders x 8 styles, each with 5 zbar stress decodes, exceeds the default timeout.
  }, 600_000);
});
