import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '~/lib/cn'

interface CopyButtonProps {
  value: string
  className?: string
}

export function CopyButton({ value, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <button
      onClick={handleCopy}
      title={copied ? 'Copied!' : 'Copy'}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center rounded p-0.5 transition-colors',
        copied ? 'text-success' : 'text-white/40 hover:text-white/80',
        className,
      )}
    >
      {copied ? <Check size={11} strokeWidth={2.5} /> : <Copy size={11} strokeWidth={1.5} />}
    </button>
  )
}
