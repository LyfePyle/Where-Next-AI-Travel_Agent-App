import {
  buildPlacePhotoQuery,
  categoryFallbackPhoto,
  chooseStopPhoto,
  isWikipediaListOrDisambiguation,
  isWikipediaPersonOrArtwork,
  pickWikipediaThumbnail,
  wikipediaTitleMatchesStop,
} from '@/lib/stop-photo';

describe('categoryFallbackPhoto', () => {
  it('uses a plated-food photo for food, not the old clothing-rack URL', () => {
    const url = categoryFallbackPhoto(['food']);
    expect(url).toContain('photo-1414235077428-338989a2e8c0');
    expect(url).not.toContain('photo-1555529669-e69e7aa0ba9a');
  });

  it('uses a child photo for kid-friendly, not the old dark-texture URL', () => {
    const url = categoryFallbackPhoto(['kid-friendly']);
    expect(url).toContain('photo-1503454537195-1dcabb73ffb9');
    expect(url).not.toContain('photo-1578662996442-48f60103fc96');
  });

  it('keeps the existing scenic and historic fallback IDs', () => {
    expect(categoryFallbackPhoto(['scenic'])).toContain('photo-1506905925346-21bda4d32df4');
    expect(categoryFallbackPhoto(['historic'])).toContain('photo-1449824913935-59a10b8d2000');
  });
});

describe('chooseStopPhoto', () => {
  it('keeps a Wikipedia photo for a famous landmark', () => {
    expect(chooseStopPhoto(null, 'https://example.com/eiffel.jpg')).toEqual({
      imageUrl: 'https://example.com/eiffel.jpg',
      source: 'wikipedia',
    });
  });

  it('uses a placeholder instead of a stock photo when Wikipedia misses', () => {
    expect(chooseStopPhoto(null, null)).toEqual({
      imageUrl: null,
      source: 'placeholder',
    });
  });
});

describe('isWikipediaListOrDisambiguation', () => {
  it('skips list articles and disambiguation pages', () => {
    expect(isWikipediaListOrDisambiguation('List of breweries in British Columbia')).toBe(true);
    expect(isWikipediaListOrDisambiguation('Mercury (disambiguation)')).toBe(true);
    expect(isWikipediaListOrDisambiguation('Eiffel Tower')).toBe(false);
  });
});

