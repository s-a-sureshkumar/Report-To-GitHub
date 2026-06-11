/**
 * Generates the web theme CSS + manifest from the Damon mobile app's theme
 * definitions (the source of truth for Mintable palettes).
 *
 * Usage: npx -y tsx scripts/generate-themes.mts [path-to-damon-mobile-platform]
 *
 * Emits:
 *   apps/web/src/styles/themes/<name>.css   (.theme-<name> / .theme-<name>.dark)
 *   apps/web/src/lib/themes.ts              (picker manifest)
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const mobileRoot = resolve(
  process.argv[2] ?? join(repoRoot, '../damon-mobile-platform'),
)

const themesModule = (await import(
  join(mobileRoot, 'apps/mobile/src/design-system/theme/themes/index.ts')
)) as typeof import('../../damon-mobile-platform/apps/mobile/src/design-system/theme/themes/index')

const { THEMES, THEME_NAMES, DEFAULT_THEME, SHADES, CATEGORIES } = themesModule

type ThemeScales = (typeof THEMES)[keyof typeof THEMES]['scalesLight']

const outCssDir = join(repoRoot, 'apps/web/src/styles/themes')
const outManifest = join(repoRoot, 'apps/web/src/lib/themes.ts')
mkdirSync(outCssDir, { recursive: true })

function cssVars(bundle: ThemeScales, indent: string): string {
  const lines: string[] = []
  for (const category of CATEGORIES) {
    const scale = bundle.scales[category]
    for (const shade of SHADES) {
      lines.push(`${indent}--color-${category}-${shade}: ${scale[shade]};`)
    }
    // The web tokens use a 950 step the mobile scales stop short of.
    if (category === 'primary' || category === 'neutral') {
      lines.push(
        `${indent}--color-${category}-950: color-mix(in oklab, ${scale[900]} 78%, black);`,
      )
    }
  }
  const { surface, border, text } = bundle
  lines.push(
    `${indent}--surface-base: ${surface.base};`,
    `${indent}--surface-raised: ${surface.raised};`,
    `${indent}--surface-overlay: ${surface.overlay};`,
    `${indent}--surface-sunken: ${surface.sunken};`,
    `${indent}--surface-disabled: ${surface.disabled};`,
    `${indent}--border-default: ${border.default};`,
    `${indent}--border-subtle: ${border.subtle};`,
    `${indent}--border-strong: ${border.strong};`,
    `${indent}--border-focus: ${border.focus};`,
    `${indent}--border-error: ${border.error};`,
    `${indent}--text-primary: ${text.primary};`,
    `${indent}--text-secondary: ${text.secondary};`,
    `${indent}--text-tertiary: ${text.tertiary};`,
    `${indent}--text-disabled: ${text.disabled};`,
    `${indent}--text-inverse: ${text.inverse};`,
    `${indent}--text-link: ${text.link};`,
    `${indent}--text-on-primary: ${text.onPrimary};`,
    `${indent}--text-on-danger: ${text.onDanger};`,
  )
  return lines.join('\n')
}

for (const name of THEME_NAMES) {
  const def = THEMES[name]
  const css = [
    `/* Auto-generated from damon-mobile-platform theme "${name}" (${def.label}).`,
    ` * ${def.description}`,
    ` * Regenerate: npx -y tsx scripts/generate-themes.mts — do not edit. */`,
    `.theme-${name} {`,
    cssVars(def.scalesLight, '  '),
    `}`,
    ``,
    `.theme-${name}.dark {`,
    cssVars(def.scalesDark, '  '),
    `}`,
    ``,
  ].join('\n')
  writeFileSync(join(outCssDir, `${name}.css`), css)
  console.log(`wrote themes/${name}.css`)
}

const manifest = [
  `// Auto-generated from damon-mobile-platform theme definitions.`,
  `// Regenerate: npx -y tsx scripts/generate-themes.mts — do not edit.`,
  ``,
  `export interface ColorTheme {`,
  `  name: string`,
  `  label: string`,
  `  description: string`,
  `  primarySwatch: string`,
  `  neutralSwatch: string`,
  `}`,
  ``,
  `export const DEFAULT_COLOR_THEME = '${DEFAULT_THEME}'`,
  ``,
  `export const COLOR_THEMES: readonly ColorTheme[] = [`,
  ...THEME_NAMES.map((name) => {
    const def = THEMES[name]
    return `  { name: '${name}', label: '${def.label}', description: ${JSON.stringify(def.description)}, primarySwatch: '${def.primarySwatch}', neutralSwatch: '${def.neutralSwatch}' },`
  }),
  `]`,
  ``,
].join('\n')
writeFileSync(outManifest, manifest)
console.log('wrote apps/web/src/lib/themes.ts')
