import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from 'react-hot-toast'
import { Facebook, Instagram, MessageCircle } from 'lucide-react'
import { ClientOnly } from '@/components/client-only'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'منصة أحمد محرم',
  description: 'منصة تعليمية متكاملة مع أحدث التقنيات',
  keywords: 'تعليم, دورات, امتحانات, تعلم عن بعد',
  authors: [{ name: 'أحمد محرم' }],
  creator: 'أحمد محرم',
  publisher: 'أحمد محرم',
  metadataBase: new URL('https://education-platform.com'),
  openGraph: {
    title: 'منصة التعليم الذهبية',
    description: 'منصة تعليمية متكاملة مع أحدث التقنيات',
    url: 'https://education-platform.com',
    siteName: 'أحمد محرم ',
    locale: 'ar_EG',
    type: 'website',
  },
}

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/images/icon-192.png" />
      </head>
      <body className={`${inter.className} bg-gray-900 text-white`}>
        <Providers>
          {/* Animated Background */}
          <div className="fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900" />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}} />
            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}} />
          </div>
          
          {children}
          
          <ClientOnly>
            <footer className="w-full border-t border-gold/20 bg-black/60 mt-12">
              <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="text-sm text-white/70">©2026 جميع الحقوق محفوظة. ل احمد محرم</div>
                <div className="flex items-center gap-4 text-sm">
                  <a
                    href="https://wa.me/201005209667"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                    className="text-gold hover:text-white transition-colors"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </a>
                  <a
                    href="https://www.facebook.com/ahmd.mhrm.456292"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="text-gold hover:text-white transition-colors"
                    title="Facebook"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                  <a
                    href="https://www.instagram.com/ahmed_mohram6?igsh=cjRjMHNpZXR4aDJz"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="text-gold hover:text-white transition-colors"
                    title="Instagram"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </footer>
          </ClientOnly>
          
          <Toaster
            position="top-center"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
              duration: 4000,
              style: {
                background: 'linear-gradient(to right, #1F2937, #374151)',
                color: '#FFD700',
                border: '1px solid #FFD700',
                borderRadius: '12px',
                fontSize: '14px',
              },
              success: {
                iconTheme: {
                  primary: '#FFD700',
                  secondary: '#1F2937',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#1F2937',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}