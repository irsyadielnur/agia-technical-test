'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { fadeInUp } from '@/app/components/motion';
import { DashboardStats } from './types';

interface StockWarningProps {
  lowStockList: DashboardStats['lowStockList'];
}

const cardVariants = fadeInUp(0, 15);

export default function StockWarning({ lowStockList }: StockWarningProps) {
  return (
    <motion.div
      variants={cardVariants}
      className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm md:col-span-3 flex flex-col justify-between hover:shadow-md transition duration-200"
    >
      <div>
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <AlertTriangle size={18} className="text-red-500 animate-pulse" />
          Restock Diperlukan
        </h2>
        <p className="text-xs text-gray-400 mb-4">Produk dengan tingkat stok di bawah 5 item.</p>

        <div className="space-y-3">
          {lowStockList.length > 0 ? (
            lowStockList.map((prod, idx) => (
              <div
                key={prod.id}
                className="flex items-center text-xs p-2.5 rounded-xl bg-red-50/30 border border-red-100/50 hover:bg-red-50/60 hover:shadow-xs transition duration-155 gap-2.5"
              >
                <span className="text-red-550 font-extrabold text-[10px] w-5 h-5 flex items-center justify-center bg-red-100 rounded-md shrink-0">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1 pr-2">
                  <div className="text-xs font-bold text-gray-800 leading-snug line-clamp-2">
                    {prod.name}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    Harga: Rp {prod.price.toLocaleString('id-ID')}
                  </div>
                </div>
                <span className="px-2.5 py-1 text-[9px] font-extrabold bg-red-600 text-white rounded-lg shrink-0 shadow-xs">
                  Sisa: {prod.stock}
                </span>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-emerald-50/30 border border-emerald-100 rounded-2xl">
              <ShieldCheck className="w-8 h-8 text-emerald-500 mb-2" />
              <span className="text-xs font-bold text-emerald-800">Semua Produk Aman</span>
              <span className="text-[10px] text-emerald-600 mt-0.5">Stok berada di atas 5 unit.</span>
            </div>
          )}
        </div>
      </div>

      <div className="text-[10px] text-gray-400 border-t border-gray-100 pt-3 mt-4">
        Periksa halaman produk untuk restock barang.
      </div>
    </motion.div>
  );
}
