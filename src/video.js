import JSZip from 'jszip'
import { jsPDF } from 'jspdf'
import { AlignmentType, Document, HeadingLevel, ImageRun, Packer, Paragraph } from 'docx'

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

function seek(video, time) {
  return new Promise((resolve, reject) => {
    const done = () => { cleanup(); resolve() }
    const fail = () => { cleanup(); reject(new Error('视频定位失败')) }
    const cleanup = () => {
      video.removeEventListener('seeked', done)
      video.removeEventListener('error', fail)
    }
    video.addEventListener('seeked', done, { once: true })
    video.addEventListener('error', fail, { once: true })
    video.currentTime = Math.max(0, Math.min(time, Math.max(0, video.duration - 0.05)))
  })
}

function loadVideo(file, video) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    video.src = url
    video.preload = 'auto'
    video.muted = true
    video.playsInline = true
    video.onloadedmetadata = () => resolve(url)
    video.onerror = () => reject(new Error('平板浏览器无法读取这个视频格式，建议使用 MP4/H.264'))
  })
}

function frameMetrics(data) {
  const pixels = data.data
  const count = pixels.length / 4
  const gray = new Uint8Array(count)
  const color = new Uint8Array(count * 3)
  let colored = 0
  let sharp = 0
  const width = data.width
  for (let i = 0, p = 0; i < pixels.length; i += 4, p++) {
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2]
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    const saturated = max - min > 85 && max > 70 && max < 250
    if (saturated) colored++
    const value = saturated ? 255 : Math.round(r * .299 + g * .587 + b * .114)
    gray[p] = value
    color[p * 3] = r
    color[p * 3 + 1] = g
    color[p * 3 + 2] = b
    if (p > width && p % width) sharp += Math.abs(value - gray[p - 1]) + Math.abs(value - gray[p - width])
  }
  return { gray, color, colorInk: colored / count, sharpness: sharp / count }
}

function arrayDiff(a, b, stride = 1) {
  let total = 0
  const length = Math.min(a.length, b.length)
  for (let i = 0; i < length; i += stride) total += Math.abs(a[i] - b[i])
  return total / Math.ceil(length / stride)
}

function visualDiff(a, b) {
  const gray = arrayDiff(a.gray, b.gray, 2)
  const color = arrayDiff(a.color, b.color, 6)
  return Math.max(gray, color * .68)
}

function splitSegments(samples, threshold) {
  if (!samples.length) return []
  const segments = []
  let current = [samples[0]]
  let representative = samples[0]
  let pending = []
  for (const sample of samples.slice(1)) {
    if (visualDiff(sample, representative) <= threshold) {
      if (pending.length) current.push(...pending.splice(0))
      current.push(sample)
      if (current.length % 7 === 0) representative = current[current.length - 1]
      continue
    }
    pending.push(sample)
    if (pending.length >= 2 && visualDiff(pending[pending.length - 1], pending[pending.length - 2]) <= threshold * .72) {
      segments.push(current)
      current = pending.splice(0)
      representative = current[current.length - 1]
    }
  }
  current.push(...pending)
  if (current.length) segments.push(current)
  return segments
}

function chooseFrame(segment) {
  const candidates = segment.length > 2 ? segment.slice(1) : segment
  const minColor = Math.min(...candidates.map(x => x.colorInk))
  const clean = candidates.filter(x => x.colorInk <= minColor + Math.max(.002, minColor * .12))
  return clean.sort((a, b) => (b.sharpness + b.time * .0001) - (a.sharpness + a.time * .0001))[0]
}

function removeColoredInk(imageData) {
  const p = imageData.data
  for (let i = 0; i < p.length; i += 4) {
    const max = Math.max(p[i], p[i + 1], p[i + 2])
    const min = Math.min(p[i], p[i + 1], p[i + 2])
    if (max - min > 95 && max > 55 && max < 245) p[i] = p[i + 1] = p[i + 2] = 255
  }
  return imageData
}

async function canvasBlob(canvas, type = 'image/jpeg', quality = .9) {
  return new Promise(resolve => canvas.toBlob(resolve, type, quality))
}

