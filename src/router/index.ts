import { createBrowserRouter } from 'react-router'
import routes from './routes'
import { buildRouter } from './utils'

const router = createBrowserRouter(buildRouter(routes))
export default router
