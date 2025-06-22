// src/components/ConfigBanner.jsx - Banner de configuración para Netlify
import { useState, useEffect } from 'react';

const ConfigBanner = () => {
  const [isConfigured, setIsConfigured] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Verificar si Supabase está configurado
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    
    const configured = supabaseUrl && 
                      supabaseKey && 
                      supabaseUrl !== 'https://placeholder.supabase.co' && 
                      supabaseKey !== 'placeholder-key';
    
    setIsConfigured(configured);
  }, []);

  // No mostrar nada mientras se verifica
  if (isConfigured === null) return null;

  // Si está configurado, no mostrar banner
  if (isConfigured) return null;

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-2xl mr-3">⚠️</span>
            <div>
              <div className="font-bold">Configuración Pendiente</div>
              <div className="text-sm opacity-90">
                Configura Supabase para habilitar todas las funcionalidades
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {showInstructions ? 'Ocultar' : 'Configurar'}
          </button>
        </div>
        
        {showInstructions && (
          <div className="mt-4 bg-white bg-opacity-10 rounded-lg p-4">
            <h3 className="font-bold mb-3">🔧 Cómo Configurar Supabase en Netlify</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              
              {/* Paso 1 */}
              <div className="bg-white bg-opacity-10 rounded-lg p-3">
                <h4 className="font-bold mb-2">📋 1. Obtener Credenciales</h4>
                <ol className="space-y-1 text-xs">
                  <li>• Ve a <a href="https://supabase.com/dashboard" target="_blank" className="underline">supabase.com/dashboard</a></li>
                  <li>• Selecciona tu proyecto</li>
                  <li>• Ve a Settings → API</li>
                  <li>• Copia URL y anon key</li>
                </ol>
              </div>
              
              {/* Paso 2 */}
              <div className="bg-white bg-opacity-10 rounded-lg p-3">
                <h4 className="font-bold mb-2">🌐 2. Configurar en Netlify</h4>
                <ol className="space-y-1 text-xs">
                  <li>• Ve a <a href="https://app.netlify.com" target="_blank" className="underline">app.netlify.com</a></li>
                  <li>• Site settings → Environment variables</li>
                  <li>• Agrega <code className="bg-black bg-opacity-30 px-1 rounded">PUBLIC_SUPABASE_URL</code></li>
                  <li>• Agrega <code className="bg-black bg-opacity-30 px-1 rounded">PUBLIC_SUPABASE_ANON_KEY</code></li>
                </ol>
              </div>
            </div>
            
            <div className="mt-3 text-center">
              <div className="text-sm opacity-90">
                Después de agregar las variables → <strong>Trigger deploy</strong> → ¡Listo!
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigBanner;