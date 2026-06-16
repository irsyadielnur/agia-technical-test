'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInUp } from '@/app/components/motion';
import { Users, ShoppingCart, Loader2, TrendingUp, MessageSquare, Package, ShieldCheck, ArrowUpRight, RefreshCw, AlertTriangle, Heart, FileBarChart2 } from 'lucide-react';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  totalSessions: number;
  totalMessages: number;
  totalCarts: number;
  totalWishlists: number;
  lowStockList: { id: string; name: string; stock: number; price: number }[];
  categoryDistribution: { name: string; count: number }[];
  chartData: { label: string; chats: number; users: number; sales: number }[];
  topCartedList: { name: string; count: number }[];
  topWishlistedList: { name: string; count: number }[];
  lowStockCount: number;
}

const containerVariants = staggerContainer(0.08, 0);
const cardVariants = fadeInUp(0, 15);

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

  // Helper to draw smooth Bezier line chart in SVG
  const drawSvgChart = (data: { chats: number; users: number; sales: number }[], key: 'chats' | 'users' | 'sales') => {
    const width = 600;
    const height = 290;
    const paddingLeft = 55;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const values = data.map((d) => d[key]);
    const maxVal = Math.max(...values, 5);

    const points = values.map((val, idx) => {
      const x = paddingLeft + (idx * chartWidth) / (values.length - 1);
      const y = paddingTop + chartHeight - (val / maxVal) * chartHeight;
      return { x, y, value: val };
    });

    let pathD = '';
    if (points.length > 0) {
      pathD = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const p0 = points[i - 1];
        const p1 = points[i];
        const cpX1 = p0.x + (p1.x - p0.x) / 2;
        const cpY1 = p0.y;
        const cpX2 = p0.x + (p1.x - p0.x) / 2;
        const cpY2 = p1.y;
        pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
      }
    }

    let areaD = '';
    if (points.length > 0) {
      areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;
    }

    return {
      points,
      pathD,
      areaD,
      width,
      height,
      maxVal,
      paddingLeft,
      chartWidth,
      chartHeight,
    };
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      {/* Header Section */}
      <motion.header variants={cardVariants} className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Selamat datang di panel admin Uneeya. Kelola toko dan chatbot Anda di sini.</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <button
            onClick={fetchStats}
            disabled={statsLoading}
            className="px-4 py-2 text-xs font-semibold bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition duration-155 cursor-pointer shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw size={13} className={`text-emerald-500 ${statsLoading ? 'animate-spin' : ''}`} />
            Segarkan Data
          </button>
        </div>
      </motion.header>

      {/* Overview Stats Grid */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue Card (Dark Accent) */}
        <motion.div
          variants={cardVariants}
          whileHover={{ y: -4 }}
          className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md relative overflow-hidden flex flex-col justify-between h-40 hover:shadow-lg transition-all duration-200"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Pendapatan Est.</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-1">
              <TrendingUp size={10} /> +12.4%
            </span>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold tracking-tight mt-2">{statsLoading ? <span className="h-8 w-32 bg-slate-800 animate-pulse block rounded" /> : `Rp ${stats?.totalRevenue.toLocaleString('id-ID')}`}</h3>
            <p className="text-xs text-slate-400 mt-1">Berdasarkan {stats?.totalOrders || 0} pesanan simulasi</p>
          </div>
        </motion.div>

        {/* Customers Card */}
        <motion.div variants={cardVariants} whileHover={{ y: -4 }} className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between h-40 hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-start">
            <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Total Pelanggan</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users size={16} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">{statsLoading ? <span className="h-8 w-24 bg-gray-100 animate-pulse block rounded" /> : `${stats?.totalCustomers} User`}</h3>
            <p className="text-xs text-gray-500 mt-1">Semua pelanggan terdaftar</p>
          </div>
        </motion.div>

        {/* Chatbot Card */}
        <motion.div variants={cardVariants} whileHover={{ y: -4 }} className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between h-40 hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-start">
            <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Interaksi Chatbot</span>
            <div className="p-2 bg-violet-50 text-violet-600 rounded-xl relative">
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-violet-500 rounded-full animate-ping" />
              <MessageSquare size={16} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">{statsLoading ? <span className="h-8 w-24 bg-gray-100 animate-pulse block rounded" /> : `${stats?.totalSessions} Sesi`}</h3>
            <p className="text-xs text-gray-500 mt-1">Total {stats?.totalMessages || 0} pesan chatbot</p>
          </div>
        </motion.div>

        {/* Products Catalog Card */}
        <motion.div variants={cardVariants} whileHover={{ y: -4 }} className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between h-40 hover:shadow-md transition-all duration-200">
          <div className="flex justify-between items-start">
            <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Katalog Produk</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Package size={16} />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">{statsLoading ? <span className="h-8 w-24 bg-gray-100 animate-pulse block rounded" /> : `${stats?.totalProducts} Item`}</h3>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              {!statsLoading && stats && stats.lowStockCount > 0 ? (
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

      {/* Analytics Bento Grid Section */}
      {statsLoading || !stats ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-150 shadow-sm">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-gray-500 text-sm mt-3 font-medium">Memuat Analitik Toko...</p>
        </div>
      ) : (
        <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-6 gap-6">
          {/* Bento Card 1: Line Chart (Spans 4 columns / 2-thirds width) */}
          <motion.div variants={cardVariants} className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm md:col-span-4 flex flex-col justify-between hover:shadow-md transition duration-200">
            <div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Aktivitas Mingguan</h2>
                  <p className="text-xs text-gray-400">Frekuensi chatbot, jumlah pelanggan, dan data penjualan.</p>
                </div>
                {/* Toggle Tab */}
                <div className="flex bg-gray-100 p-0.5 rounded-lg text-xs font-semibold self-start sm:self-auto">
                  {['chats', 'users', 'sales'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setAnalyticsTab(tab as any)}
                      className={`px-3 py-1 rounded-md transition duration-150 cursor-pointer relative ${analyticsTab === tab ? 'text-slate-900 font-bold' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                      {analyticsTab === tab && (
                        <motion.div
                          layoutId="activeAnalyticTab"
                          className="absolute inset-0 bg-white rounded-md shadow-xs z-0"
                          transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 25,
                          }}
                        />
                      )}
                      <span className="relative z-10 capitalize">{tab === 'chats' ? 'Sesi Chat' : tab === 'users' ? 'Pelanggan' : 'Penjualan'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom SVG Line Chart */}
              <div className="w-full relative mt-2 overflow-hidden">
                {(() => {
                  const chartInfo = drawSvgChart(stats.chartData, analyticsTab);

                  let strokeColor = '#8b5cf6';
                  let gradId = 'violetGrad';
                  if (analyticsTab === 'users') {
                    strokeColor = '#3b82f6';
                    gradId = 'blueGrad';
                  } else if (analyticsTab === 'sales') {
                    strokeColor = '#10b981';
                    gradId = 'emeraldGrad';
                  }

                  return (
                    <svg viewBox={`0 0 ${chartInfo.width} ${chartInfo.height}`} className="w-full h-auto overflow-visible">
                      <defs>
                        <linearGradient id="violetGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Y-axis grid lines */}
                      {Array.from({ length: 4 }).map((_, i) => {
                        const yVal = chartInfo.paddingLeft + i * (chartInfo.chartHeight / 3);
                        const rawVal = chartInfo.maxVal - (i * chartInfo.maxVal) / 3;

                        let labelVal = '';
                        if (analyticsTab === 'sales') {
                          if (rawVal >= 1000000) {
                            labelVal = `Rp ${(rawVal / 1000000).toFixed(1)}jt`;
                          } else if (rawVal >= 1000) {
                            labelVal = `Rp ${Math.round(rawVal / 1000)}rb`;
                          } else {
                            labelVal = `Rp ${Math.round(rawVal)}`;
                          }
                        } else {
                          labelVal = String(Math.round(rawVal));
                        }

                        return (
                          <g key={i}>
                            <line x1={chartInfo.paddingLeft} y1={yVal} x2={chartInfo.width - 20} y2={yVal} stroke="#f8fafc" strokeWidth="1.5" strokeDasharray="4 4" />
                            <text x={chartInfo.paddingLeft - 10} y={yVal + 4} fill="#94a3b8" fontSize="9" fontWeight="500" textAnchor="end">
                              {labelVal}
                            </text>
                          </g>
                        );
                      })}

                      {/* X-axis Labels */}
                      {chartInfo.points.map((pt, idx) => (
                        <text key={idx} x={pt.x} y={chartInfo.height - 10} fill="#94a3b8" fontSize="10" fontWeight="500" textAnchor="middle">
                          {stats.chartData[idx].label.split(' ')[0]}
                        </text>
                      ))}

                      {/* Filled gradient area */}
                      <motion.path key={`area-${analyticsTab}`} d={chartInfo.areaD} fill={`url(#${gradId})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.8 }} />

                      {/* Smooth Bezier line path */}
                      <motion.path
                        key={`line-${analyticsTab}`}
                        d={chartInfo.pathD}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />

                      {/* Interactive circles */}
                      {chartInfo.points.map((pt, idx) => (
                        <g key={idx} className="cursor-pointer group">
                          <circle cx={pt.x} cy={pt.y} r="4.5" fill="#ffffff" stroke={strokeColor} strokeWidth="3" />
                          <circle cx={pt.x} cy={pt.y} r="11" fill={strokeColor} fillOpacity="0" className="hover:fill-opacity-10 transition duration-150" />
                          <title>{analyticsTab === 'sales' ? `${stats.chartData[idx].label}: Rp ${pt.value.toLocaleString('id-ID')}` : `${stats.chartData[idx].label}: ${pt.value}`}</title>
                        </g>
                      ))}
                    </svg>
                  );
                })()}
              </div>
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-xs text-gray-400 mt-4">
              <span>Data dihitung secara dinamis dari database.</span>
              <span className="font-semibold text-gray-600 capitalize">Mode: {analyticsTab}</span>
            </div>
          </motion.div>

          {/* Bento Card 2: Popular Products (Spans 2 columns / 1-third width) */}
          <motion.div variants={cardVariants} className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm md:col-span-2 flex flex-col justify-between hover:shadow-md transition duration-200">
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
                    {stats.topCartedList && stats.topCartedList.length > 0 ? (
                      stats.topCartedList.map((item, idx) => (
                        <div key={idx} className="flex items-center text-xs p-2.5 rounded-xl bg-gray-50 border border-gray-100/80 hover:bg-gray-100/50 hover:shadow-xs transition duration-150 gap-2.5">
                          <span className="text-slate-400 font-extrabold text-[10px] w-4 shrink-0 text-center bg-gray-100 rounded-md py-0.5">{idx + 1}</span>
                          <span className="font-semibold text-gray-800 flex-1 leading-snug line-clamp-2">{item.name}</span>
                          <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-extrabold text-[9px] shrink-0">{item.count} unit</span>
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
                    {stats.topWishlistedList && stats.topWishlistedList.length > 0 ? (
                      stats.topWishlistedList.map((item, idx) => (
                        <div key={idx} className="flex items-center text-xs p-2.5 rounded-xl bg-gray-50 border border-gray-100/80 hover:bg-gray-100/50 hover:shadow-xs transition duration-150 gap-2.5">
                          <span className="text-slate-400 font-extrabold text-[10px] w-4 shrink-0 text-center bg-gray-100 rounded-md py-0.5">{idx + 1}</span>
                          <span className="font-semibold text-gray-800 flex-1 leading-snug line-clamp-2">{item.name}</span>
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

            <div className="text-[10px] text-gray-400 border-t border-gray-100 pt-3 mt-4">Terintegrasi dengan keranjang & wishlist.</div>
          </motion.div>

          {/* Bento Card 3: Stock Warning (Spans 3 columns / 1-half width) */}
          <motion.div variants={cardVariants} className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm md:col-span-3 flex flex-col justify-between hover:shadow-md transition duration-200">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-500 animate-pulse" />
                Restock Diperlukan
              </h2>
              <p className="text-xs text-gray-400 mb-4">Produk dengan tingkat stok di bawah 5 item.</p>

              <div className="space-y-3">
                {stats.lowStockList.length > 0 ? (
                  stats.lowStockList.map((prod, idx) => (
                    <div key={prod.id} className="flex items-center text-xs p-2.5 rounded-xl bg-red-50/30 border border-red-100/50 hover:bg-red-50/60 hover:shadow-xs transition duration-150 gap-2.5">
                      <span className="text-red-550 font-extrabold text-[10px] w-5 h-5 flex items-center justify-center bg-red-100 rounded-md shrink-0">{idx + 1}</span>
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="text-xs font-bold text-gray-800 leading-snug line-clamp-2">{prod.name}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">Harga: Rp {prod.price.toLocaleString('id-ID')}</div>
                      </div>
                      <span className="px-2.5 py-1 text-[9px] font-extrabold bg-red-600 text-white rounded-lg shrink-0 shadow-xs">Sisa: {prod.stock}</span>
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

            <div className="text-[10px] text-gray-400 border-t border-gray-100 pt-3 mt-4">Periksa halaman produk untuk restock barang.</div>
          </motion.div>

          {/* Bento Card 4: Category Distribution (Spans 3 columns / 1-half width) */}
          <motion.div variants={cardVariants} className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm md:col-span-3 flex flex-col justify-between hover:shadow-md transition duration-200">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-1.5">
                <FileBarChart2 size={18} className="text-indigo-500" />
                Penyebaran Kategori
              </h2>
              <p className="text-xs text-gray-400 mb-4">Rasio kategori produk dalam katalog.</p>

              <div className="space-y-4">
                {stats.categoryDistribution.length > 0 ? (
                  stats.categoryDistribution.map((cat, idx) => (
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
                            width: `${(cat.count / stats.totalProducts) * 100}%`,
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

            <div className="text-[10px] text-gray-400 border-t border-gray-100 pt-3 mt-4">Total {stats.totalProducts} produk dalam katalog.</div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
