import { Bell, Trash2, Database, Ticket, Package, Settings, Calendar, BellRing } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications, useUnreadCount, useMarkAllAsRead, useDeleteNotification } from '../../../features/notifications/hooks/useNotifications'
import { notificationsWS } from '../../../services/notifications-websocket.service'
import { usePushNotifications } from '../../../hooks/usePushNotifications'
import type { Notification } from '../../../features/notifications/types'
import PushNotificationToggle from './PushNotificationToggle'

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [showPushSettings, setShowPushSettings] = useState(false)
  const [realtimeUnreadCount, setRealtimeUnreadCount] = useState<number | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const { data: unreadCountData, refetch: refetchUnreadCount } = useUnreadCount()
  const { data: notificationsData, isLoading, refetch: refetchNotifications } = useNotifications({ limit: 10 })
  const markAllAsReadMutation = useMarkAllAsRead()
  const deleteNotificationMutation = useDeleteNotification()
  const { isSupported: isPushSupported, isSubscribed: isPushSubscribed } = usePushNotifications()

  // Use real-time count if available, otherwise fall back to API data
  const unreadCount = realtimeUnreadCount ?? unreadCountData?.data?.count ?? 0
  const notifications = notificationsData?.data || []

  // Setup real-time WebSocket listeners
  useEffect(() => {
    // Handler for new notifications
    const handleNewNotification = (_notification: Notification) => {
      // Refetch notifications to show the new one
      refetchNotifications()
      refetchUnreadCount()

      // TODO: Push notifications disabled - will be re-implemented with service worker
      // Show system notification if permission granted
      // if (hasPermission && isPushSupported) {
      //   showNotification({
      //     title: notification.title,
      //     body: notification.message || 'Nueva notificación',
      //     ...
      //   })
      // }
    }

    // Handler for broadcast notifications
    const handleBroadcastNotification = (_notification: Notification) => {
      refetchNotifications()
      refetchUnreadCount()

      // TODO: Push notifications disabled - will be re-implemented with service worker
      // Show system notification for broadcasts
      // if (hasPermission && isPushSupported) {
      //   showNotification({
      //     ...
      //   })
      // }
    }

    // Handler for unread count updates
    const handleUnreadCount = (data: { count: number }) => {
      setRealtimeUnreadCount(data.count)
    }

    // Handler for connection status
    const handleConnected = () => {
      // Fetch initial data when connected
      refetchUnreadCount()
      refetchNotifications()
    }

    // Subscribe to WebSocket events
    notificationsWS.on('new-notification', handleNewNotification)
    notificationsWS.on('new-broadcast-notification', handleBroadcastNotification)
    notificationsWS.on('unread-count', handleUnreadCount)
    notificationsWS.on('connected', handleConnected)

    // Cleanup listeners on unmount
    return () => {
      notificationsWS.off('new-notification', handleNewNotification)
      notificationsWS.off('new-broadcast-notification', handleBroadcastNotification)
      notificationsWS.off('unread-count', handleUnreadCount)
      notificationsWS.off('connected', handleConnected)
    }
  }, [refetchNotifications, refetchUnreadCount])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync()
    } catch {
      // Silent fail - mutation will handle error state
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteNotificationMutation.mutateAsync(id)
    } catch {
      // Silent fail - mutation will handle error state
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'BACKUP':
        return <Database className="w-5 h-5" />
      case 'TICKET':
        return <Ticket className="w-5 h-5" />
      case 'INVENTORY':
        return <Package className="w-5 h-5" />
      case 'SYSTEM':
        return <Settings className="w-5 h-5" />
      case 'CALENDAR':
        return <Calendar className="w-5 h-5" />
      default:
        return <Bell className="w-5 h-5" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'text-red-400'
      case 'HIGH':
        return 'text-orange-400'
      case 'NORMAL':
        return 'text-blue-400'
      case 'LOW':
        return 'text-gray-400'
      default:
        return 'text-white'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Ahora'
    if (diffMins < 60) return `Hace ${diffMins}m`
    if (diffHours < 24) return `Hace ${diffHours}h`
    if (diffDays < 7) return `Hace ${diffDays}d`
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
  }

  const handleToggleDropdown = async () => {
    const newOpenState = !isOpen
    setIsOpen(newOpenState)

    // Refetch notifications when opening the dropdown
    if (newOpenState) {
      refetchNotifications()
      refetchUnreadCount()
      
      // Marcar todas como leídas automáticamente al abrir
      if (unreadCount > 0) {
        await handleMarkAllAsRead()
      }
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    // Cerrar el dropdown primero
    setIsOpen(false)
    
    // Redirigir según el tipo de notificación usando React Router
    const data = notification.data ? JSON.parse(notification.data) : {}
    
    switch (notification.type) {
      case 'BACKUP':
        navigate('/daily-backups')
        break
      case 'TICKET':
        navigate('/tickets')
        break
      case 'INVENTORY':
        navigate('/inventory')
        break
      case 'CALENDAR':
        if (data.eventId) {
          navigate(`/calendar?event=${data.eventId}`)
        } else {
          navigate('/calendar')
        }
        break
      case 'SYSTEM':
        navigate('/admin')
        break
      default:
        // No hacer nada si no hay ruta específica
        break
    }
  }

  const handleDeleteAllNotifications = async () => {
    try {
      // Eliminar todas las notificaciones
      for (const notification of notifications) {
        await deleteNotificationMutation.mutateAsync(notification.id)
      }

      // Refetch para actualizar la lista
      refetchNotifications()
      refetchUnreadCount()
    } catch {
      // Silent fail - mutation will handle error state
    }
  }


  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggleDropdown}
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors group"
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5 text-white/80" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
          style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 50%, rgba(2, 6, 23, 0.98) 100%)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)'
          }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10">
            {/* Push Notifications Status */}
            {isPushSupported && !isPushSubscribed && !showPushSettings && (
              <button
                onClick={() => setShowPushSettings(true)}
                className="w-full mb-3 px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 hover:border-blue-500/50 text-blue-300 text-xs transition-all flex items-center justify-center gap-2"
              >
                <BellRing className="w-4 h-4" />
                <span>Activar Notificaciones Push</span>
              </button>
            )}

            {/* Push Settings Panel */}
            {showPushSettings && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-white">Configuración Push</h4>
                  <button
                    onClick={() => setShowPushSettings(false)}
                    className="text-white/60 hover:text-white text-xs"
                  >
                    Cerrar
                  </button>
                </div>
                <PushNotificationToggle />
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold">Notificaciones</h3>
                <p className="text-white/60 text-xs">{notifications.length} notificaciones</p>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto overscroll-none">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-white/60">
                Cargando notificaciones...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-12 h-12 text-white/20 mx-auto mb-2" />
                <p className="text-white/60 text-sm">No tienes notificaciones nuevas</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map((notification: Notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className="px-4 py-3 hover:bg-white/5 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 text-white/60">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={`text-sm font-medium ${getPriorityColor(notification.priority)}`}>
                            {notification.title}
                          </h4>
                          <span className="text-xs text-white/40 whitespace-nowrap flex-shrink-0">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                        </div>
                        {notification.message && (
                          <p className="text-xs text-white/70 line-clamp-2 mb-2">
                            {notification.message}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(notification.id)
                            }}
                            disabled={deleteNotificationMutation.isPending}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span className="hidden sm:inline">Eliminar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer - Eliminar todas */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-white/10">
              <button
                onClick={handleDeleteAllNotifications}
                disabled={deleteNotificationMutation.isPending}
                className="w-full text-sm text-red-400 hover:text-red-300 transition-colors text-center flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
