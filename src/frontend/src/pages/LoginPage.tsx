import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/utils/cn'

type AuthMode = 'login' | 'register'
type ActiveField = 'fullName' | 'email' | 'password' | 'confirmPassword' | null

type FormFieldProps = {
  label: string
  type?: string
  value: string
  placeholder: string
  onChange: (value: string) => void
  onFocus: () => void
  onBlur: () => void
  error?: string
  rightSlot?: React.ReactNode
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const getTrackingOffset = (field: ActiveField, value: string) => {
  if (!field) return { x: 0, y: 0 }

  const length = value.length

  if (field === 'password' || field === 'confirmPassword') {
    return {
      x: clamp(length * 0.16, -2, 2),
      y: -1
    }
  }

  if (field === 'fullName') {
    return {
      x: clamp(length * 0.38 - 4, -6, 7),
      y: -1
    }
  }

  if (field === 'email') {
    return {
      x: clamp(length * 0.24 - 2, -4, 4),
      y: 8
    }
  }

  return {
    x: 0,
    y: 0
  }
}

const FormField = ({
  label,
  type = 'text',
  value,
  placeholder,
  onChange,
  onFocus,
  onBlur,
  error,
  rightSlot
}: FormFieldProps) => {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        {rightSlot}
      </div>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        className={cn(
          'h-11 w-full rounded-2xl border bg-white px-4 text-[15px] text-slate-900 outline-none transition',
          error
            ? 'border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100'
            : 'border-slate-200 focus:border-sky-400 focus:ring-4 focus:ring-sky-100'
        )}
        required
      />
      {error ? <p className="mt-1.5 text-xs text-red-600">{error}</p> : null}
    </label>
  )
}

