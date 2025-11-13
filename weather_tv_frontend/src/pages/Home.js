import Blits from '@lightningjs/blits'

import Loader from '../components/Loader.js'
import Button from '../components/Button.js'
import TopBar from '../components/TopBar.js'
import SideNav from '../components/SideNav.js'

const colors = ['#f5f3ff', '#ede9fe', '#ddd6fe', '#c4b5fd', '#a78bfa']

export default Blits.Component('Home', {
  components: {
    Loader,
    Button,
    TopBar,
    SideNav,
  },
  template: `
    <Element w="1920" h="1080" color="#f9fafb">
      <!-- Ocean Professional Top Bar -->
      <TopBar
        title="Weather Hub"
        location="Welcome"
        :timeText="$timeText"
        :showBack="false"
        :actions="[{id:'act1',label:'Action'}]"
        @onAction="$onTopAction"
      />

      <!-- Side navigation rail -->
      <SideNav
        x="0"
        y="120"
        :items="$navItems"
        :selectedId="$selectedNav"
        @onSelect="$onNavSelect"
      />

      <!-- Preserve existing demo animation content centered area -->
      <Element x="320" y="0" w="1600" h="1080">
        <Element :y.transition="$y">
          <Element
            src="assets/logo.png"
            w="200"
            h="200"
            :scale.transition="{value: $scale, duration: 500}"
            :rotation.transition="{value: $rotation, duration: 800}"
            :x.transition="{value: $x, delay: 200, duration: 1200, easing: 'cubic-bezier(1,-0.64,.39,1.44)'}"
            mount="{x: 0.5}"
            y="320"
            :effects="[$shader('radius', {radius: 8})]"
          />
          <Loader :x="(1600 / 2)" mount="{x: 0.5}" y="600" w="160" :alpha.transition="$loaderAlpha" :loaderColor="$color" />
          <Element y="600" :alpha.transition="$textAlpha">
            <Text size="80" align="center" maxwidth="1600">Hello!</Text>
            <Text
              size="50"
              align="center"
              y="120"
              :x="1600/2"
              maxwidth="500"
              lineheight="64"
              mount="{x: 0.5}"
              color="#111827aa"
              content="Let's get started with Lightning 3 & Blits"
            />
          </Element>
        </Element>

        <Element w="13.5%" h="40" x="43%" y="10%" color="{top: '#763efb', bottom: '#433484'}">
          <Button ref="btn" />
        </Element>
      </Element>
    </Element>
  `,
  state() {
    return {
      /**
       * Y-position of the entire page contents
       * @type {number}
       */
      y: 0,
      /**
       * X-position of the logo, used to create slide in transition
       * @type {number}
       */
      x: -1000,
      /**
       * Rotation of the logo, used to create a spinning transition
       * @type {number}
       */
      rotation: 0,
      /**
       * Scale of the logo, used to create a zoom-in / zoom-out transition
       * @type {number}
       */
      scale: 1,
      /**
       * Alpha of the loader component, used to create a fade-in / fade-out transition
       * @type {number}
       */
      loaderAlpha: 0,
      /**
       * Alpha of the text, used to create a fade-in transition
       * @type {number}
       */
      textAlpha: 0,
      /**
       * Color passed into the loader component
       * @type {string}
       */
      color: '',

      // New UI state
      timeText: '',
      navItems: [
        { id: 'home', label: 'Home' },
        { id: 'details', label: 'Details' },
        { id: 'settings', label: 'Settings' },
      ],
      selectedNav: 'home',
    }
  },
  hooks: {
    ready() {
      this.rotateColors(200)

      this.loaderAlpha = 1
      this.x = 1920 / 2

      this.$setTimeout(() => {
        this.rotation = 720
        this.scale = 1.5
      }, 3000)

      this.$setTimeout(() => {
        this.scale = 1
      }, 3000 + 300)

      this.$setTimeout(() => {
        this.y = -60
        this.loaderAlpha = 0
        this.scale = 1
        this.textAlpha = 1
      }, 6000)

      // clock update
      this.updateClock()
      this._clock = this.$setInterval(() => this.updateClock(), 60 * 1000)
    },
    focus() {
      this.$select('btn').$focus() // Select the button with the ref 'btn'
    },
    destroy() {
      if (this._clock) this.$clearInterval(this._clock)
    }
  },
  methods: {
    /**
     * Method to rotate the colors of the loader
     * @param {number} interval - interval in ms
     */
    rotateColors(interval) {
      let i = 0
      this.$setInterval(() => {
        i++
        if (i >= colors.length) i = 0
        this.color = colors[i]
      }, interval)
    },

    updateClock() {
      const now = new Date()
      this.timeText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },

    // handle top bar action
    onTopAction(id) {
      // simple placeholder action
      if (id === 'act1') {
        // no-op
      }
    },

    // handle side nav selection
    onNavSelect(id) {
      this.selectedNav = id
      if (id === 'settings') this.$router.to('/settings')
      if (id === 'details') this.$router.to('/details/sf')
      if (id === 'home') this.$router.to('/')
    },
  },
})
