// deno-lint-ignore-file no-explicit-any
// Supabase Edge Function: gte-small embedding wrapper (384 dims).
//
// Invoked from server-side code only (service-role or request-scoped client).
// Deployed with --no-verify-jwt because it is never called from the browser.
//
// Docs: https://supabase.com/docs/guides/ai/quickstarts/generate-text-embeddings

const session = new (globalThis as any).Supabase.ai.Session('gte-small')

// @ts-ignore — Deno global is available at runtime on Supabase Edge Runtime.
Deno.serve(async (req: Request) => {
  try {
    const { input } = (await req.json()) as { input: string | string[] }

    if (Array.isArray(input)) {
      const embeddings = await Promise.all(
        input.map((t) => session.run(t, { mean_pool: true, normalize: true }))
      )
      return Response.json({ embeddings })
    }

    const embedding = await session.run(input, { mean_pool: true, normalize: true })
    return Response.json({ embedding })
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Embedding failed' },
      { status: 500 }
    )
  }
})
