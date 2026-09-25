// SPDX-License-Identifier: AGPL-3.0-or-later

export type GradientId = "a" | "b" | "c" | "d";
export type IconId = "standard" | "inverse";

export interface Style {
  id: string;
  gradient: GradientId;
  icon: IconId;
}

export interface StyleImages {
  gradient: HTMLImageElement;
  icon: HTMLImageElement;
}

const GRADIENTS: readonly GradientId[] = ["a", "b", "c", "d"];
const ICONS: readonly IconId[] = ["standard", "inverse"];

export const STYLES: readonly Style[] = GRADIENTS.flatMap((gradient) =>
  ICONS.map((icon) => ({ id: `${gradient}-${icon}`, gradient, icon })),
);

export const gradientUrl = (gradient: GradientId): string => `/brand/gradient-${gradient}.png`;
export const iconUrl = (icon: IconId): string => `/brand/icon-${icon}.svg`;

export function randomStyle(excludeId?: string, random: () => number = Math.random): Style {
  const choices = STYLES.filter((style) => style.id !== excludeId);
  const index = Math.min(choices.length - 1, Math.floor(random() * choices.length));
  return choices[index] as Style;
}

const cache = new Map<string, Promise<HTMLImageElement>>();

export function loadImage(url: string): Promise<HTMLImageElement> {
  const cached = cache.get(url);
  if (cached) return cached;
  const img = new Image();
  img.src = url;
  const loading = img.decode().then(
    () => img,
    (error: unknown) => {
      cache.delete(url);
      throw error;
    },
  );
  cache.set(url, loading);
  return loading;
}

export async function loadStyleImages(style: Style): Promise<StyleImages> {
  const [gradient, icon] = await Promise.all([
    loadImage(gradientUrl(style.gradient)),
    loadImage(iconUrl(style.icon)),
  ]);
  return { gradient, icon };
}
