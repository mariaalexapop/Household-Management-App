'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Monitor,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
} from 'lucide-react'
import { formatDistanceToNowStrict, parseISO, isBefore } from 'date-fns'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { FileUploadZone } from '@/components/tracker/FileUploadZone'
import { DocumentList } from '@/components/tracker/DocumentList'
import { formatCostFromCents, poundsToCents, centsToPounds } from '@/lib/format'
import { createItem, updateItem, deleteItem } from '@/app/actions/electronics'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SerializedElectronicsItem {
  id: string
  householdId: string
  name: string
  brand: string | null
  modelNumber: string | null
  purchaseDate: string | null
  costCents: number | null
  warrantyExpiryDate: string | null
  coverageSummary: string | null
  createdBy: string
  createdAt: string | null
}

export interface SerializedDocument {
  id: string
  householdId: string
  module: string
  entityId: string
  documentType: string
  fileName: string
  storagePath: string
  fileSizeBytes: number | null
  uploadedBy: string
  createdAt: string
}

interface ElectronicsClientProps {
  items: SerializedElectronicsItem[]
  documents: SerializedDocument[]
}

// ---------------------------------------------------------------------------
// Form schema (UI-level — costPounds string, dates as yyyy-MM-dd)
// ---------------------------------------------------------------------------

const itemFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  brand: z.string().max(100).optional(),
  modelNumber: z.string().max(100).optional(),
  purchaseDate: z.string().optional(), // yyyy-MM-dd
  costPounds: z.string().optional(),
  warrantyExpiryDate: z.string().optional(), // yyyy-MM-dd
  coverageSummary: z.string().max(1000).optional(),
})

