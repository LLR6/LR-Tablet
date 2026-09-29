# Compatibility

## Application

- Web build: Vite
- Android wrapper: Capacitor 7
- Data remains local by default.

## Question-bank compatibility

See `QUESTION_BANK_SCHEMA.md`.

Current cloud package schema:

- `schemaVersion: 1`

IDs should remain stable after release because local progress can depend on them.

## Backup compatibility

- current backup: `lr-english-reading-backup/v2`
- legacy backup: accepted in compatibility mode without integrity verification

A future backup schema change should either provide migration code or clearly reject unsupported data before replacing local state.

## Android CI

The default branch builds through GitHub Actions after:

1. question-bank validation;
2. backup integrity self-test;
3. web build;
4. Capacitor sync;
5. Android APK build.
