import { PricingSection } from "@/components/pricing/PricingSection"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        <Link href="/login">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la connexion
          </Button>
        </Link>
      </div>
      
      <PricingSection />
      
      <div className="container mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Prêt à commencer ?</h2>
        <p className="text-muted-foreground mb-6">
          Créez votre compte et profitez de 30 jours d'essai gratuit
        </p>
        <Link href="/register">
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
            Créer mon compte gratuitement
          </Button>
        </Link>
      </div>
    </div>
  )
}
