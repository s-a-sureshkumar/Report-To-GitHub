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
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
        <ConfigureAmplifyClientSide />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
