// src/components/routines/GroomingManager.jsx
// 🛁 GESTOR COMPLETO DE GROOMING/BAÑO - SEMANAL Y MENSUAL

import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase.js';
import { notifyGroomingCompleted } from '../../utils/managerIntegrations.js';


const GroomingManager = ({ dogs = [], currentUser, onGroomingUpdated }) => {
  // Estados principales
  const [selectedDogId, setSelectedDogId] = useState('');
  const [activeTab, setActiveTab] = useState('schedule');
  const [loading, setLoading] = useState(false);
  const [groomingSessions, setGroomingSessions] = useState([]);
  const [groomingSchedules, setGroomingSchedules] = useState([]);
  
  // Estados para modales
  const [showAddSession, setShowAddSession] = useState(false);
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  
  // Estados para formularios
  const [sessionFormData, setSessionFormData] = useState({
    grooming_type: 'bath',
    date: '',
    groomer_name: '',
    location: 'casa',
    services: [],
    cost: '',
    notes: '',
    next_session_date: ''
  });

  const [scheduleFormData, setScheduleFormData] = useState({
    name: '',
    grooming_type: 'bath',
    frequency_type: 'weekly',
    frequency_value: 1,
    preferred_day: 1,
    groomer_name: '',
    location: 'casa',
    default_services: [],
    estimated_cost: '',
    notes: '',
    active: true
  });

  const selectedDog = dogs.find(dog => dog.id === selectedDogId);

  // Tipos de grooming
  const groomingTypes = {
    'bath': { label: 'Baño', icon: '🛁', color: 'bg-blue-50 text-blue-700' },
    'full_grooming': { label: 'Grooming Completo', icon: '✂️', color: 'bg-purple-50 text-purple-700' },
    'nail_trim': { label: 'Corte de Uñas', icon: '💅', color: 'bg-pink-50 text-pink-700' },
    'ear_cleaning': { label: 'Limpieza de Oídos', icon: '👂', color: 'bg-yellow-50 text-yellow-700' },
    'teeth_cleaning': { label: 'Limpieza Dental', icon: '🦷', color: 'bg-green-50 text-green-700' },
    'flea_treatment': { label: 'Tratamiento Pulgas', icon: '🦟', color: 'bg-red-50 text-red-700' }
  };

  // Servicios disponibles
  const availableServices = [
    { id: 'bath', label: 'Baño con champú especial', icon: '🧴' },
    { id: 'haircut', label: 'Corte de pelo', icon: '✂️' },
    { id: 'nail_trim', label: 'Corte de uñas', icon: '💅' },
    { id: 'ear_cleaning', label: 'Limpieza de oídos', icon: '👂' },
    { id: 'teeth_brushing', label: 'Cepillado dental', icon: '🦷' },
    { id: 'blow_dry', label: 'Secado profesional', icon: '💨' },
    { id: 'perfume', label: 'Perfume para mascotas', icon: '🌸' },
    { id: 'flea_shampoo', label: 'Champú antipulgas', icon: '🦟' }
  ];

  // Frecuencias
  const frequencies = {
    'weekly': { label: 'Semanal', options: [1, 2, 3, 4] },
    'monthly': { label: 'Mensual', options: [1, 2, 3, 6] }
  };

  // Días de la semana
  const weekDays = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
    { value: 7, label: 'Domingo' }
  ];

  // Efectos
  useEffect(() => {
    if (dogs.length > 0 && !selectedDogId) {
      setSelectedDogId(dogs[0].id);
    }
  }, [dogs, selectedDogId]);

  useEffect(() => {
    if (selectedDogId) {
      fetchGroomingData();
    }
  }, [selectedDogId]);

  // ===============================================
  // 📊 OBTENER DATOS DE GROOMING
  // ===============================================
  const fetchGroomingData = async () => {
    if (!selectedDogId) return;
    
    setLoading(true);
    try {
      // Obtener sesiones de grooming
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('grooming_sessions')
        .select('*')
        .eq('dog_id', selectedDogId)
        .order('date', { ascending: false });

      if (sessionsError) {
        console.warn('⚠️ Table grooming_sessions might not exist:', sessionsError);
        setGroomingSessions([]);
      } else {
        setGroomingSessions(sessionsData || []);
      }

      // Obtener horarios de grooming
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('grooming_schedules')
        .select('*')
        .eq('dog_id', selectedDogId)
        .order('created_at', { ascending: false });

      if (schedulesError) {
        console.warn('⚠️ Table grooming_schedules might not exist:', schedulesError);
        setGroomingSchedules([]);
      } else {
        setGroomingSchedules(schedulesData || []);
      }
      
    } catch (error) {
      console.error('❌ Error in fetchGroomingData:', error);
      setGroomingSessions([]);
      setGroomingSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // 📝 MANEJO DE FORMULARIOS
  // ===============================================
  const resetSessionForm = () => {
    setSessionFormData({
      grooming_type: 'bath',
      date: '',
      groomer_name: '',
      location: 'casa',
      services: [],
      cost: '',
      notes: '',
      next_session_date: ''
    });
  };

  const resetScheduleForm = () => {
    setScheduleFormData({
      name: '',
      grooming_type: 'bath',
      frequency_type: 'weekly',
      frequency_value: 1,
      preferred_day: 1,
      groomer_name: '',
      location: 'casa',
      default_services: [],
      estimated_cost: '',
      notes: '',
      active: true
    });
  };

  // ===============================================
  // 💾 GUARDAR SESIÓN
  // ===============================================
  const handleSessionSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const sessionData = {
        dog_id: selectedDogId,
        grooming_type: sessionFormData.grooming_type,
        date: sessionFormData.date,
        groomer_name: sessionFormData.groomer_name || null,
        location: sessionFormData.location,
        services: sessionFormData.services,
        cost: sessionFormData.cost ? parseFloat(sessionFormData.cost) : null,
        notes: sessionFormData.notes || null,
        next_session_date: sessionFormData.next_session_date || null
      };

      if (editingSession) {
        // Actualizar sesión existente
        const { error } = await supabase
          .from('grooming_sessions')
          .update(sessionData)
          .eq('id', editingSession.id);

        if (error) throw error;
        console.log('✅ Sesión de grooming actualizada');
      } else {
        // Crear nueva sesión
        const { error } = await supabase
          .from('grooming_sessions')
          .insert(sessionData);

        if (error) throw error;
        console.log('✅ Sesión de grooming creada');
        
        // 🆕 CREAR NOTIFICACIONES DE GROOMING
        try {
  const notificationResult = await notifyGroomingCompleted(
    {
      service_type: sessionData.grooming_type,
      service_date: sessionData.date,
      performed_by: sessionData.groomer_name || 'Staff del club',
      cost: sessionData.cost,
      notes: sessionData.notes
    },
    selectedDog?.name || 'Perro',
    currentUser?.id
  );
  
  if (notificationResult.success) {
    console.log(`✅ ${notificationResult.notifications.length} notificaciones de grooming enviadas`);
  }
} catch (notificationError) {
  console.warn('⚠️ Error enviando notificaciones de grooming:', notificationError);
}
      }
      
      // Continuar con el flujo normal
      setShowAddSession(false);
      setEditingSession(null);
      resetSessionForm();
      fetchGroomingData();
      
      if (onGroomingUpdated) {
        onGroomingUpdated();
      }
      
    } catch (error) {
      console.error('❌ Error saving grooming session:', error);
      alert('Error al guardar la sesión de grooming');
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // 📅 GUARDAR HORARIO
  // ===============================================
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const scheduleData = {
        dog_id: selectedDogId,
        name: scheduleFormData.name,
        grooming_type: scheduleFormData.grooming_type,
        frequency_type: scheduleFormData.frequency_type,
        frequency_value: scheduleFormData.frequency_value,
        preferred_day: scheduleFormData.preferred_day,
        groomer_name: scheduleFormData.groomer_name || null,
        location: scheduleFormData.location,
        default_services: scheduleFormData.default_services,
        estimated_cost: scheduleFormData.estimated_cost ? parseFloat(scheduleFormData.estimated_cost) : null,
        notes: scheduleFormData.notes || null,
        active: scheduleFormData.active
      };

      if (editingSchedule) {
        // Actualizar horario existente
        const { error } = await supabase
          .from('grooming_schedules')
          .update(scheduleData)
          .eq('id', editingSchedule.id);

        if (error) throw error;
        console.log('✅ Horario de grooming actualizado');
      } else {
        // Crear nuevo horario
        const { error } = await supabase
          .from('grooming_schedules')
          .insert(scheduleData);

        if (error) throw error;
        console.log('✅ Horario de grooming creado');
      }
      
      setShowAddSchedule(false);
      setEditingSchedule(null);
      resetScheduleForm();
      fetchGroomingData();
      
      if (onGroomingUpdated) {
        onGroomingUpdated();
      }
      
    } catch (error) {
      console.error('❌ Error saving grooming schedule:', error);
      alert('Error al guardar el horario de grooming');
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // 🗑️ ELIMINAR
  // ===============================================
  const handleDelete = async (item, type) => {
    setLoading(true);
    try {
      const table = type === 'session' ? 'grooming_sessions' : 'grooming_schedules';
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      setShowDeleteConfirm(null);
      fetchGroomingData();
      
      if (onGroomingUpdated) {
        onGroomingUpdated();
      }
      
      console.log(`✅ ${type} de grooming eliminado`);
      
    } catch (error) {
      console.error('❌ Error deleting grooming item:', error);
      alert('Error al eliminar el elemento');
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // ✏️ EDITAR
  // ===============================================
  const handleEditSession = (session) => {
    setSessionFormData({
      grooming_type: session.grooming_type,
      date: session.date,
      groomer_name: session.groomer_name || '',
      location: session.location,
      services: session.services || [],
      cost: session.cost ? session.cost.toString() : '',
      notes: session.notes || '',
      next_session_date: session.next_session_date || ''
    });
    setEditingSession(session);
    setShowAddSession(true);
  };

  const handleEditSchedule = (schedule) => {
    setScheduleFormData({
      name: schedule.name,
      grooming_type: schedule.grooming_type,
      frequency_type: schedule.frequency_type,
      frequency_value: schedule.frequency_value,
      preferred_day: schedule.preferred_day,
      groomer_name: schedule.groomer_name || '',
      location: schedule.location,
      default_services: schedule.default_services || [],
      estimated_cost: schedule.estimated_cost ? schedule.estimated_cost.toString() : '',
      notes: schedule.notes || '',
      active: schedule.active
    });
    setEditingSchedule(schedule);
    setShowAddSchedule(true);
  };

  // ===============================================
  // 📅 CALCULAR PRÓXIMA SESIÓN
  // ===============================================
  const calculateNextSession = (schedule) => {
    const today = new Date();
    const nextDate = new Date(today);
    
    if (schedule.frequency_type === 'weekly') {
      nextDate.setDate(today.getDate() + (schedule.frequency_value * 7));
    } else if (schedule.frequency_type === 'monthly') {
      nextDate.setMonth(today.getMonth() + schedule.frequency_value);
    }
    
    return nextDate;
  };

  // ===============================================
  // 🎨 COMPONENTES DE RENDERIZADO
  // ===============================================
  const renderDogSelector = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <div className="text-2xl">🛁</div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Grooming</h2>
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
        onClick={() => setActiveTab('schedule')}
        className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
          activeTab === 'schedule'
            ? 'border-[#56CCF2] text-[#56CCF2]'
            : 'border-transparent text-gray-500 hover:text-gray-700'
        }`}
      >
        📅 Horarios
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

  const renderScheduleView = () => (
    <div className="space-y-6">
      {/* Acciones rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setShowAddSchedule(true)}
          className="bg-[#56CCF2] text-white p-4 rounded-lg hover:bg-[#5B9BD5] transition-colors text-center"
        >
          <div className="text-2xl mb-2">📅</div>
          <div className="text-sm font-medium">Nuevo Horario</div>
        </button>
        
        <button
          onClick={() => setShowAddSession(true)}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors text-center"
        >
          <div className="text-2xl mb-2">🛁</div>
          <div className="text-sm font-medium text-blue-700">Baño Rápido</div>
        </button>
        
        <button
          onClick={() => {
            setSessionFormData({
              ...sessionFormData,
              grooming_type: 'full_grooming',
              services: ['bath', 'haircut', 'nail_trim', 'ear_cleaning']
            });
            setShowAddSession(true);
          }}
          className="bg-purple-50 border border-purple-200 rounded-lg p-4 hover:bg-purple-100 transition-colors text-center"
        >
          <div className="text-2xl mb-2">✂️</div>
          <div className="text-sm font-medium text-purple-700">Grooming Completo</div>
        </button>
        
        <button
          onClick={() => {
            setSessionFormData({
              ...sessionFormData,
              grooming_type: 'nail_trim',
              services: ['nail_trim']
            });
            setShowAddSession(true);
          }}
          className="bg-pink-50 border border-pink-200 rounded-lg p-4 hover:bg-pink-100 transition-colors text-center"
        >
          <div className="text-2xl mb-2">💅</div>
          <div className="text-sm font-medium text-pink-700">Corte Uñas</div>
        </button>
      </div>

      {/* Horarios activos */}
      {groomingSchedules.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">📅 Horarios Programados</h3>
          
          {groomingSchedules.filter(s => s.active).map(schedule => {
            const groomingType = groomingTypes[schedule.grooming_type] || groomingTypes.bath;
            const nextSession = calculateNextSession(schedule);
            
            return (
              <div key={schedule.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{groomingType.icon}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{schedule.name}</h4>
                      <p className="text-sm text-gray-600">
                        {groomingType.label} • 
                        {schedule.frequency_type === 'weekly' ? 
                          ` Cada ${schedule.frequency_value} semana${schedule.frequency_value > 1 ? 's' : ''}` :
                          ` Cada ${schedule.frequency_value} mes${schedule.frequency_value > 1 ? 'es' : ''}`
                        }
                      </p>
                      <p className="text-xs text-gray-500">
                        Próxima sesión: {nextSession.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditSchedule(schedule)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm({ item: schedule, type: 'schedule' })}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
                
                {schedule.default_services && schedule.default_services.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {schedule.default_services.map(serviceId => {
                      const service = availableServices.find(s => s.id === serviceId);
                      return service ? (
                        <span key={serviceId} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                          {service.icon} {service.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No hay horarios configurados</h3>
          <p className="text-gray-600 mb-6">Crea un horario regular para el grooming de {selectedDog?.name}</p>
          <button
            onClick={() => setShowAddSchedule(true)}
            className="bg-[#56CCF2] text-white px-6 py-3 rounded-lg hover:bg-[#5B9BD5] transition-colors"
          >
            📅 Crear Primer Horario
          </button>
        </div>
      )}
    </div>
  );

  const renderHistoryView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">📋 Historial de Grooming</h3>
        <button
          onClick={() => setShowAddSession(true)}
          className="bg-[#56CCF2] text-white px-4 py-2 rounded-lg hover:bg-[#5B9BD5] transition-colors"
        >
          ➕ Nueva Sesión
        </button>
      </div>

      {groomingSessions.length > 0 ? (
        <div className="space-y-4">
          {groomingSessions.map(session => {
            const groomingType = groomingTypes[session.grooming_type] || groomingTypes.bath;
            
            return (
              <div key={session.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{groomingType.icon}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{groomingType.label}</h4>
                      <p className="text-sm text-gray-600">
                        {new Date(session.date).toLocaleDateString()} • 
                        {session.location === 'casa' ? ' En casa' : ' Peluquería'}
                      </p>
                      {session.groomer_name && (
                        <p className="text-xs text-gray-500">Por: {session.groomer_name}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {session.cost && (
                      <p className="text-sm font-semibold text-gray-900">
                        ${session.cost.toLocaleString()}
                      </p>
                    )}
                    <div className="mt-1 space-x-2">
                      <button
                        onClick={() => handleEditSession(session)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm({ item: session, type: 'session' })}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                </div>
                
                {session.services && session.services.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {session.services.map(serviceId => {
                      const service = availableServices.find(s => s.id === serviceId);
                      return service ? (
                        <span key={serviceId} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                          {service.icon} {service.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
                
                {session.notes && (
                  <div className="mt-3 p-2 bg-gray-50 rounded">
                    <p className="text-sm text-gray-700">📝 {session.notes}</p>
                  </div>
                )}
                
                {session.next_session_date && (
                  <div className="mt-2 text-xs text-blue-600">
                    Próxima sesión programada: {new Date(session.next_session_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🛁</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No hay sesiones registradas</h3>
          <p className="text-gray-600 mb-6">Registra la primera sesión de grooming de {selectedDog?.name}</p>
          <button
            onClick={() => setShowAddSession(true)}
            className="bg-[#56CCF2] text-white px-6 py-3 rounded-lg hover:bg-[#5B9BD5] transition-colors"
          >
            🛁 Primera Sesión
          </button>
        </div>
      )}
    </div>
  );

  // Formulario de sesión
  const renderSessionForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {editingSession ? '✏️ Editar Sesión' : '🛁 Nueva Sesión de Grooming'}
        </h3>
        
        <form onSubmit={handleSessionSubmit} className="space-y-4">
          {/* Tipo de grooming */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de grooming
            </label>
            <select
              value={sessionFormData.grooming_type}
              onChange={(e) => setSessionFormData({ ...sessionFormData, grooming_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
            >
              {Object.entries(groomingTypes).map(([key, type]) => (
                <option key={key} value={key}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha *
            </label>
            <input
              type="date"
              value={sessionFormData.date}
              onChange={(e) => setSessionFormData({ ...sessionFormData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              required
            />
          </div>

          {/* Groomer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Groomer/Estilista
            </label>
            <input
              type="text"
              value={sessionFormData.groomer_name}
              onChange={(e) => setSessionFormData({ ...sessionFormData, groomer_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              placeholder="Nombre del groomer"
            />
          </div>

          {/* Ubicación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ubicación
            </label>
            <select
              value={sessionFormData.location}
              onChange={(e) => setSessionFormData({ ...sessionFormData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
            >
              <option value="casa">🏠 En casa</option>
              <option value="salon">✂️ Peluquería/Salón</option>
              <option value="mobile">🚐 Servicio móvil</option>
            </select>
          </div>

          {/* Servicios */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Servicios realizados
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableServices.map(service => (
                <label key={service.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={sessionFormData.services.includes(service.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSessionFormData({
                          ...sessionFormData,
                          services: [...sessionFormData.services, service.id]
                        });
                      } else {
                        setSessionFormData({
                          ...sessionFormData,
                          services: sessionFormData.services.filter(s => s !== service.id)
                        });
                      }
                    }}
                    className="rounded border-gray-300 text-[#56CCF2] focus:ring-[#56CCF2]"
                  />
                  <span className="text-sm">{service.icon} {service.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Costo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Costo
            </label>
            <input
              type="number"
              value={sessionFormData.cost}
              onChange={(e) => setSessionFormData({ ...sessionFormData, cost: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              placeholder="0.00"
              step="0.01"
            />
          </div>

          {/* Próxima sesión */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Próxima sesión (opcional)
            </label>
            <input
              type="date"
              value={sessionFormData.next_session_date}
              onChange={(e) => setSessionFormData({ ...sessionFormData, next_session_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              value={sessionFormData.notes}
              onChange={(e) => setSessionFormData({ ...sessionFormData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              rows={3}
              placeholder="Comportamiento, problemas encontrados, etc..."
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowAddSession(false);
                setEditingSession(null);
                resetSessionForm();
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
              {loading ? 'Guardando...' : editingSession ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Formulario de horario
  const renderScheduleForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {editingSchedule ? '✏️ Editar Horario' : '📅 Nuevo Horario de Grooming'}
        </h3>
        
        <form onSubmit={handleScheduleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del horario *
            </label>
            <input
              type="text"
              value={scheduleFormData.name}
              onChange={(e) => setScheduleFormData({ ...scheduleFormData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              placeholder="Ej: Baño semanal, Grooming mensual..."
              required
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de grooming
            </label>
            <select
              value={scheduleFormData.grooming_type}
              onChange={(e) => setScheduleFormData({ ...scheduleFormData, grooming_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
            >
              {Object.entries(groomingTypes).map(([key, type]) => (
                <option key={key} value={key}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Frecuencia */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frecuencia
              </label>
              <select
                value={scheduleFormData.frequency_type}
                onChange={(e) => setScheduleFormData({ 
                  ...scheduleFormData, 
                  frequency_type: e.target.value,
                  frequency_value: 1 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              >
                {Object.entries(frequencies).map(([key, freq]) => (
                  <option key={key} value={key}>{freq.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cada
              </label>
              <select
                value={scheduleFormData.frequency_value}
                onChange={(e) => setScheduleFormData({ ...scheduleFormData, frequency_value: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              >
                {frequencies[scheduleFormData.frequency_type].options.map(option => (
                  <option key={option} value={option}>
                    {option} {scheduleFormData.frequency_type === 'weekly' ? 
                      (option === 1 ? 'semana' : 'semanas') :
                      (option === 1 ? 'mes' : 'meses')
                    }
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Día preferido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Día preferido
            </label>
            <select
              value={scheduleFormData.preferred_day}
              onChange={(e) => setScheduleFormData({ ...scheduleFormData, preferred_day: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
            >
              {weekDays.map(day => (
                <option key={day.value} value={day.value}>{day.label}</option>
              ))}
            </select>
          </div>

          {/* Servicios por defecto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Servicios incluidos
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {availableServices.map(service => (
                <label key={service.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={scheduleFormData.default_services.includes(service.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setScheduleFormData({
                          ...scheduleFormData,
                          default_services: [...scheduleFormData.default_services, service.id]
                        });
                      } else {
                        setScheduleFormData({
                          ...scheduleFormData,
                          default_services: scheduleFormData.default_services.filter(s => s !== service.id)
                        });
                      }
                    }}
                    className="rounded border-gray-300 text-[#56CCF2] focus:ring-[#56CCF2]"
                  />
                  <span className="text-sm">{service.icon} {service.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Costo estimado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Costo estimado
            </label>
            <input
              type="number"
              value={scheduleFormData.estimated_cost}
              onChange={(e) => setScheduleFormData({ ...scheduleFormData, estimated_cost: e.target.value })}
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
              value={scheduleFormData.notes}
              onChange={(e) => setScheduleFormData({ ...scheduleFormData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#56CCF2] focus:border-transparent"
              rows={2}
              placeholder="Instrucciones especiales..."
            />
          </div>

          {/* Activo */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={scheduleFormData.active}
                onChange={(e) => setScheduleFormData({ ...scheduleFormData, active: e.target.checked })}
                className="rounded border-gray-300 text-[#56CCF2] focus:ring-[#56CCF2]"
              />
              <span className="text-sm font-medium text-gray-700">Horario activo</span>
            </label>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowAddSchedule(false);
                setEditingSchedule(null);
                resetScheduleForm();
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
              {loading ? 'Guardando...' : editingSchedule ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
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
        <p className="text-gray-600 mb-6">Agrega un perro para gestionar su grooming</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderDogSelector()}
      {renderTabs()}
      
      {activeTab === 'schedule' && renderScheduleView()}
      {activeTab === 'history' && renderHistoryView()}

      {/* Modales */}
      {showAddSession && renderSessionForm()}
      {showAddSchedule && renderScheduleForm()}
      
      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-red-600">🗑️ Eliminar {showDeleteConfirm.type === 'session' ? 'Sesión' : 'Horario'}</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres eliminar este elemento?
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
                onClick={() => handleDelete(showDeleteConfirm.item, showDeleteConfirm.type)}
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

export default GroomingManager;