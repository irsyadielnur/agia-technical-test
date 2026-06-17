'use client';

import { motion } from 'framer-motion';
import { FileBarChart2 } from 'lucide-react';
import { fadeInUp } from '@/app/components/motion';
import { DashboardStats } from './types';

interface CategoryDistributionProps {
  categoryDistribution: DashboardStats['categoryDistribution'];
  totalProducts: number;
}

const cardVariants = fadeInUp(0, 15);

export default function CategoryDistribution({
  categoryDistribution,
  totalProducts,
}: CategoryDistributionProps) {
  return (
    <motion.div
      variants={cardVariants}
      className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm md:col-span-3 flex flex-col justify-between hover:shadow-md transition duration-200"
    >
      <div>
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-1.5">
          <FileBarChart2 size={18} className="text-indigo-500" />
          Penyebaran Kategori
        </h2>
        <p className="text-xs text-gray-400 mb-4">Rasio kategori produk dalam katalog.</p>

        <div className="space-y-4">
          {categoryDistribution.length > 0 ? (
            categoryDistribution.map((cat, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center text-xs font-semibold text-gray-700 mb-1">
                  <span className="capitalize">{cat.name}</span>
                  <span>{cat.count} produk</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-indigo-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: totalProducts > 0 ? `${(cat.count / totalProducts) * 100}%` : '0%',
                    }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-gray-400 text-center py-6">Tidak ada kategori produk ditemukan.</div>
          )}
        </div>
      </div>

      <div className="text-[10px] text-gray-400 border-t border-gray-100 pt-3 mt-4">
        Total {totalProducts} produk dalam katalog.
      </div>
    </motion.div>
  );
}
