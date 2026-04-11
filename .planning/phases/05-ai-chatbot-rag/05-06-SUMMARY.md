---
phase: 05-ai-chatbot-rag
plan: 06
subsystem: ai-chatbot-ui
tags: [chatbot, ui, ai-sdk, streaming, rag]
requirements:
  - AI-01
  - AI-05
  - AI-06
  - INS-09
dependency_graph:
  requires:
    - 05-03 (chat Server Actions: createConversation, loadHistory)
    - 05-05 (/api/chat streaming route + extract_procedure tool)
  provides:
    - Floating chatbot UI on every authenticated page
    - Procedure → tasks preview flow (Chores target)
  affects:
    - src/app/(app)/layout.tsx (global mount)
tech_stack:
  added:
    - "@ai-sdk/react useChat + DefaultChatTransport"
    - "lucide-react MessageCircle, Send, X icons"
    - "sonner toasts for task creation feedback"
  patterns:
    - "Client-only React context for open/close state"
    - "Lazy conversation creation on first open"
    - "Tool UIMessage part detection via type prefix (tool-extract_procedure)"
    - "Sequential createTask loop with per-step error tracking"
key_files:
  created:
    - src/components/chatbot/ChatbotProvider.tsx
    - src/components/chatbot/ChatbotFab.tsx
    - src/components/chatbot/MessageList.tsx
    - src/components/chatbot/MessageInput.tsx
    - src/components/chatbot/ChatbotDock.tsx
    - src/components/chatbot/ProcedurePreviewModal.tsx
  modified:
    - src/app/(app)/layout.tsx
decisions:
  - "Rendered FAB unconditionally (not hidden when dock open) so users always have a consistent touch target"
  - "Backdrop for click-outside-to-close only on md:hidden — on desktop the dock is a persistent side panel"
  - "Sequential (not Promise.all) createTask loop in ProcedurePreviewModal — easier to attribute failures per step"
  - "Task scheduling: first step starts tomorrow, then +1 day per step (UX: feels like a sensible plan, not a blast)"
  - "conversationId stored only in React context (not URL/localStorage) — server owns conversation persistence"
metrics:
  duration: "~15 min"
  completed: "2026-04-11"
  tasks_completed: "2 of 3 (Task 3 is a manual smoke-test checkpoint — see below)"
  files_created: 6
  files_modified: 1
  commit: a1fba5f
---

# Phase 5 Plan 06: Chatbot UI Summary

Built the user-visible deliverable of Phase 5: a floating action button + 420px right-side dock panel that streams Claude responses via `useChat` + `DefaultChatTransport`, loads conversation history on open, and surfaces `extract_procedure` tool calls as a checkbox preview modal that creates real tasks via `createTask`.

## What Was Built

### 1. ChatbotProvider.tsx
Client-only React context exposing `{ isOpen, open, close, toggle, conversationId, setConversationId }`. No persistence — conversation list lives server-side.

### 2. ChatbotFab.tsx
Fixed `bottom-6 right-6 z-40` circular 56×56 button. `bg-[#5b76fe]` (Miro blue-450), hover `#2a41b6`, `ring-1 ring-[#e0e2e8] shadow-lg`, `lucide-react MessageCircle` icon. `aria-label` + `aria-expanded` for a11y. Toggles the dock.

### 3. MessageList.tsx
- Renders historical messages (from `loadHistory`) followed by live `useChat` messages
- User bubbles: right-aligned, `bg-[#eef0ff]`, `rounded-2xl`, `font-body`
- Assistant bubbles: left-aligned, `bg-white ring-1 ring-[#e0e2e8]`
- Iterates `UIMessage.parts`:
  - `type === 'text'` → renders `part.text`
  - `type` starts with `tool-extract_procedure` → renders a "Procedure ready" pill AND calls `onProcedure(part.input)` via a `useRef`-deduped effect so each tool call only fires once
  - Other `tool-*` types → muted "Used tool: <name>" line (no raw JSON)
- Auto-scrolls on new messages via `useEffect` + ref
- Typing indicator (3 pulsing dots) during `status === 'streaming' | 'submitted'`
- Empty state with a suggestion ("turn these steps into tasks")

### 4. MessageInput.tsx
Textarea + send button row. Enter submits, Shift+Enter inserts newline. Disabled while `status !== 'ready'` or conversation not yet created. Send button is a blue-450 pill with a `Send` icon, disabled when input empty.

### 5. ChatbotDock.tsx (the glue)
- Reads `{ isOpen, close, conversationId, setConversationId }` from `useChatbot()`
- On first open: `createConversation({})` → sets id in context
- On conversationId change: `loadHistory({ conversationId })` → populates historical bubbles
- Mounts `useChat({ transport: new DefaultChatTransport({ api: '/api/chat', body: { conversationId } }) })`
- Fixed `right-0 top-0 bottom-0 w-full max-w-[420px]` panel with `font-display` heading "Household assistant" + close X
- Mobile: adds a `bg-black/10 md:hidden` backdrop for click-outside-to-close
- Procedure detection: passes `onProcedure={setPendingProcedure}` to MessageList; renders `ProcedurePreviewModal` when set

