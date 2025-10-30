import { useState } from 'react'
import { usePermissions } from '../../../providers/PermissionsProvider'
import LoadingSpinner from '../../../shared/components/ui/LoadingSpinner'
import { useBackups, useBackupStats, useCreateBackup, useRestoreBackup, useDeleteBackup } from '../../backups/hooks/useBackups'
import { useToast } from '../../../shared/components/ui/ToastContainer'
import Button from '../../../shared/components/ui/Button'
import Input from '../../../shared/components/ui/Input'
import Select from '../../../shared/components/ui/Select'
import ExportButtons from '../../../shared/components/export/ExportButtons'
import Tabs, { type Tab } from '../../../shared/components/ui/Tabs'
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog'
import { Search, Database, HardDrive, CheckCircle, XCircle, Clock, BarChart3, History, Plus, RefreshCw, Trash2, Download, Upload, AlertTriangle, TrendingUp } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { getErrorMessage, logError } from '../../../utils/errorHelpers'
import { getRechartsTheme, getCartesianGridProps, getAxisProps, getTooltipProps } from '../../dashboard/utils/rechartsTheme'

const BACKUP_TABS: Tab[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'history', label: 'Historial', icon: History },
]

export default function SystemBackupsTab() {
  const { can } = usePermissions()
  const toast = useToast()
  const rechartsTheme = getRechartsTheme()
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
      await Promise.all([refetchBackups(), refetchStats()])
    } catch (error) {
      logError('SystemBackupsTab:create', error)
      toast.error('Error al crear el backup', getErrorMessage(error, 'No se pudo completar la operación. Por favor, inténtelo de nuevo.'))
    }
  }

  const handleRestoreBackup = async () => {
    if (!restoreId) return

    try {
      await restoreBackupMutation.mutateAsync(restoreId)
      setRestoreId(null)
      toast.success('Base de datos restaurada', 'La aplicación se recargará en 2 segundos')
      setTimeout(() => window.location.reload(), 2000)
    } catch (error) {
      logError('SystemBackupsTab:restore', error)
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
      await Promise.all([refetchBackups(), refetchStats()])
    } catch (error) {
      logError('SystemBackupsTab:delete', error)
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
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

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
      logError('SystemBackupsTab:download', error)
      toast.error('Error al descargar el backup', getErrorMessage(error, 'No se pudo descargar el archivo. Verifica tus permisos.'))
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
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

      setTimeout(() => window.location.reload(), 2000)
    } catch (error) {
      logError('SystemBackupsTab:restoreFromFile', error)
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

  const renderDashboard = () => {
    if (!stats) return null

    const successRate = stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0
    const failureRate = stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0

    // Datos para gráfico de estado usando colores del tema
    const statusPieData = [
      { name: 'Exitosos', value: stats.successful || 0, fill: rechartsTheme.colors[2] }, // green
      { name: 'Fallidos', value: stats.failed || 0, fill: rechartsTheme.colors[0] } // red
    ].filter(item => item.value > 0)

    // Datos para gráfico de barras usando colores del tema
    const backupsBarData = [
      { name: 'Total', value: stats.total || 0, fill: rechartsTheme.colors[4] }, // blue
      { name: 'Exitosos', value: stats.successful || 0, fill: rechartsTheme.colors[2] }, // green
      { name: 'Fallidos', value: stats.failed || 0, fill: rechartsTheme.colors[0] } // red
    ]

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          <h3 className="text-xl font-bold text-white">Estadísticas de Backups del Sistema</h3>
        </div>

        {/* Tarjetas Resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-white/60 text-sm">Total</div>
              <Database className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white">{stats.total || 0}</div>
            <div className="text-xs text-white/50 mt-1">Backups realizados</div>
          </div>

          <div className="bg-green-500/5 backdrop-blur-sm rounded-2xl border border-green-500/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-green-400/80 text-sm">Exitosos</div>
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-green-400">{stats.successful || 0}</div>
            <div className="text-xs text-green-400/60 mt-1">{successRate}% del total</div>
          </div>

          <div className="bg-red-500/5 backdrop-blur-sm rounded-2xl border border-red-500/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-red-400/80 text-sm">Fallidos</div>
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-3xl font-bold text-red-400">{stats.failed || 0}</div>
            <div className="text-xs text-red-400/60 mt-1">{failureRate}% del total</div>
          </div>

          <div className="bg-purple-500/5 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-purple-400/80 text-sm">Tamaño Total</div>
              <HardDrive className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-400">
              {formatFileSize(stats.totalSizeBytes || 0)}
            </div>
            <div className="text-xs text-purple-400/60 mt-1">Espacio utilizado</div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Estado de Backups */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h3 className="text-white font-semibold text-lg mb-4">Estado de Backups</h3>
            {statusPieData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-center text-white/60">
                  No hay datos de backups disponibles
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip {...getTooltipProps(rechartsTheme)} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Comparación de Totales */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h3 className="text-white font-semibold text-lg mb-4">Resumen General</h3>
            {stats.total === 0 ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-center text-white/60">
                  No hay datos de resumen disponibles
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={backupsBarData}>
                  <CartesianGrid {...getCartesianGridProps(rechartsTheme)} />
                  <XAxis {...getAxisProps(rechartsTheme)} dataKey="name"
                  />
                  <YAxis {...getAxisProps(rechartsTheme)} />
                  <Tooltip {...getTooltipProps(rechartsTheme)} cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {backupsBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Información de Salud */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h3 className="text-white font-semibold text-lg mb-4">Salud del Sistema</h3>
            <div className="space-y-3">
              {/* Tasa de éxito */}
              <div className="p-3 bg-gradient-to-r from-green-500/10 to-green-500/5 border border-green-500/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-400 text-sm font-medium">Tasa de Éxito</span>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-green-400">{successRate}%</div>
                <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-700"
                    style={{ width: `${successRate}%` }}
                  />
                </div>
              </div>

              {/* Tasa de fallo */}
              {stats.failed > 0 && (
                <div className="p-3 bg-gradient-to-r from-red-500/10 to-red-500/5 border border-red-500/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-red-400 text-sm font-medium">Tasa de Fallo</span>
                    <XCircle className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="text-2xl font-bold text-red-400">{failureRate}%</div>
                  <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-rose-500 transition-all duration-700"
                      style={{ width: `${failureRate}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Promedio de tamaño */}
              {stats.total > 0 && (
                <div className="p-3 bg-gradient-to-r from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-purple-400 text-sm font-medium">Tamaño Promedio</span>
                    <HardDrive className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-xl font-bold text-purple-400">
                    {formatFileSize(stats.totalSizeBytes / stats.total)}
                  </div>
                  <div className="text-xs text-purple-400/60 mt-1">Por backup</div>
                </div>
              )}
            </div>
          </div>

          {/* Recomendaciones */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h3 className="text-white font-semibold text-lg mb-4">Recomendaciones</h3>
            <div className="space-y-3">
              {successRate < 95 && stats.total > 0 && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-yellow-400 text-sm font-medium mb-1">
                        Tasa de Éxito Baja
                      </div>
                      <div className="text-white/70 text-xs">
                        La tasa de éxito es menor al 95%. Revisa los logs de errores y considera verificar la configuración del servidor de base de datos.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {stats.total === 0 && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Database className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-blue-400 text-sm font-medium mb-1">
                        Sin Backups
                      </div>
                      <div className="text-white/70 text-xs">
                        No se han realizado backups aún. Se recomienda crear un backup inicial del sistema.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {successRate >= 95 && stats.total > 0 && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-green-400 text-sm font-medium mb-1">
                        Sistema Saludable
                      </div>
                      <div className="text-white/70 text-xs">
                        La tasa de éxito de backups es excelente ({successRate}%). El sistema de respaldo funciona correctamente.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-blue-400 text-sm font-medium mb-1">
                      Backups Automáticos
                    </div>
                    <div className="text-white/70 text-xs">
                      Los backups automáticos se realizan diariamente a las 2:00 AM. Puedes crear backups manuales en cualquier momento usando el botón "Crear Backup Manual".
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderHistory = () => (
    <>
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

      <div className="mb-6 p-4 sm:p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
        <div className="space-y-4">
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

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
          {isLoading ? (
            <div className="p-8 flex justify-center"><LoadingSpinner size="md" /></div>
          ) : backups.length === 0 ? (
            <div className="p-8 text-center text-white/60">No se encontraron backups</div>
          ) : (
            <div className="overflow-x-auto">
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
    <div className="space-y-6">
      <Tabs tabs={BACKUP_TABS} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

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

      <div className="min-h-[500px]">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'history' && renderHistory()}
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
