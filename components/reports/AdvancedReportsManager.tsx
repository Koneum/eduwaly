'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Download, Loader2, FileText, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { generatePDFHeader, generatePDFFooter, type SchoolInfo, type PDFHeaderConfig } from '@/lib/pdf-utils';

interface Props {
  filieres: { id: string; nom: string }[];
  schoolId: string;
}

export function AdvancedReportsManager({ filieres, schoolId }: Props) {
  const [reportType, setReportType] = useState('');
  const [filiere, setFiliere] = useState('');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');
  const [loading, setLoading] = useState(false);
  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [pdfConfig, setPdfConfig] = useState<PDFHeaderConfig | null>(null);

  // Charger les infos école et template PDF
  useEffect(() => {
    const loadSchoolConfig = async () => {
      try {
        const [schoolRes, templateRes] = await Promise.all([
          fetch(`/api/schools/${schoolId}`),
          fetch(`/api/admin/pdf-templates?schoolId=${schoolId}`)
        ]);

        if (schoolRes.ok && templateRes.ok) {
          const schoolData = await schoolRes.json();
          const templateData = await templateRes.json();
          
          setSchool({
            name: schoolData.name,
            logo: schoolData.logo,
            address: schoolData.address,
            phone: schoolData.phone,
            email: schoolData.email,
            stamp: schoolData.stamp
          });
          setPdfConfig(templateData.config);
        }
      } catch (error) {
        console.error('Erreur chargement config:', error);
      }
    };
    loadSchoolConfig();
  }, [schoolId]);

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
      
      // Générer selon le format choisi
      if (exportFormat === 'pdf') {
        generatePDF(report, reportType);
      } else {
        generateExcel(report, reportType);
      }
      
      toast.success(`Rapport ${exportFormat.toUpperCase()} généré avec succès`);
    } catch (error) {
      toast.error('Erreur lors de la génération du rapport');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = (report: any, type: string) => {
    if (!school || !pdfConfig) {
      toast.error('Configuration PDF non chargée');
      return;
    }

    const pdfWindow = window.open('', '_blank');
    if (!pdfWindow) {
      toast.error('Veuillez autoriser les pop-ups');
      return;
    }

    const reportTitle = {
      academic: 'Rapport Académique',
      financial: 'Rapport Financier',
      attendance: 'Rapport de Présence',
      performance: 'Rapport de Performance'
    }[type] || 'Rapport';

    const pdfHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${reportTitle}</title>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              margin: 0;
            }
            .report-title {
              text-align: center;
              margin: 20px 0;
              font-size: 24px;
              font-weight: bold;
              color: ${pdfConfig.headerColor};
            }
            .report-meta {
              text-align: center;
              margin-bottom: 30px;
              color: #666;
              font-size: 14px;
            }
            .stats {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
              margin-bottom: 30px;
            }
            .stat-card {
              padding: 20px;
              border: 1px solid #ddd;
              border-radius: 8px;
              text-align: center;
              background: #f9f9f9;
            }
            .stat-label {
              font-size: 12px;
              color: #666;
              margin-bottom: 8px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .stat-value {
              font-size: 24px;
              font-weight: bold;
              color: #333;
            }
            .section {
              margin: 30px 0;
            }
            .section h2 {
              color: #4F46E5;
              border-bottom: 2px solid #4F46E5;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
            th {
              background-color: #4F46E5;
              color: white;
              font-weight: bold;
            }
            tr:hover {
              background-color: #f5f5f5;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #666;
              font-size: 12px;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            @media print {
              body { padding: 20px; }
              .stats { page-break-inside: avoid; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
            }
          </style>
        </head>
        <body>
          ${generatePDFHeader(school, pdfConfig)}
          
          <div class="report-title">${reportTitle}</div>
          <div class="report-meta">
            <p>Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
            ${report.metadata?.period ? `<p>Période: ${new Date(report.metadata.period.start).toLocaleDateString('fr-FR')} - ${new Date(report.metadata.period.end).toLocaleDateString('fr-FR')}</p>` : ''}
          </div>
          
          ${report.summary ? `
          <div class="stats">
            ${Object.entries(report.summary).map(([key, value]: [string, any]) => `
              <div class="stat-card">
                <div class="stat-label">${key.replace(/_/g, ' ')}</div>
                <div class="stat-value">${typeof value === 'number' ? value.toLocaleString() : value}</div>
              </div>
            `).join('')}
          </div>
          ` : ''}

          ${report.data && Array.isArray(report.data) && report.data.length > 0 ? `
          <div class="section">
            <h2>Données Détaillées</h2>
            <table>
              <thead>
                <tr>
                  ${Object.keys(report.data[0]).map(key => `<th>${key.replace(/_/g, ' ')}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${report.data.map((row: any) => `
                  <tr>
                    ${Object.values(row).map(value => `<td>${value !== null && value !== undefined ? value : '-'}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          ${generatePDFFooter(pdfConfig.footerText, pdfConfig.showSignatures, school.stamp || undefined)}

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    pdfWindow.document.write(pdfHTML);
    pdfWindow.document.close();
  };

  const generateExcel = (report: any, type: string) => {
    const reportTitle = {
      academic: 'Rapport Académique',
      financial: 'Rapport Financier',
      attendance: 'Rapport de Présence',
      performance: 'Rapport de Performance'
    }[type] || 'Rapport';

    let csvContent = `${reportTitle}\n`;
    csvContent += `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}\n\n`;

    // Ajouter le résumé
    if (report.summary) {
      csvContent += 'RÉSUMÉ\n';
      Object.entries(report.summary).forEach(([key, value]) => {
        csvContent += `${key.replace(/_/g, ' ')};${value}\n`;
      });
      csvContent += '\n';
    }

    // Ajouter les données détaillées
    if (report.data && Array.isArray(report.data) && report.data.length > 0) {
      csvContent += 'DONNÉES DÉTAILLÉES\n';
      
      // Headers
      const headers = Object.keys(report.data[0]);
      csvContent += headers.join(';') + '\n';
      
      // Rows
      report.data.forEach((row: any) => {
        const values = headers.map(header => {
          const value = row[header];
          return value !== null && value !== undefined ? String(value) : '-';
        });
        csvContent += values.join(';') + '\n';
      });
    }

    const BOM = '\uFEFF'; // UTF-8 BOM pour Excel
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${type}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
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

        <div>
          <label className="text-responsive-sm font-medium mb-2 block">Format d'export</label>
          <Select value={exportFormat} onValueChange={(value: 'pdf' | 'excel') => setExportFormat(value)}>
            <SelectTrigger className="text-responsive-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf" className="text-responsive-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  PDF (Impression)
                </div>
              </SelectItem>
              <SelectItem value="excel" className="text-responsive-sm">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel (CSV)
                </div>
              </SelectItem>
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
