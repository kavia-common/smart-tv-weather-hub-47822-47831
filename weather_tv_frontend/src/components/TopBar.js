import Blits from '@lightningjs/blits'

/**
 * TopBar - Displays application title, current location, time, and optional actions.
 * Ocean Professional theme: primary blue with subtle gradient and amber accent highlights.
 *
 * Props:
 * - title: string - App title
 * - location: string - Current location/city text
 * - timeText: string - Current time string
 * - showBack: boolean - Show a back indicator on the left
 * - actions: [{ id: string, label: string }] - Optional right-side action items
 *
 * Events:
 * - onAction: (id) when an action item is pressed (enter)
 * - onBack: () when back is pressed or back button event received
 */
// PUBLIC_INTERFACE
export default Blits.Component('TopBar', {
  props: ['title', 'location', 'timeText', 'showBack', 'actions'],

  state() {
    return {
      focusedIndex: 0,
      colors: {
        primary: 0x2563EBff,   // #2563EB
        secondary: 0xF59E0Bff, // #F59E0B
        text: 0x111827ff,      // #111827
        surface: 0xffffffff,   // #ffffff
        bg: 0xf9fafbff,        // #f9fafb
      },
    }
  },

  computed: {
    hasActions() {
      return Array.isArray(this.actions) && this.actions.length > 0
    },
  },

  methods: {
    // PUBLIC_INTERFACE
    setFocusIndex(idx) {
      if (!this.hasActions) return
      this.focusedIndex = Math.max(0, Math.min(this.actions.length - 1, idx))
    },

    // PUBLIC_INTERFACE
    focusFirstAction() {
      if (!this.hasActions) return
      this.focusedIndex = 0
    },
  },

  template: `
    <Element w="1920" h="120" :color="$colors.surface" zIndex="100">
      <!-- Subtle top gradient band for depth -->
      <Element x="0" y="0" w="1920" h="120" :color="$colors.primary" alpha="0.06" />

      <!-- Bottom hairline border -->
      <Element x="0" y="119" w="1920" h="1" :color="$colors.primary" alpha="0.15" />

      <!-- Left: Back indicator + Title/Location -->
      <Element x="72" y="26" w="1100" h="68">
        <Element :alpha="$showBack ? 1 : 0" y="10" w="48" h="48" :color="$colors.primary" alpha="0.12" r="8">
          <!-- simple chevron using two rectangles -->
          <Element x="18" y="12" w="4" h="24" :color="$colors.primary" rotation="45" />
          <Element x="18" y="12" w="4" h="24" :color="$colors.primary" rotation="-45" />
        </Element>
        <!-- Use computed bindings instead of inline expressions -->
        <Text :x="$showBack ? 64 : 0" y="0" w="900" h="42" :content="$title || 'Weather Hub'" fontSize="36" :textColor="$colors.text" />
        <Text :x="$showBack ? 64 : 0" y="40" w="900" h="28" :content="$location || ''" fontSize="24" :textColor="$colors.primary" alpha="0.9" />
      </Element>

      <!-- Right: Time + Actions -->
      <Element x="1200" y="26" w="648" h="68">
        <Text x="0" y="10" w="220" h="42" :content="$timeText || ''" fontSize="28" :textColor="$colors.text" alpha="0.9" />
        <Element x="240" y="0" w="408" h="68">
          <Element 
            :for="(item, index) in $actions" 
            :key="$item.id"
            :x="$index * 140"
            y="0"
            w="132"
            h="56"
            r="12"
            :color="$index === $focusedIndex ? $colors.primary : 0x00000000"
            :alpha="$index === $focusedIndex ? 0.2 : 0.08"
          >
            <Element x="1" y="1" w="130" h="54" r="12" :color="$colors.surface" alpha="1" />
            <Text x="16" y="14" w="100" h="28" :content="$item.label" fontSize="24" 
              :textColor="$index === $focusedIndex ? $colors.primary : $colors.text" />
            <!-- focus outline -->
            <Element 
              :alpha="$index === $focusedIndex ? 1 : 0"
              x="0" y="0" w="132" h="56" r="12" :color="$colors.secondary" alpha="0.35"
            />
          </Element>
        </Element>
      </Element>
    </Element>
  `,

  input: {
    left() {
      if (!this.hasActions) return this.parent && this.parent.focus && this.parent.focus()
      this.setFocusIndex(this.focusedIndex - 1)
    },
    right() {
      if (!this.hasActions) return this.parent && this.parent.focus && this.parent.focus()
      this.setFocusIndex(this.focusedIndex + 1)
    },
    up() {
      // bubble up for page-level nav
      if (this.parent && this.parent.focus) this.parent.focus()
    },
    down() {
      // bubble down to content
      if (this.parent && this.parent.focus) this.parent.focus()
    },
    enter() {
      if (!this.hasActions) return
      const item = this.actions[this.focusedIndex]
      if (item && this.onAction) this.onAction(item.id)
    },
    back() {
      if (this.onBack) this.onBack()
    },
  },
})
