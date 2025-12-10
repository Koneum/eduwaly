import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./card";
import { Button } from "./button";
import { Phone, Mail } from "lucide-react";

interface TeacherCardProps {
  enseignant: {
    id: string;
    nom: string;
    prenom: string;
    titre: string;
    telephone: string;
    email: string;
    type: string;
    grade: string;
  };
  onEdit: () => void;
  onDelete: () => void;
}

export const TeacherCard = ({ enseignant, onEdit, onDelete }: TeacherCardProps) => {
  return (
    <Card className="bg-card shadow-md rounded-lg overflow-hidden border border-border hover:border-primary/10 hover:shadow-lg transition-all duration-200">
      {/* En-tête avec nom et type */}
      <CardHeader>
        <div className="flex items-start justify-between mb-3">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">
              {enseignant.titre} {enseignant.nom} {enseignant.prenom}
            </CardTitle>
            <CardDescription>{enseignant.grade}</CardDescription>
          </div>
          <div className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
            {enseignant.type}
          </div>
        </div>
      </CardHeader>

      {/* Informations de contact */}
      <CardContent>
        <div className="grid grid-cols-1 gap-2 mt-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            {enseignant.telephone || "Non renseigné"}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            {enseignant.email || "Non renseigné"}
          </div>
        </div>
      </CardContent>

      {/* Actions */}
      <CardFooter className="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" size="sm" onClick={onEdit}>
          Modifier
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          Supprimer
        </Button>
      </CardFooter>
    </Card>
  );
};
