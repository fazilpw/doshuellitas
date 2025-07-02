// src/components/notifications/NotificationDisplay.jsx
// 🔔 COMPONENTE PARA MOSTRAR NOTIFICACIONES - COMPLETAMENTE CORREGIDO
// ✅ Categorías mapeadas a las 8 válidas del schema

import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase.js';

const NotificationDisplay = ({ userId, className = '' }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAll, setShowAll] = useState(false);

  // ============================================
  // 📥 CARGAR NOTIFICACIONES
  // ============================================
  const loadNotifications = async () => {
    try {
      console.log('📥 Cargando notificaciones para usuario:', userId);
      
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          dog:dogs(name, breed)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ Error cargando notificaciones:', error);
        return;
      }

      console.log('✅ Notificaciones cargadas:', data?.length || 0);
      setNotifications(data || []);
      
      // Contar no leídas
      const unread = data?.filter(n => !n.read).length || 0;
      setUnreadCount(unread);
      
    } catch (error) {
      console.error('❌ Error en loadNotifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // ✅ MARCAR COMO LEÍDA
  // ============================================
  const markAsRead = async (notificationId) => {
    try {
      console.log('✅ Marcando notificación como leída:', notificationId);
      
      const { error } = await supabase
        .from('notifications')
        .update({ 
          read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId);

      if (error) {
        console.error('❌ Error marcando como leída:', error);
        return;
      }

      // Actualizar estado local
      setNotifications(prev => prev.map(n => 
        n.id === notificationId 
          ? { ...n, read: true, read_at: new Date().toISOString() }
          : n
      ));
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      console.log('✅ Notificación marcada como leída');
      
    } catch (error) {
      console.error('❌ Error en markAsRead:', error);
    }
  };

  // ============================================
  // 🗑️ ELIMINAR NOTIFICACIÓN
  // ============================================
  const deleteNotification = async (notificationId) => {
    try {
      console.log('🗑️ Eliminando notificación:', notificationId);
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('❌ Error eliminando notificación:', error);
        return;
      }

      // Actualizar estado local
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      console.log('✅ Notificación eliminada');
      
    } catch (error) {
      console.error('❌ Error en deleteNotification:', error);
    }
  };

  // ============================================
  // 🎨 OBTENER ESTILO POR CATEGORÍA - CORREGIDO
  // ============================================
  const getNotificationStyle = (category) => {
    // ✅ SOLO USAR LAS 8 CATEGORÍAS VÁLIDAS DEL SCHEMA
    const styles = {
      // Categorías válidas del schema
      behavior: {
        icon: '🚨',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        iconBg: 'bg-red-100'
      },
      general: { // ✅ Para 'test', 'improvement', 'comparison' mapeadas aquí
        icon: '💡',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
        iconBg: 'bg-blue-100'
      },
      alert: { // ✅ Para 'system' mapeada aquí
        icon: '⚠️',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
        iconBg: 'bg-yellow-100'
      },
      medical: {
        icon: '💊',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800',
        iconBg: 'bg-green-100'
      },
      transport: {
        icon: '🚐',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        textColor: 'text-purple-800',
        iconBg: 'bg-purple-100'
      },
      routine: {
        icon: '📅',
        bgColor: 'bg-indigo-50',
        borderColor: 'border-indigo-200',
        textColor: 'text-indigo-800',
        iconBg: 'bg-indigo-100'
      },
      training: {
        icon: '🎓',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-800',
        iconBg: 'bg-orange-100'
      },
      tip: {
        icon: '💡',
        bgColor: 'bg-cyan-50',
        borderColor: 'border-cyan-200',
        textColor: 'text-cyan-800',
        iconBg: 'bg-cyan-100'
      }
    };
    
    return styles[category] || styles.general;
  };

  // ============================================
  // 🧪 CREAR NOTIFICACIÓN DE PRUEBA - CORREGIDA
  // ============================================
  const createTestNotification = async () => {
    try {
      console.log('🧪 Creando notificación de prueba...');
      
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          user_id: userId,
          dog_id: null,
          title: '🧪 Notificación de Prueba',
          message: `Prueba del sistema de notificaciones - ${new Date().toLocaleString('es-CO')}`,
          category: 'general', // ✅ CORREGIDO: 'general' en lugar de 'test'
          read: false
        }])
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Notificación de prueba creada');
      loadNotifications(); // Recargar
      
    } catch (error) {
      console.error('❌ Error creando notificación de prueba:', error);
    }
  };

  // ============================================
  // 🔄 EFECTOS Y LISTENERS
  // ============================================
  useEffect(() => {
    if (userId) {
      loadNotifications();
      
      // Recargar cada 30 segundos
      const interval = setInterval(loadNotifications, 30000);
      
      // Listener para refrescos manuales
      const handleRefresh = () => {
        console.log('🔄 Refrescando notificaciones por evento');
        loadNotifications();
      };
      
      window.addEventListener('notificationsUpdated', handleRefresh);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('notificationsUpdated', handleRefresh);
      };
    }
  }, [userId]);

  // ============================================
  // 🎨 RENDER
  // ============================================
  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="space-y-2">
            <div className="h-16 bg-gray-100 rounded"></div>
            <div className="h-16 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const displayNotifications = showAll ? notifications : notifications.slice(0, 3);

  return (
    <div className={`${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            🔔 Notificaciones
          </h3>
          {unreadCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={createTestNotification}
            className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200"
          >
            🧪 Test
          </button>
          <button
            onClick={loadNotifications}
            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* Lista de notificaciones */}
      {notifications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📬</div>
          <p>No hay notificaciones</p>
          <button
            onClick={createTestNotification}
            className="mt-2 text-purple-600 hover:text-purple-800 text-sm"
          >
            Crear notificación de prueba
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {displayNotifications.map((notification) => {
              const style = getNotificationStyle(notification.category);
              
              return (
                <div
                  key={notification.id}
                  className={`${style.bgColor} ${style.borderColor} border rounded-lg p-4 transition-all hover:shadow-md ${
                    !notification.read ? 'ring-2 ring-blue-200' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    
                    {/* Icono */}
                    <div className={`${style.iconBg} p-2 rounded-full text-lg flex-shrink-0`}>
                      {style.icon}
                    </div>
                    
                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={`font-medium ${style.textColor} text-sm`}>
                            {notification.title}
                            {notification.dog?.name && (
                              <span className="text-xs ml-1 opacity-75">
                                • {notification.dog.name}
                              </span>
                            )}
                          </h4>
                          <p className="text-gray-700 text-sm mt-1 leading-relaxed">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-500">
                              {new Date(notification.created_at).toLocaleString('es-CO')}
                            </p>
                            <span className={`text-xs px-2 py-1 rounded-full ${style.bgColor} ${style.textColor}`}>
                              {notification.category}
                            </span>
                          </div>
                        </div>
                        
                        {/* Acciones */}
                        <div className="flex space-x-1 ml-2 flex-shrink-0">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs bg-white bg-opacity-50 hover:bg-opacity-75 px-2 py-1 rounded transition-colors"
                              title="Marcar como leída"
                            >
                              ✓
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-xs bg-white bg-opacity-50 hover:bg-opacity-75 px-2 py-1 rounded text-red-600 transition-colors"
                            title="Eliminar"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ver más/menos */}
          {notifications.length > 3 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {showAll ? 'Ver menos' : `Ver todas (${notifications.length})`}
              </button>
            </div>
          )}
        </>
      )}

      {/* Stats de debugging */}
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
        📊 <strong>Debug:</strong> {notifications.length} total, {unreadCount} no leídas
        • <span className="text-green-600">Recarga automática cada 30s</span>
        • <span className="text-blue-600">User ID: {userId}</span>
        • <span className="text-purple-600">Categorías válidas: general, medical, routine, transport, behavior, training, alert, tip</span>
      </div>
    </div>
  );
};

export default NotificationDisplay;