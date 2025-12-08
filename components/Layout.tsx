import React, { useState } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { LayoutGrid, ShoppingCart, Settings, BarChart3, Pill, ArrowLeft, PanelLeftClose, PanelLeft, FileText } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isReportsPage = location.pathname === '/reports';
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { to: '/', label: 'POS Terminal', icon: <ShoppingCart size={20} /> },
    { to: '/inventory', label: 'Inventory', icon: <LayoutGrid size={20} /> },
    { to: '/coupons', label: 'Coupons', icon: <Settings size={20} /> },
    { to: '/reports', label: 'Reports', icon: <BarChart3 size={20} /> },
    { to: '/help', label: 'Help & Docs', icon: <FileText size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar - Hidden on Reports Page or when toggled off */}
      {!isReportsPage && isSidebarOpen && (
        <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 h-auto md:h-screen sticky top-0 transition-all duration-300">
          <div className="p-6 flex items-center gap-3 border-b border-slate-800">
            <div className="bg-indigo-500 p-2 rounded-lg text-white">
              <Pill size={24} />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">SaadPOS Sim</span>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                      : 'hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <div className="bg-slate-800 rounded-xl p-4 text-xs text-slate-400">
              <p className="font-bold text-white mb-1">Sim Mode Active</p>
              <p>v1.1.0 • React</p>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto h-screen ${isReportsPage ? 'p-0' : 'p-4 md:p-8'} transition-all duration-300`}>
        {isReportsPage && (
            <div className="bg-slate-900 text-white p-4 flex items-center gap-4 sticky top-0 z-20 shadow-md">
                <Link to="/" className="p-2 hover:bg-slate-700 rounded-full transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <span className="font-bold text-lg">Detailed Sales Report View</span>
            </div>
        )}

        {/* Sidebar Toggle for Non-Reports Pages */}
        {!isReportsPage && (
           <div className="mb-4">
             <button 
               onClick={() => setIsSidebarOpen(!isSidebarOpen)}
               className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 border border-indigo-600 rounded-lg text-white hover:bg-indigo-700 shadow-md transition-all active:scale-95"
               title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
             >
               {isSidebarOpen ? <PanelLeftClose size={20}/> : <PanelLeft size={20}/>}
               <span className="font-semibold text-sm">{isSidebarOpen ? 'Hide Menu' : 'Show Menu'}</span>
             </button>
           </div>
        )}

        <div className={`h-full ${isReportsPage ? 'w-full p-6' : 'max-w-[1600px] mx-auto'}`}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;