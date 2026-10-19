// The third-party files PDF Studio loads in the browser, and where they come from.
// Shared by the production build (copies them into public/) and the dev server (serves them),
// so the two can never drift apart.
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const modules = path.join(root, "node_modules")

// served path under /vendor/  ->  file or directory inside node_modules
export const vendorFiles = {
  "pdf.min.mjs": "pdfjs-dist/legacy/build/pdf.min.mjs",
  "pdf.worker.min.mjs": "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
  "pdf-lib.min.js": "@cantoo/pdf-lib/dist/pdf-lib.min.js",
  "fontkit.umd.min.js": "@cantoo/fontkit/dist/fontkit.umd.min.js",
  standard_fonts: "pdfjs-dist/standard_fonts",
  cmaps: "pdfjs-dist/cmaps",
}

export const vendorSource = name => path.join(modules, vendorFiles[name])
export { root }
