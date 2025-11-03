import Link from 'next/link'
import { ShieldAlert, ArrowLeft } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 px-4">
      <div className="max-w-md w-full text-center">
        {/* Icône */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
          <ShieldAlert className="w-12 h-12 text-red-600" />
        </div>

        {/* Titre */}
        <h1 className="text-4xl font-bold text-foreground mb-4">Accès refusé</h1>
        
        {/* Message */}
        <p className="text-lg text-muted-foreground mb-8">
          Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.
        </p>

        {/* Détails */}
        <div className="bg-card rounded-xl shadow-lg p-6 mb-8">
          <h2 className="font-semibold text-foreground mb-3">Raisons possibles :</h2>
          <ul className="text-left space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-0.5">•</span>
              <span>Votre rôle ne permet pas d&apos;accéder à cette ressource</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-0.5">•</span>
              <span>Vous tentez d&apos;accéder aux données d&apos;une autre école</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-0.5">•</span>
              <span>Votre abonnement a expiré</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-0.5">•</span>
              <span>Votre session a expiré</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary hover:bg-[#E6B000] transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour à l&apos;accueil
          </Link>
          
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full border-2 border-border text-muted-foreground px-6 py-3 rounded-lg font-medium hover:bg-background transition"
          >
            Se reconnecter
          </Link>
        </div>

        {/* Contact */}
        <p className="text-sm text-muted-foreground mt-8">
          Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, contactez votre administrateur.
        </p>
      </div>
    </div>
  )
}
