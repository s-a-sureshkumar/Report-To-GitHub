'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import clsx from 'clsx'

import { SignInScreen } from '@/components/sign-in-screen'
import { useAuth } from '@/contexts/auth-context'

const navigation = [
  { href: '/', label: 'New report' },
  { href: '/reports', label: 'My reports' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { auth, loading, signOut } = useAuth()
  const pathname = usePathname()

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">Loading…</p>
      </main>
    )
  }

  if (!auth) {
    return <SignInScreen />
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <span className="text-base font-semibold">Mintable Bug Reports</span>
          <nav className="flex gap-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition',
                  pathname === item.href
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-600 hover:bg-zinc-200',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-zinc-500 sm:inline">{auth.email}</span>
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-md border border-zinc-300 px-3 py-1.5 font-medium text-zinc-600 transition hover:bg-zinc-100"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="mt-8">{children}</main>
    </div>
  )
}
