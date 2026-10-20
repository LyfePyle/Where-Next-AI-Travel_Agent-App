import { fireEvent, render, screen } from '@testing-library/react';
import PlaceSuggestInput from '@/components/PlaceSuggestInput';
import type { PlaceSuggestion } from '@/lib/place-suggest';

const rows: PlaceSuggestion[] = [
  {
    label: 'Vancouver, British Columbia, Canada',
    city: 'Vancouver',
    region: 'British Columbia',
    country: 'Canada',
    lat: 49.26,
    lng: -123.11,
    storable: true,
  },
  {
    label: 'Van, Turkey',
    city: 'Van',
    region: 'Van',
    country: 'Turkey',
    lat: 38.5,
    lng: 43.4,
    storable: true,
  },
];

beforeEach(() => {
  (global.fetch as jest.Mock).mockReset();
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({ suggestions: rows }),
  });
});

describe('PlaceSuggestInput', () => {
  it('picks the highlighted row with the keyboard', async () => {
    const onPick = jest.fn();
    render(
      <PlaceSuggestInput aria-label="Home city" value="van" onChange={jest.fn()} onPick={onPick} />
    );
    const input = screen.getByRole('combobox', { name: 'Home city' });
    await screen.findByRole('listbox');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onPick).toHaveBeenCalledWith(rows[1]);
  });

  it('picks a row on tap', async () => {
    const onPick = jest.fn();
    render(
      <PlaceSuggestInput aria-label="Destination" value="van" onChange={jest.fn()} onPick={onPick} />
    );
    const option = await screen.findByRole('button', { name: 'Van, Turkey' });
    fireEvent.click(option);
    expect(onPick).toHaveBeenCalledWith(rows[1]);
  });

  it('shows OpenStreetMap attribution', async () => {
    render(<PlaceSuggestInput aria-label="Destination" value="van" onChange={jest.fn()} />);
    expect(await screen.findByText('© OpenStreetMap contributors')).toBeInTheDocument();
  });
});
