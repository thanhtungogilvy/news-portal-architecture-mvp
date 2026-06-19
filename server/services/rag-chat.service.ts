import type { H3Event } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { embed, chat } from './ai/lmstudio.provider'
import { searchByEmbedding } from '../repositories/search.repository'
import { buildRagContext } from './rag-context.service'
import { mapNews } from '~/utils/mappers/news'
import { mapCategory } from '~/utils/mappers/category'
import type { NewsDto } from '~/types/news'

const RAG_MATCH_COUNT = 5

const FALLBACK_FOLLOW_UPS = [
  'Bạn muốn tìm hiểu thêm về chủ đề này?',
  'Có điều gì khác bạn muốn biết không?',
  'Bạn có muốn xem thêm bài viết liên quan không?',
]

export interface ChatArticleCard {
  title: string
  slug: string
  thumbnailUrl: string | null
  summary: string | null
}

export interface RagChatResult {
  answer: string
  articles: ChatArticleCard[]
  followUpQuestions: [string, string, string]
}

function buildSystemPrompt(context: string): string {
  return `You are a news assistant for Verdana News portal.
Your task is to answer questions based ONLY on the article context provided below.
Do NOT use any external knowledge or facts not present in the context.
Respond in the same language as the user's question (Vietnamese or English).
If the context does not contain sufficient information to answer the question, clearly state that you don't have enough information from the available articles.

Article context:
${context}

---
IMPORTANT: At the very end of your response, on its own line, include exactly this JSON object with 3 follow-up questions:
{"followUpQuestions": ["question 1", "question 2", "question 3"]}
The questions should be relevant to the answer and in the same language as the user's question.`
}

/**
 * Parse the follow-up questions JSON from the last non-empty line of the response.
 * Returns null if parsing fails.
 */
function parseFollowUpQuestions(raw: string): [string, string, string] | null {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]!
    if (!line.startsWith('{')) continue
    try {
      const parsed = JSON.parse(line) as { followUpQuestions?: unknown }
      const questions = parsed?.followUpQuestions
      if (
        Array.isArray(questions)
        && questions.length >= 3
        && questions.slice(0, 3).every(q => typeof q === 'string')
      ) {
        return questions.slice(0, 3) as [string, string, string]
      }
    } catch {
      // continue searching
    }
  }
  return null
}

/**
 * Strip the follow-up questions JSON from the end of the response to get the clean answer.
 */
function extractAnswer(raw: string): string {
  const lines = raw.split('\n')
  // Remove trailing lines that are the JSON block
  while (lines.length > 0) {
    const last = lines[lines.length - 1]!.trim()
    if (last.startsWith('{"followUpQuestions"') || last === '') {
      lines.pop()
    } else {
      break
    }
  }
  return lines.join('\n').trim()
}

/**
 * Run the full RAG pipeline for a user chat message.
 * 1. Embed the query
 * 2. Retrieve top-5 articles via pgvector
 * 3. Build context string
 * 4. Call LM Studio chat with system prompt + user message
 * 5. Parse answer and follow-up questions
 * 6. Return structured result
 */
export async function ragChat(event: H3Event, message: string): Promise<RagChatResult> {
  const serviceClient = await serverSupabaseServiceRole(event)

  // 1. Embed the user query
  const queryEmbedding = await embed(message)

  // 2. Search for top-5 similar articles
  const searchResults = await searchByEmbedding(serviceClient, queryEmbedding, 0.1)
  const topResults = searchResults.slice(0, RAG_MATCH_COUNT)

  // 3. Fetch full article data
  let articles: NewsDto[] = []
  if (topResults.length > 0) {
    const articleIds = topResults.map(r => r.article_id)
    const { data, error } = await serviceClient
      .from('news')
      .select('*, categories(*)')
      .in('id', articleIds)
      .eq('status', 'published')

    if (!error && data) {
      articles = data.map((row) => {
        const category = row.categories
          ? mapCategory(row.categories as Parameters<typeof mapCategory>[0])
          : null
        return mapNews(row, category)
      })
    }
  }

  // 4. Build RAG context
  const context = articles.length > 0
    ? buildRagContext(articles)
    : 'No articles available for this topic.'

  // 5. Call LM Studio chat
  const systemPrompt = buildSystemPrompt(context)
  const rawResponse = await chat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: message },
  ])

  // 6. Parse answer and follow-up questions
  const followUpQuestions = parseFollowUpQuestions(rawResponse)
    ?? (FALLBACK_FOLLOW_UPS as [string, string, string])

  const answer = extractAnswer(rawResponse)

  // 7. Build article cards from retrieved articles
  const articleCards: ChatArticleCard[] = articles.map(a => ({
    title: a.title,
    slug: a.slug,
    thumbnailUrl: a.thumbnailUrl,
    summary: a.summary,
  }))

  return { answer, articles: articleCards, followUpQuestions }
}
