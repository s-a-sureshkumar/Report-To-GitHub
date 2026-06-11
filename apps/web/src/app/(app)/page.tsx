'use client'

import { useRef, useState } from 'react'

import { CheckCircleIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { motion } from 'motion/react'

import { useSubmitReport, useTargetRepos, type SubmitReportResult } from '@report/api'

import { Button } from '@/components/ui/button'
import { Description, ErrorMessage, Field, FieldGroup, Label } from '@/components/ui/fieldset'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Heading, Text } from '@/components/ui/text'
import { uploadScreenshots } from '@/lib/upload'

const severities = [
  { value: 'critical', label: 'Critical — blocks testing or causes data loss' },
  { value: 'high', label: 'High — major feature broken' },
  { value: 'medium', label: 'Medium — feature partially broken' },
  { value: 'low', label: 'Low — cosmetic or minor' },
]

function ScreenshotPicker({
  files,
  onChange,
}: {
  files: File[]
  onChange: (files: File[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div data-slot="control">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(event) => {
          onChange([...files, ...Array.from(event.target.files ?? [])])
          event.target.value = ''
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-dashed border-border px-4 py-6 text-sm font-medium text-content-secondary transition hover:border-border-strong hover:bg-surface-raised"
      >
        <PhotoIcon className="size-5 text-content-tertiary" />
        Click to attach screenshots
      </button>
      {files.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-3">
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="size-20 rounded-lg border border-border-subtle object-cover"
              />
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                onClick={() => onChange(files.filter((_, i) => i !== index))}
                className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-neutral-800 text-white shadow-sm transition hover:bg-danger-600"
              >
                <XMarkIcon className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

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
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden rounded-2xl border border-success-200 bg-success-50 p-6 dark:border-success-700/40 dark:bg-success-900/20"
      >
        <div className="flex items-start gap-3">
          <CheckCircleIcon className="size-6 shrink-0 text-success-600 dark:text-success-400" />
          <div>
            <h2 className="text-lg font-semibold text-success-900 dark:text-success-100">
              Report submitted
            </h2>
            <p className="mt-1 text-sm text-success-800 dark:text-success-200">
              Your report was filed as issue{' '}
              <span className="font-semibold">#{submitted.issueNumber}</span> in{' '}
              <span className="font-semibold">{submitted.repo}</span>. The development team will
              pick it up from there — track replies under My reports.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={() => setSubmitted(null)}>Report another issue</Button>
          <Button outline href={`/reports/${submitted.reportId}`}>
            View report
          </Button>
          <Button plain href="/reports">
            View my reports
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Heading>Report an issue</Heading>
      <Text className="mt-1">
        The report is filed directly to the development team&apos;s issue tracker.
      </Text>

      <form ref={formRef} onSubmit={handleSubmit} className="mt-8">
        <FieldGroup>
          <div className="grid gap-8 sm:grid-cols-2 sm:gap-4">
            <Field>
              <Label>Application</Label>
              <Select name="repo" required disabled={reposLoading}>
                {reposLoading ? <option value="">Loading…</option> : null}
                {(repos ?? []).map((repo) => (
                  <option key={repo.fullName} value={repo.fullName}>
                    {repo.name}
                  </option>
                ))}
              </Select>
              {reposError ? (
                <ErrorMessage>Could not load the application list.</ErrorMessage>
              ) : null}
            </Field>
            <Field>
              <Label>Severity</Label>
              <Select name="severity" defaultValue="medium" required>
                {severities.map((severity) => (
                  <option key={severity.value} value={severity.value}>
                    {severity.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field>
            <Label>Title</Label>
            <Input
              name="title"
              required
              maxLength={200}
              placeholder="Short summary of the problem"
            />
          </Field>

          <Field>
            <Label>Description</Label>
            <Description>What happened? Include where in the app you were.</Description>
            <Textarea name="description" required rows={4} />
          </Field>

          <Field>
            <Label>Steps to reproduce</Label>
            <Textarea
              name="stepsToReproduce"
              rows={3}
              placeholder={'1. Go to…\n2. Click…\n3. See error'}
            />
          </Field>

          <div className="grid gap-8 sm:grid-cols-2 sm:gap-4">
            <Field>
              <Label>Expected behavior</Label>
              <Textarea name="expectedBehavior" rows={2} />
            </Field>
            <Field>
              <Label>Actual behavior</Label>
              <Textarea name="actualBehavior" rows={2} />
            </Field>
          </div>

          <Field>
            <Label>Screenshots</Label>
            <ScreenshotPicker files={files} onChange={setFiles} />
          </Field>

          {error ? (
            <p className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700 dark:border-danger-700/40 dark:bg-danger-900/20 dark:text-danger-200">
              {error}
            </p>
          ) : null}

          <div>
            <Button type="submit" disabled={submitting || reposLoading}>
              {submitting ? (
                <>
                  <span
                    data-slot="icon"
                    className="animate-spin rounded-full border-2 border-white/40 border-t-white"
                  />
                  Submitting…
                </>
              ) : (
                'Submit report'
              )}
            </Button>
          </div>
        </FieldGroup>
      </form>
    </motion.div>
  )
}
