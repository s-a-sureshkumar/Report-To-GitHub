import { randomUUID } from 'node:crypto'

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'

import { getGitHubToken, githubRequest } from '../shared/github'

const SEVERITIES = ['critical', 'high', 'medium', 'low'] as const

const documentClient = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
})

interface SubmitReportArguments {
  title: string
  repo: string
  severity: string
  description: string
  stepsToReproduce?: string | null
  expectedBehavior?: string | null
  actualBehavior?: string | null
  screenshotKeys?: (string | null)[] | null
}

interface SubmitReportEvent {
  arguments: SubmitReportArguments
  identity?: {
    sub?: string
    username?: string
    claims?: Record<string, unknown>
  }
}

interface CreatedIssue {
  number: number
  html_url: string
}

function screenshotUrl(key: string): string {
  const domain = process.env.SCREENSHOT_CDN_DOMAIN
  return `https://${domain}/${key.split('/').map(encodeURIComponent).join('/')}`
}

function buildIssueBody(
  args: SubmitReportArguments,
  reporter: { email: string; name: string },
  screenshotKeys: string[],
): string {
  const sections = [
    '| Field | Value |',
    '| --- | --- |',
    `| Severity | ${args.severity} |`,
    `| Reporter | ${reporter.name ? `${reporter.name} (${reporter.email})` : reporter.email} |`,
    `| Submitted | ${new Date().toISOString()} |`,
    '',
    '### Description',
    args.description,
  ]

  if (args.stepsToReproduce) sections.push('', '### Steps to reproduce', args.stepsToReproduce)
  if (args.expectedBehavior) sections.push('', '### Expected behavior', args.expectedBehavior)
  if (args.actualBehavior) sections.push('', '### Actual behavior', args.actualBehavior)

  if (screenshotKeys.length > 0) {
    sections.push('', '### Screenshots')
    screenshotKeys.forEach((key, index) => {
      sections.push(`![screenshot-${index + 1}](${screenshotUrl(key)})`)
    })
  }

  sections.push('', '---', '_Filed via the Damon bug report portal._')
  return sections.join('\n')
}

export const handler = async (event: SubmitReportEvent) => {
  const args = event.arguments
  const severity = args.severity.toLowerCase()
  if (!SEVERITIES.includes(severity as (typeof SEVERITIES)[number])) {
    throw new Error(
      `Invalid severity "${args.severity}". Expected one of: ${SEVERITIES.join(', ')}`,
    )
  }
  if (!/^[\w.-]+\/[\w.-]+$/.test(args.repo)) {
    throw new Error(`Invalid repository "${args.repo}". Expected the "owner/name" format.`)
  }

  const sub = event.identity?.sub ?? 'unknown'
  const username = event.identity?.username ?? sub
  const claims = event.identity?.claims ?? {}
  const reporter = {
    email: typeof claims.email === 'string' ? claims.email : '',
    name: typeof claims.name === 'string' ? claims.name : '',
  }
  const screenshotKeys = (args.screenshotKeys ?? []).filter(
    (key): key is string => typeof key === 'string' && key.length > 0,
  )

  const token = await getGitHubToken()
  const issuePayload = {
    title: args.title,
    body: buildIssueBody(args, reporter, screenshotKeys),
    labels: ['bug', 'tester-report', `severity:${severity}`],
  }

  let { status, data: issue } = await githubRequest<CreatedIssue>(`/repos/${args.repo}/issues`, {
    method: 'POST',
    token,
    body: issuePayload,
  })
  if (status === 422) {
    // Most likely a label restriction — retry without labels rather than losing the report.
    ;({ status, data: issue } = await githubRequest<CreatedIssue>(`/repos/${args.repo}/issues`, {
      method: 'POST',
      token,
      body: { title: issuePayload.title, body: issuePayload.body },
    }))
    if (status === 422) throw new Error('GitHub rejected the issue payload (422).')
  }

  const reportId = randomUUID()
  const now = new Date().toISOString()
  try {
    await documentClient.send(
      new PutCommand({
        TableName: process.env.REPORT_TABLE_NAME,
        Item: {
          id: reportId,
          __typename: 'Report',
          owner: `${sub}::${username}`,
          createdAt: now,
          updatedAt: now,
          title: args.title,
          repo: args.repo,
          severity,
          description: args.description,
          stepsToReproduce: args.stepsToReproduce ?? undefined,
          expectedBehavior: args.expectedBehavior ?? undefined,
          actualBehavior: args.actualBehavior ?? undefined,
          screenshotKeys,
          githubIssueNumber: issue.number,
          githubIssueUrl: issue.html_url,
          reporterEmail: reporter.email || undefined,
        },
      }),
    )
  } catch (error) {
    // The issue exists in GitHub at this point; losing the tracking row is
    // recoverable, failing the whole mutation would look like a lost report.
    console.error('Failed to write Report tracking record', error)
  }

  return {
    reportId,
    issueNumber: issue.number,
    issueUrl: issue.html_url,
    repo: args.repo,
  }
}
