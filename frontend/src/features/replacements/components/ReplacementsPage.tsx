import { useState } from 'react'
import { usePermissions } from '../../../providers/PermissionsProvider'
import LoadingSpinner from '../../../shared/components/ui/LoadingSpinner'
import { useReplacements, useCreateReplacement, useUpdateReplacement, useDeleteReplacement } from '../hooks/useReplacements'
import type { Replacement, ReplacementFormData } from '../types'
import AnimatedContainer, { FadeInUp } from '../../../shared/components/ui/AnimatedContainer'
import Button from '../../../shared/components/ui/Button'
import Input from '../../../shared/components/ui/Input'
import Modal from '../../../shared/components/ui/Modal'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'
import ExportButtons from '../../../shared/components/export/ExportButtons'
import { Edit2, Trash2, Plus, Search, RefreshCw, Printer } from 'lucide-react'

export default function ReplacementsPage() {
  const { can } = usePermissions()

  // Filters
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Data fetching
  const { data, isLoading } = useReplacements({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  })

  const replacements = data?.items || []

  // Mutations
  const createMutation = useCreateReplacement()
  const updateMutation = useUpdateReplacement()
  const deleteMutation = useDeleteReplacement()

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<Replacement | null>(null)
  const [form, setForm] = useState<ReplacementFormData>({
    printerId: 0,
    consumableId: 0,
    replacementDate: new Date().toISOString().split('T')[0],
    pageCountAtReplacement: 0,
    notes: '',
  })

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Handlers
  const openCreate = () => {
    setEditing(null)
    setForm({
      printerId: 0,
      consumableId: 0,
      replacementDate: new Date().toISOString().split('T')[0],
      pageCountAtReplacement: 0,
      notes: '',
    })
    setIsFormOpen(true)
  }

  const openEdit = (replacement: Replacement) => {
    setEditing(replacement)
    setForm({
      printerId: replacement.printerId,
      consumableId: replacement.consumableId,
      oldConsumableId: replacement.oldConsumableId || undefined,
      replacementDate: replacement.replacementDate.split('T')[0],
      pageCountAtReplacement: replacement.pageCountAtReplacement || 0,
      notes: replacement.notes || '',
    })
    setIsFormOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: form })
      } else {
        await createMutation.mutateAsync(form)
      }
      setIsFormOpen(false)
    } catch (error) {
    }
  }

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteMutation.mutateAsync(deleteId)
        setDeleteId(null)
      } catch (error) {
      }
    }
  }

  // Prepare export data with printer and consumable info
  const exportData = replacements.map(r => ({
    printer: r.printer ? `${r.printer.brand} ${r.printer.model} (${r.printer.serialNumber})` : '-',
    consumable: r.consumable?.name || '-',
    consumableType: r.consumable?.type || '-',
    oldConsumable: r.oldConsumable?.name || '-',
    replacementDate: r.replacementDate,
    pageCount: r.pageCountAtReplacement || 0,
    notes: r.notes || '-',
  }))

  // Check permissions
  const canCreate = can('replacements', 'create')
  const canEdit = can('replacements', 'update')
  const canDelete = can('replacements', 'delete')

  if (!can('replacements', 'view')) {
    return (
      <AnimatedContainer className="text-white px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-2">Acceso Denegado</div>
            <div className="text-white/60">No tienes permisos para ver reemplazos.</div>
          </div>
        </div>
      </AnimatedContainer>
    )
  }

  return (
    <AnimatedContainer className="text-white px-2 sm:px-0">
      <FadeInUp delay={0.05}>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-semibold mb-2">Reemplazos</h1>
              <p className="text-white/70">Historial de reemplazos de consumibles en impresoras</p>
            </div>
            {canCreate && (
              <Button variant="glass" onClick={openCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Registrar Reemplazo
              </Button>
            )}
          </div>

          {/* Export Buttons */}
          <ExportButtons
            data={exportData}
            columns={{
              printer: 'Impresora',
              consumable: 'Consumible Nuevo',
              consumableType: 'Tipo',
              oldConsumable: 'Consumible Anterior',
              replacementDate: 'Fecha Reemplazo',
              pageCount: 'Páginas Impresas',
              notes: 'Notas',
            }}
            title="Historial de Reemplazos"
            subtitle={`${replacements.length} reemplazos registrados`}
            department="IT - Mantenimiento"
            author="Sistema"
          />
        </div>
      </FadeInUp>

      {/* Filters */}
      <FadeInUp delay={0.15}>
        <div className="glass-strong rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="date"
              placeholder="Fecha inicio..."
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white/5"
            />
            <Input
              type="date"
              placeholder="Fecha fin..."
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white/5"
            />
            <Button
              variant="glass"
              onClick={() => {
                setStartDate('')
                setEndDate('')
              }}
            >
              <Search className="w-4 h-4 mr-2" />
              Limpiar Filtros
            </Button>
          </div>
        </div>
      </FadeInUp>

      {/* Table */}
      <FadeInUp delay={0.25}>
        <div className="glass-strong rounded-xl">
          {isLoading ? (
            <div className="p-8 flex justify-center"><LoadingSpinner size="md" /></div>
          ) : replacements.length === 0 ? (
            <div className="p-8 text-center text-white/60">No se encontraron reemplazos</div>
          ) : (
            <div className="overflow-x-auto">
              {/* Desktop Table */}
              <table className="hidden md:table w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Impresora</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Consumible Nuevo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Páginas</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {replacements.map((replacement) => (
                    <tr key={replacement.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-sm text-white">
                        {replacement.printer ? (
                          <div>
                            <div className="flex items-center gap-2">
                              <Printer className="w-4 h-4 text-blue-400" />
                              <span>{replacement.printer.brand} {replacement.printer.model}</span>
                            </div>
                            <div className="text-xs text-white/50 mt-1">SN: {replacement.printer.serialNumber}</div>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/70">{replacement.consumable?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-white/70">
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-500/10 text-blue-400">
                          {replacement.consumable?.type || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/70">
                        {new Date(replacement.replacementDate).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/70">
                        {replacement.pageCountAtReplacement?.toLocaleString() || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(replacement)}
                              className="text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40"
                            >
                              Editar
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              size="sm"
                              onClick={() => setDeleteId(replacement.id)}
                              className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40"
                            >
                              Eliminar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4 p-4">
                {replacements.map((replacement) => (
                  <div key={replacement.id} className="glass rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Printer className="w-4 h-4 text-blue-400" />
                          <h3 className="text-white font-medium text-sm">
                            {replacement.printer
                              ? `${replacement.printer.brand} ${replacement.printer.model}`
                              : 'Impresora desconocida'}
                          </h3>
                        </div>
                        {replacement.printer && (
                          <p className="text-white/50 text-xs">SN: {replacement.printer.serialNumber}</p>
                        )}
                      </div>
                      <RefreshCw className="w-5 h-5 text-green-400" />
                    </div>

                    <div className="space-y-1 mb-3 text-sm">
                      <p className="text-white/70">
                        <span className="text-white/50">Consumible:</span> {replacement.consumable?.name || '-'}
                      </p>
                      <p className="text-white/70">
                        <span className="text-white/50">Tipo:</span>{' '}
                        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/10 text-blue-400">
                          {replacement.consumable?.type || '-'}
                        </span>
                      </p>
                      <p className="text-white/70">
                        <span className="text-white/50">Fecha:</span>{' '}
                        {new Date(replacement.replacementDate).toLocaleDateString('es-ES')}
                      </p>
                      {replacement.pageCountAtReplacement && (
                        <p className="text-white/70">
                          <span className="text-white/50">Páginas:</span> {replacement.pageCountAtReplacement.toLocaleString()}
                        </p>
                      )}
                      {replacement.notes && (
                        <p className="text-white/60 text-xs mt-2 italic">{replacement.notes}</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {canEdit && (
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={() => openEdit(replacement)}
                          className="flex-1"
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setDeleteId(replacement.id)}
                          className="flex-1"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Eliminar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </FadeInUp>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editing ? 'Editar Reemplazo' : 'Registrar Reemplazo'}
        footer={
          <div className="flex gap-3">
            <Button variant="default" onClick={() => setIsFormOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button
              variant="glass"
              onClick={handleSave}
              disabled={!form.printerId || !form.consumableId || createMutation.isPending || updateMutation.isPending}
              className="flex-1"
            >
              {editing ? 'Actualizar' : 'Registrar'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="ID Impresora *"
            type="number"
            value={form.printerId}
            onChange={(e) => setForm({ ...form, printerId: parseInt(e.target.value) || 0 })}
            placeholder="ID de la impresora"
            required
          />

          <Input
            label="ID Consumible Nuevo *"
            type="number"
            value={form.consumableId}
            onChange={(e) => setForm({ ...form, consumableId: parseInt(e.target.value) || 0 })}
            placeholder="ID del consumible nuevo"
            required
          />

          <Input
            label="ID Consumible Anterior"
            type="number"
            value={form.oldConsumableId || ''}
            onChange={(e) => setForm({ ...form, oldConsumableId: parseInt(e.target.value) || undefined })}
            placeholder="ID del consumible reemplazado (opcional)"
          />

          <Input
            label="Fecha de Reemplazo *"
            type="date"
            value={form.replacementDate}
            onChange={(e) => setForm({ ...form, replacementDate: e.target.value })}
            required
          />

          <Input
            label="Páginas Impresas"
            type="number"
            value={form.pageCountAtReplacement || ''}
            onChange={(e) => setForm({ ...form, pageCountAtReplacement: parseInt(e.target.value) || undefined })}
            placeholder="Contador de páginas al momento del reemplazo"
          />

          <Input
            label="Notas"
            value={form.notes || ''}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Notas adicionales (opcional)"
          />
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Reemplazo"
        message="¿Estás seguro de que deseas eliminar este registro de reemplazo? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </AnimatedContainer>
  )
}
