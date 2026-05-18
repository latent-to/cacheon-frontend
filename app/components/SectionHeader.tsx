import type { ReactNode } from 'react'
import { cn } from '~/lib/cn'

export default function SectionHeader({
  eyebrow,
  title,
  align = 'left',
}: {
  eyebrow: string
  title: ReactNode
  align?: 'left' | 'center'
}) {
  const center = align === 'center'
  return (
    <div className={cn('mb-14', center && 'text-center')}>
      <div
        className={cn(
          'tracking-caps-wide text-accent mb-5 font-mono text-xs font-semibold uppercase',
          center && 'inline-block',
        )}
      >
        {eyebrow}
      </div>
      <h2 className="text-primary font-mono text-[clamp(1.6rem,3.4vw,2.2rem)] leading-[1.15] font-bold tracking-tight">
        {title}
      </h2>
    </div>
  )
}
