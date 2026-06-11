'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { fetchAuthSession } from 'aws-amplify/auth'

import { client } from './client'
import type { Schema } from './client'

export type Report = Schema['Report']['type']
export type TargetRepo = Schema['TargetRepo']['type']
export type SubmitReportInput = Schema['submitReport']['args']
export type SubmitReportResult = Schema['SubmitReportResult']['type']
export type IssueDetail = Schema['IssueDetail']['type']
export type IssueStatus = Schema['IssueStatus']['type']
export type IssueComment = Schema['IssueComment']['type']

export function issueRef(repo: string, issueNumber: number): string {
  return `${repo}#${issueNumber}`
}

export function useTargetRepos() {
  return useQuery({
    queryKey: ['target-repos'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, errors } = await client.queries.listTargetRepos()
      if (errors?.length) throw new Error(errors[0].message)
      return (data ?? []).filter((repo): repo is TargetRepo => repo !== null)
    },
  })
}

export function useMyReports() {
  return useQuery({
    queryKey: ['my-reports'],
    queryFn: async () => {
      const { data, errors } = await client.models.Report.list({ limit: 200 })
      if (errors?.length) throw new Error(errors[0].message)
      return [...data].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    },
  })
}

export function useReport(id: string | undefined) {
  return useQuery({
    queryKey: ['report', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, errors } = await client.models.Report.get({ id: id as string })
      if (errors?.length) throw new Error(errors[0].message)
      if (!data) throw new Error('Report not found.')
      return data
    },
  })
}

/** Batched GitHub open/closed state for the reports list, keyed "owner/name#123". */
export function useIssueStatuses(refs: string[]) {
  return useQuery({
    queryKey: ['issue-statuses', refs],
    enabled: refs.length > 0,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, errors } = await client.queries.listIssueStatuses({ refs })
      if (errors?.length) throw new Error(errors[0].message)
      const map: Record<string, IssueStatus> = {}
      for (const status of data ?? []) {
        if (status) map[status.key] = status
      }
      return map
    },
  })
}

/** Live GitHub state + comments for one report's issue. */
export function useIssueDetail(repo: string | undefined, issueNumber: number | undefined) {
  return useQuery({
    queryKey: ['issue-detail', repo, issueNumber],
    enabled: Boolean(repo) && typeof issueNumber === 'number',
    staleTime: 30 * 1000,
    queryFn: async () => {
      const { data, errors } = await client.queries.getIssueDetail({
        repo: repo as string,
        issueNumber: issueNumber as number,
      })
      if (errors?.length) throw new Error(errors[0].message)
      if (!data) throw new Error('Issue not found.')
      return data
    },
  })
}

export function useSubmitReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: SubmitReportInput): Promise<SubmitReportResult> => {
      // Send the ID token (not the default access token) so the Lambda's
      // identity claims include email and name for the issue's Reporter row.
      const { tokens } = await fetchAuthSession()
      const idToken = tokens?.idToken?.toString()
      const { data, errors } = await client.mutations.submitReport(
        input,
        idToken ? { authToken: idToken } : undefined,
      )
      if (errors?.length) throw new Error(errors[0].message)
      if (!data) throw new Error('The report was not created. Please try again.')
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-reports'] })
    },
  })
}
