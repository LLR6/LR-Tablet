import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { BUILTIN_EXERCISES } from '../src/data.js'

const errors = []
const seenExercises = new Set()
const seenQuestions = new Set()
const seenCloudSets = new Set()
const seenCloudItems = new Set()
const allowedProvenanceKinds = new Set(['original', 'public-domain', 'licensed'])

function fail(message) {
  errors.push(message)
}

function text(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function loadJson(url, label) {
  try {
    return JSON.parse(readFileSync(fileURLToPath(url), 'utf8'))
  } catch (error) {
    fail(`${label}: cannot read valid JSON (${error.message})`)
    return null
  }
}

function validateProvenance(value, where) {
  if (!value || typeof value !== 'object') {
    fail(`${where}: missing provenance object`)
    return
  }
  if (!allowedProvenanceKinds.has(value.kind)) {
    fail(`${where}.kind: must be original, public-domain, or licensed`)
  }
  if (!text(value.sourceNote)) {
    fail(`${where}.sourceNote: missing source note`)
  }
}

function validateOptions(options, answer, where) {
  const keys = Object.keys(options ?? {}).sort()
  if (keys.join(',') !== 'A,B,C,D') fail(`${where}: options must contain exactly A/B/C/D`)
  if (!['A', 'B', 'C', 'D'].includes(answer)) {
    fail(`${where}: answer must be A/B/C/D`)
  } else if (!options?.[answer]) {
    fail(`${where}: answer points to a missing option`)
  }
}

for (const [exerciseIndex, exercise] of BUILTIN_EXERCISES.entries()) {
  const where = `exercise[${exerciseIndex}]`
  if (!exercise?.id) fail(`${where}: missing id`)
  else if (seenExercises.has(exercise.id)) fail(`${where}: duplicate id ${exercise.id}`)
  else seenExercises.add(exercise.id)

  if (!Number.isInteger(exercise?.year) || exercise.year < 2000 || exercise.year > 2100) {
    fail(`${where}: invalid year`)
  }
  if (!text(exercise?.title)) fail(`${where}: missing title`)
  if (!text(exercise?.passage)) fail(`${where}: missing passage`)
  if (!Array.isArray(exercise?.questions) || exercise.questions.length === 0) {
    fail(`${where}: questions must be a non-empty array`)
    continue
  }

  for (const [questionIndex, q] of exercise.questions.entries()) {
    const qwhere = `${where}.questions[${questionIndex}]`
    if (!q?.id) fail(`${qwhere}: missing id`)
    else if (seenQuestions.has(q.id)) fail(`${qwhere}: duplicate id ${q.id}`)
    else seenQuestions.add(q.id)

    if (!Number.isInteger(q?.number)) fail(`${qwhere}: invalid number`)
    if (!text(q?.prompt)) fail(`${qwhere}: missing prompt`)
    if (!text(q?.type)) fail(`${qwhere}: missing type`)
    if (!text(q?.explanation)) fail(`${qwhere}: missing explanation`)
    if (!text(q?.evidence)) fail(`${qwhere}: missing evidence`)
    validateOptions(q?.options, q?.answer, qwhere)
  }
}

const manifestUrl = new URL('../question-bank/manifest.json', import.meta.url)
const manifest = loadJson(manifestUrl, 'question-bank/manifest.json')
let cloudSetCount = 0
let cloudItemCount = 0

if (manifest) {
  if (manifest.schemaVersion !== 1) fail('question-bank/manifest.json: unsupported schemaVersion')
  if (!text(manifest.version)) fail('question-bank/manifest.json: missing version')
  if (!Array.isArray(manifest.packages) || manifest.packages.length === 0) {
    fail('question-bank/manifest.json: packages must be a non-empty array')
  } else {
    const seenPackages = new Set()
    for (const [packageIndex, pkg] of manifest.packages.entries()) {
      const where = `manifest.packages[${packageIndex}]`
      if (!text(pkg?.id)) fail(`${where}: missing id`)
      else if (seenPackages.has(pkg.id)) fail(`${where}: duplicate id ${pkg.id}`)
      else seenPackages.add(pkg.id)
      if (!text(pkg?.title)) fail(`${where}: missing title`)
      validateProvenance(pkg?.provenance, `${where}.provenance`)
      if (!text(pkg?.url)) {
        fail(`${where}: missing url`)
        continue
      }

      const bankUrl = new URL(`../question-bank/${pkg.url}`, import.meta.url)
      const bank = loadJson(bankUrl, pkg.url)
      if (!bank) continue
      if (bank.schemaVersion !== 1) fail(`${pkg.url}: unsupported schemaVersion`)
      if (!text(bank.id)) fail(`${pkg.url}: missing id`)
      validateProvenance(bank?.provenance, `${pkg.url}.provenance`)
      if (!Array.isArray(bank.sets) || bank.sets.length === 0) {
        fail(`${pkg.url}: sets must be a non-empty array`)
        continue
      }

      let packageItems = 0
      for (const [setIndex, set] of bank.sets.entries()) {
        const setWhere = `${pkg.url}.sets[${setIndex}]`
        cloudSetCount += 1
        if (!text(set?.id)) fail(`${setWhere}: missing id`)
        else if (seenCloudSets.has(set.id)) fail(`${setWhere}: duplicate id ${set.id}`)
        else seenCloudSets.add(set.id)
        if (!text(set?.subject)) fail(`${setWhere}: missing subject`)
        if (!text(set?.type)) fail(`${setWhere}: missing type`)
        if (!text(set?.title)) fail(`${setWhere}: missing title`)
        if (!text(set?.source)) fail(`${setWhere}: missing source`)
        if (!Array.isArray(set?.items) || set.items.length === 0) {
          fail(`${setWhere}: items must be a non-empty array`)
          continue
        }

        packageItems += set.items.length
        cloudItemCount += set.items.length
        for (const [itemIndex, item] of set.items.entries()) {
          const itemWhere = `${setWhere}.items[${itemIndex}]`
          if (!text(item?.id)) fail(`${itemWhere}: missing id`)
          else if (seenCloudItems.has(item.id)) fail(`${itemWhere}: duplicate id ${item.id}`)
          else seenCloudItems.add(item.id)

          if (set.type === 'mcq') {
            if (!text(item?.stem)) fail(`${itemWhere}: missing stem`)
            if (!text(item?.explanation)) fail(`${itemWhere}: missing explanation`)
            validateOptions(item?.options, item?.answer, itemWhere)
          } else if (set.type === 'sentence') {
            if (!text(item?.text)) fail(`${itemWhere}: missing text`)
            if (!text(item?.reference)) fail(`${itemWhere}: missing reference`)
            if (!text(item?.analysis)) fail(`${itemWhere}: missing analysis`)
          } else {
            fail(`${setWhere}: unsupported type ${set.type}`)
          }
        }
      }

      if (Number.isInteger(pkg.setCount) && pkg.setCount !== bank.sets.length) {
        fail(`${where}: setCount=${pkg.setCount} but file contains ${bank.sets.length}`)
      }
      if (Number.isInteger(pkg.itemCount) && pkg.itemCount !== packageItems) {
        fail(`${where}: itemCount=${pkg.itemCount} but file contains ${packageItems}`)
      }
    }
  }
}

if (errors.length) {
  console.error(`Question-bank validation failed with ${errors.length} issue(s):`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

const builtinQuestionCount = BUILTIN_EXERCISES.reduce((n, x) => n + x.questions.length, 0)
console.log(
  `Question-bank validation passed: ${BUILTIN_EXERCISES.length} built-in exercises / ${builtinQuestionCount} questions; ` +
  `${cloudSetCount} cloud sets / ${cloudItemCount} items; IDs and declared counts are consistent.`
)
