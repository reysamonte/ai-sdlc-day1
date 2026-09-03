# Snip repo rules

Keep CLAUDE.md and .github/copilot-instructions.md in sync.

- Repo shape: this is a git superproject with one branch per layer. `main` tracks the submodule pointers for `backend`, `frontend`, `cli`, and `bundle`; the real code lives in the layer branches, not here.
- Layout / stack:
  - `main`: aggregator/composition root
  - `backend`: Bun server, zero npm deps, in-memory `Map` storage
  - `frontend`: Angular 19 standalone app
  - `cli`: Node CLI (`snip add/ls/open`), CommonJS
  - `bundle`: generated deployable artifact built from backend + frontend dist + CLI
- API contract: `POST /api/links`, `GET /api/links`, `GET /:code`. Change it everywhere or nowhere: backend, frontend, and CLI must stay in sync.
- Key commands:
  - `node scripts/build-bundle.mjs`
  - `node scripts/build-bundle.mjs --push`
  - `backend`: `bun run server.js` (or `PORT=3000 bun run server.js`)
  - `frontend`: `npm install` then `npx ng build` / `npx ng serve`
  - `cli`: `node cli.js ls`, `node cli.js add https://example.com`, `node cli.js open <code>`
- Edit -> push -> pointer-bump workflow:
  1. Edit inside the relevant layer branch/submodule.
  2. Commit and push that layer.
  3. Back on `main`, run `git submodule update --remote <layer>` and `git add <layer>`; then commit/push the pointer bump.
- Do / Don’t:
  - `bundle/` is generated output; never hand-edit it or patch generated files directly.
  - `cli.js` stays CommonJS; do not add `"type": "module"` near it or convert it to ESM.
  - The Angular build output path `frontend/dist/snip-frontend/browser` is load-bearing; bundle assembly depends on it exactly.
  - Storage is intentionally in-memory by design; restarts clear the link map.
  - `bundle.yml` is schedule-only by design; do not add a push trigger to it.
  - The Docker workflow watches the `bundle` GITLINK on `main`, not individual files in `bundle/`; a pointer bump is the trigger.
