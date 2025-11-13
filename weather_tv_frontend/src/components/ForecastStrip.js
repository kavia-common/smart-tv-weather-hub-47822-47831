import Blits from '@lightningjs/blits'

/**
 * ForecastStrip - Horizontal list of forecast items (hourly/daily).
 *
 * Props:
 * - items: [{ id: string, time: string, icon: string, temp: string }]
 * - selectedId: string (optional) - current selected item id
 *
 * Events:
 * - onSelect: (id) when an item is pressed
 * - onNavigate: (direction) when user navigates out (up/down/left/right)
 */
// PUBLIC_INTERFACE
export default Blits.Component('ForecastStrip', {
  props: ['items', 'selectedId'],

  state() {
    return {
      focusIndex: 0,
      scrollX: 0,
      itemWidth: 150,
      viewportWidth: 1200,
      paddingX: 40,
      colors: {
        primary: 0x2563EBff,
        secondary: 0xF59E0Bff,
        text: 0x111827ff,
        surface: 0xffffffff,
      },
    }
  },

  computed: {
    safeItems() {
      return Array.isArray(this.items) ? this.items : []
    },
  },

  methods: {
    ensureVisible() {
      const left = this.focusIndex * this.itemWidth
      const right = left + this.itemWidth
      const viewLeft = -this.scrollX
      const viewRight = viewLeft + this.viewportWidth

      if (left < viewLeft) {
        this.scrollX = -left
      } else if (right > viewRight) {
        this.scrollX = -(right - this.viewportWidth)
      }
    },

    // PUBLIC_INTERFACE
    setFocusIndex(idx) {
      if (!this.safeItems.length) return
      this.focusIndex = Math.max(0, Math.min(this.safeItems.length - 1, idx))
      this.ensureVisible()
    },
  },

  template: `
    <Element w="1400" h="240" :color="$colors.surface" r="20">
      <Element x="0" y="0" w="1400" h="240" :color="$colors.primary" alpha="0.04" r="20" />
      <Element x="1" y="1" w="1398" h="238" :color="0xffffffff" r="18" />
      <!-- focus top bar -->
      <Element x="0" y="0" w="1400" h="6" :color="$colors.secondary" alpha="0.35" />

      <!-- viewport -->
      <Element :x="$paddingX" y="30" :w="$viewportWidth" h="180" clipping="true">
        <Element :x="$scrollX" y="0" :w="$safeItems.length * $itemWidth" h="180">
          <Element
            :for="(it, i) in $safeItems"
            :key="$it.id"
            :x="$i * $itemWidth"
            y="0"
            w="140"
            h="180"
            r="16"
            :color="$it.id === $selectedId ? $colors.primary : 0x00000000"
            :alpha="$it.id === $selectedId ? 0.12 : 0"
          >
            <Element :alpha="$i === $focusIndex ? 1 : 0" w="140" h="180" r="16" :color="$colors.secondary" alpha="0.35" />
            <Element x="1" y="1" w="138" h="178" r="16" :color="$colors.surface" />
            <Text x="16" y="16" w="108" h="24" :content="$it.time" fontSize="20" :textColor="$colors.text" />
            <Element x="28" y="48" w="84" h="84" r="12" :color="$colors.primary" alpha="0.05">
              <Element src="$it.icon" x="8" y="8" w="68" h="68" />
            </Element>
            <Text x="16" y="140" w="108" h="28" :content="$it.temp" fontSize="22" :textColor="$colors.primary" />
          </Element>
        </Element>
      </Element>
    </Element>
  `,

  input: {
    left() {
      if (this.focusIndex <= 0) {
        if (this.onNavigate) this.onNavigate('left')
      } else {
        this.setFocusIndex(this.focusIndex - 1)
      }
    },
    right() {
      if (this.focusIndex >= this.safeItems.length - 1) {
        if (this.onNavigate) this.onNavigate('right')
      } else {
        this.setFocusIndex(this.focusIndex + 1)
      }
    },
    up() {
      if (this.onNavigate) this.onNavigate('up')
    },
    down() {
      if (this.onNavigate) this.onNavigate('down')
    },
    enter() {
      const it = this.safeItems[this.focusIndex]
      if (it && this.onSelect) this.onSelect(it.id)
    },
    back() {
      if (this.onNavigate) this.onNavigate('back')
    },
  },
})
