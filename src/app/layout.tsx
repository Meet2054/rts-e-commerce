import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/auth/auth-provider';
import { CartProvider } from '@/context/CartContext';
import LayoutShell from './LayoutShell';
// import SupportChat from '@/components/chat/support-chat';
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'B2B E-commerce Store',
  description: 'Professional B2B e-commerce platform with Firebase backend',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#F1F2F4]`}>
        <AuthProvider>
          <CartProvider>
            <LayoutShell>
              {children}  
            </LayoutShell>
           {/* <SupportChat /> */}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}