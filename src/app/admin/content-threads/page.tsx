'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LinkItem } from '@/lib/types'
import {
  Sparkles, Send, Clock, Image as ImageIcon, ArrowLeft,
  RefreshCw, CheckCircle2, AlertCircle, Loader2, CheckSquare, Square,
  ChevronDown, ChevronUp
} from 'lucide-react'

type PostStatus = 'idle' | 'generating' | 'ready' | 'variating' | 'posting' | 'posted' | 'error'

interface ThreadsAccount {
  accountId: string
  platform: string
  display_name: string
  username: string
  avatar_url: string
  followers: number
}

export default function ContentThreadsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<LinkItem[]>([])
  const [accounts, setAccounts] = useState<ThreadsAccount[]>([])
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([])
  const [selectedProduct, setSelectedProduct] = useState<LinkItem | null>(null)
  const [baseCaption, setBaseCaption] = useState('')
  const [variations, setVariations] = useState<string[]>([])
  const [showAllVariations, setShowAllVariations] = useState(false)
  const [style, setStyle] = useState<'review' | 'promo' | 'story'>('review')
  const [status, setStatus] = useState<PostStatus>('idle')
  const [error, setError] = useState('')
  const [extraImages, setExtraImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [scheduleMode, setScheduleMode] = useState(false)
  const [scheduleTime, setScheduleTime] = useState('')
  const [postResults, setPostResults] = useState<any[]>([])
  const [postProgress, setPostProgress] = useState(0)

  useEffect(() => { checkAuth() }, [])

  async function checkAuth() {
    const res = await fetch('/api/auth/check')
    const { authenticated } = await res.json()
    if (!authenticated) { router.push('/admin/login'); return }
    loadProducts()
    loadAccounts()
  }

  async function loadProducts() {
    const res = await fetch('/api/links')
    if (res.ok) { const data = await res.json(); setProducts(data.links || []) }
  }

  async function loadAccounts() {
    try {
      const res = await fetch('/api/wahdx/accounts')
      if (res.ok) {
        const data = await res.json()
        setAccounts((data.data || []).filter((a: any) => a.platform === 'threads'))
      }
    } catch {}
  }

  function toggleAccount(id: string) {
    setSelectedAccountIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }
  function selectAllAccounts() {
    setSelectedAccountIds(selectedAccountIds.length === accounts.length ? [] : accounts.map(a => a.accountId))
  }
  function selectProduct(product: LinkItem) {
    setSelectedProduct(product)
    setExtraImages(product.imageUrl ? [product.imageUrl] : [])
    setBaseCaption('')
    setVariations([])
    setStatus('idle')
    setPostResults([])
  }

  async function generateCaption() {
    if (!selectedProduct) return
    setStatus('generating')
    setError('')
    setVariations([])
    try {
      const res = await fetch('/api/ai/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: selectedProduct.title, price: selectedProduct.price,
          discount: selectedProduct.discount, description: selectedProduct.description,
          platform: 'Threads', style, linkNumber: selectedProduct.number,
        }),
      })
      if (!res.ok) { setError('AI generation failed'); setStatus('idle'); return }
      const data = await res.json()
      setBaseCaption(data.caption || '')
      setStatus('ready')
    } catch { setError('Network error'); setStatus('idle') }
  }

  async function generateVariations() {
    if (!baseCaption || selectedAccountIds.length <= 1) return
    setStatus('variating')
    setError('')
    try {
      // Need (selectedAccounts - 1) variations since base caption is used for first account
      const count = Math.min(selectedAccountIds.length - 1, 15) // Cap at 15 to avoid token limit
      const res = await fetch('/api/ai/generate-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseCaption, count }),
      })
      if (!res.ok) { setError('Variation generation failed'); setStatus('ready'); return }
      const data = await res.json()
      setVariations(data.variations || [])
      setStatus('ready')
    } catch { setError('Network error'); setStatus('ready') }
  }

  function getCaptionForAccount(index: number): string {
    if (index === 0) return baseCaption
    if (variations[index - 1]) return variations[index - 1]
    // Fallback: use base with slight modification
    return baseCaption
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      if (res.ok) { const { url } = await res.json(); setExtraImages(prev => [...prev, url]) }
    } catch {}
    setUploading(false)
    e.target.value = ''
  }
  function removeImage(idx: number) { setExtraImages(prev => prev.filter((_, i) => i !== idx)) }

  async function postToAllAccounts() {
    if (!baseCaption || selectedAccountIds.length === 0) return
    setStatus('posting')
    setError('')
    setPostResults([])
    setPostProgress(0)

    const results: any[] = []
    for (let i = 0; i < selectedAccountIds.length; i++) {
      const accountId = selectedAccountIds[i]
      const caption = getCaptionForAccount(i)
      setPostProgress(i + 1)
      try {
        const res = await fetch('/api/post/threads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            caption, accountId, platform: 'threads',
            mediaUrls: extraImages.length > 0 ? extraImages : undefined,
            scheduleTime: scheduleMode && scheduleTime ? new Date(scheduleTime).toISOString() : undefined,
          }),
        })
        const data = await res.json()
        const acc = accounts.find(a => a.accountId === accountId)
        results.push({ username: acc?.username || '?', success: res.ok, data })
      } catch (err: any) {
        const acc = accounts.find(a => a.accountId === accountId)
        results.push({ username: acc?.username || '?', success: false, data: { error: err.message } })
      }
      if (i < selectedAccountIds.length - 1) await new Promise(r => setTimeout(r, 2000))
    }
    setPostResults(results)
    setStatus(results.every(r => r.success) ? 'posted' : 'error')
    if (!results.every(r => r.success)) setError(`${results.filter(r => !r.success).length}/${results.length} gagal`)
  }

  const previewVariations = variations.slice(0, 3)
  const totalCaptions = 1 + variations.length // base + variations

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: '#0f0f0f', color: '#fff' }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <a href="/admin" className="p-2 hover:bg-white/5 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-400" /></a>
          <div>
            <h1 className="text-xl font-bold">🧵 Threads Bot</h1>
            <p className="text-gray-500 text-xs">Generate variasi caption & post ke semua akun</p>
          </div>
        </div>

        {/* Accounts */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-300">Akun Threads ({accounts.length})</h2>
            <button onClick={selectAllAccounts} className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1">
              {selectedAccountIds.length === accounts.length && accounts.length > 0 ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
              {selectedAccountIds.length === accounts.length && accounts.length > 0 ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          {accounts.length === 0 ? (
            <p className="text-gray-500 text-xs">Loading atau belum ada akun Threads di Wahdx.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {accounts.map(acc => (
                <button key={acc.accountId} onClick={() => toggleAccount(acc.accountId)} className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-colors ${selectedAccountIds.includes(acc.accountId) ? 'bg-orange-500/10 border-orange-500/40' : 'bg-[#111] border-[#2a2a2a] hover:border-[#444]'}`}>
                  {selectedAccountIds.includes(acc.accountId) ? <CheckSquare className="w-4 h-4 text-orange-400 flex-shrink-0" /> : <Square className="w-4 h-4 text-gray-600 flex-shrink-0" />}
                  {acc.avatar_url && <img src={acc.avatar_url} className="w-7 h-7 rounded-full flex-shrink-0" alt="" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">@{acc.username}</p>
                    <p className="text-[10px] text-gray-500">{acc.followers} followers</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {selectedAccountIds.length > 0 && <p className="text-xs text-orange-400 mt-2">✓ {selectedAccountIds.length} akun dipilih</p>}
        </div>

        {/* Product Selection */}
        {!selectedProduct ? (
          <div>
            <h2 className="text-sm font-semibold text-gray-400 mb-3">Pilih Produk</h2>
            {products.filter(p => p.isActive).length === 0 ? (
              <p className="text-gray-500 text-sm py-8 text-center">Belum ada produk aktif.</p>
            ) : (
              <div className="grid gap-2">
                {products.filter(p => p.isActive).map(product => (
                  <button key={product.id} onClick={() => selectProduct(product)} className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl p-3 flex items-center gap-3 hover:border-orange-500/50 transition-colors text-left">
                    {product.imageUrl ? <img src={product.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" /> : <div className="w-12 h-12 bg-[#222] rounded-lg flex items-center justify-center"><ImageIcon className="w-5 h-5 text-gray-500" /></div>}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{product.title}</p>
                      <p className="text-xs text-gray-500">{product.price} {product.discount} • Bio nomer {product.number}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selected product */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-3 flex items-center gap-3">
              {selectedProduct.imageUrl && <img src={selectedProduct.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover" />}
              <div className="flex-1">
                <p className="font-medium text-sm">{selectedProduct.title}</p>
                <p className="text-xs text-orange-400">{selectedProduct.price} {selectedProduct.discount} • Bio nomer {selectedProduct.number}</p>
              </div>
              <button onClick={() => { setSelectedProduct(null); setBaseCaption(''); setVariations([]); setStatus('idle'); setPostResults([]) }} className="text-xs text-gray-500 hover:text-white">Ganti</button>
            </div>

            {/* Style */}
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Style</label>
              <div className="flex gap-2">
                {(['review', 'promo', 'story'] as const).map(s => (
                  <button key={s} onClick={() => setStyle(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${style === s ? 'bg-orange-500 text-white' : 'bg-[#222] text-gray-400 hover:text-white'}`}>
                    {s === 'review' ? '💬 Review' : s === 'promo' ? '🔥 Promo' : '📖 Story'}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate base */}
            <button onClick={generateCaption} disabled={status === 'generating'} className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
              {status === 'generating' ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Base Caption</>}
            </button>

            {/* Base caption editor */}
            {baseCaption && (
              <>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 flex justify-between">
                    <span>Base Caption (akun pertama dapet ini)</span>
                    <span className="text-gray-600">{baseCaption.length} chars</span>
                  </label>
                  <textarea value={baseCaption} onChange={e => { setBaseCaption(e.target.value); setVariations([]) }} rows={4} className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#333] rounded-xl text-white text-sm resize-none focus:border-orange-500/50 outline-none" />
                  <button onClick={generateCaption} className="mt-1 text-xs text-gray-500 hover:text-orange-400 flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Regenerate</button>
                </div>

                {/* Generate variations button */}
                {selectedAccountIds.length > 1 && variations.length === 0 && (
                  <button onClick={generateVariations} disabled={status === 'variating'} className="w-full py-2.5 bg-[#222] border border-[#444] hover:border-purple-500/50 text-white rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                    {status === 'variating' ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating {selectedAccountIds.length - 1} variasi...</> : <><Sparkles className="w-4 h-4 text-purple-400" /> Generate {selectedAccountIds.length - 1} Variasi Caption</>}
                  </button>
                )}

                {/* Variations preview */}
                {variations.length > 0 && (
                  <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-300">📝 {totalCaptions} caption ready ({selectedAccountIds.length} akun)</p>
                      <button onClick={generateVariations} className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Re-spin</button>
                    </div>

                    {/* Show first account = base */}
                    <div className="text-xs text-gray-500 mb-2 py-1 border-b border-[#2a2a2a]">
                      <span className="text-orange-400">@{accounts.find(a => a.accountId === selectedAccountIds[0])?.username}</span> → Base caption ↑
                    </div>

                    {/* Preview 3 variations */}
                    {previewVariations.map((v, i) => (
                      <div key={i} className="py-2 border-b border-[#2a2a2a] last:border-0">
                        <p className="text-[10px] text-orange-400 mb-1">@{accounts.find(a => a.accountId === selectedAccountIds[i + 1])?.username || `Akun ${i + 2}`}</p>
                        <p className="text-xs text-gray-300 line-clamp-2">{v}</p>
                      </div>
                    ))}

                    {/* Show more toggle */}
                    {variations.length > 3 && (
                      <button onClick={() => setShowAllVariations(!showAllVariations)} className="w-full mt-2 py-1.5 text-[11px] text-gray-500 hover:text-white flex items-center justify-center gap-1">
                        {showAllVariations ? <><ChevronUp className="w-3 h-3" /> Tutup</> : <><ChevronDown className="w-3 h-3" /> Lihat {variations.length - 3} variasi lainnya</>}
                      </button>
                    )}

                    {showAllVariations && variations.slice(3).map((v, i) => (
                      <div key={i + 3} className="py-2 border-b border-[#2a2a2a] last:border-0">
                        <p className="text-[10px] text-orange-400 mb-1">@{accounts.find(a => a.accountId === selectedAccountIds[i + 4])?.username || `Akun ${i + 5}`}</p>
                        <p className="text-xs text-gray-300 line-clamp-2">{v}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Images & Video */}
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Media ({extraImages.length})</label>
              <div className="flex gap-2 flex-wrap">
                {extraImages.map((url, i) => (
                  <div key={i} className="relative">
                    {url.match(/\.(mp4|mov|webm|avi)$/i) || url.includes('video') ? (
                      <div className="w-14 h-14 bg-[#222] rounded-lg border border-[#333] flex items-center justify-center">
                        <span className="text-lg">🎬</span>
                      </div>
                    ) : (
                      <img src={url} alt="" className="w-14 h-14 object-cover rounded-lg border border-[#333]" />
                    )}
                    <button onClick={() => removeImage(i)} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center">✕</button>
                  </div>
                ))}
                <label className="w-14 h-14 bg-[#1a1a1a] border border-dashed border-[#444] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-orange-500/50 gap-0.5">
                  <span className="text-gray-500 text-xs">{uploading ? '⏳' : '📷'}</span>
                  <span className="text-[9px] text-gray-600">img</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
                </label>
                <label className="w-14 h-14 bg-[#1a1a1a] border border-dashed border-[#444] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-500/50 gap-0.5">
                  <span className="text-gray-500 text-xs">{uploading ? '⏳' : '🎬'}</span>
                  <span className="text-[9px] text-gray-600">video</span>
                  <input type="file" accept="video/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
                </label>
              </div>
              <p className="text-[10px] text-gray-600 mt-1">Gambar max 2MB • Video max 50MB</p>
            </div>

            {/* Schedule */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={scheduleMode} onChange={e => setScheduleMode(e.target.checked)} className="accent-orange-500" />
                <span className="text-xs text-gray-400">Schedule</span>
              </label>
              {scheduleMode && <input type="datetime-local" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} className="px-2 py-1 bg-[#1a1a1a] border border-[#333] rounded-lg text-xs text-white outline-none" />}
            </div>

            {/* Post button */}
            {baseCaption && selectedAccountIds.length > 0 && (
              <button onClick={postToAllAccounts} disabled={status === 'posting'} className="w-full py-3 bg-[#ee4d2d] hover:bg-[#d73211] text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                {status === 'posting' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Posting {postProgress}/{selectedAccountIds.length}...</>
                ) : scheduleMode ? (
                  <><Clock className="w-4 h-4" /> Schedule ke {selectedAccountIds.length} akun</>
                ) : (
                  <><Send className="w-4 h-4" /> Post ke {selectedAccountIds.length} akun {variations.length > 0 ? '(variasi)' : '(sama)'}</>
                )}
              </button>
            )}
            {baseCaption && selectedAccountIds.length === 0 && (
              <p className="text-xs text-yellow-400 text-center">⚠️ Pilih minimal 1 akun</p>
            )}
            {baseCaption && selectedAccountIds.length > 1 && variations.length === 0 && (
              <p className="text-xs text-yellow-500/70 text-center">💡 Generate variasi dulu biar tiap akun dapet caption beda</p>
            )}

            {/* Results */}
            {postResults.length > 0 && (
              <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-3 space-y-1">
                <h3 className="text-xs font-semibold text-gray-400 mb-2">Hasil</h3>
                {postResults.map((r, i) => (
                  <div key={i} className={`flex items-center gap-2 text-xs py-1 ${r.success ? 'text-green-400' : 'text-red-400'}`}>
                    {r.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    <span>@{r.username}</span>
                    <span className="text-gray-600">{r.success ? '✓' : '✗'}</span>
                  </div>
                ))}
              </div>
            )}

            {error && status !== 'posting' && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
