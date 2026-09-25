// SPDX-License-Identifier: AGPL-3.0-or-later
import { type Border, DataTooLongError, type Matrix, makeMatrix, renderQr } from "./render";
import { type Style, type StyleImages, loadStyleImages } from "./styles";
import { isScannable } from "./verify";

export const ICON_RATIOS: readonly number[] = [0.22, 0.2, 0.18, 0.16, 0.14];

/** Module size for the scan tests. The prototype that set the thresholds used 10 px. */
export const VERIFY_MODULE_PX = 10;

export type Failure = "empty" | "too-long" | "unscannable" | "load-failed";

export type Success = {
  ok: true;
  canvas: HTMLCanvasElement;
  data: string;
  iconRatio: number;
  shrunk: boolean;
};

export type Result = Success | { ok: false; reason: Failure };

export interface GenerateOptions {
  data: string;
  border: Border;
  style: Style;
  ratios?: readonly number[];
}

export async function generate(options: GenerateOptions): Promise<Result> {
  const { data, border, style, ratios = ICON_RATIOS } = options;
  if (data === "") return { ok: false, reason: "empty" };

  let matrix: Matrix;
  try {
    matrix = makeMatrix(data);
  } catch (error) {
    if (error instanceof DataTooLongError) return { ok: false, reason: "too-long" };
    throw error;
  }

  let images: StyleImages;
  try {
    images = await loadStyleImages(style);
  } catch {
    return { ok: false, reason: "load-failed" };
  }

  for (const iconRatio of ratios) {
    const { canvas, layout } = renderQr({ matrix, border, iconRatio, ...images });
    if (await isScannable(canvas, data, VERIFY_MODULE_PX / layout.box)) {
      return { ok: true, canvas, data, iconRatio, shrunk: iconRatio !== ratios[0] };
    }
  }
  return { ok: false, reason: "unscannable" };
}
