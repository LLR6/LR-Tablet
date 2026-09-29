export function parseSemver(version) {
  const match = String(version).match(/^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/)
  if (!match) throw new Error(`unsupported semantic version: ${version}`)
  const [, majorText, minorText, patchText] = match
  const major = Number(majorText)
  const minor = Number(minorText)
  const patch = Number(patchText)
  if (minor >= 1000 || patch >= 1000) {
    throw new Error('minor and patch must be below 1000 for Android versionCode mapping')
  }
  return { major, minor, patch }
}

export function androidVersionCode(version) {
  const { major, minor, patch } = parseSemver(version)
  const code = major * 1_000_000 + minor * 1_000 + patch
  if (!Number.isSafeInteger(code) || code < 1 || code > 2_100_000_000) {
    throw new Error(`Android versionCode out of range for version ${version}`)
  }
  return code
}
