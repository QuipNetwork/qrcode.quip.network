// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { DEFAULT_INPUT, MESSAGES, initApp } from "../src/app";

let root: HTMLElement;
const $ = <T extends Element>(selector: string) => root.querySelector<T>(selector)!;
const settle = { timeout: 30_000 };

beforeEach(() => {
  root = document.createElement("div");
  document.body.append(root);
  initApp(root, { random: () => 0 });
});

afterEach(() => {
  root.remove();
  vi.restoreAllMocks();
});

describe("app", () => {
  it("shows a verified code for the default input", async () => {
    await vi.waitFor(() => expect($("#status").getAttribute("data-state")).toBe("ok"), settle);
    expect($("#preview canvas")).not.toBeNull();
    expect($("#preview").getAttribute("data-encoded")).toBe(DEFAULT_INPUT);
    expect($<HTMLButtonElement>("#download").disabled).toBe(false);
    expect($('.style[data-style="a-standard"]').getAttribute("aria-pressed")).toBe("true");
  });

  it("adds https:// to a bare domain and says so", async () => {
    await userEvent.fill($("#url"), "quip.network/qvrf");
    await vi.waitFor(
      () => expect($("#preview").getAttribute("data-encoded")).toBe("https://quip.network/qvrf"),
      settle,
    );
    expect($<HTMLElement>("#encoded").hidden).toBe(false);
    expect($("#encoded").textContent).toContain("https://quip.network/qvrf");
  });

  it("disables the download for empty input", async () => {
    await userEvent.fill($("#url"), "");
    await vi.waitFor(() => expect($("#preview canvas")).toBeNull(), settle);
    expect($<HTMLButtonElement>("#download").disabled).toBe(true);
    expect($("#status").textContent).toBe("");
  });

  it("shows the too-long message past capacity", async () => {
    await userEvent.fill($("#url"), "x".repeat(1300));
    await vi.waitFor(() => expect($("#status").textContent).toBe(MESSAGES["too-long"]), settle);
    expect($<HTMLButtonElement>("#download").disabled).toBe(true);
  });

  it("shows the newest input after a burst of changes", async () => {
    await userEvent.fill($("#url"), "https://links.quip.network/");
    await userEvent.click($('input[name="border"][value="black"]'));
    await userEvent.fill($("#url"), "https://learn.quip.network/");
    await userEvent.click($('.style[data-style="b-inverse"]'));
    await vi.waitFor(() => {
      expect($("#status").getAttribute("data-state")).toBe("ok");
      expect($("#preview").getAttribute("data-encoded")).toBe("https://learn.quip.network/");
    }, settle);
  });

  it("shuffle selects a different style", async () => {
    await userEvent.click($("#shuffle"));
    expect($('.style[data-style="a-standard"]').getAttribute("aria-pressed")).toBe("false");
    expect(root.querySelectorAll('.style[aria-pressed="true"]')).toHaveLength(1);
  });

  it("downloads with the file name from the URL", async () => {
    const names: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      names.push(this.download);
    });
    await vi.waitFor(() => expect($("#status").getAttribute("data-state")).toBe("ok"), settle);
    await userEvent.click($("#download"));
    await vi.waitFor(() => expect(names).toEqual(["qrcode_quip_home.png"]), settle);
  });
});
