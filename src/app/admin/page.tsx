'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LinkItem, LinksData } from '@/lib/types'
import {
  Plus, Trash2, Edit2, Eye, EyeOff, ArrowUp, ArrowDown,
  LogOut, ExternalLink, BarChart3, Save, X
} from 'lucide-react'

export default function AdminPage() {
  const router = useRouter()
  const [data, setData] = useState<LinksData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    price: '',
    discount: '',
    number: 0,
  })

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const res = await fetch('/api/auth/check')
    const { authenticated } = await res.json()
    if (!authenticated) {
      router.push('/admin/login')
      return
    }
    loadData()
  }

  async function loadData() {
    const res = await fetch('/api/links')
    if (res.status === 401) {
      router.push('/admin/login')
      return
    }
    const json = await res.json()
    setData(json)
    setLoading(false)
  }

  async function handleAdd() {
    const res = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    if (res.ok) {
      setShowAddForm(false)
      resetForm()
      loadData()
    }
  }

  async function handleUpdate(id: string) {
    const res = await fetch(`/api/links/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    if (res.ok) {
      setEditingId(null)
      resetForm()
      loadData()
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Yakin hapus link ini?')) return
    const res = await fetch(`/api/links/${id}`, { method: 'DELETE' })
    if (res.ok) loadData()
  }

  async function handleToggleActive(link: LinkItem) {
    await fetch(`/api/links/${link.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !link.isActive }),
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
      discount: link.discount || '',
      number: link.number,
    })
  }

  function resetForm() {
    setFormData({ title: '', description: '', url: '', price: '', discount: '', number: 0 })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--text-secondary)]">Loading...</p>
      </div>
    )
  }

  const sortedLinks = data ? [...data.links].sort((a, b) => a.number - b.number) : []
  const totalClicks = sortedLinks.reduce((sum, l) => sum + l.clicks, 0)

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-[var(--text-secondary)] text-sm">Manage your affiliate links</p>
          </div>
          <div className="flex gap-2">
            <a
              href="/"
              target="_blank"
              className="px-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-sm hover:border-[var(--accent)] transition-colors flex items-center gap-1"
            >
              <ExternalLink className="w-4 h-4" />
              Preview
            </a>
            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-sm hover:border-red-500 transition-colors flex items-center gap-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
            <p className="text-[var(--text-secondary)] text-xs">Total Links</p>
            <p className="text-2xl font-bold mt-1">{sortedLinks.length}</p>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
            <p className="text-[var(--text-secondary)] text-xs">Active</p>
            <p className="text-2xl font-bold mt-1 text-green-400">
              {sortedLinks.filter(l => l.isActive).length}
            </p>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
            <p className="text-[var(--text-secondary)] text-xs">Total Clicks</p>
            <p className="text-2xl font-bold mt-1 text-[var(--accent)]">{totalClicks}</p>
          </div>
        </div>

        {/* Add Button */}
        <button
          onClick={() => { setShowAddForm(true); resetForm(); }}
          className="w-full mb-4 py-3 border-2 border-dashed border-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Tambah Link Baru
        </button>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-[var(--bg-card)] border border-[var(--accent)] rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Tambah Link Baru</h3>
              <button onClick={() => setShowAddForm(false)} className="text-[var(--text-secondary)] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nama Produk *"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-white placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] outline-none"
              />
              <input
                type="text"
                placeholder="URL Shopee Affiliate *"
                value={formData.url}
                onChange={e => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-white placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] outline-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Harga (misal: Rp 50.000)"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                  className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-white placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] outline-none"
                />
                <input
                  type="text"
                  placeholder="Diskon (misal: -50%)"
                  value={formData.discount}
                  onChange={e => setFormData({ ...formData, discount: e.target.value })}
                  className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-white placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] outline-none"
                />
              </div>
              <input
                type="text"
                placeholder="Deskripsi singkat (opsional)"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-white placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] outline-none"
              />
              <button
                onClick={handleAdd}
                disabled={!formData.title || !formData.url}
                className="w-full py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Simpan
              </button>
            </div>
          </div>
        )}

        {/* Links List */}
        <div className="space-y-2">
          {sortedLinks.map((link) => (
            <div
              key={link.id}
              className={`bg-[var(--bg-card)] border rounded-xl p-4 ${
                link.isActive ? 'border-[var(--border)]' : 'border-red-900/50 opacity-60'
              }`}
            >
              {editingId === link.id ? (
                /* Edit Mode */
                <div className="space-y-3">
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-white focus:border-[var(--accent)] outline-none"
                  />
                  <input
                    type="text"
                    value={formData.url}
                    onChange={e => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-white focus:border-[var(--accent)] outline-none"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Harga"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: e.target.value })}
                      className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-white focus:border-[var(--accent)] outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Diskon"
                      value={formData.discount}
                      onChange={e => setFormData({ ...formData, discount: e.target.value })}
                      className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-white focus:border-[var(--accent)] outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Deskripsi"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-white focus:border-[var(--accent)] outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(link.id)}
                      className="flex-1 py-2 bg-[var(--accent)] text-white rounded-lg flex items-center justify-center gap-1"
                    >
                      <Save className="w-4 h-4" /> Save
                    </button>
                    <button
                      onClick={() => { setEditingId(null); resetForm(); }}
                      className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="flex items-center gap-3">
                  {/* Number */}
                  <div className="flex-shrink-0 w-8 h-8 bg-[var(--accent)]/20 rounded-lg flex items-center justify-center">
                    <span className="text-[var(--accent)] font-bold text-sm">{link.number}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{link.title}</h3>
                    <div className="flex items-center gap-2">
                      {link.price && <span className="text-xs text-[var(--accent)]">{link.price}</span>}
                      {link.discount && <span className="text-xs text-red-400">{link.discount}</span>}
                      <span className="text-xs text-[var(--text-secondary)]">
                        <BarChart3 className="w-3 h-3 inline mr-0.5" />{link.clicks} clicks
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleMoveUp(link)} className="p-1.5 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors" title="Move up">
                      <ArrowUp className="w-4 h-4 text-[var(--text-secondary)]" />
                    </button>
                    <button onClick={() => handleMoveDown(link)} className="p-1.5 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors" title="Move down">
                      <ArrowDown className="w-4 h-4 text-[var(--text-secondary)]" />
                    </button>
                    <button onClick={() => handleToggleActive(link)} className="p-1.5 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors" title={link.isActive ? 'Deactivate' : 'Activate'}>
                      {link.isActive ? <Eye className="w-4 h-4 text-green-400" /> : <EyeOff className="w-4 h-4 text-red-400" />}
                    </button>
                    <button onClick={() => startEdit(link)} className="p-1.5 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors" title="Edit">
                      <Edit2 className="w-4 h-4 text-[var(--text-secondary)]" />
                    </button>
                    <button onClick={() => handleDelete(link.id)} className="p-1.5 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {sortedLinks.length === 0 && (
          <p className="text-center text-[var(--text-secondary)] py-12">
            Belum ada link. Klik &quot;Tambah Link Baru&quot; untuk mulai.
          </p>
        )}
      </div>
    </div>
  )
}
