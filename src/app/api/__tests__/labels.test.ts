import { GET, POST } from '../labels/route'
import { PUT, DELETE } from '../labels/[id]/route'

// Mock Prisma
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    label: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('/api/labels', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/labels', () => {
    it('returns formatted labels with task counts', async () => {
      const mockLabels = [
        {
          id: 1,
          name: 'Urgent',
          color: '#ff0000',
          createdAt: new Date(),
          _count: { taskLabels: 5 },
        },
        {
          id: 2,
          name: 'Important',
          color: '#ffa500',
          createdAt: new Date(),
          _count: { taskLabels: 3 },
        },
      ]

      mockPrisma.label.findMany.mockResolvedValue(mockLabels)

      const request = new Request('http://localhost:3000/api/labels')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
      expect(data[0]).toEqual({
        id: '1',
        name: 'Urgent',
        color: '#ff0000',
        taskCount: 5,
        createdAt: expect.any(Date),
      })
      expect(data[1].taskCount).toBe(3)
    })

    it('orders labels by name', async () => {
      mockPrisma.label.findMany.mockResolvedValue([])

      const request = new Request('http://localhost:3000/api/labels')
      await GET(request)

      expect(mockPrisma.label.findMany).toHaveBeenCalledWith({
        include: { _count: { select: { taskLabels: true } } },
        orderBy: { name: 'asc' },
      })
    })

    it('handles database errors', async () => {
      mockPrisma.label.findMany.mockRejectedValue(new Error('Database error'))

      const request = new Request('http://localhost:3000/api/labels')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch labels')
    })
  })

  describe('POST /api/labels', () => {
    it('creates a label successfully', async () => {
      const mockCreatedLabel = {
        id: 1,
        name: 'New Label',
        color: '#ff0000',
        createdAt: new Date(),
        _count: { taskLabels: 0 },
      }

      mockPrisma.label.findUnique.mockResolvedValue(null)
      mockPrisma.label.create.mockResolvedValue(mockCreatedLabel)

      const request = new Request('http://localhost:3000/api/labels', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Label',
          color: '#ff0000',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.name).toBe('New Label')
      expect(data.color).toBe('#ff0000')
      expect(mockPrisma.label.create).toHaveBeenCalledWith({
        data: {
          name: 'New Label',
          color: '#ff0000',
        },
        include: { _count: { select: { taskLabels: true } } },
      })
    })

    it('validates required name', async () => {
      const request = new Request('http://localhost:3000/api/labels', {
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
      const request = new Request('http://localhost:3000/api/labels', {
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

    it('validates maximum name length', async () => {
      const longName = 'a'.repeat(31)

      const request = new Request('http://localhost:3000/api/labels', {
        method: 'POST',
        body: JSON.stringify({
          name: longName,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('less than 30 characters')
    })

    it('validates color format', async () => {
      const request = new Request('http://localhost:3000/api/labels', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Label',
          color: 'invalid-color',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('valid hex color')
    })

    it('prevents duplicate label names', async () => {
      const existingLabel = {
        id: 1,
        name: 'Existing Label',
        color: '#ff0000',
      } as any

      mockPrisma.label.findUnique.mockResolvedValue(existingLabel)

      const request = new Request('http://localhost:3000/api/labels', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Existing Label',
          color: '#00ff00',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('Label with this name already exists')
    })
  })
})

describe('/api/labels/[id]', () => {
  describe('PUT /api/labels/[id]', () => {
    it('updates a label successfully', async () => {
      const existingLabel = {
        id: 1,
        name: 'Old Name',
        color: '#000000',
      }

      const updatedLabel = {
        ...existingLabel,
        name: 'New Name',
        color: '#ff0000',
        _count: { taskLabels: 3 },
      } as any

      mockPrisma.label.findUnique
        .mockResolvedValueOnce(existingLabel) // First call for existence check
        .mockResolvedValueOnce(null) // Second call for uniqueness check
      mockPrisma.label.update.mockResolvedValue(updatedLabel)

      const request = new Request('http://localhost:3000/api/labels/1', {
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

    it('returns 404 for non-existent label', async () => {
      mockPrisma.label.findUnique.mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/labels/999', {
        method: 'PUT',
        body: JSON.stringify({ name: 'New Name' }),
      })

      const response = await PUT(request, { params: { id: '999' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Label not found')
    })

    it('prevents duplicate names when updating', async () => {
      const existingLabel = {
        id: 1,
        name: 'Current Name',
        color: '#000000',
      }

      const conflictingLabel = {
        id: 2,
        name: 'Taken Name',
        color: '#ff0000',
      } as any

      mockPrisma.label.findUnique
        .mockResolvedValueOnce(existingLabel) // Existence check
        .mockResolvedValueOnce(conflictingLabel) // Uniqueness check

      const request = new Request('http://localhost:3000/api/labels/1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Taken Name' }),
      })

      const response = await PUT(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('Label with this name already exists')
    })

    it('allows updating to the same name', async () => {
      const existingLabel = {
        id: 1,
        name: 'Same Name',
        color: '#000000',
      }

      const updatedLabel = {
        ...existingLabel,
        color: '#ff0000',
        _count: { taskLabels: 1 },
      } as any

      mockPrisma.label.findUnique
        .mockResolvedValueOnce(existingLabel) // Existence check
        .mockResolvedValueOnce(null) // Uniqueness check (no conflict)
      mockPrisma.label.update.mockResolvedValue(updatedLabel)

      const request = new Request('http://localhost:3000/api/labels/1', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Same Name',
          color: '#ff0000',
        }),
      })

      const response = await PUT(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.name).toBe('Same Name')
    })

    it('validates name requirements', async () => {
      const existingLabel = {
        id: 1,
        name: 'Old Name',
      } as any

      mockPrisma.label.findUnique.mockResolvedValue(existingLabel)

      const request = new Request('http://localhost:3000/api/labels/1', {
        method: 'PUT',
        body: JSON.stringify({ name: '' }),
      })

      const response = await PUT(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('non-empty string')
    })
  })

  describe('DELETE /api/labels/[id]', () => {
    it('deletes a label successfully', async () => {
      const labelToDelete = {
        id: 1,
        name: 'Label to delete',
      } as any

      mockPrisma.label.findUnique.mockResolvedValue(labelToDelete)
      mockPrisma.label.delete.mockResolvedValue(labelToDelete)

      const request = new Request('http://localhost:3000/api/labels/1', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Label deleted successfully')
    })

    it('returns 404 for non-existent label', async () => {
      mockPrisma.label.findUnique.mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/labels/999', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: '999' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Label not found')
    })
  })
})