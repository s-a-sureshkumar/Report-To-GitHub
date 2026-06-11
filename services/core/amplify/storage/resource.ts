import { defineStorage } from '@aws-amplify/backend'

/**
 * Screenshot uploads. Each tester writes under their own identity prefix;
 * any signed-in user can read (the "my reports" page). Developers reading
 * GitHub issues see the screenshots via the CloudFront distribution that
 * backend.ts puts in front of this bucket.
 */
export const storage = defineStorage({
  name: 'reportScreenshots',
  access: (allow) => ({
    'screenshots/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write']),
      allow.authenticated.to(['read']),
    ],
  }),
})
