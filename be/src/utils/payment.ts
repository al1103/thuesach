/**
 * @file payment.ts
 * @description Utility for generating VietQR payment URLs for fines.
 */

const BANK_ID = 'MB'
const ACCOUNT_NO = '0362145888'
const ACCOUNT_NAME = 'THUE SACH'
const TEMPLATE = 'compact'

/**
 * Generates a VietQR URL for a payment.
 * @param amount - The amount to be paid.
 * @param description - The description for the payment transaction.
 * @returns {string} The VietQR image URL.
 */
export function generateQRUrl(amount: number, description: string): string {
  const encodedDesc = encodeURIComponent(description)
  const encodedName = encodeURIComponent(ACCOUNT_NAME)
  return `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-${TEMPLATE}.png?amount=${amount}&addInfo=${encodedDesc}&accountName=${encodedName}`
}
