import {
  getTokenForRepo,
  githubRequest,
  isTokenMode,
  listInstallationTokens,
} from '../shared/github'

interface RepoSummary {
  full_name: string
  name: string
  description: string | null
}

interface InstallationReposPage {
  total_count: number
  repositories: RepoSummary[]
}

async function reposForInstallation(token: string): Promise<RepoSummary[]> {
  const repos: RepoSummary[] = []
  let page = 1
  for (;;) {
    const { data } = await githubRequest<InstallationReposPage>(
      `/installation/repositories?per_page=100&page=${page}`,
      { token },
    )
    repos.push(...data.repositories)
    if (repos.length >= data.total_count || data.repositories.length === 0) break
    page += 1
  }
  return repos
}

/**
 * Returns the repositories testers can report against.
 *
 * - GITHUB_REPOS set (comma-separated "owner/name") — explicit allowlist;
 *   required in PAT mode, optional narrowing in GitHub App mode.
 * - Otherwise — every repo across ALL of the App's installations (org +
 *   personal), so granting a new repo is done purely in GitHub.
 */
export const handler = async () => {
  const allowlist = (process.env.GITHUB_REPOS ?? '')
    .split(',')
    .map((repo) => repo.trim())
    .filter(Boolean)

  let repos: RepoSummary[]
  if (allowlist.length > 0) {
    repos = await Promise.all(
      allowlist.map(async (fullName) => {
        const token = await getTokenForRepo(fullName)
        const { data } = await githubRequest<RepoSummary>(`/repos/${fullName}`, { token })
        return data
      }),
    )
  } else {
    if (isTokenMode()) {
      throw new Error('GITHUB_REPOS must be set when using a PAT instead of a GitHub App.')
    }
    const tokens = await listInstallationTokens()
    const pages = await Promise.all(tokens.map((token) => reposForInstallation(token)))
    const byName = new Map<string, RepoSummary>()
    for (const repo of pages.flat()) byName.set(repo.full_name, repo)
    repos = [...byName.values()]
  }

  return repos
    .map((repo) => ({
      fullName: repo.full_name,
      name: repo.name,
      description: repo.description,
    }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName))
}
