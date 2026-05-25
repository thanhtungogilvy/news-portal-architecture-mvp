export interface BatchFailureAlertInput {
  batchId: string
  batchStatus: string
  publishedCount: number
  failedItems: Array<{ source_url: string, last_error: string | null, attempt_count: number }>
}

// ---------------------------------------------------------------------------
// Send a consolidated failure alert via Resend REST API (no SDK required)
// ---------------------------------------------------------------------------
export async function sendBatchFailureAlert(input: BatchFailureAlertInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM ?? 'News Portal <noreply@example.com>'
  const to = process.env.ADMIN_EMAIL

  if (!apiKey || !to) {
    console.warn('[import-alert] RESEND_API_KEY or ADMIN_EMAIL not set — skipping alert')
    return
  }

  const { batchId, batchStatus, publishedCount, failedItems } = input
  const failedCount = failedItems.length
  const totalItems = publishedCount + failedCount

  const itemRows = failedItems
    .map(
      (item, i) =>
        `<tr>
          <td style="padding:4px 8px;border:1px solid #e5e7eb">${i + 1}</td>
          <td style="padding:4px 8px;border:1px solid #e5e7eb;word-break:break-all">${escapeHtml(item.source_url)}</td>
          <td style="padding:4px 8px;border:1px solid #e5e7eb">${item.attempt_count}</td>
          <td style="padding:4px 8px;border:1px solid #e5e7eb">${escapeHtml(item.last_error ?? '—')}</td>
        </tr>`,
    )
    .join('\n')

  const statusLabel: Record<string, string> = {
    completed: 'Completed',
    completed_with_failures: 'Completed with failures',
    failed: 'Failed',
  }
  const statusColor: Record<string, string> = {
    completed: '#16a34a',
    completed_with_failures: '#d97706',
    failed: '#dc2626',
  }
  const label = statusLabel[batchStatus] ?? batchStatus
  const color = statusColor[batchStatus] ?? '#6b7280'

  const failureTable = failedCount > 0
    ? `
<h3 style="margin-top:16px">Failed items (${failedCount})</h3>
<table style="border-collapse:collapse;width:100%;font-size:13px">
  <thead>
    <tr style="background:#f3f4f6">
      <th style="padding:4px 8px;border:1px solid #e5e7eb">#</th>
      <th style="padding:4px 8px;border:1px solid #e5e7eb">URL</th>
      <th style="padding:4px 8px;border:1px solid #e5e7eb">Attempts</th>
      <th style="padding:4px 8px;border:1px solid #e5e7eb">Last Error</th>
    </tr>
  </thead>
  <tbody>
    ${itemRows}
  </tbody>
</table>`
    : ''

  const html = `
<p>Import batch <strong>${escapeHtml(batchId)}</strong> has finished.</p>
<p>Status: <strong style="color:${color}">${label}</strong></p>
<ul style="font-size:14px">
  <li>Published: <strong>${publishedCount}</strong></li>
  <li>Failed: <strong>${failedCount}</strong></li>
  <li>Total: <strong>${totalItems}</strong></li>
</ul>
${failureTable}
`

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `[News Portal] Import batch ${batchId.slice(0, 8)} — ${label}`,
      html,
    }),
    signal: AbortSignal.timeout(10_000),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Resend API ${response.status}: ${body}`)
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
