// src/components/routines/MedicineManager.jsx
// 💊 GESTOR DE MEDICINAS MEJORADO - BORRADO DE ANTIPULGAS MÁS FÁCIL
// Club Canino Dos Huellitas

import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase.js';

const MedicineManager = ({ 
  dogs = [], 
  currentUser, 
  onMedicineUpdated 
}) => {
  // ===============================================
  // 🎯 ESTADOS PRINCIPALES
  // ===============================================
  const [medicines, setMedicines] = useState([]);
  const [selectedDogId, setSelectedDogId] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  
  // Estados para modales
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showDoseModal, setShowDoseModal] = useState(null);
  const [editingMedicine, setEditingMedicine] = useState(null);

  // ✨ NUEVO: Estados para filtros mejorados
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    search: ''
  });

  // Estados para formulario
  const [formData, setFormData] = useState({
    medicine_name: '',
    medicine_type: 'oral',
    dosage: '',
    frequency: 'Una vez al día',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    next_dose_date: '',
    prescribed_by: '',
    reason_for_treatment: '',
    special_instructions: '',
    side_effects_notes: '',
    is_ongoing: false,
    requires_monitoring: false,
    administered_by: 'owner'
  });

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
      fetchMedicines();
    }
  }, [selectedDogId]);

  // ===============================================
  // 📊 DATOS Y CÁLCULOS
  // ===============================================
  const selectedDog = dogs.find(dog => dog.id === selectedDogId);

  // ✨ NUEVO: Filtrar medicinas con búsqueda mejorada
  const filteredMedicines = medicines.filter(medicine => {
    const matchesType = !filters.type || medicine.medicine_type === filters.type;
    const matchesSearch = !filters.search || 
      medicine.medicine_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      medicine.reason_for_treatment?.toLowerCase().includes(filters.search.toLowerCase());
    
    let matchesStatus = true;
    if (filters.status) {
      const status = getMedicineStatus(medicine);
      matchesStatus = status.status === filters.status;
    }
    
    return matchesType && matchesSearch && matchesStatus;
  });

  const activeMedicines = filteredMedicines.filter(m => m.is_ongoing || 
    (m.next_dose_date && new Date(m.next_dose_date) >= new Date()));
  
  const allMedicines = filteredMedicines;

  // ===============================================
  // 🔌 FUNCIONES DE API
  // ===============================================
  const fetchMedicines = async () => {
    if (!selectedDogId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .eq('dog_id', selectedDogId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMedicines(data || []);
      console.log(`✅ Cargadas ${data?.length || 0} medicinas para el perro`);

    } catch (error) {
      console.error('❌ Error loading medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // 💊 FUNCIONES DE MEDICINAS
  // ===============================================
  const resetForm = () => {
    setFormData({
      medicine_name: '',
      medicine_type: 'oral',
      dosage: '',
      frequency: 'Una vez al día',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      next_dose_date: '',
      prescribed_by: '',
      reason_for_treatment: '',
      special_instructions: '',
      side_effects_notes: '',
      is_ongoing: false,
      requires_monitoring: false,
      administered_by: 'owner'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDogId || !formData.medicine_name.trim()) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      const medicineData = {
        dog_id: selectedDogId,
        medicine_name: formData.medicine_name.trim(),
        medicine_type: formData.medicine_type,
        dosage: formData.dosage.trim(),
        frequency: formData.frequency,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        next_dose_date: formData.next_dose_date || null,
        prescribed_by: formData.prescribed_by.trim() || null,
        reason_for_treatment: formData.reason_for_treatment.trim() || null,
        special_instructions: formData.special_instructions.trim() || null,
        side_effects_notes: formData.side_effects_notes.trim() || null,
        is_ongoing: formData.is_ongoing,
        requires_monitoring: formData.requires_monitoring,
        administered_by: formData.administered_by
      };

      if (editingMedicine) {
        // Actualizar medicina existente
        const { error } = await supabase
          .from('medicines')
          .update(medicineData)
          .eq('id', editingMedicine.id);

        if (error) throw error;
        console.log('✅ Medicina actualizada exitosamente');
      } else {
        // Crear nueva medicina
        const { error } = await supabase
          .from('medicines')
          .insert(medicineData);

        if (error) throw error;
        console.log('✅ Medicina creada exitosamente');
      }
      
      setShowAddMedicine(false);
      setEditingMedicine(null);
      resetForm();
      fetchMedicines();
      
      if (onMedicineUpdated) {
        onMedicineUpdated();
      }
      
    } catch (error) {
      console.error('❌ Error saving medicine:', error);
      alert('Error al guardar la medicina');
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // 🗑️ ELIMINAR MEDICINA (MEJORADO)
  // ===============================================
  const handleDelete = async (medicine) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('medicines')
        .delete()
        .eq('id', medicine.id);

      if (error) throw error;

      setShowDeleteConfirm(null);
      fetchMedicines();
      
      if (onMedicineUpdated) {
        onMedicineUpdated();
      }
      
      console.log('✅ Medicina eliminada exitosamente');
      
    } catch (error) {
      console.error('❌ Error deleting medicine:', error);
      alert('Error al eliminar la medicina');
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // ✏️ EDITAR MEDICINA
  // ===============================================
  const handleEdit = (medicine) => {
    setFormData({
      medicine_name: medicine.medicine_name,
      medicine_type: medicine.medicine_type,
      dosage: medicine.dosage,
      frequency: medicine.frequency,
      start_date: medicine.start_date,
      end_date: medicine.end_date || '',
      next_dose_date: medicine.next_dose_date || '',
      prescribed_by: medicine.prescribed_by || '',
      reason_for_treatment: medicine.reason_for_treatment || '',
      special_instructions: medicine.special_instructions || '',
      side_effects_notes: medicine.side_effects_notes || '',
      is_ongoing: medicine.is_ongoing,
      requires_monitoring: medicine.requires_monitoring,
      administered_by: medicine.administered_by
    });
    setEditingMedicine(medicine);
    setShowAddMedicine(true);
  };

  // ===============================================
  // 💊 REGISTRAR DOSIS
  // ===============================================
  const handleDoseGiven = async (medicine) => {
    setLoading(true);
    try {
      // Calcular próxima dosis
      let nextDoseDate = null;
      if (medicine.frequency && medicine.is_ongoing) {
        const now = new Date();
        const hoursToAdd = getHoursFromFrequency(medicine.frequency);
        if (hoursToAdd > 0) {
          nextDoseDate = new Date(now.getTime() + (hoursToAdd * 60 * 60 * 1000));
        }
      }

      // Actualizar medicina con próxima dosis
      const { error } = await supabase
        .from('medicines')
        .update({
          next_dose_date: nextDoseDate ? nextDoseDate.toISOString() : null
        })
        .eq('id', medicine.id);

      if (error) throw error;

      setShowDoseModal(null);
      fetchMedicines();
      
      console.log('✅ Dosis registrada exitosamente');
      
    } catch (error) {
      console.error('❌ Error registering dose:', error);
      alert('Error al registrar la dosis');
    } finally {
      setLoading(false);
    }
  };

  // Función auxiliar para convertir frecuencia a horas
  const getHoursFromFrequency = (frequency) => {
    const frequencyMap = {
      'Una vez al día': 24,
      'Dos veces al día': 12,
      'Tres veces al día': 8,
      'Cada 8 horas': 8,
      'Cada 12 horas': 12,
      'Cada 24 horas': 24,
      'Cada 2 días': 48,
      'Una vez por semana': 168
    };
    return frequencyMap[frequency] || 0;
  };

  // ===============================================
  // 📅 CALCULAR ESTADO DE MEDICINA
  // ===============================================
  const getMedicineStatus = (medicine) => {
    const now = new Date();
    const startDate = new Date(medicine.start_date);
    const endDate = medicine.end_date ? new Date(medicine.end_date) : null;
    const nextDose = medicine.next_dose_date ? new Date(medicine.next_dose_date) : null;

    // Si tiene fecha de fin y ya pasó
    if (endDate && endDate < now) {
      return {
        status: 'completed',
        label: 'Completado',
        textColor: 'text-gray-600',
        bgColor: 'bg-gray-100',
        borderColor: 'border-l-gray-400'
      };
    }

    // Si es ongoing
    if (medicine.is_ongoing) {
      if (nextDose) {
        const diffHours = (nextDose - now) / (1000 * 60 * 60);
        
        if (diffHours < 0) {
          return {
            status: 'overdue',
            label: 'Atrasado',
            textColor: 'text-red-600',
            bgColor: 'bg-red-50',
            borderColor: 'border-l-red-500',
            hours: Math.abs(Math.round(diffHours))
          };
        } else if (diffHours <= 2) {
          return {
            status: 'urgent',
            label: 'Próximo',
            textColor: 'text-orange-600',
            bgColor: 'bg-orange-50',
            borderColor: 'border-l-orange-500',
            hours: Math.round(diffHours)
          };
        } else {
          return {
            status: 'active',
            label: 'Activo',
            textColor: 'text-green-600',
            bgColor: 'bg-green-50',
            borderColor: 'border-l-green-500'
          };
        }
      } else {
        return {
          status: 'active',
          label: 'Activo',
          textColor: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-l-green-500'
        };
      }
    }

    return {
      status: 'inactive',
      label: 'Inactivo',
      textColor: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-l-gray-400'
    };
  };

  // ===============================================
  // 🎨 COMPONENTES DE RENDERIZADO
  // ===============================================
  
  // ✨ NUEVO: Filtros mejorados
  const renderFilters = () => (
    <div className="mb-6 bg-white rounded-lg p-4 shadow-sm border">
      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
        🔍 <span className="ml-2">Filtros de búsqueda</span>
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Filtro por tipo de medicina */}
        <select
          value={filters.type}
          onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
        >
          <option value="">Todos los tipos</option>
          <option value="oral">💊 Oral</option>
          <option value="topical">🧴 Tópico</option>
          <option value="injection">💉 Inyección</option>
          <option value="flea_tick">🐛 Antipulgas/Garrapatas</option>
          <option value="deworming">🪱 Desparasitante</option>
          <option value="supplement">🌿 Suplemento</option>
          <option value="other">🔧 Otro</option>
        </select>
        
        {/* Filtro por estado */}
        <select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
        >
          <option value="">Todos los estados</option>
          <option value="active">🟢 Activo</option>
          <option value="urgent">🟡 Próximo</option>
          <option value="overdue">🔴 Atrasado</option>
          <option value="completed">✅ Completado</option>
        </select>
        
        {/* Botón limpiar filtros */}
        <button
          onClick={() => setFilters({ type: '', status: '', search: '' })}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          🧹 Limpiar filtros
        </button>
      </div>
      
      {/* Búsqueda por nombre */}
      <div>
        <input
          type="text"
          placeholder="🔍 Buscar por nombre de medicina o motivo de tratamiento..."
          value={filters.search}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
        />
      </div>
      
      {/* Indicador de resultados */}
      {(filters.type || filters.status || filters.search) && (
        <div className="mt-3 text-sm text-gray-600">
          📊 Mostrando {filteredMedicines.length} de {medicines.length} medicinas
        </div>
      )}
    </div>
  );

  const renderDogSelector = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <div className="text-2xl">💊</div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Medicinas</h2>
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
        onClick={() => setActiveTab('active')}
        className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
          activeTab === 'active'
            ? 'border-[#56CCF2] text-[#56CCF2]'
            : 'border-transparent text-gray-500 hover:text-gray-700'
        }`}
      >
        💊 Activas ({activeMedicines.length})
      </button>
      <button
        onClick={() => setActiveTab('all')}
        className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
          activeTab === 'all'
            ? 'border-[#56CCF2] text-[#56CCF2]'
            : 'border-transparent text-gray-500 hover:text-gray-700'
        }`}
      >
        📋 Todas ({allMedicines.length})
      </button>
    </div>
  );

  // ✨ NUEVO: Tarjeta de medicina con botón eliminar mejorado
  const renderMedicineCard = (medicine) => {
    const status = getMedicineStatus(medicine);
    
    return (
      <div key={medicine.id} className={`bg-white rounded-lg p-4 shadow-sm border-l-4 ${status.borderColor} hover:shadow-md transition-shadow`}>
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">{medicine.medicine_name}</h4>
            <p className="text-sm text-gray-600 capitalize flex items-center">
              {getMedicineTypeIcon(medicine.medicine_type)} {getMedicineTypeLabel(medicine.medicine_type)}
            </p>
          </div>
          
          {/* ✨ BOTONES DE ACCIÓN MEJORADOS */}
          <div className="flex items-center space-x-2">
            
            {/* Botón Editar */}
            <button
              onClick={() => handleEdit(medicine)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Editar medicina"
            >
              ✏️
            </button>
            
            {/* ✨ BOTÓN ELIMINAR MÁS PROMINENTE */}
            <button
              onClick={() => setShowDeleteConfirm(medicine)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 hover:border-red-300 shadow-sm"
              title="Eliminar medicina"
            >
              🗑️
            </button>
            
            {/* Botón Dosis (si es ongoing) */}
            {medicine.is_ongoing && (
              <button
                onClick={() => setShowDoseModal(medicine)}
                className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm hover:bg-green-200 transition-colors"
              >
                💊 Dosis
              </button>
            )}
          </div>
        </div>

        {/* Información de dosis y frecuencia */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Dosis:</span>
            <span className="font-medium">{medicine.dosage}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Frecuencia:</span>
            <span className="font-medium">{medicine.frequency}</span>
          </div>
          
          {medicine.next_dose_date && (
            <div className="flex justify-between">
              <span className="text-gray-600">Próxima dosis:</span>
              <span className={`font-medium ${status.textColor}`}>
                {new Date(medicine.next_dose_date).toLocaleDateString('es-CO', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          )}
          
          {medicine.reason_for_treatment && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
              <strong>Motivo:</strong> {medicine.reason_for_treatment}
            </div>
          )}
          
          {medicine.special_instructions && (
            <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
              <strong>Instrucciones:</strong> {medicine.special_instructions}
            </div>
          )}
        </div>

        {/* Estado de la medicina */}
        <div className={`mt-3 px-3 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.textColor} inline-block`}>
          {status.label}
          {status.hours !== undefined && (
            <span className="ml-1">
              ({status.hours === 0 ? 'Ahora' : `${status.hours}h`})
            </span>
          )}
        </div>
      </div>
    );
  };

  // Funciones auxiliares para iconos y etiquetas
  const getMedicineTypeIcon = (type) => {
    const icons = {
      oral: '💊',
      topical: '🧴',
      injection: '💉',
      flea_tick: '🐛',
      deworming: '🪱',
      supplement: '🌿',
      other: '🔧'
    };
    return icons[type] || '💊';
  };

  const getMedicineTypeLabel = (type) => {
    const labels = {
      oral: 'Oral',
      topical: 'Tópico',
      injection: 'Inyección',
      flea_tick: 'Antipulgas/Garrapatas',
      deworming: 'Desparasitante',
      supplement: 'Suplemento',
      other: 'Otro'
    };
    return labels[type] || 'Oral';
  };

  const renderActiveView = () => (
    <div className="space-y-6">
      {/* Filtros */}
      {renderFilters()}
      
      {/* Resumen rápido */}
      {activeMedicines.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-600 text-sm font-medium">Medicinas Activas</div>
            <div className="text-2xl font-bold text-green-900">{activeMedicines.length}</div>
          </div>
          
          {activeMedicines.filter(m => {
            const status = getMedicineStatus(m);
            return status.status === 'urgent';
          }).length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="text-orange-600 text-sm font-medium">Próximas Dosis</div>
              <div className="text-2xl font-bold text-orange-900">
                {activeMedicines.filter(m => {
                  const status = getMedicineStatus(m);
                  return status.status === 'urgent';
                }).length}
              </div>
              <div className="text-orange-700 text-xs">En las próximas 2 horas</div>
            </div>
          )}
          
          {activeMedicines.filter(m => {
            const status = getMedicineStatus(m);
            return status.status === 'overdue';
          }).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-600 text-sm font-medium">Atrasadas</div>
              <div className="text-2xl font-bold text-red-900">
                {activeMedicines.filter(m => {
                  const status = getMedicineStatus(m);
                  return status.status === 'overdue';
                }).length}
              </div>
              <div className="text-red-700 text-xs">Requieren atención</div>
            </div>
          )}
        </div>
      )}

      {/* Acciones rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => setShowAddMedicine(true)}
          className="bg-[#56CCF2] text-white p-4 rounded-lg hover:bg-[#5B9BD5] transition-colors text-center"
        >
          <div className="text-2xl mb-2">➕</div>
          <div className="text-sm font-medium">Nueva Medicina</div>
        </button>
        
        <button
          onClick={() => {
            setFormData({
              ...formData,
              medicine_type: 'flea_tick',
              frequency: 'Una vez al mes',
              is_ongoing: true,
              reason_for_treatment: 'Prevención de pulgas y garrapatas'
            });
            setShowAddMedicine(true);
          }}
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 hover:bg-yellow-100 transition-colors text-center"
        >
          <div className="text-2xl mb-2">🐛</div>
          <div className="text-sm font-medium text-yellow-700">Antipulgas</div>
        </button>
        
        <button
          onClick={() => {
            setFormData({
              ...formData,
              medicine_type: 'deworming',
              frequency: 'Cada 3 meses',
              is_ongoing: true,
              reason_for_treatment: 'Desparasitación rutinaria'
            });
            setShowAddMedicine(true);
          }}
          className="bg-purple-50 border border-purple-200 rounded-lg p-4 hover:bg-purple-100 transition-colors text-center"
        >
          <div className="text-2xl mb-2">🪱</div>
          <div className="text-sm font-medium text-purple-700">Desparasitante</div>
        </button>
        
        <button
          onClick={() => {
            setFormData({
              ...formData,
              medicine_type: 'supplement',
              frequency: 'Una vez al día',
              is_ongoing: true
            });
            setShowAddMedicine(true);
          }}
          className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 hover:bg-emerald-100 transition-colors text-center"
        >
          <div className="text-2xl mb-2">🌿</div>
          <div className="text-sm font-medium text-emerald-700">Suplemento</div>
        </button>
      </div>

      {/* Lista de medicinas activas */}
      {activeMedicines.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {activeMedicines.map(medicine => renderMedicineCard(medicine))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💊</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No hay medicinas activas</h3>
          <p className="text-gray-600 mb-6">
            {filters.type || filters.search ? 
              'No se encontraron medicinas con los filtros aplicados' :
              'Agrega la primera medicina para tu perro'
            }
          </p>
          <button
            onClick={() => setShowAddMedicine(true)}
            className="bg-[#56CCF2] text-white px-6 py-3 rounded-lg hover:bg-[#5B9BD5] transition-colors"
          >
            ➕ Agregar Medicina
          </button>
        </div>
      )}
    </div>
  );

  const renderAllView = () => (
    <div className="space-y-6">
      {/* Filtros */}
      {renderFilters()}
      
      {allMedicines.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {allMedicines.map(medicine => renderMedicineCard(medicine))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No hay medicinas registradas</h3>
          <p className="text-gray-600 mb-6">
            {filters.type || filters.search ? 
              'No se encontraron medicinas con los filtros aplicados' :
              'Comienza agregando la primera medicina'
            }
          </p>
          <button
            onClick={() => setShowAddMedicine(true)}
            className="bg-[#56CCF2] text-white px-6 py-3 rounded-lg hover:bg-[#5B9BD5] transition-colors"
          >
            ➕ Agregar Primera Medicina
          </button>
        </div>
      )}
    </div>
  );

  // ✨ MODAL DE CONFIRMACIÓN MEJORADO
  const renderDeleteConfirmModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 animate-in">
        <div className="text-center">
          <div className="text-5xl mb-4">🗑️</div>
          <h3 className="text-lg font-semibold mb-2 text-red-600">
            ¿Eliminar medicina?
          </h3>
          <p className="text-gray-600 mb-4">
            ¿Estás seguro de que quieres eliminar <strong>"{showDeleteConfirm.medicine_name}"</strong>?
          </p>
          
          {/* Información adicional */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6 text-sm">
            <p className="text-yellow-800">
              ⚠️ Esta acción no se puede deshacer. Se eliminará toda la información 
              y el historial de esta medicina.
            </p>
            {showDeleteConfirm.medicine_type === 'flea_tick' && (
              <p className="text-yellow-800 mt-2">
                🐛 <strong>Antipulgas:</strong> Recuerda programar la siguiente aplicación si es necesaria.
              </p>
            )}
          </div>
          
          {/* Botones */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteConfirm(null)}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              disabled={loading}
            >
              ❌ Cancelar
            </button>
            <button
              onClick={() => handleDelete(showDeleteConfirm)}
              disabled={loading}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading ? '🔄 Eliminando...' : '🗑️ Eliminar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Modal de formulario (simplificado aquí, usa el existente)
  const renderForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {editingMedicine ? '✏️ Editar Medicina' : '➕ Nueva Medicina'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre de medicina */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la medicina *
            </label>
            <input
              type="text"
              value={formData.medicine_name}
              onChange={(e) => setFormData({ ...formData, medicine_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              placeholder="Ej: Bravecto, Nexgard, etc."
              required
            />
          </div>

          {/* Tipo de medicina */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de medicina *
            </label>
            <select
              value={formData.medicine_type}
              onChange={(e) => setFormData({ ...formData, medicine_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              required
            >
              <option value="oral">💊 Oral (pastillas, líquido)</option>
              <option value="topical">🧴 Tópico (crema, pomada)</option>
              <option value="injection">💉 Inyección</option>
              <option value="flea_tick">🐛 Antipulgas/Garrapatas</option>
              <option value="deworming">🪱 Desparasitante</option>
              <option value="supplement">🌿 Suplemento</option>
              <option value="other">🔧 Otro</option>
            </select>
          </div>

          {/* Dosis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dosis *
            </label>
            <input
              type="text"
              value={formData.dosage}
              onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              placeholder="Ej: 1 pastilla, 5ml, 1 pipeta"
              required
            />
          </div>

          {/* Frecuencia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frecuencia
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
            >
              <option value="Una vez al día">Una vez al día</option>
              <option value="Dos veces al día">Dos veces al día</option>
              <option value="Tres veces al día">Tres veces al día</option>
              <option value="Cada 8 horas">Cada 8 horas</option>
              <option value="Cada 12 horas">Cada 12 horas</option>
              <option value="Cada 24 horas">Cada 24 horas</option>
              <option value="Cada 2 días">Cada 2 días</option>
              <option value="Una vez por semana">Una vez por semana</option>
              <option value="Una vez al mes">Una vez al mes</option>
              <option value="Cada 3 meses">Cada 3 meses</option>
              <option value="Solo una vez">Solo una vez</option>
            </select>
          </div>

          {/* Motivo del tratamiento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo del tratamiento
            </label>
            <input
              type="text"
              value={formData.reason_for_treatment}
              onChange={(e) => setFormData({ ...formData, reason_for_treatment: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              placeholder="Ej: Prevención de pulgas, infección de oído, etc."
            />
          </div>

          {/* Checkbox para medicina continua */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_ongoing"
              checked={formData.is_ongoing}
              onChange={(e) => setFormData({ ...formData, is_ongoing: e.target.checked })}
              className="h-4 w-4 text-[#56CCF2] focus:ring-[#56CCF2] border-gray-300 rounded"
            />
            <label htmlFor="is_ongoing" className="ml-2 block text-sm text-gray-700">
              Es un tratamiento continuo
            </label>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowAddMedicine(false);
                setEditingMedicine(null);
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
              {loading ? 'Guardando...' : editingMedicine ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Modal de dosis (simplificado)
  const renderDoseModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">💊 Registrar Dosis</h3>
        <p className="text-gray-600 mb-6">
          ¿Confirmas que se administró la dosis de <strong>{showDoseModal?.medicine_name}</strong>?
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowDoseModal(null)}
            className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => handleDoseGiven(showDoseModal)}
            disabled={loading}
            className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Registrando...' : '✅ Dosis Administrada'}
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
        <p className="text-gray-600 mb-6">Agrega un perro para gestionar sus medicinas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderDogSelector()}
      {renderTabs()}
      
      {activeTab === 'active' && renderActiveView()}
      {activeTab === 'all' && renderAllView()}

      {/* Modales */}
      {showAddMedicine && renderForm()}
      {showDoseModal && renderDoseModal()}
      {showDeleteConfirm && renderDeleteConfirmModal()}
    </div>
  );
};

export default MedicineManager;