import dayjs from 'dayjs'

export function formatNewsDate(iso: string | null) {
  if (!iso) return ''
  return dayjs(iso).format('DD/MM/YYYY')
}

export function formatCompactViewCount(count: number) {
  if (count < 1000) return `${count}`
  if (count < 1_000_000) return formatWithSuffix(count / 1000, 'K')
  if (count < 1_000_000_000) return formatWithSuffix(count / 1_000_000, 'M')
  return formatWithSuffix(count / 1_000_000_000, 'B')
}

export function formatViewCount(count: number) {
  return new Intl.NumberFormat('vi-VN').format(count)
}

function formatWithSuffix(value: number, suffix: string) {
  const normalized = value < 100
    ? Math.floor(value * 10) / 10
    : Math.floor(value)

  return Number.isInteger(normalized)
    ? `${normalized}${suffix}`
    : `${normalized.toFixed(1)}${suffix}`
}

export function estimateReadTime(content: string): number {
  return Math.max(1, Math.ceil(content.split(/\s+/).length / 200))
}
