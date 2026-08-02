import { useState } from "react"
import { Eye, EyeOff, UserRound } from "lucide-react"
import { createRegistrant } from "@/store/registrants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupButton } from "@/components/ui/input-group"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"

type Fields = {
  firstName: string
  lastName: string
  username: string
  email: string
  mobile: string
  dob: string
  password: string
  confirmPassword: string
}

type Touched = Partial<Record<keyof Fields, boolean>>

const required = (v: string) => (v.trim() === "" ? "This field is required." : "")
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(fields: Fields, touched: Touched) {
  const e: Partial<Record<keyof Fields, string>> = {}

  if (touched.firstName) e.firstName = required(fields.firstName)
  if (touched.lastName) e.lastName = required(fields.lastName)
  if (touched.username) e.username = required(fields.username)
  if (touched.email) {
    e.email = required(fields.email) || (!emailRe.test(fields.email) ? "Enter a valid email address." : "")
  }
  if (touched.mobile) {
    e.mobile =
      required(fields.mobile) ||
      (!/^\d{1,12}$/.test(fields.mobile) ? "Enter up to 12 digits." : "")
  }
  if (touched.dob) e.dob = required(fields.dob)
  if (touched.password) {
    e.password =
      required(fields.password) ||
      (fields.password.length < 8 ? "Password must be at least 8 characters." : "")
  }
  if (touched.confirmPassword) {
    e.confirmPassword =
      required(fields.confirmPassword) ||
      (fields.confirmPassword !== fields.password ? "Passwords do not match." : "")
  }

  return e
}

function isFormValid(fields: Fields) {
  const allTouched = Object.keys(fields).reduce(
    (acc, k) => ({ ...acc, [k]: true }),
    {} as Touched
  )
  const errs = validate(fields, allTouched)
  return Object.values(errs).every((v) => !v)
}

type FieldProps = {
  id: string
  label: string
  error?: string
  children: React.ReactNode
}

