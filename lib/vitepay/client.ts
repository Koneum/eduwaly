import { VITEPAY_CONFIG } from './config'
import crypto from 'crypto'

export interface VitepayPaymentRequest {
  orderId: string
  amount: number // Montant en francs (sera converti en centimes)
  description: string
  email: string
  returnUrl: string
  declineUrl: string
  cancelUrl: string
  callbackUrl: string
  languageCode?: string // 'fr' ou 'en'
  currencyCode?: string // 'XOF' par défaut
  countryCode?: string // 'ML' par défaut
  buyerIpAddress?: string
  pType?: string // 'orange_money' par défaut
}

export interface VitepayPaymentResponse {
  redirect_url: string // URL de redirection vers VitePay
}

export interface VitepayCallbackData {
  order_id: string
  amount_100: string
  currency_code: string
  authenticity: string
  success?: string
  failure?: string
  sandbox?: string
}

class VitepayClient {
  private apiKey: string
  private apiSecret: string
  private baseUrl: string
  private mode: 'sandbox' | 'prod'

  constructor() {
    this.apiKey = VITEPAY_CONFIG.apiKey
    this.apiSecret = VITEPAY_CONFIG.apiSecret
    this.baseUrl = VITEPAY_CONFIG.baseUrl
    this.mode = VITEPAY_CONFIG.mode
  }

  /**
   * Génère le hash SHA1 pour l'authentification selon la doc VitePay
   * Format: SHA1(UPPERCASE("order_id;amount_100;currency_code;callback_url;api_secret"))
   */
  private generateHash(
    orderId: string,
    amount100: number,
    currencyCode: string,
    callbackUrl: string
  ): string {
    const data = `${orderId.toUpperCase()};${amount100};${currencyCode.toUpperCase()};${callbackUrl};${this.apiSecret}`
    return crypto.createHash('sha1').update(data.toUpperCase()).digest('hex').toUpperCase()
  }

  /**
   * Vérifie le hash d'authentification du callback
   * Format: SHA1("order_id;amount_100;currency_code;api_secret")
   */
  verifyCallbackAuthenticity(
    orderId: string,
    amount100: number,
    currencyCode: string,
    receivedHash: string
  ): boolean {
    const orderIdUpper = isNaN(Number(orderId)) ? orderId.toUpperCase() : orderId
    const data = `${orderIdUpper};${amount100};${currencyCode.toUpperCase()};${this.apiSecret}`
    const calculatedHash = crypto.createHash('sha1').update(data).digest('hex').toUpperCase()
    return calculatedHash === receivedHash.toUpperCase()
  }

  /**
   * Créer un paiement et récupérer l'URL de redirection VitePay
   * Selon la documentation: POST https://api.vitepay.com/v1/prod/payments
   */
  async createPayment(data: VitepayPaymentRequest): Promise<VitepayPaymentResponse> {
    const amount100 = data.amount * 100 // Convertir en centimes
    const currencyCode = data.currencyCode || 'XOF'
    const languageCode = data.languageCode || 'fr'
    const countryCode = data.countryCode || 'ML'
    const pType = data.pType || 'orange_money'

    // Générer le hash d'authentification
    const hash = this.generateHash(
      data.orderId,
      amount100,
      currencyCode,
      data.callbackUrl
    )

    // Construire les paramètres selon la documentation VitePay
    const formData = new URLSearchParams()
    formData.append('payment[language_code]', languageCode)
    formData.append('payment[currency_code]', currencyCode)
    formData.append('payment[country_code]', countryCode)
    formData.append('payment[order_id]', data.orderId)
    formData.append('payment[description]', data.description)
    formData.append('payment[amount_100]', amount100.toString())
    formData.append('payment[return_url]', data.returnUrl)
    formData.append('payment[decline_url]', data.declineUrl)
    formData.append('payment[cancel_url]', data.cancelUrl)
    formData.append('payment[callback_url]', data.callbackUrl)
    formData.append('payment[email]', data.email)
    formData.append('payment[p_type]', pType)
    formData.append('api_key', this.apiKey)
    formData.append('hash', hash)

    if (data.buyerIpAddress) {
      formData.append('payment[buyer_ip_adress]', data.buyerIpAddress)
    }

    const url = `${this.baseUrl}/v1/${this.mode}/payments`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('VitePay API Error:', errorText)
        throw new Error(`VitePay API error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      
      // VitePay retourne une URL de redirection
      if (!result.redirect_url && !result.url) {
        throw new Error('Aucune URL de redirection reçue de VitePay')
      }

      return {
        redirect_url: result.redirect_url || result.url
      }
    } catch (error) {
      console.error('Erreur lors de la création du paiement VitePay:', error)
      throw error
    }
  }

  /**
   * Traiter le callback de VitePay et retourner la réponse appropriée
   */
  handleCallback(callbackData: VitepayCallbackData): {
    isValid: boolean
    isSuccess: boolean
    response: { status: string; message?: string }
  } {
    const { order_id, amount_100, currency_code, authenticity, success, failure } = callbackData

    // Vérifier l'authenticité
    const isValid = this.verifyCallbackAuthenticity(
      order_id,
      Number(amount_100),
      currency_code,
      authenticity
    )

    if (!isValid) {
      return {
        isValid: false,
        isSuccess: false,
        response: {
          status: '0',
          message: 'Signature invalide'
        }
      }
    }

    const isSuccess = success === '1'

    return {
      isValid: true,
      isSuccess,
      response: {
        status: '1' // Confirmer le traitement
      }
    }
  }
}

export const vitepay = new VitepayClient()
