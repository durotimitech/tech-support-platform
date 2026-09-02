export type Role = 'admin' | 'tech_support'

export interface User {
  username: string
  role: Role
}

const CREDENTIALS: { username: string; password: string; role: Role }[] = [
  { username: 'admin', password: 'admin', role: 'admin' },
  { username: 'kaito', password: 'kaito', role: 'tech_support' },
]

export function authenticate(username: string, password: string): User | null {
  const match = CREDENTIALS.find(
    (c) => c.username === username && c.password === password
  )
  return match ? { username: match.username, role: match.role } : null
}
