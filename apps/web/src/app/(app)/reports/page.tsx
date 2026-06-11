'use client'

import { ChatBubbleLeftIcon, ChevronRightIcon, InboxIcon } from '@heroicons/react/20/solid'
import { motion } from 'motion/react'

import { issueRef, useIssueStatuses, useMyReports } from '@report/api'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { Heading, Text } from '@/components/ui/text'
import { issueStatusBadge, relativeTime, severityBadge } from '@/lib/format'

function SkeletonRows() {
  return (
    <ul className="divide-y divide-border-subtle">
      {[0, 1, 2].map((i) => (
        <li key={i} className="animate-pulse px-5 py-4">
          <div className="h-4 w-2/3 rounded bg-surface-sunken" />
          <div className="mt-2 h-3 w-1/3 rounded bg-surface-sunken" />
        </li>
      ))}
    </ul>
  )
}

export default function MyReportsPage() {
  const { data: reports, isLoading, error } = useMyReports()
  const refs = (reports ?? [])
    .filter((report) => report.githubIssueNumber != null)
    .map((report) => issueRef(report.repo, report.githubIssueNumber as number))
  const { data: statuses } = useIssueStatuses(refs)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Heading>My reports</Heading>
      <Text className="mt-1">
        Everything you&apos;ve filed, with live status from the development team.
      </Text>

      <section className="mt-6 overflow-hidden rounded-2xl border border-border-subtle bg-surface-base">
        {isLoading ? (
          <SkeletonRows />
        ) : error ? (
          <p className="px-5 py-8 text-center text-sm text-danger-600 dark:text-danger-300">
            Could not load your reports. Please reload.
          </p>
        ) : !reports || reports.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <InboxIcon className="size-10 text-content-tertiary" />
            <p className="mt-3 text-sm font-medium text-content-secondary">No reports yet</p>
            <p className="mt-1 text-sm text-content-tertiary">
              When you file an issue it will show up here with its status.
            </p>
            <div className="mt-5">
              <Button href="/">Report an issue</Button>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {reports.map((report) => {
              const severity = severityBadge[report.severity] ?? severityBadge.low
              const status =
                report.githubIssueNumber != null
                  ? statuses?.[issueRef(report.repo, report.githubIssueNumber)]
                  : undefined
              const statusInfo = issueStatusBadge(status?.state, status?.stateReason)
              return (
                <li key={report.id}>
                  <Link
                    href={`/reports/${report.id}`}
                    className="group flex items-center gap-4 px-5 py-4 transition data-hover:bg-surface-raised"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-content-primary">
                        {report.title}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-content-tertiary">
                        <span>{report.repo.split('/')[1] ?? report.repo}</span>
                        {report.githubIssueNumber ? (
                          <span>· #{report.githubIssueNumber}</span>
                        ) : null}
                        <span>· {relativeTime(report.createdAt)}</span>
                        {status?.commentCount ? (
                          <span className="inline-flex items-center gap-0.5">
                            · <ChatBubbleLeftIcon className="size-3" /> {status.commentCount}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <Badge color={severity.color}>{severity.label}</Badge>
                    {status ? <Badge color={statusInfo.color}>{statusInfo.label}</Badge> : null}
                    <ChevronRightIcon className="size-4 shrink-0 text-content-tertiary transition group-data-hover:text-content-secondary" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </motion.div>
  )
}
