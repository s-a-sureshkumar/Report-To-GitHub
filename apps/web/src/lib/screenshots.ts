'use client'

import { useQuery } from '@tanstack/react-query'
import { getUrl } from 'aws-amplify/storage'

/** Resolves S3 screenshot keys to short-lived signed URLs for display. */
export function useScreenshotUrls(keys: (string | null)[] | null | undefined) {
  const cleanKeys = (keys ?? []).filter(
    (key): key is string => typeof key === 'string' && key.length > 0,
  )
  return useQuery({
    queryKey: ['screenshot-urls', cleanKeys],
    enabled: cleanKeys.length > 0,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const entries = await Promise.all(
        cleanKeys.map(async (key) => {
          const { url } = await getUrl({ path: key, options: { expiresIn: 3600 } })
          return [key, url.toString()] as const
        }),
      )
      return Object.fromEntries(entries) as Record<string, string>
    },
  })
}
