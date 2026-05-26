export interface LinkItem {
  id: string
  number: number
  title: string
  description?: string
  url: string
  imageUrl?: string
  price?: string
  originalPrice?: string
  discount?: string
  category?: string
  isActive: boolean
  isPinned: boolean
  clicks: number
  clickHistory: ClickRecord[]
  createdAt: string
  updatedAt: string
}

export interface ClickRecord {
  date: string // YYYY-MM-DD
  count: number
  platform?: string
}

export interface SiteConfig {
  name: string
  description: string
  avatarUrl?: string
  theme: 'dark' | 'light'
  accentColor: string
  socialLinks?: {
    tiktok?: string
    instagram?: string
    facebook?: string
    threads?: string
    whatsapp?: string
  }
  footerText?: string
  showPoweredBy: boolean
}

export interface LinksData {
  config: SiteConfig
  links: LinkItem[]
  categories: string[]
  analytics: AnalyticsSummary
}

export interface AnalyticsSummary {
  totalClicks: number
  totalLinks: number
  activeLinks: number
  clicksToday: number
  clicksThisWeek: number
  clicksThisMonth: number
  topLinks: { id: string; title: string; clicks: number }[]
  dailyClicks: { date: string; count: number }[]
}

export interface BulkAction {
  action: 'activate' | 'deactivate' | 'delete' | 'setCategory'
  ids: string[]
  value?: string
}
