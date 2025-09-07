import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";
import ProductHeader from "@/app/components/ProductHeader";
import SubFooter from "@/app/components/SubFooter";
import Cart from "./components/Cart";
import RecommendedProducts from "./components/RecommendedProducts";

export default function CartPage() {
	return (
		<div className="space-y-3 bg-[#F1F2F4]">
			<Header />
			<ProductHeader />
			<Cart />
			<RecommendedProducts />
			<SubFooter />
			<Footer />
		</div>
	);
}

