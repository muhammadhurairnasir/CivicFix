/**
 * Converts degrees to radians.
 */
export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculates the great-circle distance between two points on the Earth's surface using the Haversine formula.
 * @returns Distance in meters.
 */
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = degreesToRadians(lat1);
  const phi2 = degreesToRadians(lat2);
  const deltaPhi = degreesToRadians(lat2 - lat1);
  const deltaLambda = degreesToRadians(lng2 - lng1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculates a bounding box around a given coordinate with a specific radius.
 * @returns { swLat, swLng, neLat, neLng }
 */
export function getBoundingBox(lat: number, lng: number, radiusMeters: number) {
  const R = 6371e3; // Earth's radius in meters
  // Coordinate offsets in radians
  const latDelta = (radiusMeters / R) * (180 / Math.PI);
  const lngDelta = ((radiusMeters / R) * (180 / Math.PI)) / Math.cos((lat * Math.PI) / 180);

  return {
    swLat: lat - latDelta,
    swLng: lng - lngDelta,
    neLat: lat + latDelta,
    neLng: lng + lngDelta,
  };
}

/**
 * Basic grouping string mapping coordinates to a string grid cell.
 * This simplifies grouping by coordinate precision.
 */
export function coordsToGeohash(lat: number, lng: number, precision: number = 3): string {
  const rLat = lat.toFixed(precision);
  const rLng = lng.toFixed(precision);
  return `${rLat},${rLng}`;
}

/**
 * Rounds coordinates to a specific number of decimal places.
 */
export function roundCoords(lat: number, lng: number, decimals: number) {
  const factor = Math.pow(10, decimals);
  return {
    lat: Math.round(lat * factor) / factor,
    lng: Math.round(lng * factor) / factor,
  };
}

/**
 * Validates if coordinates are within valid Earth ranges.
 */
export function isValidCoordinates(lat: number, lng: number): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Formats a distance in meters to a readable string (e.g., "500m", "2.1km").
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}
