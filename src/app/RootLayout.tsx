import { Outlet } from "@tanstack/react-router"

import { AuthSessionManager } from "@/features/auth/components/AuthSessionManager"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import { AppLoadingScreen } from "@/shared/components/AppLoadingScreen"

const RootLayout = () => {
  const isLoading = useAuthStore((state) => state.isLoading)

  return (
    <div className="h-full w-full text-foreground">
      <AuthSessionManager />
      {isLoading ? <AppLoadingScreen /> : <Outlet />}
    </div>
  )
}

export { RootLayout }
