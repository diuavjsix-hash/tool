import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

function Input({ className, type, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-12 w-full rounded-xl border border-input bg-background/75 px-3.5 py-2 text-sm font-semibold tabular-nums shadow-sm outline-none transition-[border-color,box-shadow,background-color] placeholder:text-muted-foreground focus-visible:border-primary/55 focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
