import { type ClientSchema, a, defineData } from '@aws-amplify/backend'

import { issueStatus } from '../functions/issue-status/resource'
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

  IssueComment: a.customType({
    author: a.string().required(),
    body: a.string().required(),
    createdAt: a.string().required(),
    isTeam: a.boolean(),
  }),

  IssueDetail: a.customType({
    repo: a.string().required(),
    issueNumber: a.integer().required(),
    state: a.string().required(),
    stateReason: a.string(),
    closedAt: a.string(),
    commentCount: a.integer(),
    comments: a.ref('IssueComment').array(),
  }),

  IssueStatus: a.customType({
    /** Echo of the requested ref, "owner/name#123". */
    key: a.string().required(),
    state: a.string().required(),
    stateReason: a.string(),
    commentCount: a.integer(),
  }),

  /** Live GitHub state + dev-team comments for one submitted report. */
  getIssueDetail: a
    .query()
    .arguments({ repo: a.string().required(), issueNumber: a.integer().required() })
    .returns(a.ref('IssueDetail'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(issueStatus)),

  /** Batched open/closed state for the reports list ("owner/name#123" refs). */
  listIssueStatuses: a
    .query()
    .arguments({ refs: a.string().array().required() })
    .returns(a.ref('IssueStatus').array())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(issueStatus)),
})

export type Schema = ClientSchema<typeof schema>

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
})
