import { ProductItem, Status } from '@/types';

export const DEMO_BANKER_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-001',
    companyId: 'company-apex-01',
    sku: 'APEX-IP16PM-256',
    name: 'Apple iPhone 16 Pro Max',
    brand: 'Apple',
    model: 'iPhone 16 Pro Max Titanium',
    category: 'SMARTPHONE',
    description:
      'Grade-A aerospace titanium finish with A18 Pro chip, 48MP Fusion camera system, and up to 33-hour battery life.',
    images: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop',
    ],
    specifications: {
      screenSize: '6.9-inch Super Retina XDR OLED 120Hz',
      camera: '48MP Fusion + 48MP Ultra Wide + 12MP 5x Telephoto',
      battery: '4685 mAh (Fast MagSafe Charging)',
      operatingSystem: 'iOS 18',
      options: [
        {
          name: 'Color Finish',
          choices: [
            { label: 'Natural Titanium', additionalPrice: 0, isDefault: true },
            { label: 'Desert Titanium', additionalPrice: 0 },
            { label: 'Black Titanium', additionalPrice: 0 },
            { label: 'White Titanium', additionalPrice: 0 },
          ],
        },
        {
          name: 'Storage Capacity',
          choices: [
            { label: '256GB NVMe', additionalPrice: 0, isDefault: true },
            { label: '512GB NVMe', additionalPrice: 150.0 },
            { label: '1TB NVMe', additionalPrice: 350.0 },
          ],
        },
      ],
    },
    basePrice: 1199.0,
    unitPrice: 1149.0,
    availableStock: 23,
    status: Status.ACTIVE,
  },
  {
    id: 'prod-002',
    companyId: 'company-apex-01',
    sku: 'APEX-MBP16-M4MAX',
    name: 'Apple MacBook Pro 16" (M4 Max)',
    brand: 'Apple',
    model: 'MacBook Pro 16 Liquid Retina XDR',
    category: 'LAPTOP',
    description:
      'Engineered for extreme creative workflows with 16-core CPU, 40-core GPU, and unified memory bandwidth.',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop',
    ],
    specifications: {
      processor: 'Apple M4 Max (16-core CPU, 40-core GPU)',
      display: '16.2-inch Liquid Retina XDR (3456x2234)',
      options: [
        {
          name: 'Unified Memory',
          choices: [
            { label: '36GB Unified RAM', additionalPrice: 0, isDefault: true },
            { label: '48GB Unified RAM', additionalPrice: 200.0 },
            { label: '64GB Unified RAM', additionalPrice: 400.0 },
          ],
        },
        {
          name: 'SSD Storage',
          choices: [
            { label: '1TB Superfast SSD', additionalPrice: 0, isDefault: true },
            { label: '2TB Superfast SSD', additionalPrice: 400.0 },
          ],
        },
      ],
    },
    basePrice: 3499.0,
    unitPrice: 3399.0,
    availableStock: 12,
    status: Status.ACTIVE,
  },
  {
    id: 'prod-003',
    companyId: 'company-apex-01',
    sku: 'APEX-S24U-512',
    name: 'Samsung Galaxy S24 Ultra 5G',
    brand: 'Samsung',
    model: 'Galaxy S24 Ultra Titanium Gray',
    category: 'SMARTPHONE',
    description:
      'Galaxy AI powered flagship with built-in S-Pen stylus, 200MP quad telephoto zoom, and Armor Aluminum frame.',
    images: [
      'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&auto=format&fit=crop',
    ],
    specifications: {
      screenSize: '6.8-inch Dynamic AMOLED 2X 120Hz',
      camera: '200MP Wide + 50MP Periscope 5x Zoom',
      options: [
        {
          name: 'Color Finish',
          choices: [
            { label: 'Titanium Gray', additionalPrice: 0, isDefault: true },
            { label: 'Titanium Black', additionalPrice: 0 },
            { label: 'Titanium Violet', additionalPrice: 0 },
          ],
        },
      ],
    },
    basePrice: 1299.0,
    unitPrice: 1199.0,
    availableStock: 18,
    status: Status.ACTIVE,
  },
  {
    id: 'prod-004',
    companyId: 'company-apex-01',
    sku: 'APEX-SONY-XM5',
    name: 'Sony WH-1000XM5 Wireless Headphones',
    brand: 'Sony',
    model: 'WH-1000XM5 Noise Canceling',
    category: 'AUDIO',
    description:
      'Industry-leading active noise cancellation with 8 microphones, Auto NC Optimizer, and 30-hour battery runtime.',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop',
    ],
    basePrice: 399.0,
    unitPrice: 349.0,
    availableStock: 35,
    status: Status.ACTIVE,
  },
];

export const BankerDemoProducts = DEMO_BANKER_PRODUCTS;
