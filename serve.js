// pal — serve.js
// Minimal zero-dependency static server for local development.
// Usage: node serve.js [port]   (default port: 8000)

const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.argv[2]) || 8000;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".md": "text/markdown; charset=utf-8",
};

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    let filePath = path.normalize(path.join(root, urlPath));

    // path traversal guard
    if (!filePath.startsWith(root + path.sep) && filePath !== path.join(root, "index.html")) {
      res.writeHead(403);
      res.end();
      return;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 not found");
        return;
      }
      res.writeHead(200, {
        "Content-Type":
          types[path.extname(filePath).toLowerCase()] ||
          "application/octet-stream",
      });
      res.end(data);
    });
  })
  .listen(port, () => {
    console.log(`pal running at http://localhost:${port}`);
  });
