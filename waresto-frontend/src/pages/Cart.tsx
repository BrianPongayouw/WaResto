import React, { useState, useEffect } from 'react';
import { Minus, Plus, Utensils, ShoppingBag, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { orderService } from '../api/orderService';
import { tableService } from '../api/tableService';
import type { MenuItem } from '../data/mockData';

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { cart, updateCartQuantity, totalPrice, menuItems, clearCart, addToCart } = useCart();

  const [tables, setTables] = useState<any[]>([]);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway'>('dine_in');
  const [customerName, setCustomerName] = useState('');
  const [selectedTableId, setSelectedTableId] = useState('');
  const [specialNote, setSpecialNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch tables from backend (same tables that admin manages)
  useEffect(() => {
    const fetchTables = async () => {
      try {
        setTablesLoading(true);
        const data = await tableService.getTables();
        setTables(data);
        if (data.length > 0) setSelectedTableId(data[0].id);
      } catch (err) {
        console.error('Failed to fetch tables:', err);
      } finally {
        setTablesLoading(false);
      }
    };
    fetchTables();
  }, []);

  const handleCreateOrder = async () => {
    try {
      setIsSubmitting(true);
      const items = cart.map(cartItem => {
        const item = menuItems.find(i => i.id === cartItem.menuId);
        return {
          menuId: cartItem.menuId,
          name: item?.name || 'Unknown',
          price: item?.price || 0,
          quantity: cartItem.quantity,
          options: cartItem.options,
        };
      });

      const selectedTable = tables.find(t => t.id === selectedTableId);

      const orderData = {
        customerName,
        type: orderType,
        specialNote,
        items,
        tableId: selectedTableId,
        tableNumber: selectedTable?.number || '',
      };

      await orderService.createOrder(orderData);
      alert('Pesanan berhasil dibuat!');
      clearCart();
      navigate('/menu');
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('Gagal membuat pesanan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Recommendations: items NOT already fully in cart
  const recommended = menuItems
    .filter(item => !cart.some(c => c.menuId === item.id))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#4d2127] font-be-vietnam flex flex-col md:flex-row">
      {/* Left Section: Items & Recommendations */}
      <div className="w-full md:w-1/2 p-6 md:p-10 overflow-y-auto max-h-screen no-scrollbar border-r border-[#ffe1e3]">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex flex-col mb-8">
            <h1 className="text-2xl font-black font-plus-jakarta tracking-tight">Ayam Lumion</h1>
            <p className="text-xs opacity-40 font-medium mt-1">Keranjang Pesanan Anda</p>
          </div>

          {/* Cart Items */}
          <div className="space-y-4 mb-10">
            {cart.length === 0 ? (
              <div className="py-16 text-center opacity-30">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3" />
                <p className="font-bold uppercase tracking-widest text-sm">Keranjang kosong</p>
              </div>
            ) : (
              cart.map((cartItem) => {
                const item = menuItems.find(i => i.id === cartItem.menuId);
                if (!item) return null;
                return (
                  <div key={cartItem.cartId} className="bg-white p-4 rounded-2xl border border-[#ffe1e3] shadow-sm flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm">{item.name}</h3>
                      {Object.entries(cartItem.options).length > 0 && (
                        <p className="text-[10px] text-[#a1676d] mt-0.5 italic">
                          {Object.entries(cartItem.options).map(([k, v]) => `${k}: ${v}`).join(', ')}
                        </p>
                      )}
                      <p className="text-[#b7120d] font-black text-sm mt-1">Rp {Number(item.price).toLocaleString('id-ID')}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-3 bg-[#fff4f4] px-3 py-1.5 rounded-full border border-[#ffe1e3]">
                          <button onClick={() => updateCartQuantity(cartItem.cartId, -1)} className="text-[#b7120d]">
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-black text-sm w-4 text-center">{cartItem.quantity}</span>
                          <button onClick={() => updateCartQuantity(cartItem.cartId, 1)} className="text-[#b7120d]">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            <button
              onClick={() => navigate('/menu')}
              className="w-full py-3 border-2 border-dashed border-[#ffe1e3] text-[#b7120d] font-black text-[10px] uppercase tracking-widest hover:bg-[#fff4f4] transition-all rounded-2xl bg-red-500/5"
            >
              + TAMBAH PESANAN
            </button>
          </div>

          {/* Recommendations */}
          {recommended.length > 0 && (
            <div>
              <h2 className="text-sm font-black opacity-40 uppercase tracking-widest mb-4">Menu yang mungkin kamu suka</h2>
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                {recommended.map((item: MenuItem) => (
                  <div key={item.id} className="min-w-[160px] bg-white p-3 rounded-2xl border border-[#ffe1e3] shadow-sm flex flex-col">
                    <div className="w-full h-20 rounded-xl overflow-hidden mb-3">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                    </div>
                    <p className="font-bold text-xs truncate">{item.name}</p>
                    <p className="text-[10px] font-black text-[#b7120d] mt-1">Rp {Number(item.price).toLocaleString('id-ID')}</p>
                    <button
                      onClick={() => addToCart(item)}
                      className="mt-3 w-full py-2 bg-[#fff4f4] text-[#b7120d] text-[10px] font-black uppercase tracking-widest hover:bg-[#b7120d] hover:text-white transition-all rounded-xl"
                    >
                      TAMBAH
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Section: Form & Payment */}
      <div className="w-full md:w-1/2 p-6 md:p-10 bg-white flex flex-col h-screen border-l border-[#ffe1e3]">
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-8">
          {/* Order Type */}
          <section>
            <h3 className="text-sm font-black uppercase tracking-widest mb-3">Jenis Order</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setOrderType('dine_in')}
                className={`p-3.5 flex flex-col items-center gap-2 border transition-all text-center rounded-2xl ${
                  orderType === 'dine_in'
                  ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-900/20'
                  : 'bg-red-50 border-[#ffe1e3] text-[#b7120d] opacity-50'
                }`}
              >
                <Utensils className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Makan di tempat</span>
              </button>
              <button
                onClick={() => setOrderType('takeaway')}
                className={`p-3.5 flex flex-col items-center gap-2 border transition-all text-center rounded-2xl ${
                  orderType === 'takeaway'
                  ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-900/20'
                  : 'bg-red-50 border-[#ffe1e3] text-[#b7120d] opacity-50'
                }`}
              >
                <ShoppingBag className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Bungkus</span>
              </button>
            </div>
          </section>

          {/* Customer Form */}
          <section className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest">Data Pemesan</h3>

            <input
              type="text"
              placeholder="Nama Pemesan *"
              className="w-full bg-white border border-[#ffe1e3] px-5 py-3.5 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-500/20 transition-all outline-none"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />

            {/* Table Selector — linked to admin's table list */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#b7120d] opacity-60 ml-1">
                Pilih Meja *
              </label>
              {tablesLoading ? (
                <div className="w-full border border-[#ffe1e3] px-5 py-3.5 rounded-2xl flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memuat daftar meja...
                </div>
              ) : tables.length === 0 ? (
                <div className="w-full border border-[#ffe1e3] px-5 py-3.5 rounded-2xl text-sm text-gray-400">
                  Tidak ada meja tersedia
                </div>
              ) : (
                <select
                  className="w-full bg-white border border-[#ffe1e3] px-5 py-3.5 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-500/20 transition-all outline-none appearance-none cursor-pointer"
                  value={selectedTableId}
                  onChange={(e) => setSelectedTableId(e.target.value)}
                >
                  {tables.map(table => (
                    <option key={table.id} value={table.id}>
                      Meja {table.number} {table.status === 'Terisi' ? '(Terisi)' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="relative pt-2">
              <label className="absolute -top-0 left-4 bg-white px-2 text-[9px] font-black text-[#b7120d] uppercase tracking-widest z-10">
                Pesan Khusus
              </label>
              <textarea
                className="w-full bg-white border border-[#b7120d] px-5 py-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-500/20 transition-all outline-none min-h-[90px]"
                placeholder="Contoh: Sambal dipisah ya.."
                value={specialNote}
                onChange={(e) => setSpecialNote(e.target.value)}
              />
            </div>
          </section>

          {/* Payment Summary */}
          <section className="pt-6 border-t-4 border-double border-[#ffe1e3]">
            <h3 className="text-sm font-black uppercase tracking-widest mb-5">Ringkasan Pembayaran</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-black pt-2">
                <span className="uppercase tracking-widest">Total Pembayaran</span>
                <span className="text-[#b7120d]">Rp {totalPrice.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Action */}
        <div className="pt-6 mt-auto">
          <button
            disabled={!customerName || !selectedTableId || cart.length === 0 || isSubmitting}
            onClick={handleCreateOrder}
            className={`w-full py-4 font-black text-xs uppercase tracking-[0.2em] transition-all rounded-2xl flex items-center justify-center gap-2 ${
              !customerName || !selectedTableId || cart.length === 0 || isSubmitting
              ? 'bg-[#e0e0e0] text-white cursor-not-allowed'
              : 'bg-[#b7120d] text-white hover:bg-[#a0100b] shadow-lg shadow-red-900/20 active:scale-[0.98]'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                MEMPROSES...
              </>
            ) : 'BUAT PESANAN'}
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};

export default Cart;
