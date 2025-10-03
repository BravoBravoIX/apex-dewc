import { create } from 'zustand'
import { OrganizationBranding } from '@/types'

interface BrandingStore {
  branding: OrganizationBranding | null
  isLoaded: boolean
  
  // Actions
  setBranding: (branding: OrganizationBranding | null) => void
  loadBranding: (organizationId: string) => Promise<void>
  applyBranding: (branding: OrganizationBranding) => void
  resetBranding: () => void
}

const defaultBranding: OrganizationBranding = {
  primaryColor: '#3b82f6',
  secondaryColor: '#1e40af',
  accentColor: '#60a5fa',
  fontFamily: 'Inter'
}

export const useBrandingStore = create<BrandingStore>((set, get) => ({
  branding: null,
  isLoaded: false,

  setBranding: (branding: OrganizationBranding | null) => {
    set({ branding, isLoaded: true })
    if (branding) {
      get().applyBranding(branding)
    } else {
      get().resetBranding()
    }
  },

  loadBranding: async (organizationId: string) => {
    try {
      const response = await fetch(`/api/v1/organizations/${organizationId}/branding`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          get().setBranding(data.data)
          return
        }
      }
      
      // Fallback to default branding
      get().setBranding(defaultBranding)
    } catch (error) {
      console.error('Failed to load organization branding:', error)
      get().setBranding(defaultBranding)
    }
  },

  applyBranding: (branding: OrganizationBranding) => {
    const root = document.documentElement
    
    // Apply CSS variables
    root.style.setProperty('--brand-primary', branding.primaryColor)
    root.style.setProperty('--brand-secondary', branding.secondaryColor)
    root.style.setProperty('--brand-accent', branding.accentColor)
    
    // Convert hex to RGB for alpha variations
    const primaryRgb = hexToRgb(branding.primaryColor)
    if (primaryRgb) {
      root.style.setProperty('--brand-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`)
    }
    
    // Apply custom font if specified
    if (branding.fontFamily) {
      root.style.setProperty('--font-family', branding.fontFamily)
      document.body.style.fontFamily = branding.fontFamily
    }
    
    // Update favicon if provided
    if (branding.faviconUrl) {
      updateFavicon(branding.faviconUrl)
    }
    
    // Apply custom CSS if provided
    if (branding.customCss) {
      injectCustomCSS(branding.customCss)
    }
    
    // Update document title with organization branding
    document.title = 'SCIP Client Dashboard'
  },

  resetBranding: () => {
    const root = document.documentElement
    
    // Reset to default values
    root.style.setProperty('--brand-primary', defaultBranding.primaryColor)
    root.style.setProperty('--brand-secondary', defaultBranding.secondaryColor)
    root.style.setProperty('--brand-accent', defaultBranding.accentColor)
    
    // Reset font
    document.body.style.fontFamily = 'Inter, system-ui, sans-serif'
    
    // Remove custom CSS
    removeCustomCSS()
  },
}))

// Utility functions

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

function updateFavicon(faviconUrl: string) {
  const existingFavicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
  if (existingFavicon) {
    existingFavicon.href = faviconUrl
  } else {
    const favicon = document.createElement('link')
    favicon.rel = 'icon'
    favicon.href = faviconUrl
    document.head.appendChild(favicon)
  }
}

function injectCustomCSS(css: string) {
  // Remove existing custom CSS
  removeCustomCSS()
  
  const style = document.createElement('style')
  style.id = 'organization-custom-css'
  style.textContent = css
  document.head.appendChild(style)
}

function removeCustomCSS() {
  const existingStyle = document.getElementById('organization-custom-css')
  if (existingStyle) {
    existingStyle.remove()
  }
}