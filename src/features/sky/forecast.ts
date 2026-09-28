import type { Weather } from './sky'

/**
 * The real weather where the visitor is, from Open-Meteo — free, keyless,
 * and it allows browser requests from any origin.
 *
 * Location comes from the browser's timezone rather than from the
 * geolocation API or an IP lookup: no permission prompt, and nothing
 * about the visitor goes anywhere but a city name. "Asia/Manila" is
 * looked up as "Manila" with Open-Meteo's own geocoder, which is close
 * enough for weather out of a window. Anything that fails — an unusual
 * zone, no network — returns null, and the sky keeps its simulated
 * weather.
 */

const GEOCODE = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST = 'https://api.open-meteo.com/v1/forecast'

/** How long a reading is trusted before asking again. */
export const FORECAST_TTL_MS = 20 * 60_000

const PLACE_KEY = 'sky:place'
const READING_KEY = 'sky:reading'

interface Place {
  zone: string
  latitude: number
  longitude: number
}

interface Reading {
  at: number
  weather: Weather
}

/* Storage can be missing or throw (private windows, blocked site data),
   and the forecast must work without it — it only saves repeat
   requests. */
function load<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function save(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* fine: it will just be fetched again next time */
  }
}

/**
 * WMO weather codes, as Open-Meteo reports them, onto what the window can
 * draw. Snow has no drawing yet, so it reads as the overcast sky it falls
 * from.
 */
export function fromWmo(code: number): Weather {
  if (code <= 1) return 'clear'
  if (code <= 3) return 'cloudy'
  if (code === 45 || code === 48) return 'fog'
  if (code >= 95) return 'storm'
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain'
  return 'cloudy'
}

async function place(): Promise<Place | null> {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const cached = load<Place>(PLACE_KEY)
  if (cached?.zone === zone) return cached

  // The city is the last part of the zone name. Zones without one — UTC,
  // Etc/GMT+8 — cannot be placed, so they keep the simulated weather.
  const city = zone?.split('/').pop()?.replace(/_/g, ' ')
  if (!city || !zone.includes('/') || zone.startsWith('Etc/')) return null

  const res = await fetch(`${GEOCODE}?name=${encodeURIComponent(city)}&count=1`)
  if (!res.ok) return null
  const data = (await res.json()) as { results?: { latitude: number; longitude: number }[] }
  const hit = data.results?.[0]
  if (!hit) return null
  const found = { zone, latitude: hit.latitude, longitude: hit.longitude }
  save(PLACE_KEY, found)
  return found
}

/** The current weather, from the cache if it is fresh enough. */
export async function currentWeather(): Promise<Weather | null> {
  const cached = load<Reading>(READING_KEY)
  if (cached && Date.now() - cached.at < FORECAST_TTL_MS) return cached.weather

  try {
    const where = await place()
    if (!where) return null
    const res = await fetch(
      `${FORECAST}?latitude=${where.latitude}&longitude=${where.longitude}&current=weather_code`,
    )
    if (!res.ok) return null
    const data = (await res.json()) as { current?: { weather_code?: number } }
    const code = data.current?.weather_code
    if (typeof code !== 'number') return null
    const weather = fromWmo(code)
    save(READING_KEY, { at: Date.now(), weather })
    return weather
  } catch {
    return null
  }
}
