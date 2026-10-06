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
