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

let cachedToken: { token: string; expiresAt: number } | null = null

/**
 * Production path is the GitHub App installation token. For sandboxes a
 * fine-grained PAT can be used instead: set the GITHUB_TOKEN secret to the
 * PAT and the App secrets to the sentinel value "unused".
 */
export async function getGitHubToken(): Promise<string> {
  const pat = process.env.GITHUB_TOKEN
  if (pat && pat !== 'unused') return pat
  return getInstallationToken()
}

export function isTokenMode(): boolean {
  const pat = process.env.GITHUB_TOKEN
  return Boolean(pat && pat !== 'unused')
}

/** Installation access token, cached across warm invocations. */
export async function getInstallationToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token
  }
  const installationId = requiredEnv('GITHUB_APP_INSTALLATION_ID')
  const { data } = await githubRequest<{ token: string; expires_at: string }>(
    `/app/installations/${installationId}/access_tokens`,
    { method: 'POST', token: createAppJwt() },
  )
  cachedToken = { token: data.token, expiresAt: Date.parse(data.expires_at) }
  return data.token
}