type ItemFormValues = z.infer<typeof itemFormSchema>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert yyyy-MM-dd to ISO string with offset (midnight local). */
function toIsoOrNull(dateStr: string | undefined): string | null {
  if (!dateStr) return null
  const d = new Date(`${dateStr}T00:00:00Z`)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

/** Convert ISO string to yyyy-MM-dd for the date picker. */
function toDateInput(iso: string | null): string {
  if (!iso) return ''
  const d = parseISO(iso)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

function warrantyStatus(iso: string | null): {
  label: string
  icon: typeof ShieldCheck
  className: string
} {
  if (!iso) {
    return {
      label: 'No warranty',
      icon: ShieldOff,
      className: 'text-kinship-on-surface-variant',
    }
  }
  const expiry = parseISO(iso)
  if (isNaN(expiry.getTime())) {
    return {
      label: 'No warranty',
      icon: ShieldOff,
      className: 'text-kinship-on-surface-variant',
    }
  }
  const now = new Date()
  if (isBefore(expiry, now)) {
    return {
      label: 'Warranty expired',
      icon: ShieldAlert,
      className: 'text-red-600',
    }
  }
  return {
    label: `Warranty expires in ${formatDistanceToNowStrict(expiry)}`,
    icon: ShieldCheck,
    className: 'text-[#0d9488]',
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = parseISO(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ElectronicsClient({
  items: initialItems,
  documents: initialDocuments,
}: ElectronicsClientProps) {
  const router = useRouter()
  const [items] = useState(initialItems)
  const [documents, setDocuments] = useState(initialDocuments)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SerializedElectronicsItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SerializedElectronicsItem | null>(null)
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Group documents by entityId for fast lookup
  const docsByItemId = useMemo(() => {
    const map = new Map<string, SerializedDocument[]>()
    for (const doc of documents) {
      const arr = map.get(doc.entityId) ?? []
      arr.push(doc)
      map.set(doc.entityId, arr)
    }
    return map
  }, [documents])

  const openAdd = () => {
    setEditingItem(null)
    setDialogOpen(true)
  }

  const openEdit = (item: SerializedElectronicsItem) => {
    setEditingItem(item)
    setDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    const result = await deleteItem({ id: deleteTarget.id })
    if (result.success) {
      toast.success('Item deleted')
      setDeleteTarget(null)
      router.refresh()
    } else {
      toast.error(result.error ?? 'Failed to delete item')
    }
  }

  const handleUploadComplete = useCallback(
    (item: SerializedElectronicsItem, docType: 'warranty' | 'manual') =>
      (doc: { id: string; fileName: string }) => {
        // Optimistically add document so it shows immediately
        const newDoc: SerializedDocument = {
          id: doc.id,
          householdId: item.householdId,
          module: 'electronics',
          entityId: item.id,
          documentType: docType,
          fileName: doc.fileName,
          storagePath: '',
          fileSizeBytes: null,
          uploadedBy: '',
          createdAt: new Date().toISOString(),
        }
        setDocuments((prev) => [newDoc, ...prev])
        router.refresh()
      },
    [router]
  )

  const handleDeleteDocument = useCallback(
    (docId: string) => {
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
      router.refresh()
    },
    [router]
  )

  // ---- Submit handler passed to the dialog ----
  const handleSubmit = async (values: ItemFormValues) => {
    setIsSubmitting(true)
    try {
      const costPoundsTrim = values.costPounds?.trim() ?? ''
      const costCents =
        costPoundsTrim.length > 0 ? poundsToCents(Number(costPoundsTrim)) : null
      if (costPoundsTrim.length > 0 && (costCents === null || Number.isNaN(costCents))) {
        toast.error('Cost must be a valid number')
        return
      }

      const payload = {
        name: values.name.trim(),
        brand: values.brand?.trim() || null,
        modelNumber: values.modelNumber?.trim() || null,
        purchaseDate: toIsoOrNull(values.purchaseDate),
        costCents,
        warrantyExpiryDate: toIsoOrNull(values.warrantyExpiryDate),
        coverageSummary: values.coverageSummary?.trim() || null,
      }

      const result = editingItem
        ? await updateItem({ id: editingItem.id, ...payload })
        : await createItem(payload)

      if (result.success) {
        toast.success(editingItem ? 'Item updated' : 'Item added')
        setDialogOpen(false)
        setEditingItem(null)
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to save item')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      {/* Page header: teal accent bar + title + Add button */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <h2 className="font-display text-[32px] font-semibold leading-[1.2] tracking-[-0.02em] text-kinship-on-surface border-l-4 border-[#0d9488] pl-3">
          Electronics
        </h2>
        <Button
          onClick={openAdd}
          className="bg-[#0d9488] text-white hover:bg-[#0f766e] h-10 px-4 gap-2 rounded-full"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Empty state */}
      {items.length === 0 ? (
        <div className="rounded-xl ring-miro bg-white p-12 text-center">
          <Monitor className="mx-auto mb-3 h-10 w-10 text-kinship-on-surface-variant" />
          <p className="font-display text-lg font-semibold text-kinship-on-surface">
            No electronics items yet
          </p>
          <p className="mt-1 font-body text-sm text-kinship-on-surface-variant">
            Add your first item to start tracking warranties and manuals.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const status = warrantyStatus(item.warrantyExpiryDate)
            const StatusIcon = status.icon
            const itemDocs = docsByItemId.get(item.id) ?? []
            const isExpanded = expandedItemId === item.id

            return (
              <div
                key={item.id}
                className="rounded-xl ring-miro bg-white p-5 flex flex-col gap-3"
              >
                {/* Header row: icon + name + brand/model */}
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-[#0d9488]/10 p-2 text-[#0d9488]">
                    <Monitor className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-base font-semibold text-kinship-on-surface truncate">
                      {item.name}
                    </h3>
                    {(item.brand || item.modelNumber) && (
                      <p className="font-body text-xs text-kinship-on-surface-variant truncate">
                        {[item.brand, item.modelNumber].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Purchase + cost */}
                <div className="flex items-center justify-between font-body text-sm">
                  <span className="text-kinship-on-surface-variant">
                    {formatDate(item.purchaseDate)}
                  </span>
                  <span className="font-medium text-kinship-on-surface">
                    {formatCostFromCents(item.costCents)}
                  </span>
                </div>

                {/* Warranty status */}
                <div className={`flex items-center gap-2 font-body text-xs ${status.className}`}>
                  <StatusIcon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{status.label}</span>
                </div>

                {/* Coverage summary (truncated, expandable via the item) */}
                {item.coverageSummary && (
                  <p
                    className={`font-body text-xs text-kinship-on-surface-variant ${
                      isExpanded ? '' : 'line-clamp-2'
                    }`}
                  >
                    {item.coverageSummary}
                  </p>
                )}

                {/* Actions */}
                <div className="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-kinship-surface-container">
                  <button
                    type="button"
                    onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                    className="flex items-center gap-1 font-body text-xs text-kinship-on-surface-variant hover:text-[#0d9488]"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Hide docs
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Documents ({itemDocs.length})
                      </>
                    )}
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="rounded-lg p-1.5 text-kinship-on-surface-variant hover:bg-kinship-surface-container hover:text-[#0d9488]"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      className="rounded-lg p-1.5 text-kinship-on-surface-variant hover:bg-red-50 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Documents section (expanded) */}
                {isExpanded && (
                  <div className="mt-2 space-y-3 border-t border-kinship-surface-container pt-3">
                    <div>
                      <p className="mb-2 font-display text-xs font-semibold text-kinship-on-surface">
                        Warranty Document
                      </p>
                      <FileUploadZone
                        module="electronics"
                        entityId={item.id}
                        documentType="warranty"
                        onUploadComplete={handleUploadComplete(item, 'warranty')}
                      />
                    </div>
                    <div>
                      <p className="mb-2 font-display text-xs font-semibold text-kinship-on-surface">
                        User Manual
                      </p>
                      <FileUploadZone
                        module="electronics"
                        entityId={item.id}
                        documentType="manual"
                        onUploadComplete={handleUploadComplete(item, 'manual')}
                      />
                    </div>
                    <div>
                      <p className="mb-2 font-display text-xs font-semibold text-kinship-on-surface">
                        Uploaded documents
                      </p>
                      <DocumentList
                        documents={itemDocs.map((d) => ({
                          id: d.id,
                          fileName: d.fileName,
                          documentType: d.documentType,
                          createdAt: d.createdAt,
                        }))}
                        onDelete={handleDeleteDocument}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit dialog */}
      <ItemDialog
        open={dialogOpen}
        onOpenChange={(v) => {
          setDialogOpen(v)
          if (!v) setEditingItem(null)
        }}
        editingItem={editingItem}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Delete confirmation */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete electronics item?</DialogTitle>
          </DialogHeader>
          <p className="font-body text-sm text-kinship-on-surface-variant">
            This will permanently delete{' '}
            <span className="font-medium text-kinship-on-surface">
              {deleteTarget?.name}
            </span>{' '}
            and any uploaded documents. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="h-9 px-4"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              className="h-9 px-4 bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Add / Edit dialog (extracted so RHF resets cleanly on open)
// ---------------------------------------------------------------------------

interface ItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingItem: SerializedElectronicsItem | null
  onSubmit: (values: ItemFormValues) => Promise<void>
  isSubmitting: boolean
}

function ItemDialog({
  open,
  onOpenChange,
  editingItem,
  onSubmit,
  isSubmitting,
}: ItemDialogProps) {
  const defaultValues: ItemFormValues = useMemo(
    () => ({
      name: editingItem?.name ?? '',
      brand: editingItem?.brand ?? '',
      modelNumber: editingItem?.modelNumber ?? '',
      purchaseDate: toDateInput(editingItem?.purchaseDate ?? null),
      costPounds:
        editingItem?.costCents != null
          ? String(centsToPounds(editingItem.costCents))
          : '',
      warrantyExpiryDate: toDateInput(editingItem?.warrantyExpiryDate ?? null),
      coverageSummary: editingItem?.coverageSummary ?? '',
    }),
    [editingItem]
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues,
  })

  // Reset form whenever dialog opens for a different item
  const openKey = `${open}-${editingItem?.id ?? 'new'}`
  useMemo(() => {
    reset(defaultValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openKey])

  const purchaseDate = watch('purchaseDate') ?? ''
  const warrantyExpiryDate = watch('warrantyExpiryDate') ?? ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingItem ? 'Edit item' : 'Add electronics item'}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="e.g. Samsung TV"
              {...register('name')}
              className="mt-1"
            />
            {errors.name && (
              <p className="mt-1 font-body text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" {...register('brand')} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="modelNumber">Model number</Label>
              <Input id="modelNumber" {...register('modelNumber')} className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Purchase date</Label>
              <div className="mt-1">
                <DatePicker
                  value={purchaseDate}
                  onChange={(v) => setValue('purchaseDate', v, { shouldDirty: true })}
                  placeholder="Pick a date"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="costPounds">Cost (€)</Label>
              <Input
                id="costPounds"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register('costPounds')}
                className="mt-1"
              />
            </div>
          </div>

          <div className="rounded-lg bg-[#0d9488]/5 p-3">
            <div>
              <Label>Warranty expiry date</Label>
              <div className="mt-1">
                <DatePicker
                  value={warrantyExpiryDate}
                  onChange={(v) =>
                    setValue('warrantyExpiryDate', v, { shouldDirty: true })
                  }
                  placeholder="Pick a date"
                />
              </div>
              <p className="mt-1 font-body text-xs text-kinship-on-surface-variant">
                You&apos;ll receive a reminder 30 days before warranty expires.
              </p>
            </div>
            <div className="mt-3">
              <Label htmlFor="coverageSummary">Coverage summary</Label>
              <textarea
                id="coverageSummary"
                {...register('coverageSummary')}
                rows={3}
                className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 font-body text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="e.g. 2-year manufacturer warranty, parts and labour"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-9 px-4 bg-[#0d9488] text-white hover:bg-[#0f766e]"
            >
              {isSubmitting ? 'Saving...' : editingItem ? 'Save changes' : 'Add item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
