import { cn } from '~/lib/cn'

interface LabelProps {
  children: React.ReactNode
  className?: string
  muted?: boolean
}

export function Label({ children, className, muted }: LabelProps) {
  return (
    <span
      className={cn(
        'text-2xs tracking-caps font-mono font-semibold uppercase',
        muted ? 'text-secondary/40' : 'text-secondary',
        className,
      )}
    >
      {children}
    </span>
  )
}
