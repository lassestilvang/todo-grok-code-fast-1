import { GET, POST } from '../tasks/route'
import { PUT, DELETE } from '../tasks/[id]/route'

// Mock Prisma
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    task: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    subtask: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    taskLabel: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    label: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    changeLog: {
      createMany: jest.fn(),
      create: jest.fn(),
    },
  },
}))

import { prisma } from '../../../lib/prisma'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('/api/tasks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/tasks', () => {
    it('returns tasks with default filtering', async () => {
      const mockTasks = [
        {
          id: 1,
          title: 'Test Task',
          description: 'Test description',
          status: 'PENDING',
          priority: 'MEDIUM',
          dueDate: new Date('2024-12-25'),
          createdAt: new Date(),
          updatedAt: new Date(),
          subtasks: [],
          reminders: [],
          attachments: [],
          taskLabels: [],
        },
      ]

      mockPrisma.task.findMany.mockResolvedValue(mockTasks)

      const request = new Request('http://localhost:3000/api/tasks')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].title).toBe('Test Task')
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      })
    })

    it('filters tasks by listId', async () => {
      mockPrisma.task.findMany.mockResolvedValue([])

      const request = new Request('http://localhost:3000/api/tasks?listId=1')
      await GET(request)

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { listId: 1 },
        })
      )
    })

    it('filters tasks by search term', async () => {
      mockPrisma.task.findMany.mockResolvedValue([])

      const request = new Request('http://localhost:3000/api/tasks?search=test')
      await GET(request)

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { title: { contains: 'test', mode: 'insensitive' } },
              { description: { contains: 'test', mode: 'insensitive' } },
            ],
          },
        })
      )
    })

    it('filters tasks by view', async () => {
      mockPrisma.task.findMany.mockResolvedValue([])

      const request = new Request('http://localhost:3000/api/tasks?view=today')
      await GET(request)

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            dueDate: expect.any(Object),
          }),
        })
      )
    })

    it('excludes completed tasks when showCompleted is false', async () => {
      mockPrisma.task.findMany.mockResolvedValue([])

      const request = new Request('http://localhost:3000/api/tasks?showCompleted=false')
      await GET(request)

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { not: 'COMPLETED' },
          }),
        })
      )
    })

    it('handles database errors', async () => {
      mockPrisma.task.findMany.mockRejectedValue(new Error('Database error'))

      const request = new Request('http://localhost:3000/api/tasks')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch tasks')
    })
  })

  describe('POST /api/tasks', () => {
    it('creates a task successfully', async () => {
      const mockCreatedTask = {
        id: 1,
        title: 'New Task',
        description: 'Description',
        status: 'PENDING',
        priority: 'MEDIUM',
        dueDate: null,
        deadline: null,
        estimate: null,
        actual: null,
        recurringEnabled: false,
        recurringFrequency: null,
        recurringInterval: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        subtasks: [],
        taskLabels: [],
        attachments: [],
        reminders: [],
      }

      mockPrisma.list.findUnique.mockResolvedValue({ id: 1, name: 'Test List' } as any)
      mockPrisma.task.create.mockResolvedValue(mockCreatedTask)
      mockPrisma.task.findUnique.mockResolvedValue(mockCreatedTask)

      const request = new Request('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Task',
          description: 'Description',
          listId: '1',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.title).toBe('New Task')
      expect(mockPrisma.task.create).toHaveBeenCalled()
    })

    it('validates required title', async () => {
      const request = new Request('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          description: 'No title',
          listId: '1',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Title is required')
    })

    it('validates list existence', async () => {
      mockPrisma.list.findUnique.mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Task',
          listId: '999',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('List not found')
    })

    it('handles subtasks creation', async () => {
      const mockCreatedTask = {
        id: 1,
        title: 'Task with subtasks',
        subtasks: [{ id: 1, title: 'Subtask', completed: false }],
        taskLabels: [],
        attachments: [],
        reminders: [],
      } as any

      mockPrisma.list.findUnique.mockResolvedValue({ id: 1, name: 'Test' } as any)
      mockPrisma.task.create.mockResolvedValue(mockCreatedTask)
      mockPrisma.task.findUnique.mockResolvedValue(mockCreatedTask)

      const request = new Request('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Task with subtasks',
          listId: '1',
          subtasks: [{ title: 'Subtask', completed: false }],
        }),
      })

      await POST(request)

      expect(mockPrisma.subtask.createMany).toHaveBeenCalled()
    })

    it('handles labels creation', async () => {
      const mockCreatedTask = {
        id: 1,
        title: 'Task with labels',
        subtasks: [],
        taskLabels: [],
        attachments: [],
        reminders: [],
      } as any

      mockPrisma.list.findUnique.mockResolvedValue({ id: 1, name: 'Test' } as any)
      mockPrisma.label.findUnique.mockResolvedValue(null)
      mockPrisma.label.create.mockResolvedValue({ id: 1, name: 'urgent' } as any)
      mockPrisma.task.create.mockResolvedValue(mockCreatedTask)
      mockPrisma.task.findUnique.mockResolvedValue(mockCreatedTask)

      const request = new Request('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Task with labels',
          listId: '1',
          labels: ['urgent'],
        }),
      })

      await POST(request)

      expect(mockPrisma.label.create).toHaveBeenCalledWith({ data: { name: 'urgent' } })
      expect(mockPrisma.taskLabel.createMany).toHaveBeenCalled()
    })
  })
})

