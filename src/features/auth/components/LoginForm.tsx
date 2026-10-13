import { useId, useState } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "@tanstack/react-router"
import { isAxiosError } from "axios"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLoginMutation } from "@/features/auth/hooks/useLoginMutation"
import { ForbiddenRoleError } from "@/features/auth/services/auth.service"
import { HOME_PATH } from "@/features/auth/utils/route-guards"

const loginSchema = z.object({
  email: z.string().trim().min(1, "email_required").pipe(z.email("email_invalid")),
  password: z.string().min(1, "password_required").min(8, "password_min"),
})

type LoginFormValues = z.infer<typeof loginSchema>

/** Maps a login failure to an i18n key under `auth:errors`; unknown errors fall back to common. */
const loginErrorKey = (error: unknown): { ns: "auth" | "common"; key: string } => {
  if (error instanceof ForbiddenRoleError) {
    return { ns: "auth", key: "errors.forbidden_role" }
  }
  if (isAxiosError(error)) {
    if (!error.response) return { ns: "common", key: "error_network" }
    const code = (error.response.data as { code?: string } | undefined)?.code
    if (code === "ACCOUNT_LOCKED") return { ns: "auth", key: "errors.account_locked" }
    if (error.response.status === 401 || error.response.status === 400) {
      return { ns: "auth", key: "errors.invalid_credentials" }
    }
  }
  return { ns: "common", key: "error_generic" }
}

const LoginForm = () => {
  const { t } = useTranslation("auth")
  const { t: tCommon } = useTranslation("common")
  const navigate = useNavigate()
  const loginMutation = useLoginMutation()
  const [showPassword, setShowPassword] = useState(false)
  const emailId = useId()
  const passwordId = useId()
  const errorId = useId()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })
  const { errors } = form.formState
  const pending = loginMutation.isPending

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await loginMutation.mutateAsync(values)
      await navigate({ to: HOME_PATH })
    } catch {
      // the error is rendered below from loginMutation.error
    }
  })

  const submitError = loginMutation.error ? loginErrorKey(loginMutation.error) : null

  return (
    <form className="flex flex-col gap-5" noValidate onSubmit={onSubmit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor={emailId}>{t("login.email")}</Label>
        <Input
          id={emailId}
          type="email"
          autoComplete="username"
          inputMode="email"
          placeholder={t("login.email_placeholder")}
          error={Boolean(errors.email)}
          aria-describedby={errors.email ? `${emailId}-error` : undefined}
          disabled={pending}
          {...form.register("email")}
        />
        {errors.email ? (
          <p id={`${emailId}-error`} className="text-sm text-destructive" role="alert">
            {t(`validation.${errors.email.message}`)}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={passwordId}>{t("login.password")}</Label>
        <div className="relative">
          <Input
            id={passwordId}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder={t("login.password_placeholder")}
            className="pr-12"
            error={Boolean(errors.password)}
            aria-describedby={errors.password ? `${passwordId}-error` : undefined}
            disabled={pending}
            {...form.register("password")}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 grid w-12 cursor-pointer place-items-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={showPassword ? t("login.hide_password") : t("login.show_password")}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
          </button>
        </div>
        {errors.password ? (
          <p id={`${passwordId}-error`} className="text-sm text-destructive" role="alert">
            {t(`validation.${errors.password.message}`)}
          </p>
        ) : null}
      </div>

      {submitError ? (
        <p
          id={errorId}
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {submitError.ns === "auth" ? t(submitError.key) : tCommon(submitError.key)}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending} aria-describedby={submitError ? errorId : undefined}>
        {pending ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
        {pending ? t("login.submitting") : t("login.submit")}
      </Button>
    </form>
  )
}

export { LoginForm }
