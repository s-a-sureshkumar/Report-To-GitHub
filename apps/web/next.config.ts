import type { NextConfig } from 'next'
import { join } from 'path'

const nextConfig: NextConfig = {
  output: 'standalone',
  // Monorepo root, so standalone tracing includes hoisted dependencies
  // (same as draughtsman apps).
  outputFileTracingRoot: join(import.meta.dirname, '../../'),
  transpilePackages: ['@report/api'],
}

export default nextConfig
