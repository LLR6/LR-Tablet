# Change Risk Policy

## Low risk
UI copy, styling, additive documentation.

## Medium risk
new question-bank fields, import UX, local analytics, new export fields.

## High risk
backup format, local storage shape, question IDs, answer semantics, schema migration, import replacement behavior.

High-risk changes require:
- migration or compatibility behavior;
- backup restore tests;
- question-bank validation;
- Android CI build;
- explicit data-loss review.

A migration must never overwrite local study data before validation succeeds.