describe('pickWikipediaThumbnail', () => {
  const acresPages = {
    a: { title: 'List of breweries in British Columbia', index: 1 },
    b: {
      title: 'British Columbia Provincial Police',
      index: 2,
      thumbnail: { source: 'https://example.com/police.png' },
    },
    c: {
      title: 'Grouse Mountain',
      index: 3,
      thumbnail: { source: 'https://example.com/gondola.jpg' },
    },
  };

  it('does not treat 33 Acres as a police badge or gondola after a thumbnail-less list hit', () => {
    expect(pickWikipediaThumbnail(acresPages, '33 Acres Brewing Company')).toBeNull();
  });

  it('uses a later result in the first 3 when it has a thumbnail and matches the stop', () => {
    const pages = {
      a: { title: 'List of parks in Vancouver', index: 1 },
      b: {
        title: 'Stanley Park',
        index: 2,
        thumbnail: { source: 'https://example.com/stanley.jpg' },
      },
      c: {
        title: 'Unrelated fourth-would-be',
        index: 4,
        thumbnail: { source: 'https://example.com/too-late.jpg' },
      },
    };
    expect(pickWikipediaThumbnail(pages, 'Stanley Park')).toBe('https://example.com/stanley.jpg');
  });

  it('returns the first ranked matching thumbnail (famous landmark)', () => {
    const pages = {
      z: {
        title: 'Eiffel Tower',
        index: 1,
        description: 'Tower in Paris, France',
        thumbnail: { source: 'https://example.com/eiffel.jpg' },
      },
    };
    expect(pickWikipediaThumbnail(pages, 'Eiffel Tower')).toBe('https://example.com/eiffel.jpg');
  });

  it('does not use Lily Monteverde when the Costa Rica canton is also in the results', () => {
    const pages = {
      a: {
        title: 'Lily Monteverde',
        index: 1,
        description: 'Filipino film producer and businesswoman (1938–2024)',
        thumbnail: { source: 'https://example.com/two-women.jpg' },
      },
      b: {
        title: 'Monteverde',
        index: 2,
        description: 'Canton in Puntarenas province, Costa Rica',
        thumbnail: { source: 'https://example.com/monteverde-skyline.jpg' },
      },
      c: {
        title: 'Alejandro Gómez Monteverde',
        index: 3,
        description: 'Mexican filmmaker (born 1977)',
        thumbnail: { source: 'https://example.com/filmmaker.jpg' },
      },
    };
    const url = pickWikipediaThumbnail(pages, 'Monteverde');
    expect(url).toBe('https://example.com/monteverde-skyline.jpg');
    expect(url).not.toContain('two-women');
  });

  it('does not use the Dominical mural when the Costa Rica town is also in the results', () => {
    const pages = {
      a: {
        title: 'Sueño de una Tarde Dominical en la Alameda Central',
        index: 1,
        description: 'Mural created by Diego Rivera in Mexico City in 1946–1947',
        thumbnail: { source: 'https://example.com/mural.jpg' },
      },
      b: {
        title: 'Dominical, Puntarenas',
        index: 2,
        description: 'Town in Puntarenas, Costa Rica',
        thumbnail: { source: 'https://example.com/dominical-town.jpg' },
      },
      c: {
        title: 'Dominic Cooper',
        index: 3,
        description: 'English actor (born 1978)',
        thumbnail: { source: 'https://example.com/actor.jpg' },
      },
    };
    const url = pickWikipediaThumbnail(pages, 'Dominical');
    expect(url).toBe('https://example.com/dominical-town.jpg');
    expect(url).not.toContain('mural');
  });

  it('returns no photo when every match is a person or artwork', () => {
    const pages = {
      a: {
        title: 'Lily Monteverde',
        index: 1,
        description: 'Filipino film producer and businesswoman (1938–2024)',
        thumbnail: { source: 'https://example.com/two-women.jpg' },
      },
      b: {
        title: 'Sueño de una Tarde Dominical en la Alameda Central',
        index: 2,
        description: 'Mural created by Diego Rivera',
        thumbnail: { source: 'https://example.com/mural.jpg' },
      },
    };
    expect(pickWikipediaThumbnail(pages, 'Monteverde')).toBeNull();
    expect(chooseStopPhoto(null, pickWikipediaThumbnail(pages, 'Monteverde'))).toEqual({
      imageUrl: null,
      source: 'placeholder',
    });
  });

  it('skips a disambiguation page even when it has a thumbnail', () => {
    const pages = {
      a: {
        title: 'Mercury (disambiguation)',
        index: 1,
        thumbnail: { source: 'https://example.com/disambig.jpg' },
      },
      b: {
        title: 'Mercury',
        index: 2,
        thumbnail: { source: 'https://example.com/planet.jpg' },
      },
    };
    expect(pickWikipediaThumbnail(pages, 'Mercury')).toBe('https://example.com/planet.jpg');
  });
});

describe('buildPlacePhotoQuery', () => {
  it('searches the city with its country', () => {
    expect(buildPlacePhotoQuery('Monteverde', 'Costa Rica')).toBe('Monteverde Costa Rica');
    expect(buildPlacePhotoQuery('Dominical', 'Costa Rica')).toBe('Dominical Costa Rica');
  });

  it('does not repeat a country already written in the city', () => {
    expect(buildPlacePhotoQuery('Monteverde, Costa Rica', 'Costa Rica')).toBe(
      'Monteverde, Costa Rica'
    );
  });
});

describe('isWikipediaPersonOrArtwork', () => {
  it('flags a person and a mural, and keeps a volcano', () => {
    expect(
      isWikipediaPersonOrArtwork({
        description: 'Filipino film producer and businesswoman (1938–2024)',
      })
    ).toBe(true);
    expect(
      isWikipediaPersonOrArtwork({ description: 'Mural created by Diego Rivera' })
    ).toBe(true);
    expect(isWikipediaPersonOrArtwork({ description: 'Volcano in Costa Rica' })).toBe(false);
    expect(isWikipediaPersonOrArtwork({ description: 'Tower in Paris, France' })).toBe(false);
  });
});

describe('wikipediaTitleMatchesStop', () => {
  it('matches Joe Beef on the restaurant page title', () => {
    expect(wikipediaTitleMatchesStop('Joe Beef (restaurant)', 'Joe Beef')).toBe(true);
  });

  it('does not treat Grouse Mountain as a match for 33 Acres', () => {
    expect(wikipediaTitleMatchesStop('Grouse Mountain', '33 Acres Brewing Company')).toBe(false);
  });
});
