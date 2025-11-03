# Script pour mettre à jour quick-actions.tsx avec les vraies données
Write-Host "🔧 Mise à jour de quick-actions.tsx..." -ForegroundColor Cyan

$filePath = "d:\react\UE-GI app\schooly\components\teacher\quick-actions.tsx"
$content = Get-Content $filePath -Raw

# Ajouter useEffect import
$content = $content -replace "import { useState } from 'react'", "import { useState, useEffect } from 'react'"

# Remplacer la fonction handleModuleSelect mockée
$oldHandleModuleSelect = @'
  // Charger les étudiants quand un module est sélectionné pour les présences
  const handleModuleSelect = async (moduleId: string) => {
    setSelectedModule(moduleId)
    // Simuler le chargement des étudiants
    // TODO: Remplacer par un appel API réel
    setStudents([
      { id: '1', name: 'Jean Dupont', status: 'present' },
      { id: '2', name: 'Marie Martin', status: 'present' },
      { id: '3', name: 'Pierre Durand', status: 'present' }
    ])
  }
'@

$newHandleModuleSelect = @'
  const [loadingStudents, setLoadingStudents] = useState(false)

  // Charger les étudiants quand un module est sélectionné pour les présences
  const handleModuleSelect = async (moduleId: string) => {
    setSelectedModule(moduleId)
    if (!moduleId) {
      setStudents([])
      return
    }

    setLoadingStudents(true)
    try {
      const response = await fetch(`/api/teacher/modules/${moduleId}/students`)
      if (!response.ok) throw new Error('Erreur')
      
      const data = await response.json()
      setStudents(data.students.map((s: any) => ({
        id: s.id,
        name: s.name,
        status: 'present' as const
      })))
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Impossible de charger les étudiants')
      setStudents([])
    } finally {
      setLoadingStudents(false)
    }
  }
'@

$content = $content -replace [regex]::Escape($oldHandleModuleSelect), $newHandleModuleSelect

# Remplacer handleAttendanceSubmit
$oldAttendanceSubmit = @'
  const handleAttendanceSubmit = async () => {
    if (!selectedModule) {
      toast.error('Veuillez sélectionner un module')
      return
    }

    // TODO: Appel API pour enregistrer les présences
    toast.success('Présences enregistrées avec succès')
    setIsAttendanceOpen(false)
    router.refresh()
  }
'@

$newAttendanceSubmit = @'
  const handleAttendanceSubmit = async () => {
    if (!selectedModule) {
      toast.error('Veuillez sélectionner un module')
      return
    }

    try {
      const response = await fetch('/api/teacher/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: selectedModule,
          date: attendanceDate,
          attendances: students.map(s => ({
            studentId: s.id,
            status: s.status.toUpperCase()
          }))
        })
      })

      if (!response.ok) throw new Error('Erreur')

      toast.success('Présences enregistrées avec succès')
      setIsAttendanceOpen(false)
      setSelectedModule('')
      setStudents([])
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de l\'enregistrement')
    }
  }
'@

$content = $content -replace [regex]::Escape($oldAttendanceSubmit), $newAttendanceSubmit

# Remplacer handleHomeworkSubmit
$oldHomeworkSubmit = @'
  const handleHomeworkSubmit = async () => {
    if (!homeworkData.moduleId || !homeworkData.title || !homeworkData.dueDate) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    // TODO: Appel API pour créer le devoir
    toast.success('Devoir créé avec succès')
    setIsHomeworkOpen(false)
    setHomeworkData({
      moduleId: '',
      title: '',
      description: '',
      dueDate: '',
      type: 'ASSIGNMENT'
    })
    router.refresh()
  }
'@

$newHomeworkSubmit = @'
  const handleHomeworkSubmit = async () => {
    if (!homeworkData.moduleId || !homeworkData.title || !homeworkData.dueDate) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    try {
      const response = await fetch('/api/teacher/homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(homeworkData)
      })

      if (!response.ok) throw new Error('Erreur')

      toast.success('Devoir créé avec succès')
      setIsHomeworkOpen(false)
      setHomeworkData({
        moduleId: '',
        title: '',
        description: '',
        dueDate: '',
        type: 'ASSIGNMENT'
      })
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la création')
    }
  }
'@

$content = $content -replace [regex]::Escape($oldHomeworkSubmit), $newHomeworkSubmit

# Remplacer handleModuleSelectForParents
$oldModuleSelectParents = @'
  const handleModuleSelectForParents = async (moduleId: string) => {
    setSelectedModuleForParents(moduleId)
    if (moduleId) {
      // Simuler le chargement des étudiants du module
      // TODO: Remplacer par un appel API réel
      setStudentsForContact([
        { id: '1', name: 'Jean Dupont', studentNumber: 'ETU001' },
        { id: '2', name: 'Marie Martin', studentNumber: 'ETU002' },
        { id: '3', name: 'Pierre Durand', studentNumber: 'ETU003' }
      ])
    } else {
      setStudentsForContact([])
    }
  }
'@

$newModuleSelectParents = @'
  const handleModuleSelectForParents = async (moduleId: string) => {
    setSelectedModuleForParents(moduleId)
    if (!moduleId) {
      setStudentsForContact([])
      return
    }

    try {
      const response = await fetch(`/api/teacher/modules/${moduleId}/students`)
      if (!response.ok) throw new Error('Erreur')
      
      const data = await response.json()
      setStudentsForContact(data.students)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Impossible de charger les étudiants')
      setStudentsForContact([])
    }
  }
'@

$content = $content -replace [regex]::Escape($oldModuleSelectParents), $newModuleSelectParents

# Ajouter le loading indicator dans le dialog
$content = $content -replace '(\s+{selectedModule && students\.length > 0 && \()', "`$1`n            {loadingStudents && (`n              <p className=`"text-sm text-muted-foreground`">Chargement des étudiants...</p>`n            )}`n            "

# Ajouter disabled au bouton
$content = $content -replace '(<Button onClick={handleAttendanceSubmit}>)', '<Button onClick={handleAttendanceSubmit} disabled={students.length === 0}>'

Set-Content $filePath $content -NoNewline

Write-Host "✅ quick-actions.tsx mis à jour avec succès!" -ForegroundColor Green
Write-Host "📝 Changements appliqués:" -ForegroundColor Cyan
Write-Host "  - Chargement réel des étudiants depuis l'API" -ForegroundColor White
Write-Host "  - Enregistrement des présences via API" -ForegroundColor White
Write-Host "  - Création des devoirs via API" -ForegroundColor White
Write-Host "  - Indicateur de chargement ajouté" -ForegroundColor White
