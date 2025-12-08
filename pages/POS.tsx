import React, { useState, useContext, useMemo } from 'react';
import { StoreContext } from '../App';
import { CartItem, DiscountType, Transaction } from '../types';
import { Search, ShoppingCart, Trash2, Tag, CreditCard, Banknote, CheckCircle, User, MapPin, AlertTriangle, XCircle } from 'lucide-react';

const POS: React.FC = () => {
  const { items, coupons, addTransaction } = useContext(StoreContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCouponId, setAppliedCouponId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Session details
  const [pharmacistId, setPharmacistId] = useState('PH-001');
  const [branchName, setBranchName] = useState('Main St Branch');

  const filteredItems = useMemo(() => {
    if (!searchTerm) return [];
    const lower = searchTerm.toLowerCase();
    return items.filter(i => 
      i.name.toLowerCase().includes(lower) || 
      i.sku.toLowerCase().includes(lower)
    );
  }, [searchTerm, items]);

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setSearchTerm('');
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(c => c.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.id === id) {
        const newQty = c.quantity + delta;
        return newQty > 0 ? { ...c, quantity: newQty } : c;
      }
      return c;
    }));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const appliedCoupon = useMemo(() => 
    coupons.find(c => c.id === appliedCouponId), 
    [appliedCouponId, coupons]
  );

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    
    // ---------------------------------------------
    // ADVANCED DISCOUNT CALCULATION ENGINE
    // ---------------------------------------------

    // 1. Determine Applicable Items (Rewards)
    let applicableItems = cart;
    if (appliedCoupon.applicableItemIds && appliedCoupon.applicableItemIds.length > 0) {
      applicableItems = cart.filter(item => appliedCoupon.applicableItemIds.includes(item.id));
    }
    const applicableSubtotal = applicableItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // If no applicable items found for the reward, discount is 0
    if (applicableSubtotal === 0) return 0;

    // Check Min Purchase on Eligible Total
    if (appliedCoupon.minPurchaseAmount && applicableSubtotal < appliedCoupon.minPurchaseAmount) {
      return 0;
    }

    // ---------------------------------------------
    // LOGIC: BOGO (Buy X Get Y)
    // ---------------------------------------------
    if (appliedCoupon.discountType === DiscountType.BOGO) {
        const buyQty = appliedCoupon.buyQuantity || 1;
        const getQty = appliedCoupon.getQuantity || 1;
        const groupSize = buyQty + getQty;

        // Count total eligible items in cart
        const totalEligibleQty = applicableItems.reduce((sum, item) => sum + item.quantity, 0);
        
        // How many full "sets" of deal?
        const sets = Math.floor(totalEligibleQty / groupSize);
        if (sets === 0) return 0;

        const totalFreeItems = sets * getQty;

        // To determine which items are free, we need to expand the cart into individual units
        // and sort by price (usually cheapest are free)
        const allUnits: number[] = [];
        applicableItems.forEach(item => {
            for(let i=0; i<item.quantity; i++) allUnits.push(item.price);
        });
        
        // Sort ascending (cheapest first)
        allUnits.sort((a, b) => a - b);
        
        // Sum the prices of the free items (the first 'totalFreeItems' in the sorted list)
        let discount = 0;
        for(let i=0; i < totalFreeItems && i < allUnits.length; i++) {
            discount += allUnits[i];
        }
        return discount;
    }

    // ---------------------------------------------
    // LOGIC: BUNDLE (Buy Required, Get Applicable Discounted)
    // ---------------------------------------------
    if (appliedCoupon.discountType === DiscountType.BUNDLE_PERCENTAGE || appliedCoupon.discountType === DiscountType.BUNDLE_FIXED) {
        // Check if Trigger items exist in cart
        const requiredIds = appliedCoupon.requiredItemIds || [];
        if (requiredIds.length > 0) {
            const hasRequired = requiredIds.some(reqId => cart.some(c => c.id === reqId));
            if (!hasRequired) return 0;
        }
        
        if (appliedCoupon.discountType === DiscountType.BUNDLE_PERCENTAGE) {
            return (applicableSubtotal * appliedCoupon.value) / 100;
        } else {
             return Math.min(appliedCoupon.value, applicableSubtotal);
        }
    }

    // ---------------------------------------------
    // LOGIC: STANDARD (Percentage / Fixed)
    // ---------------------------------------------
    if (appliedCoupon.discountType === DiscountType.PERCENTAGE) {
      return (applicableSubtotal * appliedCoupon.value) / 100;
    } else {
      // Fixed Amount
      return Math.min(appliedCoupon.value, applicableSubtotal);
    }
  }, [subtotal, appliedCoupon, cart]);

  const total = Math.max(0, subtotal - discountAmount);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    // Clear error after 4 seconds
    setTimeout(() => setErrorMsg(''), 4000);
  };

  const handleApplyCoupon = () => {
    // Clear previous errors first
    setErrorMsg('');

    const coupon = coupons.find(c => c.code === couponCode.toUpperCase());
    
    if (coupon) {
      // 1. Redeemed Check
      // Only enforce redeemed check if usage limit is SINGLE
      if (coupon.usageLimit === 'SINGLE' && coupon.redeemed) {
        showError('COUPON WAS REDEEMED');
        return;
      }
      
      // 2. Active Check
      if (!coupon.active) {
        showError('This coupon is currently inactive.');
        return;
      }

      // 3. Date Check (Validity)
      const now = new Date();
      // Reset time to ensure we compare dates accurately
      now.setHours(0,0,0,0);
      
      if (coupon.startDate) {
          const start = new Date(coupon.startDate);
          if (now < start) {
              showError(`This coupon is not valid until ${coupon.startDate}`);
              return;
          }
      }

      if (coupon.endDate) {
          const end = new Date(coupon.endDate);
          if (now > end) {
              showError(`This coupon expired on ${coupon.endDate}`);
              return;
          }
      }

      // 4. Combinability Check
      if (appliedCouponId) {
          const existing = coupons.find(c => c.id === appliedCouponId);
          if (existing && !existing.isCombinable) {
              showError('The currently applied coupon cannot be combined with others.');
          }
          if (!coupon.isCombinable && appliedCouponId) {
             // Just a warning that this new one is exclusive
          }
      }

      // 5. Eligible Items Check (Applicable)
      if (coupon.applicableItemIds && coupon.applicableItemIds.length > 0) {
        const hasEligibleItems = cart.some(item => coupon.applicableItemIds.includes(item.id));
        if (!hasEligibleItems) {
            showError('Coupon not applicable: Requires specific items that are not in your cart.');
            return;
        }
      }

      // 6. Required Items Check (Bundle Trigger)
      if (coupon.requiredItemIds && coupon.requiredItemIds.length > 0) {
        const hasRequired = coupon.requiredItemIds.some(reqId => cart.some(c => c.id === reqId));
        if (!hasRequired) {
            showError('Coupon not applicable: You are missing the required items to trigger this deal.');
            return;
        }
      }

      // 7. Min Purchase Check
      if (coupon.minPurchaseAmount && subtotal < coupon.minPurchaseAmount) {
         showError(`This coupon requires a minimum purchase of $${coupon.minPurchaseAmount}`);
         return;
      }

      setAppliedCouponId(coupon.id);
      setCouponCode('');
    } else {
      showError('Invalid coupon code');
    }
  };

  const handleCheckout = (method: 'CASH' | 'CARD') => {
    if (cart.length === 0) return;

    const transaction: Transaction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      items: [...cart],
      subtotal,
      discount: discountAmount,
      total,
      couponCode: appliedCoupon?.code,
      paymentMethod: method,
      pharmacistId,
      branchName,
      couponDetails: appliedCoupon ? {
          description: appliedCoupon.description,
          vendorName: appliedCoupon.vendorName,
          compensationType: appliedCoupon.compensationType,
          value: appliedCoupon.value,
          discountType: appliedCoupon.discountType,
          applicableItemIds: appliedCoupon.applicableItemIds
      } : undefined
    };

    addTransaction(transaction);
    
    // Reset
    setCart([]);
    setAppliedCouponId(null);
    setSuccessMsg('Transaction completed successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="h-[calc(100vh-100px)] flex gap-6 relative">
      {/* ERROR OVERLAY */}
      {errorMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-red-600 text-white px-8 py-4 rounded-xl shadow-2xl z-[100] animate-bounce-in flex items-center gap-3 border-4 border-red-500 ring-4 ring-red-200">
           <AlertTriangle size={32} className="text-white fill-current" />
           <div>
               <h4 className="font-bold text-lg uppercase tracking-wider">Alert</h4>
               <span className="font-semibold text-xl">{errorMsg}</span>
           </div>
           <button onClick={() => setErrorMsg('')} className="ml-4 opacity-80 hover:opacity-100">
              <XCircle size={24} />
           </button>
        </div>
      )}

      {/* Left: Product Lookup */}
      <div className="w-2/3 flex flex-col gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
           <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
             <input 
               autoFocus
               type="text" 
               className="w-full pl-14 pr-4 py-4 text-lg border-2 border-slate-100 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none transition-all"
               placeholder="Scan barcode or search product..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
        </div>

        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
            Search Results
          </div>
          <div className="flex-1 overflow-y-auto p-4">
             {searchTerm && filteredItems.length === 0 && (
                <p className="text-center text-slate-400 mt-10">No products found matching "{searchTerm}"</p>
             )}
             {!searchTerm && (
               <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                 {items.slice(0, 9).map(item => (
                   <button 
                     key={item.id}
                     onClick={() => addToCart(item)}
                     className="p-4 border border-slate-200 rounded-xl hover:border-green-500 hover:shadow-md transition-all text-left group bg-slate-50 hover:bg-white"
                   >
                     <div className="font-bold text-slate-800 mb-1 truncate group-hover:text-green-600">{item.name}</div>
                     <div className="flex justify-between items-center">
                       <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded">{item.sku}</span>
                       <span className="font-bold text-slate-900">${item.price.toFixed(2)}</span>
                     </div>
                   </button>
                 ))}
                 <div className="col-span-full text-center text-sm text-slate-400 mt-4">
                   Start typing to search full inventory...
                 </div>
               </div>
             )}
             {searchTerm && (
                <div className="space-y-2">
                  {filteredItems.map(item => (
                    <button 
                      key={item.id} 
                      onClick={() => addToCart(item)}
                      className="w-full flex justify-between items-center p-4 hover:bg-green-50 rounded-xl border border-transparent hover:border-green-100 transition-colors"
                    >
                      <div className="text-left">
                        <div className="font-bold text-slate-800">{item.name}</div>
                        <div className="text-sm text-slate-500">SKU: {item.sku}</div>
                      </div>
                      <div className="font-bold text-lg text-green-600">${item.price.toFixed(2)}</div>
                    </button>
                  ))}
                </div>
             )}
          </div>
        </div>
      </div>

      {/* Right: Cart & Checkout */}
      <div className="w-1/3 flex flex-col gap-4">
        {/* Session Info - GREEN THEME */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-green-500">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Session Settings</h3>
          <div className="grid grid-cols-2 gap-3">
             <div className="relative">
                <User size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={pharmacistId}
                  onChange={(e) => setPharmacistId(e.target.value)}
                  className="w-full pl-8 pr-2 py-2 text-sm border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-green-50/20"
                  placeholder="Pharmacist ID"
                />
             </div>
             <div className="relative">
                <MapPin size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="w-full pl-8 pr-2 py-2 text-sm border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-green-50/20"
                  placeholder="Branch Name"
                />
             </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShoppingCart size={24} /> Current Sale
            </h2>
            <span className="bg-slate-700 px-3 py-1 rounded-full text-sm font-mono">
              {cart.length} items
            </span>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                <ShoppingCart size={48} className="opacity-20" />
                <p>Cart is empty</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 flex flex-col gap-2">
                  <div className="flex justify-between font-medium text-slate-800">
                    <span className="truncate w-3/4">{item.name}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600">-</button>
                      <span className="w-4 text-center text-sm font-semibold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600">+</button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals & Coupon */}
          <div className="p-5 bg-white border-t border-slate-200 space-y-4 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
             {/* Coupon Input - GREEN THEME */}
             <div className="flex gap-2">
               <div className="relative flex-1">
                 <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600" size={16} />
                 <input 
                   type="text" 
                   placeholder="Coupon Code" 
                   className="w-full pl-9 pr-3 py-2 border border-green-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none uppercase bg-green-50/30"
                   value={couponCode}
                   onChange={(e) => setCouponCode(e.target.value)}
                   disabled={!!appliedCouponId}
                 />
               </div>
               {appliedCouponId ? (
                  <button 
                    onClick={() => setAppliedCouponId(null)}
                    className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
               ) : (
                 <button 
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors text-sm shadow-sm"
                 >
                   Apply
                 </button>
               )}
             </div>

             {appliedCoupon && (
               <div className="bg-green-50 text-green-700 p-3 rounded-lg border border-green-100 text-xs flex justify-between items-center">
                 <div className="flex flex-col">
                    <span className="font-bold flex items-center gap-1"><CheckCircle size={12}/> {appliedCoupon.code}</span>
                    <span className="text-green-600/80">{appliedCoupon.description}</span>
                 </div>
                 <span className="font-bold text-lg">-${discountAmount.toFixed(2)}</span>
               </div>
             )}

             {/* Numbers */}
             <div className="space-y-2 text-sm text-slate-600 pt-2">
               <div className="flex justify-between">
                 <span>Subtotal</span>
                 <span>${subtotal.toFixed(2)}</span>
               </div>
               <div className="flex justify-between text-red-500">
                 <span>Discount</span>
                 <span>-${discountAmount.toFixed(2)}</span>
               </div>
               <div className="flex justify-between text-2xl font-bold text-slate-900 pt-2 border-t border-slate-100">
                 <span>Total</span>
                 <span>${total.toFixed(2)}</span>
               </div>
             </div>

             {/* Checkout Buttons - GREEN THEME */}
             <div className="grid grid-cols-2 gap-3 pt-2">
               <button 
                  onClick={() => handleCheckout('CASH')}
                  disabled={cart.length === 0}
                  className="flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-200"
               >
                 <Banknote size={20} /> CASH
               </button>
               <button 
                  onClick={() => handleCheckout('CARD')}
                  disabled={cart.length === 0}
                  className="flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-200"
               >
                 <CreditCard size={20} /> CARD
               </button>
             </div>
          </div>
        </div>
      </div>
      
      {/* Success Overlay */}
      {successMsg && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center animate-bounce-in">
             <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
               <CheckCircle size={40} />
             </div>
             <h3 className="text-2xl font-bold text-slate-800 mb-2">{successMsg}</h3>
             <p className="text-slate-500">Receipt sent to printer...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;