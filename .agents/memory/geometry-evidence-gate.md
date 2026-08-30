---
name: Geometry evidence gate
description: Distinguishes mine-locality screening points from geometry that is eligible for reserve validation.
---

Mine-locality coordinates and lease geometry are different evidence classes. A
screening point may remain visible for map orientation, but it must carry an
explicit non-eligible status and never contribute to final reserve validation.
Validation-eligible geometry must retain its source URI, retrieval date,
confidence, geometry type, and provenance; an envelope or bounding polygon must
not be described as a surveyed lease polygon.

**Why:** Public locality records can identify the right mine while still being
too imprecise for field planning or geological validation. Treating them as
lease centroids inflates confidence and makes LOOCV appear stronger than the
evidence supports.

**How to apply:** Keep screening and validated geometry statuses separate in
the ingestion register, API responses, preview validation, and any live-bundle
readiness check. Recompute validation from the eligible subset whenever
geometry evidence changes.