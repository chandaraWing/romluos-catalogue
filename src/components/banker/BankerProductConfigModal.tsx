'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Package, Tag, Layers, Check, ShoppingCart, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { ProductItem } from '@/types';
import { formatCurrency, formatImageUrl, getPreferredLocaleName } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

interface BankerProductConfigModalProps {
  product: ProductItem | null;
  onClose: () => void;
  onAddToCart: (
    product: ProductItem,
    selectedOptions: Record<string, { label: string; additionalPrice: number }>
  ) => void;
}

// Helper to extract initial attribute selections immediately from product's cached variant groups
function getInitialAttributes(product: ProductItem | null): Record<string, string> {
  if (!product) return {};
  const initial: Record<string, string> = {};
  const groups = product.variantGroups || product.specifications?.options || [];
  if (Array.isArray(groups)) {
    groups.forEach((g) => {
      if (g.name && g.choices?.[0]?.label) {
        initial[g.name] = g.choices[0].label;
      }
    });
  }
  return initial;
}

export const BankerProductConfigModal: React.FC<BankerProductConfigModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const { user, partnerProfile, consumerToken } = useAuth();
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [productDetail, setProductDetail] = useState<any>(null);

  // Selected attribute values (key: Attribute Name e.g. "Color", value: Choice Name e.g. "Red")
  // Initialized optimistically from existing product variant groups for 0ms delay!
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>(() =>
    getInitialAttributes(product)
  );

  const branchId =
    product?.branchId ||
    user?.branchId ||
    partnerProfile?.default_company?.default_branch?.id ||
    '';

  // Keep selected attributes in sync when product changes
  useEffect(() => {
    if (product) {
      setSelectedAttributes((prev) => {
        const initial = getInitialAttributes(product);
        return { ...initial, ...prev };
      });
    }
  }, [product?.id]);

  // Fetch Full Product Detail with Variant Attributes & Mappings
  useEffect(() => {
    if (!product?.id) {
      setProductDetail(null);
      return;
    }

    let isMounted = true;
    const fetchDetail = async () => {
      setLoadingDetails(true);
      try {
        const headers: Record<string, string> = {};
        if (consumerToken) {
          headers['Authorization'] = `Bearer ${consumerToken}`;
        }
        const data = await api.get<any>(
          `/api/products/${product.id}?branch_id=${branchId}&service_types=ST_SHOPPING`,
          { headers, cacheTtlMs: 60000 }
        );
        if (isMounted && data?.body) {
          setProductDetail(data.body);

          // Merge live selected attributes from full variant_attributes
          const variantAttrs = data.body.variant_attributes || [];
          if (Array.isArray(variantAttrs) && variantAttrs.length > 0) {
            setSelectedAttributes((prev) => {
              const updated: Record<string, string> = { ...prev };
              variantAttrs.forEach((attr: any) => {
                const attrName = getPreferredLocaleName(attr.name_locales) || attr.name;
                const firstValue = attr.values?.[0];
                const valName = getPreferredLocaleName(firstValue?.name_locales) || firstValue?.name;
                if (attrName && !updated[attrName] && valName) {
                  updated[attrName] = valName;
                }
              });
              return updated;
            });
          }
        }
      } catch (err) {
        console.warn('Failed to load product detail:', err);
      } finally {
        if (isMounted) setLoadingDetails(false);
      }
    };

    fetchDetail();

    return () => {
      isMounted = false;
    };
  }, [product?.id, branchId, consumerToken]);

  // Optimistic & Dynamic Variant Attributes
  // If productDetail has arrived, use its rich variant_attributes.
  // Otherwise, fallback to the pre-existing product.variantGroups so UI displays immediately.
  const rawVariantAttributes = useMemo(() => {
    if (
      productDetail?.variant_attributes &&
      Array.isArray(productDetail.variant_attributes) &&
      productDetail.variant_attributes.length > 0
    ) {
      return productDetail.variant_attributes;
    }

    // Fallback: Map cached variantGroups to standard variant attribute structure
    const fallbackGroups = product?.variantGroups || product?.specifications?.options;
    if (fallbackGroups && Array.isArray(fallbackGroups) && fallbackGroups.length > 0) {
      return fallbackGroups.map((group: any, gIdx: number) => ({
        id: `opt-group-${gIdx}`,
        name: group.name,
        values: (group.choices || []).map((choice: any, cIdx: number) => ({
          id: `opt-val-${gIdx}-${cIdx}`,
          name: choice.label,
          image_url: choice.imageUrl,
        })),
      }));
    }

    return [];
  }, [productDetail?.variant_attributes, product?.variantGroups, product?.specifications?.options]);

  const variantMappings = productDetail?.variant_mappings || {};

  // Form the variant lookup key (e.g. "Red_Pixel Buds Pro 2" or "White_Pixel Buds 2a")
  const activeVariantKey = useMemo(() => {
    if (!rawVariantAttributes || rawVariantAttributes.length === 0) return 'DEFAULT';
    const values = rawVariantAttributes
      .map((attr: any) => {
        const attrName = getPreferredLocaleName(attr.name_locales) || attr.name;
        return selectedAttributes[attrName];
      })
      .filter(Boolean);
    return values.join('_');
  }, [rawVariantAttributes, selectedAttributes]);

  // Active matched variant from mappings
  const matchedVariant = useMemo(() => {
    if (variantMappings[activeVariantKey]) {
      return variantMappings[activeVariantKey];
    }
    // Fallback search by matching variant parts
    const keys = Object.keys(variantMappings);
    const foundKey = keys.find((k) => {
      const parts = k.split('_');
      return Object.values(selectedAttributes).every((val) => parts.includes(val));
    });
    return foundKey ? variantMappings[foundKey] : variantMappings['DEFAULT'] || productDetail?.variant || null;
  }, [variantMappings, activeVariantKey, selectedAttributes, productDetail]);

  if (!product) return null;

  // Active pricing calculations
  const rawPrice = matchedVariant?.price
    ? Number(matchedVariant.price)
    : productDetail?.current_price
    ? Number(productDetail.current_price)
    : Number(product.unitPrice || product.currentPrice || product.basePrice || 0);

  const promoPrice =
    matchedVariant?.special_deal?.promotion_price !== undefined
      ? Number(matchedVariant.special_deal.promotion_price)
      : matchedVariant?.in_store_discount?.promotion_price !== undefined
      ? Number(matchedVariant.in_store_discount.promotion_price)
      : product.promotionalPrice;

  const displayPrice = promoPrice !== undefined ? promoPrice : rawPrice;
  const originalPrice =
    matchedVariant?.special_deal?.original_price !== undefined
      ? Number(matchedVariant.special_deal.original_price)
      : rawPrice;

  const stockOnHand =
    matchedVariant?.stock_on_hand !== undefined
      ? Number(matchedVariant.stock_on_hand)
      : product.availableStock ?? 10;

  const isAvailable = stockOnHand > 0;
  const activeSku = matchedVariant?.sku_code || product.sku;

  const displayImage =
    formatImageUrl(matchedVariant?.image_url) ||
    formatImageUrl(productDetail?.documents?.[0]?.file_url) ||
    product.images?.[0] ||
    product.image;

  const productName =
    getPreferredLocaleName(productDetail?.info_locales) ||
    product.name;

  const categoryName =
    getPreferredLocaleName(productDetail?.category?.name_locales) ||
    product.category;

  const description =
    getPreferredLocaleName(productDetail?.description_locales) ||
    product.description;

  const handleAddToCart = () => {
    const formattedOptions: Record<string, { label: string; additionalPrice: number }> = {};
    Object.entries(selectedAttributes).forEach(([key, val]) => {
      formattedOptions[key] = { label: val, additionalPrice: 0 };
    });

    const hasUniqueVariantName =
      matchedVariant?.name &&
      matchedVariant.name.toLowerCase() !== product.name.toLowerCase() &&
      !product.name.toLowerCase().includes(matchedVariant.name.toLowerCase());
    const finalProductName = hasUniqueVariantName ? `${product.name} (${matchedVariant.name})` : product.name;

    const configuredProduct: ProductItem = {
      ...product,
      name: finalProductName,
      sku: activeSku,
      currentPrice: displayPrice,
      unitPrice: rawPrice,
      basePrice: originalPrice,
      promotionalPrice: promoPrice,
      image: displayImage,
      images: displayImage ? [displayImage] : product.images,
      availableStock: stockOnHand,
      variantId: matchedVariant?.id
        ? String(matchedVariant.id)
        : matchedVariant?.variant_id
        ? String(matchedVariant.variant_id)
        : productDetail?.variant?.id
        ? String(productDetail.variant.id)
        : product.variantId,
    };

    onAddToCart(configuredProduct, formattedOptions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </Button>

        {/* Header Product Info */}
        <div className="flex items-start gap-4">
          <div className="w-24 h-24 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex-shrink-0 relative">
            {displayImage ? (
              <img
                src={displayImage}
                alt={productName}
                className="w-full h-full object-cover transition-all duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <Package className="w-8 h-8" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-brand/10 dark:bg-brand/15 border border-brand/20 text-brand-700 dark:text-brand text-xs font-bold">
                {categoryName}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isAvailable
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                }`}
              >
                {isAvailable ? `${stockOnHand} in Stock` : 'Out of Stock'}
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1.5 line-clamp-1">
              {productName}
            </h2>

            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              SKU: <b className="text-slate-900 dark:text-slate-200">{activeSku}</b>
              {product.brand && ` • Brand: ${product.brand}`}
            </div>
          </div>
        </div>

        {/* Dynamic Specifications & Variant Attributes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-brand" />
              Configurable Specifications & Attributes
            </div>

            {/* Subtle Live Syncing Badge */}
            {loadingDetails && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand/10 dark:bg-brand/15 border border-brand/20 text-[10px] font-semibold text-brand animate-pulse">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                <span>Syncing live options...</span>
              </div>
            )}
          </div>

          {/* Render Active Options OR Skeleton Loading */}
          {rawVariantAttributes.length > 0 ? (
            <div className="space-y-3">
              {rawVariantAttributes.map((attr: any, aIdx: number) => {
                const attrName = getPreferredLocaleName(attr.name_locales) || attr.name;
                const currentVal = selectedAttributes[attrName];

                return (
                  <div
                    key={attr.id || aIdx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {attrName}
                      </span>
                      {currentVal && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          Selected:{' '}
                          <strong className="text-slate-900 dark:text-white">{currentVal}</strong>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {attr.values?.map((valItem: any, vIdx: number) => {
                        const valName =
                          getPreferredLocaleName(valItem.name_locales) || valItem.name;
                        const isSelected = currentVal === valName;
                        const valImg = formatImageUrl(valItem.image_url);

                        return (
                          <button
                            key={valItem.id || vIdx}
                            type="button"
                            onClick={() =>
                              setSelectedAttributes((prev) => ({
                                ...prev,
                                [attrName]: valName,
                              }))
                            }
                            className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex items-center gap-2 ${
                              isSelected
                                ? 'bg-white dark:bg-slate-900 border-brand text-slate-900 dark:text-white shadow-sm ring-2 ring-brand/40'
                                : 'bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                            }`}
                          >
                            {valImg ? (
                              <img
                                src={valImg}
                                alt={valName}
                                className="w-6 h-6 object-cover rounded-md bg-slate-100 dark:bg-slate-800 shrink-0"
                              />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-brand shrink-0" />
                            )}
                            <span className="text-xs font-semibold truncate flex-1">{valName}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-brand shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : loadingDetails ? (
            /* Skeleton Shimmer while initial details are loading without fallback */
            <div className="space-y-3 animate-pulse">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="h-3 w-28 bg-slate-200 dark:bg-slate-700 rounded-md" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div className="h-10 bg-slate-200/80 dark:bg-slate-700/80 rounded-xl" />
                  <div className="h-10 bg-slate-200/80 dark:bg-slate-700/80 rounded-xl" />
                  <div className="h-10 bg-slate-200/80 dark:bg-slate-700/80 rounded-xl" />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 text-xs text-slate-500 italic text-center rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              Standard unit specification with default options.
            </div>
          )}
        </div>

        {/* Product Description Box */}
        {description ? (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="text-xs font-bold text-slate-900 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-brand" />
              Description & Highlights
            </div>
            <div
              className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed rich-description-view"
              dangerouslySetInnerHTML={{
                __html: description,
              }}
            />
          </div>
        ) : loadingDetails ? (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 animate-pulse">
            <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded-md" />
            <div className="h-2 w-full bg-slate-200/60 dark:bg-slate-700/60 rounded-md" />
            <div className="h-2 w-4/5 bg-slate-200/60 dark:bg-slate-700/60 rounded-md" />
          </div>
        ) : null}

        {/* Pricing Summary & Modal Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
              Selected Configuration Price:
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {formatCurrency(displayPrice)}
              </span>
              {promoPrice !== undefined && originalPrice > promoPrice && (
                <span className="text-xs text-slate-400 line-through">
                  {formatCurrency(originalPrice)}
                </span>
              )}
              {promoPrice !== undefined && originalPrice > promoPrice && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 font-bold border border-rose-500/20">
                  Special Deal
                </span>
              )}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
              Est: {formatCurrency((displayPrice * 0.9 * 1.052) / 24)}/mo (24m)
            </div>
          </div>

          <Button
            type="button"
            variant="gradient"
            disabled={!isAvailable}
            onClick={handleAddToCart}
            className="px-6 py-3 rounded-2xl text-xs gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>
              {rawVariantAttributes.length > 0 ? 'Add Selected Option to Cart' : 'Add to Cart'}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
};
