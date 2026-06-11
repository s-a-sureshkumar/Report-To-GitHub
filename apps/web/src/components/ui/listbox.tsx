'use client'

import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import React, { Fragment } from 'react'

export function Listbox<T>({
  className,
  placeholder,
  autoFocus,
  'aria-label': ariaLabel,
  children: options,
  ...props
}: {
  className?: string
  placeholder?: React.ReactNode
  autoFocus?: boolean
  'aria-label'?: string
  children?: React.ReactNode
} & Omit<Headless.ListboxProps<typeof Fragment, T>, 'as' | 'multiple'>) {
  return (
    <Headless.Listbox {...props} multiple={false}>
      <Headless.ListboxButton
        autoFocus={autoFocus}
        data-slot="control"
        aria-label={ariaLabel}
        className={clsx(
          className,
          'group relative block w-full',
          'before:absolute before:inset-px before:rounded-[calc(var(--radius-lg)-1px)] before:bg-surface-overlay before:shadow-sm',
          'dark:before:hidden',
          'focus:outline-hidden',
          'after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:ring-transparent after:ring-inset data-focus:after:ring-2 data-focus:after:ring-primary-500',
          'data-disabled:opacity-50 data-disabled:before:bg-surface-disabled data-disabled:before:shadow-none',
        )}
      >
        <Headless.ListboxSelectedOption
          as="span"
          options={options}
          placeholder={
            placeholder && (
              <span className="block truncate text-content-tertiary">{placeholder}</span>
            )
          }
          className={clsx(
            'relative block min-h-11 w-full appearance-none rounded-lg py-[calc(--spacing(2.5)-1px)] pr-[calc(--spacing(10)-1px)] pl-[calc(--spacing(3.5)-1px)] text-left sm:min-h-9 sm:py-[calc(--spacing(1.5)-1px)] sm:pl-[calc(--spacing(3)-1px)]',
            'text-base/6 text-content-primary placeholder:text-content-tertiary sm:text-sm/6',
            'border border-border group-data-active:border-border-strong group-data-hover:border-border-strong',
            'bg-transparent dark:bg-white/5',
            'group-data-invalid:border-danger-500 group-data-hover:group-data-invalid:border-danger-500',
            'group-data-disabled:border-border group-data-disabled:opacity-100 dark:group-data-disabled:bg-white/2.5',
          )}
        />
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <svg
            className="size-5 stroke-content-tertiary group-data-disabled:stroke-content-disabled sm:size-4"
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
      </Headless.ListboxButton>
      <Headless.ListboxOptions
        transition
        anchor="bottom start"
        className={clsx(
          '[--anchor-gap:--spacing(1)] [--anchor-padding:--spacing(4)]',
          'isolate z-50 max-h-64 w-[var(--button-width)] overflow-y-auto overscroll-contain rounded-lg p-1 select-none',
          'bg-surface-overlay/95 shadow-lg ring-1 ring-border backdrop-blur-xl',
          'outline outline-transparent focus:outline-hidden',
          'transition-opacity duration-100 ease-in data-closed:data-leave:opacity-0 data-transition:pointer-events-none',
        )}
      >
        {options}
      </Headless.ListboxOptions>
    </Headless.Listbox>
  )
}

export function ListboxOption<T>({
  children,
  className,
  ...props
}: { className?: string; children?: React.ReactNode } & Omit<
  Headless.ListboxOptionProps<'div', T>,
  'as' | 'className'
>) {
  const sharedClasses = clsx(
    'flex min-w-0 items-center',
    '*:data-[slot=icon]:size-5 *:data-[slot=icon]:shrink-0 sm:*:data-[slot=icon]:size-4',
    '*:data-[slot=icon]:text-content-tertiary group-data-focus/option:*:data-[slot=icon]:text-content-on-primary',
  )

  return (
    <Headless.ListboxOption as={Fragment} {...props}>
      {({ selectedOption }) => {
        if (selectedOption) {
          return <div className={clsx(className, sharedClasses)}>{children}</div>
        }

        return (
          <div
            className={clsx(
              'group/option grid cursor-default grid-cols-[1.25rem_1fr] items-baseline gap-x-2 rounded-md py-2.5 pr-3.5 pl-2 text-base/6 sm:grid-cols-[1rem_1fr] sm:py-1.5 sm:pr-3 sm:pl-1.5 sm:text-sm/6',
              'text-content-primary outline-hidden',
              'data-focus:bg-primary-500 data-focus:text-content-on-primary',
              'data-disabled:opacity-50',
            )}
          >
            <svg
              className="relative hidden size-5 self-center stroke-current group-data-selected/option:inline sm:size-4"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 8.5l3 3L12 4"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className={clsx(className, sharedClasses, 'col-start-2')}>{children}</span>
          </div>
        )
      }}
    </Headless.ListboxOption>
  )
}

export function ListboxLabel({ className, ...props }: React.ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      {...props}
      className={clsx(className, 'ml-2.5 truncate first:ml-0 sm:ml-2 sm:first:ml-0')}
    />
  )
}
