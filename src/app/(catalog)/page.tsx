'use client';

import React, { Suspense } from 'react';
import { BankerCatalogContent } from '@/components/catalog';

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFEFE] dark:bg-[#0B0F17] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <BankerCatalogContent />
    </Suspense>
  );
}
