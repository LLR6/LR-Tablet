import fs from 'node:fs'
import path from 'node:path'

const manifestPath = path.resolve('android/app/src/main/AndroidManifest.xml')
const stringsPath = path.resolve('android/app/src/main/res/values/strings.xml')
const gradlePath = path.resolve('android/app/build.gradle')
const resPath = path.resolve('android/app/src/main/res')

let manifest = fs.readFileSync(manifestPath, 'utf8')
manifest = manifest.replace(
  /(<activity\b[^>]*\bandroid:name="\.MainActivity"[^>]*)(>)/,
  (full, head, end) => head.includes('android:screenOrientation=')
    ? full
    : `${head}\n            android:screenOrientation="sensorLandscape"${end}`
)
fs.writeFileSync(manifestPath, manifest)

let strings = fs.readFileSync(stringsPath, 'utf8')
strings = strings.replace(/<string name="app_name">[\s\S]*?<\/string>/, '<string name="app_name">LR-考研英语真题特训（独家私人版）</string>')
strings = strings.replace(/<string name="title_activity_main">[\s\S]*?<\/string>/, '<string name="title_activity_main">LR-考研英语真题特训（独家私人版）</string>')
fs.writeFileSync(stringsPath, strings)

let gradle = fs.readFileSync(gradlePath, 'utf8')
gradle = gradle.replace(/versionCode\s+\d+/, 'versionCode 1')
gradle = gradle.replace(/versionName\s+"[^"]+"/, 'versionName "1.0.0"')
fs.writeFileSync(gradlePath, gradle)

const densities = ['mdpi','hdpi','xhdpi','xxhdpi','xxxhdpi']
for (const density of densities) {
  const source = path.resolve(`android-icons/mipmap-${density}/ic_launcher.png`)
  const targetDir = path.join(resPath, `mipmap-${density}`)
  fs.mkdirSync(targetDir, { recursive: true })
  fs.copyFileSync(source, path.join(targetDir, 'ic_launcher.png'))
  fs.copyFileSync(source, path.join(targetDir, 'ic_launcher_round.png'))
}

for (const folder of ['mipmap-anydpi-v26','mipmap-anydpi']) {
  const dir = path.join(resPath, folder)
  if (!fs.existsSync(dir)) continue
  for (const name of ['ic_launcher.xml','ic_launcher_round.xml']) {
    const file = path.join(dir, name)
    if (fs.existsSync(file)) fs.unlinkSync(file)
  }
}

const splashSource = path.resolve('assets/splash.png')
const splashTargetDir = path.join(resPath, 'drawable')
fs.mkdirSync(splashTargetDir, { recursive: true })
for (const entry of fs.readdirSync(resPath, { withFileTypes: true })) {
  if (!entry.isDirectory() || !entry.name.startsWith('drawable-')) continue
  const qualifiedSplash = path.join(resPath, entry.name, 'splash.png')
  if (fs.existsSync(qualifiedSplash)) fs.unlinkSync(qualifiedSplash)
}
fs.copyFileSync(splashSource, path.join(splashTargetDir, 'splash.png'))

console.log('Android name, version and tablet landscape orientation configured.')
