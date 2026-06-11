# Report to GitHub

Internal portal that lets non-developer team members (testers, support) file bugs
into private GitHub repositories **without GitHub accounts**. Reports become GitHub
issues via a GitHub App; testers sign in with their `@mintable.com` Google account.

Architecture mirrors the draughtsman monorepo conventions, collapsed to one
backend service and one web app:

```
apps/web              Next.js 16 report form + "my reports" view
services/core         Amplify Gen 2 backend (Cognito, AppSync, DynamoDB, S3, Lambdas)
packages/api          Typed AppSync client + React Query hooks
packages/style-guide  Shared TypeScript configs
```

## How it works

1. Tester signs in with Google (Cognito federated IdP; a `preSignUp` trigger
   rejects any account that isn't on `mintable.com` — configurable in
   `services/core/amplify/auth/pre-sign-up/resource.ts`).
2. The form's repo picker calls `listTargetRepos`, which aggregates the
   repositories across **all** of the GitHub App's installations (org and
   personal). To expose a new repo, install the App on it (or add it to an
   existing installation's repository list) in GitHub — no code, secret, or
   env change. `GITHUB_REPOS` (comma-separated `owner/name`) optionally
   narrows the picker.
3. Screenshots upload to S3; a CloudFront distribution in front of the bucket
   makes them render inline in GitHub issue bodies. URLs are unguessable
   (UUID keys) but not authenticated — fine for bug screenshots, don't upload
   secrets.
4. `submitReport` (Lambda) creates the GitHub issue with a structured body and
   `bug` / `tester-report` / `severity:*` labels, then writes a tracking row to
   the `Report` table so testers can see what they filed under **My reports**.

## One-time setup

### 1. GitHub App (~15 min)

1. GitHub org → **Settings → Developer settings → GitHub Apps → New GitHub App**.
   - Name: `damon-bug-reports` (the bot identity on issues); any homepage URL; **disable webhooks**.
   - Repository permissions: **Issues: Read and write**, **Metadata: Read-only**.
2. Create the app, note the **App ID**, and generate a **private key** (`.pem`).
3. **Install App** on the repos testers should report against
   (e.g. `Mintable-Customer-Support`, `Management-Portal`).
4. Note the **Installation ID** — it's the number in the URL of the installation
   page: `github.com/organizations/Mintable-Pte-Ltd/settings/installations/<ID>`.

### 2. Google OAuth client

Reuse the pattern from the other Mintable apps: Google Cloud Console →
**APIs & Services → Credentials → Create OAuth client ID (Web application)**.
The authorized redirect URI is the Cognito domain's `/oauth2/idpresponse`
endpoint — you get the domain from `amplify_outputs.json` (`oauth.domain`) after
the first sandbox/deploy, then add:

```
https://<cognito-domain>/oauth2/idpresponse
```

### 3. Secrets

Six secrets, set per environment.

Local sandbox (run inside `services/core/`):

```bash
npx ampx sandbox secret set GOOGLE_CLIENT_ID
npx ampx sandbox secret set GOOGLE_CLIENT_SECRET
npx ampx sandbox secret set GITHUB_APP_ID
npx ampx sandbox secret set GITHUB_APP_INSTALLATION_ID
base64 -i bug-reports.private-key.pem | npx ampx sandbox secret set GITHUB_APP_PRIVATE_KEY
printf 'unused' | npx ampx sandbox secret set GITHUB_TOKEN
```

(The private key is stored base64-encoded; the Lambda decodes it automatically.)

Deployed branches: Amplify console → core app → **Hosting → Secrets** — same
six names.

**Sandbox shortcut (no GitHub App yet):** set `GITHUB_TOKEN` to a fine-grained
PAT instead, set the three `GITHUB_APP_*` secrets to `unused`, and deploy with
`GITHUB_REPOS=owner/repo1,owner/repo2 npx ampx sandbox` — the allowlist is
required in PAT mode (it also works in App mode to narrow the repo picker).
The GitHub App remains the right setup for production: bot identity,
no expiry tied to a person, single-place revocation.

## Local development

```bash
pnpm install
pnpm sandbox        # deploys a personal cloud sandbox, writes services/core/amplify_outputs.json
pnpm dev            # Next.js on http://localhost:3000
```

## Deployment (AWS Amplify Hosting)

Two Amplify apps off the same repo/branch — both read the root `amplify.yml`:

1. **core** — appRoot `services/core`. Set the five secrets. Deploy first.
2. **web** — appRoot `apps/web`, platform WEB_COMPUTE. Set env var
   `CORE_APP_ID=<core app's Amplify app ID>`. Deploy after core.

After the first web deploy:

- Add the web URL (e.g. `https://main.xxxx.amplifyapp.com/` or
  `https://reports.mintable.com/`) to `callbackUrls` and `logoutUrls` in
  `services/core/amplify/auth/resource.ts` and redeploy core.
- Add the Cognito `/oauth2/idpresponse` redirect URI to the Google OAuth client
  (per environment — sandbox and deployed branches have different Cognito domains).

## Conventions

Matches draughtsman: pnpm workspaces + Turborepo, Amplify Gen 2 `defineBackend`,
Next.js app router with `ConfigureAmplifyClientSide`, React Query hooks in
`@report/api`, strict TypeScript via `@report/style-guide`, Prettier
(no semicolons, single quotes, width 100).
