import Blits from '@lightningjs/blits'

/**
 * Toast - Transient notification banner.
 *
 * Props:
 * - message: string
 * - type: 'info' | 'success' | 'error'
 * - visible: boolean
 *
 * Events:
 * - onClose: () when dismissed (back or auto-close via page logic)
 */
// PUBLIC_INTERFACE
export default Blits.Component('Toast', {
  props: ['message', 'type', 'visible'],

  state() {
    return {
      colors: {
        primary: 0x2563EBff,
        secondary: 0xF59E0Bff,
        error: 0xEF4444ff,
        surface: 0xffffffff,
        text: 0x111827ff,
      },
    }
  },

  computed: {
    barColor() {
      if (this.type === 'error') return this.colors.error
      if (this.type === 'success') return this.colors.secondary
      return this.colors.primary
    },
  },

  methods: {
    // PUBLIC_INTERFACE
    hide() {
      if (this.onClose) this.onClose()
    },
  },

  template: `
    <Element :alpha="$visible ? 1 : 0" x="460" y="940" w="1000" h="100" r="16" :color="$colors.surface" zIndex="1000">
      <Element x="0" y="0" w="1000" h="100" :color="$barColor" alpha="0.08" r="16" />
      <Element x="0" y="0" w="8" h="100" :color="$barColor" alpha="0.65" r="16" />
      <Text x="24" y="34" w="952" h="32" :content="$message || ''" fontSize="26" :textColor="$colors.text" />
    </Element>
  `,

  input: {
    enter() { this.hide() },
    back() { this.hide() },
    up() { if (this.parent && this.parent.focus) this.parent.focus() },
    down() { if (this.parent && this.parent.focus) this.parent.focus() },
    left() { if (this.parent && this.parent.focus) this.parent.focus() },
    right() { if (this.parent && this.parent.focus) this.parent.focus() },
  },
})
