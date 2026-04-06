---
status: diagnosed
phase: 02-home-chores
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md, 02-05-SUMMARY.md, 02-06-SUMMARY.md]
started: 2026-04-06T00:00:00Z
updated: 2026-04-06T00:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Chores page loads
expected: Navigate to /chores. The page loads showing a task list (or "No tasks yet" empty state). A header/title for the chores section is visible, along with filter controls (status buttons, area dropdown, sort toggle).
result: pass

### 2. Create a task
expected: Click the "Add task" button on /chores. A dialog/form opens with fields for: Task name (text), Area (dropdown with default areas like Kitchen, Bedroom, Living Room, Garden, Full House), Starts (date + time), Ends (date + time, optional), Owner (dropdown of household members), Notes (textarea), and Repeat (frequency config). Fill in required fields and submit. The new task appears in the list immediately (optimistic update) with the task name, area badge, due date, owner avatar, and status badge ("To Do").
result: issue
reported: "pass with one improvement needed - the input areas for navigating to previous / next month do not match the buttons icon area"
severity: minor

### 3. Mark a task as done
expected: On a task row, click the checkbox. The task's status badge updates to "Done". The task stays in the list but is visually distinct (e.g., greyed out or strikethrough). If the "Hide done" toggle/filter is active, the task disappears from view.
result: pass

### 4. Edit a task
expected: On a task row, open the action menu (three-dot or similar) and click "Edit". The task form dialog opens pre-filled with the task's existing values. Update a field (e.g., task name) and submit. The task row in the list reflects the updated values immediately.
result: pass

### 5. Delete a task
expected: On a task row, open the action menu and click "Delete". A confirmation prompt appears (or immediate deletion). The task is removed from the list.
result: pass

### 6. Filter tasks by status
expected: In the filter bar on /chores, click a status filter (e.g., "In Progress" or "To Do"). The task list updates to show only tasks with that status. Clicking another status adds it to the filter (multi-select). Clicking "All" or deselecting shows all tasks again.
result: pass

### 7. Filter tasks by area
expected: In the filter bar, select an area from the area dropdown (e.g., "Kitchen"). The task list updates to show only tasks assigned to that area.
result: pass

### 8. Create a recurring task
expected: Open the "Add task" form and toggle the Repeat field. Select a frequency (e.g., Weekly, every 1 week, on Monday). Submit the form. Multiple task occurrence rows appear in the list — one per scheduled occurrence over the next year — each with the same title, area, and owner but different dates.
result: pass

### 9. Notification bell in header
expected: The app header/layout includes a bell icon (notification bell). If there are unread notifications, a badge showing the count is visible on the bell. Clicking the bell opens a dropdown listing notifications (or shows "No notifications" if none exist).
result: pass

### 10. Settings — notification toggle
expected: Navigate to /settings. A "Notifications" section is visible (previously shown as "Coming soon"). It contains a toggle switch labelled something like "Email me when I'm assigned a task". The toggle can be switched on/off.
result: issue
reported: "I cannot access notification section settings"
severity: major

### 11. Dashboard — chores card
expected: Navigate to /dashboard (or the main dashboard). A chores card is visible showing up to 3 upcoming tasks (non-done, soonest first). Each row shows the task name, area label, and formatted due date. If no tasks exist, the card shows "No upcoming tasks. Add a task to get started."
result: pass

### 12. Dashboard — "View all tasks" link
expected: On the chores dashboard card, click the "View all tasks →" link. It navigates to /chores.
result: pass

## Summary

total: 12
passed: 10
issues: 2
pending: 0
skipped: 0

## Gaps

- truth: "Settings /settings page has a Notifications section with an email toggle"
  status: failed
  reason: "User reported: I cannot access notification section settings"
  severity: major
  test: 10
  root_cause: "No navigation link to /settings exists anywhere in the app UI. The route and NotificationToggle component are correctly built, but src/app/(app)/layout.tsx has no settings link — users cannot reach /settings without typing the URL directly."
  artifacts:
    - path: "src/app/(app)/layout.tsx"
      issue: "No link to /settings in app layout or any page header"
  missing:
    - "Add a settings nav link (gear icon or user avatar) to the app layout so users can navigate to /settings"
  debug_session: ""

- truth: "DatePicker prev/next month buttons are fully clickable within their visible icon area"
  status: failed
  reason: "User reported: the input areas for navigating to previous / next month do not match the buttons icon area"
  severity: minor
  test: 2
  root_cause: "DayPicker v9 PreviousMonthButton/NextMonthButton components receive positioning props via {...props} spread. The nav container uses 'absolute inset-x-0 top-0' spanning full width, causing the button's actual click boundary to differ from where the ChevronLeft/ChevronRight icon visually appears. The h-7 w-7 constraint on the button conflicts with DayPicker's internal button sizing/positioning."
  artifacts:
    - path: "src/components/ui/date-picker.tsx"
      issue: "Custom PreviousMonthButton/NextMonthButton components: hit area does not match visual icon bounds"
  missing:
    - "Replace components override with classNames-only approach for nav buttons, or fix button sizing so click area matches the visible icon"
  debug_session: ""
