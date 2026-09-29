function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value).sort().map(key => [key, normalize(value[key])])
    )
  }
  return value
}

export function stableStringify(value) {
  return JSON.stringify(normalize(value))
}

export async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(typeof value === 'string' ? value : stableStringify(value))
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, '0')).join('')
}

export async function createBackupEnvelope(data, exportedAt = new Date().toISOString()) {
  const payload = {
    schema: 'lr-english-reading-backup/v2',
    app: 'LR-考研英语真题特训（独家私人版）',
    exportedAt,
    data,
  }
  return {
    ...payload,
    dataSha256: await sha256Hex(data),
  }
}

export async function validateBackupEnvelope(value) {
  if (!value || typeof value !== 'object') throw new Error('备份文件不是 JSON 对象')

  if (value.schema === 'lr-english-reading-backup/v2') {
    if (!value.data || typeof value.data !== 'object') throw new Error('备份缺少 data')
    if (typeof value.dataSha256 !== 'string' || value.dataSha256.length !== 64) {
      throw new Error('备份缺少有效的数据摘要')
    }
    const actual = await sha256Hex(value.data)
    if (actual !== value.dataSha256) throw new Error('备份完整性校验失败：文件内容可能已被修改或损坏')
    return { data: value.data, integrity: 'verified', schema: value.schema }
  }

  const legacy = value.data || value
  if (!legacy || typeof legacy !== 'object') throw new Error('不是有效的 LR 英语特训备份')
  return { data: legacy, integrity: 'legacy-unverified', schema: 'legacy' }
}

export function validateStoreShape(data) {
  if (!Array.isArray(data?.attempts)) throw new Error('备份缺少 attempts')
  if (!Array.isArray(data?.customExercises)) throw new Error('备份缺少 customExercises')
  if (data.plan != null && typeof data.plan !== 'object') throw new Error('备份 plan 格式错误')
  if (data.settings != null && typeof data.settings !== 'object') throw new Error('备份 settings 格式错误')
  return data
}
