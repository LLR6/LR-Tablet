# LR Tablet

为荣耀平板 9 Pro / Android / MagicOS 设计的横屏触控学习工作台。与 Windows 端统一使用 `LR` 品牌。

## 功能

- 视频智能换页、稳定画面选择、重复页过滤；
- 截图分析频率和换页阈值可调；
- 可选彩色笔迹处理和中英文 OCR；
- Word、PDF、ZIP 导出，刷新后自动释放临时截图；
- 学习计划、每日打卡和连续天数；
- 本地单词导入与间隔复习；
- 英语阅读左右分栏作答、计时、判分；
- 触控思维导图和 SVG 导出；
- 本地 PDF 查看、网盘一键跳转；
- PWA 离线安装；
- `LR数据_*.json` 与 Windows 端双向导入导出。

## 在荣耀平板上安装 PWA

1. 将 `dist` 部署到任意 HTTPS 静态站点，例如 GitHub Pages。
2. 用荣耀浏览器、Chrome 或 Edge 打开地址。
3. 浏览器菜单选择“添加到主屏幕”或“安装应用”。
4. 安装完成后会出现独立的 LR 图标，可全屏启动。

PWA 的计划、单词、阅读和思维导图可离线使用。中英文 OCR 首次加载语言模型时需要联网。

## 构建 PWA

在 Windows 双击 `Build_PWA.bat`，或运行：

```bash
npm install
npm run build
```

输出目录为 `dist`。

## 构建 Android APK

工程已经包含 Capacitor 配置和 GitHub Actions 工作流。把本目录作为 GitHub 仓库后，手动运行 `Build LR Tablet APK`，完成后下载 `LR-Tablet-Android` 构建产物，其中的 `app-debug.apk` 可安装到荣耀平板。

本地使用 Android Studio 时：

```bash
npm install
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

然后在 Android Studio 选择 Build APK。

## 阅读 JSON 格式

```json
{
  "title": "2025 英语阅读 Text 1",
  "passage": "Article text...",
  "questions": [
    {
      "number": 21,
      "question": "What does the author suggest?",
      "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
      "answer": "B"
    }
  ]
}
```

## 隐私

课程视频、取帧、计划、单词和阅读记录都在平板本机处理。应用不上传视频，不保存网盘密码。

