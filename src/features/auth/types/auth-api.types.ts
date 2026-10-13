import { z } from "zod"

/** Roles known to open-office; only STAFF_ROLES may enter the Hub. */
const userRoleSchema = z.enum(["admin", "support", "tester", "user"])
const STAFF_ROLES = ["admin", "support"] as const satisfies ReadonlyArray<
  z.infer<typeof userRoleSchema>
>

const authTokenUserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  fullName: z.string(),
  role: userRoleSchema,
})

/**
 * `POST /auth/login` / `/auth/refresh`. The backend omits `refreshToken` only for
 * web clients that ask for cookie transport; the Hub keeps the token in the body.
 */
const authTokenResponseSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1).optional(),
  tokenType: z.string().min(1),
  expiresIn: z.number(),
  user: authTokenUserSchema.optional(),
})

const localLoginRequestSchema = z.object({
  provider: z.literal("local"),
  email: z.email(),
  password: z.string().min(8),
})

const refreshRequestSchema = z.object({
  refreshToken: z.string().min(1),
})

const logoutRequestSchema = z.object({
  refreshToken: z.string().min(1),
})

const successResponseSchema = z.object({
  success: z.boolean(),
})

const nullableString = z.union([z.string(), z.null()]).optional().catch(null)

/** `GET /auth/me`, only the fields the Hub uses (unknown fields are ignored). */
const userProfileResponseSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  fullName: z.string(),
  role: userRoleSchema,
  avatarUrl: nullableString,
  locale: z.enum(["vi", "en"]).catch("vi"),
})

type UserRole = z.infer<typeof userRoleSchema>
type StaffRole = (typeof STAFF_ROLES)[number]
type AuthTokenResponse = z.infer<typeof authTokenResponseSchema>
type LocalLoginRequest = z.infer<typeof localLoginRequestSchema>
type RefreshRequest = z.infer<typeof refreshRequestSchema>
type LogoutRequest = z.infer<typeof logoutRequestSchema>
type SuccessResponse = z.infer<typeof successResponseSchema>
type UserProfile = z.infer<typeof userProfileResponseSchema>

const isStaffRole = (role: UserRole | null | undefined): role is StaffRole =>
  STAFF_ROLES.some((staff) => staff === role)

export {
  authTokenResponseSchema,
  isStaffRole,
  localLoginRequestSchema,
  logoutRequestSchema,
  refreshRequestSchema,
  STAFF_ROLES,
  successResponseSchema,
  userProfileResponseSchema,
  userRoleSchema,
  type AuthTokenResponse,
  type LocalLoginRequest,
  type LogoutRequest,
  type RefreshRequest,
  type StaffRole,
  type SuccessResponse,
  type UserProfile,
  type UserRole,
}
