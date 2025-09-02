import { RouterProvider, createRouter, createHashHistory } from '@tanstack/react-router'
import './global.css'

import { routeTree } from './routeTree.gen'

const hashHistory = createHashHistory()
// Set up a Router instance
const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
  history: hashHistory,
})

// Register things for typesafety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
const App = () => {
  return <RouterProvider router={router} />
}

export default App