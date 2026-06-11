import type { Metadata } from 'next'

import { ConfigureAmplifyClientSide } from './configure-amplify'
import { Providers } from './providers'

import '@/styles/tailwind.css'

export const metadata: Metadata = {
  title: 'Mintable Bug Reports',
  description: 'Report bugs and issues to the development team',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="bg-surface-base text-content-primary antialiased"
    >
      <head>
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
        {/* Apply the persisted color theme before first paint (same pattern as blueprint). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('report-color-theme')||'damon';document.documentElement.classList.add('theme-'+t)}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-svh font-sans">
        <ConfigureAmplifyClientSide />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
