# LR-考研英语真题特训（独家私人版）

为荣耀平板 9 Pro / Android / MagicOS 横屏触控设计的考研英语阅读理解专用应用。

## 首版功能

- 横屏左右双栏：左侧文章与批注，右侧题目、选项和作答；
- 内置 2025 英语一、英语二共 4 篇阅读、20 道题与逐题解析；
- 限时训练、暂停、断点保存、交卷判分、阅读得分力测评；
- 题型正确率、首练/反复练比例、日/周/月学习统计；
- 学习完成量、每日/每周计划与连续训练天数；
- 做题心结、题目思路笔记、文章三色高亮与批注；
- PDF、DOCX、TXT、JSON、ZIP 导入，以及答案表补录；
- 全量本地备份与恢复；
- 本机离线保存，不上传试题和学习记录。

## 导入说明

普通 PDF / DOCX / TXT 会先提取文字，再尝试识别 `Text 1`～`Text 4` 和每篇 5 道选择题。扫描版 PDF 若没有文本层，需要先 OCR。识别后可用 `21C 22A 23B ...` 的格式补充答案。

完整 JSON 可直接包含解析：

```json
{
  "title": "2025 英语一 · Text 1",
  "year": 2025,
  "paper": "英语一",
  "passage": "Article text...",
  "questions": [
    {
      "number": 21,
      "prompt": "Question...",
      "options": {"A":"...","B":"...","C":"...","D":"..."},
      "answer": "C",
      "type": "细节题",
      "explanation": "解析...",
      "evidence": "定位句...",
      "trap": "错误选项陷阱..."
    }
  ]
}
```

## 构建 APK

GitHub Actions 工作流使用 Node.js 22、Java 21、Capacitor 7 和 Android SDK 构建。工作流产物名为 `LR-English-Reading-APK`，其中 `LR-KaoYan-English-v1.0.apk` 可直接安装到平板。

本地调试：

```bash
npm install
npm run dev
```

本地 Android 构建：

```bash
npm install
npm run build
npx cap add android
npx cap sync android
node scripts/configure-android.mjs
cd android && ./gradlew assembleDebug
```
