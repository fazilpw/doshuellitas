// src/components/dashboard/ParentDashboardUpdated.jsx
// 👨‍👩‍👧‍👦 DASHBOARD DE PADRES ACTUALIZADO CON FUNCIONALIDADES DE PESO

import { useState, useEffect } from 'react';
import { useDogWeight } from '../../hooks/useDogWeight.js';
import DogProfileComplete from '../dogs/DogProfileComplete.jsx';
import supabase from '../../lib/supabase.js';

const ParentDashboardUpdated = ({ user, dogs: initialDogs }) => {
  const [dogs, setDogs] = useState(initialDogs || []);
  const [selectedDog, setSelectedDog] = useState(null);
  const [activeView, setActiveView] = useState('overview'); // overview, dog-profile
  const [loading, setLoading] = useState(false);

  // ============================================
  // 🔄 CARGAR DATOS ACTUALIZADOS
  // ============================================
  const refreshDogs = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .eq('owner_id', user.id)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setDogs(data || []);
      console.log('🔄 Datos de perros actualizados:', data?.length || 0);
    } catch (err) {
      console.error('Error cargando perros:', err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // 📊 COMPONENTE TARJETA DE PERRO CON PESO
  // ============================================
  const DogCard = ({ dog }) => {
    const { weightStats, weightTrend, loading: weightLoading } = useDogWeight(dog.id);
    
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer"
           onClick={() => {
             setSelectedDog(dog);
             setActiveView('dog-profile');
           }}>
        
        {/* Header de la tarjeta */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] rounded-full flex items-center justify-center text-xl">
                {dog.photo_url ? (
                  <img src={dog.photo_url} alt={dog.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  '🐕'
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{dog.name}</h3>
                <p className="text-sm text-gray-600">{dog.breed}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-[#56CCF2] bg-opacity-10 text-[#56CCF2] rounded-full text-sm font-medium">
                {dog.size}
              </span>
              {dog.age && (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                  {dog.age} años
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Información de peso */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Peso Actual</div>
              <div className="text-xl font-bold text-gray-900">
                {weightLoading ? (
                  <div className="w-12 h-6 bg-gray-200 rounded animate-pulse mx-auto"></div>
                ) : (
                  `${weightStats?.current_weight ? parseFloat(weightStats.current_weight).toFixed(1) : '--'} kg`
                )}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Tendencia</div>
              <div className="flex items-center justify-center space-x-1">
                {weightTrend ? (
                  <>
                    <span className="text-lg">{weightTrend.icon}</span>
                    <span className={`text-sm font-medium ${weightTrend.color}`}>
                      {Math.abs(weightTrend.change).toFixed(1)}kg
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-gray-500">--</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Indicador de estado */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Estado General:</span>
              <span className="text-sm font-medium text-green-600">
                {dog.active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer con acciones */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              Click para ver perfil completo
            </span>
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // 📊 VISTA GENERAL (OVERVIEW)
  // ============================================
  const OverviewView = () => {
    return (
      <div className="space-y-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">¡Hola, {user?.full_name || 'Padre'}!</h1>
              <p className="text-blue-100 mt-1">
                Tienes {dogs.length} {dogs.length === 1 ? 'perro registrado' : 'perros registrados'} en el club
              </p>
            </div>
            <div className="text-6xl opacity-20">🐕‍🦺</div>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{dogs.length}</div>
                <div className="text-sm text-gray-600">Perros Registrados</div>
              </div>
              <div className="text-3xl">🐕</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{dogs.filter(d => d.active).length}</div>
                <div className="text-sm text-gray-600">Activos</div>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-sm text-gray-600">Alertas Pendientes</div>
              </div>
              <div className="text-3xl">🔔</div>
            </div>
          </div>
        </div>

        {/* Lista de perros */}
        {dogs.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Mis Perros</h2>
              <button 
                onClick={refreshDogs}
                className="text-[#56CCF2] hover:text-[#5B9BD5] text-sm font-medium"
              >
                🔄 Actualizar
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {dogs.map(dog => (
                <DogCard key={dog.id} dog={dog} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🐕</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No tienes perros registrados
            </h3>
            <p className="text-gray-600 mb-6">
              Contacta al club para registrar a tu mascota
            </p>
            <button className="bg-[#56CCF2] text-white px-6 py-3 rounded-lg hover:bg-[#5B9BD5] transition-colors">
              Contactar Club
            </button>
          </div>
        )}
      </div>
    );
  };

  // ============================================
  // 🐕 VISTA DE PERFIL DEL PERRO
  // ============================================
  const DogProfileView = () => {
    if (!selectedDog) return null;
    
    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <button 
            onClick={() => setActiveView('overview')}
            className="text-[#56CCF2] hover:text-[#5B9BD5]"
          >
            ← Volver a mis perros
          </button>
          <span>/</span>
          <span>{selectedDog.name}</span>
        </div>

        {/* Perfil completo */}
        <DogProfileComplete 
          dog={selectedDog}
          onUpdate={refreshDogs}
          userRole="padre"
        />
      </div>
    );
  };

  // ============================================
  // 🔄 EFFECT PARA CARGAR DATOS
  // ============================================
  useEffect(() => {
    if (user?.id && (!dogs || dogs.length === 0)) {
      refreshDogs();
    }
  }, [user?.id]);

  // ============================================
  // 🎨 RENDER PRINCIPAL
  // ============================================
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#56CCF2] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando información...</p>
            </div>
          </div>
        ) : (
          <>
            {activeView === 'overview' && <OverviewView />}
            {activeView === 'dog-profile' && <DogProfileView />}
          </>
        )}
      </div>
    </div>
  );
};

export default ParentDashboardUpdated;