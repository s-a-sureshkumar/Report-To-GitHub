'use client'

import clsx from 'clsx'
import React from 'react'

const colors = {
  primary: 'bg-primary-500/15 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400',
  info: 'bg-info-500/15 text-info-700 dark:bg-info-500/10 dark:text-info-400',
  success: 'bg-success-500/15 text-success-700 dark:bg-success-500/10 dark:text-success-400',
  warning: 'bg-warning-500/15 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400',
  danger: 'bg-danger-500/15 text-danger-700 dark:bg-danger-500/10 dark:text-danger-300',
  neutral: 'bg-surface-sunken text-content-secondary',
}

export type BadgeColor = keyof typeof colors

export function Badge({
  color = 'primary',
  className,
  ...props
}: { color?: BadgeColor; className?: string } & React.ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      {...props}
      className={clsx(
        className,
        'inline-flex items-center gap-x-1.5 rounded-md px-1.5 py-0.5 text-sm/5 font-medium sm:text-xs/5 forced-colors:outline',
        colors[color],
      )}
    />
  )
}
