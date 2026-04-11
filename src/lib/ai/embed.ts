/**
 * Embedding helpers — wrap the Supabase `embed` Edge Function (gte-small, 384 dims).
 *
 * Both helpers accept an optional SupabaseClient so callers can pass either the
 * request-scoped server client (route handlers) or the admin client (Inngest
 * jobs) without cookies/RLS getting in the way. When no client is supplied the
 * request-scoped server client is used.
 *
 * Inputs are sanitized: whitespace collapsed and capped at 8000 chars. This
 * avoids sending giant PDF pages to the model, keeps indexing and retrieval
 * using identical preprocessing, and prevents the "embedding mismatch" pitfall
 * from the Phase 5 research notes.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const MAX_INPUT_CHARS = 8000

function sanitize(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, MAX_INPUT_CHARS)
}

async function getInvoker(client?: SupabaseClient): Promise<SupabaseClient> {
  if (client) return client
  return (await createServerClient()) as unknown as SupabaseClient
}

export async function embedText(
  text: string,
  client?: SupabaseClient
): Promise<number[]> {
  const supabase = await getInvoker(client)
  const { data, error } = await supabase.functions.invoke('embed', {
    body: { input: sanitize(text) },
  })
  if (error || !data?.embedding) {
    throw new Error(
      `embedText failed: ${error?.message ?? 'no embedding returned'}`
    )
  }
  return data.embedding as number[]
}

export async function embedBatch(
  texts: string[],
  client?: SupabaseClient
): Promise<number[][]> {
  if (texts.length === 0) return []
  const supabase = await getInvoker(client)
  const { data, error } = await supabase.functions.invoke('embed', {
    body: { input: texts.map(sanitize) },
  })
  if (error || !Array.isArray(data?.embeddings)) {
    throw new Error(
      `embedBatch failed: ${error?.message ?? 'no embeddings returned'}`
    )
  }
  return data.embeddings as number[][]
}
