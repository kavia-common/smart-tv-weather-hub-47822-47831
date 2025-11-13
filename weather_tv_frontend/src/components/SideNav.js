import Blits from '@lightningjs/blits'

/**
 * SideNav - Vertical navigation rail for TV.
 *
 * Props:
 * - items: [{ id: string, label: string, icon?: string }] icon is optional (path under public/assets/)
 * - selectedId: string - current selected id to highlight
 *
 * Events:
 * - onSelect: (id) when enter is pressed on a focused item
 * - onNavigate: (direction) when user attempts to navigate out (left/right/up/down) for page wiring
 */
// PUBLIC_INTERFACE
export default Blits.Component('SideNav', {
  props: ['items', 'selectedId'],

  state() {
    return {
      focusIndex: 0,
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
    // PUBLIC_INTERFACE
    setFocusIndex(idx) {
      if (!this.safeItems.length) return
      this.focusIndex = Math.max(0, Math.min(this.safeItems.length - 1, idx))
    },
  },

  template: `
    <Element w="320" h="1080" :color="$colors.surface">
      <!-- right border -->
      <Element x="319" y="0" w="1" h="1080" :color="$colors.primary" alpha="0.15" />
      <Element x="0" y="0" w="320" h="1080" :color="$colors.primary" alpha="0.04" />

      <Element x="32" y="120" w="256" h="840">
        <Element
          :for="(item, index) in $safeItems"
          :key="$item.id"
          :y="$index * 96"
          w="256"
          h="80"
          r="12"
          :color="$item.id === $selectedId ? $colors.primary : 0x00000000"
          :alpha="$item.id === $selectedId ? 0.15 : 0"
        >
          <!-- focus visual -->
          <Element :alpha="$index === $focusIndex ? 1 : 0" w="256" h="80" r="12" :color="$colors.secondary" alpha="0.35" />
          <Element x="1" y="1" w="254" h="78" r="12" :color="$colors.surface" alpha="1" />
          <!-- optional icon -->
          <Element x="16" y="16" w="48" h="48">
            <Element :alpha="$item.icon ? 1 : 0">
              <Element src="$item.icon" w="48" h="48" />
            </Element>
            <Element :alpha="$item.icon ? 0 : 1" w="48" h="48" :color="$colors.primary" alpha="0.12" r="8" />
          </Element>
          <Text x="80" y="26" w="160" h="28" :content="$item.label" fontSize="24"
            :textColor="$index === $focusIndex ? $colors.primary : $colors.text" />
        </Element>
      </Element>
    </Element>
  `,

  input: {
    up() {
      this.setFocusIndex(this.focusIndex - 1)
    },
    down() {
      this.setFocusIndex(this.focusIndex + 1)
    },
    left() {
      if (this.onNavigate) this.onNavigate('left')
    },
    right() {
      if (this.onNavigate) this.onNavigate('right')
    },
    enter() {
      const item = this.safeItems[this.focusIndex]
      if (item && this.onSelect) this.onSelect(item.id)
    },
    back() {
      if (this.onNavigate) this.onNavigate('back')
    },
  },
})
