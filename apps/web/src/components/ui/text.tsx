'use client'

import clsx from 'clsx'
import React from 'react'

export function Heading({
  className,
  level = 1,
  ...props
}: { className?: string; level?: 1 | 2 | 3 } & React.ComponentPropsWithoutRef<'h1'>) {
  const Element: `h${typeof level}` = `h${level}`
  return (
    <Element
      {...props}
      className={clsx(className, 'text-2xl/8 font-semibold text-content-primary sm:text-xl/8')}
    />
  )
}

export function Subheading({
  className,
  level = 2,
  ...props
}: { className?: string; level?: 1 | 2 | 3 } & React.ComponentPropsWithoutRef<'h2'>) {
  const Element: `h${typeof level}` = `h${level}`
  return (
    <Element
      {...props}
      className={clsx(className, 'text-base/7 font-semibold text-content-primary sm:text-sm/6')}
    />
  )
}

export function Text({ className, ...props }: React.ComponentPropsWithoutRef<'p'>) {
  return (
    <p
      data-slot="text"
      {...props}
      className={clsx(className, 'text-base/6 text-content-tertiary sm:text-sm/6')}
    />
  )
}
