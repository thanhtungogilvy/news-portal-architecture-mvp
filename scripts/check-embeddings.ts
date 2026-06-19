/**
 * scripts/check-embeddings.ts
 *
 * Monitor embedding progress and verify which model embedded articles.
 *
 * Usage:
 *   npx jiti scripts/check-embeddings.ts
 *   npx jiti scripts/check-embeddings.ts --watch   (refresh every 5s)
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'node:path'

config({ path: resolve(process.cwd(), '.env') })  // load .env from project root

const url = process.env.NUXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_KEY!
const client = createClient(url, key)

const isWatch = process.argv.includes('--watch')

async function check() {
  // 1. Total published articles
  const { count: totalArticles } = await client
    .from('news')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')

  // 2. Embedding model distribution
  const { data: embeddings } = await client
    .from('article_embeddings')
    .select('embedding_model')

  const modelCounts: Record<string, number> = {}
  for (const r of embeddings ?? []) {
    const m = r.embedding_model ?? 'unknown'
    modelCounts[m] = (modelCounts[m] ?? 0) + 1
  }
  const totalEmbedded = embeddings?.length ?? 0

  // 3. Job queue status
  const { data: jobs } = await client
    .from('embedding_jobs')
    .select('status')

  const jobCounts: Record<string, number> = {}
  for (const r of jobs ?? []) {
    jobCounts[r.status] = (jobCounts[r.status] ?? 0) + 1
  }

  // 4. Latest 3 embedded articles
  const { data: latest } = await client
    .from('article_embeddings')
    .select('updated_at, embedding_model, article_id')
    .order('updated_at', { ascending: false })
    .limit(3)

  // ─── Print ────────────────────────────────────────────────────────────────
  console.clear()
  console.log('═══════════════════════════════════════════════════')
  console.log('  Embedding Monitor  ', new Date().toLocaleTimeString())
  console.log('═══════════════════════════════════════════════════')
  console.log(`\n  Published articles : ${totalArticles}`)
  console.log(`  Total embeddings   : ${totalEmbedded}`)
  const coverage = totalArticles ? Math.round((totalEmbedded / totalArticles) * 100) : 0
  const bar = '█'.repeat(Math.round(coverage / 5)) + '░'.repeat(20 - Math.round(coverage / 5))
  console.log(`  Coverage           : [${bar}] ${coverage}%`)

  console.log('\n  ── Model Distribution ────────────────────────────')
  if (Object.keys(modelCounts).length === 0) {
    console.log('  (no embeddings yet)')
  }
  else {
    for (const [model, count] of Object.entries(modelCounts)) {
      const pct = totalEmbedded ? Math.round((count / totalEmbedded) * 100) : 0
      const indicator = pct === 100 ? ' ✓' : pct > 0 ? ' ↻' : ''
      console.log(`  ${count.toString().padStart(4)} articles  →  ${model}${indicator}`)
    }
  }

  console.log('\n  ── Job Queue ─────────────────────────────────────')
  if (Object.keys(jobCounts).length === 0) {
    console.log('  (no jobs in queue)')
  }
  else {
    for (const [status, count] of Object.entries(jobCounts)) {
      const icon = status === 'completed' ? '✓' : status === 'pending' ? '⏳' : status === 'processing' ? '⚙' : '✗'
      console.log(`  ${icon}  ${status.padEnd(12)} ${count}`)
    }
  }

  console.log('\n  ── Latest Embedded ───────────────────────────────')
  for (const r of latest ?? []) {
    const time = new Date(r.updated_at).toLocaleTimeString()
    console.log(`  ${time}  ${r.embedding_model}`)
  }

  if (isWatch) {
    console.log('\n  (watching — Ctrl+C to stop)\n')
  }
}

if (isWatch) {
  check()
  setInterval(check, 5000)
}
else {
  check().then(() => process.exit(0))
}
