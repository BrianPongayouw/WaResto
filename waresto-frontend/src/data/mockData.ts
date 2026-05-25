export interface MenuOption {
  id: string;
  name: string; // e.g., "Level Pedas", "Pilihan Potongan"
  choices: string[]; // e.g., ["Pedas", "Tidak Pedas"]
  required: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  isAvailable: boolean;
  options?: MenuOption[];
}

export interface OrderItem {
  menuId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  tableId: string;
  items: OrderItem[];
  status: 'Baru' | 'Diproses' | 'Menunggu Pembayaran' | 'Selesai';
  timestamp: string;
  total: number;
}

export interface Table {
  id: string;
  status: 'Terisi' | 'Tidak Terisi';
  qrCode?: string;
}

export const mockCategories = [
  "MENU REKOMENDASI",
  "BEBEK & AYAM",
  "PAKET HEMAT",
  "MINUMAN",
  "SAMBAL"
];

export const mockMenuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Bebek Goreng Spesial',
    description: 'Bebek goreng dengan bumbu rahasia yang meresap, disajikan dengan nasi hangat and sambal.',
    price: 40000,
    category: 'MENU REKOMENDASI',
    imageUrl: 'https://images.unsplash.com/photo-1516684669134-de6f7c473a2a?w=800&auto=format&fit=crop',
    isAvailable: true,
    options: [
      { id: 'opt1', name: 'Level Pedas', choices: ['Tidak Pedas', 'Sedang', 'Pedas Mampus'], required: true },
      { id: 'opt2', name: 'Pilihan Bagian', choices: ['Paha', 'Dada'], required: false }
    ]
  },
  {
    id: '2',
    name: 'Sate Bebek',
    description: 'Sate daging bebek pilihan dengan bumbu kacang yang gurih.',
    price: 23000,
    category: 'MENU REKOMENDASI',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop',
    isAvailable: true,
    options: [
      { id: 'opt3', name: 'Bumbu', choices: ['Kacang', 'Kecap'], required: true }
    ]
  },
  {
    id: '3',
    name: 'Ayam Penyet',
    description: 'Ayam penyet dengan sambal pedas nendang.',
    price: 25000,
    category: 'BEBEK & AYAM',
    imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop',
    isAvailable: true,
  },
  {
    id: '4',
    name: 'Es Teh Manis',
    description: 'Teh melati segar dengan gula asli.',
    price: 5000,
    category: 'MINUMAN',
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&auto=format&fit=crop',
    isAvailable: true,
  },
  {
    id: '5',
    name: 'Es Jeruk',
    description: 'Jeruk peras segar.',
    price: 8000,
    category: 'MINUMAN',
    imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&auto=format&fit=crop',
    isAvailable: true,
  }
];

export const mockOrders: Order[] = [
  {
    id: 'ord-1',
    tableId: '3',
    items: [
      { menuId: '1', name: 'Bebek Goreng Spesial', price: 40000, quantity: 1 },
      { menuId: '4', name: 'Es Teh Manis', price: 5000, quantity: 1 }
    ],
    status: 'Baru',
    timestamp: new Date().toISOString(),
    total: 45000
  },
  {
    id: 'ord-2',
    tableId: '5',
    items: [
      { menuId: '3', name: 'Ayam Penyet', price: 25000, quantity: 2 },
      { menuId: '5', name: 'Es Jeruk', price: 8000, quantity: 2 }
    ],
    status: 'Diproses',
    timestamp: new Date().toISOString(),
    total: 66000
  }
];

export const mockTables: Table[] = [
  { id: '1', status: 'Tidak Terisi', qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Table1' },
  { id: '2', status: 'Terisi', qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Table2' },
  { id: '3', status: 'Tidak Terisi', qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Table3' },
  { id: '4', status: 'Tidak Terisi', qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Table4' },
  { id: '5', status: 'Terisi', qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Table5' },
  { id: '6', status: 'Tidak Terisi', qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Table6' },
  { id: '7', status: 'Tidak Terisi', qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Table7' },
  { id: '8', status: 'Tidak Terisi', qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Table8' },
];
