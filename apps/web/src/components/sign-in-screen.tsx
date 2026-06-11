'use client'

import { useState } from 'react'

import { BugAntIcon } from '@heroicons/react/20/solid'
import { motion } from 'motion/react'

import { Text } from '@/components/ui/text'
import { useAuth } from '@/contexts/auth-context'

function GoogleIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.1A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.1V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38Z"
        fill="#EA4335"
      />
    </svg>
  )
}

export function SignInScreen() {
  const { signInWithGoogle } = useAuth()
  const [error, setError] = useState<string | null>(null)

  return (
    <main className="flex min-h-svh items-center justify-center bg-surface-raised p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm rounded-2xl border border-border-subtle bg-surface-base p-8 shadow-sm"
      >
        <span className="flex size-12 items-center justify-center rounded-xl bg-primary-600 shadow-sm">
          <BugAntIcon className="size-6 text-white" />
        </span>
        <h1 className="mt-5 text-xl font-semibold tracking-tight text-content-primary">
          Mintable Bug Reports
        </h1>
        <Text className="mt-2">
          Report bugs and issues straight to the development team. Sign in with your{' '}
          <span className="font-medium text-content-secondary">@mintable.com</span> Google account.
        </Text>
        <button
          type="button"
          onClick={() => {
            setError(null)
            signInWithGoogle().catch(() => setError('Sign-in failed. Please try again.'))
          }}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-surface-base px-4 py-2.5 text-sm font-semibold text-content-primary shadow-sm transition hover:bg-surface-raised"
        >
          <GoogleIcon />
          Continue with Google
        </button>
        {error ? (
          <p className="mt-4 text-sm text-danger-500 dark:text-danger-300">{error}</p>
        ) : null}
      </motion.div>
    </main>
  )
}
