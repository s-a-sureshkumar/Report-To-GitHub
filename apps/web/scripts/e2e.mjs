// Browser E2E: injects a Cognito session (cookies + localStorage), submits a
// bug report through the real UI, and verifies the success panel and the
// "My reports" page. Prints a JSON result on the last line.
// Usage: node scripts/e2e.mjs /tmp/e2e-tokens.json /tmp/e2e-screenshot.png
import { readFileSync } from 'node:fs'

import { chromium } from 'playwright'

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000'
const SCREEN_DIR = '/tmp/e2e-screens'
const [tokensPath, screenshotPath] = process.argv.slice(2)
const { clientId, username, email, idToken, accessToken } = JSON.parse(
  readFileSync(tokensPath, 'utf8'),
)

const prefix = `CognitoIdentityServiceProvider.${clientId}`
const entries = {
  [`${prefix}.LastAuthUser`]: username,
  [`${prefix}.${username}.idToken`]: idToken,
  [`${prefix}.${username}.accessToken`]: accessToken,
  [`${prefix}.${username}.clockDrift`]: '0',
  [`${prefix}.${username}.signInDetails`]: JSON.stringify({
    loginId: email,
    authFlowType: 'USER_SRP_AUTH',
  }),
}

// Wait for the dev server to be up before launching the browser.
for (let attempt = 0; ; attempt++) {
  try {
    await fetch(BASE)
    break
  } catch {
    if (attempt > 60) throw new Error(`Dev server not reachable at ${BASE}`)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } })

// Amplify with ssr:true uses cookie token storage; set localStorage too in case.
await context.addCookies(
  Object.entries(entries).map(([name, value]) => ({
    name,
    value: encodeURIComponent(value),
    url: BASE,
  })),
)
await context.addInitScript((kv) => {
  for (const [key, value] of Object.entries(kv)) localStorage.setItem(key, value)
}, entries)

const page = await context.newPage()
const consoleErrors = []
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text())
})
page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`))

const fail = async (step, error) => {
  await page.screenshot({ path: `${SCREEN_DIR}/FAIL-${step}.png`, fullPage: true }).catch(() => {})
  console.error(`STEP FAILED: ${step}`)
  console.error(error?.message ?? error)
  if (consoleErrors.length) console.error('Console errors:\n' + consoleErrors.join('\n'))
  await browser.close()
  process.exit(1)
}

// 1. Authenticated load — should land on the report form, not the sign-in screen.
try {
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForSelector('text=Report an issue', { timeout: 60000 })
  await page.waitForSelector(`text=${email}`, { timeout: 15000 })
} catch (error) {
  await fail('authenticated-load', error)
}
await page.screenshot({ path: `${SCREEN_DIR}/01-form.png`, fullPage: true })

// 2. Repo picker populated from the listTargetRepos Lambda.
try {
  await page.waitForFunction(
    () => {
      const select = document.querySelector('select[name="repo"]')
      return select && select.options.length > 0 && select.options[0].value.includes('/')
    },
    { timeout: 60000 },
  )
} catch (error) {
  await fail('repo-picker', error)
}

// 3. Fill and submit the form, screenshot attached.
const title = `[E2E] Checkout button unresponsive on payment page (${new Date().toISOString()})`
try {
  await page.selectOption('select[name="severity"]', 'high')
  await page.fill('input[name="title"]', title)
  await page.fill(
    'textarea[name="description"]',
    'Tapping the checkout button on the payment page does nothing. No error is shown.',
  )
  await page.fill(
    'textarea[name="stepsToReproduce"]',
    '1. Add any item to the cart\n2. Go to the payment page\n3. Tap "Checkout"',
  )
  await page.fill('textarea[name="expectedBehavior"]', 'Order confirmation appears.')
  await page.fill('textarea[name="actualBehavior"]', 'Nothing happens; button stays enabled.')
  await page.setInputFiles('input[type="file"]', screenshotPath)
  await page.screenshot({ path: `${SCREEN_DIR}/02-filled.png`, fullPage: true })
  await page.click('button[type="submit"]')
  await page.waitForSelector('text=Report submitted', { timeout: 90000 })
} catch (error) {
  await fail('submit', error)
}
await page.screenshot({ path: `${SCREEN_DIR}/03-success.png`, fullPage: true })

const successText = await page.textContent('h2 + p')
const issueNumber = Number(/#(\d+)/.exec(successText ?? '')?.[1] ?? NaN)

// 4. "My reports" lists the new report.
try {
  await page.click('text=View my reports')
  await page.waitForSelector(`text=${title}`, { timeout: 30000 })
} catch (error) {
  await fail('my-reports', error)
}
await page.screenshot({ path: `${SCREEN_DIR}/04-my-reports.png`, fullPage: true })

await browser.close()
if (consoleErrors.length) console.error('Console errors (non-fatal):\n' + consoleErrors.join('\n'))
console.log(JSON.stringify({ ok: true, issueNumber, title }))
