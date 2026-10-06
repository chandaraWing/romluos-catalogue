'use client';

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Filter, Package, RotateCcw, X } from 'lucide-react';
import { toast } from 'sonner';
import { BankerProductCard, BankerProductConfigModal } from '@/components/banker';
import {
  BankerFinancingModal,
  BrandFilter,
  BrandFilterItem,
  CartSlideOverDrawer,
  CatalogFooter,
  CatalogHeader,
  CatalogHero,
  CategoryFilter,
  CategoryPills,
  PriceFilter,
  ProductQuickViewModal,
} from '@/components/catalog';
import { Button, buttonVariants } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { formatCurrency, formatImageUrl, getPreferredLocaleName } from '@/lib/utils';
import { BrandItem, CategoryItem, ProductItem, Role, Status } from '@/types';

export function BankerCatalogContent({ hash }: { hash?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items: cartItems, addItem, totalItems, totalAmount } = useCart();
  const { user, consumerToken, partnerProfile, fetchCategories, fetchProducts } = useAuth();

  // Core Data States
  const [catalogData, setCatalogData] = useState<any>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('search') || '');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>(searchParams.get('search') || '');

  // 800ms debounce for product search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 800);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync debounced search query to URL search params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        if (debouncedSearchQuery.trim()) {
          url.searchParams.set('search', debouncedSearchQuery.trim());
        } else {
          url.searchParams.delete('search');
        }
        window.history.replaceState(null, '', url.toString());
      } catch {}
    }
  }, [debouncedSearchQuery]);

  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get('product_type_ids') || searchParams.get('category') || 'ALL'
  );
  const [selectedBrand, setSelectedBrand] = useState<string>(searchParams.get('brand') || 'ALL');

  const initialMinPrice = searchParams.get('min_price') || searchParams.get('minPrice');
  const initialMaxPrice = searchParams.get('max_price') || searchParams.get('maxPrice');
  const parsedMin = initialMinPrice && !isNaN(Number(initialMinPrice)) ? Number(initialMinPrice) : 0;
  const parsedMax = initialMaxPrice && !isNaN(Number(initialMaxPrice)) ? Number(initialMaxPrice) : 3500;

  const [priceRange, setPriceRange] = useState<[number, number]>([parsedMin, parsedMax]);
  const [debouncedPriceRange, setDebouncedPriceRange] = useState<[number, number]>([parsedMin, parsedMax]);
  const [maxPriceLimit, setMaxPriceLimit] = useState<number>(3500);

  // 500ms debounce for price range updates
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPriceRange(priceRange);
    }, 500);
    return () => clearTimeout(timer);
  }, [priceRange]);

  // Sync debounced price range to URL search params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        if (debouncedPriceRange[0] > 0) {
          url.searchParams.set('min_price', String(debouncedPriceRange[0]));
        } else {
          url.searchParams.delete('min_price');
        }
        if (debouncedPriceRange[1] < maxPriceLimit) {
          url.searchParams.set('max_price', String(debouncedPriceRange[1]));
        } else {
          url.searchParams.delete('max_price');
        }
        window.history.replaceState(null, '', url.toString());
      } catch {}
    }
  }, [debouncedPriceRange, maxPriceLimit]);

  const [activeFilterTag, setActiveFilterTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sort') || '');

  // Pagination & API Fetching States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
  const [paginationInfo, setPaginationInfo] = useState<{ page: number; pages: number; records: number }>({
    page: 1,
    pages: 1,
    records: 0,
  });
  const itemsPerPage = 36;

  // Modals & Drawers
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState<boolean>(false);
  const [quickViewProduct, setQuickViewProduct] = useState<ProductItem | null>(null);
  const [configModalProduct, setConfigModalProduct] = useState<ProductItem | null>(null);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const [isFinancingModalOpen, setIsFinancingModalOpen] = useState<boolean>(false);
  const [checkoutBranchId, setCheckoutBranchId] = useState<string | null>(null);
  const [checkoutItemIds, setCheckoutItemIds] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const isInitialMount = useRef(true);

  const defaultProfileBranch = useMemo(() => {
    if (user?.branchId && user?.branchName) {
      return {
        id: user.branchId,
        name: user.branchName,
        code: `BR-${user.branchId}`,
        companyId: user.companyId || '',
      };
    }
    return null;
  }, [user?.branchId, user?.branchName, user?.companyId]);

  const currentBranch = selectedBranch || defaultProfileBranch || catalogData?.branch;

  const checkoutItems = useMemo(() => {
    if (!checkoutBranchId) return cartItems;
    let branchItems = cartItems.filter((i) => i.branchId === checkoutBranchId);
    if (checkoutItemIds.length > 0) {
      branchItems = branchItems.filter((i) => checkoutItemIds.includes(i.id || i.productId));
    }
    return branchItems;
  }, [cartItems, checkoutBranchId, checkoutItemIds]);

  const checkoutAmount = checkoutItems.reduce((acc, item) => acc + Number(item.unitPrice) * item.quantity, 0);
  const checkoutItemsCount = checkoutItems.reduce((acc, item) => acc + item.quantity, 0);

  // Function to load a specific page of products directly from API
  const loadProductsPage = useCallback(
    async (pageToFetch: number) => {
      const companyId = partnerProfile?.default_company?.id || user?.companyId;
      const branchId = selectedBranch?.id || user?.branchId || partnerProfile?.default_company?.default_branch?.id;

      if (!companyId) return;

      let resolvedProductTypeId: string | undefined = undefined;
      if (selectedCategory && selectedCategory !== 'ALL') {
        const foundCat = categories.find(
          (c) =>
            String(c.id).toLowerCase() === selectedCategory.toLowerCase() ||
            (c.code && c.code.toLowerCase() === selectedCategory.toLowerCase()) ||
            (c.name && c.name.toLowerCase() === selectedCategory.toLowerCase())
        );
        resolvedProductTypeId = foundCat ? String(foundCat.id) : selectedCategory;
      }

      setLoadingProducts(true);
      try {
        const res = await fetchProducts({
          businessId: companyId,
          branchId: branchId,
          page: pageToFetch,
          rpp: itemsPerPage,
          productTypeIds: resolvedProductTypeId,
          keyword: debouncedSearchQuery.trim() || undefined,
          sort: sortBy || undefined,
          minPrice: debouncedPriceRange[0] > 0 ? debouncedPriceRange[0] : undefined,
          maxPrice: debouncedPriceRange[1] < maxPriceLimit ? debouncedPriceRange[1] : undefined,
        });

        if (res && res.length > 0) {
          setProducts(res);
          const maxP = Math.max(
            ...res.map((p: any) => Number(p.currentPrice || p.basePrice || 0))
          );
          const roundedMax = Math.ceil((maxP || 1000) / 100) * 100;
          if (roundedMax > maxPriceLimit) {
            setMaxPriceLimit(roundedMax);
          }
        } else {
          setProducts([]);
        }

        if (res.pagination) {
          setPaginationInfo(res.pagination);
        } else {
          setPaginationInfo({
            page: pageToFetch,
            pages: Math.max(1, Math.ceil((res.length || 0) / itemsPerPage)),
            records: res.length || 0,
          });
        }
      } catch (err) {
        console.warn('Failed to load products page from API:', err);
      } finally {
        setLoadingProducts(false);
      }
    },
    [
      partnerProfile?.default_company?.id,
      partnerProfile?.default_company?.default_branch?.id,
      user?.companyId,
      user?.branchId,
      selectedBranch?.id,
      selectedCategory,
      categories,
      debouncedSearchQuery,
      sortBy,
      debouncedPriceRange,
      maxPriceLimit,
      fetchProducts,
      itemsPerPage,
    ]
  );

  // 1. Unified initial load: Parallelize catalog and categories on mount
  useEffect(() => {
    let isMounted = true;
    async function initCatalogData() {
      try {
        setLoading(true);
        setError(null);

        const companyId = partnerProfile?.default_company?.id || user?.companyId;
        const branchId = user?.branchId || partnerProfile?.default_company?.default_branch?.id;

        // Fire initial requests concurrently
        const [catalogRes, catList, prodList] = await Promise.all([
          hash ? api.get<any>(`/api/banker-links/public/${hash}`, { cacheTtlMs: 60000 }).catch(() => null) : Promise.resolve(null),
          companyId ? fetchCategories(companyId).catch(() => []) : Promise.resolve([]),
          companyId
            ? fetchProducts({
                businessId: companyId,
                branchId,
                page: 1,
                rpp: itemsPerPage,
                keyword: searchQuery.trim() || undefined,
                sort: sortBy || undefined,
              }).catch(() => [] as any)
            : Promise.resolve([] as any),
        ]);

        if (!isMounted) return;

        if (catList && catList.length > 0) {
          setCategories(catList);
        }

        if (prodList && prodList.length > 0) {
          setProducts(prodList);
          const maxP = Math.max(
            ...prodList.map((p: any) => Number(p.currentPrice || p.basePrice || 0))
          );
          const roundedMax = Math.ceil((maxP || 1000) / 100) * 100;
          setMaxPriceLimit(roundedMax > 500 ? roundedMax : 3500);
          setPriceRange([0, roundedMax > 500 ? roundedMax : 3500]);
          if (prodList.pagination) {
            setPaginationInfo(prodList.pagination);
          }
        }

        if (catalogRes && catalogRes.result !== false && (catalogRes.products || catalogRes.categories)) {
          setCatalogData(catalogRes);
          if ((!prodList || prodList.length === 0) && catalogRes.products?.length > 0) {
            setProducts(catalogRes.products);
          }
          if ((!catList || catList.length === 0) && catalogRes.categories?.length > 0) {
            setCategories(catalogRes.categories);
          }
          if (catalogRes.brands?.length > 0) {
            setBrands(catalogRes.brands);
          }
        } else if (user) {
          const resolvedCompany = {
            id: user?.companyId || partnerProfile?.default_company?.id || '',
            name: user?.companyName || 'Partner Store',
            code: 'PS',
            status: Status.ACTIVE,
          };
          const resolvedBranch = {
            id: user?.branchId || partnerProfile?.default_company?.default_branch?.id || '',
            companyId: resolvedCompany.id,
            name: user?.branchName || 'Partner Branch',
            code: `BR-${user?.branchId || '01'}`,
            status: Status.ACTIVE,
          };
          const resolvedBanker = {
            id: user?.id || 'banker-partner-01',
            fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Partner Banker',
            email: user?.email || '',
            phone: user?.phone || '',
            role: Role.DISTRICT_BANKER,
            companyId: resolvedCompany.id,
            companyName: resolvedCompany.name,
            branchId: resolvedBranch.id,
            branchName: resolvedBranch.name,
          };

          setCatalogData({
            link: {
              id: hash || 'DEMO',
              hash: hash || 'DEMO',
              clickCount: 1,
              createdAt: new Date().toISOString(),
            },
            banker: resolvedBanker,
            branch: resolvedBranch,
            company: resolvedCompany,
            products: prodList || [],
            categories: catList || [],
            brands: [],
          });
        }
      } catch (err: any) {
        console.warn('Error loading catalog:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initCatalogData();
    return () => {
      isMounted = false;
    };
  }, [
    hash,
    user?.companyId,
    user?.branchId,
    partnerProfile?.default_company?.id,
    partnerProfile?.default_company?.default_branch?.id,
    itemsPerPage,
  ]);

  // 2. Fetch page whenever currentPage, selectedCategory, sortBy, debouncedSearchQuery, or debouncedPriceRange changes
  useEffect(() => {
    if (loading) return;
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    loadProductsPage(currentPage);
  }, [
    currentPage,
    selectedCategory,
    sortBy,
    debouncedSearchQuery,
    debouncedPriceRange,
    selectedBranch?.id,
    loadProductsPage,
    loading,
  ]);

  // Dynamic Brand Aggregation
  const companyBrands = useMemo<BrandFilterItem[]>(() => {
    const brandMap = new Map<string, { name: string; count: number; logoUrl?: string }>();
    products.forEach((p) => {
      const bName = p.brand || p.brandRel?.name;
      if (!bName) return;
      const existing = brandMap.get(bName.toLowerCase());
      if (existing) {
        existing.count += 1;
      } else {
        brandMap.set(bName.toLowerCase(), {
          name: bName,
          count: 1,
          logoUrl: p.brandRel?.logoUrl || undefined,
        });
      }
    });
    return Array.from(brandMap.values()).sort((a, b) => b.count - a.count);
  }, [products]);

  // Category product counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      const code = p.category?.toUpperCase() || 'OTHER';
      counts[code] = (counts[code] || 0) + 1;
      if (p.categoryId) counts[String(p.categoryId)] = (counts[String(p.categoryId)] || 0) + 1;
      if (p.categoryRel?.name) counts[p.categoryRel.name] = (counts[p.categoryRel.name] || 0) + 1;
      if (p.categoryRel?.code) counts[p.categoryRel.code.toUpperCase()] = (counts[p.categoryRel.code.toUpperCase()] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        if (debouncedSearchQuery.trim()) {
          const q = debouncedSearchQuery.toLowerCase();
          const matchName = product.name.toLowerCase().includes(q);
          const matchSku = product.sku?.toLowerCase().includes(q);
          const matchBrand = (product.brand || product.brandRel?.name || '').toLowerCase().includes(q);
          if (!matchName && !matchSku && !matchBrand) return false;
        }

        if (selectedCategory !== 'ALL') {
          const s = selectedCategory.trim().toLowerCase();
          const matchId = product.categoryId && String(product.categoryId).toLowerCase() === s;
          const matchCode = product.categoryRel?.code && product.categoryRel.code.toLowerCase() === s;
          const matchName = product.category && product.category.toLowerCase() === s;
          const matchRelName = product.categoryRel?.name && product.categoryRel.name.toLowerCase() === s;
          const foundCat = categories.find(
            (c) =>
              String(c.id).toLowerCase() === s ||
              (c.code && c.code.toLowerCase() === s) ||
              (c.name && c.name.toLowerCase() === s)
          );
          const matchFoundId = foundCat && product.categoryId && String(product.categoryId) === String(foundCat.id);
          if (!matchId && !matchCode && !matchName && !matchRelName && !matchFoundId) return false;
        }

        if (selectedBrand !== 'ALL') {
          const pBrand = (product.brand || product.brandRel?.name || '').toLowerCase();
          if (pBrand !== selectedBrand.toLowerCase()) return false;
        }

        const price = Number(product.promotionalPrice || product.currentPrice || product.basePrice || 0);
        if (price < priceRange[0] || price > priceRange[1]) return false;

        if (activeFilterTag === 'discount' && !product.promotionalPrice) return false;
        if (activeFilterTag === 'instock' && ((product as any).inventoryCount ?? 1) <= 0) return false;

        return true;
      })
      .sort((a, b) => {
        const pA = Number(a.promotionalPrice || a.currentPrice || a.basePrice || 0);
        const pB = Number(b.promotionalPrice || b.currentPrice || b.basePrice || 0);
        const origA = Number(a.basePrice || a.unitPrice || pA);
        const origB = Number(b.basePrice || b.unitPrice || pB);

        if (sortBy === 'BIGGEST_DISCOUNT') {
          const discountDiffA = origA > pA ? (origA - pA) / (origA || 1) : 0;
          const discountDiffB = origB > pB ? (origB - pB) / (origB || 1) : 0;
          if (discountDiffB !== discountDiffA) {
            return discountDiffB - discountDiffA;
          }
          return pA - pB;
        }

        if (sortBy === 'NEWEST_DEALS') {
          const hasPromoA = !!a.promotionalPrice ? 1 : 0;
          const hasPromoB = !!b.promotionalPrice ? 1 : 0;
          if (hasPromoA !== hasPromoB) {
            return hasPromoB - hasPromoA;
          }
          return Number(b.id || 0) - Number(a.id || 0);
        }

        if (sortBy === 'NEWEST_ARRIVAL') {
          if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return Number(b.id || 0) - Number(a.id || 0);
        }

        if (sortBy === 'MOST_POPULAR') {
          return Number(b.totalAvailable || 0) - Number(a.totalAvailable || 0);
        }

        if (sortBy === 'price-low') return pA - pB;
        if (sortBy === 'price-high') return pB - pA;
        return 0;
      });
  }, [products, categories, debouncedSearchQuery, selectedCategory, selectedBrand, priceRange, activeFilterTag, sortBy]);

  const totalPages = Math.max(
    1,
    paginationInfo.pages || Math.ceil((paginationInfo.records || filteredProducts.length) / itemsPerPage)
  );
  const paginatedProducts = filteredProducts;

  const getCartCount = (productId: string) => {
    return cartItems
      .filter((item) => item.productId === productId || item.id === productId || item.id?.startsWith(`${productId}_`))
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleAddToCart = (
    product: ProductItem,
    selectedOptions?: Record<string, { label: string; additionalPrice: number }>,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    let optionsSum = 0;
    const formattedOptions: { groupName: string; choiceLabel: string; additionalPrice: number }[] = [];

    if (selectedOptions) {
      Object.entries(selectedOptions).forEach(([groupName, opt]) => {
        optionsSum += Number(opt.additionalPrice) || 0;
        formattedOptions.push({
          groupName,
          choiceLabel: opt.label,
          additionalPrice: Number(opt.additionalPrice) || 0,
        });
      });
    }

    const base = Number(
      product.promotionalPrice !== undefined
        ? product.promotionalPrice
        : product.currentPrice || product.unitPrice || product.basePrice || 0
    );
    const price = base + optionsSum;

    const optionsKey =
      formattedOptions.length > 0
        ? formattedOptions.map((o) => `${o.groupName}:${o.choiceLabel}`).sort().join('|')
        : product.variantId
        ? `var_${product.variantId}`
        : '';
    const uniqueCartId = optionsKey ? `${product.id}_${optionsKey}` : product.id;

    addItem({
      id: uniqueCartId,
      productId: product.id,
      variantId: product.variantId,
      sku: product.sku || '',
      name: product.name,
      brand: product.brand || product.brandRel?.name || '',
      model: product.model || product.name,
      category: product.category || 'OTHER',
      unitPrice: price,
      basePrice: Number(product.basePrice || price),
      image: product.image || product.images?.[0] || '',
      quantity: 1,
      availableStock: product.availableStock ?? product.totalAvailable ?? 10,
      branchId: String(product.branchId || currentBranch?.id || catalogData?.branch?.id || 'branch-cc01'),
      branchName: product.branchName || currentBranch?.name || catalogData?.branch?.name || 'Showroom',
      selectedOptions: formattedOptions.length > 0 ? formattedOptions : undefined,
      specifications: product.specifications,
    });

    setRecentlyAddedId(product.id);
    setTimeout(() => setRecentlyAddedId(null), 1800);

    const optionsText =
      formattedOptions.length > 0
        ? ` (${formattedOptions.map((o) => `${o.groupName}: ${o.choiceLabel}`).join(', ')})`
        : '';
    toast.success(`Added ${product.name}${optionsText} to cart!`);
  };

  const handleBuyNow = (product: ProductItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    handleAddToCart(product);
    setCartDrawerOpen(true);
  };

  const isAnyFilterActive = useMemo(() => {
    return (
      debouncedSearchQuery.trim() !== '' ||
      selectedCategory !== 'ALL' ||
      selectedBrand !== 'ALL' ||
      priceRange[0] > 0 ||
      priceRange[1] < maxPriceLimit ||
      activeFilterTag !== 'all'
    );
  }, [debouncedSearchQuery, selectedCategory, selectedBrand, priceRange, maxPriceLimit, activeFilterTag]);

  const handleResetPrice = () => {
    setPriceRange([0, maxPriceLimit]);
    setDebouncedPriceRange([0, maxPriceLimit]);
    setCurrentPage(1);
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('min_price');
        url.searchParams.delete('max_price');
        window.history.replaceState(null, '', url.toString());
      } catch {}
    }
  };

  const handleResetAllFilters = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedBrand('ALL');
    setPriceRange([0, maxPriceLimit]);
    setDebouncedPriceRange([0, maxPriceLimit]);
    setActiveFilterTag('all');
    setCurrentPage(1);

    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('search');
        url.searchParams.delete('product_type_ids');
        url.searchParams.delete('category');
        url.searchParams.delete('brand');
        url.searchParams.delete('min_price');
        url.searchParams.delete('max_price');
        window.history.replaceState(null, '', url.toString());
      } catch {}
    }
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        if (cat === 'ALL' || !cat) {
          url.searchParams.delete('product_type_ids');
          url.searchParams.delete('category');
        } else {
          const foundCat = categories.find(
            (c) =>
              String(c.id).toLowerCase() === cat.toLowerCase() ||
              (c.code && c.code.toLowerCase() === cat.toLowerCase()) ||
              (c.name && c.name.toLowerCase() === cat.toLowerCase())
          );
          const catId = foundCat ? String(foundCat.id) : cat;
          url.searchParams.set('product_type_ids', catId);
          url.searchParams.set('category', cat);
        }
        window.history.replaceState(null, '', url.toString());
      } catch {}
    }
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setCurrentPage(1);
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        if (newSort) {
          url.searchParams.set('sort', newSort);
        } else {
          url.searchParams.delete('sort');
        }
        window.history.replaceState(null, '', url.toString());
      } catch {}
    }
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setDebouncedSearchQuery('');
    }
    setSelectedCategory('ALL');
    setSelectedBrand('ALL');
    setPriceRange([0, maxPriceLimit]);
    setActiveFilterTag('all');
    setCurrentPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearchQuery(searchQuery);
    setSelectedCategory('ALL');
    setSelectedBrand('ALL');
    setPriceRange([0, maxPriceLimit]);
    setActiveFilterTag('all');
    setCurrentPage(1);
    loadProductsPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFEFE] dark:bg-[#0B0F17] flex flex-col items-center justify-center gap-4 text-slate-900 dark:text-white">
        <div className="w-12 h-12 rounded-2xl bg-accent-gradient animate-spin flex items-center justify-center p-2 shadow-xl shadow-brand-500/30">
          <div className="w-full h-full rounded-xl bg-white dark:bg-slate-950" />
        </div>
        <p className="text-xs font-bold tracking-wider uppercase text-slate-500 animate-pulse">
          Loading Verified District Banker Catalog...
        </p>
      </div>
    );
  }

  if (error || !catalogData) {
    return (
      <div className="min-h-screen bg-[#FDFEFE] dark:bg-[#0B0F17] flex flex-col items-center justify-center p-6 text-center text-slate-900 dark:text-white">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
          <X className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black mb-2">Invalid or Expired Link</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
          {error || 'This specific district banker catalog link could not be loaded or has been regenerated.'}
        </p>
        <Link
          href="/"
          className={buttonVariants({
            variant: 'outline',
            size: 'default',
            className: 'rounded-xl',
          })}
        >
          Return to Showroom Home
        </Link>
      </div>
    );
  }

  const { banker, company } = catalogData;

  return (
    <div className="min-h-screen bg-[#FDFEFE] dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-brand/20 selection:text-brand">
      {/* 2. Public Catalog Header */}
      <CatalogHeader
        company={company}
        branch={currentBranch}
        homeUrl="/"
        totalCartItems={totalItems}
        onOpenCart={() => setCartDrawerOpen(true)}
        onOpenFinancing={() => {
          setCheckoutBranchId(String(currentBranch?.id || ''));
          setIsFinancingModalOpen(true);
        }}
        onOpenReport={() => {
          setCheckoutBranchId(String(currentBranch?.id || ''));
          setIsFinancingModalOpen(true);
        }}
        onFilterBestSellers={() => {
          handleCategoryChange('ALL');
          setActiveFilterTag('best');
        }}
        onFilterDeals={() => {
          handleCategoryChange('ALL');
          setActiveFilterTag('discount');
        }}
        onSelectBranch={async (newBranch) => {
          setSelectedBranch(newBranch);
          setCheckoutBranchId(String(newBranch.id));
          setCurrentPage(1);
          setLoading(true);
          try {
            const companyId = partnerProfile?.default_company?.id || user?.companyId;
            if (companyId) {
              const prodList = await fetchProducts({
                businessId: companyId,
                branchId: newBranch.id,
                page: 1,
                rpp: itemsPerPage,
                keyword: debouncedSearchQuery.trim() || undefined,
                sort: sortBy || undefined,
              }).catch(() => []);
              if (prodList && prodList.length > 0) {
                setProducts(prodList);
                const pInfo = (prodList as any)?.pagination;
                if (pInfo) setPaginationInfo(pInfo);
              } else {
                setProducts([]);
              }
            }
            setCatalogData((prev: any) => {
              if (!prev) return prev;
              return {
                ...prev,
                branch: {
                  ...prev.branch,
                  id: String(newBranch.id),
                  name: newBranch.name,
                  code: newBranch.code,
                  address: newBranch.address,
                },
              };
            });
          } catch (loadErr) {
            console.warn('Failed to refetch catalog on branch switch:', loadErr);
          } finally {
            setLoading(false);
          }
        }}
        onSelectCompany={() => {
          setSelectedBranch(null);
          setCurrentPage(1);
        }}
        onSelectCompanyAndBranch={async (newCompany, newBranch) => {
          setSelectedBranch(newBranch);
          setCheckoutBranchId(String(newBranch.id));
          setCurrentPage(1);
          setLoading(true);
          try {
            const [catList, prodList] = await Promise.all([
              fetchCategories(newCompany.id).catch(() => []),
              fetchProducts({
                businessId: newCompany.id,
                branchId: newBranch.id,
                page: 1,
                rpp: itemsPerPage,
                keyword: debouncedSearchQuery.trim() || undefined,
                sort: sortBy || undefined,
              }).catch(() => []),
            ]);
            setCategories(catList && catList.length > 0 ? catList : []);
            setSelectedCategory('ALL');
            if (prodList && prodList.length > 0) {
              setProducts(prodList);
              const pInfo = (prodList as any)?.pagination;
              if (pInfo) setPaginationInfo(pInfo);
            } else {
              setProducts([]);
              setPaginationInfo({ page: 1, pages: 1, records: 0 });
            }
            const cName = getPreferredLocaleName(newCompany.name_locales) || newCompany.name || `Business ${newCompany.id}`;
            setCatalogData((prev: any) => {
              if (!prev) return prev;
              return {
                ...prev,
                company: {
                  ...prev.company,
                  id: String(newCompany.id),
                  name: cName,
                  logo: formatImageUrl(newCompany.logo?.file_url) || prev.company?.logo,
                },
                branch: {
                  ...prev.branch,
                  id: String(newBranch.id),
                  companyId: String(newCompany.id),
                  name: newBranch.name,
                  code: newBranch.code,
                  address: newBranch.address,
                },
              };
            });
          } catch (loadErr) {
            console.warn('Failed to refetch catalog on company & branch switch:', loadErr);
          } finally {
            setLoading(false);
          }
        }}
      />

      {/* 3. Hero Banner */}
      <CatalogHero
        company={company}
        title={company?.name}
        branch={currentBranch}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        sortBy={sortBy}
        onSortChange={handleSortChange}
      />

      {/* 4. Category Pills Bar */}
      <CategoryPills
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategoryChange}
        productCounts={categoryCounts}
        totalProductsCount={products.length}
      />

      {/* 5. Main Catalog Content Stage */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Desktop Left Sidebar Filters */}
          <aside className="hidden lg:block space-y-6">
            <div className="sticky top-28 p-6 rounded-3xl bg-white dark:bg-[#111722] border border-slate-200/80 dark:border-slate-800/80 space-y-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-brand" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Filters
                  </h3>
                </div>
                {isAnyFilterActive && (
                  <button
                    type="button"
                    onClick={handleResetAllFilters}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 transition-colors cursor-pointer"
                    title="Reset all applied filters"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset All</span>
                  </button>
                )}
              </div>

              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={handleCategoryChange}
                productCounts={categoryCounts}
                totalProductsCount={products.length}
              />

              <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                <BrandFilter
                  brands={companyBrands}
                  selectedBrand={selectedBrand}
                  onSelectBrand={(brand) => {
                    setSelectedBrand(brand);
                    setCurrentPage(1);
                  }}
                  totalProductsCount={products.length}
                />
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                <PriceFilter
                  priceRange={priceRange}
                  maxPriceLimit={maxPriceLimit}
                  onChangePriceRange={(range) => {
                    setPriceRange(range);
                    setCurrentPage(1);
                  }}
                  onResetPrice={handleResetPrice}
                />
              </div>
            </div>
          </aside>

          {/* Right Product Grid Stage */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            {/* Filter Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#111722] border border-slate-200/80 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5 text-brand" />
                  <span>Filters</span>
                </button>
                <span className="text-xs text-slate-500 font-semibold">
                  Showing <strong className="text-slate-900 dark:text-white">{filteredProducts.length}</strong> items
                </span>
                {isAnyFilterActive && (
                  <button
                    type="button"
                    onClick={handleResetAllFilters}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear Filters</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="text-slate-400">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="">Default</option>
                  <option value="MOST_POPULAR">Most Popular</option>
                  <option value="BIGGEST_DISCOUNT">Biggest Discount</option>
                  <option value="NEWEST_DEALS">Newest Deals</option>
                  <option value="NEWEST_ARRIVAL">Newest Arrival</option>
                </select>
              </div>
            </div>

            {/* Product Cards Grid with Fast Shimmer Loading State */}
            {loadingProducts ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-slate-900/90 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between"
                  >
                    {/* Skeleton Image Box with Fast Shimmer */}
                    <div className="relative h-32 xs:h-36 sm:h-48 w-full bg-slate-100 dark:bg-slate-800/80 animate-fast-shimmer overflow-hidden">
                      <div className="absolute top-2 left-2 sm:top-3 sm:left-3 w-14 sm:w-16 h-4 sm:h-5 rounded-full bg-slate-200 dark:bg-slate-700/80" />
                    </div>

                    {/* Skeleton Content */}
                    <div className="p-2.5 sm:p-5 flex-1 flex flex-col justify-between space-y-3 sm:space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="w-16 sm:w-20 h-3 rounded bg-slate-200 dark:bg-slate-800 animate-fast-shimmer" />
                          <div className="w-12 h-3 rounded bg-slate-200 dark:bg-slate-800 animate-fast-shimmer hidden xs:block" />
                        </div>
                        <div className="w-full h-4 rounded-md bg-slate-200 dark:bg-slate-800 animate-fast-shimmer" />
                        <div className="w-3/4 h-4 rounded-md bg-slate-200 dark:bg-slate-800 animate-fast-shimmer" />
                      </div>

                      {/* Skeleton Bottom Action */}
                      <div className="pt-2 sm:pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col xs:flex-row xs:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="w-16 sm:w-20 h-4 sm:h-5 rounded-md bg-slate-200 dark:bg-slate-800 animate-fast-shimmer" />
                          <div className="w-14 sm:w-16 h-2.5 sm:h-3 rounded bg-slate-200 dark:bg-slate-800 animate-fast-shimmer" />
                        </div>
                        <div className="w-full xs:w-16 sm:w-20 h-6 sm:h-8 rounded-xl bg-slate-200 dark:bg-slate-800 animate-fast-shimmer" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : paginatedProducts.length === 0 ? (
              <div className="py-16 sm:py-20 text-center rounded-3xl bg-white dark:bg-[#111722] border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-8 space-y-4">
                <Package className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    No matching products found
                  </h3>
                  <p className="text-xs text-slate-500">Try adjusting your brand, category, or price range filter.</p>
                </div>
                {isAnyFilterActive && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResetAllFilters}
                    className="inline-flex items-center gap-1.5 rounded-xl cursor-pointer mx-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-brand" />
                    <span>Reset All Filters</span>
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-6">
                {paginatedProducts.map((product) => (
                  <BankerProductCard
                    key={product.id}
                    product={product}
                    inCartCount={getCartCount(product.id)}
                    isJustAdded={recentlyAddedId === product.id}
                    onAddToCart={(p) => handleAddToCart(p)}
                    onOpenConfigurator={(p) => setConfigModalProduct(p)}
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100 dark:border-slate-800/80">
                <div className="text-xs font-semibold text-slate-500">
                  Showing page <strong className="text-slate-900 dark:text-white">{currentPage}</strong> of{' '}
                  <strong className="text-slate-900 dark:text-white">{totalPages}</strong>
                  {paginationInfo.records > 0 && ` (${paginationInfo.records} total products)`}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      if (currentPage > 1 && !loadingProducts) {
                        setCurrentPage((p) => p - 1);
                        window.scrollTo({ top: 350, behavior: 'smooth' });
                      }
                    }}
                    disabled={currentPage === 1 || loadingProducts}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((pageNum) => {
                      return pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - currentPage) <= 2;
                    })
                    .map((pageNum, idx, arr) => {
                      const prevNum = arr[idx - 1];
                      const hasGap = prevNum && pageNum - prevNum > 1;

                      return (
                        <React.Fragment key={pageNum}>
                          {hasGap && <span className="px-1 text-xs text-slate-400 font-bold">...</span>}
                          <button
                            type="button"
                            onClick={() => {
                              if (pageNum !== currentPage && !loadingProducts) {
                                setCurrentPage(pageNum);
                                window.scrollTo({ top: 350, behavior: 'smooth' });
                              }
                            }}
                            disabled={loadingProducts}
                            className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                              currentPage === pageNum
                                ? 'bg-brand text-slate-950 shadow-md shadow-brand/30 ring-2 ring-brand/40'
                                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            {pageNum}
                          </button>
                        </React.Fragment>
                      );
                    })}

                  <button
                    type="button"
                    onClick={() => {
                      if (currentPage < totalPages && !loadingProducts) {
                        setCurrentPage((p) => p + 1);
                        window.scrollTo({ top: 350, behavior: 'smooth' });
                      }
                    }}
                    disabled={currentPage === totalPages || loadingProducts}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Floating Cart Indicator Bar */}
      {totalItems > 0 && !cartDrawerOpen && (
        <div className="fixed bottom-4 left-3 right-3 z-40 lg:hidden">
          <div className="bg-slate-950/95 dark:bg-[#080c14]/95 text-white backdrop-blur-xl border border-brand/40 rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-3 duration-300">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-brand text-slate-950 flex items-center justify-center font-black text-xs flex-shrink-0 shadow-md">
                {totalItems}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Cart Subtotal</div>
                <div className="text-sm font-black text-white truncate">{formatCurrency(totalAmount)}</div>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCartDrawerOpen(true)}
              className="px-4 py-2 h-auto rounded-xl flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
            >
              <span>View Cart</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* 6. Footer */}
      <CatalogFooter company={company} branch={currentBranch} banker={banker} hash={hash} />

      {/* 7. Modals & Drawers */}
      <CartSlideOverDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        items={cartItems}
        totalAmount={totalAmount}
        totalItems={totalItems}
        onCheckout={(branchId, itemIds, orderId) => {
          const params = new URLSearchParams();
          if (branchId) params.set('branchId', branchId);
          if (itemIds && itemIds.length > 0) params.set('items', itemIds.join(','));
          if (orderId) params.set('orderId', orderId);
          params.set('backUrl', '/');
          router.push(`/checkout?${params.toString()}`);
        }}
      />

      {configModalProduct && (
        <BankerProductConfigModal
          product={configModalProduct}
          onClose={() => setConfigModalProduct(null)}
          onAddToCart={(p, options) => handleAddToCart(p, options)}
        />
      )}

      <ProductQuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />

      <BankerFinancingModal
        isOpen={isFinancingModalOpen}
        onClose={() => setIsFinancingModalOpen(false)}
        banker={banker}
        branch={currentBranch}
        cartAmount={checkoutAmount}
        totalItemsCount={checkoutItemsCount}
      />

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xs bg-white dark:bg-[#0E1524] h-full p-6 overflow-y-auto space-y-6 shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-brand" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Filters</h3>
                </div>
                <div className="flex items-center gap-2">
                  {isAnyFilterActive && (
                    <button
                      type="button"
                      onClick={() => {
                        handleResetAllFilters();
                        setMobileFilterOpen(false);
                      }}
                      className="text-xs font-bold text-rose-500 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setMobileFilterOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={(cat) => {
                  handleCategoryChange(cat);
                  setMobileFilterOpen(false);
                }}
                productCounts={categoryCounts}
                totalProductsCount={products.length}
              />

              <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                <BrandFilter
                  brands={companyBrands}
                  selectedBrand={selectedBrand}
                  onSelectBrand={(brand) => {
                    setSelectedBrand(brand);
                    setCurrentPage(1);
                    setMobileFilterOpen(false);
                  }}
                  totalProductsCount={products.length}
                />
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                <PriceFilter
                  priceRange={priceRange}
                  maxPriceLimit={maxPriceLimit}
                  onChangePriceRange={(range) => {
                    setPriceRange(range);
                    setCurrentPage(1);
                  }}
                  onResetPrice={handleResetPrice}
                />
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => setMobileFilterOpen(false)}
              className="w-full py-2.5 h-auto rounded-xl"
            >
              Apply Filters ({filteredProducts.length} Results)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
