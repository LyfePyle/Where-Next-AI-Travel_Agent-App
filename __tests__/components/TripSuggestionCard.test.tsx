import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TripSuggestionCard from '@/components/TripSuggestionCard'
import { TripSuggestion } from '@/types/trips'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock navigator.share and clipboard
Object.defineProperty(navigator, 'share', {
  value: jest.fn(),
  writable: true,
})

Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(),
  },
  writable: true,
})

// Mock sessionStorage and localStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

const mockLocalStorage = {
  getItem: jest.fn(() => JSON.stringify([])),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
})

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

// Mock alert
window.alert = jest.fn()

const mockTrip: TripSuggestion = {
  id: 'test-trip-1',
  destination: 'Paris',
  country: 'France',
  summary: 'Experience the city of love with amazing cuisine and art.',
  highlights: ['Eiffel Tower', 'Louvre Museum', 'French Cuisine'],
  estTotalUSD: 2500,
  estFlightUSD: 800,
  estStayUSD: 1200,
  estActivitiesUSD: 500,
  planningMode: 'balanced',
  travelTime: '9 hours',
  bestTimeToVisit: 'Spring',
  weatherShort: 'Mild and pleasant',
  avgTempC: 18,
  imageUrl: 'https://example.com/paris.jpg',
}

