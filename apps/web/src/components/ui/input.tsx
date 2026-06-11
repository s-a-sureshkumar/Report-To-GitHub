'use client'

import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import React, { forwardRef } from 'react'

const wrapperClasses = [
  'relative block w-full',
  'before:absolute before:inset-px before:rounded-[calc(var(--radius-lg)-1px)] before:bg-white before:shadow-sm',
  'dark:before:hidden',
  'after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:ring-transparent after:ring-inset sm:focus-within:after:ring-2 sm:focus-within:after:ring-primary-500',
  'has-data-disabled:opacity-50 has-data-disabled:before:bg-neutral-900/5 has-data-disabled:before:shadow-none',
]

const controlClasses = [
  'relative block w-full appearance-none rounded-lg px-[calc(--spacing(3.5)-1px)] py-[calc(--spacing(2.5)-1px)]',
  'text-base/6 text-neutral-900 placeholder:text-neutral-500 sm:text-sm/6 dark:text-white',
  'border border-neutral-900/10 data-hover:border-neutral-900/20 dark:border-white/10 dark:data-hover:border-white/20',
  'bg-transparent dark:bg-white/5',
  'focus:outline-hidden',
  'data-invalid:border-danger-500 data-invalid:data-hover:border-danger-500',
  'data-disabled:border-neutral-900/20 dark:data-disabled:border-white/15 dark:data-disabled:bg-white/2.5',
  'dark:scheme-dark',
]

export const Input = forwardRef(function Input(
  { className, ...props }: { className?: string } & Omit<Headless.InputProps, 'as' | 'className'>,
  ref: React.ForwardedRef<HTMLInputElement>,
) {
  return (
    <span data-slot="control" className={clsx(className, wrapperClasses)}>
      <Headless.Input ref={ref} {...props} className={clsx(controlClasses)} />
    </span>
  )
})

export const Textarea = forwardRef(function Textarea(
  {
    className,
    resizable = true,
    ...props
  }: { className?: string; resizable?: boolean } & Omit<Headless.TextareaProps, 'as' | 'className'>,
  ref: React.ForwardedRef<HTMLTextAreaElement>,
) {
  return (
    <span data-slot="control" className={clsx(className, wrapperClasses)}>
      <Headless.Textarea
        ref={ref}
        {...props}
        className={clsx(controlClasses, resizable ? 'resize-y' : 'resize-none')}
      />
    </span>
  )
})

export const Select = forwardRef(function Select(
  { className, ...props }: { className?: string } & Omit<Headless.SelectProps, 'as' | 'className'>,
  ref: React.ForwardedRef<HTMLSelectElement>,
) {
  return (
    <span data-slot="control" className={clsx(className, wrapperClasses, 'group')}>
      <Headless.Select
        ref={ref}
        {...props}
        className={clsx(
          'relative block w-full appearance-none rounded-lg py-[calc(--spacing(2.5)-1px)]',
          'pr-[calc(--spacing(10)-1px)] pl-[calc(--spacing(3.5)-1px)]',
          '[&_optgroup]:font-semibold',
          'text-base/6 text-neutral-900 placeholder:text-neutral-500 sm:text-sm/6 dark:text-white dark:*:text-white',
          'border border-neutral-900/10 data-hover:border-neutral-900/20 dark:border-white/10 dark:data-hover:border-white/20',
          'bg-transparent dark:bg-white/5 dark:*:bg-neutral-800',
          'dark:scheme-dark',
          'focus:outline-hidden',
          'data-invalid:border-danger-500 data-invalid:data-hover:border-danger-500',
          'data-disabled:border-neutral-900/20 data-disabled:opacity-100 dark:data-disabled:border-white/15',
        )}
      />
      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
        <svg
          className="size-5 stroke-neutral-500 group-has-data-disabled:stroke-neutral-600 sm:size-4 dark:stroke-neutral-400"
          viewBox="0 0 16 16"
          aria-hidden="true"
          fill="none"
        >
          <path
            d="M5.75 10.75L8 13L10.25 10.75"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10.25 5.25L8 3L5.75 5.25"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </span>
  )
})
