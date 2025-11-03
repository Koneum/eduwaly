'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Download, Loader2, Send, Users } from 'lucide-react';
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
  const [sending, setSending] = useState(false);

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
      const today = new Date().toISOString().split('T')[0];
      const fileName = `certificat-ENR-${student?.name.replace(/\s+/g, '-')}-${today}.pdf`;
      downloadPDF(pdfBlob, fileName);
      
      toast.success('Certificat généré avec succès');
      setPurpose('');
    } catch (error) {
      toast.error('Erreur lors de la génération du certificat');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTo = async (recipient: 'student' | 'parent' | 'both') => {
    if (!selectedStudent || !purpose) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/reports/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent,
          purpose,
          academicYear,
          reportType: 'certificat',
          recipient,
        }),
      });

      if (!response.ok) throw new Error('Erreur envoi');

      const recipientText = recipient === 'both' ? "à l'étudiant et au parent" : 
                           recipient === 'student' ? "à l'étudiant" : "au parent";
      toast.success(`Certificat envoyé ${recipientText}`);
    } catch (error) {
      toast.error("Erreur lors de l'envoi du certificat");
      console.error(error);
    } finally {
      setSending(false);
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

        <Button onClick={handleGenerate} disabled={loading || sending} className="w-full">
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

        <div className="space-y-2">
          <label className="text-sm font-medium block">Envoyer à</label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSendTo('student')}
              disabled={loading || sending}
              className="w-full"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}
              Étudiant
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSendTo('parent')}
              disabled={loading || sending}
              className="w-full"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}
              Parent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSendTo('both')}
              disabled={loading || sending}
              className="w-full"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="mr-1 h-4 w-4" />}
              Les deux
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
