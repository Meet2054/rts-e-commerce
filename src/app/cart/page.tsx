import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";
import ProductHeader from "@/app/components/ProductHeader";
import SubFooter from "@/app/components/SubFooter";


export default function Cart() {

  return (
    <div className="space-y-3 bg-[#F1F2F4]">
      <Header />
      <ProductHeader />
      <SubFooter />
      <Footer />
    </div>
  );
}
