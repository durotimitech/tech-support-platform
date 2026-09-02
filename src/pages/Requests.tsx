import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { stripe400Scenarios } from '../data/scenarios/stripe400'
import { stripe401Scenarios } from '../data/scenarios/stripe401'
import { stripe429Scenarios } from '../data/scenarios/stripe429'
import { stripeBillingScenarios } from '../data/scenarios/stripeBilling'
import { stripeWebhookScenarios } from '../data/scenarios/stripeWebhooks'
import { generateNoiseForRun } from '../data/randomLogs'
import { useLogs } from '../store/LogsContext'
import { useAuth } from '../auth/AuthContext'
import { useTheme } from '../store/ThemeContext'
import ThemeToggle from '../components/ThemeToggle'
import type { TestScenario, RunResult } from '../types'
import type { ApiLog } from '../types'
import dishuWhite from '../assets/logos/dishu-white.svg'
import dishuBlack from '../assets/logos/dishu-black.svg'

function genRequestId() {
  return 'req_' + Math.random().toString(36).slice(2, 12)
}

async function runScenario(scenario: TestScenario): Promise<RunResult> {
  const requestId = genRequestId()
  const timestamp = new Date().toISOString()
  const start = performance.now()

  const headers: Record<string, string> = {
    'Stripe-Version': scenario.apiVersion,
    ...scenario.headers,
  }

  try {
    const res = await fetch(scenario.url, { method: scenario.method, headers })
    const responseTime = Math.round(performance.now() - start)
    let responseBody: unknown
    try { responseBody = await res.json() } catch { responseBody = null }
    return { scenarioId: scenario.id, statusCode: res.status, responseTime, responseBody, requestId, timestamp }
  } catch (err) {
    const responseTime = Math.round(performance.now() - start)
    return {
      scenarioId: scenario.id, statusCode: 0, responseTime,
      responseBody: null, requestId, timestamp,
      error: err instanceof Error ? err.message : 'Network error',
    }
  }
}

function extractError(body: unknown): { code?: string; message?: string } {
  if (body && typeof body === 'object' && 'error' in body) {
    const e = (body as { error: { code?: string; message?: string } }).error
    return { code: e.code, message: e.message }
  }
  return {}
}

function StatusBadge({ code }: { code: number }) {
  const cls =
    code >= 200 && code < 300 ? 'bg-emerald-50 text-emerald-700 dark:bg-[#0d2218] dark:text-emerald-400' :
    code >= 400 && code < 500 ? 'bg-amber-50 text-amber-700 dark:bg-[#261c08] dark:text-amber-400' :
    code >= 500               ? 'bg-red-50 text-red-700 dark:bg-[#2a1010] dark:text-red-400' :
                                'bg-slate-100 text-slate-600'
  return (
    <span className={`inline-block px-2 py-0.5 rounded font-mono text-sm font-bold ${cls}`}>
      {code || 'ERR'}
    </span>
  )
}

