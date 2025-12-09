'use client'

import { useEffect, useState, use } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Download, Clock, BookOpen, TrendingUp, DollarSign, ArrowLeft, Calendar, GraduationCap, User } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Module {
  id: string
  nom: string
  type: string
  vh: number
  filiere: {
    nom: string
  } | null
  semestre?: 'S1' | 'S2'
}

interface EmploiDuTemps {
  id: string
  dateDebut: string
  dateFin: string
  heureDebut: string
  heureFin: string
  vh: number
  module: Module
  evaluation: boolean
  jourEvaluation: string | null
  joursCours: string | null
  anneeUniv: {
    annee: string
  } | null
}

interface Enseignant {
  id: string
  nom: string
  prenom: string
  titre: string
  grade: string
  type: string
  emplois: EmploiDuTemps[]
}

export default function EnseignantDetailsPage({ params }: { params: Promise<{ schoolId: string; id: string }> }) {
  const [enseignant, setEnseignant] = useState<Enseignant | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSemestre, setSelectedSemestre] = useState<'S1' | 'S2'>('S1')
  const [selectedType, setSelectedType] = useState<'all' | 'CM' | 'TD' | 'TP'>('all')

  // Utiliser le hook use pour accéder aux paramètres de manière asynchrone
  const { id, schoolId } = use(params);

  // Fonction pour formater le type d'enseignant
  const formatType = (type: string) => {
    switch (type) {
      case 'PERMANENT':
        return 'Enseignant Permanent'
      case 'VACATAIRE':
        return 'Enseignant Vacataire'
      default:
        return type
    }
  }

  // Fonction pour formater le grade
  const formatGrade = (grade: string) => {
    switch (grade) {
      case 'PROFESSEUR':
        return 'Professeur'
      case 'MAITRE_CONFERENCE':
        return 'Maître de Conférences'
      case 'MAITRE_ASSISTANT':
        return 'Maître Assistant'
      case 'ASSISTANT':
        return 'Assistant'
      default:
        return grade
    }
  }

  // Fonction pour obtenir la couleur du badge selon le type
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'CM':
        return 'bg-blue-100 text-blue-800'
      case 'TD':
        return 'bg-green-100 text-green-800'
      case 'TP':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Fonction pour calculer le total des heures
  const calculateTotalHours = (emplois: EmploiDuTemps[]) => {
    return emplois
      .filter(emploi => emploi.module.semestre === selectedSemestre)
      .filter(emploi => selectedType === 'all' || emploi.module.type === selectedType)
      .reduce((sum, emploi) => sum + emploi.vh, 0)
  }

  useEffect(() => {
    const fetchEnseignant = async () => {
      try {
        const response = await fetch(`/api/enseignants/${id}`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        
        // Toujours recalculer le semestre selon la nouvelle logique
        const enseignantWithSemestre = {
          ...data,
          emplois: data.emplois.map((emploi: EmploiDuTemps) => ({
            ...emploi,
            module: {
              ...emploi.module,
              semestre: getSemestreFromDate(emploi.dateDebut)
            }
          }))
        };
        
        setEnseignant(enseignantWithSemestre);
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setLoading(false);
      }
    };

    fetchEnseignant();
  }, [id]);

  const getSemestreFromDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1; // Les mois commencent à 0
    // S1 = Septembre-Janvier (rentrée), S2 = Février-Juillet
    return (month >= 9 || month <= 1) ? 'S1' : 'S2';
  };

  const handleExportPDF = async () => {
    try {
      // Désactiver le bouton pendant le téléchargement
      const button = document.querySelector('button[data-export-pdf]') as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.innerHTML = '<span class="animate-spin mr-2">↻</span> Génération...';
      }

      const response = await fetch(`/api/enseignants/${id}/pdf`, {
        method: 'POST',
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          semestre: selectedSemestre
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `emploi-du-temps-${enseignant?.nom}-${enseignant?.prenom}.pdf`;
      
      // Utiliser setTimeout pour éviter les clics multiples
      document.body.appendChild(a);
      setTimeout(() => {
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Réactiver le bouton après le téléchargement
        if (button) {
          button.disabled = false;
          button.innerHTML = '<svg class="mr-2" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>Exporter PDF';
        }
      }, 100);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erreur lors de la génération du PDF');
      
      // Réactiver le bouton en cas d'erreur
      const button = document.querySelector('button[data-export-pdf]') as HTMLButtonElement;
      if (button) {
        button.disabled = false;
        button.innerHTML = '<svg class="mr-2" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>Exporter PDF';
      }
    }
  };

  // Calculs pour les stats
  const totalHeuresAnnuel = enseignant?.emplois.reduce((sum, emploi) => sum + emploi.vh, 0) || 0
  const heuresDuesAnnuel = enseignant?.type === 'PERMANENT' ? 192 : 96
  const heuresSuppAnnuel = Math.max(0, totalHeuresAnnuel - heuresDuesAnnuel)
  const totalModules = new Set(enseignant?.emplois.map(e => e.module.id) || []).size
  
  // Taux horaire pour les heures supplémentaires (exemple)
  const tauxHoraire = enseignant?.type === 'PERMANENT' ? 5000 : 7500 // FCFA
  const montantHeuresSupp = heuresSuppAnnuel * tauxHoraire

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!enseignant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium">Enseignant non trouvé</p>
          <Link href={`/admin/${schoolId}/statistiques`}>
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header moderne avec gradient */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700 dark:from-indigo-800 dark:via-purple-800 dark:to-purple-900 p-6 sm:p-8 shadow-lg">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative">
          <Link href={`/admin/${schoolId}/statistiques`} className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-4 border-white/20">
                <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                  {enseignant.nom[0]}{enseignant.prenom[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  {enseignant.titre} {enseignant.prenom} {enseignant.nom}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-white/20 text-white border-0">
                    {formatGrade(enseignant.grade)}
                  </Badge>
                  <Badge className={enseignant.type === 'PERMANENT' 
                    ? 'bg-emerald-500/30 text-white border-0' 
                    : 'bg-amber-500/30 text-white border-0'
                  }>
                    {formatType(enseignant.type)}
                  </Badge>
                </div>
              </div>
            </div>
            
            <Button 
              data-export-pdf 
              onClick={handleExportPDF} 
              className="bg-white text-indigo-700 hover:bg-white/90"
            >
              <Download className="mr-2 h-4 w-4" />
              Exporter PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card className="relative overflow-hidden border-l-4 border-l-indigo-500 bg-card shadow-md">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-indigo-50 dark:from-indigo-900/20 to-transparent rounded-bl-full" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Modules</p>
                <p className="text-2xl font-bold mt-1">{totalModules}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-emerald-500 bg-card shadow-md">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-emerald-50 dark:from-emerald-900/20 to-transparent rounded-bl-full" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">H. Effectuées</p>
                <p className="text-2xl font-bold mt-1">{totalHeuresAnnuel}h</p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-blue-500 bg-card shadow-md">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-blue-50 dark:from-blue-900/20 to-transparent rounded-bl-full" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">H. Dues</p>
                <p className="text-2xl font-bold mt-1">{heuresDuesAnnuel}h</p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-amber-500 bg-card shadow-md">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-amber-50 dark:from-amber-900/20 to-transparent rounded-bl-full" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">H. Supp.</p>
                <p className={`text-2xl font-bold mt-1 ${heuresSuppAnnuel > 0 ? 'text-amber-600' : ''}`}>
                  {heuresSuppAnnuel}h
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-purple-500 bg-card shadow-md col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-purple-50 dark:from-purple-900/20 to-transparent rounded-bl-full" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Montant H. Supp</p>
                <p className={`text-xl font-bold mt-1 ${montantHeuresSupp > 0 ? 'text-purple-600' : ''}`}>
                  {montantHeuresSupp.toLocaleString()} F
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="border-0 shadow-md">
        <CardHeader className="border-b py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Détail des modules</CardTitle>
                <CardDescription>{enseignant.emplois.length} emploi(s) du temps</CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <select
                value={selectedSemestre}
                onChange={(e) => setSelectedSemestre(e.target.value as 'S1' | 'S2')}
                className="px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="S1">Semestre 1</option>
                <option value="S2">Semestre 2</option>
              </select>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as 'all' | 'CM' | 'TD' | 'TP')}
                className="px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Tous types</option>
                <option value="CM">CM</option>
                <option value="TD">TD</option>
                <option value="TP">TP</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile Cards */}
          <div className="block sm:hidden divide-y">
            {enseignant.emplois
              .filter(emploi => emploi.module.semestre === selectedSemestre)
              .filter(emploi => selectedType === 'all' || emploi.module.type === selectedType)
              .map((emploi) => (
                <div key={emploi.id} className="p-4 hover:bg-muted/50">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{emploi.module.nom}</p>
                      <p className="text-sm text-muted-foreground">
                        {emploi.module.filiere?.nom || 'UE Commune'}
                      </p>
                    </div>
                    <Badge className={getTypeBadgeColor(emploi.module.type)}>
                      {emploi.module.type}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {format(new Date(emploi.dateDebut), 'dd/MM', { locale: fr })} - {format(new Date(emploi.dateFin), 'dd/MM/yyyy', { locale: fr })}
                    </span>
                    <span className="font-semibold text-indigo-600">{emploi.vh}h</span>
                  </div>
                </div>
              ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Module</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Filière</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Période</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {enseignant.emplois
                  .filter(emploi => emploi.module.semestre === selectedSemestre)
                  .filter(emploi => selectedType === 'all' || emploi.module.type === selectedType)
                  .map((emploi) => (
                    <tr key={emploi.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">{emploi.module.nom}</p>
                            <Badge variant="outline" className={`text-xs ${getTypeBadgeColor(emploi.module.type)}`}>
                              {emploi.module.type}
                            </Badge>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {emploi.module.filiere?.nom || (
                          <Badge variant="secondary" className="text-xs">UE Commune</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {format(new Date(emploi.dateDebut), 'dd MMMM', { locale: fr })} - {format(new Date(emploi.dateFin), 'dd MMMM yyyy', { locale: fr })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">{emploi.vh}h</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot className="bg-muted/30 border-t-2">
                <tr>
                  <td colSpan={3} className="px-6 py-3 text-sm font-medium">
                    Total {selectedSemestre}
                  </td>
                  <td className="px-6 py-3 text-right font-bold text-indigo-600 dark:text-indigo-400">
                    {calculateTotalHours(enseignant.emplois)}h
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {enseignant.emplois
            .filter(emploi => emploi.module.semestre === selectedSemestre)
            .filter(emploi => selectedType === 'all' || emploi.module.type === selectedType)
            .length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Aucun module pour ce semestre</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
