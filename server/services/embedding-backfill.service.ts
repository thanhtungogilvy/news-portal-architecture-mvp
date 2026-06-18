export interface EmbeddingJobLike {
  article_id: string
  status: string
}

/**
 * Return published article IDs that still need embedding jobs.
 * Excludes articles that already have a completed/processing job.
 */
export function selectArticleIdsToEnqueue(
  publishedArticleIds: string[],
  existingJobs: EmbeddingJobLike[],
): string[] {
  const alreadyQueued = new Set(
    existingJobs
      .filter(job => job.status === 'completed' || job.status === 'processing')
      .map(job => job.article_id),
  )

  return publishedArticleIds.filter(id => !alreadyQueued.has(id))
}
