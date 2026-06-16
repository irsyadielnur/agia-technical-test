"use client";

import { useShop, Product } from "@/app/context/shop-context";
import { Heart, ShoppingBag, Send } from "lucide-react";

interface ProductActionsProps {
  product: Product;
}

export default function ProductActions({ product }: ProductActionsProps) {
  const { addToCart, toggleWishlist, isInWishlist } = useShop();

  return (
    <div className="space-y-4 w-full">
      <div className="flex gap-3 items-center w-full">
        {/* Add to Cart button */}
        <button
          onClick={() => addToCart(product)}
          disabled={product.stock <= 0}
          className="flex-1 flex items-center justify-center gap-2 border-2 border-gray-900 text-gray-900 bg-white hover:bg-gray-50 py-3.5 rounded-2xl font-bold transition-all duration-300 active:scale-[0.98] cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200"
        >
          <ShoppingBag size={18} />
          <span>+ Keranjang</span>
        </button>

        {/* Wishlist toggle button */}
        <button
          onClick={() => toggleWishlist(product)}
          className="p-3.5 rounded-2xl border-2 border-gray-200 bg-white hover:bg-gray-50 active:scale-[0.98] transition-all cursor-pointer shadow-sm hover:border-gray-900"
          aria-label="Toggle Wishlist"
        >
          <Heart
            size={18}
            className={
              isInWishlist(product.id)
                ? "text-red-500 fill-red-500 animate-pulse"
                : "text-gray-650"
            }
          />
        </button>
      </div>
    </div>
  );
}
