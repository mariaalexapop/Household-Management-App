import Link from 'next/link'

export function EmptyModuleState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-kinship-surface-container bg-kinship-surface-container-lowest px-8 py-16 text-center">
      <p className="font-display text-base font-semibold text-kinship-on-surface">
        No modules activated yet
      </p>
      <p className="mt-2 font-body text-sm text-kinship-on-surface-variant">
        Activate modules to start tracking your household.
      </p>
      <Link
        href="/settings/modules"
        className="mt-6 rounded-full bg-kinship-primary px-5 py-2 font-body text-sm font-medium text-white hover:bg-kinship-primary/90"
      >
        Add modules
      </Link>
    </div>
  )
}
