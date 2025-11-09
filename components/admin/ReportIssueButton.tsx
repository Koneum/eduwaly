'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function ReportIssueButton() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!type || !message.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/report-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message }),
      });

      if (!response.ok) throw new Error('Erreur envoi');

      toast.success('Votre signalement a été envoyé au Super Admin');
      setOpen(false);
      setType('');
      setMessage('');
    } catch (error) {
      toast.error('Erreur lors de l\'envoi du signalement');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 text-responsive-sm">
          <AlertTriangle className="h-4 w-4" />
          Signaler un problème
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-responsive-lg">Signaler au Super Admin</DialogTitle>
          <DialogDescription className="text-responsive-sm">
            Signalez un problème technique ou faites une suggestion d&apos;amélioration
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 sm:space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-responsive-sm font-medium">Type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="text-responsive-sm">
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug" className="text-responsive-sm">🐛 Bug / Problème technique</SelectItem>
                <SelectItem value="suggestion" className="text-responsive-sm">💡 Suggestion d&apos;amélioration</SelectItem>
                <SelectItem value="question" className="text-responsive-sm">❓ Question / Support</SelectItem>
                <SelectItem value="other" className="text-responsive-sm">📝 Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-responsive-sm font-medium">Message</label>
            <Textarea
              placeholder="Décrivez votre problème ou suggestion en détail..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="resize-none text-responsive-sm"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading} className="w-full sm:w-auto text-responsive-sm">
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="w-full sm:w-auto text-responsive-sm">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi...
              </>
            ) : (
              'Envoyer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
