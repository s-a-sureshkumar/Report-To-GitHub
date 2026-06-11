import { generateClient } from 'aws-amplify/api'

import type { Schema } from '@report/core-service/data/resource'

type ApiClient = ReturnType<typeof generateClient<Schema>>

let cachedClient: ApiClient | null = null

export function getClient(): ApiClient {
  cachedClient ??= generateClient<Schema>()
  return cachedClient
}

// Lazy proxy so importing this module before Amplify.configure() runs is safe
// (same pattern as the draughtsman api package).
export const client = new Proxy({} as ApiClient, {
  get(_target, prop) {
    const current = getClient() as Record<PropertyKey, unknown>
    const value = current[prop]
    return typeof value === 'function' ? (value as CallableFunction).bind(current) : value
  },
})

export type { Schema }
