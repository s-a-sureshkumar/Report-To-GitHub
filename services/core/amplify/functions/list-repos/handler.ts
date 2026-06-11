import { getGitHubToken, githubRequest, isTokenMode } from '../shared/github'

interface RepoSummary {
  full_name: string
  name: string
  description: string | null
}

interface InstallationReposPage {
  total_count: number
  repositories: RepoSummary[]
}

/**
 * Returns the repositories testers can report against.
 *
 * - GITHUB_REPOS set (comma-separated "owner/name") — explicit allowlist;
 *   required in PAT mode, optional narrowing in GitHub App mode.
 * - Otherwise — every repo the GitHub App is installed on, so granting a new
 *   repo is done purely in GitHub with no config change here.
 */
export const handler = async () => {
  const token = await getGitHubToken()
  const allowlist = (process.env.GITHUB_REPOS ?? '')
    .split(',')
    .map((repo) => repo.trim())
    .filter(Boolean)

  let repos: RepoSummary[]
  if (allowlist.length > 0) {
    repos = await Promise.all(
      allowlist.map(async (fullName) => {
        const { data } = await githubRequest<RepoSummary>(`/repos/${fullName}`, { token })
        return data
      }),
    )
  } else {
    if (isTokenMode()) {
      throw new Error('GITHUB_REPOS must be set when using a PAT instead of a GitHub App.')
    }
    repos = []
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
  }

  return repos
    .map((repo) => ({
      fullName: repo.full_name,
      name: repo.name,
      description: repo.description,
    }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName))
}
