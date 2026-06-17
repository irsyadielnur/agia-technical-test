'use client';

import { motion } from 'framer-motion';
import { Heart, ShoppingCart } from 'lucide-react';
import { fadeInUp } from '@/app/components/motion';
import { DashboardStats } from './types';

interface PopularProductsProps {
  topCartedList: DashboardStats['topCartedList'];
  topWishlistedList: DashboardStats['topWishlistedList'];
}

const cardVariants = fadeInUp(0, 15);

export default function PopularProducts({ topCartedList, topWishlistedList }: PopularProductsProps) {
  return (
    <motion.div
      variants={cardVariants}
      className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm md:col-span-2 flex flex-col justify-between hover:shadow-md transition duration-200"
    >
      <div>
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-1.5">
          <Heart size={18} className="text-red-500 fill-red-500" />
          Aktivitas & Favorit
        </h2>
        <p className="text-xs text-gray-400 mb-5">Daftar produk paling diminati di Supabase.</p>

        <div className="space-y-5">
          {/* Cart Favorites */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShoppingCart size={11} /> Paling Banyak di Keranjang
            </h3>
            <div className="space-y-2 h-33.5 overflow-y-auto scrollbar-none pr-1">
              {topCartedList && topCartedList.length > 0 ? (
                topCartedList.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center text-xs p-2.5 rounded-xl bg-gray-50 border border-gray-100/80 hover:bg-gray-100/50 hover:shadow-xs transition duration-155 gap-2.5"
                  >
                    <span className="text-slate-400 font-extrabold text-[10px] w-4 shrink-0 text-center bg-gray-100 rounded-md py-0.5">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-gray-800 flex-1 leading-snug line-clamp-2">
                      {item.name}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-extrabold text-[9px] shrink-0">
                      {item.count} unit
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-gray-400 italic py-1">Belum ada barang di keranjang.</div>
              )}
            </div>
          </div>

          {/* Wishlist Favorites */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Heart size={11} /> Paling Banyak di Wishlist
            </h3>
            <div className="space-y-2 h-33.5 overflow-y-auto scrollbar-none pr-1">
              {topWishlistedList && topWishlistedList.length > 0 ? (
                topWishlistedList.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center text-xs p-2.5 rounded-xl bg-gray-50 border border-gray-100/80 hover:bg-gray-100/50 hover:shadow-xs transition duration-155 gap-2.5"
                  >
                    <span className="text-slate-400 font-extrabold text-[10px] w-4 shrink-0 text-center bg-gray-100 rounded-md py-0.5">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-gray-800 flex-1 leading-snug line-clamp-2">
                      {item.name}
                    </span>
                    <span className="px-2 py-1 rounded-lg bg-red-50 text-red-650 border border-red-100 font-extrabold text-[9px] flex items-center gap-1 shrink-0">
                      <Heart size={9} className="fill-red-500 text-red-500" /> {item.count}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-gray-400 italic py-1">Belum ada barang di wishlist.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="text-[10px] text-gray-400 border-t border-gray-100 pt-3 mt-4">
        Terintegrasi dengan keranjang & wishlist.
      </div>
    </motion.div>
  );
}
