'use client';

import { motion } from 'framer-motion';
import { Users, TrendingUp, MessageSquare, Package, AlertTriangle } from 'lucide-react';
import { staggerContainer, fadeInUp } from '@/app/components/motion';
import { DashboardStats } from './types';

interface DashboardStatsGridProps {
  stats: DashboardStats | null;
  isLoading: boolean;
}

const containerVariants = staggerContainer(0.08, 0);
const cardVariants = fadeInUp(0, 15);

export default function DashboardStatsGrid({ stats, isLoading }: DashboardStatsGridProps) {
  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden" 
      animate="visible" 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {/* Revenue Card (Dark Accent) */}
      <motion.div
        variants={cardVariants}
        whileHover={{ y: -4 }}
        className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md relative overflow-hidden flex flex-col justify-between h-40 hover:shadow-lg transition-all duration-200"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex justify-between items-start">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
            Pendapatan Est.
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp size={10} /> +12.4%
          </span>
        </div>
        <div>
          <h3 className="text-3xl font-extrabold tracking-tight mt-2">
            {isLoading ? (
              <span className="h-8 w-32 bg-slate-800 animate-pulse block rounded" />
            ) : (
              `Rp ${stats?.totalRevenue.toLocaleString('id-ID')}`
            )}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Berdasarkan {stats?.totalOrders || 0} pesanan simulasi
          </p>
        </div>
      </motion.div>

      {/* Customers Card */}
      <motion.div 
        variants={cardVariants} 
        whileHover={{ y: -4 }} 
        className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between h-40 hover:shadow-md transition-all duration-200"
      >
        <div className="flex justify-between items-start">
          <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">
            Total Pelanggan
          </span>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <Users size={16} />
          </div>
        </div>
        <div>
          <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {isLoading ? (
              <span className="h-8 w-24 bg-gray-100 animate-pulse block rounded" />
            ) : (
              `${stats?.totalCustomers} User`
            )}
          </h3>
          <p className="text-xs text-gray-500 mt-1">Semua pelanggan terdaftar</p>
        </div>
      </motion.div>

      {/* Chatbot Card */}
      <motion.div 
        variants={cardVariants} 
        whileHover={{ y: -4 }} 
        className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between h-40 hover:shadow-md transition-all duration-200"
      >
        <div className="flex justify-between items-start">
          <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">
            Interaksi Chatbot
          </span>
          <div className="p-2 bg-violet-50 text-violet-600 rounded-xl relative">
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-violet-500 rounded-full animate-ping" />
            <MessageSquare size={16} />
          </div>
        </div>
        <div>
          <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {isLoading ? (
              <span className="h-8 w-24 bg-gray-100 animate-pulse block rounded" />
            ) : (
              `${stats?.totalSessions} Sesi`
            )}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Total {stats?.totalMessages || 0} pesan chatbot
          </p>
        </div>
      </motion.div>

      {/* Products Catalog Card */}
      <motion.div 
        variants={cardVariants} 
        whileHover={{ y: -4 }} 
        className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between h-40 hover:shadow-md transition-all duration-200"
      >
        <div className="flex justify-between items-start">
          <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">
            Katalog Produk
          </span>
          <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
            <Package size={16} />
          </div>
        </div>
        <div>
          <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {isLoading ? (
              <span className="h-8 w-24 bg-gray-100 animate-pulse block rounded" />
            ) : (
              `${stats?.totalProducts} Item`
            )}
          </h3>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            {!isLoading && stats && stats.lowStockCount > 0 ? (
              <span className="text-red-500 font-semibold flex items-center gap-1">
                <AlertTriangle size={12} /> {stats.lowStockCount} stok menipis
              </span>
            ) : (
              <span className="text-emerald-600 font-semibold">Semua stok aman</span>
            )}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
