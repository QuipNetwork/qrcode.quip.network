// SPDX-License-Identifier: AGPL-3.0-or-later
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/", "node_modules/", "acceptance-output/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { languageOptions: { globals: { ...globals.browser } } },
  { files: ["scripts/**", "*.config.*"], languageOptions: { globals: { ...globals.node } } },
);
