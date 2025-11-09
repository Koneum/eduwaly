/**
 * Script de migration automatique vers ResponsiveTable
 * 
 * Ce script convertit automatiquement les composants Table classiques
 * vers ResponsiveTable pour rendre l'application mobile-friendly
 * 
 * Usage: node scripts/migrate-to-responsive.js
 */

const fs = require('fs')
const path = require('path')

// Liste des fichiers à migrer (20+ composants identifiés)
const FILES_TO_MIGRATE = [
  // School Admin
  'components/school-admin/users-manager.tsx',
  'components/school-admin/students-manager.tsx',
  'components/school-admin/finance-manager.tsx',
  'components/school-admin/fee-structures-manager.tsx',
  'components/school-admin/staff-manager.tsx',
  'components/school-admin/rooms-manager.tsx',
  'components/school-admin/scholarships-manager.tsx',
  
  // Super Admin
  'components/super-admin/schools-manager.tsx',
  'components/super-admin/subscriptions-manager.tsx',
  'components/super-admin/issues-manager.tsx',
  
  // Teacher
  'components/teacher/attendance-manager.tsx',
  'components/teacher/homework-manager.tsx',
  'components/teacher/grades-manager.tsx',
  
  // Pages
  'app/student/[schoolId]/grades/page.tsx',
  'app/student/[schoolId]/absences/page.tsx',
  'app/student/[schoolId]/homework/page.tsx',
  'app/student/[schoolId]/payments/page.tsx',
  'app/parent/[schoolId]/tracking/page.tsx',
  'app/parent/[schoolId]/payments/page.tsx',
]

/**
 * Ajouter l'import ResponsiveTable si absent
 */
function addResponsiveTableImport(content) {
  if (content.includes('import { ResponsiveTable')) {
    return content
  }

  // Trouver les imports existants
  const importRegex = /import.*from ['"]@\/components\/ui\/table['"]/
  if (importRegex.test(content)) {
    // Remplacer l'import Table par ResponsiveTable
    content = content.replace(
      importRegex,
      `import { ResponsiveTable } from "@/components/ui/responsive-table"`
    )
  } else {
    // Ajouter après le dernier import
    const lastImportIndex = content.lastIndexOf('import ')
    if (lastImportIndex !== -1) {
      const endOfLineIndex = content.indexOf('\n', lastImportIndex)
      content = content.slice(0, endOfLineIndex + 1) +
        `import { ResponsiveTable } from "@/components/ui/responsive-table"\n` +
        content.slice(endOfLineIndex + 1)
    }
  }

  return content
}

/**
 * Créer un backup du fichier
 */
function createBackup(filePath) {
  const backupPath = filePath + '.backup'
  fs.copyFileSync(filePath, backupPath)
  console.log(`✅ Backup créé: ${backupPath}`)
}

/**
 * Analyser et migrer un fichier
 */
function migrateFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath)
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Fichier non trouvé: ${filePath}`)
    return { success: false, reason: 'not_found' }
  }

  let content = fs.readFileSync(fullPath, 'utf-8')

  // Créer un backup avant modification
  createBackup(fullPath)

  // Vérifier si le fichier contient une Table
  if (!content.includes('<Table>') && !content.includes('<TableHeader>')) {
    console.log(`ℹ️  Pas de Table trouvée dans: ${filePath}`)
    return { success: false, reason: 'no_table' }
  }

  // Ajouter l'import
  content = addResponsiveTableImport(content)

  // Note: La conversion manuelle Table → ResponsiveTable nécessite
  // une analyse contextuelle plus poussée. Ce script crée les backups
  // et prépare les imports. La conversion finale sera faite avec assistance.

  console.log(`📝 Préparé pour migration: ${filePath}`)
  console.log(`   → Import ResponsiveTable ajouté`)
  console.log(`   → Backup créé`)
  console.log(`   → Conversion manuelle requise`)

  // Sauvegarder avec le nouvel import
  fs.writeFileSync(fullPath, content, 'utf-8')

  return { success: true, prepared: true }
}

/**
 * Migration principale
 */
function main() {
  console.log('🚀 Migration vers ResponsiveTable\n')
  console.log(`${FILES_TO_MIGRATE.length} fichiers à migrer\n`)

  const results = {
    success: 0,
    notFound: 0,
    noTable: 0,
    errors: 0,
  }

  FILES_TO_MIGRATE.forEach((file, index) => {
    console.log(`\n[${index + 1}/${FILES_TO_MIGRATE.length}] ${file}`)
    
    try {
      const result = migrateFile(file)
      
      if (result.success) {
        results.success++
      } else if (result.reason === 'not_found') {
        results.notFound++
      } else if (result.reason === 'no_table') {
        results.noTable++
      }
    } catch (error) {
      console.error(`❌ Erreur:`, error.message)
      results.errors++
    }
  })

  // Résumé
  console.log('\n\n📊 RÉSUMÉ')
  console.log('=' .repeat(50))
  console.log(`✅ Préparés:      ${results.success}`)
  console.log(`ℹ️  Pas de table:  ${results.noTable}`)
  console.log(`⚠️  Non trouvés:   ${results.notFound}`)
  console.log(`❌ Erreurs:       ${results.errors}`)
  console.log('=' .repeat(50))

  console.log('\n📝 ÉTAPES SUIVANTES:')
  console.log('1. Vérifier les backups créés (*.backup)')
  console.log('2. Convertir manuellement les Tables → ResponsiveTable')
  console.log('3. Tester chaque composant sur mobile')
  console.log('4. Supprimer les backups une fois validé')

  console.log('\n💡 TEMPLATE DE CONVERSION:')
  console.log(`
<ResponsiveTable
  data={items}
  columns={[
    { header: "Colonne", accessor: "field", priority: "high" },
  ]}
  keyExtractor={(item) => item.id}
  actions={(item) => <Button>Action</Button>}
/>
  `)
}

// Exécution
main()
