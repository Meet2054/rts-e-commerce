"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/common/Header";
import ProductHeader from "@/components/common/ProductHeader";
import SubFooter from "@/components/common/SubFooter";
import Footer from "@/components/common/Footer";

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
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/admin");

  return (
    <HydrateClient>
      {!hideLayout && (
        <>
          <Header />
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