import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Platform, Category, Environment, AccountPlan, AccountStatus, Account } from '../types'
import { useAuth } from '../auth/AuthContext'
import { useTheme } from '../store/ThemeContext'
import ThemeToggle from '../components/ThemeToggle'
import { ACCOUNTS } from '../data/accounts'
import dishuWhite from '../assets/logos/dishu-white.svg'
import dishuBlack from '../assets/logos/dishu-black.svg'

const SELECT_CLS = 'bg-card border border-border rounded-lg px-3 py-2 pr-7 text-text-muted text-[13px] outline-none focus:border-brand-amber appearance-none cursor-pointer transition-colors'

const PLAN_CLASS: Record<AccountPlan, string> = {
  basic:      'bg-slate-100 text-slate-600 dark:bg-[#1e1e1e] dark:text-slate-400',
  standard:   'bg-blue-50 text-blue-700 dark:bg-[#0e1e30] dark:text-blue-400',
  pro:        'bg-violet-50 text-violet-700 dark:bg-[#1e1040] dark:text-violet-400',
  enterprise: 'bg-amber-50 text-amber-700 dark:bg-[#261c08] dark:text-amber-400',
}

const STATUS_CLASS: Record<AccountStatus, string> = {
  active:       'bg-emerald-50 text-emerald-700 dark:bg-[#0d2218] dark:text-emerald-400',
  suspended:    'bg-red-50 text-red-700 dark:bg-[#2a1010] dark:text-red-400',
  rate_limited: 'bg-orange-50 text-orange-700 dark:bg-[#2a1a0a] dark:text-amber-400',
}

const STATUS_LABEL: Record<AccountStatus, string> = {
  active: 'Active',
  suspended: 'Suspended',
  rate_limited: 'Rate Limited',
}

function UsageBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min((value / max) * 100, 100)
  const color =
    pct >= 90 ? 'bg-red-500' :
    pct >= 70 ? 'bg-amber-500' :
    'bg-emerald-500'
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-border overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-text-faint tabular-nums">{pct.toFixed(0)}%</span>
    </div>
  )
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return String(n)
}

