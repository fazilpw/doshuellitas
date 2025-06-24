// src/components/dashboard/AdminSidebar.jsx
export function AdminSidebar({ sections = [] }) {
  const navigation = [
    { name: 'Dashboard', href: '/dashboard/admin', icon: '🏠', current: true },
    { name: 'Usuarios', href: '/admin/usuarios', icon: '👥' },
    { name: 'Perros', href: '/admin/perros', icon: '🐕' },
    { name: 'Evaluaciones', href: '/admin/evaluaciones', icon: '📊' },
    { name: 'Fotos', href: '/admin/fotos', icon: '📸' },
    { name: 'Reportes', href: '/admin/reportes', icon: '📈' },
    { name: 'Configuración', href: '/admin/config', icon: '⚙️' }
  ];

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <div className="flex items-center">
          <img className="h-8 w-auto" src="/images/logo.png" alt="Club Canino" />
          <span className="ml-2 text-lg font-semibold text-[#2C3E50]">Panel Admin</span>
        </div>
      </div>
      
      <nav className="mt-8 px-4">
        <div className="space-y-1">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                item.current
                  ? 'bg-[#56CCF2] text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-[#56CCF2]'
              }`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.name}
            </a>
          ))}
        </div>
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl">⚡</span>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">Modo Admin</p>
              <p className="text-xs text-red-600">Control total del sistema</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}