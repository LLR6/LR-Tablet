# Migration Policy

LR-Tablet stores user progress and imported content locally. Data migrations must prioritize preventing silent data loss.

## Migration-sensitive data

- local study store;
- custom exercises;
- attempts / timing / notes;
- question-bank package schema;
- backup envelopes.

## Current versions

- cloud question bank: `schemaVersion: 1`
- backup envelope: `lr-english-reading-backup/v2`
- legacy backup: supported in unverified compatibility mode

## Rules

1. Validate incoming data before replacing local state.
2. Keep stable logical question IDs where possible.
3. Never reuse an existing ID for unrelated content.
4. Back up current local state before any destructive migration.
5. Migration functions should be pure transformations before persistence.
6. Unknown future schema versions should fail safely.
7. A failed migration must leave current data unchanged.
8. Backup integrity verification happens before restore.

## Test matrix for a new migration

- current → current;
- previous → current;
- malformed previous data;
- future/unknown schema;
- interrupted migration simulation;
- duplicate IDs;
- valid backup with changed field order;
- tampered backup.

## User-facing behavior

Before replacing local data, tell the user whether the backup was cryptographically verified, migrated, or loaded through legacy compatibility mode.
