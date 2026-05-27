import { getActiveLinks, getLinksData } from '@/lib/storage'
import LinkCard from '@/components/LinkCard'
import { ShoppingBag } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HomePage() {
  const data = await getLinksData()
  const links = await getActiveLinks()

  const socials = data.config.socialLinks

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#111111] to-[#0a0a0a] py-10 px-4">
      <div className="max-w-md mx-auto">
        {/* Profile Header */}
        <div className="text-center mb-8">
          {/* Avatar with glow */}
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-[var(--accent)] rounded-full blur-xl opacity-30 animate-pulse" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-[var(--accent)] to-orange-700 rounded-full flex items-center justify-center shadow-2xl ring-2 ring-white/10">
              <ShoppingBag className="w-11 h-11 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight">
            {data.config.name}
          </h1>
          <p className="text-[var(--text-secondary)] mt-1.5 text-sm max-w-xs mx-auto">
            {data.config.description}
          </p>

          {/* Social links */}
          {socials && (Object.values(socials).some(v => v)) && (
            <div className="flex justify-center gap-4 mt-4">
              {socials.tiktok && <SocialIcon href={socials.tiktok} label="TikTok" icon="tiktok" />}
              {socials.instagram && <SocialIcon href={socials.instagram} label="IG" icon="instagram" />}
              {socials.facebook && <SocialIcon href={socials.facebook} label="FB" icon="facebook" />}
              {socials.threads && <SocialIcon href={socials.threads} label="Threads" icon="threads" />}
              {socials.whatsapp && <SocialIcon href={socials.whatsapp} label="WA" icon="whatsapp" />}
            </div>
          )}
        </div>

        {/* Product Count Badge */}
        {links.length > 0 && (
          <div className="flex justify-center mb-4">
            <span className="text-xs bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[var(--text-secondary)]">
              🔥 {links.length} produk tersedia
            </span>
          </div>
        )}

        {/* Links */}
        <div className="space-y-3">
          {links.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8 text-[var(--text-secondary)]" />
              </div>
              <p className="text-[var(--text-secondary)]">Belum ada produk tersedia</p>
            </div>
          ) : (
            links.map((link) => (
              <LinkCard key={link.id} link={link} />
            ))
          )}
        </div>

        {/* Footer */}
        {data.config.footerText && (
          <div className="text-center mt-10 pt-6 border-t border-white/5">
            <p className="text-xs text-[var(--text-secondary)]">{data.config.footerText}</p>
          </div>
        )}
      </div>
    </main>
  )
}

function SocialIcon({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="w-9 h-9 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full flex items-center justify-center transition-all duration-200 group"
      title={label}
    >
      <span className="text-sm group-hover:scale-110 transition-transform">
        {icon === 'tiktok' && '♪'}
        {icon === 'instagram' && '📷'}
        {icon === 'facebook' && 'f'}
        {icon === 'threads' && '@'}
        {icon === 'whatsapp' && '💬'}
      </span>
    </a>
  )
}
