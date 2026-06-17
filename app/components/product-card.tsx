"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useShop } from "@/app/context/shop-context";
import { Heart, ShoppingBag } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image_url?: string;
  product_images?: { image_url: string }[];
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, toggleWishlist, isInWishlist } = useShop();

  // Format price in IDR
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <Link href={`/catalog/${product.id}`} className="block h-full">
      <motion.div
        whileHover={{ y: -6, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div className="bg-brand-bg rounded-md overflow-hidden shadow-xs hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 ease-in-out group flex flex-col h-full cursor-pointer relative">
          {/* Product Image Container */}
          <div className="relative aspect-square overflow-hidden bg-gray-50 border-b border-gray-100 shrink-0">
            <Image
              src={
                product.product_images?.[0]?.image_url ||
                product.image_url ||
                "https://dummyimage.com/600x600/ccc/000&text=No+Image"
              }
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              className="object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
            />
            {/* Subtle overlay gradient on hover */}
            <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-1" />

            {/* Category tag */}
            <span className="absolute top-3 left-3 inline-flex px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-brand-bg backdrop-blur-xs text-brand-text shadow-xs border border-gray-250/50 z-2">
              {product.category}
            </span>
            {/* Stock Badge */}
            {product.stock <= 5 && (
              <span className="absolute top-3 right-3 inline-flex px-2 py-0.5 rounded-md text-[8px] font-extrabold uppercase tracking-wider bg-red-500 text-white shadow-xs z-2">
                Stok Terbatas
              </span>
            )}

            {/* Wishlist Toggle Overlay */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(product);
              }}
              className="absolute bottom-3 right-3 p-2.5 rounded-full bg-white/95 backdrop-blur-xs text-gray-750 hover:bg-white active:scale-90 hover:scale-115 transition-all shadow-xs border border-gray-150 z-10 cursor-pointer"
              aria-label="Tambah ke daftar keinginan"
            >
              <Heart
                size={13}
                className={`transition-all duration-300 ${
                  isInWishlist(product.id)
                    ? "text-red-550 fill-red-500 scale-110"
                    : "text-gray-500 hover:text-red-550"
                }`}
              />
            </button>
          </div>

          {/* Details Container */}
          <div className="p-3 flex flex-col flex-1">
            <h4 className="font-bold text-gray-800 text-sm sm:text-base line-clamp-1 group-hover:text-brand-text transition-colors">
              {product.name}
            </h4>
            <p className="text-xs text-gray-500 line-clamp-2 mt-1.5 leading-relaxed flex-1">
              {product.description}
            </p>

            {/* Price & Cart quick action */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mt-5 pt-3.5 border-t border-gray-100 shrink-0 gap-2">
              <span className="font-extrabold text-gray-900 text-sm sm:text-base">
                {formatIDR(product.price)}
              </span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addToCart(product);
                }}
                disabled={product.stock <= 0}
                className="flex items-center justify-center gap-1.5 bg-gray-900 text-white hover:bg-brand-secondary hover:text-brand-text disabled:bg-gray-100 disabled:text-gray-400 px-3.5 py-2.5 sm:py-2 rounded-xl text-[10px] font-bold active:scale-95 transition-all cursor-pointer shadow-xs shrink-0 border border-transparent hover:border-gray-200 w-full sm:w-auto"
              >
                <ShoppingBag size={12} />
                <span>+ Keranjang</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
