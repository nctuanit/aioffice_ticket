import { isRedirect, redirect } from "@tanstack/react-router"

import { getCurrentUser } from "@/features/auth/api/auth.api"
import { useAuthStore } from "@/features/auth/stores/auth.store"
import {
  isStaffRole,
  type UserProfile,
} from "@/features/auth/types/auth-api.types"
import { tokenManager } from "@/lib/auth"

const HOME_PATH = "/tickets" as const

const hasAuthSession = () =>
  Boolean(tokenManager.getAccessToken() || tokenManager.getRefreshToken())

const resolveAuthenticatedUser = async (): Promise<UserProfile> => {
  const cached = useAuthStore.getState().user
  if (cached) {
    return cached
  }
  const user = await getCurrentUser()
  useAuthStore.getState().setUser(user)
  return user
}

/** Guest-only routes (login): a signed-in staff member goes straight to the queue. */
const requireGuestSession = async () => {
  if (!hasAuthSession()) {
    return
  }
  try {
    const user = await resolveAuthenticatedUser()
    throw redirect({ to: isStaffRole(user.role) ? HOME_PATH : "/no-access" })
  } catch (error) {
    if (isRedirect(error)) {
      throw error
    }
    useAuthStore.getState().clear()
  }
}

/**
 * Hub routes: a session is required and the role must be admin or support.
 * The backend enforces the same rule on every staff endpoint; this gate only
 * keeps non-staff accounts from seeing an empty console.
 */
const requireStaffSession = async () => {
  if (!hasAuthSession()) {
    throw redirect({ to: "/login" })
  }
  try {
    const user = await resolveAuthenticatedUser()
    if (!isStaffRole(user.role)) {
      throw redirect({ to: "/no-access" })
    }
  } catch (error) {
    if (isRedirect(error)) {
      throw error
    }
    useAuthStore.getState().clear()
    throw redirect({ to: "/login" })
  }
}

/** Admin-only routes (working calendar). */
const requireAdminSession = async () => {
  await requireStaffSession()
  const user = await resolveAuthenticatedUser()
  if (user.role !== "admin") {
    throw redirect({ to: HOME_PATH })
  }
}

export {
  hasAuthSession,
  HOME_PATH,
  requireAdminSession,
  requireGuestSession,
  requireStaffSession,
  resolveAuthenticatedUser,
}
