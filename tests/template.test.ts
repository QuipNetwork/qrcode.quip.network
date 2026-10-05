// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from "vitest";
import { APP_HTML, TEMPLATE } from "../src/template";
import { STYLES } from "../src/styles";

const parse = (html: string): HTMLElement => {
  const root = document.createElement("div");
  root.innerHTML = html;
  return root;
};

describe("static page template", () => {
  it("renders the app shell the client boots from", () => {
    const root = parse(TEMPLATE);
    expect(root.querySelector("h1")?.textContent).toBe("Quip QR code generator");
    expect(root.querySelector("#url")).not.toBeNull();
    expect(root.querySelector("#encoded")).not.toBeNull();
    expect(root.querySelector("#preview")).not.toBeNull();
    expect(root.querySelector("#status")).not.toBeNull();
    expect(root.querySelector("#download")).not.toBeNull();
    expect(root.querySelectorAll('input[name="border"]')).toHaveLength(3);
    expect(root.querySelectorAll(".style")).toHaveLength(STYLES.length);
  });

  it("renders the SEO content crawlers see without JavaScript", () => {
    const root = parse(TEMPLATE);
    expect(root.querySelector(".intro")).not.toBeNull();
    expect(root.querySelector("noscript")).not.toBeNull();
    expect(root.querySelector("#how-it-works")).not.toBeNull();
    expect(root.querySelector(".instructions ol")?.children).toHaveLength(3);
    expect(root.querySelector('.footer a[href*="gitlab.com"]')).not.toBeNull();
  });

  it("wraps the template in the #app root for index.html injection", () => {
    const root = parse(APP_HTML);
    expect(root.querySelector("div#app > main.app")).not.toBeNull();
    expect(APP_HTML).toContain(TEMPLATE);
  });
});
