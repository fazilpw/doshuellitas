// functions/index.js
// ⚡ CLOUD FUNCTIONS PARA CLUB CANINO DOS HUELLITAS

const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

// Inicializar Firebase Admin
admin.initializeApp();

// Configuración global
setGlobalOptions({ 
  maxInstances: 10,
  region: "southamerica-east1" // Cercano a Colombia
});

// ============================================
// 🌱 FUNCIÓN: CREAR DATOS DE PRUEBA
// ============================================
exports.seedTestData = onRequest({ cors: true }, async (req, res) => {
  try {
    logger.info("🌱 Creando datos de prueba para Club Canino...");
    
    const db = admin.firestore();
    
    // 👥 Usuarios de prueba
    const testUsers = [
      {
        id: 'padre-test-001',
        email: 'maria@test.com',
        role: 'padre',
        fullName: 'María García Test',
        phone: '3007654321',
        clubMemberSince: new Date(),
        createdAt: new Date()
      },
      {
        id: 'profesor-test-001',
        email: 'profesor@test.com', 
        role: 'profesor',
        fullName: 'Carlos Profesor Test',
        phone: '3001234567',
        clubMemberSince: new Date(),
        createdAt: new Date()
      },
      {
        id: 'admin-test-001',
        email: 'admin@test.com',
        role: 'admin', 
        fullName: 'Juan Pablo Admin Test',
        phone: '3144329824',
        clubMemberSince: new Date(),
        createdAt: new Date()
      }
    ];
    
    // Crear usuarios
    for (const user of testUsers) {
      await db.doc(`users/${user.id}`).set(user);
      logger.info(`✅ Usuario creado: ${user.email}`);
      
      // 🐕 Crear perros solo para padres
      if (user.role === 'padre') {
        const testDogs = [
          {
            name: 'Max Test',
            breed: 'Golden Retriever',
            size: 'grande',
            age: 3,
            weight: 25.5,
            color: 'dorado',
            active: true,
            createdAt: new Date()
          },
          {
            name: 'Luna Test',
            breed: 'Beagle', 
            size: 'mediano',
            age: 2,
            weight: 12.3,
            color: 'tricolor',
            active: true,
            createdAt: new Date()
          }
        ];
        
        for (let i = 0; i < testDogs.length; i++) {
          const dogId = `dog-test-${user.id}-${i + 1}`;
          await db.doc(`users/${user.id}/dogs/${dogId}`).set(testDogs[i]);
          
          // 📊 Crear evaluaciones de ejemplo
          const evaluations = [
            {
              date: new Date().toISOString().split('T')[0],
              location: 'casa',
              evaluatorId: user.id,
              evaluatorName: user.fullName,
              metrics: {
                energy: 7,
                sociability: 8,
                obedience: 6,
                anxiety: 4
              },
              behaviors: {
                barksMuch: 'normal',
                begsFood: 'a_veces',
                destructive: 'nunca',
                socialWithDogs: 'mucho'
              },
              notes: 'Comportamiento excelente en casa',
              highlights: 'Muy sociable con otros perros',
              concerns: 'Un poco ansioso durante tormentas',
              createdAt: new Date()
            },
            {
              date: new Date(Date.now() - 24*60*60*1000).toISOString().split('T')[0], // Ayer
              location: 'colegio',
              evaluatorId: 'profesor-test-001',
              evaluatorName: 'Carlos Profesor Test',
              metrics: {
                energy: 8,
                sociability: 9,
                obedience: 7,
                anxiety: 3
              },
              behaviors: {
                barksMuch: 'poco',
                begsFood: 'nunca',
                destructive: 'nunca',
                socialWithDogs: 'mucho'
              },
              notes: 'Excelente día en el colegio',
              highlights: 'Líder natural en actividades grupales',
              concerns: 'Ninguna preocupación',
              createdAt: new Date(Date.now() - 24*60*60*1000)
            }
          ];
          
          for (let j = 0; j < evaluations.length; j++) {
            const evalId = `eval-${dogId}-${j + 1}`;
            await db.doc(`users/${user.id}/dogs/${dogId}/evaluations/${evalId}`).set(evaluations[j]);
          }
          
          logger.info(`✅ Perro creado: ${testDogs[i].name} con ${evaluations.length} evaluaciones`);
        }
      }
    }
    
    // 📋 Templates de notificaciones
    const notificationTemplates = [
      {
        key: 'routine_reminder',
        category: 'routine',
        title: 'Hora de {routineName} para {dogName}',
        body: 'No olvides {action} de {dogName}',
        priority: 'medium',
        variables: ['dogName', 'routineName', 'action']
      },
      {
        key: 'evaluation_complete',
        category: 'behavior',
        title: 'Nueva evaluación de {dogName}',
        body: '{evaluatorName} evaluó a {dogName} en {location}',
        priority: 'medium',
        variables: ['dogName', 'evaluatorName', 'location']
      },
      {
        key: 'behavior_alert',
        category: 'behavior',
        title: 'Alerta de comportamiento: {dogName}',
        body: '{dogName} mostró {behavior}. Recomendación: {suggestion}',
        priority: 'high',
        variables: ['dogName', 'behavior', 'suggestion']
      }
    ];
    
    for (const template of notificationTemplates) {
      await db.doc(`notificationTemplates/${template.key}`).set({
        ...template,
        createdAt: new Date()
      });
    }
    
    logger.info("🎉 Datos de prueba creados exitosamente");
    
    res.status(200).json({
      success: true,
      message: 'Datos de prueba creados exitosamente',
      created: {
        users: testUsers.length,
        dogs: testUsers.filter(u => u.role === 'padre').length * 2,
        evaluations: testUsers.filter(u => u.role === 'padre').length * 2 * 2,
        templates: notificationTemplates.length
      }
    });
    
  } catch (error) {
    logger.error("❌ Error creando datos de prueba:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 📊 FUNCIÓN: PROCESAR NUEVA EVALUACIÓN
// ============================================
exports.processNewEvaluation = onDocumentCreated(
  "users/{userId}/dogs/{dogId}/evaluations/{evalId}",
  async (event) => {
    try {
      const { userId, dogId, evalId } = event.params;
      const evaluationData = event.data.data();
      
      logger.info(`📊 Procesando nueva evaluación: ${evalId} para perro ${dogId}`);
      
      const db = admin.firestore();
      
      // Obtener información del perro y dueño
      const [dogDoc, userDoc] = await Promise.all([
        db.doc(`users/${userId}/dogs/${dogId}`).get(),
        db.doc(`users/${userId}`).get()
      ]);
      
      if (!dogDoc.exists || !userDoc.exists) {
        logger.error("❌ Perro o usuario no encontrado");
        return;
      }
      
      const dogData = dogDoc.data();
      const userData = userDoc.data();
      
      // 📈 Actualizar estadísticas del perro
      await updateDogStatistics(userId, dogId, dogData.name);
      
      // 🔔 Crear notificación para el dueño
      await createNotification(userId, {
        title: `Nueva evaluación de ${dogData.name}`,
        message: `${evaluationData.evaluatorName} evaluó a ${dogData.name} en ${evaluationData.location}`,
        type: 'info',
        category: 'behavior',
        dogId: dogId,
        dogName: dogData.name,
        priority: 'medium',
        data: {
          evalId: evalId,
          location: evaluationData.location,
          evaluatorName: evaluationData.evaluatorName
        }
      });
      
      // 🚨 Detectar alertas de comportamiento
      await checkBehaviorAlerts(userId, dogId, dogData, evaluationData);
      
      logger.info(`✅ Evaluación procesada exitosamente: ${evalId}`);
      
    } catch (error) {
      logger.error("❌ Error procesando evaluación:", error);
    }
  }
);

// ============================================
// 🔔 FUNCIÓN: CREAR NOTIFICACIÓN
// ============================================
async function createNotification(userId, notificationData) {
  try {
    const db = admin.firestore();
    
    await db.collection(`users/${userId}/notifications`).add({
      ...notificationData,
      read: false,
      createdAt: new Date(),
      sentAt: new Date()
    });
    
    logger.info(`🔔 Notificación creada para usuario: ${userId}`);
    
  } catch (error) {
    logger.error("❌ Error creando notificación:", error);
  }
}

// ============================================
// 📈 FUNCIÓN: ACTUALIZAR ESTADÍSTICAS DEL PERRO
// ============================================
async function updateDogStatistics(userId, dogId, dogName) {
  try {
    const db = admin.firestore();
    
    // Obtener todas las evaluaciones del perro
    const evaluationsSnapshot = await db
      .collection(`users/${userId}/dogs/${dogId}/evaluations`)
      .orderBy('createdAt', 'desc')
      .get();
    
    const evaluations = evaluationsSnapshot.docs.map(doc => doc.data());
    
    if (evaluations.length === 0) return;
    
    // Calcular estadísticas
    const stats = calculateDogStats(evaluations);
    
    // Guardar en evaluationSummaries
    await db.doc(`evaluationSummaries/${dogId}`).set({
      dogId,
      dogName,
      ownerId: userId,
      stats,
      lastEvaluation: {
        date: evaluations[0].date,
        location: evaluations[0].location,
        evaluatorName: evaluations[0].evaluatorName
      },
      lastUpdated: new Date()
    }, { merge: true });
    
    logger.info(`📈 Estadísticas actualizadas para perro: ${dogId}`);
    
  } catch (error) {
    logger.error("❌ Error actualizando estadísticas:", error);
  }
}

// ============================================
// 🧮 FUNCIÓN: CALCULAR ESTADÍSTICAS
// ============================================
function calculateDogStats(evaluations) {
  const total = evaluations.length;
  const casaEvals = evaluations.filter(e => e.location === 'casa');
  const colegioEvals = evaluations.filter(e => e.location === 'colegio');
  
  const avgMetric = (metric) => {
    const values = evaluations
      .map(e => e.metrics?.[metric])
      .filter(v => v !== undefined && v !== null);
    return values.length > 0 
      ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
      : 0;
  };
  
  const avgByLocation = (evals, metric) => {
    const values = evals
      .map(e => e.metrics?.[metric])
      .filter(v => v !== undefined && v !== null);
    return values.length > 0 
      ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
      : 0;
  };
  
  return {
    totalEvaluations: total,
    averageEnergy: avgMetric('energy'),
    averageSociability: avgMetric('sociability'),
    averageObedience: avgMetric('obedience'),
    averageAnxiety: avgMetric('anxiety'),
    
    casa: {
      evaluations: casaEvals.length,
      avgEnergy: avgByLocation(casaEvals, 'energy'),
      avgSociability: avgByLocation(casaEvals, 'sociability'),
      avgObedience: avgByLocation(casaEvals, 'obedience'),
      avgAnxiety: avgByLocation(casaEvals, 'anxiety')
    },
    
    colegio: {
      evaluations: colegioEvals.length,
      avgEnergy: avgByLocation(colegioEvals, 'energy'),
      avgSociability: avgByLocation(colegioEvals, 'sociability'),
      avgObedience: avgByLocation(colegioEvals, 'obedience'),
      avgAnxiety: avgByLocation(colegioEvals, 'anxiety')
    }
  };
}

// ============================================
// 🚨 FUNCIÓN: DETECTAR ALERTAS DE COMPORTAMIENTO
// ============================================
async function checkBehaviorAlerts(userId, dogId, dogData, evaluationData) {
  try {
    const alerts = [];
    
    // Alerta: Ansiedad alta
    if (evaluationData.metrics?.anxiety >= 8) {
      alerts.push({
        type: 'high_anxiety',
        title: `Alta ansiedad detectada en ${dogData.name}`,
        message: `${dogData.name} mostró niveles altos de ansiedad (${evaluationData.metrics.anxiety}/10). Considera técnicas de relajación.`,
        priority: 'high',
        suggestions: [
          'Ejercicios de respiración profunda',
          'Música relajante para perros',
          'Evitar situaciones estresantes por hoy'
        ]
      });
    }
    
    // Alerta: Energía muy alta en casa
    if (evaluationData.location === 'casa' && evaluationData.metrics?.energy >= 9) {
      alerts.push({
        type: 'high_energy_home',
        title: `${dogData.name} con mucha energía en casa`,
        message: `Considera aumentar el tiempo de ejercicio para ${dogData.name}.`,
        priority: 'medium',
        suggestions: [
          'Paseo extra de 20 minutos',
          'Juegos de buscar en el parque',
          'Actividades mentales estimulantes'
        ]
      });
    }
    
    // Alerta: Comportamiento destructivo
    if (evaluationData.behaviors?.destructive === 'frecuente') {
      alerts.push({
        type: 'destructive_behavior',
        title: `Comportamiento destructivo en ${dogData.name}`,
        message: `${dogData.name} mostró comportamiento destructivo frecuente.`,
        priority: 'high',
        suggestions: [
          'Aumentar tiempo de ejercicio',
          'Proporcionar juguetes apropiados',
          'Considerar entrenamiento especializado'
        ]
      });
    }
    
    // Crear notificaciones para cada alerta
    for (const alert of alerts) {
      await createNotification(userId, {
        title: alert.title,
        message: alert.message,
        type: 'warning',
        category: 'alert',
        dogId: dogId,
        dogName: dogData.name,
        priority: alert.priority,
        data: {
          alertType: alert.type,
          suggestions: alert.suggestions,
          evaluationLocation: evaluationData.location
        }
      });
    }
    
    if (alerts.length > 0) {
      logger.info(`🚨 ${alerts.length} alertas creadas para perro: ${dogId}`);
    }
    
  } catch (error) {
    logger.error("❌ Error detectando alertas:", error);
  }
}

// ============================================
// 🧹 FUNCIÓN: LIMPIAR DATOS DE PRUEBA
// ============================================
exports.cleanTestData = onRequest({ cors: true }, async (req, res) => {
  try {
    logger.info("🧹 Limpiando datos de prueba...");
    
    const db = admin.firestore();
    
    // IDs de usuarios de prueba
    const testUserIds = ['padre-test-001', 'profesor-test-001', 'admin-test-001'];
    
    for (const userId of testUserIds) {
      // Eliminar usuario y todas sus sub-colecciones
      await deleteUserData(db, userId);
    }
    
    // Limpiar templates
    const templatesSnapshot = await db.collection('notificationTemplates').get();
    const deletePromises = templatesSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);
    
    // Limpiar summaries
    const summariesSnapshot = await db.collection('evaluationSummaries').get();
    const deleteSummaryPromises = summariesSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deleteSummaryPromises);
    
    logger.info("✅ Datos de prueba limpiados");
    
    res.status(200).json({
      success: true,
      message: 'Datos de prueba limpiados exitosamente'
    });
    
  } catch (error) {
    logger.error("❌ Error limpiando datos:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 🗑️ FUNCIÓN AUXILIAR: ELIMINAR DATOS DE USUARIO
// ============================================
async function deleteUserData(db, userId) {
  try {
    // Obtener perros del usuario
    const dogsSnapshot = await db.collection(`users/${userId}/dogs`).get();
    
    for (const dogDoc of dogsSnapshot.docs) {
      const dogId = dogDoc.id;
      
      // Eliminar evaluaciones del perro
      const evaluationsSnapshot = await db.collection(`users/${userId}/dogs/${dogId}/evaluations`).get();
      const evalDeletePromises = evaluationsSnapshot.docs.map(doc => doc.ref.delete());
      await Promise.all(evalDeletePromises);
      
      // Eliminar perro
      await dogDoc.ref.delete();
    }
    
    // Eliminar notificaciones del usuario
    const notificationsSnapshot = await db.collection(`users/${userId}/notifications`).get();
    const notifDeletePromises = notificationsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(notifDeletePromises);
    
    // Eliminar usuario
    await db.doc(`users/${userId}`).delete();
    
    logger.info(`🗑️ Datos eliminados para usuario: ${userId}`);
    
  } catch (error) {
    logger.error(`❌ Error eliminando datos de usuario ${userId}:`, error);
  }
}