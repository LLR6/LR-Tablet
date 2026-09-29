# Known Failure Modes

- Duplicate question IDs overwrite progress semantics.
  - CI question-bank validation rejects duplicates.
- Backup file was edited or truncated.
  - SHA-256 validation rejects restore.
- Legacy backup lacks integrity metadata.
  - Restore only in explicit unverified compatibility mode.
- Migration fails midway.
  - Validate/transform before replacing persisted state.
- Imported package declares incorrect counts.
  - Manifest validator rejects it.
- Large feature additions bloat the web bundle.
  - Compare build-size artifacts across similar builds.
- Android SDK/tooling deprecation breaks CI.
  - Keep CI actions/toolchain versioned and reproducible.
