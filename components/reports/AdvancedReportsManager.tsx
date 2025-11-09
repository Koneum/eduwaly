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
          filters: { filiere: filiere && filiere !== 'all' ? filiere : undefined },
        }),
      });

      if (!response.ok) throw new Error('Erreur génération');

      const report = await response.json();
      
      // Télécharger en JSON pour l'instant
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rapport-${reportType}-${Date.now()}.json`;
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
        <CardTitle className="flex items-center gap-2 text-responsive-lg">
          <BarChart3 className="h-5 w-5 text-primary" />
          Rapports Statistiques Avancés
        </CardTitle>
        <CardDescription className="text-responsive-sm">Générer des rapports détaillés avec statistiques</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        <div>
          <label className="text-responsive-sm font-medium mb-2 block">Type de rapport</label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="text-responsive-sm">
              <SelectValue placeholder="Sélectionner un type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="academic" className="text-responsive-sm">Rapport Académique</SelectItem>
              <SelectItem value="financial" className="text-responsive-sm">Rapport Financier</SelectItem>
              <SelectItem value="attendance" className="text-responsive-sm">Rapport de Présence</SelectItem>
              <SelectItem value="performance" className="text-responsive-sm">Rapport de Performance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-responsive-sm font-medium mb-2 block">Filière (optionnel)</label>
          <Select value={filiere} onValueChange={setFiliere}>
            <SelectTrigger className="text-responsive-sm">
              <SelectValue placeholder="Toutes les filières" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-responsive-sm">Toutes les filières</SelectItem>
              {filieres.map((f) => (
                <SelectItem key={f.id} value={f.id} className="text-responsive-sm">
                  {f.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleGenerate} disabled={loading} className="w-full text-responsive-sm">
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
