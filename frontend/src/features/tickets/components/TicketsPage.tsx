import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Trash2, Plus, Search, Eye, Ticket as TicketIcon, History, BarChart3, FileSpreadsheet, FileText, Upload, X, Download, Paperclip } from 'lucide-react'
import { exportToProfessionalExcel, exportToProfessionalPDF, prepareDataForExport } from '../../../lib/professional-export'
import { useTickets, useCreateTicket, useUpdateTicket, useDeleteTicket } from '../hooks/useTickets'
import { ticketsApi } from '../api/tickets.api'
import { usersApi } from '../../../api/users.api'
import { useAllAreas } from '../../areas/hooks/useAreas'
import { useAllZones } from '../../zones/hooks/useZones'
import TicketsDashboardTab from './TicketsDashboardTab'
import type { Ticket, TicketFormData } from '../types'
import {
  TICKET_STATUS,
  TICKET_PRIORITIES,
  TICKET_CATEGORIES,
  getStatusColor,
  getPriorityColor,
  mapStatusToSpanish,
  mapPriorityToSpanish
} from '../constants'
import SearchableSelect from '../../../shared/components/ui/SearchableSelect'
import Modal from '../../../shared/components/ui/Modal'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'
import Input from '../../../shared/components/ui/Input'
import Select from '../../../shared/components/ui/Select'
import Button from '../../../shared/components/ui/Button'
import PageHeader from '../../../shared/components/ui/PageHeader'
import { FadeInUp } from '../../../shared/components/ui/AnimatedContainer'
import Tabs, { type Tab } from '../../../shared/components/ui/Tabs'
import { usePermissions } from '../../../providers/PermissionsProvider'
import LoadingSpinner from '../../../shared/components/ui/LoadingSpinner'

type TabId = 'dashboard' | 'active' | 'history'

const TABS: Tab[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'active', label: 'Solicitudes Activas', icon: TicketIcon },
  { id: 'history', label: 'Historial', icon: History },
]

