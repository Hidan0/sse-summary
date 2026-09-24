import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

import Vue from "@vitejs/plugin-vue";

import markdown from "./vite/markdown";

export default defineConfig({
  base: "/sse-summary/",
  plugins: [markdown(), Vue()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) }
  }
});
