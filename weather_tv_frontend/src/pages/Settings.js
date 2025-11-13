import Blits from '@lightningjs/blits'

/**
 * Settings page provides user-configurable options (placeholder).
 * Demonstrates basic navigation and input handling.
 */
export default Blits.Component('Settings', {
  template: `
    <Element w="1920" h="1080" color="#0b1220">
      <Text x="80" y="60" size="48" color="#F59E0B" content="Settings" />
      <Text x="80" y="130" size="32" color="#ffffff" content="This is a placeholder for Settings." />
      <Text x="80" y="180" size="28" color="#93c5fd" content="Press Back to return or Enter to go Home." />

      <Element x="80" y="240" w="600" h="4" color="#2563EB" />
    </Element>
  `,

  hooks: {
    ready() {},
    focus() {},
  },

  input: {
    back() {
      this.$router.back()
    },
    enter() {
      this.$router.to('/')
    },
    left() {},
    right() {},
    up() {},
    down() {},
  },
})
