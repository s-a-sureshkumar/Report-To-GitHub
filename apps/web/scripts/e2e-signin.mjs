// E2E helper: signs in to Cognito as the test user (SRP via aws-amplify) and
// prints the tokens needed to inject an authenticated browser session.
// Usage: E2E_EMAIL=... E2E_PASSWORD=... node scripts/e2e-signin.mjs > /tmp/e2e-tokens.json
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { Amplify } from 'aws-amplify'
import { fetchAuthSession, signIn } from 'aws-amplify/auth'

const here = dirname(fileURLToPath(import.meta.url))
const outputs = JSON.parse(
  readFileSync(join(here, '../../../services/core/amplify_outputs.json'), 'utf8'),
)

Amplify.configure(outputs)

const email = process.env.E2E_EMAIL
const password = process.env.E2E_PASSWORD
if (!email || !password) {
  console.error('E2E_EMAIL and E2E_PASSWORD are required')
  process.exit(1)
}

const result = await signIn({ username: email, password })
if (!result.isSignedIn) {
  console.error(`Sign-in incomplete: ${JSON.stringify(result.nextStep)}`)
  process.exit(1)
}

const session = await fetchAuthSession()
const tokens = session.tokens
if (!tokens?.idToken || !tokens?.accessToken) {
  console.error('No tokens in session')
  process.exit(1)
}

console.log(
  JSON.stringify({
    clientId: outputs.auth.user_pool_client_id,
    username: tokens.accessToken.payload.username,
    email,
    idToken: tokens.idToken.toString(),
    accessToken: tokens.accessToken.toString(),
  }),
)
