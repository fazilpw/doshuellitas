// src/components/routines/VaccineManager.jsx
// 💉 GESTOR COMPLETO DE VACUNAS - TODAS LAS FUNCIONALIDADES

import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase.js';

const VaccineManager = ({ dogs = [], currentUser, onVaccineUpdated }) => {
  // Estados principales
  const [selectedDogId, setSelectedDogId] = useState('');
  const [activeTab, setActiveTab] = useState('calendar');
  const [loading, setLoading] = useState(false);
  const [vaccines, setVaccines] = useState([]);
  
  // Estados para modales
  const [showAddVaccine, setShowAddVaccine] = useState(false);
  const [editingVaccine, setEditingVaccine] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  // Estados para formulario
  const [formData, setFormData] = useState({
    vaccine_name: '',
    vaccine_type: 'vaccine',
    last_application_date: '',
    next_due_date: '',
    veterinarian_name: '',
    clinic_name: '',
    vaccine_lot: '',
    cost: '',
    notes: ''
  });

  const selectedDog = dogs.find(dog => dog.id === selectedDogId);

  // Tipos de vacunas
  const vaccineTypes = {
    'vaccine': { label: 'Vacuna', icon: '💉', color: 'bg-blue-50 text-blue-700' },
    'deworming': { label: 'Desparasitación', icon: '🪱', color: 'bg-green-50 text-green-700' },
    'flea_tick': { label: 'Pulgas/Garrapatas', icon: '🦟', color: 'bg-red-50 text-red-700' },
    'heartworm': { label: 'Heartworm', icon: '❤️', color: 'bg-purple-50 text-purple-700' }
  };

  // Calendarios de vacunación
  const vaccineSchedules = {
    puppy: [
      { name: 'Primera DHPP', weeks: 6, critical: true, description: 'Distemper, Hepatitis, Parvovirus, Parainfluenza' },
      { name: 'Segunda DHPP', weeks: 9, critical: true, description: 'Refuerzo de DHPP' },
      { name: 'Tercera DHPP + Rabia', weeks: 12, critical: true, description: 'DHPP + Primera rabia' },
      { name: 'Cuarta DHPP', weeks: 16, critical: true, description: 'Refuerzo final DHPP' },
      { name: 'Bordetella', weeks: 12, critical: false, description: 'Tos de perrera' }
    ],
    adult: [
      { name: 'DHPP Anual', months: 12, critical: true, description: 'Refuerzo anual' },
      { name: 'Rabia Anual', months: 12, critical: true, description: 'Refuerzo anual obligatorio' },
      { name: 'Bordetella', months: 6, critical: false, description: 'Cada 6 meses' },
      { name: 'Leptospirosis', months: 12, critical: false, description: 'Recomendada anual' }
    ],
    preventive: [
      { name: 'Desparasitación Interna', months: 3, critical: true, description: 'Cada 3 meses' },
      { name: 'Pulgas/Garrapatas', months: 1, critical: true, description: 'Mensual' },
      { name: 'Heartworm', months: 1, critical: true, description: 'Prevención mensual' }
    ]
  };

  // Efectos
  useEffect(() => {
    if (dogs.length > 0 && !selectedDogId) {
      setSelectedDogId(dogs[0].id);
    }
  }, [dogs, selectedDogId]);

  useEffect(() => {
    if (selectedDogId) {
      fetchVaccines();
    }
  }, [selectedDogId]);

  // ===============================================
  // 📊 OBTENER VACUNAS
  // ===============================================
  const fetchVaccines = async () => {
    if (!selectedDogId) return;
    
    setLoading(true);
    try {
      const { data: vaccinesData, error } = await supabase
        .from('dog_vaccines')
        .select('*')
        .eq('dog_id', selectedDogId)
        .order('next_due_date', { ascending: true });

      if (error) {
        console.error('❌ Error fetching vaccines:', error);
        return;
      }

      setVaccines(vaccinesData || []);
      
    } catch (error) {
      console.error('❌ Error in fetchVaccines:', error);
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // 📝 MANEJO DEL FORMULARIO
  // ===============================================
  const resetForm = () => {
    setFormData({
      vaccine_name: '',
      vaccine_type: 'vaccine',
      last_application_date: '',
      next_due_date: '',
      veterinarian_name: '',
      clinic_name: '',
      vaccine_lot: '',
      cost: '',
      notes: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const vaccineData = {
        dog_id: selectedDogId,
        vaccine_name: formData.vaccine_name,
        vaccine_type: formData.vaccine_type,
        last_application_date: formData.last_application_date || null,
        next_due_date: formData.next_due_date,
        veterinarian_name: formData.veterinarian_name || null,
        clinic_name: formData.clinic_name || null,
        vaccine_lot: formData.vaccine_lot || null,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        notes: formData.notes || null
      };

      if (editingVaccine) {
        // Actualizar vacuna existente
        const { error } = await supabase
          .from('dog_vaccines')
          .update(vaccineData)
          .eq('id', editingVaccine.id);

        if (error) throw error;
        console.log('✅ Vacuna actualizada exitosamente');
      } else {
        // Crear nueva vacuna
        const { error } = await supabase
          .from('dog_vaccines')
          .insert(vaccineData);

        if (error) throw error;
        console.log('✅ Vacuna creada exitosamente');
      }
      
      setShowAddVaccine(false);
      setEditingVaccine(null);
      resetForm();
      fetchVaccines();
      
      if (onVaccineUpdated) {
        onVaccineUpdated();
      }
      
    } catch (error) {
      console.error('❌ Error saving vaccine:', error);
      alert('Error al guardar la vacuna');
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // 🗑️ ELIMINAR VACUNA
  // ===============================================
  const handleDelete = async (vaccine) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('dog_vaccines')
        .delete()
        .eq('id', vaccine.id);

      if (error) throw error;

      setShowDeleteConfirm(null);
      fetchVaccines();
      
      if (onVaccineUpdated) {
        onVaccineUpdated();
      }
      
      console.log('✅ Vacuna eliminada exitosamente');
      
    } catch (error) {
      console.error('❌ Error deleting vaccine:', error);
      alert('Error al eliminar la vacuna');
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // ✏️ EDITAR VACUNA
  // ===============================================
  const handleEdit = (vaccine) => {
    setFormData({
      vaccine_name: vaccine.vaccine_name,
      vaccine_type: vaccine.vaccine_type,
      last_application_date: vaccine.last_application_date || '',
      next_due_date: vaccine.next_due_date,
      veterinarian_name: vaccine.veterinarian_name || '',
      clinic_name: vaccine.clinic_name || '',
      vaccine_lot: vaccine.vaccine_lot || '',
      cost: vaccine.cost ? vaccine.cost.toString() : '',
      notes: vaccine.notes || ''
    });
    setEditingVaccine(vaccine);
    setShowAddVaccine(true);
  };

  // ===============================================
  // 📅 CALCULAR ESTADO DE VACUNA
  // ===============================================
  const getVaccineStatus = (vaccine) => {
    const today = new Date();
    const dueDate = new Date(vaccine.next_due_date);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'overdue', days: Math.abs(diffDays), color: 'text-red-600', bgColor: 'bg-red-50', label: 'Vencida' };
    } else if (diffDays <= 7) {
      return { status: 'urgent', days: diffDays, color: 'text-orange-600', bgColor: 'bg-orange-50', label: 'Urgente' };
    } else if (diffDays <= 30) {
      return { status: 'upcoming', days: diffDays, color: 'text-yellow-600', bgColor: 'bg-yellow-50', label: 'Próxima' };
    } else {
      return { status: 'current', days: diffDays, color: 'text-green-600', bgColor: 'bg-green-50', label: 'Al día' };
    }
  };

  // ===============================================
  // 📅 GENERAR CALENDARIO AUTOMÁTICO
  // ===============================================
  const generateSchedule = (ageGroup) => {
    if (!selectedDog) return;

    const today = new Date();
    const scheduleVaccines = vaccineSchedules[ageGroup];
    const newVaccines = [];

    scheduleVaccines.forEach(vaccine => {
      let nextDate = new Date(today);
      
      if (vaccine.weeks) {
        nextDate.setDate(today.getDate() + (vaccine.weeks * 7));
      } else if (vaccine.months) {
        nextDate.setMonth(today.getMonth() + vaccine.months);
      }

      newVaccines.push({
        vaccine_name: vaccine.name,
        vaccine_type: ageGroup === 'preventive' ? 'deworming' : 'vaccine',
        next_due_date: nextDate.toISOString().split('T')[0],
        notes: vaccine.description
      });
    });

    return newVaccines;
  };

  const handleGenerateSchedule = async (ageGroup) => {
    setLoading(true);
    try {
      const newVaccines = generateSchedule(ageGroup);
      
      for (const vaccine of newVaccines) {
        await supabase
          .from('dog_vaccines')
          .insert({
            dog_id: selectedDogId,
            ...vaccine
          });
      }
      
      setShowScheduleModal(false);
      fetchVaccines();
      
      console.log(`✅ Calendario ${ageGroup} generado exitosamente`);
      
    } catch (error) {
      console.error('❌ Error generating schedule:', error);
      alert('Error al generar el calendario');
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // 🎨 COMPONENTES DE RENDERIZADO
  // ===============================================
  const renderDogSelector = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <div className="text-2xl">💉</div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Vacunas</h2>
          <p className="text-sm text-gray-600">
            {selectedDog ? `Para ${selectedDog.name}` : 'Selecciona un perro'}
          </p>
        </div>
      </div>
      
      {dogs.length > 0 && (
        <select
          value={selectedDogId}
          onChange={(e) => setSelectedDogId(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
        >
          {dogs.map(dog => (
            <option key={dog.id} value={dog.id}>{dog.name}</option>
          ))}
        </select>
      )}
    </div>
  );

  const renderTabs = () => (
    <div className="flex space-x-6 border-b border-gray-200 mb-6">
      <button
        onClick={() => setActiveTab('calendar')}
        className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
          activeTab === 'calendar'
            ? 'border-[#56CCF2] text-[#56CCF2]'
            : 'border-transparent text-gray-500 hover:text-gray-700'
        }`}
      >
        📅 Calendario
      </button>
      <button
        onClick={() => setActiveTab('history')}
        className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
          activeTab === 'history'
            ? 'border-[#56CCF2] text-[#56CCF2]'
            : 'border-transparent text-gray-500 hover:text-gray-700'
        }`}
      >
        📋 Historial
      </button>
    </div>
  );

  const renderCalendarView = () => {
    const upcomingVaccines = vaccines.filter(v => {
      const status = getVaccineStatus(v);
      return ['overdue', 'urgent', 'upcoming'].includes(status.status);
    });

    return (
      <div className="space-y-6">
        {/* Acciones rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setShowAddVaccine(true)}
            className="bg-[#56CCF2] text-white p-4 rounded-lg hover:bg-[#5B9BD5] transition-colors text-center"
          >
            <div className="text-2xl mb-2">➕</div>
            <div className="text-sm font-medium">Nueva Vacuna</div>
          </button>
          
          <button
            onClick={() => setShowScheduleModal(true)}
            className="bg-green-50 border border-green-200 rounded-lg p-4 hover:bg-green-100 transition-colors text-center"
          >
            <div className="text-2xl mb-2">📅</div>
            <div className="text-sm font-medium text-green-700">Calendario Auto</div>
          </button>
          
          <button
            onClick={() => {
              setFormData({
                ...formData,
                vaccine_name: 'Desparasitación',
                vaccine_type: 'deworming'
              });
              setShowAddVaccine(true);
            }}
            className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 hover:bg-yellow-100 transition-colors text-center"
          >
            <div className="text-2xl mb-2">🪱</div>
            <div className="text-sm font-medium text-yellow-700">Desparasitar</div>
          </button>
          
          <button
            onClick={() => {
              setFormData({
                ...formData,
                vaccine_name: 'Pulgas/Garrapatas',
                vaccine_type: 'flea_tick'
              });
              setShowAddVaccine(true);
            }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 hover:bg-red-100 transition-colors text-center"
          >
            <div className="text-2xl mb-2">🦟</div>
            <div className="text-sm font-medium text-red-700">Anti-pulgas</div>
          </button>
        </div>

        {/* Vacunas próximas */}
        {upcomingVaccines.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">🚨 Vacunas Próximas</h3>
            
            {upcomingVaccines.map(vaccine => {
              const status = getVaccineStatus(vaccine);
              const vaccineType = vaccineTypes[vaccine.vaccine_type] || vaccineTypes.vaccine;
              
              return (
                <div key={vaccine.id} className={`border rounded-lg p-4 ${status.bgColor} border-gray-200`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{vaccineType.icon}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900">{vaccine.vaccine_name}</h4>
                        <p className="text-sm text-gray-600">
                          {vaccineType.label} • Vence: {new Date(vaccine.next_due_date).toLocaleDateString()}
                        </p>
                        {vaccine.veterinarian_name && (
                          <p className="text-xs text-gray-500">Dr. {vaccine.veterinarian_name}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${status.color} ${status.bgColor}`}>
                        {status.days === 0 ? 'HOY' : 
                         status.days === 1 ? 'MAÑANA' : 
                         status.status === 'overdue' ? `${status.days} días tarde` :
                         `${status.days} días`}
                      </span>
                      <div className="mt-2 space-x-2">
                        <button
                          onClick={() => handleEdit(vaccine)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          ✏️ Editar
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {vaccine.notes && (
                    <div className="mt-3 p-2 bg-white bg-opacity-50 rounded">
                      <p className="text-sm text-gray-700">📝 {vaccine.notes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">¡{selectedDog?.name} está al día!</h3>
            <p className="text-gray-600 mb-6">No hay vacunas próximas por aplicar</p>
            <button
              onClick={() => setShowAddVaccine(true)}
              className="bg-[#56CCF2] text-white px-6 py-3 rounded-lg hover:bg-[#5B9BD5] transition-colors"
            >
              ➕ Agregar Nueva Vacuna
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderHistoryView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">📋 Historial de Vacunas</h3>
        <button
          onClick={() => setShowAddVaccine(true)}
          className="bg-[#56CCF2] text-white px-4 py-2 rounded-lg hover:bg-[#5B9BD5] transition-colors"
        >
          ➕ Agregar Vacuna
        </button>
      </div>

      {vaccines.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vacuna
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aplicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Próxima
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vaccines.map((vaccine) => {
                  const status = getVaccineStatus(vaccine);
                  const vaccineType = vaccineTypes[vaccine.vaccine_type] || vaccineTypes.vaccine;
                  
                  return (
                    <tr key={vaccine.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-xl mr-3">{vaccineType.icon}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{vaccine.vaccine_name}</div>
                            <div className="text-sm text-gray-500">{vaccineType.label}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {vaccine.last_application_date 
                            ? new Date(vaccine.last_application_date).toLocaleDateString()
                            : 'No registrada'
                          }
                        </div>
                        {vaccine.veterinarian_name && (
                          <div className="text-sm text-gray-500">Dr. {vaccine.veterinarian_name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(vaccine.next_due_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color} ${status.bgColor}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button 
                          onClick={() => handleEdit(vaccine)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          ✏️ Editar
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(vaccine)}
                          className="text-red-600 hover:text-red-900"
                        >
                          🗑️ Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💉</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No hay vacunas registradas</h3>
          <p className="text-gray-600 mb-6">Comienza registrando las vacunas de {selectedDog?.name}</p>
          <button
            onClick={() => setShowAddVaccine(true)}
            className="bg-[#56CCF2] text-white px-6 py-3 rounded-lg hover:bg-[#5B9BD5] transition-colors"
          >
            ➕ Primera Vacuna
          </button>
        </div>
      )}
    </div>
  );

  const renderForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {editingVaccine ? '✏️ Editar Vacuna' : '💉 Nueva Vacuna'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre de la vacuna */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la vacuna *
            </label>
            <input
              type="text"
              value={formData.vaccine_name}
              onChange={(e) => setFormData({ ...formData, vaccine_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              placeholder="Ej: DHPP, Rabia, Desparasitación..."
              required
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              value={formData.vaccine_type}
              onChange={(e) => setFormData({ ...formData, vaccine_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
            >
              {Object.entries(vaccineTypes).map(([key, type]) => (
                <option key={key} value={key}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha de aplicación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de aplicación
            </label>
            <input
              type="date"
              value={formData.last_application_date}
              onChange={(e) => setFormData({ ...formData, last_application_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
            />
          </div>

          {/* Próxima fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Próxima fecha *
            </label>
            <input
              type="date"
              value={formData.next_due_date}
              onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              required
            />
          </div>

          {/* Veterinario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Veterinario
            </label>
            <input
              type="text"
              value={formData.veterinarian_name}
              onChange={(e) => setFormData({ ...formData, veterinarian_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              placeholder="Nombre del veterinario"
            />
          </div>

          {/* Clínica */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clínica
            </label>
            <input
              type="text"
              value={formData.clinic_name}
              onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              placeholder="Nombre de la clínica"
            />
          </div>

          {/* Lote */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lote de vacuna
            </label>
            <input
              type="text"
              value={formData.vaccine_lot}
              onChange={(e) => setFormData({ ...formData, vaccine_lot: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              placeholder="Número de lote"
            />
          </div>

          {/* Costo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Costo
            </label>
            <input
              type="number"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              placeholder="0.00"
              step="0.01"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              rows={3}
              placeholder="Reacciones, observaciones, etc..."
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowAddVaccine(false);
                setEditingVaccine(null);
                resetForm();
              }}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#56CCF2] text-white py-2 px-4 rounded-lg hover:bg-[#5B9BD5] transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : editingVaccine ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Modal de calendario automático
  const renderScheduleModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">📅 Generar Calendario Automático</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => handleGenerateSchedule('puppy')}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left hover:bg-blue-100 transition-colors"
            >
              <div className="text-lg font-semibold text-blue-900">🐶 Calendario de Cachorro</div>
              <div className="text-sm text-blue-700 mt-1">
                DHPP serie, Rabia, Bordetella (6-16 semanas)
              </div>
            </button>
            
            <button
              onClick={() => handleGenerateSchedule('adult')}
              className="bg-green-50 border border-green-200 rounded-lg p-4 text-left hover:bg-green-100 transition-colors"
            >
              <div className="text-lg font-semibold text-green-900">🐕 Calendario Adulto</div>
              <div className="text-sm text-green-700 mt-1">
                Refuerzos anuales y semestrales
              </div>
            </button>
            
            <button
              onClick={() => handleGenerateSchedule('preventive')}
              className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left hover:bg-yellow-100 transition-colors"
            >
              <div className="text-lg font-semibold text-yellow-900">🛡️ Tratamientos Preventivos</div>
              <div className="text-sm text-yellow-700 mt-1">
                Desparasitación, pulgas, heartworm
              </div>
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-6">
          <button
            onClick={() => setShowScheduleModal(false)}
            className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );

  // ===============================================
  // 🎨 RENDERIZADO PRINCIPAL
  // ===============================================
  if (!currentUser) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-gray-600">Error: Usuario no autenticado</p>
      </div>
    );
  }

  if (dogs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🐕</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No hay perros registrados</h3>
        <p className="text-gray-600 mb-6">Agrega un perro para gestionar sus vacunas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderDogSelector()}
      {renderTabs()}
      
      {activeTab === 'calendar' && renderCalendarView()}
      {activeTab === 'history' && renderHistoryView()}

      {/* Modales */}
      {showAddVaccine && renderForm()}
      {showScheduleModal && renderScheduleModal()}
      
      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-red-600">🗑️ Eliminar Vacuna</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres eliminar la vacuna "{showDeleteConfirm.vaccine_name}"?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={loading}
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VaccineManager;