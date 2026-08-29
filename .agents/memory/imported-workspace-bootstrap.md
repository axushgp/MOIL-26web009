---
name: Imported workspace bootstrap
description: Non-obvious setup behavior for imported pnpm workspaces with Replit-managed databases.
---

Imported pnpm workspaces can arrive without node_modules, and their post-merge setup may not have run yet. For database-backed previews, the first API request can fail because application tables are absent even though the database itself is reachable.

**Why:** Import setup and post-merge setup are separate lifecycle paths; a clean import can therefore have a valid workflow command but an unusable first request.

**How to apply:** When an imported workspace fails with missing executables or missing application relations, install from the frozen lockfile, apply the existing development schema through the project’s normal database setup, restart the workflow, and rerun the project smoke check.