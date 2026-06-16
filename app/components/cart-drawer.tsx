"use client";

import { useShop } from "@/app/context/shop-context";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useShop();

  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    let itemsText = "";
    cart.forEach((item, index) => {
      const itemSubtotal = item.product.price * item.quantity;
      itemsText += `${index + 1}. *${item.product.name}* (${item.quantity}x) - ${formatIDR(item.product.price)}${
        item.quantity > 1 ? ` (Subtotal: ${formatIDR(itemSubtotal)})` : ""
      }\n`;
    });
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
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
                <ShoppingBag className="w-5 h-5 text-gray-850" />
                <span className="font-bold text-gray-900 text-base">
                  Keranjang Belanja
                </span>
                <span className="text-[10px] font-bold bg-brand-secondary/15 text-gray-900 px-2 py-0.5 rounded-full">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-650 hover:bg-gray-50 active:scale-95 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#fcfcf0]/20">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="p-4 bg-gray-50 border border-gray-100 text-gray-400 rounded-full">
                    <ShoppingBag size={32} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm">
                      Keranjang Anda Kosong
                    </h3>
                    <p className="text-gray-400 text-xs mt-1 max-w-[200px] mx-auto leading-relaxed">
                      Belum ada produk yang ditambahkan ke keranjang belanja
                      Anda.
                    </p>
                  </div>
                  <Link
                    href="/catalog"
                    onClick={() => setIsCartOpen(false)}
                    className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-gray-800 transition-all active:scale-[0.98] cursor-pointer shadow-xs"
                  >
                    Mulai Belanja
                  </Link>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex gap-3 bg-white p-3 rounded-2xl border border-gray-150 shadow-inner group"
                  >
                    {/* Image Preview */}
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shrink-0">
                      <Image
                        src={
                          item.product.product_images?.[0]?.image_url ||
                          item.product.image_url ||
                          "https://dummyimage.com/150x150/ccc/000&text=No+Image"
                        }
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-gray-850 text-xs truncate group-hover:text-gray-950 transition-colors">
                            {item.product.name}
                          </h4>
                          <span className="text-[10px] text-gray-400 font-medium capitalize mt-0.5 block">
                            {item.product.category}
                          </span>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-gray-400 hover:text-red-500 p-0.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                          title="Hapus barang"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div className="flex justify-between items-center mt-1.5">
                        <span className="font-bold text-gray-900 text-[11px]">
                          {formatIDR(item.product.price)}
                        </span>

                        {/* Quantity controls */}
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50/50 shrink-0">
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity - 1)
                            }
                            className="p-1 hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="px-2 text-xs font-bold text-gray-800 text-center min-w-[20px]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity + 1)
                            }
                            className="p-1 hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary (if not empty) */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-gray-100 space-y-4 shrink-0 bg-white shadow-lg">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-medium">Subtotal</span>
                  <span className="font-black text-gray-900 text-base">
                    {formatIDR(subtotal)}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  *Pesanan Anda akan dikirimkan sebagai ringkasan belanja ke
                  WhatsApp admin UNEEYA untuk proses penyelesaian.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={clearCart}
                    className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-655 py-3 rounded-xl font-bold text-xs active:scale-[0.98] transition-all cursor-pointer text-center"
                  >
                    Kosongkan
                  </button>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
