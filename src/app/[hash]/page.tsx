'use client';

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
  ProductQuickViewModal
} from '@/components/catalog';
import { Button, buttonVariants } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { formatCurrency } from '@/lib/utils';
import { BrandItem, CategoryItem, ProductItem, Role, Status } from '@/types';
import { ArrowRight, Filter, Package, RotateCcw, X } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

function BankerCatalogContent({ hash }: { hash: string }) {
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
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get('product_type_ids') || searchParams.get('category') || 'ALL'
  );
  const [selectedBrand, setSelectedBrand] = useState<string>(searchParams.get('brand') || 'ALL');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3500]);
  const [maxPriceLimit, setMaxPriceLimit] = useState<number>(3500);
  const [activeFilterTag, setActiveFilterTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sort') || 'MOST_POPULAR');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 9;

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

  const defaultProfileBranch = useMemo(() => {
    if (user?.branchId && user?.branchName) {
      return {
        id: user.branchId,
        name: user.branchName,
        code: `BR-${user.branchId}`,
        companyId: user.companyId || '47860',
      };
    }
    return null;
  }, [user?.branchId, user?.branchName, user?.companyId]);

  const currentBranch = selectedBranch || defaultProfileBranch || catalogData?.branch;

  const checkoutItems = useMemo(() => {
    if (!checkoutBranchId) return cartItems;
    let branchItems = cartItems.filter(i => i.branchId === checkoutBranchId);
    if (checkoutItemIds.length > 0) {
      branchItems = branchItems.filter(i => checkoutItemIds.includes(i.id || i.productId));
    }
    return branchItems;
  }, [cartItems, checkoutBranchId, checkoutItemIds]);

  const checkoutAmount = checkoutItems.reduce((acc, item) => acc + Number(item.unitPrice) * item.quantity, 0);
  const checkoutItemsCount = checkoutItems.reduce((acc, item) => acc + item.quantity, 0);

  // 1. Unified initial load: Parallelize catalog, categories, and products on mount
  useEffect(() => {
    let isMounted = true;
    async function initCatalogData() {
      try {
        setLoading(true);
        setError(null);

        const companyId = partnerProfile?.default_company?.id || user?.companyId || '47860';
        const branchId = user?.branchId || partnerProfile?.default_company?.default_branch?.id || '47861';

        // Fire all initial requests concurrently
        const [catalogRes, catList, prodList] = await Promise.all([
          api.get<any>(`/api/banker-links/public/${hash}`, { cacheTtlMs: 60000 }).catch(() => null),
          fetchCategories(companyId).catch(() => []),
          fetchProducts({ businessId: companyId, branchId, sort: sortBy }).catch(() => []),
        ]);

        if (!isMounted) return;

        if (catList && catList.length > 0) {
          setCategories(catList);
        }

        if (prodList && prodList.length > 0) {
          setProducts(prodList);
          const maxP = Math.max(
            ...prodList.map((p) => Number(p.currentPrice || p.basePrice || 0))
          );
          const roundedMax = Math.ceil((maxP || 1000) / 100) * 100;
          setMaxPriceLimit(roundedMax > 500 ? roundedMax : 3500);
          setPriceRange([0, roundedMax > 500 ? roundedMax : 3500]);
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
        } else {
          const resolvedCompany = {
            id: user?.companyId || partnerProfile?.default_company?.id || '47860',
            name: user?.companyName || 'Google Mini Store',
            code: 'GM',
            status: Status.ACTIVE,
          };
          const resolvedBranch = {
            id: user?.branchId || partnerProfile?.default_company?.default_branch?.id || '47861',
            companyId: resolvedCompany.id,
            name: user?.branchName || 'Google Mini Aeon I',
            code: 'BR-47861',
            status: Status.ACTIVE,
          };
          const resolvedBanker = {
            id: user?.id || 'banker-partner-01',
            fullName: user ? `${user.firstName} ${user.lastName}` : 'Sundar Pichai',
            email: user?.email || 'sundar@wingbank.com.kh',
            phone: user?.phone || '+855 23 999 888',
            role: Role.DISTRICT_BANKER,
            companyId: resolvedCompany.id,
            companyName: resolvedCompany.name,
            branchId: resolvedBranch.id,
            branchName: resolvedBranch.name,
          };

          setCatalogData({
            link: {
              id: hash,
              hash: hash,
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

    if (hash) {
      initCatalogData();
    }
    return () => {
      isMounted = false;
    };
  }, [hash, fetchCategories, fetchProducts, user?.companyId, user?.branchId, partnerProfile?.default_company?.id, partnerProfile?.default_company?.default_branch?.id]);

  // 2. Subsequent category / sort filter changes
  useEffect(() => {
    // Only re-fetch if not default initial state
    if (selectedCategory === 'ALL' && sortBy === 'MOST_POPULAR') return;

    let isMounted = true;
    async function loadFilteredProducts() {
      const companyId = partnerProfile?.default_company?.id || user?.companyId || '47860';
      const branchId = user?.branchId || partnerProfile?.default_company?.default_branch?.id || '47861';

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

      const fetchedProducts = await fetchProducts({
        businessId: companyId,
        branchId: branchId,
        productTypeIds: resolvedProductTypeId,
        sort: sortBy,
      });

      if (isMounted && fetchedProducts && fetchedProducts.length > 0) {
        setProducts(fetchedProducts);
      }
    }

    loadFilteredProducts();
    return () => {
      isMounted = false;
    };
  }, [
    selectedCategory,
    sortBy,
    fetchProducts,
    user?.companyId,
    user?.branchId,
    partnerProfile?.default_company?.id,
    partnerProfile?.default_company?.default_branch?.id,
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
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = product.name.toLowerCase().includes(q);
          const matchSku = product.sku?.toLowerCase().includes(q);
          const matchBrand = (product.brand || product.brandRel?.name || '')
            .toLowerCase()
            .includes(q);
          if (!matchName && !matchSku && !matchBrand) return false;
        }

        // Category Filter
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

        // Brand Filter
        if (selectedBrand !== 'ALL') {
          const pBrand = (product.brand || product.brandRel?.name || '').toLowerCase();
          if (pBrand !== selectedBrand.toLowerCase()) return false;
        }

        // Price Filter
        const price = Number(
          product.promotionalPrice || product.currentPrice || product.basePrice || 0
        );
        if (price < priceRange[0] || price > priceRange[1]) return false;

        // Tag Filter
        if (activeFilterTag === 'discount' && !product.promotionalPrice) return false;
        if (
          activeFilterTag === 'instock' &&
          ((product as any).inventoryCount ?? 1) <= 0
        )
          return false;

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
  }, [products, searchQuery, selectedCategory, selectedBrand, priceRange, activeFilterTag, sortBy]);

  // Paginated Results
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const getCartCount = (productId: string) => {
    return cartItems
      .filter(
        (item) =>
          item.productId === productId ||
          item.id === productId ||
          item.id?.startsWith(`${productId}_`)
      )
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

    // Generate unique ID for this cart item variant so distinct configurations don't overwrite each other
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
      searchQuery.trim() !== '' ||
      selectedCategory !== 'ALL' ||
      selectedBrand !== 'ALL' ||
      priceRange[0] > 0 ||
      priceRange[1] < maxPriceLimit ||
      activeFilterTag !== 'all'
    );
  }, [searchQuery, selectedCategory, selectedBrand, priceRange, maxPriceLimit, activeFilterTag]);

  const handleResetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedBrand('ALL');
    setPriceRange([0, maxPriceLimit]);
    setActiveFilterTag('all');
    setCurrentPage(1);

    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('search');
        url.searchParams.delete('product_type_ids');
        url.searchParams.delete('category');
        url.searchParams.delete('brand');
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
      {/* 1. Banker Trust Top Ribbon */}
      {/* <BankerTrustRibbon banker={banker} branch={currentBranch} company={company} /> */}

      {/* 2. Public Catalog Header */}
      <CatalogHeader
        company={company}
        branch={currentBranch}
        homeUrl={`/${hash}`}
        totalCartItems={totalItems}
        onOpenCart={() => setCartDrawerOpen(true)}
        onOpenFinancing={() => {
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
        onSelectBranch={(newBranch) => {
          setSelectedBranch(newBranch);
          setCheckoutBranchId(String(newBranch.id));
        }}
      />

      {/* 3. Hero Banner */}
      <CatalogHero
        company={company}
        title={company?.name}
        branch={currentBranch}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={(e) => e.preventDefault()}
        activeFilterTag={activeFilterTag}
        onSelectFilterTag={setActiveFilterTag}
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
                  onChangePriceRange={setPriceRange}
                  onResetPrice={() => setPriceRange([0, maxPriceLimit])}
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
                  onChange={(e) => {
                    const newSort = e.target.value;
                    setSortBy(newSort);
                    if (typeof window !== 'undefined') {
                      try {
                        const url = new URL(window.location.href);
                        url.searchParams.set('sort', newSort);
                        window.history.replaceState(null, '', url.toString());
                      } catch {}
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="MOST_POPULAR">Most Popular</option>
                  <option value="BIGGEST_DISCOUNT">Biggest Discount</option>
                  <option value="NEWEST_DEALS">Newest Deals</option>
                  <option value="NEWEST_ARRIVAL">Newest Arrival</option>
                </select>
              </div>
            </div>

            {/* Product Cards Grid */}
            {paginatedProducts.length === 0 ? (
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
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
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
              <div className="flex items-center justify-center gap-2 pt-4 sm:pt-6">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-xs font-bold text-slate-500 px-2 sm:px-3">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
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
        onCheckout={(branchId, itemIds) => {
          const params = new URLSearchParams();
          if (branchId) params.set('branchId', branchId);
          if (itemIds && itemIds.length > 0) params.set('items', itemIds.join(','));
          params.set('backUrl', `/${hash}`);
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
                  onChangePriceRange={setPriceRange}
                  onResetPrice={() => setPriceRange([0, maxPriceLimit])}
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

export default function BranchCatalogPage() {
  const urlParams = useParams();
  const hash = (urlParams?.hash as string) || 'DEMO';

  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFEFE] dark:bg-[#0B0F17] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <BankerCatalogContent hash={hash} />
    </React.Suspense>
  );
}
