'use client'

import { useCallback, useRef, useState } from 'react'
import { Upload, X, FileText, Loader2, Check, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type IntakeActionType = 'create_insurance' | 'create_electronics' | 'create_car' | 'create_task' | 'store_for_rag'

interface AnalyzedAction {
  type: IntakeActionType
  description: string
  data: Record<string, unknown>
}

interface AnalysisResult {
  summary: string
  actions: AnalyzedAction[]
  fileName: string
}

type Stage = 'idle' | 'open' | 'analyzing' | 'review' | 'executing' | 'done'

export function SmartIntakeBanner() {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [description, setDescription] = useState('')
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setStage('idle')
    setFile(null)
    setDescription('')
    setAnalysis(null)
    setIsDragging(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleFile = useCallback((f: File) => {
    const maxSize = 10 * 1024 * 1024
    if (f.size > maxSize) { toast.error('File must be 10 MB or smaller'); return }
    setFile(f)
    if (stage === 'idle') setStage('open')
  }, [stage])

  const handleAnalyze = async () => {
    if (!description.trim() && !file) {
      toast.error('Add a file or describe what you want to do')
      return
    }

    setStage('analyzing')
    try {
      const formData = new FormData()
      if (file) formData.append('file', file)
      if (description.trim()) formData.append('description', description.trim())

      const res = await fetch('/api/intake/analyze', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Analysis failed')
      }

      const result: AnalysisResult = await res.json()
      setAnalysis(result)
      setStage('review')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed')
      setStage('open')
    }
  }

  const handleConfirm = async () => {
    if (!analysis) return
    setStage('executing')

    try {
      const formData = new FormData()
      formData.append('actions', JSON.stringify(analysis.actions))
      if (file) formData.append('file', file)

      const res = await fetch('/api/intake/execute', { method: 'POST', body: formData })
      const result = await res.json()

      if (result.success) {
        setStage('done')
        toast.success('Done! Records created successfully.')
        setTimeout(() => { reset(); router.refresh() }, 1500)
      } else if (result.results) {
        const failed = result.results.filter((r: { ok: boolean; error?: string }) => !r.ok)
        const succeeded = result.results.filter((r: { ok: boolean }) => r.ok).length
        if (succeeded > 0) {
          setStage('done')
          toast.success(`${succeeded} action(s) completed. ${failed.length > 0 ? `${failed.length} skipped.` : ''}`)
          setTimeout(() => { reset(); router.refresh() }, 1500)
        } else {
          toast.error(`Actions failed: ${failed.map((r: { error?: string }) => r.error).join(', ')}`)
          setStage('review')
        }
      } else {
        toast.error(result.error ?? 'Execution failed')
        setStage('review')
      }
    } catch {
      toast.error('Something went wrong')
      setStage('review')
    }
  }

  const ACTION_LABELS: Record<string, string> = {
    create_insurance: 'Create insurance policy',
    create_electronics: 'Register electronics',
    create_car: 'Register car',
    create_task: 'Create task',
    store_for_rag: 'Store for AI Q&A',
  }

  const ACTION_COLORS: Record<string, string> = {
    create_insurance: 'bg-purple-100 text-purple-700',
    create_electronics: 'bg-green-100 text-green-700',
    create_car: 'bg-orange-100 text-orange-700',
    create_task: 'bg-blue-100 text-blue-700',
    store_for_rag: 'bg-teal-100 text-teal-700',
  }

  // Collapsed banner
  if (stage === 'idle') {
    return (
      <button
        type="button"
        onClick={() => setStage('open')}
        className="group flex w-full items-center gap-3 rounded-xl bg-kinship-primary-surface px-3.5 py-3 text-left hover:bg-kinship-primary/10 transition-colors"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-kinship-primary text-white">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display text-[13px] font-semibold text-kinship-primary">Smart intake</div>
          <div className="font-body text-[11px] text-kinship-on-surface-variant">Drop a receipt, photo or PDF — describe it and Kinship files it for you.</div>
        </div>
        <span className="shrink-0 rounded-full bg-white/70 px-2.5 py-0.5 font-body text-[10.5px] font-semibold text-kinship-primary group-hover:bg-white transition-colors">
          + Add
        </span>
      </button>
    )
  }

  return (
    <div className="rounded-xl bg-white ring-miro overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-kinship-surface-container px-4 py-2.5">
        <Sparkles className="h-3.5 w-3.5 text-kinship-primary" />
        <span className="font-display text-[13px] font-semibold text-kinship-on-surface">
          {stage === 'review' ? 'Review actions' : stage === 'done' ? 'Done!' : 'Smart intake'}
        </span>
        <span className="flex-1" />
        {stage !== 'executing' && stage !== 'done' && (
          <button onClick={reset} className="rounded-md p-1 text-kinship-placeholder hover:bg-kinship-surface-container hover:text-kinship-on-surface transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Input stage */}
        {(stage === 'open' || stage === 'analyzing') && (
          <>
            {/* File drop zone */}
            <div
              className={`relative flex items-center gap-3 rounded-lg border-2 border-dashed p-3 transition-colors ${
                isDragging ? 'border-kinship-primary bg-kinship-primary/5' : file ? 'border-kinship-primary/30 bg-kinship-primary-surface/30' : 'border-kinship-outline-variant'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
            >
              {file ? (
                <>
                  <FileText className="h-5 w-5 shrink-0 text-kinship-primary" />
                  <div className="flex-1 min-w-0">
                    <div className="font-body text-[12px] font-medium text-kinship-on-surface truncate">{file.name}</div>
                    <div className="font-body text-[10px] text-kinship-placeholder">{(file.size / 1024).toFixed(0)} KB</div>
                  </div>
                  <button
                    onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = '' }}
                    className="rounded p-0.5 text-kinship-placeholder hover:text-kinship-on-surface"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => inputRef.current?.click()} className="flex flex-1 items-center gap-2 text-left">
                  <Upload className="h-4 w-4 text-kinship-placeholder" />
                  <span className="font-body text-[12px] text-kinship-placeholder">Drop file or click to browse (PDF, max 10 MB)</span>
                </button>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf,image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
            </div>

            {/* Description */}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell Kinship what this is... e.g. 'This is my home insurance from Allianz, renews in December, €400/year'"
              className="w-full rounded-lg border border-kinship-outline-variant bg-kinship-surface px-3 py-2 font-body text-[12px] text-kinship-on-surface placeholder:text-kinship-placeholder resize-none focus:outline-none focus:ring-1 focus:ring-kinship-primary"
              rows={2}
              disabled={stage === 'analyzing'}
            />

            {/* Analyze button */}
            <div className="flex justify-end">
              <button
                onClick={handleAnalyze}
                disabled={stage === 'analyzing' || (!description.trim() && !file)}
                className="flex items-center gap-2 rounded-lg bg-kinship-primary px-4 py-2 font-body text-[12px] font-semibold text-white disabled:opacity-50 hover:bg-kinship-primary/90 transition-colors"
              >
                {stage === 'analyzing' ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" />Analyzing...</>
                ) : (
                  <><Sparkles className="h-3.5 w-3.5" />Analyze</>
                )}
              </button>
            </div>
          </>
        )}

        {/* Review stage */}
        {stage === 'review' && analysis && (
          <>
            <p className="font-body text-[12px] text-kinship-on-surface-variant">{analysis.summary}</p>

            <div className="space-y-2">
              {analysis.actions.map((action, i) => (
                <div key={i} className="flex items-start gap-2.5 rounded-lg bg-kinship-surface px-3 py-2.5">
                  <span className={`shrink-0 rounded-md px-1.5 py-0.5 font-body text-[9px] font-semibold uppercase ${ACTION_COLORS[action.type] ?? 'bg-gray-100 text-gray-600'}`}>
                    {ACTION_LABELS[action.type] ?? action.type}
                  </span>
                  <p className="font-body text-[11px] text-kinship-on-surface leading-relaxed">{action.description}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setStage('open')}
                className="rounded-lg border border-kinship-outline-variant px-3 py-1.5 font-body text-[12px] text-kinship-on-surface-variant hover:bg-kinship-surface-container transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleConfirm}
                className="flex items-center gap-1.5 rounded-lg bg-kinship-primary px-4 py-1.5 font-body text-[12px] font-semibold text-white hover:bg-kinship-primary/90 transition-colors"
              >
                <Check className="h-3.5 w-3.5" />
                Confirm & create
              </button>
            </div>
          </>
        )}

        {/* Executing */}
        {stage === 'executing' && (
          <div className="flex items-center gap-2 py-2">
            <Loader2 className="h-4 w-4 animate-spin text-kinship-primary" />
            <span className="font-body text-[12px] text-kinship-on-surface-variant">Creating records...</span>
          </div>
        )}

        {/* Done */}
        {stage === 'done' && (
          <div className="flex items-center gap-2 py-2">
            <Check className="h-4 w-4 text-green-600" />
            <span className="font-body text-[12px] text-green-700 font-medium">All done! Records created.</span>
          </div>
        )}
      </div>
    </div>
  )
}
