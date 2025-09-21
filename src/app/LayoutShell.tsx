"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/common/Header";
import ProductHeader from "@/components/common/ProductHeader";
import SubFooter from "@/components/common/SubFooter";
import Footer from "@/components/common/Footer";
import MobileHeader from "@/components/common/MobileHeader";

function HydrateClient({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  if (!hydrated) return null;
  return <>{children}</>;
}

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideLayout =
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/admin");

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 1280);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <HydrateClient>
      {!hideLayout && (
        <>
          {isMobile ? <MobileHeader /> : <Header />}
          <ProductHeader />
        </>
      )}
      {children}
      {!hideLayout && (
        <>
          <SubFooter />
          <Footer />
        </>
      )}
    </HydrateClient>
  );
}