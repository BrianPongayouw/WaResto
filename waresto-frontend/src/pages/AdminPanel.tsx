import React, { useState, useEffect } from 'react';
import type { MenuItem, Order, Table, MenuOption } from '../data/mockData';
import {
  Plus, Edit2, Trash2, LayoutGrid, List, BarChart3, Settings,
  LogOut, ChevronRight, Search, Filter, CheckCircle2, Clock,
  AlertCircle, Bell, BellRing, DollarSign, TrendingUp, Users, X, Upload, Image as ImageIcon, Loader2, RefreshCw
} from 'lucide-react';
import { menuService } from '../api/menuService';
import { orderService } from '../api/orderService';
import { tableService } from '../api/tableService';
import { apiClient } from '../api/client';

const AdminPanel: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'menu' | 'orders' | 'tables' | 'settings'>('dashboard');

  // Restaurant settings state
  const [restaurantSettings, setRestaurantSettings] = useState<any>(null);
  const [settingsHeroPreview, setSettingsHeroPreview] = useState('');
  const [settingsHeroFile, setSettingsHeroFile] = useState<File | null>(null);
  const [settingsGoogleMapsUrl, setSettingsGoogleMapsUrl] = useState('');
  const [settingsRating, setSettingsRating] = useState('4.8');
  const [settingsReviewCount, setSettingsReviewCount] = useState('250');
  const [settingsOpenTime, setSettingsOpenTime] = useState('08:00');
  const [settingsCloseTime, setSettingsCloseTime] = useState('22:00');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catsData, itemsData, ordersData, tablesData, statsData, profileData] = await Promise.all([
          menuService.getCategories(),
          menuService.getMenus(),
          orderService.getOrders(),
          tableService.getTables(),
          apiClient.get('/dashboard/stats').then(res => res.data),
          apiClient.get('/restaurant/profile').then(res => res.data).catch(() => null),
        ]);

        setCategories(catsData.map((c: any) => c.name));
        setMenuItems(itemsData);
        setOrders(ordersData);
        setTables(tablesData);
        setStats(statsData);
        if (profileData) {
          setRestaurantSettings(profileData);
          setSettingsHeroPreview(profileData.heroImageUrl || '');
          setSettingsGoogleMapsUrl(profileData.googleMapsUrl || '');
          setSettingsRating(profileData.rating ? parseFloat(profileData.rating).toString() : '4.8');
          setSettingsReviewCount(profileData.reviewCount ? profileData.reviewCount.toString() : '250');
          setSettingsOpenTime(profileData.openTime || '08:00');
          setSettingsCloseTime(profileData.closeTime || '22:00');
        }
      } catch (err) {
        console.error('Failed to fetch admin data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const eventSource = new EventSource(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/v1'}/events/orders`);
    eventSource.addEventListener('new_order', (e) => {
      const o = JSON.parse(e.data);
      setOrders(prev => [o, ...prev]);
      apiClient.get('/dashboard/stats').then(res => setStats(res.data));
    });
    eventSource.addEventListener('status_changed', (e) => {
      const o = JSON.parse(e.data);
      setOrders(prev => prev.map(x => x.id === o.id ? { ...x, ...o } : x));
      apiClient.get('/dashboard/stats').then(res => setStats(res.data));
    });

    return () => eventSource.close();
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, badge: false },
    { id: 'menu', label: 'Kelola Menu', icon: LayoutGrid, badge: false },
    { id: 'tables', label: 'Status Meja', icon: Users, badge: false },
    { id: 'settings', label: 'Pengaturan', icon: Settings, badge: false },
  ];

  const activeIndex = navItems.findIndex(item => item.id === activeTab);

  // Filters for Menu
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState<'Semua' | 'Aktif' | 'Nonaktif'>('Semua');
  const [newCategoryName, setNewCategoryName] = useState('');

  const addCategory = async () => {
    if (newCategoryName.trim() && !categories.includes(newCategoryName.trim())) {
      try {
        await menuService.createCategory({ name: newCategoryName.trim(), description: '' });
        setCategories([...categories, newCategoryName.trim()]);
        setNewCategoryName('');
      } catch (err) {
        console.error('Failed to add category:', err);
      }
    }
  };

  const removeCategory = async (cat: string) => {
    try {
      // Need ID to delete, assuming cat is name for now or we need a lookup
      // Simplified for now
      setCategories(categories.filter(c => c !== cat));
      if (filterCategory === cat) setFilterCategory('Semua');
    } catch (err) {
      console.error('Failed to remove category:', err);
    }
  };
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [isQrGenerated, setIsQrGenerated] = useState(false);

  const addTable = async () => {
    if (newTableNumber.trim() && !tables.find(t => t.number === newTableNumber.trim())) {
      try {
        const newTable = await tableService.createTable({
          number: newTableNumber.trim(),
          capacity: 4
        });
        setTables([...tables, newTable]);
        setNewTableNumber('');
        setIsQrGenerated(false);
        setIsTableModalOpen(false);
      } catch (err) {
        console.error('Failed to add table:', err);
      }
    }
  };

  const removeTable = async (id: string) => {
    try {
      await tableService.deleteTable(id);
      setTables(tables.filter(t => t.id !== id));
    } catch (err) {
      console.error('Failed to remove table:', err);
    }
  };
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    category: categories[0] || 'Uncategorized',
    imagePreview: '',
    imageFile: null as File | null,
    options: [] as MenuOption[]
  });

  const openEditModal = (item: any) => {
    setEditingMenuId(item.id);
    setNewItem({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      category: item.category || categories[0] || 'Uncategorized',
      imagePreview: item.imageUrl,
      imageFile: null,
      options: item.options || []
    });
    setIsAddModalOpen(true);
  };

  const deleteMenu = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus menu ini?')) return;
    try {
      await menuService.deleteMenu(id);
      setMenuItems(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      alert('Gagal menghapus menu.');
    }
  };

  const addMenu = async () => {
    try {
      let imageUrl = '';
      if (newItem.imageFile) {
        imageUrl = await menuService.uploadImage(newItem.imageFile);
      }

      const menuData = {
        name: newItem.name,
        description: newItem.description,
        price: Number(newItem.price),
        category: newItem.category,
        imageUrl: imageUrl,
        isAvailable: true,
        options: newItem.options,
      };

      if (editingMenuId) {
        const updatedMenu = await menuService.updateMenu(editingMenuId, menuData);
        setMenuItems(prev => prev.map(m => m.id === editingMenuId ? updatedMenu : m));
      } else {
        const createdMenu = await menuService.createMenu(menuData);
        setMenuItems(prev => [createdMenu, ...prev]);
      }

      setIsAddModalOpen(false);
      setEditingMenuId(null);
      setNewItem({
        name: '',
        description: '',
        price: '',
        category: categories[0] || 'Uncategorized',
        imagePreview: '',
        imageFile: null,
        options: []
      });
    } catch (error) {
      console.error('Failed to create menu:', error);
      alert('Gagal membuat menu.');
    }
  };

  const addOptionGroup = () => {
    const newOption: MenuOption = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      choices: [''],
      required: false
    };
    setNewItem(prev => ({
      ...prev,
      options: [...prev.options, newOption]
    }));
  };

  const removeOptionGroup = (groupId: string) => {
    setNewItem(prev => ({
      ...prev,
      options: prev.options.filter(opt => opt.id !== groupId)
    }));
  };

  const updateOptionName = (groupId: string, name: string) => {
    setNewItem(prev => ({
      ...prev,
      options: prev.options.map(opt => opt.id === groupId ? { ...opt, name } : opt)
    }));
  };

  const addChoice = (groupId: string) => {
    setNewItem(prev => ({
      ...prev,
      options: prev.options.map(opt =>
        opt.id === groupId ? { ...opt, choices: [...opt.choices, ''] } : opt
      )
    }));
  };

  const updateChoice = (groupId: string, choiceIndex: number, value: string) => {
    setNewItem(prev => ({
      ...prev,
      options: prev.options.map(opt =>
        opt.id === groupId ? {
          ...opt,
          choices: opt.choices.map((c, i) => i === choiceIndex ? value : c)
        } : opt
      )
    }));
  };

  const removeChoice = (groupId: string, choiceIndex: number) => {
    setNewItem(prev => ({
      ...prev,
      options: prev.options.map(opt =>
        opt.id === groupId ? {
          ...opt,
          choices: opt.choices.filter((_, i) => i !== choiceIndex)
        } : opt
      )
    }));
  };

  // Notification logic
  const [newOrderAlert, setNewOrderAlert] = useState(false);

  useEffect(() => {
    // Simulate a new order after 5 seconds for demo
    const timer = setTimeout(() => {
      setNewOrderAlert(true);
      // Play a subtle sound if possible (browser security might block auto-play without interaction)
      // new Audio('/notification.mp3').play().catch(() => {});
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  const toggleAvailability = async (id: string) => {
    const item = menuItems.find(i => i.id === id);
    if (!item) return;

    try {
      await menuService.updateMenu(id, { isAvailable: !item.isAvailable });
      setMenuItems(prev => prev.map(item =>
        item.id === id ? { ...item, isAvailable: !item.isAvailable } : item
      ));
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    }
  };

  const filteredMenu = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'Semua' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'Semua' ||
      (filterStatus === 'Aktif' ? item.isAvailable : !item.isAvailable);
    return matchesSearch && matchesCategory && matchesStatus;
  });


  const renderDashboard = () => {
    if (!stats) return <div className="flex items-center justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-[#b7120d]" /></div>;

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/70 backdrop-blur-lg p-8 rounded-[2.5rem] border border-white/50 shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Pendapatan Hari Ini</p>
                <h3 className="text-2xl font-black font-plus-jakarta">Rp {Number(stats.todayRevenue || 0).toLocaleString('id-ID')}</h3>
              </div>
            </div>
            <div className={`flex items-center gap-2 text-xs font-bold w-fit px-2 py-1 rounded-full ${(stats.revenueGrowth || 0) >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
              }`}>
              <TrendingUp className="w-3 h-3" />
              <span>{(stats.revenueGrowth || 0) >= 0 ? '+' : ''}{stats.revenueGrowth || 0}% dari kemarin</span>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-lg p-8 rounded-[2.5rem] border border-white/50 shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Total Pesanan</p>
                <h3 className="text-2xl font-black font-plus-jakarta">{stats.totalOrders || 0} Pesanan</h3>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 w-fit px-2 py-1 rounded-full">
              <Clock className="w-3 h-3" />
              <span>{stats.pendingOrders || 0} pesanan baru</span>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-lg rounded-[2.5rem] border border-white/50 p-8 shadow-xl">
          <h4 className="text-xl font-black font-plus-jakarta mb-6">Pesanan Terbaru</h4>
          <div className="space-y-4">
            {orders.slice(0, 5).map(order => (
              <div key={order.id} className="flex items-center justify-between p-4 rounded-2xl border border-[#fff4f4] hover:bg-[#fff4f4]/50 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${order.status === 'menunggu' ? 'bg-red-50 text-red-600' :
                      order.status === 'proses' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                    }`}>
                    {order.status === 'menunggu' ? <AlertCircle className="w-5 h-5" /> :
                      order.status === 'proses' ? <Clock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm">Meja {order.tableNumber} - {order.id.split('-')[0]}</p>
                    <p className="text-[10px] opacity-40">{order.items?.length || 0} item • Rp {Number(order.total || 0).toLocaleString('id-ID')}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${order.status === 'menunggu' ? 'bg-red-100 text-red-600' :
                    order.status === 'proses' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                  }`}>
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-lg rounded-[2.5rem] border border-white/50 p-8 shadow-xl">
          <h4 className="text-xl font-black font-plus-jakarta mb-6">Aksi Operasional</h4>
          <div className="flex gap-4">
            <button
              onClick={async () => {
                if (window.confirm('Yakin ingin membersihkan history pesanan (selesai & dibatalkan)?')) {
                  await orderService.clearHistory();
                  alert('History pesanan berhasil dibersihkan.');
                  // trigger reload
                  window.location.reload();
                }
              }}
              className="px-6 py-3 bg-white text-[#4d2127] border border-[#ffe1e3] rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4 text-gray-500" />
              Clear History Pesanan
            </button>

            <button
              onClick={async () => {
                if (window.confirm('PERHATIAN: Yakin ingin memulai hari baru? Semua pesanan saat ini akan dihapus dan pendapatan hari ini akan direset ke nol.')) {
                  await orderService.startNewDay();
                  alert('Hari baru berhasil dimulai.');
                  // trigger reload
                  window.location.reload();
                }
              }}
              className="px-6 py-3 bg-[#b7120d] text-white rounded-2xl font-bold text-sm hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-900/20 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Mulai Hari Baru
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderMenuManagement = () => (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-8 bg-white p-4 rounded-3xl border border-[#ffe1e3]">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
          <input
            type="text"
            placeholder="Cari menu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#fff4f4] border-none rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-[#b7120d]/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 bg-[#fff4f4] px-4 py-3 rounded-xl border border-[#ffe1e3]/50">
          <Filter className="w-4 h-4 opacity-30" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-transparent border-none text-sm font-bold focus:ring-0 p-0"
          >
            <option value="Semua">Semua Kategori</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 bg-[#fff4f4] px-4 py-3 rounded-none border border-[#ffe1e3]/50">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-transparent border-none text-sm font-bold focus:ring-0 p-0"
          >
            <option value="Semua">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Nonaktif">Nonaktif</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-none border border-[#ffe1e3] shadow-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#fff4f4]/50 border-b border-[#ffe1e3]">
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Item</th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Kategori</th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Harga</th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Status</th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredMenu.map((item) => (
              <tr key={item.id} className="border-b border-[#fff4f4] hover:bg-[#fff4f4]/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-none overflow-hidden border border-[#ffe1e3] shadow-sm">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{item.name}</p>
                      <p className="text-[10px] opacity-40 line-clamp-1">{item.description}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-bold px-3 py-1 rounded-none bg-[#fff4f4] border border-[#ffe1e3] text-[#b7120d]">
                    {item.category || 'Tanpa Kategori'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-bold text-sm">Rp {Number(item.price).toLocaleString('id-ID')}</p>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleAvailability(item.id)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${item.isAvailable ? 'bg-[#b7120d]' : 'bg-gray-200'
                      }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${item.isAvailable ? 'left-7' : 'left-1'
                      }`} />
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-2 hover:bg-[#fff4f4] rounded-none transition-all text-[#a1676d]"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteMenu(item.id)}
                      className="p-2 hover:bg-red-50 rounded-none transition-all text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTableStatus = () => (
    <div className="max-w-6xl">
      <div className="bg-white/70 backdrop-blur-lg rounded-xl border border-white/50 shadow-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#b7120d] text-white">
              <th className="px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em]">Nomor Meja</th>
              <th className="px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em]">Status</th>
              <th className="px-6 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ffe1e3]">
            {tables.map((table) => (
              <tr key={table.id} className="hover:bg-white/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#fff4f4] text-[#b7120d] rounded-2xl flex items-center justify-center font-black text-lg shadow-sm border border-[#ffe1e3]">
                      {table.number}
                    </div>
                    <span className="font-bold text-sm">Meja {table.number}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[8px] font-black px-3 py-1 rounded-md uppercase tracking-[0.12em] border ${table.status === 'Terisi'
                      ? 'bg-red-50 text-red-600 border-red-100 animate-pulse'
                      : 'bg-green-50 text-green-600 border-green-100'
                    }`}>
                    {table.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => removeTable(table.id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex gap-8 p-4 bg-white/40 backdrop-blur-sm rounded-xl border border-white/50 w-fit">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-none bg-green-500"></div>
          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Tidak Terisi</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-none bg-red-500 animate-pulse"></div>
          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Terisi</span>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => {
    const saveSettings = async () => {
      try {
        setSettingsSaving(true);
        let heroImageUrl = restaurantSettings?.heroImageUrl || '';

        // Upload hero image if new file selected
        if (settingsHeroFile) {
          heroImageUrl = await menuService.uploadImage(settingsHeroFile);
        }

        await apiClient.patch('/restaurant/profile', {
          heroImageUrl,
          googleMapsUrl: settingsGoogleMapsUrl,
          rating: parseFloat(settingsRating) || 4.8,
          reviewCount: parseInt(settingsReviewCount) || 250,
          openTime: settingsOpenTime,
          closeTime: settingsCloseTime,
        });

        setRestaurantSettings((prev: any) => ({
          ...prev,
          heroImageUrl,
          googleMapsUrl: settingsGoogleMapsUrl,
          rating: settingsRating,
          reviewCount: settingsReviewCount,
          openTime: settingsOpenTime,
          closeTime: settingsCloseTime,
        }));
        setSettingsHeroPreview(heroImageUrl);
        setSettingsHeroFile(null);
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 3000);
      } catch (err) {
        console.error('Failed to save settings:', err);
        alert('Gagal menyimpan pengaturan.');
      } finally {
        setSettingsSaving(false);
      }
    };

    return (
      <div className="max-w-6xl space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Hero Image Section */}
            <div className="bg-white/70 backdrop-blur-lg rounded-[2.5rem] border border-white/50 shadow-xl p-8">
              <h3 className="text-xl font-black font-plus-jakarta mb-2">Foto Hero Halaman Customer</h3>
              <p className="text-xs opacity-40 font-medium mb-6">Gambar ini ditampilkan di bagian atas halaman menu customer. Rekomendasi: 1200×400px.</p>

              <div className="flex flex-col gap-6">
                {/* Preview */}
                <div className="w-full h-48 rounded-2xl overflow-hidden border-2 border-dashed border-[#ffe1e3] bg-[#fff4f4] relative">
                  {settingsHeroPreview ? (
                    <img src={settingsHeroPreview} alt="Hero Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      <ImageIcon className="w-10 h-10 opacity-20" />
                      <p className="text-[10px] font-bold opacity-30">Belum ada gambar</p>
                    </div>
                  )}
                </div>

                {/* Upload Controls */}
                <div className="flex flex-col gap-4">
                  <label className="cursor-pointer group">
                    <div className="flex items-center gap-3 p-4 bg-[#fff4f4] rounded-2xl border border-[#ffe1e3] hover:border-[#b7120d] hover:bg-red-50/30 transition-all">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <Upload className="w-5 h-5 text-[#b7120d]" />
                      </div>
                      <div>
                        <p className="text-sm font-black">Upload Foto Hero</p>
                        <p className="text-[10px] opacity-40 font-medium">JPG, PNG, WEBP • Maks. 2MB</p>
                      </div>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSettingsHeroFile(file);
                          setSettingsHeroPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                  {settingsHeroFile && (
                    <p className="text-[10px] font-bold text-[#b7120d] bg-red-50 px-3 py-2 rounded-xl">
                      📎 {settingsHeroFile.name} — belum tersimpan
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Google Maps Section */}
            <div className="bg-white/70 backdrop-blur-lg rounded-[2.5rem] border border-white/50 shadow-xl p-8">
              <h3 className="text-xl font-black font-plus-jakarta mb-2">Link Google Maps</h3>
              <p className="text-xs opacity-40 font-medium mb-6">URL ini ditampilkan sebagai tombol "Lihat di Google Maps" di halaman customer.</p>

              <div className="space-y-4">
                <input
                  type="url"
                  placeholder="https://maps.google.com/?cid=..."
                  className="w-full bg-[#fff4f4] border-none px-5 py-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#b7120d]/20 transition-all outline-none"
                  value={settingsGoogleMapsUrl}
                  onChange={(e) => setSettingsGoogleMapsUrl(e.target.value)}
                />
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-blue-700 mb-1">📍 Cara mendapatkan link:</p>
                  <p className="text-[10px] text-blue-600 font-medium leading-relaxed">
                    Buka Google Maps → Cari restoran → Klik <strong>Bagikan</strong> → Salin tautan.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Rating & Review Section */}
            <div className="bg-white/70 backdrop-blur-lg rounded-[2.5rem] border border-white/50 shadow-xl p-8">
              <h3 className="text-xl font-black font-plus-jakarta mb-2">Rating & Ulasan</h3>
              <p className="text-xs opacity-40 font-medium mb-6">Nilai rating dan jumlah ulasan yang ditampilkan di halaman menu customer.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Rating (1.0 – 5.0)</label>
                  <input
                    type="number"
                    min="1" max="5" step="0.1"
                    placeholder="4.8"
                    className="w-full bg-[#fff4f4] border-none px-5 py-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#b7120d]/20 transition-all outline-none"
                    value={settingsRating}
                    onChange={(e) => setSettingsRating(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Jumlah Ulasan</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="250"
                    className="w-full bg-[#fff4f4] border-none px-5 py-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#b7120d]/20 transition-all outline-none"
                    value={settingsReviewCount}
                    onChange={(e) => setSettingsReviewCount(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Jam Operasional Section */}
            <div className="bg-white/70 backdrop-blur-lg rounded-[2.5rem] border border-white/50 shadow-xl p-8">
              <h3 className="text-xl font-black font-plus-jakarta mb-2">Jam Operasional</h3>
              <p className="text-xs opacity-40 font-medium mb-6">Waktu buka dan tutup restoran.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Jam Buka</label>
                  <input
                    type="time"
                    className="w-full bg-[#fff4f4] border-none px-5 py-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#b7120d]/20 transition-all outline-none"
                    value={settingsOpenTime}
                    onChange={(e) => setSettingsOpenTime(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Jam Tutup</label>
                  <input
                    type="time"
                    className="w-full bg-[#fff4f4] border-none px-5 py-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#b7120d]/20 transition-all outline-none"
                    value={settingsCloseTime}
                    onChange={(e) => setSettingsCloseTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={saveSettings}
          disabled={settingsSaving}
          className={`w-full py-5 font-black text-sm uppercase tracking-[0.2em] rounded-[2rem] flex items-center justify-center gap-3 transition-all ${settingsSaved
              ? 'bg-green-500 text-white shadow-lg shadow-green-900/20'
              : 'bg-[#b7120d] text-white shadow-xl shadow-red-900/20 hover:scale-[1.01] active:scale-[0.99]'
            } disabled:opacity-60 disabled:scale-100`}
        >
          {settingsSaving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
          ) : settingsSaved ? (
            <>✓ Tersimpan!</>
          ) : (
            <>Simpan Pengaturan</>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#fff4f4] flex font-be-vietnam text-[#4d2127] relative overflow-hidden">
      {/* Background Image Layer with Opacity */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-20"
        style={{ backgroundImage: 'url("/fotobackground.png")' }}
      ></div>
      {/* Sidebar - Adjusted for Topbar */}
      <aside className="w-72 bg-white/80 backdrop-blur-xl border-r border-[#ffe1e3] p-8 flex flex-col h-[calc(100vh-64px)] sticky top-0 z-20">
        <div className="mb-8 hidden">
          <h1 className="text-2xl font-black font-plus-jakarta text-[#b7120d] tracking-tighter">WaResto</h1>
          <p className="text-[10px] font-bold opacity-40 uppercase tracking-[0.2em] mt-1">Admin Console</p>
        </div>

        <nav className="space-y-2 flex-1 overflow-y-auto no-scrollbar relative">
          {/* Sliding Indicator */}
          <div
            className="absolute left-0 right-0 h-11 bg-[#b7120d] rounded-2xl transition-all duration-400 shadow-lg shadow-red-900/20"
            style={{
              transform: `translateY(${activeIndex * (44 + 8)}px)`,
              top: '0px',
              transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />

          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all relative z-10 ${activeTab === item.id ? 'text-white' : 'hover:bg-[#fff4f4] text-[#4d2127] opacity-60 hover:opacity-100'
                }`}
            >
              <div className="flex items-center gap-4">
                <item.icon className={`w-5 h-5 transition-transform duration-500 ${activeTab === item.id ? 'scale-110' : ''}`} />
                <span className="text-sm font-bold">{item.label}</span>
              </div>
              {item.badge && orders.filter(o => o.status === 'Baru').length > 0 && (
                <span className={`text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-500 ${activeTab === item.id ? 'bg-white text-[#b7120d]' : 'bg-red-500 text-white'
                  }`}>
                  {orders.filter(o => o.status === 'Baru').length}
                </span>
              )}
            </button>
          ))}

        </nav>

        <div className="pt-8 border-t border-[#ffe1e3]">
          <button
            onClick={async () => {
              try {
                await apiClient.post('/sign-out');
              } catch (e) { }
              window.location.href = '/login';
            }}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-red-50 text-red-600 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-bold">Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto no-scrollbar relative z-10 pt-8">

        <header className="flex justify-between items-center mb-10">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold opacity-40 uppercase tracking-widest mb-2">
              <span>Admin</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-[#b7120d]">{activeTab}</span>
            </div>
            <h2 className="text-4xl font-black font-plus-jakarta tracking-tight capitalize">
              {activeTab === 'dashboard' ? 'Overview Dashboard' :
                activeTab === 'menu' ? 'Manajemen Menu' :
                  activeTab === 'orders' ? 'Antrean Pesanan' :
                    activeTab === 'tables' ? 'Denah & Status Meja' :
                      activeTab === 'settings' ? 'Pengaturan Restoran' : 'Manajemen Kategori'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {activeTab !== 'settings' && (
              <button
                onClick={() => setIsSelectionModalOpen(true)}
                className="bg-[#b7120d] text-white px-8 py-3 rounded-none font-black text-xs tracking-widest flex items-center gap-2 shadow-lg shadow-red-900/20 hover:scale-105 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                TAMBAH
              </button>
            )}
          </div>
        </header>

        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'menu' && renderMenuManagement()}
        {activeTab === 'tables' && renderTableStatus()}
        {activeTab === 'settings' && renderSettings()}

        {/* Selection Modal */}
        {isSelectionModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
              onClick={() => setIsSelectionModalOpen(false)}
            ></div>
            <div className="relative bg-[#b7120d] text-white w-64 shadow-2xl flex flex-col p-2 animate-fade-in rounded-none">
              <button
                onClick={() => {
                  setIsSelectionModalOpen(false);
                  setIsAddModalOpen(true);
                }}
                className="w-full text-left px-6 py-4 hover:bg-white/10 font-bold text-sm transition-colors border-b border-white/10"
              >
                Tambah Menu
              </button>
              <button
                onClick={() => {
                  setIsSelectionModalOpen(false);
                  setIsCategoryModalOpen(true);
                }}
                className="w-full text-left px-6 py-4 hover:bg-white/10 font-bold text-sm transition-colors border-b border-white/10"
              >
                Tambah Kategori
              </button>
              <button
                onClick={() => {
                  setIsSelectionModalOpen(false);
                  setIsTableModalOpen(true);
                }}
                className="w-full text-left px-6 py-4 hover:bg-white/10 font-bold text-sm transition-colors"
              >
                Tambah Meja
              </button>
            </div>
          </div>
        )}

        {/* Add Category Modal (Simplified) */}
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsCategoryModalOpen(false)}
            ></div>
            <div className="relative bg-white w-full max-w-sm rounded-md shadow-2xl overflow-hidden p-10 animate-modal-up">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black font-plus-jakarta">Kelola Kategori</h3>
                <button onClick={() => setIsCategoryModalOpen(false)} className="opacity-40 hover:opacity-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-2 mb-8">
                <input
                  type="text"
                  placeholder="Nama Kategori..."
                  className="flex-1 bg-[#fff4f4] border-none px-4 py-3 rounded-2xl text-sm font-bold"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
                <button
                  onClick={addCategory}
                  className="bg-[#b7120d] text-white p-3 rounded-2xl"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 max-h-[40vh] overflow-y-auto no-scrollbar">
                {categories.map(cat => (
                  <div key={cat} className="flex items-center justify-between p-4 bg-[#fff4f4] rounded-2xl">
                    <span className="text-sm font-bold">{cat}</span>
                    <button
                      onClick={() => removeCategory(cat)}
                      className="text-red-500 opacity-40 hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Add Table Modal */}
        {isTableModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => {
                setIsTableModalOpen(false);
                setIsQrGenerated(false);
              }}
            ></div>
            <div className="relative bg-white w-full max-w-sm rounded-md shadow-2xl overflow-hidden p-10 animate-modal-up">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black font-plus-jakarta uppercase tracking-tighter">Tambah Meja</h3>
                <button
                  onClick={() => {
                    setIsTableModalOpen(false);
                    setIsQrGenerated(false);
                  }}
                  className="opacity-40 hover:opacity-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black opacity-30 uppercase tracking-widest ml-1">Nomor Meja</label>
                  <input
                    type="text"
                    placeholder="Contoh: 1, 2, A1, B5"
                    className="w-full bg-[#fff4f4] border-none px-6 py-4 text-lg font-black rounded-2xl focus:ring-2 focus:ring-[#b7120d]/20 transition-all"
                    value={newTableNumber}
                    onChange={(e) => setNewTableNumber(e.target.value)}
                  />
                </div>

                <button
                  onClick={addTable}
                  disabled={!newTableNumber.trim()}
                  className="w-full bg-[#b7120d] text-white py-4 rounded-2xl font-black text-[11px] tracking-[0.2em] uppercase hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-red-900/20 disabled:opacity-50 disabled:scale-100"
                >
                  SIMPAN MEJA
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Menu Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
              onClick={() => setIsAddModalOpen(false)}
            ></div>

            {/* Modal Box */}
            <div className="relative bg-white w-full max-w-2xl rounded-md shadow-2xl overflow-hidden animate-modal-up flex flex-col md:flex-row h-[80vh]">
              {/* Close Button */}
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingMenuId(null);
                }}
                className="absolute top-6 right-6 z-20 p-2 hover:bg-red-50 rounded-full text-[#4d2127] transition-all bg-white/80 backdrop-blur-md"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Left Side: Upload Photo */}
              <div className="w-full md:w-1/4 bg-[#fff4f4] flex flex-col items-center justify-center p-8 border-r border-[#ffe1e3]">
                <div className="text-center sticky top-8">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-6 text-center">Foto Produk</p>
                  <label className="cursor-pointer group flex flex-col items-center">
                    <div className="w-40 h-40 bg-white border-2 border-dashed border-[#ffe1e3] flex flex-col items-center justify-center gap-4 transition-all group-hover:border-[#b7120d] group-hover:bg-red-50/30 overflow-hidden relative rounded-3xl">
                      {newItem.imagePreview ? (
                        <img src={newItem.imagePreview} className="w-full h-full object-cover" alt="Preview" />
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-[#fff4f4] text-[#b7120d] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Upload className="w-5 h-5" />
                          </div>
                          <p className="text-[10px] font-bold opacity-40">KLIK UNTUK UPLOAD</p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setNewItem({
                            ...newItem,
                            imagePreview: URL.createObjectURL(file),
                            imageFile: file
                          });
                        }
                      }}
                    />
                  </label>
                  <p className="text-[9px] mt-4 opacity-40 leading-relaxed font-medium">
                    Format: JPG, PNG, WEBP<br />Maksimal 2MB
                  </p>
                </div>
              </div>

              {/* Middle Section: Basic Information */}
              <div className="w-full md:w-1/3 p-8 flex flex-col border-r border-[#ffe1e3] overflow-y-auto no-scrollbar">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-6">
                  {editingMenuId ? 'Edit Informasi' : 'Informasi Dasar'}
                </p>

                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black opacity-30 uppercase tracking-widest ml-1">Nama Menu</label>
                    <input
                      type="text"
                      placeholder="Contoh: Ayam Bakar Madu"
                      className="w-full bg-[#fff4f4] border-none px-4 py-3 text-sm font-medium rounded-2xl focus:ring-2 focus:ring-[#b7120d]/20 transition-all"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black opacity-30 uppercase tracking-widest ml-1">Deskripsi</label>
                    <textarea
                      placeholder="Jelaskan kelezatan menu ini..."
                      rows={4}
                      className="w-full bg-[#fff4f4] border-none px-4 py-3 text-sm font-medium rounded-2xl focus:ring-2 focus:ring-[#b7120d]/20 transition-all resize-none"
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black opacity-30 uppercase tracking-widest ml-1">Harga (Rp)</label>
                      <input
                        type="number"
                        placeholder="0"
                        className="w-full bg-[#fff4f4] border-none px-4 py-3 text-sm font-bold rounded-2xl focus:ring-2 focus:ring-[#b7120d]/20 transition-all"
                        value={newItem.price}
                        onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black opacity-30 uppercase tracking-widest ml-1">Kategori</label>
                      <div className="bg-[#fff4f4] px-4 py-3 rounded-2xl">
                        <select
                          className="w-full bg-transparent border-none text-sm font-bold focus:ring-0 p-0"
                          value={newItem.category}
                          onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                        >
                          {categories.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Section: Menu Options (Varian) */}
              <div className="w-full md:flex-1 p-8 flex flex-col bg-gray-50/50 overflow-y-auto no-scrollbar">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Opsi & Varian Menu</p>
                  <button
                    onClick={addOptionGroup}
                    className="flex items-center gap-2 text-[10px] font-black text-[#b7120d] bg-white border border-[#ffe1e3] px-3 py-1.5 rounded-full hover:bg-red-50 transition-colors shadow-sm"
                  >
                    <Plus className="w-3 h-3" />
                    TAMBAH OPSI
                  </button>
                </div>

                {newItem.options.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-[#ffe1e3] rounded-[2rem]">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                      <Settings className="w-6 h-6 opacity-20" />
                    </div>
                    <p className="text-xs font-bold opacity-40 leading-relaxed">
                      Belum ada opsi.<br />Tambahkan seperti "Level Pedas" atau "Pilihan Bagian".
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {newItem.options.map((option) => (
                      <div key={option.id} className="bg-white p-6 rounded-[2rem] border border-[#ffe1e3] shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <input
                            type="text"
                            placeholder="Nama Opsi (Contoh: Level Pedas)"
                            className="bg-transparent border-none p-0 text-sm font-black focus:ring-0 placeholder:opacity-20 w-2/3"
                            value={option.name}
                            onChange={(e) => updateOptionName(option.id, e.target.value)}
                          />
                          <button
                            onClick={() => removeOptionGroup(option.id)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          {option.choices.map((choice, cIndex) => (
                            <div key={cIndex} className="flex items-center gap-2">
                              <div className="flex-1 relative">
                                <input
                                  type="text"
                                  placeholder={`Pilihan ${cIndex + 1}`}
                                  className="w-full bg-[#fff4f4] border-none px-4 py-2 text-xs font-bold rounded-xl focus:ring-2 focus:ring-[#b7120d]/10 transition-all"
                                  value={choice}
                                  onChange={(e) => updateChoice(option.id, cIndex, e.target.value)}
                                />
                                {option.choices.length > 1 && (
                                  <button
                                    onClick={() => removeChoice(option.id, cIndex)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-red-500 transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                          <button
                            onClick={() => addChoice(option.id)}
                            className="flex items-center gap-2 text-[9px] font-bold text-[#b7120d]/60 hover:text-[#b7120d] transition-colors ml-1 mt-2"
                          >
                            <Plus className="w-3 h-3" />
                            TAMBAH PILIHAN
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-8 pt-8 border-t border-[#ffe1e3] flex gap-4">
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-4 text-[11px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    onClick={addMenu}
                    className="flex-[2] bg-[#b7120d] text-white py-4 text-[11px] font-black uppercase tracking-widest shadow-xl shadow-red-900/20 active:scale-95 transition-all hover:bg-[#a0100b] rounded-2xl"
                  >
                    {editingMenuId ? 'Simpan Perubahan' : 'Simpan Menu Baru'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{
        __html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
};

export default AdminPanel;
