import { getGitHubToken, githubRequest } from '../shared/github'

const REPO_PATTERN = /^[\w.-]+\/[\w.-]+$/
const MAX_STATUS_REFS = 50
const MAX_COMMENTS = 30

interface GitHubIssue {
  number: number
  state: 'open' | 'closed'
  state_reason: string | null
  closed_at: string | null
  comments: number
  html_url: string
}

interface GitHubComment {
  body: string
  created_at: string
  user: { login: string; type: string } | null
}

interface AppSyncEvent {
  // Field name location varies between AppSync payload shapes; resolveField()
  // also falls back to the argument shape.
  fieldName?: string
  info?: { fieldName?: string }
  arguments: {
    repo?: string
    issueNumber?: number
    refs?: (string | null)[] | null
  }
}

function resolveField(event: AppSyncEvent): string {
  if (event.info?.fieldName) return event.info.fieldName
  if (event.fieldName) return event.fieldName
  if (event.arguments?.refs !== undefined) return 'listIssueStatuses'
  return 'getIssueDetail'
}

function assertRepo(repo: string) {
  if (!REPO_PATTERN.test(repo)) {
    throw new Error(`Invalid repository "${repo}". Expected the "owner/name" format.`)
  }
}

/** "owner/name#123" → { repo, issueNumber } */
function parseRef(ref: string): { repo: string; issueNumber: number } | null {
  const match = /^([\w.-]+\/[\w.-]+)#(\d+)$/.exec(ref)
  if (!match) return null
  return { repo: match[1], issueNumber: Number(match[2]) }
}

async function getIssueDetail(repo: string, issueNumber: number) {
  assertRepo(repo)
  const token = await getGitHubToken()
  const { data: issue } = await githubRequest<GitHubIssue>(`/repos/${repo}/issues/${issueNumber}`, {
    token,
  })
  const { data: comments } = await githubRequest<GitHubComment[]>(
    `/repos/${repo}/issues/${issueNumber}/comments?per_page=${MAX_COMMENTS}`,
    { token },
  )
  return {
    repo,
    issueNumber: issue.number,
    state: issue.state,
    stateReason: issue.state_reason,
    closedAt: issue.closed_at,
    commentCount: issue.comments,
    comments: (comments ?? []).map((comment) => ({
      author: comment.user?.login ?? 'unknown',
      body: comment.body ?? '',
      createdAt: comment.created_at,
      isTeam: comment.user?.type !== 'Bot',
    })),
  }
}

async function listIssueStatuses(refs: string[]) {
  const token = await getGitHubToken()
  const parsed = refs
    .slice(0, MAX_STATUS_REFS)
    .map((ref) => ({ ref, target: parseRef(ref) }))
    .filter(
      (entry): entry is { ref: string; target: { repo: string; issueNumber: number } } =>
        entry.target !== null,
    )

  return Promise.all(
    parsed.map(async ({ ref, target }) => {
      try {
        const { data: issue } = await githubRequest<GitHubIssue>(
          `/repos/${target.repo}/issues/${target.issueNumber}`,
          { token },
        )
        return {
          key: ref,
          state: issue.state,
          stateReason: issue.state_reason,
          commentCount: issue.comments,
        }
      } catch (error) {
        console.error(`status fetch failed for ${ref}`, error)
        return { key: ref, state: 'unknown', stateReason: null, commentCount: null }
      }
    }),
  )
}

export const handler = async (event: AppSyncEvent) => {
  const field = resolveField(event)
  if (field === 'getIssueDetail') {
    const { repo, issueNumber } = event.arguments
    if (!repo || typeof issueNumber !== 'number') {
      throw new Error('repo and issueNumber are required.')
    }
    return getIssueDetail(repo, issueNumber)
  }
  if (field === 'listIssueStatuses') {
    const refs = (event.arguments.refs ?? []).filter(
      (ref): ref is string => typeof ref === 'string' && ref.length > 0,
    )
    return listIssueStatuses(refs)
  }
  throw new Error(`Unknown field: ${field}`)
}
