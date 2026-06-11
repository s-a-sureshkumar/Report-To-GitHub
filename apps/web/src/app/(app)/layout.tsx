'use client'

import { AppShell } from '@/components/app-shell'
import { SignInScreen } from '@/components/sign-in-screen'
import { useAuth } from '@/contexts/auth-context'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { auth, loading } = useAuth()

  if (loading) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-surface-raised">
        <span
          className="size-6 animate-spin rounded-full border-2 border-border-strong border-t-transparent"
          aria-label="Loading"
        />
      </main>
    )
  }

  if (!auth) {
    return <SignInScreen />
  }

  return <AppShell>{children}</AppShell>
}
