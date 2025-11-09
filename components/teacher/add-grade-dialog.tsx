"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"

interface AddGradeDialogProps {
  students: Array<{ id: string; user: { name: string }; studentNumber: string }>
  modules: Array<{ id: string; nom: string }>
  onSuccess: () => void
}

export function AddGradeDialog({ students, modules, onSuccess }: AddGradeDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    studentId: "",
    moduleId: "",
    note: "",
    coefficient: "1",
    type: "DEVOIR",
    comment: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          date: new Date().toISOString()
        })
      })

      if (res.ok) {
        setOpen(false)
        setFormData({
          studentId: "",
          moduleId: "",
          note: "",
          coefficient: "1",
          type: "DEVOIR",
          comment: ""
        })
        onSuccess()
      } else {
        const data = await res.json()
        alert(data.error || 'Erreur lors de la création')
      }
    } catch (error) {
      console.error('Error creating grade:', error)
      alert('Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Saisir une note
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-responsive-lg">Saisir une note</DialogTitle>
          <DialogDescription className="text-responsive-sm">Ajoutez une nouvelle évaluation</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="space-y-2">
            <Label htmlFor="student" className="text-responsive-sm">Étudiant *</Label>
            <Select
              value={formData.studentId}
              onValueChange={(value) => setFormData({ ...formData, studentId: value })}
              required
            >
              <SelectTrigger className="text-responsive-sm">
                <SelectValue placeholder="Sélectionner un étudiant" />
              </SelectTrigger>
              <SelectContent>
                {students.map(student => (
                  <SelectItem key={student.id} value={student.id} className="text-responsive-sm">
                    {student.user.name} ({student.studentNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="module" className="text-responsive-sm">Module *</Label>
            <Select
              value={formData.moduleId}
              onValueChange={(value) => setFormData({ ...formData, moduleId: value })}
              required
            >
              <SelectTrigger className="text-responsive-sm">
                <SelectValue placeholder="Sélectionner un module" />
              </SelectTrigger>
              <SelectContent>
                {modules.map(module => (
                  <SelectItem key={module.id} value={module.id} className="text-responsive-sm">
                    {module.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="note" className="text-responsive-sm">Note /20 *</Label>
              <Input
                id="note"
                type="number"
                min="0"
                max="20"
                step="0.25"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                required
                className="text-responsive-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coefficient" className="text-responsive-sm">Coefficient</Label>
              <Input
                id="coefficient"
                type="number"
                min="0.5"
                max="5"
                step="0.5"
                value={formData.coefficient}
                onChange={(e) => setFormData({ ...formData, coefficient: e.target.value })}
                className="text-responsive-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type" className="text-responsive-sm">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger className="text-responsive-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEVOIR" className="text-responsive-sm">Devoir</SelectItem>
                <SelectItem value="CONTROLE" className="text-responsive-sm">Contrôle</SelectItem>
                <SelectItem value="EXAMEN" className="text-responsive-sm">Examen</SelectItem>
                <SelectItem value="ORAL" className="text-responsive-sm">Oral</SelectItem>
                <SelectItem value="TP" className="text-responsive-sm">TP</SelectItem>
                <SelectItem value="PROJET" className="text-responsive-sm">Projet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment" className="text-responsive-sm">Commentaire (optionnel)</Label>
            <Textarea
              id="comment"
              placeholder="Remarques sur l'évaluation..."
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              className="text-responsive-sm"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer la note'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
