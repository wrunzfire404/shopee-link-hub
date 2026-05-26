'use client'

import { LinkItem } from '@/lib/types'
import { ExternalLink } from 'lucide-react'

interface LinkCardProps {
  link: LinkItem
}

export default function LinkCard({ link }: LinkCardProps) {
  const handleClick = async () => {
    // Track click
    fetch(`/api/links/${link.id}/click`, { method: 'POST' })
    // Open link
    window.open(link.url, '_blank')
  }

  return (
    <button
      onClick={handleClick}
      className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 flex items-center gap-4 hover:border-[var(--accent)] hover:bg-[var(--bg-secondary)] transition-all duration-200 text-left group"
    >
      {/* Number badge */}
      <div className="flex-shrink-0 w-10 h-10 bg-[var(--accent)] rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-lg">{link.number}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-semibold truncate">{link.title}</h3>
        <div className="flex items-center gap-2 mt-0.5">
          {link.price && (
            <span className="text-[var(--accent)] font-bold text-sm">
              {link.price}
            </span>
          )}
          {link.discount && (
            <span className="bg-red-500/20 text-red-400 text-xs px-1.5 py-0.5 rounded">
              {link.discount}
            </span>
          )}
        </div>
        {link.description && (
          <p className="text-[var(--text-secondary)] text-sm truncate mt-0.5">
            {link.description}
          </p>
        )}
      </div>

      {/* Arrow */}
      <ExternalLink className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors flex-shrink-0" />
    </button>
  )
}
