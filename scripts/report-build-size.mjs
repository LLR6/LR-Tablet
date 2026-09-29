import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = 'dist'
const files = []

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    const stat = statSync(path)
    if (stat.isDirectory()) walk(path)
    else files.push({ path: relative(root, path).replaceAll('\\', '/'), bytes: stat.size })
  }
}

walk(root)
files.sort((a, b) => b.bytes - a.bytes)
const total = files.reduce((sum, x) => sum + x.bytes, 0)
const report = {
  schema: 'lr-tablet-build-size/v1',
  totalBytes: total,
  fileCount: files.length,
  largestFiles: files.slice(0, 20),
  note: 'Non-gating build-size report. Compare trends across similar builds.'
}
writeFileSync('build-size.json', JSON.stringify(report, null, 2) + '\n')
console.log(`dist: ${total} bytes across ${files.length} files`)
for (const file of report.largestFiles.slice(0, 10)) {
  console.log(`${file.bytes}\t${file.path}`)
}
