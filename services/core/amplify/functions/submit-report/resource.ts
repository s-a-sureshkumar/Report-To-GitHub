import { defineFunction, secret } from '@aws-amplify/backend'

export const submitReport = defineFunction({
  name: 'submit-report',
  entry: './handler.ts',
  timeoutSeconds: 30,
  memoryMB: 512,
  resourceGroupName: 'data',
  environment: {
    GITHUB_APP_ID: secret('GITHUB_APP_ID'),
    GITHUB_APP_PRIVATE_KEY: secret('GITHUB_APP_PRIVATE_KEY'),
    // PAT fallback for sandboxes; set to "unused" when using the GitHub App.
    GITHUB_TOKEN: secret('GITHUB_TOKEN'),
    // REPORT_TABLE_NAME and SCREENSHOT_CDN_DOMAIN are added in backend.ts
  },
})
