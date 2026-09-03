#!/usr/bin/env node
// Snip CLI — zero-dependency Node client for the Snip URL shortener backend.
// CommonJS, uses the global `fetch` (Node 18+). No npm dependencies.

"use strict";

const { execFile } = require("child_process");

const BASE_URL = process.env.SNIP_API || "http://localhost:3000";

function usage() {
  return [
    "Usage: snip <command> [args]",
    "",
    "Commands:",
    "  add <url>    Create a short link for <url>",
    "  ls           List all short links",
    "  open <code>  Open the target URL for <code> in your browser",
    "",
    "Environment:",
    "  SNIP_API     Backend base URL (default: http://localhost:3000)",
  ].join("\n");
}

function fail(message) {
  process.stderr.write(`Error: ${message}\n`);
  process.exit(1);
}

async function apiRequest(path, options) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, options);
  } catch (err) {
    fail(`Could not reach backend at ${BASE_URL} (${err.message})`);
  }
  return response;
}

async function cmdAdd(url) {
  if (!url) {
    fail("Usage: snip add <url>");
  }

  const response = await apiRequest("/api/links", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  let body;
  try {
    body = await response.json();
  } catch {
    fail(`Backend returned an invalid response (status ${response.status})`);
  }

  if (!response.ok) {
    fail(body && body.error ? body.error : `Request failed (status ${response.status})`);
  }

  console.log(body.shortUrl);
}

async function cmdLs() {
  const response = await apiRequest("/api/links", { method: "GET" });

  let body;
  try {
    body = await response.json();
  } catch {
    fail(`Backend returned an invalid response (status ${response.status})`);
  }

  if (!response.ok) {
    fail(body && body.error ? body.error : `Request failed (status ${response.status})`);
  }

  if (!Array.isArray(body) || body.length === 0) {
    console.log("No links yet.");
    return;
  }

  const codeWidth = Math.max(4, ...body.map((link) => String(link.code).length));
  const hitsWidth = Math.max(4, ...body.map((link) => String(link.hits).length));

  const header = `${"CODE".padEnd(codeWidth)}  ${"HITS".padEnd(hitsWidth)}  URL`;
  console.log(header);

  for (const link of body) {
    const code = String(link.code).padEnd(codeWidth);
    const hits = String(link.hits).padEnd(hitsWidth);
    console.log(`${code}  ${hits}  ${link.url}`);
  }
}

function openInBrowser(target) {
  const platform = process.platform;
  let command;
  let args;

  if (platform === "win32") {
    command = "cmd";
    args = ["/c", "start", "", target];
  } else if (platform === "darwin") {
    command = "open";
    args = [target];
  } else {
    command = "xdg-open";
    args = [target];
  }

  execFile(command, args, (err) => {
    if (err) {
      fail(`Could not open browser: ${err.message}`);
    }
  });
}

async function cmdOpen(code) {
  if (!code) {
    fail("Usage: snip open <code>");
  }

  const response = await apiRequest(`/${code}`, { redirect: "manual" });

  if (response.status === 404) {
    fail(`Unknown short code: ${code}`);
  }

  const location = response.headers.get("location");
  if (!location) {
    fail(`Backend did not return a redirect for code: ${code}`);
  }

  console.log(`Opening ${location}`);
  openInBrowser(location);
}

async function main() {
  const [, , command, ...args] = process.argv;

  if (!command || command === "help" || command === "-h" || command === "--help") {
    console.log(usage());
    return;
  }

  switch (command) {
    case "add":
      await cmdAdd(args[0]);
      break;
    case "ls":
      await cmdLs();
      break;
    case "open":
      await cmdOpen(args[0]);
      break;
    default:
      process.stderr.write(`Unknown command: ${command}\n\n${usage()}\n`);
      process.exit(1);
  }
}

main().catch((err) => {
  fail(err && err.message ? err.message : String(err));
});
