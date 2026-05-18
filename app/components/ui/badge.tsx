import { cn } from '~/lib/cn'

const variants = {
  accent: 'bg-accent/15 text-accent',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  error: 'bg-error/15 text-error',
  info: 'bg-info/15 text-info',
  neutral: 'bg-white/[0.06] text-secondary/75',
} as const

type BadgeVariant = keyof typeof variants

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
  dot?: boolean
}

const dotColors: Record<BadgeVariant, string> = {
  accent: 'bg-accent shadow-accent-sm',
  success: 'bg-success shadow-accent-sm',
  warning: 'bg-warning',
  error: 'bg-error shadow-error-sm',
  info: 'bg-info',
  neutral: 'bg-secondary/40',
}

export function Badge({ variant = 'neutral', children, className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-xs font-bold tracking-[0.12em] uppercase',
        variants[variant],
        className,
      )}
    >
      {dot && <span className={cn('inline-block size-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  )
}
