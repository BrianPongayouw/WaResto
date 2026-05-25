import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient } from '../api/client';
import { Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authClient.get('/get-session');
        if (response.data && response.data.session && response.data.user) {
          const userEmail: string = response.data.user.email || '';
          const isKasir = userEmail.toLowerCase().includes('kasir');
          navigate(isKasir ? '/kasir' : '/admin', { replace: true });
        }
      } catch (e) {
        // Not logged in, stay on login page
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authClient.post('/sign-in/email', {
        email,
        password,
      });

      if (response.data) {
        // Route based on the user's email/role
        // kasir@waresto.com → /kasir, everything else → /admin
        const userEmail: string = response.data.user?.email || email;
        const isKasir = userEmail.toLowerCase().includes('kasir');
        navigate(isKasir ? '/kasir' : '/admin');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login gagal. Periksa email dan password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff4f4] flex font-be-vietnam text-[#4d2127] items-center justify-center p-6 relative overflow-hidden">
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-20"
        style={{ backgroundImage: 'url("/fotobackground.png")' }}
      ></div>
      
      <div className="bg-white/80 backdrop-blur-xl w-full max-w-md p-10 rounded-[2.5rem] shadow-2xl border border-white/50 relative z-10 animate-fade-in">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black font-plus-jakarta text-[#b7120d] tracking-tighter mb-2">WaResto</h1>
          <p className="text-[10px] font-bold opacity-40 uppercase tracking-[0.2em]">Sistem Manajemen</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold mb-6 text-center border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Email</label>
            <input 
              type="email" 
              required
              placeholder="admin@waresto.com"
              className="w-full bg-[#fff4f4] border-none px-4 py-4 text-sm font-bold rounded-2xl focus:ring-2 focus:ring-[#b7120d]/20 transition-all outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Password</label>
            <input 
              type="password" 
              required
              placeholder="••••••••"
              className="w-full bg-[#fff4f4] border-none px-4 py-4 text-sm font-bold rounded-2xl focus:ring-2 focus:ring-[#b7120d]/20 transition-all outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#b7120d] text-white py-4 mt-4 font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-red-900/20 hover:bg-[#a0100b] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'MASUK'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