function ScenarioCard({ scenario }: { scenario: TestScenario }) {
  const { addLog } = useLogs()
  const [results, setResults] = useState<RunResult[]>([])
  const [running, setRunning] = useState(false)

  const runCount = scenario.runCount ?? 1

  function buildLog(res: RunResult, requestId: string, timestampOverride?: string): ApiLog {
    const { code, message } = extractError(res.responseBody)
    return {
      id: crypto.randomUUID(),
      requestId,
      timestamp: timestampOverride ?? res.timestamp,
      method: scenario.method,
      endpoint: scenario.logEndpoint ?? new URL(scenario.url).pathname,
      statusCode: res.statusCode,
      responseTime: res.responseTime,
      platform: scenario.platform,
      category: scenario.category,
      organization: '—',
      environment: scenario.environment,
      apiVersion: scenario.apiVersion,
      errorCode: code,
      errorMessage: message,
    }
  }

  async function handleRun() {
    setRunning(true)
    setResults([])
    const runs: RunResult[] = []

    for (let i = 0; i < runCount; i++) {
      // Fire main request + 3 historical copies concurrently
      const [res, h1, h2, h3] = await Promise.all([
        runScenario(scenario),
        runScenario(scenario),
        runScenario(scenario),
        runScenario(scenario),
      ])

      // Shared trace ID across all 4 entries
      const traceId = res.requestId

      const now = new Date(res.timestamp)
      const offset = (mins: number) => new Date(now.getTime() - mins * 60_000).toISOString()

      // Log historical copies first (oldest → newest) so they sort naturally
      addLog(buildLog(h3, traceId, offset(15)))
      generateNoiseForRun(offset(15)).forEach(addLog)
      addLog(buildLog(h2, traceId, offset(10)))
      generateNoiseForRun(offset(10)).forEach(addLog)
      addLog(buildLog(h1, traceId, offset(5)))
      generateNoiseForRun(offset(5)).forEach(addLog)

      // Log the live request last
      addLog(buildLog(res, traceId))
      generateNoiseForRun(res.timestamp).forEach(addLog)

      runs.push(res)
    }

    setResults(runs)
    setRunning(false)
  }

  const hasAuthHeader = 'Authorization' in scenario.headers

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-text font-semibold text-base">{scenario.title}</h3>
          <p className="text-text-dim text-sm mt-1">{scenario.description}</p>
        </div>
        <button
          onClick={handleRun}
          disabled={running}
          className="shrink-0 px-4 py-2 bg-brand-orange hover:bg-brand-orange-hover text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {running ? 'Running…' : 'Run'}
        </button>
      </div>

      {/* Request preview */}
      <div className="bg-card-dark rounded-lg p-4 font-mono text-[12.5px] flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="bg-emerald-50 text-emerald-700 dark:bg-[#0d2218] dark:text-emerald-400 px-1.5 py-0.5 rounded text-[11px] font-bold">
            {scenario.method}
          </span>
          <span className="text-text-muted break-all">{scenario.url}</span>
        </div>
        <div className="text-text-faint mt-1">
          <span className="text-text-dim">Stripe-Version:</span> {scenario.apiVersion}
        </div>
        <div className="text-text-faint">
          <span className="text-text-dim">Authorization:</span>{' '}
          {hasAuthHeader
            ? <span className="text-amber-600 dark:text-amber-400">{scenario.headers['Authorization']}</span>
            : <span className="text-red-500 dark:text-red-400 italic">not set</span>
          }
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="flex flex-col gap-3">
          {runCount > 1 && (
            <p className="text-[12px] text-amber-600 dark:text-amber-400 font-semibold">
              {runCount} requests fired — {runCount} entries logged (simulating duplicate submission)
            </p>
          )}
          {results.map((res, i) => (
            <div key={i} className="flex flex-col gap-2">
              {runCount > 1 && (
                <span className="text-[11px] text-text-faint font-mono">Request {i + 1}</span>
              )}
              <div className="flex items-center gap-3 flex-wrap">
                <StatusBadge code={res.statusCode} />
                <span className="text-text-dim text-sm">{res.responseTime}ms</span>
                <span className="font-mono text-[12px] text-text-faint bg-card-dark px-2 py-0.5 rounded select-all">{res.requestId}</span>
                <span className="text-emerald-600 dark:text-emerald-600 text-[12px]">saved to logs</span>
                {res.error && <span className="text-red-500 text-sm">{res.error}</span>}
              </div>
              {!!res.responseBody && (
                <pre className="bg-card-dark rounded-lg p-4 text-[12px] font-mono text-text-muted overflow-x-auto max-h-48 overflow-y-auto leading-relaxed">
                  {JSON.stringify(res.responseBody, null, 2) as string}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Requests() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { dark } = useTheme()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-surface text-text">
      <header className="sticky top-0 z-10 bg-surface border-b border-border flex items-center justify-between px-8 py-4">
        <button onClick={() => navigate('/')} className="bg-transparent border-none p-0 cursor-pointer opacity-85 hover:opacity-100 transition-opacity">
          <img src={dark ? dishuWhite : dishuBlack} alt="Dishu" className="h-6 w-auto" />
        </button>
        <div className="flex items-center gap-3">
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

      <div className="max-w-3xl mx-auto px-8 py-8">
        <h1 className="text-3xl font-bold text-text mb-1">Test Requests</h1>
        <p className="text-text-dim text-sm mb-8">Run real API calls — results are saved to logs automatically.</p>

        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-block px-2 py-0.5 rounded font-mono text-[12px] font-bold bg-red-50 text-red-700 dark:bg-[#2a1010] dark:text-red-400">400</span>
            <h2 className="text-text font-semibold text-lg">Bad Request — Stripe</h2>
          </div>
          <div className="flex flex-col gap-4">
            {stripe400Scenarios.map((s) => (
              <ScenarioCard key={s.id} scenario={s} />
            ))}
          </div>
        </section>

        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-block px-2 py-0.5 rounded font-mono text-[12px] font-bold bg-amber-50 text-amber-700 dark:bg-[#261c08] dark:text-amber-400">401</span>
            <h2 className="text-text font-semibold text-lg">Unauthorized — Stripe</h2>
          </div>
          <div className="flex flex-col gap-4">
            {stripe401Scenarios.map((s) => (
              <ScenarioCard key={s.id} scenario={s} />
            ))}
          </div>
        </section>

        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-block px-2 py-0.5 rounded font-mono text-[12px] font-bold bg-orange-50 text-orange-700 dark:bg-[#2a1500] dark:text-orange-400">429</span>
            <h2 className="text-text font-semibold text-lg">Rate Limited — Stripe</h2>
          </div>
          <div className="flex flex-col gap-4">
            {stripe429Scenarios.map((s) => (
              <ScenarioCard key={s.id} scenario={s} />
            ))}
          </div>
        </section>

        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-block px-2 py-0.5 rounded font-mono text-[12px] font-bold bg-violet-50 text-violet-700 dark:bg-[#1e1040] dark:text-violet-400">Billing</span>
            <h2 className="text-text font-semibold text-lg">Billing — Stripe</h2>
          </div>
          <div className="flex flex-col gap-4">
            {stripeBillingScenarios.map((s) => (
              <ScenarioCard key={s.id} scenario={s} />
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-block px-2 py-0.5 rounded font-mono text-[12px] font-bold bg-red-50 text-red-700 dark:bg-[#2a1010] dark:text-red-400">503</span>
            <h2 className="text-text font-semibold text-lg">Webhooks — Stripe</h2>
          </div>
          <div className="flex flex-col gap-4">
            {stripeWebhookScenarios.map((s) => (
              <ScenarioCard key={s.id} scenario={s} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
