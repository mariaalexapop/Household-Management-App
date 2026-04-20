'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { Pencil, Trash2, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FileUploadZone } from '@/components/tracker/FileUploadZone'
import { DocumentList } from '@/components/tracker/DocumentList'
import { ReminderConfig } from '@/components/tracker/ReminderConfig'
import { createPolicy, updatePolicy, deletePolicy } from '@/app/actions/insurance'
import { formatCostFromCents, poundsToCents, centsToPounds } from '@/lib/format'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PolicyType = 'home' | 'car' | 'health' | 'life' | 'travel' | 'other'
export type PaymentSchedule = 'annual' | 'quarterly' | 'monthly'

export interface SerializedPolicy {
  id: string
  policyType: PolicyType
  insurer: string
  policyNumber: string | null
  expiryDate: string | null // ISO or null for ongoing
  renewalContactName: string | null
  renewalContactPhone: string | null
  renewalContactEmail: string | null
  paymentSchedule: PaymentSchedule | null
  premiumCents: number | null
  nextPaymentDate: string | null
  expiryReminderDays: number
  paymentReminderDays: number
  coveredName: string | null
  linkedCarId: string | null
  createdAt: string
}

export interface PersonOption {
  id: string
  name: string
}

export interface CarOption {
  id: string
  label: string
}

export interface SerializedDocument {
  id: string
  entityId: string
  documentType: string
  fileName: string
  fileSizeBytes: number | null
  createdAt: string
}

interface InsuranceClientProps {
  policies: SerializedPolicy[]
  documents: SerializedDocument[]
  members: PersonOption[]
  kids: PersonOption[]
  cars: CarOption[]
}

// ---------------------------------------------------------------------------
// Constants — Miro design system
// ---------------------------------------------------------------------------

const PURPLE = '#9333ea'
const PURPLE_DARK = '#7e22ce'

const POLICY_TYPE_OPTIONS: { value: PolicyType; label: string }[] = [
  { value: 'home', label: 'Home' },
  { value: 'car', label: 'Car' },
  { value: 'health', label: 'Health' },
  { value: 'life', label: 'Life' },
  { value: 'travel', label: 'Travel' },
  { value: 'other', label: 'Other' },
]

const POLICY_TYPE_BADGE: Record<PolicyType, { bg: string; text: string; label: string }> = {
  home: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Home' },
  car: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Car' },
  health: { bg: 'bg-green-100', text: 'text-green-800', label: 'Health' },
  life: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Life' },
  travel: { bg: 'bg-teal-100', text: 'text-teal-800', label: 'Travel' },
  other: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Other' },
}

const PAYMENT_SCHEDULE_LABEL: Record<PaymentSchedule, string> = {
  annual: 'Annual',
  quarterly: 'Quarterly',
  monthly: 'Monthly',
}

// ---------------------------------------------------------------------------
// Form schema
// ---------------------------------------------------------------------------

