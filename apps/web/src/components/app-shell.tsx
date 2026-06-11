'use client'

import { useState } from 'react'

import * as Headless from '@headlessui/react'
import {
  ArrowRightStartOnRectangleIcon,
  Bars3Icon,
  BugAntIcon,
  CheckIcon,
  ListBulletIcon,
  MoonIcon,
  PencilSquareIcon,
  SunIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid'
import clsx from 'clsx'
import { motion } from 'motion/react'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'

import { Link } from '@/components/ui/link'
import { useAuth } from '@/contexts/auth-context'
import { useColorTheme } from '@/lib/color-theme'

const navigation = [
  { href: '/', label: 'New report', icon: PencilSquareIcon },
  { href: '/reports', label: 'My reports', icon: ListBulletIcon },
]

function Brand() {
  return (
    <div className="flex items-center gap-3 px-2">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-600 shadow-sm">
        <BugAntIcon className="size-5 text-white" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-content-primary">Damon</span>
        <span className="block truncate text-xs text-content-tertiary">Bug Reports</span>
      </span>
    </div>
  )
}

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <div className="flex flex-col gap-0.5">
      {navigation.map((item) => {
        const current = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
        return (
          <span key={item.href} className="relative">
            {current && (
              <motion.span
                layoutId="current-indicator"
                className="absolute inset-y-2 -left-4 w-0.5 rounded-full bg-primary-600 dark:bg-primary-400"
              />
            )}
            <Headless.DataInteractive>
              <Link
                href={item.href}
                onClick={onNavigate}
                className={clsx(
                  'flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-base/6 font-medium sm:py-2 sm:text-sm/5',
                  current
                    ? 'bg-neutral-950/5 text-content-primary dark:bg-white/5'
                    : 'text-content-secondary data-hover:bg-neutral-950/5 dark:data-hover:bg-white/5',
                )}
              >
                <item.icon
                  className={clsx(
                    'size-5 shrink-0 sm:size-4',
                    current ? 'fill-content-primary' : 'fill-neutral-500',
                  )}
                />
                {item.label}
              </Link>
            </Headless.DataInteractive>
          </span>
        )
      })}
    </div>
  )
}

function SidebarFooter() {
  const { auth, signOut } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()
  const initial = (auth?.name ?? auth?.email ?? '?').charAt(0).toUpperCase()

  return (
    <div className="flex flex-col gap-3 border-t border-border-subtle p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-sm font-semibold text-content-secondary">
          {initial}
        </span>
        <span className="min-w-0 flex-1">
          {auth?.name ? (
            <span className="block truncate text-sm font-medium text-content-primary">
              {auth.name}
            </span>
          ) : null}
          <span className="block truncate text-xs text-content-tertiary">{auth?.email}</span>
        </span>
      </div>
      <div className="flex items-center gap-1">
        <PalettePicker />
        <button
          type="button"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-content-secondary transition hover:bg-neutral-950/5 dark:hover:bg-white/5"
          aria-label="Toggle light or dark mode"
        >
          <SunIcon className="size-4 dark:hidden" />
          <MoonIcon className="hidden size-4 dark:block" />
        </button>
        <button
          type="button"
          onClick={() => void signOut()}
          className="ml-auto flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-content-secondary transition hover:bg-neutral-950/5 dark:hover:bg-white/5"
        >
          <ArrowRightStartOnRectangleIcon className="size-4" />
          Sign out
        </button>
      </div>
    </div>
  )
}

