import { type LucideIcon } from 'lucide-react'

export interface Tab {
  id: string
  label: string
  icon?: LucideIcon
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (tabId: string) => void
  className?: string
}

export default function Tabs({ tabs, activeTab, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex gap-2 overflow-x-auto pb-2 scrollbar-hide ${className}`}>
      {tabs.map(tab => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 whitespace-nowrap
              ${isActive
                ? 'bg-white/10 text-white border-2 border-white/20 shadow-lg'
                : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20'
              }
            `}
          >
            {Icon && <Icon className="w-4 h-4" />}
            <span className="text-sm">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
