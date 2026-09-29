# Releasing LR-Tablet

## Checklist

1. Android CI green on `main`.
2. `npm run validate:data` passes.
3. `npm run test:backup` passes.
4. Web build and Capacitor sync succeed.
5. Debug APK is generated and uploaded by CI.
6. Update `package.json`, `CHANGELOG.md` and `CITATION.cff`.
7. If question-bank schema changes, document migration behavior.
8. If backup schema changes, preserve or explicitly document compatibility.
9. Review `docs/QUESTION_BANK_SCHEMA.md` and `docs/ROADMAP.md`.

A release must not silently move local study data to a remote service.
