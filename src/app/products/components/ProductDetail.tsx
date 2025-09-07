
"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";

const COLORS = ["#2D9CDB", "#27AE60", "#F2994A", "#EB5757", "#4F4F4F"];

interface Product {
  image: string;
  name: string;
  rating: number;
  reviews: number;
  category: string;
  brand: string;
  price: number;
  description: string;
  sku: string;
  oem: string;
  oemPN: string;
  katunPN: string;
  comments: string;
  forUseIn: string;
}

interface RelatedProduct {
  sku: string;
  image: string;
  name: string;
  rating: number;
  reviews: number;
  price: number;
}

export default function ProductDetail({ product, related }: { product: Product, related: RelatedProduct[] }) {
  const [selectedImg, setSelectedImg] = useState(0);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [tab, setTab] = useState("description");

  // Gallery images (mock: repeat main image)
  const gallery = [product.image, product.image, product.image, product.image];

  return (
    <div className="max-w-[1550px] mx-auto px-4 sm:px-12 lg:px-16 py-2">
      {/* Back button and page path */}
      <div className="mb-6 flex items-center gap-2 text-black text-sm">
        <Link href="/products" className="flex items-center gap-4">
          <span className="inline-block text-xl">← </span>
          Home {" > "} Products {" > "}
        </Link>
        <span className="text-black font-semibold">{product.name}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-20 py-6">
        {/* Gallery */}
        <div className="flex flex-row gap-4 w-full lg:w-3/5 items-start">
            <div className="flex flex-col gap-4">
                {gallery.map((img, i) => (
                <button
                    key={i}
                    onClick={() => setSelectedImg(i)}
                    className={`border bg-white rounded-md p-1 ${selectedImg === i ? "border-black" : ""}`}
                >
                    <Image src={img} alt={product.name} width={100} height={50} className="object-contain" />
                </button>
                ))}
            </div>

            <div className="flex flex-col gap-4">
                {/* Main image */}
                <div className="bg-white rounded-md p-4 flex-1 flex justify-center">
                    <Image src={gallery[selectedImg]} alt={product.name} width={650} height={500} className="rounded-md" />
                </div>

                {/* Gallery info */}
                <div className="grid grid-cols-2 gap-4 justify-center">
                    <div className="flex items-center justify-center col-span-1 gap-2 text-xs font-medium bg-white rounded py-2.5">
                    <span>🚚</span> Free shipping worldwide
                    </div>
                    <div className="flex items-center justify-center col-span-1 gap-2 text-xs font-medium bg-white rounded py-2.5">
                    <span>🔒</span> 100% Secured Payment
                    </div>
                    <div className="flex items-center justify-center col-span-2 gap-2 text-xs font-medium bg-white rounded py-2.5">
                    <span>👨‍🔧</span> Made by the Professionals
                    </div>
                </div>
            </div>
        </div>

        {/* Product Info */}
        <div className="w-full lg:w-2/5 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-yellow-500 text-base font-semibold">
            {"★".repeat(Math.floor(product.rating))}
            <span className="text-gray-600 font-normal">{product.reviews} Reviews</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">{product.name}</h1>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl font-bold text-black">${product.price}</span>
            <span className="text-lg line-through text-gray-400">${(product.price * 1.33).toFixed(0)}</span>
          </div>
          <div className="text-green-600 text-sm mb-2">You save an extra 25% for being our valued existing customer.</div>
          <div className="mb-2">
            <div className="font-semibold mb-1">Features:</div>
            <ul className="list-disc ml-5 text-gray-700 text-sm space-y-1">
              <li>Fast printing up to 40 pages per minute</li>
              <li>Compact design, perfect for offices</li>
              <li>Energy-efficient with auto on/off</li>
              <li>Quality assured by RTS Imaging</li>
            </ul>
          </div>
          <div className="mb-2">
            <div className="font-semibold mb-1">Colors:</div>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button key={c} className={`w-6 h-6 rounded border-2 ${selectedColor === c ? "border-blue-600" : "border-gray-300"}`} style={{ background: c }} onClick={() => setSelectedColor(c)} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button className="bg-black text-white px-6 py-2 rounded-md text-lg">Add to cart</button>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-md text-lg">Buy Now</button>
          </div>
        </div>
      </div>

      {/* Tabs and Related Products in 2/3 and 1/3 layout */}
      <div className="mt-10 flex flex-col lg:flex-row gap-8">
        {/* Tabs */}
        <div className="w-full lg:w-3/5">
          <div className="flex gap-6 border-b mb-4">
            {["Description", "Specifications", "Support"].map((t) => (
              <button key={t} className={`py-2 px-4 font-semibold text-base border-b-2 ${tab === t.toLowerCase() ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`} onClick={() => setTab(t.toLowerCase())}>{t}</button>
            ))}
          </div>
          <div className="bg-white rounded-lg p-6 min-h-[120px]">
          {tab === "description" && (
            <div>
              <div className="text-sm text-gray-500">OEM: {product.oem} ({product.oemPN})</div>
              <div className="text-sm text-gray-500">Katun PN: {product.katunPN}</div>
              <div className="text-sm text-gray-500">Comments: {product.comments}</div>
              <div className="text-sm text-gray-500">For Use In: {product.forUseIn}</div>
            </div>
          )}
            {tab === "specifications" && (
              <div>
                <div className="font-semibold mb-2">General</div>
                <ul className="list-disc ml-5 text-gray-700 text-sm space-y-1">
                  <li>Printer Type: Monochrome Laser Printer</li>
                  <li>Function: Print only</li>
                  <li>Ideal For: Small to medium businesses, workgroups</li>
                </ul>
                <div className="font-semibold mt-4 mb-2">Print Performance</div>
                <ul className="list-disc ml-5 text-gray-700 text-sm space-y-1">
                  <li>Print Speed: Up to 40 ppm (A4)</li>
                  <li>First Page Out: As fast as 6.3 seconds</li>
                  <li>Print Resolution: 1200 x 1200 dpi</li>
                  <li>Monthly Duty Cycle: Up to 80,000 pages</li>
                  <li>Recommended Monthly Volume: 750 – 4,000 pages</li>
                </ul>
                <div className="font-semibold mt-4 mb-2">Paper Handling</div>
                <ul className="list-disc ml-5 text-gray-700 text-sm space-y-1">
                  <li>Input Capacity: 250-sheet input tray</li>
                  <li>100-sheet multipurpose tray</li>
                  <li>Optional 550-sheet input tray (expandable)</li>
                  <li>Output Capacity: 150-sheet output bin</li>
                </ul>
                <div className="font-semibold mt-4 mb-2">Automatic Duplex Printing: Yes</div>
                <div className="font-semibold mt-4 mb-2">Media Sizes Supported:</div>
                <ul className="list-disc ml-5 text-gray-700 text-sm space-y-1">
                  <li>A4, A5, A6, B5 (JIS), envelopes, custom sizes (76 × 127 mm to 216 × 356 mm)</li>
                </ul>
                <div className="font-semibold mt-4 mb-2">Media Types Supported:</div>
                <ul className="list-disc ml-5 text-gray-700 text-sm space-y-1">
                  <li>Plain paper, EcoFFICIENT, light, heavy, bond, card stock, envelopes, labels</li>
                </ul>
                <div className="font-semibold mt-4 mb-2">Connectivity:</div>
                <ul className="list-disc ml-5 text-gray-700 text-sm space-y-1">
                  <li>Standard: USB 2.0, Ethernet 10/100/1000Base-T network</li>
                  <li>Optional: Wireless via external accessory (not built-in Wi-Fi)</li>
                </ul>
              </div>
            )}
            {tab === "support" && (
              <div>
                <div className="text-gray-700">For support, please contact our customer service or visit our help center.</div>
              </div>
            )}
          </div>
        </div>
        {/* Related Products */}
        <div className="w-full lg:w-2/5">
          <div className="text-xl font-bold mb-4 text-black">Related Products</div>
          <div className="grid grid-cols-1 gap-6">
            {related.map((rp) => (
              <div key={rp.sku} className="bg-white rounded-lg shadow-sm p-4 flex flex-col">
                <div className="flex gap-3 items-center">
                  <Image src={rp.image} alt={rp.name} width={100} height={80} className="object-contain rounded" />
                  <div>
                    <div className="font-semibold text-base text-black">{rp.name}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">{"★".repeat(Math.floor(rp.rating))}<span>{rp.reviews} Reviews</span></div>
                    <div className="text-lg font-bold text-black mt-1">${rp.price}</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Link href={`/products/${rp.sku}`} className="bg-black text-white px-4 py-1.5 rounded-md text-base text-center">Add to cart</Link>
                  <Link href={`/products/${rp.sku}`} className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-base text-center">Buy Now</Link>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-right">
            <Link href="/products" className="text-blue-600 font-semibold hover:underline">View more</Link>
          </div>
        </div>
      </div>
    </div>
  );
}