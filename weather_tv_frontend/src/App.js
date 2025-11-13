import Blits from '@lightningjs/blits'

import Home from './pages/Home.js'
import Details from './pages/Details.js'
import Settings from './pages/Settings.js'

// Import newly created UI components so they are available to pages
import TopBar from './components/TopBar.js'
import SideNav from './components/SideNav.js'
import WeatherCard from './components/WeatherCard.js'
import ForecastStrip from './components/ForecastStrip.js'
import Toast from './components/Toast.js'

export default Blits.Application({
  components: { TopBar, SideNav, WeatherCard, ForecastStrip, Toast },
  template: `
    <Element w="1920" h="1080" color="0xff000000">
      <RouterView />
    </Element>
  `,
  routes: [
    { path: '/', component: Home },
    { path: '/details/:locationId', component: Details, options: { props: true } },
    { path: '/settings', component: Settings },
  ],
})
