import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import ReportForm from './components/ReportForm';
import CollectorDashboard from './components/CollectorDashboard';
import StudentDashboard from './components/StudentDashboard';
import CampusMap from './components/CampusMap';
import { RedAlerts, TaskQueue, BinManagement } from './components/CollectorViews';
import { User, UserRole } from './types';
import { Menu, Moon, Sun, LogOut, Map, Trash2, FileText, LayoutDashboard, AlertCircle, ListTodo, PlusSquare, Home } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard'); // Default to dashboard
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('theme');
    if (savedMode === 'light') {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogin = (u: User) => {
    setUser(u);
    // Everyone lands on dashboard first
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('dashboard');
  };

  if (!user) {
    return (
        <div className="relative min-h-screen bg-gray-50 dark:bg-uit-dark transition-colors duration-300">
            <div className="absolute top-4 right-4 z-10">
                <button onClick={toggleTheme} className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-uit-neon">
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>
            <Auth onLogin={handleLogin} />
        </div>
    );
  }

  // Navigation Items
  const navItems = [
    // Shared / Student / Teacher Items
    { id: 'dashboard', label: 'My Dashboard', icon: Home, roles: [UserRole.STUDENT, UserRole.TEACHER] },
    { id: 'report', label: 'Report Bin', icon: Trash2, roles: [UserRole.STUDENT, UserRole.TEACHER] },
    { id: 'map_std', label: 'Campus Map', icon: Map, roles: [UserRole.STUDENT, UserRole.TEACHER] },
    { id: 'complaint', label: 'Lodge Complaint', icon: FileText, roles: [UserRole.STUDENT, UserRole.TEACHER] },
    
    // Collector Items
    { id: 'dashboard_col', label: 'Analytics', icon: LayoutDashboard, roles: [UserRole.COLLECTOR] },
    { id: 'alerts', label: 'Red Alerts', icon: AlertCircle, roles: [UserRole.COLLECTOR], danger: true },
    { id: 'tasks', label: 'Task Queue', icon: ListTodo, roles: [UserRole.COLLECTOR] },
    { id: 'pickup_map', label: 'Pickup Map', icon: Map, roles: [UserRole.COLLECTOR] },
    { id: 'manage', label: 'Manage Bins', icon: PlusSquare, roles: [UserRole.COLLECTOR] },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-uit-dark transition-colors duration-300 overflow-hidden">
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-black/40 border-r border-gray-200 dark:border-gray-800 backdrop-blur-lg transform transition-transform duration-300 md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold dark:text-white">UIT<span className="text-uit-neon">Waste</span></h1>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-500"><LogOut size={20}/></button>
        </div>
        
        <nav className="px-4 space-y-2 mt-4">
          {filteredNav.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-uit-neon text-uit-dark font-bold shadow-lg shadow-uit-neon/20' 
                  : (item.danger ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')
              }`}
            >
              <item.icon size={20} className={item.danger && activeTab !== item.id ? 'animate-pulse' : ''} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                {user.username.substring(0,2).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold dark:text-white truncate">{user.username}</p>
                <p className="text-xs text-gray-500 uppercase">{user.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/20 backdrop-blur-md">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-600 dark:text-gray-300">
            <Menu size={24} />
          </button>
          <span className="md:hidden font-bold text-lg dark:text-white ml-2">UIT Waste</span>
          <div className="flex-1"></div>
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-uit-neon transition-colors">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
            {/* Student/Teacher Routes */}
            {activeTab === 'dashboard' && <StudentDashboard user={user} />}
            {activeTab === 'report' && <div className="p-4"><ReportForm type="bin" onSuccess={() => setActiveTab('dashboard')} /></div>}
            {activeTab === 'complaint' && <div className="p-4"><ReportForm type="complaint" onSuccess={() => setActiveTab('dashboard')} /></div>}
            {activeTab === 'map_std' && <CampusMap mode="student" />}

            {/* Collector Routes */}
            {activeTab === 'dashboard_col' && <CollectorDashboard />}
            {activeTab === 'alerts' && <RedAlerts />}
            {activeTab === 'tasks' && <TaskQueue />}
            {activeTab === 'pickup_map' && <div className="h-full"><CampusMap mode="collector" /></div>}
            {activeTab === 'manage' && <BinManagement />}
        </div>
      </main>
    </div>
  );
};

export default App;