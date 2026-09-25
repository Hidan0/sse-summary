import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

import Vue from "@vitejs/plugin-vue";

import markdown from "./vite/markdown";
import ricerca from "./vite/ricerca";

export default defineConfig({
  base: "/sse-summary/",
  plugins: [markdown(), ricerca(), Vue()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) }
  }
});
