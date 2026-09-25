// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from "vitest";
import { filenameFor, normalizeInput } from "../src/input";

describe("normalizeInput", () => {
  it.each([
    ["", ""],
    ["   ", ""],
    ["  https://quip.network/  ", "https://quip.network/"],
    ["quip.network/qvrf", "https://quip.network/qvrf"],
    ["learn.quip.network", "https://learn.quip.network"],
    ["http://example.com", "http://example.com"],
    ["mailto:hi@quip.network", "mailto:hi@quip.network"],
    ["hello world", "hello world"],
    ["hello", "hello"],
    ["quip.network:8080/x", "https://quip.network:8080/x"],
    ["localhost:5173", "localhost:5173"],
    ["hi@quip.network", "hi@quip.network"],
  ])("%j -> %j", (raw, expected) => {
    expect(normalizeInput(raw)).toBe(expected);
  });
});

describe("filenameFor", () => {
  it.each([
    ["https://quip.network/qvrf/", "qrcode_quip_qvrf.png"],
    ["https://quip.network/use-cases/", "qrcode_quip_use-cases.png"],
    ["https://learn.quip.network/", "qrcode_quip_learn.png"],
    [
      "https://github.com/QuipNetwork/qubitrefill",
      "qrcode_quip_github-quipnetwork-qubitrefill.png",
    ],
    ["https://links.quip.network/", "qrcode_quip_links.png"],
    ["https://accounts.quip.network/", "qrcode_quip_accounts.png"],
    [
      "https://initiatives.thedao.fund/initiative/wallet-security-for-post-quantum-ethereum",
      "qrcode_quip_initiatives-thedao-initiative-wallet-security-for-post-quant.png",
    ],
    ["https://quip.network/", "qrcode_quip_home.png"],
    ["https://www.example.com/A_B?x=1", "qrcode_quip_example-a-b.png"],
    ["hello world", "qrcode_quip_hello-world.png"],
  ])("%j -> %j", (data, expected) => {
    expect(filenameFor(data)).toBe(expected);
  });
});
