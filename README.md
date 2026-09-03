# snip-backend

The backend of **Snip** — a tiny URL shortener. A single-file [Bun](https://bun.sh)
server (`server.js`) with **zero npm dependencies**, storing links in an in-memory
`Map` (restarts clear all links, by design).

## API

| Method | Path | Body | Response |
|--------|------|------|----------|
| `POST` | `/api/links` | `{ "url": "https://…" }` | `201` `{ code, url, shortUrl, hits, createdAt }` · `400` on invalid JSON/URL |
| `GET`  | `/api/links` | — | `200` array of all links |
| `GET`  | `/:code` | — | `302` to the original URL (+1 hit) · `404` if unknown |

- Codes are 6 random base62 characters.
- `hits` starts at `0`; `createdAt` is an ISO timestamp.
- Open CORS with `OPTIONS` preflight support, so a browser app on another origin
  can call this API.

## Configuration (env vars)

| Var | Default | Purpose |
|-----|---------|---------|
| `PORT` | `3000` | Port the server listens on |
| `BASE_URL` | falls back to `https://$RAILWAY_PUBLIC_DOMAIN`, else `http://localhost:$PORT` | Origin used to build `shortUrl` values |
| `PUBLIC_DIR` | *(unset)* | When set, also serves static files from this folder (`/` → `index.html`). An existing file wins over a same-named short code. |

## Run it

```bash
bun start
```

## Try it

```bash
curl -X POST localhost:3000/api/links -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'

curl localhost:3000/api/links

curl -i localhost:3000/<code>
```
