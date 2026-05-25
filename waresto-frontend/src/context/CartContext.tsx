import React, { createContext, useContext, useState, useEffect } from 'react';
import type { MenuItem } from '../data/mockData';
import { menuService } from '../api/menuService';

export interface CartItem {
  cartId: string;
  menuId: string;
  quantity: number;
  options: Record<string, string>;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: MenuItem, options?: Record<string, string>) => void;
  updateCartQuantity: (cartId: string, delta: number) => void;
  removeFromCart: (cartId: string) => void;
  getItemQuantity: (menuId: string) => number;
  totalItems: number;
  totalPrice: number;
  clearCart: () => void;
  menuItems: MenuItem[];
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const items = await menuService.getMenus();
        setMenuItems(items);
      } catch (err) {
        console.error('Failed to fetch menu in CartContext:', err);
      }
    };
    fetchMenu();
  }, []);

  // Clean up stale cart items from localStorage/state if they don't exist in the active menuItems
  useEffect(() => {
    if (menuItems.length > 0) {
      setCart(prev => {
        const validCart = prev.filter(cartItem =>
          menuItems.some(item => item.id === cartItem.menuId)
        );
        if (validCart.length !== prev.length) {
          return validCart;
        }
        return prev;
      });
    }
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: MenuItem, options: Record<string, string> = {}) => {
    setCart(prev => {
      const existingItemIndex = prev.findIndex(i => 
        i.menuId === item.id && 
        JSON.stringify(i.options) === JSON.stringify(options)
      );

      if (existingItemIndex > -1) {
        const newCart = [...prev];
        newCart[existingItemIndex].quantity += 1;
        return newCart;
      }

      return [...prev, {
        cartId: Math.random().toString(36).substr(2, 9),
        menuId: item.id,
        quantity: 1,
        options
      }];
    });
  };

  const updateCartQuantity = (cartId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.cartId === cartId) {
          return { ...item, quantity: Math.max(0, item.quantity + delta) };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const removeFromCart = (cartId: string) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const getItemQuantity = (menuId: string) => {
    return cart
      .filter(i => i.menuId === menuId)
      .reduce((sum, i) => sum + i.quantity, 0);
  };

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  
  const totalPrice = cart.reduce((sum, cartItem) => {
    const item = menuItems.find((i: MenuItem) => i.id === cartItem.menuId);
    return sum + (item ? Number(item.price) * cartItem.quantity : 0);
  }, 0);

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      updateCartQuantity, 
      removeFromCart, 
      getItemQuantity, 
      totalItems, 
      totalPrice,
      clearCart,
      menuItems
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