export async function analyzeVideo(file, options, hooks = {}) {
  const video = hooks.video || document.createElement('video')
  const url = await loadVideo(file, video)
  const analysis = document.createElement('canvas')
  analysis.width = 320
  analysis.height = 180
  const ctx = analysis.getContext('2d', { willReadFrequently: true })
  const interval = Math.max(.25, Number(options.interval || 1))
  const duration = video.duration
  const samples = []
  const total = Math.max(1, Math.ceil(duration / interval))
  hooks.log?.(`视频时长 ${Math.round(duration)} 秒，按 ${interval} 秒分析一次画面。`)

  for (let index = 0, time = .08; time < duration; index++, time += interval) {
    await seek(video, time)
    ctx.drawImage(video, 0, 0, analysis.width, analysis.height)
    const metrics = frameMetrics(ctx.getImageData(0, 0, analysis.width, analysis.height))
    samples.push({ time, ...metrics })
    hooks.progress?.((index + 1) / total * .55, `分析画面 ${index + 1}/${total}`)
    if (index % 10 === 0) await sleep(0)
  }

  const segments = splitSegments(samples, Number(options.threshold || 12))
  const selected = segments.filter(Boolean).map(chooseFrame)
  hooks.log?.(`智能检测到 ${selected.length} 页稳定课件。`)
  const maxWidth = Math.min(1920, video.videoWidth)
  const scale = maxWidth / video.videoWidth
  const output = document.createElement('canvas')
  output.width = Math.round(video.videoWidth * scale)
  output.height = Math.round(video.videoHeight * scale)
  const outCtx = output.getContext('2d', { willReadFrequently: true })
  const pages = []

  for (let i = 0; i < selected.length; i++) {
    await seek(video, selected[i].time)
    outCtx.drawImage(video, 0, 0, output.width, output.height)
    if (options.removeColor) {
      const image = removeColoredInk(outCtx.getImageData(0, 0, output.width, output.height))
      outCtx.putImageData(image, 0, 0)
    }
    const blob = await canvasBlob(output)
    pages.push({ number: i + 1, time: selected[i].time, blob, text: '' })
    hooks.page?.(pages[pages.length - 1])
    hooks.progress?.(.55 + (i + 1) / selected.length * .2, `提取课件 ${i + 1}/${selected.length}`)
  }
  URL.revokeObjectURL(url)
  return pages
}

export async function ocrPages(pages, hooks = {}) {
  if (!pages.length) return pages
  const { createWorker } = await import('tesseract.js')
  hooks.log?.('正在初始化中英文 OCR；首次使用会下载语言模型。')
  const worker = await createWorker('chi_sim+eng', 1, { logger: m => {
    if (m.status === 'recognizing text') hooks.progress?.(.75 + (m.progress || 0) * .2, '正在 OCR')
  } })
  try {
    for (let i = 0; i < pages.length; i++) {
      const result = await worker.recognize(pages[i].blob)
      pages[i].text = result.data.text.trim()
      hooks.log?.(`OCR 第 ${i + 1}/${pages.length} 页完成。`)
    }
  } finally {
    await worker.terminate()
  }
  return pages
}

async function makeWord(title, pages, includeImages = true) {
  const children = [new Paragraph({ text: title, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER })]
  for (const page of pages) {
    children.push(new Paragraph({ text: `第 ${page.number} 页 · ${formatTime(page.time)}`, heading: HeadingLevel.HEADING_2 }))
    if (page.text) for (const line of page.text.split(/\n+/).filter(Boolean)) children.push(new Paragraph(line))
    if (includeImages) {
      const data = new Uint8Array(await page.blob.arrayBuffer())
      children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data, transformation: { width: 620, height: 349 }, type: 'jpg' })] }))
    }
  }
  return Packer.toBlob(new Document({ creator: 'LR', title, sections: [{ children }] }))
}

async function makePdf(title, pages, includeImages = true) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  for (let i = 0; i < pages.length; i++) {
    if (i) pdf.addPage()
    pdf.setFontSize(15)
    pdf.text(`${title}  ${i + 1}/${pages.length}`, 15, 14)
    pdf.setFontSize(9)
    pdf.text(formatTime(pages[i].time), 190, 14, { align: 'right' })
    if (includeImages) {
      const url = await blobDataUrl(pages[i].blob)
      pdf.addImage(url, 'JPEG', 12, 22, 186, 104.6, undefined, 'FAST')
    }
    if (pages[i].text) {
      pdf.setFontSize(9)
      const lines = pdf.splitTextToSize(pages[i].text.replace(/[^\x00-\x7F]/g, ' '), 180)
      pdf.text(lines.slice(0, 35), 15, includeImages ? 134 : 25)
    }
  }
  return pdf.output('blob')
}

function blobDataUrl(blob) {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(blob)
  })
}

function safeName(name) {
  return (name || 'LR讲义').replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/\.[^.]+$/, '')
}

function formatTime(seconds) {
  const s = Math.max(0, Math.round(seconds))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export async function exportLecture(fileName, pages, options, hooks = {}) {
  const title = safeName(fileName)
  const outputs = []
  if (options.word) {
    hooks.log?.('正在生成 Word…')
    outputs.push({ name: `${title}_讲义.docx`, blob: await makeWord(title, pages, options.includeImages) })
  }
  if (options.pdf) {
    hooks.log?.('正在生成 PDF…')
    outputs.push({ name: `${title}_讲义.pdf`, blob: await makePdf(title, pages, options.includeImages) })
  }
  const report = { title, generatedAt: new Date().toISOString(), pageCount: pages.length, pages: pages.map(p => ({ page: p.number, time: p.time, text: p.text })) }
  outputs.push({ name: `${title}_识别报告.json`, blob: new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }) })

  if (options.zip) {
    const zip = new JSZip()
    for (const item of outputs) zip.file(item.name, item.blob)
    if (options.includeImages) for (const page of pages) zip.file(`课件页/${String(page.number).padStart(4, '0')}.jpg`, page.blob)
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } }, meta => hooks.progress?.(.95 + meta.percent / 100 * .05, '正在打包 ZIP'))
    downloadBlob(blob, `${title}_LR讲义.zip`)
  } else {
    for (const item of outputs) downloadBlob(item.blob, item.name)
  }
  hooks.progress?.(1, '完成')
  return outputs
}

