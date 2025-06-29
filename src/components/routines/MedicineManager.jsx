// src/components/routines/MedicineManager.jsx
// 💊 GESTOR COMPLETO DE MEDICINAS - TODAS LAS FUNCIONALIDADES

import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase.js';

const MedicineManager = ({ dogs = [], currentUser, onMedicineUpdated }) => {
  // Estados principales
  const [selectedDogId, setSelectedDogId] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [loading, setLoading] = useState(false);
  const [medicines, setMedicines] = useState([]);
  
  // Estados para modales
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showDoseModal, setShowDoseModal] = useState(null);
  
  // Estados para formulario
  const [formData, setFormData] = useState({
    medicine_name: '',
    medicine_type: 'oral',
    dosage: '',
    frequency: '',
    start_date: '',
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

  const selectedDog = dogs.find(dog => dog.id === selectedDogId);

  // Tipos de medicinas
  const medicineTypes = {
    'oral': { label: 'Oral (pastillas/líquido)', icon: '💊', color: 'bg-blue-50 text-blue-700' },
    'topical': { label: 'Tópico (cremas/pomadas)', icon: '🧴', color: 'bg-green-50 text-green-700' },
    'injection': { label: 'Inyección', icon: '💉', color: 'bg-red-50 text-red-700' },
    'eye_drops': { label: 'Gotas para ojos', icon: '👁️', color: 'bg-purple-50 text-purple-700' },
    'ear_drops': { label: 'Gotas para oídos', icon: '👂', color: 'bg-yellow-50 text-yellow-700' },
    'supplement': { label: 'Suplemento', icon: '🌿', color: 'bg-emerald-50 text-emerald-700' }
  };

  // Frecuencias comunes
  const frequencies = [
    'Una vez al día',
    'Dos veces al día',
    'Tres veces al día',
    'Cada 8 horas',
    'Cada 12 horas',
    'Cada 24 horas',
    'Cada 2 días',
    'Una vez por semana',
    'Según necesidad'
  ];

  // Efectos
  useEffect(() => {
    if (dogs.length > 0 && !selectedDogId) {
      setSelectedDogId(dogs[0].id);
    }
  }, [dogs, selectedDogId]);

  useEffect(() => {
    if (selectedDogId) {
      fetchMedicines();
    }
  }, [selectedDogId]);

  // ===============================================
  // 📊 OBTENER MEDICINAS
  // ===============================================
  const fetchMedicines = async () => {
    if (!selectedDogId) return;
    
    setLoading(true);
    try {
      const { data: medicinesData, error } = await supabase
        .from('medicines')
        .select('*')
        .eq('dog_id', selectedDogId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('⚠️ Table medicines might not exist:', error);
        setMedicines([]);
      } else {
        setMedicines(medicinesData || []);
      }
      
    } catch (error) {
      console.error('❌ Error in fetchMedicines:', error);
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // 📝 MANEJO DEL FORMULARIO
  // ===============================================
  const resetForm = () => {
    setFormData({
      medicine_name: '',
      medicine_type: 'oral',
      dosage: '',
      frequency: '',
      start_date: '',
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
    setLoading(true);

    try {
      const medicineData = {
        dog_id: selectedDogId,
        medicine_name: formData.medicine_name,
        medicine_type: formData.medicine_type,
        dosage: formData.dosage,
        frequency: formData.frequency,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        next_dose_date: formData.next_dose_date || null,
        prescribed_by: formData.prescribed_by || null,
        reason_for_treatment: formData.reason_for_treatment || null,
        special_instructions: formData.special_instructions || null,
        side_effects_notes: formData.side_effects_notes || null,
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
  // 🗑️ ELIMINAR MEDICINA
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
  // 📅 CALCULAR ESTADO DE MEDICINA
  // ===============================================
  const getMedicineStatus = (medicine) => {
    const now = new Date();
    const startDate = new Date(medicine.start_date);
    const endDate = medicine.end_date ? new Date(medicine.end_date) : null;
    const nextDose = medicine.next_dose_date ? new Date(medicine.next_dose_date) : null;

    if (endDate && now > endDate) {
      return { status: 'completed', label: 'Completado', color: 'text-gray-600', bgColor: 'bg-gray-50' };
    }

    if (medicine.is_ongoing) {
      if (nextDose) {
        const diffTime = nextDose - now;
        const diffHours = diffTime / (1000 * 60 * 60);
        
        if (diffHours < 0) {
          return { status: 'overdue', label: 'Dosis atrasada', color: 'text-red-600', bgColor: 'bg-red-50' };
        } else if (diffHours <= 2) {
          return { status: 'due_soon', label: 'Próxima dosis', color: 'text-orange-600', bgColor: 'bg-orange-50' };
        }
      }
      return { status: 'active', label: 'Activo', color: 'text-green-600', bgColor: 'bg-green-50' };
    }

    if (now < startDate) {
      return { status: 'scheduled', label: 'Programado', color: 'text-blue-600', bgColor: 'bg-blue-50' };
    }

    return { status: 'active', label: 'Activo', color: 'text-green-600', bgColor: 'bg-green-50' };
  };

  // ===============================================
  // 🎨 COMPONENTES DE RENDERIZADO
  // ===============================================
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
        💊 Activas
      </button>
      <button
        onClick={() => setActiveTab('all')}
        className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
          activeTab === 'all'
            ? 'border-[#56CCF2] text-[#56CCF2]'
            : 'border-transparent text-gray-500 hover:text-gray-700'
        }`}
      >
        📋 Todas
      </button>
    </div>
  );

  const renderActiveView = () => {
    const activeMedicines = medicines.filter(medicine => {
      const status = getMedicineStatus(medicine);
      return ['active', 'overdue', 'due_soon'].includes(status.status);
    });

    const overdueCount = activeMedicines.filter(m => getMedicineStatus(m).status === 'overdue').length;
    const dueSoonCount = activeMedicines.filter(m => getMedicineStatus(m).status === 'due_soon').length;

    return (
      <div className="space-y-6">
        {/* Alertas de dosis */}
        {(overdueCount > 0 || dueSoonCount > 0) && (
          <div className="space-y-3">
            {overdueCount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-red-600 text-xl mr-3">🚨</span>
                  <div>
                    <h3 className="font-semibold text-red-900">
                      {overdueCount} dosis atrasada{overdueCount > 1 ? 's' : ''}
                    </h3>
                    <p className="text-red-700 text-sm">Administrar lo antes posible</p>
                  </div>
                </div>
              </div>
            )}
            
            {dueSoonCount > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-orange-600 text-xl mr-3">⏰</span>
                  <div>
                    <h3 className="font-semibold text-orange-900">
                      {dueSoonCount} dosis próxima{dueSoonCount > 1 ? 's' : ''}
                    </h3>
                    <p className="text-orange-700 text-sm">En las próximas 2 horas</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Acciones rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                medicine_type: 'oral',
                frequency: 'Dos veces al día',
                is_ongoing: true
              });
              setShowAddMedicine(true);
            }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors text-center"
          >
            <div className="text-2xl mb-2">💊</div>
            <div className="text-sm font-medium text-blue-700">Pastilla Oral</div>
          </button>
          
          <button
            onClick={() => {
              setFormData({
                ...formData,
                medicine_type: 'topical',
                frequency: 'Dos veces al día'
              });
              setShowAddMedicine(true);
            }}
            className="bg-green-50 border border-green-200 rounded-lg p-4 hover:bg-green-100 transition-colors text-center"
          >
            <div className="text-2xl mb-2">🧴</div>
            <div className="text-sm font-medium text-green-700">Crema/Pomada</div>
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

        {/* Medicinas activas */}
        {activeMedicines.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">💊 Medicinas Activas</h3>
            
            {activeMedicines.map(medicine => {
              const status = getMedicineStatus(medicine);
              const medicineType = medicineTypes[medicine.medicine_type] || medicineTypes.oral;
              
              return (
                <div key={medicine.id} className={`border rounded-lg p-4 ${status.bgColor} border-gray-200`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{medicineType.icon}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900">{medicine.medicine_name}</h4>
                        <p className="text-sm text-gray-600">
                          {medicine.dosage} • {medicine.frequency}
                        </p>
                        {medicine.next_dose_date && (
                          <p className="text-xs text-gray-500">
                            Próxima dosis: {new Date(medicine.next_dose_date).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${status.color} ${status.bgColor}`}>
                        {status.label}
                      </span>
                      <div className="mt-2 space-x-2">
                        {(status.status === 'overdue' || status.status === 'due_soon') && (
                          <button
                            onClick={() => setShowDoseModal(medicine)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                          >
                            ✅ Dosis dada
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(medicine)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          ✏️ Editar
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {medicine.special_instructions && (
                    <div className="mt-3 p-2 bg-white bg-opacity-50 rounded">
                      <p className="text-sm text-gray-700">📝 {medicine.special_instructions}</p>
                    </div>
                  )}
                  
                  {medicine.requires_monitoring && (
                    <div className="mt-2 flex items-center text-orange-600 text-sm">
                      <span className="mr-1">⚠️</span>
                      <span>Requiere monitoreo especial</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💊</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No hay medicinas activas</h3>
            <p className="text-gray-600 mb-6">{selectedDog?.name} no tiene medicinas actualmente</p>
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
  };

  const renderAllView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">📋 Todas las Medicinas</h3>
        <button
          onClick={() => setShowAddMedicine(true)}
          className="bg-[#56CCF2] text-white px-4 py-2 rounded-lg hover:bg-[#5B9BD5] transition-colors"
        >
          ➕ Agregar Medicina
        </button>
      </div>

      {medicines.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Medicina
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dosis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Periodo
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
                {medicines.map((medicine) => {
                  const status = getMedicineStatus(medicine);
                  const medicineType = medicineTypes[medicine.medicine_type] || medicineTypes.oral;
                  
                  return (
                    <tr key={medicine.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-xl mr-3">{medicineType.icon}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{medicine.medicine_name}</div>
                            <div className="text-sm text-gray-500">{medicineType.label}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{medicine.dosage}</div>
                        <div className="text-sm text-gray-500">{medicine.frequency}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Inicio: {new Date(medicine.start_date).toLocaleDateString()}
                        </div>
                        {medicine.end_date && (
                          <div className="text-sm text-gray-500">
                            Fin: {new Date(medicine.end_date).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color} ${status.bgColor}`}>
                          {status.label}
                        </span>
                        {medicine.requires_monitoring && (
                          <div className="text-orange-600 text-xs mt-1">⚠️ Requiere monitoreo</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button 
                          onClick={() => handleEdit(medicine)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          ✏️ Editar
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(medicine)}
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
          <div className="text-6xl mb-4">💊</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No hay medicinas registradas</h3>
          <p className="text-gray-600 mb-6">Registra la primera medicina de {selectedDog?.name}</p>
          <button
            onClick={() => setShowAddMedicine(true)}
            className="bg-[#56CCF2] text-white px-6 py-3 rounded-lg hover:bg-[#5B9BD5] transition-colors"
          >
            💊 Primera Medicina
          </button>
        </div>
      )}
    </div>
  );

  const renderForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {editingMedicine ? '✏️ Editar Medicina' : '💊 Nueva Medicina'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre de la medicina */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la medicina *
            </label>
            <input
              type="text"
              value={formData.medicine_name}
              onChange={(e) => setFormData({ ...formData, medicine_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              placeholder="Ej: Amoxicilina, Rimadyl, Omega 3..."
              required
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de medicina
            </label>
            <select
              value={formData.medicine_type}
              onChange={(e) => setFormData({ ...formData, medicine_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
            >
              {Object.entries(medicineTypes).map(([key, type]) => (
                <option key={key} value={key}>
                  {type.icon} {type.label}
                </option>
              ))}
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
              placeholder="Ej: 10mg, 2 gotas, 1 pastilla, 1ml..."
              required
            />
          </div>

          {/* Frecuencia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frecuencia *
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              required
            >
              <option value="">Seleccionar frecuencia</option>
              {frequencies.map(freq => (
                <option key={freq} value={freq}>{freq}</option>
              ))}
            </select>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de inicio *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de fin
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              />
            </div>
          </div>

          {/* Próxima dosis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Próxima dosis
            </label>
            <input
              type="datetime-local"
              value={formData.next_dose_date}
              onChange={(e) => setFormData({ ...formData, next_dose_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
            />
          </div>

          {/* Veterinario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prescrita por
            </label>
            <input
              type="text"
              value={formData.prescribed_by}
              onChange={(e) => setFormData({ ...formData, prescribed_by: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              placeholder="Nombre del veterinario"
            />
          </div>

          {/* Razón del tratamiento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Razón del tratamiento
            </label>
            <input
              type="text"
              value={formData.reason_for_treatment}
              onChange={(e) => setFormData({ ...formData, reason_for_treatment: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              placeholder="Ej: Infección, dolor, prevención..."
            />
          </div>

          {/* Instrucciones especiales */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instrucciones especiales
            </label>
            <textarea
              value={formData.special_instructions}
              onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              rows={2}
              placeholder="Con comida, en ayunas, aplicar después del baño..."
            />
          </div>

          {/* Efectos secundarios */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Efectos secundarios observados
            </label>
            <textarea
              value={formData.side_effects_notes}
              onChange={(e) => setFormData({ ...formData, side_effects_notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              rows={2}
              placeholder="Somnolencia, pérdida de apetito, etc..."
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.is_ongoing}
                onChange={(e) => setFormData({ ...formData, is_ongoing: e.target.checked })}
                className="rounded border-gray-300 text-[#56CCF2] focus:ring-[#56CCF2]"
              />
              <span className="text-sm font-medium text-gray-700">Tratamiento continuo</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.requires_monitoring}
                onChange={(e) => setFormData({ ...formData, requires_monitoring: e.target.checked })}
                className="rounded border-gray-300 text-[#56CCF2] focus:ring-[#56CCF2]"
              />
              <span className="text-sm font-medium text-gray-700">Requiere monitoreo especial</span>
            </label>
          </div>

          {/* Administrada por */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Administrada por
            </label>
            <select
              value={formData.administered_by}
              onChange={(e) => setFormData({ ...formData, administered_by: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
            >
              <option value="owner">Dueño</option>
              <option value="veterinarian">Veterinario</option>
              <option value="groomer">Groomer</option>
              <option value="club_staff">Personal del club</option>
            </select>
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

  // Modal de dosis dada
  const renderDoseModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">✅ Confirmar Dosis</h3>
        
        <p className="text-gray-600 mb-6">
          ¿Confirmas que has administrado la dosis de <strong>{showDoseModal?.medicine_name}</strong>?
        </p>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="text-sm text-blue-800">
            <p><strong>Medicina:</strong> {showDoseModal?.medicine_name}</p>
            <p><strong>Dosis:</strong> {showDoseModal?.dosage}</p>
            <p><strong>Frecuencia:</strong> {showDoseModal?.frequency}</p>
          </div>
        </div>

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
      
      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-red-600">🗑️ Eliminar Medicina</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres eliminar "{showDeleteConfirm.medicine_name}"?
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

export default MedicineManager;