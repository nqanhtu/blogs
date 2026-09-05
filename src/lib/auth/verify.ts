import crypto from 'node:crypto'

/**
 * Verifies a candidate password against the stored ADMIN_PASSWORD_HASH environment variable.
 * Hash format is "<hexHash>:<hexSalt>"
 */
export function verifyAdminPassword(candidatePassword: string): boolean {
  if (!candidatePassword) return false

  const stored = process.env.ADMIN_PASSWORD_HASH?.trim()
  if (!stored || !stored.includes(':')) {
    console.error('ADMIN_PASSWORD_HASH is missing or misconfigured in environment.')
    return false
  }

  const [hash, salt] = stored.split(':')
  if (!hash || !salt) return false

  try {
    const candidateHash = crypto
      .pbkdf2Sync(candidatePassword, salt, 100000, 32, 'sha512')
      .toString('hex')

    const bufCandidate = Buffer.from(candidateHash, 'hex')
    const bufExpected = Buffer.from(hash, 'hex')

    if (bufCandidate.length !== bufExpected.length) {
      return false
    }

    return crypto.timingSafeEqual(bufCandidate, bufExpected)
  } catch (err) {
    console.error('Error verifying password:', err)
    return false
  }
}
