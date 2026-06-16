"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  RotateCcw,
  PackageOpen,
  ArrowUpDown,
} from "lucide-react";
import ProductCard from "@/app/components/product-card";
import { supabase } from "@/lib/supabase";
import { staggerContainer, slideIn } from "@/app/components/motion";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image_url?: string;
  product_images?: { image_url: string }[];
}

interface CategoryInfo {
  name: string;
  count: number;
}

const ITEMS_PER_PAGE = 9;

export default function CatalogPage() {
  // Products states
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Categories metadata
  const [categories, setCategories] = useState<CategoryInfo[]>([]);

  // Filter states
  const [searchTemp, setSearchTemp] = useState(""); // Local input state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [stockFilter, setStockFilter] = useState("all"); // 'all' | 'instock' | 'outofstock'
  const [sortBy, setSortBy] = useState("date-desc"); // 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Mobile filter drawer state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Helper handlers to reset currentPage when filters change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleMinPriceChange = (value: string) => {
    setMinPrice(value);
    setCurrentPage(1);
  };

  const handleMaxPriceChange = (value: string) => {
    setMaxPrice(value);
    setCurrentPage(1);
  };

  const handleStockFilterChange = (value: string) => {
    setStockFilter(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  // Fetch unique categories & counts once on mount
  useEffect(() => {
    const fetchCategoryMetadata = async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("category");

        if (error) throw error;

        // Group and count categories case-insensitively
        const counts: {
          [key: string]: { originalName: string; count: number };
        } = {};

        data?.forEach((item) => {
          if (!item.category) return;
          const catName = item.category.trim();
          const key = catName.toLowerCase();
          if (counts[key]) {
            counts[key].count += 1;
          } else {
            counts[key] = {
              originalName: catName,
              count: 1,
            };
          }
        });

        const formatted: CategoryInfo[] = Object.keys(counts).map((key) => {
          const original = counts[key].originalName;
          const displayName =
            original.charAt(0).toUpperCase() + original.slice(1);
          return {
            name: displayName,
            count: counts[key].count,
          };
        });

        setCategories(formatted);
      } catch (err) {
        console.error("Error fetching category metadata:", err);
      }
    };

    fetchCategoryMetadata();
  }, []);

  // Fetch products based on filters and pagination
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Get total count for pagination
      let countQuery = supabase
        .from("products")
        .select("id", { count: "exact", head: true });

      if (searchTerm.trim()) {
        countQuery = countQuery.ilike("name", `%${searchTerm}%`);
      }
      if (selectedCategory !== "all") {
        countQuery = countQuery.ilike("category", selectedCategory);
      }
      if (minPrice) {
        countQuery = countQuery.gte("price", parseFloat(minPrice));
      }
      if (maxPrice) {
        countQuery = countQuery.lte("price", parseFloat(maxPrice));
      }
      if (stockFilter === "instock") {
        countQuery = countQuery.gt("stock", 0);
      } else if (stockFilter === "outofstock") {
        countQuery = countQuery.eq("stock", 0);
      }

      const { count, error: countError } = await countQuery;
      if (countError) throw countError;
      setTotalProducts(count || 0);

      // 2. Fetch paginated and sorted products
      let query = supabase.from("products").select("*, product_images(image_url)");

      if (searchTerm.trim()) {
        query = query.ilike("name", `%${searchTerm}%`);
      }
      if (selectedCategory !== "all") {
        query = query.ilike("category", selectedCategory);
      }
      if (minPrice) {
        query = query.gte("price", parseFloat(minPrice));
      }
      if (maxPrice) {
        query = query.lte("price", parseFloat(maxPrice));
      }
      if (stockFilter === "instock") {
        query = query.gt("stock", 0);
      } else if (stockFilter === "outofstock") {
        query = query.eq("stock", 0);
      }

      // Apply sorting
      if (sortBy === "date-desc") {
        query = query.order("created_at", { ascending: false });
      } else if (sortBy === "date-asc") {
        query = query.order("created_at", { ascending: true });
      } else if (sortBy === "name-asc") {
        query = query.order("name", { ascending: true });
      } else if (sortBy === "name-desc") {
        query = query.order("name", { ascending: false });
      } else if (sortBy === "price-asc") {
        query = query.order("price", { ascending: true });
      } else if (sortBy === "price-desc") {
        query = query.order("price", { ascending: false });
      }

      // Apply range for pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error } = await query;
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setIsLoading(false);
    }
  }, [
    searchTerm,
    selectedCategory,
    minPrice,
    maxPrice,
    stockFilter,
    sortBy,
    currentPage,
  ]);

  useEffect(() => {
    const handle = setTimeout(() => {
      fetchProducts();
    }, 0);
    return () => clearTimeout(handle);
  }, [fetchProducts]);

  // Debounce search input
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearchTerm(searchTemp);
      setCurrentPage(1);
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTemp]);

  const handleResetFilters = () => {
    setSearchTemp("");
    setSearchTerm("");
    setSelectedCategory("all");
    setMinPrice("");
    setMaxPrice("");
    setStockFilter("all");
    setSortBy("date-desc");
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);



  const isAnyFilterActive =
    searchTerm !== "" ||
    selectedCategory !== "all" ||
    minPrice !== "" ||
    maxPrice !== "" ||
    stockFilter !== "all" ||
    sortBy !== "date-desc";

  return (
    <div className="flex flex-col min-h-screen bg-brand-bg/20 selection:bg-brand-secondary/30">

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-20 pt-24 pb-16">
        {/* Breadcrumb & Header */}
        <div className="mb-8 space-y-2">
          <div className="text-xs text-gray-400 flex items-center gap-1 font-semibold">
            <span>Home</span>
            <ChevronRight size={10} />
            <span className="text-brand-secondary">Catalog</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-brand-text">
                Katalog Produk
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Jelajahi koleksi busana & aksesoris eksklusif kami dengan mudah.
              </p>
            </div>
            {/* Total items info */}
            <div className="text-xs text-gray-400 bg-white border border-gray-150 px-3 py-1.5 rounded-full font-semibold self-start sm:self-center shadow-xs">
              Menampilkan{" "}
              <span className="text-gray-800 font-bold">{products.length}</span>{" "}
              dari{" "}
              <span className="text-gray-800 font-bold">{totalProducts}</span>{" "}
              Produk
            </div>
          </div>
        </div>

        {/* Catalog Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Filters Sidebar (Desktop) */}
          <aside className="hidden lg:block lg:col-span-1 bg-white border border-gray-150 p-6 rounded-2xl shadow-xs sticky top-20">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <span className="font-bold text-brand-text text-base flex items-center gap-2">
                <SlidersHorizontal size={16} />
                <span>Filter</span>
              </span>
              {isAnyFilterActive && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-semibold cursor-pointer active:scale-95 transition-transform"
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Filter Group: Category */}
            <div className="mb-6">
              <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-3">
                Kategori
              </h3>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                <button
                  onClick={() => handleCategoryChange("all")}
                  className={`w-full text-left text-xs px-3 py-2 rounded-xl transition-all font-semibold flex justify-between items-center ${
                    selectedCategory === "all"
                      ? "bg-brand-secondary/15 text-brand-text"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span>Semua Kategori</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => handleCategoryChange(cat.name)}
                    className={`w-full text-left text-xs px-3 py-2 rounded-xl transition-all font-semibold flex justify-between items-center ${
                      selectedCategory.toLowerCase() === cat.name.toLowerCase()
                        ? "bg-brand-secondary/15 text-brand-text"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className="capitalize">{cat.name}</span>
                    <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-md">
                      {cat.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Group: Price */}
            <div className="mb-6">
              <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-3">
                Harga (IDR)
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase">
                    Min
                  </label>
                  <input
                    type="number"
                    placeholder="Min Harga"
                    value={minPrice}
                    onChange={(e) => handleMinPriceChange(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary outline-hidden bg-gray-50/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase">
                    Max
                  </label>
                  <input
                    type="number"
                    placeholder="Max Harga"
                    value={maxPrice}
                    onChange={(e) => handleMaxPriceChange(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary outline-hidden bg-gray-50/50"
                  />
                </div>
              </div>
            </div>

            {/* Filter Group: Stock Status */}
            <div>
              <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-3">
                Ketersediaan
              </h3>
              <div className="space-y-2">
                {[
                  { value: "all", label: "Semua Status" },
                  { value: "instock", label: "Ready Stock" },
                  { value: "outofstock", label: "Stok Habis" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 font-semibold"
                  >
                    <input
                      type="radio"
                      name="stockFilter"
                      value={opt.value}
                      checked={stockFilter === opt.value}
                      onChange={() => handleStockFilterChange(opt.value)}
                      className="text-brand-secondary focus:ring-brand-secondary border-gray-300 w-3.5 h-3.5"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* Catalog Main Content Column */}
          <div className="col-span-1 lg:col-span-3 space-y-6">
            {/* Search, Mobile Filter Trigger, and Sort Header */}
            <div className="bg-white border border-gray-150 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
              {/* Search input field */}
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Cari nama produk..."
                  value={searchTemp}
                  onChange={(e) => setSearchTemp(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-xs border border-gray-200 rounded-xl focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary outline-hidden bg-gray-50/30"
                />
                {searchTemp && (
                  <button
                    onClick={() => setSearchTemp("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              <div className="flex w-full md:w-auto items-center justify-between md:justify-end gap-3">
                {/* Mobile Filter Button */}
                <button
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="flex lg:hidden items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors active:scale-98 shadow-xs"
                >
                  <SlidersHorizontal size={14} />
                  <span>Filter</span>
                </button>

                {/* Sort selector */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <ArrowUpDown size={14} className="text-gray-400 shrink-0" />
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="w-full md:w-auto text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl px-3 py-2.5 focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary outline-hidden cursor-pointer"
                  >
                    <option value="date-desc">Terbaru</option>
                    <option value="date-asc">Terlama</option>
                    <option value="name-asc">Abjad (A - Z)</option>
                    <option value="name-desc">Abjad (Z - A)</option>
                    <option value="price-asc">Harga Terendah</option>
                    <option value="price-desc">Harga Tertinggi</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Products Catalog Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {[...Array(6)].map((_, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-gray-150 rounded-2xl overflow-hidden h-96 flex flex-col p-4 space-y-4 animate-pulse"
                  >
                    <div className="aspect-square bg-gray-100 rounded-xl w-full" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-100 rounded w-1/3" />
                      <div className="h-5 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-5/6" />
                    </div>
                    <div className="h-8 bg-gray-100 rounded-xl w-full" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-20 flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-3xl bg-white/50 space-y-4 text-center px-4"
              >
                <div className="p-4 bg-brand-tertiary/10 text-brand-tertiary rounded-full">
                  <PackageOpen size={36} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-gray-800 text-lg">
                    Produk Tidak Ditemukan
                  </h3>
                  <p className="text-gray-400 text-xs max-w-sm">
                    Kami tidak dapat menemukan produk yang sesuai dengan
                    kriteria filter Anda. Coba reset filter Anda.
                  </p>
                </div>
                {isAnyFilterActive && (
                  <button
                    onClick={handleResetFilters}
                    className="flex items-center gap-2 bg-brand-text text-white px-5 py-2.5 rounded-full text-xs font-semibold hover:bg-gray-800 transition-all active:scale-98 shadow-xs cursor-pointer"
                  >
                    <RotateCcw size={12} />
                    <span>Reset Filter</span>
                  </button>
                )}
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                <motion.div
                  key="catalog-grid"
                  variants={staggerContainer(0.05, 0.05)}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
                >
                  {products.map((product, idx) => {
                    const rowIndex = Math.floor(idx / 3);
                    return (
                      <motion.div
                        key={product.id}
                        layout
                        variants={slideIn("up", rowIndex * 0.12, 0.5)}
                      >
                        <ProductCard product={product} />
                      </motion.div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            )}

            {/* Pagination Controls - only visible if totalProducts > ITEMS_PER_PAGE */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                {/* Previous Button */}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="p-2.5 border border-gray-200 bg-white rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-gray-600 transition-colors shadow-2xs active:scale-95 cursor-pointer disabled:pointer-events-none"
                  aria-label="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Page Number Buttons */}
                <div className="flex items-center gap-1.5">
                  {[...Array(totalPages)].map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-9 h-9 rounded-xl text-xs font-bold transition-all border shadow-2xs cursor-pointer active:scale-95 ${
                          currentPage === pageNum
                            ? "bg-brand-text border-brand-text text-white font-extrabold"
                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {/* Next Button */}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2.5 border border-gray-200 bg-white rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-gray-600 transition-colors shadow-2xs active:scale-95 cursor-pointer disabled:pointer-events-none"
                  aria-label="Next Page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Filters Drawer (Overlay) */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFilterOpen(false)}
              className="fixed inset-0 bg-black z-50 lg:hidden"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-80 max-w-[90vw] bg-white z-50 p-6 flex flex-col shadow-2xl border-l border-gray-150 lg:hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6 shrink-0">
                <span className="font-bold text-brand-text text-base flex items-center gap-2">
                  <SlidersHorizontal size={16} />
                  <span>Filter</span>
                </span>
                <div className="flex items-center gap-3">
                  {isAnyFilterActive && (
                    <button
                      onClick={handleResetFilters}
                      className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-semibold cursor-pointer active:scale-95 transition-transform"
                    >
                      <RotateCcw size={12} />
                      <span>Reset</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-650 hover:bg-gray-50 active:scale-95 transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-6">
                {/* Category */}
                <div>
                  <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-3">
                    Kategori
                  </h3>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    <button
                      onClick={() => handleCategoryChange("all")}
                      className={`w-full text-left text-xs px-3 py-2 rounded-xl transition-all font-semibold flex justify-between items-center ${
                        selectedCategory === "all"
                          ? "bg-brand-secondary/15 text-brand-text"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <span>Semua Kategori</span>
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.name}
                        onClick={() => handleCategoryChange(cat.name)}
                        className={`w-full text-left text-xs px-3 py-2 rounded-xl transition-all font-semibold flex justify-between items-center ${
                          selectedCategory.toLowerCase() ===
                          cat.name.toLowerCase()
                            ? "bg-brand-secondary/15 text-brand-text"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <span className="capitalize">{cat.name}</span>
                        <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-md">
                          {cat.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div>
                  <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-3">
                    Harga (IDR)
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase">
                        Min label
                      </label>
                      <input
                        type="number"
                        placeholder="Min Harga"
                        value={minPrice}
                        onChange={(e) => handleMinPriceChange(e.target.value)}
                        className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary outline-hidden bg-gray-50/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase">
                        Max label
                      </label>
                      <input
                        type="number"
                        placeholder="Max Harga"
                        value={maxPrice}
                        onChange={(e) => handleMaxPriceChange(e.target.value)}
                        className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary outline-hidden bg-gray-50/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Stock Status */}
                <div>
                  <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-3">
                    Ketersediaan
                  </h3>
                  <div className="space-y-2.5">
                    {[
                      { value: "all", label: "Semua Status" },
                      { value: "instock", label: "Ready Stock" },
                      { value: "outofstock", label: "Stok Habis" },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-600 font-semibold"
                      >
                        <input
                          type="radio"
                          name="mobileStockFilter"
                          value={opt.value}
                          checked={stockFilter === opt.value}
                          onChange={() => handleStockFilterChange(opt.value)}
                          className="text-brand-secondary focus:ring-brand-secondary border-gray-300 w-4 h-4"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Drawer CTA footer */}
              <div className="border-t border-gray-100 pt-4 mt-6 shrink-0">
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-full bg-brand-text text-white py-3 rounded-xl font-bold text-xs hover:bg-gray-800 transition-colors active:scale-98 shadow-sm cursor-pointer"
                >
                  Terapkan Filter
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
