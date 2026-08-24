import { cn } from '~/lib/cn'

export function GlassCard({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <div
      className={cn(
        'border-border/60 bg-surface/60 rounded-xl border backdrop-blur-sm',
        onClick && 'hover:border-border hover:bg-surface/80 cursor-pointer transition-colors',
        className,
      )}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  )
}
