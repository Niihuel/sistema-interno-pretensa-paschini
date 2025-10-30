import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface AnimatedContainerProps {
  children: ReactNode
  className?: string
  delay?: number
}

export default function AnimatedContainer({ children, className, delay = 0 }: AnimatedContainerProps) {
  return (
    <div
      className={cn('animate-fade-in-up', className)}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  )
}

export function FadeInUp({ children, delay = 0, className }: AnimatedContainerProps) {
  return (
    <div
      className={cn('animate-fade-in-up', className)}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  )
}
