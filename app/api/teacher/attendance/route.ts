import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'
import { AttendanceStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

/**
 * GET /api/teacher/attendance
 * Récupérer les présences pour une classe/module
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const moduleId = searchParams.get('moduleId')
    const filiereId = searchParams.get('filiereId')
    const date = searchParams.get('date')

    if (!moduleId || !filiereId) {
      return NextResponse.json(
        { error: 'Module et filière requis' },
        { status: 400 }
      )
    }

    // Récupérer les étudiants de la filière
    const students = await prisma.student.findMany({
      where: {
        filiereId,
        schoolId: user.schoolId,
      },
      include: {
        user: true,
        filiere: true,
      },
      orderBy: {
        user: {
          name: 'asc',
        },
      },
    })

    // Si une date est spécifiée, récupérer les présences
    let attendances: Array<{ id: string; studentId: string; status: AttendanceStatus; date: Date }> = []
    if (date) {
        attendances = await prisma.attendance.findMany({
        where: {
          moduleId,
          date: new Date(date),
    studentId: { in: students.map((s: { id: string }) => s.id) },
        },
      })
    }

    return NextResponse.json({
      students,
      attendances,
    })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des présences' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/teacher/attendance
 * Marquer les présences
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const teacher = await prisma.enseignant.findFirst({
      where: {
        userId: user.id,
        schoolId: user.schoolId,
      },
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Enseignant non trouvé' }, { status: 404 })
    }

    const body = await req.json()
    const { moduleId, date, attendances } = body

    if (!moduleId || !date || !Array.isArray(attendances)) {
      return NextResponse.json(
        { error: 'Données invalides' },
        { status: 400 }
      )
    }

    // Supprimer les présences existantes pour cette date/module
    await prisma.attendance.deleteMany({
      where: {
        moduleId,
        date: new Date(date),
      },
    })

    // Créer les nouvelles présences
    type AttendanceInput = { studentId: string; status: AttendanceStatus; notes?: string }
    const attendanceInputs = attendances as AttendanceInput[]

    const createdAttendances = await prisma.attendance.createMany({
      data: attendanceInputs.map((att: AttendanceInput) => ({
        studentId: att.studentId,
        moduleId,
        teacherId: teacher.id,
        date: new Date(date),
        status: att.status as AttendanceStatus, // PRESENT, ABSENT, LATE, EXCUSED
        notes: att.notes ?? null,
      })),
    }) 

    return NextResponse.json({ success: true, count: createdAttendances.count })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'enregistrement des présences' },
      { status: 500 }
    )
  }
}
