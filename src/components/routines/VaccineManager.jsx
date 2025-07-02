// src/components/routines/VaccineManager.jsx
// 💉 GESTOR COMPLETO DE VACUNAS - ESQUEMA COLOMBIA
// Club Canino Dos Huellitas

import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase.js';

const VaccineManager = ({ dogs = [], currentUser, onVaccineUpdated }) => {
  // ===============================================
  // 🎯 ESTADOS PRINCIPALES
  // ===============================================
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
    custom_vaccine_name: '',
    vaccine_type: 'vaccine',
    last_application_date: '',
    next_due_date: '',
    veterinarian_name: '',
    clinic_name: '',
    vaccine_lot: '',
    cost: '',
    notes: '',
    administered: false
  });

  const selectedDog = dogs.find(dog => dog.id === selectedDogId);

  // ===============================================
  // 💉 VACUNAS PREDETERMINADAS COLOMBIA
  // ===============================================
  const colombianVaccines = {
    obligatorias: {
      label: '🏛️ OBLIGATORIAS POR LEY',
      options: [
        {
          value: 'Vacuna Antirrábica',
          label: 'Vacuna Antirrábica',
          type: 'vaccine',
          frequency: 'Anual',
          description: 'Obligatoria por ley - Gratuita en Secretaría de Salud'
        }
      ]
    },
    esenciales: {
      label: '⭐ ESENCIALES (Altamente recomendadas)',
      options: [
        {
          value: 'Vacuna Bivalente (Moquillo + Parvovirus)',
          label: 'Vacuna Bivalente (Moquillo + Parvovirus)',
          type: 'vaccine',
          frequency: 'A los 45 días',
          description: 'Primera vacuna esencial para cachorros'
        },
        {
          value: 'Vacuna Pentavalente',
          label: 'Vacuna Pentavalente (DHPP + Leptospira)',
          type: 'vaccine',
          frequency: '60-65 días, luego anual',
          description: 'Moquillo, Hepatitis, Parvovirus, Leptospira, Parainfluenza'
        },
        {
          value: 'Pentavalente + Coronavirus Canino',
          label: 'Pentavalente + Coronavirus Canino',
          type: 'vaccine',
          frequency: 'A los 75 días',
          description: 'Completar esquema cachorros'
        },
        {
          value: 'Revacunación Pentavalente',
          label: 'Revacunación Pentavalente',
          type: 'vaccine',
          frequency: 'A los 90 días',
          description: 'Refuerzo final para cachorros'
        },
        {
          value: 'DHPP Refuerzo Anual',
          label: 'DHPP Refuerzo Anual',
          type: 'vaccine',
          frequency: 'Anual',
          description: 'Refuerzo anual obligatorio para adultos'
        },
        {
          value: 'Rabia Refuerzo Anual',
          label: 'Rabia Refuerzo Anual',
          type: 'vaccine',
          frequency: 'Anual',
          description: 'Refuerzo anual obligatorio'
        }
      ]
    },
    opcionales: {
      label: '📋 OPCIONALES (Según estilo de vida)',
      options: [
        {
          value: 'Tos de las Perreras (Bordetella)',
          label: 'Tos de las Perreras (Bordetella)',
          type: 'vaccine',
          frequency: 'Cada 6 meses',
          description: 'Especialmente si va a guardería canina'
        },
        {
          value: 'Leptospirosis',
          label: 'Leptospirosis',
          type: 'vaccine',
          frequency: 'Anual',
          description: 'Según zona geográfica de riesgo'
        },
        {
          value: 'Coronavirus Canino',
          label: 'Coronavirus Canino',
          type: 'vaccine',
          frequency: 'Según veterinario',
          description: 'Protección adicional'
        }
      ]
    },
    tratamientos: {
      label: '🪱 TRATAMIENTOS PREVENTIVOS',
      options: [
        {
          value: 'Desparasitante Interno',
          label: 'Desparasitante Interno',
          type: 'deworming',
          frequency: 'Cada 3 meses',
          description: 'Prevención de parásitos internos'
        },
        {
          value: 'Antipulgas Mensual',
          label: 'Antipulgas Mensual',
          type: 'flea_tick',
          frequency: 'Mensual',
          description: 'Tratamiento mensual antipulgas'
        },
        {
          value: 'Antigarrapatas',
          label: 'Antigarrapatas',
          type: 'flea_tick',
          frequency: 'Cada 3 meses',
          description: 'Prevención de garrapatas'
        },
        {
          value: 'Heartworm Prevention',
          label: 'Heartworm Prevention',
          type: 'heartworm',
          frequency: 'Mensual',
          description: 'Prevención gusano del corazón'
        }
      ]
    }
  };

  // ===============================================
  // 📅 ESQUEMAS DE VACUNACIÓN COLOMBIA (ACTUALIZADOS)
  // ===============================================
  const vaccineSchedules = {
    puppy: [
      { 
        name: 'Vacuna Bivalente (Moquillo + Parvovirus)', 
        days: 45, 
        critical: true, 
        description: 'Primera vacuna esencial - A los 45 días de edad',
        type: 'vaccine'
      },
      { 
        name: 'Vacuna Pentavalente', 
        days: 65, 
        critical: true, 
        description: 'Moquillo, Hepatitis, Parvovirus, Leptospira, Parainfluenza - 60-65 días',
        type: 'vaccine'
      },
      { 
        name: 'Pentavalente + Coronavirus Canino', 
        days: 75, 
        critical: true, 
        description: 'Completar esquema con Coronavirus - A los 75 días',
        type: 'vaccine'
      },
      { 
        name: 'Revacunación Pentavalente', 
        days: 90, 
        critical: true, 
        description: 'Refuerzo final cachorros - A los 90 días',
        type: 'vaccine'
      },
      { 
        name: 'Vacuna Antirrábica', 
        days: 105, 
        critical: true, 
        description: 'Obligatoria por ley - Debe ser la última (3-4 meses)',
        type: 'vaccine'
      },
      { 
        name: 'Tos de las Perreras (Bordetella)', 
        days: 120, 
        critical: false, 
        description: 'Opcional - 72h antes de contacto con otros perros',
        type: 'vaccine'
      }
    ],
    adult: [
      { 
        name: 'DHPP Refuerzo Anual', 
        months: 12, 
        critical: true, 
        description: 'Refuerzo anual obligatorio de DHPP',
        type: 'vaccine'
      },
      { 
        name: 'Rabia Refuerzo Anual', 
        months: 12, 
        critical: true, 
        description: 'Refuerzo anual obligatorio por ley',
        type: 'vaccine'
      },
      { 
        name: 'Tos de las Perreras (Bordetella)', 
        months: 6, 
        critical: false, 
        description: 'Cada 6 meses si va a guardería canina',
        type: 'vaccine'
      },
      { 
        name: 'Leptospirosis', 
        months: 12, 
        critical: false, 
        description: 'Refuerzo anual según zona geográfica',
        type: 'vaccine'
      }
    ],
    preventive: [
      { 
        name: 'Desparasitante Interno', 
        months: 3, 
        critical: true, 
        description: 'Desparasitación interna cada 3 meses',
        type: 'deworming'
      },
      { 
        name: 'Antipulgas Mensual', 
        months: 1, 
        critical: true, 
        description: 'Tratamiento antipulgas mensual',
        type: 'flea_tick'
      },
      { 
        name: 'Antigarrapatas', 
        months: 3, 
        critical: true, 
        description: 'Tratamiento antigarrapatas cada 3 meses',
        type: 'flea_tick'
      },
      { 
        name: 'Heartworm Prevention', 
        months: 1, 
        critical: true, 
        description: 'Prevención de gusano del corazón mensual',
        type: 'heartworm'
      }
    ]
  };

  // Tipos de vacunas
  const vaccineTypes = {
    'vaccine': { label: 'Vacuna', icon: '💉', color: 'bg-blue-50 text-blue-700' },
    'deworming': { label: 'Desparasitación', icon: '🪱', color: 'bg-green-50 text-green-700' },
    'flea_tick': { label: 'Pulgas/Garrapatas', icon: '🦟', color: 'bg-red-50 text-red-700' },
    'heartworm': { label: 'Heartworm', icon: '❤️', color: 'bg-purple-50 text-purple-700' }
  };

  // ===============================================
  // 🔄 EFECTOS DE INICIALIZACIÓN
  // ===============================================
  useEffect(() => {
    if (dogs.length > 0 && !selectedDogId) {
      setSelectedDogId(dogs[0].id);
    }
  }, [dogs]);

  useEffect(() => {
    if (selectedDogId) {
      fetchVaccines();
    }
  }, [selectedDogId]);

  // ===============================================
  // 📊 FUNCIONES DE API
  // ===============================================
  const fetchVaccines = async () => {
    if (!selectedDogId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('dog_vaccines')
        .select('*')
        .eq('dog_id', selectedDogId)
        .order('next_due_date', { ascending: true });

      if (error) throw error;

      setVaccines(data || []);
      console.log(`✅ Cargadas ${data?.length || 0} vacunas para el perro`);

    } catch (error) {
      console.error('❌ Error loading vaccines:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      vaccine_name: '',
      custom_vaccine_name: '',
      vaccine_type: 'vaccine',
      last_application_date: '',
      next_due_date: '',
      veterinarian_name: '',
      clinic_name: '',
      vaccine_lot: '',
      cost: '',
      notes: '',
      administered: false
    });
  };

  // ===============================================
  // 🎯 FUNCIONES HELPER
  // ===============================================
  const getVaccineInfo = (vaccineName) => {
    for (const category of Object.values(colombianVaccines)) {
      const vaccine = category.options.find(v => v.value === vaccineName);
      if (vaccine) return vaccine;
    }
    return null;
  };

  const getActualVaccineName = () => {
    return formData.vaccine_name === 'Personalizada' 
      ? formData.custom_vaccine_name 
      : formData.vaccine_name;
  };

  // ===============================================
  // 💉 FUNCIONES DE VACUNAS
  // ===============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const actualVaccineName = getActualVaccineName();
    
    if (!selectedDogId || !actualVaccineName.trim()) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      const vaccineInfo = getVaccineInfo(formData.vaccine_name);
      
      const vaccineData = {
        dog_id: selectedDogId,
        vaccine_name: actualVaccineName.trim(),
        vaccine_type: vaccineInfo?.type || formData.vaccine_type,
        last_application_date: formData.last_application_date || null,
        next_due_date: formData.next_due_date,
        veterinarian_name: formData.veterinarian_name.trim() || null,
        clinic_name: formData.clinic_name.trim() || null,
        vaccine_lot: formData.vaccine_lot.trim() || null,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        notes: formData.notes.trim() || null,
        administered: formData.administered
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

  const handleEdit = (vaccine) => {
    // Encontrar si es una vacuna predeterminada o personalizada
    const predeterminedVaccine = Object.values(colombianVaccines)
      .flatMap(cat => cat.options)
      .find(v => v.value === vaccine.vaccine_name);

    setFormData({
      vaccine_name: predeterminedVaccine ? vaccine.vaccine_name : 'Personalizada',
      custom_vaccine_name: predeterminedVaccine ? '' : vaccine.vaccine_name,
      vaccine_type: vaccine.vaccine_type,
      last_application_date: vaccine.last_application_date || '',
      next_due_date: vaccine.next_due_date,
      veterinarian_name: vaccine.veterinarian_name || '',
      clinic_name: vaccine.clinic_name || '',
      vaccine_lot: vaccine.vaccine_lot || '',
      cost: vaccine.cost ? vaccine.cost.toString() : '',
      notes: vaccine.notes || '',
      administered: vaccine.administered || false
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

    if (vaccine.administered) {
      return { status: 'completed', days: 0, color: 'text-gray-600', bgColor: 'bg-gray-50', label: 'Aplicada' };
    } else if (diffDays < 0) {
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
    if (!selectedDog) {
      console.error('❌ No hay perro seleccionado');
      return [];
    }

    console.log(`🔄 Generando calendario ${ageGroup} para ${selectedDog.name}`);
    
    const today = new Date();
    const scheduleVaccines = vaccineSchedules[ageGroup];
    
    if (!scheduleVaccines) {
      console.error(`❌ Esquema ${ageGroup} no encontrado`);
      return [];
    }
    
    const newVaccines = [];

    scheduleVaccines.forEach((vaccine, index) => {
      let nextDate = new Date(today);
      
      // Calcular fecha según tipo
      if (vaccine.days) {
        nextDate.setDate(today.getDate() + vaccine.days);
      } else if (vaccine.months) {
        nextDate.setMonth(today.getMonth() + vaccine.months);
      } else {
        // Fallback: añadir días por índice
        nextDate.setDate(today.getDate() + ((index + 1) * 7));
      }

      // Construir objeto de vacuna
      const newVaccine = {
        dog_id: selectedDogId,
        vaccine_name: vaccine.name,
        vaccine_type: vaccine.type || 'vaccine',
        next_due_date: nextDate.toISOString().split('T')[0],
        notes: vaccine.description || `Generado automáticamente - ${ageGroup}`,
        cost: 0,
        last_application_date: null,
        veterinarian_name: '',
        clinic_name: '',
        vaccine_lot: '',
        administered: false
      };

      newVaccines.push(newVaccine);
      console.log(`➕ Agregando: ${vaccine.name} para ${nextDate.toDateString()}`);
    });

    console.log(`✅ Generadas ${newVaccines.length} vacunas para ${ageGroup}`);
    return newVaccines;
  };

  const handleGenerateSchedule = async (ageGroup) => {
    if (!selectedDog) {
      alert('❌ Por favor selecciona un perro primero');
      return;
    }

    const confirmMessage = `¿Generar calendario de ${ageGroup} para ${selectedDog.name}?\n\nEsto creará múltiples vacunas programadas según el esquema colombiano.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    
    try {
      const newVaccines = generateSchedule(ageGroup);
      
      if (newVaccines.length === 0) {
        throw new Error('No se generaron vacunas');
      }

      // Insertar en Supabase
      let insertedCount = 0;
      
      for (const vaccine of newVaccines) {
        try {
          const { error } = await supabase
            .from('dog_vaccines')
            .insert(vaccine);

          if (error) throw error;
          insertedCount++;
          
        } catch (insertError) {
          console.error(`❌ Error insertando ${vaccine.vaccine_name}:`, insertError);
          throw insertError;
        }
      }
      
      console.log(`🎉 Calendario generado: ${insertedCount} vacunas`);
      
      setShowScheduleModal(false);
      fetchVaccines();
      
      if (onVaccineUpdated) {
        onVaccineUpdated();
      }
      
      alert(`✅ Calendario generado exitosamente: ${insertedCount} vacunas programadas`);
      
    } catch (error) {
      console.error('❌ Error generando calendario:', error);
      alert('Error al generar el calendario de vacunas');
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // 🎨 RENDERIZADO PRINCIPAL
  // ===============================================
  if (dogs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="text-gray-500 mb-4">
          <span className="text-4xl">🐕</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay perros registrados</h3>
        <p className="text-gray-500">Agrega un perro primero para gestionar sus vacunas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            💉 Gestión de Vacunas
          </h2>
          <button
            onClick={() => setShowAddVaccine(true)}
            className="bg-[#56CCF2] text-white px-4 py-2 rounded-lg hover:bg-[#5B9BD5] transition-colors flex items-center gap-2"
          >
            ➕ Nueva Vacuna
          </button>
        </div>

        {/* Selector de perro */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar perro:
          </label>
          <select
            value={selectedDogId}
            onChange={(e) => setSelectedDogId(e.target.value)}
            className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
          >
            {dogs.map(dog => (
              <option key={dog.id} value={dog.id}>
                🐕 {dog.name} ({dog.breed || 'Sin raza'})
              </option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'calendar', label: 'Calendario', icon: '📅' },
            { id: 'generate', label: 'Generar', icon: '🔄' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-[#56CCF2] shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido de tabs */}
      {activeTab === 'calendar' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            📅 Calendario de Vacunas - {selectedDog?.name}
          </h3>

          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Cargando vacunas...</div>
            </div>
          ) : vaccines.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">
                <span className="text-4xl">💉</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-700 mb-2">No hay vacunas registradas</h4>
              <p className="text-gray-500 mb-4">Agrega vacunas manualmente o genera un calendario automático</p>
              <button
                onClick={() => setActiveTab('generate')}
                className="bg-[#56CCF2] text-white px-4 py-2 rounded-lg hover:bg-[#5B9BD5] transition-colors"
              >
                🔄 Generar calendario
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {vaccines.map(vaccine => {
                const status = getVaccineStatus(vaccine);
                const typeInfo = vaccineTypes[vaccine.vaccine_type] || vaccineTypes.vaccine;

                return (
                  <div
                    key={vaccine.id}
                    className={`border rounded-lg p-4 ${status.bgColor} border-l-4 ${
                      status.status === 'overdue' ? 'border-l-red-500' :
                      status.status === 'urgent' ? 'border-l-orange-500' :
                      status.status === 'upcoming' ? 'border-l-yellow-500' :
                      status.status === 'completed' ? 'border-l-gray-500' :
                      'border-l-green-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className=" grid-cols-1  mb-2">
                          
                          <h4 className="font-semibold text-gray-800">
                            <span className="text-lg m-2">{typeInfo.icon}</span>{vaccine.vaccine_name}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color} ${status.bgColor}`}>
                            {status.label}
                          </span>
                        </div>

                        <div className="space-y-1 text-sm text-gray-600">
                          <p>📅 <strong>Próxima fecha:</strong> {new Date(vaccine.next_due_date).toLocaleDateString('es-CO')}</p>
                          {!vaccine.administered && status.status !== 'completed' && (
                            <p className={status.color}>
                              ⏰ {status.status === 'overdue' 
                                ? `Vencida hace ${status.days} días` 
                                : `Faltan ${status.days} días`}
                            </p>
                          )}
                          {vaccine.last_application_date && (
                            <p>✅ <strong>Última aplicación:</strong> {new Date(vaccine.last_application_date).toLocaleDateString('es-CO')}</p>
                          )}
                          {vaccine.veterinarian_name && (
                            <p>👨‍⚕️ <strong>Veterinario:</strong> {vaccine.veterinarian_name}</p>
                          )}
                          {vaccine.cost && (
                            <p>💰 <strong>Costo:</strong> ${vaccine.cost.toLocaleString('es-CO')}</p>
                          )}
                          {vaccine.notes && (
                            <p>📝 <strong>Notas:</strong> {vaccine.notes}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1  gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(vaccine)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(vaccine)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'generate' && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            🔄 Generar Calendario Automático
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Cachorros */}
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                🐶 Esquema Cachorros
              </h4>
              <p className="text-gray-600 text-sm mb-4">
                Calendario completo para cachorros (45 días - 4 meses)
              </p>
              <ul className="text-sm space-y-1 mb-4">
                <li>• Vacuna Bivalente (45 días)</li>
                <li>• Pentavalente (65 días)</li>
                <li>• Pentavalente + Coronavirus (75 días)</li>
                <li>• Revacunación (90 días)</li>
                <li>• Antirrábica (105 días)</li>
                <li>• Bordetella (opcional)</li>
              </ul>
              <button
                onClick={() => handleGenerateSchedule('puppy')}
                disabled={loading}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Generando...' : '🔄 Generar para Cachorro'}
              </button>
            </div>

            {/* Adultos */}
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                🐕 Esquema Adultos
              </h4>
              <p className="text-gray-600 text-sm mb-4">
                Refuerzos anuales para perros adultos
              </p>
              <ul className="text-sm space-y-1 mb-4">
                <li>• DHPP Refuerzo Anual</li>
                <li>• Rabia Refuerzo Anual</li>
                <li>• Bordetella (cada 6 meses)</li>
                <li>• Leptospirosis (anual)</li>
              </ul>
              <button
                onClick={() => handleGenerateSchedule('adult')}
                disabled={loading}
                className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Generando...' : '🔄 Generar para Adulto'}
              </button>
            </div>

            {/* Preventivos */}
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                🪱 Tratamientos Preventivos
              </h4>
              <p className="text-gray-600 text-sm mb-4">
                Desparasitación y tratamientos regulares
              </p>
              <ul className="text-sm space-y-1 mb-4">
                <li>• Desparasitante (cada 3 meses)</li>
                <li>• Antipulgas (mensual)</li>
                <li>• Antigarrapatas (cada 3 meses)</li>
                <li>• Heartworm (mensual)</li>
              </ul>
              <button
                onClick={() => handleGenerateSchedule('preventive')}
                disabled={loading}
                className="w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Generando...' : '🔄 Generar Preventivos'}
              </button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h5 className="font-semibold text-blue-800 mb-2">📋 Información importante:</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Las fechas se calculan automáticamente desde hoy</li>
              <li>• Puedes editar cualquier vacuna después de generarla</li>
              <li>• Los esquemas siguen las recomendaciones oficiales de Colombia</li>
              <li>• La vacuna antirrábica es obligatoria por ley</li>
            </ul>
          </div>
        </div>
      )}

      {/* Modal de nueva vacuna */}
      {showAddVaccine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">
                {editingVaccine ? '✏️ Editar Vacuna' : '➕ Nueva Vacuna'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Selector de vacuna */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vacuna / Tratamiento *
                  </label>
                  <select
                    value={formData.vaccine_name}
                    onChange={(e) => {
                      const selectedVaccine = e.target.value;
                      const vaccineInfo = getVaccineInfo(selectedVaccine);
                      
                      setFormData({ 
                        ...formData, 
                        vaccine_name: selectedVaccine,
                        vaccine_type: vaccineInfo?.type || formData.vaccine_type,
                        custom_vaccine_name: selectedVaccine === 'Personalizada' ? formData.custom_vaccine_name : ''
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                    required
                  >
                    <option value="">Seleccionar vacuna...</option>
                    
                    {Object.entries(colombianVaccines).map(([categoryKey, category]) => (
                      <optgroup key={categoryKey} label={category.label}>
                        {category.options.map(vaccine => (
                          <option key={vaccine.value} value={vaccine.value}>
                            {vaccine.label} ({vaccine.frequency})
                          </option>
                        ))}
                      </optgroup>
                    ))}
                    
                    <option value="Personalizada">🔧 Personalizada (escribir nombre)</option>
                  </select>
                  
                  {/* Mostrar información de la vacuna seleccionada */}
                  {formData.vaccine_name && formData.vaccine_name !== 'Personalizada' && (() => {
                    const info = getVaccineInfo(formData.vaccine_name);
                    return info ? (
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-700">
                          <strong>📋 Info:</strong> {info.description}
                        </p>
                        <p className="text-sm text-blue-600">
                          <strong>⏰ Frecuencia:</strong> {info.frequency}
                        </p>
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Campo personalizado */}
                {formData.vaccine_name === 'Personalizada' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre personalizado *
                    </label>
                    <input
                      type="text"
                      value={formData.custom_vaccine_name}
                      onChange={(e) => setFormData({ ...formData, custom_vaccine_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                      placeholder="Ej: Vacuna especial, tratamiento específico..."
                      required
                    />
                  </div>
                )}

                {/* Tipo de vacuna (solo si es personalizada) */}
                {formData.vaccine_name === 'Personalizada' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo *
                    </label>
                    <select
                      value={formData.vaccine_type}
                      onChange={(e) => setFormData({ ...formData, vaccine_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                      required
                    >
                      <option value="vaccine">💉 Vacuna</option>
                      <option value="deworming">🪱 Desparasitación</option>
                      <option value="flea_tick">🦟 Pulgas/Garrapatas</option>
                      <option value="heartworm">❤️ Heartworm</option>
                    </select>
                  </div>
                )}

                {/* Próxima fecha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Próxima fecha de aplicación *
                  </label>
                  <input
                    type="date"
                    value={formData.next_due_date}
                    onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                    required
                  />
                </div>

                {/* Última aplicación */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Última aplicación (opcional)
                  </label>
                  <input
                    type="date"
                    value={formData.last_application_date}
                    onChange={(e) => setFormData({ ...formData, last_application_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
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
                    placeholder="Observaciones, reacciones, etc..."
                  />
                </div>

                {/* Checkbox aplicada */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="administered"
                    checked={formData.administered}
                    onChange={(e) => setFormData({ ...formData, administered: e.target.checked })}
                    className="h-4 w-4 text-[#56CCF2] focus:ring-[#56CCF2] border-gray-300 rounded"
                  />
                  <label htmlFor="administered" className="ml-2 block text-sm text-gray-700">
                    Ya fue aplicada
                  </label>
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
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">🗑️ Confirmar eliminación</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres eliminar la vacuna "{showDeleteConfirm.vaccine_name}"?
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