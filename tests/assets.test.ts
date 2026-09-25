// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from "vitest";

const ASSETS = [
  "/brand/gradient-a.png",
  "/brand/gradient-b.png",
  "/brand/gradient-c.png",
  "/brand/gradient-d.png",
  "/brand/icon-standard.svg",
  "/brand/icon-inverse.svg",
];

describe("brand assets", () => {
  it.each(ASSETS)("%s is served and decodes as an image", async (url) => {
    const img = new Image();
    img.src = url;
    await img.decode();
    expect(img.naturalWidth).toBeGreaterThan(0);
    expect(img.naturalHeight).toBeGreaterThan(0);
  });
});
