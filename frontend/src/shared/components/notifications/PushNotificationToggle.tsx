import { Bell, BellOff, TestTube } from 'lucide-react';
import { usePushNotifications } from '../../../hooks/usePushNotifications';
import { useState } from 'react';

export default function PushNotificationToggle() {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    showTestNotification,
  } = usePushNotifications();

  const [actionLoading, setActionLoading] = useState(false);

  if (!isSupported) {
    return (
      <div className="text-center p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
        <BellOff className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
        <p className="text-yellow-400 text-sm">
          Las notificaciones push no están soportadas en este navegador
        </p>
      </div>
    );
  }

  const handleToggle = async () => {
    setActionLoading(true);

    try {
      if (isSubscribed) {
        await unsubscribe();
      } else {
        await subscribe();
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTest = async () => {
    setActionLoading(true);
    try {
      await showTestNotification();
    } catch (error) {
      console.error('Error showing test notification:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusText = () => {
    if (permission === 'denied') {
      return 'Notificaciones bloqueadas por el navegador';
    }
    if (isSubscribed) {
      return 'Notificaciones activadas';
    }
    if (permission === 'default') {
      return 'Activar notificaciones del sistema';
    }
    return 'Activar notificaciones';
  };

  const getStatusColor = () => {
    if (permission === 'denied') return 'text-red-400';
    if (isSubscribed) return 'text-green-400';
    return 'text-blue-400';
  };

  return (
    <div className="space-y-3">
      {/* Status */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center gap-3">
          {isSubscribed ? (
            <Bell className="w-5 h-5 text-green-400" />
          ) : (
            <BellOff className="w-5 h-5 text-white/40" />
          )}
          <div>
            <p className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </p>
            {permission === 'denied' && (
              <p className="text-xs text-white/60 mt-1">
                Actívalas en la configuración del navegador
              </p>
            )}
          </div>
        </div>

        {permission !== 'denied' && (
          <button
            onClick={handleToggle}
            disabled={isLoading || actionLoading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isSubscribed
                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
                : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading || actionLoading ? (
              'Procesando...'
            ) : isSubscribed ? (
              'Desactivar'
            ) : (
              'Activar'
            )}
          </button>
        )}
      </div>

      {/* Test Button */}
      {isSubscribed && permission === 'granted' && (
        <button
          onClick={handleTest}
          disabled={actionLoading}
          className="w-full px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <TestTube className="w-4 h-4" />
          <span>Probar Notificación</span>
        </button>
      )}

      {/* Info */}
      <div className="text-xs text-white/60 space-y-1">
        <p>• Las notificaciones te mantendrán informado de eventos importantes</p>
        <p>• Puedes desactivarlas en cualquier momento</p>
        <p>• Solo recibirás notificaciones relevantes</p>
      </div>
    </div>
  );
}
