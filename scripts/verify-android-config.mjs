import fs from 'node:fs'
import path from 'node:path'
import { androidVersionCode } from './android-version.mjs'

const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'))
const expectedVersion = pkg.version
const expectedCode = androidVersionCode(expectedVersion)

const gradle = fs.readFileSync(path.resolve('android/app/build.gradle'), 'utf8')
const manifest = fs.readFileSync(path.resolve('android/app/src/main/AndroidManifest.xml'), 'utf8')
const strings = fs.readFileSync(path.resolve('android/app/src/main/res/values/strings.xml'), 'utf8')

const failures = []

if (!gradle.includes('versionName "' + expectedVersion + '"')) {
  failures.push('Gradle versionName does not match package.json (' + expectedVersion + ')')
}
if (!new RegExp('versionCode\\s+' + expectedCode + '\\b').test(gradle)) {
  failures.push('Gradle versionCode does not match derived code (' + expectedCode + ')')
}
if (!/android:screenOrientation="sensorLandscape"/.test(manifest)) {
  failures.push('MainActivity is not configured for sensorLandscape')
}
if (!strings.includes('<string name="app_name">LR-考研英语真题特训（独家私人版）</string>')) {
  failures.push('Android app_name was not configured')
}

if (failures.length) {
  for (const failure of failures) console.error('ERROR: ' + failure)
  process.exit(2)
}

console.log('Android configuration verified: versionName=' + expectedVersion + ', versionCode=' + expectedCode)
