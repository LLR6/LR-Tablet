import fs from 'node:fs'
import path from 'node:path'

const stringsPath = path.resolve('android/app/src/main/res/values/strings.xml')
const gradlePath = path.resolve('android/app/build.gradle')
const resPath = path.resolve('android/app/src/main/res')

let strings = fs.readFileSync(stringsPath, 'utf8')
strings = strings.replace(/<string name="app_name">[\s\S]*?<\/string>/, '<string name="app_name">LR 拼豆</string>')
strings = strings.replace(/<string name="title_activity_main">[\s\S]*?<\/string>/, '<string name="title_activity_main">LR 拼豆</string>')
fs.writeFileSync(stringsPath, strings)

let gradle = fs.readFileSync(gradlePath, 'utf8')
gradle = gradle.replace(/versionCode\s+\d+/, 'versionCode 1')
gradle = gradle.replace(/versionName\s+"[^"]+"/, 'versionName "1.0.0"')
fs.writeFileSync(gradlePath, gradle)

const densities = ['mdpi','hdpi','xhdpi','xxhdpi','xxxhdpi']
for (const density of densities) {
  const source = path.resolve(`android-icons/mipmap-${density}/ic_launcher.png`)
  const targetDir = path.join(resPath, `mipmap-${density}`)
  if (!fs.existsSync(source)) continue
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
if (fs.existsSync(splashSource)) {
  const splashTargetDir = path.join(resPath, 'drawable')
  fs.mkdirSync(splashTargetDir, { recursive: true })
  fs.copyFileSync(splashSource, path.join(splashTargetDir, 'splash.png'))
}

console.log('LR Pindou Android app name and version configured.')
