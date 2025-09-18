"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "@/app/components/Header";
import ProductHeader from "@/app/components/ProductHeader";
import SubFooter from "@/app/components/SubFooter";
import Footer from "@/app/components/Footer";

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