describe('TripSuggestionCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders trip information correctly', () => {
    render(<TripSuggestionCard trip={mockTrip} />)
    
    expect(screen.getByText('Paris, France')).toBeInTheDocument()
    expect(screen.getByText('9 hours • Best: Spring')).toBeInTheDocument()
    expect(screen.getByText('Mild and pleasant')).toBeInTheDocument()
    expect(screen.getByText('• 18°C')).toBeInTheDocument()
    expect(screen.getByText('Experience the city of love with amazing cuisine and art.')).toBeInTheDocument()
    expect(screen.getByText('$2,500')).toBeInTheDocument()
  })

  it('displays highlights correctly', () => {
    render(<TripSuggestionCard trip={mockTrip} />)
    
    expect(screen.getByText('Eiffel Tower')).toBeInTheDocument()
    expect(screen.getByText('Louvre Museum')).toBeInTheDocument()
    expect(screen.getByText('French Cuisine')).toBeInTheDocument()
  })

  it('shows cost breakdown', () => {
    render(<TripSuggestionCard trip={mockTrip} />)
    
    expect(screen.getByText('$800')).toBeInTheDocument() // Flight cost
    expect(screen.getByText('$1,200')).toBeInTheDocument() // Hotel cost
    expect(screen.getByText('$500')).toBeInTheDocument() // Activities cost
  })

  it('displays planning mode with correct icon', () => {
    render(<TripSuggestionCard trip={mockTrip} />)
    
    expect(screen.getByText('✨ balanced')).toBeInTheDocument()
  })

  it('displays weather icon correctly', () => {
    const sunnyTrip = { ...mockTrip, weatherShort: 'Sunny and warm' }
    render(<TripSuggestionCard trip={sunnyTrip} />)
    
    expect(screen.getByText('☀️')).toBeInTheDocument()
  })

  it('handles show itinerary button click', async () => {
    render(<TripSuggestionCard trip={mockTrip} />)
    
    const itineraryButton = screen.getByText('Show Full Itinerary')
    fireEvent.click(itineraryButton)

    await waitFor(() => {
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'selectedTrip',
        JSON.stringify(mockTrip)
      )
      expect(mockPush).toHaveBeenCalledWith('/itinerary/test-trip-1')
    })
  })

  it('handles save button with default behavior', () => {
    render(<TripSuggestionCard trip={mockTrip} />)
    
    const saveButton = screen.getByTitle('Save this trip')
    fireEvent.click(saveButton)

    expect(mockLocalStorage.setItem).toHaveBeenCalled()
    expect(window.alert).toHaveBeenCalledWith('Trip saved successfully!')
  })

  it('handles save button with custom onSave callback', () => {
    const mockOnSave = jest.fn()
    render(<TripSuggestionCard trip={mockTrip} onSave={mockOnSave} />)
    
    const saveButton = screen.getByTitle('Save this trip')
    fireEvent.click(saveButton)

    expect(mockOnSave).toHaveBeenCalledWith(mockTrip)
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
  })

  it('handles share button with Web Share API', async () => {
    const mockShare = jest.fn().mockResolvedValue(undefined)
    navigator.share = mockShare

    render(<TripSuggestionCard trip={mockTrip} />)
    
    const shareButton = screen.getByTitle('Share this trip')
    fireEvent.click(shareButton)

    expect(mockShare).toHaveBeenCalledWith({
      title: 'Trip to Paris',
      text: 'Check out this amazing trip to Paris, France! Estimated cost: $2,500',
      url: expect.any(String),
    })
  })

  it('handles share button fallback to clipboard', async () => {
    // Mock absence of Web Share API
    navigator.share = undefined
    const mockWriteText = jest.fn().mockResolvedValue(undefined)
    navigator.clipboard.writeText = mockWriteText

    render(<TripSuggestionCard trip={mockTrip} />)
    
    const shareButton = screen.getByTitle('Share this trip')
    fireEvent.click(shareButton)

    expect(mockWriteText).toHaveBeenCalledWith(
      'Check out this amazing trip to Paris, France! Estimated cost: $2,500'
    )
    expect(window.alert).toHaveBeenCalledWith('Trip details copied to clipboard!')
  })

  it('handles custom share callback', () => {
    const mockOnShare = jest.fn()
    render(<TripSuggestionCard trip={mockTrip} onShare={mockOnShare} />)
    
    const shareButton = screen.getByTitle('Share this trip')
    fireEvent.click(shareButton)

    expect(mockOnShare).toHaveBeenCalledWith(mockTrip)
  })

  it('shows loading state when navigating to itinerary', async () => {
    render(<TripSuggestionCard trip={mockTrip} />)
    
    const itineraryButton = screen.getByText('Show Full Itinerary')
    fireEvent.click(itineraryButton)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders fallback image when no imageUrl provided', () => {
    const tripNoImage = { ...mockTrip, imageUrl: undefined }
    render(<TripSuggestionCard trip={tripNoImage} />)
    
    expect(screen.getByText('✈️')).toBeInTheDocument()
  })

  it('shows correct planning mode icons', () => {
    const testCases = [
      { mode: 'cheapest', expectedIcon: '💰' },
      { mode: 'fastest', expectedIcon: '⚡' },
      { mode: 'easiest', expectedIcon: '😌' },
      { mode: 'custom', expectedIcon: '✨' },
    ]

    testCases.forEach(({ mode, expectedIcon }) => {
      const tripWithMode = { ...mockTrip, planningMode: mode }
      const { unmount } = render(<TripSuggestionCard trip={tripWithMode} />)
      
      expect(screen.getByText(`${expectedIcon} ${mode}`)).toBeInTheDocument()
      
      unmount()
    })
  })

  it('shows correct weather icons', () => {
    const weatherTests = [
      { weather: 'Sunny and warm', expectedIcon: '☀️' },
      { weather: 'Rainy weather', expectedIcon: '🌧️' },
      { weather: 'Snow expected', expectedIcon: '❄️' },
      { weather: 'Cloudy skies', expectedIcon: '☁️' },
      { weather: 'Unknown weather', expectedIcon: '🌤️' },
    ]

    weatherTests.forEach(({ weather, expectedIcon }) => {
      const tripWithWeather = { ...mockTrip, weatherShort: weather }
      const { unmount } = render(<TripSuggestionCard trip={tripWithWeather} />)
      
      expect(screen.getByText(expectedIcon)).toBeInTheDocument()
      
      unmount()
    })
  })
})

