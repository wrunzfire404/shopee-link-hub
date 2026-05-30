'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LinksData, LinkItem } from '@/lib/types'
import {
  Plus, Trash2, Edit2, Eye, EyeOff, ArrowUp, ArrowDown,
  LogOut, ExternalLink, BarChart3, Save, X, Copy, Pin,
  Settings, LayoutDashboard, Link2, Download, Search,
  TrendingUp, MousePointerClick, CheckSquare, Square,
  PinOff
} from 'lucide-react'

type Tab = 'dashboard' | 'links' | 'settings'

export default function AdminPage() {
  const router = useRouter()
  const [data, setData] = useState<LinksData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('links')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '', description: '', url: '', price: '',
    originalPrice: '', discount: '', category: '', imageUrl: '', slug: '',
    type: 'affiliate', orderContact: '',
  })
  // Site settings form
  const [siteForm, setSiteForm] = useState({
    name: '', description: '', footerText: '',
    tiktok: '', instagram: '', facebook: '', threads: '', whatsapp: '',
  })

  useEffect(() => { checkAuth() }, [])

  async function checkAuth() {
    const res = await fetch('/api/auth/check')
    const { authenticated } = await res.json()
    if (!authenticated) { router.push('/admin/login'); return }
    loadData()
  }

  async function loadData() {
    const res = await fetch('/api/links')
    if (res.status === 401) { router.push('/admin/login'); return }
    const json = await res.json()
    setData(json)
    setSiteForm({
      name: json.config.name || '',
      description: json.config.description || '',
      footerText: json.config.footerText || '',
      tiktok: json.config.socialLinks?.tiktok || '',
      instagram: json.config.socialLinks?.instagram || '',
      facebook: json.config.socialLinks?.facebook || '',
      threads: json.config.socialLinks?.threads || '',
      whatsapp: json.config.socialLinks?.whatsapp || '',
    })
    setLoading(false)
  }

  async function handleAdd() {
    const res = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    if (res.ok) { setShowAddForm(false); resetForm(); loadData() }
  }

  async function handleUpdate(id: string) {
    const res = await fetch(`/api/links/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    if (res.ok) { setEditingId(null); resetForm(); loadData() }
  }

  async function handleDelete(id: string) {
    if (!confirm('Yakin hapus link ini?')) return
    await fetch(`/api/links/${id}`, { method: 'DELETE' })
    loadData()
  }

  async function handleDuplicate(id: string) {
    await fetch(`/api/links/${id}/duplicate`, { method: 'POST' })
    loadData()
  }

  async function handleToggleActive(link: LinkItem) {
    await fetch(`/api/links/${link.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !link.isActive }),
    })
    loadData()
  }

  async function handleTogglePin(link: LinkItem) {
    await fetch(`/api/links/${link.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPinned: !link.isPinned }),
    })
    loadData()
  }

  async function handleMoveUp(link: LinkItem) {
    if (!data) return
    const sorted = [...data.links].sort((a, b) => a.number - b.number)
    const idx = sorted.findIndex(l => l.id === link.id)
    if (idx <= 0) return
    const order = sorted.map((l, i) => {
      if (i === idx - 1) return { id: l.id, number: l.number + 1 }
      if (i === idx) return { id: l.id, number: l.number - 1 }
      return { id: l.id, number: l.number }
    })
    await fetch('/api/links', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reorder', order }),
    })
    loadData()
  }

  async function handleMoveDown(link: LinkItem) {
    if (!data) return
    const sorted = [...data.links].sort((a, b) => a.number - b.number)
    const idx = sorted.findIndex(l => l.id === link.id)
    if (idx >= sorted.length - 1) return
    const order = sorted.map((l, i) => {
      if (i === idx) return { id: l.id, number: l.number + 1 }
      if (i === idx + 1) return { id: l.id, number: l.number - 1 }
      return { id: l.id, number: l.number }
    })
    await fetch('/api/links', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reorder', order }),
    })
    loadData()
  }

  async function handleBulkAction(action: string) {
    if (selectedIds.length === 0) return
    if (action === 'delete' && !confirm(`Hapus ${selectedIds.length} link?`)) return
    await fetch('/api/links', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'bulk', bulkAction: action, ids: selectedIds }),
    })
    setSelectedIds([])
    loadData()
  }

  async function handleSaveSettings() {
    await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: siteForm.name,
        description: siteForm.description,
        footerText: siteForm.footerText,
        socialLinks: {
          tiktok: siteForm.tiktok || undefined,
          instagram: siteForm.instagram || undefined,
          facebook: siteForm.facebook || undefined,
          threads: siteForm.threads || undefined,
          whatsapp: siteForm.whatsapp || undefined,
        },
      }),
    })
    loadData()
    alert('Settings saved!')
  }

  async function handleExport() {
    window.open('/api/export', '_blank')
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  function startEdit(link: LinkItem) {
    setEditingId(link.id)
    setFormData({
      title: link.title,
      description: link.description || '',
      url: link.url,
      price: link.price || '',
      originalPrice: link.originalPrice || '',
      discount: link.discount || '',
      category: link.category || '',
      imageUrl: link.imageUrl || '',
      slug: link.slug || '',
      type: link.type || 'affiliate',
      orderContact: link.orderContact || '',
    })
  }

  function resetForm() {
    setFormData({ title: '', description: '', url: '', price: '', originalPrice: '', discount: '', category: '', imageUrl: '', slug: '', type: 'affiliate', orderContact: '' })
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  function selectAll() {
    if (!data) return
    if (selectedIds.length === filteredLinks.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredLinks.map(l => l.id))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--text-secondary)]">Loading...</p>
      </div>
    )
  }

  const sortedLinks = data ? [...data.links].sort((a, b) => a.number - b.number) : []

  // Filters
  const filteredLinks = sortedLinks.filter(link => {
    if (searchQuery && !link.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterCategory && link.category !== filterCategory) return false
    if (filterStatus === 'active' && !link.isActive) return false
    if (filterStatus === 'inactive' && link.isActive) return false
    return true
  })

  const totalClicks = sortedLinks.reduce((sum, l) => sum + l.clicks, 0)
  const analytics = data?.analytics

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-[var(--bg-secondary)] border-b border-[var(--border)] px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold">🛍️ Link Hub Admin</h1>
          <div className="flex gap-2">
            <a href="/admin/content-threads" className="px-3 py-1.5 bg-purple-600/20 border border-purple-500/30 rounded-lg text-xs text-purple-300 hover:bg-purple-600/30 transition-colors flex items-center gap-1">
              📱 Social Bot
            </a>
            <a href="/" target="_blank" className="px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-xs hover:border-[var(--accent)] transition-colors flex items-center gap-1">
              <ExternalLink className="w-3 h-3" /> Preview
            </a>
            <button onClick={handleExport} className="px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-xs hover:border-[var(--accent)] transition-colors flex items-center gap-1">
              <Download className="w-3 h-3" /> Export
            </button>
            <button onClick={handleLogout} className="px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-xs hover:border-red-500 transition-colors">
              <LogOut className="w-3 h-3" />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-[var(--bg-secondary)] border-b border-[var(--border)] px-4">
        <div className="max-w-5xl mx-auto flex gap-1">
          {([
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'links', label: 'Links', icon: Link2 },
            { id: 'settings', label: 'Settings', icon: Settings },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-4">
        {/* ===== DASHBOARD TAB ===== */}
        {activeTab === 'dashboard' && analytics && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Total Links" value={analytics.totalLinks} icon={<Link2 className="w-5 h-5" />} />
              <StatCard label="Active" value={analytics.activeLinks} icon={<Eye className="w-5 h-5" />} color="green" />
              <StatCard label="Total Clicks" value={analytics.totalClicks} icon={<MousePointerClick className="w-5 h-5" />} color="orange" />
              <StatCard label="Clicks Today" value={analytics.clicksToday} icon={<TrendingUp className="w-5 h-5" />} color="blue" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <StatCard label="This Week" value={analytics.clicksThisWeek} />
              <StatCard label="This Month" value={analytics.clicksThisMonth} />
              <StatCard label="Avg/Link" value={analytics.totalLinks > 0 ? Math.round(analytics.totalClicks / analytics.totalLinks) : 0} />
            </div>

            {/* Top Performing Links */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[var(--accent)]" /> Top Performing Links
              </h3>
              {analytics.topLinks.length === 0 ? (
                <p className="text-[var(--text-secondary)] text-sm">Belum ada data clicks</p>
              ) : (
                <div className="space-y-2">
                  {analytics.topLinks.map((link, i) => (
                    <div key={link.id} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-[var(--text-secondary)] text-sm w-5">#{i + 1}</span>
                        <span className="text-sm">{link.title}</span>
                      </div>
                      <span className="text-[var(--accent)] font-semibold text-sm">{link.clicks} clicks</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== LINKS TAB ===== */}
        {activeTab === 'links' && (
          <div className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  placeholder="Cari produk..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-sm text-white placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] outline-none"
                />
              </div>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="px-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-sm text-white outline-none"
              >
                <option value="">All Categories</option>
                {data?.categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-sm text-white outline-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Bulk Actions */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--accent)] rounded-lg p-3">
                <span className="text-sm text-[var(--text-secondary)]">{selectedIds.length} selected</span>
                <button onClick={() => handleBulkAction('activate')} className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded">Activate</button>
                <button onClick={() => handleBulkAction('deactivate')} className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded">Deactivate</button>
                <button onClick={() => handleBulkAction('delete')} className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded">Delete</button>
                <button onClick={() => setSelectedIds([])} className="px-2 py-1 text-xs text-[var(--text-secondary)] ml-auto">Clear</button>
              </div>
            )}

            {/* Add Button */}
            <button
              onClick={() => { setShowAddForm(true); resetForm() }}
              className="w-full py-3 border-2 border-dashed border-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Tambah Link Baru
            </button>

            {/* Add Form */}
            {showAddForm && (
              <div className="bg-[var(--bg-card)] border border-[var(--accent)] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Tambah Link Baru</h3>
                  <button onClick={() => setShowAddForm(false)} className="text-[var(--text-secondary)] hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <LinkForm formData={formData} setFormData={setFormData} categories={data?.categories || []} data={data} onSubmit={handleAdd} submitLabel="Simpan" />
              </div>
            )}

            {/* Select All */}
            <div className="flex items-center gap-2">
              <button onClick={selectAll} className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-white">
                {selectedIds.length === filteredLinks.length && filteredLinks.length > 0 ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                Select All ({filteredLinks.length})
              </button>
            </div>

            {/* Links List */}
            <div className="space-y-2">
              {filteredLinks.map((link) => (
                <div key={link.id} className={`bg-[var(--bg-card)] border rounded-xl p-3 ${!link.isActive ? 'border-red-900/50 opacity-60' : link.isPinned ? 'border-yellow-600/50' : 'border-[var(--border)]'}`}>
                  {editingId === link.id ? (
                    <div>
                      <LinkForm formData={formData} setFormData={setFormData} categories={data?.categories || []} data={data} onSubmit={() => handleUpdate(link.id)} submitLabel="Update" />
                      <button onClick={() => { setEditingId(null); resetForm() }} className="mt-2 w-full py-2 text-sm text-[var(--text-secondary)] hover:text-white">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      {/* Checkbox */}
                      <button onClick={() => toggleSelect(link.id)} className="flex-shrink-0">
                        {selectedIds.includes(link.id) ? <CheckSquare className="w-4 h-4 text-[var(--accent)]" /> : <Square className="w-4 h-4 text-[var(--text-secondary)]" />}
                      </button>
                      {/* Number */}
                      <div className="flex-shrink-0 w-8 h-8 bg-[var(--accent)]/20 rounded-lg flex items-center justify-center">
                        <span className="text-[var(--accent)] font-bold text-sm">{link.number}</span>
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          {link.isPinned && <Pin className="w-3 h-3 text-yellow-400" />}
                          <h3 className="font-semibold text-sm truncate">{link.title}</h3>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {link.price && <span className="text-xs text-[var(--accent)]">{link.price}</span>}
                          {link.discount && <span className="text-xs text-red-400">{link.discount}</span>}
                          {link.category && <span className="text-xs bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded text-[var(--text-secondary)]">{link.category}</span>}
                          <span className="text-xs text-[var(--text-secondary)]"><MousePointerClick className="w-3 h-3 inline mr-0.5" />{link.clicks}</span>
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button onClick={() => handleMoveUp(link)} className="p-1.5 hover:bg-[var(--bg-secondary)] rounded transition-colors" title="Up"><ArrowUp className="w-3.5 h-3.5 text-[var(--text-secondary)]" /></button>
                        <button onClick={() => handleMoveDown(link)} className="p-1.5 hover:bg-[var(--bg-secondary)] rounded transition-colors" title="Down"><ArrowDown className="w-3.5 h-3.5 text-[var(--text-secondary)]" /></button>
                        <button onClick={() => handleTogglePin(link)} className="p-1.5 hover:bg-[var(--bg-secondary)] rounded transition-colors" title={link.isPinned ? 'Unpin' : 'Pin'}>{link.isPinned ? <PinOff className="w-3.5 h-3.5 text-yellow-400" /> : <Pin className="w-3.5 h-3.5 text-[var(--text-secondary)]" />}</button>
                        <button onClick={() => handleToggleActive(link)} className="p-1.5 hover:bg-[var(--bg-secondary)] rounded transition-colors" title={link.isActive ? 'Deactivate' : 'Activate'}>{link.isActive ? <Eye className="w-3.5 h-3.5 text-green-400" /> : <EyeOff className="w-3.5 h-3.5 text-red-400" />}</button>
                        <button onClick={() => startEdit(link)} className="p-1.5 hover:bg-[var(--bg-secondary)] rounded transition-colors" title="Edit"><Edit2 className="w-3.5 h-3.5 text-[var(--text-secondary)]" /></button>
                        <button onClick={() => handleDuplicate(link.id)} className="p-1.5 hover:bg-[var(--bg-secondary)] rounded transition-colors" title="Duplicate"><Copy className="w-3.5 h-3.5 text-[var(--text-secondary)]" /></button>
                        <button onClick={() => handleDelete(link.id)} className="p-1.5 hover:bg-[var(--bg-secondary)] rounded transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredLinks.length === 0 && (
              <p className="text-center text-[var(--text-secondary)] py-8">
                {searchQuery || filterCategory || filterStatus !== 'all' ? 'Tidak ada link yang cocok dengan filter' : 'Belum ada link. Klik "Tambah Link Baru" untuk mulai.'}
              </p>
            )}
          </div>
        )}

        {/* ===== SETTINGS TAB ===== */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Pages / Slugs Management */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
              <h3 className="font-semibold mb-2">Pages (Slug)</h3>
              <p className="text-xs text-[var(--text-secondary)] mb-3">Bikin halaman terpisah per akun. Contoh: sprinx.fun/<b>sasha</b></p>
              <div className="flex gap-2 mb-3">
                <input type="text" placeholder="nama-page (huruf kecil)" id="newSlugInput" className="flex-1 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-white text-sm placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] outline-none" />
                <button onClick={async () => {
                  const input = document.getElementById('newSlugInput') as HTMLInputElement
                  const val = input.value.trim()
                  if (!val) return
                  await fetch('/api/slugs', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({name: val}) })
                  input.value = ''
                  loadData()
                }} className="px-4 py-2 bg-[var(--accent)] text-white text-sm rounded-lg hover:bg-[var(--accent-hover)]">Tambah</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(data?.slugs || []).map((slug: string) => (
                  <div key={slug} className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-1.5">
                    <span className="text-sm text-white">/{slug}</span>
                    <a href={`/${slug}`} target="_blank" className="text-[10px] text-[var(--accent)]">↗</a>
                    <button onClick={async () => {
                      if (!confirm(`Hapus page /${slug}?`)) return
                      await fetch('/api/slugs', { method: 'DELETE', headers: {'Content-Type':'application/json'}, body: JSON.stringify({name: slug}) })
                      loadData()
                    }} className="text-red-400 text-xs ml-1 hover:text-red-300">✕</button>
                  </div>
                ))}
                {(!data?.slugs || data.slugs.length === 0) && <p className="text-xs text-[var(--text-secondary)]">Belum ada page. Tambahin di atas.</p>}
              </div>
            </div>

            {/* Site Info */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
              <h3 className="font-semibold mb-4">Site Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-1 block">Nama Toko</label>
                  <input type="text" value={siteForm.name} onChange={e => setSiteForm({...siteForm, name: e.target.value})} className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-white text-sm focus:border-[var(--accent)] outline-none" />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-1 block">Deskripsi</label>
                  <input type="text" value={siteForm.description} onChange={e => setSiteForm({...siteForm, description: e.target.value})} className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-white text-sm focus:border-[var(--accent)] outline-none" />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-1 block">Footer Text</label>
                  <input type="text" value={siteForm.footerText} onChange={e => setSiteForm({...siteForm, footerText: e.target.value})} className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-white text-sm focus:border-[var(--accent)] outline-none" />
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
              <h3 className="font-semibold mb-4">Social Links</h3>
              <div className="space-y-3">
                <SocialInput label="TikTok" value={siteForm.tiktok} onChange={v => setSiteForm({...siteForm, tiktok: v})} placeholder="https://tiktok.com/@username" />
                <SocialInput label="Instagram" value={siteForm.instagram} onChange={v => setSiteForm({...siteForm, instagram: v})} placeholder="https://instagram.com/username" />
                <SocialInput label="Facebook" value={siteForm.facebook} onChange={v => setSiteForm({...siteForm, facebook: v})} placeholder="https://facebook.com/username" />
                <SocialInput label="Threads" value={siteForm.threads} onChange={v => setSiteForm({...siteForm, threads: v})} placeholder="https://threads.net/@username" />
                <SocialInput label="WhatsApp" value={siteForm.whatsapp} onChange={v => setSiteForm({...siteForm, whatsapp: v})} placeholder="https://wa.me/628xxx" />
              </div>
            </div>

            {/* Save */}
            <button onClick={handleSaveSettings} className="w-full py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
              <Save className="w-5 h-5" /> Save Settings
            </button>

            {/* Danger Zone */}
            <div className="bg-[var(--bg-card)] border border-red-900/50 rounded-xl p-4">
              <h3 className="font-semibold text-red-400 mb-2">Danger Zone</h3>
              <p className="text-xs text-[var(--text-secondary)] mb-3">Export data sebagai backup sebelum melakukan perubahan besar.</p>
              <button onClick={handleExport} className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:border-[var(--accent)] transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" /> Download Backup (JSON)
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// ===== COMPONENTS =====

function StatCard({ label, value, icon, color }: { label: string; value: number; icon?: React.ReactNode; color?: string }) {
  const colorClass = color === 'green' ? 'text-green-400' : color === 'orange' ? 'text-[var(--accent)]' : color === 'blue' ? 'text-blue-400' : 'text-white'
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-[var(--text-secondary)] text-xs">{label}</p>
        {icon && <span className="text-[var(--text-secondary)]">{icon}</span>}
      </div>
      <p className={`text-2xl font-bold mt-1 ${colorClass}`}>{value}</p>
    </div>
  )
}

function SocialInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="text-xs text-[var(--text-secondary)] mb-1 block">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-white text-sm placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] outline-none" />
    </div>
  )
}

function LinkForm({ formData, setFormData, categories, onSubmit, submitLabel, data }: {
  formData: any; setFormData: (d: any) => void; categories: string[]; onSubmit: () => void; submitLabel: string; data: any
}) {
  const [fetching, setFetching] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [productPageUrl, setProductPageUrl] = useState('')
  const [optimizing, setOptimizing] = useState(false)
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([])

  async function handleOptimizeName() {
    if (!formData.title) return
    setOptimizing(true)
    setNameSuggestions([])
    try {
      const res = await fetch('/api/ai/optimize-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalName: formData.title }),
      })
      if (res.ok) {
        const data = await res.json()
        setNameSuggestions(data.suggestions || [])
      }
    } catch {}
    setOptimizing(false)
  }

  async function handleResolveLink() {
    if (!formData.url) return
    setFetching(true)
    try {
      const res = await fetch('/api/links/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formData.url }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.title) setFormData({ ...formData, title: data.title })
        if (data.productPageUrl) setProductPageUrl(data.productPageUrl)
      }
    } catch {}
    setFetching(false)
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
        setFormData({ ...formData, imageUrl: url })
      } else {
        const err = await res.json()
        alert(err.error + (err.detail ? ': ' + err.detail : '') || 'Upload failed')
      }
    } catch {
      alert('Upload failed')
    }
    setUploading(false)
    e.target.value = ''
  }

  return (
    <div className="space-y-3">
      {/* Product Type */}
      <div className="flex gap-2">
        <button type="button" onClick={() => setFormData({...formData, type: 'affiliate'})} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${formData.type === 'affiliate' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)]'}`}>
          🛍️ Affiliate (Shopee)
        </button>
        <button type="button" onClick={() => setFormData({...formData, type: 'digital'})} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${formData.type === 'digital' ? 'bg-blue-600 text-white' : 'bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)]'}`}>
          💎 Digital (Telegram)
        </button>
      </div>

      {/* URL input - only for affiliate */}
      {formData.type === 'affiliate' && (
      <div>
        <input type="text" placeholder="URL Shopee Affiliate (shortlink / full link) *" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-white text-sm placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] outline-none" />
        {formData.url && (
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={handleResolveLink} disabled={fetching} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg disabled:opacity-50">
              {fetching ? '⏳...' : '🔗 Resolve Link'}
            </button>
            <a href={formData.url} target="_blank" rel="noopener" className="px-3 py-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs rounded-lg inline-flex items-center gap-1">
              🛒 Buka di Shopee
            </a>
            {productPageUrl && productPageUrl !== formData.url && (
              <a href={productPageUrl} target="_blank" rel="noopener" className="px-3 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] text-white text-xs rounded-lg inline-flex items-center gap-1 hover:border-[var(--accent)]">
                📄 Product Page
              </a>
            )}
          </div>
        )}
      </div>
      )}

      {/* Order contact for digital products */}
      {formData.type === 'digital' && (
        <div>
          <input type="text" placeholder="Order via Telegram (misal: @nexvorastore_bot) *" value={formData.orderContact} onChange={e => setFormData({...formData, orderContact: e.target.value})} className="w-full px-3 py-2 bg-blue-500/5 border border-blue-500/30 rounded-lg text-white text-sm placeholder:text-[var(--text-secondary)] focus:border-blue-500 outline-none" />
          <p className="text-[10px] text-blue-400/70 mt-1">💎 Produk digital — order langsung via Telegram, gak perlu URL Shopee</p>
        </div>
      )}

      {/* Product Name + AI Optimize */}
      <div className="flex gap-2">
        <input type="text" placeholder="Nama Produk *" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="flex-1 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-white text-sm placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] outline-none" />
        {formData.title && (
          <button type="button" onClick={handleOptimizeName} disabled={optimizing} className="px-2.5 py-2 bg-purple-600/20 border border-purple-500/30 text-purple-300 text-[10px] font-medium rounded-lg hover:bg-purple-600/30 disabled:opacity-50 whitespace-nowrap">
            {optimizing ? '⏳' : '✨ AI Name'}
          </button>
        )}
      </div>
      {nameSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {nameSuggestions.map((s, i) => (
            <button key={i} type="button" onClick={() => { setFormData({...formData, title: s}); setNameSuggestions([]) }} className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded text-[11px] text-purple-300 hover:bg-purple-500/20 transition-colors">{s}</button>
          ))}
        </div>
      )}

      {/* Image Section */}
      <div>
        <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">Foto Produk</label>
        {formData.imageUrl ? (
          <div className="flex items-center gap-3 p-2 bg-[var(--bg-secondary)] rounded-lg">
            <img src={formData.imageUrl} alt="Product" className="w-14 h-14 object-cover rounded-lg" />
            <span className="text-xs text-[var(--text-secondary)] truncate flex-1">{formData.imageUrl.length > 50 ? '...' + formData.imageUrl.slice(-40) : formData.imageUrl}</span>
            <button type="button" onClick={() => setFormData({...formData, imageUrl: ''})} className="text-red-400 text-xs hover:text-red-300">✕ Hapus</button>
          </div>
        ) : (
          <div className="flex gap-2">
            {/* Upload from device */}
            <label className="flex-1 cursor-pointer">
              <div className="px-3 py-3 bg-[var(--bg-secondary)] border border-dashed border-[var(--border)] rounded-lg text-center hover:border-[var(--accent)] transition-colors">
                <p className="text-xs text-[var(--text-secondary)]">
                  {uploading ? '⏳ Uploading...' : '📁 Upload dari HP/PC'}
                </p>
              </div>
              <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
            </label>
            {/* Or paste URL */}
            <input type="text" placeholder="atau paste Image URL" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="flex-1 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-white text-xs placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] outline-none" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <input type="text" placeholder="Harga" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-white text-sm placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] outline-none" />
        <input type="text" placeholder="Harga Asli" value={formData.originalPrice} onChange={e => setFormData({...formData, originalPrice: e.target.value})} className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-white text-sm placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] outline-none" />
        <input type="text" placeholder="Diskon" value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value})} className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-white text-sm placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] outline-none" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-white text-sm outline-none">
          <option value="">No Category</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <select value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-white text-sm outline-none">
          <option value="">All Pages</option>
          {(data?.slugs || []).map((s: string) => <option key={s} value={s}>/{s}</option>)}
        </select>
        <input type="text" placeholder="Deskripsi singkat" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-white text-sm placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] outline-none" />
      </div>
      <button onClick={onSubmit} disabled={!formData.title || (formData.type === 'digital' ? !formData.orderContact : !formData.url)} className="w-full py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
        {submitLabel}
      </button>
    </div>
  )
}
