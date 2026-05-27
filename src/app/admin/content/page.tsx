'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LinkItem } from '@/lib/types'
import {
  Sparkles, Send, Clock, Image as ImageIcon, ArrowLeft,
  RefreshCw, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react'

type PostStatus = 'idle' | 'generating' | 'ready' | 'posting' | 'posted' | 'error'

export default function ContentCreatorPage() {
  const router = useRouter()
  const [products, setProducts] = useState<LinkItem[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('threads')
  const [selectedProduct, setSelectedProduct] = useState<LinkItem | null>(null)
  const [caption, setCaption] = useState('')
  const [style, setStyle] = useState<'review' | 'promo' | 'story'>('review')
  const [status, setStatus] = useState<PostStatus>('idle')
  const [error, setError] = useState('')
  const [extraImages, setExtraImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [scheduleMode, setScheduleMode] = useState(false)
  const [scheduleTime, setScheduleTime] = useState('')
  const [affiliateLink, setAffiliateLink] = useState('')
  const [postResult, setPostResult] = useState<any>(null)

  useEffect(() => {
    loadProducts()
    loadAccounts()
  }, [])

  async function loadAccounts() {
    try {
      const res = await fetch('/api/wahdx/accounts')
      if (res.ok) {
        const data = await res.json()
        const accs = data.data || []
        setAccounts(accs)
        // Auto-select threads account if available
        const threadsAcc = accs.find((a: any) => a.platform === 'threads')
        if (threadsAcc) {
          setSelectedAccount(threadsAcc.accountId)
          setSelectedPlatform('threads')
        }
      }
    } catch {}
  }
  async function loadProducts() {
    const res = await fetch('/api/links')
    if (res.status === 401) { router.push('/admin/login'); return }
    const data = await res.json()
    setProducts(data.links || [])
  }

  function selectProduct(product: LinkItem) {
    setSelectedProduct(product)
    setAffiliateLink(product.url)
    setCaption('')
    setExtraImages(product.imageUrl ? [product.imageUrl] : [])
    setStatus('idle')
    setPostResult(null)
  }

  async function generateCaption() {
    if (!selectedProduct) return
    setStatus('generating')
    setError('')

    try {
      const res = await fetch('/api/ai/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: selectedProduct.title,
          price: selectedProduct.price,
          discount: selectedProduct.discount,
          description: selectedProduct.description,
          platform: 'Threads',
          style,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'AI generation failed')
        setStatus('idle')
        return
      }

      const data = await res.json()
      // Append affiliate link if not in caption
      let finalCaption = data.caption || ''
      if (affiliateLink && !finalCaption.includes(affiliateLink)) {
        finalCaption += `\n\n🔗 ${affiliateLink}`
      }
      setCaption(finalCaption)
      setStatus('ready')
    } catch {
      setError('Network error')
      setStatus('idle')
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      if (res.ok) {
        const { url } = await res.json()
        setExtraImages(prev => [...prev, url])
      }
    } catch {}
    setUploading(false)
    e.target.value = ''
  }

  function removeImage(idx: number) {
    setExtraImages(prev => prev.filter((_, i) => i !== idx))
  }

  async function postToThreads() {
    if (!caption || !selectedAccount) return
    setStatus('posting')
    setError('')

    try {
      const res = await fetch('/api/post/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption,
          mediaUrls: extraImages.length > 0 ? extraImages : undefined,
          accountId: selectedAccount,
          platform: selectedPlatform,
          scheduleTime: scheduleMode && scheduleTime ? new Date(scheduleTime).toISOString() : undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Post failed')
        setStatus('error')
        return
      }

      setPostResult(data)
      setStatus('posted')
    } catch {
      setError('Network error')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: '#0f0f0f', color: '#fff' }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <a href="/admin" className="p-2 hover:bg-white/5 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </a>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-400" />
              Content Creator
            </h1>
            <p className="text-gray-500 text-xs">Generate & post ke Threads</p>
          </div>
        </div>

        {/* Step 1: Pick Product */}
        {!selectedProduct ? (
          <div>
            <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Pilih Produk</h2>
            {products.length === 0 ? (
              <p className="text-gray-500 text-sm py-8 text-center">Belum ada produk. Tambah di tab Links dulu.</p>
            ) : (
              <div className="grid gap-2">
                {products.filter(p => p.isActive).map(product => (
                  <button
                    key={product.id}
                    onClick={() => selectProduct(product)}
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl p-3 flex items-center gap-3 hover:border-orange-500/50 transition-colors text-left"
                  >
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 bg-[#222] rounded-lg flex items-center justify-center text-gray-500">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{product.title}</p>
                      <p className="text-xs text-gray-500">{product.price} {product.discount}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selected Product */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-3 flex items-center gap-3">
              {selectedProduct.imageUrl && (
                <img src={selectedProduct.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover" />
              )}
              <div className="flex-1">
                <p className="font-medium text-sm">{selectedProduct.title}</p>
                <p className="text-xs text-orange-400">{selectedProduct.price} {selectedProduct.discount}</p>
              </div>
              <button onClick={() => { setSelectedProduct(null); setCaption(''); setStatus('idle') }} className="text-xs text-gray-500 hover:text-white">Ganti</button>
            </div>

            {/* Style Selector */}
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Caption Style</label>
              <div className="flex gap-2">
                {(['review', 'promo', 'story'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      style === s ? 'bg-orange-500 text-white' : 'bg-[#222] text-gray-400 hover:text-white'
                    }`}
                  >
                    {s === 'review' ? '💬 Review' : s === 'promo' ? '🔥 Promo' : '📖 Story'}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateCaption}
              disabled={status === 'generating'}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {status === 'generating' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate Caption</>
              )}
            </button>

            {/* Caption Editor */}
            {caption && (
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block flex items-center justify-between">
                  <span>Caption (edit sesuka lo)</span>
                  <span className="text-gray-600">{caption.length} chars</span>
                </label>
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#333] rounded-xl text-white text-sm resize-none focus:border-orange-500/50 outline-none"
                />
                <button
                  onClick={generateCaption}
                  className="mt-2 text-xs text-gray-500 hover:text-orange-400 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Regenerate
                </button>
              </div>
            )}

            {/* Images */}
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Media ({extraImages.length} gambar)</label>
              <div className="flex gap-2 flex-wrap">
                {extraImages.map((img, i) => (
                  <div key={i} className="relative">
                    <img src={img} alt="" className="w-16 h-16 object-cover rounded-lg border border-[#333]" />
                    <button onClick={() => removeImage(i)} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center">✕</button>
                  </div>
                ))}
                <label className="w-16 h-16 bg-[#1a1a1a] border border-dashed border-[#444] rounded-lg flex items-center justify-center cursor-pointer hover:border-orange-500/50 transition-colors">
                  <span className="text-gray-500 text-lg">{uploading ? '⏳' : '+'}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
                </label>
              </div>
            </div>

            {/* Account Selector */}
            {accounts.length > 0 && (
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Post ke akun</label>
                <div className="flex gap-2 flex-wrap">
                  {accounts.map((acc: any) => (
                    <button
                      key={acc.accountId}
                      onClick={() => { setSelectedAccount(acc.accountId); setSelectedPlatform(acc.platform) }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border transition-colors ${
                        selectedAccount === acc.accountId
                          ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                          : 'bg-[#1a1a1a] border-[#333] text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      {acc.avatar_url && <img src={acc.avatar_url} className="w-5 h-5 rounded-full" alt="" />}
                      <span>{acc.platform === 'threads' ? '🧵' : acc.platform === 'instagram' ? '📸' : acc.platform === 'tiktok' ? '🎵' : '👥'}</span>
                      <span>{acc.username}</span>
                      <span className="text-gray-600">({acc.platform})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Schedule */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={scheduleMode} onChange={e => setScheduleMode(e.target.checked)} className="accent-orange-500" />
                <span className="text-xs text-gray-400">Schedule</span>
              </label>
              {scheduleMode && (
                <input
                  type="datetime-local"
                  value={scheduleTime}
                  onChange={e => setScheduleTime(e.target.value)}
                  className="px-2 py-1 bg-[#1a1a1a] border border-[#333] rounded-lg text-xs text-white outline-none"
                />
              )}
            </div>

            {/* Post Button */}
            {caption && (
              <button
                onClick={postToThreads}
                disabled={status === 'posting'}
                className="w-full py-3 bg-[#ee4d2d] hover:bg-[#d73211] text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {status === 'posting' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Posting...</>
                ) : scheduleMode ? (
                  <><Clock className="w-4 h-4" /> Schedule Post</>
                ) : (
                  <><Send className="w-4 h-4" /> Post ke Threads</>
                )}
              </button>
            )}

            {/* Status Messages */}
            {status === 'posted' && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-green-400 text-sm font-medium">Posted successfully!</p>
                  {postResult?.publishId && <p className="text-xs text-gray-500">ID: {postResult.publishId}</p>}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
