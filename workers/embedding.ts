import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { processPendingEmbeddingJobs } from '../lib/background/embedding/service.ts'
import type { Database } from '../app/types/database.types.ts'

const pollMs = Number(process.env.EMBEDDING_WORKER_POLL_MS ?? '5000')
const batchSize = Number(process.env.EMBEDDING_WORKER_BATCH_SIZE ?? '10')

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

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function tick() {
  const result = await processPendingEmbeddingJobs(client, batchSize)
  if (result.claimed > 0) {
    console.warn('[worker:embedding]', result)
  }
}

async function run() {
  console.warn('[worker:embedding] started', { pollMs, batchSize })

  while (!shuttingDown) {
    try {
      await tick()
    }
    catch (error) {
      console.error('[worker:embedding] tick failed', error)
    }

    if (!shuttingDown) {
      await sleep(pollMs)
    }
  }

  console.warn('[worker:embedding] stopped')
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    shuttingDown = true
  })
}

run()
