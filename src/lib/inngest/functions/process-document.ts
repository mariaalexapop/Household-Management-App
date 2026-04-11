import { eq } from 'drizzle-orm'
import type { SupabaseClient } from '@supabase/supabase-js'
import { inngest } from '@/lib/inngest/client'
import { db } from '@/lib/db'
import { documents, documentChunks, notifications } from '@/lib/db/schema'
import { createAdminClient } from '@/lib/supabase/admin'
import { embedBatch } from '@/lib/ai/embed'

/**
 * Inngest function: process-document
 *
 * Triggered by the 'documents/uploaded' event (emitted from confirmUpload).
 * Chains the full RAG ingestion pipeline for a PDF:
 *   1. Download PDF bytes from Supabase Storage (admin client)
 *   2. Extract text with pdf-parse v2 (dynamic import to avoid serverless
 *      bundler breakage — see Phase 5 research Pitfall 1).
 *   3. Chunk text at 1000 chars with 200 char overlap
 *   4. Embed each batch via gte-small Edge Function
 *   5. Insert chunks into document_chunks table
 *   6. Mark the source document ready_for_rag = true
 *   7. Insert a 'document_ready' in-app notification for the uploader
 *
 * Each pipeline phase runs in its own step.run() so failures retry
 * independently without re-downloading / re-parsing the whole PDF.
 */

const CHUNK_SIZE = 1000
const CHUNK_OVERLAP = 200
const EMBED_BATCH_SIZE = 32

export const processDocument = inngest.createFunction(
  {
    id: 'process-document',
    name: 'Process Document for RAG',
    retries: 3,
    concurrency: { limit: 5 },
    triggers: [{ event: 'documents/uploaded' }],
  },
  async ({
    event,
    step,
  }: {
    event: {
      data: {
        documentId: string
        householdId: string
        storagePath: string
        uploadedBy: string
      }
    }
    step: any
  }) => {
    const { documentId, householdId, storagePath, uploadedBy } = event.data

    // 1. Download PDF bytes. Base64 is used because step.run() return values
    //    must be JSON-serialisable — Buffers are not.
    const pdfBase64: string = await step.run('download-pdf', async () => {
      const admin = createAdminClient()
      const { data, error } = await admin.storage.from('documents').download(storagePath)
      if (error || !data) {
        throw new Error(`Download failed: ${error?.message ?? 'empty response'}`)
      }
      const buf = Buffer.from(await data.arrayBuffer())
      return buf.toString('base64')
    })

    // 2. Extract text with pdf-parse v2. IMPORTANT: dynamic import is required
    //    and the worker entry MUST be loaded before the main module to avoid
    //    the Node.js worker bootstrap failing in serverless bundles.
    const fullText: string = await step.run('extract-text', async () => {
      // Load the worker entry first (side-effect), then the main module.
      await import('pdf-parse/worker')
      const { PDFParse } = await import('pdf-parse')
      const parser = new PDFParse({ data: Buffer.from(pdfBase64, 'base64') })
      try {
        const result = await parser.getText()
        return result.text ?? ''
      } finally {
        await parser.destroy().catch(() => {})
      }
    })

    // 3. Chunk 1000 chars / 200 overlap (sync — wrapped in step for retry/log)
    const chunks: string[] = await step.run('chunk-text', async () =>
      chunkText(fullText, CHUNK_SIZE, CHUNK_OVERLAP)
    )

    // Edge case: PDF contained no extractable text (e.g. scanned image).
    // Still mark the document ready and notify the user so they aren't left
    // watching a spinner forever.
    if (chunks.length === 0) {
      await step.run('mark-empty-doc-ready', async () => {
        await db
          .update(documents)
          .set({ readyForRag: true })
          .where(eq(documents.id, documentId))
        await db.insert(notifications).values({
          householdId,
          userId: uploadedBy,
          type: 'document_ready',
          entityId: documentId,
          message: 'Document processed (no text found)',
        })
      })
      return { documentId, chunks: 0 }
    }

    // 4. Batch embed + insert. Each batch is its own step so one flaky
    //    embedding call doesn't force a full re-run.
    const batches = batch(chunks, EMBED_BATCH_SIZE)
    let insertedCount = 0

    for (let i = 0; i < batches.length; i++) {
      const batchChunks = batches[i]
      const startIndex = insertedCount
      await step.run(`embed-batch-${i}`, async () => {
        // Use admin client inside Inngest — there are no cookies to bind to
        // a server client, and we want to bypass RLS entirely.
        const admin = createAdminClient() as unknown as SupabaseClient
        const embeddings = await embedBatch(batchChunks, admin)
        await db.insert(documentChunks).values(
          batchChunks.map((content, j) => ({
            householdId,
            documentId,
            chunkIndex: startIndex + j,
            content,
            embedding: embeddings[j],
          }))
        )
      })
      insertedCount += batchChunks.length
    }

    // 5. Mark ready + notify
    await step.run('mark-ready-and-notify', async () => {
      await db
        .update(documents)
        .set({ readyForRag: true })
        .where(eq(documents.id, documentId))

      await db.insert(notifications).values({
        householdId,
        userId: uploadedBy,
        type: 'document_ready',
        entityId: documentId,
        message: 'Your document is ready for AI chat',
      })
    })

    return { documentId, chunks: chunks.length }
  }
)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Sliding-window character chunker.
 * Collapses all whitespace first so chunk boundaries aren't disturbed by
 * PDF-extracted line breaks, then walks the string at `size - overlap`.
 */
function chunkText(raw: string, size: number, overlap: number): string[] {
  const clean = raw.replace(/\s+/g, ' ').trim()
  if (!clean) return []
  if (clean.length <= size) return [clean]
  const stride = size - overlap
  const out: string[] = []
  let i = 0
  while (i < clean.length) {
    out.push(clean.slice(i, i + size))
    if (i + size >= clean.length) break
    i += stride
  }
  return out
}

function batch<T>(arr: T[], n: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}
