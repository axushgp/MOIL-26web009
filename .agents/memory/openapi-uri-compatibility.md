---
name: OpenAPI URI compatibility
description: Compatibility constraint for URI-shaped fields in this workspace's generated Zod schemas.
---

Represent source URI fields as nullable or required strings in OpenAPI without
the `format: uri` annotation.

**Why:** The installed Orval mapping emits `zod.url()` for that annotation, but
the workspace currently resolves Zod 3, where that helper does not exist.

**How to apply:** Keep URI validation out of generated schemas unless the
workspace's Zod and Orval versions are upgraded together. Preserve the URI as
structured string data and validate it at the source-ingestion boundary if
needed.