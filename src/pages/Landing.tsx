import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import ThemeToggle from '../components/ThemeToggle'
import dishuWhite from '../assets/logos/dishu-white.svg'
import dishuBlack from '../assets/logos/dishu-black.svg'
import { useTheme } from '../store/ThemeContext'

export default function Landing() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { dark } = useTheme()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center relative">
      <div className="absolute top-5 right-6 flex items-center gap-3">
        <ThemeToggle />
        <span className="text-text-muted text-sm font-semibold">{user?.username}</span>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-[#0e1e30] dark:text-blue-400 uppercase tracking-wider">
          {user?.role}
        </span>
        <button
          onClick={handleLogout}
          className="text-text-faint text-[13px] px-3 py-1 rounded-md border border-border hover:text-text hover:border-border-hover transition-colors cursor-pointer bg-transparent"
        >
          Sign out
        </button>
      </div>

      <div className="flex flex-col items-center gap-3">
        <img
          src={dark ? dishuWhite : dishuBlack}
          alt="Dishu"
          className="w-56 h-auto mb-1"
        />
        <p className="text-text-dim text-[15px] mb-6">Tech Support Training Platform</p>

        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => navigate('/logs')}
            className="w-56 px-9 py-3.5 bg-brand-orange hover:bg-brand-orange-hover text-white text-[15px] font-semibold rounded-xl transition-colors cursor-pointer"
          >
            View API Logs
          </button>

          <button
            onClick={() => navigate('/accounts')}
            className="w-56 px-9 py-3.5 bg-transparent border border-border hover:border-border-hover text-text-muted hover:text-text text-[15px] font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Accounts
          </button>

          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/requests')}
              className="w-56 px-9 py-3.5 bg-transparent border border-border hover:border-border-hover text-text-muted hover:text-text text-[15px] font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Test Requests
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
