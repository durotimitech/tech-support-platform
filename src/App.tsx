import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './store/ThemeContext'
import { AuthProvider } from './auth/AuthContext'
import { LogsProvider } from './store/LogsContext'
import ProtectedRoute from './auth/ProtectedRoute'
import Login from './pages/Login'
import Landing from './pages/Landing'
import Logs from './pages/Logs'
import Requests from './pages/Requests'
import Accounts from './pages/Accounts'

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <LogsProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Landing /></ProtectedRoute>} />
              <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
              <Route path="/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
              <Route path="/accounts" element={<ProtectedRoute><Accounts /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </LogsProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
