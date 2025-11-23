import { render, screen, fireEvent } from '@/__tests__/test-utils'
import { TaskItem } from '../task-item'
import type { Task } from '../task-item'

const mockTask: Task = {
  id: '1',
  title: 'Test Task',
  description: 'Test description',
  completed: false,
  priority: 'medium',
  labels: ['work', 'urgent'],
  subtasks: [
    { id: 'sub1', title: 'Subtask 1', completed: true },
    { id: 'sub2', title: 'Subtask 2', completed: false },
  ],
  hasAttachments: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const defaultProps = {
  task: mockTask,
  onToggleComplete: jest.fn(),
  onToggleSubtask: jest.fn(),
  onEdit: jest.fn(),
}

describe('TaskItem', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders task title and description', () => {
    render(<TaskItem {...defaultProps} />)

    expect(screen.getByText('Test Task')).toBeInTheDocument()
    expect(screen.getByText('Test description')).toBeInTheDocument()
  })

  it('shows priority with correct color and icon', () => {
    render(<TaskItem {...defaultProps} />)

    expect(screen.getByText('medium')).toBeInTheDocument()
    // Priority color class should be applied
    const priorityElement = screen.getByText('medium').closest('div')
    expect(priorityElement).toHaveClass('text-yellow-500')
  })

  it('displays labels correctly', () => {
    render(<TaskItem {...defaultProps} />)

    expect(screen.getByText('work')).toBeInTheDocument()
    expect(screen.getByText('urgent')).toBeInTheDocument()
  })

  it('shows subtask progress', () => {
    render(<TaskItem {...defaultProps} />)

    expect(screen.getByText('1/2')).toBeInTheDocument()
  })

  it('shows attachment indicator when hasAttachments is true', () => {
    render(<TaskItem {...defaultProps} />)

    const attachmentIcon = document.querySelector('svg.lucide-paperclip')
    expect(attachmentIcon).toBeInTheDocument()
  })

  it('calls onToggleComplete when checkbox is clicked', () => {
    render(<TaskItem {...defaultProps} />)

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    expect(defaultProps.onToggleComplete).toHaveBeenCalledWith('1')
  })

  it('calls onToggleSubtask when subtask checkbox is clicked', () => {
    render(<TaskItem {...defaultProps} />)

    const subtaskCheckboxes = screen.getAllByRole('checkbox')
    // First checkbox is main task, second is subtask
    fireEvent.click(subtaskCheckboxes[1])

    expect(defaultProps.onToggleSubtask).toHaveBeenCalledWith('1', 'sub1')
  })

  it('calls onEdit when edit button is clicked', () => {
    render(<TaskItem {...defaultProps} />)

    // Hover to show the edit button
    const taskItem = screen.getByText('Test Task').closest('div')
    fireEvent.mouseEnter(taskItem!)

    const editButton = screen.getByRole('button')
    fireEvent.click(editButton)

    expect(defaultProps.onEdit).toHaveBeenCalledWith('1')
  })

  it('applies completed styling when task is completed', () => {
    const completedTask = { ...mockTask, completed: true }
    render(<TaskItem {...defaultProps} task={completedTask} />)

    const title = screen.getByText('Test Task')
    expect(title).toHaveClass('line-through')
  })

  it('shows due date when present', () => {
    const taskWithDueDate = {
      ...mockTask,
      dueDate: new Date('2024-12-25')
    }
    render(<TaskItem {...defaultProps} task={taskWithDueDate} />)

    expect(screen.getByText('12/25/2024')).toBeInTheDocument()
  })

  it('limits displayed subtasks to 3 and shows overflow indicator', () => {
    const taskWithManySubtasks = {
      ...mockTask,
      subtasks: Array.from({ length: 5 }, (_, i) => ({
        id: `sub${i}`,
        title: `Subtask ${i}`,
        completed: false,
      }))
    }
    render(<TaskItem {...defaultProps} task={taskWithManySubtasks} />)

    expect(screen.getByText('+2 more subtasks')).toBeInTheDocument()
  })

  it('limits displayed labels to 2 and shows overflow indicator', () => {
    const taskWithManyLabels = {
      ...mockTask,
      labels: ['label1', 'label2', 'label3', 'label4']
    }
    render(<TaskItem {...defaultProps} task={taskWithManyLabels} />)

    expect(screen.getByText('+2')).toBeInTheDocument()
  })
})