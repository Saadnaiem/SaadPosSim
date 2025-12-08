import React, { createContext } from 'react';

export interface Item {
  id: string;
  name: string;
  sku: string;
  price: number;
  category: string;
  stock: number;
  brand?: string;
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  BOGO = 'BOGO', // Buy X Get Y Free
  BUNDLE_PERCENTAGE = 'BUNDLE_PERCENTAGE', // Buy Required Items, Get Applicable Items at % off
  BUNDLE_FIXED = 'BUNDLE_FIXED', // Buy Required Items, Get Applicable Items at $ off
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: DiscountType;
  value: number; // For BOGO this might be ignored or treated as 100% depending on implementation, usually 100% free
  minPurchaseAmount?: number;
  
  // Validity Configuration
  startDate?: string;
  endDate?: string;
  active: boolean;
  redeemed?: boolean; 
  isCombinable: boolean;
  usageLimit: 'SINGLE' | 'MULTI'; // New field: Single use vs Unlimited use
  usageCount: number; // Track number of times used

  // Vendor/Item linking
  vendorName: string;
  compensationType: string; // 'VENDOR_CLAIM' | 'MEP_CLAIM' | 'PARTNERSHIP'
  partnershipVendorPercent?: number;
  partnershipMepPercent?: number;
  
  // Advanced Logic
  applicableItemIds: string[]; // Items that get the discount
  requiredItemIds?: string[]; // Items required to be in cart to trigger discount (for Bundles)
  buyQuantity?: number; // For BOGO (Buy 2...)
  getQuantity?: number; // For BOGO (...Get 1)
}

export interface CartItem extends Item {
  quantity: number;
}

export interface Transaction {
  id: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  couponCode?: string;
  // Snapshot of coupon data for reporting at the time of sale
  couponDetails?: {
    vendorName: string;
    compensationType: string;
    partnershipVendorPercent?: number;
    partnershipMepPercent?: number;
    description?: string;
    value: number;
    discountType: DiscountType;
    applicableItemIds?: string[];
  };
  paymentMethod: 'CASH' | 'CARD';
  pharmacistId?: string;
  branchName?: string;
}

export interface StoreContextType {
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  coupons: Coupon[];
  setCoupons: React.Dispatch<React.SetStateAction<Coupon[]>>;
  transactions: Transaction[];
  addTransaction: (transaction: Transaction) => void;
  importItemsFromCSV: (csvContent: string) => void;
}

export const StoreContext = createContext<StoreContextType>({} as StoreContextType);
