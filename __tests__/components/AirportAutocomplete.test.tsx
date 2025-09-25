import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AirportAutocomplete from '@/components/AirportAutocomplete'

// Mock the airports data module
jest.mock('@/data/airports', () => ({
  searchAirports: jest.fn(),
  getAirportByCode: jest.fn(),
  formatAirportDisplay: jest.fn(),
}))

import { searchAirports, getAirportByCode, formatAirportDisplay } from '@/data/airports'

const mockSearchAirports = searchAirports as jest.MockedFunction<typeof searchAirports>
const mockGetAirportByCode = getAirportByCode as jest.MockedFunction<typeof getAirportByCode>
const mockFormatAirportDisplay = formatAirportDisplay as jest.MockedFunction<typeof formatAirportDisplay>

const mockAirports = [
  { code: 'LAX', city: 'Los Angeles', country: 'United States', name: 'Los Angeles International Airport' },
  { code: 'JFK', city: 'New York', country: 'United States', name: 'John F. Kennedy International Airport' },
  { code: 'CDG', city: 'Paris', country: 'France', name: 'Charles de Gaulle Airport' },
]

describe('AirportAutocomplete', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
    placeholder: 'Search airports...',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockFormatAirportDisplay.mockImplementation(
      (airport) => `${airport.city} (${airport.code})`
    )
  })

  it('renders input with default props', () => {
    render(<AirportAutocomplete {...defaultProps} />)
    
    const input = screen.getByPlaceholderText('Search airports...')
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue('')
  })

  it('renders with label when provided', () => {
    render(<AirportAutocomplete {...defaultProps} label="Departure Airport" />)
    
    expect(screen.getByText('Departure Airport')).toBeInTheDocument()
  })

  it('renders with required attribute when specified', () => {
    render(<AirportAutocomplete {...defaultProps} required />)
    
    const input = screen.getByPlaceholderText('Search airports...')
    expect(input).toBeRequired()
  })

  it('renders as disabled when specified', () => {
    render(<AirportAutocomplete {...defaultProps} disabled />)
    
    const input = screen.getByPlaceholderText('Search airports...')
    expect(input).toBeDisabled()
  })

  it('shows suggestions when typing', async () => {
    mockSearchAirports.mockReturnValue(mockAirports.slice(0, 2))
    
    render(<AirportAutocomplete {...defaultProps} />)
    
    const input = screen.getByPlaceholderText('Search airports...')
    await userEvent.type(input, 'Los')

    expect(mockSearchAirports).toHaveBeenCalledWith('Los')
    expect(defaultProps.onChange).toHaveBeenCalledWith('Los')
    
    await waitFor(() => {
      expect(screen.getByText('Los Angeles (LAX)')).toBeInTheDocument()
      expect(screen.getByText('United States')).toBeInTheDocument()
    })
  })

  it('handles suggestion selection with mouse click', async () => {
    mockSearchAirports.mockReturnValue([mockAirports[0]])
    
    render(<AirportAutocomplete {...defaultProps} />)
    
    const input = screen.getByPlaceholderText('Search airports...')
    await userEvent.type(input, 'Los')

    await waitFor(() => {
      expect(screen.getByText('Los Angeles (LAX)')).toBeInTheDocument()
    })

    const suggestion = screen.getByText('Los Angeles (LAX)')
    fireEvent.click(suggestion)

    expect(mockFormatAirportDisplay).toHaveBeenCalledWith(mockAirports[0])
    expect(defaultProps.onChange).toHaveBeenCalledWith('Los Angeles (LAX)')
  })

  it('handles keyboard navigation through suggestions', async () => {
    mockSearchAirports.mockReturnValue(mockAirports.slice(0, 3))
    
    render(<AirportAutocomplete {...defaultProps} />)
    
    const input = screen.getByPlaceholderText('Search airports...')
    await userEvent.type(input, 'a')

    await waitFor(() => {
      expect(screen.getByText('Los Angeles (LAX)')).toBeInTheDocument()
    })

    // Test ArrowDown navigation
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    
    // Test Enter selection
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(mockFormatAirportDisplay).toHaveBeenCalledWith(mockAirports[1])
  })

  it('handles ArrowUp navigation', async () => {
    mockSearchAirports.mockReturnValue(mockAirports.slice(0, 3))
    
    render(<AirportAutocomplete {...defaultProps} />)
    
    const input = screen.getByPlaceholderText('Search airports...')
    await userEvent.type(input, 'a')

    await waitFor(() => {
      expect(screen.getByText('Los Angeles (LAX)')).toBeInTheDocument()
    })

    // Navigate down then up
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    
    // Select with Enter
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(mockFormatAirportDisplay).toHaveBeenCalledWith(mockAirports[0])
  })

  it('closes suggestions on Escape key', async () => {
    mockSearchAirports.mockReturnValue([mockAirports[0]])
    
    render(<AirportAutocomplete {...defaultProps} />)
    
    const input = screen.getByPlaceholderText('Search airports...')
    await userEvent.type(input, 'Los')

    await waitFor(() => {
      expect(screen.getByText('Los Angeles (LAX)')).toBeInTheDocument()
    })

    fireEvent.keyDown(input, { key: 'Escape' })

    await waitFor(() => {
      expect(screen.queryByText('Los Angeles (LAX)')).not.toBeInTheDocument()
    })
  })

  it('closes suggestions when clicking outside', async () => {
    mockSearchAirports.mockReturnValue([mockAirports[0]])
    
    render(
      <div>
        <AirportAutocomplete {...defaultProps} />
        <div data-testid="outside">Outside element</div>
      </div>
    )
    
    const input = screen.getByPlaceholderText('Search airports...')
    await userEvent.type(input, 'Los')

    await waitFor(() => {
      expect(screen.getByText('Los Angeles (LAX)')).toBeInTheDocument()
    })

    const outside = screen.getByTestId('outside')
    fireEvent.mouseDown(outside)

    await waitFor(() => {
      expect(screen.queryByText('Los Angeles (LAX)')).not.toBeInTheDocument()
    })
  })

  it('auto-fills when 3-letter airport code is entered', async () => {
    mockGetAirportByCode.mockReturnValue(mockAirports[0])
    
    const onChange = jest.fn()
    render(<AirportAutocomplete {...defaultProps} onChange={onChange} />)
    
    const input = screen.getByPlaceholderText('Search airports...')
    await userEvent.type(input, 'LAX')

    await waitFor(() => {
      expect(mockGetAirportByCode).toHaveBeenCalledWith('LAX')
      expect(mockFormatAirportDisplay).toHaveBeenCalledWith(mockAirports[0])
    })
  })

  it('does not show suggestions for empty input', async () => {
    render(<AirportAutocomplete {...defaultProps} />)
    
    const input = screen.getByPlaceholderText('Search airports...')
    fireEvent.focus(input)

    expect(mockSearchAirports).not.toHaveBeenCalled()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('does not show suggestions for very short input', async () => {
    render(<AirportAutocomplete {...defaultProps} />)
    
    const input = screen.getByPlaceholderText('Search airports...')
    await userEvent.type(input, 'a')
    await userEvent.clear(input)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows suggestions again on focus if they exist', async () => {
    mockSearchAirports.mockReturnValue([mockAirports[0]])
    
    render(<AirportAutocomplete {...defaultProps} />)
    
    const input = screen.getByPlaceholderText('Search airports...')
    await userEvent.type(input, 'Los')

    await waitFor(() => {
      expect(screen.getByText('Los Angeles (LAX)')).toBeInTheDocument()
    })

    // Click outside to close
    fireEvent.mouseDown(document.body)
    
    await waitFor(() => {
      expect(screen.queryByText('Los Angeles (LAX)')).not.toBeInTheDocument()
    })

    // Focus again
    fireEvent.focus(input)

    await waitFor(() => {
      expect(screen.getByText('Los Angeles (LAX)')).toBeInTheDocument()
    })
  })

  it('highlights selected suggestion with keyboard navigation', async () => {
    mockSearchAirports.mockReturnValue(mockAirports.slice(0, 2))
    
    render(<AirportAutocomplete {...defaultProps} />)
    
    const input = screen.getByPlaceholderText('Search airports...')
    await userEvent.type(input, 'a')

    await waitFor(() => {
      expect(screen.getByText('Los Angeles (LAX)')).toBeInTheDocument()
    })

    fireEvent.keyDown(input, { key: 'ArrowDown' })

    const firstSuggestion = screen.getByText('Los Angeles (LAX)').closest('button')
    expect(firstSuggestion).toHaveClass('bg-blue-50')
  })

  it('applies custom className', () => {
    render(<AirportAutocomplete {...defaultProps} className="custom-class" />)
    
    const container = screen.getByPlaceholderText('Search airports...').closest('div')
    expect(container).toHaveClass('custom-class')
  })

  it('handles invalid airport code correctly', async () => {
    mockGetAirportByCode.mockReturnValue(null)
    
    const onChange = jest.fn()
    render(<AirportAutocomplete {...defaultProps} onChange={onChange} />)
    
    const input = screen.getByPlaceholderText('Search airports...')
    await userEvent.type(input, 'XYZ')

    expect(mockGetAirportByCode).toHaveBeenCalledWith('XYZ')
    // Should not auto-fill for invalid codes
    expect(mockFormatAirportDisplay).not.toHaveBeenCalled()
  })
})

