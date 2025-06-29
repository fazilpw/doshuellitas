#!/usr/bin/env node
// scripts/verify-build.js
// 🔍 VERIFICADOR PRE-BUILD PARA NETLIFY - CLUB CANINO DOS HUELLITAS
// Detecta problemas de SSR/SSG antes del deploy

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync, readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// ===============================================
// 🎯 CONFIGURACIÓN DEL VERIFICADOR
// ===============================================

const CHECKS = {
  // Archivos que DEBEN usar client:only
  clientOnlyRequired: [
    'src/pages/dashboard/admin.astro',
    'src/pages/dashboard/padre.astro', 
    'src/pages/dashboard/profesor.astro',
    'src/pages/dashboard/conductor.astro',
    'src/pages/app.astro',
    'src/pages/app-padre.astro',
    'src/pages/app-maestro.astro'
  ],
  
  // Componentes que NO deben usar useAuth en el nivel superior
  noTopLevelUseAuth: [
    'src/components/dashboard/AdminDashboard.jsx',
    'src/components/dashboard/ParentDashboard.jsx',
    'src/components/dashboard/TeacherDashboard.jsx'
  ],
  
  // Patrones problemáticos en archivos .astro
  astroAntiPatterns: [
    /client:load.*useAuth/,
    /AuthProvider.*client:load/,
    /useAuth\(\).*(?!client:only)/
  ]
};

// ===============================================
// 🚀 FUNCIÓN PRINCIPAL
// ===============================================

async function main() {
  console.log('🔍 Club Canino - Verificador Pre-Build para Netlify');
  console.log('='.repeat(55));
  
  let errors = 0;
  let warnings = 0;
  
  try {
    // 1. Verificar archivos que requieren client:only
    console.log('\n📋 Verificando directivas client:only...');
    const clientOnlyErrors = await checkClientOnlyDirectives();
    errors += clientOnlyErrors;
    
    // 2. Verificar uso de useAuth en componentes
    console.log('\n🔐 Verificando uso de useAuth...');
    const useAuthErrors = await checkUseAuthUsage();
    errors += useAuthErrors;
    
    // 3. Verificar patrones problemáticos en .astro
    console.log('\n🚀 Verificando archivos .astro...');
    const astroErrors = await checkAstroFiles();
    errors += astroErrors;
    
    // 4. Verificar variables de entorno críticas
    console.log('\n🔧 Verificando configuración...');
    const configWarnings = await checkEnvironmentConfig();
    warnings += configWarnings;
    
    // 5. Verificar estructura de archivos críticos
    console.log('\n📁 Verificando estructura de archivos...');
    const structureErrors = await checkFileStructure();
    errors += structureErrors;
    
    // Resumen final
    console.log('\n' + '='.repeat(55));
    if (errors > 0) {
      console.log(`❌ ${errors} errores encontrados que impedirán el build`);
      console.log('🔧 Corrige estos errores antes de hacer deploy');
      process.exit(1);
    } else if (warnings > 0) {
      console.log(`⚠️  ${warnings} advertencias encontradas`);
      console.log('✅ El build debería funcionar, pero revisa las advertencias');
      process.exit(0);
    } else {
      console.log('✅ Todo correcto - El build debería funcionar en Netlify');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n❌ Error ejecutando verificación:', error.message);
    process.exit(1);
  }
}

// ===============================================
// 🔧 FUNCIONES DE VERIFICACIÓN
// ===============================================

async function checkClientOnlyDirectives() {
  let errors = 0;
  
  for (const filePath of CHECKS.clientOnlyRequired) {
    const fullPath = join(projectRoot, filePath);
    
    if (!existsSync(fullPath)) {
      console.log(`   ⚠️  Archivo no encontrado: ${filePath}`);
      continue;
    }
    
    const content = readFileSync(fullPath, 'utf8');
    
    // Verificar que usa client:only y no client:load
    if (content.includes('client:load')) {
      console.error(`   ❌ ${filePath}: Usa client:load en lugar de client:only`);
      console.error(`      💡 Cambiar a: client:only="react"`);
      errors++;
    } else if (content.includes('client:only')) {
      console.log(`   ✅ ${filePath}: Usa client:only correctamente`);
    } else {
      console.error(`   ❌ ${filePath}: No tiene directiva client:only`);
      console.error(`      💡 Agregar: client:only="react"`);
      errors++;
    }
  }
  
  return errors;
}

async function checkUseAuthUsage() {
  let errors = 0;
  
  for (const filePath of CHECKS.noTopLevelUseAuth) {
    const fullPath = join(projectRoot, filePath);
    
    if (!existsSync(fullPath)) {
      console.log(`   ⚠️  Archivo no encontrado: ${filePath}`);
      continue;
    }
    
    const content = readFileSync(fullPath, 'utf8');
    
    // Verificar uso de useAuth en el nivel superior
    const lines = content.split('\n');
    let topLevelUseAuth = false;
    let insideFunction = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detectar inicio de función/componente
      if (line.includes('export default function') || line.includes('const ') && line.includes('= () =>')) {
        insideFunction = true;
        continue;
      }
      
      // Detectar useAuth en las primeras líneas del componente
      if (insideFunction && line.includes('useAuth') && i < 20) {
        topLevelUseAuth = true;
        break;
      }
      
      // Si encontramos otro hook o lógica, ya no estamos en el nivel superior
      if (insideFunction && (line.includes('useState') || line.includes('useEffect'))) {
        break;
      }
    }
    
    if (topLevelUseAuth) {
      console.error(`   ❌ ${filePath}: useAuth() en el nivel superior del componente`);
      console.error(`      💡 Envolver con DashboardWrapper o verificar isClient`);
      errors++;
    } else {
      console.log(`   ✅ ${filePath}: useAuth() usado correctamente`);
    }
  }
  
  return errors;
}

async function checkAstroFiles() {
  let errors = 0;
  
  const astroFiles = findFiles(join(projectRoot, 'src/pages'), '.astro');
  
  for (const file of astroFiles) {
    const content = readFileSync(file, 'utf8');
    const relativePath = file.replace(projectRoot + '/', '');
    
    for (const pattern of CHECKS.astroAntiPatterns) {
      if (pattern.test(content)) {
        console.error(`   ❌ ${relativePath}: Patrón problemático detectado`);
        console.error(`      💡 Usar client:only="react" para componentes con useAuth`);
        errors++;
      }
    }
  }
  
  if (errors === 0) {
    console.log('   ✅ Archivos .astro sin patrones problemáticos');
  }
  
  return errors;
}

async function checkEnvironmentConfig() {
  let warnings = 0;
  
  // Variables críticas para el build
  const requiredVars = [
    'PUBLIC_SUPABASE_URL',
    'PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  const envFile = join(projectRoot, '.env.local');
  const hasEnvFile = existsSync(envFile);
  
  if (!hasEnvFile) {
    console.log('   ⚠️  Archivo .env.local no encontrado (normal en Netlify)');
    console.log('   📝 Asegúrate de configurar variables en Netlify Dashboard');
    warnings++;
  }
  
  // Verificar que netlify.toml tenga las variables configuradas
  const netlifyConfig = join(projectRoot, 'netlify.toml');
  if (existsSync(netlifyConfig)) {
    const content = readFileSync(netlifyConfig, 'utf8');
    let missingVars = 0;
    
    for (const varName of requiredVars) {
      if (!content.includes(varName)) {
        console.log(`   ⚠️  Variable ${varName} no listada en netlify.toml`);
        missingVars++;
      }
    }
    
    if (missingVars === 0) {
      console.log('   ✅ Variables de entorno configuradas en netlify.toml');
    } else {
      warnings += missingVars;
    }
  } else {
    console.log('   ⚠️  netlify.toml no encontrado');
    warnings++;
  }
  
  return warnings;
}

async function checkFileStructure() {
  let errors = 0;
  
  // Archivos críticos que deben existir
  const criticalFiles = [
    'src/components/dashboard/DashboardWrapper.jsx',
    'src/components/auth/AuthProvider.jsx',
    'src/lib/authService.js',
    'src/lib/supabase.js'
  ];
  
  for (const file of criticalFiles) {
    const fullPath = join(projectRoot, file);
    if (!existsSync(fullPath)) {
      console.error(`   ❌ Archivo crítico faltante: ${file}`);
      errors++;
    } else {
      console.log(`   ✅ ${file}`);
    }
  }
  
  return errors;
}

// ===============================================
// 🛠️ UTILIDADES
// ===============================================

function findFiles(dir, extension) {
  const files = [];
  
  if (!existsSync(dir)) return files;
  
  function scan(currentDir) {
    const items = readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = join(currentDir, item);
      
      try {
        const stat = require('fs').statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scan(fullPath);
        } else if (stat.isFile() && item.endsWith(extension)) {
          files.push(fullPath);
        }
      } catch (error) {
        // Ignorar errores de acceso a archivos
      }
    }
  }
  
  scan(dir);
  return files;
}

// ===============================================
// 🚀 EJECUTAR
// ===============================================

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as verifyBuild };