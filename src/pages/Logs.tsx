import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ApiLog, Category, Platform, HttpMethod, Environment } from '../types'
import { useAuth } from '../auth/AuthContext'
import { useLogs } from '../store/LogsContext'
import { useTheme } from '../store/ThemeContext'
import ThemeToggle from '../components/ThemeToggle'
import LogModal from '../components/LogModal'
import dishuWhite from '../assets/logos/dishu-white.svg'
import dishuBlack from '../assets/logos/dishu-black.svg'

type StatusGroup = 'All' | '2xx' | '4xx' | '5xx'

function statusGroup(code: number): '2xx' | '4xx' | '5xx' | 'other' {
  if (code >= 200 && code < 300) return '2xx'
  if (code >= 400 && code < 500) return '4xx'
  if (code >= 500) return '5xx'
  return 'other'
}

const STATUS_CLASS: Record<string, string> = {
  '2xx':   'bg-emerald-50 text-emerald-700 dark:bg-[#0d2218] dark:text-emerald-400',
  '4xx':   'bg-amber-50 text-amber-700 dark:bg-[#261c08] dark:text-amber-400',
  '5xx':   'bg-red-50 text-red-700 dark:bg-[#2a1010] dark:text-red-400',
  'other': 'bg-card text-text-dim',
}

const METHOD_CLASS: Record<string, string> = {
  GET:    'bg-blue-50 text-blue-700 dark:bg-[#0e1e30] dark:text-blue-400',
  POST:   'bg-emerald-50 text-emerald-700 dark:bg-[#0d2218] dark:text-emerald-400',
  PUT:    'bg-amber-50 text-amber-700 dark:bg-[#261c08] dark:text-amber-400',
  PATCH:  'bg-violet-50 text-violet-700 dark:bg-[#1e1040] dark:text-violet-400',
  DELETE: 'bg-red-50 text-red-700 dark:bg-[#2a1010] dark:text-red-400',
}

const SELECT_CLS = 'bg-card border border-border rounded-lg px-3 py-2 pr-7 text-text-muted text-[13px] outline-none focus:border-brand-amber appearance-none cursor-pointer transition-colors'

export default function Logs() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { logs, clearLogs } = useLogs()
  const { dark } = useTheme()

  const [selectedLog, setSelectedLog] = useState<ApiLog | null>(null)

  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<Category | 'All'>('All')
  const [filterPlatform, setFilterPlatform] = useState<Platform | 'All'>('All')
  const [filterMethod, setFilterMethod] = useState<HttpMethod | 'All'>('All')
  const [filterStatus, setFilterStatus] = useState<StatusGroup>('All')
  const [filterEnv, setFilterEnv] = useState<Environment | 'All'>('All')

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        log.requestId.toLowerCase().includes(q) ||
        log.endpoint.toLowerCase().includes(q) ||
        log.organization.toLowerCase().includes(q) ||
        (log.errorCode?.toLowerCase().includes(q) ?? false) ||
        String(log.statusCode).includes(q)

      return (
        matchesSearch &&
        (filterCategory === 'All' || log.category === filterCategory) &&
        (filterPlatform === 'All' || log.platform === filterPlatform) &&
        (filterMethod === 'All' || log.method === filterMethod) &&
        (filterEnv === 'All' || log.environment === filterEnv) &&
        (filterStatus === 'All' || statusGroup(log.statusCode) === filterStatus)
      )
    })
  }, [logs, search, filterCategory, filterPlatform, filterMethod, filterStatus, filterEnv])

  function formatTime(iso: string) {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-surface text-text">
      <header className="sticky top-0 z-10 bg-surface border-b border-border flex items-center justify-between px-8 py-4">
        <button onClick={() => navigate('/')} className="bg-transparent border-none p-0 cursor-pointer opacity-85 hover:opacity-100 transition-opacity">
          <img src={dark ? dishuWhite : dishuBlack} alt="Dishu" className="h-6 w-auto" />
        </button>
        <div className="flex items-center gap-3">
          <span className="text-text-faint text-[13px]">{filtered.length} of {logs.length} requests</span>
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-text">API Logs</h1>
          {user?.role === 'admin' && logs.length > 0 && (
            <button
              onClick={clearLogs}
              className="text-text-faint text-sm px-3 py-1.5 rounded-lg border border-border hover:text-red-500 hover:border-red-200 dark:hover:border-red-900 transition-colors cursor-pointer bg-transparent"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3 mb-6">
          <input
            type="text"
            placeholder="Search by request ID, endpoint, org, error code…"
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
            <select value={filterMethod} onChange={(e) => setFilterMethod(e.target.value as HttpMethod | 'All')} className={SELECT_CLS}>
              <option value="All">All Methods</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as StatusGroup)} className={SELECT_CLS}>
              <option value="All">All Statuses</option>
              <option value="2xx">2xx Success</option>
              <option value="4xx">4xx Client Error</option>
              <option value="5xx">5xx Server Error</option>
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
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-card-dark">
                {['Timestamp','Request ID','Method','Endpoint','Status','Time','Platform','Cat','Org','Env','Error'].map((h) => (
                  <th key={h} className="text-left px-3.5 py-3 text-[10.5px] font-semibold uppercase tracking-wider text-text-faint border-b border-border whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-16 text-text-ghost">
                    <p className="text-base mb-1">No logs yet</p>
                    <p className="text-sm">Run a test request to see results here.</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-text-ghost">No logs match your filters.</td>
                </tr>
              ) : filtered.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="border-b border-row-border hover:bg-row-hover transition-colors cursor-pointer"
                >
                  <td className="px-3.5 py-3 text-text-faint text-[12px] font-mono whitespace-nowrap tabular-nums">
                    {formatTime(log.timestamp)}
                  </td>
                  <td className="px-3.5 py-3 font-mono text-[12px] text-text-faint whitespace-nowrap">
                    {log.requestId}
                  </td>
                  <td className="px-3.5 py-3">
                    <span className={`inline-block px-1.5 py-0.5 rounded font-mono text-[11px] font-bold tracking-wide ${METHOD_CLASS[log.method]}`}>
                      {log.method}
                    </span>
                  </td>
                  <td className="px-3.5 py-3 font-mono text-[12px] text-text-muted max-w-[280px] truncate">
                    {log.endpoint}
                  </td>
                  <td className="px-3.5 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded font-mono text-[12px] font-bold ${STATUS_CLASS[statusGroup(log.statusCode)]}`}>
                      {log.statusCode}
                    </span>
                  </td>
                  <td className="px-3.5 py-3 text-text-muted tabular-nums whitespace-nowrap">{log.responseTime}ms</td>
                  <td className="px-3.5 py-3 text-text-muted whitespace-nowrap">{log.platform}</td>
                  <td className="px-3.5 py-3">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10.5px] font-bold tracking-wide ${log.category === 'B2B' ? 'bg-green-50 text-green-700 dark:bg-[#0e2318] dark:text-green-400' : 'bg-orange-50 text-orange-700 dark:bg-[#2a1a0a] dark:text-amber-400'}`}>
                      {log.category}
                    </span>
                  </td>
                  <td className="px-3.5 py-3 text-text-muted text-[12.5px] whitespace-nowrap">{log.organization}</td>
                  <td className="px-3.5 py-3">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap ${log.environment === 'production' ? 'bg-blue-50 text-blue-700 dark:bg-[#0e1e30] dark:text-blue-400' : 'bg-slate-100 text-slate-500 dark:bg-[#1e1e1e] dark:text-slate-500'}`}>
                      {log.environment}
                    </span>
                  </td>
                  <td className="px-3.5 py-3 max-w-[180px]">
                    {log.errorCode ? (
                      <span title={log.errorMessage} className="font-mono text-[11.5px] text-red-500 dark:text-red-400 cursor-help truncate block">
                        {log.errorCode}
                      </span>
                    ) : (
                      <span className="text-text-ghost">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLog && (
        <LogModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  )
}
