import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { vendorFiles, vendorSource } from "./pdfstudio-vendor.mjs"

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const sourceDirectory = path.join(projectRoot, "pdfstudio")
const outputDirectory = path.join(projectRoot, "public", "pdfstudio")

fs.rmSync(outputDirectory, { recursive: true, force: true })
fs.mkdirSync(outputDirectory, { recursive: true })

for (const entry of ["index.html", "css", "js", "fonts"]) {
  fs.cpSync(path.join(sourceDirectory, entry), path.join(outputDirectory, entry), {
    recursive: true,
  })
}

const indexPath = path.join(outputDirectory, "index.html")
let indexHtml = fs.readFileSync(indexPath, "utf8")
indexHtml = replaceRequired(
  indexHtml,
  'href="css/styles.css"',
  'href="/pdfstudio/css/styles.css"',
)
indexHtml = replaceRequired(
  indexHtml,
  'src="js/app.js"',
  'src="/pdfstudio/js/app.js"',
)
indexHtml = indexHtml.replaceAll('src="vendor/', 'src="/pdfstudio/vendor/')
fs.writeFileSync(indexPath, indexHtml)

// Third-party libraries ship with the app instead of loading from a CDN.
for (const name of Object.keys(vendorFiles)) {
  fs.cpSync(vendorSource(name), path.join(outputDirectory, "vendor", name), { recursive: true })
}

// Service worker: give it the full file list and a content version so the whole app works offline after one visit.
const listFiles = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const full = path.join(directory, entry.name)
  return entry.isDirectory() ? listFiles(full) : [path.relative(outputDirectory, full).split(path.sep).join("/")]
})
// Precache only the app shell (about 3 MB raw). Fonts, CMaps and standard fonts load only when a document needs them;
// the worker caches those on use, so they still work offline afterwards without a 7 MB first-visit download.
const onDemand = /^(fonts|vendor\/cmaps|vendor\/standard_fonts)\//
const assets = ["index.html", ...listFiles(outputDirectory).filter(file => file !== "index.html" && file !== "sw.js" && !onDemand.test(file))]
const version = crypto.createHash("sha256")
for (const file of assets) version.update(file).update(fs.readFileSync(path.join(outputDirectory, file)))
let worker = fs.readFileSync(path.join(sourceDirectory, "sw.js"), "utf8")
worker = replaceRequired(worker, "const ASSETS = /* build */ [];", `const ASSETS = ${JSON.stringify(assets)};`)
worker = replaceRequired(worker, "'__VERSION__'", `'${version.digest("hex").slice(0, 12)}'`)
fs.writeFileSync(path.join(outputDirectory, "sw.js"), worker)

console.log(`PDF Studio built in ${outputDirectory}`)

function replaceRequired(content, search, replacement) {
  if (!content.includes(search)) {
    throw new Error(`PDF Studio build input is missing: ${search}`)
  }

  return content.replace(search, replacement)
}

// ---- Invoxa (invoicing app at /invoxa): copy its static files, pointing links at the sub-path ----
const invoxaSource = path.join(projectRoot, "invoxa", "public")
const invoxaOutput = path.join(projectRoot, "public", "invoxa")

fs.rmSync(invoxaOutput, { recursive: true, force: true })
fs.cpSync(invoxaSource, invoxaOutput, { recursive: true })

const invoxaIndex = path.join(invoxaOutput, "index.html")
let invoxaHtml = fs.readFileSync(invoxaIndex, "utf8")
invoxaHtml = replaceRequired(invoxaHtml, 'href="style.css"', 'href="/invoxa/style.css"')
invoxaHtml = replaceRequired(invoxaHtml, 'src="app.js"', 'src="/invoxa/app.js"')
fs.writeFileSync(invoxaIndex, invoxaHtml)

console.log(`Invoxa built in ${invoxaOutput}`)
