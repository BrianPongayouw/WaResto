import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/ayamlumion.png';
import { LogOut, Bell, ChevronLeft } from 'lucide-react';
import { authClient } from '../api/client';

interface TopbarProps {
  variant?: 'staff' | 'customer';
  onBack?: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ variant = 'staff', onBack }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await authClient.post('/sign-out');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Always navigate to login, even if the API call fails
      navigate('/login', { replace: true });
    }
  };

  if (variant === 'customer') {
    return (
      <header className="fixed top-0 left-0 right-0 h-14 bg-white/90 backdrop-blur-md border-b border-red-50 z-50 flex items-center px-4 justify-between shadow-sm">
        <button
          onClick={onBack || (() => navigate(-1))}
          className="p-2 text-[#b7120d] hover:bg-red-50 rounded-full transition-colors -ml-1"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
          <img src={logo} alt="Ayam Lumion Logo" className="h-7 w-auto object-contain" />
          <span className="text-base font-bold text-[#b7120d] leading-none">Ayam Lumion</span>
        </div>
        <div className="w-10" />{/* spacer */}
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-red-50 z-50 flex items-center px-4 md:px-8 justify-between shadow-sm">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
        <div className="bg-white p-1 rounded-lg shadow-sm border border-red-50">
          <img src={logo} alt="Ayam Lumion Logo" className="h-8 md:h-10 w-auto object-contain" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg md:text-xl font-bold text-[#b7120d] leading-none">Ayam Lumion</span>
          <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium hidden md:block">Restaurant Management</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
        <button className="p-2 text-gray-500 hover:bg-red-50 hover:text-[#b7120d] rounded-full transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="h-8 w-[1px] bg-gray-200 mx-1 hidden md:block"></div>
        <div className="flex items-center gap-3 pl-2">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-semibold text-gray-700">Staff Mode</span>
            <span className="text-xs text-gray-500 capitalize">{location.pathname.split('/')[1]}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 bg-red-50 text-[#b7120d] hover:bg-[#b7120d] hover:text-white rounded-xl transition-all duration-300 font-medium text-sm group"
          >
            <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
