import { redirect } from 'next/navigation'

/**
 * Legacy route — modules are now part of the Household settings tab.
 */
export default function ModulesSettingsPage() {
  redirect('/settings/household')
}
