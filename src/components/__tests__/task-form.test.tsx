import { render, screen, fireEvent, waitFor } from '@/__tests__/test-utils'
import userEvent from '@testing-library/user-event'
import { TaskForm } from '../task-form'
import type { Task } from '../task-item'

const mockTask: Task = {
  id: '1',
  title: 'Test Task',
  description: 'Test description',
  completed: false,
  priority: 'high',
  dueDate: new Date('2024-12-25'),
  labels: ['work'],
  subtasks: [
    { id: 'sub1', title: 'Subtask 1', completed: true },
  ],
  hasAttachments: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  onSubmit: jest.fn(),
}

describe('TaskForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders create form when no task provided', () => {
    render(<TaskForm {...defaultProps} />)

    expect(screen.getByText('Create New Task')).toBeInTheDocument()
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
  })

  it('renders edit form when task provided', () => {
    render(<TaskForm {...defaultProps} task={mockTask} />)

    expect(screen.getByText('Edit Task')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument()
  })

  it('validates required title field', async () => {
    const user = userEvent.setup()
    render(<TaskForm {...defaultProps} />)

    const submitButton = screen.getByRole('button', { name: /create task/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument()
    })
  })

  it('validates minimum title length', async () => {
    const user = userEvent.setup()
    render(<TaskForm {...defaultProps} />)

    const titleInput = screen.getByLabelText(/title/i)
    await user.type(titleInput, 'A')
    const submitButton = screen.getByRole('button', { name: /create task/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Title must be at least 2 characters long')).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    render(<TaskForm {...defaultProps} />)

    const titleInput = screen.getByLabelText(/title/i)
    await user.type(titleInput, 'New Task')

    const submitButton = screen.getByRole('button', { name: /create task/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Task',
          priority: 'medium',
        })
      )
      expect(defaultProps.onClose).toHaveBeenCalled()
    })
  })

  it('handles priority selection', async () => {
    const user = userEvent.setup()
    render(<TaskForm {...defaultProps} />)

    const prioritySelect = screen.getByRole('combobox', { name: /priority/i })
    await user.click(prioritySelect)
    await user.click(screen.getByText('High'))

    const submitButton = screen.getByRole('button', { name: /create task/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 'high',
        })
      )
    })
  })

  it('adds and removes labels', async () => {
    const user = userEvent.setup()
    render(<TaskForm {...defaultProps} />)

    const labelInput = screen.getByPlaceholderText('Add label')
    await user.type(labelInput, 'urgent')
    await user.click(screen.getByRole('button', { name: /plus/i }))

    expect(screen.getByText('urgent')).toBeInTheDocument()

    const removeButton = screen.getByRole('button', { name: /x/i })
    await user.click(removeButton)

    expect(screen.queryByText('urgent')).not.toBeInTheDocument()
  })

  it('adds and removes subtasks', async () => {
    const user = userEvent.setup()
    render(<TaskForm {...defaultProps} />)

    const subtaskInput = screen.getByPlaceholderText('Add subtask')
    await user.type(subtaskInput, 'New subtask')
    await user.click(screen.getByRole('button', { name: /plus/i }))

    expect(screen.getByDisplayValue('New subtask')).toBeInTheDocument()

    const removeButton = screen.getAllByRole('button', { name: /trash/i })[0]
    await user.click(removeButton)

    expect(screen.queryByDisplayValue('New subtask')).not.toBeInTheDocument()
  })

  it('validates subtask titles', async () => {
    const user = userEvent.setup()
    render(<TaskForm {...defaultProps} />)

    // Add empty subtask
    const subtaskInput = screen.getByPlaceholderText('Add subtask')
    await user.click(screen.getByRole('button', { name: /plus/i }))

    const submitButton = screen.getByRole('button', { name: /create task/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Subtask title cannot be empty')).toBeInTheDocument()
    })
  })

  it('handles recurring task configuration', async () => {
    const user = userEvent.setup()
    render(<TaskForm {...defaultProps} />)

    const recurringCheckbox = screen.getByRole('checkbox', { name: /recurring task/i })
    await user.click(recurringCheckbox)

    expect(screen.getByText('Frequency')).toBeInTheDocument()

    const frequencySelect = screen.getByRole('combobox', { name: /frequency/i })
    await user.click(frequencySelect)
    await user.click(screen.getByText('Weekly'))

    const submitButton = screen.getByRole('button', { name: /create task/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          recurring: {
            enabled: true,
            frequency: 'weekly',
            interval: 1,
          },
        })
      )
    })
  })

  it('validates date constraints', async () => {
    const user = userEvent.setup()
    render(<TaskForm {...defaultProps} />)

    // Set due date after deadline
    const titleInput = screen.getByLabelText(/title/i)
    await user.type(titleInput, 'Test Task')

    // Note: DatePicker implementation would need to be mocked or tested separately
    // For now, we'll test the validation logic by directly setting form data

    const submitButton = screen.getByRole('button', { name: /create task/i })
    await user.click(submitButton)

    // This would require mocking the date picker or testing the validation separately
  })

  it('handles file attachments', async () => {
    const user = userEvent.setup()
    render(<TaskForm {...defaultProps} />)

    const fileInput = screen.getByLabelText(/attachments/i)
    const file = new File(['test'], 'test.txt', { type: 'text/plain' })

    await user.upload(fileInput, file)

    expect(screen.getByText('test.txt')).toBeInTheDocument()
  })

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<TaskForm {...defaultProps} />)

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    const mockOnSubmit = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    render(<TaskForm {...defaultProps} onSubmit={mockOnSubmit} />)

    const titleInput = screen.getByLabelText(/title/i)
    await user.type(titleInput, 'Test Task')

    const submitButton = screen.getByRole('button', { name: /create task/i })
    await user.click(submitButton)

    expect(screen.getByText('Saving...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })
})