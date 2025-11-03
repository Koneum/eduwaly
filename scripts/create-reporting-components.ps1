# Script de création des composants React pour le Reporting

Write-Host "🎨 Création des composants React..." -ForegroundColor Cyan

$root = "d:\react\UE-GI app\schooly"
$created = 0

# Composant 1: ReportCardGenerator
$reportCardComp = "$root\components\reports\ReportCardGenerator.tsx"
@"
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, Loader2 } from 'lucide-react';
import { generateReportCardPDF, downloadPDF } from '@/lib/pdf-utils';
import { toast } from 'sonner';

interface Props {
  students: { id: string; name: string; enrollmentId: string }[];
  academicYear: string;
}

export function ReportCardGenerator({ students, academicYear }: Props) {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [semester, setSemester] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!selectedStudent || !semester) {
      toast.error('Veuillez sélectionner un étudiant et un semestre');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/reports/report-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: selectedStudent, semester, academicYear }),
      });

      if (!response.ok) throw new Error('Erreur génération');

      const reportCard = await response.json();
      const pdfBlob = await generateReportCardPDF(reportCard);
      const student = students.find(s => s.id === selectedStudent);
      downloadPDF(pdfBlob, ``bulletin-``${student?.enrollmentId}-``${semester}.pdf``);
      
      toast.success('Bulletin généré avec succès');
    } catch (error) {
      toast.error('Erreur lors de la génération du bulletin');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Bulletin de Notes
        </CardTitle>
        <CardDescription>Générer un bulletin de notes PDF pour un étudiant</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Étudiant</label>
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un étudiant" />
            </SelectTrigger>
            <SelectContent>
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.name} ({student.enrollmentId})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Semestre</label>
          <Select value={semester} onValueChange={setSemester}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un semestre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="S1">Semestre 1</SelectItem>
              <SelectItem value="S2">Semestre 2</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleGenerate} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Générer le Bulletin PDF
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
"@ | Out-File -FilePath $reportCardComp -Encoding UTF8
$created++
Write-Host "  ✅ ReportCardGenerator.tsx" -ForegroundColor Green

# Composant 2: CertificateGenerator
$certificateComp = "$root\components\reports\CertificateGenerator.tsx"
@"
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Download, Loader2 } from 'lucide-react';
import { generateCertificatePDF, downloadPDF } from '@/lib/pdf-utils';
import { toast } from 'sonner';

interface Props {
  students: { id: string; name: string; enrollmentId: string }[];
  academicYear: string;
}

export function CertificateGenerator({ students, academicYear }: Props) {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!selectedStudent || !purpose) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/reports/certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: selectedStudent, purpose, academicYear }),
      });

      if (!response.ok) throw new Error('Erreur génération');

      const certificate = await response.json();
      const pdfBlob = await generateCertificatePDF(certificate);
      const student = students.find(s => s.id === selectedStudent);
      downloadPDF(pdfBlob, ``certificat-``${student?.enrollmentId}.pdf``);
      
      toast.success('Certificat généré avec succès');
      setPurpose('');
    } catch (error) {
      toast.error('Erreur lors de la génération du certificat');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Certificat de Scolarité
        </CardTitle>
        <CardDescription>Générer un certificat de scolarité PDF</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Étudiant</label>
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un étudiant" />
            </SelectTrigger>
            <SelectContent>
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.name} ({student.enrollmentId})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Objet du certificat</label>
          <Input
            placeholder="Ex: demande de bourse, stage, etc."
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          />
        </div>

        <Button onClick={handleGenerate} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Générer le Certificat PDF
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
"@ | Out-File -FilePath $certificateComp -Encoding UTF8
$created++
Write-Host "  ✅ CertificateGenerator.tsx" -ForegroundColor Green

# Composant 3: AdvancedReportsManager
$advancedComp = "$root\components\reports\AdvancedReportsManager.tsx"
@"
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  filieres: { id: string; nom: string }[];
}

export function AdvancedReportsManager({ filieres }: Props) {
  const [reportType, setReportType] = useState('');
  const [filiere, setFiliere] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!reportType) {
      toast.error('Veuillez sélectionner un type de rapport');
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      
      const response = await fetch('/api/reports/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
          period: { start: startOfYear, end: now },
          filters: { filiere: filiere || undefined },
        }),
      });

      if (!response.ok) throw new Error('Erreur génération');

      const report = await response.json();
      
      // Télécharger en JSON pour l'instant
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = ``rapport-``${reportType}-``${Date.now()}.json``;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Rapport généré avec succès');
    } catch (error) {
      toast.error('Erreur lors de la génération du rapport');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Rapports Statistiques Avancés
        </CardTitle>
        <CardDescription>Générer des rapports détaillés avec statistiques</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Type de rapport</label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="academic">Rapport Académique</SelectItem>
              <SelectItem value="financial">Rapport Financier</SelectItem>
              <SelectItem value="attendance">Rapport de Présence</SelectItem>
              <SelectItem value="performance">Rapport de Performance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Filière (optionnel)</label>
          <Select value={filiere} onValueChange={setFiliere}>
            <SelectTrigger>
              <SelectValue placeholder="Toutes les filières" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Toutes</SelectItem>
              {filieres.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleGenerate} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Générer le Rapport
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
"@ | Out-File -FilePath $advancedComp -Encoding UTF8
$created++
Write-Host "  ✅ AdvancedReportsManager.tsx" -ForegroundColor Green

Write-Host ""
Write-Host "✅ $created composants créés avec succès!" -ForegroundColor Green
