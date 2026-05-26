import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME || 'Reza Shop',
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'Produk Pilihan dengan Harga Terbaik',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