const formSchema = z.object({
  policyType: z.enum(['home', 'car', 'health', 'life', 'travel', 'other']),
  insurer: z.string().min(1, 'Insurer is required').max(200),
  policyNumber: z.string().max(100).optional().default(''),
  noExpiry: z.boolean().optional().default(false),
  expiryDate: z.string().optional().default(''),
  expiryReminderDays: z.number().int().min(1),
  paymentSchedule: z.string().optional().default(''),
  premiumPounds: z.string().optional().default(''),
  nextPaymentDate: z.string().optional().default(''),
  paymentReminderDays: z.number().int().min(1),
  coveredName: z.string().max(200).optional().default(''),
  linkedCarId: z.string().optional().default(''),
  renewalContactName: z.string().max(200).optional().default(''),
  renewalContactPhone: z.string().max(50).optional().default(''),
  renewalContactEmail: z
    .string()
    .max(200)
    .optional()
    .default('')
    .refine(
      (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      'Invalid email address'
    ),
})

type FormValues = z.input<typeof formSchema>
type FormValuesParsed = z.output<typeof formSchema>

function dateToISOWithOffset(yyyyMmDd: string): string {
  if (!yyyyMmDd) return ''
  const d = new Date(`${yyyyMmDd}T00:00:00`)
  const offset = -d.getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '-'
  const absOffset = Math.abs(offset)
  const hh = String(Math.floor(absOffset / 60)).padStart(2, '0')
  const mm = String(absOffset % 60).padStart(2, '0')
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T00:00:00${sign}${hh}:${mm}`
}

function isoToDateInput(iso: string | null): string {
  if (!iso) return ''
  try {
    return format(parseISO(iso), 'yyyy-MM-dd')
  } catch {
    return ''
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InsuranceClient({ policies, documents, members, kids, cars }: InsuranceClientProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<SerializedPolicy | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [localDocs, setLocalDocs] = useState<SerializedDocument[]>(documents)

  // Group documents by policy id for fast lookup
  const docsByPolicy = useMemo(() => {
    const map = new Map<string, SerializedDocument[]>()
    for (const doc of localDocs) {
      const arr = map.get(doc.entityId) ?? []
      arr.push(doc)
      map.set(doc.entityId, arr)
    }
    return map
  }, [localDocs])

  function handleAdd() {
    setEditingPolicy(null)
    setDialogOpen(true)
  }

  function handleEdit(policy: SerializedPolicy) {
    setEditingPolicy(policy)
    setDialogOpen(true)
  }

  async function handleDelete(policy: SerializedPolicy) {
    if (!confirm(`Delete the ${policy.insurer} policy? This will also delete linked documents.`)) {
      return
    }
    const result = await deletePolicy({ id: policy.id })
    if (!result.success) {
      toast.error(result.error ?? 'Failed to delete policy')
      return
    }
    toast.success('Policy deleted')
    router.refresh()
  }

  function handleUploadComplete(policyId: string, doc: { id: string; fileName: string }) {
    setLocalDocs((prev) => [
      {
        id: doc.id,
        entityId: policyId,
        documentType: 'policy',
        fileName: doc.fileName,
        fileSizeBytes: null,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ])
    router.refresh()
  }

  function handleDocDelete(docId: string) {
    setLocalDocs((prev) => prev.filter((d) => d.id !== docId))
    router.refresh()
  }

  return (
    <div>
      {/* Page header with purple accent */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-l-4 pl-4" style={{ borderColor: PURPLE }}>
        <h2 className="font-display text-2xl font-semibold leading-[1.2] tracking-[-0.02em] text-kinship-on-surface sm:text-[32px]">
          Insurance
        </h2>
        <Button
          onClick={handleAdd}
          className="min-h-11 rounded-full text-white"
          style={{ backgroundColor: PURPLE }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = PURPLE_DARK)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = PURPLE)}
        >
          <Plus className="mr-1 h-4 w-4" /> Add Policy
        </Button>
      </div>

      {/* Policy list */}
      {policies.length === 0 ? (
        <div className="rounded-xl ring-miro bg-white p-10 text-center">
          <p className="font-body text-base text-kinship-on-surface-variant">
            No insurance policies yet. Add your first policy.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {policies.map((policy) => {
            const policyDocs = docsByPolicy.get(policy.id) ?? []
            const isExpanded = expandedId === policy.id
            const badge = POLICY_TYPE_BADGE[policy.policyType]
            const expiryDate = policy.expiryDate ? parseISO(policy.expiryDate) : null
            const expiryDistance = expiryDate ? formatDistanceToNow(expiryDate, { addSuffix: true }) : null

            return (
              <div key={policy.id} className="rounded-xl ring-miro bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 font-body text-xs font-medium ${badge.bg} ${badge.text}`}
                      >
                        {badge.label}
                      </span>
                      {policy.policyNumber && (
                        <span className="font-body text-xs text-kinship-on-surface-variant">
                          #{policy.policyNumber}
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-lg font-semibold text-kinship-on-surface">
                      {policy.insurer}
                      {policy.coveredName && (
                        <span className="ml-2 font-body text-sm font-normal text-kinship-on-surface-variant">
                          — {policy.coveredName}
                        </span>
                      )}
                    </h3>
                    <div className="mt-2 grid gap-1 font-body text-sm text-kinship-on-surface-variant sm:grid-cols-2">
                      <div>
                        <span className="font-medium">Expires:</span>{' '}
                        {expiryDate ? (
                          <>
                            {format(expiryDate, 'd MMM yyyy')}{' '}
                            <span className="text-kinship-on-surface-variant/80">({expiryDistance})</span>
                          </>
                        ) : (
                          <span className="italic">Ongoing</span>
                        )}
                      </div>
                      {policy.paymentSchedule && (
                        <div>
                          <span className="font-medium">
                            {PAYMENT_SCHEDULE_LABEL[policy.paymentSchedule]} premium:
                          </span>{' '}
                          {formatCostFromCents(policy.premiumCents)}
                        </div>
                      )}
                      {policy.nextPaymentDate && (
                        <div>
                          <span className="font-medium">Next payment:</span>{' '}
                          {format(parseISO(policy.nextPaymentDate), 'd MMM yyyy')}
                        </div>
                      )}
                      {policy.renewalContactName && (
                        <div>
                          <span className="font-medium">Renewal contact:</span> {policy.renewalContactName}
                        </div>
                      )}
                    </div>

                    {/* Reminder configuration display */}
                    <div className="mt-3 flex flex-wrap gap-3 font-body text-xs text-kinship-on-surface-variant">
                      <span>Expiry reminder: {policy.expiryReminderDays} days before</span>
                      {policy.paymentSchedule && (
                        <span>Payment reminder: {policy.paymentReminderDays} days before</span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => handleEdit(policy)}
                      className="min-h-11 min-w-11 flex items-center justify-center rounded-lg text-kinship-on-surface-variant transition-colors hover:bg-kinship-surface-container hover:text-kinship-on-surface"
                      title="Edit policy"
                      aria-label="Edit policy"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(policy)}
                      className="min-h-11 min-w-11 flex items-center justify-center rounded-lg text-kinship-on-surface-variant transition-colors hover:bg-red-50 hover:text-red-600"
                      title="Delete policy"
                      aria-label="Delete policy"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : policy.id)}
                      className="min-h-11 min-w-11 flex items-center justify-center rounded-lg text-kinship-on-surface-variant transition-colors hover:bg-kinship-surface-container hover:text-kinship-on-surface"
                      title={isExpanded ? 'Collapse' : 'Expand documents'}
                      aria-label={isExpanded ? 'Collapse' : 'Expand documents'}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-5 border-t border-kinship-surface-container pt-5">
                    {/* Renewal contact full details */}
                    {(policy.renewalContactPhone || policy.renewalContactEmail) && (
                      <div className="mb-4 rounded-xl bg-kinship-surface-container-lowest p-3">
                        <p className="mb-1 font-body text-xs font-medium text-kinship-on-surface">Renewal Contact</p>
                        {policy.renewalContactName && (
                          <p className="font-body text-sm text-kinship-on-surface-variant">
                            {policy.renewalContactName}
                          </p>
                        )}
                        {policy.renewalContactPhone && (
                          <p className="font-body text-sm text-kinship-on-surface-variant">
                            {policy.renewalContactPhone}
                          </p>
                        )}
                        {policy.renewalContactEmail && (
                          <p className="font-body text-sm text-kinship-on-surface-variant">
                            {policy.renewalContactEmail}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="mb-3">
                      <p className="mb-2 font-body text-sm font-medium text-kinship-on-surface">
                        Policy Documents
                      </p>
                      <FileUploadZone
                        module="insurance"
                        entityId={policy.id}
                        documentType="policy"
                        onUploadComplete={(doc) => handleUploadComplete(policy.id, doc)}
                      />
                    </div>
                    <DocumentList
                      documents={policyDocs.map((d) => ({
                        id: d.id,
                        fileName: d.fileName,
                        documentType: d.documentType,
                        createdAt: d.createdAt,
                      }))}
                      onDelete={handleDocDelete}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display font-semibold text-kinship-on-surface">
              {editingPolicy ? 'Edit Policy' : 'Add Policy'}
            </DialogTitle>
          </DialogHeader>
          <PolicyForm
            key={editingPolicy?.id ?? 'new'}
            policy={editingPolicy}
            members={members}
            kids={kids}
            cars={cars}
            onSuccess={() => {
              setDialogOpen(false)
              router.refresh()
            }}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// PolicyForm
// ---------------------------------------------------------------------------

interface PolicyFormProps {
  policy: SerializedPolicy | null
  onSuccess: () => void
  onCancel: () => void
  members: PersonOption[]
  kids: PersonOption[]
  cars: CarOption[]
}

function PolicyForm({ policy, onSuccess, onCancel, members, kids, cars }: PolicyFormProps) {
  const isEdit = !!policy
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      policyType: policy?.policyType ?? 'home',
      insurer: policy?.insurer ?? '',
      policyNumber: policy?.policyNumber ?? '',
      noExpiry: !policy?.expiryDate && !!policy,
      expiryDate: isoToDateInput(policy?.expiryDate ?? null),
      expiryReminderDays: policy?.expiryReminderDays ?? 30,
      paymentSchedule: policy?.paymentSchedule ?? '',
      premiumPounds:
        policy?.premiumCents != null ? String(centsToPounds(policy.premiumCents)) : '',
      nextPaymentDate: isoToDateInput(policy?.nextPaymentDate ?? null),
      paymentReminderDays: policy?.paymentReminderDays ?? 7,
      coveredName: policy?.coveredName ?? '',
      linkedCarId: policy?.linkedCarId ?? '',
      renewalContactName: policy?.renewalContactName ?? '',
      renewalContactPhone: policy?.renewalContactPhone ?? '',
      renewalContactEmail: policy?.renewalContactEmail ?? '',
    },
  })

  const watchedSchedule = watch('paymentSchedule')
  const watchedType = watch('policyType')
  const watchedNoExpiry = watch('noExpiry')
  const watchedCoveredName = watch('coveredName')
  const [showOtherPersonInput, setShowOtherPersonInput] = useState(false)

  const onSubmit = async (rawValues: FormValues) => {
    const values = formSchema.parse(rawValues)
    setSubmitting(true)
    try {
      const premiumStr = (values.premiumPounds ?? '').toString().trim()
      const premiumCents =
        premiumStr === '' || isNaN(Number(premiumStr)) ? null : poundsToCents(Number(premiumStr))

      const payload = {
        policyType: values.policyType,
        insurer: values.insurer.trim(),
        policyNumber: values.policyNumber?.trim() || null,
        expiryDate: values.noExpiry || !values.expiryDate ? null : dateToISOWithOffset(values.expiryDate),
        renewalContactName: values.renewalContactName?.trim() || null,
        renewalContactPhone: values.renewalContactPhone?.trim() || null,
        renewalContactEmail: values.renewalContactEmail?.trim() || null,
        paymentSchedule:
          values.paymentSchedule === 'annual' ||
          values.paymentSchedule === 'quarterly' ||
          values.paymentSchedule === 'monthly'
            ? (values.paymentSchedule as PaymentSchedule)
            : null,
        premiumCents,
        nextPaymentDate: values.nextPaymentDate ? dateToISOWithOffset(values.nextPaymentDate) : null,
        expiryReminderDays: Number(values.expiryReminderDays) || 30,
        paymentReminderDays: Number(values.paymentReminderDays) || 7,
        coveredName: values.coveredName?.trim() || null,
        linkedCarId: values.linkedCarId || null,
      }

      const result = isEdit
        ? await updatePolicy({ ...payload, id: policy!.id })
        : await createPolicy(payload)

      if (!result.success) {
        toast.error(result.error ?? 'Failed to save policy')
        return
      }

      toast.success(isEdit ? 'Policy updated' : 'Policy added')
      onSuccess()
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Policy details */}
      <section className="space-y-3">
        <h3 className="font-display text-sm font-semibold text-kinship-on-surface">Policy Details</h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="policyType">Type</Label>
            <select
              id="policyType"
              {...register('policyType')}
              className="mt-1 h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              {POLICY_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="insurer">Insurer *</Label>
            <Input id="insurer" {...register('insurer')} className="mt-1" />
            {errors.insurer && (
              <p className="mt-1 font-body text-xs text-red-600">{errors.insurer.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="policyNumber">Policy Number</Label>
          <Input id="policyNumber" {...register('policyNumber')} className="mt-1" />
        </div>
      </section>

      {/* Covered entity — contextual based on policy type */}
      {(watchedType === 'health' || watchedType === 'life') && (
        <section className="space-y-3">
          <h3 className="font-display text-sm font-semibold text-kinship-on-surface">Covered Person</h3>
          <div>
            <Label htmlFor="coveredName">Person</Label>
            {!showOtherPersonInput ? (
              <select
                id="coveredName"
                value={watchedCoveredName}
                onChange={(e) => {
                  if (e.target.value === '__other__') {
                    setShowOtherPersonInput(true)
                    setValue('coveredName', '')
                  } else {
                    setValue('coveredName', e.target.value)
                  }
                }}
                className="mt-1 h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="">Select a person...</option>
                {members.length > 0 && (
                  <optgroup label="Household Members">
                    {members.map((m) => (
                      <option key={`m-${m.id}`} value={m.name}>{m.name}</option>
                    ))}
                  </optgroup>
                )}
                {kids.length > 0 && (
                  <optgroup label="Children">
                    {kids.map((k) => (
                      <option key={`k-${k.id}`} value={k.name}>{k.name}</option>
                    ))}
                  </optgroup>
                )}
                <option value="__other__">Other (type a name)</option>
              </select>
            ) : (
              <div className="mt-1 flex gap-2">
                <Input
                  placeholder="Enter person's name"
                  {...register('coveredName')}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowOtherPersonInput(false)
                    setValue('coveredName', '')
                  }}
                  className="shrink-0"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {watchedType === 'car' && (
        <section className="space-y-3">
          <h3 className="font-display text-sm font-semibold text-kinship-on-surface">Covered Vehicle</h3>
          {cars.length === 0 ? (
            <div className="rounded-lg border border-dashed border-kinship-outline-variant p-4 text-center">
              <p className="font-body text-sm text-kinship-on-surface-variant">
                No cars registered yet.
              </p>
              <a
                href="/cars?addCar=1"
                className="mt-2 inline-block font-body text-sm font-medium"
                style={{ color: PURPLE }}
              >
                Add a car first →
              </a>
            </div>
          ) : (
            <div>
              <Label htmlFor="linkedCarId">Vehicle</Label>
              <select
                id="linkedCarId"
                value={watch('linkedCarId')}
                onChange={(e) => {
                  setValue('linkedCarId', e.target.value)
                  const car = cars.find((c) => c.id === e.target.value)
                  setValue('coveredName', car ? car.label : '')
                }}
                className="mt-1 h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="">Select a vehicle...</option>
                {cars.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          )}
        </section>
      )}

      {watchedType === 'home' && (
        <section className="space-y-3">
          <h3 className="font-display text-sm font-semibold text-kinship-on-surface">Covered Property</h3>
          <div>
            <Label htmlFor="coveredName">Property name or address</Label>
            <Input id="coveredNameHome" {...register('coveredName')} className="mt-1" placeholder="e.g. Main house, Holiday flat" />
          </div>
        </section>
      )}

      {(watchedType === 'travel' || watchedType === 'other') && (
        <section className="space-y-3">
          <h3 className="font-display text-sm font-semibold text-kinship-on-surface">Coverage</h3>
          <div>
            <Label htmlFor="coveredName">Who or what is covered?</Label>
            <Input id="coveredNameOther" {...register('coveredName')} className="mt-1" placeholder="Optional" />
          </div>
        </section>
      )}

      {/* Dates + expiry reminder */}
      <section className="space-y-3">
        <h3 className="font-display text-sm font-semibold text-kinship-on-surface">Expiry</h3>

        <label className="flex items-center gap-2 font-body text-sm text-kinship-on-surface-variant">
          <input type="checkbox" {...register('noExpiry')} className="rounded border-input" />
          No expiry date (ongoing policy)
        </label>

        {!watchedNoExpiry && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Expiry Date</Label>
              <Controller
                control={control}
                name="expiryDate"
                render={({ field }) => (
                  <div className="mt-1">
                    <DatePicker value={field.value ?? ''} onChange={field.onChange} placeholder="Pick expiry date" />
                  </div>
                )}
              />
            </div>

            <Controller
              control={control}
              name="expiryReminderDays"
              render={({ field }) => (
              <ReminderConfig
                label="Expiry reminder"
                value={Number(field.value) || 30}
                onChange={(d) => field.onChange(d)}
              />
            )}
          />
          </div>
        )}
      </section>

      {/* Payment */}
      <section className="space-y-3">
        <h3 className="font-display text-sm font-semibold text-kinship-on-surface">Payment</h3>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="paymentSchedule">Schedule</Label>
            <select
              id="paymentSchedule"
              {...register('paymentSchedule')}
              className="mt-1 h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">--</option>
              <option value="annual">Annual</option>
              <option value="quarterly">Quarterly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <Label htmlFor="premiumPounds">Premium (€)</Label>
            <Input
              id="premiumPounds"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register('premiumPounds')}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Next payment date</Label>
            <Controller
              control={control}
              name="nextPaymentDate"
              render={({ field }) => (
                <div className="mt-1">
                  <DatePicker
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="Optional"
                  />
                </div>
              )}
            />
          </div>
        </div>

        {watchedSchedule && watchedSchedule !== '' && (
          <Controller
            control={control}
            name="paymentReminderDays"
            render={({ field }) => (
              <ReminderConfig
                label="Payment reminder"
                value={Number(field.value) || 7}
                onChange={(d) => field.onChange(d)}
              />
            )}
          />
        )}
      </section>

      {/* Renewal contact */}
      <section className="space-y-3">
        <h3 className="font-display text-sm font-semibold text-kinship-on-surface">Renewal Contact</h3>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="renewalContactName">Name</Label>
            <Input id="renewalContactName" {...register('renewalContactName')} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="renewalContactPhone">Phone</Label>
            <Input id="renewalContactPhone" {...register('renewalContactPhone')} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="renewalContactEmail">Email</Label>
            <Input
              id="renewalContactEmail"
              type="email"
              {...register('renewalContactEmail')}
              className="mt-1"
            />
            {errors.renewalContactEmail && (
              <p className="mt-1 font-body text-xs text-red-600">
                {errors.renewalContactEmail.message}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="flex items-center justify-end gap-2 border-t border-kinship-surface-container pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex shrink-0 items-center justify-center rounded-lg px-4 h-11 text-sm font-medium text-white disabled:pointer-events-none disabled:opacity-50"
          style={{ backgroundColor: PURPLE }}
        >
          {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Policy'}
        </button>
      </div>
    </form>
  )
}
