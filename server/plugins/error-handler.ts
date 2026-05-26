import { isError } from 'h3'

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('error', (error, { event }) => {
    if (!event) return

    if (isError(error) && (error.data as { error?: { code?: string } } | undefined)?.error?.code) {
      if (error.statusCode >= 500) {
        console.error('[server] H3Error:', {
          statusCode: error.statusCode,
          statusMessage: error.statusMessage,
          message: error.message,
          data: error.data,
        })
      }
      return
    }

    console.error('[server] Unhandled error:', error)

    const response = JSON.stringify({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    })

    if (!event.node.res.headersSent) {
      event.node.res.statusCode = 500
      event.node.res.setHeader('Content-Type', 'application/json')
      event.node.res.end(response)
    }
  })
})
