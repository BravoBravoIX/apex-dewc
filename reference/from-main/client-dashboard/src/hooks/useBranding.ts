import { useEffect } from 'react'
import { useBrandingStore } from '@/stores/brandingStore'
import { useAuthStore } from '@/stores/authStore'
import { OrganizationBranding } from '@/types'

export function useBranding(branding?: OrganizationBranding | null) {
  const { applyBranding, resetBranding, loadBranding } = useBrandingStore()
  const { organization } = useAuthStore()

  useEffect(() => {
    if (branding) {
      applyBranding(branding)
    } else if (organization?.id) {
      loadBranding(organization.id)
    } else {
      resetBranding()
    }
  }, [branding, organization?.id, applyBranding, resetBranding, loadBranding])
}