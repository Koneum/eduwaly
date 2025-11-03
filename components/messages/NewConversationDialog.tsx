'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string | null;
}

interface NewConversationDialogProps {
  schoolId: string;
  onConversationCreated: (conversationId: string) => void;
}

const roleLabels: Record<string, string> = {
  SCHOOL_ADMIN: 'Admin',
  TEACHER: 'Enseignant',
  STUDENT: 'Étudiant',
  PARENT: 'Parent',
};

const roleBadgeColors: Record<string, string> = {
  SCHOOL_ADMIN: 'bg-purple-500',
  TEACHER: 'bg-blue-500',
  STUDENT: 'bg-green-500',
  PARENT: 'bg-orange-500',
};

export function NewConversationDialog({ schoolId, onConversationCreated }: NewConversationDialogProps) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open) {
      loadAvailableUsers();
    }
  }, [open]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const loadAvailableUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/messages/available-users?schoolId=${schoolId}`);
      if (!response.ok) throw new Error('Erreur chargement');
      
      const data = await response.json();
      setUsers(data.users || []);
      setFilteredUsers(data.users || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des utilisateurs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Veuillez sélectionner au moins un destinataire');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantIds: selectedUsers,
          subject: subject.trim() || undefined,
          type: selectedUsers.length === 1 ? 'DIRECT' : 'GROUP',
        }),
      });

      if (!response.ok) throw new Error('Erreur création');

      const conversation = await response.json();
      toast.success('Conversation créée');
      onConversationCreated(conversation.id);
      setOpen(false);
      setSelectedUsers([]);
      setSubject('');
      setSearchQuery('');
    } catch (error) {
      toast.error('Erreur lors de la création de la conversation');
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle conversation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Nouvelle conversation</DialogTitle>
          <DialogDescription>
            Sélectionnez les personnes avec qui vous souhaitez discuter
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {selectedUsers.length > 1 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Sujet (optionnel)</label>
              <Input
                placeholder="Ex: Réunion parents-professeurs"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Destinataires ({selectedUsers.length} sélectionné{selectedUsers.length > 1 ? 's' : ''})
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <ScrollArea className="h-[300px] border rounded-md">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Aucun utilisateur trouvé
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => toggleUserSelection(user.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      selectedUsers.includes(user.id)
                        ? 'bg-primary/10 border-2 border-primary'
                        : 'hover:bg-accent border-2 border-transparent'
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.image || undefined} />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge className={roleBadgeColors[user.role] || 'bg-gray-500'}>
                      {roleLabels[user.role] || user.role}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={creating}>
            Annuler
          </Button>
          <Button onClick={handleCreateConversation} disabled={creating || selectedUsers.length === 0}>
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              'Créer la conversation'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
