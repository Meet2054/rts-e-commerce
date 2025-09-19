
import Cart from "./components/Cart";
import RecommendedProducts from "./components/RecommendedProducts";

export default function CartPage() {
	return (
		<div className="space-y-3 bg-[#F1F2F4]">
			<Cart />
			<RecommendedProducts />
		</div>
	);
}

