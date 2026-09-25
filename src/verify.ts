// SPDX-License-Identifier: AGPL-3.0-or-later
import { scanGrayBuffer, setModuleArgs } from "@undecaf/zbar-wasm";
import wasmUrl from "@undecaf/zbar-wasm/dist/zbar.wasm?url";

setModuleArgs({ locateFile: () => wasmUrl });

export interface GrayImage {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/**
 * Draws the canvas over white at the given scale and rotation, then converts
 * it to grayscale. The white fill makes a transparent border test the way it
 * looks on a light page.
 */
export function toGray(source: HTMLCanvasElement, scale = 1, rotateDegrees = 0): GrayImage {
  const w = Math.round(source.width * scale);
  const h = Math.round(source.height * scale);
  const angle = (rotateDegrees * Math.PI) / 180;
  const cos = Math.abs(Math.cos(angle));
  const sin = Math.abs(Math.sin(angle));
  const width = Math.ceil(w * cos + h * sin);
  const height = Math.ceil(w * sin + h * cos);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2D canvas is not available");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.translate(width / 2, height / 2);
  ctx.rotate(angle);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, -w / 2, -h / 2, w, h);

  const rgba = ctx.getImageData(0, 0, width, height).data;
  const data = new Uint8ClampedArray(width * height);
  for (let i = 0; i < data.length; i++) {
    data[i] = 0.299 * rgba[4 * i]! + 0.587 * rgba[4 * i + 1]! + 0.114 * rgba[4 * i + 2]!;
  }
  return { data, width, height };
}

/** Separable Gaussian blur in JavaScript, so results match in every browser. */
export function gaussianBlur(image: GrayImage, sigma: number): GrayImage {
  const radius = Math.ceil(sigma * 3);
  const kernel: number[] = [];
  let sum = 0;
  for (let k = -radius; k <= radius; k++) {
    const weight = Math.exp(-(k * k) / (2 * sigma * sigma));
    kernel.push(weight);
    sum += weight;
  }
  const normalized = kernel.map((weight) => weight / sum);
  const { width, height } = image;

  const pass = (src: Uint8ClampedArray, horizontal: boolean): Uint8ClampedArray => {
    const out = new Uint8ClampedArray(src.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let acc = 0;
        for (let k = -radius; k <= radius; k++) {
          const sx = horizontal ? Math.min(width - 1, Math.max(0, x + k)) : x;
          const sy = horizontal ? y : Math.min(height - 1, Math.max(0, y + k));
          acc += src[sy * width + sx]! * normalized[k + radius]!;
        }
        out[y * width + x] = Math.round(acc);
      }
    }
    return out;
  };

  return { data: pass(pass(image.data, true), false), width, height };
}

export async function decode(image: GrayImage): Promise<string[]> {
  const buffer = image.data.slice().buffer as ArrayBuffer;
  const symbols = await scanGrayBuffer(buffer, image.width, image.height);
  return symbols.map((symbol) => symbol.decode());
}

export const STRESS_TESTS: readonly {
  name: string;
  prepare: (canvas: HTMLCanvasElement, scale: number) => GrayImage;
}[] = [
  { name: "full", prepare: (canvas, scale) => toGray(canvas, scale) },
  { name: "half", prepare: (canvas, scale) => toGray(canvas, scale / 2) },
  { name: "blur", prepare: (canvas, scale) => gaussianBlur(toGray(canvas, scale), 1.5) },
  { name: "half-blur", prepare: (canvas, scale) => gaussianBlur(toGray(canvas, scale / 2), 1) },
  { name: "rotate", prepare: (canvas, scale) => toGray(canvas, scale, 7) },
];

/** True if every stress test decodes exactly the expected text. */
export async function isScannable(
  canvas: HTMLCanvasElement,
  expected: string,
  scale = 1,
): Promise<boolean> {
  for (const test of STRESS_TESTS) {
    const found = await decode(test.prepare(canvas, scale));
    if (!found.includes(expected)) return false;
  }
  return true;
}
