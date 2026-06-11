import { type ClientSchema, a, defineData } from '@aws-amplify/backend'

import { listRepos } from '../functions/list-repos/resource'
import { submitReport } from '../functions/submit-report/resource'

const schema = a.schema({
  /**
   * One row per submitted report so testers can track what they filed
   * without GitHub access. Written by the submit-report Lambda after the
   * GitHub issue is created; testers can only read their own rows.
   */
  Report: a
    .model({
      title: a.string().required(),
      repo: a.string().required(),
      severity: a.string().required(),
      description: a.string().required(),
      stepsToReproduce: a.string(),
      expectedBehavior: a.string(),
      actualBehavior: a.string(),
      screenshotKeys: a.string().array(),
      githubIssueNumber: a.integer(),
      githubIssueUrl: a.string(),
      reporterEmail: a.string(),
    })
    .authorization((allow) => [allow.owner().to(['read'])]),

  TargetRepo: a.customType({
    fullName: a.string().required(),
    name: a.string().required(),
    description: a.string(),
  }),

  SubmitReportResult: a.customType({
    reportId: a.string().required(),
    issueNumber: a.integer().required(),
    issueUrl: a.string().required(),
    repo: a.string().required(),
  }),

  submitReport: a
    .mutation()
    .arguments({
      title: a.string().required(),
      repo: a.string().required(),
      severity: a.string().required(),
      description: a.string().required(),
      stepsToReproduce: a.string(),
      expectedBehavior: a.string(),
      actualBehavior: a.string(),
      screenshotKeys: a.string().array(),
    })
    .returns(a.ref('SubmitReportResult'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(submitReport)),

  /** Repos the GitHub App is installed on — drives the form's repo picker. */
  listTargetRepos: a
    .query()
    .returns(a.ref('TargetRepo').array())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(listRepos)),
})

export type Schema = ClientSchema<typeof schema>

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
})
