// Local server: serves the page and runs the same proxy as the Vercel function.
// Usage: node server.js   (Node 18 or newer, no packages needed)
const http = require("http");
const fs = require("fs");
const path = require("path");

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    let text;
    try { text = fs.readFileSync(path.join(__dirname, file), "utf8"); } catch (e) { continue; }
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
    }
  }
}
loadEnv();

const UPSTREAM = "https://apps.sarvam.ai/api/app-runtime/";
const PORT = process.env.PORT || 3000;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};
// Only these files are served, so .env files can never be downloaded.
const STATIC_FILES = new Set(["index.html", "styles.css", "config.js", "app.js"]);

function sendJson(res, status, obj) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(obj));
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (url.pathname === "/api/health") {
    return sendJson(res, 200, { ok: true, keyConfigured: Boolean(process.env.SARVAM_API_KEY) });
  }

  if (url.pathname.startsWith("/api/sarvam/")) {
    if (!process.env.SARVAM_API_KEY) {
      return sendJson(res, 500, { error: "SARVAM_API_KEY is not set on the server" });
    }
    const rest = url.pathname.slice("/api/sarvam/".length) + url.search;
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = chunks.length && !["GET", "HEAD"].includes(req.method) ? Buffer.concat(chunks) : undefined;
    try {
      const upstream = await fetch(UPSTREAM + rest, {
        method: req.method,
        headers: {
          "X-API-Key": process.env.SARVAM_API_KEY,
          "Content-Type": req.headers["content-type"] || "application/json",
        },
        body,
      });
      const buf = Buffer.from(await upstream.arrayBuffer());
      res.writeHead(upstream.status, {
        "Content-Type": upstream.headers.get("content-type") || "application/json",
      });
      return res.end(buf);
    } catch (e) {
      return sendJson(res, 502, { error: "Could not reach Sarvam" });
    }
  }

  const name = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  if (!STATIC_FILES.has(name)) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("Not found");
  }
  fs.readFile(path.join(__dirname, name), (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("Not found");
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(name)] || "text/plain" });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log("Test bench running at http://localhost:" + PORT);
  if (!process.env.SARVAM_API_KEY) console.log("Warning: SARVAM_API_KEY is not set. Add it to .env.local");
});
