
import React from 'react';
import { 
  LayoutDashboard, 
  Lightbulb, 
  Library, 
  Calendar, 
  BarChart2, 
  User,
  LogOut,
  FileText,
  Download
} from 'lucide-react';
import { User as UserType, UserRole } from '../types';
import { dbService } from '../services/db';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: UserType;
  setCurrentPage: (page: string) => void;
  currentPage: string;
  switchUser: () => void;
  hideRoleSwitch?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentUser, 
  setCurrentPage, 
  currentPage, 
  switchUser,
  hideRoleSwitch = false 
}) => {
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'topics', label: 'Tematy', icon: Lightbulb }, // Renamed from Baza Pomysłów
    { id: 'kanban_posts', label: 'Posty', icon: FileText }, // New Kanban board
    // { id: 'repository', label: 'Repozytorium', icon: Library }, // Hidden
    { id: 'calendar', label: 'Kalendarz', icon: Calendar },
    // { id: 'analytics', label: 'Statystyki', icon: BarChart2 }, // Hidden
  ];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-lg shadow-md"></div>
          <span className="text-xl font-bold text-gray-800">InstaFlow</span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-indigo-600' : 'text-gray-400'} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-4">
          {currentUser.role === UserRole.ADMIN && (
            <button 
              onClick={() => dbService.exportDatabase()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-gray-800 transition-all"
            >
               <Download size={14} />
               Eksportuj Bazę (Admin)
            </button>
          )}

          <div className="flex items-center gap-3">
             <img src={currentUser.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full border border-gray-200" />
             <div className="flex-1 overflow-hidden">
               <p className="text-sm font-semibold text-gray-900 truncate">{currentUser.name}</p>
               <p className="text-xs text-gray-500 truncate">{currentUser.role}</p>
             </div>
          </div>
          
          {!hideRoleSwitch && (
            <button 
              onClick={switchUser}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-white hover:shadow-sm transition-all"
            >
               <User size={14} />
               Przełącz Rolę (Demo)
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0">
          <h1 className="text-xl font-bold text-gray-800 capitalize">
            {menuItems.find(i => i.id === currentPage)?.label || (currentPage === 'repository' ? 'Repozytorium' : currentPage)}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400">v1.1.0 • Connected to Firestore</span>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-8">
           {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
