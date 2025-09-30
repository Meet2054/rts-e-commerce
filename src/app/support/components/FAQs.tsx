'use client';
import React from 'react';

const faqs = [
	{
		section: 'Ordering & Payment',
		items: [
			{
				q: 'Do I need to pay online?',
				a: 'No. When you place an order request, our team will contact you directly to confirm and arrange payment.',
			},
			{
				q: 'Can I change my order after submitting?',
				a: 'Yes, you can contact our customer care team within 24 hours to make changes.',
			},
			{
				q: 'Will I get a confirmation after placing my order?',
				a: "Yes, you'll receive a confirmation message/email after submitting your order request.",
			},
		],
	},
	{
		section: 'Products',
		items: [
			{
				q: 'How can I find the right cartridge for my printer?',
				a: 'You can use our search and filter options by brand/model, or contact our customer care for quick assistance.',
			},
			{
				q: 'Do you sell original cartridges or compatible ones?',
				a: 'We sell 100% original cartridges. Compatible/refill options are also available for some models (clearly marked).',
			},
			{
				q: "Do your printers come with a warranty?",
				a: "Yes, all printers come with the official manufacturer's warranty.",
			},
		],
	},
	{
		section: 'Shipping & Delivery',
		items: [
			{
				q: 'How long does delivery take?',
				a: 'Usually 2-5 business days, depending on your location.',
			},
			{
				q: 'Do you offer free shipping?',
				a: 'Yes, free shipping is available on orders above $1,000.',
			},
			{
				q: 'Do you deliver across India?',
				a: 'Yes, we deliver to most pin codes in India.',
			},
		],
	},
	{
		section: 'Returns & Support',
		items: [
			{
				q: "Can I return a cartridge or printer if it doesn't work?",
				a: 'Yes, defective products can be returned/replaced as per our return policy. Please contact customer care within 7 days of delivery.',
			},
			{
				q: 'What if I receive the wrong product?',
				a: "Please inform us immediately. We'll arrange a replacement at no extra cost.",
			},
			{
				q: 'How do I contact support if I face an issue?',
				a: 'You can reach us via phone, email, or WhatsApp from our Customer Care page.',
			},
		],
	},
];

export default function FAQs() {
	return (
		<section className="py-10">
			<div className="max-w-[1550px] mx-auto px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16">
				<h2 className="text-3xl font-bold text-gray-900 mb-8">FAQs</h2>
				<div className="space-y-6">
					{faqs.map(section => (
						<div key={section.section}>
							<div className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-widest">
								{section.section}
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{section.items.map((item, idx) => (
									<div
										key={section.section + idx}
										className="bg-white rounded-lg shadow-sm p-5 flex flex-col gap-2"
									>
										<div className="font-semibold text-base text-black">
											{item.q}
										</div>
										<div className="text-gray-600 text-sm">
											{item.a}
										</div>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
