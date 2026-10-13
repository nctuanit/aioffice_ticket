import { RouterProvider } from "@tanstack/react-router"

import { AppProviders } from "@/app/providers/AppProviders"
import { router } from "@/routes/router"

const App = () => (
  <AppProviders>
    <RouterProvider router={router} />
  </AppProviders>
)

export { App }
