'use client'

import { useCallback, useEffect, useState } from 'react'

import { COLOR_THEMES, DEFAULT_COLOR_THEME } from './themes'

const STORAGE_KEY = 'report-color-theme'

function readStoredTheme(): string {
  if (typeof window === 'undefined') return DEFAULT_COLOR_THEME
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored && COLOR_THEMES.some((theme) => theme.name === stored)
    ? stored
    : DEFAULT_COLOR_THEME
}

/** Active Damon palette: persists to localStorage, swaps the html class. */
export function useColorTheme() {
  const [colorTheme, setColorThemeState] = useState(DEFAULT_COLOR_THEME)

  useEffect(() => {
    setColorThemeState(readStoredTheme())
  }, [])

  const setColorTheme = useCallback((name: string) => {
    const root = document.documentElement
    for (const theme of COLOR_THEMES) root.classList.remove(`theme-${theme.name}`)
    root.classList.add(`theme-${name}`)
    window.localStorage.setItem(STORAGE_KEY, name)
    setColorThemeState(name)
  }, [])

  return { colorTheme, setColorTheme, themes: COLOR_THEMES }
}
