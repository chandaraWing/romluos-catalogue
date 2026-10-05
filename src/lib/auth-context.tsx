'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Role, PartnerUserProfile, BranchItem, CategoryItem, ProductItem } from '@/types';
import { rsaEncrypt } from '@/lib/cipher';
import { getPreferredLocaleName } from '@/lib/utils';
import { api } from '@/lib/api';

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
}

export interface LoginResult {
  success: boolean;
  consumerOk: boolean;
  districtBankerOk: boolean;
  message?: string;
  profile?: any;
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
  hasConsumerAuth: boolean;
  hasDistrictBankerAuth: boolean;
  activeRole: Role;
  login: (credentials: { phone: string; pin: string }) => Promise<LoginResult>;
  logout: () => void;
  switchRole: (role: Role) => void;
  switchBranch: (branch: BranchItem) => void;
  fetchUserProfile: (token?: string) => Promise<PartnerUserProfile | null>;
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
  }) => Promise<ProductItem[] & { pagination?: { page: number; pages: number; records: number } }>;
  setSessionManually: (session: {
    user: UserContextType;
    consumerToken?: string;
    districtBankerToken?: string;
    partnerProfile?: PartnerUserProfile;
  }) => void;
}

const STORAGE_KEYS = {
  CONSUMER_TOKEN: 'romlus_consumer_token',
  DISTRICT_BANKER_TOKEN: 'romlus_district_banker_token',
  CONSUMER_DATA: 'romlus_consumer_session',
  DISTRICT_BANKER_DATA: 'romlus_district_banker_session',
  PARTNER_PROFILE: 'romlus_partner_profile',
  ACTIVE_TOKEN: 'romlus_auth_token',
  ACTIVE_ROLE: 'romlus_active_role',
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
  hasConsumerAuth: false,
  hasDistrictBankerAuth: false,
  activeRole: Role.DISTRICT_BANKER,
  login: async () => ({ success: false, consumerOk: false, districtBankerOk: false }),
  logout: () => {},
  switchRole: () => {},
  switchBranch: () => {},
  fetchUserProfile: async () => null,
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
        const res = await fetch('/api/user/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('res===================', res);

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          console.error('Failed to fetch partner profile:', res.status, errData);
          return null;
        }

        const json = await res.json();

        console.log('jsonxxxxxxxxx', json)
        if (json.body) {
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
                companyId: json.normalized.companyId || prev?.companyId,
                companyName: json.normalized.companyName || prev?.companyName,
                branchId: json.normalized.branchId || prev?.branchId,
                branchName: json.normalized.branchName || prev?.branchName,
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
        partnerProfile?.default_company?.id ||
        user?.companyId;

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
        if (activeConsumerToken) {
          url += `&access_token=${encodeURIComponent(activeConsumerToken)}`;
        }

        const data = await api.get<any>(url, { headers, cacheTtlMs: 120000 });
        return data.categories || [];
      } catch (err) {
        console.warn('Failed to fetch consumer categories:', err);
        return [];
      }
    },
    [consumerToken, partnerProfile, user]
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
        partnerProfile?.default_company?.id ||
        user?.companyId;

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
          url += `&keyword=${encodeURIComponent(keyword.trim())}`;
        }
        if (sort) {
          url += `&sort=${encodeURIComponent(sort)}`;
        }
        if (activeConsumerToken) {
          url += `&access_token=${encodeURIComponent(activeConsumerToken)}`;
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
    [consumerToken, partnerProfile, user]
  );

  // Initialize from LocalStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      // Clear legacy backend session
      localStorage.removeItem('romlus_user_session');

      let savedConsumerToken = localStorage.getItem(STORAGE_KEYS.CONSUMER_TOKEN);
      const savedDistrictBankerToken = localStorage.getItem(STORAGE_KEYS.DISTRICT_BANKER_TOKEN);
      const savedConsumerData = localStorage.getItem(STORAGE_KEYS.CONSUMER_DATA);
      const savedDistrictBankerData = localStorage.getItem(STORAGE_KEYS.DISTRICT_BANKER_DATA);
      const savedProfile = localStorage.getItem(STORAGE_KEYS.PARTNER_PROFILE);
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
        } catch {
          // ignore error
        }
      } else if (savedDistrictBankerToken) {
        fetchUserProfile(savedDistrictBankerToken).catch(() => null);
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
  }, [fetchUserProfile]);

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

  const switchBranch = useCallback((branch: BranchItem) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated: UserContextType = {
        ...prev,
        branchId: String(branch.id),
        branchName: branch.name,
      };
      return updated;
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setConsumerToken(null);
    setDistrictBankerToken(null);
    setConsumerData(null);
    setDistrictBankerData(null);
    setPartnerProfile(null);
    setActiveRole(Role.DISTRICT_BANKER);

    if (typeof window !== 'undefined') {
      Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    }
  }, []);

  const login = useCallback(
    async ({ phone, pin }: { phone: string; pin: string }): Promise<LoginResult> => {
      setLoading(true);
      try {
        // Attempt client-side encryption of PIN using cipher helper
        let encryptedConsumerPin = '';
        let encryptedBankerPin = '';
        try {
          encryptedConsumerPin = rsaEncrypt({ value: pin, role: 'consumer' });
          encryptedBankerPin = rsaEncrypt({ value: pin, role: 'district_banker' });
        } catch (encErr) {
          console.warn('Client encryption note, falling back to server encryption:', encErr);
        }

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone,
            pin,
            encryptedPin: encryptedBankerPin || encryptedConsumerPin || undefined,
          }),
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
          setLoading(false);
          return {
            success: false,
            consumerOk: !!json.consumer?.success,
            districtBankerOk: !!json.district_banker?.success,
            message: json.message || 'Login failed. Please check your phone number and PIN.',
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

        console.log('[AuthContext] Login response payload:', json);
        console.log('[AuthContext] Extracted Tokens -> bankerToken:', bToken, 'consumerToken:', cToken);

        // Parse user identity info from fetched partner profile or fallback
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

        // Store tokens & sessions
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

        // Automatically fetch live profile when a token is available
        const activeToken = bToken || cToken;
        if (activeToken) {
          try {
            console.log('[AuthContext] Triggering fetchUserProfile with token:', activeToken.substring(0, 15) + '...');
            await fetchUserProfile(activeToken);
          } catch (profileErr) {
            console.error('Failed to load profile on login:', profileErr);
          }
        } else {
          console.warn('[AuthContext] Neither bankerToken nor consumerToken was found in login response.');
        }

        setLoading(false);
        return {
          success: true,
          consumerOk: !!json.consumer?.success,
          districtBankerOk: !!json.district_banker?.success,
          profile: profNormalized,
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
    [fetchUserProfile]
  );

  const setSessionManually = useCallback(
    ({
      user: manualUser,
      consumerToken: manualCToken,
      districtBankerToken: manualBToken,
      partnerProfile: manualProfile,
    }: {
      user: UserContextType;
      consumerToken?: string;
      districtBankerToken?: string;
      partnerProfile?: PartnerUserProfile;
    }) => {
      setUser(manualUser);
      if (manualCToken) setConsumerToken(manualCToken);
      if (manualBToken) setDistrictBankerToken(manualBToken);
      if (manualProfile) setPartnerProfile(manualProfile);

      if (typeof window !== 'undefined') {
        if (manualCToken) localStorage.setItem(STORAGE_KEYS.CONSUMER_TOKEN, manualCToken);
        if (manualBToken) localStorage.setItem(STORAGE_KEYS.DISTRICT_BANKER_TOKEN, manualBToken);
        if (manualProfile)
          localStorage.setItem(STORAGE_KEYS.PARTNER_PROFILE, JSON.stringify(manualProfile));
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
        hasConsumerAuth,
        hasDistrictBankerAuth,
        activeRole,
        login,
        logout,
        switchRole,
        switchBranch,
        fetchUserProfile,
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
