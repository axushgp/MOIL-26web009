---
name: Generated API schema names
description: How this workspace's OpenAPI generator names Zod schemas consumed by the server.
---

The generated Zod package names schemas from their operations, such as GetDataModeResponse and SetDataModeBody, rather than exposing every OpenAPI component name as a runtime schema. Current Orval also emits some operation parameter names in both runtime and type barrels, so the package barrel is normalized after code generation.

**Why:** Assuming component-style runtime exports can leave an imported workspace compiling only after the first workflow restart, even though code generation itself succeeded.

**How to apply:** When adding or repairing a server route, inspect the generated API barrel and use the operation-specific runtime schemas; keep the non-generated barrel normalization in the codegen command; rerun typecheck and the API build after contract changes.