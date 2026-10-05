import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/lib/theme-context';
import { AuthProvider } from '@/lib/auth-context';
import { CartProvider } from '@/lib/cart-context';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Branch Catalog & District Banker Financing Portal | Romlus',
  description: 'Verified showroom branch electronics catalog, real-time inventory levels, custom banker loan terms, and QR code financing.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <main className="min-h-screen bg-white dark:bg-[#070b14] text-[#111111] dark:text-slate-100 antialiased selection:bg-brand selection:text-slate-950 transition-colors duration-200">
                {children}
              </main>
              <Toaster position="top-right" duration={2000} richColors closeButton />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
