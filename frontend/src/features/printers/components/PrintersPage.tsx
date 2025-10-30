import { useState, useMemo } from 'react'
import { Trash2, Search, Printer, BarChart3, List, Eye, Package, TrendingUp, FileQuestion, PieChart as PieChartIcon } from 'lucide-react'
import PageHeader from '../../../shared/components/ui/PageHeader'
import EmptyState from '../../../shared/components/ui/EmptyState'
import ExportButtons from '../../../shared/components/export/ExportButtons'
import { ViewPrinterModal } from './ViewPrinterModal'
import { usePrinters, useCreatePrinter, useUpdatePrinter, useDeletePrinter } from '../hooks/usePrinters'
import { useToast } from '../../../shared/components/ui/ToastContainer'
import type { Printer as PrinterType, PrinterFormData } from '../types'
import { PRINTER_STATUS_OPTIONS, getStatusLabel, getStatusColor } from '../constants'
import SearchableSelect from '../../../shared/components/ui/SearchableSelect'
import { useAllAreas } from '../../areas/hooks/useAreas'
import { useAllZones } from '../../zones/hooks/useZones'
import Modal from '../../../shared/components/ui/Modal'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'
import Input from '../../../shared/components/ui/Input'
import Select from '../../../shared/components/ui/Select'
import Button from '../../../shared/components/ui/Button'
import { FadeInUp } from '../../../shared/components/ui/AnimatedContainer'
import Tabs, { type Tab } from '../../../shared/components/ui/Tabs'
import { getErrorMessage, logError } from '../../../utils/errorHelpers'
import StockTab from '../../consumables/components/StockTab'
import DashboardTab from '../../consumables/components/DashboardTab'
import { BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { usePermissions } from '../../../providers/PermissionsProvider'
import { getRechartsTheme, getCartesianGridProps, getAxisProps, getTooltipProps } from '../../dashboard/utils/rechartsTheme'
import LoadingSpinner from '../../../shared/components/ui/LoadingSpinner'

const PRINTER_TABS: Tab[] = [
  { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
  { id: 'list', label: 'Listado', icon: List },
  { id: 'stock', label: 'Stock', icon: Package },
]

export default function PrintersPage() {
  const toast = useToast()
  const { can } = usePermissions()
  const rechartsTheme = getRechartsTheme()

  // Tabs
  const [activeTab, setActiveTab] = useState('dashboard')

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [areaFilter, setAreaFilter] = useState('')

  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editing, setEditing] = useState<PrinterType | null>(null)
  const [viewingPrinter, setViewingPrinter] = useState<PrinterType | null>(null)

  // Form state
  const [form, setForm] = useState<Partial<PrinterFormData>>({
    status: 'ACTIVE',
    areaId: undefined,
    zoneId: undefined
  })

  // Queries and mutations
  const { data, isLoading } = usePrinters()
  const createMutation = useCreatePrinter()
  const updateMutation = useUpdatePrinter()
  const deleteMutation = useDeletePrinter()

  const printers = useMemo(() => data?.items ?? [], [data?.items])

  // Load areas and zones from the new catalog system
  const { data: areasData } = useAllAreas()
  const areas = areasData || []

  const { data: zonesData } = useAllZones()
  const zones = Array.isArray(zonesData) ? zonesData : []

  const areaOptions = useMemo(() => areas.map(area => ({ value: area.id.toString(), label: area.name })), [areas])
  const areaFilterOptions = useMemo(() => [{ value: '', label: 'Todas las areas' }, ...areaOptions], [areaOptions])
  const areaFormOptions = useMemo(() => [{ value: '', label: 'Selecciona un area' }, ...areaOptions], [areaOptions])

  // Filter zones by selected area in form
  const filteredZones = form.areaId
    ? zones.filter(z => z.areaId === parseInt(form.areaId || '0'))
    : zones

  const zoneFormOptions = useMemo(() => [
    { value: '', label: 'Sin zona' },
    ...filteredZones.map(zone => ({ value: zone.id.toString(), label: zone.name }))
  ], [filteredZones])

  const filteredPrinters = useMemo(() => {
    let result = printers

    if (searchTerm) {
      const query = searchTerm.toLowerCase()
      result = result.filter(p =>
        p.model.toLowerCase().includes(query) ||
        p.serialNumber.toLowerCase().includes(query) ||
        p.location.toLowerCase().includes(query) ||
        p.ip?.toLowerCase().includes(query)
      )
    }

    if (statusFilter) {
      result = result.filter(p => p.status === statusFilter)
    }

    if (areaFilter) {
      result = result.filter(p => p.area === areaFilter)
    }

    return result
  }, [printers, searchTerm, statusFilter, areaFilter])

  // Estadísticas por estado
  const stats = useMemo(() => {
    return PRINTER_STATUS_OPTIONS.map(status => ({
      ...status,
      count: printers.filter(p => p.status === status.value).length
    }))
  }, [printers])

  const openCreate = () => {
    setEditing(null)
    setForm({ status: 'ACTIVE', areaId: undefined, zoneId: undefined })
    setIsFormOpen(true)
  }

  const openEdit = (printer: PrinterType) => {
    setEditing(printer)
    setForm({
      model: printer.model,
      serialNumber: printer.serialNumber,
      areaId: printer.areaId?.toString() || undefined,
      zoneId: printer.zoneId?.toString() || undefined,
      location: printer.location,
      ip: printer.ip || '',
      status: printer.status
    })
    setIsFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.model || !form.serialNumber || !form.areaId || !form.location || !form.status) {
      alert('Por favor complete los campos requeridos')
      return
    }

    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          data: form as PrinterFormData
        })
        toast.success('Impresora actualizada', 'La impresora se ha actualizado correctamente')
      } else {
        await createMutation.mutateAsync(form as PrinterFormData)
        toast.success('Impresora creada', 'La impresora se ha creado correctamente')
      }
      setIsFormOpen(false)
      setForm({ status: 'ACTIVE', areaId: undefined, zoneId: undefined })
      setEditing(null)
    } catch (error) {
      logError('PrintersPage:handleSave', error)
      toast.error(
        editing ? 'Error al actualizar la impresora' : 'Error al crear la impresora',
        getErrorMessage(error, 'No se pudo completar la operación. Por favor, inténtelo de nuevo.')
      )
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success('Impresora eliminada', 'La impresora se ha eliminado correctamente')
      setDeleteId(null)
    } catch (error) {
      logError('PrintersPage:handleDelete', error)
      toast.error('Error al eliminar la impresora', getErrorMessage(error, 'No se pudo completar la operación'))
      setDeleteId(null)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('')
    setAreaFilter('')
  }

  const renderStats = () => {
    // Preparar datos para gráficos usando colores del tema
    const chartData = stats.map((stat) => ({
      name: stat.label,
      cantidad: stat.count,
      fill: stat.value === 'ACTIVE' ? rechartsTheme.colors[2] : // green
            stat.value === 'MAINTENANCE' ? rechartsTheme.colors[1] : // yellow/warning
            rechartsTheme.colors[0] // red/danger
    }))

    const hasData = printers.length > 0

    return (
      <>
        {/* Gráficos de Estadísticas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Gráfico de Barras */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h3 className="text-white font-semibold text-lg mb-4">Estado de Impresoras</h3>
            {!hasData ? (
              <EmptyState
                icon={FileQuestion}
                title="No hay datos disponibles"
                description="Los datos de impresoras aparecerán aquí cuando se registren"
                className="h-[300px]"
              />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid {...getCartesianGridProps(rechartsTheme)} />
                  <XAxis {...getAxisProps(rechartsTheme)} dataKey="name"
                  />
                  <YAxis {...getAxisProps(rechartsTheme)}
                  />
                  <Tooltip {...getTooltipProps(rechartsTheme)} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
                  <Bar dataKey="cantidad" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Gráfico de Área */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h3 className="text-white font-semibold text-lg mb-4">Distribución por Estado</h3>
            {!hasData ? (
              <EmptyState
                icon={PieChartIcon}
                title="Sin datos de distribución"
                description="La distribución por estado se mostrará cuando se registren impresoras"
                className="h-[300px]"
              />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPrinters" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={rechartsTheme.colors[4]} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={rechartsTheme.colors[4]} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...getCartesianGridProps(rechartsTheme)} />
                  <XAxis {...getAxisProps(rechartsTheme)} dataKey="name"
                  />
                  <YAxis {...getAxisProps(rechartsTheme)}
                  />
                  <Tooltip {...getTooltipProps(rechartsTheme)} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
                  <Area
                    type="monotone"
                    dataKey="cantidad"
                    stroke={rechartsTheme.colors[4]}
                    strokeWidth={2}
                    fill="url(#colorPrinters)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Tarjetas de Resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {stats.map((stat) => (
            <div key={stat.value} className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4 hover:bg-white/10 transition-colors">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">{stat.count}</div>
                <div className="text-white/60 text-sm">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </>
    )
  }

  const renderList = () => (
    <>
      {/* Export Buttons */}
      <div className="mb-6">
        <ExportButtons
          data={filteredPrinters}
          columns={{
            model: 'Modelo',
            serialNumber: 'N° Serie',
            area: 'Área',
            location: 'Ubicación',
            ip: 'IP',
            status: 'Estado',
            createdAt: 'Fecha Creación',
          }}
          pdfColumns={{
            model: 'Modelo',
            serialNumber: 'N° Serie',
            area: 'Área',
            location: 'Ubicación',
            status: 'Estado',
          }}
          title="Reporte de Impresoras"
          subtitle={`${filteredPrinters.length} impresoras`}
          department="Sistemas"
        />
      </div>

      {/* Filtros */}
      <div className="mb-6 p-4 sm:p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Buscar por modelo, serie, ubicación o IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-md bg-black/30 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-white/20"
            />
          </div>

          <Select
            label=""
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'Todos los estados' },
              ...PRINTER_STATUS_OPTIONS
            ]}
          />

          <SearchableSelect
            value={areaFilter}
            onChange={(value) => setAreaFilter(value)}
            options={areaFilterOptions}
            placeholder="Todas las areas"
          />
        </div>

        {(searchTerm || statusFilter || areaFilter) && (
          <div className="flex gap-2">
            <Button onClick={clearFilters} variant="glass" size="sm">
              Limpiar Filtros
            </Button>
          </div>
        )}
      </div>

      {/* Tabla Desktop */}
      {isLoading ? (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 flex justify-center">
          <LoadingSpinner size="md" />
        </div>
      ) : filteredPrinters.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 py-16 text-center text-white/50">
          No hay impresoras para mostrar
        </div>
      ) : (
        <>
          {/* Vista Desktop */}
          <div className="hidden md:block bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="text-left p-3 text-white/80 font-medium text-sm">Modelo</th>
                  <th className="text-left p-3 text-white/80 font-medium text-sm">Número de Serie</th>
                  <th className="text-left p-3 text-white/80 font-medium text-sm">Área</th>
                  <th className="text-left p-3 text-white/80 font-medium text-sm">Ubicación</th>
                  <th className="text-left p-3 text-white/80 font-medium text-sm">IP</th>
                  <th className="text-left p-3 text-white/80 font-medium text-sm">Estado</th>
                  <th className="text-left p-3 text-white/80 font-medium text-sm w-32">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrinters.map(printer => (
                  <tr key={printer.id} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                    <td className="p-3 text-white text-sm">{printer.model}</td>
                    <td className="p-3 text-white/80 text-sm font-mono">{printer.serialNumber}</td>
                    <td className="p-3 text-white/80 text-sm">{printer.area}</td>
                    <td className="p-3 text-white/80 text-sm">{printer.location}</td>
                    <td className="p-3 text-white/80 text-sm font-mono">{printer.ip || '-'}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(printer.status)}`}>
                        {getStatusLabel(printer.status)}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setViewingPrinter(printer)} className="text-xs bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 hover:border-green-500/40">
                          <Eye className="w-3 h-3 mr-1" />
                          Ver
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(printer)} className="text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40">
                          Editar
                        </Button>
                        <Button size="sm" onClick={() => setDeleteId(printer.id)} className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40">
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista Mobile */}
          <div className="md:hidden space-y-3">
            {filteredPrinters.map(printer => (
              <div key={printer.id} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Printer className="w-4 h-4 text-white/60 flex-shrink-0" />
                      <h3 className="font-medium text-white text-sm truncate">{printer.model}</h3>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(printer.status)}`}>
                        {getStatusLabel(printer.status)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-white/60 mb-3">
                  <div><span className="text-white/40">Serie:</span> {printer.serialNumber}</div>
                  <div><span className="text-white/40">Área:</span> {printer.area}</div>
                  <div><span className="text-white/40">Ubicación:</span> {printer.location}</div>
                  {printer.ip && <div><span className="text-white/40">IP:</span> {printer.ip}</div>}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setViewingPrinter(printer)}
                    className="flex-1 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-sm transition-colors flex items-center justify-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    Ver
                  </button>
                  <button
                    onClick={() => openEdit(printer)}
                    className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setDeleteId(printer.id)}
                    className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )

  // Check permissions
  if (!can('printers', 'view')) {
    return (
      <div className="text-white px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-2">Acceso Denegado</div>
            <div className="text-white/60">No tienes permisos para ver las impresoras.</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="text-white px-2 sm:px-0">
      <FadeInUp>
        <PageHeader
          title="Gestión de Impresoras"
          description="Administra las impresoras de la organización"
          icon={Printer}
        />

        {/* Tabs */}
        <Tabs tabs={PRINTER_TABS} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

        {/* Header con botón Nueva Impresora */}
        {activeTab === 'list' && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Listado de Impresoras</h2>
              <p className="text-white/60 text-sm">{filteredPrinters.length} impresoras</p>
            </div>
            <Button onClick={openCreate} variant="glass" size="sm">
              Nueva Impresora
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="min-h-[500px]">
          {activeTab === 'dashboard' && renderStats()}
          {activeTab === 'list' && renderList()}
          {activeTab === 'stock' && <StockTab />}
        </div>
      </FadeInUp>

      {/* Modal de formulario */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditing(null)
          setForm({ status: 'ACTIVE', areaId: undefined, zoneId: undefined })
        }}
        title={editing ? 'Editar Impresora' : 'Nueva Impresora'}
        footer={
          <div className="flex gap-3">
            <Button variant="default" onClick={() => {
                setIsFormOpen(false)
                setEditing(null)
                setForm({ status: 'ACTIVE', areaId: undefined, zoneId: undefined })
              }} className="flex-1">
              Cancelar
            </Button>
            <Button variant="glass" onClick={handleSave} className="flex-1">
              {editing ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Modelo *"
            value={form.model || ''}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            placeholder="Ej: HP LaserJet Pro M404n"
            required
          />

          <Input
            label="Número de Serie *"
            value={form.serialNumber || ''}
            onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
            placeholder="Ej: ABC123456"
            required
          />

          <SearchableSelect
            label="Área *"
            value={form.areaId || ''}
            onChange={(value) => {
              const newAreaId = value || undefined
              setForm({ ...form, areaId: newAreaId, zoneId: undefined }) // Reset zone when area changes
            }}
            options={areaFormOptions}
            placeholder="Selecciona un area"
          />

          <Select
            label="Zona"
            value={form.zoneId || ''}
            onChange={(e) => setForm({ ...form, zoneId: e.target.value || undefined })}
            options={zoneFormOptions}
            disabled={!form.areaId}
          />

          <Input
            label="Ubicación *"
            value={form.location || ''}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Ej: Oficina 1, Mesa 3"
            required
          />

          <Input
            label="Dirección IP"
            value={form.ip || ''}
            onChange={(e) => setForm({ ...form, ip: e.target.value })}
            placeholder="Ej: 192.168.1.100"
          />

          <Select
            label="Estado *"
            value={form.status || 'ACTIVE'}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={PRINTER_STATUS_OPTIONS}
          />
        </div>
      </Modal>

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Impresora"
        message="¿Estas seguro de que quieres eliminar esta impresora? Esta acción no se puede deshacer."
        variant="danger"
      />

      {/* View Modal */}
      <ViewPrinterModal
        printer={viewingPrinter}
        isOpen={viewingPrinter !== null}
        onClose={() => setViewingPrinter(null)}
      />
    </div>
  )
}
