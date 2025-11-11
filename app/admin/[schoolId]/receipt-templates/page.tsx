import ReceiptTemplatesManager from "@/components/school-admin/receipt-templates-manager"
import prisma from "@/lib/prisma"

export default async function ReceiptTemplatesPage({ params }: { params: Promise<{ schoolId: string }> }) {
  const { schoolId } = await params

  // Récupérer tous les templates de reçu
  const templates = await prisma.receiptTemplate.findMany({
    where: { schoolId },
    orderBy: { createdAt: 'desc' }
  })

  // Récupérer les informations de l'école
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { 
      name: true, 
      logo: true,
      stamp: true,
      primaryColor: true 
    }
  })

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground text-balance">Templates de Reçu</h1>
        <p className="text-muted-foreground mt-2">
          Personnalisez l&apos;apparence de vos reçus de paiement
        </p>
      </div>
      <ReceiptTemplatesManager 
        templates={templates} 
        schoolId={schoolId}
        schoolLogo={school?.logo || null}
        schoolStamp={school?.stamp || null}
        schoolName={school?.name || ''}
        schoolColor={school?.primaryColor || '#4F46E5'}
      />
    </div>
  )
}
