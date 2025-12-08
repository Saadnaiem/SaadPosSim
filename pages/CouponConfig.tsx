import React, { useState, useContext, useMemo } from 'react';
import { StoreContext } from '../App';
import { Coupon, DiscountType, Item } from '../types';
import BarcodeDisplay from '../components/BarcodeDisplay';
import { Plus, Trash2, CheckSquare, Square, Calendar, Layers, ShoppingBag, ArrowRight, Shuffle, Download, MessageCircle, Mail, MessageSquare, ChevronDown, ChevronRight, Upload, FileSpreadsheet, Search, RefreshCcw, Hash, Share2, Gem } from 'lucide-react';

const CouponConfig: React.FC = () => {
  const { coupons, setCoupons, items } = useContext(StoreContext);

  // New state for bulk generation
  const [quantity, setQuantity] = useState(1);
  
  // Search states for item lists
  const [searchApplicable, setSearchApplicable] = useState('');
  const [searchRequired, setSearchRequired] = useState('');

  // State for expanded brands in item selection
  const [expandedBrands, setExpandedBrands] = useState<Record<string, boolean>>({});

  // Helper to get today's date formatted for input
  const getToday = () => new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<Partial<Coupon>>({
    code: '',
    description: '',
    discountType: DiscountType.PERCENTAGE,
    value: 0,
    minPurchaseAmount: 0,
    active: true,
    startDate: getToday(),
    endDate: '', // No end date by default
    isCombinable: false, // Default to not combined
    vendorName: '',
    compensationType: 'VENDOR_CLAIM',
    partnershipVendorPercent: 50,
    partnershipMepPercent: 50,
    applicableItemIds: [],
    requiredItemIds: [],
    buyQuantity: 1,
    getQuantity: 1,
    usageLimit: 'SINGLE',
    usageCount: 0
  });

  // Pre-calculate filtered lists at top level to obey Rules of Hooks
  const filteredApplicableItems = useMemo(() => {
      if (!searchApplicable) return items;
      const lower = searchApplicable.toLowerCase();
      return items.filter(i => 
          i.name.toLowerCase().includes(lower) || 
          i.sku.toLowerCase().includes(lower) ||
          (i.brand && i.brand.toLowerCase().includes(lower))
      );
  }, [items, searchApplicable]);

  const filteredRequiredItems = useMemo(() => {
      if (!searchRequired) return items;
      const lower = searchRequired.toLowerCase();
      return items.filter(i => 
          i.name.toLowerCase().includes(lower) || 
          i.sku.toLowerCase().includes(lower) ||
          (i.brand && i.brand.toLowerCase().includes(lower))
      );
  }, [items, searchRequired]);

  // Group items by brand helper
  const groupItemsByBrand = (itemList: Item[]) => {
    const groups: Record<string, Item[]> = {};
    itemList.forEach(item => {
      const brand = item.brand || 'Unbranded / Other';
      if (!groups[brand]) groups[brand] = [];
      groups[brand].push(item);
    });
    return groups;
  };

  const toggleBrandExpansion = (brand: string) => {
    setExpandedBrands(prev => ({
      ...prev,
      [brand]: !prev[brand]
    }));
  };

  const generateRandomCode = () => {
    // Generate a clean random code (no 0/O, 1/I to avoid confusion)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code: result }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || (formData.discountType !== DiscountType.BOGO && !formData.value)) return;

    const newCoupons: Coupon[] = [];
    const baseCode = formData.code.toUpperCase();

    // Loop to generate requested quantity
    for (let i = 0; i < quantity; i++) {
        let finalCode = baseCode;
        
        // If generating bulk, append a unique suffix
        if (quantity > 1) {
            const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
            finalCode = `${baseCode}-${randomSuffix}`;
        }

        const newCoupon: Coupon = {
          id: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
          code: finalCode,
          description: formData.description || '',
          discountType: formData.discountType || DiscountType.PERCENTAGE,
          value: Number(formData.value) || 0,
          minPurchaseAmount: Number(formData.minPurchaseAmount) || 0,
          startDate: formData.startDate,
          endDate: formData.endDate,
          isCombinable: formData.isCombinable || false,
          active: true,
          redeemed: false,
          vendorName: formData.vendorName || 'Store Promotion',
          compensationType: formData.compensationType || 'VENDOR_CLAIM',
          partnershipVendorPercent: formData.compensationType === 'PARTNERSHIP' ? (Number(formData.partnershipVendorPercent) || 50) : undefined,
          partnershipMepPercent: formData.compensationType === 'PARTNERSHIP' ? (Number(formData.partnershipMepPercent) || 50) : undefined,
          applicableItemIds: formData.applicableItemIds || [],
          requiredItemIds: formData.requiredItemIds || [],
          buyQuantity: Number(formData.buyQuantity) || 1,
          getQuantity: Number(formData.getQuantity) || 1,
          usageLimit: formData.usageLimit || 'SINGLE',
          usageCount: 0
        };
        newCoupons.push(newCoupon);
    }

    setCoupons(prev => [...prev, ...newCoupons]);
    
    // Reset form
    setFormData({
      code: '',
      description: '',
      discountType: DiscountType.PERCENTAGE,
      value: 0,
      minPurchaseAmount: 0,
      active: true,
      startDate: getToday(),
      endDate: '',
      isCombinable: false,
      vendorName: '',
      compensationType: 'VENDOR_CLAIM',
      partnershipVendorPercent: 50,
      partnershipMepPercent: 50,
      applicableItemIds: [],
      requiredItemIds: [],
      buyQuantity: 1,
      getQuantity: 1,
      usageLimit: 'SINGLE',
      usageCount: 0
    });
    setQuantity(1);
  };

  const toggleItemSelection = (itemId: string, listType: 'applicable' | 'required') => {
    const key = listType === 'applicable' ? 'applicableItemIds' : 'requiredItemIds';
    const currentIds = formData[key] || [];
    
    if (currentIds.includes(itemId)) {
      setFormData({
        ...formData,
        [key]: currentIds.filter(id => id !== itemId)
      });
    } else {
      setFormData({
        ...formData,
        [key]: [...currentIds, itemId]
      });
    }
  };

  const toggleBrandSelection = (brandItems: Item[], listType: 'applicable' | 'required') => {
    const key = listType === 'applicable' ? 'applicableItemIds' : 'requiredItemIds';
    const currentIds = formData[key] || [];
    
    const allSelected = brandItems.every(item => currentIds.includes(item.id));
    
    let newIds = [...currentIds];
    if (allSelected) {
      // Deselect all
      const idsToRemove = brandItems.map(i => i.id);
      newIds = newIds.filter(id => !idsToRemove.includes(id));
    } else {
      // Select all (add missing)
      brandItems.forEach(item => {
        if (!newIds.includes(item.id)) newIds.push(item.id);
      });
    }
    
    setFormData({
      ...formData,
      [key]: newIds
    });
  };

  const handleDelete = (id: string) => {
    setCoupons(prev => prev.filter(c => c.id !== id));
  };

  // --- CSV Import / Template Logic ---

  const downloadTemplate = () => {
    const headers = [
      'Code', 'Description', 'DiscountType', 'Value (% or $)', 'VendorName', 'CompensationType', 
      'StartDate', 'EndDate', 'IsCombinable', 'MinPurchase', 'BuyQty', 'GetQty', 
      'ApplicableSKU', 'RequiredSKU', 'PartnershipVendor%', 'PartnershipMep%', 'UsageLimit'
    ];
    
    // Helper to format rows safely
    const formatRow = (arr: string[]) => arr.map(s => `"${s}"`).join(',');

    // 1. VENDOR_CLAIM
    const row1 = [
      'PROMO_10', '10% Off Size 3', 'PERCENTAGE', '10', 'Huggies', 'VENDOR_CLAIM',
      '2023-01-01', '2024-12-31', 'TRUE', '0', '1', '1',
      '6180011596', '', '', '', 'SINGLE'
    ];

    // 2. MEP_CLAIM
    const row2 = [
      'SAVE_5', '$5 Off Total Order', 'FIXED_AMOUNT', '5', 'Store', 'MEP_CLAIM',
      '2023-01-01', '2024-12-31', 'FALSE', '50', '1', '1',
      '', '', '', '', 'MULTI'
    ];

    // 3. PARTNERSHIP
    const row3 = [
      'PARTNER_DEAL', 'Joint Promo 20% Off', 'PERCENTAGE', '20', 'Huggies', 'PARTNERSHIP',
      '2023-01-01', '2024-12-31', 'FALSE', '0', '1', '1',
      '6180011597', '', '60', '40', 'SINGLE'
    ];

    const csvContent = [
      headers.join(','),
      formatRow(row1),
      formatRow(row2),
      formatRow(row3)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'coupon_import_template_comprehensive.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCouponImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split('\n');
        
        // Map to group coupons by code
        const couponMap: Record<string, Partial<Coupon>> = {};

        for (let i = 1; i < lines.length; i++) {
           const line = lines[i].trim();
           if (!line) continue;
           
           // Simple CSV parser handling quotes
           const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/^"|"$/g, '')) || [];
           
           if (values.length < 5) continue; // Basic validation

           const code = values[0]?.toUpperCase() || 'UNKNOWN';

           // Parse Basic Data
           const typeStr = values[2] as string;
           let discountType = DiscountType.PERCENTAGE;
           if (Object.values(DiscountType).includes(typeStr as DiscountType)) {
               discountType = typeStr as DiscountType;
           }

           // Find Item IDs from Single SKUs in this row
           const applicableSku = values[12] ? values[12].trim() : '';
           const requiredSku = values[13] ? values[13].trim() : '';
           
           const applicableItem = applicableSku ? items.find(item => item.sku === applicableSku) : null;
           const requiredItem = requiredSku ? items.find(item => item.sku === requiredSku) : null;
           
           if (!couponMap[code]) {
               couponMap[code] = {
                   id: `${Date.now()}-${i}`,
                   code: code,
                   description: values[1] || '',
                   discountType: discountType,
                   value: parseFloat(values[3]) || 0,
                   vendorName: values[4] || '',
                   compensationType: values[5] || 'VENDOR_CLAIM',
                   startDate: values[6],
                   endDate: values[7],
                   isCombinable: (values[8] || '').toUpperCase() === 'TRUE',
                   minPurchaseAmount: parseFloat(values[9]) || 0,
                   buyQuantity: parseFloat(values[10]) || 0,
                   getQuantity: parseFloat(values[11]) || 0,
                   partnershipVendorPercent: parseFloat(values[14]) || undefined,
                   partnershipMepPercent: parseFloat(values[15]) || undefined,
                   usageLimit: (values[16] as any) === 'MULTI' ? 'MULTI' : 'SINGLE',
                   active: true,
                   usageCount: 0,
                   redeemed: false,
                   applicableItemIds: [],
                   requiredItemIds: []
               };
           }

           const current = couponMap[code];
           if (applicableItem && current.applicableItemIds) {
                if (!current.applicableItemIds.includes(applicableItem.id)) {
                    current.applicableItemIds.push(applicableItem.id);
                }
           }
           if (requiredItem && current.requiredItemIds) {
                if (!current.requiredItemIds.includes(requiredItem.id)) {
                    current.requiredItemIds.push(requiredItem.id);
                }
           }
        }
        
        const newCoupons = Object.values(couponMap) as Coupon[];
        if (newCoupons.length > 0) {
            setCoupons(prev => [...prev, ...newCoupons]);
            alert(`Imported ${newCoupons.length} coupons successfully.`);
        }
      } catch (err) {
          console.error(err);
          alert('Error parsing CSV');
      }
    };
    reader.readAsText(file);
  };

  const renderItemSelector = (listType: 'applicable' | 'required') => {
      const itemsToRender = listType === 'applicable' ? filteredApplicableItems : filteredRequiredItems;
      const grouped = groupItemsByBrand(itemsToRender);
      const selectedIds = listType === 'applicable' ? formData.applicableItemIds : formData.requiredItemIds;
      const keyPrefix = listType;

      return (
          <div className="border border-slate-200 rounded-lg overflow-hidden h-64 flex flex-col">
              <div className="p-2 bg-slate-50 border-b border-slate-200">
                  <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        type="text"
                        placeholder="Search items..."
                        className="w-full pl-8 pr-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                        value={listType === 'applicable' ? searchApplicable : searchRequired}
                        onChange={(e) => listType === 'applicable' ? setSearchApplicable(e.target.value) : setSearchRequired(e.target.value)}
                      />
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 bg-white">
                  {Object.keys(grouped).length === 0 && <p className="text-xs text-slate-400 text-center mt-4">No items found.</p>}
                  {Object.keys(grouped).map(brand => (
                      <div key={brand} className="mb-1">
                          <div className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded cursor-pointer group">
                             <button onClick={() => toggleBrandExpansion(`${keyPrefix}-${brand}`)} className="text-slate-400">
                                 {expandedBrands[`${keyPrefix}-${brand}`] ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                             </button>
                             <div 
                                className="flex-1 text-sm font-semibold text-slate-700 flex justify-between"
                                onClick={() => toggleBrandExpansion(`${keyPrefix}-${brand}`)}
                             >
                                 <span>{brand}</span>
                                 <span className="text-xs text-slate-400 font-normal">({grouped[brand].length})</span>
                             </div>
                             <button 
                                onClick={() => toggleBrandSelection(grouped[brand], listType)}
                                className="text-xs text-indigo-600 hover:underline px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                             >
                                 Select All
                             </button>
                          </div>
                          
                          {expandedBrands[`${keyPrefix}-${brand}`] && (
                              <div className="ml-6 space-y-1 mt-1 border-l-2 border-slate-100 pl-2">
                                  {grouped[brand].map(item => {
                                      const isSelected = selectedIds?.includes(item.id);
                                      return (
                                          <div 
                                            key={item.id} 
                                            onClick={() => toggleItemSelection(item.id, listType)}
                                            className={`flex items-start gap-2 p-1.5 rounded cursor-pointer text-xs transition-colors ${isSelected ? 'bg-indigo-50 text-indigo-800' : 'hover:bg-slate-50 text-slate-600'}`}
                                          >
                                              {isSelected ? <CheckSquare size={14} className="text-indigo-600 shrink-0 mt-0.5" /> : <Square size={14} className="text-slate-300 shrink-0 mt-0.5" />}
                                              <div>
                                                  <div className="font-medium">{item.name}</div>
                                                  <div className="text-[10px] text-slate-400">{item.sku}</div>
                                              </div>
                                          </div>
                                      );
                                  })}
                              </div>
                          )}
                      </div>
                  ))}
              </div>
          </div>
      );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Coupon Configuration</h1>
          <p className="text-slate-500">Create, manage and distribute promotional codes.</p>
        </div>
        <div className="flex gap-2">
             <button 
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium shadow-sm transition-colors"
             >
                 <FileSpreadsheet size={16} /> Template
             </button>
             <label className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer text-sm font-medium shadow-sm transition-colors">
                 <Upload size={16} /> Import CSV
                 <input type="file" accept=".csv" className="hidden" onChange={handleCouponImport} />
             </label>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* LEFT COLUMN: FORM */}
        <div className="xl:col-span-5 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-5">
             <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                 <Gem size={20} className="text-indigo-600" />
                 <h2 className="font-bold text-slate-800">Create New Coupon</h2>
             </div>

             {/* Basic Info */}
             <div className="space-y-3">
                 <div className="flex gap-2">
                     <div className="flex-1 space-y-1">
                         <label className="text-xs font-semibold text-slate-500 uppercase">Coupon Code</label>
                         <div className="relative">
                             <input 
                                required
                                type="text" 
                                value={formData.code}
                                onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono uppercase font-bold text-slate-800"
                                placeholder="SUMMER2025"
                             />
                             <button 
                                type="button" 
                                onClick={generateRandomCode}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 p-1"
                             >
                                 <Shuffle size={16} />
                             </button>
                         </div>
                     </div>
                     <div className="w-24 space-y-1">
                         <label className="text-xs font-semibold text-slate-500 uppercase">Qty</label>
                         <input 
                            type="number" 
                            min="1"
                            max="1000"
                            value={quantity}
                            onChange={e => setQuantity(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                         />
                     </div>
                 </div>

                 <div className="space-y-1">
                     <label className="text-xs font-semibold text-slate-500 uppercase">Description</label>
                     <input 
                        type="text"
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="e.g. 10% Off all Diapers"
                     />
                 </div>
             </div>

             {/* Logic Configuration */}
             <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                         <label className="text-xs font-semibold text-slate-500 uppercase">Discount Type</label>
                         <select 
                            value={formData.discountType}
                            onChange={e => setFormData({...formData, discountType: e.target.value as DiscountType})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                         >
                             <option value={DiscountType.PERCENTAGE}>Percentage Off</option>
                             <option value={DiscountType.FIXED_AMOUNT}>Fixed Amount ($)</option>
                             <option value={DiscountType.BOGO}>Buy X Get Y Free</option>
                             <option value={DiscountType.BUNDLE_PERCENTAGE}>Bundle (Get % Off)</option>
                             <option value={DiscountType.BUNDLE_FIXED}>Bundle (Get $ Off)</option>
                         </select>
                     </div>
                     
                     <div className="space-y-1">
                         <label className="text-xs font-semibold text-slate-500 uppercase">
                             {formData.discountType === DiscountType.PERCENTAGE ? 'Value (%)' : 'Value ($)'}
                         </label>
                         <input 
                             type="number"
                             value={formData.value}
                             onChange={e => setFormData({...formData, value: Number(e.target.value)})}
                             className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                             disabled={formData.discountType === DiscountType.BOGO}
                         />
                     </div>
                 </div>

                 {/* Advanced Logic Fields */}
                 {formData.discountType === DiscountType.BOGO && (
                     <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                         <div className="space-y-1">
                             <label className="text-xs font-semibold text-slate-500 uppercase">Buy Quantity</label>
                             <input type="number" value={formData.buyQuantity} onChange={e => setFormData({...formData, buyQuantity: Number(e.target.value)})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" />
                         </div>
                         <div className="space-y-1">
                             <label className="text-xs font-semibold text-slate-500 uppercase">Get Free Qty</label>
                             <input type="number" value={formData.getQuantity} onChange={e => setFormData({...formData, getQuantity: Number(e.target.value)})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" />
                         </div>
                     </div>
                 )}

                 <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                         <label className="text-xs font-semibold text-slate-500 uppercase">Start Date</label>
                         <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white" />
                     </div>
                     <div className="space-y-1">
                         <label className="text-xs font-semibold text-slate-500 uppercase">End Date</label>
                         <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white" />
                     </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                         <label className="text-xs font-semibold text-slate-500 uppercase">Usage Limit</label>
                         <select 
                            value={formData.usageLimit} 
                            onChange={e => setFormData({...formData, usageLimit: e.target.value as any})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                         >
                             <option value="SINGLE">Single Use (Burn)</option>
                             <option value="MULTI">Unlimited / Multi-Use</option>
                         </select>
                     </div>
                     <div className="flex items-center gap-3 pt-6">
                         <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                             <input 
                                type="checkbox" 
                                checked={formData.isCombinable} 
                                onChange={e => setFormData({...formData, isCombinable: e.target.checked})}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" 
                             />
                             Is Combinable?
                         </label>
                     </div>
                 </div>
             </div>

             {/* Vendor & Split */}
             <div className="space-y-3">
                 <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                     <Share2 size={16} className="text-indigo-600" />
                     <h3 className="font-bold text-sm text-slate-700">Vendor & Compensation</h3>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                         <label className="text-xs font-semibold text-slate-500 uppercase">Vendor Name</label>
                         <input 
                            type="text" 
                            value={formData.vendorName}
                            onChange={e => setFormData({...formData, vendorName: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            placeholder="e.g. Kimberly-Clark"
                         />
                     </div>
                     <div>
                         <label className="text-xs font-semibold text-slate-500 uppercase">Type</label>
                         <select 
                            value={formData.compensationType} 
                            onChange={e => setFormData({...formData, compensationType: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                         >
                             <option value="VENDOR_CLAIM">100% Vendor Claim</option>
                             <option value="MEP_CLAIM">100% Store (MEP)</option>
                             <option value="PARTNERSHIP">Partnership Split</option>
                         </select>
                     </div>
                 </div>
                 {formData.compensationType === 'PARTNERSHIP' && (
                     <div className="grid grid-cols-2 gap-4 bg-indigo-50 p-3 rounded-lg">
                         <div>
                             <label className="text-xs font-bold text-indigo-700">Vendor Share (%)</label>
                             <input type="number" value={formData.partnershipVendorPercent} onChange={e => setFormData({...formData, partnershipVendorPercent: Number(e.target.value)})} className="w-full px-2 py-1 border border-indigo-200 rounded text-sm" />
                         </div>
                         <div>
                             <label className="text-xs font-bold text-indigo-700">Store Share (%)</label>
                             <input type="number" value={formData.partnershipMepPercent} onChange={e => setFormData({...formData, partnershipMepPercent: Number(e.target.value)})} className="w-full px-2 py-1 border border-indigo-200 rounded text-sm" />
                         </div>
                     </div>
                 )}
             </div>

             {/* Item Linking */}
             <div className="space-y-3">
                 <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                     <Layers size={16} className="text-indigo-600" />
                     <h3 className="font-bold text-sm text-slate-700">Product Linking</h3>
                 </div>

                 {/* Trigger Items (for Bundle) */}
                 {(formData.discountType === DiscountType.BUNDLE_PERCENTAGE || formData.discountType === DiscountType.BUNDLE_FIXED) && (
                     <div className="space-y-2">
                         <div className="flex justify-between items-center">
                             <label className="text-xs font-bold text-slate-600 uppercase">Required Items (Trigger)</label>
                             <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">{formData.requiredItemIds?.length} selected</span>
                         </div>
                         {renderItemSelector('required')}
                     </div>
                 )}

                 {/* Applicable Items (Reward) */}
                 <div className="space-y-2">
                     <div className="flex justify-between items-center">
                         <label className="text-xs font-bold text-slate-600 uppercase">Applicable Items (Reward)</label>
                         <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">{formData.applicableItemIds?.length} selected</span>
                     </div>
                     {renderItemSelector('applicable')}
                 </div>
             </div>

             <div className="pt-4 border-t border-slate-100">
                 <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex justify-center items-center gap-2">
                     <Plus size={20} />
                     {quantity > 1 ? `Generate ${quantity} Coupons` : 'Create Coupon'}
                 </button>
             </div>
          </form>
        </div>

        {/* RIGHT COLUMN: LIST */}
        <div className="xl:col-span-7">
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
               <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                   <div>
                       <h2 className="font-bold text-slate-800 text-lg">Active Coupons</h2>
                       <p className="text-slate-500 text-sm">{coupons.length} coupons configured</p>
                   </div>
                   <button onClick={() => setCoupons([])} className="text-xs text-red-500 hover:underline">Clear All</button>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[800px]">
                   {coupons.length === 0 ? (
                       <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                           <ShoppingBag size={48} className="mb-4 opacity-20" />
                           <p>No coupons created yet.</p>
                       </div>
                   ) : (
                       coupons.slice().reverse().map(coupon => (
                           <div key={coupon.id} className="border border-slate-200 rounded-lg p-4 hover:border-indigo-300 transition-colors bg-slate-50/50 relative group">
                               <div className="flex flex-col md:flex-row gap-4 items-start">
                                   <div className="shrink-0">
                                       <BarcodeDisplay value={coupon.code} />
                                   </div>
                                   <div className="flex-1 space-y-1">
                                       <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-slate-800 text-lg">{coupon.code}</h3>
                                            <div className="flex gap-2">
                                                <span className={`px-2 py-0.5 text-xs font-bold rounded uppercase ${coupon.active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                                                    {coupon.active ? 'Active' : 'Inactive'}
                                                </span>
                                                {coupon.usageLimit === 'SINGLE' && coupon.redeemed && (
                                                    <span className="px-2 py-0.5 text-xs font-bold rounded uppercase bg-red-100 text-red-700">Redeemed</span>
                                                )}
                                            </div>
                                       </div>
                                       <p className="text-slate-600 font-medium">{coupon.description}</p>
                                       
                                       <div className="flex flex-wrap gap-2 text-xs text-slate-500 mt-2">
                                           <span className="bg-white border border-slate-200 px-2 py-1 rounded">
                                               {coupon.discountType.replace('_', ' ')}: 
                                               <span className="font-bold text-slate-700 ml-1">
                                                   {coupon.discountType === DiscountType.PERCENTAGE ? `${coupon.value}%` : `$${coupon.value}`}
                                               </span>
                                           </span>
                                           <span className="bg-white border border-slate-200 px-2 py-1 rounded">
                                               Vendor: {coupon.vendorName}
                                           </span>
                                           {coupon.minPurchaseAmount ? (
                                              <span className="bg-white border border-slate-200 px-2 py-1 rounded">Min: ${coupon.minPurchaseAmount}</span>
                                           ) : null}
                                           <span className="bg-white border border-slate-200 px-2 py-1 rounded">
                                               Limit: {coupon.usageLimit}
                                           </span>
                                       </div>
                                   </div>
                               </div>
                               
                               <button 
                                  onClick={() => handleDelete(coupon.id)}
                                  className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 transition-colors"
                                  title="Delete Coupon"
                               >
                                   <Trash2 size={18} />
                               </button>
                           </div>
                       ))
                   )}
               </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CouponConfig;