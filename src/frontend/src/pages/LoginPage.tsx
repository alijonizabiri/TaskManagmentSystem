import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { authService } from '@/services/authService'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'

export const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((state) => state.setAuth)

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [registerMessage, setRegisterMessage] = useState<string | null>(null)

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
      setRegisterForm({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
      })
    }
  })

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden bg-indigo-700 p-12 text-white lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(255,255,255,0.25),transparent_35%),radial-gradient(circle_at_90%_80%,rgba(59,130,246,0.35),transparent_40%)]" />
        <div className="relative">
          <p className="mb-3 inline-flex rounded-full border border-white/30 px-3 py-1 text-xs uppercase tracking-[0.2em] text-indigo-100">
            Team Task Platform
          </p>
          <h1 className="max-w-lg text-4xl font-semibold leading-tight">
            Coordinate teams, track progress, and move work faster.
          </h1>
          <p className="mt-6 max-w-md text-indigo-100">
            Built for structured planning and day-to-day execution with Kanban flows inspired by modern SaaS tools.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-card">
          <div className="mb-5 grid grid-cols-2 rounded-lg bg-gray-100 p-1">
            <button
              className={`rounded-md py-2 text-sm font-medium ${mode === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
              onClick={() => setMode('login')}
            >
              Login
            </button>
            <button
              className={`rounded-md py-2 text-sm font-medium ${mode === 'register' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
              onClick={() => setMode('register')}
            >
              Register
            </button>
          </div>

          {mode === 'login' ? (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                loginMutation.mutate(loginForm)
              }}
            >
              <Input
                label="Email"
                type="email"
                value={loginForm.email}
                onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
              <Input
                label="Password"
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                required
              />
              {registerMessage ? <p className="text-sm text-green-600">{registerMessage}</p> : null}
              {loginMutation.error ? <p className="text-sm text-red-600">{loginMutation.error.message}</p> : null}
              <Button className="w-full" loading={loginMutation.isPending}>
                Sign In
              </Button>
            </form>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                registerMutation.mutate(registerForm)
              }}
            >
              <Input
                label="Full Name"
                value={registerForm.fullName}
                onChange={(event) => setRegisterForm((prev) => ({ ...prev, fullName: event.target.value }))}
                required
              />
              <Input
                label="Email"
                type="email"
                value={registerForm.email}
                onChange={(event) => setRegisterForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
              <Input
                label="Password"
                type="password"
                value={registerForm.password}
                onChange={(event) => setRegisterForm((prev) => ({ ...prev, password: event.target.value }))}
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                value={registerForm.confirmPassword}
                onChange={(event) =>
                  setRegisterForm((prev) => ({
                    ...prev,
                    confirmPassword: event.target.value
                  }))
                }
                required
              />
              {registerMutation.error ? <p className="text-sm text-red-600">{registerMutation.error.message}</p> : null}
              <Button className="w-full" loading={registerMutation.isPending}>
                Create Account
              </Button>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
