import Blits from '@lightningjs/blits'

/**
 * WeatherCard - Displays current weather info with icon, temperature, and details.
 *
 * Props:
 * - id: string - unique identifier (for lists)
 * - title: string - e.g., "Now" or location name
 * - temperature: string - e.g., "24°C"
 * - condition: string - e.g., "Partly Cloudy"
 * - icon: string - can be a semantic key (sunny, cloudy, rain, snow, storm, fog) or a full path under /assets/
 * - details: [{ label: string, value: string }]
 * - focused: boolean - external focus control (optional)
 *
 * Events:
 * - onPress: (id) fired on enter
 */
// PUBLIC_INTERFACE
export default Blits.Component('WeatherCard', {
  props: ['id', 'title', 'temperature', 'condition', 'icon', 'details', 'focused'],

  state() {
    return {
      isFocused: false,
      colors: {
        primary: 0x2563EBff,
        secondary: 0xF59E0Bff,
        text: 0x111827ff,
        surface: 0xffffffff,
        error: 0xEF4444ff,
      },
    }
  },

  computed: {
    iconSrc() {
      const icon = this.icon || 'sunny'
      if (typeof icon === 'string' && icon.startsWith('/assets/')) return icon
      const map = {
        sunny: '/assets/sunny.png',
        clear: '/assets/sunny.png',
        cloudy: '/assets/cloudy.png',
        overcast: '/assets/cloudy.png',
        rain: '/assets/rain.png',
        drizzle: '/assets/rain.png',
        snow: '/assets/snow.png',
        storm: '/assets/storm.png',
        thunder: '/assets/storm.png',
        fog: '/assets/fog.png',
        mist: '/assets/fog.png',
      }
      return map[icon] || '/assets/sunny.png'
    },
  },

  watch: {
    focused(v) {
      this.isFocused = !!v
    },
  },

  methods: {
    // PUBLIC_INTERFACE
    setFocus(v) {
      this.isFocused = !!v
    },
  },

  template: `
    <Element w="520" h="300" r="20" :color="$colors.surface">
      <!-- subtle border -->
      <Element x="0" y="0" w="520" h="300" r="20" :color="$colors.primary" alpha="0.08" />
      <Element x="2" y="2" w="516" h="296" r="18" :color="0xffffffff" />

      <!-- focus ring -->
      <Element :alpha="$isFocused ? 1 : 0" x="-6" y="-6" w="532" h="312" r="24" :color="$colors.secondary" alpha="0.35" />

      <!-- content -->
      <Text x="24" y="20" w="320" h="36" :content="$title || ''" fontSize="28" :textColor="$colors.text" />
      <Text x="24" y="60" w="320" h="44" :content="$temperature || '--'" fontSize="40" :textColor="$colors.primary" />
      <Text x="24" y="110" w="320" h="30" :content="$condition || ''" fontSize="24" :textColor="$colors.text" alpha="0.9" />

      <!-- icon -->
      <Element x="360" y="24" w="136" h="136" r="16" :color="$colors.primary" alpha="0.05">
        <Element>
          <Element :src="$iconSrc" x="12" y="12" w="112" h="112" />
        </Element>
      </Element>

      <!-- details grid -->
      <Element x="24" y="160" w="472" h="116">
        <Element :for="(d, i) in $details" :key="$i" :x="($i % 2) * 236" :y="Math.floor($i / 2) * 56" w="220" h="48">
          <Text x="0" y="0" w="220" h="24" :content="$d.label" fontSize="20" :textColor="$colors.text" alpha="0.7" />
          <Text x="0" y="24" w="220" h="24" :content="$d.value" fontSize="22" :textColor="$colors.primary" />
        </Element>
      </Element>
    </Element>
  `,

  input: {
    enter() {
      if (this.onPress) this.onPress(this.id)
    },
    up() { if (this.parent && this.parent.focus) this.parent.focus() },
    down() { if (this.parent && this.parent.focus) this.parent.focus() },
    left() { if (this.parent && this.parent.focus) this.parent.focus() },
    right() { if (this.parent && this.parent.focus) this.parent.focus() },
    back() { if (this.parent && this.parent.focus) this.parent.focus() },
  },
})
