/**
 * Utilitaires pour le responsive design
 */

// Breakpoints TailwindCSS
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// Media queries courantes
export const mediaQueries = {
  mobile: '(max-width: 768px)',
  tablet: '(min-width: 769px) and (max-width: 1024px)',
  desktop: '(min-width: 1025px)',
  
  // Shortcuts
  sm: `(max-width: ${breakpoints.sm})`,
  md: `(min-width: ${breakpoints.md})`,
  lg: `(min-width: ${breakpoints.lg})`,
  xl: `(min-width: ${breakpoints.xl})`,
  '2xl': `(min-width: ${breakpoints['2xl']})`,
} as const

// Classes Tailwind responsive courantes
export const responsiveClasses = {
  // Containers
  container: {
    mobile: 'px-4',
    tablet: 'px-6',
    desktop: 'px-8',
  },
  
  // Spacing
  spacing: {
    mobile: 'space-y-4',
    tablet: 'space-y-6',
    desktop: 'space-y-8',
  },
  
  // Typography
  heading: {
    mobile: 'text-2xl',
    tablet: 'text-3xl',
    desktop: 'text-4xl',
  },
  
  subheading: {
    mobile: 'text-lg',
    tablet: 'text-xl',
    desktop: 'text-2xl',
  },
  
  body: {
    mobile: 'text-sm',
    tablet: 'text-base',
    desktop: 'text-lg',
  },
} as const

/**
 * Génère des classes Tailwind responsive
 * 
 * @example
 * ```tsx
 * const classes = responsiveClass('px-4', 'md:px-6', 'lg:px-8')
 * // Résultat: 'px-4 md:px-6 lg:px-8'
 * ```
 */
export function responsiveClass(...classes: string[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * Classes pour cacher/montrer selon le breakpoint
 */
export const displayClasses = {
  // Montrer uniquement sur mobile
  mobileOnly: 'block md:hidden',
  
  // Montrer uniquement sur tablet
  tabletOnly: 'hidden md:block lg:hidden',
  
  // Montrer uniquement sur desktop
  desktopOnly: 'hidden lg:block',
  
  // Cacher sur mobile
  hideMobile: 'hidden md:block',
  
  // Cacher sur desktop
  hideDesktop: 'block lg:hidden',
} as const

/**
 * Classes pour les grilles responsive
 */
export const gridClasses = {
  // 1 col mobile, 2 cols tablet, 3 cols desktop
  default: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
  
  // 1 col mobile, 2 cols tablet, 4 cols desktop
  fourCols: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
  
  // 1 col mobile, 3 cols desktop
  threeCols: 'grid grid-cols-1 lg:grid-cols-3 gap-4',
  
  // 1 col mobile, 2 cols desktop
  twoCols: 'grid grid-cols-1 lg:grid-cols-2 gap-4',
} as const

/**
 * Classes pour flex responsive
 */
export const flexClasses = {
  // Stack sur mobile, row sur desktop
  stackToRow: 'flex flex-col lg:flex-row',
  
  // Row sur mobile, stack sur desktop (rare)
  rowToStack: 'flex flex-row lg:flex-col',
  
  // Center sur mobile, space-between sur desktop
  centerToSpaceBetween: 'flex justify-center lg:justify-between',
} as const

/**
 * Classes pour la navigation responsive
 */
export const navClasses = {
  // Navigation desktop (sidebar)
  desktop: 'hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0',
  
  // Navigation mobile (bottom bar ou drawer)
  mobile: 'lg:hidden fixed bottom-0 inset-x-0 bg-background border-t',
  
  // Menu burger button
  burger: 'lg:hidden p-2',
} as const

/**
 * Classes pour les tableaux responsive
 */
export const tableClasses = {
  // Table normale sur desktop, cards sur mobile
  wrapper: 'overflow-x-auto',
  table: 'hidden md:table min-w-full',
  mobileCards: 'md:hidden space-y-4',
} as const

/**
 * Détecte le type d'appareil (pour SSR-safe checks)
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop'
  
  const width = window.innerWidth
  
  if (width < 769) return 'mobile'
  if (width < 1025) return 'tablet'
  return 'desktop'
}

/**
 * Retourne true si on est sur un appareil tactile
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - msMaxTouchPoints exists on some browsers
    navigator.msMaxTouchPoints > 0
  )
}
