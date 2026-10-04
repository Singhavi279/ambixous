import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const sourceDirectory = path.join(projectRoot, "pdfstudio")
const outputDirectory = path.join(projectRoot, "public", "pdfstudio")

fs.rmSync(outputDirectory, { recursive: true, force: true })
fs.mkdirSync(outputDirectory, { recursive: true })

for (const entry of ["index.html", "css", "js"]) {
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
fs.writeFileSync(indexPath, indexHtml)

const appPath = path.join(outputDirectory, "js", "app.js")
let appSource = fs.readFileSync(appPath, "utf8")
appSource = replaceRequired(
  appSource,
  "new Worker('js/wasm-worker.js')",
  "new Worker('/pdfstudio/js/wasm-worker.js')",
)
fs.writeFileSync(appPath, appSource)

console.log(`PDF Studio built in ${outputDirectory}`)

function replaceRequired(content, search, replacement) {
  if (!content.includes(search)) {
    throw new Error(`PDF Studio build input is missing: ${search}`)
  }

  return content.replace(search, replacement)
}
