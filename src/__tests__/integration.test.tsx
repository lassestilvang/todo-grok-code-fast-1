import { render, screen, fireEvent, waitFor } from './test-utils'
import userEvent from '@testing-library/user-event'
import { TaskForm } from '../components/task-form'
import { SearchBar } from '../components/search-bar'
import { Sidebar } from '../components/sidebar'
import { TaskItem } from '../components/task-item'
import type { Task, SidebarItem } from '../components/task-item'

// Mock fetch for integration tests
global.fetch = jest.fn()

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Task Creation Flow', () => {
    it('allows creating a task through the form', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = jest.fn()
      const mockOnClose = jest.fn()

      // Mock the API call
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: '1',
          title: 'Integration Test Task',
          description: 'Created through integration test',
          completed: false,
          priority: 'high',
          labels: ['integration'],
          subtasks: [],
          hasAttachments: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      })

      render(
        <TaskForm
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      // Fill out the form
      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, 'Integration Test Task')

      const descriptionTextarea = screen.getByLabelText(/description/i)
      await user.type(descriptionTextarea, 'Created through integration test')

      // Select priority
      const prioritySelect = screen.getByRole('combobox', { name: /priority/i })
      await user.click(prioritySelect)
      await user.click(screen.getByText('High'))

      // Add a label
      const labelInput = screen.getByPlaceholderText('Add label')
      await user.type(labelInput, 'integration')
      await user.click(screen.getByRole('button', { name: /plus/i }))

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create task/i })
      await user.click(submitButton)

      // Verify the form was submitted
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Integration Test Task',
            description: 'Created through integration test',
            priority: 'high',
            labels: ['integration'],
          })
        )
        expect(mockOnClose).toHaveBeenCalled()
      })
    })
  })

  describe('Search and Filter Flow', () => {
    it('allows searching through tasks', async () => {
      const user = userEvent.setup()
      const mockOnChange = jest.fn()

      render(
        <SearchBar
          value=""
          onChange={mockOnChange}
        />
      )

      const searchInput = screen.getByRole('textbox')
      await user.type(searchInput, 'test search')

      expect(mockOnChange).toHaveBeenCalledWith('test search')
    })

    it('shows clear button and clears search', async () => {
      const user = userEvent.setup()
      const mockOnChange = jest.fn()

      render(
        <SearchBar
          value="existing search"
          onChange={mockOnChange}
        />
      )

      const clearButton = screen.getByRole('button')
      await user.click(clearButton)

      expect(mockOnChange).toHaveBeenCalledWith('')
    })
  })

  describe('Sidebar Navigation Flow', () => {
    const mockLists: SidebarItem[] = [
      { id: '1', name: 'Work', count: 5 },
      { id: '2', name: 'Personal', count: 3 },
    ]

    const mockViews: SidebarItem[] = [
      { id: 'view1', name: 'All Tasks', count: 8 },
      { id: 'view2', name: 'Today', count: 2 },
    ]

    const mockLabels: SidebarItem[] = [
      { id: 'label1', name: 'Urgent', count: 3, color: '#ff0000' },
    ]

    const defaultProps = {
      lists: mockLists,
      views: mockViews,
      labels: mockLabels,
      isCollapsed: false,
      onToggleCollapse: jest.fn(),
      onSelectList: jest.fn(),
      onSelectView: jest.fn(),
      onSelectLabel: jest.fn(),
      selectedListId: undefined,
      selectedViewId: 'view1',
      selectedLabelId: undefined,
      showCompleted: true,
      onToggleShowCompleted: jest.fn(),
      onCreateList: jest.fn(),
      onCreateLabel: jest.fn(),
    }

    it('allows selecting different views and toggling completed tasks', async () => {
      const user = userEvent.setup()

      render(<Sidebar {...defaultProps} />)

      // Check that "Show completed" switch is visible when view is selected
      expect(screen.getByText('Show completed')).toBeInTheDocument()

      const switchElement = screen.getByRole('switch')
      expect(switchElement).toBeChecked() // showCompleted is true

      await user.click(switchElement)

      expect(defaultProps.onToggleShowCompleted).toHaveBeenCalled()
    })

    it('allows selecting lists and labels', async () => {
      const user = userEvent.setup()

      render(<Sidebar {...defaultProps} />)

      // Select a list
      const workList = screen.getByText('Work')
      await user.click(workList)

      expect(defaultProps.onSelectList).toHaveBeenCalledWith('1')

      // Select a label
      const urgentLabel = screen.getByText('Urgent')
      await user.click(urgentLabel)

      expect(defaultProps.onSelectLabel).toHaveBeenCalledWith('label1')
    })
  })

  describe('Task Interaction Flow', () => {
    const mockTask: Task = {
      id: '1',
      title: 'Interactive Task',
      description: 'Test task interactions',
      completed: false,
      priority: 'high',
      labels: ['urgent'],
      subtasks: [
        { id: 'sub1', title: 'Subtask 1', completed: false },
        { id: 'sub2', title: 'Subtask 2', completed: true },
      ],
      hasAttachments: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }

    it('allows toggling task completion and subtasks', async () => {
      const user = userEvent.setup()
      const mockOnToggleComplete = jest.fn()
      const mockOnToggleSubtask = jest.fn()

      render(
        <TaskItem
          task={mockTask}
          onToggleComplete={mockOnToggleComplete}
          onToggleSubtask={mockOnToggleSubtask}
          onEdit={jest.fn()}
        />
      )

      // Toggle main task completion
      const mainCheckbox = screen.getAllByRole('checkbox')[0]
      await user.click(mainCheckbox)

      expect(mockOnToggleComplete).toHaveBeenCalledWith('1')

      // Toggle subtask completion
      const subtaskCheckboxes = screen.getAllByRole('checkbox').slice(1)
      await user.click(subtaskCheckboxes[0])

      expect(mockOnToggleSubtask).toHaveBeenCalledWith('1', 'sub1')
    })

    it('shows task metadata correctly', () => {
      render(
        <TaskItem
          task={mockTask}
          onToggleComplete={jest.fn()}
          onToggleSubtask={jest.fn()}
          onEdit={jest.fn()}
        />
      )

      // Check priority display
      expect(screen.getByText('high')).toBeInTheDocument()

      // Check labels
      expect(screen.getByText('urgent')).toBeInTheDocument()

      // Check subtask progress
      expect(screen.getByText('1/2')).toBeInTheDocument()

      // Check attachment indicator
      const attachmentIcon = document.querySelector('svg.lucide-paperclip')
      expect(attachmentIcon).toBeInTheDocument()
    })
  })
})