function Field({ id, label, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label} <span className="text-destructive" aria-hidden="true">*</span>
      </Label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" aria-live="polite" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

type PasswordFieldProps = {
  id: string
  label: string
  value: string
  error?: string
  onChange: (v: string) => void
  onBlur: () => void
}

function PasswordField({ id, label, value, error, onChange, onBlur }: PasswordFieldProps) {
  const [show, setShow] = useState(false)
  return (
    <Field id={id} label={label} error={error}>
      <InputGroup aria-invalid={!!error || undefined}>
        <InputGroupInput
          id={id}
          type={show ? "text" : "password"}
          value={value}
          autoComplete={id === "password" ? "new-password" : "new-password"}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={!!error || undefined}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            aria-label={show ? "Hide password" : "Show password"}
            onClick={() => setShow((s) => !s)}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  )
}

type Props = { onSubmit: () => void }

export function RegistrationForm({ onSubmit }: Props) {
  const [fields, setFields] = useState<Fields>({
    firstName: "", lastName: "", username: "", email: "",
    mobile: "", dob: "", password: "", confirmPassword: "",
  })
  const [touched, setTouched] = useState<Touched>({})
  const [submitted, setSubmitted] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const errors = validate(fields, touched)

  const set = (k: keyof Fields) => (v: string) =>
    setFields((f) => ({ ...f, [k]: v }))
  const touch = (k: keyof Fields) => () =>
    setTouched((t) => ({ ...t, [k]: true }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const allTouched = Object.keys(fields).reduce(
      (acc, k) => ({ ...acc, [k]: true }),
      {} as Touched
    )
    setTouched(allTouched)
    if (!isFormValid(fields)) return
    setSubmitting(true)
    setApiError(null)
    try {
      await createRegistrant({
        firstName: fields.firstName,
        lastName: fields.lastName,
        username: fields.username,
        email: fields.email,
        mobile: fields.mobile,
        dob: fields.dob,
        password: fields.password,
      })
      setSubmitted(true)
      onSubmit()
    } catch (err: unknown) {
      const detail = (err as { detail?: Record<string, string[]> }).detail
      if (detail) {
        const first = Object.values(detail).flat()[0]
        setApiError(first ?? "Registration failed. Please try again.")
      } else {
        setApiError("Registration failed. Please try again.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <Card className="w-full">
        <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
          <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center">
            <UserRound className="size-7 text-primary" />
          </div>
          <p className="text-base font-medium">Account created successfully!</p>
          <p className="text-sm text-muted-foreground">Welcome, {fields.firstName}.</p>
          <Button variant="outline" size="sm" onClick={() => { setSubmitted(false); setFields({ firstName: "", lastName: "", username: "", email: "", mobile: "", dob: "", password: "", confirmPassword: "" }); setTouched({}) }}>
            Register another
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>Fill in the details below to register.</CardDescription>
      </CardHeader>

      <Separator />

      <CardContent className="pt-5">
        <form onSubmit={handleSubmit} noValidate aria-label="Registration form">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Row 1 */}
            <Field id="firstName" label="First name" error={errors.firstName}>
              <Input
                id="firstName"
                type="text"
                autoComplete="given-name"
                value={fields.firstName}
                aria-invalid={!!errors.firstName || undefined}
                aria-describedby={errors.firstName ? "firstName-error" : undefined}
                onChange={(e) => set("firstName")(e.target.value)}
                onBlur={touch("firstName")}
              />
            </Field>

            <Field id="lastName" label="Last name" error={errors.lastName}>
              <Input
                id="lastName"
                type="text"
                autoComplete="family-name"
                value={fields.lastName}
                aria-invalid={!!errors.lastName || undefined}
                aria-describedby={errors.lastName ? "lastName-error" : undefined}
                onChange={(e) => set("lastName")(e.target.value)}
                onBlur={touch("lastName")}
              />
            </Field>

            {/* Row 2 */}
            <Field id="username" label="Username" error={errors.username}>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                value={fields.username}
                aria-invalid={!!errors.username || undefined}
                aria-describedby={errors.username ? "username-error" : undefined}
                onChange={(e) => set("username")(e.target.value)}
                onBlur={touch("username")}
              />
            </Field>

            <Field id="email" label="Email address" error={errors.email}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={fields.email}
                aria-invalid={!!errors.email || undefined}
                aria-describedby={errors.email ? "email-error" : undefined}
                onChange={(e) => set("email")(e.target.value)}
                onBlur={touch("email")}
              />
            </Field>

            {/* Row 3 */}
            <Field id="mobile" label="Mobile number" error={errors.mobile}>
              <InputGroup aria-invalid={!!errors.mobile || undefined}>
                <InputGroupAddon align="inline-start">
                  {/* Philippine flag emoji + code */}
                  <span className="flex items-center gap-1 text-sm font-medium text-foreground select-none pr-1 border-r border-input">
                    +63
                  </span>
                </InputGroupAddon>
                <InputGroupInput
                  id="mobile"
                  type="tel"
                  inputMode="numeric"
                  maxLength={12}
                  placeholder="9XXXXXXXXX"
                  value={fields.mobile}
                  autoComplete="tel-national"
                  aria-invalid={!!errors.mobile || undefined}
                  aria-describedby={errors.mobile ? "mobile-error" : undefined}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 12)
                    set("mobile")(v)
                  }}
                  onBlur={touch("mobile")}
                />
              </InputGroup>
            </Field>

            <Field id="dob" label="Date of birth" error={errors.dob}>
              <Input
                id="dob"
                type="date"
                value={fields.dob}
                aria-invalid={!!errors.dob || undefined}
                aria-describedby={errors.dob ? "dob-error" : undefined}
                onChange={(e) => set("dob")(e.target.value)}
                onBlur={touch("dob")}
              />
            </Field>

            {/* Row 4 */}
            <PasswordField
              id="password"
              label="Password"
              value={fields.password}
              error={errors.password}
              onChange={set("password")}
              onBlur={touch("password")}
            />

            <PasswordField
              id="confirmPassword"
              label="Confirm password"
              value={fields.confirmPassword}
              error={errors.confirmPassword}
              onChange={(v) => {
                set("confirmPassword")(v)
                setTouched((t) => ({ ...t, confirmPassword: true }))
              }}
              onBlur={touch("confirmPassword")}
            />
          </div>

          {apiError && (
            <p role="alert" className="mt-3 text-sm text-destructive">{apiError}</p>
          )}

          {/* Required note */}
          <p className="mt-4 text-xs text-muted-foreground">
            <span className="text-destructive">*</span> Required fields
          </p>

          <div className="mt-5">
            <Button
              type="submit"
              size="lg"
              className="w-full sm:w-auto"
              disabled={!isFormValid(fields) || submitting}
            >
              {submitting ? <Spinner className="mr-1" /> : null}
              Create Account
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
