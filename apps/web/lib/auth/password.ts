import * as bcrypt from 'bcryptjs'

/**
 * Hash a PIN code using bcrypt
 * @param pin - The 4-digit PIN to hash
 * @returns The hashed PIN
 */
export const hashPin = async (pin: string): Promise<string> => {
  // Use a salt rounds of 10 for a good balance of security and performance
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(pin, salt)
}

/**
 * Verify a PIN against a hashed PIN
 * @param pin - The PIN to verify
 * @param hashedPin - The hashed PIN to compare against
 * @returns Whether the PIN is valid
 */
export const verifyPin = async (pin: string, hashedPin: string | null): Promise<boolean> => {
  if (!hashedPin) return false
  return bcrypt.compare(pin, hashedPin)
}

/**
 * Validate that a PIN meets the requirements (4 digits)
 * @param pin - The PIN to validate
 * @returns Whether the PIN is valid
 */
export const validatePin = (pin: string): boolean => {
  const pinRegex = /^\d{4}$/
  return pinRegex.test(pin)
} 