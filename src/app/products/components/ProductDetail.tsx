
"use client";

import Image from "next/image";
import ProductImage from "../../../../public/product.png"
import Link from "next/link";
import React, { useState } from "react";
import { useCartActions } from "@/hooks/use-cart";
import { Loader2, Plus, Minus } from 'lucide-react';

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
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  const { addToCart } = useCartActions();

  // Handle add to cart
  const handleAddToCart = async () => {
    try {
      setIsAddingToCart(true);
      
      await addToCart({
        id: product.sku, // Use SKU as ID for consistency
        sku: product.sku,
        name: product.name,
        image: ProductImage.src,
        price: product.price,
        brand: product.brand,
        category: product.category
      }, quantity);
      
      // Reset quantity after successful add
      setQuantity(1);
      
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Gallery images (mock: repeat main image)
  const gallery = [ProductImage , ProductImage, ProductImage, ProductImage];

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
                    <Image src={ProductImage} alt={product.name} width={100} height={50} className="object-contain" />
                </button>
                ))}
            </div>

            <div className="flex flex-col gap-5">
                {/* Main image */}
                <div className="bg-white rounded-md p-4 flex-1 flex justify-center">
                    <Image src={gallery[selectedImg]} alt={product.name} width={650} height={500} className="rounded-md" />
                </div>

                {/* Gallery info */}
                <div className="grid grid-cols-2 gap-2 justify-center">
                    <div className="flex items-center justify-center col-span-2 md:col-span-1 gap-2 text-xs font-medium bg-white rounded py-2.5">
                    <span>🚚</span> Free shipping worldwide
                    </div>
                    <div className="flex items-center justify-center col-span-2 md:col-span-1 gap-2 text-xs font-medium bg-white rounded py-2.5">
                    <span>🔒</span> 100% Secured Payment
                    </div>
                    <div className="flex items-center justify-center col-span-2 gap-2 text-xs font-medium bg-white rounded py-2.5">
                    <span>👨‍🔧</span> Made by the Professionals
                    </div>
                </div>
            </div>
        </div>

        {/* Product Info */}
        <div className="w-full lg:w-2/5">
        <div className="w-full max-w-sm flex flex-col gap-3">     
          <h1 className="text-2xl sm:text-3xl font-bold text-black mt-4 mb-2">{product.name}</h1>
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
            <div className="font-semibold mb-1">Quantity:</div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="px-3 py-2 cursor-pointer border rounded-md bg-white hover:bg-[#F7941F] disabled:opacity-50"
              >
                <Minus size={16} />
              </button>
              <span className="px-4 py-1 bg-white border rounded-md min-w-[3rem] text-center">{quantity}</span>
              <button 
                onClick={() => setQuantity(Math.min(100, quantity + 1))}
                disabled={quantity >= 100}
                className="px-3 py-2 cursor-pointer border rounded-md bg-white hover:bg-[#F7941F] disabled:opacity-50"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          <div className="mb-2">
            <div className="font-semibold mb-1">Colors:</div>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button key={c} className={`w-6 h-6 rounded border-2 ${selectedColor === c ? "border-blue-600" : "border-gray-300"}`} style={{ background: c }} onClick={() => setSelectedColor(c)} />
              ))}
            </div>
          </div>
          <div className="flex flex-col w-full gap-3 mt-4">
            <button 
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className="bg-white text-black px-6 py-2 rounded-md text-base border hover:bg-[#F7941F] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isAddingToCart ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding to Cart...
                </>
              ) : (
                `Add to Cart`
              )}
            </button>
            <button className="bg-black text-white px-6 py-2 rounded-md text-base hover:bg-gray-800">
              Buy Now
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* Tabs and Related Products in 2/3 and 1/3 layout */}
      <div className="mt-10 flex flex-col lg:flex-row gap-20">
        {/* Tabs */}
        <div className="w-full lg:w-3/5">
          <div className="flex gap-6 border-b mb-4">
            {["Description", "Support"].map((t) => (
              <button key={t} className={`py-2 px-4 font-semibold text-base border-b-2 ${tab === t.toLowerCase() ? "border-black text-black" : "border-transparent text-gray-500"}`} onClick={() => setTab(t.toLowerCase())}>{t}</button>
            ))}
          </div>
          <div className="rounded-lg p-4">
          {tab === "description" && (
            <div className="">
              <div className="text-sm text-gray-500">OEM: {product.oem} ({product.oemPN})</div>
              <div className="text-sm text-gray-500">Katun PN: {product.katunPN}</div>
              <div className="text-sm text-gray-500">Comments: {product.comments}</div>
              <div className="text-sm text-gray-500">For Use In: {product.forUseIn}</div>
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
          <div className="text-xl font-bold text-black mb-4">
            Related Products
          </div>
          <div className="grid grid-cols-1 gap-5">
            {related.slice(0, 2).map((rp) => (
              <div key={rp.sku} className="bg-white rounded-lg shadow-sm p-4 flex flex-col">
                <div className="flex gap-4 items-center">
                  <Image src={ProductImage} alt={rp.name} width={300} height={80} className="object-contain rounded" />
                  <div className="flex flex-col flex-1">
                    <div className="font-semibold text-base text-black">{rp.name}</div>
                    <div className="text-lg font-bold text-black mt-1">${rp.price}</div>
                    <div className="flex flex-col w-full gap-2 mt-4">
                      <Link href={`/products/${rp.sku}`} className="bg-gray-200 text-black px-4 py-1.5 rounded-md text-base text-center">Add to cart</Link>
                      <Link href={`/products/${rp.sku}`} className="bg-black text-white px-4 py-1.5 rounded-md text-base text-center">Buy Now</Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white mt-3 text-center rounded-md py-2">
            <Link href="/products" className="text-black font-semibold hover:underline">View more</Link>
          </div>
        </div>
      </div>
    </div>
  );
}