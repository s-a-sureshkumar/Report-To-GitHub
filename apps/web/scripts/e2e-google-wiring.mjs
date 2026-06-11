// Verifies the Google sign-in wiring without a real Google login: clicks
// "Continue with Google" as an anonymous visitor and asserts the redirect
// chain lands on accounts.google.com with the expected client_id and an
// idpresponse redirect_uri — catching invalid_client / redirect_uri_mismatch.
// Usage: node scripts/e2e-google-wiring.mjs https://issue.mintology.dev <expected-google-client-id>
import { chromium } from 'playwright'

const [base, expectedClientId] = process.argv.slice(2)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

try {
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForSelector('text=Continue with Google', { timeout: 30000 })
  await page.click('text=Continue with Google')
  await page.waitForURL(/accounts\.google\.com|error/, { timeout: 30000 })
  // Give any error page a moment to render fully
  await page.waitForLoadState('domcontentloaded')

  const url = new URL(page.url())
  const bodyText = (await page.textContent('body').catch(() => '')) ?? ''
  const problems = []

  if (!url.hostname.endsWith('accounts.google.com')) {
    problems.push(`landed on ${url.hostname}, expected accounts.google.com`)
  }
  for (const marker of ['Error 400', 'redirect_uri_mismatch', 'invalid_client', 'Access blocked']) {
    if (bodyText.includes(marker)) problems.push(`page shows "${marker}"`)
  }
  const params = Object.fromEntries(url.searchParams)
  const clientId = params.client_id ?? new URLSearchParams(url.hash.slice(1)).get('client_id')
  if (expectedClientId && clientId && clientId !== expectedClientId) {
    problems.push(`client_id is ${clientId}, expected ${expectedClientId}`)
  }
  if (params.redirect_uri && !params.redirect_uri.includes('/oauth2/idpresponse')) {
    problems.push(`redirect_uri is ${params.redirect_uri}, expected .../oauth2/idpresponse`)
  }

  await page.screenshot({ path: '/tmp/e2e-screens/google-wiring.png', fullPage: false })
  console.log(
    JSON.stringify({
      ok: problems.length === 0,
      landedOn: url.hostname,
      clientId: clientId ?? null,
      redirectUri: params.redirect_uri ?? null,
      problems,
    }),
  )
  process.exit(problems.length === 0 ? 0 : 1)
} catch (error) {
  await page.screenshot({ path: '/tmp/e2e-screens/google-wiring-FAIL.png' }).catch(() => {})
  console.error(error.message)
  process.exit(1)
} finally {
  await browser.close()
}
