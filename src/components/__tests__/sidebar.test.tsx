import { render, screen, fireEvent } from '@/__tests__/test-utils'
import { Sidebar } from '../sidebar'
import type { SidebarItem } from '../sidebar'

const mockLists: SidebarItem[] = [
  { id: '1', name: 'Work', count: 5, overdueCount: 2 },
  { id: '2', name: 'Personal', count: 3 },
]

const mockViews: SidebarItem[] = [
  { id: 'view1', name: 'All Tasks', count: 8 },
  { id: 'view2', name: 'Today', count: 2 },
]

const mockLabels: SidebarItem[] = [
  { id: 'label1', name: 'Urgent', count: 3, color: '#ff0000' },
  { id: 'label2', name: 'Important', count: 5, color: '#00ff00' },
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
  selectedListId: '1',
  selectedViewId: undefined,
  selectedLabelId: undefined,
  showCompleted: false,
  onToggleShowCompleted: jest.fn(),
  onCreateList: jest.fn(),
  onCreateLabel: jest.fn(),
}

describe('Sidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders all sections when not collapsed', () => {
    render(<Sidebar {...defaultProps} />)

    expect(screen.getByText('Lists')).toBeInTheDocument()
    expect(screen.getByText('Views')).toBeInTheDocument()
    expect(screen.getByText('Labels')).toBeInTheDocument()
  })

  it('renders lists with counts and overdue indicators', () => {
    render(<Sidebar {...defaultProps} />)

    expect(screen.getByText('Work')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('2')).toHaveClass('text-red-500')

    expect(screen.getByText('Personal')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('highlights selected list', () => {
    render(<Sidebar {...defaultProps} />)

    const workItem = screen.getByText('Work').closest('div')
    expect(workItem).toHaveClass('bg-accent')
  })

  it('calls onSelectList when list is clicked', () => {
    render(<Sidebar {...defaultProps} />)

    const personalItem = screen.getByText('Personal')
    fireEvent.click(personalItem)

    expect(defaultProps.onSelectList).toHaveBeenCalledWith('2')
  })

  it('renders views section', () => {
    render(<Sidebar {...defaultProps} />)

    expect(screen.getByText('All Tasks')).toBeInTheDocument()
    expect(screen.getByText('Today')).toBeInTheDocument()
  })

  it('calls onSelectView when view is clicked', () => {
    render(<Sidebar {...defaultProps} />)

    const todayView = screen.getByText('Today')
    fireEvent.click(todayView)

    expect(defaultProps.onSelectView).toHaveBeenCalledWith('view2')
  })

  it('shows completed toggle when view is selected', () => {
    render(<Sidebar {...defaultProps} selectedViewId="view1" />)

    expect(screen.getByText('Show completed')).toBeInTheDocument()
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('calls onToggleShowCompleted when switch is toggled', () => {
    render(<Sidebar {...defaultProps} selectedViewId="view1" />)

    const switchElement = screen.getByRole('switch')
    fireEvent.click(switchElement)

    expect(defaultProps.onToggleShowCompleted).toHaveBeenCalled()
  })

  it('renders labels with color indicators', () => {
    render(<Sidebar {...defaultProps} />)

    expect(screen.getByText('Urgent')).toBeInTheDocument()
    expect(screen.getByText('Important')).toBeInTheDocument()

    // Check for color indicators
    const colorIndicators = document.querySelectorAll('div[style*="background-color"]')
    expect(colorIndicators.length).toBeGreaterThan(0)
  })

  it('calls onSelectLabel when label is clicked', () => {
    render(<Sidebar {...defaultProps} />)

    const urgentLabel = screen.getByText('Urgent')
    fireEvent.click(urgentLabel)

    expect(defaultProps.onSelectLabel).toHaveBeenCalledWith('label1')
  })

  it('shows create buttons for lists and labels', () => {
    render(<Sidebar {...defaultProps} />)

    const createButtons = screen.getAllByRole('button', { name: /plus/i })
    expect(createButtons).toHaveLength(2) // One for lists, one for labels
  })

  it('calls onCreateList when create list button is clicked', () => {
    render(<Sidebar {...defaultProps} />)

    const createButtons = screen.getAllByRole('button', { name: /plus/i })
    fireEvent.click(createButtons[0]) // First create button is for lists

    expect(defaultProps.onCreateList).toHaveBeenCalled()
  })

  it('calls onCreateLabel when create label button is clicked', () => {
    render(<Sidebar {...defaultProps} />)

    const createButtons = screen.getAllByRole('button', { name: /plus/i })
    fireEvent.click(createButtons[1]) // Second create button is for labels

    expect(defaultProps.onCreateLabel).toHaveBeenCalled()
  })

  it('collapses sections when isCollapsed is true', () => {
    render(<Sidebar {...defaultProps} isCollapsed={true} />)

    expect(screen.queryByText('Lists')).not.toBeInTheDocument()
    expect(screen.queryByText('Work')).not.toBeInTheDocument()
    expect(screen.queryByText('Views')).not.toBeInTheDocument()
    expect(screen.queryByText('Labels')).not.toBeInTheDocument()
  })

  it('shows section icons when collapsed', () => {
    render(<Sidebar {...defaultProps} isCollapsed={true} />)

    // Should still show the section icons
    const icons = document.querySelectorAll('svg')
    expect(icons.length).toBeGreaterThan(0)
  })

  it('handles empty lists gracefully', () => {
    render(<Sidebar {...defaultProps} lists={[]} views={[]} labels={[]} />)

    expect(screen.getByText('Lists')).toBeInTheDocument()
    expect(screen.getByText('Views')).toBeInTheDocument()
    expect(screen.getByText('Labels')).toBeInTheDocument()
  })

  it('displays item counts correctly', () => {
    render(<Sidebar {...defaultProps} />)

    // Check that counts are displayed
    expect(screen.getByText('8')).toBeInTheDocument() // All Tasks count
    expect(screen.getByText('2')).toBeInTheDocument() // Today count
  })

  it('handles items with overdue counts', () => {
    render(<Sidebar {...defaultProps} />)

    // The overdue count should be styled differently
    const overdueElement = screen.getByText('2')
    expect(overdueElement).toHaveClass('text-red-500')
  })
})