import { GET, POST } from '../lists/route'
import { PUT, DELETE } from '../lists/[id]/route'

// Mock Prisma
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    list: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

import { prisma } from '../../../lib/prisma'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('/api/lists', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/lists', () => {
    it('returns formatted lists with task counts', async () => {
      const mockLists = [
        {
          id: 1,
          name: 'Work',
          color: '#ff0000',
          emoji: '💼',
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          tasks: [
            { status: 'PENDING', dueDate: new Date() },
            { status: 'COMPLETED', dueDate: null },
          ],
          _count: { tasks: 2 },
        },
        {
          id: 2,
          name: 'Personal',
          color: null,
          emoji: null,
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          tasks: [],
          _count: { tasks: 0 },
        },
      ]

      mockPrisma.list.findMany.mockResolvedValue(mockLists)

      const request = new Request('http://localhost:3000/api/lists')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
      expect(data[0]).toEqual({
        id: '1',
        name: 'Work',
        color: '#ff0000',
        emoji: '💼',
        taskCount: 2,
        overdueCount: 0, // No overdue tasks in mock
        isDefault: false,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      })
    })

    it('calculates overdue count correctly', async () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      const mockLists = [
        {
          id: 1,
          name: 'Work',
          tasks: [
            { status: 'PENDING', dueDate: pastDate }, // Overdue
            { status: 'COMPLETED', dueDate: pastDate }, // Not counted as overdue
          ],
          _count: { tasks: 2 },
        },
      ] as any

      mockPrisma.list.findMany.mockResolvedValue(mockLists)

      const request = new Request('http://localhost:3000/api/lists')
      const response = await GET(request)
      const data = await response.json()

      expect(data[0].overdueCount).toBe(1)
    })

    it('handles database errors', async () => {
      mockPrisma.list.findMany.mockRejectedValue(new Error('Database error'))

      const request = new Request('http://localhost:3000/api/lists')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch lists')
    })
  })

  describe('POST /api/lists', () => {
    it('creates a list successfully', async () => {
      const mockCreatedList = {
        id: 1,
        name: 'New List',
        color: '#ff0000',
        emoji: '📝',
        description: 'A new list',
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { tasks: 0 },
      }

      mockPrisma.list.create.mockResolvedValue(mockCreatedList)

      const request = new Request('http://localhost:3000/api/lists', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New List',
          color: '#ff0000',
          emoji: '📝',
          description: 'A new list',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.name).toBe('New List')
      expect(data.color).toBe('#ff0000')
      expect(mockPrisma.list.create).toHaveBeenCalledWith({
        data: {
          name: 'New List',
          color: '#ff0000',
          emoji: '📝',
          description: 'A new list',
        },
        include: { _count: { select: { tasks: true } } },
      })
    })

    it('validates required name', async () => {
      const request = new Request('http://localhost:3000/api/lists', {
        method: 'POST',
        body: JSON.stringify({
          color: '#ff0000',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Name is required')
    })

    it('validates name length', async () => {
      const request = new Request('http://localhost:3000/api/lists', {
        method: 'POST',
        body: JSON.stringify({
          name: 'A',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('at least 2 characters')
    })

    it('validates color format', async () => {
      const request = new Request('http://localhost:3000/api/lists', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test List',
          color: 'invalid-color',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('valid hex color')
    })

    it('validates description length', async () => {
      const longDescription = 'a'.repeat(501)

      const request = new Request('http://localhost:3000/api/lists', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test List',
          description: longDescription,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('less than 500 characters')
    })
  })
})

describe('/api/lists/[id]', () => {
  describe('PUT /api/lists/[id]', () => {
    it('updates a list successfully', async () => {
      const existingList = {
        id: 1,
        name: 'Old Name',
        color: '#000000',
        emoji: null,
        description: null,
        isDefault: false,
      }

      const updatedList = {
        ...existingList,
        name: 'New Name',
        color: '#ff0000',
        _count: { tasks: 5 },
      } as any

      mockPrisma.list.findUnique.mockResolvedValue(existingList)
      mockPrisma.list.update.mockResolvedValue(updatedList)

      const request = new Request('http://localhost:3000/api/lists/1', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'New Name',
          color: '#ff0000',
        }),
      })

      const response = await PUT(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.name).toBe('New Name')
      expect(data.color).toBe('#ff0000')
    })

    it('returns 404 for non-existent list', async () => {
      mockPrisma.list.findUnique.mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/lists/999', {
        method: 'PUT',
        body: JSON.stringify({ name: 'New Name' }),
      })

      const response = await PUT(request, { params: { id: '999' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('List not found')
    })

    it('prevents updating default list', async () => {
      const defaultList = {
        id: 1,
        name: 'Default List',
        isDefault: true,
      } as any

      mockPrisma.list.findUnique.mockResolvedValue(defaultList)

      const request = new Request('http://localhost:3000/api/lists/1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'New Name' }),
      })

      const response = await PUT(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Cannot update default list')
    })

    it('validates name requirements', async () => {
      const existingList = {
        id: 1,
        name: 'Old Name',
        isDefault: false,
      } as any

      mockPrisma.list.findUnique.mockResolvedValue(existingList)

      const request = new Request('http://localhost:3000/api/lists/1', {
        method: 'PUT',
        body: JSON.stringify({ name: '' }),
      })

      const response = await PUT(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('non-empty string')
    })
  })

  describe('DELETE /api/lists/[id]', () => {
    it('deletes a list successfully', async () => {
      const listToDelete = {
        id: 1,
        name: 'List to delete',
        isDefault: false,
      } as any

      mockPrisma.list.findUnique.mockResolvedValue(listToDelete)
      mockPrisma.list.delete.mockResolvedValue(listToDelete)

      const request = new Request('http://localhost:3000/api/lists/1', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('List deleted successfully')
    })

    it('returns 404 for non-existent list', async () => {
      mockPrisma.list.findUnique.mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/lists/999', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: '999' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('List not found')
    })

    it('prevents deleting default list', async () => {
      const defaultList = {
        id: 1,
        name: 'Default List',
        isDefault: true,
      } as any

      mockPrisma.list.findUnique.mockResolvedValue(defaultList)

      const request = new Request('http://localhost:3000/api/lists/1', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Cannot delete default list')
    })
  })
})