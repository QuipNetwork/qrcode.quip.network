// SPDX-License-Identifier: AGPL-3.0-or-later
import { beforeAll, describe, expect, it } from "vitest";
import {
  type Border,
  DataTooLongError,
  OUTPUT_SIZE,
  QUIET_MODULES,
  computeLayout,
  isCleared,
  makeMatrix,
  renderQr,
} from "../src/render";
import { STYLES, type StyleImages, loadImage, loadStyleImages } from "../src/styles";

const URL = "https://quip.network/qvrf/";
const BLANK_ICON =
  "data:image/svg+xml," +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"/>');

let images: StyleImages;
let blankIcon: HTMLImageElement;

beforeAll(async () => {
  images = await loadStyleImages(STYLES[0]!);
  blankIcon = await loadImage(BLANK_ICON);
});

function pixel(canvas: HTMLCanvasElement, x: number, y: number): number[] {
  const ctx = canvas.getContext("2d")!;
  return Array.from(ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data);
}

const luminance = ([r, g, b]: number[]) => 0.299 * r! + 0.587 * g! + 0.114 * b!;

describe("makeMatrix", () => {
  it("returns a square matrix", () => {
    const matrix = makeMatrix(URL);
    expect(matrix.length).toBeGreaterThanOrEqual(21);
    for (const row of matrix) expect(row).toHaveLength(matrix.length);
  });

  it("throws DataTooLongError past capacity", () => {
    expect(() => makeMatrix("x".repeat(1300))).toThrow(DataTooLongError);
  });

  it("encodes non-ASCII text as UTF-8, not truncated bytes", () => {
    // Latin-1 truncation maps "€" (U+20AC) to 0xAC, the same byte as "¬" (U+00AC).
    expect(makeMatrix("€")).not.toEqual(makeMatrix("¬"));
  });
});

describe("computeLayout", () => {
  it("fits the whole code inside the output size with integer modules", () => {
    const layout = computeLayout(33, 1, 0.22);
    expect(Number.isInteger(layout.box)).toBe(true);
    expect(layout.origin + 33 * layout.box + 3 * layout.box).toBeLessThanOrEqual(OUTPUT_SIZE);
    expect(layout.panel.size).toBe((33 + 2 * QUIET_MODULES) * layout.box);
  });

  it("keeps the icon aspect ratio", () => {
    const layout = computeLayout(33, 300 / 293, 0.22);
    expect(layout.icon.width).toBe(Math.round(OUTPUT_SIZE * 0.22));
    expect(layout.icon.height).toBeLessThan(layout.icon.width);
  });
});

describe("isCleared", () => {
  it("keeps the finder pattern and clears the center", () => {
    const layout = computeLayout(33, 1, 0.22);
    expect(isCleared(layout, 0, 0)).toBe(false);
    expect(isCleared(layout, 16, 16)).toBe(true);
  });
});

describe("renderQr", () => {
  it("draws a 1024 px square canvas", () => {
    const { canvas } = renderQr({
      matrix: makeMatrix(URL),
      border: "white",
      iconRatio: 0.22,
      ...images,
    });
    expect(canvas.width).toBe(1024);
    expect(canvas.height).toBe(1024);
  });

  it.each<[Border, number[]]>([
    ["white", [255, 255, 255, 255]],
    ["black", [0, 0, 0, 255]],
    ["transparent", [0, 0, 0, 0]],
  ])("draws the %s border", (border, expected) => {
    const { canvas } = renderQr({ matrix: makeMatrix(URL), border, iconRatio: 0.22, ...images });
    const [r, g, b, a] = pixel(canvas, OUTPUT_SIZE / 2, 2);
    if (border === "transparent") expect(a).toBe(0);
    else expect([r, g, b, a]).toEqual(expected);
  });

  it.each<Border>(["white", "black", "transparent"])(
    "keeps a light, opaque quiet zone with the %s border",
    (border) => {
      const { canvas, layout } = renderQr({
        matrix: makeMatrix(URL),
        border,
        iconRatio: 0.22,
        ...images,
      });
      const sample = pixel(canvas, layout.center, layout.panel.y + layout.box);
      expect(sample[3]).toBe(255);
      expect(luminance(sample)).toBeGreaterThan(150);
    },
  );

  it("draws no module inside the clear circle", () => {
    const { canvas, layout } = renderQr({
      matrix: makeMatrix(URL),
      border: "white",
      iconRatio: 0.22,
      gradient: images.gradient,
      icon: blankIcon,
    });
    const ctx = canvas.getContext("2d")!;
    const r = layout.clearRadius - 1;
    const x0 = Math.floor(layout.center - r);
    const size = Math.ceil(2 * r);
    const data = ctx.getImageData(x0, x0, size, size).data;
    for (let y = 0; y < size; y += 2) {
      for (let x = 0; x < size; x += 2) {
        const dx = x0 + x - layout.center;
        const dy = x0 + y - layout.center;
        if (dx * dx + dy * dy > r * r) continue;
        const i = 4 * (y * size + x);
        expect(luminance([data[i]!, data[i + 1]!, data[i + 2]!])).toBeGreaterThan(128);
      }
    }
  });
});
