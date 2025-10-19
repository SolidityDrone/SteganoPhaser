import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { headers } from 'next/headers' // added
import ContextProvider from '@/context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Gazometer',
  description: 'Private and verifiable computing platform',
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {


  const headersObj = await headers();
  const cookies = headersObj.get('cookie')

  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white`}>
        <ContextProvider cookies={cookies}>
          <main className="relative z-10">{children}</main>
        </ContextProvider>
      </body>
    </html>
  )
}