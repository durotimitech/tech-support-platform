import { useEffect } from 'react'
import type { ApiLog } from '../types'
import { getPlaybook } from '../data/playbooks'

const METHOD_CLASS: Record<string, string> = {
  GET:    'bg-blue-50 text-blue-700 dark:bg-[#0e1e30] dark:text-blue-400',
  POST:   'bg-emerald-50 text-emerald-700 dark:bg-[#0d2218] dark:text-emerald-400',
  PUT:    'bg-amber-50 text-amber-700 dark:bg-[#261c08] dark:text-amber-400',
  PATCH:  'bg-violet-50 text-violet-700 dark:bg-[#1e1040] dark:text-violet-400',
  DELETE: 'bg-red-50 text-red-700 dark:bg-[#2a1010] dark:text-red-400',
}

function statusClass(code: number) {
  if (code >= 200 && code < 300) return 'bg-emerald-50 text-emerald-700 dark:bg-[#0d2218] dark:text-emerald-400'
  if (code >= 400 && code < 500) return 'bg-amber-50 text-amber-700 dark:bg-[#261c08] dark:text-amber-400'
  if (code >= 500)               return 'bg-red-50 text-red-700 dark:bg-[#2a1010] dark:text-red-400'
  return 'bg-slate-100 text-slate-600'
}

interface Props {
  log: ApiLog
  onClose: () => void
}

export default function LogModal({ log, onClose }: Props) {
  const playbook = getPlaybook(log.statusCode, log.errorCode)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function formatTime(iso: string) {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-border">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-block px-1.5 py-0.5 rounded font-mono text-[11px] font-bold ${METHOD_CLASS[log.method]}`}>
                {log.method}
              </span>
              <span className="font-mono text-[13px] text-text-muted">{log.endpoint}</span>
              <span className={`inline-block px-2 py-0.5 rounded font-mono text-[12px] font-bold ${statusClass(log.statusCode)}`}>
                {log.statusCode}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[12px] text-text-faint flex-wrap">
              <span className="font-mono">{log.requestId}</span>
              <span>·</span>
              <span>{log.platform}</span>
              <span>·</span>
              <span>{formatTime(log.timestamp)}</span>
              <span>·</span>
              <span>{log.responseTime}ms</span>
            </div>
            {log.errorCode && (
              <span className="font-mono text-[11.5px] text-red-500 dark:text-red-400">{log.errorCode}</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-lg text-text-faint hover:text-text hover:bg-card-dark transition-colors cursor-pointer bg-transparent border-none"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Playbook */}
        <div className="px-6 py-5 flex flex-col gap-5">
          {playbook ? (
            <>
              <div>
                <p className="text-text-faint text-[10.5px] font-semibold uppercase tracking-wider mb-3">
                  Diagnostic playbook — {playbook.title}
                </p>

                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-text text-[12px] font-semibold mb-2">Check</p>
                    <ul className="flex flex-col gap-2">
                      {playbook.checks.map((c, i) => (
                        <li key={i} className="flex gap-2.5 text-[13px] text-text-muted">
                          <span className="text-text-ghost shrink-0 mt-0.5">•</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-card-dark rounded-xl p-4 flex flex-col gap-3">
                    <div>
                      <p className="text-text-dim text-[11px] font-semibold uppercase tracking-wider mb-1">Likely cause</p>
                      <p className="text-[13px] text-text-muted">{playbook.likelyCause}</p>
                    </div>
                    <div className="border-t border-border pt-3">
                      <p className="text-text-dim text-[11px] font-semibold uppercase tracking-wider mb-1">To customer</p>
                      <p className="text-[13px] text-text-muted italic">"{playbook.toCustomer}"</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center">
              <p className="text-text-dim text-sm">No playbook available for this error yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
