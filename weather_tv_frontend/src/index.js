import Blits from '@lightningjs/blits'
import App from './App.js'

// Launch the application with TV-friendly resolution and key mappings.
// Note: Font setup remains optional.
Blits.Launch(App, 'app', {
  w: 1920,
  h: 1080,
  debugLevel: 1,
  // Key map: TV remote and keyboard fallbacks
  keys: {
    up: ['ArrowUp'],
    down: ['ArrowDown'],
    left: ['ArrowLeft'],
    right: ['ArrowRight'],
    enter: ['Enter', 'OK'],
    back: ['Back', 'Escape', 'Esc']
  }
})
