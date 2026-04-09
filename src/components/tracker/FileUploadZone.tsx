'use client'

import { useCallback, useRef, useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getUploadUrl, confirmUpload } from '@/app/actions/documents'
import { createClient } from '@/lib/supabase/client'

interface FileUploadZoneProps {
  module: 'insurance' | 'electronics'
  entityId: string
  documentType: 'policy' | 'warranty' | 'manual'
  onUploadComplete: (doc: { id: string; fileName: string }) => void
  disabled?: boolean
}

const MAX_FILE_SIZE = 10485760 // 10 MB

export function FileUploadZone({
  module,
  entityId,
  documentType,
  onUploadComplete,
  disabled = false,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    async (file: File) => {
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are allowed')
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error('File must be 10 MB or smaller')
        return
      }

      setIsUploading(true)

      try {
        // 1. Get signed upload URL from server
        const urlResult = await getUploadUrl({
          module,
          entityId,
          fileName: file.name,
          fileSizeBytes: file.size,
        })

        if (!urlResult.success || !urlResult.data) {
          toast.error(urlResult.error ?? 'Failed to get upload URL')
          return
        }

        const { token, path } = urlResult.data

        // 2. Upload file to Supabase Storage via browser client
        const supabase = createClient()
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .uploadToSignedUrl(path, token, file)

        if (uploadError) {
          toast.error(uploadError.message ?? 'Upload failed')
          return
        }

        // 3. Confirm upload in database
        const confirmResult = await confirmUpload({
          module,
          entityId,
          documentType,
          fileName: file.name,
          storagePath: path,
          fileSizeBytes: file.size,
        })

        if (!confirmResult.success || !confirmResult.data) {
          toast.error(confirmResult.error ?? 'Failed to confirm upload')
          return
        }

        toast.success('Document uploaded')
        onUploadComplete({ id: confirmResult.data.id, fileName: file.name })
      } catch {
        toast.error('An unexpected error occurred during upload')
      } finally {
        setIsUploading(false)
        // Reset file input so the same file can be re-selected
        if (inputRef.current) inputRef.current.value = ''
      }
    },
    [module, entityId, documentType, onUploadComplete]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const isDisabled = disabled || isUploading

  return (
    <div
      role="button"
      tabIndex={0}
      className={[
        'relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors',
        isDragging
          ? 'border-kinship-primary bg-kinship-primary/5'
          : 'border-kinship-outline-variant bg-kinship-surface-container',
        isDisabled ? 'pointer-events-none opacity-50' : 'hover:border-kinship-primary/40',
      ].join(' ')}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isDisabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          if (!isDisabled) inputRef.current?.click()
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleInputChange}
        disabled={isDisabled}
      />

      {isUploading ? (
        <>
          <Loader2 className="mb-2 h-8 w-8 animate-spin text-kinship-primary" />
          <p className="font-body text-sm text-kinship-on-surface-variant">Uploading...</p>
        </>
      ) : (
        <>
          <Upload className="mb-2 h-8 w-8 text-kinship-on-surface-variant" />
          <p className="font-body text-sm text-kinship-on-surface-variant">
            Drop PDF here or click to browse
          </p>
          <p className="mt-1 font-body text-xs text-kinship-on-surface-variant/60">
            Max 10 MB
          </p>
        </>
      )}
    </div>
  )
}