const MascotAvatar = ({
  activeField,
  trackingValue
}: {
  activeField: ActiveField
  trackingValue: string
}) => {
  const isPasswordField = activeField === 'password' || activeField === 'confirmPassword'
  const offset = getTrackingOffset(activeField, trackingValue)
  const leftEyeX = 87 + offset.x
  const rightEyeX = 133 + offset.x
  const eyeY = 94 + offset.y
  const mouthScale = clamp(trackingValue.length / 12, 0.85, 1.15)
  const browOffset = activeField === 'fullName' ? -2 : activeField === 'email' ? 0 : 2

  return (
    <div className="relative mx-auto h-[112px] w-[112px] sm:h-[120px] sm:w-[120px]">
      <div className="absolute inset-0 rounded-full bg-[#e9f7fb] shadow-[inset_0_-14px_0_rgba(255,255,255,0.3)]" />
      <svg viewBox="0 0 220 220" className="relative z-10 h-full w-full">
        <circle cx="110" cy="110" r="106" fill="none" stroke="#a7cfd9" strokeWidth="4" />
        <ellipse cx="110" cy="86" rx="64" ry="58" fill="#f8fcfd" stroke="#b2cdd4" strokeWidth="4" />
        <path
          d="M69 49c12-11 26-17 41-17s29 6 41 17l-8 20c-9-6-21-9-33-9s-24 3-33 9l-8-20Z"
          fill="#eef6f8"
          stroke="#b2cdd4"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M86 39l6 22" stroke="#9cbcc5" strokeWidth="3" strokeLinecap="round" />
        <path d="M134 39l-6 22" stroke="#9cbcc5" strokeWidth="3" strokeLinecap="round" />
        <path
          d="M58 77c0-11 9-20 20-20h64c11 0 20 9 20 20v25c0 11-9 20-20 20H78c-11 0-20-9-20-20V77Z"
          fill="url(#visorGradient)"
          stroke="#3c4e55"
          strokeWidth="4"
        />
        <circle cx="47" cy="89" r="12" fill="#2bb6c7" stroke="#8baab2" strokeWidth="4" />
        <circle cx="173" cy="89" r="12" fill="#2bb6c7" stroke="#8baab2" strokeWidth="4" />
        <circle cx="47" cy="89" r="6" fill="#d9f8ff" opacity="0.9" />
        <circle cx="173" cy="89" r="6" fill="#d9f8ff" opacity="0.9" />
        {!isPasswordField ? (
          <>
            <circle cx="88" cy="90" r="17" fill="#2af0ff" opacity="0.18" />
            <circle cx="132" cy="90" r="17" fill="#2af0ff" opacity="0.18" />
            <circle cx="88" cy="90" r="12" fill="#7ef4ff" />
            <circle cx="132" cy="90" r="12" fill="#7ef4ff" />
            <circle cx={leftEyeX + 1} cy={eyeY - 4} r="6" fill="#184455" />
            <circle cx={rightEyeX + 1} cy={eyeY - 4} r="6" fill="#184455" />
            <circle cx={leftEyeX + 3} cy={eyeY - 7} r="2" fill="#fff" />
            <circle cx={rightEyeX + 3} cy={eyeY - 7} r="2" fill="#fff" />
          </>
        ) : (
          <>
            <path d="M75 92c8-8 18-8 26 0" stroke="#7aeefd" strokeWidth="4" strokeLinecap="round" />
            <path d="M119 92c8-8 18-8 26 0" stroke="#7aeefd" strokeWidth="4" strokeLinecap="round" />
          </>
        )}
        <path d={`M75 ${71 + browOffset}c8-4 17-4 25 0`} stroke="#708f98" strokeWidth="3" strokeLinecap="round" />
        <path d={`M120 ${71 + browOffset}c8-4 17-4 25 0`} stroke="#708f98" strokeWidth="3" strokeLinecap="round" />
        <path d="M96 126h28" stroke="#3c4e55" strokeWidth="4" strokeLinecap="round" />
        <g transform={`translate(110 154) scale(${mouthScale} 1)`}>
          <path
            d="M-30 -6c4-7 10-11 18-11h24c8 0 14 4 18 11v9h-60v-9Z"
            fill="#eef6f8"
            stroke="#b2cdd4"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <rect x="-8" y="-12" width="16" height="12" rx="3" fill="#2bb6c7" stroke="#8baab2" strokeWidth="3" />
        </g>
        {isPasswordField ? (
          <>
            <path
              d="M60 108c12-9 27-11 39-7l-7 16-19 11-13-20Z"
              fill="#eef6f8"
              stroke="#b2cdd4"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <path
              d="M160 108c-12-9-27-11-39-7l7 16 19 11 13-20Z"
              fill="#eef6f8"
              stroke="#b2cdd4"
              strokeWidth="4"
              strokeLinejoin="round"
            />
          </>
        ) : null}
        <defs>
          <linearGradient id="visorGradient" x1="58" y1="57" x2="162" y2="122" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#30363b" />
            <stop offset="0.55" stopColor="#141819" />
            <stop offset="1" stopColor="#3b4144" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

export const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((state) => state.setAuth)

  const [mode, setMode] = useState<AuthMode>('login')
  const [activeField, setActiveField] = useState<ActiveField>(null)
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [registerMessage, setRegisterMessage] = useState<string | null>(null)

  const passwordsMismatch =
    registerForm.confirmPassword.length > 0 && registerForm.password !== registerForm.confirmPassword

  const trackingValue =
    activeField === 'fullName'
      ? registerForm.fullName
      : activeField === 'email'
        ? mode === 'login'
          ? loginForm.email
          : registerForm.email
        : activeField === 'password'
          ? mode === 'login'
            ? loginForm.password
            : registerForm.password
          : activeField === 'confirmPassword'
            ? registerForm.confirmPassword
            : ''

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (payload) => {
      setAuth(payload)
      const fallbackPath = '/dashboard'
      const destination = (location.state as { from?: Location } | null)?.from?.pathname ?? fallbackPath
      navigate(destination, { replace: true })
    }
  })

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (payload) => {
      setRegisterMessage(payload.message)
      setMode('login')
      setActiveField(null)
      setRegisterForm({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
      })
    }
  })

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#edf6fb] px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(119,212,240,0.28),transparent_28%),linear-gradient(180deg,#eff8fc_0%,#dff0f8_100%)]" />
      <div className="absolute left-1/2 top-16 h-48 w-48 -translate-x-60 rounded-full bg-white/40 blur-3xl" />
      <div className="absolute left-1/2 top-1/2 h-52 w-52 translate-x-44 rounded-full bg-sky-200/35 blur-3xl" />

      <div className="relative w-full max-w-[400px] rounded-[32px] border border-[#c4e7f4] bg-white px-6 py-5 shadow-[0_24px_70px_rgba(22,124,161,0.18)] sm:px-7">
        <MascotAvatar activeField={activeField} trackingValue={trackingValue} />

        <div className="mt-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#167ca1]">Task Workspace</p>
          <h1 className="mt-3 text-[30px] font-semibold text-slate-900">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {mode === 'login'
              ? 'Sign in to continue with your team tasks.'
              : 'Register to join the workspace and start collaborating.'}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 rounded-2xl bg-[#edf7fb] p-1">
          <button
            type="button"
            className={cn(
              'rounded-2xl px-4 py-2.5 text-sm font-semibold transition',
              mode === 'login' ? 'bg-white text-[#135a74] shadow-sm' : 'text-slate-500 hover:text-slate-800'
            )}
            onClick={() => {
              setMode('login')
              setActiveField(null)
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={cn(
              'rounded-2xl px-4 py-2.5 text-sm font-semibold transition',
              mode === 'register' ? 'bg-white text-[#135a74] shadow-sm' : 'text-slate-500 hover:text-slate-800'
            )}
            onClick={() => {
              setMode('register')
              setActiveField(null)
            }}
          >
            Register
          </button>
        </div>

        {mode === 'login' ? (
          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              loginMutation.mutate(loginForm)
            }}
          >
            <FormField
              label="Email"
              type="email"
              value={loginForm.email}
              placeholder="email@domain.com"
              onChange={(value) => setLoginForm((prev) => ({ ...prev, email: value }))}
              onFocus={() => setActiveField('email')}
              onBlur={() => setActiveField(null)}
            />

            <FormField
              label="Password"
              type={showLoginPassword ? 'text' : 'password'}
              value={loginForm.password}
              placeholder="Enter your password"
              onChange={(value) => setLoginForm((prev) => ({ ...prev, password: value }))}
              onFocus={() => setActiveField('password')}
              onBlur={() => setActiveField(null)}
              rightSlot={
                <button
                  type="button"
                  className="text-xs font-semibold uppercase tracking-[0.18em] text-[#167ca1]"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                >
                  {showLoginPassword ? 'Hide' : 'Show'}
                </button>
              }
            />

            {registerMessage ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {registerMessage}
              </div>
            ) : null}
            {loginMutation.error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {loginMutation.error.message}
              </div>
            ) : null}

            <Button
              className="h-11 w-full rounded-2xl bg-[#18a0c6] text-sm font-semibold text-white hover:bg-[#1489a9]"
              loading={loginMutation.isPending}
            >
              Sign In
            </Button>

            <p className="text-center text-sm text-slate-500">
              No account?{' '}
              <button
                type="button"
                className="font-semibold text-[#167ca1]"
                onClick={() => {
                  setMode('register')
                  setActiveField(null)
                }}
              >
                Register here
              </button>
            </p>
          </form>
        ) : (
          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              if (passwordsMismatch) return
              registerMutation.mutate(registerForm)
            }}
          >
            <FormField
              label="Full Name"
              value={registerForm.fullName}
              placeholder="Your full name"
              onChange={(value) => setRegisterForm((prev) => ({ ...prev, fullName: value }))}
              onFocus={() => setActiveField('fullName')}
              onBlur={() => setActiveField(null)}
            />

            <FormField
              label="Email"
              type="email"
              value={registerForm.email}
              placeholder="email@domain.com"
              onChange={(value) => setRegisterForm((prev) => ({ ...prev, email: value }))}
              onFocus={() => setActiveField('email')}
              onBlur={() => setActiveField(null)}
            />

            <FormField
              label="Password"
              type={showRegisterPassword ? 'text' : 'password'}
              value={registerForm.password}
              placeholder="Create a password"
              onChange={(value) => setRegisterForm((prev) => ({ ...prev, password: value }))}
              onFocus={() => setActiveField('password')}
              onBlur={() => setActiveField(null)}
              rightSlot={
                <button
                  type="button"
                  className="text-xs font-semibold uppercase tracking-[0.18em] text-[#167ca1]"
                  onClick={() => setShowRegisterPassword((prev) => !prev)}
                >
                  {showRegisterPassword ? 'Hide' : 'Show'}
                </button>
              }
            />

            <FormField
              label="Confirm Password"
              type={showRegisterConfirmPassword ? 'text' : 'password'}
              value={registerForm.confirmPassword}
              placeholder="Repeat your password"
              onChange={(value) => setRegisterForm((prev) => ({ ...prev, confirmPassword: value }))}
              onFocus={() => setActiveField('confirmPassword')}
              onBlur={() => setActiveField(null)}
              error={passwordsMismatch ? 'Passwords do not match.' : undefined}
              rightSlot={
                <button
                  type="button"
                  className="text-xs font-semibold uppercase tracking-[0.18em] text-[#167ca1]"
                  onClick={() => setShowRegisterConfirmPassword((prev) => !prev)}
                >
                  {showRegisterConfirmPassword ? 'Hide' : 'Show'}
                </button>
              }
            />

            {registerMutation.error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {registerMutation.error.message}
              </div>
            ) : null}

            <Button
              className="h-11 w-full rounded-2xl bg-[#18a0c6] text-sm font-semibold text-white hover:bg-[#1489a9]"
              loading={registerMutation.isPending}
              disabled={passwordsMismatch}
            >
              Create Account
            </Button>

            <p className="text-center text-sm text-slate-500">
              Already have an account?{' '}
              <button
                type="button"
                className="font-semibold text-[#167ca1]"
                onClick={() => {
                  setMode('login')
                  setActiveField(null)
                }}
              >
                Sign in
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
