# Script PowerShell pour rendre tous les managers responsives
# Remplace les Table classiques par ResponsiveTable

Write-Host "🎨 Migration des Managers vers ResponsiveTable" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

$managersPath = "D:\react\UE-GI app\schooly\components\school-admin"
$superAdminPath = "D:\react\UE-GI app\schooly\components\super-admin"
$teacherPath = "D:\react\UE-GI app\schooly\components\teacher"

$managerFiles = @(
    "$managersPath\users-manager.tsx",
    "$managersPath\students-manager.tsx",
    "$managersPath\finance-manager.tsx",
    "$managersPath\fee-structures-manager.tsx",
    "$managersPath\staff-manager.tsx",
    "$managersPath\rooms-manager.tsx",
    "$managersPath\scholarships-manager.tsx",
    "$superAdminPath\schools-manager.tsx",
    "$superAdminPath\subscriptions-manager.tsx",
    "$superAdminPath\issues-manager.tsx",
    "$teacherPath\attendance-manager.tsx",
    "$teacherPath\homework-manager.tsx",
    "$teacherPath\grades-manager.tsx"
)

$converted = 0

foreach ($file in $managerFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        # Vérifier si déjà converti
        if ($content -match 'ResponsiveTable') {
            Write-Host "✓ $((Split-Path $file -Leaf)) - Déjà responsive" -ForegroundColor Green
            continue
        }
        
        # Vérifier si contient des tables
        if ($content -notmatch '<Table>|<TableHeader>|<TableBody>') {
            Write-Host "⊘ $((Split-Path $file -Leaf)) - Pas de table détectée" -ForegroundColor Yellow
            continue
        }
        
        Write-Host "⏳ Conversion de $((Split-Path $file -Leaf))..." -ForegroundColor Cyan
        
        # Ajouter l'import ResponsiveTable si manquant
        if ($content -notmatch 'ResponsiveTable') {
            $content = $content -replace '(import.*from.*@/components/ui/table.*)', "`$1`nimport { ResponsiveTable } from '@/components/ui/responsive-table'"
        }
        
        # Note: La conversion complète nécessite une analyse manuelle
        # de la structure des données pour créer les columns
        Write-Host "⚠️  Conversion manuelle requise pour $((Split-Path $file -Leaf))" -ForegroundColor Yellow
        Write-Host "   Étapes:" -ForegroundColor DarkGray
        Write-Host "   1. Importer ResponsiveTable" -ForegroundColor DarkGray
        Write-Host "   2. Définir les columns avec accessor et priority" -ForegroundColor DarkGray
        Write-Host "   3. Remplacer <Table> par <ResponsiveTable>" -ForegroundColor DarkGray
        Write-Host "   4. Passer data, columns, keyExtractor, actions" -ForegroundColor DarkGray
        Write-Host ""
        
    } else {
        Write-Host "✗ $file - Fichier non trouvé" -ForegroundColor Red
    }
}

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "📋 TEMPLATE DE CONVERSION ResponsiveTable:" -ForegroundColor Yellow
Write-Host @"

// AVANT (Table classique)
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nom</TableHead>
      <TableHead>Email</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {users.map(user => (
      <TableRow key={user.id}>
        <TableCell>{user.name}</TableCell>
        <TableCell>{user.email}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>

// APRÈS (ResponsiveTable)
<ResponsiveTable
  data={users}
  columns={[
    { 
      header: "Nom", 
      accessor: "name", 
      priority: "high" 
    },
    { 
      header: "Email", 
      accessor: "email", 
      priority: "medium" 
    }
  ]}
  keyExtractor={(user) => user.id}
  actions={(user) => (
    <div className="flex gap-2">
      <Button onClick={() => handleEdit(user)}>
        Modifier
      </Button>
    </div>
  )}
  emptyMessage="Aucun utilisateur"
/>

"@ -ForegroundColor DarkGray

Write-Host "`n✅ Script terminé!" -ForegroundColor Green
Write-Host "📌 Conversion manuelle recommandée pour garantir la qualité" -ForegroundColor Cyan
