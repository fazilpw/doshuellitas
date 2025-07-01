// src/components/medical/ParentMedicalManager.jsx
// Sistema médico para padres - Club Canino Dos Huellitas

import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase.js';

const ParentMedicalManager = ({ dogId, dogName, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('vaccines');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [existingData, setExistingData] = useState({
    vaccines: [],        // Tabla nueva: vaccines
    dogVaccines: [],     // Tabla existente: dog_vaccines  
    medicines: [],       // Tabla medicines
    medicalAlerts: []    // Tabla medical_alerts
  });

  // Estados para formularios
  const [vaccineData, setVaccineData] = useState({
    vaccine_name: '',
    vaccine_type: 'vaccine',
    date_administered: '',
    next_due_date: '',
    veterinarian: '',
    clinic_name: '',
    batch_number: '',
    is_critical: false,
    notes: ''
  });

  const [medicineData, setMedicineData] = useState({
    medicine_name: '',
    medicine_type: 'antibiotic',
    dosage: '',
    frequency: '',
    start_date: '',
    end_date: '',
    is_ongoing: true,
    requires_monitoring: false,
    reason_for_treatment: '',
    special_instructions: '',
    prescribed_by: ''
  });

  // Cargar datos existentes de TODAS las tablas
  useEffect(() => {
    if (dogId) {
      loadAllMedicalData();
    }
  }, [dogId]);

  const loadAllMedicalData = async () => {
    try {
      console.log('🔄 Cargando datos médicos para dog_id:', dogId);

      // Cargar de tabla vaccines (nueva)
      const { data: vaccines, error: vaccinesError } = await supabase
        .from('vaccines')
        .select('*')
        .eq('dog_id', dogId)
        .order('date_administered', { ascending: false });

      // Cargar de tabla dog_vaccines (existente con tus datos)
      const { data: dogVaccines, error: dogVaccinesError } = await supabase
        .from('dog_vaccines')
        .select('*')
        .eq('dog_id', dogId)
        .order('next_due_date', { ascending: false });

      // Cargar medicinas
      const { data: medicines, error: medicinesError } = await supabase
        .from('medicines')
        .select('*')
        .eq('dog_id', dogId)
        .order('start_date', { ascending: false });

      // Cargar alertas médicas
      const { data: medicalAlerts, error: alertsError } = await supabase
        .from('medical_alerts')
        .select('*')
        .eq('dog_id', dogId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (vaccinesError) console.warn('⚠️ Error cargando vaccines:', vaccinesError);
      if (dogVaccinesError) console.warn('⚠️ Error cargando dog_vaccines:', dogVaccinesError);
      if (medicinesError) console.warn('⚠️ Error cargando medicines:', medicinesError);
      if (alertsError) console.warn('⚠️ Error cargando medical_alerts:', alertsError);

      setExistingData({
        vaccines: vaccines || [],
        dogVaccines: dogVaccines || [],
        medicines: medicines || [],
        medicalAlerts: medicalAlerts || []
      });

      console.log('✅ Datos cargados:', {
        vaccines: vaccines?.length || 0,
        dogVaccines: dogVaccines?.length || 0,
        medicines: medicines?.length || 0,
        alerts: medicalAlerts?.length || 0
      });

    } catch (error) {
      console.error('❌ Error cargando datos médicos:', error);
    }
  };

  // Manejo de vacunas
  const handleVaccineSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (!vaccineData.vaccine_name.trim()) {
        throw new Error('El nombre de la vacuna es requerido');
      }
      if (!vaccineData.date_administered) {
        throw new Error('La fecha de administración es requerida');
      }

      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      
      // Insertar en tabla vaccines (tu tabla nueva)
      const dataToInsert = {
        dog_id: dogId,
        vaccine_name: vaccineData.vaccine_name,
        vaccine_type: vaccineData.vaccine_type,
        date_administered: vaccineData.date_administered,
        next_due_date: vaccineData.next_due_date || null,
        veterinarian: vaccineData.veterinarian || null,
        clinic_name: vaccineData.clinic_name || null,
        batch_number: vaccineData.batch_number || null,
        is_critical: vaccineData.is_critical,
        notes: vaccineData.notes || null,
        administered_by: 'owner', // Campo específico de tu schema
        reminder_sent: false
      };

      console.log('📤 Insertando vacuna:', dataToInsert);

      const { data, error } = await supabase
        .from('vaccines')
        .insert([dataToInsert])
        .select();

      if (error) {
        console.error('❌ Error insertando vacuna:', error);
        throw error;
      }

      console.log('✅ Vacuna registrada:', data);
      setSuccess('✅ Vacuna registrada exitosamente - Los profesores pueden verla ahora');
      
      // Limpiar formulario
      setVaccineData({
        vaccine_name: '',
        vaccine_type: 'vaccine',
        date_administered: '',
        next_due_date: '',
        veterinarian: '',
        clinic_name: '',
        batch_number: '',
        is_critical: false,
        notes: ''
      });

      // Recargar datos para mostrar el nuevo registro
      await loadAllMedicalData();

      // Notificar éxito
      if (onSuccess) onSuccess('vaccine', data[0]);

    } catch (err) {
      console.error('❌ Error registrando vacuna:', err);
      setError(err.message || 'Error registrando la vacuna');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejo de medicinas
  const handleMedicineSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (!medicineData.medicine_name.trim()) {
        throw new Error('El nombre del medicamento es requerido');
      }
      if (!medicineData.dosage?.trim()) {
        throw new Error('La dosis es requerida');
      }
      if (!medicineData.start_date) {
        throw new Error('La fecha de inicio es requerida');
      }

      // Preparar datos según tu schema exacto
      const dataToInsert = {
        dog_id: dogId,
        medicine_name: medicineData.medicine_name,
        medicine_type: medicineData.medicine_type,
        dosage: medicineData.dosage,
        frequency: medicineData.frequency,
        start_date: medicineData.start_date,
        end_date: medicineData.end_date || null,
        next_dose_date: null,
        prescribed_by: medicineData.prescribed_by || null,
        reason_for_treatment: medicineData.reason_for_treatment || null,
        special_instructions: medicineData.special_instructions || null,
        side_effects_notes: null,
        is_ongoing: medicineData.is_ongoing,
        requires_monitoring: medicineData.requires_monitoring,
        administered_by: 'owner'
      };

      console.log('📤 Insertando medicina:', dataToInsert);

      const { data, error } = await supabase
        .from('medicines')
        .insert([dataToInsert])
        .select();

      if (error) {
        console.error('❌ Error insertando medicina:', error);
        throw error;
      }

      console.log('✅ Medicina registrada:', data);
      setSuccess('✅ Medicina registrada exitosamente - Los profesores pueden verla ahora');
      
      // Limpiar formulario
      setMedicineData({
        medicine_name: '',
        medicine_type: 'antibiotic',
        dosage: '',
        frequency: '',
        start_date: '',
        end_date: '',
        is_ongoing: true,
        requires_monitoring: false,
        reason_for_treatment: '',
        special_instructions: '',
        prescribed_by: ''
      });

      // Recargar datos
      await loadAllMedicalData();

      // Notificar éxito
      if (onSuccess) onSuccess('medicine', data[0]);

    } catch (err) {
      console.error('❌ Error registrando medicina:', err);
      setError(err.message || 'Error registrando la medicina');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#56CCF2] to-[#5B9BD5] text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">🏥 Centro Médico - Información de {dogName}</h2>
              <p className="opacity-90">Los profesores verán esta información inmediatamente</p>
            </div>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Mensajes de estado */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3">
            <div className="flex">
              <span className="mr-2">❌</span>
              <span>{error}</span>
            </div>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3">
            <div className="flex">
              <span className="mr-2">✅</span>
              <span>{success}</span>
            </div>
          </div>
        )}

        <div className="flex h-[calc(95vh-200px)]">
          
          {/* Sidebar con historial médico */}
          <div className="w-1/3 bg-gray-50 border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-semibold mb-4 text-gray-800">📋 Historial Médico Completo</h3>
              
              {/* Vacunas de tabla vaccines (nueva) */}
              {existingData.vaccines.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-green-700 mb-2">💉 Vacunas Registradas (Nuevas)</h4>
                  <div className="space-y-2">
                    {existingData.vaccines.map(vaccine => (
                      <div key={`v-${vaccine.id}`} className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <div className="font-medium text-sm text-green-900">{vaccine.vaccine_name}</div>
                        <div className="text-xs text-green-700">
                          Aplicada: {new Date(vaccine.date_administered).toLocaleDateString('es-CO')}
                        </div>
                        {vaccine.next_due_date && (
                          <div className="text-xs text-green-600">
                            Próxima: {new Date(vaccine.next_due_date).toLocaleDateString('es-CO')}
                          </div>
                        )}
                        {vaccine.veterinarian && (
                          <div className="text-xs text-green-600">Dr. {vaccine.veterinarian}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vacunas de tabla dog_vaccines (existente con tus datos) */}
              {existingData.dogVaccines.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-blue-700 mb-2">💉 Vacunas Existentes (Sistema Anterior)</h4>
                  <div className="space-y-2">
                    {existingData.dogVaccines.map(vaccine => (
                      <div key={`dv-${vaccine.id}`} className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <div className="font-medium text-sm text-blue-900">{vaccine.vaccine_name}</div>
                        {vaccine.last_application_date && (
                          <div className="text-xs text-blue-700">
                            Aplicada: {new Date(vaccine.last_application_date).toLocaleDateString('es-CO')}
                          </div>
                        )}
                        <div className="text-xs text-blue-600">
                          Vence: {new Date(vaccine.next_due_date).toLocaleDateString('es-CO')}
                        </div>
                        {vaccine.veterinarian_name && (
                          <div className="text-xs text-blue-600">Dr. {vaccine.veterinarian_name}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Medicinas */}
              {existingData.medicines.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-purple-700 mb-2">💊 Medicinas Registradas</h4>
                  <div className="space-y-2">
                    {existingData.medicines.map(medicine => (
                      <div key={`m-${medicine.id}`} className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <div className="font-medium text-sm text-purple-900">{medicine.medicine_name}</div>
                        <div className="text-xs text-purple-700">Dosis: {medicine.dosage}</div>
                        <div className="text-xs text-purple-700">Frecuencia: {medicine.frequency}</div>
                        {medicine.is_ongoing && (
                          <div className="text-xs text-purple-600">⏳ Tratamiento activo</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alertas médicas */}
              {existingData.medicalAlerts.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-red-700 mb-2">🚨 Alertas Médicas</h4>
                  <div className="space-y-2">
                    {existingData.medicalAlerts.map(alert => (
                      <div key={`a-${alert.id}`} className="bg-red-50 rounded-lg p-3 border border-red-200">
                        <div className="font-medium text-sm text-red-900">{alert.title}</div>
                        <div className="text-xs text-red-700">{alert.description}</div>
                        <div className="text-xs text-red-600">Nivel: {alert.severity}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mensaje si no hay datos */}
              {existingData.vaccines.length === 0 && 
               existingData.dogVaccines.length === 0 && 
               existingData.medicines.length === 0 && 
               existingData.medicalAlerts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🏥</div>
                  <p className="text-sm">No hay información médica registrada para {dogName}</p>
                  <p className="text-xs mt-2">¡Sé el primero en agregar información!</p>
                </div>
              )}
            </div>
          </div>

          {/* Panel principal con formularios */}
          <div className="flex-1 flex flex-col">
            
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('vaccines')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'vaccines'
                    ? 'bg-[#56CCF2] text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                💉 Agregar Vacuna
              </button>
              <button
                onClick={() => setActiveTab('medicines')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'medicines'
                    ? 'bg-[#56CCF2] text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                💊 Agregar Medicina
              </button>
            </div>

            {/* Contenido del formulario */}
            <div className="flex-1 overflow-y-auto p-6">
              
              {/* Formulario de Vacunas */}
              {activeTab === 'vaccines' && (
                <form onSubmit={handleVaccineSubmit} className="space-y-4 max-w-2xl">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nombre de la vacuna */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre de la Vacuna *
                      </label>
                      <input
                        type="text"
                        value={vaccineData.vaccine_name}
                        onChange={(e) => setVaccineData(prev => ({
                          ...prev,
                          vaccine_name: e.target.value
                        }))}
                        placeholder="ej: DHPP, Rabia, Bordetella..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Tipo de vacuna según tu schema */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Vacuna
                      </label>
                      <select
                        value={vaccineData.vaccine_type}
                        onChange={(e) => setVaccineData(prev => ({
                          ...prev,
                          vaccine_type: e.target.value
                        }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                      >
                        <option value="vaccine">Vacuna Regular</option>
                        <option value="deworming">Desparasitante</option>
                        <option value="flea_tick">Antipulgas/Garrapatas</option>
                        <option value="heartworm">Prevención Gusano del Corazón</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Fecha de aplicación */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de Aplicación *
                      </label>
                      <input
                        type="date"
                        value={vaccineData.date_administered}
                        onChange={(e) => setVaccineData(prev => ({
                          ...prev,
                          date_administered: e.target.value
                        }))}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Próxima fecha */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Próxima Aplicación
                      </label>
                      <input
                        type="date"
                        value={vaccineData.next_due_date}
                        onChange={(e) => setVaccineData(prev => ({
                          ...prev,
                          next_due_date: e.target.value
                        }))}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Veterinario */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Veterinario
                      </label>
                      <input
                        type="text"
                        value={vaccineData.veterinarian}
                        onChange={(e) => setVaccineData(prev => ({
                          ...prev,
                          veterinarian: e.target.value
                        }))}
                        placeholder="Dr. García"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                      />
                    </div>

                    {/* Clínica */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Clínica Veterinaria
                      </label>
                      <input
                        type="text"
                        value={vaccineData.clinic_name}
                        onChange={(e) => setVaccineData(prev => ({
                          ...prev,
                          clinic_name: e.target.value
                        }))}
                        placeholder="Clínica Veterinaria Central"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Número de lote */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Lote (opcional)
                    </label>
                    <input
                      type="text"
                      value={vaccineData.batch_number}
                      onChange={(e) => setVaccineData(prev => ({
                        ...prev,
                        batch_number: e.target.value
                      }))}
                      placeholder="LOT123456"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                    />
                  </div>

                  {/* Checkbox crítica */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={vaccineData.is_critical}
                      onChange={(e) => setVaccineData(prev => ({
                        ...prev,
                        is_critical: e.target.checked
                      }))}
                      className="mr-2 h-4 w-4 text-[#56CCF2] focus:ring-[#56CCF2] border-gray-300 rounded"
                    />
                    <label className="text-sm text-gray-700">
                      Esta es una vacuna crítica (obligatoria/importante)
                    </label>
                  </div>

                  {/* Notas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notas Adicionales
                    </label>
                    <textarea
                      value={vaccineData.notes}
                      onChange={(e) => setVaccineData(prev => ({
                        ...prev,
                        notes: e.target.value
                      }))}
                      placeholder="Cualquier observación adicional..."
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                    />
                  </div>

                  {/* Botón submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#56CCF2] text-white py-3 px-4 rounded-lg hover:bg-[#5B9BD5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isSubmitting ? '⏳ Guardando...' : '💉 Registrar Vacuna'}
                  </button>
                </form>
              )}

              {/* Formulario de Medicinas */}
              {activeTab === 'medicines' && (
                <form onSubmit={handleMedicineSubmit} className="space-y-4 max-w-2xl">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nombre del medicamento */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del Medicamento *
                      </label>
                      <input
                        type="text"
                        value={medicineData.medicine_name}
                        onChange={(e) => setMedicineData(prev => ({
                          ...prev,
                          medicine_name: e.target.value
                        }))}
                        placeholder="ej: Amoxicilina, Carprofeno..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Tipo de medicina según tu schema */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo
                      </label>
                      <select
                        value={medicineData.medicine_type}
                        onChange={(e) => setMedicineData(prev => ({
                          ...prev,
                          medicine_type: e.target.value
                        }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                      >
                        <option value="antibiotic">Antibiótico</option>
                        <option value="anti_inflammatory">Antiinflamatorio</option>
                        <option value="pain_relief">Analgésico</option>
                        <option value="supplement">Suplemento</option>
                        <option value="other">Otro</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Dosis */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dosis *
                      </label>
                      <input
                        type="text"
                        value={medicineData.dosage}
                        onChange={(e) => setMedicineData(prev => ({
                          ...prev,
                          dosage: e.target.value
                        }))}
                        placeholder="ej: 250mg, 1 tableta..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Frecuencia */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Frecuencia *
                      </label>
                      <input
                        type="text"
                        value={medicineData.frequency}
                        onChange={(e) => setMedicineData(prev => ({
                          ...prev,
                          frequency: e.target.value
                        }))}
                        placeholder="ej: 2 veces al día..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Fecha inicio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de Inicio *
                      </label>
                      <input
                        type="date"
                        value={medicineData.start_date}
                        onChange={(e) => setMedicineData(prev => ({
                          ...prev,
                          start_date: e.target.value
                        }))}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Fecha fin */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de Fin (opcional)
                      </label>
                      <input
                        type="date"
                        value={medicineData.end_date}
                        onChange={(e) => setMedicineData(prev => ({
                          ...prev,
                          end_date: e.target.value
                        }))}
                        min={medicineData.start_date || new Date().toISOString().split('T')[0]}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Veterinario que recetó */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Veterinario que lo Recetó
                    </label>
                    <input
                      type="text"
                      value={medicineData.prescribed_by}
                      onChange={(e) => setMedicineData(prev => ({
                        ...prev,
                        prescribed_by: e.target.value
                      }))}
                      placeholder="Dr. García"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                    />
                  </div>

                  {/* Checkboxes */}
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={medicineData.is_ongoing}
                        onChange={(e) => setMedicineData(prev => ({
                          ...prev,
                          is_ongoing: e.target.checked
                        }))}
                        className="mr-2 h-4 w-4 text-[#56CCF2] focus:ring-[#56CCF2] border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Tratamiento activo</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={medicineData.requires_monitoring}
                        onChange={(e) => setMedicineData(prev => ({
                          ...prev,
                          requires_monitoring: e.target.checked
                        }))}
                        className="mr-2 h-4 w-4 text-[#56CCF2] focus:ring-[#56CCF2] border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Requiere monitoreo especial</span>
                    </label>
                  </div>

                  {/* Motivo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo del Tratamiento
                    </label>
                    <input
                      type="text"
                      value={medicineData.reason_for_treatment}
                      onChange={(e) => setMedicineData(prev => ({
                        ...prev,
                        reason_for_treatment: e.target.value
                      }))}
                      placeholder="ej: Infección urinaria, artritis..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                    />
                  </div>

                  {/* Instrucciones especiales */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instrucciones Especiales
                    </label>
                    <textarea
                      value={medicineData.special_instructions}
                      onChange={(e) => setMedicineData(prev => ({
                        ...prev,
                        special_instructions: e.target.value
                      }))}
                      placeholder="ej: Dar con comida, no combinar con..."
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
                    />
                  </div>

                  {/* Botón submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#56CCF2] text-white py-3 px-4 rounded-lg hover:bg-[#5B9BD5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isSubmitting ? '⏳ Guardando...' : '💊 Registrar Medicina'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentMedicalManager;