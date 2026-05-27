import Link from 'next/link'
import {
  CheckSquare,
  CalendarHeart,
  Car,
  Shield,
  Monitor,
  Sparkles,
  MessageCircle,
} from 'lucide-react'


export const metadata = {
  title: 'Kinship — The family command centre, with a brain.',
  description:
    'Kinship helps families track chores, kids activities, cars, insurance, and electronics — all in one place.',
}

/* ------------------------------------------------------------------ */
/* Module tile data                                                    */
/* ------------------------------------------------------------------ */

const MODULES = [
  {
    label: 'Chores',
    description: 'Recurring, fair, done',
    Icon: CheckSquare,
    lightClass: 'bg-module-chores-light',
    darkClass: 'text-module-chores-dark',
  },
  {
    label: 'Kids',
    description: 'Who takes them where',
    Icon: CalendarHeart,
    lightClass: 'bg-module-kids-light',
    darkClass: 'text-module-kids-dark',
  },
  {
    label: 'Car',
    description: 'MOT, tax, service',
    Icon: Car,
    lightClass: 'bg-module-car-light',
    darkClass: 'text-module-car-dark',
  },
  {
    label: 'Insurance',
    description: 'Policies & renewals',
    Icon: Shield,
    lightClass: 'bg-module-ins-light',
    darkClass: 'text-module-ins-dark',
  },
  {
    label: 'Electronics',
    description: 'Warranties & manuals',
    Icon: Monitor,
    lightClass: 'bg-module-elec-light',
    darkClass: 'text-module-elec-dark',
  },
]

const NAV_LINKS = [
  { label: 'Product', href: '#product' },
  { label: 'Modules', href: '#modules' },
  { label: 'AI assistant', href: '#ai' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Privacy', href: '#privacy' },
]

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-kinship-surface">
      {/* ---- Top nav ---- */}
      <header className="sticky top-0 z-30 border-b border-kinship-surface-container bg-kinship-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          {/* Logo + brand */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-kinship-primary">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-lg font-semibold text-kinship-on-surface">
              Kinship
            </span>
          </Link>

          {/* Centered nav links — hidden on mobile */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="font-body text-sm text-kinship-on-surface-variant hover:text-kinship-on-surface transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center rounded-lg px-2.5 py-1.5 font-body text-sm font-medium text-kinship-primary hover:bg-kinship-surface-container transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center rounded-full bg-kinship-primary px-4 py-1.5 font-body text-sm font-medium text-white hover:bg-kinship-primary-pressed transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ---- Hero section ---- */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          {/* Left column */}
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-kinship-primary-surface px-3 py-1 font-body text-xs font-medium text-kinship-primary">
              <Sparkles className="h-3 w-3" />
              Your household, one place
            </span>

            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.15] tracking-tight text-kinship-on-surface md:text-5xl">
              The family command centre, with a brain.
            </h1>

            <p className="mt-4 max-w-lg font-body text-base leading-relaxed text-kinship-on-surface-variant md:text-lg">
              Kinship brings chores, kids activities, car servicing, insurance, and
              electronics into one calm dashboard — with an AI assistant that actually
              knows your household.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center rounded-full bg-kinship-primary px-5 py-2.5 font-display text-sm font-semibold text-white hover:bg-kinship-primary-pressed transition-colors"
              >
                Get started free
              </Link>
              <a
                href="#product"
                className="inline-flex items-center justify-center rounded-lg border border-kinship-outline px-5 py-2.5 font-display text-sm font-semibold text-kinship-on-surface hover:bg-kinship-surface-container transition-colors"
              >
                See how it works
              </a>
            </div>

            {/* Trust badges */}
            <div className="mt-6 flex items-center gap-4">
              <span className="inline-flex items-center gap-1 rounded-full border border-kinship-surface-container px-2.5 py-1 font-body text-xs text-kinship-on-surface-variant">
                <Shield className="h-3 w-3" /> GDPR
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-kinship-surface-container px-2.5 py-1 font-body text-xs text-kinship-on-surface-variant">
                Free
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-kinship-surface-container px-2.5 py-1 font-body text-xs text-kinship-on-surface-variant">
                Web
              </span>
            </div>
          </div>

          {/* Right column — floating card previews */}
          <div className="relative hidden md:block">
            <div className="absolute -top-4 left-8 w-72 rotate-[-3deg] rounded-2xl bg-kinship-surface-container-lowest p-5 ring-miro">
              <p className="font-display text-sm font-semibold text-kinship-on-surface">
                This week
              </p>
              <p className="mt-1 font-body text-xs text-kinship-on-surface-variant">
                3 chores due &middot; 2 kids activities &middot; MOT in 5 days
              </p>
              <div className="mt-3 flex gap-2">
                <div className="h-2 flex-1 rounded-full bg-module-chores-light" />
                <div className="h-2 w-12 rounded-full bg-module-kids-light" />
                <div className="h-2 w-8 rounded-full bg-module-car-light" />
              </div>
            </div>

            <div className="ml-16 mt-32 w-64 rotate-[2deg] rounded-2xl bg-kinship-surface-container-lowest p-5 ring-miro">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-kinship-primary">
                  <MessageCircle className="h-3.5 w-3.5 text-white" />
                </div>
                <p className="font-display text-sm font-semibold text-kinship-on-surface">
                  AI chat
                </p>
              </div>
              <p className="mt-2 font-body text-xs text-kinship-on-surface-variant">
                &ldquo;When is the car MOT due?&rdquo;
              </p>
              <p className="mt-1 rounded-lg bg-kinship-primary-surface px-3 py-2 font-body text-xs text-kinship-on-surface">
                Your Ford Focus MOT is due on 12 June 2026.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Module tiles ---- */}
      <section id="modules" className="mx-auto max-w-7xl px-6 pb-20">
        <h2 className="mb-8 text-center font-display text-2xl font-semibold text-kinship-on-surface">
          Five modules. One household.
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {MODULES.map((m) => (
            <div
              key={m.label}
              className={`flex flex-col items-center gap-3 rounded-2xl ${m.lightClass} p-6 transition-transform hover:scale-[1.03]`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-white/60 ${m.darkClass}`}
              >
                <m.Icon className="h-6 w-6" />
              </div>
              <p className={`font-display text-sm font-semibold ${m.darkClass}`}>
                {m.label}
              </p>
              <p className={`font-body text-xs ${m.darkClass} opacity-85`}>
                {m.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
