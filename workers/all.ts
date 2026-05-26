import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { processPendingViewCountJobs } from '../lib/background/view-count/service.ts'
import { processImportItems, processBatchAlerts, recoverStuckImportItems } from '../lib/background/import/service.ts'
import type { Database } from '../app/types/database.types.ts'

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NUXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing SUPABASE_URL/NUXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY/SUPABASE_SERVICE_ROLE_KEY')
}

const client = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ── Config ────────────────────────────────────────────────────────────────────
const viewCountPollMs = Number(process.env.VIEW_COUNT_WORKER_POLL_MS ?? '2000')
const viewCountBatchSize = Number(process.env.VIEW_COUNT_WORKER_BATCH_SIZE ?? '25')

const importPollMs = Number(process.env.IMPORT_WORKER_POLL_MS ?? '10000')
const importBatchSize = Number(process.env.IMPORT_WORKER_BATCH_SIZE ?? '5')
const alertEveryTicks = Number(process.env.IMPORT_WORKER_ALERT_INTERVAL_TICKS ?? '6')

// ── Shared state ──────────────────────────────────────────────────────────────
let shuttingDown = false

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── View-count loop ───────────────────────────────────────────────────────────
async function runViewCount() {
  console.warn('[worker:view-count] started', { pollMs: viewCountPollMs, batchSize: viewCountBatchSize })

  while (!shuttingDown) {
    try {
      const result = await processPendingViewCountJobs(client, viewCountBatchSize)
      if (result.claimed > 0) console.warn('[worker:view-count]', result)
    }
    catch (error) {
      console.error('[worker:view-count] tick failed', error)
    }

    if (!shuttingDown) await sleep(viewCountPollMs)
  }

  console.warn('[worker:view-count] stopped')
}

// ── Import loop ───────────────────────────────────────────────────────────────
async function runImport() {
  console.warn('[worker:import] started', { pollMs: importPollMs, batchSize: importBatchSize })
  let tickCount = 0

  while (!shuttingDown) {
    try {
      tickCount += 1

      const recovered = await recoverStuckImportItems(client)
      if (recovered > 0) console.warn(`[worker:import] recovered ${recovered} stuck item(s)`)

      const result = await processImportItems(client, importBatchSize)
      if (result.claimed > 0) console.warn('[worker:import]', result)

      if (tickCount % alertEveryTicks === 0) await processBatchAlerts(client)
    }
    catch (error) {
      console.error('[worker:import] tick failed', error)
    }

    if (!shuttingDown) await sleep(importPollMs)
  }

  console.warn('[worker:import] stopped')
}

// ── Graceful shutdown ─────────────────────────────────────────────────────────
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    shuttingDown = true
  })
}

// ── Run both loops concurrently in one process ────────────────────────────────
await Promise.all([runViewCount(), runImport()])
