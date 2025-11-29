import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function logChanges(entityId: number, changes: Record<string, { old: any, new: any }>) {
  const logs = Object.entries(changes).map(([field, { old, new: newVal }]) => ({
    entityType: 'Task',
    entityId,
    action: 'UPDATE',
    oldValue: old ? JSON.stringify({ [field]: old }) : null,
    newValue: JSON.stringify({ [field]: newVal }),
    changedBy: 'system'
  }))

  await prisma.changeLog.createMany({ data: logs })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 })
    }

    const body = await request.json()
    // Server-side validation
    if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
      return NextResponse.json({ error: 'Title must be a non-empty string' }, { status: 400 })
    }

    if (title !== undefined && title.trim().length < 2) {
      return NextResponse.json({ error: 'Title must be at least 2 characters long' }, { status: 400 })
    }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
    if (priority && !validPriorities.includes(priority.toUpperCase())) {
      return NextResponse.json({ error: 'Invalid priority value' }, { status: 400 })
    }

    // Validate date formats
    if (dueDate && isNaN(Date.parse(dueDate))) {
      return NextResponse.json({ error: 'Invalid due date format' }, { status: 400 })
    }

    if (deadline && isNaN(Date.parse(deadline))) {
      return NextResponse.json({ error: 'Invalid deadline format' }, { status: 400 })
    }

    // Validate date logic
    if (dueDate && deadline) {
      const dueDateObj = new Date(dueDate)
      const deadlineObj = new Date(deadline)
      if (dueDateObj > deadlineObj) {
        return NextResponse.json({ error: 'Deadline cannot be before due date' }, { status: 400 })
      }
    }

    // Validate time estimates
    if (estimate !== undefined && (typeof estimate !== 'number' || estimate < 0)) {
      return NextResponse.json({ error: 'Estimate must be a positive number' }, { status: 400 })
    }

    if (actual !== undefined && (typeof actual !== 'number' || actual < 0)) {
      return NextResponse.json({ error: 'Actual must be a positive number' }, { status: 400 })
    }

    // Validate recurring settings
    if (recurring?.enabled) {
      const validFrequencies = ['daily', 'weekly', 'monthly']
      if (!validFrequencies.includes(recurring.frequency)) {
        return NextResponse.json({ error: 'Invalid recurring frequency' }, { status: 400 })
      }
      if (!recurring.interval || recurring.interval < 1) {
        return NextResponse.json({ error: 'Recurring interval must be at least 1' }, { status: 400 })
      }
    }

    // Validate subtasks
    if (subtasks) {
      for (const subtask of subtasks) {
        if (!subtask.title || typeof subtask.title !== 'string' || subtask.title.trim().length === 0) {
          return NextResponse.json({ error: 'All subtasks must have valid titles' }, { status: 400 })
        }
      }
    }

    // Validate status
    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
    if (status && !validStatuses.includes(status.toUpperCase())) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
    }
    const {
      title,
      description,
      priority,
      dueDate,
      deadline,
      estimate,
      actual,
      recurring,
      labels,
      subtasks,
      status
    } = body

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        subtasks: true,
        taskLabels: { include: { label: true } },
        attachments: true,
        reminders: true
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Track changes
    const changes: Record<string, { old: any, new: any }> = {}

    if (title !== undefined && title !== existingTask.title) {
      changes.title = { old: existingTask.title, new: title }
    }
    if (description !== existingTask.description) {
      changes.description = { old: existingTask.description, new: description }
    }
    if (priority && priority.toUpperCase() !== existingTask.priority) {
      changes.priority = { old: existingTask.priority, new: priority.toUpperCase() }
    }
    if (dueDate !== existingTask.dueDate?.toISOString()) {
      changes.dueDate = { old: existingTask.dueDate, new: dueDate ? new Date(dueDate) : null }
    }
    if (deadline !== existingTask.deadline?.toISOString()) {
      changes.deadline = { old: existingTask.deadline, new: deadline ? new Date(deadline) : null }
    }
    if (estimate !== existingTask.estimate) {
      changes.estimate = { old: existingTask.estimate, new: estimate }
    }
    if (actual !== existingTask.actual) {
      changes.actual = { old: existingTask.actual, new: actual }
    }
    if (recurring?.enabled !== existingTask.recurringEnabled) {
      changes.recurringEnabled = { old: existingTask.recurringEnabled, new: recurring?.enabled }
    }
    if (recurring?.frequency !== existingTask.recurringFrequency) {
      changes.recurringFrequency = { old: existingTask.recurringFrequency, new: recurring?.frequency }
    }
    if (recurring?.interval !== existingTask.recurringInterval) {
      changes.recurringInterval = { old: existingTask.recurringInterval, new: recurring?.interval }
    }

    const newStatus = status === 'completed' ? 'COMPLETED' : status === 'in_progress' ? 'IN_PROGRESS' : status === 'cancelled' ? 'CANCELLED' : 'PENDING'
    if (newStatus !== existingTask.status) {
      changes.status = { old: existingTask.status, new: newStatus }
    }

    // Handle subtasks updates
    if (subtasks) {
      // For simplicity, delete all and recreate
      await prisma.subtask.deleteMany({ where: { taskId: id } })
      if (subtasks.length > 0) {
        await prisma.subtask.createMany({
          data: subtasks.map((st: any) => ({
            taskId: id,
            title: st.title,
            completed: st.completed || false
          }))
        })
      }
    }

    // Handle labels updates
    if (labels) {
      await prisma.taskLabel.deleteMany({ where: { taskId: id } })
      if (labels.length > 0) {
        const labelIds = await Promise.all(labels.map(async (labelName: string) => {
          let label = await prisma.label.findUnique({ where: { name: labelName } })
          if (!label) {
            label = await prisma.label.create({ data: { name: labelName } })
          }
          return label.id
        }))
        await prisma.taskLabel.createMany({
          data: labelIds.map(labelId => ({ taskId: id, labelId }))
        })
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        priority: priority?.toUpperCase(),
        dueDate: dueDate ? new Date(dueDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        estimate,
        actual,
        recurringEnabled: recurring?.enabled,
        recurringFrequency: recurring?.frequency,
        recurringInterval: recurring?.interval,
        status: newStatus,
        completedAt: newStatus === 'COMPLETED' ? new Date() : null
      },
      include: {
        subtasks: true,
        taskLabels: { include: { label: true } },
        attachments: true,
        reminders: true
      }
    })

    // Log changes
    if (Object.keys(changes).length > 0) {
      await logChanges(id, changes)
    }

    const formattedTask = {
      id: updatedTask.id.toString(),
      title: updatedTask.title,
      description: updatedTask.description,
      completed: updatedTask.status === 'COMPLETED',
      priority: updatedTask.priority.toLowerCase(),
      dueDate: updatedTask.dueDate,
      deadline: updatedTask.deadline,
      estimate: updatedTask.estimate,
      actual: updatedTask.actual,
      recurring: {
        enabled: updatedTask.recurringEnabled,
        frequency: updatedTask.recurringFrequency,
        interval: updatedTask.recurringInterval
      },
      labels: updatedTask.taskLabels.map(tl => tl.label.name),
      subtasks: updatedTask.subtasks.map(st => ({
        id: st.id.toString(),
        title: st.title,
        completed: st.completed
      })),
      hasAttachments: updatedTask.attachments.length > 0,
      createdAt: updatedTask.createdAt,
      updatedAt: updatedTask.updatedAt
    }

    return NextResponse.json(formattedTask)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 })
    }

    const task = await prisma.task.findUnique({ where: { id } })
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    await prisma.task.delete({ where: { id } })

    // Log deletion
    await prisma.changeLog.create({
      data: {
        entityType: 'Task',
        entityId: id,
        action: 'DELETE',
        oldValue: JSON.stringify({
          title: task.title,
          description: task.description,
          priority: task.priority,
          dueDate: task.dueDate,
          deadline: task.deadline,
          estimate: task.estimate,
          actual: task.actual,
          recurringEnabled: task.recurringEnabled,
          recurringFrequency: task.recurringFrequency,
          recurringInterval: task.recurringInterval
        }),
        changedBy: 'system'
      }
    })

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}