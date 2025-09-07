import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";
import ProductHeader from "@/app/components/ProductHeader";
import SubFooter from "@/app/components/SubFooter";
import ProductDetails from "../components/ProductDetail";
import { products } from "../../components/data";
import SimilarProducts from "../components/SimilarProducts";

export default async function ProductDescriptionPage({ params }: { params: { slug: string }}) {
  const awaitedParams = await params;
  const product = products.find((p) => p.sku === awaitedParams.slug);
  if (!product) return null;
  const related = products.filter((p) => p.brand === product.brand && p.sku !== product.sku).slice(0, 2);

  return (
    <div className="space-y-3 bg-[#F1F2F4]">
      <Header />
      <ProductHeader />
      <ProductDetails product={product} related={related} />
      <SimilarProducts product={product} products={products} />
      <SubFooter />
      <Footer />
    </div>
  );
}
