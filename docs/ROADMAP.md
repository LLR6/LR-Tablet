# LR-Tablet Roadmap

## Data reliability

- Validate imported JSON before saving it.
- Version cloud package schemas explicitly.
- Add migration tests for future backup versions.
- Add duplicate-content detection in addition to ID checks.
- Keep question-bank validation in the Android build gate.

## Study workflow

- Better wrong-answer review queues.
- Spaced re-practice based on question-level history.
- More transparent mastery calculations.
- Export learning statistics as user-readable JSON/CSV.

## Android quality

- Add release-build CI alongside debug APK builds.
- Record APK SHA-256 and build metadata for every artifact.
- Add basic smoke tests for tablet orientation and local storage.
- Keep dependency updates automated and reviewable.

## Privacy

- Remain local-first by default.
- No hidden upload of study records.
- Any future sync feature must be explicit, optional and documented.

## Non-goals

The project does not aim to become a public question-bank redistribution service. Imported material remains the user's responsibility.
