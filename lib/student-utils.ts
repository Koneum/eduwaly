import prisma from '@/lib/prisma'

function autoGenerateSigleFromName(name?: string | null, fallback?: string | null) {
  if (name) {
    const words = name
      .split(/\s+/)
      .map((w) => w.trim())
      .filter(Boolean)

    if (words.length > 1) {
      const initials = words
        .map((w) => w[0]?.toUpperCase())
        .filter(Boolean)
        .join('')

      if (initials.length >= 2 && initials.length <= 6) {
        return initials
      }
    }

    // Fallback: 3 premières lettres du premier mot
    const first = words[0]
    if (first) {
      return first.substring(0, 3).toUpperCase()
    }
  }

  if (fallback) {
    return fallback.toUpperCase()
  }

  return 'SCHOOL'
}

export async function generateStudentNumberForSchool(schoolId: string, promotionYear: number) {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { shortName: true, subdomain: true, name: true },
  })

  if (!school) {
    throw new Error('École introuvable pour la génération du numéro étudiant')
  }

  const baseSigle = school.shortName
    || autoGenerateSigleFromName(school.name, school.subdomain)
  const sigle = baseSigle.toUpperCase()
  const yearStr = String(promotionYear)

  const prefix = `${sigle}-${yearStr}-`

  const lastStudent = await prisma.student.findFirst({
    where: {
      schoolId,
      studentNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      studentNumber: 'desc',
    },
  })

  let nextRank = 1

  if (lastStudent) {
    const parts = lastStudent.studentNumber.split('-')
    const lastPart = parts[2]
    const parsed = parseInt(lastPart, 10)
    if (!Number.isNaN(parsed)) {
      nextRank = parsed + 1
    }
  }

  const rankStr = String(nextRank).padStart(4, '0')
  return `${sigle}-${yearStr}-${rankStr}`
}
