// SPDX-License-Identifier: AGPL-3.0-or-later
import { beforeAll, describe, expect, it } from "vitest";
import { type Border, makeMatrix, renderQr } from "../src/render";
import { STYLES, type StyleImages, loadStyleImages } from "../src/styles";
import { decode, gaussianBlur, isScannable, toGray } from "../src/verify";

const URL = "https://quip.network/qvrf/";
let images: StyleImages;

beforeAll(async () => {
  images = await loadStyleImages(STYLES[0]!);
});

function draw(border: Border, iconRatio = 0.22) {
  return renderQr({ matrix: makeMatrix(URL), border, iconRatio, ...images });
}

describe("toGray", () => {
  it("expands the bounds for a rotation", () => {
    const canvas = document.createElement("canvas");
    canvas.width = 100;
    canvas.height = 100;
    const gray = toGray(canvas, 1, 7);
    expect(gray.width).toBe(112);
    expect(gray.data.length).toBe(gray.width * gray.height);
  });

  it("flattens transparent pixels onto white", () => {
    const canvas = document.createElement("canvas");
    canvas.width = 4;
    canvas.height = 4;
    expect(Array.from(toGray(canvas).data).every((v) => v === 255)).toBe(true);
  });
});

describe("gaussianBlur", () => {
  it("keeps a uniform image uniform", () => {
    const image = { data: new Uint8ClampedArray(25).fill(200), width: 5, height: 5 };
    expect(Array.from(gaussianBlur(image, 1).data).every((v) => v === 200)).toBe(true);
  });

  it("spreads a single bright pixel to its neighbors", () => {
    const data = new Uint8ClampedArray(25);
    data[12] = 255;
    const out = gaussianBlur({ data, width: 5, height: 5 }, 1).data;
    expect(out[12]).toBeLessThan(255);
    expect(out[11]).toBeGreaterThan(0);
  });
});

describe("decode", () => {
  it("reads a rendered code", async () => {
    expect(await decode(toGray(draw("white").canvas))).toContain(URL);
  });
});

describe("isScannable", () => {
  it.each<Border>(["white", "black", "transparent"])(
    "passes a normal code with the %s border",
    async (border) => {
      const { canvas, layout } = draw(border);
      expect(await isScannable(canvas, URL, 10 / layout.box)).toBe(true);
    },
  );

  it("fails when the decoded text differs", async () => {
    const { canvas, layout } = draw("white");
    expect(await isScannable(canvas, "https://quip.network/other/", 10 / layout.box)).toBe(false);
  });

  it("fails on a blank canvas", async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    expect(await isScannable(canvas, URL)).toBe(false);
  });

  it("fails when the icon covers too much of the code", async () => {
    const { canvas, layout } = draw("white", 0.6);
    expect(await isScannable(canvas, URL, 10 / layout.box)).toBe(false);
  });
});
