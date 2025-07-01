// src/components/teacher/TeacherMedicalView.jsx
// ✅ VERSIÓN CORREGIDA CON DEBUG Y FIXES
// Club Canino Dos Huellitas

import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase.js';

const TeacherMedicalView = ({ selectedDog = null, onClose = null }) => {
  const [dogs, setDogs] = useState([]);
  const [vaccines, setVaccines] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDogId, setSelectedDogId] = useState(selectedDog?.id || '');
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    console.log('🏥 TeacherMedicalView iniciado');
    checkAuthAndFetch();
  }, []);

  // ===============================================
  // 🔍 DEBUG Y VERIFICACIÓN DE AUTH
  // ===============================================
  const checkAuthAndFetch = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Usuario actual:', user?.email || 'No autenticado');
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        console.log('👤 Perfil actual:', profile);
        console.log('🎭 Rol actual:', profile?.role);
        setDebugInfo(`Usuario: ${user.email} | Rol: ${profile?.role}`);
      }
      
      await fetchAllMedicalData();
    } catch (error) {
      console.error('❌ Error en auth check:', error);
      setDebugInfo(`Error auth: ${error.message}`);
    }
  };

  const fetchAllMedicalData = async () => {
    setLoading(true);
    console.log('🔄 Iniciando carga de datos médicos...');
    
    try {
      await Promise.all([
        fetchDogs(),
        fetchVaccines(),
        fetchMedicines()
      ]);
      console.log('✅ Todos los datos médicos cargados');
    } catch (error) {
      console.error('❌ Error fetching medical data:', error);
      setDebugInfo(`Error carga: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // 📊 FETCH FUNCTIONS MEJORADAS
  // ===============================================
  const fetchDogs = async () => {
    try {
      console.log('🐕 Cargando perros...');
      const { data, error } = await supabase
        .from('dogs')
        .select(`
          *,
          profiles!dogs_owner_id_fkey(full_name, phone, email)
        `)
        .order('name');

      if (error) throw error;
      
      setDogs(data || []);
      console.log(`✅ Perros cargados: ${data?.length || 0}`);
    } catch (error) {
      console.error('❌ Error fetching dogs:', error);
      setDogs([]);
    }
  };

  // ✅ FUNCIÓN CORREGIDA PARA VACUNAS
  const fetchVaccines = async () => {
    console.log('💉 INICIANDO fetchVaccines...');
    
    try {
      // PASO 1: Query simple para verificar que hay datos
      console.log('📡 Ejecutando query simple...');
      const { data: simpleData, error: simpleError } = await supabase
        .from('dog_vaccines')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📊 Query simple resultado:', { 
        count: simpleData?.length || 0, 
        error: simpleError,
        firstRecord: simpleData?.[0]
      });

      if (simpleError) {
        console.error('❌ Error en query simple:', simpleError);
        setVaccines([]);
        return;
      }

      // PASO 2: Si hay datos, intentar query con JOIN
      if (simpleData && simpleData.length > 0) {
        console.log('✅ Datos encontrados, intentando JOIN...');
        
        const { data: joinData, error: joinError } = await supabase
          .from('dog_vaccines')
          .select(`
            id,
            vaccine_name,
            vaccine_type,
            next_due_date,
            last_application_date,
            administered,
            veterinarian_name,
            clinic_name,
            notes,
            dog_id,
            dogs (
              id,
              name,
              profiles (
                full_name,
                email
              )
            )
          `)
          .order('next_due_date', { ascending: true, nullsLast: true });

        console.log('📊 Query con JOIN resultado:', { 
          count: joinData?.length || 0, 
          error: joinError,
          sample: joinData?.[0]
        });

        if (joinError) {
          console.warn('⚠️ JOIN falló, usando datos simples:', joinError);
          setVaccines(simpleData);
        } else {
          setVaccines(joinData || []);
        }
      } else {
        console.log('⚠️ No hay datos en dog_vaccines');
        setVaccines([]);
      }

      console.log(`✅ Estado vacunas actualizado: ${simpleData?.length || 0}`);
      
    } catch (error) {
      console.error('❌ Error completo en fetchVaccines:', error);
      setVaccines([]);
    }
  };

  const fetchMedicines = async () => {
    try {
      console.log('💊 Cargando medicinas...');
      const { data, error } = await supabase
        .from('medicines')
        .select(`
          *,
          dogs!medicines_dog_id_fkey(
            name,
            profiles!dogs_owner_id_fkey(full_name, email)
          )
        `)
        .eq('is_ongoing', true)
        .order('next_dose_date', { ascending: true });

      if (error) throw error;
      
      setMedicines(data || []);
      console.log(`✅ Medicinas cargadas: ${data?.length || 0}`);
    } catch (error) {
      console.error('❌ Error fetching medicines:', error);
      setMedicines([]);
    }
  };

  // ===============================================
  // 🔍 DEBUG useEffect
  // ===============================================
  useEffect(() => {
    console.log('🔍 ESTADO DEBUG ACTUALIZADO:');
    console.log('- Dogs:', dogs.length);
    console.log('- Vaccines:', vaccines.length);
    console.log('- Medicines:', medicines.length);
    console.log('- Loading:', loading);
    
    if (vaccines.length > 0) {
      console.log('📋 Vacunas en estado:', vaccines.map(v => ({
        name: v.vaccine_name,
        dog_id: v.dog_id,
        date: v.next_due_date,
        dog_name: v.dogs?.name
      })));
    }
  }, [dogs, vaccines, medicines, loading]);

  // ===============================================
  // 📋 COMPONENTES DE TARJETAS
  // ===============================================
  const DogMedicalCard = ({ dog }) => {
    const dogVaccines = vaccines.filter(v => v.dog_id === dog.id);
    const dogMedicines = medicines.filter(m => m.dog_id === dog.id);
    
    const overdueVaccines = dogVaccines.filter(v => 
      v.next_due_date && new Date(v.next_due_date) < new Date()
    );

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900">{dog.name}</h3>
            <p className="text-sm text-gray-600">
              {dog.profiles?.full_name || 'Sin dueño asignado'}
            </p>
          </div>
          <button
            onClick={() => setSelectedDogId(dog.id)}
            className="text-[#56CCF2] hover:text-[#5B9BD5] text-sm font-medium"
          >
            Ver detalles →
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <span className="text-2xl mr-2">💉</span>
            <div>
              <div className="font-medium">{dogVaccines.length} vacunas</div>
              {overdueVaccines.length > 0 && (
                <div className="text-red-600 text-xs">
                  {overdueVaccines.length} vencida(s)
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center">
            <span className="text-2xl mr-2">💊</span>
            <div>
              <div className="font-medium">{dogMedicines.length} medicinas</div>
              <div className="text-gray-500 text-xs">activas</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ===============================================
  // 📋 VISTA DETALLADA DE PERRO
  // ===============================================
  const DogDetailedView = ({ dogId }) => {
    const dog = dogs.find(d => d.id === dogId);
    const dogVaccines = vaccines.filter(v => v.dog_id === dogId);
    const dogMedicines = medicines.filter(m => m.dog_id === dogId);

    if (!dog) return <div>Perro no encontrado</div>;

    return (
      <div className="space-y-6">
        {/* Header del perro */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{dog.name}</h2>
              <p className="text-gray-600">
                Dueño: {dog.profiles?.full_name || 'No asignado'}
              </p>
            </div>
            <button
              onClick={() => setSelectedDogId('')}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Volver
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('vaccines')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'vaccines'
                    ? 'border-[#56CCF2] text-[#56CCF2]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                💉 Vacunas ({dogVaccines.length})
              </button>
              <button
                onClick={() => setActiveTab('medicines')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'medicines'
                    ? 'border-[#56CCF2] text-[#56CCF2]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                💊 Medicinas ({dogMedicines.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Contenido de tabs */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {activeTab === 'vaccines' && (
            <VaccinesTabContent vaccines={dogVaccines} dog={dog} />
          )}
          {activeTab === 'medicines' && (
            <MedicinesTabContent medicines={dogMedicines} dog={dog} />
          )}
        </div>
      </div>
    );
  };

  // Contenido del tab de vacunas
  const VaccinesTabContent = ({ vaccines, dog }) => (
    <div className="space-y-4">
      {vaccines.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-3">💉</div>
          <p>No hay vacunas registradas para {dog.name}</p>
          <p className="text-sm text-blue-600 mt-2">
            Los padres pueden agregar vacunas desde su dashboard
          </p>
        </div>
      ) : (
        vaccines.map(vaccine => {
          const isOverdue = vaccine.next_due_date && new Date(vaccine.next_due_date) < new Date();
          const isUpcoming = vaccine.next_due_date && 
            new Date(vaccine.next_due_date) >= new Date() &&
            new Date(vaccine.next_due_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

          return (
            <div key={vaccine.id} className={`border rounded-lg p-4 ${
              isOverdue ? 'border-red-300 bg-red-50' :
              isUpcoming ? 'border-yellow-300 bg-yellow-50' :
              'border-green-300 bg-green-50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-medium text-gray-900">{vaccine.vaccine_name}</span>
                  {vaccine.administered && (
                    <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      APLICADA
                    </span>
                  )}
                </div>
                <div className="text-right">
                  {vaccine.last_application_date && (
                    <div className="text-sm text-gray-600">
                      Aplicada: {new Date(vaccine.last_application_date).toLocaleDateString('es-CO')}
                    </div>
                  )}
                  {vaccine.next_due_date && (
                    <div className={`text-sm font-medium ${
                      isOverdue ? 'text-red-600' : 
                      isUpcoming ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      Próxima: {new Date(vaccine.next_due_date).toLocaleDateString('es-CO')}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <div>🏥 {vaccine.veterinarian_name || 'No especificado'}</div>
                {vaccine.clinic_name && <div>📍 {vaccine.clinic_name}</div>}
                {vaccine.notes && <div className="mt-2">📝 {vaccine.notes}</div>}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  // Contenido del tab de medicinas
  const MedicinesTabContent = ({ medicines, dog }) => (
    <div className="space-y-4">
      {medicines.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-3">💊</div>
          <p>No hay medicinas activas para {dog.name}</p>
          <p className="text-sm text-blue-600 mt-2">
            Los padres pueden agregar medicinas desde su dashboard
          </p>
        </div>
      ) : (
        medicines.map(medicine => (
          <div key={medicine.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-medium text-gray-900">{medicine.medicine_name}</span>
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {medicine.medicine_type.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              {medicine.requires_monitoring && (
                <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                  REQUIERE MONITOREO
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Dosis:</span> {medicine.dosage}
              </div>
              <div>
                <span className="font-medium">Frecuencia:</span> {medicine.frequency}
              </div>
              {medicine.start_date && (
                <div>
                  <span className="font-medium">Inicio:</span> {new Date(medicine.start_date).toLocaleDateString('es-CO')}
                </div>
              )}
              {medicine.next_dose_date && (
                <div>
                  <span className="font-medium">Próxima dosis:</span> {new Date(medicine.next_dose_date).toLocaleDateString('es-CO')}
                </div>
              )}
            </div>
            {medicine.special_instructions && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <span className="font-medium text-yellow-900">Instrucciones especiales:</span>
                <p className="text-yellow-800 text-sm mt-1">{medicine.special_instructions}</p>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  // ===============================================
  // 🖥️ RENDER PRINCIPAL
  // ===============================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#56CCF2] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información médica...</p>
          {debugInfo && (
            <p className="text-xs text-gray-500 mt-2">{debugInfo}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏥 Centro Médico - Vista Profesores
          </h1>
          <p className="text-gray-600">
            Información médica agregada por los padres para cada perro
          </p>
          
          {/* DEBUG INFO */}
          {debugInfo && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
              Debug: {debugInfo}
            </div>
          )}
        </div>

        {/* Vista detallada si hay un perro seleccionado */}
        {selectedDogId ? (
          <DogDetailedView dogId={selectedDogId} />
        ) : (
          <div>
            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <div className="text-2xl font-bold text-[#56CCF2]">{dogs.length}</div>
                <div className="text-sm text-gray-600">Perros Registrados</div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {vaccines.filter(v => v.next_due_date && new Date(v.next_due_date) < new Date()).length}
                </div>
                <div className="text-sm text-gray-600">Vacunas Vencidas</div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{medicines.length}</div>
                <div className="text-sm text-gray-600">Medicinas Activas</div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{vaccines.length}</div>
                <div className="text-sm text-gray-600">Vacunas Registradas</div>
                
                {/* DEBUG TEMPORAL */}
                <div className="text-xs text-gray-500 mt-2 text-left">
                  <div>Estado: {loading ? 'Cargando...' : 'Listo'}</div>
                  <div>Array length: {vaccines.length}</div>
                  {vaccines.length > 0 && (
                    <div>Primera: {vaccines[0]?.vaccine_name || 'Sin nombre'}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Lista de perros */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                🐕 Perros en el Colegio ({dogs.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dogs.map(dog => (
                  <DogMedicalCard key={dog.id} dog={dog} />
                ))}
              </div>
            </div>

            {dogs.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🐕</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No hay perros registrados
                </h3>
                <p className="text-gray-600">
                  Cuando los padres registren perros y agreguen información médica, aparecerá aquí
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherMedicalView;