'use client';

import { BankerCartView } from '@/components/banker/BankerCartView';
import { useSearchParams } from 'next/navigation';
import React, { Suspense } from 'react';

function CheckoutPageContent() {
  const searchParams = useSearchParams();
  const backUrl = searchParams.get('backUrl') || '/';

  return (
    <div className="min-h-screen bg-[#FDFEFE] dark:bg-[#0B0F17] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <BankerCartView
          isPublicCheckout={true}
          title="Direct Showroom Checkout & Financing"
          subtitle="Review selected showroom items, select your assigned District Banker, and generate an instantaneous stock-reservation verification QR token."
          backUrl={backUrl}
          backLabel="Back to Catalog"
        />
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFEFE] dark:bg-[#0B0F17] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  );
}
