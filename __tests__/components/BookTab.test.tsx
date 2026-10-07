import { render, screen, waitFor } from '@testing-library/react';
import BookTab from '@/components/trip-hub/BookTab';
import type { TripStop } from '@/types/trip';

const puerto: TripStop = {
  id: 'stop-pe',
  destination: 'puerto escondido',
  city: 'puerto escondido',
  country: 'mexico',
  startDate: '2026-11-01',
  endDate: '2026-11-07',
};

const oaxaca: TripStop = {
  id: 'stop-ox',
  destination: 'oaxaca',
  city: 'oaxaca',
  country: 'mexico',
  startDate: '2026-11-07',
  endDate: '2026-11-11',
};

describe('BookTab', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ imageUrl: 'https://example.com/fallback-food.jpg', source: 'fallback' }),
    }) as jest.Mock;
  });

  it('title-cases labels, keeps the raw place on the link, and hides prices without an estimate', async () => {
    render(
      <BookTab
        tripId="trip-1"
        adults={2}
        stops={[puerto, oaxaca]}
        overview={{}}
        stopPreviews={[
          {
            destination: 'puerto escondido',
            description: "Surf town on Oaxaca's coast",
            hotelBand: { min: 90, max: 160 },
          },
          {
            destination: 'oaxaca',
            description: 'Explore Oaxaca on your multi-city itinerary.',
          },
        ]}
      />
    );

    expect(screen.getByText('Puerto Escondido, Mexico')).toBeInTheDocument();
    expect(screen.getByText('Oaxaca, Mexico')).toBeInTheDocument();
    expect(screen.getByText("Surf town on Oaxaca's coast")).toBeInTheDocument();
    expect(screen.queryByText(/multi-city itinerary/i)).not.toBeInTheDocument();
    expect(screen.getByText('6 nights')).toBeInTheDocument();
    expect(screen.getByText('4 nights')).toBeInTheDocument();
    expect(screen.getByText('Hotels in Puerto Escondido, Mexico')).toBeInTheDocument();
    expect(screen.getByText('Hotels in Oaxaca, Mexico')).toBeInTheDocument();
    expect(screen.getByText('$90–$160')).toBeInTheDocument();
    expect(screen.getAllByText('est.')).toHaveLength(1);
    expect(screen.queryByRole('link', { name: 'Kayak' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Skyscanner' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Viator' })).toHaveLength(2);
    expect(screen.getByText(/may earn a commission/i)).toBeInTheDocument();

    const booking = screen.getAllByRole('link', { name: 'Booking.com' })[0];
    expect(booking.getAttribute('href')).toContain('partner=booking');
    expect(booking.getAttribute('href')).toContain('puerto+escondido');
    expect(booking.getAttribute('href')).not.toContain('Puerto+Escondido');

    await waitFor(() => {
      expect(document.querySelector('img')).toBeNull();
    });
  });
});
