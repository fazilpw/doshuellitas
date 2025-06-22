// src/components/pwa/OfflineSync.jsx - Sistema de Sincronización Offline
import { useState, useEffect } from 'react';

const OfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState([]);
  const [lastSync, setLastSync] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [offlineData, setOfflineData] = useState({
    evaluations: 0,
    photos: 0,
    notes: 0
  });

  useEffect(() => {
    initializeOfflineSync();
    setupEventListeners();
    loadOfflineData();
    
    // Verificar sincronización cada 30 segundos si está online
    const syncInterval = setInterval(() => {
      if (isOnline && pendingSync.length > 0) {
        performSync();
      }
    }, 30000);

    return () => {
      clearInterval(syncInterval);
    };
  }, [isOnline, pendingSync.length]);

  // ============================================
  // 🚀 INICIALIZACIÓN
  // ============================================
  async function initializeOfflineSync() {
    try {
      // Inicializar IndexedDB para almacenamiento offline
      await initializeIndexedDB();
      
      // Cargar último timestamp de sincronización
      const lastSyncTime = localStorage.getItem('club-canino-last-sync');
      if (lastSyncTime) {
        setLastSync(new Date(parseInt(lastSyncTime)));
      }
      
      console.log('✅ Sistema offline inicializado');
    } catch (error) {
      console.error('❌ Error inicializando sistema offline:', error);
    }
  }

  function setupEventListeners() {
    // Eventos de conexión
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Escuchar mensajes del Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }

  // ============================================
  // 🌐 GESTIÓN DE CONEXIÓN
  // ============================================
  function handleOnline() {
    console.log('🌐 Conexión restaurada');
    setIsOnline(true);
    
    // Intentar sincronizar inmediatamente
    setTimeout(() => {
      if (pendingSync.length > 0) {
        performSync();
      }
    }, 1000);
  }

  function handleOffline() {
    console.log('📱 Modo offline detectado');
    setIsOnline(false);
  }

  function handleSWMessage(event) {
    const { type, data } = event.data;
    
    switch (type) {
      case 'SYNC_COMPLETE':
        setSyncStatus('success');
        setLastSync(new Date());
        localStorage.setItem('club-canino-last-sync', Date.now().toString());
        loadOfflineData();
        break;
        
      case 'SYNC_ERROR':
        setSyncStatus('error');
        break;
        
      case 'OFFLINE_DATA_SAVED':
        loadOfflineData();
        break;
    }
  }

  // ============================================
  // 💾 INDEXEDDB OPERATIONS
  // ============================================
  async function initializeIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ClubCaninoOfflineDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Store para evaluaciones offline
        if (!db.objectStoreNames.contains('evaluations')) {
          const evaluationsStore = db.createObjectStore('evaluations', { keyPath: 'id' });
          evaluationsStore.createIndex('timestamp', 'timestamp', { unique: false });
          evaluationsStore.createIndex('synced', 'synced', { unique: false });
        }
        
        // Store para fotos offline
        if (!db.objectStoreNames.contains('photos')) {
          const photosStore = db.createObjectStore('photos', { keyPath: 'id' });
          photosStore.createIndex('timestamp', 'timestamp', { unique: false });
          photosStore.createIndex('synced', 'synced', { unique: false });
        }
        
        // Store para notas offline
        if (!db.objectStoreNames.contains('notes')) {
          const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
          notesStore.createIndex('timestamp', 'timestamp', { unique: false });
          notesStore.createIndex('synced', 'synced', { unique: false });
        }
      };
    });
  }

  async function saveOfflineData(storeName, data) {
    try {
      const db = await initializeIndexedDB();
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const dataToSave = {
        ...data,
        id: data.id || generateId(),
        timestamp: Date.now(),
        synced: false
      };
      
      await store.put(dataToSave);
      
      console.log(`💾 Datos guardados offline en ${storeName}:`, dataToSave.id);
      loadOfflineData();
      
      return dataToSave.id;
    } catch (error) {
      console.error('❌ Error guardando datos offline:', error);
      throw error;
    }
  }

  async function loadOfflineData() {
    try {
      const db = await initializeIndexedDB();
      const stores = ['evaluations', 'photos', 'notes'];
      const counts = {};
      const pending = [];
      
      for (const storeName of stores) {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index('synced');
        
        // Contar elementos no sincronizados
        const unsyncedCount = await new Promise((resolve) => {
          const request = index.count(false);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => resolve(0);
        });
        
        counts[storeName] = unsyncedCount;
        
        // Obtener elementos pendientes para sincronización
        if (unsyncedCount > 0) {
          const request = index.getAll(false);
          request.onsuccess = () => {
            pending.push(...request.result.map(item => ({
              ...item,
              storeName
            })));
          };
        }
      }
      
      setOfflineData(counts);
      setPendingSync(pending);
      
    } catch (error) {
      console.error('❌ Error cargando datos offline:', error);
    }
  }

  // ============================================
  // 🔄 SINCRONIZACIÓN
  // ============================================
  async function performSync() {
    if (!isOnline || syncStatus === 'syncing') return;
    
    setSyncStatus('syncing');
    
    try {
      console.log('🔄 Iniciando sincronización...', pendingSync.length, 'elementos');
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const item of pendingSync) {
        try {
          await syncSingleItem(item);
          successCount++;
        } catch (error) {
          console.error('❌ Error sincronizando item:', error);
          errorCount++;
        }
      }
      
      console.log(`✅ Sincronización completada: ${successCount} exitosos, ${errorCount} errores`);
      
      setSyncStatus('success');
      setLastSync(new Date());
      localStorage.setItem('club-canino-last-sync', Date.now().toString());
      
      // Recargar datos offline
      await loadOfflineData();
      
    } catch (error) {
      console.error('❌ Error en sincronización:', error);
      setSyncStatus('error');
    }
  }

  async function syncSingleItem(item) {
    const { storeName, ...data } = item;
    
    let endpoint;
    switch (storeName) {
      case 'evaluations':
        endpoint = '/api/evaluations';
        break;
      case 'photos':
        endpoint = '/api/photos';
        break;
      case 'notes':
        endpoint = '/api/notes';
        break;
      default:
        throw new Error(`Endpoint desconocido para ${storeName}`);
    }
    
    // Enviar al servidor
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    // Marcar como sincronizado en IndexedDB
    const db = await initializeIndexedDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    await store.put({
      ...item,
      synced: true,
      syncedAt: Date.now()
    });
  }

  // ============================================
  // 🛠️ UTILIDADES
  // ============================================
  function generateId() {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  function formatLastSync() {
    if (!lastSync) return 'Nunca';
    
    const now = new Date();
    const diffMinutes = Math.floor((now - lastSync) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Hace un momento';
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
    if (diffMinutes < 1440) return `Hace ${Math.floor(diffMinutes / 60)} h`;
    return lastSync.toLocaleDateString('es-CO');
  }

  function getTotalPendingItems() {
    return Object.values(offlineData).reduce((sum, count) => sum + count, 0);
  }

  // ============================================
  // 📱 API PÚBLICA PARA OTROS COMPONENTES
  // ============================================
  window.clubCaninoOffline = {
    saveEvaluation: (evaluation) => saveOfflineData('evaluations', evaluation),
    savePhoto: (photo) => saveOfflineData('photos', photo),
    saveNote: (note) => saveOfflineData('notes', note),
    forceSync: performSync,
    isOnline: () => isOnline,
    getPendingCount: getTotalPendingItems
  };

  // ============================================
  // 🎨 RENDER COMPONENT
  // ============================================
  const totalPending = getTotalPendingItems();
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-[#2C3E50] flex items-center">
          <span className={`mr-2 ${isOnline ? 'text-green-500' : 'text-red-500'}`}>
            {isOnline ? '🌐' : '📱'}
          </span>
          Estado de Sincronización
        </h3>
        
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isOnline ? 'En línea' : 'Sin conexión'}
        </div>
      </div>

      {/* Estado de sincronización */}
      <div className="flex items-center justify-between text-sm mb-3">
        <span className="text-gray-600">Última sincronización:</span>
        <span className="font-medium">{formatLastSync()}</span>
      </div>

      {/* Datos pendientes */}
      {totalPending > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-yellow-800">
                📤 {totalPending} elemento{totalPending > 1 ? 's' : ''} pendiente{totalPending > 1 ? 's' : ''}
              </div>
              <div className="text-xs text-yellow-600 mt-1">
                {offlineData.evaluations > 0 && `${offlineData.evaluations} evaluaciones • `}
                {offlineData.photos > 0 && `${offlineData.photos} fotos • `}
                {offlineData.notes > 0 && `${offlineData.notes} notas`}
              </div>
            </div>
            
            {isOnline && (
              <button
                onClick={performSync}
                disabled={syncStatus === 'syncing'}
                className="bg-yellow-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-yellow-700 disabled:opacity-50"
              >
                {syncStatus === 'syncing' ? '⏳' : '🔄'} Sincronizar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Estado de sincronización */}
      {syncStatus === 'syncing' && (
        <div className="flex items-center text-blue-600 text-sm">
          <span className="animate-spin mr-2">⏳</span>
          Sincronizando datos...
        </div>
      )}

      {syncStatus === 'success' && totalPending === 0 && (
        <div className="flex items-center text-green-600 text-sm">
          <span className="mr-2">✅</span>
          Todos los datos sincronizados
        </div>
      )}

      {syncStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2">
          <div className="flex items-center text-red-600 text-sm">
            <span className="mr-2">❌</span>
            Error en la sincronización
          </div>
          <button
            onClick={performSync}
            className="text-xs text-red-600 hover:text-red-800 mt-1"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Modo offline */}
      {!isOnline && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
          <div className="text-blue-700 text-sm">
            <div className="font-medium">📱 Modo Offline Activo</div>
            <div className="text-xs mt-1">
              Los datos se guardarán localmente y se sincronizarán automáticamente cuando recuperes la conexión.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineSync;