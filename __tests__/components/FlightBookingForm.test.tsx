import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FlightBookingForm from '@/components/FlightBookingForm'

// Mock fetch
global.fetch = jest.fn()

const mockFlight = {
  id: 'flight-123',
  price: {
    total: '1200.00',
    currency: 'USD'
  },
  itineraries: [{
    segments: [{
      departure: {
        iataCode: 'LAX',
        at: '2024-12-01T10:00:00'
      },
      arrival: {
        iataCode: 'JFK',
        at: '2024-12-01T18:00:00'
      }
    }]
  }]
}

const mockProps = {
  flight: mockFlight,
  onBookingComplete: jest.fn(),
  onCancel: jest.fn(),
}

describe('FlightBookingForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('renders flight summary correctly', () => {
    render(<FlightBookingForm {...mockProps} />)
    
    expect(screen.getByText('Book Flight')).toBeInTheDocument()
    expect(screen.getByText('Flight Summary')).toBeInTheDocument()
    expect(screen.getByText('LAX')).toBeInTheDocument()
    expect(screen.getByText('JFK')).toBeInTheDocument()
    expect(screen.getByText('$1200.00 USD')).toBeInTheDocument()
  })

  it('renders passenger form with required fields', () => {
    render(<FlightBookingForm {...mockProps} />)
    
    expect(screen.getByText('Passenger 1')).toBeInTheDocument()
    expect(screen.getByLabelText('First Name *')).toBeInTheDocument()
    expect(screen.getByLabelText('Last Name *')).toBeInTheDocument()
    expect(screen.getByLabelText('Date of Birth *')).toBeInTheDocument()
    expect(screen.getByLabelText('Gender *')).toBeInTheDocument()
    expect(screen.getByLabelText('Email *')).toBeInTheDocument()
    expect(screen.getByLabelText('Phone *')).toBeInTheDocument()
    expect(screen.getByLabelText('Passport Number *')).toBeInTheDocument()
    expect(screen.getByLabelText('Passport Expiry *')).toBeInTheDocument()
    expect(screen.getByLabelText('Passport Country *')).toBeInTheDocument()
  })

  it('allows adding additional passengers', async () => {
    render(<FlightBookingForm {...mockProps} />)
    
    const addButton = screen.getByText('+ Add Another Passenger')
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(screen.getByText('Passenger 2')).toBeInTheDocument()
    })
  })

  it('allows removing passengers when more than one exists', async () => {
    render(<FlightBookingForm {...mockProps} />)
    
    // Add a passenger first
    const addButton = screen.getByText('+ Add Another Passenger')
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(screen.getByText('Passenger 2')).toBeInTheDocument()
    })

    // Now remove button should be available
    const removeButton = screen.getAllByText('Remove')[0]
    fireEvent.click(removeButton)

    await waitFor(() => {
      expect(screen.queryByText('Passenger 2')).not.toBeInTheDocument()
    })
  })

  it('does not show remove button for single passenger', () => {
    render(<FlightBookingForm {...mockProps} />)
    
    expect(screen.queryByText('Remove')).not.toBeInTheDocument()
  })

  it('updates passenger information when typing', async () => {
    render(<FlightBookingForm {...mockProps} />)
    
    const firstNameInput = screen.getByLabelText('First Name *')
    await userEvent.type(firstNameInput, 'John')

    expect(firstNameInput).toHaveValue('John')
  })

  it('shows validation error when submitting incomplete form', async () => {
    render(<FlightBookingForm {...mockProps} />)
    
    const submitButton = screen.getByRole('button', { name: /Confirm Booking/ })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument()
    })
  })

  it('submits form successfully when all fields are filled', async () => {
    const mockResponse = {
      success: true,
      booking: {
        id: 'booking-123',
        status: 'CONFIRMED'
      }
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockResponse,
    })

    render(<FlightBookingForm {...mockProps} />)
    
    // Fill in all required fields
    await userEvent.type(screen.getByLabelText('First Name *'), 'John')
    await userEvent.type(screen.getByLabelText('Last Name *'), 'Doe')
    await userEvent.type(screen.getByLabelText('Date of Birth *'), '1990-01-01')
    await userEvent.type(screen.getByLabelText('Email *'), 'john@example.com')
    await userEvent.type(screen.getByLabelText('Phone *'), '1234567890')
    await userEvent.type(screen.getByLabelText('Passport Number *'), 'ABC123456')
    await userEvent.type(screen.getByLabelText('Passport Expiry *'), '2030-01-01')
    await userEvent.type(screen.getByLabelText('Passport Country *'), 'USA')

    const submitButton = screen.getByRole('button', { name: /Confirm Booking/ })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/flights/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('John'),
      })
    })

    await waitFor(() => {
      expect(mockProps.onBookingComplete).toHaveBeenCalledWith(mockResponse.booking)
    })
  })

  it('shows error message when booking fails', async () => {
    const mockResponse = {
      success: false,
      error: 'Booking failed due to seat unavailability'
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockResponse,
    })

    render(<FlightBookingForm {...mockProps} />)
    
    // Fill in all required fields
    await userEvent.type(screen.getByLabelText('First Name *'), 'John')
    await userEvent.type(screen.getByLabelText('Last Name *'), 'Doe')
    await userEvent.type(screen.getByLabelText('Date of Birth *'), '1990-01-01')
    await userEvent.type(screen.getByLabelText('Email *'), 'john@example.com')
    await userEvent.type(screen.getByLabelText('Phone *'), '1234567890')
    await userEvent.type(screen.getByLabelText('Passport Number *'), 'ABC123456')
    await userEvent.type(screen.getByLabelText('Passport Expiry *'), '2030-01-01')
    await userEvent.type(screen.getByLabelText('Passport Country *'), 'USA')

    const submitButton = screen.getByRole('button', { name: /Confirm Booking/ })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Booking failed due to seat unavailability')).toBeInTheDocument()
    })
  })

  it('shows loading state during submission', async () => {
    // Mock a delayed response
    ;(global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({
        json: async () => ({ success: true, booking: {} })
      }), 100))
    )

    render(<FlightBookingForm {...mockProps} />)
    
    // Fill in all required fields
    await userEvent.type(screen.getByLabelText('First Name *'), 'John')
    await userEvent.type(screen.getByLabelText('Last Name *'), 'Doe')
    await userEvent.type(screen.getByLabelText('Date of Birth *'), '1990-01-01')
    await userEvent.type(screen.getByLabelText('Email *'), 'john@example.com')
    await userEvent.type(screen.getByLabelText('Phone *'), '1234567890')
    await userEvent.type(screen.getByLabelText('Passport Number *'), 'ABC123456')
    await userEvent.type(screen.getByLabelText('Passport Expiry *'), '2030-01-01')
    await userEvent.type(screen.getByLabelText('Passport Country *'), 'USA')

    const submitButton = screen.getByRole('button', { name: /Confirm Booking/ })
    fireEvent.click(submitButton)

    // Check for loading spinner
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByRole('button').querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('shows success screen after successful booking', async () => {
    const mockResponse = {
      success: true,
      booking: {
        id: 'booking-123',
        status: 'CONFIRMED'
      }
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockResponse,
    })

    render(<FlightBookingForm {...mockProps} />)
    
    // Fill in all required fields
    await userEvent.type(screen.getByLabelText('First Name *'), 'John')
    await userEvent.type(screen.getByLabelText('Last Name *'), 'Doe')
    await userEvent.type(screen.getByLabelText('Date of Birth *'), '1990-01-01')
    await userEvent.type(screen.getByLabelText('Email *'), 'john@example.com')
    await userEvent.type(screen.getByLabelText('Phone *'), '1234567890')
    await userEvent.type(screen.getByLabelText('Passport Number *'), 'ABC123456')
    await userEvent.type(screen.getByLabelText('Passport Expiry *'), '2030-01-01')
    await userEvent.type(screen.getByLabelText('Passport Country *'), 'USA')

    const submitButton = screen.getByRole('button', { name: /Confirm Booking/ })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Booking Confirmed!')).toBeInTheDocument()
      expect(screen.getByText('Your flight has been successfully booked.')).toBeInTheDocument()
      expect(screen.getByText('booking-123')).toBeInTheDocument()
      expect(screen.getByText('CONFIRMED')).toBeInTheDocument()
    })
  })

  it('handles network errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    render(<FlightBookingForm {...mockProps} />)
    
    // Fill in all required fields
    await userEvent.type(screen.getByLabelText('First Name *'), 'John')
    await userEvent.type(screen.getByLabelText('Last Name *'), 'Doe')
    await userEvent.type(screen.getByLabelText('Date of Birth *'), '1990-01-01')
    await userEvent.type(screen.getByLabelText('Email *'), 'john@example.com')
    await userEvent.type(screen.getByLabelText('Phone *'), '1234567890')
    await userEvent.type(screen.getByLabelText('Passport Number *'), 'ABC123456')
    await userEvent.type(screen.getByLabelText('Passport Expiry *'), '2030-01-01')
    await userEvent.type(screen.getByLabelText('Passport Country *'), 'USA')

    const submitButton = screen.getByRole('button', { name: /Confirm Booking/ })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Failed to process booking')).toBeInTheDocument()
    })
  })

  it('calls onCancel when cancel button is clicked', () => {
    render(<FlightBookingForm {...mockProps} />)
    
    const cancelButton = screen.getByText('✕')
    fireEvent.click(cancelButton)

    expect(mockProps.onCancel).toHaveBeenCalled()
  })

  it('handles gender selection correctly', async () => {
    render(<FlightBookingForm {...mockProps} />)
    
    const genderSelect = screen.getByLabelText('Gender *')
    await userEvent.selectOptions(genderSelect, 'FEMALE')

    expect(genderSelect).toHaveValue('FEMALE')
  })

  it('formats date correctly in flight summary', () => {
    render(<FlightBookingForm {...mockProps} />)
    
    // Check that date is formatted (exact format may vary based on locale)
    expect(screen.getByText('12/1/2024')).toBeInTheDocument()
  })
})

