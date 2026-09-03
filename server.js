// Snip backend — a tiny URL shortener API server.
// Single-file Bun server, zero npm dependencies. Links live in an in-memory Map,
// so a restart clears all data by design.

const links = new Map(); // code -> { code, url, shortUrl, hits, createdAt }

const PORT = Number(process.env.PORT) || 3000;
const BASE_URL =
  process.env.BASE_URL ||
  (process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : `http://localhost:${PORT}`);
const PUBLIC_DIR = process.env.PUBLIC_DIR || "";

const BASE62 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function randomCode(length = 6) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += BASE62[Math.floor(Math.random() * BASE62.length)];
  }
  return code;
}

function generateUniqueCode() {
  let code;
  do {
    code = randomCode();
  } while (links.has(code));
  return code;
}

function isValidHttpUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

async function serveStatic(pathname) {
  if (!PUBLIC_DIR) return null;

  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  // Prevent path traversal outside of PUBLIC_DIR.
  const safePath = requestedPath.replace(/^\/+/, "").replace(/\.\.(\/|\\)/g, "");
  const filePath = `${PUBLIC_DIR}/${safePath}`;

  const file = Bun.file(filePath);
  if (await file.exists()) {
    return new Response(file, { headers: { ...CORS_HEADERS } });
  }
  return null;
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const { pathname } = url;
    const method = req.method;

    // CORS preflight
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // POST /api/links
    if (method === "POST" && pathname === "/api/links") {
      let body;
      try {
        body = await req.json();
      } catch {
        return jsonResponse({ error: "Invalid JSON body" }, 400);
      }

      if (!body || !isValidHttpUrl(body.url)) {
        return jsonResponse(
          { error: "Body must include a valid http(s) url" },
          400
        );
      }

      const code = generateUniqueCode();
      const link = {
        code,
        url: body.url,
        shortUrl: `${BASE_URL}/${code}`,
        hits: 0,
        createdAt: new Date().toISOString(),
      };
      links.set(code, link);

      return jsonResponse(link, 201);
    }

    // GET /api/links
    if (method === "GET" && pathname === "/api/links") {
      return jsonResponse(Array.from(links.values()), 200);
    }

    // GET /:code — an existing static file wins over a same-named short code.
    if (method === "GET" && pathname !== "/") {
      const staticResponse = await serveStatic(pathname);
      if (staticResponse) return staticResponse;

      const code = pathname.slice(1);
      const link = links.get(code);
      if (link) {
        link.hits += 1;
        return new Response(null, {
          status: 302,
          headers: { Location: link.url, ...CORS_HEADERS },
        });
      }

      return jsonResponse({ error: "Short code not found" }, 404);
    }

    // GET "/" — serve index.html from PUBLIC_DIR if configured.
    if (method === "GET" && pathname === "/") {
      const staticResponse = await serveStatic(pathname);
      if (staticResponse) return staticResponse;
      return jsonResponse({ error: "Not found" }, 404);
    }

    return jsonResponse({ error: "Not found" }, 404);
  },
});

console.log(`Snip backend listening on http://localhost:${server.port}`);
console.log(`Short links will use base URL: ${BASE_URL}`);
if (PUBLIC_DIR) console.log(`Serving static files from: ${PUBLIC_DIR}`);
