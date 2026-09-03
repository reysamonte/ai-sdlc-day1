#!/usr/bin/env node
// scripts/build-bundle.mjs
//
// Regenerates the `bundle` submodule: a self-contained deployable folder that
// combines the backend server, the built frontend UI, and the CLI into one
// Bun-runnable package. Zero npm dependencies; uses only Node's stdlib.
//
// Usage:
//   node scripts/build-bundle.mjs           # build + commit inside bundle/, bump pointer locally (no push)
//   node scripts/build-bundle.mjs --push    # also push the bundle branch and main
//
// Safe to re-run: if nothing changed, both the bundle/ commit step and the
// superproject pointer-bump step are no-ops.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, "..");
const BACKEND_DIR = path.join(ROOT, "backend");
const FRONTEND_DIR = path.join(ROOT, "frontend");
const CLI_DIR = path.join(ROOT, "cli");
const BUNDLE_DIR = path.join(ROOT, "bundle");
const FRONTEND_BROWSER_DIST = path.join(
  FRONTEND_DIR,
  "dist",
  "snip-frontend",
  "browser"
);

const PUSH = process.argv.includes("--push");

function run(command, args, cwd) {
  console.log(`\n$ ${command} ${args.join(" ")}  (in ${path.relative(ROOT, cwd) || "."})`);
  // Only use a shell for commands that need PATH-resolved .cmd shims on Windows
  // (npm/npx). Git resolves to a real .exe so it never needs the shell, and
  // shell:true on Windows re-tokenizes args, breaking multi-word args like
  // commit messages.
  const needsShell = process.platform === "win32" && (command === "npm" || command === "npx");
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: needsShell,
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`Command failed (exit ${result.status}): ${command} ${args.join(" ")}`);
  }
}

function runCapture(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (result.error) {
    throw result.error;
  }
  return { status: result.status, stdout: result.stdout || "", stderr: result.stderr || "" };
}

function hasStagedChanges(cwd) {
  // `git diff --cached --quiet` exits 0 when there is no staged diff, 1 when there is.
  const result = spawnSync("git", ["diff", "--cached", "--quiet"], {
    cwd,
    shell: process.platform === "win32",
  });
  return result.status === 1;
}

function rmrf(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

function step1_updateSubmodules() {
  console.log("\n=== Step 1: update backend/frontend/cli submodules to their branch tips ===");
  run("git", ["submodule", "update", "--init", "--remote", "backend", "frontend", "cli"], ROOT);
}

function step2_buildFrontend() {
  console.log("\n=== Step 2: build frontend ===");
  run("npm", ["install"], FRONTEND_DIR);
  run("npx", ["ng", "build"], FRONTEND_DIR);

  const indexHtml = path.join(FRONTEND_BROWSER_DIST, "index.html");
  if (!fs.existsSync(indexHtml)) {
    throw new Error(
      `Frontend build did not produce expected output: ${indexHtml} is missing`
    );
  }
  console.log(`Frontend build output verified at ${indexHtml}`);
}

function step3_assembleBundle() {
  console.log("\n=== Step 3: assemble bundle/ ===");

  // server.js and cli.js copied as-is.
  copyFile(path.join(BACKEND_DIR, "server.js"), path.join(BUNDLE_DIR, "server.js"));
  copyFile(path.join(CLI_DIR, "cli.js"), path.join(BUNDLE_DIR, "cli.js"));

  // Frontend build output -> bundle/public (replace wholesale each run).
  const publicDir = path.join(BUNDLE_DIR, "public");
  rmrf(publicDir);
  copyDir(FRONTEND_BROWSER_DIST, publicDir);

  // .env: Bun auto-loads this, switching server.js into also-serve-the-UI mode.
  fs.writeFileSync(path.join(BUNDLE_DIR, ".env"), "PUBLIC_DIR=./public\n");

  // package.json: no "type" field, so cli.js keeps running under plain node (CommonJS).
  const pkg = {
    name: "snip-bundle",
    version: "1.0.0",
    private: true,
    description: "Generated deployable bundle: backend + built frontend UI + CLI.",
    scripts: {
      start: "bun server.js",
    },
  };
  fs.writeFileSync(
    path.join(BUNDLE_DIR, "package.json"),
    JSON.stringify(pkg, null, 2) + "\n"
  );

  // Dockerfile
  const dockerfile = [
    "FROM oven/bun:1-alpine",
    "WORKDIR /app",
    "COPY . .",
    "ENV PORT=3000",
    "EXPOSE 3000",
    "CMD bun server.js",
    "",
  ].join("\n");
  fs.writeFileSync(path.join(BUNDLE_DIR, "Dockerfile"), dockerfile);

  // .dockerignore
  const dockerignore = [
    "node_modules",
    ".git",
    "*.log",
    "",
  ].join("\n");
  fs.writeFileSync(path.join(BUNDLE_DIR, ".dockerignore"), dockerignore);

  // railway.json: select the Dockerfile builder.
  const railwayConfig = {
    $schema: "https://railway.app/railway.schema.json",
    build: {
      builder: "DOCKERFILE",
      dockerfilePath: "Dockerfile",
    },
    deploy: {
      startCommand: "bun server.js",
    },
  };
  fs.writeFileSync(
    path.join(BUNDLE_DIR, "railway.json"),
    JSON.stringify(railwayConfig, null, 2) + "\n"
  );

  console.log(`Bundle assembled at ${BUNDLE_DIR}`);
}

function step4_commitBundle() {
  console.log("\n=== Step 4: commit inside bundle/ (no-op if nothing changed) ===");
  run("git", ["add", "-A"], BUNDLE_DIR);

  const committed = hasStagedChanges(BUNDLE_DIR);
  if (committed) {
    run("git", ["commit", "-m", "Regenerate bundle"], BUNDLE_DIR);
  } else {
    console.log("bundle/: nothing to commit.");
  }

  if (PUSH) {
    console.log("\nPushing bundle branch (HEAD:bundle, since the submodule checkout is detached)...");
    run("git", ["push", "origin", "HEAD:bundle"], BUNDLE_DIR);
  }

  return committed;
}

function step5_bumpSuperprojectPointer() {
  console.log("\n=== Step 5: bump submodule pointers in the superproject (no-op if nothing changed) ===");
  run("git", ["add", "backend", "frontend", "cli", "bundle"], ROOT);

  const committed = hasStagedChanges(ROOT);
  if (committed) {
    run("git", ["commit", "-m", "Bump backend/frontend/cli/bundle submodule pointers"], ROOT);
  } else {
    console.log("Superproject: nothing to commit.");
  }

  if (PUSH) {
    console.log("\nPushing main...");
    run("git", ["push", "origin", "HEAD:main"], ROOT);
  }

  return committed;
}

function main() {
  step1_updateSubmodules();
  step2_buildFrontend();
  step3_assembleBundle();
  const bundleCommitted = step4_commitBundle();
  const superprojectCommitted = step5_bumpSuperprojectPointer();

  console.log("\n=== Done ===");
  console.log(`bundle/ commit: ${bundleCommitted ? "created" : "no-op (nothing changed)"}`);
  console.log(`superproject commit: ${superprojectCommitted ? "created" : "no-op (nothing changed)"}`);
  if (!PUSH) {
    console.log("Ran without --push: nothing was pushed to origin.");
  }
}

main();
