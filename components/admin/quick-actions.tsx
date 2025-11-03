"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, DollarSign, Bell, Plus, Trash2 } from "lucide-react"

interface CustomField {
  id: string
  label: string
  type: string
  required: boolean
}

export function QuickActions({ schoolId }: { schoolId: string }) {
  const [studentFields, setStudentFields] = useState<CustomField[]>([
    { id: '1', label: 'Nom', type: 'text', required: true },
    { id: '2', label: 'Prénom', type: 'text', required: true },
    { id: '3', label: 'Email', type: 'email', required: false },
  ])

  const [paymentFields, setPaymentFields] = useState<CustomField[]>([
    { id: '1', label: 'Montant', type: 'number', required: true },
    { id: '2', label: 'Méthode', type: 'select', required: true },
  ])

  const addField = (type: 'student' | 'payment') => {
    const newField: CustomField = {
      id: Date.now().toString(),
      label: 'Nouveau champ',
      type: 'text',
      required: false
    }
    
    if (type === 'student') {
      setStudentFields([...studentFields, newField])
    } else {
      setPaymentFields([...paymentFields, newField])
    }
  }

  const removeField = (type: 'student' | 'payment', id: string) => {
    if (type === 'student') {
      setStudentFields(studentFields.filter(f => f.id !== id))
    } else {
      setPaymentFields(paymentFields.filter(f => f.id !== id))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions Rapides</CardTitle>
        <CardDescription>Effectuez des actions courantes rapidement</CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-3 gap-4">
        {/* Ajouter un étudiant */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="h-24 flex-col gap-2">
              <UserPlus className="h-6 w-6" />
              <span>Ajouter Étudiant</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ajouter un Étudiant</DialogTitle>
              <DialogDescription>Créez un nouveau profil étudiant avec des champs personnalisables</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Gestion des champs */}
              <div className="border-b pb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Champs du formulaire</h3>
                  <Button size="sm" variant="outline" onClick={() => addField('student')}>
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter un champ
                  </Button>
                </div>
                <div className="space-y-2">
                  {studentFields.map((field) => (
                    <div key={field.id} className="flex items-center gap-2 p-2 border rounded">
                      <Input
                        value={field.label}
                        onChange={(e) => {
                          setStudentFields(studentFields.map(f => 
                            f.id === field.id ? { ...f, label: e.target.value } : f
                          ))
                        }}
                        className="flex-1"
                        placeholder="Nom du champ"
                      />
                      <Select
                        value={field.type}
                        onValueChange={(value) => {
                          setStudentFields(studentFields.map(f => 
                            f.id === field.id ? { ...f, type: value } : f
                          ))
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Texte</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="number">Nombre</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="select">Liste</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeField('student', field.id)}
                        disabled={field.required}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Formulaire dynamique */}
              <form className="space-y-4">
                {studentFields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label>
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {field.type === 'select' ? (
                      <Select required={field.required}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="option1">Option 1</SelectItem>
                          <SelectItem value="option2">Option 2</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={field.type}
                        required={field.required}
                        placeholder={`Entrez ${field.label.toLowerCase()}`}
                      />
                    )}
                  </div>
                ))}
                
                <Button type="submit" className="w-full">
                  Créer l&apos;étudiant
                </Button>
              </form>
            </div>
          </DialogContent>
        </Dialog>

        {/* Enregistrer un paiement */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="h-24 flex-col gap-2" variant="outline">
              <DollarSign className="h-6 w-6" />
              <span>Enregistrer Paiement</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Enregistrer un Paiement</DialogTitle>
              <DialogDescription>Enregistrez un paiement de scolarité avec des champs personnalisables</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Gestion des champs */}
              <div className="border-b pb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Champs du formulaire</h3>
                  <Button size="sm" variant="outline" onClick={() => addField('payment')}>
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter un champ
                  </Button>
                </div>
                <div className="space-y-2">
                  {paymentFields.map((field) => (
                    <div key={field.id} className="flex items-center gap-2 p-2 border rounded">
                      <Input
                        value={field.label}
                        onChange={(e) => {
                          setPaymentFields(paymentFields.map(f => 
                            f.id === field.id ? { ...f, label: e.target.value } : f
                          ))
                        }}
                        className="flex-1"
                        placeholder="Nom du champ"
                      />
                      <Select
                        value={field.type}
                        onValueChange={(value) => {
                          setPaymentFields(paymentFields.map(f => 
                            f.id === field.id ? { ...f, type: value } : f
                          ))
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Texte</SelectItem>
                          <SelectItem value="number">Nombre</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="select">Liste</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeField('payment', field.id)}
                        disabled={field.required}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Formulaire dynamique */}
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label>Étudiant *</Label>
                  <Select required>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un étudiant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Jean Dupont</SelectItem>
                      <SelectItem value="2">Marie Martin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {paymentFields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label>
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {field.type === 'select' ? (
                      <Select required={field.required}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Espèces</SelectItem>
                          <SelectItem value="card">Carte</SelectItem>
                          <SelectItem value="transfer">Virement</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={field.type}
                        required={field.required}
                        placeholder={`Entrez ${field.label.toLowerCase()}`}
                      />
                    )}
                  </div>
                ))}
                
                <Button type="submit" className="w-full">
                  Enregistrer le paiement
                </Button>
              </form>
            </div>
          </DialogContent>
        </Dialog>

        {/* Envoyer des rappels */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="h-24 flex-col gap-2" variant="outline">
              <Bell className="h-6 w-6" />
              <span>Envoyer Rappels</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Envoyer des Rappels de Paiement</DialogTitle>
              <DialogDescription>Envoyez des notifications aux étudiants en retard de paiement</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>12 étudiants</strong> ont des paiements en retard
                </p>
              </div>

              <div className="space-y-2">
                <Label>Type de rappel</Label>
                <Select defaultValue="email">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="both">Email + SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Message personnalisé (optionnel)</Label>
                <Input placeholder="Ajoutez un message..." />
              </div>

              <Button className="w-full">
                <Bell className="h-4 w-4 mr-2" />
                Envoyer les rappels
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
