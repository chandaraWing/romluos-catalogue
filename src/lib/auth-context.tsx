'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  Role,
  PartnerUserProfile,
  PartnerBusinessItem,
  BranchItem,
  CategoryItem,
  ProductItem,
} from '@/types';
import { rsaEncrypt } from '@/lib/cipher';
import { getPreferredLocaleName } from '@/lib/utils';
import { api } from '@/lib/api';
import { httpRequest } from '@/lib/httpRequest';

export interface UserContextType {
  id: string;
  email: string;
  phone?: string | null;
  firstName: string;
  lastName: string;
  role: Role;
  companyId?: string;
  companyName?: string;
  branchId?: string;
  branchName?: string;
}

export interface AuthSessionState {
  consumerToken: string | null;
  districtBankerToken: string | null;
  consumerData: any | null;
  districtBankerData: any | null;
  partnerProfile: PartnerUserProfile | null;
  businesses: PartnerBusinessItem[];
  selectedBusiness: PartnerBusinessItem | null;
}

export interface LoginResult {
  success: boolean;
  consumerOk: boolean;
  districtBankerOk: boolean;
  message?: string;
  profile?: any;
  businesses?: PartnerBusinessItem[];
}

interface AuthContextValue {
  user: UserContextType | null;
  loading: boolean;
  isAuthenticated: boolean;
  consumerToken: string | null;
  districtBankerToken: string | null;
  consumerData: any | null;
  districtBankerData: any | null;
  partnerProfile: PartnerUserProfile | null;
  businesses: PartnerBusinessItem[];
  selectedBusiness: PartnerBusinessItem | null;
  hasConsumerAuth: boolean;
  hasDistrictBankerAuth: boolean;
  activeRole: Role;
  login: (credentials: { phone: string; pin: string }) => Promise<LoginResult>;
  logout: () => void;
  switchRole: (role: Role) => void;
  switchCompany: (business: PartnerBusinessItem | { id: string; name?: string; logo?: any }) => Promise<void>;
  switchCompanyAndBranch: (
    business: PartnerBusinessItem | { id: string; name?: string; logo?: any; name_locales?: any[] },
    branch: BranchItem
  ) => Promise<void>;
  switchBranch: (branch: BranchItem) => void;
  fetchUserProfile: (token?: string) => Promise<PartnerUserProfile | null>;
  fetchBusinesses: (token?: string) => Promise<PartnerBusinessItem[]>;
  fetchCategories: (businessId?: string) => Promise<CategoryItem[]>;
  fetchBranches: (companyId: string) => Promise<BranchItem[]>;
  fetchProducts: (params?: {
    businessId?: string;
    branchId?: string;
    page?: number;
    rpp?: number;
    serviceTypes?: string;
    productTypeIds?: string;
    keyword?: string;
    sort?: string;
    minPrice?: number;
    maxPrice?: number;
  }) => Promise<ProductItem[] & { pagination?: { page: number; pages: number; records: number } }>;
  setSessionManually: (session: {
    user: UserContextType;
    consumerToken?: string;
    districtBankerToken?: string;
    partnerProfile?: PartnerUserProfile;
    businesses?: PartnerBusinessItem[];
    selectedBusiness?: PartnerBusinessItem;
  }) => void;
}

