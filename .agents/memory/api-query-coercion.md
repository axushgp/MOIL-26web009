---
name: API query coercion
description: Generated enum validators may not coerce URL query strings in Express.
---

Normalize numeric query-string values at the HTTP route boundary before passing them to generated enum validators.

**Why:** HTTP query parameters always arrive as strings, while generated literal-enum schemas can compare against numeric literals without coercion and fail at runtime.

**How to apply:** When adding numeric enum query parameters to the OpenAPI-backed API, verify both the generated schema and a real URL request; coerce the route input if the generated validator does not.