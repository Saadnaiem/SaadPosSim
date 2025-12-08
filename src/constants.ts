import { Item, Coupon, DiscountType } from './types';

export const INITIAL_ITEMS: Item[] = [
  { id: 'h1', sku: '6180011596', name: 'HUGGIES EXTRA CARE CULOTTE PANTS SIZE (3) 58 DIAPERS', price: 16.50, category: 'Pants', stock: 50, brand: 'Huggies' },
  { id: 'h2', sku: '6180011597', name: 'HUGGIES EXTRA CARE CULOTTE PANTS SIZE (4) 52 DIAPERS', price: 16.50, category: 'Pants', stock: 45, brand: 'Huggies' },
  { id: 'h3', sku: '6180011598', name: 'HUGGIES EXTRA CARE CULOTTE PANTS SIZE (5) 44 DIAPERS', price: 17.00, category: 'Pants', stock: 60, brand: 'Huggies' },
  { id: 'h4', sku: '6180011599', name: 'HUGGIES EXTRA CARE CULOTTE PANTS SIZE (6) 40 DIAPERS', price: 17.50, category: 'Pants', stock: 55, brand: 'Huggies' },
  { id: 'h5', sku: '6180011579', name: 'HUGGIES EXTRA CARE SIZE (3) JUMBO PACK 76 DIAPERS', price: 21.99, category: 'Diapers', stock: 40, brand: 'Huggies' },
  { id: 'h6', sku: '6180011600', name: 'HUGGIES EXTRA CARE SIZE (3) JUMBO PACK 96 DIAPERS', price: 26.99, category: 'Diapers', stock: 35, brand: 'Huggies' },
  { id: 'h7', sku: '6180011574', name: 'HUGGIES EXTRA CARE SIZE (3) VALUE PACK 42 DIAPERS', price: 12.99, category: 'Diapers', stock: 30, brand: 'Huggies' },
  { id: 'h8', sku: '6180011580', name: 'HUGGIES EXTRA CARE SIZE (4) JUMBO PACK 68 DIAPERS', price: 21.99, category: 'Diapers', stock: 25, brand: 'Huggies' },
  { id: 'h9', sku: '6180011601', name: 'HUGGIES EXTRA CARE SIZE (4) JUMBO PACK 92 DIAPERS', price: 27.99, category: 'Diapers', stock: 20, brand: 'Huggies' },
  { id: 'h10', sku: '6180011581', name: 'HUGGIES EXTRA CARE SIZE (4+) JUMBO PACK 64 DIAPERS', price: 21.99, category: 'Diapers', stock: 40, brand: 'Huggies' },
  { id: 'h11', sku: '6180011582', name: 'HUGGIES EXTRA CARE SIZE (5) JUMBO PACK 60 DIAPERS', price: 21.99, category: 'Diapers', stock: 100, brand: 'Huggies' },
  { id: 'h12', sku: '6180011602', name: 'HUGGIES EXTRA CARE SIZE (5) JUMBO PACK 76 DIAPERS', price: 27.99, category: 'Diapers', stock: 30, brand: 'Huggies' },
  { id: 'h13', sku: '6180011583', name: 'HUGGIES EXTRA CARE SIZE (6) JUMBO PACK 42 DIAPERS', price: 15.99, category: 'Diapers', stock: 30, brand: 'Huggies' },
  { id: 'h14', sku: '6180011603', name: 'HUGGIES EXTRA CARE SIZE (6) JUMBO PACK 56 DIAPERS', price: 21.99, category: 'Diapers', stock: 30, brand: 'Huggies' },
  { id: 'h15', sku: '6180011548', name: 'HUGGIES NEW BORN SIZE 2 - 64 PIECES', price: 14.50, category: 'Newborn', stock: 50, brand: 'Huggies' },
  { id: 'h16', sku: '6180010076', name: 'HUGGIES NEW BORN SIZE 21 PIECES', price: 5.50, category: 'Newborn', stock: 50, brand: 'Huggies' },
  { id: 'h17', sku: '6180011433', name: 'HUGGIES NEW BORN SIZE 64 PIECES', price: 14.50, category: 'Newborn', stock: 50, brand: 'Huggies' },
  { id: 'h18', sku: '6180010080', name: 'HUGGIES SIZE SMALL SUPER FLEX 4*21', price: 22.00, category: 'Small', stock: 50, brand: 'Huggies' },
];

export const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'c1',
    code: 'HUGGIES10',
    description: '10% off all Huggies Products',
    discountType: DiscountType.PERCENTAGE,
    value: 10,
    active: true,
    vendorName: 'Kimberly-Clark',
    compensationType: 'VENDOR_CLAIM',
    applicableItemIds: [], // Applies to all
    isCombinable: false,
    buyQuantity: 0,
    getQuantity: 0,
    requiredItemIds: [],
    usageLimit: 'MULTI',
    usageCount: 0
  },
  {
    id: 'c2',
    code: 'NEWBORN5',
    description: '$5 off Newborn Packs',
    discountType: DiscountType.FIXED_AMOUNT,
    value: 5,
    minPurchaseAmount: 10,
    active: true,
    vendorName: 'Store Promotion',
    compensationType: 'MEP_CLAIM',
    applicableItemIds: ['h15', 'h16', 'h17'], // Linked to Newborn items
    isCombinable: false,
    buyQuantity: 0,
    getQuantity: 0,
    requiredItemIds: [],
    usageLimit: 'SINGLE',
    usageCount: 0
  }
];