import { getActiveLinks, getLinksData } from '@/lib/storage'
import PublicLinkCard from '@/components/PublicLinkCard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HomePage() {
  const data = await getLinksData()
  const links = await getActiveLinks()
  const socials = data.config.socialLinks

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50">
      {/* Decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-md mx-auto px-5 py-10">
        {/* Profile Card */}
        <div className="text-center mb-8">
          {/* Avatar */}
          <div className="inline-block mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-[var(--accent)] to-orange-400 rounded-[22px] flex items-center justify-center shadow-lg shadow-orange-200/50 rotate-3 hover:rotate-0 transition-transform duration-300">
              <span className="text-3xl">🛍️</span>
            </div>
          </div>

          <h1 className="text-xl font-bold text-gray-900">
            {data.config.name}
          </h1>
          <p className="text-gray-500 text-sm mt-1 max-w-[280px] mx-auto leading-relaxed">
            {data.config.description}
          </p>

          {/* Social pills */}
          {socials && Object.values(socials).some(v => v) && (
            <div className="flex justify-center flex-wrap gap-2 mt-4">
              {socials.tiktok && <SocialPill href={socials.tiktok} emoji="🎵" label="TikTok" />}
              {socials.instagram && <SocialPill href={socials.instagram} emoji="📸" label="Instagram" />}
              {socials.facebook && <SocialPill href={socials.facebook} emoji="👤" label="Facebook" />}
              {socials.threads && <SocialPill href={socials.threads} emoji="🧵" label="Threads" />}
              {socials.whatsapp && <SocialPill href={socials.whatsapp} emoji="💬" label="WhatsApp" />}
            </div>
          )}
        </div>

        {/* Product count */}
        {links.length > 0 && (
          <div className="flex items-center gap-2 mb-4 px-1">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Produk Pilihan</span>
            <span className="text-xs bg-[var(--accent)]/10 text-[var(--accent)] font-semibold px-2 py-0.5 rounded-full">{links.length}</span>
          </div>
        )}

        {/* Product List */}
        <div className="space-y-3">
          {links.length === 0 ? (
            <div className="text-center py-16 bg-white/60 backdrop-blur-sm rounded-3xl border border-gray-100">
              <span className="text-4xl mb-3 block">🛒</span>
              <p className="text-gray-400 text-sm">Belum ada produk tersedia</p>
            </div>
          ) : (
            links.map((link) => (
              <PublicLinkCard key={link.id} link={link} />
            ))
          )}
        </div>

        {/* Footer */}
        {data.config.footerText && (
          <div className="text-center mt-10">
            <p className="text-xs text-gray-400">{data.config.footerText}</p>
          </div>
        )}

        {/* Powered by */}
        <div className="text-center mt-4">
          <p className="text-[10px] text-gray-300">⚡ Powered by Shopee Link Hub</p>
        </div>
      </div>
    </main>
  )
}

function SocialPill({ href, emoji, label }: { href: string; emoji: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-100 rounded-full text-xs text-gray-600 hover:border-[var(--accent)]/30 hover:text-[var(--accent)] shadow-sm hover:shadow transition-all duration-200"
    >
      <span>{emoji}</span>
      <span className="font-medium">{label}</span>
    </a>
  )
}
