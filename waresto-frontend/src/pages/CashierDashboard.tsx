import React, { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle, Play, AlertCircle, Plus, Search, Trash2, X, Loader2, Minus, Edit2, Save } from 'lucide-react';
import type { MenuItem } from '../data/mockData';
import { orderService } from '../api/orderService';
import { menuService } from '../api/menuService';
import { tableService } from '../api/tableService';
import { apiClient } from '../api/client';

const CashierDashboard: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'Semua' | 'menunggu' | 'proses' | 'siap' | 'selesai'>('Semua');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newOrderItems, setNewOrderItems] = useState<any[]>([]);
  const [selectedTableId, setSelectedTableId] = useState('');
  const [menuSearch, setMenuSearch] = useState('');
  const [menuFilter, setMenuFilter] = useState('Semua');

  // Inline editing state: orderId -> items[]
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editSearch, setEditSearch] = useState('');
  const [editItems, setEditItems] = useState<any[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  const [profile, setProfile] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [ordersData, itemsData, catsData, tablesData, profileData] = await Promise.all([
        orderService.getOrders(),
        menuService.getMenus(),
        menuService.getCategories(),
        tableService.getTables(),
        apiClient.get('/restaurant/profile').then(res => res.data).catch(() => null),
      ]);
      setOrders(ordersData);
      setMenuItems(itemsData);
      setCategories(catsData.map((c: any) => c.name));
      setTables(tablesData);
      setProfile(profileData);
      if (tablesData.length > 0) setSelectedTableId(tablesData[0].id);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchData();

    const eventSource = new EventSource(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/v1'}/events/orders`);
    eventSource.addEventListener('new_order', (e) => {
      const o = JSON.parse(e.data);
      setOrders(prev => [o, ...prev]);
    });
    eventSource.addEventListener('status_changed', (e) => {
      const o = JSON.parse(e.data);
      setOrders(prev => prev.map(x => x.id === o.id ? { ...x, ...o } : x));
    });
    return () => eventSource.close();
  }, [fetchData]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (error) {
      alert('Gagal memperbarui status.');
    }
  };

  // Format timestamp from createdAt
  const formatTime = (ts: string) => {
    if (!ts) return '--:--';
    return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (ts: string) => {
    if (!ts) return '-';
    return new Date(ts).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getTimeAgo = (ts: string) => {
    if (!ts) return '-';
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
    if (diff < 1) return 'Baru saja';
    if (diff < 60) return `${diff} mnt lalu`;
    return `${Math.floor(diff / 60)} jam lalu`;
  };

  // Inline edit helpers
  const startEdit = (order: any) => {
    setEditingOrderId(order.id);
    setEditItems(order.items.map((i: any) => ({ ...i })));
  };

  const cancelEdit = () => { setEditingOrderId(null); setEditItems([]); setEditSearch(''); };

  const addToEditItems = (menuItem: MenuItem) => {
    setEditItems(prev => {
      const existing = prev.findIndex(i => i.menuId === menuItem.id);
      if (existing > -1) {
        const next = [...prev];
        next[existing] = { ...next[existing], quantity: next[existing].quantity + 1 };
        return next;
      }
      return [...prev, { menuId: menuItem.id, name: menuItem.name, price: menuItem.price, quantity: 1 }];
    });
  };

  const changeEditQty = (idx: number, delta: number) => {
    setEditItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], quantity: Math.max(1, next[idx].quantity + delta) };
      return next;
    });
  };

  const removeEditItem = (idx: number) => {
    setEditItems(prev => prev.filter((_, i) => i !== idx));
  };

  const saveEdit = async (orderId: string) => {
    if (editItems.length === 0) return;
    try {
      setSavingEdit(true);
      const updated = await orderService.updateOrderItems(orderId, editItems);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updated } : o));
      setEditingOrderId(null);
    } catch {
      alert('Gagal menyimpan perubahan.');
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredOrders = activeCategory === 'Semua' ? orders : orders.filter(o => o.status === activeCategory);

  const addNewOrder = async () => {
    if (newOrderItems.length === 0) return;
    const tbl = tables.find(t => t.id === selectedTableId);
    try {
      const orderData = {
        tableId: selectedTableId,
        tableNumber: tbl?.number || '',
        customerName: 'KASIR',
        type: 'dine_in',
        items: newOrderItems,
      };
      await orderService.createOrder(orderData);
      setIsAddModalOpen(false);
      setNewOrderItems([]);
    } catch {
      alert('Gagal membuat pesanan.');
    }
  };

  const addToNewOrder = (menuItem: MenuItem) => {
    setNewOrderItems(prev => {
      const existing = prev.find((i: any) => i.menuId === menuItem.id);
      if (existing) return prev.map((i: any) => i.menuId === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { menuId: menuItem.id, name: menuItem.name, price: menuItem.price, quantity: 1 }];
    });
  };

  const removeFromNewOrder = (menuId: string) => setNewOrderItems(prev => prev.filter(i => i.menuId !== menuId));

  const getTableNumber = (order: any) => order.table?.number || order.tableNumber || order.tableId?.slice(0, 4) || '-';

  const shortCode = (order: any) => {
    const tableNum = getTableNumber(order);
    const shortId = order.id?.replace(/-/g, '').substring(0, 5).toUpperCase();
    return `M${tableNum}-${shortId}`;
  };

  return (
    <div className="min-h-screen bg-[#fff4f4] text-[#4d2127] font-be-vietnam p-6">
      <header className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold font-plus-jakarta tracking-tight">Dashboard Kasir</h1>
          <p className="text-xs opacity-50 flex items-center gap-2 mt-1">
            <span>Pantau dan kelola pesanan masuk secara real-time</span>
            <span className="w-1 h-1 rounded-full bg-[#b7120d]"></span>
            <span className="font-bold flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
            </span>
            {profile && profile.openTime && profile.closeTime && (
              <>
                <span className="w-1 h-1 rounded-full bg-[#b7120d]"></span>
                <span className="font-bold">Jam Operasional: {profile.openTime} - {profile.closeTime}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white p-1 rounded-2xl border border-[#ffe1e3] shadow-sm overflow-x-auto no-scrollbar">
            {[
              { label: 'Semua', value: 'Semua' },
              { label: 'Baru', value: 'menunggu' },
              { label: 'Proses', value: 'proses' },
              { label: 'Siap', value: 'siap' },
              { label: 'Selesai', value: 'selesai' }
            ].map(tab => (
              <button key={tab.value} onClick={() => setActiveCategory(tab.value as any)}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === tab.value ? 'bg-[#b7120d] text-white shadow-lg' : 'text-[#4d2127]/40 hover:text-[#b7120d]'}`}>
                {tab.label}
              </button>
            ))}
          </div>
          <button onClick={async () => {
              if (window.confirm('Yakin ingin membersihkan pesanan selesai & dibatalkan?')) {
                try {
                  await orderService.clearHistory();
                  alert('Pesanan berhasil dibersihkan');
                  fetchData();
                } catch (e) {
                  alert('Gagal membersihkan pesanan');
                }
              }
            }}
            className="bg-white text-[#4d2127] border border-[#ffe1e3] px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-[#fff4f4] transition-all">
            <Trash2 className="w-4 h-4" /> Bersihkan
          </button>
          <button onClick={() => setIsAddModalOpen(true)}
            className="bg-[#b7120d] text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-red-900/20">
            <Plus className="w-4 h-4" /> Tambah
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-[#b7120d]" /></div>
      ) : (
        <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredOrders.map(order => {
            const isEditing = editingOrderId === order.id;
            const items = isEditing ? editItems : (order.items || []);
            return (
              <div key={order.id} className="bg-white rounded-[1.75rem] border border-[#ffe1e3] shadow-lg overflow-hidden flex flex-col group hover:border-[#b7120d]/30 transition-all duration-300">
                {/* Header */}
                <div className={`p-5 transition-colors duration-300 ${order.status === 'menunggu' ? 'bg-[#b7120d] text-white' : 'bg-white border-b border-[#ffe1e3]'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      {/* Order code: MEJA X - #ABCDE */}
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${order.status === 'menunggu' ? 'bg-white/20 text-white' : 'bg-[#fff4f4] text-[#b7120d]'}`}>
                          MEJA {getTableNumber(order)}
                        </span>
                        {/* Order Type Badge */}
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                          order.type === 'take_away' || order.type === 'takeaway'
                            ? (order.status === 'menunggu' ? 'bg-white/20 text-white' : 'bg-orange-50 text-orange-600')
                            : (order.status === 'menunggu' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600')
                        }`}>
                          {order.type === 'take_away' || order.type === 'takeaway' ? '🥡 Bungkus' : '🍽️ Di Tempat'}
                        </span>
                        {order.status === 'menunggu' && (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-extrabold tracking-tighter">#{shortCode(order)}</h3>
                      <p className={`text-[9px] font-medium mt-0.5 ${order.status === 'menunggu' ? 'opacity-70' : 'opacity-40'}`}>
                        {order.customerName}
                      </p>
                    </div>
                    {/* Time & date */}
                    <div className="flex flex-col items-end gap-1 text-right">
                      <div className="flex items-center gap-1 opacity-80">
                        <Clock className="w-3 h-3" />
                        <span className="text-[11px] font-bold">{formatTime(order.createdAt)}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${order.status === 'menunggu' ? 'bg-white/20' : 'bg-[#fff4f4] text-[#b7120d]'}`}>
                        {getTimeAgo(order.createdAt)}
                      </span>
                      <span className="text-[8px] opacity-50 font-medium">{formatDate(order.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="p-5 flex-1 space-y-3">
                  {items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {isEditing ? (
                          <div className="flex items-center gap-1 bg-[#fff4f4] rounded-full px-1.5 py-0.5 border border-[#ffe1e3]">
                            <button onClick={() => changeEditQty(idx, -1)} className="text-[#b7120d] p-0.5 rounded-full hover:bg-red-100"><Minus className="w-3 h-3" /></button>
                            <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                            <button onClick={() => changeEditQty(idx, 1)} className="text-[#b7120d] p-0.5 rounded-full hover:bg-red-100"><Plus className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <span className="bg-[#fff4f4] text-[#b7120d] text-xs font-black w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0">{item.quantity}</span>
                        )}
                        <span className="text-sm font-medium truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold opacity-40">Rp {(Number(item.price) * item.quantity).toLocaleString('id-ID')}</span>
                        {isEditing && (
                          <button onClick={() => removeEditItem(idx)} className="p-1 text-red-400 hover:text-red-600 transition-colors">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Special Note */}
                  {!isEditing && order.specialNote && (
                    <div className="mt-3 pt-3 border-t border-[#ffe1e3]">
                      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-start gap-2">
                        <span className="text-amber-500 text-sm mt-0.5 flex-shrink-0">📝</span>
                        <p className="text-[10px] font-bold text-amber-800 leading-snug">{order.specialNote}</p>
                      </div>
                    </div>
                  )}

                  {/* Add menu while editing */}
                  {isEditing && (
                    <div className="mt-3 border-t border-[#ffe1e3] pt-3">
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 opacity-30" />
                        <input
                          type="text"
                          placeholder="Tambah menu..."
                          value={editSearch}
                          onChange={e => setEditSearch(e.target.value)}
                          className="w-full bg-[#fff4f4] border-none pl-8 pr-3 py-2 rounded-xl text-xs font-bold outline-none"
                        />
                      </div>
                      {editSearch.trim() && (
                        <div className="max-h-40 overflow-y-auto space-y-1 no-scrollbar">
                          {menuItems
                            .filter(m => m.name.toLowerCase().includes(editSearch.toLowerCase()))
                            .slice(0, 8)
                            .map(m => (
                              <button
                                key={m.id}
                                onClick={() => { addToEditItems(m); setEditSearch(''); }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-[#ffe1e3] hover:border-[#b7120d] hover:bg-red-50 transition-all text-left group"
                              >
                                <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                                  <img src={m.imageUrl} alt={m.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] font-bold truncate">{m.name}</p>
                                  <p className="text-[9px] text-[#b7120d] font-black">Rp {Number(m.price).toLocaleString('id-ID')}</p>
                                </div>
                                <Plus className="w-3.5 h-3.5 text-[#b7120d] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                              </button>
                            ))}
                          {menuItems.filter(m => m.name.toLowerCase().includes(editSearch.toLowerCase())).length === 0 && (
                            <p className="text-center text-[10px] opacity-30 py-2 font-bold">Menu tidak ditemukan</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-5 bg-[#fff4f4]/30 border-t border-[#ffe1e3]">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-bold opacity-40 uppercase tracking-wider">Total</span>
                    <span className="text-base font-black text-[#b7120d]">
                      {isEditing
                        ? `Rp ${editItems.reduce((s, i) => s + Number(i.price) * i.quantity, 0).toLocaleString('id-ID')}`
                        : `Rp ${Number(order.total).toLocaleString('id-ID')}`
                      }
                    </span>
                  </div>

                  {/* Edit controls */}
                  {isEditing ? (
                    <div className="flex gap-2 mb-3">
                      <button onClick={cancelEdit} className="flex-1 py-2 rounded-xl border border-[#ffe1e3] text-xs font-black text-[#b7120d] hover:bg-red-50 transition-all">Batal</button>
                      <button onClick={() => saveEdit(order.id)} disabled={savingEdit || editItems.length === 0}
                        className="flex-1 py-2 rounded-xl bg-[#b7120d] text-white text-xs font-black flex items-center justify-center gap-1 disabled:opacity-50 hover:bg-[#a0100b] transition-all">
                        {savingEdit ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Simpan
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(order)} className="w-full mb-2 py-2 rounded-xl border border-[#ffe1e3] text-[10px] font-black text-[#b7120d] hover:bg-red-50 flex items-center justify-center gap-1.5 transition-all">
                      <Edit2 className="w-3 h-3" /> Edit Pesanan
                    </button>
                  )}

                  <div className="grid grid-cols-1 gap-2">
                    {order.status === 'menunggu' && (
                      <button onClick={() => updateStatus(order.id, 'proses')}
                        className="col-span-1 bg-[#b7120d] text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#8b0e0a] transition-all shadow-lg shadow-red-900/20">
                        <Play className="w-4 h-4" /> TERIMA & PROSES
                      </button>
                    )}
                    {order.status === 'proses' && (
                      <button onClick={() => updateStatus(order.id, 'siap')}
                        className="col-span-1 bg-[#b7120d] text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#8b0e0a] transition-all shadow-lg shadow-red-900/20">
                        <CheckCircle className="w-4 h-4" /> SELESAI MASAK
                      </button>
                    )}
                    {order.status === 'siap' && (
                      <button onClick={() => updateStatus(order.id, 'selesai')}
                        className="col-span-1 bg-green-600 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-green-700 transition-colors shadow-lg shadow-green-900/20">
                        <CheckCircle className="w-4 h-4" /> BAYAR & SELESAI
                      </button>
                    )}
                    {order.status === 'selesai' && (
                      <div className="col-span-1 flex items-center justify-center gap-2 text-green-600 font-bold text-xs py-2.5 bg-green-50 rounded-xl border border-green-100">
                        <CheckCircle className="w-4 h-4" /> PESANAN SELESAI
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredOrders.length === 0 && !loading && (
            <div className="col-span-full border-2 border-dashed border-[#ffe1e3] rounded-[2rem] p-20 flex flex-col items-center justify-center text-center opacity-40">
              <AlertCircle className="w-16 h-16 mb-4" />
              <h3 className="text-xl font-black uppercase tracking-[0.2em]">Kosong</h3>
              <p className="text-sm font-bold opacity-60 mt-2">Tidak ada pesanan dengan status <span className="text-[#b7120d]">{activeCategory}</span></p>
            </div>
          )}
        </main>
      )}

      {/* Add Order Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[80vh] animate-modal-up">
            {/* Left: Menu */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[#fff4f4]/30 border-r border-[#ffe1e3]">
              <div className="p-5 border-b border-[#ffe1e3] bg-white">
                <h3 className="text-lg font-black uppercase tracking-tight mb-3">Pilih Menu</h3>
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                    <input type="text" placeholder="Cari menu..." className="w-full bg-[#fff4f4] border-none pl-11 pr-4 py-2.5 rounded-xl text-sm font-bold outline-none"
                      value={menuSearch} onChange={e => setMenuSearch(e.target.value)} />
                  </div>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {['Semua', ...categories].map(cat => (
                      <button key={cat} onClick={() => setMenuFilter(cat)}
                        className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${menuFilter === cat ? 'bg-[#b7120d] text-white' : 'bg-white border border-[#ffe1e3] text-[#4d2127]/40'}`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 lg:grid-cols-3 gap-3 no-scrollbar content-start">
                {menuItems.filter(item => (menuFilter === 'Semua' || item.category === menuFilter) && item.name.toLowerCase().includes(menuSearch.toLowerCase()))
                  .map(item => (
                    <button key={item.id} onClick={() => addToNewOrder(item)}
                      className="flex flex-col gap-2 p-2 bg-white rounded-xl border border-[#ffe1e3] hover:border-[#b7120d] hover:scale-[1.02] transition-all text-left group h-fit">
                      <div className="w-full aspect-square rounded-lg overflow-hidden">
                        <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.name} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[10px] truncate">{item.name}</p>
                        <p className="text-[9px] font-black text-[#b7120d] mt-0.5">Rp {Number(item.price).toLocaleString('id-ID')}</p>
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            {/* Right: Order */}
            <div className="w-full md:w-[320px] flex flex-col bg-white">
              <div className="p-5 border-b border-[#ffe1e3] flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Pesanan</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-black opacity-40 uppercase">Meja:</span>
                    <select value={selectedTableId} onChange={e => setSelectedTableId(e.target.value)}
                      className="bg-[#fff4f4] border-none text-[10px] font-black rounded-lg px-2 py-1 outline-none">
                      {tables.map(t => <option key={t.id} value={t.id}>Meja {t.number}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-[#fff4f4] rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3 no-scrollbar">
                {newOrderItems.map(item => (
                  <div key={item.menuId} className="flex justify-between items-center group">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-[#fff4f4] rounded-full px-1.5 py-0.5 border border-[#ffe1e3]">
                        <button onClick={() => setNewOrderItems(prev => prev.map(i => i.menuId === item.menuId ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))} className="text-[#b7120d]"><Minus className="w-3 h-3" /></button>
                        <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                        <button onClick={() => setNewOrderItems(prev => prev.map(i => i.menuId === item.menuId ? { ...i, quantity: i.quantity + 1 } : i))} className="text-[#b7120d]"><Plus className="w-3 h-3" /></button>
                      </div>
                      <p className="text-sm font-bold truncate max-w-[120px]">{item.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-bold opacity-40">Rp {(Number(item.price) * item.quantity).toLocaleString('id-ID')}</p>
                      <button onClick={() => removeFromNewOrder(item.menuId)} className="p-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
                {newOrderItems.length === 0 && <div className="py-16 text-center opacity-20"><p className="text-sm font-bold uppercase tracking-widest">Belum ada menu</p></div>}
              </div>

              <div className="p-5 bg-[#fff4f4]/30 border-t border-[#ffe1e3]">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Subtotal</span>
                  <span className="text-lg font-black text-[#b7120d]">Rp {newOrderItems.reduce((acc, i) => acc + (Number(i.price) * i.quantity), 0).toLocaleString('id-ID')}</span>
                </div>
                <button disabled={newOrderItems.length === 0} onClick={addNewOrder}
                  className="w-full bg-[#b7120d] text-white py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100">
                  SIMPAN PESANAN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}` }} />
    </div>
  );
};

export default CashierDashboard;
