import { defineFunction, secret } from '@aws-amplify/backend'

export const issueStatus = defineFunction({
  name: 'issue-status',
  entry: './handler.ts',
  timeoutSeconds: 30,
  resourceGroupName: 'data',
  environment: {
    GITHUB_APP_ID: secret('GITHUB_APP_ID'),
    GITHUB_APP_INSTALLATION_ID: secret('GITHUB_APP_INSTALLATION_ID'),
    GITHUB_APP_PRIVATE_KEY: secret('GITHUB_APP_PRIVATE_KEY'),
    // PAT fallback for sandboxes; set to "unused" when using the GitHub App.
    GITHUB_TOKEN: secret('GITHUB_TOKEN'),
  },
})
