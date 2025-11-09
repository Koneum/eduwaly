import { useEffect, useState } from 'react'

/**
 * Hook pour détecter les media queries
 * 
 * @example
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 768px)')
 * const isDesktop = useMediaQuery('(min-width: 1024px)')
 * ```
 */
export function useMediaQuery(query: string): boolean {
  // Lazy initialization to get initial value
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches
    }
    return false
  })

  useEffect(() => {
    const media = window.matchMedia(query)

    // Create event listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Add listener
    media.addEventListener('change', listener)

    // Cleanup
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}

/**
 * Hook pour détecter si on est sur mobile
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 768px)')
}

/**
 * Hook pour détecter si on est sur tablet
 */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 769px) and (max-width: 1024px)')
}

/**
 * Hook pour détecter si on est sur desktop
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1025px)')
}

/**
 * Hook pour obtenir le breakpoint actuel
 */
export function useBreakpoint(): 'mobile' | 'tablet' | 'desktop' {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  
  if (isMobile) return 'mobile'
  if (isTablet) return 'tablet'
  return 'desktop'
}
