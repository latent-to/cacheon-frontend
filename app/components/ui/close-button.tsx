import { X } from 'lucide-react'
import { cn } from '~/lib/cn'

interface CloseButtonProps {
  onClick: () => void
  className?: string
  size?: number
}

export function CloseButton({ onClick, className, size = 16 }: CloseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-secondary hover:text-primary cursor-pointer border-none bg-transparent p-1 transition-colors',
        className,
      )}
    >
      <X size={size} strokeWidth={2} />
    </button>
  )
}
