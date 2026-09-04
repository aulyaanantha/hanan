import 'server-only'

import { cookies } from 'next/headers'

const SESSION_COOKIE = 'hanan_session'

export async function createSession() {
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE, 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function destroySession() {
  const cookieStore = await cookies()

  cookieStore.delete(SESSION_COOKIE)
}

export async function isAuthenticated() {
  const cookieStore = await cookies()

  return cookieStore.get(SESSION_COOKIE)?.value === 'authenticated'
}