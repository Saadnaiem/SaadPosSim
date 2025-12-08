import React, { useState, useEffect, createContext } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import CouponConfig from './pages/CouponConfig';
import Reports from './pages/Reports';
import Help from './pages/Help';
import { Item, Coupon, Transaction, StoreContextType } from './types';
import { INITIAL_ITEMS, INITIAL_COUPONS } from './constants';

export const StoreContext = createContext<StoreContextType>({} as StoreContextType);

const App: React.FC = () => {
  // Initialize with persisted data or defaults
  const [items, setItems] = useState<Item[]>(() => {
    const saved = localStorage.getItem('pharma_items');
    return saved ? JSON.parse(saved) : INITIAL_ITEMS;
  });

  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = localStorage.getItem('pharma_coupons');
    return saved ? JSON.parse(saved) : INITIAL_COUPONS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('pharma_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist state changes
  useEffect(() => {
    localStorage.setItem('pharma_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('pharma_coupons', JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    localStorage.setItem('pharma_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = (t: Transaction) => {
    const updatedTransactions = [...transactions, t];
    setTransactions(updatedTransactions);
    
    // Decrease stock
    const updatedItems = items.map(item => {
      const sold = t.items.find(cartItem => cartItem.id === item.id);
      if (sold) {
        return { ...item, stock: Math.max(0, item.stock - sold.quantity) };
      }
      return item;
    });
    setItems(updatedItems);

    // Update usage count and check redemption limit
    if (t.couponCode) {
      setCoupons(prevCoupons => prevCoupons.map(c => {
        if (c.code === t.couponCode) {
          const newUsageCount = (c.usageCount || 0) + 1;
          const updates: Partial<Coupon> = { usageCount: newUsageCount };
          
          if (c.usageLimit === 'SINGLE') {
            updates.redeemed = true;
          }
          
          return { ...c, ...updates };
        }
        return c;
      }));
    }
  };

  const importItemsFromCSV = (csvContent: string) => {
    try {
      const lines = csvContent.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
      
      const newItems: Item[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        // Simple CSV parse handling quotes roughly
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        
        if (values.length < 5) continue;

        const item: any = { id: Date.now().toString() + i };
        
        headers.forEach((header, index) => {
           if (values[index] === undefined) return;
           const val = values[index];
           if (header === 'price' || header === 'stock') {
             item[header] = parseFloat(val) || 0;
           } else {
             item[header] = val;
           }
        });

        // Ensure required fields exist
        if (item.name && item.price) {
          newItems.push(item as Item);
        }
      }

      if (newItems.length > 0) {
        setItems(prev => [...prev, ...newItems]);
        alert(`Successfully imported ${newItems.length} items.`);
      } else {
        alert('No valid items found in CSV.');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to parse CSV. Please check the format.');
    }
  };

  return (
    <StoreContext.Provider value={{ 
      items, setItems, 
      coupons, setCoupons, 
      transactions, addTransaction,
      importItemsFromCSV 
    }}>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<POS />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/coupons" element={<CouponConfig />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/help" element={<Help />} />
          </Routes>
        </Layout>
      </HashRouter>
    </StoreContext.Provider>
  );
};

export default App;