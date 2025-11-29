import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const listId = searchParams.get('listId')
    const search = searchParams.get('search')
    const view = searchParams.get('view')
    const showCompleted = searchParams.get('showCompleted')
    const labelId = searchParams.get('labelId')

    let where: any = {}

    // If view is specified and no search, don't filter by listId (views are global)
    if (!search && !view && !labelId && listId) {
      where.listId = parseInt(listId)
      if (isNaN(where.listId)) {
        return NextResponse.json({ error: 'Invalid listId' }, { status: 400 })
      }
    }

    // Filter by label if specified
    if (labelId) {
      const labelIdNum = parseInt(labelId)
      if (isNaN(labelIdNum)) {
        return NextResponse.json({ error: 'Invalid labelId' }, { status: 400 })
      }
      where.taskLabels = {
        some: {
          labelId: labelIdNum
        }
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Date-based filtering for views (only if no search)
    if (!search && view) {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)

      switch (view) {
        case 'today':
          where.dueDate = {
            gte: today,
            lt: tomorrow
          }
          break
        case 'next7days':
          where.dueDate = {
            gte: today,
            lt: nextWeek
          }
          break
        case 'upcoming':
          where.dueDate = {
            gte: today
          }
          break
        case 'all':
          // No date filter
          break
        default:
          return NextResponse.json({ error: 'Invalid view parameter' }, { status: 400 })
      }
    }

    // Filter completed tasks if showCompleted is false
    if (showCompleted === 'false') {
      where.status = {
        not: 'COMPLETED'
      }
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        subtasks: true,
        reminders: true,
        attachments: true,
        taskLabels: {
          include: {
            label: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const formattedTasks = tasks.map(task => {
      let relevanceScore = 0
      if (search) {
        const searchLower = search.toLowerCase()
        if (task.title.toLowerCase().includes(searchLower)) relevanceScore += 2
        if (task.description && task.description.toLowerCase().includes(searchLower)) relevanceScore += 1
      }
      return {
        id: task.id.toString(),
        title: task.title,
        description: task.description,
        completed: task.status === 'COMPLETED',
        overdue: task.dueDate && task.dueDate < new Date() && task.status !== 'COMPLETED',
        priority: task.priority.toLowerCase(),
        dueDate: task.dueDate,
        deadline: task.deadline,
        estimate: task.estimate,
        actual: task.actual,
        recurring: {
          enabled: task.recurringEnabled,
          frequency: task.recurringFrequency,
          interval: task.recurringInterval
        },
        labels: task.taskLabels.map(tl => tl.label.name),
        subtasks: task.subtasks.map(st => ({
          id: st.id.toString(),
          title: st.title,
          completed: st.completed
        })),
        hasAttachments: task.attachments.length > 0,
        relevanceScore,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }
    }).sort((a, b) => {
      if (search) {
        if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore
      }
      return b.createdAt.getTime() - a.createdAt.getTime()
    })

    return NextResponse.json(formattedTasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
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
      listId
    } = body

    // Server-side validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required and must be a non-empty string' }, { status: 400 })
    }

    if (!listId || isNaN(parseInt(listId))) {
      return NextResponse.json({ error: 'Valid listId is required' }, { status: 400 })
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
    if (subtasks && Array.isArray(subtasks)) {
      for (const subtask of subtasks) {
        if (!subtask.title || typeof subtask.title !== 'string' || subtask.title.trim().length === 0) {
          return NextResponse.json({ error: 'All subtasks must have valid titles' }, { status: 400 })
        }
      }
    }

    // Check if list exists
    const list = await prisma.list.findUnique({ where: { id: parseInt(listId) } })
    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    // Create the task
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim(),
        priority: priority?.toUpperCase() || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        estimate,
        actual,
        recurringEnabled: recurring?.enabled || false,
        recurringFrequency: recurring?.frequency,
        recurringInterval: recurring?.interval || 1,
        listId: parseInt(listId),
        status: 'PENDING'
      }
    })

    // Handle labels
    if (labels && Array.isArray(labels) && labels.length > 0) {
      const labelIds = await Promise.all(labels.map(async (labelName: string) => {
        let label = await prisma.label.findUnique({ where: { name: labelName } })
        if (!label) {
          label = await prisma.label.create({ data: { name: labelName } })
        }
        return label.id
      }))
      await prisma.taskLabel.createMany({
        data: labelIds.map(labelId => ({ taskId: task.id, labelId }))
      })
    }

    // Handle subtasks
    if (subtasks && Array.isArray(subtasks) && subtasks.length > 0) {
      await prisma.subtask.createMany({
        data: subtasks.map((st: any) => ({
          taskId: task.id,
          title: st.title.trim(),
          completed: st.completed || false
        }))
      })
    }

    // Fetch the created task with relations
    const createdTask = await prisma.task.findUnique({
      where: { id: task.id },
      include: {
        subtasks: true,
        taskLabels: { include: { label: true } },
        attachments: true,
        reminders: true
      }
    })

    if (!createdTask) {
      throw new Error('Failed to retrieve created task')
    }

    const formattedTask = {
      id: createdTask.id.toString(),
      title: createdTask.title,
      description: createdTask.description,
      completed: createdTask.status === 'COMPLETED',
      priority: createdTask.priority.toLowerCase(),
      dueDate: createdTask.dueDate,
      deadline: createdTask.deadline,
      estimate: createdTask.estimate,
      actual: createdTask.actual,
      recurring: {
        enabled: createdTask.recurringEnabled,
        frequency: createdTask.recurringFrequency,
        interval: createdTask.recurringInterval
      },
      labels: createdTask.taskLabels.map(tl => tl.label.name),
      subtasks: createdTask.subtasks.map(st => ({
        id: st.id.toString(),
        title: st.title,
        completed: st.completed
      })),
      hasAttachments: createdTask.attachments.length > 0,
      createdAt: createdTask.createdAt,
      updatedAt: createdTask.updatedAt
    }

    return NextResponse.json(formattedTask, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}