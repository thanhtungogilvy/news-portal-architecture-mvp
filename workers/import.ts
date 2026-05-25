import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { processImportItems, processBatchAlerts } from '../lib/background/import/service.ts'
import type { Database } from '../app/types/database.types.ts'

const pollMs = Number(process.env.IMPORT_WORKER_POLL_MS ?? '10000')
const batchSize = Number(process.env.IMPORT_WORKER_BATCH_SIZE ?? '5')
// Alert check runs every N ticks to avoid hammering the DB
const alertEveryTicks = Number(process.env.IMPORT_WORKER_ALERT_INTERVAL_TICKS ?? '6')

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NUXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing SUPABASE_URL/NUXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY/SUPABASE_SERVICE_ROLE_KEY')
}

const client = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

let shuttingDown = false
let tickCount = 0

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function tick() {
  tickCount += 1

  const result = await processImportItems(client, batchSize)
  if (result.claimed > 0) {
    console.warn('[worker:import]', result)
  }

  // Run alert check every N ticks
  if (tickCount % alertEveryTicks === 0) {
    await processBatchAlerts(client)
  }
}

async function run() {
  console.warn('[worker:import] started', { pollMs, batchSize })

  while (!shuttingDown) {
    try {
      await tick()
    }
    catch (error) {
      console.error('[worker:import] tick failed', error)
    }

    if (!shuttingDown) {
      await sleep(pollMs)
    }
  }

  console.warn('[worker:import] stopped')
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    shuttingDown = true
  })
}

await run()
