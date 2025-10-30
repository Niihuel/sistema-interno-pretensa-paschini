import { useState, useMemo } from 'react'
import { Search, Package, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { useConsumables } from '../hooks/useConsumables'
import { useConsumableTypes } from '../hooks/useConsumables'
import Button from '../../../shared/components/ui/Button'
import Select from '../../../shared/components/ui/Select'
import SearchableSelect from '../../../shared/components/ui/SearchableSelect'
import {
  OWNERSHIP_TYPE_LABELS,
  CONSUMABLE_STATUS_LABELS,
  OwnershipTypeEnum,
  ConsumableStatusEnum,
} from '../types'

export default function StockTab() {
  // State
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [ownershipFilter, setOwnershipFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page] = useState(1)

  // Queries
  const { data: consumablesData, isLoading } = useConsumables({
    search: searchTerm || undefined,
    consumableTypeId: typeFilter ? parseInt(typeFilter) : undefined,
    ownershipType: (ownershipFilter as any) || undefined,
    status: (statusFilter as any) || undefined,
    page,
    limit: 50,
  })

  const { data: consumableTypesData } = useConsumableTypes()

  const consumables = useMemo(() => consumablesData?.items ?? [], [consumablesData])
  const consumableTypes = useMemo(() => consumableTypesData ?? [], [consumableTypesData])

  // Options for filters
  const typeOptions = useMemo(
    () => [
      { value: '', label: 'Todos los tipos' },
      ...consumableTypes.map((type) => ({ value: type.id.toString(), label: type.name })),
    ],
    [consumableTypes]
  )

  const ownershipOptions = [
    { value: '', label: 'Todos' },
    { value: OwnershipTypeEnum.COMPANY, label: OWNERSHIP_TYPE_LABELS[OwnershipTypeEnum.COMPANY] },
    { value: OwnershipTypeEnum.THIRD_PARTY, label: OWNERSHIP_TYPE_LABELS[OwnershipTypeEnum.THIRD_PARTY] },
  ]

  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: ConsumableStatusEnum.AVAILABLE, label: CONSUMABLE_STATUS_LABELS[ConsumableStatusEnum.AVAILABLE] },
    { value: ConsumableStatusEnum.LOW_STOCK, label: CONSUMABLE_STATUS_LABELS[ConsumableStatusEnum.LOW_STOCK] },
    { value: ConsumableStatusEnum.OUT_OF_STOCK, label: CONSUMABLE_STATUS_LABELS[ConsumableStatusEnum.OUT_OF_STOCK] },
    { value: ConsumableStatusEnum.EXPIRED, label: CONSUMABLE_STATUS_LABELS[ConsumableStatusEnum.EXPIRED] },
  ]

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('')
    setOwnershipFilter('')
    setTypeFilter('')
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case ConsumableStatusEnum.AVAILABLE:
        return 'bg-green-500/10 text-green-400 border-green-500/20'
      case ConsumableStatusEnum.LOW_STOCK:
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      case ConsumableStatusEnum.OUT_OF_STOCK:
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      case ConsumableStatusEnum.EXPIRED:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
      default:
        return 'bg-white/10 text-white border-white/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case ConsumableStatusEnum.AVAILABLE:
        return <CheckCircle className="w-3 h-3" />
      case ConsumableStatusEnum.LOW_STOCK:
      case ConsumableStatusEnum.OUT_OF_STOCK:
        return <AlertTriangle className="w-3 h-3" />
      case ConsumableStatusEnum.EXPIRED:
        return <XCircle className="w-3 h-3" />
      default:
        return <Package className="w-3 h-3" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="p-4 sm:p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Buscar consumibles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-md bg-black/30 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-white/20"
            />
          </div>

          <SearchableSelect
            value={typeFilter}
            onChange={(value) => setTypeFilter(value)}
            options={typeOptions}
            placeholder="Todos los tipos"
          />

          <Select
            label=""
            value={ownershipFilter}
            onChange={(e) => setOwnershipFilter(e.target.value)}
            options={ownershipOptions}
          />

          <Select
            label=""
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusOptions}
          />
        </div>

        {(searchTerm || statusFilter || ownershipFilter || typeFilter) && (
          <div className="flex gap-2">
            <Button onClick={clearFilters} variant="glass" size="sm">
              Limpiar Filtros
            </Button>
          </div>
        )}
      </div>

      {/* Actions Bar */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-white/60 text-sm">{consumables.length} consumibles encontrados</p>
        </div>
        <div className="flex gap-2">
          <Button variant="glass" size="sm">
            Nuevo Consumible
          </Button>
          <Button variant="glass" size="sm">
            Nuevo Tipo
          </Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 text-center text-white/60">
          Cargando...
        </div>
      ) : consumables.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 py-16 text-center text-white/50">
          No hay consumibles para mostrar
        </div>
      ) : (
        <>
          {/* Desktop View */}
          <div className="hidden md:block bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="text-left p-3 text-white/80 font-medium text-sm">Consumible</th>
                  <th className="text-left p-3 text-white/80 font-medium text-sm">Tipo</th>
                  <th className="text-left p-3 text-white/80 font-medium text-sm">Propiedad</th>
                  <th className="text-left p-3 text-white/80 font-medium text-sm">Cantidad</th>
                  <th className="text-left p-3 text-white/80 font-medium text-sm">Min. Stock</th>
                  <th className="text-left p-3 text-white/80 font-medium text-sm">Ubicación</th>
                  <th className="text-left p-3 text-white/80 font-medium text-sm">Estado</th>
                  <th className="text-left p-3 text-white/80 font-medium text-sm w-32">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {consumables.map((consumable) => (
                  <tr key={consumable.id} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                    <td className="p-3 text-white text-sm">
                      {consumable.consumableType?.name || 'N/A'}
                      {consumable.ownershipType === OwnershipTypeEnum.THIRD_PARTY && consumable.ownerCompany && (
                        <div className="text-xs text-white/40 mt-1">{consumable.ownerCompany}</div>
                      )}
                    </td>
                    <td className="p-3 text-white/80 text-sm">
                      {consumable.consumableType?.brand} {consumable.consumableType?.model}
                    </td>
                    <td className="p-3 text-white/80 text-sm">
                      {OWNERSHIP_TYPE_LABELS[consumable.ownershipType as OwnershipTypeEnum]}
                    </td>
                    <td className="p-3 text-white text-sm font-bold">{consumable.quantityAvailable}</td>
                    <td className="p-3 text-white/60 text-sm">{consumable.minimumStock}</td>
                    <td className="p-3 text-white/60 text-sm">{consumable.location || '-'}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(
                          consumable.status
                        )}`}
                      >
                        {getStatusIcon(consumable.status)}
                        {CONSUMABLE_STATUS_LABELS[consumable.status as ConsumableStatusEnum]}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20"
                        >
                          Ver
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20"
                        >
                          Movimiento
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden space-y-3">
            {consumables.map((consumable) => (
              <div key={consumable.id} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="w-4 h-4 text-white/60 flex-shrink-0" />
                      <h3 className="font-medium text-white text-sm truncate">
                        {consumable.consumableType?.name || 'N/A'}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeColor(
                          consumable.status
                        )}`}
                      >
                        {getStatusIcon(consumable.status)}
                        {CONSUMABLE_STATUS_LABELS[consumable.status as ConsumableStatusEnum]}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-white/60 mb-3">
                  <div>
                    <span className="text-white/40">Cantidad:</span> {consumable.quantityAvailable} /{' '}
                    {consumable.minimumStock}
                  </div>
                  <div>
                    <span className="text-white/40">Propiedad:</span>{' '}
                    {OWNERSHIP_TYPE_LABELS[consumable.ownershipType as OwnershipTypeEnum]}
                  </div>
                  {consumable.location && (
                    <div>
                      <span className="text-white/40">Ubicación:</span> {consumable.location}
                    </div>
                  )}
                  {consumable.ownerCompany && (
                    <div>
                      <span className="text-white/40">Empresa:</span> {consumable.ownerCompany}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm transition-colors">
                    Ver
                  </button>
                  <button className="flex-1 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-sm transition-colors">
                    Movimiento
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
