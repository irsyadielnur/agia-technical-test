'use client';

import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { fadeInUp } from '@/app/components/motion';

interface DashboardHeaderProps {
  onRefresh: () => Promise<void>;
  isLoading: boolean;
}

const cardVariants = fadeInUp(0, 15);

export default function DashboardHeader({ onRefresh, isLoading }: DashboardHeaderProps) {
  return (
    <motion.header 
      variants={cardVariants} 
      className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-100 pb-5"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard Overview</h1>
        <p className="text-sm text-gray-500 mt-1">
          Selamat datang di panel admin Uneeya. Kelola toko dan chatbot Anda di sini.
        </p>
      </div>
      <div className="mt-4 md:mt-0 flex gap-2">
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-4 py-2 text-xs font-semibold bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition duration-155 cursor-pointer shadow-sm flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw 
            size={13} 
            className={`text-emerald-500 ${isLoading ? 'animate-spin' : ''}`} 
          />
          Segarkan Data
        </button>
      </div>
    </motion.header>
  );
}
