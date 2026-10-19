#!/usr/bin/env bun
import { main } from "./lib/runtime";

main(() => {
  const [baseURL, testDir, ...extra] = process.argv.slice(2);
  if (!baseURL || !testDir?.trim() || extra.length) throw new Error("Usage: e2e-init.ts <running-http-url> <test-directory>");
  let url: URL;
  try { url = new URL(baseURL); } catch { throw new Error("Supply an HTTP or HTTPS URL."); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("Supply an HTTP or HTTPS URL without credentials.");
  console.log(`import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: ${JSON.stringify(testDir)},
  use: { baseURL: ${JSON.stringify(baseURL)} },
});`);
});
