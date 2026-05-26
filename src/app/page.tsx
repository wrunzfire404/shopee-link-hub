import { getActiveLinks, getLinksData } from '@/lib/storage'
import LinkCard from '@/components/LinkCard'
import { ShoppingBag } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HomePage() {
  const data = await getLinksData()
  const links = await getActiveLinks()

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[var(--accent)] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[var(--accent)]/20">
            <ShoppingBag className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {data.config.name}
          </h1>
          <p className="text-[var(--text-secondary)] mt-1 text-sm">
            {data.config.description}
          </p>

          {/* Social Links */}
          {data.config.socialLinks && (
            <div className="flex justify-center gap-3 mt-3">
              {data.config.socialLinks.tiktok && (
                <a href={data.config.socialLinks.tiktok} target="_blank" rel="noopener" className="text-[var(--text-secondary)] hover:text-white text-xs transition-colors">TikTok</a>
              )}
              {data.config.socialLinks.instagram && (
                <a href={data.config.socialLinks.instagram} target="_blank" rel="noopener" className="text-[var(--text-secondary)] hover:text-white text-xs transition-colors">Instagram</a>
              )}
              {data.config.socialLinks.facebook && (
                <a href={data.config.socialLinks.facebook} target="_blank" rel="noopener" className="text-[var(--text-secondary)] hover:text-white text-xs transition-colors">Facebook</a>
              )}
            </div>
          )}
        </div>

        {/* Links */}
        <div className="space-y-3">
          {links.length === 0 ? (
            <p className="text-center text-[var(--text-secondary)] py-8">
              Belum ada produk tersedia
            </p>
          ) : (
            links.map((link) => (
              <LinkCard key={link.id} link={link} />
            ))
          )}
        </div>

        {/* Footer */}
        {data.config.footerText && (
          <div className="text-center mt-10 text-sm text-[var(--text-secondary)]">
            <p>{data.config.footerText}</p>
          </div>
        )}
      </div>
    </main>
  )
}
