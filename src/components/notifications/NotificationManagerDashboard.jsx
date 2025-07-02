// src/components/notifications/NotificationManagerDashboard.jsx
// 🎛️ DASHBOARD COMPLETO PARA GESTIÓN DE NOTIFICACIONES

import { useState, useEffect } from 'react';
import NotificationTester from './NotificationTester.jsx';
import { NotificationMigrator, runFullMigration } from '../../utils/migrationScript.js';
import supabase from '../../lib/supabase.js';

const NotificationManagerDashboard = ({ userId, dogs = [], isAdmin = false }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [migrationStatus, setMigrationStatus] = useState('not_started');
  const [migrationReport, setMigrationReport] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSystemStats();
  }, []);

  // ============================================
  // 📊 CARGAR ESTADÍSTICAS DEL SISTEMA
  // ============================================

  const loadSystemStats = async () => {
    try {
      setLoading(true);

      // Contar notificaciones por categoría
      const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('category, priority, created_at')
        .gte('created_at', new Date(Date.now() - 30*24*60*60*1000).toISOString());

      // Contar plantillas disponibles
      const { data: templates, error: templatesError } = await supabase
        .from('notification_templates')
        .select('category, is_active')
        .eq('is_active', true);

      // Contar notificaciones programadas
      const { data: scheduled, error: scheduledError } = await supabase
        .from('scheduled_notifications')
        .select('status')
        .eq('status', 'pending');

      // Verificar si ya se hizo migración
      const { data: migrated, error: migratedError } = await supabase
        .from('notifications')
        .select('id')
        .not('category', 'is', null)
        .limit(1);

      const stats = {
        recentNotifications: notifications?.length || 0,
        availableTemplates: templates?.length || 0,
        pendingScheduled: scheduled?.length || 0,
        isMigrated: (migrated?.length || 0) > 0,
        notificationsByCategory: groupByCategory(notifications || []),
        notificationsByPriority: groupByPriority(notifications || []),
        templatesByCategory: groupByCategory(templates || [])
      };

      setSystemStats(stats);
      setMigrationStatus(stats.isMigrated ? 'completed' : 'not_started');

    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // 🔄 EJECUTAR MIGRACIÓN
  // ============================================

  const runMigration = async () => {
    setLoading(true);
    setMigrationStatus('running');

    try {
      const result = await runFullMigration();
      
      if (result.success) {
        setMigrationStatus('completed');
        setMigrationReport(result.report);
        await loadSystemStats(); // Recargar estadísticas
      } else {
        setMigrationStatus('failed');
        setMigrationReport(result.report);
      }

    } catch (error) {
      setMigrationStatus('failed');
      console.error('Error en migración:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // 🧪 RENDERIZAR PESTAÑA DE PRUEBAS
  // ============================================

  const renderTestingTab = () => (
    <div className="space-y-6">
      <NotificationTester userId={userId} dogs={dogs} />
    </div>
  );

  // ============================================
  // 🔄 RENDERIZAR PESTAÑA DE MIGRACIÓN
  // ============================================

  const renderMigrationTab = () => (
    <div className="space-y-6">
      {/* Estado de migración */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-[#2C3E50] mb-4">
          🔄 Estado de Migración
        </h3>
        
        <div className={`p-4 rounded-lg border ${
          migrationStatus === 'completed' ? 'bg-green-50 border-green-200' :
          migrationStatus === 'running' ? 'bg-yellow-50 border-yellow-200' :
          migrationStatus === 'failed' ? 'bg-red-50 border-red-200' :
          'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h4 className={`font-bold ${
                migrationStatus === 'completed' ? 'text-green-800' :
                migrationStatus === 'running' ? 'text-yellow-800' :
                migrationStatus === 'failed' ? 'text-red-800' :
                'text-blue-800'
              }`}>
                {migrationStatus === 'completed' ? '✅ Migración Completada' :
                 migrationStatus === 'running' ? '⏳ Migración en Progreso...' :
                 migrationStatus === 'failed' ? '❌ Migración Fallida' :
                 '🚀 Listo para Migrar'}
              </h4>
              <p className={`text-sm ${
                migrationStatus === 'completed' ? 'text-green-700' :
                migrationStatus === 'running' ? 'text-yellow-700' :
                migrationStatus === 'failed' ? 'text-red-700' :
                'text-blue-700'
              }`}>
                {migrationStatus === 'completed' ? 'Todas las notificaciones han sido migradas al nuevo sistema' :
                 migrationStatus === 'running' ? 'Migrando notificaciones existentes, por favor espera...' :
                 migrationStatus === 'failed' ? 'Hubo un error durante la migración. Revisa la consola.' :
                 'Migra tus notificaciones existentes al nuevo sistema con plantillas'}
              </p>
            </div>
            
            {migrationStatus === 'not_started' && (
              <button
                onClick={runMigration}
                disabled={loading}
                className="bg-[#56CCF2] text-white px-6 py-2 rounded-lg hover:bg-[#5B9BD5] transition-colors font-medium disabled:opacity-50"
              >
                🚀 Iniciar Migración
              </button>
            )}
          </div>
        </div>

        {/* Reporte de migración */}
        {migrationReport && (
          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <h4 className="font-bold text-gray-800 mb-3">📊 Reporte de Migración</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Total procesadas:</strong> {migrationReport.summary.total}</p>
                <p><strong>Exitosas:</strong> {migrationReport.summary.successful}</p>
                <p><strong>Fallidas:</strong> {migrationReport.summary.failed}</p>
              </div>
              <div>
                <p><strong>Tasa de éxito:</strong> {migrationReport.summary.successRate}</p>
                <p><strong>Backup creado:</strong> {migrationReport.backupInfo.created ? '✅' : '❌'}</p>
                <p><strong>Fecha:</strong> {new Date(migrationReport.timestamp).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Información sobre la migración */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-bold text-blue-900 mb-2">💡 ¿Qué hace la migración?</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Categoriza</strong> notificaciones existentes (médicas, transporte, comportamiento, etc.)</li>
          <li>• <strong>Asigna prioridades</strong> automáticamente basado en el contenido</li>
          <li>• <strong>Crea backup</strong> completo de tus datos actuales</li>
          <li>• <strong>Migra preferencias</strong> al nuevo formato con categorías</li>
          <li>• <strong>Programa notificaciones</strong> inteligentes (tips semanales, recordatorios)</li>
          <li>• <strong>Crea historial</strong> para analytics y métricas</li>
        </ul>
      </div>
    </div>
  );

  // ============================================
  // 📊 RENDERIZAR PESTAÑA DE RESUMEN
  // ============================================

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Estadísticas principales */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="text-2xl mb-2">📬</div>
          <h3 className="font-bold text-gray-800">Notificaciones</h3>
          <p className="text-2xl font-bold text-[#56CCF2]">
            {systemStats?.recentNotifications || 0}
          </p>
          <p className="text-xs text-gray-600">Últimos 30 días</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="text-2xl mb-2">📋</div>
          <h3 className="font-bold text-gray-800">Plantillas</h3>
          <p className="text-2xl font-bold text-[#5B9BD5]">
            {systemStats?.availableTemplates || 0}
          </p>
          <p className="text-xs text-gray-600">Disponibles</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="text-2xl mb-2">⏰</div>
          <h3 className="font-bold text-gray-800">Programadas</h3>
          <p className="text-2xl font-bold text-[#C7EA46]">
            {systemStats?.pendingScheduled || 0}
          </p>
          <p className="text-xs text-gray-600">Pendientes</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="text-2xl mb-2">🔄</div>
          <h3 className="font-bold text-gray-800">Estado</h3>
          <p className={`text-sm font-bold ${
            systemStats?.isMigrated ? 'text-green-600' : 'text-yellow-600'
          }`}>
            {systemStats?.isMigrated ? '✅ Migrado' : '⏳ Pendiente'}
          </p>
          <p className="text-xs text-gray-600">Sistema</p>
        </div>
      </div>

      {/* Gráficos de distribución */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-[#2C3E50] mb-4">
            📊 Por Categoría
          </h3>
          <div className="space-y-2">
            {Object.entries(systemStats?.notificationsByCategory || {}).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 capitalize">{category}</span>
                <span className="font-bold text-[#56CCF2]">{count}</span>
              </div>
            ))}
            {Object.keys(systemStats?.notificationsByCategory || {}).length === 0 && (
              <p className="text-sm text-gray-500">No hay datos disponibles</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-[#2C3E50] mb-4">
            🎯 Por Prioridad
          </h3>
          <div className="space-y-2">
            {Object.entries(systemStats?.notificationsByPriority || {}).map(([priority, count]) => (
              <div key={priority} className="flex items-center justify-between">
                <span className={`text-sm capitalize ${
                  priority === 'urgent' ? 'text-red-600' :
                  priority === 'high' ? 'text-orange-600' :
                  priority === 'medium' ? 'text-yellow-600' :
                  'text-gray-600'
                }`}>
                  {priority === 'urgent' ? '🚨 Urgente' :
                   priority === 'high' ? '🔴 Alta' :
                   priority === 'medium' ? '🟡 Media' :
                   '🟢 Baja'}
                </span>
                <span className="font-bold text-[#56CCF2]">{count}</span>
              </div>
            ))}
            {Object.keys(systemStats?.notificationsByPriority || {}).length === 0 && (
              <p className="text-sm text-gray-500">No hay datos disponibles</p>
            )}
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-[#2C3E50] mb-4">
          ⚡ Acciones Rápidas
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <button
            onClick={() => setActiveTab('testing')}
            className="bg-[#56CCF2] text-white p-4 rounded-lg hover:bg-[#5B9BD5] transition-colors"
          >
            <div className="text-2xl mb-2">🧪</div>
            <div className="font-bold">Probar Sistema</div>
            <div className="text-sm opacity-90">Ejecutar pruebas básicas</div>
          </button>

          <button
            onClick={() => setActiveTab('migration')}
            className="bg-[#5B9BD5] text-white p-4 rounded-lg hover:bg-[#2C3E50] transition-colors"
          >
            <div className="text-2xl mb-2">🔄</div>
            <div className="font-bold">Migrar Datos</div>
            <div className="text-sm opacity-90">Actualizar al nuevo sistema</div>
          </button>

          <button
            onClick={loadSystemStats}
            disabled={loading}
            className="bg-[#C7EA46] text-[#2C3E50] p-4 rounded-lg hover:bg-[#AB5729] hover:text-white transition-colors disabled:opacity-50"
          >
            <div className="text-2xl mb-2">🔄</div>
            <div className="font-bold">Actualizar Stats</div>
            <div className="text-sm opacity-90">Recargar estadísticas</div>
          </button>
        </div>
      </div>
    </div>
  );

  // ============================================
  // 🛠️ FUNCIONES AUXILIARES
  // ============================================

  const groupByCategory = (items) => {
    return items.reduce((acc, item) => {
      const category = item.category || 'general';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
  };

  const groupByPriority = (items) => {
    return items.reduce((acc, item) => {
      const priority = item.priority || 'low';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});
  };

  // ============================================
  // 🎨 RENDER PRINCIPAL
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFBF0] to-[#ACF0F4] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#2C3E50] mb-2">
            🔔 Gestión de Notificaciones
          </h1>
          <p className="text-gray-600">
            Sistema avanzado de notificaciones para Club Canino Dos Huellitas
          </p>
        </div>

        {/* Navegación por pestañas */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-lg">
            {[
              { id: 'overview', label: '📊 Resumen', icon: '📊' },
              { id: 'testing', label: '🧪 Pruebas', icon: '🧪' },
              { id: 'migration', label: '🔄 Migración', icon: '🔄' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#56CCF2] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido de la pestaña activa */}
        <div>
          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#56CCF2] mx-auto mb-4"></div>
                <p className="text-gray-700">Procesando...</p>
              </div>
            </div>
          )}

          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'testing' && renderTestingTab()}
          {activeTab === 'migration' && renderMigrationTab()}
        </div>
      </div>
    </div>
  );
};

export default NotificationManagerDashboard;