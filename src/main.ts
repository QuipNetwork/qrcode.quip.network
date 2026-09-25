// SPDX-License-Identifier: AGPL-3.0-or-later
import { initApp } from "./app";
import "./style.css";

const root = document.getElementById("app");
if (!root) throw new Error("Missing #app element");
initApp(root);
