// Configuration des modules Schooly et leurs chemins
// Structure similaire à tinygest avec modules et sous-modules

import { 
  GraduationCap, Calendar, FileText, MessageSquare, BarChart3, 
  Users, CreditCard, Bell, BookOpen, ClipboardList, Shield, Settings,
  Building2, UserCog
} from "lucide-react"

// Structure complète des modules avec leurs sous-modules (comme tinygest)
export const MODULE_STRUCTURE = {
  etudiants: {
    label: "Étudiants",
    icon: GraduationCap,
    description: "Gestion des étudiants et inscriptions",
    children: {
      liste: { label: "Liste étudiants", path: "/admin/[schoolId]/students" },
      inscriptions: { label: "Inscriptions", path: "/admin/[schoolId]/enrollments" },
      filieres: { label: "Filières", path: "/admin/[schoolId]/filieres" },
      groupes: { label: "Groupes de travail", path: "/admin/[schoolId]/workgroups" },
    }
  },
  enseignants: {
    label: "Enseignants",
    icon: Users,
    description: "Gestion du personnel enseignant",
    children: {
      liste: { label: "Liste enseignants", path: "/admin/[schoolId]/teachers" },
      emplois: { label: "Emplois assignés", path: "/admin/[schoolId]/teachers/schedule" },
    }
  },
  emploiDuTemps: {
    label: "Emploi du temps",
    icon: Calendar,
    description: "Planning des cours et salles",
    children: {
      planning: { label: "Planning", path: "/admin/[schoolId]/schedule" },
      salles: { label: "Salles/Classes", path: "/admin/[schoolId]/rooms" },
      annees: { label: "Années universitaires", path: "/admin/[schoolId]/academic-years" },
    }
  },
  notes: {
    label: "Notes & Évaluations",
    icon: ClipboardList,
    description: "Saisie et gestion des notes",
    children: {
      saisie: { label: "Saisie notes", path: "/admin/[schoolId]/grades" },
      evaluations: { label: "Évaluations", path: "/admin/[schoolId]/evaluations" },
      bulletins: { label: "Bulletins", path: "/admin/[schoolId]/bulletins" },
      periodes: { label: "Périodes de notation", path: "/admin/[schoolId]/grading-periods" },
    }
  },
  vieScolaire: {
    label: "Vie scolaire",
    icon: Bell,
    description: "Absences, retards et incidents",
    children: {
      absences: { label: "Absences", path: "/admin/[schoolId]/attendance" },
      incidents: { label: "Incidents", path: "/admin/[schoolId]/incidents" },
      agenda: { label: "Agenda/Événements", path: "/admin/[schoolId]/calendar" },
      rdv: { label: "Rendez-vous parents", path: "/admin/[schoolId]/appointments" },
    }
  },
  devoirs: {
    label: "Devoirs",
    icon: BookOpen,
    description: "Devoirs et travaux à rendre",
    children: {
      liste: { label: "Liste devoirs", path: "/admin/[schoolId]/homework" },
      soumissions: { label: "Soumissions", path: "/admin/[schoolId]/submissions" },
    }
  },
  documents: {
    label: "Documents",
    icon: FileText,
    description: "Ressources pédagogiques et certificats",
    children: {
      ressources: { label: "Ressources", path: "/admin/[schoolId]/documents" },
      templates: { label: "Templates PDF", path: "/admin/[schoolId]/templates" },
    }
  },
  messagerie: {
    label: "Messagerie",
    icon: MessageSquare,
    description: "Communication interne",
    children: {
      annonces: { label: "Annonces", path: "/admin/[schoolId]/announcements" },
      sondages: { label: "Sondages", path: "/admin/[schoolId]/polls" },
    }
  },
  facturation: {
    label: "Facturation",
    icon: CreditCard,
    description: "Paiements et frais de scolarité",
    children: {
      paiements: { label: "Paiements étudiants", path: "/admin/[schoolId]/payments" },
      frais: { label: "Frais de scolarité", path: "/admin/[schoolId]/fees" },
      bourses: { label: "Bourses/Réductions", path: "/admin/[schoolId]/scholarships" },
    }
  },
  rapports: {
    label: "Rapports",
    icon: BarChart3,
    description: "Statistiques et analyses",
    children: {
      statistiques: { label: "Statistiques", path: "/admin/[schoolId]/reports" },
      export: { label: "Export données", path: "/admin/[schoolId]/export" },
    }
  },
}

