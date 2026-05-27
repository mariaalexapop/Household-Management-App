/**
 * POST /api/intake/analyze
 *
 * Smart document intake: user uploads a file + describes what it is.
 * AI analyzes the description (and extracted text for PDFs) to determine
 * what actions to take.
 *
 * Returns a structured action plan for the client to confirm.
 */
import { generateText } from 'ai'
import { groq } from '@ai-sdk/groq'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { householdMembers } from '@/lib/db/schema'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    const [member] = await db
      .select({ householdId: householdMembers.householdId })
      .from(householdMembers)
      .where(eq(householdMembers.userId, user.id))
      .limit(1)
    if (!member) return new Response('No household', { status: 403 })

    const formData = await req.formData()
    const description = formData.get('description') as string | null
    const file = formData.get('file') as File | null

    if (!description && !file) {
      return Response.json({ error: 'Provide a description or file' }, { status: 400 })
    }

    // Extract text from PDF if provided
    let fileText = ''
    let fileName = ''
    if (file) {
      fileName = file.name
      if (file.type === 'application/pdf') {
        try {
          const buf = Buffer.from(await file.arrayBuffer())
          await import('pdf-parse/worker')
          const { PDFParse } = await import('pdf-parse')
          const parser = new PDFParse({ data: buf })
          try {
            const result = await parser.getText()
            fileText = result.text?.slice(0, 3000) ?? ''
          } finally {
            await parser.destroy().catch(() => {})
          }
        } catch (pdfErr) {
          console.warn('[intake/analyze] PDF parsing failed, continuing with description only:', pdfErr)
        }
      }
    }

    const prompt = `You are a household management assistant. A user is uploading a document to their household app.

User's description: "${description ?? '(no description provided)'}"
File name: "${fileName || '(no file)'}"
${fileText ? `\nExtracted document text (first 3000 chars):\n${fileText}` : ''}

Based on this, determine what actions should be taken. Possible actions:

1. create_insurance — if it's an insurance policy, extract: insurer, policyType (home/car/health/life/travel/other), policyNumber, expiryDate (ISO), premiumCents (integer), paymentSchedule (monthly/quarterly/annual), coveredName
2. create_electronics — if it's a receipt/warranty for an appliance: name, brand, modelNumber, purchaseDate (ISO), costCents (integer), warrantyExpiryDate (ISO), coverageSummary
3. create_car — if it's car-related registration: make, model, year, plate, colour, motDueDate (ISO), taxDueDate (ISO)
4. create_task — if something needs to be done: title, notes, startsAt (ISO)
5. store_for_rag — if the document should be stored for later Q&A (manuals, guides, contracts). Include: module (insurance/electronics), documentType (policy/warranty/manual)

Return one or more actions. For example, an insurance document might trigger both create_insurance AND store_for_rag.
Only include fields you can confidently extract. Use null for unknown fields.
For dates, use ISO format. For costs, convert to cents (integer).

You MUST respond with ONLY a valid JSON object in this exact format, no other text:
{
  "summary": "One-sentence summary of what the document is",
  "actions": [
    {
      "type": "create_insurance|create_electronics|create_car|create_task|store_for_rag",
      "description": "Human-readable description of what this action will do",
      "data": { "field": "value" }
    }
  ]
}`

    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt,
    })

    // Parse JSON from the response — handle markdown code blocks
    let jsonStr = text.trim()
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim()
    }

    const parsed = JSON.parse(jsonStr)

    // Validate basic structure
    if (!parsed.summary || !Array.isArray(parsed.actions)) {
      return Response.json({ error: 'AI returned invalid format' }, { status: 500 })
    }

    return Response.json({ ...parsed, fileName })
  } catch (err) {
    console.error('[intake/analyze] Error:', err)
    return Response.json(
      { error: err instanceof Error ? err.message : 'Analysis failed' },
      { status: 500 }
    )
  }
}
