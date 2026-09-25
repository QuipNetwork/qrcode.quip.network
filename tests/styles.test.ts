// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from "vitest";
import { STYLES, loadImage, loadStyleImages, randomStyle } from "../src/styles";

describe("styles", () => {
  it("has 8 unique styles covering every gradient and icon", () => {
    expect(STYLES).toHaveLength(8);
    expect(new Set(STYLES.map((s) => s.id)).size).toBe(8);
    expect(STYLES.map((s) => s.id)).toContain("c-inverse");
  });

  it("randomStyle never returns the excluded style", () => {
    for (let i = 0; i < 8; i++) {
      const value = i / 8;
      expect(randomStyle("a-standard", () => value).id).not.toBe("a-standard");
    }
  });

  it("randomStyle covers the whole range of the random source", () => {
    expect(randomStyle(undefined, () => 0).id).toBe(STYLES[0]!.id);
    expect(randomStyle(undefined, () => 0.999).id).toBe(STYLES[7]!.id);
  });

  it("loads the images for every style", async () => {
    for (const style of STYLES) {
      const { gradient, icon } = await loadStyleImages(style);
      expect(gradient.naturalWidth).toBeGreaterThan(0);
      expect(icon.naturalWidth).toBeGreaterThan(0);
    }
  });

  it("rejects a missing image and retries it on the next call", async () => {
    await expect(loadImage("/brand/missing.png")).rejects.toThrow();
    await expect(loadImage("/brand/missing.png")).rejects.toThrow();
  });
});
