import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/auth/auth-provider';
// import ChatWidget from '@/components/ui/chat-widget';
import { CartProvider } from '@/context/CartContext';

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
      <body className={inter.className}>
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
          {/* <ChatWidget /> */}
        </AuthProvider>
      </body>
    </html>
  );
}