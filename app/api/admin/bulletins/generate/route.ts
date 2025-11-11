import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'
import { evaluate } from 'mathjs'

export const dynamic = 'force-dynamic'

// Fonction pour générer le HTML du bulletin avec template
function generateBulletinHTML(bulletinData: any, school: any, template: any) {
  const { student, period, modules, generalAverage } = bulletinData
  
  // Header avec template
  const logoHTML = template.showLogo && school.logo ? `
    <div style="text-align: ${template.logoPosition}; margin-bottom: 15px;">
      <img src="${school.logo}" alt="Logo" style="max-width: 150px; max-height: 80px; object-fit: contain;" />
    </div>
  ` : ''
  
  const stampHTML = template.showStamp && school.stamp ? `
    <div style="position: absolute; top: 20px; right: 20px; opacity: 0.7;">
      <img src="${school.stamp}" alt="Tampon" style="max-width: 100px; max-height: 100px; object-fit: contain;" />
    </div>
  ` : ''
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Bulletin - ${student.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; margin: 0; }
          .header { position: relative; text-align: center; border-bottom: 3px solid ${template.headerColor}; padding: 20px; margin-bottom: 30px; }
          .header h1 { font-size: ${template.schoolNameSize}px; color: ${template.headerColor}; margin: 10px 0; }
          .school-info { font-size: 12px; color: #666; margin-top: 10px; }
          .bulletin-title { text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; color: ${template.headerColor}; }
          .student-info { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .student-info p { margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 12px; text-align: left; border: 1px solid #ddd; }
          th { background-color: ${template.headerColor}; color: white; font-weight: bold; }
          .average-row { background-color: #f0f0f0; font-weight: bold; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; text-align: center; font-size: 11px; color: #666; }
          .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
          .signature { text-align: center; width: 45%; }
          .signature-line { border-top: 2px solid #333; margin-top: 50px; padding-top: 5px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          ${logoHTML}
          <h1>${school.name}</h1>
          <div class="school-info">
            ${template.showAddress && school.address ? `<p>📍 ${school.address}</p>` : ''}
            ${template.showPhone && school.phone ? `<p>📞 ${school.phone}</p>` : ''}
            ${template.showEmail && school.email ? `<p>📧 ${school.email}</p>` : ''}
          </div>
          ${stampHTML}
        </div>
        
        <div class="bulletin-title">BULLETIN DE NOTES</div>
        
        <div class="student-info">
          <p><strong>Nom:</strong> ${student.name}</p>
          <p><strong>Matricule:</strong> ${student.studentNumber}</p>
          <p><strong>Filière:</strong> ${student.filiere}</p>
          <p><strong>Niveau:</strong> ${student.niveau}</p>
          <p><strong>Période:</strong> ${period}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Module</th>
              <th style="text-align: center;">Devoirs</th>
              <th style="text-align: center;">Examens</th>
              <th style="text-align: center;">Moyenne</th>
            </tr>
          </thead>
          <tbody>
            ${modules.map((m: any) => `
              <tr>
                <td>${m.module}</td>
                <td style="text-align: center;">${m.avgDevoirs}</td>
                <td style="text-align: center;">${m.avgExamens}</td>
                <td style="text-align: center;"><strong>${m.finalGrade}</strong></td>
              </tr>
            `).join('')}
            <tr class="average-row">
              <td colspan="3" style="text-align: right;">MOYENNE GÉNÉRALE:</td>
              <td style="text-align: center; font-size: 18px;">${generalAverage}/20</td>
            </tr>
          </tbody>
        </table>
        
        <div class="footer">
          <p style="font-style: italic;">${template.footerText}</p>
          ${template.showSignatures ? `
            <div class="signatures">
              <div class="signature" style="position: relative;">
                <p>Le Directeur</p>
                ${school.stamp ? `
                  <div style="margin: 10px auto; width: 100px; height: 100px;">
                    <img src="${school.stamp}" alt="Tampon" style="width: 100%; height: 100%; object-fit: contain; opacity: 0.8;" />
                  </div>
                ` : '<div style="height: 60px;"></div>'}
                <div class="signature-line">Signature et cachet</div>
              </div>
              <div class="signature">
                <p>Le Parent/Tuteur</p>
                <div style="height: 60px;"></div>
                <div class="signature-line">Signature</div>
              </div>
            </div>
          ` : ''}
          <p style="margin-top: 20px;">Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
        </div>
        
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `
}

/**
 * POST /api/admin/bulletins/generate
 * Générer des bulletins PDF
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { schoolId, periodId, filiereId, studentId } = body

    if (!schoolId || !periodId) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    if (user.schoolId !== schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Récupérer l'école et la période
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        evaluationTypes: { where: { isActive: true } }
      }
    })

    const period = await prisma.gradingPeriod.findUnique({
      where: { id: periodId }
    })

    if (!school || !period) {
      return NextResponse.json({ error: 'École ou période non trouvée' }, { status: 404 })
    }

    // Construire le filtre pour les étudiants
    const studentFilter: {
      schoolId: string
      isEnrolled: boolean
      id?: string
      filiereId?: string
    } = { schoolId, isEnrolled: true }
    if (studentId) {
      studentFilter.id = studentId
    }
    if (filiereId) {
      studentFilter.filiereId = filiereId
    }

    // Récupérer les étudiants
    const students = await prisma.student.findMany({
      where: studentFilter,
      include: {
        user: true,
        filiere: true,
        evaluations: {
          where: {
            date: {
              gte: period.startDate,
              lte: period.endDate
            }
          },
          include: {
            module: true
          }
        }
      }
    })

    if (students.length === 0) {
      return NextResponse.json({ error: 'Aucun étudiant trouvé' }, { status: 404 })
    }

    // Calculer les notes pour chaque étudiant
    const bulletinsData = students.map(student => {
      // Grouper les évaluations par module
      const moduleGrades = new Map<string, { 
        module: string
        devoirs: number[]
        examens: number[]
      }>()

      student.evaluations.forEach(evaluation => {
        const moduleId = evaluation.moduleId
        if (!moduleGrades.has(moduleId)) {
          moduleGrades.set(moduleId, {
            module: evaluation.module.nom,
            devoirs: [],
            examens: []
          })
        }

        const grades = moduleGrades.get(moduleId)!
        const evalType = school.evaluationTypes.find(t => t.name === evaluation.type)
        
        if (evalType?.category === 'EXAM') {
          grades.examens.push(Number(evaluation.note))
        } else {
          grades.devoirs.push(Number(evaluation.note))
        }
      })

      // Calculer les moyennes par module
      const moduleResults = Array.from(moduleGrades.entries()).map(([, data]) => {
        const avgDevoirs = data.devoirs.length > 0
          ? data.devoirs.reduce((a, b) => a + b, 0) / data.devoirs.length
          : 0

        const avgExamens = data.examens.length > 0
          ? data.examens.reduce((a, b) => a + b, 0) / data.examens.length
          : 0

        // Appliquer la formule de l'école avec mathjs (sécurisé)
        let finalGrade = 0
        if (school.gradingFormula) {
          try {
            // Utiliser mathjs pour évaluation sécurisée
            finalGrade = evaluate(school.gradingFormula, {
              examens: avgExamens,
              devoirs: avgDevoirs,
              projets: 0
            })
          } catch {
            finalGrade = (avgExamens + avgDevoirs) / 2
          }
        } else {
          finalGrade = (avgExamens + avgDevoirs) / 2
        }

        return {
          module: data.module,
          avgDevoirs: avgDevoirs.toFixed(2),
          avgExamens: avgExamens.toFixed(2),
          finalGrade: finalGrade.toFixed(2)
        }
      })

      // Moyenne générale
      const generalAverage = moduleResults.length > 0
        ? (moduleResults.reduce((sum, m) => sum + parseFloat(m.finalGrade), 0) / moduleResults.length).toFixed(2)
        : '0.00'

      return {
        student: {
          name: student.user?.name || 'Étudiant',
          studentNumber: student.studentNumber,
          filiere: student.filiere?.nom || 'N/A',
          niveau: student.niveau
        },
        period: period.name,
        modules: moduleResults,
        generalAverage
      }
    })

    // Récupérer le template PDF
    let template = await prisma.pDFTemplate.findUnique({
      where: { schoolId }
    })

    if (!template) {
      // Créer un template par défaut
      template = await prisma.pDFTemplate.create({
        data: {
          schoolId,
          headerColor: school.primaryColor || '#4F46E5'
        }
      })
    }

    // Générer le HTML pour chaque bulletin
    const htmlBulletins = bulletinsData.map(data => 
      generateBulletinHTML(data, school, template)
    )

    // Pour un seul étudiant, retourner directement le HTML
    if (bulletinsData.length === 1) {
      return new NextResponse(htmlBulletins[0], {
        headers: {
          'Content-Type': 'text/html; charset=utf-8'
        }
      })
    }

    // Pour plusieurs étudiants, retourner les données JSON
    return NextResponse.json({
      message: `${bulletinsData.length} bulletin(s) généré(s)`,
      bulletins: bulletinsData,
      count: bulletinsData.length
    })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération' },
      { status: 500 }
    )
  }
}
