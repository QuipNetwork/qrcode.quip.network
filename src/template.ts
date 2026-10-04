// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Border } from "./render.ts";
import { STYLES, gradientUrl, iconUrl } from "./styles.ts";

const BORDERS: readonly Border[] = ["white", "black", "transparent"];
const capitalize = (word: string) => word[0]!.toUpperCase() + word.slice(1);

export const TEMPLATE = `
<main class="app">
  <h1>Quip QR code generator</h1>
  <p class="intro">Make Quip-branded QR codes in your browser. Choose a gradient, icon, and border, then download a 1024 × 1024 PNG.</p>
  <noscript><p>Enable JavaScript to generate, check, and download a QR code.</p></noscript>
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
             <img src="${iconUrl(s.icon)}" alt="" width="300" height="${s.icon === "standard" ? 293 : 300}">
           </button>`,
      ).join("")}
    </div>
    <button type="button" id="shuffle">Shuffle</button>
  </fieldset>
  <div id="preview" class="preview"></div>
  <p id="status" class="status" role="status" data-state=""></p>
  <button type="button" id="download" disabled>Download PNG</button>
  <section class="instructions" aria-labelledby="how-it-works">
    <h2 id="how-it-works">How to make a QR code</h2>
    <ol>
      <li>Enter a web address or plain text.</li>
      <li>Choose a gradient and icon style, then select a white, black, or transparent border.</li>
      <li>Wait for the scan check, then select Download PNG.</li>
    </ol>
    <p>The app decodes each code in your browser before it enables the download. If the check fails, try a shorter address.</p>
  </section>
  <footer class="footer">
    <a href="https://gitlab.com/quip.network/qrcode.quip.network" rel="noopener">Source (AGPL-3.0)</a>
  </footer>
</main>`;
