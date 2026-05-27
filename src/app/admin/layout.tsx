export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{
      background: '#0f0f0f',
      color: '#ffffff',
      minHeight: '100vh',
      ['--bg-primary' as any]: '#0f0f0f',
      ['--bg-secondary' as any]: '#1a1a1a',
      ['--bg-card' as any]: '#222222',
      ['--text-primary' as any]: '#ffffff',
      ['--text-secondary' as any]: '#a0a0a0',
      ['--accent' as any]: '#ee4d2d',
      ['--accent-hover' as any]: '#d73211',
      ['--border' as any]: '#333333',
    }}>
      {children}
    </div>
  )
}
