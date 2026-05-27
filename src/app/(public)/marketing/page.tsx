import Link from 'next/link'
import {
  CheckSquare,
  CalendarHeart,
  Car,
  Shield,
  Monitor,
  Sparkles,
  MessageCircle,
  Calendar,
  FileText,
  MessageSquare,
  Bell,
  Lock,
  Check,
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

/* ------------------------------------------------------------------ */
/* Module detail data                                                  */
/* ------------------------------------------------------------------ */

const MODULE_DETAILS = [
  {
    name: 'Home Chores',
    Icon: CheckSquare,
    lightClass: 'bg-module-chores-light',
    darkClass: 'text-module-chores-dark',
    helpBg: 'bg-module-chores-light',
    tagline: 'Stop being the only person who remembers the bins.',
    problems: [
      'Recycling went out late three weeks running.',
      'No one knows whose turn it is to do school run.',
      "The fridge filter has been 'I'll do it tomorrow' since March.",
    ],
    how: 'Set recurring chores once. Kinship rotates them fairly between members, nudges the right person on the right day, and shows the household who actually pulled their weight this week.',
  },
  {
    name: 'Kids Activities',
    Icon: CalendarHeart,
    lightClass: 'bg-module-kids-light',
    darkClass: 'text-module-kids-dark',
    helpBg: 'bg-module-kids-light',
    tagline: 'A shared brain for the swimming-piano-dentist juggle.',
    problems: [
      'Two parents, two calendars, one missed swim lesson.',
      'Grandparent picks up — but from where, at what time?',
      'Term-time clubs change every six weeks.',
    ],
    how: "One timeline per child. Tag who's collecting, where, and what kit they need. Anyone in the household (or grandma) sees the same view, in their timezone.",
  },
  {
    name: 'Car Maintenance',
    Icon: Car,
    lightClass: 'bg-module-car-light',
    darkClass: 'text-module-car-dark',
    helpBg: 'bg-module-car-light',
    tagline: 'Never get a \u20AC1,000 surprise from a missed MOT again.',
    problems: [
      'MOT lapsed because the reminder went to an old email.',
      'No one knows when the timing belt was last done.',
      'You paid for the same brake fluid twice in 18 months.',
    ],
    how: 'Add a registration. Kinship pulls the MOT & tax dates from DVLA, tracks service history, and warns you 60 days out — with quotes from garages near you.',
  },
  {
    name: 'Insurance',
    Icon: Shield,
    lightClass: 'bg-module-ins-light',
    darkClass: 'text-module-ins-dark',
    helpBg: 'bg-module-ins-light',
    tagline: 'Renewals you actually understand, before they auto-bill.',
    problems: [
      "Your home insurance just renewed 47% higher. You didn't notice.",
      'You have no idea what your travel policy covers.',
      'The renewal email is a 40-page PDF.',
    ],
    how: "Upload the PDF. Kinship extracts cover, excess, key dates and renewal steps — then asks plain-English questions like 'is my new bike covered?' before deciding to renew.",
  },
  {
    name: 'Electronics & Warranties',
    Icon: Monitor,
    lightClass: 'bg-module-elec-light',
    darkClass: 'text-module-elec-dark',
    helpBg: 'bg-module-elec-light',
    tagline: 'The receipt is in a drawer somewhere. We promise.',
    problems: [
      'Washing machine broke at month 13 — receipt long gone.',
      "You can't remember which TV has the extended cover.",
      'Manuals are bookmarks no one will ever open.',
    ],
    how: 'Snap the receipt at purchase. Kinship logs the warranty length, files the manual, and pings you a month before cover ends so you can actually claim.',
  },
  {
    name: 'Calendar',
    Icon: Calendar,
    lightClass: 'bg-module-calendar-light',
    darkClass: 'text-module-calendar-dark',
    helpBg: 'bg-module-calendar-light',
    tagline: 'Everything above, on one shared week.',
    problems: [
      'You overbook because chores and kids live in different apps.',
      "You can't see when both parents are out at once.",
      'School inset day blindsides you. Again.',
    ],
    how: 'Every module flows into one weekly view, colour-coded. Filter by member, by module, or zoom out to the whole household.',
  },
]

/* ------------------------------------------------------------------ */
/* Pricing data                                                        */
/* ------------------------------------------------------------------ */

const PRICING_PLANS = [
  {
    name: 'Free',
    price: '\u20AC0',
    period: 'forever',
    description: 'One household, the essentials. Great to try.',
    featured: false,
    features: [
      '1 household up to 4 members',
      'Chores + Calendar',
      '5 AI questions / month',
      '7-day activity history',
    ],
  },
  {
    name: 'Family',
    price: '\u20AC6',
    period: '/ month',
    description: 'The full household — every module, fair AI.',
    featured: true,
    tag: 'Most popular',
    features: [
      'Unlimited members',
      'All 6 modules',
      '200 AI questions / month',
      'PDF policy extraction',
      '12-month history',
      'Email + push reminders',
    ],
  },
  {
    name: 'Family Plus',
    price: '\u20AC12',
    period: '/ month',
    description: 'For larger or busier households — unlimited AI.',
    featured: false,
    features: [
      'Everything in Family',
      'Unlimited AI',
      'Up to 3 connected households',
      'Document storage 50 GB',
      'Priority support',
    ],
  },
]

const NAV_LINKS = [
  { label: 'Product', href: '#product' },
  { label: 'Modules', href: '#modules' },
  { label: 'AI assistant', href: '#ai' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Privacy', href: '#footer' },
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
              <p className={`font-body text-xs ${m.darkClass} opacity-80`}>
                {m.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Modules detail section ---- */}
      <section id="product" className="bg-kinship-surface py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="font-body text-sm font-semibold uppercase tracking-wider text-kinship-primary">
              Modules
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-kinship-on-surface md:text-4xl">
              Six small headaches.{' '}
              <br className="hidden sm:inline" />
              One quietly-organised home.
            </h2>
            <p className="mt-4 font-body text-base leading-relaxed text-kinship-on-surface-variant md:text-lg">
              Each module tackles a real source of household friction — then feeds
              everything into a single shared calendar so nothing slips.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {MODULE_DETAILS.map((mod) => (
              <div
                key={mod.name}
                className="rounded-2xl bg-kinship-surface-container-lowest p-6 ring-miro"
              >
                {/* Module chip + name */}
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${mod.lightClass} ${mod.darkClass}`}
                  >
                    <mod.Icon className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-kinship-on-surface">
                    {mod.name}
                  </h3>
                </div>

                {/* Tagline */}
                <p className="mt-3 font-body text-base font-medium italic text-kinship-on-surface-variant">
                  {mod.tagline}
                </p>

                {/* Sound familiar? */}
                <div className="mt-4">
                  <p className="font-body text-xs font-semibold uppercase tracking-wider text-kinship-on-surface-variant">
                    Sound familiar?
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {mod.problems.map((problem, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 font-body text-sm text-kinship-on-surface-variant"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-kinship-on-surface-variant/40" />
                        {problem}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* How Kinship helps */}
                <div className={`mt-4 rounded-xl ${mod.helpBg} p-4`}>
                  <p className={`font-body text-xs font-semibold uppercase tracking-wider ${mod.darkClass}`}>
                    How Kinship helps
                  </p>
                  <p className={`mt-1.5 font-body text-sm leading-relaxed ${mod.darkClass}/90`}>
                    {mod.how}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- AI Assistant section ---- */}
      <section id="ai" className="bg-kinship-canvas py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            {/* Left column */}
            <div>
              <span className="font-body text-sm font-semibold uppercase tracking-wider text-kinship-primary">
                AI Assistant
              </span>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-kinship-on-surface md:text-4xl">
                Ask Kinship anything about your household.
              </h2>
              <p className="mt-4 font-body text-base leading-relaxed text-kinship-on-surface-variant md:text-lg">
                Upload documents, ask plain-English questions, and let Kinship turn
                answers into reminders and tasks — all without leaving the app.
              </p>

              {/* Steps */}
              <div className="mt-8 space-y-6">
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-kinship-primary font-display text-sm font-semibold text-white">
                    1
                  </div>
                  <div>
                    <p className="font-display text-base font-semibold text-kinship-on-surface">
                      Drop in a document
                    </p>
                    <p className="mt-1 font-body text-sm leading-relaxed text-kinship-on-surface-variant">
                      Upload a policy PDF, manual, or receipt — or forward an email.
                      Files stay private to your household.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-kinship-primary font-display text-sm font-semibold text-white">
                    2
                  </div>
                  <div>
                    <p className="font-display text-base font-semibold text-kinship-on-surface">
                      Ask in plain English
                    </p>
                    <p className="mt-1 font-body text-sm leading-relaxed text-kinship-on-surface-variant">
                      &ldquo;When does my home insurance renew?&rdquo; &ldquo;Is my
                      bike covered if it&apos;s stolen from the shed?&rdquo; Kinship
                      cites the page it found the answer on.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-kinship-primary font-display text-sm font-semibold text-white">
                    3
                  </div>
                  <div>
                    <p className="font-display text-base font-semibold text-kinship-on-surface">
                      Turn answers into action
                    </p>
                    <p className="mt-1 font-body text-sm leading-relaxed text-kinship-on-surface-variant">
                      Confirm and Kinship adds reminders, books renewal tasks, and
                      assigns them fairly between household members.
                    </p>
                  </div>
                </div>
              </div>

              {/* Privacy note */}
              <div className="mt-8 flex items-start gap-2 rounded-xl bg-kinship-surface-container p-4">
                <Lock className="mt-0.5 h-4 w-4 flex-shrink-0 text-kinship-on-surface-variant" />
                <p className="font-body text-xs leading-relaxed text-kinship-on-surface-variant">
                  Your documents are encrypted at rest. Kinship never uses your
                  household&apos;s data to train third-party models.
                </p>
              </div>
            </div>

            {/* Right column — AI chat demo card */}
            <div className="flex justify-center">
              <div className="w-full max-w-sm rounded-2xl bg-kinship-surface-container-lowest p-6 ring-miro shadow-float">
                <div className="flex items-center gap-2 border-b border-kinship-outline-variant pb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-kinship-primary">
                    <MessageCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-display text-sm font-semibold text-kinship-on-surface">
                      Kinship AI
                    </p>
                    <p className="font-body text-xs text-kinship-on-surface-variant">
                      Insurance module
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="rounded-2xl rounded-br-md bg-kinship-primary px-4 py-2.5">
                      <p className="font-body text-sm text-white">
                        Is my bike covered if it gets stolen from the garden shed?
                      </p>
                    </div>
                  </div>

                  {/* AI response */}
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-md bg-kinship-surface-container px-4 py-2.5">
                      <p className="font-body text-sm text-kinship-on-surface">
                        Yes. Your Aviva Home Insurance policy covers bicycle theft
                        from a locked outbuilding up to{' '}
                        <span className="font-semibold">&pound;1,500</span>.
                      </p>
                      <p className="mt-1.5 font-body text-xs text-kinship-on-surface-variant">
                        Source: Policy document, page 14, section 8.2
                      </p>
                    </div>
                  </div>

                  {/* Follow-up user message */}
                  <div className="flex justify-end">
                    <div className="rounded-2xl rounded-br-md bg-kinship-primary px-4 py-2.5">
                      <p className="font-body text-sm text-white">
                        When does this policy renew?
                      </p>
                    </div>
                  </div>

                  {/* AI follow-up */}
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-md bg-kinship-surface-container px-4 py-2.5">
                      <p className="font-body text-sm text-kinship-on-surface">
                        Your renewal date is{' '}
                        <span className="font-semibold">14 August 2026</span>. Want
                        me to set a reminder 30 days before?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Pricing section ---- */}
      <section id="pricing" className="bg-kinship-surface py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="font-body text-sm font-semibold uppercase tracking-wider text-kinship-primary">
              Pricing
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-kinship-on-surface md:text-4xl">
              Honest plans. No upsells in the middle of an MOT reminder.
            </h2>
            <p className="mt-4 font-body text-base leading-relaxed text-kinship-on-surface-variant md:text-lg">
              Start free, upgrade when your household needs more. Every plan
              includes core modules and a fair share of AI.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl p-6 ring-miro ${
                  plan.featured
                    ? 'bg-kinship-surface-container-lowest ring-2 ring-kinship-primary shadow-float'
                    : 'bg-kinship-surface-container-lowest'
                }`}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-kinship-primary px-3 py-0.5 font-body text-xs font-semibold text-white">
                    {(plan as { tag?: string }).tag}
                  </span>
                )}

                <h3 className="font-display text-xl font-semibold text-kinship-on-surface">
                  {plan.name}
                </h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-semibold text-kinship-on-surface">
                    {plan.price}
                  </span>
                  <span className="font-body text-sm text-kinship-on-surface-variant">
                    {plan.period}
                  </span>
                </div>
                <p className="mt-2 font-body text-sm text-kinship-on-surface-variant">
                  {plan.description}
                </p>

                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-kinship-success" />
                      <span className="font-body text-sm text-kinship-on-surface">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/auth/signup"
                  className={`mt-6 inline-flex items-center justify-center rounded-full px-5 py-2.5 font-display text-sm font-semibold transition-colors ${
                    plan.featured
                      ? 'bg-kinship-primary text-white hover:bg-kinship-primary-pressed'
                      : 'border border-kinship-outline text-kinship-on-surface hover:bg-kinship-surface-container'
                  }`}
                >
                  {plan.price === '\u20AC0' ? 'Start free' : 'Get started'}
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center font-body text-xs text-kinship-on-surface-variant">
            Prices in EUR. VAT included. Cancel any time — your data exports as
            JSON.
          </p>
        </div>
      </section>

      {/* ---- CTA / Waitlist section ---- */}
      <section className="bg-gradient-to-br from-kinship-primary to-kinship-primary-pressed py-20">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="font-display text-3xl font-semibold leading-tight text-white md:text-4xl">
            Be among the first households to try Kinship.
          </h2>
          <p className="mt-4 font-body text-base leading-relaxed text-white/80 md:text-lg">
            Leave your email and we&apos;ll send you an invite when we open up
            another batch.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full max-w-xs rounded-full bg-white/15 px-5 py-2.5 font-body text-sm text-white placeholder-white/50 outline-none ring-1 ring-white/25 backdrop-blur-sm focus:ring-2 focus:ring-white/50 sm:w-64"
            />
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-2.5 font-display text-sm font-semibold text-kinship-primary hover:bg-white/90 transition-colors"
            >
              Join the list
            </button>
          </div>

          <p className="mt-4 font-body text-xs text-white/60">
            One email when we have something to show. No spam. Unsubscribe in one
            click.
          </p>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer id="footer" className="border-t border-kinship-surface-container bg-kinship-surface-container-lowest py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-kinship-primary">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="font-display text-lg font-semibold text-kinship-on-surface">
                  Kinship
                </span>
              </div>
              <p className="mt-3 font-body text-sm leading-relaxed text-kinship-on-surface-variant">
                The family command centre, with a brain. Track chores, kids, cars,
                insurance, and electronics — all in one place.
              </p>
            </div>

            {/* Product */}
            <div>
              <p className="font-display text-sm font-semibold text-kinship-on-surface">
                Product
              </p>
              <ul className="mt-3 space-y-2">
                <li>
                  <a href="#modules" className="font-body text-sm text-kinship-on-surface-variant hover:text-kinship-on-surface transition-colors">
                    Modules
                  </a>
                </li>
                <li>
                  <a href="#ai" className="font-body text-sm text-kinship-on-surface-variant hover:text-kinship-on-surface transition-colors">
                    AI Assistant
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="font-body text-sm text-kinship-on-surface-variant hover:text-kinship-on-surface transition-colors">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <p className="font-display text-sm font-semibold text-kinship-on-surface">
                Company
              </p>
              <ul className="mt-3 space-y-2">
                <li>
                  <a href="#" className="font-body text-sm text-kinship-on-surface-variant hover:text-kinship-on-surface transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="font-body text-sm text-kinship-on-surface-variant hover:text-kinship-on-surface transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="font-body text-sm text-kinship-on-surface-variant hover:text-kinship-on-surface transition-colors">
                    Careers
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <p className="font-display text-sm font-semibold text-kinship-on-surface">
                Legal
              </p>
              <ul className="mt-3 space-y-2">
                <li>
                  <a href="#" className="font-body text-sm text-kinship-on-surface-variant hover:text-kinship-on-surface transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="font-body text-sm text-kinship-on-surface-variant hover:text-kinship-on-surface transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="mailto:hello@kinship.app" className="font-body text-sm text-kinship-on-surface-variant hover:text-kinship-on-surface transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-kinship-surface-container pt-6 sm:flex-row">
            <p className="font-body text-xs text-kinship-on-surface-variant">
              &copy; 2026 Kinship Labs Ltd
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="font-body text-xs text-kinship-on-surface-variant hover:text-kinship-on-surface transition-colors">
                Privacy
              </a>
              <a href="#" className="font-body text-xs text-kinship-on-surface-variant hover:text-kinship-on-surface transition-colors">
                Terms
              </a>
              <a href="mailto:hello@kinship.app" className="font-body text-xs text-kinship-on-surface-variant hover:text-kinship-on-surface transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
