// src/components/teacher/TeacherDashboard.jsx - INTEGRACIÓN SISTEMA MÉDICO
import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase.js';
import MedicalQuickView from './MedicalQuickView.jsx';
import TeacherMedicalView from './TeacherMedicalView.jsx';
// ... otros imports existentes

const TeacherDashboard = () => {
  // ... estados existentes
  const [showMedicalView, setShowMedicalView] = useState(false);
  const [selectedDogForMedical, setSelectedDogForMedical] = useState(null);

  // ... funciones existentes

  // Función para abrir vista médica completa
  const openMedicalView = (dog = null) => {
    console.log('🏥 Abriendo vista médica:', dog?.name || 'vista general');
    setSelectedDogForMedical(dog);
    setShowMedicalView(true);
  };

  const closeMedicalView = () => {
    setShowMedicalView(false);
    setSelectedDogForMedical(null);
  };

  // Si está en vista médica, mostrar solo esa vista
  if (showMedicalView) {
    return (
      <TeacherMedicalView 
        selectedDog={selectedDogForMedical}
        onClose={closeMedicalView}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header existente */}
      <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] text-white rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">👨‍🏫 Dashboard Profesor</h1>
            <p className="opacity-90">Bienvenido de vuelta, gestiona evaluaciones y cuidado</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => openMedicalView()}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              🏥 Centro Médico
            </button>
            {/* otros botones existentes */}
          </div>
        </div>
      </div>

      {/* Grid principal con vista médica integrada */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna izquierda - Información médica */}
        <div className="space-y-6">
          {/* Vista médica rápida */}
          <MedicalQuickView onViewAll={() => openMedicalView()} />

          {/* Otros widgets existentes pueden ir aquí */}
        </div>

        {/* Columna central - Evaluaciones y perros */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Perros de hoy con información médica mejorada */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                🐕 Perros de Hoy ({dogs.length})
              </h2>
              <div className="text-sm text-gray-600">
                {todayEvaluations.length} evaluados • {dogs.length - todayEvaluations.length} pendientes
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dogs.map(dog => {
                const evaluated = isEvaluatedToday(dog.id);
                
                return (
                  <div key={dog.id} className={`border rounded-xl p-4 transition-all hover:shadow-md ${
                    evaluated ? 'border-green-300 bg-green-50' : 'border-gray-200'
                  }`}>
                    
                    {/* Info básica del perro */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">{dog.name}</h3>
                        <p className="text-sm text-gray-600">{dog.breed} • {dog.age} años</p>
                      </div>
                      <div className="flex space-x-2">
                        {/* Botón médico directo */}
                        <button
                          onClick={() => openMedicalView(dog)}
                          className="bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Ver información médica"
                        >
                          🏥
                        </button>
                        {/* otros botones existentes */}
                      </div>
                    </div>

                    {/* Indicadores médicos rápidos */}
                    <div className="mb-3">
                      <MedicalIndicators dogId={dog.id} />
                    </div>

                    {/* Estado de evaluación existente */}
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        evaluated 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {evaluated ? '✅ Evaluado' : '⏰ Pendiente'}
                      </span>
                      
                      {/* Botón de evaluación rápida existente */}
                      <button
                        onClick={() => openQuickEvaluation(dog)}
                        className="bg-[#56CCF2] text-white px-3 py-1 rounded-lg text-sm hover:bg-[#5B9BD5] transition-colors"
                      >
                        {evaluated ? 'Ver' : 'Evaluar'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resto de componentes existentes... */}
          
        </div>
      </div>

      {/* Modales existentes */}
      {/* ... */}
    </div>
  );
};

// Componente auxiliar para indicadores médicos rápidos
const MedicalIndicators = ({ dogId }) => {
  const [indicators, setIndicators] = useState({
    hasOverdueVaccines: false,
    hasActiveMedicines: false,
    hasCriticalAlerts: false,
    loading: true
  });

  useEffect(() => {
    fetchMedicalIndicators();
  }, [dogId]);

  const fetchMedicalIndicators = async () => {
    try {
      // Verificar vacunas vencidas
      const { data: overdueVaccines } = await supabase
        .from('vaccines')
        .select('id')
        .eq('dog_id', dogId)
        .lt('next_due_date', new Date().toISOString().split('T')[0])
        .limit(1);

      // Verificar medicinas activas
      const { data: activeMedicines } = await supabase
        .from('medicines')
        .select('id')
        .eq('dog_id', dogId)
        .eq('is_ongoing', true)
        .limit(1);

      // Verificar alertas críticas
      const { data: criticalAlerts } = await supabase
        .from('medical_alerts')
        .select('id')
        .eq('dog_id', dogId)
        .in('severity', ['critical', 'high'])
        .eq('is_active', true)
        .limit(1);

      setIndicators({
        hasOverdueVaccines: (overdueVaccines?.length || 0) > 0,
        hasActiveMedicines: (activeMedicines?.length || 0) > 0,
        hasCriticalAlerts: (criticalAlerts?.length || 0) > 0,
        loading: false
      });

    } catch (error) {
      console.error('❌ Error fetching medical indicators:', error);
      setIndicators(prev => ({ ...prev, loading: false }));
    }
  };

  if (indicators.loading) {
    return (
      <div className="flex space-x-1">
        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-xs">
      {indicators.hasCriticalAlerts && (
        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full flex items-center">
          🚨 Alerta
        </span>
      )}
      {indicators.hasOverdueVaccines && (
        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center">
          💉 Vacuna
        </span>
      )}
      {indicators.hasActiveMedicines && (
        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center">
          💊 Medicina
        </span>
      )}
      {!indicators.hasCriticalAlerts && !indicators.hasOverdueVaccines && !indicators.hasActiveMedicines && (
        <span className="text-green-600 text-xs">✅ Todo bien</span>
      )}
    </div>
  );
};

export default TeacherDashboard;