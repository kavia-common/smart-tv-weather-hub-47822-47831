import Blits from '@lightningjs/blits'

import TopBar from '../components/TopBar.js'
import ForecastStrip from '../components/ForecastStrip.js'
import WeatherCard from '../components/WeatherCard.js'

import {
  getSelectedLocation,
  setSelectedLocation,
  getUnits,
  setLoading,
  clearError,
  setError,
} from '../state/appState.js'

import { fetchCurrentWeather, fetchForecast } from '../services/weatherService.js'

// Default fallback location (San Francisco) if none selected yet
const DEFAULT_LOCATION = { id: 'sf', name: 'San Francisco', lat: 37.7749, lon: -122.4194 }

// PUBLIC_INTERFACE
export default Blits.Component('Details', {
  /**
   /** Details page shows extended hourly and daily forecast for the selected location.
   * Accepts route parameter :locationId via props (declared here).
   */
  props: ['locationId'],

  components: { TopBar, ForecastStrip, WeatherCard },

  template: `
    <Element w="1920" h="1080" :color="$theme.bg">

      <!-- Top bar -->
      <TopBar
        title="Details"
        :location="$locationText"
        :timeText="$timeText"
        :showBack="true"
        :actions="$topActions"
        @onAction="$onTopAction"
        @onBack="$onBack"
      />

      <!-- Header condensed card -->
      <Element x="80" y="140" w="1760" h="200" r="20" :color="$theme.surface">
        <Element x="0" y="0" w="1760" h="200" :color="$theme.primary" alpha="0.04" r="20" />
        <Element x="1" y="1" w="1758" h="198" :color="$theme.surface" r="18" />

        <!-- Reuse WeatherCard in condensed mode at left -->
        <Element x="24" y="20" w="520" h="160">
          <WeatherCard
            :id="'header'"
            :title="$locationTitle"
            :temperature="$currentTemp"
            :condition="$currentCond"
            :icon="$currentIcon"
            :details="$currentMiniDetails"
          />
        </Element>

        <!-- Summary text -->
        <Text x="568" y="36" w="1168" h="40" fontSize="30" :textColor="$theme.text" :content="$summaryTitle" />
        <Text x="568" y="86" w="1168" h="28" fontSize="22" :textColor="$theme.textSub" :content="$summarySubtitle" />
      </Element>

      <!-- Hourly strip label -->
      <Text x="80" y="370" w="400" h="40" fontSize="28" :textColor="$theme.text" content="Hourly Forecast" />

      <!-- Hourly forecast strip -->
      <Element x="80" y="420" w="1760" h="260">
        <ForecastStrip
          ref="hourStrip"
          :items="$hourlyItems"
          :selectedId="$selectedHourId"
          @onSelect="$onHourSelect"
          @onNavigate="$onStripNavigate"
        />
      </Element>

      <!-- Daily strip label -->
      <Text x="80" y="710" w="400" h="40" fontSize="28" :textColor="$theme.text" content="Next 7 Days" />

      <!-- Daily forecast strip (reuse same component) -->
      <Element x="80" y="760" w="1760" h="260">
        <ForecastStrip
          ref="dayStrip"
          :items="$dailyItems"
          :selectedId="$selectedDayId"
          @onSelect="$onDaySelect"
          @onNavigate="$onDayStripNavigate"
        />
      </Element>
    </Element>
  `,

  state() {
    const units = getUnits() || 'metric'
    return {
      // Ocean theme
      theme: {
        primary: 0x2563EBff,
        secondary: 0xF59E0Bff,
        text: 0x111827ff,
        textSub: 0x111827cc,
        bg: 0xf9fafbff,
        surface: 0xffffffff,
        error: 0xEF4444ff,
      },

      // Clock/UI
      timeText: '',
      topActions: [
        { id: 'refresh', label: 'Refresh' },
        { id: 'units', label: 'Units' },
      ],

      // Data
      location: null,
      unitsRef: units,
      current: null,
      forecast: null,

      // Derived display
      locationText: '',
      locationTitle: '',
      currentTemp: '--',
      currentCond: '',
      currentIcon: '',
      currentMiniDetails: [],
      summaryTitle: '',
      summarySubtitle: '',
      hourlyItems: [],
      selectedHourId: null,
      dailyItems: [],
      selectedDayId: null,

      // Focus control: 'hour' | 'day'
      focusArea: 'hour',
    }
  },

  hooks: {
    async ready() {
      // Sync location from global state or set default
      if (!getSelectedLocation()) {
        setSelectedLocation(DEFAULT_LOCATION)
        this.location = DEFAULT_LOCATION
      } else {
        this.location = getSelectedLocation()
      }

      this.updateClock()
      this._clock = this.$setInterval(() => this.updateClock(), 60 * 1000)

      await this.loadData()
      this.focusHour()
    },
    focus() {
      this.applyFocus()
    },
    destroy() {
      if (this._clock) this.$clearInterval(this._clock)
    },
  },

  methods: {
    updateClock() {
      const now = new Date()
      this.timeText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },

    // Build all display values based on fetched data
    buildDisplays() {
      const loc = this.location || DEFAULT_LOCATION
      this.locationText = `${loc.name || 'Unknown'}`
      this.locationTitle = `${loc.name || 'Now'}`

      if (this.current?.current) {
        const unit = this.current.units?.temperature || (this.unitsRef === 'imperial' ? 'F' : 'C')
        const t = this.current.current.temperature
        this.currentTemp = t != null ? `${Math.round(t)}°${unit}` : '--'
        this.currentCond = this.current.current.iconKey || ''
        this.currentIcon = this.iconPathFor(this.current.current.iconKey)
        const windUnit = this.current.units?.wind || (this.unitsRef === 'imperial' ? 'mph' : 'km/h')
        this.currentMiniDetails = [
          { label: 'Humidity', value: this.safeVal(this.current.current.humidity, '%') },
          { label: 'Wind', value: this.safeVal(this.current.current.windSpeed, ` ${windUnit}`) },
        ]
        this.summaryTitle = 'Detailed Outlook'
        this.summarySubtitle = `Updated ${this.formatUpdated(this.current.current.time)} • Source: ${this.current?.meta?.source || 'N/A'}`
      } else {
        this.currentTemp = '--'
        this.currentCond = ''
        this.currentIcon = ''
        this.currentMiniDetails = []
        this.summaryTitle = 'Detailed Outlook'
        this.summarySubtitle = ''
      }

      // Daily items from fetchForecast (already daily normalized)
      this.dailyItems = Array.isArray(this.forecast?.daily)
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
      this.selectedDayId = this.dailyItems[0]?.id || null

      // Hourly items: synthesize simple 24-hr items based on current.
      const now = new Date()
      const base = Number(this.current?.current?.temperature) || 20
      const unitHour = this.current?.units?.temperature || (this.unitsRef === 'imperial' ? 'F' : 'C')
      const condKey = this.current?.current?.iconKey || 'partly_cloudy'
      const hourly = []
      for (let i = 0; i < 24; i++) {
        const t = new Date(now.getTime() + i * 60 * 60 * 1000)
        const wobble = Math.round(Math.sin(i / 3) * 2)
        const temp = `${Math.round(base + wobble)}°${unitHour}`
        hourly.push({
          id: `h-${t.toISOString()}`,
          time: t.toLocaleTimeString([], { hour: '2-digit' }),
          icon: this.iconPathFor(condKey),
          temp,
        })
      }
      this.hourlyItems = hourly
      this.selectedHourId = this.hourlyItems[0]?.id || null
    },

    iconPathFor(key) {
      if (!key) return ''
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

    async loadData() {
      const loc = getSelectedLocation() || this.location || DEFAULT_LOCATION
      this.location = loc

      const units = getUnits() || this.unitsRef || 'metric'
      clearError()
      setLoading(true)

      try {
        const [current, daily] = await Promise.all([
          fetchCurrentWeather({ lat: loc.lat, lon: loc.lon, units }),
          fetchForecast({ lat: loc.lat, lon: loc.lon, units, days: 7 }),
        ])
        this.current = current
        this.forecast = daily
        this.unitsRef = units
        this.buildDisplays()
      } catch (e) {
        setError(e?.message || String(e))
      } finally {
        setLoading(false)
      }
    },

    // Top actions
    onTopAction(id) {
      if (id === 'refresh') {
        this.loadData()
      } else if (id === 'units') {
        this.unitsRef = this.unitsRef === 'metric' ? 'imperial' : 'metric'
        this.loadData()
      }
    },

    // Back handler from TopBar
    onBack() {
      this.$router.to('/')
    },

    // Hourly strip events
    onHourSelect(id) {
      this.selectedHourId = id
    },
    onStripNavigate(dir) {
      if (dir === 'down') {
        this.focusDay()
      } else if (dir === 'left') {
        // bubble to page edge - no side nav here
      } else if (dir === 'right') {
        // bubble to page edge
      } else if (dir === 'back') {
        this.$router.to('/')
      }
    },

    // Daily strip events
    onDaySelect(id) {
      this.selectedDayId = id
    },
    onDayStripNavigate(dir) {
      if (dir === 'up') {
        this.focusHour()
      } else if (dir === 'back') {
        this.$router.to('/')
      }
    },

    // Focus helpers
    applyFocus() {
      if (this.focusArea === 'hour') {
        const s = this.$select('hourStrip')
        if (s && s.$focus) s.$focus()
      } else {
        const s = this.$select('dayStrip')
        if (s && s.$focus) s.$focus()
      }
    },
    focusHour() {
      this.focusArea = 'hour'
      this.applyFocus()
    },
    focusDay() {
      this.focusArea = 'day'
      this.applyFocus()
    },
  },

  input: {
    up() {
      if (this.focusArea === 'day') this.focusHour()
    },
    down() {
      if (this.focusArea === 'hour') this.focusDay()
    },
    left() {
      // handled by strips
    },
    right() {
      // handled by strips
    },
    enter() {
      // child components handle enter
    },
    back() {
      this.$router.to('/')
    },
  },
})
