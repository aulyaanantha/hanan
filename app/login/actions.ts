'use server'

import { redirect } from 'next/navigation'

import { verifyPin } from '@/lib/auth'
import { createSession } from '@/lib/session/server'

export async function loginAction(formData: FormData) {
  const pin = String(formData.get('pin') ?? '')

  if (!pin) {
    redirect('/login?error=empty')
  }

  const valid = await verifyPin(pin)

  if (!valid) {
    redirect('/login?error=invalid')
  }

  await createSession()

  redirect('/')
}