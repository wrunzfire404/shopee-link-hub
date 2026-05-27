import { getActiveLinks, getLinksData } from '@/lib/storage'
import PublicLinkCard from '@/components/PublicLinkCard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HomePage() {
  const data = await getLinksData()
  const links = await getActiveLinks()
  const socials = data.config.socialLinks

  return (
    <main className="min-h-screen bg-[#FFF5F0] relative overflow-hidden">
      {/* === DECORATIVE ELEMENTS === */}
      {/* Top wave/ribbon */}
      <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-[#ee4d2d] to-[#ff7849] rounded-b-[60px]" />
      
      {/* Floating circles */}
      <div className="absolute top-12 left-6 w-20 h-20 bg-white/10 rounded-full" />
      <div className="absolute top-32 right-8 w-14 h-14 bg-white/10 rounded-full" />
      <div className="absolute top-8 right-24 w-8 h-8 bg-white/20 rounded-full" />
      <div className="absolute top-44 left-16 w-6 h-6 bg-white/15 rounded-full" />
      
      {/* Sparkle dots */}
      <div className="absolute top-20 left-1/3 w-2 h-2 bg-yellow-300/80 rounded-full" />
      <div className="absolute top-36 right-1/3 w-1.5 h-1.5 bg-yellow-200/80 rounded-full" />
      <div className="absolute top-16 right-16 w-2.5 h-2.5 bg-white/50 rounded-full" />

      {/* Bottom decorative */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-orange-50 to-transparent" />
      <div className="absolute bottom-10 left-8 w-24 h-24 bg-orange-100/50 rounded-full blur-2xl" />
      <div className="absolute bottom-20 right-6 w-32 h-32 bg-pink-100/40 rounded-full blur-2xl" />

      {/* === CONTENT === */}
      <div className="relative max-w-md mx-auto px-5 pt-8 pb-12">
        {/* Profile Section (on colored header) */}
        <div className="text-center mb-6 pt-4">
          {/* Avatar with white border */}
          <div className="inline-block mb-3">
            <div className="w-[72px] h-[72px] bg-white rounded-full flex items-center justify-center shadow-lg ring-4 ring-white/30">
              <span className="text-3xl">🛒</span>
            </div>
          </div>

          <h1 className="text-lg font-bold text-white drop-shadow-sm">
            {data.config.name}
          </h1>
          <p className="text-white/80 text-xs mt-1 max-w-[260px] mx-auto">
            {data.config.description}
          </p>

          {/* Social row */}
          {socials && Object.values(socials).some(v => v) && (
            <div className="flex justify-center gap-2 mt-3">
              {socials.tiktok && <SocialBubble href={socials.tiktok} emoji="🎵" />}
              {socials.instagram && <SocialBubble href={socials.instagram} emoji="📸" />}
              {socials.facebook && <SocialBubble href={socials.facebook} emoji="👥" />}
              {socials.threads && <SocialBubble href={socials.threads} emoji="🧵" />}
              {socials.whatsapp && <SocialBubble href={socials.whatsapp} emoji="💬" />}
            </div>
          )}
        </div>

        {/* Product Section Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-orange-900/5 px-4 pt-5 pb-4 border border-orange-100/50">
          {/* Section header with ribbon style */}
          {links.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1.5 bg-[#ee4d2d] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                <span>🔥</span>
                <span>PRODUK PILIHAN</span>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-orange-200 to-transparent" />
            </div>
          )}

          {/* Product List */}
          <div className="space-y-2.5">
            {links.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-4xl block mb-2">📦</span>
                <p className="text-gray-400 text-sm">Belum ada produk</p>
              </div>
            ) : (
              links.map((link, index) => (
                <PublicLinkCard key={link.id} link={{...link, number: index + 1}} />
              ))
            )}
          </div>
        </div>

        {/* Footer badge */}
        {data.config.footerText && (
          <div className="text-center mt-6">
            <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 bg-white/80 px-3 py-1.5 rounded-full border border-gray-100">
              ✅ {data.config.footerText}
            </span>
          </div>
        )}
      </div>
    </main>
  )
}

function SocialBubble({ href, emoji }: { href: string; emoji: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="w-8 h-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all hover:scale-110"
    >
      <span className="text-sm">{emoji}</span>
    </a>
  )
}
