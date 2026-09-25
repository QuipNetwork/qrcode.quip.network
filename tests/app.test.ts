// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { DEFAULT_INPUT, MESSAGES, initApp } from "../src/app";
import * as generateModule from "../src/generate";
import type { Result } from "../src/generate";

vi.mock("../src/generate", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/generate")>();
  return { ...actual, generate: vi.fn(actual.generate) };
});

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

  it("does not publish a stale result from an earlier keystroke", async () => {
    await vi.waitFor(() => expect($("#status").getAttribute("data-state")).toBe("ok"), settle);

    const mockedGenerate = vi.mocked(generateModule.generate);
    let resolveStale!: (result: Result) => void;
    const stale = new Promise<Result>((resolve) => {
      resolveStale = resolve;
    });
    mockedGenerate.mockImplementationOnce(() => stale);

    const url = $<HTMLInputElement>("#url");
    url.value = "https://links.quip.network/";
    url.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(mockedGenerate).toHaveBeenCalledTimes(2), settle);

    // Type a second value before the first generation resolves.
    url.value = "https://learn.quip.network/";
    url.dispatchEvent(new Event("input", { bubbles: true }));
    expect($<HTMLButtonElement>("#download").disabled).toBe(true);

    // Resolve the stale (first) generation now, while the second is still pending.
    resolveStale({
      ok: true,
      canvas: document.createElement("canvas"),
      data: "https://links.quip.network/",
      iconRatio: 0.22,
      shrunk: false,
    });
    await Promise.resolve();
    await Promise.resolve();
    expect($("#preview").getAttribute("data-encoded")).not.toBe("https://links.quip.network/");
    expect($<HTMLButtonElement>("#download").disabled).toBe(true);

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
