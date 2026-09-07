import {
  buildTourPreviewStaticUrl,
  latToMercY,
  lngToMercX,
  previewBboxForStops,
  projectTourStopsToPreview,
  TOUR_PREVIEW_IMAGE_HEIGHT,
  TOUR_PREVIEW_IMAGE_WIDTH,
} from '@/lib/tour-map-static-preview';

const PARIS = [
  { order: 1, lat: 48.8584, lng: 2.2945 }, // Eiffel
  { order: 2, lat: 48.8698, lng: 2.3076 }, // Champs
  { order: 3, lat: 48.8606, lng: 2.3376 }, // Louvre
  { order: 4, lat: 48.8867, lng: 2.3431 }, // Montmartre
  { order: 5, lat: 48.8566, lng: 2.3622 }, // Marais
  { order: 6, lat: 48.853, lng: 2.3338 }, // Saint-Germain
];

const NEW_YORK = [
  { order: 1, lat: 40.6892, lng: -74.0445 }, // Statue of Liberty — far southwest
  { order: 2, lat: 40.758, lng: -73.9855 }, // Times Square
  { order: 3, lat: 40.7829, lng: -73.9654 }, // Central Park
  { order: 4, lat: 40.7061, lng: -74.0087 }, // Wall Street
  { order: 5, lat: 40.7484, lng: -73.9857 }, // Empire State
  { order: 6, lat: 40.7587, lng: -73.9787 }, // Bryant Park
  { order: 7, lat: 40.7794, lng: -73.9632 }, // Met
];

describe('tour-map-static-preview', () => {
  it('maps west/east and north/south to the expected image edges', () => {
    const stops = [
      { order: 1, lat: 40.8, lng: -74.1 },
      { order: 2, lat: 40.7, lng: -73.9 },
    ];
    const bbox = previewBboxForStops(stops);
    expect(bbox).not.toBeNull();
    const [west, east] = projectTourStopsToPreview(
      [
        { order: 1, lat: (bbox!.north + bbox!.south) / 2, lng: bbox!.west },
        { order: 2, lat: (bbox!.north + bbox!.south) / 2, lng: bbox!.east },
      ],
      bbox
    );
    expect(west.x).toBeCloseTo(0, 5);
    expect(east.x).toBeCloseTo(100, 5);

    const [north, south] = projectTourStopsToPreview(
      [
        { order: 1, lat: bbox!.north, lng: (bbox!.west + bbox!.east) / 2 },
        { order: 2, lat: bbox!.south, lng: (bbox!.west + bbox!.east) / 2 },
      ],
      bbox
    );
    expect(north.y).toBeCloseTo(0, 5);
    expect(south.y).toBeCloseTo(100, 5);
  });

  it('uses Web Mercator Y, not linear latitude, so northern stops sit higher than a linear map would put them', () => {
    const stops = [
      { order: 1, lat: 25, lng: 10 },
      { order: 2, lat: 50, lng: 10 },
    ];
    const bbox = previewBboxForStops(stops);
    expect(bbox).not.toBeNull();
    const points = projectTourStopsToPreview(stops, bbox);
    const linearYNorth = ((bbox!.north - 50) / (bbox!.north - bbox!.south)) * 100;
    const linearYSouth = ((bbox!.north - 25) / (bbox!.north - bbox!.south)) * 100;

    const north = points.find((p) => p.order === 2)!;
    const south = points.find((p) => p.order === 1)!;
    expect(north.y).toBeLessThan(south.y);
    // Mercator stretches high latitudes: the 25→50 gap is not linear in Y.
    expect(Math.abs(north.y - linearYNorth)).toBeGreaterThan(0.15);
    expect(Math.abs(south.y - linearYSouth)).toBeGreaterThan(0.15);
  });

  it('keeps stop dots inside the padded frame', () => {
    const points = projectTourStopsToPreview(PARIS);
    expect(points).toHaveLength(6);
    for (const p of points) {
      expect(p.x).toBeGreaterThan(5);
      expect(p.x).toBeLessThan(95);
      expect(p.y).toBeGreaterThan(5);
      expect(p.y).toBeLessThan(95);
    }
    const montmartre = points.find((p) => p.order === 4)!;
    const eiffel = points.find((p) => p.order === 1)!;
    expect(montmartre.y).toBeLessThan(eiffel.y);
    expect(eiffel.x).toBeLessThan(montmartre.x);
  });

  it('places Statue of Liberty southwest of Central Park on a New York preview', () => {
    const points = projectTourStopsToPreview(NEW_YORK);
    const liberty = points.find((p) => p.order === 1)!;
    const park = points.find((p) => p.order === 3)!;
    expect(liberty.x).toBeLessThan(park.x);
    expect(liberty.y).toBeGreaterThan(park.y);
  });

  it('fits mercator aspect to the static image so bbox fill should not letterbox', () => {
    const bbox = previewBboxForStops(PARIS)!;
    const mercW = lngToMercX(bbox.east) - lngToMercX(bbox.west);
    const mercH = latToMercY(bbox.south) - latToMercY(bbox.north);
    expect(mercW / mercH).toBeCloseTo(TOUR_PREVIEW_IMAGE_WIDTH / TOUR_PREVIEW_IMAGE_HEIGHT, 3);
  });

  it('builds a stable streets-v12 URL with bbox and no pin overlay', () => {
    const token = 'pk.test-token';
    const a = buildTourPreviewStaticUrl(PARIS, token);
    const b = buildTourPreviewStaticUrl(PARIS, token);
    expect(a).toBe(b);
    expect(a).toContain('streets-v12');
    expect(a).toContain(`${TOUR_PREVIEW_IMAGE_WIDTH}x${TOUR_PREVIEW_IMAGE_HEIGHT}@2x`);
    expect(a).toContain('padding=0');
    expect(a).toContain('logo=false');
    expect(a).toContain('attribution=false');
    expect(a).not.toMatch(/pin-/);
    expect(a).not.toMatch(/path-/);
    expect(a).toContain(`[`);
    expect(a).not.toContain('%5B');
  });

  it('returns null without a token or without coordinates', () => {
    expect(buildTourPreviewStaticUrl(PARIS, '')).toBeNull();
    expect(buildTourPreviewStaticUrl(PARIS, undefined)).toBeNull();
    expect(buildTourPreviewStaticUrl([], 'pk.test')).toBeNull();
    expect(buildTourPreviewStaticUrl([{ lat: 0, lng: 0, order: 1 }], 'pk.test')).toBeNull();
  });
});
