import RecommendedProducts from "../cart/components/RecommendedProducts";
import FAQs from "./components/FAQs";
import Support from "./components/support";


export default function SupportPage() {
	return (
		<div className="space-y-10 bg-[#F1F2F4]">
			<Support />
			<FAQs />
			<RecommendedProducts />
		</div>
	);
}

