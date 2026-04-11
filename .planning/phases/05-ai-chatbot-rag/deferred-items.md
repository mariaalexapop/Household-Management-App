# Deferred Items — Phase 05 (AI Chatbot + RAG)

Pre-existing issues discovered during plan execution that are **out of scope**
for the current plan. Logged per Rule 4/SCOPE boundary.

## Discovered during 05-05 execution

### Pre-existing TypeScript errors in `src/lib/inngest/functions/process-document.ts`

Not related to Plan 05-05 (which only touches `src/lib/ai/*` and `src/app/api/chat/*`).
Left untouched. To be resolved in a follow-up pass (likely belongs to Plan 05-02
or a dedicated cleanup).

Errors:

- `src/lib/inngest/functions/process-document.ts(39,3): TS2554` — inngest
  `createFunction`/event handler signature mismatch (wrong arg count).
- `src/lib/inngest/functions/process-document.ts(39,12 / 39,19): TS7031` —
  `event` and `step` implicitly `any`.
- `src/lib/inngest/functions/process-document.ts(63,52): TS2339` — `pdf-parse`
  ESM entrypoint does not expose `.default`; import style needs updating for
  `pdf-parse@2.4.5`.
- `src/lib/inngest/functions/process-document.ts(105,45 / 107,11)` — `content`
  inferred as `unknown` when building insert values for `document_chunks`.
  Needs an explicit `string` narrowing on the chunk content before the Drizzle
  insert.

None of these block Plan 05-05: the route handler, tools, and system prompt
all compile cleanly. The inngest document-processing job is the only
remaining TS failure area, and it existed before this plan was executed.

### RESOLVED during Plan 05-04 execution

Plan 05-04 rewrote `src/lib/inngest/functions/process-document.ts` end-to-end
to match the project's inngest `triggers: [{ event }]` + typed-handler pattern
and the pdf-parse v2 named-export (`PDFParse` class) API. All TS errors above
are now fixed. Verified with `rtk pnpm tsc --noEmit` — no errors in any of
the plan's target files.

## Discovered during 05-04 execution

### Pre-existing TypeScript error in `src/app/api/chat/route.ts:110`

Out of scope for Plan 05-04 (which touches Inngest + documents + notifications).
The file is untracked and belongs to Plan 05-05 (chatbot route handler).

```
src/app/api/chat/route.ts(110,5): error TS2740: Type 'Promise<ModelMessage[]>'
is missing the following properties from type 'ModelMessage[]': length, pop,
push, concat, and 35 more.
```

Likely a missing `await` on a `convertToModelMessages`/similar helper. Should
be fixed when Plan 05-05 verification is revisited.

