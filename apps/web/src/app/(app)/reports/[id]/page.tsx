'use client'

import { use, useState } from 'react'

import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  UserCircleIcon,
} from '@heroicons/react/20/solid'
import { motion } from 'motion/react'

import { useIssueDetail, useReport } from '@report/api'

import { Badge } from '@/components/ui/badge'
import { Dialog, DialogBody, DialogTitle } from '@/components/ui/dialog'
import { Link } from '@/components/ui/link'
import { Heading, Text } from '@/components/ui/text'
import { absoluteTime, issueStatusBadge, relativeTime, severityBadge } from '@/lib/format'
import { useScreenshotUrls } from '@/lib/screenshots'

function ReportSection({ title, body }: { title: string; body?: string | null }) {
  if (!body) return null
  return (
    <div>
      <h3 className="text-xs font-semibold tracking-wider text-content-tertiary uppercase">
        {title}
      </h3>
      <p className="mt-1.5 text-sm/6 whitespace-pre-wrap text-content-secondary">{body}</p>
    </div>
  )
}

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: report, isLoading, error } = useReport(id)
  const issue = useIssueDetail(
    report?.repo,
    report?.githubIssueNumber == null ? undefined : report.githubIssueNumber,
  )
  const { data: screenshotUrls } = useScreenshotUrls(report?.screenshotKeys)
  const [lightbox, setLightbox] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-24 rounded bg-surface-sunken" />
        <div className="h-7 w-2/3 rounded bg-surface-sunken" />
        <div className="h-40 rounded-2xl bg-surface-sunken" />
      </div>
    )
  }

  if (error || !report) {
    return (
      <div>
        <Link href="/reports" className="text-sm text-content-link">
          ← Back to my reports
        </Link>
        <p className="mt-6 text-sm text-danger-600 dark:text-danger-300">
          Could not load this report.
        </p>
      </div>
    )
  }

  const severity = severityBadge[report.severity] ?? severityBadge.low
  const status = issueStatusBadge(issue.data?.state, issue.data?.stateReason)
  const teamComments = issue.data?.comments?.filter((comment) => comment != null) ?? []
  const screenshots = (report.screenshotKeys ?? []).filter(
    (key): key is string => typeof key === 'string' && key.length > 0,
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href="/reports"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-content-tertiary transition data-hover:text-content-secondary"
      >
        <ArrowLeftIcon className="size-4" />
        My reports
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Heading>{report.title}</Heading>
          <p className="mt-1.5 text-xs text-content-tertiary">
            {report.repo}
            {report.githubIssueNumber ? ` · issue #${report.githubIssueNumber}` : ''} · submitted{' '}
            {absoluteTime(report.createdAt)}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Badge color={severity.color}>{severity.label}</Badge>
          {issue.data ? <Badge color={status.color}>{status.label}</Badge> : null}
        </div>
      </div>

      <section className="mt-6 space-y-5 rounded-2xl border border-border-subtle bg-surface-base p-5">
        <ReportSection title="Description" body={report.description} />
        <ReportSection title="Steps to reproduce" body={report.stepsToReproduce} />
        <div className="grid gap-5 sm:grid-cols-2">
          <ReportSection title="Expected behavior" body={report.expectedBehavior} />
          <ReportSection title="Actual behavior" body={report.actualBehavior} />
        </div>
        {screenshots.length > 0 ? (
          <div>
            <h3 className="text-xs font-semibold tracking-wider text-content-tertiary uppercase">
              Screenshots
            </h3>
            <ul className="mt-2 flex flex-wrap gap-3">
              {screenshots.map((key) => (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => setLightbox(screenshotUrls?.[key] ?? null)}
                    className="block overflow-hidden rounded-lg border border-border-subtle transition hover:border-border-strong"
                  >
                    {screenshotUrls?.[key] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={screenshotUrls[key]}
                        alt="Screenshot"
                        className="size-24 object-cover"
                      />
                    ) : (
                      <span className="block size-24 animate-pulse bg-surface-sunken" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-border-subtle bg-surface-base">
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <h2 className="flex items-center gap-2 text-xs font-semibold tracking-wider text-content-tertiary uppercase">
            <ChatBubbleLeftRightIcon className="size-4" />
            Updates from the team
          </h2>
          <button
            type="button"
            onClick={() => void issue.refetch()}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-content-tertiary transition hover:bg-surface-raised hover:text-content-secondary"
          >
            <ArrowPathIcon className={issue.isFetching ? 'size-3.5 animate-spin' : 'size-3.5'} />
            Refresh
          </button>
        </div>

        {report.githubIssueNumber == null ? (
          <Text className="px-5 py-8 text-center">This report has no linked issue.</Text>
        ) : issue.isLoading ? (
          <div className="animate-pulse space-y-3 px-5 py-6">
            <div className="h-3 w-1/3 rounded bg-surface-sunken" />
            <div className="h-3 w-2/3 rounded bg-surface-sunken" />
          </div>
        ) : issue.error ? (
          <Text className="px-5 py-8 text-center">Could not load the issue status.</Text>
        ) : (
          <div className="divide-y divide-border-subtle">
            {issue.data?.state === 'closed' ? (
              <div className="flex items-center gap-2 bg-success-50 px-5 py-3 text-sm text-success-800 dark:bg-success-900/20 dark:text-success-200">
                <CheckCircleIcon className="size-4 shrink-0" />
                {issue.data.stateReason === 'not_planned'
                  ? 'The team closed this report as not planned'
                  : 'The team resolved this report'}
                {issue.data.closedAt ? ` ${relativeTime(issue.data.closedAt)}` : ''}.
              </div>
            ) : null}
            {teamComments.length === 0 ? (
              <Text className="px-5 py-8 text-center">
                No updates yet — the team will reply here when they pick this up.
              </Text>
            ) : (
              teamComments.map((comment, index) => (
                <div key={index} className="flex gap-3 px-5 py-4">
                  <UserCircleIcon className="size-8 shrink-0 text-content-tertiary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-semibold text-content-primary">{comment.author}</span>{' '}
                      <span className="text-xs text-content-tertiary">
                        {relativeTime(comment.createdAt)}
                      </span>
                    </p>
                    <p className="mt-1 text-sm/6 whitespace-pre-wrap text-content-secondary">
                      {comment.body}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      <Dialog open={lightbox !== null} onClose={() => setLightbox(null)} size="3xl">
        <DialogTitle>Screenshot</DialogTitle>
        <DialogBody>
          {lightbox ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={lightbox} alt="Screenshot" className="w-full rounded-lg" />
          ) : null}
        </DialogBody>
      </Dialog>
    </motion.div>
  )
}
