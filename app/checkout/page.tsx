'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CreditCard, Smartphone, Lock, Shield, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'

interface Plan {
  id: string
  name: string
  displayName: string
  description: string | null
  price: string
  interval: string
  maxStudents: number
  maxTeachers: number
  features: string[]
}

interface School {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile'>('mobile')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [school, setSchool] = useState<School | null>(null)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    cardName: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
    mobileOperator: 'orange',
    mobileNumber: '',
  })

  const planId = searchParams.get('planId')
  const schoolId = searchParams.get('schoolId')

  useEffect(() => {
    if (!planId || !schoolId) {
      toast({
        title: 'Erreur',
        description: 'Informations de paiement manquantes',
        variant: 'destructive',
      })
      router.push('/')
      return
    }

    // Charger les informations du plan et de l'école
    Promise.all([
      fetch(`/api/plans/${planId}`).then(res => res.json()),
      fetch(`/api/schools/${schoolId}`).then(res => res.json())
    ])
      .then(([planData, schoolData]) => {
        setPlan(planData)
        setSchool(schoolData)
        
        // Pré-remplir avec les infos de l'école
        setFormData(prev => ({
          ...prev,
          email: schoolData.email || '',
          phone: schoolData.phone || '',
        }))
        
        setLoading(false)
      })
      .catch(error => {
        console.error('Erreur chargement:', error)
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les informations',
          variant: 'destructive',
        })
        setLoading(false)
      })
  }, [planId, schoolId, router, toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePayment = async () => {
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast({
        title: 'Erreur',
        description: 'Veuillez compléter tous les champs personnels',
        variant: 'destructive',
      })
      return
    }

    if (paymentMethod === 'card' && (!formData.cardName || !formData.cardNumber || !formData.expiry || !formData.cvc)) {
      toast({
        title: 'Erreur',
        description: 'Veuillez compléter tous les champs de la carte',
        variant: 'destructive',
      })
      return
    }

    if (paymentMethod === 'mobile' && (!formData.mobileOperator || !formData.mobileNumber)) {
      toast({
        title: 'Erreur',
        description: 'Veuillez compléter tous les champs Mobile Money',
        variant: 'destructive',
      })
      return
    }

    setProcessing(true)

    try {
      // Créer le paiement avec VitePay
      const response = await fetch('/api/vitepay/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan?.id,
          schoolId: school?.id,
          paymentMethod,
          customerInfo: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création du paiement')
      }

      // Rediriger vers VitePay
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl
      } else {
        throw new Error('URL de redirection manquante')
      }
    } catch (error) {
      console.error('Erreur paiement:', error)
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors du paiement',
        variant: 'destructive',
      })
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-solar-yellow" />
          <p className="text-responsive-sm text-slate-600 dark:text-slate-400">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!plan || !school) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-responsive-base text-slate-600 dark:text-slate-400">Informations non disponibles</p>
          <Button onClick={() => router.push('/')} className="mt-4">
            Retour à l&apos;accueil
          </Button>
        </div>
      </div>
    )
  }

  const price = parseFloat(plan.price)
  const tax = (price * 0.15).toFixed(2)
  const total = (price + parseFloat(tax)).toFixed(2)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row">
      {/* Sidebar Left - Dark Blue */}
      <div className="hidden lg:flex lg:w-80 bg-deep-blue dark:bg-slate-900 text-white flex-col p-responsive sticky top-0 h-screen">
        <div className="mb-8 lg:mb-12">
          <h2 className="text-responsive-xl font-bold text-solar-yellow">Eduwaly</h2>
        </div>

        <div className="flex-1">
          <h2 className="text-responsive-lg font-bold mb-4">Vous avez besoin d&apos;aide ?</h2>
          <p className="text-responsive-sm text-slate-300 mb-6 leading-relaxed">
            Consultez notre{' '}
            <a href="#" className="text-solar-yellow font-semibold hover:underline">
              Centre d&apos;aide
            </a>
            {' '}ou contactez{' '}
            <a href="mailto:support@eduwaly.com" className="text-solar-yellow font-semibold hover:underline">
              support@eduwaly.com
            </a>
          </p>

          <div className="space-y-4 pt-6 border-t border-slate-700">
            <div>
              <p className="text-responsive-xs text-slate-400 uppercase tracking-wide font-semibold mb-2">Sécurité</p>
              <div className="flex items-center gap-2">
                <Shield className="icon-responsive text-solar-yellow" />
                <span className="text-responsive-sm text-slate-300">Paiement 100% sécurisé</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-700 text-center">
          <p className="text-responsive-xs text-slate-400 mb-3">Paiements sécurisés par</p>
          <p className="text-responsive-sm font-bold text-white">VitePay</p>
        </div>
      </div>

      {/* Main Content - Right */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-responsive py-4 flex items-center justify-between sticky top-0 z-10">
          <button 
            onClick={() => router.back()}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-2 text-responsive-sm font-medium"
          >
            <ArrowLeft className="icon-responsive" />
            <span className="hidden sm:inline">Retour</span>
          </button>
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-responsive-lg font-bold text-solar-yellow lg:hidden">Eduwaly</h1>
          </div>
          <div className="w-16 lg:hidden"></div>
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-2xl mx-auto px-responsive py-responsive">
            {/* Status Badge */}
            <div className="mb-6 sm:mb-8">
              <span className="inline-flex items-center gap-2 bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 px-4 py-2 rounded-full text-responsive-sm font-semibold">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                En attente de paiement
              </span>
            </div>

            {/* Title and Price */}
            <div className="mb-6 sm:mb-8">
              <h1 className="text-responsive-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                {plan.displayName}
              </h1>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-responsive-3xl font-bold text-solar-yellow">{price.toLocaleString()} FCFA</span>
                <span className="text-responsive-base text-slate-600 dark:text-slate-400">/{plan.interval === 'MONTHLY' ? 'mois' : 'an'}</span>
              </div>
              <p className="text-responsive-sm text-slate-600 dark:text-slate-400">{plan.description || 'Plan renouvelable automatiquement'}</p>
              
              {/* School Info */}
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
                <p className="text-responsive-xs font-semibold text-blue-900 dark:text-blue-400 mb-2">ÉTABLISSEMENT</p>
                <p className="text-responsive-sm font-bold text-blue-900 dark:text-blue-300">{school.name}</p>
                {school.address && (
                  <p className="text-responsive-xs text-blue-700 dark:text-blue-400 mt-1">{school.address}</p>
                )}
              </div>
            </div>

            {/* Section: Informations Personnelles */}
            <div className="mb-8 sm:mb-10">
              <h2 className="text-responsive-lg font-bold text-slate-900 dark:text-slate-100 mb-4 sm:mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                INFORMATIONS PERSONNELLES
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-responsive-sm text-slate-700 dark:text-slate-300 font-medium">Prénom</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Jean"
                    className="border-slate-300 dark:border-slate-700 h-10 sm:h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-responsive-sm text-slate-700 dark:text-slate-300 font-medium">Nom</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Dupont"
                    className="border-slate-300 dark:border-slate-700 h-10 sm:h-11"
                  />
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <Label htmlFor="email" className="text-responsive-sm text-slate-700 dark:text-slate-300 font-medium">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="jean@example.com"
                  className="border-slate-300 dark:border-slate-700 h-10 sm:h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-responsive-sm text-slate-700 dark:text-slate-300 font-medium">Téléphone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+226 70 12 34 56"
                  className="border-slate-300 dark:border-slate-700 h-10 sm:h-11"
                />
              </div>
            </div>

            {/* Section: Méthode de Paiement */}
            <div className="mb-8 sm:mb-10">
              <h2 className="text-responsive-lg font-bold text-slate-900 dark:text-slate-100 mb-4 sm:mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                MOYEN DE PAIEMENT
              </h2>

              {/* Payment Method Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 sm:mb-8">
                {/* Card Payment (désactivé) */}
                <div
                  className={
                    `border-2 rounded-lg p-4 sm:p-5 transition-all opacity-60 cursor-not-allowed ` +
                    'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400`}>
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-responsive-sm font-bold text-slate-900 dark:text-slate-100">Carte bancaire (bientôt disponible)</h3>
                      <p className="text-responsive-xs text-slate-600 dark:text-slate-400">Indisponible pour le moment</p>
                    </div>
                  </div>
                </div>

                {/* Mobile Money Payment */}
                <div
                  onClick={() => setPaymentMethod('mobile')}
                  className={`border-2 rounded-lg p-4 sm:p-5 cursor-pointer transition-all ${
                    paymentMethod === 'mobile'
                      ? 'border-solar-yellow bg-solar-yellow/5 dark:bg-solar-yellow/10'
                      : 'border-slate-200 dark:border-slate-700 hover:border-solar-yellow/50 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      paymentMethod === 'mobile'
                        ? 'bg-solar-yellow text-slate-900'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}>
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-responsive-sm font-bold text-slate-900 dark:text-slate-100">Mobile Money</h3>
                      <p className="text-responsive-xs text-slate-600 dark:text-slate-400">Orange, MTN, Moov...</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Payment Form - désactivé (non rendu tant que la CB n'est pas disponible) */}

              {/* Mobile Money Form */}
              {paymentMethod === 'mobile' && (
                <div className="space-y-4 bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="space-y-2">
                    <Label htmlFor="mobileOperator" className="text-responsive-sm text-slate-700 dark:text-slate-300 font-medium">Opérateur</Label>
                    <select
                      id="mobileOperator"
                      name="mobileOperator"
                      value={formData.mobileOperator}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 h-10 sm:h-11 text-responsive-sm"
                    >
                      <option value="orange">Orange Money</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobileNumber" className="text-responsive-sm text-slate-700 dark:text-slate-300 font-medium">Numéro de téléphone</Label>
                    <Input
                      id="mobileNumber"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleInputChange}
                      placeholder="+226 70 12 34 56"
                      className="border-slate-300 dark:border-slate-700 h-10 sm:h-11 bg-white dark:bg-slate-950"
                    />
                  </div>

                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg p-4 flex gap-3">
                    <Smartphone className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                    <p className="text-responsive-sm text-green-700 dark:text-green-400">Vous recevrez un code de confirmation SMS sur ce numéro.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Security Notice */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4 flex gap-3 mb-6 sm:mb-8">
              <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <p className="text-responsive-sm text-blue-700 dark:text-blue-400">
                Vos données sont protégées avec chiffrement SSL 256-bit. En continuant, vous acceptez nos{' '}
                <a href="#" className="font-semibold hover:underline">conditions d&apos;utilisation</a>.
              </p>
            </div>

            {/* Price Summary */}
            <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between mb-3 text-responsive-sm">
                <span className="text-slate-600 dark:text-slate-400">Prix {plan.interval === 'MONTHLY' ? 'mensuel' : 'annuel'}</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{price.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between mb-4 text-responsive-sm pb-4 border-b border-slate-300 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Taxes (15%)</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{parseFloat(tax).toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-responsive-base font-bold text-slate-900 dark:text-slate-100">Total</span>
                <span className="text-responsive-2xl font-bold text-solar-yellow">{parseFloat(total).toLocaleString()} FCFA</span>
              </div>
            </div>

            {/* Action Button */}
            <Button
              onClick={handlePayment}
              disabled={processing}
              className="w-full bg-solar-yellow text-background hover:bg-yellow-500 font-bold py-3 text-responsive-base h-auto rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Traitement en cours...
                </>
              ) : (
                'Régler le paiement'
              )}
            </Button>

            {/* Footer Text */}
            <p className="text-center text-responsive-xs text-slate-500 dark:text-slate-400 mt-6">
              Renouvellement automatique • Annulation sans frais • Facture par email
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
