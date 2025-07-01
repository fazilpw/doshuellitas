import { LogoutButton } from '../utils/logoutHandler.js';

// 2. EN LA FUNCIÓN AppHeader, BUSCAR EL BOTÓN DE LOGOUT Y REEMPLAZARLO:
function AppHeader() {
  const { clubDisplayName, clubRole } = useClubCaninoAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-[#56CCF2] rounded-full flex items-center justify-center">
            <span className="text-xl">🐕</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#2C3E50]">Club Canino</h1>
            <p className="text-sm text-gray-600">Panel {clubRole}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-gray-900">
              {clubDisplayName}
            </p>
            <p className="text-xs text-gray-500">Panel personalizado</p>
          </div>

          {/* ✅ REEMPLAZAR EL BOTÓN DE LOGOUT EXISTENTE CON ESTE: */}
          <LogoutButton variant="header" title="Cerrar sesión" />
        </div>
      </div>
    </header>
  );
}