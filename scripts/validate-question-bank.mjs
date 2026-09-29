import { BUILTIN_EXERCISES } from '../src/data.js'

const errors = []
const seenExercises = new Set()
const seenQuestions = new Set()

function fail(message) {
  errors.push(message)
}

for (const [exerciseIndex, exercise] of BUILTIN_EXERCISES.entries()) {
  const where = `exercise[${exerciseIndex}]`
  if (!exercise?.id) fail(`${where}: missing id`)
  else if (seenExercises.has(exercise.id)) fail(`${where}: duplicate id ${exercise.id}`)
  else seenExercises.add(exercise.id)

  if (!Number.isInteger(exercise?.year) || exercise.year < 2000 || exercise.year > 2100) {
    fail(`${where}: invalid year`)
  }
  if (!exercise?.title?.trim()) fail(`${where}: missing title`)
  if (!exercise?.passage?.trim()) fail(`${where}: missing passage`)
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
    if (!q?.prompt?.trim()) fail(`${qwhere}: missing prompt`)
    if (!q?.type?.trim()) fail(`${qwhere}: missing type`)
    if (!q?.explanation?.trim()) fail(`${qwhere}: missing explanation`)
    if (!q?.evidence?.trim()) fail(`${qwhere}: missing evidence`)

    const keys = Object.keys(q?.options ?? {}).sort()
    if (keys.join(',') !== 'A,B,C,D') {
      fail(`${qwhere}: options must contain exactly A/B/C/D`)
    }
    if (!['A', 'B', 'C', 'D'].includes(q?.answer)) {
      fail(`${qwhere}: answer must be A/B/C/D`)
    } else if (!q.options?.[q.answer]) {
      fail(`${qwhere}: answer points to a missing option`)
    }
  }
}

if (errors.length) {
  console.error(`Question-bank validation failed with ${errors.length} issue(s):`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

const questionCount = BUILTIN_EXERCISES.reduce((n, x) => n + x.questions.length, 0)
console.log(
  `Question-bank validation passed: ${BUILTIN_EXERCISES.length} exercises, ${questionCount} questions, all IDs unique.`
)
