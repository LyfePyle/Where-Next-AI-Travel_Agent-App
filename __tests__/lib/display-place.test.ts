import { titleCasePlace } from '@/lib/display-place';
import { displayPlaceName } from '@/lib/book-offers';

describe('titleCasePlace', () => {
  it('capitalizes a lowercase typed city', () => {
    expect(titleCasePlace('puerto escondido')).toBe('Puerto Escondido');
  });

  it('keeps particles lower and capitalizes the country after a comma', () => {
    expect(titleCasePlace('oaxaca de juarez')).toBe('Oaxaca de Juarez');
    expect(titleCasePlace('san salvador, el salvador')).toBe('San Salvador, El Salvador');
  });

  it('leaves names that already have capitals alone', () => {
    expect(titleCasePlace('Bali, Indonesia')).toBe('Bali, Indonesia');
    expect(titleCasePlace('USA')).toBe('USA');
  });
});

describe('displayPlaceName', () => {
  it('turns a lowercase city and country into a bookable label', () => {
    expect(
      displayPlaceName({
        destination: 'puerto escondido',
        city: 'puerto escondido',
        country: 'mexico',
      })
    ).toBe('Puerto Escondido, Mexico');
  });
});