### 6. ProcedurePreviewModal.tsx
- Centered modal `fixed inset-0 z-50 bg-black/40` backdrop, `bg-white rounded-2xl ring-1 ring-[#e0e2e8] max-w-lg`
- Heading (font-display): "Turn into tasks"; subheading = procedure title
- "These will be added to **Chores**" target indicator (INS-09 — MVP Chores only)
- Checkbox list (default all selected) with step title + optional description
- Confirm button: loops selected steps → `createTask({ title, notes, startsAt })` with the real `createTask` signature from `src/app/actions/tasks.ts` (verified: `{ title, notes, startsAt: ISO datetime with offset }`)
- Start dates stagger one day apart starting tomorrow (uses `new Date(baseMs + i * 86400000).toISOString()`)
- Tracks success/failure counts, shows `toast.success` (sonner) on success, inline error row on partial failure
- Does NOT invent fields — matches the Zod schema exactly

### 7. layout.tsx (src/app/(app)/layout.tsx)
Wrapped the existing `(app)` layout children in `<ChatbotProvider>`, then rendered `<ChatbotFab />` + `<ChatbotDock />` globally. The provider sits *inside* `<RealtimeProvider>` so it benefits from realtime context if needed later.

## Verification

### Automated (passing)
- `pnpm exec tsc --noEmit` → EXIT=0 (no type errors)
- `pnpm next build` → Compiled successfully in 3.6s; all 34 routes generated including `/dashboard`, `/chores`, `/kids`, `/insurance`, `/cars`, `/api/chat`

### Manual (Task 3 — checkpoint:human-verify)
Task 3 is the Phase 5 end-to-end smoke test. Per the autonomous execution instructions, the code is shipped and the server is **ready to be verified** — the user can run `pnpm dev` + `pnpm dlx inngest-cli@latest dev` and step through the 9-step checklist in the plan:

1. FAB visible on `/dashboard`
2. Click opens 420px right-side dock
3. Basic chat: "What are my upcoming chores?" streams with `get_upcoming_chores` tool
4. Upload a PDF via `/insurance` → `document_ready` notification
5. RAG query grounded answer with chunk citation
6. "turn the claim steps into tasks" → `extract_procedure` fires
7. ProcedurePreviewModal opens with checkbox list
8. Deselect one step, Create tasks → tasks appear in `/chores`
9. Close + reopen dock → history reloaded

All prerequisites are in place (the previous 5 plans shipped schema, embeddings, server actions, Inngest pipeline, and the /api/chat streaming route).

## Deviations from Plan

**None on Tasks 1-2.** The plan was followed exactly with two small quality-of-life additions that did not change the specified behaviour:

1. **[Rule 2 — critical safety] Deduplication of tool-extract_procedure part detection.** Without a `useRef<Set<string>>`, re-renders during streaming would re-fire `onProcedure` on every keystroke, causing the modal to open→close→open repeatedly. Added a seen-key ref so each tool call only triggers the modal once. Tracked as Rule 2 because without it the modal flow is effectively broken.

2. **[Rule 2 — UX safety] Mobile backdrop.** Plan didn't specify mobile behaviour; on small screens a 420px panel would cover the entire viewport with no way to dismiss except the X button. Added `md:hidden` backdrop that calls `close()` on click. Desktop behaviour unchanged.

## Requirements Completed

- **AI-01**: Chatbot accessible from every authenticated page (FAB in `(app)` layout)
- **AI-05**: Streaming chat with tool use (`useChat` + `DefaultChatTransport` → `/api/chat` which wires Claude Sonnet 4.6 + 6 tools)
- **AI-06**: Conversation persistence (history loaded via `loadHistory` on dock open)
- **INS-09**: Extract procedure → tasks (ProcedurePreviewModal + `createTask` loop targeting Chores)

## Files

**Created (6):**
- `/Users/alexandrapop/Warp_project/Household-Management-App/src/components/chatbot/ChatbotProvider.tsx`
- `/Users/alexandrapop/Warp_project/Household-Management-App/src/components/chatbot/ChatbotFab.tsx`
- `/Users/alexandrapop/Warp_project/Household-Management-App/src/components/chatbot/MessageList.tsx`
- `/Users/alexandrapop/Warp_project/Household-Management-App/src/components/chatbot/MessageInput.tsx`
- `/Users/alexandrapop/Warp_project/Household-Management-App/src/components/chatbot/ChatbotDock.tsx`
- `/Users/alexandrapop/Warp_project/Household-Management-App/src/components/chatbot/ProcedurePreviewModal.tsx`

**Modified (1):**
- `/Users/alexandrapop/Warp_project/Household-Management-App/src/app/(app)/layout.tsx`

**Commit:** `a1fba5f` — pushed to origin/main.

## Self-Check: PASSED

- [x] ChatbotProvider.tsx exists
- [x] ChatbotFab.tsx exists
- [x] MessageList.tsx exists
- [x] MessageInput.tsx exists
- [x] ChatbotDock.tsx exists
- [x] ProcedurePreviewModal.tsx exists
- [x] layout.tsx modified with ChatbotProvider + Fab + Dock
- [x] `tsc --noEmit` passes (EXIT=0)
- [x] `next build` succeeds (34/34 routes generated)
- [x] Commit `a1fba5f` exists on main
- [x] Pushed to origin/main
