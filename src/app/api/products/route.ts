import { NextRequest, NextResponse } from 'next/server';
import { ProductItem, Status } from '@/types';
import { getPreferredLocaleName, formatImageUrl } from '@/lib/utils';
import { serverCache } from '@/lib/server-cache';
import { createCustomRequest } from '@/lib/httpRequest';
import { logApiError } from '@/lib/server-logger';

const SHOP_BASE_URL = process.env.NEXT_PUBLIC_SHOP_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://qa.wingmall.com';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') || '1';
    const rpp = searchParams.get('rpp') || '36';
    const serviceTypes = searchParams.get('service_types') || 'ST_SHOPPING';
    const businessIds = searchParams.get('business_ids') || searchParams.get('business_id') || searchParams.get('company_id');
    const branchIds = searchParams.get('branch_ids') || searchParams.get('branch_id');
    const sort = searchParams.get('sort');
    const keyword = searchParams.get('keyword') || searchParams.get('search') || searchParams.get('q');
    const minPrice = searchParams.get('min_price') || searchParams.get('minPrice');
    const maxPrice = searchParams.get('max_price') || searchParams.get('maxPrice');
    const productTypeIds =
      searchParams.get('product_type_ids') ||
      searchParams.get('product_type_id') ||
      searchParams.get('category_id') ||
      searchParams.get('categoryId');

    if (!businessIds || businessIds === 'undefined') {
      return NextResponse.json(
        { result: false, result_message: 'business_ids / company_id is required', products: [] },
        { status: 400 }
      );
    }

    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    if (!token) {
      token =
        searchParams.get('access_token') ||
        searchParams.get('consumer_token') ||
        searchParams.get('token') ||
        req.cookies.get('romluos_consumer_token')?.value ||
        null;
    }

    const cacheKey = `products:${businessIds}:${branchIds || 'all'}:${serviceTypes}:${page}:${rpp}:${productTypeIds || 'all'}:${sort || 'default'}:${keyword || 'none'}:${minPrice || 'min'}:${maxPrice || 'max'}`;
    const cachedResponse = serverCache.get<any>(cacheKey);
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      });
    }

    let targetUrl = `${SHOP_BASE_URL}/marketplace/v1/consumer/products/search?page=${page}&rpp=${rpp}&service_types=${serviceTypes}&business_ids=${businessIds}&is_add_recent_search=false&is_bnpl=true`;
    if (branchIds && branchIds !== 'undefined') {
      targetUrl += `&branch_ids=${branchIds}`;
    }
    if (productTypeIds && productTypeIds !== 'ALL' && productTypeIds !== 'undefined') {
      targetUrl += `&product_type_ids=${encodeURIComponent(productTypeIds)}`;
    }
    if (keyword && keyword.trim()) {
      targetUrl += `&search=${encodeURIComponent(keyword.trim())}&keyword=${encodeURIComponent(keyword.trim())}`;
    }
    if (minPrice && !isNaN(Number(minPrice))) {
      targetUrl += `&min_price=${encodeURIComponent(minPrice)}`;
    }
    if (maxPrice && !isNaN(Number(maxPrice))) {
      targetUrl += `&max_price=${encodeURIComponent(maxPrice)}`;
    }
    if (sort) {
      targetUrl += `&sort=${encodeURIComponent(sort)}`;
    }

    const customReq = createCustomRequest(token, SHOP_BASE_URL, {
      'Accept': 'application/json, text/plain, */*',
      'accept-language': 'en-US,en;q=0.9',
      'Connection': 'keep-alive',
    });

    const data = await customReq.get(targetUrl);

    if (data?.body?.items) {
      const rawItems: any[] = data.body.items;
      const mappedProducts: ProductItem[] = rawItems.map((item: any) => {
        const prodName = getPreferredLocaleName(item.info_locales) || item.variant?.name || 'Unnamed Product';
        const brandName =
          getPreferredLocaleName(item.company_info?.name_locales) ||
          item.partner_info?.name_locales?.[0]?.full_name ||
          'Google';
        const categoryName =
          getPreferredLocaleName(item.product_type?.name_locales) ||
          getPreferredLocaleName(item.category?.name_locales) ||
          'Shopping';
        const categoryId = String(item.product_type?.id || item.category?.id || '');

        const rawPrice = Number(item.price ?? item.variant?.price ?? 0);
        const promoPrice =
          item.special_deal?.promotion_price !== undefined
            ? Number(item.special_deal.promotion_price)
            : item.in_store_discount?.promotion_price !== undefined
            ? Number(item.in_store_discount.promotion_price)
            : item.variant?.special_deal?.promotion_price !== undefined
            ? Number(item.variant.special_deal.promotion_price)
            : item.variant?.in_store_discount?.promotion_price !== undefined
            ? Number(item.variant.in_store_discount.promotion_price)
            : undefined;

        const currentPrice = promoPrice !== undefined ? promoPrice : rawPrice;
        const originalPrice =
          item.original_price > 0
            ? Number(item.original_price)
            : item.variant?.original_price > 0
            ? Number(item.variant.original_price)
            : rawPrice;

        const stock =
          item.variant?.stock_on_hand !== undefined && item.variant?.stock_on_hand !== null
            ? Number(item.variant.stock_on_hand)
            : Number(item.stock_on_hand || 0);

        // Extract Document Images & Variant Images
        const docImages: string[] = (item.documents || [])
          .map((doc: any) => formatImageUrl(doc.file_url))
          .filter(Boolean) as string[];

        const variantImg = formatImageUrl(item.variant?.image_url);
        const allImages = Array.from(
          new Set([...(variantImg ? [variantImg] : []), ...docImages])
        );

        // Build Variant Groups from attribute details
        const variantGroups = (item.variant?.attribute_details || []).map((attr: any) => {
          const groupName = getPreferredLocaleName(attr.name_locales) || attr.name || 'Option';
          const choiceLabel =
            getPreferredLocaleName(attr.value?.name_locales) || attr.value?.name || 'Default';
          return {
            name: groupName,
            choices: [
              {
                label: choiceLabel,
                additionalPrice: 0,
                imageUrl: formatImageUrl(attr.value?.image_url),
              },
            ],
          };
        });

        const isItemAvailable =
          item.is_available !== undefined
            ? Boolean(item.is_available)
            : item.variant?.is_available !== undefined
            ? Boolean(item.variant.is_available)
            : stock > 0 || item.status === 'ACTIVE';

        return {
          id: String(item.product_id),
          companyId: String(item.company_info?.id || businessIds),
          branchId: String(item.branch?.id || branchIds),
          branchName: getPreferredLocaleName(item.branch?.name_locales) || undefined,
          name: prodName,
          sku: item.sku_code || item.variant?.sku_code || `SKU-${item.product_id}`,
          brand: brandName,
          model: item.variant?.name || prodName,
          category: categoryName,
          categoryId: categoryId,
          categoryRel: {
            id: categoryId,
            name: categoryName,
            code: item.product_type?.code || item.category?.code || '',
          },
          brandRel: {
            id: String(item.company_info?.id || ''),
            name: brandName,
            logoUrl: formatImageUrl(item.company_info?.logo?.file_url),
          },
          description: item.description || '',
          basePrice: originalPrice > 0 ? originalPrice : currentPrice,
          unitPrice: rawPrice,
          currentPrice: currentPrice,
          promotionalPrice: promoPrice,
          availableStock: stock,
          branchStock: stock,
          totalStock: stock,
          totalAvailable: stock,
          inventoryCount: stock,
          is_available: isItemAvailable,
          isAvailable: isItemAvailable,
          images: allImages.length > 0 ? allImages : undefined,
          image: allImages[0] || undefined,
          variantGroups: variantGroups.length > 0 ? variantGroups : undefined,
          hasVariants: variantGroups.length > 0,
          variantId: item.variant?.id ? String(item.variant.id) : undefined,
          status: item.status === 'ACTIVE' ? Status.ACTIVE : Status.INACTIVE,
        };
      });

      const responsePayload = {
        result: true,
        result_code: '200',
        result_message: 'Success',
        products: mappedProducts,
        pagination: {
          page: data.body.page,
          pages: data.body.pages,
          records: data.body.records,
        },
        raw: data.body,
      };

      serverCache.set(cacheKey, responsePayload, 60);

      return NextResponse.json(responsePayload, {
        headers: {
          'X-Cache': 'MISS',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      });
    }

    return NextResponse.json({
      result: false,
      result_code: data?.code || '400',
      result_message: data?.message || 'Failed to fetch products',
      products: [],
      error_detail: data,
    }, { status: 400 });
  } catch (error: any) {
    const status = error.response?.status || 500;
    const errorData = error.response?.data || { result: false, result_message: error?.message || 'Failed to fetch products' };
    logApiError('/api/products', error, status);
    return NextResponse.json(
      errorData,
      { status }
    );
  }
}
