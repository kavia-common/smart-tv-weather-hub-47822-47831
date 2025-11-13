import Blits from '@lightningjs/blits'

import Loader from '../components/Loader.js'
import TopBar from '../components/TopBar.js'
import SideNav from '../components/SideNav.js'
import WeatherCard from '../components/WeatherCard.js'
import ForecastStrip from '../components/ForecastStrip.js'

import {
  useAppState,
  getSelectedLocation,
  setSelectedLocation,
  getUnits,
  isLoading as getIsLoading,
  setLoading,
  getError,
  setError,
  clearError,
  getLastUpdated,
} from '../state/appState.js'

import { fetchCurrentWeather, fetchForecast } from '../services/weatherService.js'

// Default fallback location (San Francisco) if none selected yet
const DEFAULT_LOCATION = { id: 'sf', name: 'San Francisco', lat: 37.7749, lon: -122.4194 }

export default Blits.Component('Home', {
  components: { Loader, TopBar, SideNav, WeatherCard, ForecastStrip },

  template: `
    <Element w="1920" h="1080" :color="$theme.bg">
      <!-- Top Bar -->
      <TopBar
        title="Weather Hub"
        :location="$locationText"
        :timeText="$timeText"
        :showBack="false"
        :actions="$topActions"
        @onAction="$onTopAction"
      />

      <!-- Side navigation -->
      <SideNav
        x="0"
        y="120"
        :items="$navItems"
        :selectedId="$selectedNav"
        @onSelect="$onNavSelect"
        @onNavigate="$onSideNavNavigate"
      />

      <!-- Main content area -->
      <Element x="340" y="140" w="1540" h="900">
        <!-- Status area -->
        <Element :alpha="$error ? 1 : 0" x="0" y="0" w="1540" h="80" r="16" :color="$theme.error" alpha="0.12">
          <Text x="24" y="24" w="1492" h="32" fontSize="24" :textColor="$theme.errorText" :content="$errorMessage" />
        </Element>

        <!-- Loading overlay -->
        <Element :alpha="$isLoading ? 1 : 0" x="0" y="0" w="1540" h="900" :color="$theme.surface" alpha="0.0" zIndex="5">
          <Loader x="770" y="360" />
        </Element>

        <!-- Weather grid -->
        <Element x="0" y="0" w="1540" h="360">
          <Element x="0" y="0" w="540" h="320">
            <WeatherCard
              ref="card"
              :id="'current'"
              :title="$locationTitle"
              :temperature="$currentTemp"
              :condition="$currentCond"
              :icon="$currentIcon"
              :details="$currentDetails"
            />
          </Element>

          <!-- Last updated + units -->
          <Element x="560" y="0" w="960" h="320" r="20" :color="$theme.surface">
            <Element x="0" y="0" w="960" h="320" :color="$theme.primary" alpha="0.04" r="20" />
            <Element x="1" y="1" w="958" h="318" :color="$theme.surface" r="18" />
            <Text x="24" y="24" w="912" h="36" fontSize="28" :textColor="$theme.text" :content="$panelTitle" />
            <Text x="24" y="68" w="912" h="28" fontSize="22" :textColor="$theme.textSub" :content="$panelSubtitle" />
          </Element>
        </Element>

        <!-- Forecast strip -->
        <Element x="0" y="380" w="1540" h="260">
          <ForecastStrip
            ref="strip"
            :items="$forecastItems"
            :selectedId="$selectedForecastId"
            @onSelect="$onForecastSelect"
            @onNavigate="$onStripNavigate"
          />
        </Element>
      </Element>
    </Element>
  `,

  state() {
    const { selectedLocation, units } = useAppState()
    return {
      // Theme (Ocean Professional)
      theme: {
        primary: 0x2563EBff,
        secondary: 0xF59E0Bff,
        text: 0x111827ff,
        textSub: 0x111827cc,
        bg: 0xf9fafbff,
        surface: 0xffffffff,
        error: 0xEF4444ff,
        errorText: 0xEF4444ff,
      },

      // UI + clock
      timeText: '',
      navItems: [
        { id: 'home', label: 'Home' },
        { id: 'details', label: 'Details' },
        { id: 'settings', label: 'Settings' },
      ],
      selectedNav: 'home',
      topActions: [
        { id: 'refresh', label: 'Refresh' },
        { id: 'units', label: 'Units' },
      ],

      // data
      location: selectedLocation.value || null,
      unitsRef: units.value || 'metric',
      current: null,
      forecast: null,

      // computed display
      locationText: '',
      locationTitle: '',
      currentTemp: '--',
      currentCond: '',
      currentIcon: '',
      currentDetails: [],
      panelTitle: '',
      panelSubtitle: '',
      forecastItems: [],
      selectedForecastId: null,

      // process
      isLoading: false,
      error: null,

      // focus handling: 'nav' | 'card' | 'strip'
      focusArea: 'card',
    }
  },

  hooks: {
    async ready() {
      // Ensure a default location exists
      if (!getSelectedLocation()) {
        setSelectedLocation(DEFAULT_LOCATION)
        this.location = DEFAULT_LOCATION
      } else {
        this.location = getSelectedLocation()
      }

      // initial clock
      this.updateClock()
      this._clock = this.$setInterval(() => this.updateClock(), 60 * 1000)

      // fetch initial data
      await this.refreshData()
      // focus default area
      this.focusCard()
    },
    focus() {
      // Restore focus to current area
      this.applyFocus()
    },
    destroy() {
      if (this._clock) this.$clearInterval(this._clock)
    },
  },

  computed: {
    errorMessage() {
      return this.error ? String(this.error) : ''
    },
  },

  methods: {
    updateClock() {
      const now = new Date()
      this.timeText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },

    buildDisplays() {
      const loc = this.location || DEFAULT_LOCATION
      this.locationText = `${loc.name || 'Unknown'}`
      this.locationTitle = `${loc.name || 'Now'}`

      // Current
      if (this.current?.current) {
        const unit = this.current.units?.temperature || (this.unitsRef === 'imperial' ? 'F' : 'C')
        const t = this.current.current.temperature
        this.currentTemp = t != null ? `${Math.round(t)}°${unit}` : '--'
        this.currentCond = this.current.current.iconKey || ''
        this.currentIcon = this.iconPathFor(this.current.current.iconKey)
        const windUnit = this.current.units?.wind || (this.unitsRef === 'imperial' ? 'mph' : 'km/h')
        this.currentDetails = [
          { label: 'Humidity', value: this.safeVal(this.current.current.humidity, '%') },
          { label: 'Wind', value: this.safeVal(this.current.current.windSpeed, ` ${windUnit}`) },
          { label: 'Direction', value: this.safeVal(this.current.current.windDirection, '°') },
          { label: 'Updated', value: this.formatUpdated(getLastUpdated()) },
        ]
      } else {
        this.currentTemp = '--'
        this.currentCond = ''
        this.currentIcon = ''
        this.currentDetails = []
      }

      // Panel info
      this.panelTitle = 'Overview'
      this.panelSubtitle = this.current?.meta?.source ? `Source: ${this.current.meta.source}` : ''

      // Forecast
      this.forecastItems = Array.isArray(this.forecast?.daily)
        ? this.forecast.daily.map((d, i) => {
            const unit = this.current?.units?.temperature || (this.unitsRef === 'imperial' ? 'F' : 'C')
            const hi = d.high != null ? Math.round(d.high) : null
            const lo = d.low != null ? Math.round(d.low) : null
            const temp = hi != null && lo != null ? `${hi}°/${lo}°${unit}` : '--'
            const id = `${d.date}-${i}`
            return {
              id,
              time: this.formatDateLabel(d.date, i),
              icon: this.iconPathFor(d.iconKey),
              temp,
            }
          })
        : []
      this.selectedForecastId = this.forecastItems[0]?.id || null
    },

    formatDateLabel(dateStr, idx) {
      try {
        const d = new Date(dateStr)
        const today = new Date()
        const diff = Math.floor((d - new Date(today.toDateString())) / (24 * 60 * 60 * 1000))
        if (idx === 0 || diff === 0) return 'Today'
        if (diff === 1) return 'Tomorrow'
        return d.toLocaleDateString(undefined, { weekday: 'short' })
      } catch (_e) {
        return dateStr || ''
      }
    },

    iconPathFor(key) {
      if (!key) return ''
      // Expecting icons at public/assets/weather/<key>.png
      return `assets/weather/${key}.png`
    },

    safeVal(v, suffix = '') {
      if (v == null || !Number.isFinite(Number(v))) return '--'
      return `${Math.round(Number(v))}${suffix}`
    },

    formatUpdated(iso) {
      if (!iso) return '--'
      try {
        const d = new Date(iso)
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      } catch (_e) {
        return '--'
      }
    },

    // Data flow
    async refreshData() {
      const loc = this.location || DEFAULT_LOCATION
      const units = getUnits() || this.unitsRef || 'metric'

      clearError()
      setLoading(true)
      this.isLoading = true
      this.error = null

      try {
        const [current, forecast] = await Promise.all([
          fetchCurrentWeather({ lat: loc.lat, lon: loc.lon, units }),
          fetchForecast({ lat: loc.lat, lon: loc.lon, units, days: 7 }),
        ])
        this.current = current
        this.forecast = forecast
        this.unitsRef = units
        this.buildDisplays()
      } catch (e) {
        this.error = e?.message || String(e)
        setError(this.error)
      } finally {
        setLoading(false)
        this.isLoading = getIsLoading()
      }
    },

    // Actions
    onTopAction(id) {
      if (id === 'refresh') {
        this.refreshData()
      } else if (id === 'units') {
        // toggle units
        this.unitsRef = this.unitsRef === 'metric' ? 'imperial' : 'metric'
        this.refreshData()
      }
    },

    // Side nav
    onNavSelect(id) {
      this.selectedNav = id
      if (id === 'settings') this.$router.to('/settings')
      if (id === 'details') this.$router.to('/details/' + (this.location?.id || 'sf'))
      if (id === 'home') this.$router.to('/')
    },
    onSideNavNavigate(dir) {
      if (dir === 'right' || dir === 'down') {
        this.focusCard()
      }
    },

    // Forecast strip handlers
    onStripNavigate(dir) {
      if (dir === 'up') {
        this.focusCard()
      } else if (dir === 'left') {
        this.focusNav()
      }
    },
    onForecastSelect(id) {
      this.selectedForecastId = id
      // Potentially navigate to day details in future
    },

    // Focus management
    applyFocus() {
      if (this.focusArea === 'nav') {
        const nav = this.$select('SideNav')
        if (nav && nav.$focus) nav.$focus()
      } else if (this.focusArea === 'card') {
        const card = this.$select('card')
        if (card && card.$focus) card.$focus()
      } else if (this.focusArea === 'strip') {
        const strip = this.$select('strip')
        if (strip && strip.$focus) strip.$focus()
      }
    },
    focusNav() {
      this.focusArea = 'nav'
      this.applyFocus()
    },
    focusCard() {
      this.focusArea = 'card'
      this.applyFocus()
    },
    focusStrip() {
      this.focusArea = 'strip'
      this.applyFocus()
    },
  },

  input: {
    up() {
      // Move focus to TopBar doesn't hold focus; keep between card and strip
      if (this.focusArea === 'strip') {
        this.focusCard()
      } else {
        this.focusNav()
      }
    },
    down() {
      if (this.focusArea === 'card') {
        this.focusStrip()
      }
    },
    left() {
      if (this.focusArea === 'card') {
        this.focusNav()
      }
    },
    right() {
      if (this.focusArea === 'nav') {
        this.focusCard()
      }
    },
    enter() {
      // No-op at page; child components handle enter
    },
    back() {
      // Could open exit modal; for now, navigate to settings
      this.$router.to('/settings')
    },
  },
})
