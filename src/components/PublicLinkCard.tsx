'use client'

import { LinkItem } from '@/lib/types'

interface Props {
  link: LinkItem
}

export default function PublicLinkCard({ link }: Props) {
  const isDigital = link.type === 'digital'

  const handleClick = async () => {
    fetch(`/api/links/${link.id}/click`, { method: 'POST' })
    if (isDigital && link.orderContact) {
      // Open Telegram
      const contact = link.orderContact.replace('@', '')
      window.open(`https://t.me/${contact}`, '_blank')
    } else {
      window.open(link.url, '_blank')
    }
  }

  return (
    <button
      onClick={handleClick}
      className="w-full bg-gradient-to-r from-[#FFF8F5] to-white border border-orange-100/80 rounded-2xl p-2.5 flex items-center gap-3 hover:shadow-md hover:border-orange-200 active:scale-[0.98] transition-all duration-200 text-left group"
    >
      {/* Product Image or Number */}
      <div className="flex-shrink-0">
        {link.imageUrl ? (
          <div className="relative">
            <img
              src={link.imageUrl}
              alt={link.title}
              className="w-[50px] h-[50px] object-cover rounded-xl border border-orange-50"
            />
            {/* Number ribbon */}
            <div className="absolute -top-1 -left-1 bg-[#ee4d2d] text-white text-[9px] font-bold w-[18px] h-[18px] rounded-md flex items-center justify-center shadow-sm">
              {link.number}
            </div>
          </div>
        ) : (
          <div className="w-[50px] h-[50px] bg-gradient-to-br from-[#FFE8E0] to-[#FFF0EB] rounded-xl flex items-center justify-center border border-orange-100">
            <span className="text-[#ee4d2d] font-extrabold text-base">{link.number}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-gray-800 font-semibold text-[13px] truncate leading-tight group-hover:text-[#ee4d2d] transition-colors">
          {link.title}
        </h3>

        {(link.price || link.discount) ? (
          <div className="flex items-center gap-1.5 mt-1">
            {link.price && (
              <span className="text-[#ee4d2d] font-bold text-[12px]">
                {link.price}
              </span>
            )}
            {link.originalPrice && (
              <span className="text-gray-300 text-[10px] line-through">
                {link.originalPrice}
              </span>
            )}
            {link.discount && (
              <span className="bg-red-50 text-[#ee4d2d] text-[9px] px-1.5 py-0.5 rounded font-bold border border-red-100/50">
                {link.discount}
              </span>
            )}
          </div>
        ) : link.description ? (
          <p className="text-gray-400 text-[11px] truncate mt-0.5">{link.description}</p>
        ) : null}
      </div>

      {/* CTA button */}
      <div className="flex-shrink-0">
        <div className={`${isDigital ? 'bg-blue-600 group-hover:bg-blue-700 shadow-blue-200/50' : 'bg-[#ee4d2d] group-hover:bg-[#d73211] shadow-orange-200/50'} text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors shadow-sm`}>
          {isDigital ? 'Order' : 'Lihat'}
        </div>
      </div>
    </button>
  )
}
