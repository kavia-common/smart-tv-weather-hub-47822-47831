import Blits from '@lightningjs/blits'

import {
  getUnits,
  setUnits,
  getSelectedLocation,
  setSelectedLocation,
  getFavorites,
  addFavorite,
  removeFavorite,
  clearFavorites,
  useAppState,
} from '../state/appState.js'

/**
 * Settings page
 * - Toggle units (C/F)
 * - Select curated location
 * - Manage favorites (add/remove/clear)
 * - TV Remote navigation and Ocean theme styling
 */
export default Blits.Component('Settings', {
  template: `
    <Element w="1920" h="1080" :color="$theme.bg">
      <!-- Header -->
      <Element x="0" y="0" w="1920" h="120" :color="$theme.surface">
        <Element x="0" y="0" w="1920" h="120" :color="$theme.primary" alpha="0.04" />
        <Text x="80" y="40" w="1200" h="48" fontSize="40" :textColor="$theme.text" content="Settings" />
        <Text x="80" y="88" w="1200" h="24" fontSize="22" :textColor="$theme.textSub" :content="$subtitleText" />
        <!-- Back hint -->
        <Text x="1600" y="44" w="240" h="36" fontSize="24" :textColor="$theme.textSub" content="Back: ←" />
      </Element>

      <!-- SideNav stub area visual (actual SideNav is on Home) -->
      <Element x="0" y="120" w="320" h="960" :color="$theme.primary" alpha="0.02">
        <Text x="32" y="40" w="256" h="28" fontSize="22" :textColor="$theme.textSub" content="Use Back to return" />
      </Element>

      <!-- Content -->
      <Element x="340" y="140" w="1540" h="900">
        <!-- Units Card -->
        <Element x="0" y="0" w="1540" h="180" r="20" :color="$theme.surface">
          <Element x="0" y="0" w="1540" h="180" :color="$theme.primary" alpha="0.04" r="20" />
          <Element x="1" y="1" w="1538" h="178" :color="$theme.surface" r="18" />
          <Text x="24" y="24" w="1492" h="36" fontSize="28" :textColor="$theme.text" content="Units" />

          <!-- Toggle buttons -->
          <Element x="24" y="80" w="400" h="72">
            <Element
              :x="$unitsFocusIndex === 0 ? 0 : 206"
              y="0"
              w="194"
              h="72"
              r="12"
              :color="$theme.secondary"
              alpha="0.35"
            />
            <!-- Metric -->
            <Element
              :color="$units === 'metric' ? $theme.primary : 0x00000000"
              :alpha="$units === 'metric' ? 0.15 : 0"
              x="0" y="0" w="194" h="72" r="12"
            >
              <Element x="1" y="1" w="192" h="70" r="12" :color="$theme.surface" />
              <Text x="24" y="22" w="160" h="28" fontSize="24" :textColor="$unitsFocusIndex === 0 ? $theme.primary : $theme.text" content="Celsius (°C)" />
            </Element>

            <!-- Imperial -->
            <Element
              :color="$units === 'imperial' ? $theme.primary : 0x00000000"
              :alpha="$units === 'imperial' ? 0.15 : 0"
              x="206" y="0" w="194" h="72" r="12"
            >
              <Element x="1" y="1" w="192" h="70" r="12" :color="$theme.surface" />
              <Text x="24" y="22" w="160" h="28" fontSize="24" :textColor="$unitsFocusIndex === 1 ? $theme.primary : $theme.text" content="Fahrenheit (°F)" />
            </Element>
          </Element>
        </Element>

        <!-- Location Card -->
        <Element x="0" y="220" w="1540" h="260" r="20" :color="$theme.surface">
          <Element x="0" y="0" w="1540" h="260" :color="$theme.primary" alpha="0.04" r="20" />
          <Element x="1" y="1" w="1538" h="258" :color="$theme.surface" r="18" />
          <Text x="24" y="24" w="1492" h="36" fontSize="28" :textColor="$theme.text" content="Location" />
          <Text x="24" y="68" w="1200" h="28" fontSize="22" :textColor="$theme.textSub" :content="$locationSubtitle" />

          <!-- Curated location list -->
          <Element x="24" y="108" w="1492" h="120">
            <Element
              :for="(loc, index) in $curated"
              :key="$loc.id"
              :x="$index * 300"
              y="0"
              w="280"
              h="120"
              r="16"
              :color="$loc.id === $selectedLocationId ? $theme.primary : 0x00000000"
              :alpha="$loc.id === $selectedLocationId ? 0.15 : 0"
            >
              <!-- focus -->
              <Element
                :alpha="$focusArea === 'location' && $index === $locationFocusIndex ? 1 : 0"
                w="280" h="120" r="16" :color="$theme.secondary" alpha="0.35"
              />
              <Element x="1" y="1" w="278" h="118" r="16" :color="$theme.surface" />
              <Text x="20" y="22" w="240" h="32" fontSize="26" :textColor="$index === $locationFocusIndex && $focusArea === 'location' ? $theme.primary : $theme.text" :content="$loc.name" />
              <Text x="20" y="64" w="240" h="28" fontSize="20" :textColor="$theme.textSub" :content="$loc.region" />
            </Element>
          </Element>
        </Element>

        <!-- Favorites Card -->
        <Element x="0" y="520" w="1540" h="380" r="20" :color="$theme.surface">
          <Element x="0" y="0" w="1540" h="380" :color="$theme.primary" alpha="0.04" r="20" />
          <Element x="1" y="1" w="1538" h="378" :color="$theme.surface" r="18" />
          <Text x="24" y="24" w="1492" h="36" fontSize="28" :textColor="$theme.text" content="Favorites" />
          <Text x="24" y="68" w="1200" h="28" fontSize="22" :textColor="$theme.textSub" :content="$favoritesSubtitle" />

          <!-- Action row -->
          <Element x="24" y="108" w="600" h="72">
            <!-- Add current location -->
            <Element x="0" y="0" w="280" h="72" r="12"
              :color="$focusArea === 'favorites_actions' && $favActionFocusIndex === 0 ? $theme.secondary : 0x00000000"
              :alpha="$focusArea === 'favorites_actions' && $favActionFocusIndex === 0 ? 0.35 : 0"
            >
              <Element x="1" y="1" w="278" h="70" r="12" :color="$theme.surface" />
              <Text x="24" y="22" fontSize="24" :textColor="$theme.text" content="Add Current Location" />
            </Element>

            <!-- Clear favorites -->
            <Element x="300" y="0" w="200" h="72" r="12"
              :color="$focusArea === 'favorites_actions' && $favActionFocusIndex === 1 ? $theme.secondary : 0x00000000"
              :alpha="$focusArea === 'favorites_actions' && $favActionFocusIndex === 1 ? 0.35 : 0"
            >
              <Element x="1" y="1" w="198" h="70" r="12" :color="$theme.surface" />
              <Text x="24" y="22" fontSize="24" :textColor="$theme.text" content="Clear All" />
            </Element>
          </Element>

          <!-- Favorites list -->
          <Element x="24" y="200" w="1492" h="156">
            <Element
              :for="(fav, index) in $favoritesList"
              :key="$favKey($fav, $index)"
              :x="$index * 360"
              y="0"
              w="340"
              h="156"
              r="16"
              :color="$theme.primary"
              alpha="0.04"
            >
              <Element
                :alpha="$focusArea === 'favorites_list' && $index === $favoritesFocusIndex ? 1 : 0"
                w="340" h="156" r="16" :color="$theme.secondary" alpha="0.35"
              />
              <Element x="1" y="1" w="338" h="154" r="16" :color="$theme.surface" />
              <Text x="20" y="24" w="300" h="32" fontSize="26" :textColor="$theme.text" :content="$favTitle($fav)" />
              <Text x="20" y="66" w="300" h="28" fontSize="20" :textColor="$theme.textSub" :content="$favSub($fav)" />
              <Text x="20" y="106" w="300" h="24" fontSize="20" :textColor="$theme.error" content="Remove (Enter)" />
            </Element>
          </Element>
        </Element>
      </Element>
    </Element>
  `,

  state() {
    const { units, selectedLocation, favorites } = useAppState()
    const curated = [
      { id: 'sf', name: 'San Francisco', region: 'USA', lat: 37.7749, lon: -122.4194 },
      { id: 'nyc', name: 'New York', region: 'USA', lat: 40.7128, lon: -74.0060 },
      { id: 'ldn', name: 'London', region: 'UK', lat: 51.5074, lon: -0.1278 },
      { id: 'tky', name: 'Tokyo', region: 'Japan', lat: 35.6762, lon: 139.6503 },
      { id: 'syd', name: 'Sydney', region: 'Australia', lat: -33.8688, lon: 151.2093 },
    ]
    return {
      // Theme
      theme: {
        primary: 0x2563EBff,
        secondary: 0xF59E0Bff,
        text: 0x111827ff,
        textSub: 0x111827cc,
        bg: 0xf9fafbff,
        surface: 0xffffffff,
        error: 0xEF4444ff,
      },

      subtitleText: 'Configure units, default location, and favorites',
      locationSubtitle: '',
      favoritesSubtitle: '',

      // Reactive refs
      units: units.value || getUnits() || 'metric',
      selectedLocationRef: selectedLocation.value || getSelectedLocation() || null,
      favoritesRef: favorites.value || getFavorites() || [],

      // Curated list
      curated,

      // Selection and focus state
      selectedLocationId: (selectedLocation.value || getSelectedLocation() || { id: 'sf' }).id,
      focusArea: 'units', // 'units' | 'location' | 'favorites_actions' | 'favorites_list'
      unitsFocusIndex: getUnits() === 'imperial' ? 1 : 0,
      locationFocusIndex: 0,
      favActionFocusIndex: 0,
      favoritesFocusIndex: 0,
    }
  },

  hooks: {
    ready() {
      this.computeSubtitles()
      // Align focus to currently selected location
      const idx = this.curated.findIndex((c) => c.id === this.selectedLocationId)
      if (idx >= 0) this.locationFocusIndex = idx
    },
    focus() {
      // No-op, page-level focus delegates to internal focusArea visuals
    },
  },

  computed: {
    locationSubtitle() {
      const loc = this.selectedLocationRef
      if (!loc) return 'No location selected'
      return `Selected: ${loc.name} (${loc.region || ''})`
    },
    favoritesList() {
      return Array.isArray(this.favoritesRef) ? this.favoritesRef : []
    },
    favoritesSubtitle() {
      const count = this.favoritesList.length
      return count === 0 ? 'No favorites yet' : `${count} favorite${count > 1 ? 's' : ''}`
    },
  },

  methods: {
    computeSubtitles() {
      // Trigger recompute by updating reactive props already handled in computed
      // Kept to maintain structure for potential extension.
    },

    // Helpers for favorites card
    favKey(fav, index) {
      if (fav && typeof fav === 'object' && fav.id != null) return String(fav.id)
      return `idx-${index}`
    },
    favTitle(fav) {
      if (fav && typeof fav === 'object') return fav.name || String(fav.id || 'Favorite')
      return String(fav)
    },
    favSub(fav) {
      if (fav && typeof fav === 'object') return fav.region || ''
      return ''
    },

    // Focus helpers
    setFocusArea(area) {
      this.focusArea = area
    },
    moveUnitsFocus(delta) {
      this.unitsFocusIndex = Math.max(0, Math.min(1, this.unitsFocusIndex + delta))
    },
    moveLocationFocus(delta) {
      const max = this.curated.length - 1
      this.locationFocusIndex = Math.max(0, Math.min(max, this.locationFocusIndex + delta))
    },
    moveFavoritesActionFocus(delta) {
      const max = 1
      this.favActionFocusIndex = Math.max(0, Math.min(max, this.favActionFocusIndex + delta))
    },
    moveFavoritesListFocus(delta) {
      const max = Math.max(0, this.favoritesList.length - 1)
      this.favoritesFocusIndex = Math.max(0, Math.min(max, this.favoritesFocusIndex + delta))
    },

    // Actions
    applyUnitsSelection() {
      const newUnits = this.unitsFocusIndex === 1 ? 'imperial' : 'metric'
      if (newUnits !== this.units) {
        this.units = newUnits
        setUnits(newUnits)
      }
    },
    applyLocationSelection() {
      const loc = this.curated[this.locationFocusIndex]
      if (!loc) return
      this.selectedLocationRef = loc
      this.selectedLocationId = loc.id
      setSelectedLocation(loc)
    },
    addCurrentToFavorites() {
      const loc = this.selectedLocationRef || getSelectedLocation()
      if (!loc) return
      addFavorite(loc)
      this.favoritesRef = getFavorites()
    },
    clearAllFavorites() {
      clearFavorites()
      this.favoritesRef = getFavorites()
      this.favoritesFocusIndex = 0
    },
    removeFocusedFavorite() {
      const fav = this.favoritesList[this.favoritesFocusIndex]
      if (!fav) return
      removeFavorite(fav)
      this.favoritesRef = getFavorites()
      this.favoritesFocusIndex = Math.max(0, Math.min(this.favoritesFocusIndex, this.favoritesList.length - 1))
    },
    goBack() {
      this.$router.back()
    },
  },

  input: {
    up() {
      if (this.focusArea === 'location') {
        this.setFocusArea('units')
      } else if (this.focusArea === 'favorites_actions') {
        this.setFocusArea('location')
      } else if (this.focusArea === 'favorites_list') {
        this.setFocusArea('favorites_actions')
      }
    },
    down() {
      if (this.focusArea === 'units') {
        this.setFocusArea('location')
      } else if (this.focusArea === 'location') {
        this.setFocusArea('favorites_actions')
      } else if (this.focusArea === 'favorites_actions' && this.favoritesList.length > 0) {
        this.setFocusArea('favorites_list')
      }
    },
    left() {
      if (this.focusArea === 'units') {
        this.moveUnitsFocus(-1)
      } else if (this.focusArea === 'location') {
        this.moveLocationFocus(-1)
      } else if (this.focusArea === 'favorites_actions') {
        this.moveFavoritesActionFocus(-1)
      } else if (this.focusArea === 'favorites_list') {
        this.moveFavoritesListFocus(-1)
      }
    },
    right() {
      if (this.focusArea === 'units') {
        this.moveUnitsFocus(1)
      } else if (this.focusArea === 'location') {
        this.moveLocationFocus(1)
      } else if (this.focusArea === 'favorites_actions') {
        this.moveFavoritesActionFocus(1)
      } else if (this.focusArea === 'favorites_list') {
        this.moveFavoritesListFocus(1)
      }
    },
    enter() {
      if (this.focusArea === 'units') {
        this.applyUnitsSelection()
      } else if (this.focusArea === 'location') {
        this.applyLocationSelection()
      } else if (this.focusArea === 'favorites_actions') {
        if (this.favActionFocusIndex === 0) this.addCurrentToFavorites()
        else this.clearAllFavorites()
      } else if (this.focusArea === 'favorites_list') {
        this.removeFocusedFavorite()
      }
    },
    back() {
      this.goBack()
    },
  },
})
