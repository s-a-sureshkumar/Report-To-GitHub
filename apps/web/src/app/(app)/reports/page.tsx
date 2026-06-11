'use client'

import Link from 'next/link'

import clsx from 'clsx'

import { useMyReports } from '@report/api'

const severityStyles: Record<string, string> = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-zinc-100 text-zinc-600',
}

export default function MyReportsPage() {
  const { data: reports, isLoading, error } = useMyReports()

  if (isLoading) {
    return <p className="text-sm text-zinc-500">Loading your reports…</p>
  }

  if (error) {
    return <p className="text-sm text-red-600">Could not load your reports. Please reload.</p>
  }

  if (!reports || reports.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
        <p className="text-sm text-zinc-500">You haven&apos;t submitted any reports yet.</p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          Report an issue
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-lg font-semibold">My reports</h1>
      <ul className="mt-4 divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white">
        {reports.map((report) => (
          <li key={report.id} className="flex items-start justify-between gap-4 p-4">
            <div>
              <p className="text-sm font-medium">{report.title}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {report.repo}
                {report.githubIssueNumber ? ` · issue #${report.githubIssueNumber}` : ''}
                {report.createdAt ? ` · ${new Date(report.createdAt).toLocaleString()}` : ''}
              </p>
            </div>
            <span
              className={clsx(
                'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
                severityStyles[report.severity] ?? severityStyles.low,
              )}
            >
              {report.severity}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
