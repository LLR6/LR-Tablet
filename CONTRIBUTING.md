# Contributing

LR-Tablet changes should protect study data and keep the local-first workflow reliable.

## Data changes

Before changing built-in or cloud-style question-bank data:

```bash
npm ci
npm run validate:data
npm run test:backup
npm run build
```

Keep IDs stable after release. Do not silently replace one question with a different item under the same ID.

## App changes

- preserve backup compatibility where practical;
- keep import errors visible rather than silently dropping content;
- avoid introducing unnecessary network dependencies;
- test tablet-sized layouts;
- do not commit private or copyrighted material without permission.

Android CI is expected to remain green on `main`.
