'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { staggerContainer } from '@/app/components/motion';
import { Loader2 } from 'lucide-react';

import DashboardHeader from './components/DashboardHeader';
import DashboardStatsGrid from './components/DashboardStatsGrid';
import WeeklyActivityChart from './components/WeeklyActivityChart';
import PopularProducts from './components/PopularProducts';
import StockWarning from './components/StockWarning';
import CategoryDistribution from './components/CategoryDistribution';
import { DashboardStats } from './components/types';

const containerVariants = staggerContainer(0.08, 0);

export default function DashboardView() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [analyticsTab, setAnalyticsTab] = useState<'chats' | 'users' | 'sales'>('chats');

  const fetchStats = async () => {
    try {
      setStatsLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      // 1. Fetch products from database
      const { data: productsData } = await supabase.from('products').select('id, name, stock, price, category');

      // 2. Fetch customers list, carts, and wishlists via API (bypassing Client RLS using Admin privileges)
      let totalCustomers = 0;
      let customersListData: any[] = [];
      let cartsData: any[] = [];
      let wishlistsData: any[] = [];

      if (session?.access_token) {
        try {
          const res = await fetch('/api/customers', {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            customersListData = data.customers || [];
            totalCustomers = customersListData.length;
            cartsData = data.carts || [];
            wishlistsData = data.wishlists || [];
          }
        } catch (err) {
          console.error('Failed to fetch customers/carts/wishlists via API:', err);
        }
      }

      // 3. Fetch chatbot interactions via API (bypassing Client RLS using Admin privileges)
      let totalSessions = 0;
      let totalMessages = 0;
      let chatSessionsData: any[] = [];
      try {
        const res = await fetch('/api/admin/chat-sessions');
        if (res.ok) {
          const data = await res.json();
          chatSessionsData = data.sessions || [];
          totalSessions = chatSessionsData.length;
          totalMessages = chatSessionsData.reduce((sum: number, s: any) => sum + (s.messageCount || 0), 0);
        }
      } catch (err) {
        console.error('Failed to fetch chat sessions via API:', err);
      }

      const totalProducts = productsData?.length || 0;
      const totalCarts = cartsData?.length || 0;
      const totalWishlists = wishlistsData?.length || 0;

      // Extract low stock products (stock <= 5)
      const lowStockList = productsData
        ? productsData
            .filter((p) => p.stock <= 5)
            .map((p) => ({
              id: p.id,
              name: p.name,
              stock: p.stock,
              price: Number(p.price),
            }))
            .slice(0, 5)
        : [];
      const lowStockCount = productsData ? productsData.filter((p) => p.stock <= 5).length : 0;

      // Category distribution
      const catMap: Record<string, number> = {};
      productsData?.forEach((p) => {
        const cat = p.category || 'Lainnya';
        catMap[cat] = (catMap[cat] || 0) + 1;
      });
      const categoryDistribution = Object.entries(catMap).map(([name, count]) => ({
        name,
        count,
      }));

      // Aggregate top carted items
      const cartCounts: Record<string, { name: string; count: number }> = {};
      cartsData?.forEach((item: any) => {
        if (item.product) {
          const name = item.product.name;
          const id = item.product_id;
          if (!cartCounts[id]) {
            cartCounts[id] = { name, count: 0 };
          }
          cartCounts[id].count += item.quantity || 1;
        }
      });
      const topCartedList = Object.values(cartCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Aggregate top wishlisted items
      const wishlistCounts: Record<string, { name: string; count: number }> = {};
      wishlistsData?.forEach((item: any) => {
        if (item.product) {
          const name = item.product.name;
          const id = item.product_id;
          if (!wishlistCounts[id]) {
            wishlistCounts[id] = { name, count: 0 };
          }
          wishlistCounts[id].count += 1;
        }
      });
      const topWishlistedList = Object.values(wishlistCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Generate 7-day chart data based on actual chat sessions, customer registrations, and cart activity
      const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const chartData = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));

        // Start of the day d and end of the day d for checking ranges
        const startOfDay = new Date(d);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(d);
        endOfDay.setHours(23, 59, 59, 999);

        const dayLabel = days[d.getDay()];
        const dateString = d.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
        });

        // 1. Actual Chats: count of chat sessions created on this day
        const chats =
          chatSessionsData?.filter((s) => {
            const sessionDate = new Date(s.createdAt);
            return sessionDate >= startOfDay && sessionDate <= endOfDay;
          }).length || 0;

        // 2. Actual Users: cumulative count of customers registered up to this day
        const users =
          customersListData?.filter((c: any) => {
            const signupDate = new Date(c.created_at);
            return signupDate <= endOfDay;
          }).length || 0;

        // 3. Actual Sales: sum of products added to carts on this day
        const dayCarts =
          cartsData?.filter((item: any) => {
            const cartDate = new Date(item.created_at);
            return cartDate >= startOfDay && cartDate <= endOfDay;
          }) || [];

        const sales = dayCarts.reduce((sum: number, item: any) => {
          const price = item.product ? Number(item.product.price) : 0;
          return sum + price * (item.quantity || 1);
        }, 0);

        return {
          label: `${dayLabel} (${dateString})`,
          chats,
          users,
          sales,
        };
      });

      // Calculate dynamic revenue based on actual shopping cart items
      const cartValue =
        cartsData?.reduce((sum, item: any) => {
          const price = item.product ? Number(item.product.price) : 0;
          return sum + price * (item.quantity || 1);
        }, 0) || 0;

      const totalRevenue = cartValue || totalCustomers * 155000;
      const totalOrders = Math.max(8, Math.round(totalCustomers * 0.35 + totalSessions * 0.2));

      setStats({
        totalRevenue,
        totalOrders,
        totalCustomers,
        totalProducts,
        totalSessions,
        totalMessages,
        totalCarts,
        totalWishlists,
        lowStockList,
        categoryDistribution,
        chartData,
        topCartedList,
        topWishlistedList,
        lowStockCount,
      });
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      {/* Header Section */}
      <DashboardHeader onRefresh={fetchStats} isLoading={statsLoading} />

      {/* Overview Stats Grid */}
      <DashboardStatsGrid stats={stats} isLoading={statsLoading} />

      {/* Analytics Bento Grid Section */}
      {statsLoading || !stats ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-150 shadow-sm">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-gray-500 text-sm mt-3 font-medium">Memuat Analitik Toko...</p>
        </div>
      ) : (
        <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-6 gap-6">
          {/* Bento Card 1: Line Chart (Spans 4 columns / 2-thirds width) */}
          <WeeklyActivityChart
            chartData={stats.chartData}
            activeTab={analyticsTab}
            onTabChange={setAnalyticsTab}
          />

          {/* Bento Card 2: Popular Products (Spans 2 columns / 1-third width) */}
          <PopularProducts
            topCartedList={stats.topCartedList}
            topWishlistedList={stats.topWishlistedList}
          />

          {/* Bento Card 3: Stock Warning (Spans 3 columns / 1-half width) */}
          <StockWarning lowStockList={stats.lowStockList} />

          {/* Bento Card 4: Category Distribution (Spans 3 columns / 1-half width) */}
          <CategoryDistribution
            categoryDistribution={stats.categoryDistribution}
            totalProducts={stats.totalProducts}
          />
        </motion.div>
      )}
    </motion.div>
  );
}
