import Blits from '@lightningjs/blits'

/**
 * Weather service for fetching current conditions and daily forecast from Open-Meteo.
 * - No API key required
 * - Includes timeout, basic error handling, and normalization for UI
 *
 * Units:
 *  - units = 'metric' => temperature in °C, wind in km/h
 *  - units = 'imperial' => temperature in °F, wind in mph
 */

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast'

// Mapping Open-Meteo weather codes to local icon keys for the app
// Reference: https://open-meteo.com/en/docs#latitude=52.52&longitude=13.41&hourly=temperature_2m
const WEATHER_CODE_ICON = {
  // Clear
  0: 'clear',
  // Mainly clear, partly cloudy, overcast
  1: 'partly_cloudy',
  2: 'partly_cloudy',
  3: 'overcast',

  // Fog and depositing rime fog
  45: 'fog',
  48: 'fog',

  // Drizzle
  51: 'drizzle',
  53: 'drizzle',
  55: 'drizzle',

  // Freezing drizzle
  56: 'sleet',
  57: 'sleet',

  // Rain
  61: 'rain',
  63: 'rain',
  65: 'rain',

  // Freezing rain
  66: 'sleet',
  67: 'sleet',

  // Snow fall
  71: 'snow',
  73: 'snow',
  75: 'snow',

  // Snow grains
  77: 'snow',

  // Rain showers
  80: 'rain',
  81: 'rain',
  82: 'rain',

  // Snow showers
  85: 'snow',
  86: 'snow',

  // Thunderstorm
  95: 'thunder',
  96: 'thunder',
  99: 'thunder'
}

// Helper to convert Open-Meteo code to icon key with sane fallback
function codeToIcon(code) {
  if (code in WEATHER_CODE_ICON) return WEATHER_CODE_ICON[code]
  return 'unknown'
}

// Abortable fetch with timeout
async function fetchWithTimeout(url, { timeout = 8000 } = {}) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(id)
    return res
  } catch (err) {
    clearTimeout(id)
    throw err
  }
}

// PUBLIC_INTERFACE
export async function fetchCurrentWeather({ lat, lon, units = 'metric', timeoutMs = 8000 }) {
  /** Fetch current weather from Open-Meteo and normalize for UI consumption.
   * Returns:
   * {
   *   location: { lat, lon },
   *   units: { temperature: 'C'|'F', wind: 'km/h'|'mph' },
   *   current: {
   *     temperature: number,
   *     humidity: number, // %
   *     windSpeed: number,
   *     windDirection: number, // degrees
   *     iconKey: string,
   *     conditionCode: number,
   *     time: string // ISO
   *   },
   *   meta: { source: 'open-meteo' }
   * }
   */
  if (lat == null || lon == null) {
    throw new Error('fetchCurrentWeather: lat and lon are required')
  }

  const isMetric = units !== 'imperial'
  const temperature_unit = isMetric ? 'celsius' : 'fahrenheit'
  const windspeed_unit = isMetric ? 'kmh' : 'mph'

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m',
    temperature_unit,
    windspeed_unit,
    timezone: 'auto'
  })

  const url = `${OPEN_METEO_BASE}?${params.toString()}`

  try {
    const res = await fetchWithTimeout(url, { timeout: timeoutMs })
    if (!res.ok) {
      throw new Error(`Open-Meteo error: ${res.status}`)
    }
    const data = await res.json()
    const c = data.current

    const normalized = {
      location: { lat, lon },
      units: {
        temperature: isMetric ? 'C' : 'F',
        wind: isMetric ? 'km/h' : 'mph'
      },
      current: {
        temperature: safeNumber(c?.temperature_2m),
        humidity: safeNumber(c?.relative_humidity_2m),
        windSpeed: safeNumber(c?.wind_speed_10m),
        windDirection: safeNumber(c?.wind_direction_10m),
        iconKey: codeToIcon(safeNumber(c?.weather_code)),
        conditionCode: safeNumber(c?.weather_code),
        time: c?.time || data?.current_units?.time || new Date().toISOString()
      },
      meta: { source: 'open-meteo' }
    }

    return normalized
  } catch (error) {
    // Log with Blits logger if available
    try {
      if (Blits?.log?.error) {
        Blits.log.error('fetchCurrentWeather failed', error)
      }
    } catch (logErr) {
      // intentionally ignored: logging is best-effort and should not throw
    }
    throw enhanceError(error, 'Failed to fetch current weather')
  }
}

// PUBLIC_INTERFACE
export async function fetchForecast({ lat, lon, units = 'metric', days = 7, timeoutMs = 8000 }) {
  /** Fetch daily forecast from Open-Meteo and normalize for UI consumption.
   * Returns:
   * {
   *   location: { lat, lon },
   *   units: { temperature: 'C'|'F', wind: 'km/h'|'mph' },
   *   daily: [
   *     {
   *       date: 'YYYY-MM-DD',
   *       high: number,
   *       low: number,
   *       humidity: number | null, // daily mean if available, else null
   *       windSpeed: number | null, // max wind if available
   *       iconKey: string,
   *       conditionCode: number
   *     }
   *   ],
   *   meta: { source: 'open-meteo' }
   * }
   */
  if (lat == null || lon == null) {
    throw new Error('fetchForecast: lat and lon are required')
  }

  const isMetric = units !== 'imperial'
  const temperature_unit = isMetric ? 'celsius' : 'fahrenheit'
  const windspeed_unit = isMetric ? 'kmh' : 'mph'

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,wind_speed_10m_max',
    temperature_unit,
    windspeed_unit,
    timezone: 'auto',
    forecast_days: String(Math.min(Math.max(days, 1), 16)) // Open-Meteo supports up to 16
  })

  const url = `${OPEN_METEO_BASE}?${params.toString()}`

  try {
    const res = await fetchWithTimeout(url, { timeout: timeoutMs })
    if (!res.ok) {
      throw new Error(`Open-Meteo error: ${res.status}`)
    }
    const data = await res.json()
    const d = data?.daily || {}

    const out = []
    const count = (d.time && d.time.length) || 0
    for (let i = 0; i < count; i++) {
      const code = safeNumber(d.weather_code?.[i])
      out.push({
        date: d.time?.[i],
        high: safeNumber(d.temperature_2m_max?.[i]),
        low: safeNumber(d.temperature_2m_min?.[i]),
        humidity: null, // Not available in daily endpoint; could be derived from hourly if needed
        windSpeed: safeNumber(d.wind_speed_10m_max?.[i]),
        iconKey: codeToIcon(code),
        conditionCode: code
      })
    }

    return {
      location: { lat, lon },
      units: {
        temperature: isMetric ? 'C' : 'F',
        wind: isMetric ? 'km/h' : 'mph'
      },
      daily: out,
      meta: { source: 'open-meteo' }
    }
  } catch (error) {
    try {
      if (Blits?.log?.error) {
        Blits.log.error('fetchForecast failed', error)
      }
    } catch (logErr) {
      // intentionally ignored: logging is best-effort and should not throw
    }
    throw enhanceError(error, 'Failed to fetch forecast')
  }
}

// Helpers
function safeNumber(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function enhanceError(err, message) {
  if (err?.name === 'AbortError') {
    return new Error(`${message}: request timed out`)
  }
  return new Error(`${message}: ${err?.message || String(err)}`)
}
