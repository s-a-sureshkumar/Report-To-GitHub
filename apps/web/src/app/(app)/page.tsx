'use client'

import { useRef, useState } from 'react'

import Link from 'next/link'

import { useSubmitReport, useTargetRepos, type SubmitReportResult } from '@report/api'

import { uploadScreenshots } from '@/lib/upload'

const severities = [
  { value: 'critical', label: 'Critical — blocks testing or causes data loss' },
  { value: 'high', label: 'High — major feature broken' },
  { value: 'medium', label: 'Medium — feature partially broken' },
  { value: 'low', label: 'Low — cosmetic or minor' },
]

const inputClass =
  'mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none'

export default function NewReportPage() {
  const { data: repos, isLoading: reposLoading, error: reposError } = useTargetRepos()
  const submitReport = useSubmitReport()

  const formRef = useRef<HTMLFormElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<SubmitReportResult | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSubmitting(true)
    setError(null)
    try {
      const screenshotKeys = files.length > 0 ? await uploadScreenshots(files) : []
      const result = await submitReport.mutateAsync({
        title: String(form.get('title') ?? '').trim(),
        repo: String(form.get('repo') ?? ''),
        severity: String(form.get('severity') ?? 'medium'),
        description: String(form.get('description') ?? '').trim(),
        stepsToReproduce: String(form.get('stepsToReproduce') ?? '').trim() || undefined,
        expectedBehavior: String(form.get('expectedBehavior') ?? '').trim() || undefined,
        actualBehavior: String(form.get('actualBehavior') ?? '').trim() || undefined,
        screenshotKeys,
      })
      setSubmitted(result)
      formRef.current?.reset()
      setFiles([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
        <h2 className="text-lg font-semibold text-green-900">Report submitted</h2>
        <p className="mt-2 text-sm text-green-800">
          Your report was filed as issue{' '}
          <span className="font-semibold">#{submitted.issueNumber}</span> in{' '}
          <span className="font-semibold">{submitted.repo}</span>. The development team will pick it
          up from there.
        </p>
        <div className="mt-4 flex gap-3 text-sm font-medium">
          <button
            type="button"
            onClick={() => setSubmitted(null)}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-white transition hover:bg-zinc-700"
          >
            Report another issue
          </button>
          <Link
            href="/reports"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-zinc-700 transition hover:bg-zinc-100"
          >
            View my reports
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold">Report an issue</h1>
        <p className="mt-1 text-sm text-zinc-500">
          The report is filed directly to the development team&apos;s issue tracker.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Application
          <select name="repo" required className={inputClass} disabled={reposLoading}>
            {reposLoading ? <option value="">Loading…</option> : null}
            {(repos ?? []).map((repo) => (
              <option key={repo.fullName} value={repo.fullName}>
                {repo.name}
              </option>
            ))}
          </select>
          {reposError ? (
            <span className="mt-1 block font-normal text-red-600">
              Could not load the application list.
            </span>
          ) : null}
        </label>

        <label className="block text-sm font-medium">
          Severity
          <select name="severity" defaultValue="medium" required className={inputClass}>
            {severities.map((severity) => (
              <option key={severity.value} value={severity.value}>
                {severity.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block text-sm font-medium">
        Title
        <input
          name="title"
          required
          maxLength={200}
          placeholder="Short summary of the problem"
          className={inputClass}
        />
      </label>

      <label className="block text-sm font-medium">
        Description
        <textarea
          name="description"
          required
          rows={4}
          placeholder="What happened? Include where in the app you were."
          className={inputClass}
        />
      </label>

      <label className="block text-sm font-medium">
        Steps to reproduce
        <textarea
          name="stepsToReproduce"
          rows={3}
          placeholder={'1. Go to…\n2. Click…\n3. See error'}
          className={inputClass}
        />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Expected behavior
          <textarea name="expectedBehavior" rows={2} className={inputClass} />
        </label>
        <label className="block text-sm font-medium">
          Actual behavior
          <textarea name="actualBehavior" rows={2} className={inputClass} />
        </label>
      </div>

      <label className="block text-sm font-medium">
        Screenshots
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
          className="mt-1 block w-full text-sm text-zinc-500 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-700"
        />
        {files.length > 0 ? (
          <span className="mt-1 block font-normal text-zinc-500">
            {files.length} file{files.length > 1 ? 's' : ''} selected
          </span>
        ) : null}
      </label>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting || reposLoading}
        className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : 'Submit report'}
      </button>
    </form>
  )
}
