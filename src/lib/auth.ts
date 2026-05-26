import { cookies } from 'next/headers'

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'default-secret-change-me'
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

export function verifyLogin(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD
}

export function generateToken(): string {
  // Simple token: timestamp + secret hash
  const payload = `${Date.now()}-${ADMIN_SECRET}`
  // Base64 encode
  return Buffer.from(payload).toString('base64')
}

export function verifyToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    // Token format: timestamp-secret
    const parts = decoded.split('-')
    if (parts.length < 2) return false
    // Check if secret matches
    const secret = parts.slice(1).join('-')
    if (secret !== ADMIN_SECRET) return false
    // Check expiration (24 hours)
    const timestamp = parseInt(parts[0])
    const now = Date.now()
    const diff = now - timestamp
    return diff < 24 * 60 * 60 * 1000 // 24 hours
  } catch {
    return false
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token) return false
  return verifyToken(token)
}
