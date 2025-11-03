# ✅ Modèle Attendance Ajouté

## Changements Prisma Schema

### Nouveau Modèle

```prisma
model Attendance {
  id          String            @id @default(cuid())
  studentId   String
  moduleId    String
  teacherId   String
  date        DateTime
  status      AttendanceStatus
  notes       String?           @db.Text
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  student     Student           @relation(fields: [studentId], references: [id], onDelete: Cascade)
  module      Module            @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  teacher     Enseignant        @relation(fields: [teacherId], references: [id], onDelete: Cascade)

  @@index([studentId])
  @@index([moduleId])
  @@index([teacherId])
  @@index([date])
  @@map("attendances")
}

enum AttendanceStatus {
  PRESENT
  ABSENT
  LATE
  EXCUSED
}
```

### Relations Ajoutées

1. **Student** → `attendances Attendance[]`
2. **Module** → `attendances Attendance[]`
3. **Enseignant** → `attendances Attendance[]`

## Migration

```bash
npx prisma generate
npx prisma migrate dev --name add_attendance_model
```

## Utilisation

### Marquer les présences

```typescript
await prisma.attendance.createMany({
  data: [
    {
      studentId: 'student-1',
      moduleId: 'module-1',
      teacherId: 'teacher-1',
      date: new Date(),
      status: 'PRESENT'
    }
  ]
})
```

### Récupérer les présences

```typescript
const attendances = await prisma.attendance.findMany({
  where: {
    moduleId: 'module-1',
    date: new Date('2025-11-01')
  },
  include: {
    student: {
      include: {
        user: true
      }
    }
  }
})
```

### Calculer le taux de présence

```typescript
const totalAttendances = await prisma.attendance.count({
  where: {
    teacherId: 'teacher-1',
    date: {
      gte: new Date(new Date().setDate(new Date().getDate() - 30))
    }
  }
})

const presentAttendances = await prisma.attendance.count({
  where: {
    teacherId: 'teacher-1',
    status: 'PRESENT',
    date: {
      gte: new Date(new Date().setDate(new Date().getDate() - 30))
    }
  }
})

const rate = Math.round((presentAttendances / totalAttendances) * 100)
```

## Statuts Disponibles

| Statut | Description |
|--------|-------------|
| `PRESENT` | Étudiant présent |
| `ABSENT` | Étudiant absent |
| `LATE` | Étudiant en retard |
| `EXCUSED` | Absence excusée |

## APIs Disponibles

- `GET /api/teacher/attendance` - Récupérer les présences
- `POST /api/teacher/attendance` - Enregistrer les présences

## Composants

- `AttendanceManager` - Interface de gestion des présences
- Page: `/teacher/[schoolId]/attendance-management`

---

**Modèle Attendance configuré avec succès !** ✅
