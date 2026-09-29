# Question Bank Data Contract

LR-Tablet currently has two data paths:

1. **Built-in reading exercises** in `src/data.js`.
2. **Cloud-style packages** under `question-bank/`.

Both are validated in CI by:

```bash
npm run validate:data
```

## Built-in reading exercise

Required top-level fields:

```json
{
  "id": "en1-2025-t1",
  "year": 2025,
  "paper": "英语一",
  "title": "2025 英语一 · Text 1",
  "passage": "...",
  "questions": []
}
```

Each question must have:

- unique `id`;
- integer `number`;
- non-empty `prompt`;
- exactly four options: A / B / C / D;
- `answer` pointing to one of those options;
- non-empty `type`;
- non-empty `evidence`;
- non-empty `explanation`.

## Cloud manifest

`question-bank/manifest.json` uses `schemaVersion: 1`.

Each package declares:

- package `id`;
- title;
- relative `url`;
- `setCount`;
- `itemCount`.

CI loads the referenced bank JSON and verifies that the declared counts match the actual file.

## Cloud MCQ set

```json
{
  "id": "cloud-408-a",
  "subject": "408",
  "type": "mcq",
  "title": "综合基础组",
  "items": [
    {
      "id": "q1",
      "stem": "...",
      "options": {
        "A": "...",
        "B": "...",
        "C": "...",
        "D": "..."
      },
      "answer": "B",
      "explanation": "...",
      "topic": "数据结构"
    }
  ]
}
```

## Cloud sentence set

```json
{
  "id": "cloud-sentence-a",
  "subject": "长难句",
  "type": "sentence",
  "title": "长难句精拆",
  "items": [
    {
      "id": "s1",
      "text": "...",
      "reference": "...",
      "analysis": "..."
    }
  ]
}
```

## Versioning rules

A data change should be treated as a real artifact change, not an invisible content edit.

Recommended rules:

1. Keep item IDs stable after release.
2. If an answer or explanation is corrected, update the package version/date.
3. Do not silently reuse an old ID for a different question.
4. Keep `setCount` and `itemCount` consistent with the referenced JSON.
5. Validate before building an APK.
6. Imported third-party material must be legally usable and should carry a source note.

## Why validate at build time?

Bad learning data often does not crash an app immediately. It creates subtler failures:

- the selected answer points to no option;
- duplicate IDs overwrite local progress;
- a package claims the wrong item count;
- a sentence set misses its reference translation;
- a malformed question only breaks one screen later.

The CI gate moves those failures closer to the commit that introduced them.


## Provenance

Committed cloud packages must declare:

```json
{
  "provenance": {
    "kind": "original",
    "sourceNote": "Original practice material maintained in this repository."
  }
}
```

Allowed `kind` values for repository-distributed packages are:

- `original`
- `public-domain`
- `licensed`

Every set must also contain a non-empty `source` field.

These rules are enforced by `npm run validate:data`. See [DATA_POLICY.md](./DATA_POLICY.md) for the repository's content and provenance policy.
