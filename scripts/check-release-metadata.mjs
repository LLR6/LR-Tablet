import { readFileSync } from 'node:fs'

function read(path) {
  return readFileSync(path, 'utf8')
}

const pkg = JSON.parse(read('package.json'))
const version = pkg.version

const citation = read('CITATION.cff')
const citationMatch = citation.match(/^version:\s*["']?([^"'\n]+)["']?\s*$/m)
if (!citationMatch) {
  console.error('ERROR: CITATION.cff has no version')
  process.exit(2)
}
const citationVersion = citationMatch[1].trim()

const changelog = read('CHANGELOG.md')
const escaped = version.replace(/[.*+?^$()|[\]\\{}]/g, '\\$&')
const releaseHeading = new RegExp('^##\\s+' + escaped + '(?:\\s+-|\\s*$)', 'm')

const errors = []
if (citationVersion !== version) {
  errors.push('CITATION.cff version ' + citationVersion + ' != package.json version ' + version)
}
if (!releaseHeading.test(changelog)) {
  errors.push('CHANGELOG.md has no release heading for ' + version)
}

if (errors.length) {
  for (const error of errors) console.error('ERROR: ' + error)
  process.exit(2)
}

console.log('release metadata consistent: ' + version)
