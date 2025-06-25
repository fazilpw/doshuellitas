// src/components/routines/VaccineManager.jsx - SISTEMA COMPLETO DE VACUNAS
import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase.js';

const VaccineManager = ({ dogs = [], onClose }) => {
  const [vaccines, setVaccines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDog, setSelectedDog] = useState('');
  const [editingVaccine, setEditingVaccine] = useState(null);

  // Calendarios de vacunación por edad
  const vaccineSchedules = {
    puppy: {
      label: 'Calendario de Cachorro',
      vaccines: [
        { name: 'Primera DHPP', weeks: 6, critical: true },
        { name: 'Segunda DHPP', weeks: 9, critical: true },
        { name: 'Tercera DHPP + Rabia', weeks: 12, critical: true },
        { name: 'Cuarta DHPP', weeks: 16, critical: true },
        { name: 'Bordetella', weeks: 12, critical: false }
      ]
    },
    adult: {
      label: 'Calendario Adulto (Anual)',
      vaccines: [
        { name: 'DHPP', months: 12, critical: true },
        { name: 'Rabia', months: 12, critical: true },
        { name: 'Bordetella', months: 6, critical: false },
        { name: 'Leptospirosis', months: 12, critical: false }
      ]
    },
    treatments: {
      label: 'Tratamientos Preventivos',
      vaccines: [
        { name: 'Desparasitación Interna', months: 3, critical: true },
        { name: 'Tratamiento Pulgas/Garrapatas', months: 1, critical: true },
        { name: 'Prevención Heartworm', months: 1, critical: true }
      ]
    }
  };

  useEffect(() => {
    if (dogs.length > 0) {
      fetchVaccines();
      if (!selectedDog) {
        setSelectedDog(dogs[0].id);
      }
    }
  }, [dogs]);

  const fetchVaccines = async () => {
    setLoading(true);
    try {
      const dogIds = dogs.map(dog => dog.id);
      const { data, error } = await supabase
        .from('dog_vaccines')
        .select(`
          *,
          dogs(name, breed, age)
        `)
        .in('dog_id', dogIds)
        .order('next_due_date', { ascending: true });

      if (error) throw error;
      setVaccines(data || []);
    } catch (error) {
      console.error('Error fetching vaccines:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVaccineStatus = (vaccine) => {
    const today = new Date();
    const dueDate = new Date(vaccine.next_due_date);
    const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) {
      return { status: 'overdue', label: 'Vencida', color: 'bg-red-100 text-red-800', days: Math.abs(daysUntil) };
    } else if (daysUntil <= 7) {
      return { status: 'urgent', label: 'Urgente', color: 'bg-orange-100 text-orange-800', days: daysUntil };
    } else if (daysUntil <= 30) {
      return { status: 'due_soon', label: 'Próxima', color: 'bg-yellow-100 text-yellow-800', days: daysUntil };
    } else {
      return { status: 'scheduled', label: 'Programada', color: 'bg-green-100 text-green-800', days: daysUntil };
    }
  };

  const groupVaccinesByDog = () => {
    const grouped = {};
    dogs.forEach(dog => {
      grouped[dog.id] = {
        dog,
        vaccines: vaccines.filter(v => v.dog_id === dog.id)
      };
    });
    return grouped;
  };

  const getUpcomingVaccines = () => {
    return vaccines
      .filter(vaccine => {
        const status = getVaccineStatus(vaccine);
        return ['overdue', 'urgent', 'due_soon'].includes(status.status);
      })
      .sort((a, b) => new Date(a.next_due_date) - new Date(b.next_due_date));
  };

  const markVaccineAsApplied = async (vaccineId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const vaccine = vaccines.find(v => v.id === vaccineId);
      
      // Calcular próxima fecha según el tipo de vacuna
      let nextDueDate = new Date();
      if (vaccine.vaccine_name.includes('DHPP') || vaccine.vaccine_name.includes('Rabia')) {
        nextDueDate.setFullYear(nextDueDate.getFullYear() + 1); // Anual
      } else if (vaccine.vaccine_name.includes('Bordetella')) {
        nextDueDate.setMonth(nextDueDate.getMonth() + 6); // Cada 6 meses
      } else if (vaccine.vaccine_type === 'deworming') {
        nextDueDate.setMonth(nextDueDate.getMonth() + 3); // Cada 3 meses
      } else {
        nextDueDate.setFullYear(nextDueDate.getFullYear() + 1); // Default anual
      }

      const { error } = await supabase
        .from('dog_vaccines')
        .update({
          last_application_date: today,
          next_due_date: nextDueDate.toISOString().split('T')[0],
          reminder_sent: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', vaccineId);

      if (error) throw error;
      
      await fetchVaccines();
      alert('✅ Vacuna marcada como aplicada y próxima cita programada');
    } catch (error) {
      console.error('Error updating vaccine:', error);
      alert('Error actualizando la vacuna');
    }
  };

  const VaccineCard = ({ vaccine }) => {
    const status = getVaccineStatus(vaccine);
    const dog = dogs.find(d => d.id === vaccine.dog_id);

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#56CCF2] rounded-full flex items-center justify-center">
              <span className="text-white text-lg">🐕</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{dog?.name}</h3>
              <p className="text-sm text-gray-600">{dog?.breed}</p>
            </div>
          </div>
          
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">{vaccine.vaccine_name}</span>
            <span className="text-sm text-gray-600">
              {vaccine.vaccine_type === 'vaccine' ? '💉' : 
               vaccine.vaccine_type === 'deworming' ? '💊' : '🛡️'}
            </span>
          </div>

          <div className="text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Próxima cita:</span>
              <span className="font-medium">
                {new Date(vaccine.next_due_date).toLocaleDateString('es-CO')}
              </span>
            </div>
            
            {status.status === 'overdue' && (
              <div className="text-red-600 font-medium">
                ⚠️ Vencida hace {status.days} días
              </div>
            )}
            
            {status.status === 'urgent' && (
              <div className="text-orange-600 font-medium">
                🚨 Vence en {status.days} días
              </div>
            )}
            
            {status.status === 'due_soon' && (
              <div className="text-yellow-600 font-medium">
                ⏰ Vence en {status.days} días
              </div>
            )}
          </div>

          {vaccine.last_application_date && (
            <div className="text-xs text-gray-500">
              Última aplicación: {new Date(vaccine.last_application_date).toLocaleDateString('es-CO')}
            </div>
          )}

          {vaccine.veterinarian_name && (
            <div className="text-xs text-gray-500">
              Veterinario: {vaccine.veterinarian_name}
            </div>
          )}
        </div>

        <div className="flex space-x-2 mt-4">
          <button
            onClick={() => markVaccineAsApplied(vaccine.id)}
            className="flex-1 bg-green-100 text-green-700 py-2 px-3 rounded text-sm hover:bg-green-200 transition-colors"
          >
            ✅ Ya aplicada
          </button>
          
          <button
            onClick={() => setEditingVaccine(vaccine)}
            className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-200 transition-colors"
          >
            ✏️ Editar
          </button>
        </div>
      </div>
    );
  };

  const AddVaccineForm = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
      dog_id: selectedDog || dogs[0]?.id || '',
      vaccine_name: '',
      vaccine_type: 'vaccine',
      next_due_date: '',
      veterinarian_name: '',
      clinic_name: '',
      notes: ''
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
      if (!formData.dog_id || !formData.vaccine_name || !formData.next_due_date) {
        alert('Por favor completa los campos obligatorios');
        return;
      }

      setSaving(true);
      try {
        const { error } = await supabase
          .from('dog_vaccines')
          .insert([formData]);

        if (error) throw error;
        
        onSave();
        onClose();
      } catch (error) {
        console.error('Error saving vaccine:', error);
        alert('Error guardando la vacuna');
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-xl w-full max-w-md">
          <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] text-white p-6 rounded-t-xl">
            <h3 className="text-lg font-bold">💉 Agregar Vacuna/Tratamiento</h3>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Perro *</label>
              <select
                value={formData.dog_id}
                onChange={(e) => setFormData({...formData, dog_id: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              >
                {dogs.map(dog => (
                  <option key={dog.id} value={dog.id}>{dog.name} ({dog.breed})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <select
                value={formData.vaccine_type}
                onChange={(e) => setFormData({...formData, vaccine_type: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              >
                <option value="vaccine">💉 Vacuna</option>
                <option value="deworming">💊 Desparasitación</option>
                <option value="flea_tick">🛡️ Pulgas/Garrapatas</option>
                <option value="heartworm">❤️ Prevención Heartworm</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la vacuna/tratamiento *</label>
              <input
                type="text"
                value={formData.vaccine_name}
                onChange={(e) => setFormData({...formData, vaccine_name: e.target.value})}
                placeholder="ej: DHPP, Rabia, Nexgard..."
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Próxima fecha de aplicación *</label>
              <input
                type="date"
                value={formData.next_due_date}
                onChange={(e) => setFormData({...formData, next_due_date: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Veterinario</label>
              <input
                type="text"
                value={formData.veterinarian_name}
                onChange={(e) => setFormData({...formData, veterinarian_name: e.target.value})}
                placeholder="ej: Dr. García"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Clínica</label>
              <input
                type="text"
                value={formData.clinic_name}
                onChange={(e) => setFormData({...formData, clinic_name: e.target.value})}
                placeholder="ej: Veterinaria Central"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Información adicional..."
                rows={3}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 px-6 py-4 flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-[#56CCF2] text-white py-2 px-4 rounded hover:bg-[#5B9BD5] transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando...' : '✅ Guardar'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const upcomingVaccines = getUpcomingVaccines();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#56CCF2] mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando sistema de vacunas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] text-white rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">💉 Control de Vacunas</h2>
            <p className="opacity-90">Mantén al día la salud preventiva de tus peluditos</p>
          </div>
          
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
          >
            + Agregar
          </button>
        </div>
      </div>

      {/* Alertas urgentes */}
      {upcomingVaccines.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="font-bold text-yellow-900 mb-4 flex items-center">
            <span className="mr-2">🚨</span>
            Vacunas que Requieren Atención ({upcomingVaccines.length})
          </h3>
          
          <div className="space-y-3">
            {upcomingVaccines.slice(0, 3).map(vaccine => {
              const status = getVaccineStatus(vaccine);
              const dog = dogs.find(d => d.id === vaccine.dog_id);
              
              return (
                <div key={vaccine.id} className="bg-white rounded-lg p-4 border-l-4 border-yellow-400">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900">{dog?.name}</span>
                      <span className="mx-2">•</span>
                      <span className="text-gray-700">{vaccine.vaccine_name}</span>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        status.status === 'overdue' ? 'text-red-600' : 'text-orange-600'
                      }`}>
                        {status.status === 'overdue' 
                          ? `Vencida hace ${status.days} días` 
                          : `Vence en ${status.days} días`
                        }
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(vaccine.next_due_date).toLocaleDateString('es-CO')}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {upcomingVaccines.length > 3 && (
            <p className="text-sm text-yellow-700 mt-3">
              Y {upcomingVaccines.length - 3} más...
            </p>
          )}
        </div>
      )}

      {/* Lista de vacunas por perro */}
      <div>
        <h3 className="font-bold text-gray-900 mb-4">📋 Cronograma por Perro</h3>
        
        <div className="space-y-6">
          {Object.entries(groupVaccinesByDog()).map(([dogId, { dog, vaccines: dogVaccines }]) => (
            <div key={dogId}>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">🐕</span>
                {dog.name} ({dog.breed})
                <span className="ml-2 text-sm text-gray-500">
                  {dogVaccines.length} vacunas programadas
                </span>
              </h4>
              
              {dogVaccines.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-3">💉</div>
                  <p className="text-gray-600 mb-4">No hay vacunas programadas para {dog.name}</p>
                  <button
                    onClick={() => {
                      setSelectedDog(dogId);
                      setShowAddForm(true);
                    }}
                    className="bg-[#56CCF2] text-white px-4 py-2 rounded-lg hover:bg-[#5B9BD5] transition-colors"
                  >
                    + Agregar primera vacuna
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dogVaccines.map(vaccine => (
                    <VaccineCard key={vaccine.id} vaccine={vaccine} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Información sobre calendarios de vacunación */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-blue-900 mb-3">📅 Calendarios de Vacunación Recomendados</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(vaccineSchedules).map(([key, schedule]) => (
            <div key={key} className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">{schedule.label}</h4>
              <ul className="space-y-1 text-sm text-blue-800">
                {schedule.vaccines.slice(0, 3).map((vaccine, index) => (
                  <li key={index} className="flex items-center">
                    <span className={`mr-2 ${vaccine.critical ? 'text-red-500' : 'text-blue-500'}`}>
                      {vaccine.critical ? '🔴' : '🔵'}
                    </span>
                    <span>{vaccine.name}</span>
                  </li>
                ))}
              </ul>
              {schedule.vaccines.length > 3 && (
                <p className="text-xs text-blue-600 mt-2">
                  Y {schedule.vaccines.length - 3} más...
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modales */}
      {showAddForm && (
        <AddVaccineForm
          onClose={() => setShowAddForm(false)}
          onSave={() => {
            fetchVaccines();
            setShowAddForm(false);
          }}
        />
      )}
    </div>
  );
};

export default VaccineManager;