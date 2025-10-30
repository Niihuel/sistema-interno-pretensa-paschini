import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'glass' | 'danger' | 'success' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all',
          'focus:outline-none focus:ring-2 focus:ring-white/50',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-white/10 hover:bg-white/20 text-white': variant === 'default',
            'glass hover:bg-white/10': variant === 'glass',
            'bg-red-500/80 hover:bg-red-500 text-white': variant === 'danger',
            'bg-green-500/80 hover:bg-green-500 text-white': variant === 'success',
            'bg-gray-500/20 hover:bg-gray-500/30 text-white': variant === 'secondary',
            'bg-transparent hover:bg-white/5 text-white': variant === 'ghost',
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-base': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

export default Button
