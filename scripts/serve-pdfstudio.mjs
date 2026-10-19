// Local dev server for PDF Studio: serves pdfstudio/ and maps /vendor/ to node_modules.
//   npm run pdfstudio          ->  http://127.0.0.1:4173
import fs from "node:fs"
import http from "node:http"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { root, vendorFiles, vendorSource } from "./pdfstudio-vendor.mjs"

const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".ttf": "font/ttf", ".woff2": "font/woff2", ".bcmap": "application/octet-stream",
  ".pfb": "application/octet-stream", ".txt": "text/plain; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png",
}

function resolve(urlPath) {
  const clean = path.posix.normalize(decodeURIComponent(urlPath.split("?")[0]))
  if (clean.startsWith("/vendor/")) {
    const [name, ...rest] = clean.slice("/vendor/".length).split("/")
    if (!(name in vendorFiles)) return null
    const base = vendorSource(name)
    const target = rest.length ? path.join(base, ...rest) : base
    return target.startsWith(base) ? target : null
  }
  const site = path.join(root, "pdfstudio")
  const target = path.join(site, clean === "/" ? "index.html" : clean)
  return target.startsWith(site) ? target : null
}

export function createServer() {
  return http.createServer((request, response) => {
    const file = resolve(request.url || "/")
    if (!file || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      response.statusCode = 404
      return response.end("Not found")
    }
    response.setHeader("content-type", types[path.extname(file)] || "application/octet-stream")
    response.setHeader("cache-control", "no-store")
    fs.createReadStream(file).pipe(response)
  })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 4173
  createServer().listen(port, process.env.HOST || "127.0.0.1", () => console.log(`PDF Studio dev server: http://127.0.0.1:${port}`))
}
