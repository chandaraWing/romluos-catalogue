export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  COMPANY_OWNER = 'COMPANY_OWNER',
  BRANCH_MANAGER = 'BRANCH_MANAGER',
  COMPANY_OPERATOR = 'COMPANY_OPERATOR',
  BRANCH_REP = 'BRANCH_REP',
  DISTRICT_BANKER = 'DISTRICT_BANKER',
  AUDITOR = 'AUDITOR',
  CONSUMER = 'CONSUMER',
}

export enum Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum FinancingRequestStatus {
  QR_GENERATED = 'QR_GENERATED',
  SUBMITTED = 'SUBMITTED',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DOWN_PAYMENT_PAID = 'DOWN_PAYMENT_PAID',
  DISBURSED = 'DISBURSED',
  ITEMS_COLLECTED = 'ITEMS_COLLECTED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export interface CompanyItem {
  id: string;
  name: string;
  code: string;
  taxId?: string;
  address?: string;
  status: Status;
}

export interface BranchItem {
  id: string;
  companyId: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  status?: Status;
  company?: CompanyItem;
}

export interface PartnerLocaleName {
  id: string;
  name: string;
  locale: string;
}

export interface PartnerUserBranch {
  id: string;
  locales: PartnerLocaleName[];
}

export interface PartnerUserCompany {
  id: string;
  locales: PartnerLocaleName[];
  default_branch?: PartnerUserBranch;
}

export interface PartnerUserProfile {
  id: string;
  phone_number: string;
  email?: string | null;
  first_name: string;
  last_name: string;
  user_state?: string | null;
  user_segment?: string | null;
  is_cod_allowed?: boolean | null;
  default_company?: PartnerUserCompany;
}

export interface PartnerProfileResponse {
  result: boolean;
  result_code: string;
  result_message: string;
  trace_id?: string;
  body: PartnerUserProfile;
}

export interface BankerProfile {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  role: Role;
  companyId?: string;
  companyName?: string;
  branchId?: string;
  branchName?: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  code: string;
  description?: string;
  logoUrl?: string;
  icon?: any;
}

export interface BrandItem {
  id: string;
  name: string;
  code: string;
  description?: string;
  logoUrl?: string;
}

export interface VariantChoice {
  label: string;
  additionalPrice: number;
}

export interface VariantOptionGroup {
  name: string;
  choices: VariantChoice[];
}

export interface ProductItem {
  id: string;
  companyId: string;
  name: string;
  sku: string;
  barcode?: string;
  brand: string;
  model: string;
  category: string;
  categoryId?: string;
  categoryRel?: { id?: string; name?: string; code?: string };
  brandRel?: { id?: string; name?: string; code?: string; logoUrl?: string };
  description?: string;
  basePrice: number;
  unitPrice?: number;
  currentPrice?: number;
  promotionalPrice?: number;
  availableStock?: number;
  branchStock?: number;
  totalStock?: number;
  totalAvailable?: number;
  inventoryCount?: number;
  images?: string[];
  image?: string;
  options?: any[];
  specifications?: Record<string, any>;
  variantGroups?: VariantOptionGroup[];
  hasVariants?: boolean;
  status: Status;
  isCustomPrice?: boolean;
  createdAt?: string;
  branchId?: string;
  branchName?: string;
  variantId?: string;
}

export interface CatalogHashPayload {
  link: {
    id: string;
    hash: string;
    clickCount: number;
    lastAccessedAt?: string;
    createdAt: string;
  };
  banker: BankerProfile;
  branch: BranchItem;
  company: CompanyItem;
  products: ProductItem[];
  totalProducts: number;
  categories: CategoryItem[];
  brands: BrandItem[];
}

export interface CartItemProps {
  id: string;
  productId: string;
  itemId?: string;
  name: string;
  price: number;
  originalPrice?: number;
  branchId?: string;
  discount?: { amount: number; type: string };
  image: string;
  attributes?: {
    color?: string;
    storage?: string;
    size?: string;
    [key: string]: string | undefined;
  };
  quantity: number;
  selected: boolean;
  onSelect?: (checked: boolean) => void;
  onQuantityChange?: (newQuantity: number) => void;
  onDelete?: () => void;
  onEditVariant?: () => void;
  stock?: number;
  isUnavailable?: boolean;
  isAllowBackOrder?: boolean;
  isAvailable?: boolean;
  readonly?: boolean;
  hideCheckboxes?: boolean;
  promotionId?: string;
  promotionPrice?: number;
  promotionType?: string;
  currency?: string;
  variantAttributes?: { key: string; value: string }[];
  variantId?: string;
  hasVariantAttributes?: boolean;
}

export interface CartStore {
  storeId: string;
  isOversea?: boolean;
  items: CartItemProps[];
  branchAddress?: Record<string, any>;
  branch: {
    id: string;
    name: string;
    address?: {
      latitude?: number;
      longitude?: number;
    };
  };
}
