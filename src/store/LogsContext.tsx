import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { ApiLog } from '../types'

const STORAGE_KEY = 'dishu_logs'

interface LogsContextValue {
  logs: ApiLog[]
  addLog: (log: ApiLog) => void
  clearLogs: () => void
}

const LogsContext = createContext<LogsContextValue | null>(null)

function loadLogs(): ApiLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ApiLog[]) : []
  } catch {
    return []
  }
}

function saveLogs(logs: ApiLog[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
}

export function LogsProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<ApiLog[]>(loadLogs)

  const addLog = useCallback((log: ApiLog) => {
    setLogs((prev) => {
      const next = [log, ...prev]
      saveLogs(next)
      return next
    })
  }, [])

  const clearLogs = useCallback(() => {
    setLogs([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <LogsContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </LogsContext.Provider>
  )
}

export function useLogs() {
  const ctx = useContext(LogsContext)
  if (!ctx) throw new Error('useLogs must be used inside LogsProvider')
  return ctx
}
