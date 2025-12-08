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
    // Reset input
    event.target.value = '';
  };

  // --- Sharing & Download Logic ---

  const generateCanvas = (coupon: Coupon): HTMLCanvasElement | null => {
    // Code 39 Generation Logic
    const CODE39_MAP: Record<string, string> = {
        '0': 'b0b1B0B0b', '1': 'B0b1b0b0B', '2': 'b0B1b0b0B', '3': 'B0B1b0b0b',
        '4': 'b0b1B0b0B', '5': 'B0b1B0b0b', '6': 'b0B1B0b0b', '7': 'b0b1b0B0B',
        '8': 'B0b1b0B0b', '9': 'b0B1b0B0b',
        'A': 'B0b0b1b0B', 'B': 'b0B0b1b0B', 'C': 'B0B0b1b0b', 'D': 'b0b0B1b0B',
        'E': 'B0b0B1b0b', 'F': 'b0B0B1b0b', 'G': 'b0b0b1B0B', 'H': 'B0b0b1B0b',
        'I': 'b0B0b1B0b', 'J': 'b0b0B1B0b', 'K': 'B0b0b0b1B', 'L': 'b0B0b0b1B',
        'M': 'B0B0b0b1b', 'N': 'b0b0B0b1B', 'O': 'B0b0B0b1b', 'P': 'b0B0B0b1b',
        'Q': 'b0b0b0B1B', 'R': 'B0b0b0B1b', 'S': 'b0B0b0B1b', 'T': 'b0b0B0B1b',
        'U': 'B1b0b0b0B', 'V': 'b1B0b0b0B', 'W': 'B1B0b0b0b', 'X': 'b1b0B0b0B',
        'Y': 'B1b0B0b0b', 'Z': 'b1B0B0b0b',
        '-': 'b1b0b0B0B', '.': 'B1b0b0B0b', ' ': 'b1B0b0B0b', '*': 'b1b0B0B0b',
        '$': 'b1b1b1b0b', '/': 'b1b1b0b1b', '+': 'b1b0b1b1b', '%': 'b0b1b1b1b'
    };

    const encoded = `*${coupon.code.toUpperCase()}*`;
    let totalBarcodeWidth = 20; 
    const elements: {x:number, w:number}[] = [];
    
    let cursor = 10;
    for (let i = 0; i < encoded.length; i++) {
        const char = encoded[i];
        const pattern = CODE39_MAP[char] || CODE39_MAP[' '];
        for (let j = 0; j < 9; j++) {
            const isBar = j % 2 === 0;
            const symbol = pattern[j];
            const isWide = symbol === 'B' || symbol === '1' || symbol === 'W';
            const width = isWide ? 2.5 : 1; 
            if (isBar) elements.push({ x: cursor, w: width });
            cursor += width;
        }
        cursor += 1;
    }
    totalBarcodeWidth = cursor + 9;

    const scale = 2;
    const padding = 40;
    const canvasWidth = Math.max(650, (totalBarcodeWidth * scale) + (padding * 2));
    const canvasHeight = 400;

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // --- MODERN LUXURY GREEN THEME ---

    // 1. Background - Clean White
    ctx.fillStyle = '#ffffff'; 
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 2. Borders - Vibrant Green
    const borderColor = '#16a34a'; // Green 600
    
    // Outer Thin Line
    ctx.lineWidth = 1;
    ctx.strokeStyle = borderColor;
    ctx.strokeRect(10, 10, canvasWidth - 20, canvasHeight - 20);

    // Inner Thick Line
    ctx.lineWidth = 4;
    ctx.strokeStyle = borderColor;
    ctx.strokeRect(20, 20, canvasWidth - 40, canvasHeight - 40);

    // 3. Header - Gradient Green
    const gradient = ctx.createLinearGradient(0, 0, canvasWidth, 0);
    gradient.addColorStop(0, '#16a34a'); // Green 600
    gradient.addColorStop(1, '#22c55e'); // Green 500
    
    ctx.fillStyle = gradient;
    ctx.fillRect(24, 24, canvasWidth - 48, 80);

    // Header Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px serif';
    ctx.textAlign = 'center';
    ctx.fillText('EXCLUSIVE OFFER', canvasWidth / 2, 75);

    // Decorative Line Under Header (White)
    ctx.beginPath();
    ctx.moveTo(canvasWidth/2 - 60, 90);
    ctx.lineTo(canvasWidth/2 + 60, 90);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    const centerX = canvasWidth / 2;
    const contentStartY = 140;

    // 4. Content
    // Vendor Name (Dark Green)
    ctx.fillStyle = '#064e3b'; // Emerald 900
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(coupon.vendorName.toUpperCase(), centerX, contentStartY);

    // Discount Value - Vibrant Green
    ctx.fillStyle = '#15803d'; // Green 700 
    ctx.font = 'bold 56px serif';
    let valueText = '';
    if (coupon.discountType === DiscountType.BOGO) {
        valueText = `BUY ${coupon.buyQuantity} GET ${coupon.getQuantity} FREE`;
        ctx.font = 'bold 42px serif';
    } else if (coupon.discountType === DiscountType.PERCENTAGE) {
        valueText = `${coupon.value}% OFF`;
    } else if (coupon.discountType === DiscountType.BUNDLE_PERCENTAGE) {
        valueText = `BUNDLE DEAL`;
    } else {
        valueText = `$${coupon.value} OFF`;
    }
    
    ctx.shadowColor = 'rgba(21, 128, 61, 0.2)';
    ctx.shadowBlur = 10;
    ctx.fillText(valueText, centerX, contentStartY + 60);
    ctx.shadowBlur = 0;

    // --- PROMINENT VALIDITY DATE PILL ---
    const validText = `Valid: ${coupon.startDate || 'Now'} - ${coupon.endDate || 'No Expiry'}`;
    
    // Calculate pill size
    ctx.font = 'bold 16px sans-serif';
    const textMetrics = ctx.measureText(validText);
    const textWidth = textMetrics.width;
    const pillPadding = 20;
    const pillWidth = textWidth + (pillPadding * 2);
    const pillHeight = 32;
    const pillY = contentStartY + 85;
    
    ctx.fillStyle = '#f0fdf4'; // Light green bg
    ctx.beginPath();
    ctx.roundRect(centerX - (pillWidth/2), pillY, pillWidth, pillHeight, 16);
    ctx.fill();
    ctx.strokeStyle = '#86efac'; // Green 300
    ctx.lineWidth = 1;
    ctx.stroke();

    // Validity Text
    ctx.fillStyle = '#15803d'; // Green 700
    ctx.fillText(validText, centerX, pillY + 22);

    // Description (Slate)
    ctx.fillStyle = '#475569'; 
    ctx.font = 'italic 20px serif';
    ctx.fillText(coupon.description, centerX, contentStartY + 140);

    // Barcode Area
    const startY = 300; 
    const barHeight = 60;
    const barcodeDrawWidth = (totalBarcodeWidth * scale);
    const startX = (canvas.width - barcodeDrawWidth) / 2;
    
    // Draw Barcode Bars (Black)
    ctx.fillStyle = '#000000';
    elements.forEach(el => {
        ctx.fillRect(startX + (el.x * scale), startY, el.w * scale, barHeight);
    });

    // Code Text (Green)
    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = borderColor;
    ctx.fillText(`${coupon.code.toUpperCase()}`, centerX, startY + barHeight + 30);
    
    return canvas;
  };

  const downloadCoupon = (coupon: Coupon) => {
    const canvas = generateCanvas(coupon);
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `COUPON-${coupon.code}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const getShareText = (coupon: Coupon) => {
    return `Special Offer! Use code *${coupon.code}* at SaadPOS Pharmacy.\n${coupon.description}.\nValid until ${coupon.endDate || 'forever'}.`;
  };

  const shareWhatsApp = (coupon: Coupon) => {
    const canvas = generateCanvas(coupon);
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], `coupon-${coupon.code}.png`, { type: 'image/png' });
        const text = getShareText(coupon);

        // 1. Mobile Native Share (Preferred)
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: 'SaadPOS Coupon',
                    text: text
                });
                return;
            } catch (error) {
                console.warn('Share API failed', error);
            }
        } 
        
        // 2. Desktop Strategy: CLIPBOARD (No Download)
        try {
            const item = new ClipboardItem({ [blob.type]: blob });
            await navigator.clipboard.write([item]);
            
            alert("✅ Coupon Image COPIED to Clipboard! \n\nWhatsApp Web will open now. \nSimply press Ctrl+V (Paste) in the chat window to send it.");
            
            // Open WhatsApp with just the text
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
            return;
            
        } catch (err) {
            console.error('Clipboard write failed', err);
            // 3. Fallback: Download File if clipboard blocked
            const link = document.createElement('a');
            link.download = `COUPON-${coupon.code}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            alert("Image downloaded (Clipboard blocked). Please attach it in WhatsApp.");
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        }

    }, 'image/png');
  };

  const shareSMS = (coupon: Coupon) => {
    const text = encodeURIComponent(getShareText(coupon));
    window.open(`sms:?&body=${text}`, '_blank');
  };

  const shareEmail = (coupon: Coupon) => {
    const subject = encodeURIComponent(`Coupon Code: ${coupon.code}`);
    const body = encodeURIComponent(getShareText(coupon));
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const isBOGO = formData.discountType === DiscountType.BOGO;
  const isBundle = formData.discountType === DiscountType.BUNDLE_PERCENTAGE || formData.discountType === DiscountType.BUNDLE_FIXED;

  // Render Item Selection List Helper
  const renderItemSelectionList = (listType: 'applicable' | 'required') => {
    const selectedIds = listType === 'applicable' ? (formData.applicableItemIds || []) : (formData.requiredItemIds || []);
    const searchTerm = listType === 'applicable' ? searchApplicable : searchRequired;
    const setSearch = listType === 'applicable' ? setSearchApplicable : setSearchRequired;

    // Use pre-calculated lists (hoisted) to avoid calling hooks inside a helper function
    const filteredItems = listType === 'applicable' ? filteredApplicableItems : filteredRequiredItems;

    // Group filtered items
    const groups = groupItemsByBrand(filteredItems);

    return (
      <div className="border border-slate-300 rounded-lg p-2 bg-white space-y-1">
        {/* Search Bar */}
        <div className="relative mb-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
                type="text" 
                placeholder="Search Item, SKU or Brand..."
                className="w-full pl-8 pr-2 py-1.5 text-xs bg-white text-slate-900 border border-slate-200 rounded outline-none focus:border-green-500"
                value={searchTerm}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>

        <div className="h-56 overflow-y-auto pr-1">
            {listType === 'applicable' && (
            <div 
                onClick={() => setFormData({...formData, applicableItemIds: []})}
                className={`flex items-center gap-2 p-2 rounded cursor-pointer text-xs mb-2 border ${selectedIds.length === 0 ? 'bg-green-100 text-green-700 font-bold border-green-200' : 'hover:bg-slate-100 border-transparent'}`}
            >
                {selectedIds.length === 0 ? <CheckSquare size={14}/> : <Square size={14}/>}
                <span>All Items (Global)</span>
            </div>
            )}
            
            {Object.keys(groups).length === 0 && (
                <div className="text-center text-xs text-slate-400 py-4">No items match search</div>
            )}

            {(Object.entries(groups) as [string, Item[]][]).map(([brand, brandItems]) => {
            const allSelected = brandItems.every(i => selectedIds.includes(i.id));
            const someSelected = brandItems.some(i => selectedIds.includes(i.id));
            // Auto expand if searching, otherwise use manual toggle
            const isExpanded = searchTerm ? true : expandedBrands[brand];

            return (
                <div key={brand} className="border border-slate-100 rounded mb-1 overflow-hidden">
                {/* Brand Header */}
                <div className="bg-slate-50 p-2 flex items-center justify-between hover:bg-slate-100 select-none">
                    <div className="flex items-center gap-2">
                        <button 
                        type="button"
                        onClick={() => toggleBrandExpansion(brand)}
                        className="p-1 hover:bg-slate-200 rounded text-slate-500"
                        >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        <div 
                        onClick={() => toggleBrandSelection(brandItems, listType)}
                        className="flex items-center gap-2 cursor-pointer"
                        >
                        {allSelected ? <CheckSquare size={14} className="text-green-600"/> : (someSelected ? <div className="w-3.5 h-3.5 bg-green-600 rounded-sm relative"><div className="absolute top-1.5 left-0.5 right-0.5 h-0.5 bg-white"></div></div> : <Square size={14} className="text-slate-300"/>)}
                        <span className="font-semibold text-xs text-slate-700">{brand}</span>
                        </div>
                    </div>
                    <span className="text-[10px] text-slate-400">{brandItems.length} items</span>
                </div>

                {/* Brand Items */}
                {isExpanded && (
                    <div className="pl-8 pr-2 py-1 space-y-1 bg-white border-t border-slate-100">
                        {brandItems.map(item => {
                            const isSelected = selectedIds.includes(item.id);
                            return (
                            <div 
                                key={item.id}
                                onClick={() => toggleItemSelection(item.id, listType)}
                                className={`flex items-center gap-2 p-1.5 rounded cursor-pointer text-xs ${isSelected ? 'bg-green-50 text-green-800' : 'hover:bg-slate-50'}`}
                            >
                                {isSelected ? <CheckSquare size={14} className="shrink-0 text-green-600"/> : <Square size={14} className="text-slate-300 shrink-0"/>}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 overflow-hidden w-full">
                                <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1 rounded border border-slate-200 shrink-0">{item.sku}</span>
                                <span className="truncate text-xs font-medium">{item.name}</span>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                )}
                </div>
            );
            })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold text-slate-800">Coupon Configuration</h1>
        <p className="text-slate-500">Create and manage discount rules, validity periods, and vendor tracking.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Creation Form */}
        <div className="lg:col-span-1 space-y-6">
           {/* Bulk Import Section */}
           <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <FileSpreadsheet size={16} className="text-green-600" /> Bulk Import
            </h2>
            <div className="space-y-2">
                <button 
                    onClick={downloadTemplate}
                    className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-600 hover:text-green-600 hover:border-green-400 transition-colors"
                >
                    <Download size={14} /> Download CSV Template
                </button>
                <label className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-indigo-600 text-white rounded-lg text-xs font-medium cursor-pointer hover:bg-indigo-700 transition-colors">
                    <Upload size={14} /> Upload CSV File
                    <input type="file" accept=".csv" className="hidden" onChange={handleCouponImport}/>
                </label>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 border-l-4 border-green-500 pl-2">Configuration</h2>
            
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Coupon Code</label>
                <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg uppercase font-mono tracking-wider focus:ring-2 focus:ring-green-500 outline-none placeholder-slate-400"
                      placeholder="CODE123"
                      required
                    />
                    <button 
                      type="button"
                      onClick={generateRandomCode}
                      className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 hover:text-green-600 transition-colors"
                      title="Generate Random Code"
                    >
                      <Shuffle size={20} />
                    </button>
                </div>
                {/* Live Barcode Preview */}
                {formData.code && (
                    <div className="mt-6 mb-6 flex flex-col items-center bg-slate-50 p-6 rounded border border-slate-100 animate-in fade-in duration-300 w-full overflow-hidden">
                        <span className="text-[10px] text-slate-400 mb-2 uppercase tracking-wide">Live Preview (Code 39)</span>
                        <BarcodeDisplay value={formData.code} />
                    </div>
                )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vendor Name</label>
              <input 
                type="text" 
                value={formData.vendorName}
                onChange={(e) => setFormData({...formData, vendorName: e.target.value})}
                className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none placeholder-slate-400"
                placeholder="e.g. Kimberly-Clark"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <input 
                type="text" 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none placeholder-slate-400"
                placeholder="Discount description"
                required
              />
            </div>

            {/* Validity Dates */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
               <div className="col-span-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Calendar size={16} className="text-green-600"/> Validity Period
               </div>
               <div>
                  <label className="block text-xs text-slate-500 mb-1">Start Date</label>
                  <input 
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                  />
               </div>
               <div>
                  <label className="block text-xs text-slate-500 mb-1">End Date</label>
                  <input 
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                  />
               </div>
            </div>

            {/* Discount Logic */}
            <div className="p-3 border border-green-100 bg-green-50/30 rounded-lg space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Discount Logic</label>
                <select 
                  value={formData.discountType}
                  onChange={(e) => setFormData({...formData, discountType: e.target.value as DiscountType})}
                  className="w-full p-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white font-medium text-slate-700"
                >
                  <option value={DiscountType.PERCENTAGE}>Percentage (%)</option>
                  <option value={DiscountType.FIXED_AMOUNT}>Fixed Amount ($)</option>
                  <option value={DiscountType.BOGO}>Buy X Get Y Free (BOGO)</option>
                  <option value={DiscountType.BUNDLE_PERCENTAGE}>Bundle (Buy A, Get B at % Off)</option>
                  <option value={DiscountType.BUNDLE_FIXED}>Bundle (Buy A, Get B at $ Off)</option>
                </select>
              </div>

              {/* Dynamic Inputs based on Type */}
              {isBOGO ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Buy Qty</label>
                    <input 
                      type="number" 
                      min="1"
                      value={formData.buyQuantity}
                      onChange={(e) => setFormData({...formData, buyQuantity: parseInt(e.target.value)})}
                      className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Get Free</label>
                    <input 
                      type="number" 
                      min="1"
                      value={formData.getQuantity}
                      onChange={(e) => setFormData({...formData, getQuantity: parseInt(e.target.value)})}
                      className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg text-center font-bold"
                    />
                  </div>
                  <p className="col-span-2 text-xs text-slate-500 text-center">
                    Customer buys {formData.buyQuantity} items, gets {formData.getQuantity} free.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Discount Value</label>
                  <input 
                    type="number" 
                    value={formData.value}
                    onChange={(e) => setFormData({...formData, value: parseFloat(e.target.value)})}
                    className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-bold"
                    min="0"
                    placeholder={formData.discountType === DiscountType.PERCENTAGE ? "e.g. 10 for 10%" : "e.g. 5 for $5"}
                  />
                </div>
              )}
            </div>
            
            {/* Compensation & Combinability */}
            <div className="grid grid-cols-2 gap-4">
                 <div>
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

            <div className="space-y-3">
                 <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                     <Share2 size={16} className="text-indigo-600" />
                     <h3 className="font-bold text-sm text-slate-700">Compensation</h3>
                 </div>
                 <select 
                    value={formData.compensationType} 
                    onChange={e => setFormData({...formData, compensationType: e.target.value})}
                    className="w-full px-3 py-2 border-2 border-indigo-100 focus:border-indigo-500 rounded-lg text-sm bg-white text-slate-800 font-medium outline-none transition-colors"
                 >
                     <option value="VENDOR_CLAIM">100% Vendor Claim</option>
                     <option value="MEP_CLAIM">100% Store (MEP)</option>
                     <option value="PARTNERSHIP">Partnership Split</option>
                 </select>
                 
                 {formData.compensationType === 'PARTNERSHIP' && (
                     <div className="grid grid-cols-2 gap-4 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                         <div>
                             <label className="text-xs font-bold text-indigo-700 mb-1 block">Vendor Share (%)</label>
                             <input 
                                type="number" 
                                value={formData.partnershipVendorPercent} 
                                onChange={e => setFormData({...formData, partnershipVendorPercent: Number(e.target.value)})} 
                                className="w-full px-3 py-2 bg-white border-2 border-indigo-200 rounded-lg text-sm focus:border-indigo-500 outline-none font-bold text-slate-700" 
                             />
                         </div>
                         <div>
                             <label className="text-xs font-bold text-indigo-700 mb-1 block">Store Share (%)</label>
                             <input 
                                type="number" 
                                value={formData.partnershipMepPercent} 
                                onChange={e => setFormData({...formData, partnershipMepPercent: Number(e.target.value)})} 
                                className="w-full px-3 py-2 bg-white border-2 border-indigo-200 rounded-lg text-sm focus:border-indigo-500 outline-none font-bold text-slate-700" 
                             />
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
               {isBundle && (
                   <div className="space-y-2">
                       <div className="flex justify-between items-center">
                           <label className="text-xs font-bold text-slate-600 uppercase">Required Items (Trigger)</label>
                           <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">{formData.requiredItemIds?.length} selected</span>
                       </div>
                       {renderItemSelectionList('required')}
                   </div>
               )}
               <div className="space-y-2">
                   <div className="flex justify-between items-center">
                       <label className="text-xs font-bold text-slate-600 uppercase">Applicable Items (Reward)</label>
                       <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">{formData.applicableItemIds?.length} selected</span>
                   </div>
                   {renderItemSelectionList('applicable')}
               </div>
            </div>
            
            {/* Bulk Generation Section */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Layers size={16} className="text-green-600"/> Bulk Generation
                </label>
                <div className="flex items-center gap-4">
                    <div className="w-24">
                        <input 
                            type="number" 
                            min="1"
                            max="3000"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full p-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-center"
                        />
                    </div>
                    <p className="text-xs text-slate-500 flex-1">
                        {quantity > 1 
                            ? `Generating ${quantity} unique coupons.` 
                            : 'Single coupon.'}
                    </p>
                </div>
            </div>

            <button 
              type="submit"
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-200 transition-all active:scale-95 flex justify-center items-center gap-2"
            >
              <Plus size={20} />
              {quantity > 1 ? `Generate ${quantity} Coupons` : 'Create Coupon'}
            </button>
          </form>
        </div>

        {/* List & Details */}
        <div className="lg:col-span-2">
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
               <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                   <div>
                       <h2 className="font-bold text-slate-800 text-lg">Active Coupons</h2>
                       <p className="text-slate-500 text-sm">{coupons.length} coupons configured</p>
                   </div>
                   <button onClick={() => setCoupons([])} className="text-xs text-red-500 hover:underline">Clear All</button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[1200px]">
                   {coupons.length === 0 ? (
                       <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                           <ShoppingBag size={48} className="mb-4 opacity-20" />
                           <p>No coupons created yet.</p>
                       </div>
                   ) : (
                       coupons.slice().reverse().map(coupon => (
                           <div key={coupon.id} className="border border-slate-200 rounded-lg p-6 bg-slate-50/50 relative group">
                               <div className="flex flex-col xl:flex-row gap-6 items-center">
                                   {/* Live Barcode Render */}
                                   <div className="shrink-0 flex flex-col items-center gap-2">
                                       <BarcodeDisplay value={coupon.code} />
                                   </div>
                                   
                                   <div className="flex-1 space-y-2 w-full text-center xl:text-left">
                                       <div className="flex justify-center xl:justify-between items-start">
                                            <h3 className="font-bold text-slate-800 text-2xl tracking-tight">{coupon.code}</h3>
                                            <div className="flex gap-2">
                                                <span className={`px-2 py-0.5 text-xs font-bold rounded uppercase ${coupon.active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                                                    {coupon.active ? 'Active' : 'Inactive'}
                                                </span>
                                                <span className="px-2 py-0.5 text-xs font-bold rounded uppercase bg-blue-100 text-blue-700">
                                                    {coupon.usageLimit}
                                                </span>
                                            </div>
                                       </div>
                                       <p className="text-slate-600 font-medium text-lg">{coupon.description}</p>
                                       
                                       <div className="flex flex-wrap gap-2 text-xs text-slate-500 mt-2 justify-center xl:justify-start">
                                           <span className="bg-white border border-slate-200 px-2 py-1 rounded">
                                               {coupon.discountType}: 
                                               <span className="font-bold text-slate-700 ml-1">
                                                   {coupon.value}
                                               </span>
                                           </span>
                                           <span className="bg-white border border-slate-200 px-2 py-1 rounded">
                                               Valid: {coupon.startDate} - {coupon.endDate}
                                           </span>
                                            <span className="bg-white border border-slate-200 px-2 py-1 rounded">
                                               Used: {coupon.usageCount || 0} times
                                           </span>
                                       </div>
                                       
                                       {/* Action Buttons */}
                                       <div className="flex gap-3 mt-4 justify-center xl:justify-start">
                                            <button 
                                                onClick={() => downloadCoupon(coupon)}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-green-600 transition-colors"
                                            >
                                                <Download size={14} /> Save Image
                                            </button>
                                            <button 
                                                onClick={() => shareWhatsApp(coupon)}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white border border-transparent rounded text-xs font-bold transition-colors"
                                            >
                                                <Share2 size={14} /> WhatsApp
                                            </button>
                                            <button 
                                                onClick={() => shareSMS(coupon)}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white border border-transparent rounded text-xs font-bold transition-colors"
                                            >
                                                <MessageSquare size={14} /> SMS
                                            </button>
                                            <button 
                                                onClick={() => shareEmail(coupon)}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white border border-transparent rounded text-xs font-bold transition-colors"
                                            >
                                                <Mail size={14} /> Email
                                            </button>
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