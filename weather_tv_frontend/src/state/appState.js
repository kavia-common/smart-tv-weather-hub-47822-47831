import Blits from '@lightningjs/blits'

/**
 * Application-wide reactive state store with persistence.
 * Manages selectedLocation, units, favorites, lastUpdated, isLoading, and error.
 * State is persisted to localStorage and rehydrated on init.
 */

const STORAGE_KEY = 'weather_tv_app_state_v1'

// Default state shape
const defaultState = {
  selectedLocation: null, // { id, name, lat, lon } or string based on usage
  units: 'metric', // 'metric' | 'imperial'
  favorites: [], // array of location objects/ids
  lastUpdated: null, // ISO string
  isLoading: false,
  error: null
}

/**
 * Load persisted state from localStorage safely.
 * Returns only known keys merged onto defaults to avoid schema drift.
 */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultState }
    const parsed = JSON.parse(raw)

    // Whitelist only recognized keys to avoid issues
    const safe = { ...defaultState }
    for (const key of Object.keys(defaultState)) {
      if (Object.prototype.hasOwnProperty.call(parsed, key)) {
        safe[key] = parsed[key]
      }
    }
    return safe
  } catch (e) {
    // If anything goes wrong, return defaults
    return { ...defaultState }
  }
}

/**
 * Persist current state to localStorage safely.
 */
function saveState(state) {
  try {
    const toStore = {}
    for (const key of Object.keys(defaultState)) {
      toStore[key] = state[key]
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
  } catch (_e) {
    // Ignore quota/unavailable errors in TV environments
  }
}

// Initialize reactive store with persisted or default state
const store = Blits.store({
  ...loadState()
})

// Persist on any state change
store.$subscribe(() => {
  saveState(store.$state)
})

// PUBLIC_INTERFACE
export function getSelectedLocation() {
  /** Returns the currently selected location. */
  return store.selectedLocation
}

// PUBLIC_INTERFACE
export function setSelectedLocation(location) {
  /** Sets the currently selected location and updates lastUpdated. */
  store.selectedLocation = location
  store.lastUpdated = new Date().toISOString()
}

// PUBLIC_INTERFACE
export function getUnits() {
  /** Returns the current units setting ('metric' | 'imperial'). */
  return store.units
}

// PUBLIC_INTERFACE
export function setUnits(units) {
  /** Sets the units and updates lastUpdated. Accepts 'metric' or 'imperial'. */
  if (units !== 'metric' && units !== 'imperial') return
  store.units = units
  store.lastUpdated = new Date().toISOString()
}

// PUBLIC_INTERFACE
export function getFavorites() {
  /** Returns the list of favorite locations. */
  return store.favorites
}

// PUBLIC_INTERFACE
export function addFavorite(fav) {
  /** Adds a favorite if not already present (shallow equality by id or value). */
  const exists = store.favorites.some((f) => {
    if (f && fav && typeof f === 'object' && typeof fav === 'object') {
      return f.id !== undefined && fav.id !== undefined && f.id === fav.id
    }
    return f === fav
  })
  if (!exists) {
    store.favorites = [...store.favorites, fav]
    store.lastUpdated = new Date().toISOString()
  }
}

// PUBLIC_INTERFACE
export function removeFavorite(fav) {
  /** Removes a favorite (by id if objects, by value otherwise). */
  store.favorites = store.favorites.filter((f) => {
    if (f && fav && typeof f === 'object' && typeof fav === 'object') {
      if (f.id !== undefined && fav.id !== undefined) {
        return f.id !== fav.id
      }
    }
    return f !== fav
  })
  store.lastUpdated = new Date().toISOString()
}

// PUBLIC_INTERFACE
export function clearFavorites() {
  /** Clears all favorites. */
  store.favorites = []
  store.lastUpdated = new Date().toISOString()
}

// PUBLIC_INTERFACE
export function getLastUpdated() {
  /** Returns ISO string of last updated timestamp. */
  return store.lastUpdated
}

// PUBLIC_INTERFACE
export function setLoading(isLoading) {
  /** Sets loading state flag. */
  store.isLoading = !!isLoading
}

// PUBLIC_INTERFACE
export function isLoading() {
  /** Returns current loading state flag. */
  return !!store.isLoading
}

// PUBLIC_INTERFACE
export function getError() {
  /** Returns current error message or object. */
  return store.error
}

// PUBLIC_INTERFACE
export function setError(err) {
  /** Sets current error (message or object). */
  store.error = err
}

// PUBLIC_INTERFACE
export function clearError() {
  /** Clears current error. */
  store.error = null
}

// PUBLIC_INTERFACE
export function resetAppState() {
  /** Resets app state to defaults and persists. */
  for (const key of Object.keys(defaultState)) {
    store[key] = defaultState[key]
  }
  store.lastUpdated = new Date().toISOString()
  saveState(store.$state)
}

// PUBLIC_INTERFACE
export function useAppState() {
  /**
   * Returns reactive refs for components to bind to.
   * Example:
   *   const { units, isLoading } = useAppState()
   *   <Text :content="$units" />
   */
  return {
    selectedLocation: store.$select('selectedLocation'),
    units: store.$select('units'),
    favorites: store.$select('favorites'),
    lastUpdated: store.$select('lastUpdated'),
    isLoading: store.$select('isLoading'),
    error: store.$select('error')
  }
}
