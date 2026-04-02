/**
 * Unit tests for notification creation and scheduling (CHORE-08, CHORE-10).
 */
import { describe, it } from 'vitest'

describe('Notifications', () => {
  it.todo('CHORE-08: task assignment inserts a notifications row with type="task_assigned" for the assigned user')
  it.todo('CHORE-08: task assignment triggers chore/task.assigned Inngest event')
  it.todo('CHORE-10: task creation with reminderOffsetMinutes=60 schedules Inngest event at startsAt - 60 minutes')
  it.todo('CHORE-10: task creation with reminderOffsetMinutes=null schedules reminder at startsAt - 1440 minutes (default)')
  it.todo('CHORE-10: due date reminder inserts a notifications row with type="task_reminder" for the task owner')
})
