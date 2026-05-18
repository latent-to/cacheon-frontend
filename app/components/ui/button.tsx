import { cn } from '~/lib/cn'

const variants = {
  primary: 'bg-btn-primary text-btn-primary-fg font-semibold hover:opacity-85',
  secondary:
    'border border-border/80 bg-surface/60 text-primary font-medium hover:border-border hover:bg-surface backdrop-blur-sm',
  ghost:
    'border border-border/40 bg-transparent text-secondary font-semibold hover:border-border hover:text-primary',
} as const

type ButtonVariant = keyof typeof variants

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  as?: 'button'
}

interface AnchorProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant
  as: 'a'
}

type Props = ButtonProps | AnchorProps

const base =
  'inline-flex items-center justify-center gap-2 rounded-md px-6 py-2.5 font-sans text-base2 no-underline transition-colors cursor-pointer'

export function Button({ variant = 'primary', className, ...props }: Props) {
  const classes = cn(base, variants[variant], className)

  if (props.as === 'a') {
    const { as: _, ...rest } = props as AnchorProps
    return <a className={classes} {...rest} />
  }

  const { as: _, ...rest } = props as ButtonProps
  return <button className={classes} {...rest} />
}
