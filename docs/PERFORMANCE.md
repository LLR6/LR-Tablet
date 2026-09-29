# Performance and Size Policy

LR-Tablet CI publishes a web build-size artifact after Vite build.

The report stores:

- total `dist/` bytes;
- file count;
- largest generated files.

## Why track size

The application imports PDF/DOCX/ZIP tooling and runs on tablets, so bundle growth can affect:

- install/update size;
- startup;
- memory pressure;
- offline caching.

## Current policy

Build size is **observed, not hard-gated**.

A size increase should be reviewed when it comes from:

- a new large dependency;
- duplicate bundled code;
- unnecessary assets;
- a feature that could be lazy-loaded.

## Future performance work

Useful future measurements include:

- cold-start timing on representative Android hardware;
- large question-bank import latency;
- PDF parsing memory use;
- backup export/restore time for large local histories.

Those measurements should use fixed fixtures and device/runtime information before becoming release gates.
