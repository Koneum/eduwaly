/**
 * Script d'analyse complète de l'application Schooly
 * Identifie les mocks, les fonctions à implémenter, et les logiques manquantes
 */

import fs from 'fs'
import path from 'path'

interface AnalysisResult {
  totalFiles: number
  pagesAnalyzed: number
  apisAnalyzed: number
  componentsAnalyzed: number
  mocks: MockInfo[]
  missingLogic: MissingLogicInfo[]
  todoComments: TodoInfo[]
  emptyFunctions: EmptyFunctionInfo[]
}

interface MockInfo {
  file: string
  line: number
  context: string
  type: 'mock_data' | 'mock_api' | 'placeholder'
}

interface MissingLogicInfo {
  file: string
  line: number
  context: string
  reason: string
}

interface TodoInfo {
  file: string
  line: number
  comment: string
}

interface EmptyFunctionInfo {
  file: string
  line: number
  functionName: string
}

// Patterns de détection
const PATTERNS = {
  mock: [
    /const\s+\w+\s*=\s*\[\s*\]/,  // const data = []
    /mockData/gi,
    /\btodo\b.*implement/gi,
    /placeholder/gi,
    /fake.*data/gi,
    /sample.*data/gi,
  ],
  todo: [
    /\/\/\s*TODO:/gi,
    /\/\/\s*FIXME:/gi,
    /\/\/\s*@TODO/gi,
    /\/\*\s*TODO:/gi,
  ],
  emptyFunction: [
    /function\s+(\w+)\s*\([^)]*\)\s*\{\s*\}/,
    /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*\{\s*\}/,
  ],
  missingLogic: [
    /throw new Error\(['"]Not implemented['"]\)/gi,
    /console\.(log|warn)\(['"]not.*implemented/gi,
    /\breturn\s+null\b/gi,  // return null dans contexte suspect
  ]
}

async function analyzeFile(filePath: string): Promise<Partial<AnalysisResult>> {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  
  const result: Partial<AnalysisResult> = {
    mocks: [],
    missingLogic: [],
    todoComments: [],
    emptyFunctions: []
  }

  lines.forEach((line, index) => {
    const lineNumber = index + 1
    
    // Détection de mocks
    PATTERNS.mock.forEach(pattern => {
      if (pattern.test(line)) {
        result.mocks!.push({
          file: filePath,
          line: lineNumber,
          context: line.trim(),
          type: 'mock_data'
        })
      }
    })

    // Détection de TODOs
    PATTERNS.todo.forEach(pattern => {
      if (pattern.test(line)) {
        result.todoComments!.push({
          file: filePath,
          line: lineNumber,
          comment: line.trim()
        })
      }
    })

    // Détection de logique manquante
    PATTERNS.missingLogic.forEach(pattern => {
      if (pattern.test(line)) {
        result.missingLogic!.push({
          file: filePath,
          line: lineNumber,
          context: line.trim(),
          reason: 'Not implemented or placeholder'
        })
      }
    })
  })

  return result
}

async function analyzeDirectory(dirPath: string, results: AnalysisResult) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)

    if (entry.isDirectory()) {
      // Skip node_modules, .next, etc.
      if (!['node_modules', '.next', 'dist', '.git'].includes(entry.name)) {
        await analyzeDirectory(fullPath, results)
      }
    } else if (entry.isFile()) {
      // Analyser seulement les fichiers TypeScript/React
      if (/\.(tsx?|jsx?)$/.test(entry.name)) {
        results.totalFiles++
        
        const fileAnalysis = await analyzeFile(fullPath)
        
        if (fullPath.includes('/app/') && fullPath.includes('/page.tsx')) {
          results.pagesAnalyzed++
        } else if (fullPath.includes('/api/') && fullPath.includes('/route.ts')) {
          results.apisAnalyzed++
        } else if (fullPath.includes('/components/')) {
          results.componentsAnalyzed++
        }

        results.mocks.push(...(fileAnalysis.mocks || []))
        results.missingLogic.push(...(fileAnalysis.missingLogic || []))
        results.todoComments.push(...(fileAnalysis.todoComments || []))
        results.emptyFunctions.push(...(fileAnalysis.emptyFunctions || []))
      }
    }
  }
}

async function main() {
  console.log('🔍 Analyse de l\'application Schooly...\n')

  const results: AnalysisResult = {
    totalFiles: 0,
    pagesAnalyzed: 0,
    apisAnalyzed: 0,
    componentsAnalyzed: 0,
    mocks: [],
    missingLogic: [],
    todoComments: [],
    emptyFunctions: []
  }

  // Analyser le dossier app
  await analyzeDirectory(path.join(process.cwd(), 'app'), results)
  
  // Analyser le dossier components
  if (fs.existsSync(path.join(process.cwd(), 'components'))) {
    await analyzeDirectory(path.join(process.cwd(), 'components'), results)
  }

  // Générer le rapport
  console.log('📊 RÉSULTATS DE L\'ANALYSE\n')
  console.log('=' .repeat(60))
  console.log(`Fichiers analysés: ${results.totalFiles}`)
  console.log(`Pages: ${results.pagesAnalyzed}`)
  console.log(`APIs: ${results.apisAnalyzed}`)
  console.log(`Composants: ${results.componentsAnalyzed}`)
  console.log('=' .repeat(60))
  console.log()

  console.log('🎭 MOCKS DÉTECTÉS:', results.mocks.length)
  results.mocks.slice(0, 20).forEach(mock => {
    console.log(`  📍 ${mock.file}:${mock.line}`)
    console.log(`     ${mock.context.substring(0, 80)}...`)
  })
  console.log()

  console.log('❌ LOGIQUE MANQUANTE:', results.missingLogic.length)
  results.missingLogic.slice(0, 20).forEach(missing => {
    console.log(`  📍 ${missing.file}:${missing.line}`)
    console.log(`     ${missing.context}`)
  })
  console.log()

  console.log('📝 COMMENTAIRES TODO:', results.todoComments.length)
  results.todoComments.slice(0, 20).forEach(todo => {
    console.log(`  📍 ${todo.file}:${todo.line}`)
    console.log(`     ${todo.comment}`)
  })
  console.log()

  // Sauvegarder le rapport complet
  const report = JSON.stringify(results, null, 2)
  fs.writeFileSync('ANALYSIS_REPORT.json', report)
  console.log('✅ Rapport complet sauvegardé dans ANALYSIS_REPORT.json')
}

main().catch(console.error)
