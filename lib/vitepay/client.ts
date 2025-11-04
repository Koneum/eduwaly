import { VITEPAY_CONFIG, VITEPAY_ENDPOINTS } from './config'
import crypto from 'crypto'

export interface VitepayPayment {
  id: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  reference: string
  // URL where the user can complete the payment (if provided by Vitepay)
  paymentUrl?: string
  customer: {
    name: string
    email: string
    phone: string
  }
  metadata?: Record<string, unknown>
}

export interface VitepaySubscription {
  id: string
  planId: string
  customerId: string
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid'
  currentPeriodStart: string
  currentPeriodEnd: string
}

class VitepayClient {
  private apiKey: string
  private apiSecret: string
  private baseUrl: string

  constructor() {
    this.apiKey = VITEPAY_CONFIG.apiKey
    this.apiSecret = VITEPAY_CONFIG.apiSecret
    this.baseUrl = VITEPAY_CONFIG.baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'X-API-Secret': this.apiSecret,
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `Vitepay API error: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Créer un paiement unique
   */
  async createPayment(data: {
    amount: number
    currency?: string
    reference: string
    customer: {
      name: string
      email: string
      phone: string
    }
    returnUrl?: string
    metadata?: Record<string, unknown>
  }): Promise<VitepayPayment> {
    return this.request<VitepayPayment>(VITEPAY_ENDPOINTS.createPayment, {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        currency: data.currency || VITEPAY_CONFIG.currency,
        returnUrl: data.returnUrl || VITEPAY_CONFIG.returnUrl,
      }),
    })
  }

  /**
   * Récupérer un paiement
   */
  async getPayment(paymentId: string): Promise<VitepayPayment> {
    const endpoint = VITEPAY_ENDPOINTS.getPayment.replace(':id', paymentId)
    return this.request<VitepayPayment>(endpoint)
  }

  /**
   * Créer un abonnement
   */
  async createSubscription(data: {
    planId: string
    customerId: string
    metadata?: Record<string, unknown>
  }): Promise<VitepaySubscription> {
    return this.request<VitepaySubscription>(VITEPAY_ENDPOINTS.createSubscription, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Récupérer un abonnement
   */
  async getSubscription(subscriptionId: string): Promise<VitepaySubscription> {
    const endpoint = VITEPAY_ENDPOINTS.getSubscription.replace(':id', subscriptionId)
    return this.request<VitepaySubscription>(endpoint)
  }

  /**
   * Annuler un abonnement
   */
  async cancelSubscription(subscriptionId: string): Promise<VitepaySubscription> {
    const endpoint = VITEPAY_ENDPOINTS.cancelSubscription.replace(':id', subscriptionId)
    return this.request<VitepaySubscription>(endpoint, {
      method: 'POST',
    })
  }

  /**
   * Vérifier la signature d'un webhook
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    // Implémenter la vérification selon la documentation Vitepay
    // Généralement: HMAC-SHA256 du payload avec le webhook secret
    const expectedSignature = crypto
      .createHmac('sha256', VITEPAY_CONFIG.webhookSecret)
      .update(payload)
      .digest('hex')
    
    return signature === expectedSignature
  }
}

export const vitepay = new VitepayClient()
