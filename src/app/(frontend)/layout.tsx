import type { Metadata } from 'next'
import './globals.css'
import { getSiteSettings, getNavCategories } from '@/lib/queries'
import { Header } from '@/components/site/Header'
import { Footer } from '@/components/site/Footer'
import { WhatsAppButton } from '@/components/site/WhatsAppButton'
import { AnnouncementBar } from '@/components/site/AnnouncementBar'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'),
  title: {
    default: 'Alert Eye Electronics — CCTV, Security & Electronics in Kenya',
    template: '%s · Alert Eye Electronics',
  },
  description:
    'Buy CCTV cameras, security systems, networking gear and electronics in Kenya. Professional installation, repair and support services.',
  openGraph: { type: 'website', siteName: 'Alert Eye Electronics' },
}

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const [settings, navCategories] = await Promise.all([getSiteSettings(), getNavCategories()])

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <AnnouncementBar text={settings.announcement} />
        <Header settings={settings} navCategories={navCategories} />
        <main className="min-h-[60vh]">{children}</main>
        <Footer settings={settings} navCategories={navCategories} />
        <WhatsAppButton phone={settings.whatsapp} />
      </body>
    </html>
  )
}
