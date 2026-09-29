# Data and Content Policy

LR-Tablet keeps study data local by default and treats committed question-bank content as a versioned artifact.

## What may be committed to this repository

Question-bank packages committed under `question-bank/` must be one of:

- **original** — practice material created and maintained for this repository;
- **public-domain** — material that is clearly in the public domain;
- **licensed** — material redistributed under a license or permission that allows repository distribution.

Each committed package must include provenance metadata with:

- `kind`;
- a human-readable `sourceNote`.

Each set must include a non-empty `source` field.

## What should not be committed

Do not copy or redistribute, without permission:

- commercial exam-prep books;
- paid question banks;
- subscription-course material;
- private classroom handouts;
- copyrighted website question banks;
- leaked or access-controlled exam material.

A source being easy to download does not make it redistributable.

## User-imported local content

Users may import their own lawful study material locally. Local import support does not mean the repository redistributes or endorses that material.

The application should not silently upload user-imported passages, answers, notes or progress.

## Provenance kinds

### original

Use when the content was created specifically for this repository.

### public-domain

Use only when the public-domain status is reasonably clear. Include the source in `sourceNote`.

### licensed

Use when redistribution is allowed. The note should identify the license or permission and source.

## Corrections

If an answer, explanation or source note changes after release:

1. keep the item ID stable when it is still the same logical question;
2. update package version/date;
3. document materially changed answers or explanations;
4. do not silently replace one question with unrelated content under the same ID.

## Privacy

Progress, notes, timing data and backups are user data. The default architecture is local-first.

Any future remote synchronization feature should be opt-in and document:

- what leaves the device;
- where it is sent;
- how it is authenticated;
- retention behavior;
- how the user can delete or export it.
