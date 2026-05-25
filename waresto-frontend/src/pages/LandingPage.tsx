import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, ChevronRight } from 'lucide-react';

const LandingPage: React.FC = () => {
  const [tableNumber, setTableNumber] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tableNumber.trim()) {
      navigate(`/meja/${tableNumber.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff4f4] flex flex-col items-center justify-center p-6 relative overflow-hidden font-be-vietnam">
      {/* Background patterns/images could go here */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-10"
        style={{ backgroundImage: 'url("/fotobackground.png")' }}
      ></div>

      <div className="relative z-10 w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-10 border border-[#ffe1e3] flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-[#b7120d] rounded-[2rem] flex items-center justify-center mb-8 shadow-xl shadow-red-900/20">
          <UtensilsCrossed className="w-12 h-12 text-white" />
        </div>

        <h1 className="text-3xl font-black font-plus-jakarta text-[#4d2127] mb-2 tracking-tighter">Selamat Datang!</h1>
        <p className="text-sm font-medium text-[#a1676d] mb-10">Silakan masukkan nomor meja Anda untuk mulai memesan.</p>

        <form onSubmit={handleSubmit} className="w-full space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#b7120d] opacity-60">Nomor Meja</label>
            <input 
              type="text" 
              placeholder="Contoh: 1, 5, atau A2"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="w-full bg-[#fff4f4] border-none rounded-2xl px-6 py-5 text-2xl font-black text-center text-[#b7120d] focus:ring-4 focus:ring-[#b7120d]/10 transition-all placeholder:opacity-20"
              autoFocus
            />
          </div>

          <button 
            type="submit"
            disabled={!tableNumber.trim()}
            className="w-full bg-[#b7120d] text-white py-5 rounded-2xl font-black text-sm shadow-xl shadow-red-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100"
          >
            LIHAT MENU
            <ChevronRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-12 flex items-center gap-2 opacity-30">
          <div className="h-[1px] w-4 bg-[#a1676d]"></div>
          <p className="text-[8px] font-black tracking-[0.2em] uppercase">Powered by WaResto</p>
          <div className="h-[1px] w-4 bg-[#a1676d]"></div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
