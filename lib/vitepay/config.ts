/**
 * Configuration Vitepay
 * Documentation: https://api.vitepay.com/developers
 */

export const VITEPAY_CONFIG = {
  apiKey: process.env.VITEPAY_API_KEY || '',
  apiSecret: process.env.VITEPAY_API_SECRET || '',
  baseUrl: process.env.VITEPAY_BASE_URL || 'https://api.vitepay.com',
  mode: process.env.NODE_ENV === 'production' ? 'prod' : 'sandbox', // Prod en production, sandbox en dev
  // Utiliser NEXT_PUBLIC_BASE_URL en priorité pour la cohérence
  returnUrl: process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  currency: 'XOF', // Franc CFA
  countryCode: 'ML', // Mali par défaut
}

export const VITEPAY_ENDPOINTS = {
  createPayment: '/payments',
  getPayment: '/payments/:id',
  listPayments: '/payments',
  createSubscription: '/subscriptions',
  getSubscription: '/subscriptions/:id',
  cancelSubscription: '/subscriptions/:id/cancel',
  webhooks: '/webhooks',
}

export function isVitepayConfigured(): boolean {
  return !!(
    VITEPAY_CONFIG.apiKey &&
    VITEPAY_CONFIG.apiSecret
  )
}
