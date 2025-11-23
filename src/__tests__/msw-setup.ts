import { setupServer } from 'msw/node'
import { rest } from 'msw'

// Mock API responses for integration tests
export const server = setupServer(
  // Tasks API
  rest.get('/api/tasks', (req, res, ctx) => {
    return res(ctx.json([
      {
        id: '1',
        title: 'Test Task',
        description: 'Test description',
        completed: false,
        priority: 'medium',
        labels: ['work'],
        subtasks: [],
        hasAttachments: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ]))
  }),

  rest.post('/api/tasks', (req, res, ctx) => {
    return res(ctx.json({
      id: '2',
      title: 'New Task',
      description: '',
      completed: false,
      priority: 'medium',
      labels: [],
      subtasks: [],
      hasAttachments: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  }),

  // Lists API
  rest.get('/api/lists', (req, res, ctx) => {
    return res(ctx.json([
      {
        id: '1',
        name: 'Work',
        color: '#ff0000',
        taskCount: 5,
        overdueCount: 2,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]))
  }),

  // Labels API
  rest.get('/api/labels', (req, res, ctx) => {
    return res(ctx.json([
      {
        id: '1',
        name: 'Urgent',
        color: '#ff0000',
        taskCount: 3,
        createdAt: new Date(),
      },
    ]))
  }),
)

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset handlers after each test
afterEach(() => server.resetHandlers())

// Close server after all tests
afterAll(() => server.close())