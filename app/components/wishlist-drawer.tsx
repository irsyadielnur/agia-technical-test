"use client";

import { useShop } from "@/app/context/shop-context";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Heart, ShoppingBag } from "lucide-react";
import Image from "next/image";

export default function WishlistDrawer() {
  const {
    wishlist,
    isWishlistOpen,
    setIsWishlistOpen,
    toggleWishlist,
    addToCart,
  } = useShop();

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const handleAddToCart = (product: any) => {
    addToCart(product);
  };

  return (
    <AnimatePresence>
      {isWishlistOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsWishlistOpen(false)}
            className="fixed inset-0 bg-black z-50 backdrop-blur-xs cursor-pointer"
          />

          {/* Drawer Panel */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-96 max-w-[90vw] bg-white z-50 shadow-2xl border-l border-gray-150 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500 fill-red-500 animate-pulse" />
                <span className="font-bold text-gray-900 text-base">Daftar Keinginan</span>
                <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100">
                  {wishlist.length}
                </span>
              </div>
              <button
                onClick={() => setIsWishlistOpen(false)}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-655 hover:bg-gray-50 active:scale-95 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Wishlist Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#fcfcf0]/20">
              {wishlist.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="p-4 bg-gray-50 border border-gray-100 text-gray-400 rounded-full">
                    <Heart size={32} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm">Daftar Keinginan Kosong</h3>
                    <p className="text-gray-400 text-xs mt-1 max-w-[200px] mx-auto leading-relaxed">
                      Belum ada produk yang Anda simpan di daftar keinginan.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsWishlistOpen(false)}
                    className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-gray-800 transition-all active:scale-[0.98] cursor-pointer shadow-xs"
                  >
                    Cari Produk
                  </button>
                </div>
              ) : (
                wishlist.map((product) => (
                  <div
                    key={product.id}
                    className="flex gap-3 bg-white p-3 rounded-2xl border border-gray-150 shadow-inner group"
                  >
                    {/* Image Preview */}
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-100 bg-gray-55 shrink-0">
                      <Image
                        src={
                          product.product_images?.[0]?.image_url ||
                          product.image_url ||
                          "https://dummyimage.com/150x150/ccc/000&text=No+Image"
                        }
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-gray-850 text-xs truncate group-hover:text-gray-955 transition-colors">
                            {product.name}
                          </h4>
                          <span className="text-[10px] text-gray-400 font-medium capitalize mt-0.5 block">
                            {product.category}
                          </span>
                        </div>
                        <button
                          onClick={() => toggleWishlist(product)}
                          className="text-gray-450 hover:text-red-500 p-0.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                          title="Hapus dari daftar keinginan"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div className="flex justify-between items-center mt-1.5 gap-4">
                        <span className="font-bold text-gray-900 text-[11px] shrink-0">
                          {formatIDR(product.price)}
                        </span>

                        {/* Add to Cart quick button */}
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock <= 0}
                          className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white disabled:bg-gray-100 disabled:text-gray-400 px-3 py-1.5 rounded-lg text-[10px] font-bold active:scale-[0.98] transition-all cursor-pointer shrink-0"
                        >
                          <ShoppingBag size={11} />
                          <span>+ Keranjang</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
