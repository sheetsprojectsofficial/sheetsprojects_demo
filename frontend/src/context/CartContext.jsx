import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], total: 0, itemCount: 0 });
  const [loading, setLoading] = useState(false);

  // Fetch cart when user logs in
  useEffect(() => {
    console.log('🔄 CartContext: User changed:', user?.email);
    if (user) {
      console.log('👤 CartContext: User logged in, fetching cart...');
      fetchCart();
    } else {
      console.log('👤 CartContext: No user, clearing cart');
      setCart({ items: [], total: 0, itemCount: 0 });
    }
  }, [user]);

  const fetchCart = async () => {
    if (!user) return;

    setLoading(true);
    console.log('📡 CartContext: Fetching cart for user:', user.uid);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/cart/${user.uid}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('📦 CartContext: Cart response:', data);

      if (data.success) {
        console.log('✅ CartContext: Cart loaded:', data.cart);
        console.log('   - Items:', data.cart.items.length);
        console.log('   - Total:', data.cart.total);
        console.log('   - Item Count:', data.cart.itemCount);
        setCart(data.cart);
      } else {
        console.log('❌ CartContext: Failed to load cart');
      }
    } catch (error) {
      console.error('❌ CartContext: Error fetching cart:', error);
    } finally {
      setLoading(false);
      console.log('🏁 CartContext: Fetch complete, loading:', false);
    }
  };

  const addToCart = async (itemType, itemId, options = {}) => {
    if (!user) {
      alert('Please login to add items to cart');
      return;
    }

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/cart/${user.uid}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          itemType,
          itemId,
          bookFormat: options.bookFormat || 'soft',
          quantity: options.quantity || 1
        })
      });

      const data = await response.json();

      if (data.success) {
        setCart(data.cart);
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      return { success: false, message: 'Error adding to cart' };
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId) => {
    if (!user) return;

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/cart/${user.uid}/item/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setCart(data.cart);
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (!user) return;

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/cart/${user.uid}/item/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quantity })
      });

      const data = await response.json();

      if (data.success) {
        setCart(data.cart);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/cart/${user.uid}/clear`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setCart(data.cart);
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    cart,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    refreshCart: fetchCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
