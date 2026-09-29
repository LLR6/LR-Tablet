import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const citation = readFileSync('CITATION.cff', 'utf8')
const changelog = readFileSync('CHANGELOG.md', 'utf8')

const citationMatch = citation.match(/^version:\s*"?([^"\n]+)"?\s*$/m)
if (!citationMatch) throw new Error('CITATION.cff has no version')
const citationVersion = citationMatch[1].trim()

const releaseMatch = changelog.match(/^##\s+(\d+\.\d+\.\d+)\b/m)
if (!releaseMatch) throw new Error('CHANGELOG.md has no released semantic version')
const changelogVersion = releaseMatch[1]

if (pkg.version !== citationVersion) {
  throw new Error(`version mismatch: package.json=${pkg.version} citation=${citationVersion}`)
}
if (pkg.version !== changelogVersion) {
  throw new Error(`version mismatch: package.json=${pkg.version} changelog=${changelogVersion}`)
}

console.log(`release metadata consistent: ${pkg.version}`)
