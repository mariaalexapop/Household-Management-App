import Link from 'next/link'
import {
  CheckSquare,
  CalendarHeart,
  Car,
  Shield,
  Monitor,
  Sparkles,
  MessageCircle,
  Lock,
  Check,
} from 'lucide-react'
import { ModuleCarousel } from '@/components/marketing/ModuleCarousel'


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
  { label: 'Modules', href: '#product' },
  { label: 'How it works', href: '#how' },
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
      <header className="sticky top-0 z-30 border-b border-kinship-surface-container bg-white/80 backdrop-blur-md">
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
      <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
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
      </div>

      {/* ---- Module tiles ---- */}
      <div id="modules" className="mx-auto max-w-7xl px-6 pb-20">
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
      </div>
      </section>
      {/* end hero white bg */}

      {/* ---- Modules detail section (carousel) ---- */}
      <section id="product" className="bg-kinship-surface py-20">
        <div className="mx-auto max-w-7xl px-6">
          <span className="font-body text-sm font-semibold uppercase tracking-wider text-kinship-primary">
            Modules
          </span>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-kinship-on-surface md:text-[42px]">
            Six small headaches.
            <br />
            One quietly-organised home.
          </h2>
          <p className="mt-4 max-w-xl font-body text-base leading-relaxed text-kinship-on-surface-variant">
            Each module is built around the actual ways households drop the ball.
            Use the dots below to flip through them.
          </p>

          <div className="mt-12">
            <ModuleCarousel />
          </div>
        </div>
      </section>

      {/* ---- How it works section ---- */}
      <section id="how" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <span className="font-body text-sm font-semibold uppercase tracking-wider text-kinship-primary">
              How it works
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-kinship-on-surface md:text-[38px]">
              Four steps. Then it quietly gets on with it.
            </h2>
            <p className="mt-3 font-body text-sm leading-relaxed text-kinship-on-surface-variant md:text-base">
              No spreadsheets, no group chats, no PDFs printed out and clipped to the fridge.
            </p>
          </div>

          {/* Steps grid with connecting line */}
          <div className="relative mt-14">
            {/* Connecting gradient line */}
            <div className="absolute left-[10%] right-[10%] top-[34px] hidden h-0.5 rounded-full bg-gradient-to-r from-module-chores-dark/35 via-module-kids-dark/35 via-module-car-dark/35 to-module-ins-dark/35 md:block" />

            <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4 md:gap-6">
              {/* Step 01 */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-center">
                  <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-white font-display text-xl font-bold text-module-chores-dark ring-2 ring-module-chores-dark">
                    01
                  </div>
                </div>
                <div className="flex min-h-[150px] items-center justify-center rounded-2xl bg-module-chores-light p-5">
                  <div className="flex items-center -space-x-2.5">
                    {['AH', 'NH', 'IR', 'FN'].map((initials, i) => (
                      <div
                        key={i}
                        className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-white font-display text-xs font-bold text-white"
                        style={{ backgroundColor: ['#4ecdc4', '#7bc67e', '#e8a838', '#8b5cf6'][i] }}
                      >
                        {initials}
                      </div>
                    ))}
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-white bg-kinship-surface-container font-bold text-kinship-on-surface-variant">
                      +
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-kinship-on-surface">
                    Set up your household
                  </h3>
                  <p className="mt-2 font-body text-sm leading-relaxed text-kinship-on-surface-variant">
                    Create a shared space for everyone under your roof — and people
                    who help from outside. Grandparents, au pairs, a co-parent in
                    another city.
                  </p>
                </div>
              </div>

              {/* Step 02 */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-center">
                  <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-white font-display text-xl font-bold text-module-kids-dark ring-2 ring-module-kids-dark">
                    02
                  </div>
                </div>
                <div className="flex min-h-[150px] items-center justify-center rounded-2xl bg-module-kids-light p-5">
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { name: 'Chores', on: true },
                      { name: 'Kids', on: true },
                      { name: 'Car', on: true },
                      { name: 'Insur.', on: true },
                      { name: 'Elec.', on: false },
                      { name: 'Cal.', on: false },
                    ].map((m) => (
                      <div
                        key={m.name}
                        className={`rounded-lg px-2 py-1.5 text-center font-display text-[10px] font-semibold ${
                          m.on
                            ? 'bg-white/60 text-kinship-on-surface'
                            : 'bg-kinship-surface-container/40 text-kinship-on-surface-variant/50'
                        }`}
                      >
                        {m.name}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-kinship-on-surface">
                    Switch on what matters
                  </h3>
                  <p className="mt-2 font-body text-sm leading-relaxed text-kinship-on-surface-variant">
                    Pick the modules that solve your headaches — leave the rest off.
                    Change your mind any time from Settings.
                  </p>
                </div>
              </div>

              {/* Step 03 */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-center">
                  <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-white font-display text-xl font-bold text-module-car-dark ring-2 ring-module-car-dark">
                    03
                  </div>
                </div>
                <div className="flex min-h-[150px] flex-col items-stretch justify-center gap-1.5 rounded-2xl bg-module-car-light p-5">
                  {['aviva-home.pdf', 'MOT cert · MK19 ZFR', 'Bosch receipt · Aug 24', "Iris's swim schedule"].map(
                    (doc) => (
                      <div
                        key={doc}
                        className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 ring-1 ring-kinship-outline-variant/30"
                      >
                        <span className="font-mono text-[11px] text-kinship-on-surface">
                          {doc}
                        </span>
                      </div>
                    )
                  )}
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-kinship-on-surface">
                    Add it once, everyone has it
                  </h3>
                  <p className="mt-2 font-body text-sm leading-relaxed text-kinship-on-surface-variant">
                    Drop in policies, receipts, kids&apos; schedules, MOT dates.
                    Your whole household sees the same view — on web, on the phone,
                    on the train.
                  </p>
                </div>
              </div>

              {/* Step 04 */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-center">
                  <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-white font-display text-xl font-bold text-module-ins-dark ring-2 ring-module-ins-dark">
                    04
                  </div>
                </div>
                <div className="flex min-h-[150px] flex-col justify-center gap-2 rounded-2xl bg-module-ins-light p-5">
                  <div className="self-end rounded-xl rounded-br-sm bg-kinship-primary px-3 py-1.5 text-[11.5px] leading-snug text-white">
                    When does the MOT lapse?
                  </div>
                  <div className="self-start rounded-xl rounded-bl-sm bg-white px-3 py-2 text-[11.5px] leading-snug text-kinship-on-surface ring-1 ring-kinship-outline-variant/30">
                    Ford Focus · <strong>14 June</strong> (18 days). Reminder?
                    <div className="mt-1.5 flex gap-1">
                      <span className="rounded-full bg-kinship-primary px-2 py-0.5 text-[10px] font-semibold text-white">
                        Yes
                      </span>
                      <span className="rounded-full bg-kinship-surface-container px-2 py-0.5 text-[10px] font-semibold text-kinship-on-surface-variant">
                        No
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-kinship-on-surface">
                    Ask Kinship instead of digging
                  </h3>
                  <p className="mt-2 font-body text-sm leading-relaxed text-kinship-on-surface-variant">
                    Don&apos;t open the PDF. Just ask — &ldquo;when does the MOT
                    lapse?&rdquo;, &ldquo;is the new bike covered?&rdquo; — and
                    Kinship answers, citing the document.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- AI Assistant section ---- */}
      <section id="ai" className="bg-kinship-surface py-20">
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
