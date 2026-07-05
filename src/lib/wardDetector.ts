import redis from '@/lib/redis';

// ─── Types ───────────────────────────────────────────────────────────────────

interface NominatimAddress {
  road?:          string;
  pedestrian?:    string;
  footway?:       string;
  suburb?:        string;
  neighbourhood?: string;
  quarter?:       string;
  county?:        string;
  city?:          string;
  town?:          string;
  village?:       string;
  state?:         string;
  country?:       string;
  postcode?:      string;
}

interface NominatimResponse {
  display_name?: string;
  address?:      NominatimAddress;
  error?:        string;
}

// ─── Cache Key Helper ─────────────────────────────────────────────────────────

function buildCacheKey(lat: number, lng: number): string {
  // Round to 3 decimal places (~111 m precision) to maximise cache hits
  const roundedLat = lat.toFixed(3);
  const roundedLng = lng.toFixed(3);
  return `ward:${roundedLat}:${roundedLng}`;
}

// ─── detectWard ───────────────────────────────────────────────────────────────

/**
 * Reverse-geocodes a coordinate pair to a ward/neighbourhood name.
 *
 * Strategy:
 * 1. Check Redis cache (TTL 1 hour)
 * 2. Query Nominatim (free, no API key)
 * 3. Extract suburb → quarter → neighbourhood → county
 * 4. On any failure, return 'Unknown Ward'
 */
export async function detectWard(lat: number, lng: number): Promise<string> {
  const cacheKey = buildCacheKey(lat, lng);

  // 1. Cache check
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return cached;
  } catch {
    // Redis unavailable — continue without cache
  }

  // 2. Nominatim request
  let ward = 'Unknown Ward';

  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('lat',    String(lat));
    url.searchParams.set('lon',    String(lng));
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');

    const response = await fetch(url.toString(), {
      headers: {
        // Nominatim usage policy requires a descriptive User-Agent
        'User-Agent':     'CivicFix/1.0 (civic-defect-reporting; contact@civicfix.app)',
        'Accept-Language': 'en',
      },
      // 5s timeout via AbortController
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Nominatim returned HTTP ${response.status}`);
    }

    const data: NominatimResponse = await response.json() as NominatimResponse;

    if (data.error) {
      throw new Error(`Nominatim error: ${data.error}`);
    }

    // 3. Extract best ward candidate
    const addr = data.address;
    if (addr) {
      ward =
        addr.suburb        ??
        addr.quarter       ??
        addr.neighbourhood ??
        addr.county        ??
        addr.city          ??
        addr.town          ??
        addr.village       ??
        'Unknown Ward';
    }
  } catch {
    // Silently fall through — return 'Unknown Ward'
  }

  // 4. Cache the result for 1 hour
  try {
    await redis.set(cacheKey, ward, 'EX', 3600);
  } catch {
    // Redis unavailable — proceed without caching
  }

  return ward;
}

// ─── formatAddress ────────────────────────────────────────────────────────────

/**
 * Constructs a human-readable address from a Nominatim reverse geocode result.
 * Format: "Street Name, Neighbourhood, City"
 */
export function formatAddress(nominatimResult: NominatimResponse): string {
  if (!nominatimResult.address) {
    return nominatimResult.display_name ?? 'Unknown Location';
  }

  const addr = nominatimResult.address;

  const street =
    addr.road ??
    addr.pedestrian ??
    addr.footway;

  const neighbourhood =
    addr.neighbourhood ??
    addr.suburb ??
    addr.quarter;

  const city =
    addr.city ??
    addr.town ??
    addr.village;

  const parts = [street, neighbourhood, city].filter(
    (p): p is string => typeof p === 'string' && p.trim().length > 0
  );

  return parts.length > 0
    ? parts.join(', ')
    : (nominatimResult.display_name ?? 'Unknown Location');
}
