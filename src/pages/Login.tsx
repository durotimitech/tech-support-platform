import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authenticate } from '../auth/users'
import { useAuth } from '../auth/AuthContext'
import { useTheme } from '../store/ThemeContext'
import ThemeToggle from '../components/ThemeToggle'
import dishuWhite from '../assets/logos/dishu-white.svg'
import dishuBlack from '../assets/logos/dishu-black.svg'

export default function Login() {
  const { login } = useAuth()
  const { dark } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const user = authenticate(username.trim(), password)
    if (user) {
      login(user)
      navigate(from, { replace: true })
    } else {
      setError('Invalid username or password.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center relative">
      <div className="absolute top-5 right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-10 flex flex-col items-center shadow-sm">
        <img src={dark ? dishuWhite : dishuBlack} alt="Dishu" className="w-40 h-auto mb-1.5" />
        <p className="text-text-dim text-sm mb-8">Tech Support Training Platform</p>

        <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-text-faint text-[11px] font-semibold uppercase tracking-wider">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="bg-card-dark border border-border rounded-lg px-3.5 py-2.5 text-text text-sm outline-none placeholder:text-text-ghost focus:border-brand-amber transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-text-faint text-[11px] font-semibold uppercase tracking-wider">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="bg-card-dark border border-border rounded-lg px-3.5 py-2.5 text-text text-sm outline-none placeholder:text-text-ghost focus:border-brand-amber transition-colors"
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="mt-1 py-3 rounded-lg bg-brand-orange hover:bg-brand-orange-hover text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
