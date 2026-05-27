'use client'

import { LinkItem } from '@/lib/types'
import { ExternalLink, Flame } from 'lucide-react'

interface LinkCardProps {
  link: LinkItem
}

export default function LinkCard({ link }: LinkCardProps) {
  const handleClick = async () => {
    fetch(`/api/links/${link.id}/click`, { method: 'POST' })
    window.open(link.url, '_blank')
  }

  return (
    <button
      onClick={handleClick}
      className="w-full bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-3.5 flex items-center gap-3.5 hover:bg-white/[0.06] hover:border-[var(--accent)]/50 hover:shadow-lg hover:shadow-[var(--accent)]/5 transition-all duration-300 text-left group active:scale-[0.98]"
    >
      {/* Product Image or Number */}
      <div className="flex-shrink-0 relative">
        {link.imageUrl ? (
          <div className="relative">
            <img
              src={link.imageUrl}
              alt={link.title}
              className="w-14 h-14 object-cover rounded-xl ring-1 ring-white/10"
            />
            {/* Number badge on image */}
            <div className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-[var(--accent)] rounded-md flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-[10px]">{link.number}</span>
            </div>
          </div>
        ) : (
          <div className="w-14 h-14 bg-gradient-to-br from-[var(--accent)] to-orange-700 rounded-xl flex items-center justify-center shadow-lg shadow-[var(--accent)]/20">
            <span className="text-white font-bold text-xl">{link.number}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {link.isPinned && <Flame className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />}
          <h3 className="text-white font-semibold text-[15px] truncate leading-tight">{link.title}</h3>
        </div>

        {/* Price row */}
        {(link.price || link.discount) && (
          <div className="flex items-center gap-2 mt-1">
            {link.price && (
              <span className="text-[var(--accent)] font-bold text-sm">
                {link.price}
              </span>
            )}
            {link.originalPrice && (
              <span className="text-[var(--text-secondary)] text-xs line-through">
                {link.originalPrice}
              </span>
            )}
            {link.discount && (
              <span className="bg-red-500/15 text-red-400 text-[10px] px-1.5 py-0.5 rounded-md font-semibold">
                {link.discount}
              </span>
            )}
          </div>
        )}

        {/* Description */}
        {link.description && (
          <p className="text-[var(--text-secondary)] text-xs truncate mt-0.5 leading-relaxed">
            {link.description}
          </p>
        )}
      </div>

      {/* Arrow */}
      <div className="flex-shrink-0 w-8 h-8 bg-white/5 group-hover:bg-[var(--accent)]/10 rounded-lg flex items-center justify-center transition-colors">
        <ExternalLink className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors" />
      </div>
    </button>
  )
}
