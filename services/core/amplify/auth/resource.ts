import { defineAuth, secret } from '@aws-amplify/backend'

import { preSignUp } from './pre-sign-up/resource'

/**
 * Google federated sign-in (Google Workspace) — same pattern as
 * Mintable-Customer-Support / Management-Portal, plus a preSignUp trigger
 * that restricts sign-up to the mintable.com domain (the old apps relied
 * on group assignment only).
 *
 * After the first deploy, add the deployed web URL to callbackUrls and
 * logoutUrls below, and register the Cognito domain's
 * /oauth2/idpresponse endpoint in the Google Cloud OAuth client.
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      google: {
        clientId: secret('GOOGLE_CLIENT_ID'),
        clientSecret: secret('GOOGLE_CLIENT_SECRET'),
        scopes: ['openid', 'email', 'profile'],
        attributeMapping: {
          email: 'email',
          fullname: 'name',
        },
      },
      callbackUrls: ['http://localhost:3000/'],
      logoutUrls: ['http://localhost:3000/'],
    },
  },
  triggers: {
    preSignUp,
  },
})
