import type { BadgeColor } from '@/components/ui/badge'

export const severityBadge: Record<string, { color: BadgeColor; label: string }> = {
  critical: { color: 'danger', label: 'Critical' },
  high: { color: 'warning', label: 'High' },
  medium: { color: 'info', label: 'Medium' },
  low: { color: 'neutral', label: 'Low' },
}

export function issueStatusBadge(
  state?: string | null,
  stateReason?: string | null,
): { color: BadgeColor; label: string } {
  if (state === 'open') return { color: 'success', label: 'Open' }
  if (state === 'closed') {
    return stateReason === 'not_planned'
      ? { color: 'neutral', label: 'Closed' }
      : { color: 'primary', label: 'Resolved' }
  }
  return { color: 'neutral', label: '—' }
}

const divisions: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: 'seconds' },
  { amount: 60, unit: 'minutes' },
  { amount: 24, unit: 'hours' },
  { amount: 7, unit: 'days' },
  { amount: 4.34524, unit: 'weeks' },
  { amount: 12, unit: 'months' },
  { amount: Number.POSITIVE_INFINITY, unit: 'years' },
]

const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return ''
  let duration = (new Date(iso).getTime() - Date.now()) / 1000
  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) {
      return relativeFormatter.format(Math.round(duration), division.unit)
    }
    duration /= division.amount
  }
  return ''
}

export function absoluteTime(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
