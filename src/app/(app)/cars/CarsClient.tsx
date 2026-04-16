'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Car, Plus, Pencil, Trash2, History, X } from 'lucide-react'
import { format, parseISO, isValid } from 'date-fns'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DatePicker } from '@/components/ui/date-picker'
import { ReminderConfig } from '@/components/tracker/ReminderConfig'
import { formatCostFromCents, poundsToCents, centsToPounds } from '@/lib/format'
import {
  createCar,
  updateCar,
  deleteCar,
  createServiceRecord,
  updateServiceRecord,
  deleteServiceRecord,
} from '@/app/actions/cars'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SerializedCar = {
  id: string
  householdId: string
  make: string
  model: string
  year: number
  plate: string
  colour: string | null
  motDueDate: string | null
  taxDueDate: string | null
  nextServiceDate: string | null
  motReminderDays: number
  taxReminderDays: number
  serviceReminderDays: number
  createdBy: string
  createdAt: string | null
}

export type ServiceType = 'full_service' | 'mot' | 'repair' | 'tyre' | 'other'

export type SerializedServiceRecord = {
  id: string
  householdId: string
  carId: string
  serviceDate: string
  serviceType: ServiceType
  mileage: number | null
  garage: string | null
  costCents: number | null
  notes: string | null
  createdBy: string
  createdAt: string | null
}

interface CarsClientProps {
  cars: SerializedCar[]
  serviceRecords: SerializedServiceRecord[]
}

// ---------------------------------------------------------------------------
// Form schemas (client-side validation)
// ---------------------------------------------------------------------------

const carFormSchema = z.object({
  make: z.string().min(1, 'Make is required').max(100),
  model: z.string().min(1, 'Model is required').max(100),
  year: z
    .number({ message: 'Year is required' })
    .int()
    .min(1900, 'Year too old')
    .max(2100, 'Year too far in future'),
  plate: z.string().min(1, 'Plate is required').max(20),
  colour: z.string().max(50).optional(),
  motDueDate: z.string().optional(),
  taxDueDate: z.string().optional(),
  nextServiceDate: z.string().optional(),
  motReminderDays: z.number().int().min(1).max(365),
  taxReminderDays: z.number().int().min(1).max(365),
  serviceReminderDays: z.number().int().min(1).max(365),
})

type CarFormValues = z.infer<typeof carFormSchema>

const serviceFormSchema = z.object({
  serviceDate: z.string().min(1, 'Service date is required'),
  serviceType: z.enum(['full_service', 'mot', 'repair', 'tyre', 'other']),
  mileage: z.number().int().min(0).optional().nullable(),
  garage: z.string().max(200).optional(),
  costPounds: z.number().min(0).optional().nullable(),
  notes: z.string().optional(),
})

type ServiceFormValues = z.infer<typeof serviceFormSchema>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORANGE = '#ea580c'
const ORANGE_DARK = '#c2410c'

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  full_service: 'Full service',
  mot: 'MOT',
  repair: 'Repair',
  tyre: 'Tyre',
  other: 'Other',
}

const SERVICE_TYPE_BADGE_CLASSES: Record<ServiceType, string> = {
  full_service: 'bg-emerald-100 text-emerald-800',
  mot: 'bg-blue-100 text-blue-800',
  repair: 'bg-rose-100 text-rose-800',
  tyre: 'bg-amber-100 text-amber-800',
  other: 'bg-slate-100 text-slate-800',
}

function isoToDateInput(iso: string | null): string {
  if (!iso) return ''
  const d = parseISO(iso)
  return isValid(d) ? format(d, 'yyyy-MM-dd') : ''
}

function dateInputToIso(value: string): string | null {
  if (!value) return null
  const d = parseISO(value)
  if (!isValid(d)) return null
  // Store as midnight UTC for the chosen day
  return new Date(`${value}T00:00:00.000Z`).toISOString()
}

function formatDisplayDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = typeof iso === 'string' ? parseISO(iso) : iso
  return isValid(d) ? format(d, 'd MMM yyyy') : '—'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CarsClient({ cars, serviceRecords }: CarsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selectedCarId, setSelectedCarId] = useState<string | null>(null)
  const [showAddCar, setShowAddCar] = useState(false)

  // Auto-open add car dialog when redirected from insurance page
  useEffect(() => {
    if (searchParams.get('addCar') === '1') {
      setShowAddCar(true)
      // Clean up the URL param
      router.replace('/cars', { scroll: false })
    }
  }, [searchParams, router])
  const [editingCar, setEditingCar] = useState<SerializedCar | null>(null)
  const [deletingCarId, setDeletingCarId] = useState<string | null>(null)

  const [showAddService, setShowAddService] = useState(false)
  const [editingService, setEditingService] = useState<SerializedServiceRecord | null>(null)
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null)

  const selectedCar = useMemo(
    () => cars.find((c) => c.id === selectedCarId) ?? null,
    [cars, selectedCarId]
  )

  const recordsForSelectedCar = useMemo(
    () =>
      selectedCarId
        ? serviceRecords.filter((r) => r.carId === selectedCarId)
        : [],
    [serviceRecords, selectedCarId]
  )

  function handleOpenAddCar() {
    setEditingCar(null)
    setShowAddCar(true)
  }

  function handleOpenEditCar(car: SerializedCar) {
    setEditingCar(car)
    setShowAddCar(true)
  }

  async function handleConfirmDeleteCar() {
    if (!deletingCarId) return
    const id = deletingCarId
    setDeletingCarId(null)
    const result = await deleteCar({ id })
    if (!result.success) {
      toast.error(result.error ?? 'Failed to delete car')
      return
    }
    toast.success('Car deleted')
    if (selectedCarId === id) setSelectedCarId(null)
    router.refresh()
  }

  async function handleConfirmDeleteService() {
    if (!deletingServiceId) return
    const id = deletingServiceId
    setDeletingServiceId(null)
    const result = await deleteServiceRecord({ id })
    if (!result.success) {
      toast.error(result.error ?? 'Failed to delete service record')
      return
    }
    toast.success('Service record deleted')
    router.refresh()
  }

  const deletingCarName =
    cars.find((c) => c.id === deletingCarId)
      ? `${cars.find((c) => c.id === deletingCarId)!.make} ${cars.find((c) => c.id === deletingCarId)!.model}`
      : 'this car'

  return (
    <div>
      {/* Page header with orange accent */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="h-8 w-1 rounded-full"
            style={{ backgroundColor: ORANGE }}
            aria-hidden="true"
          />
          <h2 className="font-display text-[32px] font-semibold leading-[1.2] tracking-[-0.02em] text-kinship-on-surface">
            Cars
          </h2>
        </div>
        <Button
          onClick={handleOpenAddCar}
          className="rounded-full text-white hover:opacity-90"
          style={{ backgroundColor: ORANGE }}
        >
          <Plus className="mr-1 h-4 w-4" /> Add Car
        </Button>
      </div>

      {/* Car list */}
      {cars.length === 0 ? (
        <div className="rounded-xl ring-miro bg-white p-8 text-center">
          <Car className="mx-auto h-10 w-10 text-kinship-on-surface-variant" />
          <p className="mt-3 font-body text-kinship-on-surface-variant">
            No cars added yet. Add your first car to start tracking.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cars.map((car) => (
            <CarCard
              key={car.id}
              car={car}
              serviceRecordCount={serviceRecords.filter((r) => r.carId === car.id).length}
              selected={selectedCarId === car.id}
              onEdit={() => handleOpenEditCar(car)}
              onDelete={() => setDeletingCarId(car.id)}
              onViewHistory={() =>
                setSelectedCarId(selectedCarId === car.id ? null : car.id)
              }
            />
          ))}
        </div>
      )}

      {/* Service history timeline */}
      {selectedCar && (
        <div className="mt-8 rounded-xl ring-miro bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-xl font-semibold text-kinship-on-surface">
                Service history — {selectedCar.make} {selectedCar.model}
              </h3>
              <p className="font-body text-sm text-kinship-on-surface-variant">
                {recordsForSelectedCar.length} record
                {recordsForSelectedCar.length === 1 ? '' : 's'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  setEditingService(null)
                  setShowAddService(true)
                }}
                className="rounded-full text-white hover:opacity-90"
                style={{ backgroundColor: ORANGE }}
              >
                <Plus className="mr-1 h-4 w-4" /> Add Service Record
              </Button>
              <Button
                variant="ghost"
                onClick={() => setSelectedCarId(null)}
                aria-label="Close service history"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {recordsForSelectedCar.length === 0 ? (
            <p className="font-body text-sm text-kinship-on-surface-variant">
              No service records yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {recordsForSelectedCar.map((record) => (
                <li
                  key={record.id}
                  className="rounded-xl border border-kinship-outline-variant bg-kinship-surface-container-lowest p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-body text-sm font-semibold text-kinship-on-surface">
                          {formatDisplayDate(record.serviceDate)}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 font-body text-xs font-medium ${SERVICE_TYPE_BADGE_CLASSES[record.serviceType]}`}
                        >
                          {SERVICE_TYPE_LABELS[record.serviceType]}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-1 gap-1 font-body text-sm text-kinship-on-surface-variant sm:grid-cols-3">
                        <div>
                          <span className="font-medium text-kinship-on-surface">Mileage: </span>
                          {record.mileage != null ? `${record.mileage.toLocaleString()} mi` : '—'}
                        </div>
                        <div>
                          <span className="font-medium text-kinship-on-surface">Garage: </span>
                          {record.garage ?? '—'}
                        </div>
                        <div>
                          <span className="font-medium text-kinship-on-surface">Cost: </span>
                          {formatCostFromCents(record.costCents)}
                        </div>
                      </div>
                      {record.notes && (
                        <p className="mt-2 font-body text-sm text-kinship-on-surface-variant">
                          {record.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setEditingService(record)
                          setShowAddService(true)
                        }}
                        aria-label="Edit service record"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeletingServiceId(record.id)}
                        aria-label="Delete service record"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Add / Edit Car Dialog */}
      <Dialog open={showAddCar} onOpenChange={setShowAddCar}>
        <DialogContent className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl ring-miro bg-white p-8">
          <DialogHeader>
            <DialogTitle className="font-display text-[28px] font-semibold leading-[1.2] tracking-[-0.02em] text-kinship-on-surface">
              {editingCar ? 'Edit car' : 'Add a car'}
            </DialogTitle>
          </DialogHeader>
          <CarForm
            key={editingCar?.id ?? 'new'}
            car={editingCar}
            onCancel={() => setShowAddCar(false)}
            onSuccess={() => {
              setShowAddCar(false)
              setEditingCar(null)
              router.refresh()
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Car Confirmation */}
      <Dialog
        open={deletingCarId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingCarId(null)
        }}
      >
        <DialogContent className="rounded-2xl ring-miro bg-white p-8">
          <DialogHeader>
            <DialogTitle className="font-display text-[28px] font-semibold leading-[1.2] tracking-[-0.02em] text-kinship-on-surface">
              Delete car?
            </DialogTitle>
          </DialogHeader>
          <p className="font-body text-base text-kinship-on-surface-variant">
            Are you sure you want to delete &ldquo;{deletingCarName}&rdquo;? All associated
            service records will also be removed. This cannot be undone.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              className="rounded-lg border-kinship-outline"
              onClick={() => setDeletingCarId(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDeleteCar}
              className="rounded-full bg-destructive text-white hover:bg-destructive/90"
            >
              Delete car
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Service Record Dialog */}
      <Dialog open={showAddService} onOpenChange={setShowAddService}>
        <DialogContent className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl ring-miro bg-white p-8">
          <DialogHeader>
            <DialogTitle className="font-display text-[28px] font-semibold leading-[1.2] tracking-[-0.02em] text-kinship-on-surface">
              {editingService ? 'Edit service record' : 'Add service record'}
            </DialogTitle>
          </DialogHeader>
          {selectedCar && (
            <ServiceRecordForm
              key={editingService?.id ?? 'new'}
              carId={selectedCar.id}
              record={editingService}
              onCancel={() => setShowAddService(false)}
              onSuccess={() => {
                setShowAddService(false)
                setEditingService(null)
                router.refresh()
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Service Record Confirmation */}
      <Dialog
        open={deletingServiceId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingServiceId(null)
        }}
      >
        <DialogContent className="rounded-2xl ring-miro bg-white p-8">
          <DialogHeader>
            <DialogTitle className="font-display text-[28px] font-semibold leading-[1.2] tracking-[-0.02em] text-kinship-on-surface">
              Delete service record?
            </DialogTitle>
          </DialogHeader>
          <p className="font-body text-base text-kinship-on-surface-variant">
            This service record will be permanently removed.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              className="rounded-lg border-kinship-outline"
              onClick={() => setDeletingServiceId(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDeleteService}
              className="rounded-full bg-destructive text-white hover:bg-destructive/90"
            >
              Delete record
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// CarCard
// ---------------------------------------------------------------------------

function CarCard({
  car,
  serviceRecordCount,
  selected,
  onEdit,
  onDelete,
  onViewHistory,
}: {
  car: SerializedCar
  serviceRecordCount: number
  selected: boolean
  onEdit: () => void
  onDelete: () => void
  onViewHistory: () => void
}) {
  return (
    <div
      className={`flex h-full flex-col rounded-xl ring-miro bg-white p-5 transition-shadow ${selected ? 'shadow-lg' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${ORANGE}1A`, color: ORANGE_DARK }}
          >
            <Car className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-kinship-on-surface">
              {car.make} {car.model}
            </h3>
            <p className="font-body text-xs text-kinship-on-surface-variant">
              {car.year} &middot; {car.plate}
            </p>
          </div>
        </div>
        {car.colour && (
          <div className="flex items-center gap-1.5">
            <span
              className="h-4 w-4 rounded-full border border-kinship-outline-variant"
              style={{ backgroundColor: car.colour }}
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      {/* Key dates */}
      <div className="mt-4 flex flex-col gap-1.5">
        <KeyDateBadge label="MOT" date={car.motDueDate} days={car.motReminderDays} />
        <KeyDateBadge label="Tax" date={car.taxDueDate} days={car.taxReminderDays} />
        <KeyDateBadge
          label="Service"
          date={car.nextServiceDate}
          days={car.serviceReminderDays}
        />
      </div>

      {/* Actions */}
      <div className="mt-5 flex items-center justify-between border-t border-kinship-outline-variant pt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewHistory}
          className="rounded-full"
        >
          <History className="mr-1 h-3.5 w-3.5" />
          {selected ? 'Hide history' : `History (${serviceRecordCount})`}
        </Button>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onEdit}
            aria-label="Edit car"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            aria-label="Delete car"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function KeyDateBadge({
  label,
  date,
  days,
}: {
  label: string
  date: string | null
  days: number
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-kinship-surface-container-lowest px-3 py-1.5">
      <span className="font-body text-xs font-medium text-kinship-on-surface">{label}</span>
      <div className="flex items-center gap-2 text-right">
        <span className="font-body text-xs text-kinship-on-surface">
          {formatDisplayDate(date)}
        </span>
        {date && (
          <span
            className="rounded-full px-1.5 py-0.5 font-body text-[10px] font-medium"
            style={{ backgroundColor: `${ORANGE}1A`, color: ORANGE_DARK }}
          >
            {days}d reminder
          </span>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// CarForm
// ---------------------------------------------------------------------------

function CarForm({
  car,
  onCancel,
  onSuccess,
}: {
  car: SerializedCar | null
  onCancel: () => void
  onSuccess: () => void
}) {
  const isEdit = car !== null
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CarFormValues>({
    resolver: zodResolver(carFormSchema),
    defaultValues: {
      make: car?.make ?? '',
      model: car?.model ?? '',
      year: car?.year ?? new Date().getFullYear(),
      plate: car?.plate ?? '',
      colour: car?.colour ?? '',
      motDueDate: isoToDateInput(car?.motDueDate ?? null),
      taxDueDate: isoToDateInput(car?.taxDueDate ?? null),
      nextServiceDate: isoToDateInput(car?.nextServiceDate ?? null),
      motReminderDays: car?.motReminderDays ?? 30,
      taxReminderDays: car?.taxReminderDays ?? 30,
      serviceReminderDays: car?.serviceReminderDays ?? 14,
    },
  })

  const colourValue = watch('colour')
  const motDueDateValue = watch('motDueDate') ?? ''
  const taxDueDateValue = watch('taxDueDate') ?? ''
  const nextServiceDateValue = watch('nextServiceDate') ?? ''
  const motReminderDaysValue = watch('motReminderDays')
  const taxReminderDaysValue = watch('taxReminderDays')
  const serviceReminderDaysValue = watch('serviceReminderDays')

  async function onSubmit(values: CarFormValues) {
    const payload = {
      make: values.make.trim(),
      model: values.model.trim(),
      year: values.year,
      plate: values.plate.trim(),
      colour: values.colour?.trim() ? values.colour.trim() : null,
      motDueDate: dateInputToIso(values.motDueDate ?? ''),
      taxDueDate: dateInputToIso(values.taxDueDate ?? ''),
      nextServiceDate: dateInputToIso(values.nextServiceDate ?? ''),
      motReminderDays: values.motReminderDays,
      taxReminderDays: values.taxReminderDays,
      serviceReminderDays: values.serviceReminderDays,
    }

    const result = isEdit
      ? await updateCar({ id: car!.id, ...payload })
      : await createCar(payload)

    if (!result.success) {
      toast.error(result.error ?? 'Failed to save car')
      return
    }
    toast.success(isEdit ? 'Car updated' : 'Car added')
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="font-body text-sm font-medium text-kinship-on-surface">Make</label>
          <input
            type="text"
            {...register('make')}
            className="rounded-lg border border-kinship-outline-variant bg-white px-3 py-2 font-body text-sm outline-none focus:border-kinship-primary focus:ring-1 focus:ring-kinship-primary"
          />
          {errors.make && (
            <span className="font-body text-xs text-destructive">{errors.make.message}</span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-body text-sm font-medium text-kinship-on-surface">Model</label>
          <input
            type="text"
            {...register('model')}
            className="rounded-lg border border-kinship-outline-variant bg-white px-3 py-2 font-body text-sm outline-none focus:border-kinship-primary focus:ring-1 focus:ring-kinship-primary"
          />
          {errors.model && (
            <span className="font-body text-xs text-destructive">{errors.model.message}</span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-body text-sm font-medium text-kinship-on-surface">Year</label>
          <input
            type="number"
            {...register('year', { valueAsNumber: true })}
            className="rounded-lg border border-kinship-outline-variant bg-white px-3 py-2 font-body text-sm outline-none focus:border-kinship-primary focus:ring-1 focus:ring-kinship-primary"
          />
          {errors.year && (
            <span className="font-body text-xs text-destructive">{errors.year.message}</span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-body text-sm font-medium text-kinship-on-surface">Plate</label>
          <input
            type="text"
            {...register('plate')}
            className="rounded-lg border border-kinship-outline-variant bg-white px-3 py-2 font-body text-sm outline-none focus:border-kinship-primary focus:ring-1 focus:ring-kinship-primary"
          />
          {errors.plate && (
            <span className="font-body text-xs text-destructive">{errors.plate.message}</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-body text-sm font-medium text-kinship-on-surface">
          Colour
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="e.g. silver, #c0c0c0"
            {...register('colour')}
            className="flex-1 rounded-lg border border-kinship-outline-variant bg-white px-3 py-2 font-body text-sm outline-none focus:border-kinship-primary focus:ring-1 focus:ring-kinship-primary"
          />
          {colourValue && (
            <span
              className="h-10 w-10 shrink-0 rounded-lg border border-kinship-outline-variant"
              style={{ backgroundColor: colourValue }}
              aria-hidden="true"
            />
          )}
        </div>
      </div>

      <div className="border-t border-kinship-outline-variant pt-4">
        <h4 className="mb-3 font-display text-base font-semibold text-kinship-on-surface">
          Key dates
        </h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label className="font-body text-sm font-medium text-kinship-on-surface">
              MOT due
            </label>
            <DatePicker
              value={motDueDateValue}
              onChange={(v) => setValue('motDueDate', v, { shouldDirty: true })}
              placeholder="Pick a date"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-body text-sm font-medium text-kinship-on-surface">
              Tax due
            </label>
            <DatePicker
              value={taxDueDateValue}
              onChange={(v) => setValue('taxDueDate', v, { shouldDirty: true })}
              placeholder="Pick a date"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-body text-sm font-medium text-kinship-on-surface">
              Next service
            </label>
            <DatePicker
              value={nextServiceDateValue}
              onChange={(v) => setValue('nextServiceDate', v, { shouldDirty: true })}
              placeholder="Pick a date"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-kinship-outline-variant pt-4">
        <h4 className="mb-3 font-display text-base font-semibold text-kinship-on-surface">
          Reminders
        </h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ReminderConfig
            label="MOT reminder"
            value={motReminderDaysValue}
            onChange={(v) => setValue('motReminderDays', v, { shouldDirty: true })}
          />
          <ReminderConfig
            label="Tax reminder"
            value={taxReminderDaysValue}
            onChange={(v) => setValue('taxReminderDays', v, { shouldDirty: true })}
          />
          <ReminderConfig
            label="Service reminder"
            value={serviceReminderDaysValue}
            onChange={(v) => setValue('serviceReminderDays', v, { shouldDirty: true })}
          />
        </div>
      </div>

      <div className="mt-2 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          className="rounded-lg border-kinship-outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="rounded-full text-white hover:opacity-90"
          style={{ backgroundColor: ORANGE }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Save changes' : 'Add car'}
        </Button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// ServiceRecordForm
// ---------------------------------------------------------------------------

function ServiceRecordForm({
  carId,
  record,
  onCancel,
  onSuccess,
}: {
  carId: string
  record: SerializedServiceRecord | null
  onCancel: () => void
  onSuccess: () => void
}) {
  const isEdit = record !== null
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      serviceDate: isoToDateInput(record?.serviceDate ?? null),
      serviceType: record?.serviceType ?? 'full_service',
      mileage: record?.mileage ?? null,
      garage: record?.garage ?? '',
      costPounds:
        record?.costCents != null ? centsToPounds(record.costCents) : null,
      notes: record?.notes ?? '',
    },
  })

  const serviceDateValue = watch('serviceDate') ?? ''

  async function onSubmit(values: ServiceFormValues) {
    const iso = dateInputToIso(values.serviceDate)
    if (!iso) {
      toast.error('Service date is required')
      return
    }

    const payload = {
      carId,
      serviceDate: iso,
      serviceType: values.serviceType,
      mileage: values.mileage ?? null,
      garage: values.garage?.trim() ? values.garage.trim() : null,
      costCents:
        values.costPounds != null && !Number.isNaN(values.costPounds)
          ? poundsToCents(values.costPounds)
          : null,
      notes: values.notes?.trim() ? values.notes.trim() : null,
    }

    const result = isEdit
      ? await updateServiceRecord({ id: record!.id, ...payload })
      : await createServiceRecord(payload)

    if (!result.success) {
      toast.error(result.error ?? 'Failed to save service record')
      return
    }
    toast.success(isEdit ? 'Service record updated' : 'Service record added')
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="font-body text-sm font-medium text-kinship-on-surface">
            Service date
          </label>
          <DatePicker
            value={serviceDateValue}
            onChange={(v) => setValue('serviceDate', v, { shouldDirty: true })}
            placeholder="Pick a date"
          />
          {errors.serviceDate && (
            <span className="font-body text-xs text-destructive">
              {errors.serviceDate.message}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-body text-sm font-medium text-kinship-on-surface">
            Service type
          </label>
          <select
            {...register('serviceType')}
            className="rounded-lg border border-kinship-outline-variant bg-white px-3 py-2 font-body text-sm outline-none focus:border-kinship-primary focus:ring-1 focus:ring-kinship-primary"
          >
            <option value="full_service">Full service</option>
            <option value="mot">MOT</option>
            <option value="repair">Repair</option>
            <option value="tyre">Tyre</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-body text-sm font-medium text-kinship-on-surface">
            Mileage (mi)
          </label>
          <input
            type="number"
            min={0}
            {...register('mileage', {
              setValueAs: (v) =>
                v === '' || v === null || v === undefined ? null : Number(v),
            })}
            className="rounded-lg border border-kinship-outline-variant bg-white px-3 py-2 font-body text-sm outline-none focus:border-kinship-primary focus:ring-1 focus:ring-kinship-primary"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-body text-sm font-medium text-kinship-on-surface">
            Cost (€)
          </label>
          <input
            type="number"
            min={0}
            step="0.01"
            {...register('costPounds', {
              setValueAs: (v) =>
                v === '' || v === null || v === undefined ? null : Number(v),
            })}
            className="rounded-lg border border-kinship-outline-variant bg-white px-3 py-2 font-body text-sm outline-none focus:border-kinship-primary focus:ring-1 focus:ring-kinship-primary"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-body text-sm font-medium text-kinship-on-surface">Garage</label>
        <input
          type="text"
          {...register('garage')}
          className="rounded-lg border border-kinship-outline-variant bg-white px-3 py-2 font-body text-sm outline-none focus:border-kinship-primary focus:ring-1 focus:ring-kinship-primary"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-body text-sm font-medium text-kinship-on-surface">Notes</label>
        <textarea
          rows={3}
          {...register('notes')}
          className="rounded-lg border border-kinship-outline-variant bg-white px-3 py-2 font-body text-sm outline-none focus:border-kinship-primary focus:ring-1 focus:ring-kinship-primary"
        />
      </div>

      <div className="mt-2 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          className="rounded-lg border-kinship-outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="rounded-full text-white hover:opacity-90"
          style={{ backgroundColor: ORANGE }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Save changes' : 'Add record'}
        </Button>
      </div>
    </form>
  )
}
