import { render, screen, fireEvent, waitFor } from '@/__tests__/test-utils'
import { SearchBar, fuzzySearch } from '../search-bar'

const defaultProps = {
  value: '',
  onChange: jest.fn(),
}

describe('SearchBar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders with default placeholder', () => {
    render(<SearchBar {...defaultProps} />)

    const input = screen.getByPlaceholderText('Search...')
    expect(input).toBeInTheDocument()
  })

  it('renders with custom placeholder', () => {
    render(<SearchBar {...defaultProps} placeholder="Find tasks..." />)

    expect(screen.getByPlaceholderText('Find tasks...')).toBeInTheDocument()
  })

  it('displays the current value', () => {
    render(<SearchBar {...defaultProps} value="test search" />)

    const input = screen.getByDisplayValue('test search')
    expect(input).toBeInTheDocument()
  })

  it('calls onChange when input value changes', () => {
    render(<SearchBar {...defaultProps} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'new search' } })

    expect(defaultProps.onChange).toHaveBeenCalledWith('new search')
  })

  it('shows clear button when there is a value', () => {
    render(<SearchBar {...defaultProps} value="test" />)

    const clearButton = screen.getByRole('button')
    expect(clearButton).toBeInTheDocument()
  })

  it('hides clear button when value is empty', () => {
    render(<SearchBar {...defaultProps} value="" />)

    const clearButton = screen.queryByRole('button')
    expect(clearButton).not.toBeInTheDocument()
  })

  it('clears value when clear button is clicked', () => {
    render(<SearchBar {...defaultProps} value="test" />)

    const clearButton = screen.getByRole('button')
    fireEvent.click(clearButton)

    expect(defaultProps.onChange).toHaveBeenCalledWith('')
  })

  it('applies focus styling when focused', () => {
    render(<SearchBar {...defaultProps} />)

    const input = screen.getByRole('textbox')
    fireEvent.focus(input)

    // Check if the input has the focus ring class
    expect(input).toHaveClass('ring-2')
  })

  it('removes focus styling when blurred', () => {
    render(<SearchBar {...defaultProps} />)

    const input = screen.getByRole('textbox')
    fireEvent.focus(input)
    fireEvent.blur(input)

    // Should not have focus ring after blur
    expect(input).not.toHaveClass('ring-2')
  })

  it('supports autoFocus prop', () => {
    render(<SearchBar {...defaultProps} autoFocus />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('autofocus')
  })

  it('applies custom className', () => {
    render(<SearchBar {...defaultProps} className="custom-class" />)

    const container = screen.getByRole('textbox').closest('div')
    expect(container).toHaveClass('custom-class')
  })

  it('hides clear button when showClearButton is false', () => {
    render(<SearchBar {...defaultProps} value="test" showClearButton={false} />)

    const clearButton = screen.queryByRole('button')
    expect(clearButton).not.toBeInTheDocument()
  })
})

describe('fuzzySearch', () => {
  const items = [
    { id: 1, name: 'Apple', description: 'A fruit' },
    { id: 2, name: 'Banana', description: 'Another fruit' },
    { id: 3, name: 'Carrot', description: 'A vegetable' },
    { id: 4, name: 'Pineapple', description: 'Tropical fruit' },
  ]

  it('returns all items when search term is empty', () => {
    const result = fuzzySearch(items, '', item => item.name)

    expect(result).toEqual(items)
  })

  it('returns exact matches with highest priority', () => {
    const result = fuzzySearch(items, 'Apple', item => item.name)

    expect(result[0]).toEqual(items[0])
  })

  it('returns items that start with search term', () => {
    const result = fuzzySearch(items, 'Ap', item => item.name)

    expect(result).toContain(items[0]) // Apple
    expect(result).toContain(items[3]) // Pineapple
  })

  it('returns items that contain search term', () => {
    const result = fuzzySearch(items, 'fruit', item => item.description)

    expect(result).toContain(items[0])
    expect(result).toContain(items[1])
    expect(result).toContain(items[3])
  })

  it('performs fuzzy matching for out-of-order characters', () => {
    const result = fuzzySearch(items, 'apl', item => item.name)

    expect(result).toContain(items[0]) // Apple contains a,p,l in order
  })

  it('returns items sorted by relevance score', () => {
    const result = fuzzySearch(items, 'a', item => item.name)

    // Apple should come first (starts with 'a')
    // Banana should come second (starts with 'a')
    // Carrot should come third (contains 'a')
    // Pineapple should come last (contains 'a' but lower score)
    expect(result[0].name).toBe('Apple')
    expect(result[1].name).toBe('Banana')
  })

  it('is case insensitive', () => {
    const result = fuzzySearch(items, 'APPLE', item => item.name)

    expect(result).toContain(items[0])
  })

  it('handles empty item list', () => {
    const result = fuzzySearch([], 'test', item => item.name)

    expect(result).toEqual([])
  })

  it('handles items with empty searchable text', () => {
    const itemsWithEmpty = [
      { id: 1, name: '', description: 'test' },
      { id: 2, name: 'test', description: '' },
    ]

    const result = fuzzySearch(itemsWithEmpty, 'test', item => item.name)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(2)
  })

  it('searches across multiple fields', () => {
    const result = fuzzySearch(items, 'fruit', item => `${item.name} ${item.description}`)

    expect(result).toHaveLength(3) // Apple, Banana, Pineapple
  })
})