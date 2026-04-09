'use client'

import { useCallback, useState } from 'react'
import { FileText, ExternalLink, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getDownloadUrl, deleteDocument } from '@/app/actions/documents'

interface DocumentItem {
  id: string
  fileName: string
  documentType: string
  createdAt: string
}

interface DocumentListProps {
  documents: DocumentItem[]
  onDelete?: (docId: string) => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function typeBadgeLabel(type: string): string {
  switch (type) {
    case 'policy':
      return 'Policy'
    case 'warranty':
      return 'Warranty'
    case 'manual':
      return 'Manual'
    default:
      return type
  }
}

export function DocumentList({ documents: docs, onDelete }: DocumentListProps) {
  const [loadingDownload, setLoadingDownload] = useState<string | null>(null)
  const [loadingDelete, setLoadingDelete] = useState<string | null>(null)

  const handleDownload = useCallback(async (docId: string) => {
    setLoadingDownload(docId)
    try {
      const result = await getDownloadUrl({ documentId: docId })
      if (!result.success || !result.data) {
        toast.error(result.error ?? 'Failed to get download URL')
        return
      }
      window.open(result.data.url, '_blank', 'noopener,noreferrer')
    } catch {
      toast.error('Failed to download document')
    } finally {
      setLoadingDownload(null)
    }
  }, [])

  const handleDelete = useCallback(
    async (docId: string) => {
      setLoadingDelete(docId)
      try {
        const result = await deleteDocument({ documentId: docId })
        if (!result.success) {
          toast.error(result.error ?? 'Failed to delete document')
          return
        }
        toast.success('Document deleted')
        onDelete?.(docId)
      } catch {
        toast.error('Failed to delete document')
      } finally {
        setLoadingDelete(null)
      }
    },
    [onDelete]
  )

  if (docs.length === 0) {
    return (
      <p className="py-6 text-center font-body text-sm text-kinship-on-surface-variant">
        No documents uploaded yet
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {docs.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center gap-3 rounded-xl bg-kinship-surface-container-lowest p-3 ring-miro"
        >
          <FileText className="h-5 w-5 shrink-0 text-kinship-on-surface-variant" />

          <div className="min-w-0 flex-1">
            <p className="truncate font-body text-sm font-medium text-kinship-on-surface">
              {doc.fileName}
            </p>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="inline-block rounded-md bg-kinship-surface-container px-1.5 py-0.5 font-body text-xs text-kinship-on-surface-variant">
                {typeBadgeLabel(doc.documentType)}
              </span>
              <span className="font-body text-xs text-kinship-on-surface-variant">
                {formatDate(doc.createdAt)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleDownload(doc.id)}
            disabled={loadingDownload === doc.id}
            className="rounded-lg p-1.5 text-kinship-on-surface-variant transition-colors hover:bg-kinship-surface-container hover:text-kinship-primary disabled:opacity-50"
            title="Download"
          >
            {loadingDownload === doc.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
          </button>

          {onDelete && (
            <button
              type="button"
              onClick={() => handleDelete(doc.id)}
              disabled={loadingDelete === doc.id}
              className="rounded-lg p-1.5 text-kinship-on-surface-variant transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              title="Delete"
            >
              {loadingDelete === doc.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
