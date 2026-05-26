export interface LinkItem {
  id: string
  number: number
  title: string
  description?: string
  url: string
  imageUrl?: string
  price?: string
  discount?: string
  isActive: boolean
  clicks: number
  createdAt: string
  updatedAt: string
}

export interface SiteConfig {
  name: string
  description: string
  avatarUrl?: string
  socialLinks?: {
    tiktok?: string
    instagram?: string
    facebook?: string
  }
}

export interface LinksData {
  config: SiteConfig
  links: LinkItem[]
}
