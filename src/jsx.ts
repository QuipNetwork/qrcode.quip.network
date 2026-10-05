// SPDX-License-Identifier: AGPL-3.0-or-later

export interface VNode {
  tag: string | Component | typeof Fragment;
  props: Record<string, unknown>;
  children: unknown[];
}

export type Component = (props: Record<string, unknown>) => unknown;

export const Fragment = Symbol("Fragment");

export function h(
  tag: VNode["tag"],
  props: Record<string, unknown> | null,
  ...children: unknown[]
): VNode {
  return { tag, props: props ?? {}, children };
}

const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const escapeText = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const escapeAttribute = (value: string): string => escapeText(value).replace(/"/g, "&quot;");

const renderStyle = (style: unknown): string | undefined => {
  if (typeof style === "string") return style;
  if (typeof style !== "object" || style === null) return undefined;
  const parts: string[] = [];
  for (const [key, value] of Object.entries(style)) {
    if (value === undefined || value === null || value === false) continue;
    parts.push(`${key}:${String(value)}`);
  }
  return parts.length > 0 ? parts.join(";") : undefined;
};

const renderAttributes = (props: Record<string, unknown>): string => {
  let out = "";
  for (const [rawName, rawValue] of Object.entries(props)) {
    if (rawName === "children" || rawName === "key" || rawName === "ref") continue;
    if (rawName === "dangerouslySetInnerHTML") continue;
    const name = rawName === "className" ? "class" : rawName === "htmlFor" ? "for" : rawName;
    if (rawValue === undefined || rawValue === null || rawValue === false) continue;
    if (name === "style") {
      const style = renderStyle(rawValue);
      if (style === undefined) continue;
      out += ` style="${escapeAttribute(style)}"`;
      continue;
    }
    if (rawValue === true) {
      out += ` ${name}`;
      continue;
    }
    out += ` ${name}="${escapeAttribute(String(rawValue))}"`;
  }
  return out;
};

export function renderToStaticMarkup(node: unknown): string {
  if (node === undefined || node === null || node === false) return "";
  if (typeof node === "string") return escapeText(node);
  if (typeof node === "number") return escapeText(String(node));
  if (Array.isArray(node)) return node.map(renderToStaticMarkup).join("");
  if (typeof node === "object" && "tag" in node) {
    const vnode = node as VNode;
    if (vnode.tag === Fragment) return renderToStaticMarkup(vnode.children);
    if (typeof vnode.tag === "function") {
      const rendered = (vnode.tag as Component)({
        ...vnode.props,
        children: vnode.children,
      });
      return renderToStaticMarkup(rendered);
    }
    const attrs = renderAttributes(vnode.props);
    if (VOID_ELEMENTS.has(vnode.tag as string)) return `<${vnode.tag}${attrs}>`;
    const inner = vnode.props["dangerouslySetInnerHTML"];
    if (typeof inner === "object" && inner !== null && "__html" in inner) {
      const html = (inner as { __html: unknown }).__html;
      return `<${vnode.tag}${attrs}>${String(html ?? "")}</${vnode.tag}>`;
    }
    return `<${vnode.tag}${attrs}>${renderToStaticMarkup(vnode.children)}</${vnode.tag}>`;
  }
  return escapeText(String(node));
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    type Element = VNode;
    interface IntrinsicElements {
      [element: string]: Record<string, unknown> & { children?: unknown };
    }
  }
}
