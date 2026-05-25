import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Minus, ShoppingCart, ShoppingBag, Share2, Star, X, ChevronRight, Check, Loader2, MapPin } from 'lucide-react';
import type { MenuItem } from '../data/mockData';
import { useCart } from '../context/CartContext';
import { menuService } from '../api/menuService';
import { apiClient } from '../api/client';

const CustomerMenu: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [categories, setCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { cart, addToCart, updateCartQuantity, getItemQuantity, totalItems, totalPrice } = useCart();
  const [selectedItemForOptions, setSelectedItemForOptions] = useState<MenuItem | null>(null);
  const [currentOptions, setCurrentOptions] = useState<Record<string, string>>({});
  const [restaurantProfile, setRestaurantProfile] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cats, items, profileRes] = await Promise.all([
          menuService.getCategories(),
          menuService.getMenus(),
          apiClient.get('/restaurant/profile').catch(() => ({ data: null })),
        ]);
        
        // Map backend categories to frontend (assuming backend returns array of objects with 'name')
        const catNames = cats.map((c: any) => c.name);
        setCategories(catNames);
        setMenuItems(items);
        setRestaurantProfile(profileRes.data);
        
        if (catNames.length > 0) {
          setActiveCategory(catNames[0]);
        }
      } catch (err) {
        console.error('Failed to fetch menu data:', err);
        setError('Gagal memuat menu. Pastikan koneksi internet aktif.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddItem = (item: MenuItem) => {
    if (item.options && item.options.length > 0) {
      setSelectedItemForOptions(item);
      // Set default options
      const defaults: Record<string, string> = {};
      item.options.forEach(opt => {
        if (opt.choices.length > 0) {
          defaults[opt.name] = opt.choices[0];
        }
      });
      setCurrentOptions(defaults);
    } else {
      addToCart(item);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff4f4] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-[#b7120d] animate-spin" />
        <p className="font-bold text-[#b7120d]">Memuat Menu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fff4f4] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-[#ffe1e3]">
          <p className="font-bold text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-[#b7120d] text-white px-6 py-3 rounded-full font-bold"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff4f4] text-[#4d2127] font-be-vietnam pb-32">
      {/* 1. Hero Image */}
      <div className="w-full h-[380px] relative overflow-hidden">
        <img 
          src={restaurantProfile?.heroImageUrl || "https://images.unsplash.com/photo-1516684669134-de6f7c473a2a?w=1200&auto=format&fit=crop"} 
          alt="Ayam Lumion Hero" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#fff4f4] via-transparent to-transparent opacity-70"></div>
      </div>

      {/* 2. Restaurant Info - Below Hero */}
      <header className="px-6 -mt-10 relative z-10">
        <div className="bg-white/90 backdrop-blur-md px-6 py-5 shadow-xl border-b border-[#ffe1e3] rounded-2xl">
          <div className="flex justify-between items-center">
            <div>
              {id && (
                <div className="bg-[#b7120d] text-white text-[10px] font-bold px-3 py-1 rounded-full w-fit mb-2">
                  MEJA {id}
                </div>
              )}
              <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-extrabold font-plus-jakarta leading-tight">Ayam Lumion</h1>
                  <button className="p-2 rounded-full bg-red-50 text-[#b7120d] hover:bg-red-100 transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm opacity-60 font-medium">Bebek &amp; Ayam Goreng</p>
              
              {/* Rating - Dynamic from restaurant profile */}
              {(() => {
                const rating = restaurantProfile?.rating ? parseFloat(restaurantProfile.rating) : 4.8;
                const reviewCount = restaurantProfile?.reviewCount || 250;
                const fullStars = Math.floor(rating);
                const hasHalf = (rating - fullStars) >= 0.25;
                return (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => {
                        if (i < fullStars) {
                          return <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />;
                        } else if (i === fullStars && hasHalf) {
                          return <Star key={i} className="w-3.5 h-3.5 fill-yellow-400/60 text-yellow-400" />;
                        } else {
                          return <Star key={i} className="w-3.5 h-3.5 fill-transparent text-yellow-300" />;
                        }
                      })}
                    </div>
                    <span className="text-sm font-bold">{rating.toFixed(1)}</span>
                    <span className="text-xs opacity-50 font-medium">({reviewCount}+ Ulasan Google)</span>
                  </div>
                );
              })()}

              {/* Google Maps Button */}
              <a
                href={restaurantProfile?.googleMapsUrl || `https://www.google.com/maps/search/Ayam+Lumion`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 bg-[#b7120d]/10 text-[#b7120d] text-[10px] font-black px-3 py-1.5 rounded-full hover:bg-[#b7120d] hover:text-white transition-all border border-[#b7120d]/20"
              >
                <MapPin className="w-3 h-3" />
                Lihat di Google Maps
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Divider */}
      <div className="h-2 bg-[#ffe1e3] w-full mt-4"></div>

      {/* Menu Terlaris Section */}
      <div className="px-6 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold font-plus-jakarta tracking-tight">Terlaris</h2>
          <span className="text-[10px] font-bold text-[#b7120d] bg-red-50 px-2 py-1 rounded-full">paling sering dibeli</span>
        </div>
        <div className="flex overflow-x-auto gap-4 no-scrollbar pb-4">
          {menuItems.slice(0, 4).map((item) => (
            <div key={`terlaris-${item.id}`} className="min-w-[240px] bg-white rounded-[1.5rem] shadow-sm border border-[#ffe1e3] overflow-hidden flex flex-col">
              <div className="h-40 overflow-hidden">
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform hover:scale-110 duration-500" />
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h4 className="text-xs font-bold text-[#4d2127] line-clamp-1 mb-1">{item.name}</h4>
                <p className="text-[#b7120d] font-black text-xs mt-auto">Rp {Number(item.price).toLocaleString('id-ID')}</p>
                {getItemQuantity(item.id) === 0 ? (
                  <button 
                    onClick={() => handleAddItem(item)}
                    className="mt-2 w-full bg-[#b7120d] text-white py-3 rounded-xl text-[11px] font-black shadow-md shadow-red-900/10 active:scale-95 transition-all hover:scale-[1.03] hover:shadow-xl hover:bg-[#a0100b] relative overflow-hidden group/btn"
                  >
                    <span className="relative z-10">TAMBAH</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-shine"></div>
                  </button>
                ) : (
                  <div className="mt-2 w-full flex items-center justify-between bg-[#fff4f4] rounded-full p-1 border border-[#ffe1e3] animate-in fade-in zoom-in duration-300">
                    <button 
                      onClick={() => {
                        const cartItem = cart.find(i => i.menuId === item.id);
                        if (cartItem) updateCartQuantity(cartItem.cartId, -1);
                      }}
                      className="bg-white text-[#b7120d] p-2 rounded-full shadow-sm hover:bg-red-50"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-black min-w-[12px] text-center">{getItemQuantity(item.id)}</span>
                    <button 
                      onClick={() => handleAddItem(item)}
                      className="bg-[#b7120d] text-white p-2 rounded-full shadow-md hover:bg-[#a0100b]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-2 bg-[#ffe1e3] w-full mt-4"></div>

      {/* 3. Category Tabs - Below Name */}
      <div className="sticky top-14 z-40 bg-[#fff4f4]/80 backdrop-blur-md px-6 py-4 mt-2">
        <div className="flex overflow-x-auto gap-2 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-8 py-4 rounded-full text-xs font-bold transition-all duration-300 ${
                activeCategory === cat 
                ? 'bg-[#b7120d] text-white shadow-lg shadow-red-900/20' 
                : 'bg-white text-[#a1676d] border border-[#ffe1e3]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-[1px] bg-[#ffe1e3] mx-6 mt-2 mb-4"></div>

      {/* 4. Menu Item List - Below Categories */}
      <main className="px-6 space-y-4 mt-2">
        <h3 className="text-lg font-extrabold font-plus-jakarta tracking-tight uppercase px-1">{activeCategory}</h3>
        
        <div className="space-y-4">
          {menuItems
            .filter(i => i.category === activeCategory || activeCategory === "MENU REKOMENDASI")
            .map((item) => {
              const quantity = getItemQuantity(item.id);
              return (
                <div key={item.id} className="bg-white rounded-[1.25rem] p-0 border border-[#ffe1e3] shadow-sm flex items-stretch gap-0 transition-all hover:shadow-md overflow-hidden">
                  {/* Left: Square photo */}
                  <div className="relative w-32 h-32 flex-shrink-0">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    <div className="absolute -top-1 -left-1 bg-[#b7120d] text-white px-1.5 py-0.5 rounded-md text-[7px] font-bold shadow-sm">
                      TERSEDIA
                    </div>
                  </div>

                  {/* Center: Name, Desc, Price */}
                  <div className="flex-1 flex flex-col justify-center px-4 py-2 min-w-0">
                    <h4 className="text-sm font-bold text-[#4d2127] line-clamp-1">{item.name}</h4>
                    <p className="text-[10px] text-[#a1676d] line-clamp-2 leading-tight mt-0.5 mb-1">
                      {item.description}
                    </p>
                      Rp {Number(item.price).toLocaleString('id-ID')}
                  </div>

                  {/* Right: Quantity Control */}
                  <div className="flex-shrink-0 flex items-center justify-center pr-4">
                    {getItemQuantity(item.id) === 0 ? (
                      <button 
                        onClick={() => handleAddItem(item)}
                        className="bg-[#b7120d] text-white p-3 rounded-full hover:scale-110 active:scale-90 transition-all shadow-md shadow-red-900/20 relative overflow-hidden group/plus"
                      >
                        <Plus className="w-5 h-5 relative z-10" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/plus:animate-shine"></div>
                      </button>
                    ) : (
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center bg-[#fff4f4] rounded-full p-1 border border-[#ffe1e3] animate-in fade-in zoom-in duration-300">
                          <button 
                            onClick={() => {
                              // If there are multiple configurations of the same item, 
                              // we should probably let them manage it in the cart.
                              // For simplicity here, we decrease the first one we find.
                              const cartItem = cart.find(i => i.menuId === item.id);
                              if (cartItem) updateCartQuantity(cartItem.cartId, -1);
                            }}
                            className="bg-white text-[#b7120d] p-1.5 rounded-full shadow-sm hover:bg-red-50"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="mx-2.5 text-xs font-black min-w-[12px] text-center">{getItemQuantity(item.id)}</span>
                          <button 
                            onClick={() => handleAddItem(item)}
                            className="bg-[#b7120d] text-white p-1.5 rounded-full shadow-md hover:bg-[#a0100b]"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        {item.options && item.options.length > 0 && (
                          <p className="text-[8px] font-bold text-[#b7120d] opacity-60">Customized</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </main>

      {/* 5. Footer - Copyright Info */}
      <footer className="mt-16 mb-32 px-6 text-center">
        <div className="w-12 h-1 bg-[#ffe1e3] mx-auto mb-6 rounded-full opacity-50"></div>
        <p className="text-[11px] text-[#4d2127] font-bold tracking-widest uppercase opacity-40">
          © {new Date().getFullYear()} Ayam Lumion
        </p>
        <p className="text-[10px] text-[#a1676d] font-medium mt-1 opacity-40">
          ALL RIGHTS RESERVED
        </p>
        <div className="mt-4 flex items-center justify-center gap-2 opacity-30">
          <div className="h-[1px] w-4 bg-[#a1676d]"></div>
          <p className="text-[8px] font-black tracking-[0.2em] uppercase">Powered by WaResto</p>
          <div className="h-[1px] w-4 bg-[#a1676d]"></div>
        </div>
      </footer>

      {/* Floating Bottom Cart - Dynamic */}
      {totalItems > 0 && (
        <div className="fixed bottom-8 left-0 right-0 px-6 z-50 pointer-events-none">
          <div className="max-w-sm mx-auto pointer-events-auto animate-in slide-in-from-bottom-10 duration-500">
            <button 
              onClick={() => navigate('/keranjang')}
              className="w-full bg-[#b7120d] text-white px-6 py-4 rounded-full flex items-center justify-between gap-4 shadow-2xl border-2 border-white/20 active:scale-95 transition-all hover:scale-[1.02]"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingBag className="w-6 h-6" />
                  <div className="absolute -top-2 -right-2 bg-white text-[#b7120d] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border border-[#b7120d]">
                    {totalItems}
                  </div>
                </div>
                <span className="text-sm font-bold tracking-tight uppercase">Lihat Keranjang</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-[1px] bg-white/30"></div>
                <span className="text-sm font-black">Rp {totalPrice.toLocaleString('id-ID')}</span>
                <ChevronRight className="w-5 h-5 opacity-70" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Options Selection Modal/Drawer */}
      {selectedItemForOptions && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setSelectedItemForOptions(null)}
          ></div>
          <div className="relative bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in duration-300 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-[#ffe1e3] flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-[#ffe1e3]">
                  <img src={selectedItemForOptions.imageUrl} alt={selectedItemForOptions.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg leading-tight">{selectedItemForOptions.name}</h3>
                  <p className="text-sm font-bold text-[#b7120d]">Rp {selectedItemForOptions.price.toLocaleString('id-ID')}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedItemForOptions(null)}
                className="p-2 hover:bg-red-50 rounded-full text-[#4d2127] transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Options List */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
              {selectedItemForOptions.options?.map((option) => (
                <div key={option.id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-widest opacity-40">{option.name}</h4>
                    {option.required && (
                      <span className="text-[8px] font-black bg-red-100 text-[#b7120d] px-2 py-0.5 rounded-full uppercase">Wajib</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {option.choices.map((choice) => {
                      const isSelected = currentOptions[option.name] === choice;
                      return (
                        <button
                          key={choice}
                          onClick={() => setCurrentOptions(prev => ({ ...prev, [option.name]: choice }))}
                          className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                            isSelected 
                            ? 'border-[#b7120d] bg-red-50 text-[#b7120d]' 
                            : 'border-[#ffe1e3] hover:border-[#b7120d]/30'
                          }`}
                        >
                          <span className="text-sm font-bold">{choice}</span>
                          {isSelected && <Check className="w-4 h-4" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest opacity-40">Catatan Khusus</h4>
                <textarea 
                  placeholder="Contoh: Kurangi garam, dll..."
                  className="w-full bg-[#fff4f4] border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-[#b7120d]/20 transition-all resize-none h-24"
                />
              </div>
            </div>

            {/* Footer Action */}
            <div className="p-6 border-t border-[#ffe1e3] bg-white sticky bottom-0">
              <button 
                onClick={() => {
                  addToCart(selectedItemForOptions, currentOptions);
                  setSelectedItemForOptions(null);
                  setCurrentOptions({});
                }}
                className="w-full bg-[#b7120d] text-white py-5 rounded-[1.5rem] font-black text-sm shadow-xl shadow-red-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                TAMBAHKAN KE PESANAN
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}



      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes shine {
          0% { transform: translateX(-100%) skewX(-15deg); }
          50% { transform: translateX(100%) skewX(-15deg); }
          100% { transform: translateX(100%) skewX(-15deg); }
        }
        .animate-shine {
          animation: shine 1.5s infinite;
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s infinite ease-in-out;
        }
      `}} />
    </div>
  );
};

export default CustomerMenu;

