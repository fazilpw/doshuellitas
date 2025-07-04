// netlify/functions/manage-transport-routes.js
// 🚐 CRON JOB - GESTIÓN AUTOMÁTICA DE TRANSPORTE CLUB CANINO DOS HUELLITAS
// 
// HORARIOS COLOMBIA (UTC-5):
// 🌅 RECOGIDA: 4:50 AM - 7:00 AM (Cron: 50 9 * * 1-6)
// 🌆 ENTREGA: 2:30 PM (Cron: 30 19 * * 1-6)
//
// URL CRON: https://doshuellitas.netlify.app/.netlify/functions/manage-transport-routes

const { createClient } = require('@supabase/supabase-js');
const webpush = require('web-push');

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configurar VAPID para push notifications
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@doshuellitas.com',
  process.env.VAPID_PUBLIC_KEY, 
  process.env.VAPID_PRIVATE_KEY
);

exports.handler = async (event, context) => {
  const routeType = event.queryStringParameters?.type || 'pickup';
  const currentTime = new Date();
  const colombiaTime = new Date(currentTime.getTime() - (5 * 60 * 60 * 1000)); // UTC-5
  
  console.log(`🚐 [CRON] Gestión automática de transporte: ${routeType.toUpperCase()}`);
  console.log(`⏰ Hora Colombia: ${colombiaTime.toLocaleTimeString('es-CO')}`);
  
  try {
    const results = {
      routeType,
      timestamp: colombiaTime.toISOString(),
      dogsScheduled: 0,
      stopsCreated: 0,
      notificationsSent: 0,
      estimatedDuration: 0,
      errors: []
    };

    // ============================================
    // 📅 OBTENER PERROS PROGRAMADOS PARA HOY
    // ============================================
    const today = colombiaTime.toISOString().split('T')[0];
    const dayOfWeek = colombiaTime.getDay() || 7; // Domingo = 7
    
    // Solo días laborales (Lunes-Sábado)
    if (dayOfWeek === 7) {
      console.log('🏖️ Domingo - No hay transporte programado');
      return successResponse(results, 'Domingo - No hay servicio');
    }

    const { data: activeDogs, error: dogsError } = await supabase
      .from('dogs')
      .select(`
        *,
        owner:profiles(*),
        addresses:dog_addresses!dog_id(*)
      `)
      .eq('active', true);

    if (dogsError) throw dogsError;

    if (!activeDogs || activeDogs.length === 0) {
      console.log('📋 No hay perros activos programados');
      return successResponse(results, 'No hay perros programados');
    }

    // Filtrar perros que tienen direcciones válidas
    const eligibleDogs = activeDogs.filter(dog => 
      dog.addresses && 
      dog.addresses.length > 0 && 
      dog.addresses.some(addr => addr.active && addr.is_primary)
    );

    results.dogsScheduled = eligibleDogs.length;

    // ============================================
    // 🚗 OBTENER VEHÍCULO DISPONIBLE
    // ============================================
    const { data: availableVehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select(`
        *,
        current_driver:profiles(*)
      `)
      .eq('active', true)
      .limit(1)
      .single();

    if (vehicleError || !availableVehicle) {
      throw new Error('No hay vehículo disponible');
    }

    // ============================================
    // 📍 CREAR RUTA AUTOMÁTICA
    // ============================================
    const routeData = await createAutomaticRoute(
      availableVehicle, 
      eligibleDogs, 
      routeType, 
      colombiaTime,
      results
    );

    // ============================================
    // 🔔 ENVIAR NOTIFICACIONES AUTOMÁTICAS
    // ============================================
    await sendTransportNotifications(
      eligibleDogs, 
      routeData, 
      routeType, 
      results
    );

    // ============================================
    // 📊 REGISTRAR ACTIVIDAD EN LOGS
    // ============================================
    await supabase.from('notification_logs').insert({
      user_id: null, // Sistema automático
      title: `🚐 Gestión de transporte - ${routeType}`,
      body: `Procesados ${results.dogsScheduled} perros, ${results.notificationsSent} notificaciones enviadas`,
      category: 'transport',
      priority: 'medium',
      delivery_status: 'sent',
      sent_at: new Date().toISOString()
    });

    console.log('✅ [CRON] Gestión de transporte completada:', results);

    return successResponse(results, 'Gestión de transporte completada exitosamente');

  } catch (error) {
    console.error('❌ [CRON] Error en gestión de transporte:', error);
    
    // Log del error en base de datos
    await supabase.from('notification_logs').insert({
      user_id: null,
      title: '❌ Error en gestión de transporte',
      body: `Error: ${error.message}`,
      category: 'transport',
      priority: 'high',
      delivery_status: 'failed',
      sent_at: new Date().toISOString()
    });

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

// ============================================
// 🗺️ CREAR RUTA AUTOMÁTICA OPTIMIZADA
// ============================================
async function createAutomaticRoute(vehicle, dogs, routeType, currentTime, results) {
  console.log(`🗺️ Creando ruta automática de ${routeType} para ${dogs.length} perros`);

  // Configurar horarios según tipo de ruta
  const scheduleConfig = getScheduleConfig(routeType, currentTime);
  
  // Crear registro de ruta principal
  const { data: route, error: routeError } = await supabase
    .from('vehicle_routes')
    .insert({
      vehicle_id: vehicle.id,
      driver_id: vehicle.current_driver_id,
      dog_ids: dogs.map(d => d.id),
      route_type: routeType,
      route_name: `${routeType.toUpperCase()} - ${currentTime.toLocaleDateString('es-CO')}`,
      status: 'planned',
      scheduled_start_time: scheduleConfig.startTime,
      scheduled_end_time: scheduleConfig.endTime,
      estimated_duration_minutes: scheduleConfig.estimatedDuration,
      pickup_addresses: routeType === 'pickup' ? dogs.map(d => d.addresses[0]?.full_address).filter(Boolean) : [],
      delivery_addresses: routeType === 'delivery' ? dogs.map(d => d.addresses[0]?.full_address).filter(Boolean) : [],
      notes: `Ruta automática generada por cron job`,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (routeError) throw routeError;

  // ============================================
  // 📍 CREAR PARADAS OPTIMIZADAS
  // ============================================
  const stops = await createOptimizedStops(route.id, dogs, routeType, scheduleConfig);
  results.stopsCreated = stops.length;
  results.estimatedDuration = scheduleConfig.estimatedDuration;

  console.log(`✅ Ruta creada: ${stops.length} paradas, duración estimada: ${scheduleConfig.estimatedDuration} min`);

  return {
    routeId: route.id,
    vehicleInfo: vehicle,
    stops: stops,
    schedule: scheduleConfig
  };
}

// ============================================
// 📍 CREAR PARADAS OPTIMIZADAS POR ZONA
// ============================================
async function createOptimizedStops(routeId, dogs, routeType, schedule) {
  console.log('📍 Creando paradas optimizadas...');

  const stops = [];
  const stopIntervalMinutes = Math.floor(schedule.estimatedDuration / dogs.length);

  for (let i = 0; i < dogs.length; i++) {
    const dog = dogs[i];
    const primaryAddress = dog.addresses.find(addr => addr.is_primary && addr.active);
    
    if (!primaryAddress) {
      console.warn(`⚠️ Perro ${dog.name} sin dirección primaria válida`);
      continue;
    }

    const stopTime = new Date(schedule.startTime.getTime() + (i * stopIntervalMinutes * 60 * 1000));
    
    const stopData = {
      route_id: routeId,
      dog_id: dog.id,
      stop_type: routeType === 'pickup' ? 'pickup' : 'delivery',
      stop_order: i + 1,
      address: primaryAddress.full_address,
      latitude: primaryAddress.latitude,
      longitude: primaryAddress.longitude,
      scheduled_time: stopTime.toISOString(),
      estimated_arrival_time: stopTime.toISOString(),
      status: 'pending',
      contact_name: primaryAddress.contact_name || dog.owner?.full_name || 'Propietario',
      contact_phone: primaryAddress.contact_phone || dog.owner?.phone,
      address_notes: primaryAddress.access_instructions,
      special_requirements: primaryAddress.special_notes,
      created_at: new Date().toISOString()
    };

    const { data: stop, error: stopError } = await supabase
      .from('route_stops')
      .insert(stopData)
      .select()
      .single();

    if (stopError) {
      console.error(`❌ Error creando parada para ${dog.name}:`, stopError);
      continue;
    }

    stops.push({
      ...stop,
      dogName: dog.name,
      ownerName: dog.owner?.full_name
    });
  }

  return stops;
}

// ============================================
// 🔔 ENVIAR NOTIFICACIONES AUTOMÁTICAS
// ============================================
async function sendTransportNotifications(dogs, routeData, routeType, results) {
  console.log(`🔔 Enviando notificaciones de ${routeType} a ${dogs.length} propietarios...`);

  const notifications = [];

  for (const dog of dogs) {
    if (!dog.owner?.id) continue;

    const stop = routeData.stops.find(s => s.dog_id === dog.id);
    const estimatedTime = stop ? new Date(stop.scheduled_time).toLocaleTimeString('es-CO', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }) : 'Por confirmar';

    // Crear notificación principal
    const notificationData = {
      user_id: dog.owner.id,
      dog_id: dog.id,
      title: routeType === 'pickup' 
        ? `🚐 Transporte de recogida programado` 
        : `🏠 Transporte de entrega programado`,
      message: routeType === 'pickup'
        ? `El transporte pasará a recoger a ${dog.name} aproximadamente a las ${estimatedTime}. Te enviaremos actualizaciones en tiempo real.`
        : `El transporte entregará a ${dog.name} aproximadamente a las ${estimatedTime}. Te notificaremos cuando esté cerca.`,
      type: 'info',
      category: 'transport',
      priority: 'medium',
      data: {
        routeId: routeData.routeId,
        stopId: stop?.id,
        dogId: dog.id,
        routeType: routeType,
        estimatedTime: estimatedTime,
        vehicleInfo: {
          plate: routeData.vehicleInfo.license_plate,
          driver: routeData.vehicleInfo.current_driver?.full_name
        }
      },
      action_url: `/dashboard/parent/${dog.owner.id}?tab=transport`,
      action_label: 'Ver seguimiento',
      created_at: new Date().toISOString()
    };

    const { data: notification, error: notifyError } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();

    if (notifyError) {
      console.error(`❌ Error creando notificación para ${dog.name}:`, notifyError);
      results.errors.push(`Notificación ${dog.name}: ${notifyError.message}`);
      continue;
    }

    notifications.push(notification);

    // ============================================
    // 📱 ENVIAR PUSH NOTIFICATION
    // ============================================
    await sendPushNotification(dog.owner.id, notificationData);
  }

  results.notificationsSent = notifications.length;
  console.log(`✅ ${notifications.length} notificaciones enviadas exitosamente`);

  return notifications;
}

// ============================================
// 📱 ENVIAR PUSH NOTIFICATION
// ============================================
async function sendPushNotification(userId, notificationData) {
  try {
    // Obtener suscripciones push del usuario
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`📱 Usuario ${userId} sin suscripciones push activas`);
      return;
    }

    const pushPayload = JSON.stringify({
      title: notificationData.title,
      body: notificationData.message,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: `transport-${notificationData.data.routeType}`,
      data: {
        ...notificationData.data,
        url: notificationData.action_url,
        timestamp: Date.now()
      },
      actions: [
        {
          action: 'view',
          title: 'Ver seguimiento'
        },
        {
          action: 'close',
          title: 'Cerrar'
        }
      ],
      requireInteraction: true
    });

    // Enviar a todas las suscripciones del usuario
    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh_key,
              auth: subscription.auth_key
            }
          },
          pushPayload
        );
        console.log(`📱 Push enviado exitosamente a usuario ${userId}`);
      } catch (pushError) {
        console.error(`❌ Error enviando push a ${userId}:`, pushError);
        
        // Desactivar suscripción si está expirada
        if (pushError.statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('id', subscription.id);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error en push notifications:', error);
  }
}

// ============================================
// ⏰ CONFIGURACIÓN DE HORARIOS
// ============================================
function getScheduleConfig(routeType, currentTime) {
  const baseDate = new Date(currentTime);
  
  if (routeType === 'pickup') {
    // RECOGIDA: 4:50 AM - 7:00 AM
    const startTime = new Date(baseDate);
    startTime.setHours(4, 50, 0, 0);
    
    const endTime = new Date(baseDate);
    endTime.setHours(7, 0, 0, 0);
    
    return {
      startTime,
      endTime,
      estimatedDuration: 130, // 2 horas 10 minutos
      description: 'Recogida matutina'
    };
  } else {
    // ENTREGA: 2:30 PM - 4:00 PM (estimado)
    const startTime = new Date(baseDate);
    startTime.setHours(14, 30, 0, 0);
    
    const endTime = new Date(baseDate);
    endTime.setHours(16, 0, 0, 0);
    
    return {
      startTime,
      endTime,
      estimatedDuration: 90, // 1 hora 30 minutos
      description: 'Entrega vespertina'
    };
  }
}

// ============================================
// ✅ RESPUESTA EXITOSA
// ============================================
function successResponse(results, message) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      success: true,
      message: message,
      results: results,
      timestamp: new Date().toISOString()
    })
  };
}