export default function TicketsPage() {
  const { can } = usePermissions()
  const [activeTab, setActiveTab] = useState<TabId>('active')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)

  // Filtros
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editing, setEditing] = useState<Ticket | null>(null)

  // Form state
  const [form, setForm] = useState<Partial<TicketFormData>>({
    status: 'Abierto',
    priority: 'Media'
  })

  // File attachments state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedImage, setSelectedImage] = useState<{ url: string; originalName: string } | null>(null)

  // Queries and mutations
  const { data, isLoading, refetch } = useTickets()
  const createMutation = useCreateTicket()
  const updateMutation = useUpdateTicket()
  const deleteMutation = useDeleteTicket()

  // Load assignable technicians
  const { data: assignableTechnicians = [] } = useQuery({
    queryKey: ['assignable-technicians'],
    queryFn: () => usersApi.getAssignableTechnicians(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Load areas and zones from the new catalog system
  const { data: areasData } = useAllAreas()
  const areas = areasData || []

  const { data: zonesData } = useAllZones()
  const zones = Array.isArray(zonesData) ? zonesData : []

  const areaOptions = useMemo(() => areas.map(area => ({ value: area.id.toString(), label: area.name })), [areas])
  const areaFormOptions = useMemo(() => [{ value: '', label: 'Selecciona un area' }, ...areaOptions], [areaOptions])

  // Filter zones by selected area in form
  const filteredZones = form.areaId
    ? zones.filter(z => z.areaId === parseInt(form.areaId || '0'))
    : zones

  const zoneFormOptions = useMemo(() => [
    { value: '', label: 'Sin zona' },
    ...filteredZones.map(zone => ({ value: zone.id.toString(), label: zone.name }))
  ], [filteredZones])
  const technicianOptions = useMemo(() => {
    return [
      { value: '', label: 'Sin asignar' },
      ...assignableTechnicians.map((tech) => {
        const fullName = [tech.firstName, tech.lastName].filter(Boolean).join(' ') || tech.username
        const roleDisplay = tech.userRoles?.[0]?.role?.displayName
        return {
          value: tech.id.toString(),
          label: fullName,
          subLabel: roleDisplay || undefined,
        }
      }),
    ]
  }, [assignableTechnicians])

  const tickets = data?.items || []

  // Export handlers
  const handleExportExcel = async () => {
    const exportData = prepareDataForExport(
      filteredTickets,
      {
        title: 'Título',
        status: 'Estado',
        priority: 'Prioridad',
        area: 'Área',
        category: 'Categoría',
        requestor: 'Solicitante',
        createdAt: 'Fecha Creación',
      },
      {
        title: 'Reporte de Tickets',
        subtitle: `${filteredTickets.length} tickets`,
        department: 'Sistemas - Soporte',
        author: 'Sistema',
      }
    )
    await exportToProfessionalExcel(exportData)
  }

  const handleExportPDF = async () => {
    const exportData = prepareDataForExport(
      filteredTickets,
      {
        title: 'Título',
        status: 'Estado',
        priority: 'Prioridad',
        area: 'Área',
        createdAt: 'Fecha Creación',
      },
      {
        title: 'Reporte de Tickets',
        subtitle: `${filteredTickets.length} tickets`,
        department: 'Sistemas - Soporte',
        author: 'Sistema',
      }
    )
    await exportToProfessionalPDF(exportData)
  }

  // Filtrar tickets según tab y filtros
  const filteredTickets = useMemo(() => {
    let result = tickets

    // Filtrar por tab
    if (activeTab === 'active') {
      result = result.filter(t => mapStatusToSpanish(t.status) !== 'Cerrado')
    } else if (activeTab === 'history') {
      result = result.filter(t => mapStatusToSpanish(t.status) === 'Cerrado')
    }

    // Aplicar filtros
    if (statusFilter) {
      result = result.filter(t => mapStatusToSpanish(t.status) === statusFilter)
    }
    if (priorityFilter) {
      result = result.filter(t => mapPriorityToSpanish(t.priority) === priorityFilter)
    }
    if (categoryFilter) {
      result = result.filter(t => t.category === categoryFilter)
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.requestor?.firstName.toLowerCase().includes(query) ||
        t.requestor?.lastName.toLowerCase().includes(query)
      )
    }

    return result
  }, [tickets, activeTab, statusFilter, priorityFilter, categoryFilter, searchQuery])

  // File handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      // Validate file sizes (max 10MB per file)
      const validFiles = files.filter(f => {
        if (f.size > 10 * 1024 * 1024) {
          alert(`El archivo ${f.name} excede el límite de 10MB`)
          return false
        }
        return true
      })
      setSelectedFiles(prev => [...prev, ...validFiles])
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ status: 'Abierto', priority: 'Media' })
    setSelectedFiles([])
    setIsFormOpen(true)
  }

  const openEdit = (ticket: Ticket) => {
    setEditing(ticket)
    setForm({
      title: ticket.title,
      description: ticket.description || '',
      status: mapStatusToSpanish(ticket.status),
      priority: mapPriorityToSpanish(ticket.priority),
      requestorId: ticket.requestorId,
      technicianId: ticket.technicianId || undefined,
      category: ticket.category || '',
      areaId: ticket.areaId?.toString() || undefined,
      zoneId: ticket.zoneId?.toString() || undefined,
      ipAddress: ticket.ipAddress || '',
      solution: ticket.solution || ''
    })
    setSelectedFiles([])
    setIsFormOpen(true)
  }

  const openDetail = async (ticket: Ticket) => {
    // Fetch full ticket details including attachments
    try {
      const fullTicket = await ticketsApi.getById(ticket.id)
      setSelectedTicket(fullTicket)
      setIsDetailOpen(true)
    } catch (error) {
      setSelectedTicket(ticket)
      setIsDetailOpen(true)
    }
  }

  const handleSave = async () => {
    if (!form.title || !form.requestorId) {
      alert('Por favor complete los campos requeridos')
      return
    }

    try {
      let ticketId: number

      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          data: form as TicketFormData
        })
        ticketId = editing.id
      } else {
        const created = await createMutation.mutateAsync(form as TicketFormData)
        ticketId = created.id
      }

      // Upload attachments if any
      if (selectedFiles.length > 0) {
        await ticketsApi.uploadAttachments(ticketId, selectedFiles)
      }

      setIsFormOpen(false)
      setForm({ status: 'Abierto', priority: 'Media' })
      setSelectedFiles([])
      setEditing(null)
      refetch()
    } catch (error) {
      alert('Error al guardar el ticket')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await deleteMutation.mutateAsync(deleteId)
      setDeleteId(null)
    } catch (error) {
      alert('Error al eliminar el ticket')
    }
  }

  const clearFilters = () => {
    setStatusFilter('')
    setPriorityFilter('')
    setCategoryFilter('')
    setSearchQuery('')
  }

  // Check permissions
  if (!can('tickets', 'view')) {
    return (
      <div className="text-white px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-2">Acceso Denegado</div>
            <div className="text-white/60">No tienes permisos para ver los tickets.</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="text-white px-2 sm:px-0">
      <FadeInUp>
        <PageHeader
          title="Centro de Solicitudes"
          description="Gestión de tickets y soporte técnico"
          icon={TicketIcon}
        />

        {/* Export Buttons */}
        <div className="flex gap-2 mb-6">
          <Button variant="glass" size="sm" onClick={handleExportExcel}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>
          <Button variant="glass" size="sm" onClick={handleExportPDF}>
            <FileText className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>

        {/* Tabs */}
        <Tabs 
          tabs={TABS} 
          activeTab={activeTab} 
          onChange={(id) => setActiveTab(id as TabId)}
          className="mb-6"
        />

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && <TicketsDashboardTab />}

        {/* Header con botón Nueva Solicitud - Solo en tabs active/history */}
        {activeTab !== 'dashboard' && (
        <>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">
              {activeTab === 'active' ? 'Solicitudes Activas' : activeTab === 'history' ? 'Solicitudes Cerradas' : 'Todas las Solicitudes'}
            </h2>
            <p className="text-white/60 text-sm">
              {filteredTickets.length} {filteredTickets.length === 1 ? 'solicitud' : 'solicitudes'}
            </p>
          </div>
          <Button onClick={openCreate} variant="glass" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Nueva Solicitud
          </Button>
        </div>

        {/* Filtros */}
        <div className="mb-6 p-4 sm:p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Buscar tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-md bg-black/30 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-white/20"
              />
            </div>

            <Select
              label=""
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'Todos los estados' },
                ...TICKET_STATUS.filter(s => activeTab === 'active' ? s !== 'Cerrado' : true).map(s => ({ value: s, label: s }))
              ]}
            />

            <Select
              label=""
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              options={[
                { value: '', label: 'Todas las prioridades' },
                ...TICKET_PRIORITIES.map(p => ({ value: p, label: p }))
              ]}
            />

            <Select
              label=""
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { value: '', label: 'Todas las categorías' },
                ...TICKET_CATEGORIES.map(c => ({ value: c, label: c }))
              ]}
            />
          </div>

          {(statusFilter || priorityFilter || categoryFilter || searchQuery) && (
            <div className="flex flex-wrap gap-2">
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
        ) : filteredTickets.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 py-16 text-center text-white/50">
            No hay tickets para mostrar
          </div>
        ) : (
          <>
            {/* Vista Desktop */}
            <div className="hidden md:block bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="text-left p-3 text-white/80 font-medium text-sm">ID</th>
                    <th className="text-left p-3 text-white/80 font-medium text-sm">Título</th>
                    <th className="text-left p-3 text-white/80 font-medium text-sm">Solicitante</th>
                    <th className="text-left p-3 text-white/80 font-medium text-sm">Estado</th>
                    <th className="text-left p-3 text-white/80 font-medium text-sm">Prioridad</th>
                    <th className="text-left p-3 text-white/80 font-medium text-sm">Categoría</th>
                    <th className="text-left p-3 text-white/80 font-medium text-sm">Fecha</th>
                    <th className="text-left p-3 text-white/80 font-medium text-sm w-32">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map(ticket => (
                    <tr key={ticket.id} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                      <td className="p-3 text-white/80 text-sm">#{ticket.id}</td>
                      <td className="p-3">
                        <div className="max-w-xs">
                          <div className="font-medium text-white text-sm">{ticket.title}</div>
                          {ticket.description && (
                            <div className="text-xs text-white/60 line-clamp-1 mt-0.5">
                              {ticket.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-white/80 text-sm">
                        {ticket.requestor ? `${ticket.requestor.firstName} ${ticket.requestor.lastName}` : 'N/A'}
                        {ticket.requestor?.area && (
                          <div className="text-xs text-white/50">{ticket.requestor.area}</div>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {mapStatusToSpanish(ticket.status)}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {mapPriorityToSpanish(ticket.priority)}
                        </span>
                      </td>
                      <td className="p-3 text-white/60 text-sm">
                        {ticket.category || '-'}
                      </td>
                      <td className="p-3 text-white/60 text-sm">
                        {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openDetail(ticket)} className="text-xs bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 hover:border-purple-500/40">
                            Ver
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(ticket)} className="text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40">
                            Editar
                          </Button>
                          <Button size="sm" onClick={() => setDeleteId(ticket.id)} className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40">
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
              {filteredTickets.map(ticket => (
                <div key={ticket.id} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white/60 text-xs">#{ticket.id}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {mapStatusToSpanish(ticket.status)}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {mapPriorityToSpanish(ticket.priority)}
                        </span>
                      </div>
                      <h3 className="font-medium text-white text-sm mb-1">{ticket.title}</h3>
                      {ticket.description && (
                        <p className="text-xs text-white/60 line-clamp-2">{ticket.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-white/60 mb-3">
                    <span>
                      {ticket.requestor ? `${ticket.requestor.firstName} ${ticket.requestor.lastName}` : 'N/A'}
                    </span>
                    {ticket.category && <span>{ticket.category}</span>}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openDetail(ticket)}
                      className="flex-1 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm transition-colors"
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => openEdit(ticket)}
                      className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setDeleteId(ticket.id)}
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
        )}
      </FadeInUp>

      {/* Modal de formulario */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditing(null)
          setForm({ status: 'Abierto', priority: 'Media' })
        }}
        title={editing ? 'Editar Ticket' : 'Nuevo Ticket'}
        footer={
          <div className="flex gap-3">
            <Button variant="default" onClick={() => {
                setIsFormOpen(false)
                setEditing(null)
                setForm({ status: 'Abierto', priority: 'Media' })
              }} className="flex-1">
              Cancelar
            </Button>
            <Button variant="glass" onClick={handleSave} className="flex-1">
              {editing ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <Input
            label="Título *"
            value={form.title || ''}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Describe brevemente el problema"
            required
          />

          <div>
            <label className="block text-xs font-medium text-white/60 mb-1 uppercase tracking-wide">
              Descripción
            </label>
            <textarea
              className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-white/20 resize-none"
              rows={4}
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Proporciona mas detalles sobre el problema"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Estado *"
              value={form.status || 'Abierto'}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              options={TICKET_STATUS.map(s => ({ value: s, label: s }))}
            />

            <Select
              label="Prioridad *"
              value={form.priority || 'Media'}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              options={TICKET_PRIORITIES.map(p => ({ value: p, label: p }))}
            />

            <Input
              label="ID Solicitante *"
              type="number"
              value={form.requestorId || ''}
              onChange={(e) => setForm({ ...form, requestorId: parseInt(e.target.value) })}
              placeholder="ID del empleado"
              required
            />

            <SearchableSelect
              label="Técnico Asignado"
              value={form.technicianId ? String(form.technicianId) : ''}
              onChange={(value) => setForm({ ...form, technicianId: value ? Number(value) : undefined })}
              options={technicianOptions}
              placeholder="Sin asignar"
            />

            <Select
              label="Categoría"
              value={form.category || ''}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              options={[
                { value: '', label: 'Seleccionar categoría' },
                ...TICKET_CATEGORIES.map(c => ({ value: c, label: c }))
              ]}
            />

            <SearchableSelect
              label="Área"
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
          </div>

          <Input
            label="Dirección IP"
            value={form.ipAddress || ''}
            onChange={(e) => setForm({ ...form, ipAddress: e.target.value })}
            placeholder="192.168.1.1"
          />

          {(form.status === 'Resuelto' || form.status === 'Cerrado') && (
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1 uppercase tracking-wide">
                Solución
              </label>
              <textarea
                className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-white/20 resize-none"
                rows={3}
                value={form.solution || ''}
                onChange={(e) => setForm({ ...form, solution: e.target.value })}
                placeholder="Describe cómo se resolvió el problema"
              />
            </div>
          )}

          {/* File Upload Section */}
          <div>
            <label className="block text-xs font-medium text-white/60 mb-2 uppercase tracking-wide">
              Archivos Adjuntos
            </label>
            <div className="mt-2">
              <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-white/40 transition-colors">
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                />
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-white/40" />
                  <p className="text-sm text-white/60">Click para cargar archivos</p>
                  <p className="text-xs text-white/40 mt-1">Maximo 10MB por archivo</p>
                </div>
              </label>

              {selectedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-white/60" />
                        <span className="text-sm text-white">{file.name}</span>
                        <span className="text-xs text-white/40">
                          ({(file.size / 1024).toFixed(2)} KB)
                        </span>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal de detalle */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedTicket(null)
        }}
        title={`Ticket #${selectedTicket?.id}`}
        footer={
          <div className="flex gap-3">
            <Button variant="default" onClick={() => {
                setIsDetailOpen(false)
                setSelectedTicket(null)
              }} className="flex-1">
              Cerrar
            </Button>
          </div>
        }
      >
        {selectedTicket && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">{selectedTicket.title}</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                  {mapStatusToSpanish(selectedTicket.status)}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                  {mapPriorityToSpanish(selectedTicket.priority)}
                </span>
                {selectedTicket.category && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400">
                    {selectedTicket.category}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-white/60 mb-1">Solicitante</p>
                <p className="text-white">
                  {selectedTicket.requestor ? `${selectedTicket.requestor.firstName} ${selectedTicket.requestor.lastName}` : 'N/A'}
                </p>
                {selectedTicket.requestor?.area && (
                  <p className="text-xs text-white/60">{selectedTicket.requestor.area}</p>
                )}
              </div>

              <div>
                <p className="text-white/60 mb-1">Técnico Asignado</p>
                <p className="text-white">
                  {selectedTicket.technician
                    ? `${selectedTicket.technician.firstName || ''} ${selectedTicket.technician.lastName || ''}`.trim() || selectedTicket.technician.username
                    : 'Sin asignar'}
                </p>
              </div>

              <div>
                <p className="text-white/60 mb-1">Fecha de Creación</p>
                <p className="text-white">
                  {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString() : 'N/A'}
                </p>
              </div>

              {selectedTicket.closedAt && (
                <div>
                  <p className="text-white/60 mb-1">Fecha de Cierre</p>
                  <p className="text-white">
                    {new Date(selectedTicket.closedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {selectedTicket.description && (
              <div>
                <p className="text-white/60 mb-2">Descripción</p>
                <p className="text-white/80 whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>
            )}

            {selectedTicket.solution && (
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                <p className="text-green-400 mb-2 font-medium">Solución</p>
                <p className="text-white/80 whitespace-pre-wrap">{selectedTicket.solution}</p>
              </div>
            )}

            {selectedTicket.ipAddress && (
              <div>
                <p className="text-white/60 mb-1">Dirección IP</p>
                <p className="text-white font-mono">{selectedTicket.ipAddress}</p>
              </div>
            )}

            {/* Attachments Section */}
            <div>
              <p className="text-xs text-white/60 mb-3 font-medium uppercase tracking-wider">Archivos Adjuntos</p>
              {!selectedTicket.attachments || selectedTicket.attachments.length === 0 ? (
                <div className="p-6 rounded-lg bg-white/5 border border-white/10 text-center">
                  <Paperclip className="w-8 h-8 text-white/40 mx-auto mb-2" />
                  <p className="text-sm text-white/60">No hay archivos adjuntos en este ticket</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Separate images from other files */}
                  {(() => {
                    const images = selectedTicket.attachments.filter(f =>
                      f.originalName.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                    )
                    const otherFiles = selectedTicket.attachments.filter(f =>
                      !f.originalName.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                    )

                    return (
                      <>
                        {/* Images */}
                        {images.length > 0 && (
                          <div>
                            <p className="text-xs text-white/50 mb-2">Imagenes ({images.length})</p>
                            <div className="space-y-2">
                              {images.map(file => (
                                <div key={file.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                                      <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm text-white truncate">{file.originalName}</p>
                                      <p className="text-xs text-white/60">{(file.size / 1024).toFixed(2)} KB</p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 flex-shrink-0">
                                    <button
                                      onClick={() => setSelectedImage({ url: file.url, originalName: file.originalName })}
                                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                      title="Ver imagen"
                                    >
                                      <Eye className="w-4 h-4 text-white/60" />
                                    </button>
                                    <a
                                      href={file.url}
                                      download={file.originalName}
                                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                      title="Descargar"
                                    >
                                      <Download className="w-4 h-4 text-white/60" />
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Other files */}
                        {otherFiles.length > 0 && (
                          <div>
                            <p className="text-xs text-white/50 mb-2">Documentos ({otherFiles.length})</p>
                            <div className="space-y-2">
                              {otherFiles.map(file => (
                                <div key={file.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <Paperclip className="w-4 h-4 text-white/60 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm text-white truncate">{file.originalName}</p>
                                      <p className="text-xs text-white/60">{(file.size / 1024).toFixed(2)} KB</p>
                                    </div>
                                  </div>
                                  <a
                                    href={file.url}
                                    download={file.originalName}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                                    title="Descargar"
                                  >
                                    <Download className="w-4 h-4 text-white/60" />
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Ticket"
        message="¿Estas seguro de que quieres eliminar este ticket? Esta acción no se puede deshacer."
        variant="danger"
      />

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedImage(null)} />
          <div className="relative w-full max-w-5xl max-h-[95vh] rounded-lg sm:rounded-xl border border-white/10 bg-black/90 text-white shadow-2xl p-4 sm:p-6 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h3 className="text-base sm:text-lg font-medium truncate pr-8">{selectedImage.originalName}</h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white/60 hover:text-white transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex justify-center items-center flex-1 overflow-auto">
              <img
                src={selectedImage.url}
                alt={selectedImage.originalName}
                className="max-w-full max-h-[calc(95vh-150px)] object-contain rounded-lg"
              />
            </div>

            <div className="flex justify-center gap-3 mt-4 pt-4 border-t border-white/10 flex-shrink-0">
              <a
                href={selectedImage.url}
                download={selectedImage.originalName}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Descargar imagen
              </a>
              <button
                onClick={() => setSelectedImage(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
