// SPDX-License-Identifier: AGPL-3.0-or-later
import qrcode from "qrcode-generator";

// The library default keeps only the low 8 bits of each character. Its type
// declarations advertise `stringToBytesFuncs["UTF-8"]`, but the installed
// 2.0.4 runtime does not implement it, so encode UTF-8 bytes directly.
qrcode.stringToBytes = (s: string): number[] => Array.from(new TextEncoder().encode(s));

export type Border = "white" | "black" | "transparent";
export type Matrix = boolean[][];

export const OUTPUT_SIZE = 1024;
export const QUIET_MODULES = 2;
export const FRAME_MODULES = 1;
export const CLEAR_MARGIN_MODULES = 1.4;
const CARD_RADIUS_MODULES = 2.5;
const PANEL_RADIUS_MODULES = 1.5;

export class DataTooLongError extends Error {
  constructor() {
    super("The text does not fit in a QR code at error correction level H.");
    this.name = "DataTooLongError";
  }
}

export function makeMatrix(data: string): Matrix {
  const qr = qrcode(0, "H");
  qr.addData(data, "Byte");
  try {
    qr.make();
  } catch (error) {
    // The library throws a plain string, not an Error.
    if (String(error).includes("code length overflow")) throw new DataTooLongError();
    throw error;
  }
  const count = qr.getModuleCount();
  return Array.from({ length: count }, (_, row) =>
    Array.from({ length: count }, (_, col) => qr.isDark(row, col)),
  );
}

export interface Layout {
  size: number;
  box: number;
  moduleCount: number;
  origin: number;
  panel: { x: number; y: number; size: number };
  center: number;
  icon: { width: number; height: number };
  clearRadius: number;
}

export function computeLayout(
  moduleCount: number,
  iconAspect: number,
  iconRatio: number,
  size: number = OUTPUT_SIZE,
): Layout {
  const span = moduleCount + 2 * (QUIET_MODULES + FRAME_MODULES);
  const box = Math.floor(size / span);
  const offset = Math.floor((size - span * box) / 2);
  const origin = offset + (QUIET_MODULES + FRAME_MODULES) * box;
  const panelStart = offset + FRAME_MODULES * box;
  const longest = Math.round(size * iconRatio);
  const icon =
    iconAspect >= 1
      ? { width: longest, height: Math.round(longest / iconAspect) }
      : { width: Math.round(longest * iconAspect), height: longest };
  return {
    size,
    box,
    moduleCount,
    origin,
    panel: { x: panelStart, y: panelStart, size: (moduleCount + 2 * QUIET_MODULES) * box },
    center: origin + (moduleCount * box) / 2,
    icon,
    clearRadius: longest / 2 + CLEAR_MARGIN_MODULES * box,
  };
}

/** True if any point of the module lies inside the clear circle around the icon. */
export function isCleared(layout: Layout, row: number, col: number): boolean {
  const { box, origin, center, clearRadius } = layout;
  const x0 = origin + col * box;
  const y0 = origin + row * box;
  const dx = Math.max(x0 - center, 0, center - (x0 + box));
  const dy = Math.max(y0 - center, 0, center - (y0 + box));
  return dx * dx + dy * dy < clearRadius * clearRadius;
}

export interface RenderOptions {
  matrix: Matrix;
  border: Border;
  gradient: HTMLImageElement;
  icon: HTMLImageElement;
  iconRatio: number;
  size?: number;
}

export interface Rendered {
  canvas: HTMLCanvasElement;
  layout: Layout;
}

export function renderQr(options: RenderOptions): Rendered {
  const { matrix, border, gradient, icon, iconRatio } = options;
  const layout = computeLayout(
    matrix.length,
    icon.naturalWidth / icon.naturalHeight,
    iconRatio,
    options.size,
  );
  const { size, box, origin, panel, center } = layout;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas is not available");

  if (border !== "transparent") {
    ctx.fillStyle = border === "white" ? "#ffffff" : "#000000";
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, CARD_RADIUS_MODULES * box);
    ctx.fill();
  }

  // The gradient files have semi-transparent pixels, so draw them over white.
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(panel.x, panel.y, panel.size, panel.size, PANEL_RADIUS_MODULES * box);
  ctx.clip();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(panel.x, panel.y, panel.size, panel.size);
  const side = Math.min(gradient.naturalWidth, gradient.naturalHeight);
  ctx.drawImage(
    gradient,
    (gradient.naturalWidth - side) / 2,
    (gradient.naturalHeight - side) / 2,
    side,
    side,
    panel.x,
    panel.y,
    panel.size,
    panel.size,
  );
  ctx.restore();

  ctx.fillStyle = "#000000";
  matrix.forEach((cells, row) =>
    cells.forEach((dark, col) => {
      if (dark && !isCleared(layout, row, col)) {
        ctx.fillRect(origin + col * box, origin + row * box, box, box);
      }
    }),
  );

  ctx.drawImage(
    icon,
    Math.round(center - layout.icon.width / 2),
    Math.round(center - layout.icon.height / 2),
    layout.icon.width,
    layout.icon.height,
  );
  return { canvas, layout };
}
