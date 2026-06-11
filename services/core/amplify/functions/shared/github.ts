import { createSign } from 'node:crypto'

const GITHUB_API = 'https://api.github.com'

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

/** Private key may be stored raw or base64-encoded (multiline PEMs are awkward as secrets). */
function getPrivateKey(): string {
  const raw = requiredEnv('GITHUB_APP_PRIVATE_KEY')
  return raw.includes('BEGIN') ? raw : Buffer.from(raw, 'base64').toString('utf8')
}

/** Short-lived JWT identifying the GitHub App itself (RS256, no dependencies). */
function createAppJwt(): string {
  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64url(
    JSON.stringify({ iat: now - 60, exp: now + 540, iss: requiredEnv('GITHUB_APP_ID') }),
  )
  const signature = createSign('RSA-SHA256').update(`${header}.${payload}`).sign(getPrivateKey())
  return `${header}.${payload}.${base64url(signature)}`
}

export async function githubRequest<T>(
  path: string,
  options: { method?: string; token: string; body?: unknown },
): Promise<{ status: number; data: T }> {
  const response = await fetch(`${GITHUB_API}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      Authorization: `Bearer ${options.token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const data = (await response.json().catch(() => ({}))) as T
  if (!response.ok && response.status !== 422) {
    const message = (data as { message?: string })?.message ?? 'unknown error'
    throw new Error(
      `GitHub API ${options.method ?? 'GET'} ${path} failed (${response.status}): ${message}`,
    )
  }
  return { status: response.status, data }
}

/**
 * Sandbox fallback: a fine-grained PAT in the GITHUB_TOKEN secret bypasses
 * the GitHub App entirely. Set it to "unused" in App mode.
 */
export function isTokenMode(): boolean {
  const pat = process.env.GITHUB_TOKEN
  return Boolean(pat && pat !== 'unused')
}

function getPat(): string {
  return requiredEnv('GITHUB_TOKEN')
}

// ── GitHub App installations ──
// The App may be installed on several accounts (the org, personal accounts).
// Installation tokens are scoped per installation, so we discover them via
// the App JWT instead of pinning a single GITHUB_APP_INSTALLATION_ID.

interface Installation {
  id: number
}

const installationTokens = new Map<number, { token: string; expiresAt: number }>()
let installationsCache: { ids: number[]; expiresAt: number } | null = null
const repoInstallationCache = new Map<string, number>()

async function tokenForInstallation(installationId: number): Promise<string> {
  const cached = installationTokens.get(installationId)
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token
  const { data } = await githubRequest<{ token: string; expires_at: string }>(
    `/app/installations/${installationId}/access_tokens`,
    { method: 'POST', token: createAppJwt() },
  )
  installationTokens.set(installationId, {
    token: data.token,
    expiresAt: Date.parse(data.expires_at),
  })
  return data.token
}

async function listInstallationIds(): Promise<number[]> {
  if (installationsCache && installationsCache.expiresAt > Date.now()) {
    return installationsCache.ids
  }
  const { data } = await githubRequest<Installation[]>('/app/installations?per_page=100', {
    token: createAppJwt(),
  })
  const ids = data.map((installation) => installation.id)
  installationsCache = { ids, expiresAt: Date.now() + 5 * 60_000 }
  return ids
}

/** One token per installation — used to aggregate repos across installations. */
export async function listInstallationTokens(): Promise<string[]> {
  const ids = await listInstallationIds()
  return Promise.all(ids.map((id) => tokenForInstallation(id)))
}

/**
 * Token able to act on a specific repository: resolves which installation
 * covers the repo, then mints (or reuses) that installation's token.
 */
export async function getTokenForRepo(repo: string): Promise<string> {
  if (isTokenMode()) return getPat()

  const cachedId = repoInstallationCache.get(repo)
  if (cachedId !== undefined) return tokenForInstallation(cachedId)

  try {
    const { data } = await githubRequest<Installation>(`/repos/${repo}/installation`, {
      token: createAppJwt(),
    })
    repoInstallationCache.set(repo, data.id)
    return tokenForInstallation(data.id)
  } catch (error) {
    if (error instanceof Error && error.message.includes('(404)')) {
      throw new Error(
        `The bug-reports GitHub App is not installed on ${repo}. Install it on that repository in GitHub, then retry.`,
      )
    }
    throw error
  }
}
