import { getLinksData } from '@/lib/storage'
import PublicLinkCard from '@/components/PublicLinkCard'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function SlugPage({ params }: { params: { slug: string } }) {
  const data = await getLinksData()
  const { slug } = params

  // Check if slug exists
  if (!data.slugs.includes(slug)) {
    notFound()
  }

  // Get links for this slug
  const links = data.links
    .filter(link => link.isActive && link.slug === slug)
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return a.number - b.number
    })

  const socials = data.config.socialLinks

  return (
    <main className="min-h-screen bg-[#FFF5F0] relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-[#ee4d2d] to-[#ff7849] rounded-b-[60px]" />
      <div className="absolute top-12 left-6 w-20 h-20 bg-white/10 rounded-full" />
      <div className="absolute top-32 right-8 w-14 h-14 bg-white/10 rounded-full" />
      <div className="absolute top-8 right-24 w-8 h-8 bg-white/20 rounded-full" />
      <div className="absolute top-20 left-1/3 w-2 h-2 bg-yellow-300/80 rounded-full" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-orange-50 to-transparent" />

      <div className="relative max-w-md mx-auto px-5 pt-8 pb-12">
        {/* Header */}
        <div className="text-center mb-6 pt-4">
          <div className="inline-block mb-3">
            <div className="w-[72px] h-[72px] bg-white rounded-full flex items-center justify-center shadow-lg ring-4 ring-white/30">
              <span className="text-3xl">🛒</span>
            </div>
          </div>
          <h1 className="text-lg font-bold text-white drop-shadow-sm">{data.config.name}</h1>
          <p className="text-white/80 text-xs mt-1">/{slug}</p>

          {socials && Object.values(socials).some(v => v) && (
            <div className="flex justify-center gap-2 mt-3">
              {socials.tiktok && <a href={socials.tiktok} target="_blank" rel="noopener" className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm">🎵</a>}
              {socials.instagram && <a href={socials.instagram} target="_blank" rel="noopener" className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm">📸</a>}
            </div>
          )}
        </div>

        {/* Products */}
        <div className="bg-white rounded-3xl shadow-xl shadow-orange-900/5 px-4 pt-5 pb-4 border border-orange-100/50">
          {links.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1.5 bg-[#ee4d2d] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                <span>🔥</span><span>PRODUK PILIHAN</span>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-orange-200 to-transparent" />
            </div>
          )}

          <div className="space-y-2.5">
            {links.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-4xl block mb-2">📦</span>
                <p className="text-gray-400 text-sm">Belum ada produk di halaman ini</p>
              </div>
            ) : (
              links.map((link, index) => <PublicLinkCard key={link.id} link={{...link, number: index + 1}} />)
            )}
          </div>
        </div>

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
