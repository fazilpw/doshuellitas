// src/utils/medical-utils.js - FUNCIONES MÉDICAS UTILIDAD

// 📅 CÁLCULO DE FECHAS Y VENCIMIENTOS
export const calculateVaccineDueDate = (lastVaccineDate, vaccineType) => {
  const date = new Date(lastVaccineDate);
  
  const intervals = {
    'DHPP': 365, // 1 año
    'Rabia': 365, // 1 año  
    'Bordetella': 180, // 6 meses
    'Leptospirosis': 365, // 1 año
    'Puppy_DHPP': 21, // 3 semanas para cachorros
    'Deworming': 90, // 3 meses
  };
  
  const days = intervals[vaccineType] || 365;
  date.setDate(date.getDate() + days);
  
  return date.toISOString().split('T')[0];
};

export const calculateMedicineDueDate = (lastDoseDate, frequency) => {
  const date = new Date(lastDoseDate);
  
  const intervals = {
    'daily': 1,
    'weekly': 7,
    'monthly': 30,
    'every_3_months': 90,
    'every_6_months': 180,
    'as_needed': null
  };
  
  const days = intervals[frequency];
  if (!days) return null;
  
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

export const getDaysUntilDue = (dueDate) => {
  if (!dueDate) return null;
  
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

export const getVaccineStatus = (vaccine) => {
  if (!vaccine.next_due_date) return { status: 'no_date', days: null };
  
  const days = getDaysUntilDue(vaccine.next_due_date);
  
  if (days < 0) return { status: 'overdue', days: Math.abs(days) };
  if (days <= 7) return { status: 'urgent', days };
  if (days <= 30) return { status: 'upcoming', days };
  return { status: 'current', days };
};

// 🏥 VALIDACIONES MÉDICAS
export const validateVaccineData = (vaccineData) => {
  const errors = [];
  
  if (!vaccineData.vaccine_name?.trim()) {
    errors.push('El nombre de la vacuna es requerido');
  }
  
  if (!vaccineData.date_administered) {
    errors.push('La fecha de administración es requerida');
  }
  
  if (new Date(vaccineData.date_administered) > new Date()) {
    errors.push('La fecha de administración no puede ser en el futuro');
  }
  
  if (!vaccineData.vaccine_type) {
    errors.push('El tipo de vacuna es requerido');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateMedicineData = (medicineData) => {
  const errors = [];
  
  if (!medicineData.medicine_name?.trim()) {
    errors.push('El nombre del medicamento es requerido');
  }
  
  if (!medicineData.dosage?.trim()) {
    errors.push('La dosis es requerida');
  }
  
  if (!medicineData.start_date) {
    errors.push('La fecha de inicio es requerida');
  }
  
  if (medicineData.end_date && 
      new Date(medicineData.end_date) <= new Date(medicineData.start_date)) {
    errors.push('La fecha de fin debe ser posterior a la fecha de inicio');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// 📊 ANÁLISIS Y ESTADÍSTICAS
export const analyzeDogMedicalHealth = (dogId, vaccines, medicines, alerts) => {
  const dogVaccines = vaccines.filter(v => v.dog_id === dogId);
  const dogMedicines = medicines.filter(m => m.dog_id === dogId);
  const dogAlerts = alerts.filter(a => a.dog_id === dogId);
  
  const analysis = {
    healthScore: 100,
    issues: [],
    recommendations: [],
    status: 'good' // good, warning, critical
  };
  
  // Verificar vacunas vencidas
  const overdueVaccines = dogVaccines.filter(v => {
    const status = getVaccineStatus(v);
    return status.status === 'overdue';
  });
  
  if (overdueVaccines.length > 0) {
    analysis.healthScore -= (overdueVaccines.length * 20);
    analysis.issues.push(`${overdueVaccines.length} vacuna(s) vencida(s)`);
    analysis.recommendations.push('Programar cita veterinaria para actualizar vacunas');
    analysis.status = 'warning';
  }
  
  // Verificar alertas críticas
  const criticalAlerts = dogAlerts.filter(a => 
    a.severity === 'critical' && a.is_active
  );
  
  if (criticalAlerts.length > 0) {
    analysis.healthScore -= (criticalAlerts.length * 30);
    analysis.issues.push(`${criticalAlerts.length} alerta(s) crítica(s)`);
    analysis.recommendations.push('Revisar inmediatamente las alertas críticas');
    analysis.status = 'critical';
  }
  
  // Verificar medicinas que requieren monitoreo
  const monitoringMedicines = dogMedicines.filter(m => 
    m.requires_monitoring && m.is_ongoing
  );
  
  if (monitoringMedicines.length > 0) {
    analysis.healthScore -= (monitoringMedicines.length * 5);
    analysis.issues.push(`${monitoringMedicines.length} medicina(s) requieren monitoreo`);
    analysis.recommendations.push('Realizar seguimiento regular de medicamentos');
  }
  
  // Asegurar que el score no sea negativo
  analysis.healthScore = Math.max(0, analysis.healthScore);
  
  return analysis;
};

export const generateMedicalReport = (dogId, dogName, vaccines, medicines, alerts) => {
  const analysis = analyzeDogMedicalHealth(dogId, vaccines, medicines, alerts);
  const dogVaccines = vaccines.filter(v => v.dog_id === dogId);
  const dogMedicines = medicines.filter(m => m.dog_id === dogId);
  const dogAlerts = alerts.filter(a => a.dog_id === dogId);
  
  const report = {
    dogId,
    dogName,
    generatedAt: new Date().toISOString(),
    healthScore: analysis.healthScore,
    status: analysis.status,
    summary: {
      totalVaccines: dogVaccines.length,
      currentVaccines: dogVaccines.filter(v => getVaccineStatus(v).status === 'current').length,
      overdueVaccines: dogVaccines.filter(v => getVaccineStatus(v).status === 'overdue').length,
      activeMedicines: dogMedicines.filter(m => m.is_ongoing).length,
      totalAlerts: dogAlerts.length,
      criticalAlerts: dogAlerts.filter(a => a.severity === 'critical').length
    },
    issues: analysis.issues,
    recommendations: analysis.recommendations,
    nextActions: generateNextActions(dogVaccines, dogMedicines, dogAlerts)
  };
  
  return report;
};

const generateNextActions = (vaccines, medicines, alerts) => {
  const actions = [];
  
  // Próximas vacunas (próximos 30 días)
  const upcomingVaccines = vaccines.filter(v => {
    const status = getVaccineStatus(v);
    return status.status === 'upcoming' || status.status === 'urgent';
  }).sort((a, b) => new Date(a.next_due_date) - new Date(b.next_due_date));
  
  upcomingVaccines.forEach(vaccine => {
    const days = getDaysUntilDue(vaccine.next_due_date);
    actions.push({
      type: 'vaccine',
      priority: days <= 7 ? 'high' : 'medium',
      description: `Vacuna ${vaccine.vaccine_name}`,
      dueDate: vaccine.next_due_date,
      daysUntilDue: days
    });
  });
  
  // Próximas dosis de medicinas
  const upcomingMedicines = medicines.filter(m => 
    m.is_ongoing && m.next_dose_date
  ).sort((a, b) => new Date(a.next_dose_date) - new Date(b.next_dose_date));
  
  upcomingMedicines.slice(0, 3).forEach(medicine => {
    const days = getDaysUntilDue(medicine.next_dose_date);
    actions.push({
      type: 'medicine',
      priority: days <= 1 ? 'high' : 'low',
      description: `Dosis de ${medicine.medicine_name}`,
      dueDate: medicine.next_dose_date,
      daysUntilDue: days
    });
  });
  
  return actions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};

// 🔔 SISTEMA DE NOTIFICACIONES MÉDICAS
export const generateMedicalNotifications = (vaccines, medicines, alerts) => {
  const notifications = [];
  
  // Notificaciones de vacunas
  vaccines.forEach(vaccine => {
    const status = getVaccineStatus(vaccine);
    
    if (status.status === 'overdue') {
      notifications.push({
        type: 'vaccine_overdue',
        priority: 'critical',
        title: `Vacuna ${vaccine.vaccine_name} vencida`,
        message: `La vacuna está vencida desde hace ${status.days} días`,
        vaccineId: vaccine.id,
        dogId: vaccine.dog_id
      });
    } else if (status.status === 'urgent') {
      notifications.push({
        type: 'vaccine_urgent',
        priority: 'high',
        title: `Vacuna ${vaccine.vaccine_name} próxima`,
        message: `La vacuna vence en ${status.days} días`,
        vaccineId: vaccine.id,
        dogId: vaccine.dog_id
      });
    }
  });
  
  // Notificaciones de medicinas
  medicines.filter(m => m.requires_monitoring).forEach(medicine => {
    notifications.push({
      type: 'medicine_monitoring',
      priority: 'medium',
      title: `Monitoreo de ${medicine.medicine_name}`,
      message: 'Este medicamento requiere seguimiento regular',
      medicineId: medicine.id,
      dogId: medicine.dog_id
    });
  });
  
  // Notificaciones de alertas críticas
  alerts.filter(a => a.severity === 'critical' && a.is_active).forEach(alert => {
    notifications.push({
      type: 'critical_alert',
      priority: 'critical',
      title: alert.title,
      message: alert.description,
      alertId: alert.id,
      dogId: alert.dog_id
    });
  });
  
  return notifications.sort((a, b) => {
    const priorityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};

// 📋 TEMPLATES DE DATOS
export const getVaccineTemplates = () => ({
  core: [
    { name: 'DHPP', critical: true, interval: 365 },
    { name: 'Rabia', critical: true, interval: 365 }
  ],
  nonCore: [
    { name: 'Bordetella', critical: false, interval: 180 },
    { name: 'Leptospirosis', critical: false, interval: 365 }
  ],
  puppy: [
    { name: 'Primera DHPP', critical: true, ageWeeks: 6 },
    { name: 'Segunda DHPP', critical: true, ageWeeks: 9 },
    { name: 'Tercera DHPP + Rabia', critical: true, ageWeeks: 12 },
    { name: 'Cuarta DHPP', critical: true, ageWeeks: 16 }
  ]
});

export const getMedicineTemplates = () => ({
  deworming: [
    { name: 'Desparasitante interno', frequency: 'monthly' },
    { name: 'Desparasitante externo', frequency: 'monthly' }
  ],
  fleaTick: [
    { name: 'Bravecto', frequency: 'every_3_months' },
    { name: 'NexGard', frequency: 'monthly' },
    { name: 'Seresto (collar)', frequency: 'every_6_months' }
  ],
  supplements: [
    { name: 'Omega 3', frequency: 'daily' },
    { name: 'Multivitamínico', frequency: 'daily' },
    { name: 'Probióticos', frequency: 'daily' }
  ]
});

// Función para formatear fechas en español
export const formatDateToSpanish = (dateString) => {
  if (!dateString) return 'No especificado';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Función para obtener el color del estado
export const getStatusColor = (status) => {
  const colors = {
    current: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    upcoming: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
    urgent: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
    overdue: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
    no_date: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' }
  };
  
  return colors[status] || colors.no_date;
};

export default {
  calculateVaccineDueDate,
  calculateMedicineDueDate,
  getDaysUntilDue,
  getVaccineStatus,
  validateVaccineData,
  validateMedicineData,
  analyzeDogMedicalHealth,
  generateMedicalReport,
  generateMedicalNotifications,
  getVaccineTemplates,
  getMedicineTemplates,
  formatDateToSpanish,
  getStatusColor
};