// Fonctionnalités premium / avancées
export const PREMIUM_FEATURES = {
  rolesPerso: { 
    label: "Rôles personnalisés", 
    icon: UserCog, 
    description: "Créer des rôles avec permissions spécifiques" 
  },
  multiEtablissement: { 
    label: "Multi-établissement", 
    icon: Building2, 
    description: "Gérer plusieurs établissements" 
  },
  apiAccess: { 
    label: "Accès API", 
    icon: Settings, 
    description: "API pour intégrations externes" 
  },
  supportPrioritaire: { 
    label: "Support prioritaire", 
    icon: Shield, 
    description: "Support technique prioritaire 24/7" 
  },
}

// Ancien format pour compatibilité
export const MODULE_CONFIG = MODULE_STRUCTURE

// Types
export type ModuleKey = keyof typeof MODULE_CONFIG

// Mapping des chemins vers les modules
export const PATH_TO_MODULE: Record<string, ModuleKey> = {}

// Construire le mapping automatiquement depuis children
Object.entries(MODULE_CONFIG).forEach(([moduleKey, config]) => {
  Object.values(config.children).forEach((child) => {
    PATH_TO_MODULE[child.path] = moduleKey as ModuleKey
  })
})

// Vérifier si un chemin est accessible pour l'école
export function isPathAccessible(
  pathname: string, 
  enabledModules: string[],
  modulesOverride?: Record<string, boolean> | null
): boolean {
  // Le dashboard et les settings sont toujours accessibles
  if (pathname.match(/^\/admin\/[^/]+$/) || pathname.includes('/settings') || pathname.includes('/subscription')) {
    return true
  }

  // Trouver le module correspondant au chemin
  let moduleKey: ModuleKey | undefined

  for (const [path, key] of Object.entries(PATH_TO_MODULE)) {
    // Créer une regex à partir du path
    const regex = new RegExp(`^${path.replace(/\[schoolId\]/g, '[^/]+')}`)
    if (regex.test(pathname)) {
      moduleKey = key
      break
    }
  }

  if (!moduleKey) {
    return true // Si pas de module défini, autoriser l'accès
  }

  // Vérifier les overrides du super admin
  if (modulesOverride) {
    if (modulesOverride[moduleKey] === false) {
      return false // Explicitement désactivé par super admin
    }
    if (modulesOverride[moduleKey] === true) {
      return true // Explicitement activé par super admin
    }
  }

  return enabledModules.includes(moduleKey)
}

// Récupérer les modules activés depuis le plan
export function getEnabledModulesFromPlan(modulesIncluded: string | string[] | null): string[] {
  if (!modulesIncluded) {
    // Par défaut, tous les modules sont activés (trial/starter)
    return Object.keys(MODULE_CONFIG)
  }

  if (typeof modulesIncluded === 'string') {
    try {
      const parsed = JSON.parse(modulesIncluded)
      return Array.isArray(parsed) ? parsed : Object.keys(MODULE_CONFIG)
    } catch {
      return Object.keys(MODULE_CONFIG)
    }
  }

  return modulesIncluded
}

// Appliquer les overrides du super admin
export function applyModulesOverride(
  baseModules: string[],
  modulesOverride: string | Record<string, boolean> | null
): string[] {
  if (!modulesOverride) {
    return baseModules
  }

  let overrides: Record<string, boolean>
  
  if (typeof modulesOverride === 'string') {
    try {
      overrides = JSON.parse(modulesOverride)
    } catch {
      return baseModules
    }
  } else {
    overrides = modulesOverride
  }

  // Filtrer les modules désactivés et ajouter les activés
  const result = baseModules.filter(m => overrides[m] !== false)
  
  Object.entries(overrides).forEach(([module, enabled]) => {
    if (enabled && !result.includes(module)) {
      result.push(module)
    }
  })

  return result
}

// Tous les modules disponibles
export const ALL_MODULES = Object.keys(MODULE_CONFIG) as ModuleKey[]
