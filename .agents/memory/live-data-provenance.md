---
name: Live data provenance gate
description: Rules for enabling MRIP live mode from verified external science sources.
---

Live mode must require validated source artifacts and a provenance-bearing
fusion bundle, not merely the presence of credentials. If any source or the
fusion output is incomplete, all data endpoints must fail closed rather than
fall back to synthetic records.

**Why:** Satellite exports, manual geology downloads, reanalysis weather, and
official production figures have different freshness and validation boundaries.
Treating a credential as a live dataset would make operational results look
more authoritative than they are.

**How to apply:** Keep source readiness explicit, require source dates/checksums
and row-level provenance, and expose source status through the data-mode API
before enabling live dashboard reads.