describe('/api/tasks/[id]', () => {
  describe('PUT /api/tasks/[id]', () => {
    it('updates a task successfully', async () => {
      const existingTask = {
        id: 1,
        title: 'Old Title',
        description: 'Old description',
        status: 'PENDING',
        priority: 'MEDIUM',
        subtasks: [],
        taskLabels: [],
        attachments: [],
        reminders: [],
      } as any

      const updatedTask = { ...existingTask, title: 'New Title' }

      mockPrisma.task.findUnique.mockResolvedValue(existingTask)
      mockPrisma.task.update.mockResolvedValue(updatedTask)

      const request = new Request('http://localhost:3000/api/tasks/1', {
        method: 'PUT',
        body: JSON.stringify({ title: 'New Title' }),
      })

      const response = await PUT(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.title).toBe('New Title')
    })

    it('returns 404 for non-existent task', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/tasks/999', {
        method: 'PUT',
        body: JSON.stringify({ title: 'New Title' }),
      })

      const response = await PUT(request, { params: { id: '999' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Task not found')
    })

    it('logs changes when updating', async () => {
      const existingTask = {
        id: 1,
        title: 'Old Title',
        status: 'PENDING',
        priority: 'MEDIUM',
        subtasks: [],
        taskLabels: [],
        attachments: [],
        reminders: [],
      } as any

      mockPrisma.task.findUnique.mockResolvedValue(existingTask)
      mockPrisma.task.update.mockResolvedValue({ ...existingTask, title: 'New Title' })

      const request = new Request('http://localhost:3000/api/tasks/1', {
        method: 'PUT',
        body: JSON.stringify({ title: 'New Title' }),
      })

      await PUT(request, { params: { id: '1' } })

      expect(mockPrisma.changeLog.createMany).toHaveBeenCalled()
    })
  })

  describe('DELETE /api/tasks/[id]', () => {
    it('deletes a task successfully', async () => {
      const taskToDelete = {
        id: 1,
        title: 'Task to delete',
        description: 'Description',
        priority: 'MEDIUM',
        dueDate: null,
        deadline: null,
        estimate: null,
        actual: null,
        recurringEnabled: false,
        recurringFrequency: null,
        recurringInterval: 1,
      } as any

      mockPrisma.task.findUnique.mockResolvedValue(taskToDelete)
      mockPrisma.task.delete.mockResolvedValue(taskToDelete)

      const request = new Request('http://localhost:3000/api/tasks/1', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Task deleted successfully')
      expect(mockPrisma.changeLog.create).toHaveBeenCalled()
    })

    it('returns 404 for non-existent task', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/tasks/999', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: '999' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Task not found')
    })
  })
})