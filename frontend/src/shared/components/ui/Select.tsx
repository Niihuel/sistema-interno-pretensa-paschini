import { useState, useEffect, useRef } from 'react'
import { cn } from '../../utils/cn'
import { ChevronDown } from 'lucide-react'

interface SelectProps {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  value?: string
  onChange?: (e: { target: { value: string; name?: string } }) => void
  className?: string
  disabled?: boolean
  name?: string
  required?: boolean
}

export default function Select({ label, error, options, value = '', onChange, className, disabled, name }: SelectProps) {
  const [open, setOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState(value)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(o => o.value === selectedValue)

  useEffect(() => {
    setSelectedValue(value)
  }, [value])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const handleSelect = (optionValue: string) => {
    setSelectedValue(optionValue)
    setOpen(false)

    if (onChange) {
      onChange({ target: { value: optionValue, name } })
    }
  }

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-white/70 mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        {/* Select Button */}
        <button
          type="button"
          onClick={() => !disabled && setOpen(!open)}
          disabled={disabled}
          className={cn(
            'w-full px-4 py-2.5 rounded-lg text-left cursor-pointer flex items-center justify-between',
            'bg-black/40 backdrop-blur-sm border border-white/20',
            'text-white',
            'hover:border-white/40',
            'focus:outline-none focus:border-white/60 focus:ring-2 focus:ring-white/20',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-200',
            error && 'border-red-500',
            className
          )}
          style={{ WebkitBackdropFilter: 'blur(4px)' }}
        >
          <span className={selectedOption ? 'text-white' : 'text-white/50'}>
            {selectedOption?.label || 'Seleccione una opción'}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-white/70 transition-transform duration-200 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu - Matching header style */}
        {open && (
          <div
            className="absolute z-[9999] w-full mt-2 animate-fade-in rounded-xl overflow-hidden"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.25), 0 1px 0 rgba(255, 255, 255, 0.05)'
            }}
          >
            <div
              className="overflow-y-auto py-1"
              style={{
                maxHeight: '16rem', // 256px - altura fija con scroll interno
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {options
                .filter((option) => option.value !== '') // Filter out empty placeholder options
                .map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      'w-full text-left px-4 py-2.5 text-sm transition-all duration-200',
                      'hover:bg-white/10',
                      option.value === selectedValue
                        ? 'bg-white/10 text-white font-medium'
                        : 'text-white/80'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  )
}
