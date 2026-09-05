#!/usr/bin/env node
import crypto from 'node:crypto'
import readline from 'node:readline'

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512').toString('hex')
  return `${hash}:${salt}`
}

export function verifyPassword(password, storedHashWithSalt) {
  if (!storedHashWithSalt || !storedHashWithSalt.includes(':')) return false
  const [hash, salt] = storedHashWithSalt.split(':')
  if (!hash || !salt) return false
  const candidate = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512').toString('hex')
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidate, 'hex'))
}

const argPassword = process.argv[2]
if (argPassword) {
  const hashed = hashPassword(argPassword)
  console.log('\nGenerated ADMIN_PASSWORD_HASH:')
  console.log(hashed)
  console.log('\nAdd this to your .env or production environment variables:\nADMIN_PASSWORD_HASH=' + hashed + '\n')
  process.exit(0)
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

rl.question('Enter password to hash: ', (answer) => {
  if (!answer) {
    console.error('Password cannot be empty.')
    process.exit(1)
  }
  const hashed = hashPassword(answer)
  console.log('\nGenerated ADMIN_PASSWORD_HASH:')
  console.log(hashed)
  console.log('\nAdd this to your .env or production environment variables:\nADMIN_PASSWORD_HASH=' + hashed + '\n')
  rl.close()
})
