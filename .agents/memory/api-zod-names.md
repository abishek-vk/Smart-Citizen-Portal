---
name: API Zod schema naming
description: Common naming pitfalls when importing schemas from @workspace/api-zod in backend routes.
---

## Rule
Always grep `lib/api-zod/src/generated/api.ts` for the exact export name before using it. The generated names often differ from what you'd expect based on the OpenAPI spec operation names.

## Known mismatches (intuitive → actual)
- `FeedbackInput` → `SubmitFeedbackBody`
- `ChatMessageInput` → `SendChatMessageBody`

## How to apply
Before adding a new import from `@workspace/api-zod`, run:
```
grep "^export const" lib/api-zod/src/generated/api.ts | grep -i <keyword>
```

**Why:** The code generator derives names from the OpenAPI operationId + body/params suffix, not from the schema name. Guessing causes build errors.