const STORAGE_KEYS = {
  CONSUMER_TOKEN: 'romluos_consumer_token',
  DISTRICT_BANKER_TOKEN: 'romluos_district_banker_token',
  CONSUMER_DATA: 'romluos_consumer_session',
  DISTRICT_BANKER_DATA: 'romluos_district_banker_session',
  PARTNER_PROFILE: 'romluos_partner_profile',
  BUSINESSES: 'romluos_partner_businesses',
  SELECTED_BUSINESS: 'romluos_selected_business',
  SELECTED_BRANCH: 'romluos_selected_branch',
  ACTIVE_TOKEN: 'romluos_auth_token',
  ACTIVE_ROLE: 'romluos_active_role',
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: false,
  isAuthenticated: false,
  consumerToken: null,
  districtBankerToken: null,
  consumerData: null,
  districtBankerData: null,
  partnerProfile: null,
  businesses: [],
  selectedBusiness: null,
  hasConsumerAuth: false,
  hasDistrictBankerAuth: false,
  activeRole: Role.DISTRICT_BANKER,
  login: async () => ({ success: false, consumerOk: false, districtBankerOk: false }),
  logout: () => {},
  switchRole: () => {},
  switchCompany: async () => {},
  switchCompanyAndBranch: async () => {},
  switchBranch: () => {},
  fetchUserProfile: async () => null,
  fetchBusinesses: async () => [],
  fetchCategories: async () => [],
  fetchBranches: async () => [],
  fetchProducts: async () => [],
  setSessionManually: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserContextType | null>(null);
  const [consumerToken, setConsumerToken] = useState<string | null>(null);
  const [districtBankerToken, setDistrictBankerToken] = useState<string | null>(null);
  const [consumerData, setConsumerData] = useState<any | null>(null);
  const [districtBankerData, setDistrictBankerData] = useState<any | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<PartnerUserProfile | null>(null);
  const [businesses, setBusinesses] = useState<PartnerBusinessItem[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<PartnerBusinessItem | null>(null);
  const [activeRole, setActiveRole] = useState<Role>(Role.DISTRICT_BANKER);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUserProfile = useCallback(
    async (tokenOverride?: string): Promise<PartnerUserProfile | null> => {
      const token = tokenOverride || districtBankerToken || consumerToken;
      console.log('[fetchUserProfile] Starting profile fetch with token:', token ? `${token.substring(0, 15)}...` : 'NULL');
      if (!token) {
        console.warn('[fetchUserProfile] No token found in state or parameters.');
        return null;
      }

      try {
        const json = await httpRequest.get<any>('/api/user/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (json && json.body) {
          setPartnerProfile(json.body);
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.PARTNER_PROFILE, JSON.stringify(json.body));
          }

          if (json.normalized) {
            setUser((prev) => {
              const updated: UserContextType = {
                id: json.normalized.id || prev?.id || `usr_${Date.now()}`,
                phone: json.normalized.phone || prev?.phone || '',
                email: json.normalized.email || prev?.email || '',
                firstName: json.normalized.firstName || prev?.firstName || '',
                lastName: json.normalized.lastName || prev?.lastName || '',
                role: prev?.role || Role.DISTRICT_BANKER,
                companyId: prev?.companyId || json.normalized.companyId,
                companyName: prev?.companyName || json.normalized.companyName,
                branchId: prev?.branchId || json.normalized.branchId,
                branchName: prev?.branchName || json.normalized.branchName,
              };
              return updated;
            });
          }
          return json.body;
        }
      } catch (err) {
        console.error('Failed to fetch partner profile:', err);
      }
      return null;
    },
    [districtBankerToken, consumerToken]
  );

  const fetchBusinesses = useCallback(
    async (tokenOverride?: string): Promise<PartnerBusinessItem[]> => {
      let token = tokenOverride || districtBankerToken;

      if (!token && typeof window !== 'undefined') {
        const rawBankerSession = localStorage.getItem(STORAGE_KEYS.DISTRICT_BANKER_DATA);
        if (rawBankerSession) {
          try {
            const parsed = JSON.parse(rawBankerSession);
            token =
              parsed?.access_token ||
              parsed?.data?.access_token ||
              parsed?.token ||
              parsed?.body?.access_token;
          } catch {
            if (rawBankerSession.startsWith('eyJ')) token = rawBankerSession;
          }
        }
        if (!token) {
          token =
            localStorage.getItem(STORAGE_KEYS.DISTRICT_BANKER_TOKEN) ||
            localStorage.getItem(STORAGE_KEYS.ACTIVE_TOKEN);
        }
      }

      if (!token) {
        console.warn('[fetchBusinesses] No district banker token available to fetch businesses');
        return [];
      }

      try {
        console.log('[fetchBusinesses] Fetching businesses with banker token...');
        const json = await httpRequest.get<any>('/api/partner/businesses', {
          headers: {
            Authorization: `Bearer ${token.trim()}`,
          },
        });

        const list: PartnerBusinessItem[] = Array.isArray(json?.body)
          ? json.body
          : Array.isArray(json?.data)
          ? json.data
          : [];

        setBusinesses(list);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.BUSINESSES, JSON.stringify(list));
        }

        // Set or reconcile currently selected business
        if (list.length > 0) {
          setSelectedBusiness((prev) => {
            if (prev && list.some((b) => String(b.id) === String(prev.id))) {
              const updated = list.find((b) => String(b.id) === String(prev.id)) || prev;
              if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEYS.SELECTED_BUSINESS, JSON.stringify(updated));
              }
              return updated;
            }
            const matching = list.find((b) => String(b.id) === String(user?.companyId));
            const initial = matching || list[0];
            if (typeof window !== 'undefined') {
              localStorage.setItem(STORAGE_KEYS.SELECTED_BUSINESS, JSON.stringify(initial));
            }
            return initial;
          });
        }

        return list;
      } catch (err) {
        console.warn('Error fetching businesses:', err);
        return [];
      }
    },
    [districtBankerToken, user?.companyId]
  );

  const fetchBranches = useCallback(
    async (companyId: string): Promise<BranchItem[]> => {
      if (!companyId || companyId === 'undefined') {
        console.error('Failed to fetch branches: companyId is required');
        return [];
      }

      let activeToken = districtBankerToken;

      if (!activeToken && typeof window !== 'undefined') {
        const rawBankerSession = localStorage.getItem(STORAGE_KEYS.DISTRICT_BANKER_DATA);
        if (rawBankerSession) {
          try {
            const parsed = JSON.parse(rawBankerSession);
            activeToken =
              parsed?.access_token ||
              parsed?.data?.access_token ||
              parsed?.token ||
              parsed?.body?.access_token;
          } catch {
            if (rawBankerSession.startsWith('eyJ')) activeToken = rawBankerSession;
          }
        }
        if (!activeToken) {
          activeToken =
            localStorage.getItem(STORAGE_KEYS.DISTRICT_BANKER_TOKEN) ||
            localStorage.getItem(STORAGE_KEYS.ACTIVE_TOKEN) ||
            consumerToken;
        }
      }

      try {
        const headers: Record<string, string> = {};
        if (activeToken) {
          headers['Authorization'] = `Bearer ${activeToken.trim()}`;
        }
        const data = await api.get<any>(`/api/company/${companyId}/branches`, { headers, cacheTtlMs: 120000 });
        return data.branches || data.body?.items || [];
      } catch (err) {
        console.warn('Failed to fetch branches:', err);
        return [];
      }
    },
    [districtBankerToken, consumerToken]
  );

  const fetchCategories = useCallback(
    async (businessIdOverride?: string): Promise<CategoryItem[]> => {
      let activeConsumerToken = consumerToken;

      if (!activeConsumerToken && typeof window !== 'undefined') {
        const rawConsumerSession = localStorage.getItem(STORAGE_KEYS.CONSUMER_DATA);
        if (rawConsumerSession) {
          try {
            const parsed = JSON.parse(rawConsumerSession);
            activeConsumerToken =
              parsed?.access_token ||
              parsed?.body?.access_token ||
              parsed?.data?.access_token ||
              parsed?.token ||
              parsed?.accessToken ||
              (typeof parsed === 'string' ? parsed : null);
          } catch {
            if (rawConsumerSession.startsWith('eyJ') || typeof rawConsumerSession === 'string') {
              activeConsumerToken = rawConsumerSession;
            }
          }
        }

        if (!activeConsumerToken) {
          activeConsumerToken = localStorage.getItem(STORAGE_KEYS.CONSUMER_TOKEN);
        }
      }

      const businessId =
        businessIdOverride ||
        selectedBusiness?.id ||
        user?.companyId ||
        partnerProfile?.default_company?.id;

      if (!businessId || businessId === 'undefined') {
        console.error('Failed to fetch categories: companyId / businessId is required');
        return [];
      }

      try {
        const headers: Record<string, string> = {};
        if (activeConsumerToken) {
          headers['Authorization'] = `Bearer ${activeConsumerToken}`;
        }

        let url = `/api/categories?business_id=${businessId}&service_type=ST_SHOPPING&rpp=1000`;

        const data = await api.get<any>(url, { headers, cacheTtlMs: 120000 });
        return data.categories || [];
      } catch (err) {
        console.warn('Failed to fetch consumer categories:', err);
        return [];
      }
    },
    [consumerToken, selectedBusiness, user, partnerProfile]
  );

  const fetchProducts = useCallback(
    async (params?: {
      businessId?: string;
      branchId?: string;
      page?: number;
      rpp?: number;
      serviceTypes?: string;
      productTypeIds?: string;
      keyword?: string;
      sort?: string;
      minPrice?: number;
      maxPrice?: number;
    }): Promise<ProductItem[] & { pagination?: { page: number; pages: number; records: number } }> => {
      let activeConsumerToken = consumerToken;

      if (!activeConsumerToken && typeof window !== 'undefined') {
        const rawConsumerSession = localStorage.getItem(STORAGE_KEYS.CONSUMER_DATA);
        if (rawConsumerSession) {
          try {
            const parsed = JSON.parse(rawConsumerSession);
            activeConsumerToken =
              parsed?.access_token ||
              parsed?.body?.access_token ||
              parsed?.data?.access_token ||
              parsed?.token ||
              parsed?.accessToken ||
              (typeof parsed === 'string' ? parsed : null);
          } catch {
            if (rawConsumerSession.startsWith('eyJ') || typeof rawConsumerSession === 'string') {
              activeConsumerToken = rawConsumerSession;
            }
          }
        }

        if (!activeConsumerToken) {
          activeConsumerToken = localStorage.getItem(STORAGE_KEYS.CONSUMER_TOKEN);
        }
      }

      const businessId =
        params?.businessId ||
        selectedBusiness?.id ||
        user?.companyId ||
        partnerProfile?.default_company?.id;

      const branchId =
        params?.branchId ||
        user?.branchId ||
        partnerProfile?.default_company?.default_branch?.id;

      if (!businessId || businessId === 'undefined') {
        console.error('Failed to fetch products: businessId / companyId is required');
        const emptyList: any = [];
        emptyList.pagination = { page: 1, pages: 1, records: 0 };
        return emptyList;
      }

      const page = params?.page || 1;
      const rpp = params?.rpp || 36;
      const serviceTypes = params?.serviceTypes || 'ST_SHOPPING';
      const productTypeIds = params?.productTypeIds;
      const keyword = params?.keyword;
      const sort = params?.sort;

      try {
        const headers: Record<string, string> = {};
        if (activeConsumerToken) {
          headers['Authorization'] = `Bearer ${activeConsumerToken}`;
        }

        let url = `/api/products?page=${page}&rpp=${rpp}&service_types=${serviceTypes}&business_ids=${businessId}`;
        if (branchId && branchId !== 'undefined') {
          url += `&branch_ids=${branchId}`;
        }
        if (productTypeIds && productTypeIds !== 'ALL') {
          url += `&product_type_ids=${encodeURIComponent(productTypeIds)}`;
        }
        if (keyword && keyword.trim()) {
          url += `&search=${encodeURIComponent(keyword.trim())}&keyword=${encodeURIComponent(keyword.trim())}`;
        }
        if (sort) {
          url += `&sort=${encodeURIComponent(sort)}`;
        }
        if (params?.minPrice !== undefined && params?.minPrice !== null) {
          url += `&min_price=${encodeURIComponent(String(params.minPrice))}`;
        }
        if (params?.maxPrice !== undefined && params?.maxPrice !== null) {
          url += `&max_price=${encodeURIComponent(String(params.maxPrice))}`;
        }

        const data = await api.get<any>(url, { headers, cacheTtlMs: 30000 });
        const list: any = data.products || [];
        list.pagination = data.pagination || {
          page: Number(page),
          pages: Math.max(1, Math.ceil((list.length || 0) / rpp)),
          records: list.length || 0,
        };
        return list;
      } catch (err) {
        console.warn('Failed to fetch consumer products:', err);
        const emptyList: any = [];
        emptyList.pagination = { page: Number(page), pages: 1, records: 0 };
        return emptyList;
      }
    },
    [consumerToken, selectedBusiness, user, partnerProfile]
  );

  // Switch active company / business
  const switchCompany = useCallback(
    async (businessOrId: PartnerBusinessItem | { id: string; name?: string; logo?: any }) => {
      const businessId = String(businessOrId.id);
      let fullBusiness: PartnerBusinessItem | undefined;

      if ('name_locales' in businessOrId && Array.isArray((businessOrId as any).name_locales)) {
        fullBusiness = businessOrId as PartnerBusinessItem;
      } else {
        fullBusiness = businesses.find((b) => String(b.id) === businessId);
      }

      const companyName =
        (fullBusiness?.name_locales && getPreferredLocaleName(fullBusiness.name_locales)) ||
        fullBusiness?.name ||
        businessOrId.name ||
        `Business ${businessId}`;

      if (fullBusiness) {
        setSelectedBusiness(fullBusiness);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.SELECTED_BUSINESS, JSON.stringify(fullBusiness));
        }
      }

      // Preload branches for the new company
      let branchesForCompany: BranchItem[] = [];
      try {
        branchesForCompany = await fetchBranches(businessId);
      } catch (err) {
        console.warn('Failed to load branches on company switch:', err);
      }

      const defaultBranch = branchesForCompany[0] || null;

      setUser((prev) => {
        const updated: UserContextType = {
          id: prev?.id || `usr_${Date.now()}`,
          phone: prev?.phone || '',
          email: prev?.email || '',
          firstName: prev?.firstName || '',
          lastName: prev?.lastName || '',
          role: prev?.role || Role.DISTRICT_BANKER,
          companyId: businessId,
          companyName: companyName,
          branchId: defaultBranch ? String(defaultBranch.id) : undefined,
          branchName: defaultBranch ? defaultBranch.name : undefined,
        };

        if (typeof window !== 'undefined') {
          if (defaultBranch) {
            localStorage.setItem(STORAGE_KEYS.SELECTED_BRANCH, JSON.stringify(defaultBranch));
          } else {
            localStorage.removeItem(STORAGE_KEYS.SELECTED_BRANCH);
          }
        }

        return updated;
      });
    },
    [businesses, fetchBranches]
  );

  // Atomically switch active company and its chosen branch
  const switchCompanyAndBranch = useCallback(
    async (
      businessOrId: PartnerBusinessItem | { id: string; name?: string; logo?: any; name_locales?: any[] },
      branch: BranchItem
    ) => {
      const businessId = String(businessOrId.id);
      let fullBusiness: PartnerBusinessItem | undefined;

      if ('name_locales' in businessOrId && Array.isArray((businessOrId as any).name_locales)) {
        fullBusiness = businessOrId as PartnerBusinessItem;
      } else {
        fullBusiness = businesses.find((b) => String(b.id) === businessId);
      }

      const companyName =
        (fullBusiness?.name_locales && getPreferredLocaleName(fullBusiness.name_locales)) ||
        fullBusiness?.name ||
        businessOrId.name ||
        `Business ${businessId}`;

      const branchId = String(branch.id);
      const branchName = branch.name || `Branch ${branchId}`;

      if (fullBusiness) {
        setSelectedBusiness(fullBusiness);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.SELECTED_BUSINESS, JSON.stringify(fullBusiness));
        }
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.SELECTED_BRANCH, JSON.stringify(branch));
      }

      setUser((prev) => {
        const updated: UserContextType = {
          id: prev?.id || `usr_${Date.now()}`,
          phone: prev?.phone || '',
          email: prev?.email || '',
          firstName: prev?.firstName || '',
          lastName: prev?.lastName || '',
          role: prev?.role || Role.DISTRICT_BANKER,
          companyId: businessId,
          companyName: companyName,
          branchId: branchId,
          branchName: branchName,
        };
        return updated;
      });
    },
    [businesses]
  );

  const switchBranch = useCallback((branch: BranchItem) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated: UserContextType = {
        ...prev,
        branchId: String(branch.id),
        branchName: branch.name,
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.SELECTED_BRANCH, JSON.stringify(branch));
      }
      return updated;
    });
  }, []);

  const switchRole = useCallback((role: Role) => {
    setActiveRole(role);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, role);
      if (role === Role.DISTRICT_BANKER && districtBankerToken) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_TOKEN, districtBankerToken);
      } else if (role === Role.CONSUMER && consumerToken) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_TOKEN, consumerToken);
      }
    }
  }, [districtBankerToken, consumerToken]);

  const logout = useCallback(() => {
    setUser(null);
    setConsumerToken(null);
    setDistrictBankerToken(null);
    setConsumerData(null);
    setDistrictBankerData(null);
    setPartnerProfile(null);
    setBusinesses([]);
    setSelectedBusiness(null);
    setActiveRole(Role.DISTRICT_BANKER);

    if (typeof window !== 'undefined') {
      Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
      sessionStorage.removeItem('romluos_branch_cart');
      sessionStorage.removeItem('romluos_active_draft_order');
      sessionStorage.removeItem('romluos_active_draft_order_id');
      localStorage.removeItem('romluos_branch_cart');
      localStorage.removeItem('romluos_active_draft_order');
      localStorage.removeItem('romluos_active_draft_order_id');
      window.dispatchEvent(new Event('cart:clear'));
    }
  }, []);

  // Initialize from LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('romluos_user_session');

        let savedConsumerToken = localStorage.getItem(STORAGE_KEYS.CONSUMER_TOKEN);
        const savedDistrictBankerToken = localStorage.getItem(STORAGE_KEYS.DISTRICT_BANKER_TOKEN);
        const savedConsumerData = localStorage.getItem(STORAGE_KEYS.CONSUMER_DATA);
        const savedDistrictBankerData = localStorage.getItem(STORAGE_KEYS.DISTRICT_BANKER_DATA);
        const savedProfile = localStorage.getItem(STORAGE_KEYS.PARTNER_PROFILE);
        const savedBusinesses = localStorage.getItem(STORAGE_KEYS.BUSINESSES);
        const savedSelectedBusiness = localStorage.getItem(STORAGE_KEYS.SELECTED_BUSINESS);
        const savedRole = localStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE) as Role | null;

        if (savedConsumerData) {
          try {
            const parsedConsumer = JSON.parse(savedConsumerData);
            setConsumerData(parsedConsumer);
            if (!savedConsumerToken) {
              savedConsumerToken =
                parsedConsumer?.access_token ||
                parsedConsumer?.body?.access_token ||
                parsedConsumer?.data?.access_token ||
                parsedConsumer?.token;
            }
          } catch {
            if (!savedConsumerToken && savedConsumerData.startsWith('eyJ')) {
              savedConsumerToken = savedConsumerData;
            }
          }
        }

        if (savedConsumerToken) setConsumerToken(savedConsumerToken);
        if (savedDistrictBankerToken) setDistrictBankerToken(savedDistrictBankerToken);
        if (savedDistrictBankerData) setDistrictBankerData(JSON.parse(savedDistrictBankerData));

        if (savedBusinesses) {
          try {
            const parsedBiz = JSON.parse(savedBusinesses);
            if (Array.isArray(parsedBiz)) setBusinesses(parsedBiz);
          } catch {}
        }

        if (savedSelectedBusiness) {
          try {
            const parsedSelected = JSON.parse(savedSelectedBusiness);
            setSelectedBusiness(parsedSelected);
          } catch {}
        }

        if (savedProfile) {
          try {
            const parsed = JSON.parse(savedProfile);
            setPartnerProfile(parsed);
            const cName = getPreferredLocaleName(parsed?.default_company?.locales);
            const bName = getPreferredLocaleName(parsed?.default_company?.default_branch?.locales);
            setUser({
              id: parsed?.id || 'usr_partner',
              phone: parsed?.phone_number || '',
              email: parsed?.email || '',
              firstName: parsed?.first_name || '',
              lastName: parsed?.last_name || '',
              role: savedDistrictBankerToken ? Role.DISTRICT_BANKER : Role.CONSUMER,
              companyId: parsed?.default_company?.id,
              companyName: cName,
              branchId: parsed?.default_company?.default_branch?.id,
              branchName: bName,
            });
          } catch {}
        } else if (savedDistrictBankerData || savedConsumerData || savedDistrictBankerToken || savedConsumerToken) {
          let parsedData: any = null;
          try {
            if (savedDistrictBankerData) parsedData = JSON.parse(savedDistrictBankerData);
            else if (savedConsumerData) parsedData = JSON.parse(savedConsumerData);
          } catch {}

          setUser({
            id: parsedData?.id || 'usr_active',
            phone: parsedData?.phone || parsedData?.phone_number || '',
            email: parsedData?.email || '',
            firstName: parsedData?.firstName || parsedData?.first_name || 'Partner',
            lastName: parsedData?.lastName || parsedData?.last_name || 'Banker',
            role: savedDistrictBankerToken ? Role.DISTRICT_BANKER : Role.CONSUMER,
            companyId: parsedData?.companyId || parsedData?.default_company?.id,
            companyName: parsedData?.companyName || parsedData?.default_company?.name,
            branchId: parsedData?.branchId || parsedData?.default_company?.default_branch?.id,
            branchName: parsedData?.branchName || parsedData?.default_company?.default_branch?.name,
          });
        }

        if (savedDistrictBankerToken) {
          fetchUserProfile(savedDistrictBankerToken).catch(() => null);
          fetchBusinesses(savedDistrictBankerToken).catch(() => null);
        }

        if (savedRole && Object.values(Role).includes(savedRole)) {
          setActiveRole(savedRole);
        } else if (savedDistrictBankerToken) {
          setActiveRole(Role.DISTRICT_BANKER);
        } else if (savedConsumerToken) {
          setActiveRole(Role.CONSUMER);
        }
      } catch (e) {
        console.warn('Failed to parse local auth session', e);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  const login = useCallback(
    async ({ phone, pin }: { phone: string; pin: string }): Promise<LoginResult> => {
      setLoading(true);
      try {
        let encryptedConsumerPin = '';
        let encryptedBankerPin = '';
        try {
          encryptedConsumerPin = rsaEncrypt({ value: pin, role: 'consumer' });
          encryptedBankerPin = rsaEncrypt({ value: pin, role: 'district_banker' });
        } catch (encErr) {
          console.warn('Client encryption note, falling back to server encryption:', encErr);
        }

        let json: any;
        try {
          json = await httpRequest.post<any>('/api/auth/login', {
            phone,
            pin,
            encryptedPin: encryptedBankerPin || encryptedConsumerPin || undefined,
          });
        } catch (err: any) {
          json = err.response?.data || { success: false, message: err.message };
        }

        if (!json || !json.success) {
          setLoading(false);
          return {
            success: false,
            consumerOk: !!json?.consumer?.success,
            districtBankerOk: !!json?.district_banker?.success,
            message: json?.message || 'Login failed. Please check your phone number and PIN.',
          };
        }

        const consumerPayload = json.consumer?.data || {};
        const bankerPayload = json.district_banker?.data || {};
        const profNormalized = json.profile || json.district_banker?.profileNormalized;
        const rawProfile = json.district_banker?.profile;

        const cToken =
          consumerPayload.access_token ||
          consumerPayload.data?.access_token ||
          consumerPayload.body?.access_token ||
          consumerPayload.token ||
          consumerPayload.data?.token ||
          consumerPayload.body?.token ||
          null;

        const bToken =
          bankerPayload.access_token ||
          bankerPayload.data?.access_token ||
          bankerPayload.body?.access_token ||
          bankerPayload.token ||
          bankerPayload.data?.token ||
          bankerPayload.body?.token ||
          null;

        console.log('[AuthContext] Extracted Tokens -> bankerToken:', bToken ? 'FOUND' : 'NONE', 'consumerToken:', cToken ? 'FOUND' : 'NONE');

        const bankerUser = bankerPayload.user || bankerPayload.data?.user || {};
        const consumerUser = consumerPayload.user || consumerPayload.data?.user || {};

        const parsedUser: UserContextType = {
          id: profNormalized?.id || bankerUser.id || consumerUser.id || `user_${Date.now()}`,
          phone: profNormalized?.phone || json.username || phone,
          email:
            profNormalized?.email ||
            bankerUser.email ||
            consumerUser.email ||
            '',
          firstName: profNormalized?.firstName || bankerUser.firstName || consumerUser.firstName || '',
          lastName: profNormalized?.lastName || bankerUser.lastName || consumerUser.lastName || '',
          role: bToken ? Role.DISTRICT_BANKER : Role.CONSUMER,
          companyId: profNormalized?.companyId || bankerUser.companyId,
          companyName: profNormalized?.companyName || bankerUser.companyName,
          branchId: profNormalized?.branchId || bankerUser.branchId,
          branchName: profNormalized?.branchName || bankerUser.branchName,
        };

        setUser(parsedUser);
        setConsumerToken(cToken);
        setDistrictBankerToken(bToken);
        setConsumerData(consumerPayload);
        setDistrictBankerData(bankerPayload);
        if (rawProfile) setPartnerProfile(rawProfile);

        const primaryRole = bToken ? Role.DISTRICT_BANKER : Role.CONSUMER;
        setActiveRole(primaryRole);

        if (typeof window !== 'undefined') {
          if (cToken) localStorage.setItem(STORAGE_KEYS.CONSUMER_TOKEN, cToken);
          if (bToken) localStorage.setItem(STORAGE_KEYS.DISTRICT_BANKER_TOKEN, bToken);
          if (consumerPayload)
            localStorage.setItem(STORAGE_KEYS.CONSUMER_DATA, JSON.stringify(consumerPayload));
          if (bankerPayload)
            localStorage.setItem(STORAGE_KEYS.DISTRICT_BANKER_DATA, JSON.stringify(bankerPayload));
          if (rawProfile)
            localStorage.setItem(STORAGE_KEYS.PARTNER_PROFILE, JSON.stringify(rawProfile));

          const activeTk = bToken || cToken || '';
          if (activeTk) localStorage.setItem(STORAGE_KEYS.ACTIVE_TOKEN, activeTk);
          localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, primaryRole);
        }

        // Fetch Live Profile & Live Business Company Listing
        let fetchedBusinesses: PartnerBusinessItem[] = [];
        if (bToken) {
          try {
            console.log('[AuthContext] Triggering fetchUserProfile & fetchBusinesses for banker session...');
            const [, bizList] = await Promise.all([
              fetchUserProfile(bToken).catch((err) => console.error('Failed to load profile on login:', err)),
              fetchBusinesses(bToken).catch((err) => {
                console.error('Failed to load businesses on login:', err);
                return [];
              }),
            ]);
            fetchedBusinesses = bizList || [];
          } catch (syncErr) {
            console.error('Failed during login synchronization:', syncErr);
          }
        } else if (cToken) {
          try {
            await fetchUserProfile(cToken);
          } catch (profileErr) {
            console.error('Failed to load profile on login:', profileErr);
          }
        }

        setLoading(false);
        return {
          success: true,
          consumerOk: !!json.consumer?.success,
          districtBankerOk: !!json.district_banker?.success,
          profile: profNormalized,
          businesses: fetchedBusinesses,
          message: 'Authentication successful',
        };
      } catch (err: any) {
        setLoading(false);
        return {
          success: false,
          consumerOk: false,
          districtBankerOk: false,
          message: err?.message || 'An unexpected error occurred during login',
        };
      }
    },
    [fetchUserProfile, fetchBusinesses]
  );

  const setSessionManually = useCallback(
    ({
      user: manualUser,
      consumerToken: manualCToken,
      districtBankerToken: manualBToken,
      partnerProfile: manualProfile,
      businesses: manualBusinesses,
      selectedBusiness: manualSelectedBusiness,
    }: {
      user: UserContextType;
      consumerToken?: string;
      districtBankerToken?: string;
      partnerProfile?: PartnerUserProfile;
      businesses?: PartnerBusinessItem[];
      selectedBusiness?: PartnerBusinessItem;
    }) => {
      setUser(manualUser);
      if (manualCToken) setConsumerToken(manualCToken);
      if (manualBToken) setDistrictBankerToken(manualBToken);
      if (manualProfile) setPartnerProfile(manualProfile);
      if (manualBusinesses) setBusinesses(manualBusinesses);
      if (manualSelectedBusiness) setSelectedBusiness(manualSelectedBusiness);

      if (typeof window !== 'undefined') {
        if (manualCToken) localStorage.setItem(STORAGE_KEYS.CONSUMER_TOKEN, manualCToken);
        if (manualBToken) localStorage.setItem(STORAGE_KEYS.DISTRICT_BANKER_TOKEN, manualBToken);
        if (manualProfile)
          localStorage.setItem(STORAGE_KEYS.PARTNER_PROFILE, JSON.stringify(manualProfile));
        if (manualBusinesses)
          localStorage.setItem(STORAGE_KEYS.BUSINESSES, JSON.stringify(manualBusinesses));
        if (manualSelectedBusiness)
          localStorage.setItem(STORAGE_KEYS.SELECTED_BUSINESS, JSON.stringify(manualSelectedBusiness));
        if (manualBToken || manualCToken) {
          localStorage.setItem(STORAGE_KEYS.ACTIVE_TOKEN, manualBToken || manualCToken || '');
        }
      }
    },
    []
  );

  const isAuthenticated = !!(user || consumerToken || districtBankerToken);
  const hasConsumerAuth = !!consumerToken;
  const hasDistrictBankerAuth = !!districtBankerToken;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        consumerToken,
        districtBankerToken,
        consumerData,
        districtBankerData,
        partnerProfile,
        businesses,
        selectedBusiness,
        hasConsumerAuth,
        hasDistrictBankerAuth,
        activeRole,
        login,
        logout,
        switchRole,
        switchCompany,
        switchCompanyAndBranch,
        switchBranch,
        fetchUserProfile,
        fetchBusinesses,
        fetchCategories,
        fetchBranches,
        fetchProducts,
        setSessionManually,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
