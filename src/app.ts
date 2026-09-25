// SPDX-License-Identifier: AGPL-3.0-or-later
import { type Failure, type Success, generate } from "./generate";
import { filenameFor, normalizeInput } from "./input";
import type { Border } from "./render";
import { STYLES, type Style, gradientUrl, iconUrl, randomStyle } from "./styles";

export const DEBOUNCE_MS = 150;
export const DEFAULT_INPUT = "https://quip.network/";

export const MESSAGES: Record<Failure, string> = {
  empty: "",
  "too-long": "This text is too long for a QR code. Use a shorter URL.",
  unscannable: "Could not make a code that scans reliably. Use a shorter URL.",
  "load-failed": "Could not load the style images. Reload the page.",
};
const UNEXPECTED = "Something went wrong. Reload the page.";

const BORDERS: readonly Border[] = ["white", "black", "transparent"];
const capitalize = (word: string) => word[0]!.toUpperCase() + word.slice(1);

const TEMPLATE = `
<main class="app">
  <h1>Quip QR code</h1>
  <label class="field">URL
    <input id="url" type="text" inputmode="url" autocomplete="off" spellcheck="false">
  </label>
  <p id="encoded" class="hint" hidden></p>
  <fieldset class="borders">
    <legend>Border</legend>
    ${BORDERS.map(
      (b) =>
        `<label><input type="radio" name="border" value="${b}"${b === "white" ? " checked" : ""}> ${capitalize(b)}</label>`,
    ).join("")}
  </fieldset>
  <fieldset class="styles">
    <legend>Style</legend>
    <div class="style-list">
      ${STYLES.map(
        (s) =>
          `<button type="button" class="style" data-style="${s.id}" aria-pressed="false"
             aria-label="Gradient ${s.gradient.toUpperCase()}, ${s.icon} icon"
             style="background-image:url('${gradientUrl(s.gradient)}')">
             <img src="${iconUrl(s.icon)}" alt="">
           </button>`,
      ).join("")}
    </div>
    <button type="button" id="shuffle">Shuffle</button>
  </fieldset>
  <div id="preview" class="preview"></div>
  <p id="status" class="status" role="status" data-state=""></p>
  <button type="button" id="download" disabled>Download PNG</button>
</main>`;

export interface AppOptions {
  random?: () => number;
}

export function initApp(root: HTMLElement, options: AppOptions = {}): void {
  root.innerHTML = TEMPLATE;
  const find = <T extends Element>(selector: string): T => {
    const element = root.querySelector<T>(selector);
    if (!element) throw new Error(`Missing element ${selector}`);
    return element;
  };
  const input = find<HTMLInputElement>("#url");
  const encoded = find<HTMLParagraphElement>("#encoded");
  const preview = find<HTMLDivElement>("#preview");
  const status = find<HTMLParagraphElement>("#status");
  const download = find<HTMLButtonElement>("#download");
  const styleButtons = Array.from(root.querySelectorAll<HTMLButtonElement>(".style"));

  let style: Style = randomStyle(undefined, options.random);
  let border: Border = "white";
  let current: Success | null = null;
  let sequence = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const setStatus = (text: string, state: "" | "ok" | "error" | "busy") => {
    status.textContent = text;
    status.dataset.state = state;
  };

  const showFailure = (text: string) => {
    current = null;
    preview.replaceChildren();
    preview.removeAttribute("data-encoded");
    setStatus(text, text === "" ? "" : "error");
  };

  const markStyle = () => {
    for (const button of styleButtons) {
      button.setAttribute("aria-pressed", String(button.dataset.style === style.id));
    }
  };

  async function update(): Promise<void> {
    const id = ++sequence;
    const data = normalizeInput(input.value);
    encoded.hidden = data === "" || data === input.value.trim();
    encoded.textContent = `Encodes ${data}`;
    download.disabled = true;
    if (data !== "") setStatus("Checking…", "busy");

    try {
      const result = await generate({ data, border, style });
      if (id !== sequence) return; // A newer update started while this one ran.
      if (!result.ok) {
        showFailure(MESSAGES[result.reason]);
        return;
      }
      current = result;
      preview.replaceChildren(result.canvas);
      preview.dataset.encoded = result.data;
      const note = result.shrunk
        ? ` (icon reduced to ${Math.round(result.iconRatio * 100)}% of width)`
        : "";
      setStatus(`✓ Verified scannable${note}`, "ok");
      download.disabled = false;
    } catch (error) {
      if (id !== sequence) return;
      console.error(error);
      showFailure(UNEXPECTED);
    }
  }

  const schedule = () => {
    sequence++; // Invalidate any in-flight update before it can publish a stale result.
    download.disabled = true;
    clearTimeout(timer);
    timer = setTimeout(() => void update(), DEBOUNCE_MS);
  };

  input.addEventListener("input", schedule);
  for (const radio of root.querySelectorAll<HTMLInputElement>('input[name="border"]')) {
    radio.addEventListener("change", () => {
      border = radio.value as Border;
      void update();
    });
  }
  for (const button of styleButtons) {
    button.addEventListener("click", () => {
      style = STYLES.find((s) => s.id === button.dataset.style) ?? style;
      markStyle();
      void update();
    });
  }
  find<HTMLButtonElement>("#shuffle").addEventListener("click", () => {
    style = randomStyle(style.id, options.random);
    markStyle();
    void update();
  });
  download.addEventListener("click", () => {
    if (!current) return;
    const { canvas, data } = current;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filenameFor(data);
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  });

  input.value = DEFAULT_INPUT;
  markStyle();
  void update();
}
