import crypto from 'crypto'

export function generateReferralCode(firstName: string, lastName: string): string {
  const prefix = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase()
  const random = crypto.randomBytes(3).toString('hex').toUpperCase()
  return `${prefix}${random}`
}
