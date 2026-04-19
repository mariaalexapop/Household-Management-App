import { redirect } from 'next/navigation'

/**
 * Legacy route — redirects to /settings/household.
 */
export default function HouseholdPage() {
  redirect('/settings/household')
}
