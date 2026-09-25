// SPDX-License-Identifier: AGPL-3.0-or-later

const SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const PREFIX = "qrcode_quip";
const MAX_SLUG = 60;
const QUIP_SUFFIX = ".quip.network";

/**
 * Trims the input. Adds https:// to a bare domain such as "quip.network/qvrf",
 * because phone cameras treat a code without a scheme as plain text.
 */
export function normalizeInput(raw: string): string {
  const text = raw.trim();
  const looksLikeBareDomain = !SCHEME.test(text) && !/\s/.test(text) && text.includes(".");
  return looksLikeBareDomain ? `https://${text}` : text;
}

function hostParts(hostname: string): string[] {
  const host = hostname.replace(/^www\./, "");
  if (host === "quip.network") return [];
  if (host.endsWith(QUIP_SUFFIX)) return [host.slice(0, -QUIP_SUFFIX.length)];
  return host.split(".").slice(0, -1);
}

/** Builds the download name, for example qrcode_quip_links.png. */
export function filenameFor(data: string): string {
  let parts: string[];
  try {
    const url = new URL(data);
    parts = [...hostParts(url.hostname), ...url.pathname.split("/")];
  } catch {
    parts = [data];
  }
  const slug = parts
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG)
    .replace(/-+$/, "");
  return `${PREFIX}_${slug || "home"}.png`;
}
