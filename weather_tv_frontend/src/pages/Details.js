import Blits from '@lightningjs/blits'

/**
 * Details page shows weather details for a specific location.
 * Accepts a route parameter `locationId`.
 */
export default Blits.Component('Details', {
  // Declare props to receive the dynamic route parameter
  props: ['locationId'],

  template: `
    <Element w="1920" h="1080" color="#0b1220">
      <Text x="80" y="60" size="48" color="#F59E0B" content="Location Details" />
      <Text x="80" y="130" size="36" color="#ffffff" :content="'Location ID: ' + $locationId" />
      <Text x="80" y="200" size="28" color="#93c5fd" content="Use Back to return, Enter to go to Settings." />

      <!-- Simple hint box -->
      <Element x="80" y="260" w="600" h="4" color="#2563EB" />
    </Element>
  `,

  state() {
    return {
      // internal page state can be expanded later when integrating API calls
    }
  },

  hooks: {
    ready() {
      // Focus management or initial animations could go here
    },
    focus() {
      // Page-level focus received
    },
  },

  // Input handlers for TV remotes
  input: {
    back() {
      // Navigate back to previous page
      this.$router.back()
    },
    enter() {
      // Quick navigation to settings page as an example action
      this.$router.to('/settings')
    },
    left() {},
    right() {},
    up() {},
    down() {},
  },
})
