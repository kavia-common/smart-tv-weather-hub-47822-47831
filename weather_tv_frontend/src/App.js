import Blits from '@lightningjs/blits'

import Home from './pages/Home.js'
import Details from './pages/Details.js'
import Settings from './pages/Settings.js'

export default Blits.Application({
  template: `
    <Element>
      <RouterView />
    </Element>
  `,
  routes: [
    { path: '/', component: Home },
    { path: '/details/:locationId', component: Details, options: { props: true } },
    { path: '/settings', component: Settings },
  ],
})