export default function Accounts() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { dark } = useTheme()

  const [search, setSearch] = useState('')
  const [filterPlatform, setFilterPlatform] = useState<Platform | 'All'>('All')
  const [filterCategory, setFilterCategory] = useState<Category | 'All'>('All')
  const [filterEnv, setFilterEnv] = useState<Environment | 'All'>('All')
  const [filterPlan, setFilterPlan] = useState<AccountPlan | 'All'>('All')
  const [filterStatus, setFilterStatus] = useState<AccountStatus | 'All'>('All')

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return ACCOUNTS.filter((acc) => {
      const matchesSearch =
        !q ||
        acc.name.toLowerCase().includes(q) ||
        acc.organization.toLowerCase().includes(q) ||
        acc.platform.toLowerCase().includes(q) ||
        acc.id.toLowerCase().includes(q)

      return (
        matchesSearch &&
        (filterPlatform === 'All' || acc.platform === filterPlatform) &&
        (filterCategory === 'All' || acc.category === filterCategory) &&
        (filterEnv === 'All' || acc.environment === filterEnv) &&
        (filterPlan === 'All' || acc.plan === filterPlan) &&
        (filterStatus === 'All' || acc.status === filterStatus)
      )
    })
  }, [search, filterPlatform, filterCategory, filterEnv, filterPlan, filterStatus])

  function renderRateLimitCell(acc: Account) {
    return (
      <div className="text-[12px] font-mono text-text-muted space-y-0.5">
        <div><span className="text-text-faint">min</span> {fmt(acc.rateLimits.requestsPerMinute)}</div>
        <div><span className="text-text-faint">day</span> {fmt(acc.rateLimits.requestsPerDay)}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface text-text">
      <header className="sticky top-0 z-10 bg-surface border-b border-border flex items-center justify-between px-8 py-4">
        <button onClick={() => navigate('/')} className="bg-transparent border-none p-0 cursor-pointer opacity-85 hover:opacity-100 transition-opacity">
          <img src={dark ? dishuWhite : dishuBlack} alt="Dishu" className="h-6 w-auto" />
        </button>
        <div className="flex items-center gap-3">
          <span className="text-text-faint text-[13px]">{filtered.length} of {ACCOUNTS.length} accounts</span>
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
      </header>

      <div className="max-w-[1440px] mx-auto px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-text">Accounts</h1>
          <p className="text-text-dim text-[13px] mt-1">API accounts and their rate limit configurations</p>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          <input
            type="text"
            placeholder="Search by account name, organization, platform, or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-lg px-3.5 py-2.5 text-text text-sm outline-none placeholder:text-text-ghost focus:border-brand-amber transition-colors"
          />
          <div className="flex gap-2.5 flex-wrap">
            <select value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value as Platform | 'All')} className={SELECT_CLS}>
              <option value="All">All Platforms</option>
              <option value="Stripe">Stripe</option>
              <option value="Airbnb">Airbnb</option>
              <option value="Shopify">Shopify</option>
              <option value="Twilio">Twilio</option>
              <option value="Zendesk">Zendesk</option>
              <option value="HubSpot">HubSpot</option>
            </select>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as Category | 'All')} className={SELECT_CLS}>
              <option value="All">All Categories</option>
              <option value="B2B">B2B</option>
              <option value="B2C">B2C</option>
            </select>
            <select value={filterEnv} onChange={(e) => setFilterEnv(e.target.value as Environment | 'All')} className={SELECT_CLS}>
              <option value="All">All Environments</option>
              <option value="production">Production</option>
              <option value="sandbox">Sandbox</option>
            </select>
            <select value={filterPlan} onChange={(e) => setFilterPlan(e.target.value as AccountPlan | 'All')} className={SELECT_CLS}>
              <option value="All">All Plans</option>
              <option value="basic">Basic</option>
              <option value="standard">Standard</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as AccountStatus | 'All')} className={SELECT_CLS}>
              <option value="All">All Statuses</option>
              <option value="active">Active</option>
              <option value="rate_limited">Rate Limited</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-card-dark">
                {['Account', 'Organization', 'Platform', 'Cat', 'Environment', 'Plan', 'Status', 'Rate Limits', 'Usage Today', 'Daily Usage'].map((h) => (
                  <th key={h} className="text-left px-3.5 py-3 text-[10.5px] font-semibold uppercase tracking-wider text-text-faint border-b border-border whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-14 text-text-ghost">
                    No accounts match your filters.
                  </td>
                </tr>
              ) : filtered.map((acc) => (
                <tr key={acc.id} className="border-b border-row-border hover:bg-row-hover transition-colors">
                  <td className="px-3.5 py-3">
                    <div className="font-semibold text-text text-[13px]">{acc.name}</div>
                    <div className="font-mono text-[11px] text-text-faint mt-0.5">{acc.id}</div>
                  </td>
                  <td className="px-3.5 py-3 text-text-muted whitespace-nowrap">{acc.organization}</td>
                  <td className="px-3.5 py-3 text-text-muted whitespace-nowrap">{acc.platform}</td>
                  <td className="px-3.5 py-3">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10.5px] font-bold tracking-wide ${acc.category === 'B2B' ? 'bg-green-50 text-green-700 dark:bg-[#0e2318] dark:text-green-400' : 'bg-orange-50 text-orange-700 dark:bg-[#2a1a0a] dark:text-amber-400'}`}>
                      {acc.category}
                    </span>
                  </td>
                  <td className="px-3.5 py-3">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap ${acc.environment === 'production' ? 'bg-blue-50 text-blue-700 dark:bg-[#0e1e30] dark:text-blue-400' : 'bg-slate-100 text-slate-500 dark:bg-[#1e1e1e] dark:text-slate-500'}`}>
                      {acc.environment}
                    </span>
                  </td>
                  <td className="px-3.5 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${PLAN_CLASS[acc.plan]}`}>
                      {acc.plan}
                    </span>
                  </td>
                  <td className="px-3.5 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap ${STATUS_CLASS[acc.status]}`}>
                      {STATUS_LABEL[acc.status]}
                    </span>
                  </td>
                  <td className="px-3.5 py-3">
                    {renderRateLimitCell(acc)}
                  </td>
                  <td className="px-3.5 py-3 text-text-muted tabular-nums font-mono text-[12px] whitespace-nowrap">
                    {fmt(acc.currentUsage.today)}
                  </td>
                  <td className="px-3.5 py-3">
                    <UsageBar value={acc.currentUsage.today} max={acc.rateLimits.requestsPerDay} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
