export type ViewCountJobErrorCode =
  | 'NEWS_NOT_FOUND'
  | 'INSERT_FAILED'
  | 'CLAIM_FAILED'
  | 'MARK_FAILED'
  | 'INCREMENT_FAILED'

export class ViewCountJobError extends Error {
  public readonly code: ViewCountJobErrorCode

  constructor(
    code: ViewCountJobErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'ViewCountJobError'
    this.code = code
  }
}
