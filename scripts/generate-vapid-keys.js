// scripts/generate-vapid-keys.js
// 🔑 Genera VAPID keys reales para push notifications

import webpush from 'web-push';
import fs from 'fs';

console.log('🔑 Generando VAPID Keys para Club Canino...\n');

// Generar VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

// Crear contenido para .env
const envContent = `
# ============================================
# 🔔 VAPID KEYS PARA PUSH NOTIFICATIONS
# ============================================
VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"
VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"
VAPID_SUBJECT="mailto:admin@clubcaninodoshuellitas.com"
`;

// Guardar en archivo .env.vapid
fs.writeFileSync('.env.vapid', envContent.trim());

console.log('✅ VAPID Keys generadas exitosamente!\n');
console.log('📋 INFORMACIÓN GENERADA:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`🔑 PUBLIC KEY:  ${vapidKeys.publicKey}`);
console.log(`🔒 PRIVATE KEY: ${vapidKeys.privateKey}`);
console.log(`📧 SUBJECT:     mailto:admin@clubcaninodoshuellitas.com`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📝 PRÓXIMOS PASOS:');
console.log('1. Instalar dependencia: npm install web-push');
console.log('2. Ejecutar: node scripts/generate-vapid-keys.js');
console.log('3. Copiar las keys a las variables de entorno de Netlify:');
console.log('   - Site settings → Environment variables');
console.log('   - Agregar VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT');
console.log('4. Hacer deploy para activar las funciones');
console.log('\n🎯 ¡Después de esto las notificaciones push funcionarán!');