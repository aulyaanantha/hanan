import 'server-only'

import bcrypt from 'bcryptjs'

export async function verifyPin(pin: string) {
  const encodedHash = process.env.HANAN_PIN_HASH_B64

  if (!encodedHash) {
    throw new Error('Missing HANAN_PIN_HASH_B64')
  }

  const pinHash = Buffer.from(encodedHash, 'base64').toString('utf8')

  return bcrypt.compare(pin, pinHash)
}