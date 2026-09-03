# Snip

Snip is a tiny URL shortener built as **one backend with two clients**: a web
frontend and a CLI, both talking to the same HTTP API. Each layer lives on its
own branch of this repository and is mounted here as a git submodule, so this
`main` branch is purely an aggregator/composition root.

## Layout: branch-per-layer + submodules

| Branch     | Path         | What it is                                              |
| ---------- | ------------ | -------------------------------------------------------- |
| `backend`  | [backend/](./backend)  | Zero-dependency Bun server, in-memory Map storage        |
| `frontend` | [frontend/](./frontend) | Angular 19 standalone app (dark, Lovable-inspired UI)     |
| `cli`      | [cli/](./cli)      | Zero-dependency Node CLI (`snip add/ls/open`)             |
| `main`     | *(this branch)* | Aggregator: submodule pointers + this README         |

Each submodule is this same GitHub repo, checked out on its own branch
(`git submodule add -b <branch> <REPO_URL> <path>`), so `backend/`, `frontend/`,
and `cli/` are independent working trees with their own commit history, while
`main` just records which commit of each branch is currently "mounted".

## API contract

Base URL defaults to `http://localhost:3000` (backend `PORT`); the CLI and
frontend both point at it (`SNIP_API` env var for the CLI, hardcoded base URL
for the frontend during local dev).

| Method | Path          | Body                  | Success                                                   | Errors                          |
| ------ | ------------- | ---------------------- | ---------------------------------------------------------- | ---------------------------------- |
| POST   | `/api/links`  | `{ "url": "https://…" }` | `201 { code, url, shortUrl, hits, createdAt }`             | `400` invalid JSON / non-http(s) URL |
| GET    | `/api/links`  | —                       | `200` array of the same link objects                       | —                                   |
| GET    | `/:code`      | —                       | `302` redirect to the original URL, increments `hits`      | `404` unknown code                  |

CORS is wide open (`*`) with `OPTIONS` preflight support, so the frontend can
call the backend from a different origin during development.

## Cloning

Because the layers are submodules, a plain `git clone` leaves `backend/`,
`frontend/`, and `cli/` as **empty folders** (the superproject only stores a
commit pointer, not the files). Clone with `--recurse-submodules` to pull
everything in one step:

```sh
git clone --recurse-submodules <REPO_URL>
```

If you already have a plain clone, populate the submodules after the fact:

```sh
git submodule update --init --recursive
```

## Running all three pieces

**1. Backend** (from `backend/`):

```sh
bun run server.js
# or: PORT=3000 bun run server.js
```

**2. Frontend** (from `frontend/`):

```sh
npm install
npx ng serve
```

The frontend calls the backend at `http://localhost:3000` — make sure the
backend is running first.

**3. CLI** (from `cli/`):

```sh
node cli.js ls
node cli.js add https://example.com
node cli.js open <code>
# or set a custom backend:
SNIP_API=http://localhost:3000 node cli.js ls
```

## Update workflow

Submodule folders are independent git checkouts of their branch. To ship a
change:

1. **Inside the submodule folder**, commit and push as normal:

   ```sh
   cd backend
   git add -A
   git commit -m "Some backend change"
   git push
   ```

2. **Back in the superproject** (`main`), point the submodule at the new
   commit and record it:

   ```sh
   git submodule update --remote backend   # fast-forward the submodule to the branch tip
   git add backend                          # stage the updated pointer
   git commit -m "Bump backend submodule"
   git push
   ```

Repeat step 2 for `frontend` or `cli` as needed. The superproject commit only
ever changes by a single line per submodule (the pointer/SHA it tracks) — the
actual code changes live in the submodule's own branch history.