function PalettePicker() {
  const { colorTheme, setColorTheme, themes } = useColorTheme()
  const active = themes.find((theme) => theme.name === colorTheme)

  return (
    <Headless.Menu>
      <Headless.MenuButton className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-content-secondary transition data-hover:bg-neutral-950/5 dark:data-hover:bg-white/5">
        <span
          className="size-3.5 rounded-full border border-neutral-950/20 dark:border-white/20"
          style={{ backgroundColor: active?.primarySwatch }}
        />
        {active?.label ?? 'Theme'}
      </Headless.MenuButton>
      <Headless.MenuItems
        anchor="top start"
        transition
        className="z-50 mb-2 w-56 origin-bottom-left rounded-xl border border-border-subtle bg-surface-overlay p-1 shadow-lg transition duration-100 ease-out [--anchor-gap:--spacing(1)] focus:outline-hidden data-closed:scale-95 data-closed:opacity-0"
      >
        {themes.map((theme) => (
          <Headless.MenuItem key={theme.name}>
            <button
              type="button"
              onClick={() => setColorTheme(theme.name)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-content-primary data-focus:bg-neutral-950/5 dark:data-focus:bg-white/10"
            >
              <span className="flex -space-x-1">
                <span
                  className="size-4 rounded-full border border-neutral-950/20 dark:border-white/20"
                  style={{ backgroundColor: theme.primarySwatch }}
                />
                <span
                  className="size-4 rounded-full border border-neutral-950/20 dark:border-white/20"
                  style={{ backgroundColor: theme.neutralSwatch }}
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm/5 font-medium">{theme.label}</span>
                <span className="block truncate text-xs text-content-tertiary">
                  {theme.description}
                </span>
              </span>
              {theme.name === colorTheme ? (
                <CheckIcon className="size-4 shrink-0 text-primary-600 dark:text-primary-400" />
              ) : null}
            </button>
          </Headless.MenuItem>
        ))}
      </Headless.MenuItems>
    </Headless.Menu>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col border-b border-border-subtle p-4">
        <Brand />
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto p-4">
        <NavItems onNavigate={onNavigate} />
      </div>
      <SidebarFooter />
    </nav>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [showSidebar, setShowSidebar] = useState(false)

  return (
    <div className="relative isolate flex min-h-svh w-full bg-surface-base max-lg:flex-col lg:bg-surface-raised">
      {/* Desktop sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 max-lg:hidden">
        <SidebarContent />
      </div>

      {/* Mobile slide-over sidebar */}
      <Headless.Dialog open={showSidebar} onClose={setShowSidebar} className="lg:hidden">
        <Headless.DialogBackdrop
          transition
          className="fixed inset-0 bg-neutral-950/30 transition data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
        />
        <Headless.DialogPanel
          transition
          className="fixed inset-y-0 w-full max-w-80 p-2 transition duration-300 ease-in-out data-closed:-translate-x-full"
        >
          <div className="flex h-full flex-col rounded-lg bg-surface-base shadow-xs ring-1 ring-border-subtle">
            <div className="-mb-3 px-4 pt-3">
              <button
                type="button"
                onClick={() => setShowSidebar(false)}
                className="rounded-lg p-2 text-content-secondary hover:bg-neutral-950/5 dark:hover:bg-white/5"
                aria-label="Close navigation"
              >
                <XMarkIcon className="size-5" />
              </button>
            </div>
            <SidebarContent onNavigate={() => setShowSidebar(false)} />
          </div>
        </Headless.DialogPanel>
      </Headless.Dialog>

      {/* Mobile header */}
      <header className="flex items-center gap-2 border-b border-border-subtle px-4 py-2.5 lg:hidden">
        <button
          type="button"
          onClick={() => setShowSidebar(true)}
          className="rounded-lg p-2 text-content-secondary hover:bg-neutral-950/5 dark:hover:bg-white/5"
          aria-label="Open navigation"
        >
          <Bars3Icon className="size-5" />
        </button>
        <Brand />
      </header>

      {/* Content */}
      <main className="flex flex-1 flex-col pb-2 lg:min-w-0 lg:pt-2 lg:pr-2 lg:pl-64">
        <div className="grow p-6 lg:rounded-2xl lg:p-10 lg:bg-surface-base lg:shadow-sm lg:shadow-neutral-950/10 lg:ring-1 lg:ring-border-subtle">
          <div className="mx-auto max-w-3xl">{children}</div>
        </div>
      </main>
    </div>
  )
}
