import { CategoryItem, BrandItem, ProductItem, CompanyItem, BranchItem } from '@/types';
import { LucideIcon } from 'lucide-react';

export interface BankerInfo {
  id: string | number;
  fullName: string;
  email: string;
  phone?: string | null;
}

export interface BranchInfo {
  id: string | number;
  name: string;
  code: string;
  address?: string | null;
  phone?: string | null;
}

export interface CompanyInfo {
  id: string | number;
  name: string;
  code: string;
  taxId?: string | null;
  address?: string | null;
  logo?: string | null;
}

export interface CategoryIconMapping {
  id: string;
  name: string;
  code: string;
  icon: LucideIcon;
}

export type FilterTag = 'all' | 'new' | 'best' | 'discount' | 'instock';
export type SortOption = 'featured' | 'price-low' | 'price-high' | 'rating' | 'newest';
