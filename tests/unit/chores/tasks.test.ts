/**
 * Unit tests for task CRUD and assignment (CHORE-01 through CHORE-04).
 * These stubs define the expected contract; implementation comes in Plan 02-02.
 */
import { describe, it } from 'vitest'

describe('Tasks', () => {
  it.todo('CHORE-01: createTask saves title, notes, areaId, ownerId, startsAt, endsAt and returns the new task row')
  it.todo('CHORE-01: createTask returns error when title is missing')
  it.todo('CHORE-01: createTask returns error when startsAt is missing')
  it.todo('CHORE-02: createTask defaults ownerId to the authenticated user when no owner is specified')
  it.todo('CHORE-02: createTask accepts any household member uuid as ownerId')
  it.todo('CHORE-03: updateTaskStatus sets status to "done" and returns updated row')
  it.todo('CHORE-03: updateTaskStatus sets status to "in_progress" and returns updated row')
  it.todo('CHORE-04: updateTask updates title, notes, areaId, ownerId, startsAt, endsAt')
  it.todo('CHORE-04: deleteTask removes the task row and returns success')
  it.todo('CHORE-04: deleteTask on a parent task cascades to all occurrence rows')
})
