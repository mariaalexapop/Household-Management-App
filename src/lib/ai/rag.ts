/**
 * Retrieval helpers for the Phase 5 RAG chatbot.
 *
 * `retrieveTopChunks` embeds the query with the shared `embed` Edge Function
 * and runs a cosine-distance nearest-neighbour search against the
 * `document_chunks` table. The ORDER BY uses the raw `cosineDistance()`
 * expression in ASC order so Postgres can use the HNSW index with
 * `vector_cosine_ops` — ordering by `(1 - distance) DESC` would bypass the
 * index (Pitfall 2 in the Phase 5 research notes).
 */
import { and, asc, cosineDistance, eq, sql } from 'drizzle-orm'

import { db } from '@/lib/db'
import { documentChunks } from '@/lib/db/schema'

import { embedText } from './embed'

export interface RetrievedChunk {
  id: string
  content: string
  documentId: string
  distance: number
}

export async function retrieveTopChunks(args: {
  householdId: string
  query: string
  k: number
  documentId?: string
}): Promise<RetrievedChunk[]> {
  const queryEmbedding = await embedText(args.query)

  // CRITICAL: use the raw cosineDistance expression in ORDER BY so the HNSW
  // index is picked up. Do NOT wrap it in (1 - distance) — that disables the
  // index scan and falls back to a sequential scan.
  const distanceExpr = cosineDistance(documentChunks.embedding, queryEmbedding)
  // `cosineDistance` returns an SQL expression whose inferred type is
  // `unknown`; we know at runtime it is a double precision, so we use a
  // typed `sql<number>` wrapper for the SELECT column.
  const distance = sql<number>`${distanceExpr}`

  const whereClause = args.documentId
    ? and(
        eq(documentChunks.householdId, args.householdId),
        eq(documentChunks.documentId, args.documentId)
      )
    : eq(documentChunks.householdId, args.householdId)

  const rows = await db
    .select({
      id: documentChunks.id,
      content: documentChunks.content,
      documentId: documentChunks.documentId,
      distance,
    })
    .from(documentChunks)
    .where(whereClause)
    .orderBy(asc(distanceExpr))
    .limit(args.k)

  return rows
}
