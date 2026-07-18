const DB_NAME = 'lr-study'
const DB_VERSION = 1
const STORES = ['tasks', 'checkins', 'words', 'readings', 'attempts', 'mindmaps', 'settings', 'activities']

let dbPromise

export function openDB() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, { keyPath: 'id', autoIncrement: true })
          if (name === 'tasks') store.createIndex('date', 'date')
          if (name === 'words') store.createIndex('word', 'word', { unique: true })
          if (name === 'words') store.createIndex('due', 'due')
        }
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return dbPromise
}

function req(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function all(storeName) {
  const db = await openDB()
  return req(db.transaction(storeName).objectStore(storeName).getAll())
}

export async function get(storeName, id) {
  const db = await openDB()
  return req(db.transaction(storeName).objectStore(storeName).get(id))
}

export async function put(storeName, value) {
  const db = await openDB()
  return req(db.transaction(storeName, 'readwrite').objectStore(storeName).put(value))
}

export async function add(storeName, value) {
  const db = await openDB()
  return req(db.transaction(storeName, 'readwrite').objectStore(storeName).add(value))
}

export async function remove(storeName, id) {
  const db = await openDB()
  return req(db.transaction(storeName, 'readwrite').objectStore(storeName).delete(id))
}

export async function clear(storeName) {
  const db = await openDB()
  return req(db.transaction(storeName, 'readwrite').objectStore(storeName).clear())
}

export async function findBy(storeName, predicate) {
  return (await all(storeName)).filter(predicate)
}

export async function upsertWords(words) {
  const existing = await all('words')
  const map = new Map(existing.map(w => [w.word.toLowerCase(), w]))
  let added = 0
  let updated = 0
  for (const row of words) {
    const key = row.word.toLowerCase()
    const old = map.get(key)
    if (old) {
      await put('words', { ...old, ...row, id: old.id })
      updated++
    } else {
      await add('words', {
        ...row, familiarity: 0, repetitions: 0, interval: 0,
        due: new Date().toISOString().slice(0, 10), createdAt: new Date().toISOString()
      })
      added++
    }
  }
  await logActivity('words', '导入单词', `新增 ${added}，更新 ${updated}`)
  return { added, updated }
}

export async function reviewWord(word, remembered) {
  const today = new Date()
  let repetitions = word.repetitions || 0
  let interval = word.interval || 0
  let familiarity = word.familiarity || 0
  if (remembered) {
    repetitions++
    familiarity = Math.min(5, familiarity + 1)
    interval = repetitions === 1 ? 1 : repetitions === 2 ? 3 : Math.max(5, Math.round(Math.max(1, interval) * 1.8))
  } else {
    repetitions = 0
    familiarity = Math.max(0, familiarity - 1)
    interval = 0
  }
  today.setDate(today.getDate() + interval)
  await put('words', { ...word, repetitions, interval, familiarity, due: today.toISOString().slice(0, 10), lastReviewed: new Date().toISOString() })
}

export async function logActivity(kind, title, detail = '') {
  await add('activities', { kind, title, detail, createdAt: new Date().toISOString() })
}

export async function exportAll() {
  const payload = { schema: 'lr-sync-v1', exportedAt: new Date().toISOString(), data: {} }
  for (const store of STORES) payload.data[store] = await all(store)
  return payload
}

export async function importAll(payload, replace = false) {
  if (!payload || payload.schema !== 'lr-sync-v1' || !payload.data) throw new Error('不是有效的 LR 数据文件')
  for (const store of STORES) {
    const rows = payload.data[store]
    if (!Array.isArray(rows)) continue
    if (replace) await clear(store)
    for (const row of rows) await put(store, row)
  }
}

export async function dashboard() {
  const today = new Date().toISOString().slice(0, 10)
  const tasks = (await all('tasks')).filter(t => t.date === today)
  const words = await all('words')
  const checkins = await all('checkins')
  const days = new Set(checkins.filter(c => c.checked).map(c => c.date))
  let streak = 0
  const cursor = new Date()
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return {
    total: tasks.length,
    done: tasks.filter(t => t.completed).length,
    dueWords: words.filter(w => !w.due || w.due <= today).length,
    streak
  }
}

