import { useState } from 'react'
import { usePermissions } from '../../../providers/PermissionsProvider'
import LoadingSpinner from '../../../shared/components/ui/LoadingSpinner'
import { useBackups, useBackupStats, useCreateBackup, useRestoreBackup, useDeleteBackup } from '../hooks/useBackups'
import { useToast } from '../../../shared/components/ui/ToastContainer'
import Button from '../../../shared/components/ui/Button'
import Input from '../../../shared/components/ui/Input'
import Select from '../../../shared/components/ui/Select'
import ExportButtons from '../../../shared/components/export/ExportButtons'
import Tabs, { type Tab } from '../../../shared/components/ui/Tabs'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'
import { Search, Database, HardDrive, CheckCircle, XCircle, Clock, BarChart3, History, Plus, RefreshCw, Trash2, Download, Upload, AlertTriangle } from 'lucide-react'
import { getErrorMessage, logError } from '../../../utils/errorHelpers'

const BACKUP_TABS: Tab[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'history', label: 'Historial', icon: History },
]

export default function BackupsPage() {
  const { can } = usePermissions()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('dashboard')

  // Filters
  const [backupTypeFilter, setBackupTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Estado para confirmación de restauración
  const [restoreId, setRestoreId] = useState<number | null>(null)

  // Estado para confirmación de eliminación
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Estado para restauración desde archivo
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Data fetching
  const { data, isLoading, refetch: refetchBackups } = useBackups({
    backupType: backupTypeFilter || undefined,
    status: statusFilter || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  })

  const { data: stats, refetch: refetchStats } = useBackupStats()

  // Mutations
  const createBackupMutation = useCreateBackup()
  const restoreBackupMutation = useRestoreBackup()
  const deleteBackupMutation = useDeleteBackup()

  const backups = data?.items || []

  // Handlers
  const handleCreateBackup = async () => {
    try {
      await createBackupMutation.mutateAsync()
      toast.success('Backup creado exitosamente', 'El backup de la base de datos se ha creado correctamente')
      // Manually refetch to ensure UI updates
      await Promise.all([refetchBackups(), refetchStats()])
    } catch (error) {
      logError('BackupsPage:create', error)
      toast.error('Error al crear el backup', getErrorMessage(error, 'No se pudo completar la operación. Por favor, inténtelo de nuevo.'))
    }
  }

  const handleRestoreBackup = async () => {
    if (!restoreId) return

    try {
      await restoreBackupMutation.mutateAsync(restoreId)
      setRestoreId(null)
      toast.success('Base de datos restaurada', 'La aplicación se recargará en 2 segundos')
      // Recargar la página después de restaurar
      setTimeout(() => window.location.reload(), 2000)
    } catch (error) {
      logError('BackupsPage:restore', error)
      toast.error('Error al restaurar el backup', getErrorMessage(error, 'No se pudo completar la restauración'))
      setRestoreId(null)
    }
  }

  const handleDeleteBackup = async () => {
    if (!deleteId) return

    try {
      await deleteBackupMutation.mutateAsync(deleteId)
      setDeleteId(null)
      toast.success('Backup eliminado', 'El backup ha sido eliminado correctamente')
      // Manually refetch to ensure UI updates
      await Promise.all([refetchBackups(), refetchStats()])
    } catch (error) {
      logError('BackupsPage:delete', error)
      toast.error('Error al eliminar el backup', getErrorMessage(error, 'No se pudo completar la operación'))
      setDeleteId(null)
    }
  }

  const handleDownloadBackup = async (backupId: number) => {
    const token = localStorage.getItem('token')
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3500/api'
    const downloadUrl = `${baseUrl}/backups/${backupId}/download`

    try {
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        // Try to parse error message
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition')
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch ? filenameMatch[1] : `backup-${backupId}.backup`

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Descarga exitosa', 'El archivo de backup se ha descargado correctamente')
    } catch (error) {
      logError('BackupsPage:download', error)
      toast.error('Error al descargar el backup', getErrorMessage(error, 'No se pudo descargar el archivo. Verifica tus permisos.'))
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validar extensión
      const validExtensions = ['.sql', '.backup', '.dump']
      const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))

      if (!hasValidExtension) {
        toast.error('Archivo no válido', 'Solo se permiten archivos .sql, .backup o .dump')
        return
      }

      setSelectedFile(file)
    }
  }

  const handleRestoreFromFile = async () => {
    if (!selectedFile) {
      toast.error('No se seleccionó archivo', 'Por favor selecciona un archivo de backup')
      return
    }

    setIsUploading(true)

    try {
      const token = localStorage.getItem('token')
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3500/api'
      const uploadUrl = `${baseUrl}/backups/restore-from-file`

      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      setShowFileUpload(false)
      setSelectedFile(null)
      toast.success('Base de datos restaurada', 'La aplicación se recargará en 2 segundos')

      // Recargar la página después de restaurar
      setTimeout(() => window.location.reload(), 2000)
    } catch (error) {
      logError('BackupsPage:restoreFromFile', error)
      toast.error('Error al restaurar el backup', getErrorMessage(error, 'No se pudo completar la restauración'))
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancelFileUpload = () => {
    setShowFileUpload(false)
    setSelectedFile(null)
  }

  const backupTypeOptions = [
    { value: '', label: 'Todos los tipos' },
    { value: 'FULL', label: 'Completo' },
    { value: 'INCREMENTAL', label: 'Incremental' },
    { value: 'DIFFERENTIAL', label: 'Diferencial' },
  ]

  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'SUCCESS', label: 'Exitoso' },
    { value: 'FAILED', label: 'Fallido' },
    { value: 'IN_PROGRESS', label: 'En Progreso' },
  ]

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDuration = (ms: number | null | undefined) => {
    if (!ms) return '-'
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  // Check permissions
  if (!can('backups', 'view')) {
    return (
      <div className="text-white px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-2">Acceso Denegado</div>
            <div className="text-white/60">No tienes permisos para ver backups.</div>
          </div>
        </div>
      </div>
    )
  }

  const renderDashboard = () => (
    <>
      {/* Stats Cards */}
      {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Total Backups</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats.total || 0}</p>
                </div>
                <Database className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Exitosos</p>
                  <p className="text-2xl font-bold text-green-400 mt-1">{stats.successful || 0}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Fallidos</p>
                  <p className="text-2xl font-bold text-red-400 mt-1">{stats.failed || 0}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Tamaño Total</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {formatFileSize(stats.totalSizeBytes || 0)}
                  </p>
                </div>
                <HardDrive className="w-8 h-8 text-purple-400" />
              </div>
            </div>
          </div>
        )}
    </>
  )

  const renderHistory = () => (
    <>
      {/* Export Buttons */}
      <div className="mb-6">
        <ExportButtons
          data={backups}
          columns={{
            backupType: 'Tipo',
            backupName: 'Archivo',
            sizeBytes: 'Tamaño (bytes)',
            status: 'Estado',
            duration: 'Duración (ms)',
            startTime: 'Fecha Inicio',
            endTime: 'Fecha Fin',
          }}
          title="Historial de Backups"
          subtitle={`${backups.length} respaldos registrados`}
          department="IT - Infraestructura"
          author="Sistema"
        />
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 sm:p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
        <div className="space-y-4">
          {/* Primera fila: Selectores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Tipo de Backup"
              value={backupTypeFilter}
              onChange={(e) => setBackupTypeFilter(e.target.value)}
              options={backupTypeOptions}
              className="bg-white/5"
            />
            <Select
              label="Estado"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={statusOptions}
              className="bg-white/5"
            />
          </div>

          {/* Segunda fila: Fechas y botón */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="min-w-0 overflow-hidden">
              <Input
                type="date"
                label="Fecha Inicio"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white/5"
              />
            </div>
            <div className="min-w-0 overflow-hidden">
              <Input
                type="date"
                label="Fecha Fin"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white/5"
              />
            </div>
            <Button
              variant="glass"
              onClick={() => {
                setBackupTypeFilter('')
                setStatusFilter('')
                setStartDate('')
                setEndDate('')
              }}
              className="w-full h-fit self-end"
            >
              <Search className="w-4 h-4 mr-2" />
              Limpiar Filtros
            </Button>
          </div>
        </div>
      </div>

        {/* Table */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
          {isLoading ? (
            <div className="p-8 flex justify-center"><LoadingSpinner size="md" /></div>
          ) : backups.length === 0 ? (
            <div className="p-8 text-center text-white/60">No se encontraron backups</div>
          ) : (
            <div className="overflow-x-auto">
              {/* Desktop Table */}
              <table className="hidden md:table w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Archivo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Tamaño</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Duración</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider w-32">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {backups.map((backup) => (
                    <tr key={backup.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-sm text-white">{backup.backupType}</td>
                      <td className="px-4 py-3 text-sm text-white/70 truncate max-w-xs" title={backup.backupName}>
                        {backup.backupName}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/70">{formatFileSize(backup.sizeBytes)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit ${
                            backup.status === 'SUCCESS'
                              ? 'bg-green-500/10 text-green-400'
                              : backup.status === 'FAILED'
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-yellow-500/10 text-yellow-400'
                          }`}
                        >
                          {backup.status === 'SUCCESS' && <CheckCircle className="w-3 h-3" />}
                          {backup.status === 'FAILED' && <XCircle className="w-3 h-3" />}
                          {backup.status === 'IN_PROGRESS' && <Clock className="w-3 h-3" />}
                          {backup.status === 'SUCCESS' ? 'Exitoso' : backup.status === 'FAILED' ? 'Fallido' : 'En Progreso'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/70">{formatDuration(backup.duration)}</td>
                      <td className="px-4 py-3 text-sm text-white/70">
                        {new Date(backup.createdAt).toLocaleString('es-ES')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {backup.status === 'SUCCESS' && can('backups', 'download') && (
                            <Button
                              onClick={() => handleDownloadBackup(backup.id)}
                              variant="ghost"
                              size="sm"
                              className="text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Descargar
                            </Button>
                          )}
                          {backup.status === 'SUCCESS' && can('backups', 'create') && (
                            <Button
                              onClick={() => setRestoreId(backup.id)}
                              variant="ghost"
                              size="sm"
                              className="text-xs bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 hover:border-purple-500/40"
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Restaurar
                            </Button>
                          )}
                          {can('backups', 'delete') && (
                            <Button
                              onClick={() => setDeleteId(backup.id)}
                              variant="danger"
                              size="sm"
                              className="text-xs"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
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
                {backups.map((backup) => (
                  <div key={backup.id} className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-white font-medium text-sm mb-1">{backup.backupType}</h3>
                        <p className="text-white/60 text-xs truncate">{backup.backupName}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${
                          backup.status === 'SUCCESS'
                            ? 'bg-green-500/10 text-green-400'
                            : backup.status === 'FAILED'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-yellow-500/10 text-yellow-400'
                        }`}
                      >
                        {backup.status === 'SUCCESS' && <CheckCircle className="w-3 h-3" />}
                        {backup.status === 'FAILED' && <XCircle className="w-3 h-3" />}
                        {backup.status === 'IN_PROGRESS' && <Clock className="w-3 h-3" />}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm mb-3">
                      <p className="text-white/70">
                        <span className="text-white/50">Tamaño:</span> {formatFileSize(backup.sizeBytes)}
                      </p>
                      <p className="text-white/70">
                        <span className="text-white/50">Duración:</span> {formatDuration(backup.duration)}
                      </p>
                      <p className="text-white/70">
                        <span className="text-white/50">Fecha:</span> {new Date(backup.createdAt).toLocaleString('es-ES')}
                      </p>
                      {backup.errorMessage && (
                        <p className="text-red-400 text-xs mt-2">
                          <span className="font-medium">Error:</span> {backup.errorMessage}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {backup.status === 'SUCCESS' && can('backups', 'download') && (
                        <button
                          onClick={() => handleDownloadBackup(backup.id)}
                          className="w-full px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 border border-blue-500/20 hover:border-blue-500/40"
                        >
                          <Download className="w-4 h-4" />
                          Descargar Backup
                        </button>
                      )}
                      {backup.status === 'SUCCESS' && can('backups', 'create') && (
                        <button
                          onClick={() => setRestoreId(backup.id)}
                          className="w-full px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 border border-purple-500/20 hover:border-purple-500/40"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Restaurar Backup
                        </button>
                      )}
                      {can('backups', 'delete') && (
                        <button
                          onClick={() => setDeleteId(backup.id)}
                          className="w-full px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 border border-red-500/20 hover:border-red-500/40"
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar Backup
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
    </>
  )

  return (
    <div className="text-white px-2 sm:px-0">
      <div>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-semibold mb-2">Backups</h1>
              <p className="text-white/70">Historial de respaldos del sistema</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs tabs={BACKUP_TABS} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

        {/* Header con botón Crear Backup */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">
              {activeTab === 'dashboard' ? 'Estadísticas de Backups' : 'Historial de Respaldos'}
            </h2>
            <p className="text-white/60 text-sm">
              {activeTab === 'dashboard'
                ? 'Resumen general del sistema de backups'
                : `${backups.length} respaldos registrados`}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {can('backups', 'create') && (
              <Button
                onClick={handleCreateBackup}
                variant="glass"
                size="sm"
                disabled={createBackupMutation.isPending}
              >
                <span key={createBackupMutation.isPending ? 'loading' : 'idle'} className="flex items-center">
                  {createBackupMutation.isPending ? (
                    <>
                      <span className="inline-block w-4 h-4 mr-1 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creando Backup...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1" />
                      <span>Crear Backup Manual</span>
                    </>
                  )}
                </span>
              </Button>
            )}
            {can('backups', 'create') && (
              <Button
                onClick={() => setShowFileUpload(true)}
                variant="glass"
                size="sm"
                className="bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20 hover:border-purple-500/40"
              >
                <Upload className="w-4 h-4 mr-1" />
                <span>Restaurar desde Archivo</span>
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="min-h-[500px]">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'history' && renderHistory()}
        </div>
      </div>

      {/* Confirmación de restauración */}
      <ConfirmDialog
        isOpen={restoreId !== null}
        onClose={() => setRestoreId(null)}
        onConfirm={handleRestoreBackup}
        title="Restaurar Base de Datos"
        message={
          <div className="space-y-2">
            <p className="text-white/80">
              Esta acción restaurará la base de datos al estado del backup seleccionado.
            </p>
            <p className="text-white/80 font-medium">
              TODOS los datos actuales serán reemplazados.
            </p>
            <p className="text-white/60 text-sm">
              La aplicación se recargará automáticamente después de la restauración.
            </p>
            <p className="text-red-400 text-sm font-medium">
              ¿Estás seguro de que quieres continuar?
            </p>
          </div>
        }
        confirmText="Sí, Restaurar"
        cancelText="Cancelar"
        variant="danger"
      />

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteBackup}
        title="Eliminar Backup"
        message={
          <div className="space-y-2">
            <p className="text-white/80">
              ¿Estás seguro de que deseas eliminar este backup?
            </p>
            <p className="text-white/60 text-sm">
              Esta acción eliminará permanentemente el archivo de backup del servidor.
            </p>
            <p className="text-red-400 text-sm font-medium">
              Esta acción no se puede deshacer.
            </p>
          </div>
        }
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />

      {/* Dialog para restaurar desde archivo */}
      <ConfirmDialog
        isOpen={showFileUpload}
        onClose={handleCancelFileUpload}
        onConfirm={handleRestoreFromFile}
        title="Restaurar desde Archivo"
        message={
          <div className="space-y-4">
            <p className="text-white/80">
              Selecciona un archivo de backup desde tu computadora para restaurar la base de datos.
            </p>

            <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".sql,.backup,.dump"
                onChange={handleFileChange}
                className="hidden"
                id="backup-file-input"
              />
              <label
                htmlFor="backup-file-input"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="w-8 h-8 text-white/60" />
                <span className="text-white/80 text-sm font-medium">
                  {selectedFile ? selectedFile.name : 'Click para seleccionar archivo'}
                </span>
                <span className="text-white/50 text-xs">
                  Formatos: .sql, .backup, .dump
                </span>
              </label>
            </div>

            <div className="space-y-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-yellow-400 font-medium text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Advertencia Importante
              </p>
              <p className="text-white/80 text-sm">
                Esta acción restaurará la base de datos al estado del archivo seleccionado.
              </p>
              <p className="text-white/80 font-medium text-sm">
                TODOS los datos actuales serán reemplazados.
              </p>
              <p className="text-white/60 text-xs">
                La aplicación se recargará automáticamente después de la restauración.
              </p>
            </div>
          </div>
        }
        confirmText={isUploading ? 'Restaurando...' : 'Restaurar Base de Datos'}
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  )
}
