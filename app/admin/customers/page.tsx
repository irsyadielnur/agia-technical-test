"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { staggerContainer, slideIn } from "@/app/components/motion";
import {
  Search as SearchIcon,
  X,
  User,
  Mail,
  Calendar,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Smartphone,
  Globe,
} from "lucide-react";

interface Customer {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  phone: string;
  is_anonymous: boolean;
  username: string;
  avatar_url: string;
  role: string;
  provider: string;
}

export default function CustomersView() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const customersPerPage = 15;

  // Detail Drawer State
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);

  // Notification State
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Notification helper (declared early to avoid temporal dead zone)
  const showNotification = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Fetch Customers (wrapped in useCallback to prevent infinite render loops)
  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Sesi login berakhir. Silakan login kembali.");
      }

      const response = await fetch("/api/customers", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal mengambil data pelanggan");
      }

      setCustomers(result.customers || []);
    } catch (err) {
      const error = err as Error;
      showNotification("error", error.message || "Gagal memproses data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      fetchCustomers();
    }, 0);
    return () => clearTimeout(handle);
  }, [fetchCustomers]);

  // Open Detail View
  const handleOpenDetail = (customer: Customer) => {
    setDetailCustomer(customer);
    setIsDetailOpen(true);
  };

  // Local Filtered Customers based on search query
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Pagination calculation
  const totalPages =
    Math.ceil(filteredCustomers.length / customersPerPage) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const indexOfLastCustomer = safeCurrentPage * customersPerPage;
  const indexOfFirstCustomer = indexOfLastCustomer - customersPerPage;
  const currentCustomers = filteredCustomers.slice(
    indexOfFirstCustomer,
    indexOfLastCustomer,
  );

  // Date Formatting helper
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      {/* Header Section */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Daftar Pelanggan</h1>
          <p className="text-gray-500 text-sm mt-1">
            Pantau dan kelola data pengguna terdaftar UNEEYA
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Input Bar (collapsible) */}
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {isSearchOpen && (
                <motion.input
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 220, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  type="text"
                  placeholder="Cari nama atau email..."
                  className="px-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all shadow-sm"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  autoFocus
                />
              )}
            </AnimatePresence>

            <button
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                if (isSearchOpen) {
                  setSearchQuery("");
                  setCurrentPage(1);
                }
              }}
              className={`p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors shadow-sm cursor-pointer ${
                isSearchOpen ? "bg-gray-100 ring-2 ring-gray-900" : ""
              }`}
              aria-label="Cari pelanggan"
            >
              <SearchIcon size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Global Notifications Banner */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className={`flex items-start gap-3 p-4 rounded-2xl mb-6 shadow-sm text-sm border fixed top-3 right-3 z-999 ${
              notification.type === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span className="font-medium">{notification.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customers List Container */}
      <div className="w-full">
        <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden w-full">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              <p className="text-gray-400 text-sm">Memuat pelanggan...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-gray-400 text-sm">
                Tidak ada pelanggan ditemukan.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto scrollbar-none pb-2">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                      <th className="px-6 py-4 w-20">Profil</th>
                      <th className="px-6 py-4">Username / Nama</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Terdaftar</th>
                      <th className="px-6 py-4">Kunjungan Terakhir</th>
                    </tr>
                  </thead>
                  <motion.tbody 
                    variants={staggerContainer(0.04, 0.02)}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="divide-y divide-gray-100 text-sm text-gray-700"
                  >
                    <AnimatePresence mode="popLayout">
                      {currentCustomers.map((customer, idx) => (
                        <motion.tr
                          key={customer.id}
                          layout
                          variants={slideIn("up", idx * 0.02, 0.45)}
                          onClick={() => handleOpenDetail(customer)}
                          className={`transition-all duration-200 cursor-pointer border-l-2 ${
                            isDetailOpen && detailCustomer?.id === customer.id
                              ? "bg-gray-900/5 border-gray-900"
                              : "hover:bg-slate-50/70 border-transparent hover:border-brand-secondary"
                          }`}
                        >
                          <td className="px-6 py-4">
                            <img
                              src={customer.avatar_url}
                              alt={customer.username}
                              className="w-10 h-10 rounded-full object-cover border border-gray-200 bg-gray-50"
                            />
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-800">
                            {customer.username}
                          </td>
                          <td className="px-6 py-4 text-gray-650 font-medium">
                            {customer.email}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                customer.role === "admin"
                                  ? "bg-blue-50 border-blue-200 text-blue-700"
                                  : "bg-gray-50 border-gray-200 text-gray-600"
                              }`}
                            >
                              {customer.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-xs">
                            {formatDate(customer.created_at)}
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-xs">
                            {formatDate(customer.last_sign_in_at)}
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </motion.tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {filteredCustomers.length > customersPerPage && (
                <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-100 flex-wrap gap-4">
                  <span className="text-xs text-gray-400">
                    Menampilkan{" "}
                    <span className="font-semibold text-gray-800">
                      {indexOfFirstCustomer + 1}
                    </span>{" "}
                    -{" "}
                    <span className="font-semibold text-gray-800">
                      {Math.min(indexOfLastCustomer, filteredCustomers.length)}
                    </span>{" "}
                    dari{" "}
                    <span className="font-semibold text-gray-800">
                      {filteredCustomers.length}
                    </span>{" "}
                    pelanggan
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={safeCurrentPage === 1}
                      className="px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer text-xs font-semibold"
                    >
                      Sebelumnya
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            safeCurrentPage === page
                              ? "bg-gray-900 text-white shadow-sm shadow-gray-300"
                              : "border border-gray-200 hover:bg-gray-50 text-gray-650"
                          }`}
                        >
                          {page}
                        </button>
                      ),
                    )}
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={safeCurrentPage === totalPages}
                      className="px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer text-xs font-semibold"
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

        {/* Floating Detail Drawer (Slide from Right) */}
        <AnimatePresence>
          {isDetailOpen && (
            <motion.div
              key="detail-drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-gray-150"
            >
              {detailCustomer && (
                <div className="h-full flex flex-col justify-between">
                  {/* Close button & Profile card */}
                  <div className="p-6 pb-4 border-b border-gray-100 flex flex-col items-center relative shrink-0">
                    {/* Close Button */}
                    <button
                      onClick={() => setIsDetailOpen(false)}
                      className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer border border-transparent hover:border-gray-200"
                      aria-label="Tutup detail"
                    >
                      <X size={16} />
                    </button>

                    {/* Avatar with dynamic ring */}
                    <div className="relative mb-4 mt-2">
                      <div className="absolute inset-0 bg-gray-100 rounded-full scale-105 border border-gray-200" />
                      <img
                        src={detailCustomer.avatar_url || "https://dummyimage.com/150x150/ccc/000&text=User"}
                        alt={detailCustomer.username}
                        className="w-24 h-24 rounded-full object-cover relative z-10 border-2 border-white bg-gray-50 shadow-md"
                      />
                    </div>

                    <h3 className="font-bold text-gray-900 text-xl tracking-tight">
                      {detailCustomer.username}
                    </h3>
                    
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-2 border uppercase tracking-wider ${
                        detailCustomer.role === "admin"
                          ? "bg-blue-50 border-blue-200 text-blue-700"
                          : "bg-gray-50 border-gray-200 text-gray-500"
                      }`}
                    >
                      {detailCustomer.role}
                    </span>
                  </div>

                  {/* Details Body */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <h4 className="text-[10px] font-bold text-gray-450 uppercase tracking-widest">
                      Informasi Profil
                    </h4>

                    <div className="space-y-4">
                      {/* ID Pengguna */}
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-gray-50 rounded-xl text-gray-455 mt-0.5 border border-gray-100 shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider block">
                            ID Pengguna
                          </span>
                          <span className="font-mono text-xs text-gray-700 select-all block break-all">
                            {detailCustomer.id}
                          </span>
                        </div>
                      </div>

                      {/* Alamat Email */}
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-gray-50 rounded-xl text-gray-455 mt-0.5 border border-gray-100 shrink-0">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider block">
                            Alamat Email
                          </span>
                          <span className="font-semibold text-gray-900 text-sm block">
                            {detailCustomer.email}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1.5 text-[10px] font-semibold mt-1 px-2 py-0.5 rounded-md ${
                              detailCustomer.email_confirmed_at
                                ? "bg-green-50 text-green-700 border border-green-100"
                                : "bg-amber-50 text-amber-700 border border-amber-100"
                            }`}
                          >
                            {detailCustomer.email_confirmed_at ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                <span>Terkonfirmasi</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>Belum Terkonfirmasi</span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Nomor Telepon */}
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-gray-50 rounded-xl text-gray-455 mt-0.5 border border-gray-100 shrink-0">
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider block">
                            Nomor Telepon
                          </span>
                          <span className="font-semibold text-gray-800 text-sm block">
                            {detailCustomer.phone || "-"}
                          </span>
                        </div>
                      </div>

                      {/* Provider Login */}
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-gray-50 rounded-xl text-gray-455 mt-0.5 border border-gray-100 shrink-0">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider block">
                            Provider Login
                          </span>
                          <span className="font-semibold text-gray-800 uppercase text-xs block">
                            {detailCustomer.provider}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                      <h4 className="text-[10px] font-bold text-gray-455 uppercase tracking-widest mb-4">
                        Aktivitas Akun
                      </h4>
                      
                      <div className="space-y-4">
                        {/* Tanggal Terdaftar */}
                        <div className="flex items-start gap-4">
                          <div className="p-2.5 bg-gray-50 rounded-xl text-gray-455 mt-0.5 border border-gray-100 shrink-0">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider block">
                              Tanggal Terdaftar
                            </span>
                            <span className="font-semibold text-gray-850 text-xs block">
                              {formatDate(detailCustomer.created_at)}
                            </span>
                          </div>
                        </div>

                        {/* Terakhir Dilihat */}
                        <div className="flex items-start gap-4">
                          <div className="p-2.5 bg-gray-50 rounded-xl text-gray-455 mt-0.5 border border-gray-100 shrink-0">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider block">
                              Terakhir Dilihat (Sign In)
                            </span>
                            <span className="font-semibold text-gray-850 text-xs block">
                              {formatDate(detailCustomer.last_sign_in_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
}
