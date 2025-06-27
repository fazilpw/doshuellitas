// src/components/teacher/TeacherMedicalView.jsx
import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase.js';

const TeacherMedicalView = ({ selectedDog = null, onClose = null }) => {
  const [dogs, setDogs] = useState([]);
  const [vaccines, setVaccines] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [medicalAlerts, setMedicalAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDogId, setSelectedDogId] = useState(selectedDog?.id || '');
  const [tablesExist, setTablesExist] = useState({
    vaccines: false,
    medicines: false,
    alerts: false
  });

  useEffect(() => {
    fetchAllMedicalData();
  }, []);

  const fetchAllMedicalData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDogs(),
        checkTablesAndFetchData()
      ]);
    } catch (error) {
      console.error('❌ Error fetching medical data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkTablesAndFetchData = async () => {
    // Verificar qué tablas médicas existen
    const checks = {
      vaccines: false,
      medicines: false,
      alerts: false
    };

    // Verificar tabla vaccines
    try {
      await supabase.from('vaccines').select('count', { count: 'exact', head: true });
      checks.vaccines = true;
      await fetchVaccines();
    } catch (error) {
      console.log('Tabla vaccines no existe aún');
    }

    // Verificar tabla medicines
    try {
      await supabase.from('medicines').select('count', { count: 'exact', head: true });
      checks.medicines = true;
      await fetchMedicines();
    } catch (error) {
      console.log('Tabla medicines no existe aún');
    }

    // Verificar tabla medical_alerts
    try {
      await supabase.from('medical_alerts').select('count', { count: 'exact', head: true });
      checks.alerts = true;
      await fetchMedicalAlerts();
    } catch (error) {
      console.log('Tabla medical_alerts no existe aún');
    }

    setTablesExist(checks);
  };

  const fetchDogs = async () => {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select(`
          *,
          profiles!dogs_owner_id_fkey(full_name, phone, email)
        `)
        .order('name');

      if (error) throw error;
      setDogs(data || []);
    } catch (error) {
      console.error('❌ Error fetching dogs:', error);
    }
  };

  const fetchVaccines = async () => {
    try {
      const { data, error } = await supabase
        .from('vaccines')
        .select('*')
        .order('next_due_date', { ascending: true });

      if (error) throw error;
      setVaccines(data || []);
    } catch (error) {
      console.error('❌ Error fetching vaccines:', error);
    }
  };

  const fetchMedicines = async () => {
    try {
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .eq('is_ongoing', true)
        .order('next_dose_date', { ascending: true });

      if (error) throw error;
      setMedicines(data || []);
    } catch (error) {
      console.error('❌ Error fetching medicines:', error);
    }
  };

  const fetchMedicalAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_alerts')
        .select('*')
        .eq('is_active', true)
        .order('severity', { ascending: false });

      if (error) throw error;
      setMedicalAlerts(data || []);
    } catch (error) {
      console.error('❌ Error fetching medical alerts:', error);
    }
  };

  // Obtener información médica de un perro específico
  const getDogMedicalInfo = (dogId) => {
    const dogVaccines = vaccines.filter(v => v.dog_id === dogId);
    const dogMedicines = medicines.filter(m => m.dog_id === dogId);
    const dogAlerts = medicalAlerts.filter(a => a.dog_id === dogId);

    return { vaccines: dogVaccines, medicines: dogMedicines, alerts: dogAlerts };
  };

  // Obtener estado de vacunación
  const getVaccinationStatus = (dogId) => {
    const dogVaccines = vaccines.filter(v => v.dog_id === dogId);
    const overdueVaccines = dogVaccines.filter(v => 
      v.next_due_date && new Date(v.next_due_date) < new Date()
    );
    const upcomingVaccines = dogVaccines.filter(v => 
      v.next_due_date && 
      new Date(v.next_due_date) >= new Date() &&
      new Date(v.next_due_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    );

    if (overdueVaccines.length > 0) return { status: 'overdue', count: overdueVaccines.length, color: 'red' };
    if (upcomingVaccines.length > 0) return { status: 'upcoming', count: upcomingVaccines.length, color: 'yellow' };
    return { status: 'current', count: 0, color: 'green' };
  };

  // Obtener alertas críticas
  const getCriticalAlerts = (dogId) => {
    return medicalAlerts.filter(a => 
      a.dog_id === dogId && 
      (a.severity === 'critical' || a.severity === 'high')
    );
  };

  // Componente de tarjeta de perro con estado médico
  const DogMedicalCard = ({ dog }) => {
    const medicalInfo = getDogMedicalInfo(dog.id);
    const vaccinationStatus = getVaccinationStatus(dog.id);
    const criticalAlerts = getCriticalAlerts(dog.id);

    return (
      <div 
        className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
          selectedDogId === dog.id ? 'border-[#56CCF2] bg-blue-50' : 'border-gray-200'
        }`}
        onClick={() => setSelectedDogId(dog.id)}
      >
        {/* Header del perro */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-gray-900">{dog.name}</h3>
            <p className="text-sm text-gray-600">{dog.breed} • {dog.age} años</p>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              vaccinationStatus.color === 'green' ? 'bg-green-100 text-green-800' :
              vaccinationStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {vaccinationStatus.status === 'current' ? '✅ Al día' :
               vaccinationStatus.status === 'upcoming' ? `⏰ ${vaccinationStatus.count} próximas` :
               `🚨 ${vaccinationStatus.count} vencidas`}
            </div>
          </div>
        </div>

        {/* Alertas críticas */}
        {criticalAlerts.length > 0 && (
          <div className="mb-3">
            {criticalAlerts.map(alert => (
              <div key={alert.id} className="bg-red-50 border border-red-200 rounded-lg p-2 mb-2">
                <div className="flex items-center">
                  <span className="text-red-500 mr-2">🚨</span>
                  <span className="text-sm font-medium text-red-800">{alert.title}</span>
                </div>
                <p className="text-xs text-red-700 mt-1">{alert.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Resumen médico */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-[#56CCF2]">{medicalInfo.vaccines.length}</div>
            <div className="text-xs text-gray-600">Vacunas</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">{medicalInfo.medicines.length}</div>
            <div className="text-xs text-gray-600">Medicinas</div>
          </div>
          <div>
            <div className="text-lg font-bold text-orange-600">{medicalInfo.alerts.length}</div>
            <div className="text-xs text-gray-600">Alertas</div>
          </div>
        </div>

        {/* Info del dueño */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-600">
            <div>👤 {dog.profiles?.full_name}</div>
            <div>📱 {dog.profiles?.phone}</div>
          </div>
        </div>
      </div>
    );
  };

  // Vista detallada de un perro seleccionado
  const DogDetailedView = ({ dogId }) => {
    const dog = dogs.find(d => d.id === dogId);
    const medicalInfo = getDogMedicalInfo(dogId);

    if (!dog) return null;

    return (
      <div className="space-y-6">
        {/* Header del perro seleccionado */}
        <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1">🐕 {dog.name}</h2>
              <p className="opacity-90">{dog.breed} • {dog.age} años • Dueño: {dog.profiles?.full_name}</p>
            </div>
            <button
              onClick={() => setSelectedDogId('')}
              className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors"
            >
              ← Volver
            </button>
          </div>
        </div>

        {/* Alertas médicas críticas */}
        {medicalInfo.alerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h3 className="font-bold text-red-900 mb-4 flex items-center">
              <span className="mr-2">🚨</span>
              Alertas Médicas Activas ({medicalInfo.alerts.length})
            </h3>
            <div className="space-y-3">
              {medicalInfo.alerts.map(alert => (
                <div key={alert.id} className="bg-white rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-red-900">{alert.title}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {alert.severity === 'critical' ? 'CRÍTICO' :
                       alert.severity === 'high' ? 'ALTO' : 'MEDIO'}
                    </span>
                  </div>
                  <p className="text-gray-700">{alert.description}</p>
                  {alert.emergency_protocol && (
                    <div className="mt-2 p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">Protocolo: </span>
                      <span className="text-sm">{alert.emergency_protocol}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('vaccines')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'vaccines' 
                  ? 'bg-[#56CCF2] text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              💉 Vacunas ({medicalInfo.vaccines.length})
            </button>
            <button
              onClick={() => setActiveTab('medicines')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'medicines' 
                  ? 'bg-[#56CCF2] text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              💊 Medicinas ({medicalInfo.medicines.length})
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'vaccines' && (
              <VaccinesTabContent vaccines={medicalInfo.vaccines} dog={dog} />
            )}

            {activeTab === 'medicines' && (
              <MedicinesTabContent medicines={medicalInfo.medicines} dog={dog} />
            )}
          </div>
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
          {!tablesExist.vaccines && (
            <p className="text-sm text-orange-600 mt-2">
              Sistema médico listo - las vacunas aparecerán cuando se agreguen
            </p>
          )}
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
                  {vaccine.is_critical && (
                    <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                      CRÍTICA
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    Aplicada: {new Date(vaccine.date_administered).toLocaleDateString('es-CO')}
                  </div>
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
                <div>🏥 {vaccine.veterinarian || 'No especificado'}</div>
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
          {!tablesExist.medicines && (
            <p className="text-sm text-orange-600 mt-2">
              Sistema médico listo - las medicinas aparecerán cuando se agreguen
            </p>
          )}
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
              <div>
                <span className="font-medium">Inicio:</span> {new Date(medicine.start_date).toLocaleDateString('es-CO')}
              </div>
              {medicine.next_dose_date && (
                <div>
                  <span className="font-medium">Próxima dosis:</span> {new Date(medicine.next_dose_date).toLocaleDateString('es-CO')}
                </div>
              )}
            </div>
            {medicine.reason_for_treatment && (
              <div className="mt-2 text-sm text-gray-600">
                <span className="font-medium">Motivo:</span> {medicine.reason_for_treatment}
              </div>
            )}
            {medicine.special_instructions && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                <span className="font-medium">⚠️ Instrucciones especiales:</span> {medicine.special_instructions}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#56CCF2] mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información médica...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header principal */}
      {!selectedDogId && (
        <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] text-white  p-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold mb-2">🏥 Centro Médico - Vista Profesor</h1>
              <p className="opacity-90">Información médica completa de todos los perros</p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
              >
                ✕ Cerrar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Estado del sistema médico */}
      {!tablesExist.vaccines && !tablesExist.medicines && !tablesExist.alerts && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
          <h3 className="font-bold text-orange-900 mb-2">🔧 Sistema Médico en Configuración</h3>
          <p className="text-orange-800 text-sm">
            Las tablas médicas aún no están creadas. Una vez que se ejecute el schema SQL, 
            toda la información de vacunas, medicinas y alertas aparecerá aquí.
          </p>
        </div>
      )}

      {/* Vista principal o detallada */}
      {selectedDogId ? (
        <DogDetailedView dogId={selectedDogId} />
      ) : (
        <div>
          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mx-4 md:mx-10 mb-6">
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
              <div className="text-2xl font-bold text-orange-600">
                {medicalAlerts.filter(a => a.severity === 'critical' || a.severity === 'high').length}
              </div>
              <div className="text-sm text-gray-600">Alertas Críticas</div>
            </div>
          </div>

          {/* Lista de perros */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mx-4 md:mx-10 mb-4">
              🐕 Perros en el Colegio ({dogs.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mx-4 md:mx-10 gap-4">
              {dogs.map(dog => (
                <DogMedicalCard key={dog.id} dog={dog} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherMedicalView;