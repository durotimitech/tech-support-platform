import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockLogs } from '../data/mockLogs'
import type { Category, Platform, HttpMethod, Environment } from '../types'
import dishuWhite from '../assets/logos/dishu-white.svg'
import './Logs.css'

type StatusGroup = 'All' | '2xx' | '4xx' | '5xx'

function statusGroup(code: number): '2xx' | '4xx' | '5xx' | 'other' {
  if (code >= 200 && code < 300) return '2xx'
  if (code >= 400 && code < 500) return '4xx'
  if (code >= 500) return '5xx'
  return 'other'
}

function statusClass(code: number) {
  const g = statusGroup(code)
  if (g === '2xx') return 'status-2xx'
  if (g === '4xx') return 'status-4xx'
  if (g === '5xx') return 'status-5xx'
  return ''
}

const METHOD_CLASS: Record<string, string> = {
  GET: 'method-get',
  POST: 'method-post',
  PUT: 'method-put',
  PATCH: 'method-patch',
  DELETE: 'method-delete',
}

export default function Logs() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<Category | 'All'>('All')
  const [filterPlatform, setFilterPlatform] = useState<Platform | 'All'>('All')
  const [filterMethod, setFilterMethod] = useState<HttpMethod | 'All'>('All')
  const [filterStatus, setFilterStatus] = useState<StatusGroup>('All')
  const [filterEnv, setFilterEnv] = useState<Environment | 'All'>('All')

  const filtered = useMemo(() => {
    return mockLogs.filter((log) => {
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
  }, [search, filterCategory, filterPlatform, filterMethod, filterStatus, filterEnv])

  function formatTime(iso: string) {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="logs-page">
      <header className="logs-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <img src={dishuWhite} alt="Dishu" className="header-wordmark" />
        </button>
        <div className="logs-header-right">
          <span className="logs-count">{filtered.length} requests</span>
        </div>
      </header>

      <div className="logs-body">
        <div className="logs-title-row">
          <h1>API Logs</h1>
        </div>

        <div className="logs-controls">
          <input
            className="search-input"
            type="text"
            placeholder="Search by request ID, endpoint, org, error code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="filters">
            <select value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value as Platform | 'All')}>
              <option value="All">All Platforms</option>
              <option value="Stripe">Stripe</option>
              <option value="Airbnb">Airbnb</option>
              <option value="Shopify">Shopify</option>
              <option value="Twilio">Twilio</option>
              <option value="Zendesk">Zendesk</option>
              <option value="HubSpot">HubSpot</option>
            </select>
            <select value={filterMethod} onChange={(e) => setFilterMethod(e.target.value as HttpMethod | 'All')}>
              <option value="All">All Methods</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as StatusGroup)}>
              <option value="All">All Statuses</option>
              <option value="2xx">2xx Success</option>
              <option value="4xx">4xx Client Error</option>
              <option value="5xx">5xx Server Error</option>
            </select>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as Category | 'All')}>
              <option value="All">All Categories</option>
              <option value="B2B">B2B</option>
              <option value="B2C">B2C</option>
            </select>
            <select value={filterEnv} onChange={(e) => setFilterEnv(e.target.value as Environment | 'All')}>
              <option value="All">All Environments</option>
              <option value="production">Production</option>
              <option value="sandbox">Sandbox</option>
            </select>
          </div>
        </div>

        <div className="logs-table-wrapper">
          <table className="logs-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Request ID</th>
                <th>Method</th>
                <th>Endpoint</th>
                <th>Status</th>
                <th>Time</th>
                <th>Platform</th>
                <th>Cat</th>
                <th>Org</th>
                <th>Env</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="no-results">No logs match your filters.</td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className={log.errorCode ? 'row-error' : ''}>
                    <td className="ts-cell">{formatTime(log.timestamp)}</td>
                    <td className="reqid-cell">{log.requestId}</td>
                    <td>
                      <span className={`method-badge ${METHOD_CLASS[log.method]}`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="endpoint-cell">{log.endpoint}</td>
                    <td>
                      <span className={`status-badge ${statusClass(log.statusCode)}`}>
                        {log.statusCode}
                      </span>
                    </td>
                    <td className="time-cell">{log.responseTime}ms</td>
                    <td>{log.platform}</td>
                    <td>
                      <span className={`category-badge ${log.category === 'B2B' ? 'cat-b2b' : 'cat-b2c'}`}>
                        {log.category}
                      </span>
                    </td>
                    <td className="org-cell">{log.organization}</td>
                    <td>
                      <span className={`env-badge ${log.environment === 'production' ? 'env-prod' : 'env-sandbox'}`}>
                        {log.environment}
                      </span>
                    </td>
                    <td className="error-cell">
                      {log.errorCode ? (
                        <span className="error-code" title={log.errorMessage}>
                          {log.errorCode}
                        </span>
                      ) : (
                        <span className="no-error">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
