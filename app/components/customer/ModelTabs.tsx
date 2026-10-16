import { customerModels, type CustomerModelId } from '~/constants/customer-results'
import { cn } from '~/lib/cn'

export default function ModelTabs({
  value,
  onChange,
  label,
}: {
  value: CustomerModelId
  onChange: (id: CustomerModelId) => void
  label: string
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
      {customerModels.map((model) => (
        <button
          key={model.id}
          type="button"
          aria-pressed={model.id === value}
          onClick={() => onChange(model.id)}
          className={cn(
            'min-h-11 cursor-pointer border px-3 py-2 text-xs transition-colors',
            model.id === value
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-border text-secondary hover:border-secondary',
          )}
        >
          {model.name}
        </button>
      ))}
    </div>
  )
}
