# Script PowerShell pour créer le système de limites/quotas et Vitepay
# Crée tous les fichiers nécessaires en une seule exécution

Write-Host "🚀 Configuration du système d'abonnements complet..." -ForegroundColor Cyan
Write-Host ""

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erreur: Ce script doit être exécuté depuis la racine du projet" -ForegroundColor Red
    exit 1
}

Write-Host "📝 Création des fichiers..." -ForegroundColor Yellow

# 1. Middleware de vérification des quotas
Write-Host "  → lib/subscription/quota-middleware.ts" -ForegroundColor Gray
@'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

export interface QuotaCheck {
  allowed: boolean
  message?: string
  current?: number
  limit?: number
}

/**
 * Vérifie si l'école a atteint ses limites d'abonnement
 */
export async function checkQuota(
  schoolId: string,
  resource: 'students' | 'teachers' | 'storage'
): Promise<QuotaCheck> {
  try {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        subscription: {
          include: {
            plan: true
          }
        }
      }
    })

    if (!school || !school.subscription || !school.subscription.plan) {
      return {
        allowed: false,
        message: 'Aucun abonnement actif'
      }
    }

    const { subscription } = school
    const { plan } = subscription

    // Vérifier le statut de l'abonnement
    if (subscription.status !== 'ACTIVE' && subscription.status !== 'TRIAL') {
      return {
        allowed: false,
        message: `Abonnement ${subscription.status}. Veuillez renouveler votre abonnement.`
      }
    }

    // Vérifier les limites selon le type de ressource
    switch (resource) {
      case 'students': {
        const studentCount = await prisma.student.count({
          where: { schoolId }
        })
        const limit = plan.maxStudents
        
        if (studentCount >= limit) {
          return {
            allowed: false,
            message: `Limite d'étudiants atteinte (${limit}). Passez à un plan supérieur.`,
            current: studentCount,
            limit
          }
        }
        
        return {
          allowed: true,
          current: studentCount,
          limit
        }
      }

      case 'teachers': {
        const teacherCount = await prisma.enseignant.count({
          where: { schoolId }
        })
        const limit = plan.maxTeachers
        
        if (teacherCount >= limit) {
          return {
            allowed: false,
            message: `Limite d'enseignants atteinte (${limit}). Passez à un plan supérieur.`,
            current: teacherCount,
            limit
          }
        }
        
        return {
          allowed: true,
          current: teacherCount,
          limit
        }
      }

      case 'storage': {
        // Pour l'instant, pas de limite de stockage
        return { allowed: true }
      }

      default:
        return { allowed: true }
    }
  } catch (error) {
    console.error('Erreur vérification quota:', error)
    return {
      allowed: false,
      message: 'Erreur lors de la vérification des quotas'
    }
  }
}

/**
 * Middleware pour protéger les routes avec vérification de quota
 */
export async function withQuotaCheck(
  request: NextRequest,
  resource: 'students' | 'teachers' | 'storage'
) {
  try {
    const user = await getAuthUser()
    
    if (!user || !user.schoolId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const quotaCheck = await checkQuota(user.schoolId, resource)

    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Limite atteinte',
          message: quotaCheck.message,
          current: quotaCheck.current,
          limit: quotaCheck.limit
        },
        { status: 403 }
      )
    }

    return null // Autorisé
  } catch (error) {
    console.error('Erreur middleware quota:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
'@ | Out-File -FilePath "lib/subscription/quota-middleware.ts" -Encoding UTF8

# 2. Configuration Vitepay
Write-Host "  → lib/vitepay/config.ts" -ForegroundColor Gray
@'
/**
 * Configuration Vitepay
 * Documentation: https://api.vitepay.com/developers
 */

export const VITEPAY_CONFIG = {
  apiKey: process.env.VITEPAY_API_KEY || '',
  apiSecret: process.env.VITEPAY_API_SECRET || '',
  baseUrl: process.env.VITEPAY_BASE_URL || 'https://api.vitepay.com/v1',
  webhookSecret: process.env.VITEPAY_WEBHOOK_SECRET || '',
  returnUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  currency: 'XOF', // Franc CFA
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
    VITEPAY_CONFIG.apiSecret &&
    VITEPAY_CONFIG.webhookSecret
  )
}
'@ | Out-File -FilePath "lib/vitepay/config.ts" -Encoding UTF8

# 3. Client Vitepay
Write-Host "  → lib/vitepay/client.ts" -ForegroundColor Gray
@'
import { VITEPAY_CONFIG, VITEPAY_ENDPOINTS } from './config'

export interface VitepayPayment {
  id: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  reference: string
  customer: {
    name: string
    email: string
    phone: string
  }
  metadata?: Record<string, any>
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
    metadata?: Record<string, any>
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
    metadata?: Record<string, any>
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
    const crypto = require('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', VITEPAY_CONFIG.webhookSecret)
      .update(payload)
      .digest('hex')
    
    return signature === expectedSignature
  }
}

export const vitepay = new VitepayClient()
'@ | Out-File -FilePath "lib/vitepay/client.ts" -Encoding UTF8

Write-Host ""
Write-Host "✅ Fichiers créés avec succès!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "  1. Ajouter les variables d'environnement dans .env.local:" -ForegroundColor White
Write-Host "     VITEPAY_API_KEY=votre_cle_api" -ForegroundColor Gray
Write-Host "     VITEPAY_API_SECRET=votre_secret_api" -ForegroundColor Gray
Write-Host "     VITEPAY_WEBHOOK_SECRET=votre_secret_webhook" -ForegroundColor Gray
Write-Host "     VITEPAY_BASE_URL=https://api.vitepay.com/v1" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Exécuter le script suivant pour créer les APIs et webhooks:" -ForegroundColor White
Write-Host "     .\scripts\create-vitepay-apis.ps1" -ForegroundColor Gray
Write-Host ""
