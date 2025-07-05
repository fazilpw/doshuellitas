// src/dashboard/DashboardWithDogProfiles.jsx
// 📊 EJEMPLO DE INTEGRACIÓN EN DASHBOARD

import { useState } from 'react';
import CompactDogCard from '../components/dogs/CompactDogCard.jsx';
import EnhancedDogProfile from '../components/dogs/EnhancedDogProfile.jsx';

const DashboardWithDogProfiles = ({ userRole = 'padre' }) => {
  const [selectedDog, setSelectedDog] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Datos de ejemplo - reemplazar con tus datos reales
  const userDogs = [
    {
      id: 'dog-1',
      name: 'Max',
      breed: 'Golden Retriever',
      size: 'grande',
      age: 3,
      weight: 28.5,
      color: 'Dorado',
      active: true,
      photo_url: null,
      notes: 'Muy sociable y juguetón. Le gusta nadar.',
      created_at: '2023-01-15'
    },
    {
      id: 'dog-2',
      name: 'Luna',
      breed: 'Border Collie',
      size: 'mediano',
      age: 2,
      weight: 18.2,
      color: 'Negro y blanco',
      active: true,
      photo_url: null,
      notes: 'Muy inteligente, necesita mucho ejercicio mental.',
      created_at: '2023-06-20'
    }
  ];

  // ============================================
  // 🎨 FUNCIONES DE MANEJO
  // ============================================
  const handleDogClick = (dog) => {
    setSelectedDog(dog);
    setShowProfileModal(true);
  };

  const handleProfileUpdate = () => {
    // Aquí actualizarías los datos del perro
    console.log('Perfil actualizado');
  };

  const closeProfile = () => {
    setShowProfileModal(false);
    setSelectedDog(null);
  };

  // ============================================
  // 🎨 RENDER DASHBOARD
  // ============================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard - Club Canino Dos Huellitas
              </h1>
              <p className="text-gray-600">
                Gestiona el peso y características de tus perros
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 bg-[#56CCF2] text-white rounded-full text-sm font-medium">
                {userRole === 'padre' ? '👨‍👩‍👧‍👦 Padre' : 
                 userRole === 'profesor' ? '👨‍🏫 Profesor' : '👨‍💼 Admin'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Resumen estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">🐕</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Perros</p>
                <p className="text-2xl font-semibold text-gray-900">{userDogs.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">⚖️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Peso Promedio</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {(userDogs.reduce((acc, dog) => acc + (dog.weight || 0), 0) / userDogs.length).toFixed(1)}kg
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Activos</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {userDogs.filter(dog => dog.active).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Con Seguimiento</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {userDogs.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sección principal - Tarjetas de perros */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Mis Perros ({userDogs.length})
            </h2>
            <button className="bg-[#56CCF2] hover:bg-[#5B9BD5] text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2">
              <span>➕</span>
              <span>Agregar Perro</span>
            </button>
          </div>

          {/* Grid de tarjetas compactas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {userDogs.map((dog) => (
              <CompactDogCard
                key={dog.id}
                dog={dog}
                onClick={() => handleDogClick(dog)}
                userRole={userRole}
              />
            ))}
          </div>
        </div>

        {/* Sección de acciones rápidas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-2xl">⚖️</span>
              <div className="text-left">
                <div className="font-medium text-gray-900">Registrar Peso</div>
                <div className="text-sm text-gray-600">Agregar nuevo registro de peso</div>
              </div>
            </button>

            <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-2xl">📊</span>
              <div className="text-left">
                <div className="font-medium text-gray-900">Ver Reportes</div>
                <div className="text-sm text-gray-600">Análisis de progreso completo</div>
              </div>
            </button>

            <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-2xl">🔔</span>
              <div className="text-left">
                <div className="font-medium text-gray-900">Configurar Alertas</div>
                <div className="text-sm text-gray-600">Notificaciones personalizadas</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de perfil completo */}
      {showProfileModal && selectedDog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Perfil Completo - {selectedDog.name}
              </h2>
              <button
                onClick={closeProfile}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-2xl text-gray-500">✕</span>
              </button>
            </div>
            
            <EnhancedDogProfile
              dog={selectedDog}
              onUpdate={handleProfileUpdate}
              userRole={userRole}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardWithDogProfiles;