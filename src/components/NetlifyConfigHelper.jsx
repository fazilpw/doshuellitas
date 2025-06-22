// src/components/NetlifyConfigHelper.jsx
import { useState, useEffect } from 'react';

const NetlifyConfigHelper = () => {
  const [configStatus, setConfigStatus] = useState('checking');
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Verificar si las variables están configuradas
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      setConfigStatus('configured');
    } else {
      setConfigStatus('missing');
    }
  }, []);

  if (configStatus === 'checking') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-blue-800">Verificando configuración...</span>
        </div>
      </div>
    );
  }

  if (configStatus === 'configured') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-green-600 text-xl mr-3">✅</span>
          <div>
            <div className="font-semibold text-green-800">Supabase Configurado</div>
            <div className="text-sm text-green-700">Todas las funcionalidades están disponibles</div>
          </div>
        </div>
      </div>
    );
  }

  // configStatus === 'missing'
  return (
    <div className="space-y-4">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-orange-600 text-xl mr-3">⚠️</span>
            <div>
              <div className="font-semibold text-orange-800">Configuración Pendiente</div>
              <div className="text-sm text-orange-700">Supabase no está configurado</div>
            </div>
          </div>
          <button 
            onClick={() => setShowInstructions(!showInstructions)}
            className="bg-orange-100 hover:bg-orange-200 text-orange-800 px-3 py-1 rounded-md text-sm font-medium transition-colors"
          >
            {showInstructions ? 'Ocultar' : 'Ver Instrucciones'}
          </button>
        </div>
      </div>

      {showInstructions && (
        <div className="bg-white border-2 border-orange-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🔧</span>
            Cómo Configurar Supabase en Netlify
          </h3>
          
          <div className="space-y-6">
            
            {/* Paso 1: Obtener Credenciales */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-2">
                📋 Paso 1: Obtener Credenciales de Supabase
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>Ve a <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Supabase Dashboard</a></li>
                <li>Selecciona tu proyecto</li>
                <li>Ve a <strong>Settings → API</strong></li>
                <li>Copia la <strong>URL</strong> y la <strong>anon/public key</strong></li>
              </ol>
            </div>

            {/* Paso 2: Configurar en Netlify */}
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-2">
                🌐 Paso 2: Configurar en Netlify
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>Ve a tu <strong>Netlify Dashboard</strong></li>
                <li>Selecciona tu sitio <strong>"Club Canino"</strong></li>
                <li>Ve a <strong>Site settings → Environment variables</strong></li>
                <li>Agrega estas 2 variables:</li>
              </ol>
              
              <div className="mt-3 bg-gray-100 rounded-lg p-3">
                <div className="space-y-2 font-mono text-sm">
                  <div>
                    <strong>Key:</strong> <code className="bg-white px-2 py-1 rounded">PUBLIC_SUPABASE_URL</code>
                    <br />
                    <strong>Value:</strong> <code className="bg-white px-2 py-1 rounded">https://tu-proyecto.supabase.co</code>
                  </div>
                  <div>
                    <strong>Key:</strong> <code className="bg-white px-2 py-1 rounded">PUBLIC_SUPABASE_ANON_KEY</code>
                    <br />
                    <strong>Value:</strong> <code className="bg-white px-2 py-1 rounded">eyJ... (tu clave anónima)</code>
                  </div>
                </div>
              </div>
            </div>

            {/* Paso 3: Redeploy */}
            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-2">
                🚀 Paso 3: Redeploy del Sitio
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>En Netlify, ve a <strong>Deploys</strong></li>
                <li>Haz clic en <strong>"Trigger deploy" → "Deploy site"</strong></li>
                <li>Espera a que termine el build</li>
                <li>¡Listo! El sitio funcionará completamente</li>
              </ol>
            </div>

            {/* Links Útiles */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h5 className="font-semibold text-blue-900 mb-2">🔗 Links Útiles</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <a 
                  href="https://supabase.com/dashboard" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  📊 Supabase Dashboard
                </a>
                <a 
                  href="https://app.netlify.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  🌐 Netlify Dashboard
                </a>
                <a 
                  href="https://docs.supabase.com/guides/getting-started" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  📖 Docs Supabase
                </a>
                <a 
                  href="https://docs.netlify.com/environment-variables/overview/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  📖 Docs Netlify Env
                </a>
              </div>
            </div>

            {/* Modo Demo */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h5 className="font-semibold text-yellow-900 mb-2">
                🎭 Mientras Tanto: Modo Demo
              </h5>
              <p className="text-sm text-yellow-800">
                El sitio funciona en <strong>modo demo</strong> sin base de datos. 
                Las evaluaciones no se guardan pero puedes explorar la interfaz. 
                Una vez configurado Supabase, todas las funcionalidades estarán disponibles.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetlifyConfigHelper;