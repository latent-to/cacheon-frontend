import { ExternalLink } from 'lucide-react'

interface LinkButtonProps {
  href: string
  className?: string
}

export function LinkButton({ href, className = '' }: LinkButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="Open in new tab"
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex cursor-pointer items-center justify-center rounded p-0.5 text-white/40 transition-colors hover:text-white/80 ${className}`}
    >
      <ExternalLink size={11} strokeWidth={1.5} />
    </a>
  )
}
