'use client'

import { LinkItem } from '@/lib/types'

interface Props {
  link: LinkItem
}

export default function PublicLinkCard({ link }: Props) {
  const handleClick = async () => {
    fetch(`/api/links/${link.id}/click`, { method: 'POST' })
    window.open(link.url, '_blank')
  }

  return (
    <button
      onClick={handleClick}
      className="w-full bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-3 flex items-center gap-3 hover:shadow-md hover:border-orange-100 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all duration-200 text-left group"
    >
      {/* Product Image or Number */}
      <div className="flex-shrink-0">
        {link.imageUrl ? (
          <div className="relative">
            <img
              src={link.imageUrl}
              alt={link.title}
              className="w-[52px] h-[52px] object-cover rounded-xl shadow-sm"
            />
            {/* Cute number tag */}
            <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[var(--accent)] rounded-full flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-[9px] px-1">{link.number}</span>
            </div>
          </div>
        ) : (
          <div className="w-[52px] h-[52px] bg-gradient-to-br from-orange-100 to-pink-50 rounded-xl flex items-center justify-center border border-orange-100/50">
            <span className="text-[var(--accent)] font-bold text-lg">{link.number}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-0.5">
        <h3 className="text-gray-800 font-semibold text-[14px] truncate leading-snug group-hover:text-[var(--accent)] transition-colors">
          {link.title}
        </h3>

        {(link.price || link.discount) && (
          <div className="flex items-center gap-1.5 mt-1">
            {link.price && (
              <span className="text-[var(--accent)] font-bold text-xs">
                {link.price}
              </span>
            )}
            {link.originalPrice && (
              <span className="text-gray-300 text-[11px] line-through">
                {link.originalPrice}
              </span>
            )}
            {link.discount && (
              <span className="bg-red-50 text-red-500 text-[10px] px-1.5 py-0.5 rounded-md font-semibold">
                {link.discount}
              </span>
            )}
          </div>
        )}

        {link.description && !link.price && (
          <p className="text-gray-400 text-xs truncate mt-0.5">{link.description}</p>
        )}
      </div>

      {/* Arrow */}
      <div className="flex-shrink-0 w-7 h-7 bg-gray-50 group-hover:bg-orange-50 rounded-lg flex items-center justify-center transition-colors">
        <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-[var(--accent)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </button>
  )
}
