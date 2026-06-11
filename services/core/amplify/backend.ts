import { defineBackend } from '@aws-amplify/backend'
import { Stack } from 'aws-cdk-lib'
import {
  CachePolicy,
  Distribution,
  OriginAccessIdentity,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront'
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins'

import { auth } from './auth/resource'
import { data } from './data/resource'
import { issueStatus } from './functions/issue-status/resource'
import { listRepos } from './functions/list-repos/resource'
import { submitReport } from './functions/submit-report/resource'
import { storage } from './storage/resource'

const backend = defineBackend({
  auth,
  data,
  storage,
  submitReport,
  listRepos,
  issueStatus,
})

// The submit-report Lambda writes tracking rows straight into the
// Amplify-managed Report table after creating the GitHub issue.
const reportTable = backend.data.resources.tables['Report']
reportTable.grantWriteData(backend.submitReport.resources.lambda)
backend.submitReport.addEnvironment('REPORT_TABLE_NAME', reportTable.tableName)

// CloudFront in front of the screenshots bucket (same pattern as the
// draughtsman core service) so image links embedded in GitHub issue bodies
// render for developers. Keys contain UUIDs, so URLs are unguessable but
// not authenticated — fine for internal bug screenshots, not for secrets.
// Lives in the bucket's stack: the OAI grant edits the bucket policy, so a
// separate stack would create a circular cross-stack dependency.
const storageStack = Stack.of(backend.storage.resources.bucket)
const originAccessIdentity = new OriginAccessIdentity(storageStack, 'ScreenshotOAI')
const screenshotCdn = new Distribution(storageStack, 'ScreenshotCDN', {
  comment: 'report-to-github screenshots',
  defaultBehavior: {
    origin: S3BucketOrigin.withOriginAccessIdentity(backend.storage.resources.bucket, {
      originAccessIdentity,
    }),
    viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    cachePolicy: CachePolicy.CACHING_OPTIMIZED,
  },
})
backend.submitReport.addEnvironment('SCREENSHOT_CDN_DOMAIN', screenshotCdn.distributionDomainName)

backend.addOutput({
  custom: {
    screenshotCdnDomain: screenshotCdn.distributionDomainName,
  },
})
