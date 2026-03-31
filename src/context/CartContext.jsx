import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('festini_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('festini_cart', JSON.stringify(items));
  }, [items]);

  const totalCount = items.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  function addItem(product, qty = 1, personalization = {}) {
    setItems(prev => {
      // Match by product id AND personalization combination
      const key = `${product.id}-${JSON.stringify(personalization)}`;
      const existing = prev.find(i => i._key === key);
      if (existing) {
        return prev.map(i => i._key === key ? { ...i, qty: i.qty + qty } : i);
      }
      return [...prev, {
        _key: key,
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        qty,
        personalization,
      }];
    });
  }

  function updateQty(key, qty) {
    if (qty < 1) return removeItem(key);
    setItems(prev => prev.map(i => i._key === key ? { ...i, qty } : i));
  }

  function removeItem(key) {
    setItems(prev => prev.filter(i => i._key !== key));
  }

  function clearCart() {
    setItems([]);
  }

  return (
    <CartContext.Provider value={{ items, totalCount, totalPrice, addItem, updateQty, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
