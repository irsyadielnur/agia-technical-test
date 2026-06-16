"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { staggerContainer, slideIn } from "@/app/components/motion";
import imageCompression from "browser-image-compression";
import {
  Plus,
  Search as SearchIcon,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";

const fileToBase64 = (file: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(",")[1];
      resolve(base64Data);
    };
    reader.onerror = (error) => reject(error);
  });
};

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  product_images?: { image_url: string }[];
}

export default function ProductsView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isFetchLoading, setIsFetchLoading] = useState(true);

  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 10;

  // CRUD Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Detail Modal State
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [isDescHovered, setIsDescHovered] = useState(false);
  const [activeDetailImageIndex, setActiveDetailImageIndex] = useState(0);

  // Form Fields State
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    description: "",
  });

  // Multiple File Upload States
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  // Notification State
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Notification helper (declared early to avoid TDZ error)
  const showNotification = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Fetch products (wrapped in useCallback to prevent infinite render loops)
  const fetchProducts = useCallback(async () => {
    setIsFetchLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*, product_images(image_url)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      const error = err as Error;
      showNotification("error", error.message || "Gagal mengambil data produk");
    } finally {
      setIsFetchLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      fetchProducts();
    }, 0);
    return () => clearTimeout(handle);
  }, [fetchProducts]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setModalMode("create");
    setSelectedProduct(null);
    setSelectedFiles([]);
    setPreviews([]);
    setExistingImages([]);
    setFormData({
      name: "",
      category: "",
      price: "",
      stock: "",
      description: "",
    });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (product: Product) => {
    setModalMode("edit");
    setSelectedProduct(product);
    setSelectedFiles([]);
    setPreviews([]);
    setExistingImages(product.product_images?.map((img) => img.image_url) || []);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString(),
      description: product.description,
    });
    setIsModalOpen(true);
  };

  // Open modal for Detail View
  const handleOpenDetail = (product: Product) => {
    setDetailProduct(product);
    setIsDetailOpen(true);
    setIsDescHovered(false);
    setActiveDetailImageIndex(0);
  };

  // Handle Input Changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle File input changes
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
      
      const previewUrls = filesArray.map((file) => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...previewUrls]);
    }
  };

  // Remove existing image from state during edit
  const removeExistingImage = (indexToRemove: number) => {
    setExistingImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Remove selected new file before upload
  const removeSelectedFile = (indexToRemove: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setPreviews((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Handle Submit (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setNotification(null); // Clear any old notice

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session)
        throw new Error("Sesi login berakhir. Silakan login kembali.");

      const newImagesPayload: { name: string; base64: string }[] = [];

      // Perform compression and read as base64 if new files selected
      if (selectedFiles.length > 0) {
        const compressionOptions = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
          fileType: "image/webp",
        };

        for (const file of selectedFiles) {
          const compressedBlob = await imageCompression(file, compressionOptions);
          const base64Data = await fileToBase64(compressedBlob);
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.webp`;
          newImagesPayload.push({
            name: fileName,
            base64: base64Data,
          });
        }
      }

      const method = modalMode === "create" ? "POST" : "PUT";
      const payload =
        modalMode === "create"
          ? { ...formData, newImages: newImagesPayload }
          : { ...formData, id: selectedProduct?.id, existingImages, newImages: newImagesPayload };

      const response = await fetch("/api/products", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal menyimpan data produk");
      }

      showNotification(
        "success",
        modalMode === "create"
          ? "Produk baru berhasil ditambahkan!"
          : "Produk berhasil diperbarui!",
      );

      if (
        modalMode === "edit" &&
        detailProduct &&
        selectedProduct &&
        detailProduct.id === selectedProduct.id &&
        result.data
      ) {
        setDetailProduct(result.data);
        setIsDescHovered(false);
      }

      // Close modal ONLY on success
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      const error = err as Error;
      showNotification("error", error.message || "Gagal memproses produk");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete Product
  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session)
        throw new Error("Sesi login berakhir. Silakan login kembali.");

      const response = await fetch(`/api/products?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal menghapus produk");
      }

      if (detailProduct?.id === id) {
        setIsDetailOpen(false);
        setDetailProduct(null);
        setIsDescHovered(false);
      }

      showNotification("success", "Produk berhasil dihapus!");
      fetchProducts();
    } catch (err) {
      const error = err as Error;
      showNotification("error", error.message || "Gagal menghapus produk");
    }
  };

  // Local Filtered Products based on search query
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const indexOfLastProduct = safeCurrentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct,
  );

  // Format IDR Price Currency
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div>
      {/* Header Section */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Daftar Produk</h1>
          <p className="text-gray-500 text-sm mt-1">
            Kelola inventori dan katalog produk UNEEYA
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
                  placeholder="Cari nama produk..."
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
              aria-label="Cari produk"
            >
              <SearchIcon size={18} />
            </button>
          </div>

          {/* Add Product Button */}
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-gray-200"
          >
            <Plus size={18} />
            <span>Tambah Produk Baru</span>
          </button>
        </div>
      </header>

      {/* Global Notifications Banner */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className={`flex items-start gap-3 p-4 rounded-2xl mb-6 shadow-sm text-sm border fixed top-3 right-3 ${
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

      {/* Product Table List */}
      <div className="w-full">
        <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden shrink-0 w-full">
          {isFetchLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              <p className="text-gray-400 text-sm">Memuat produk...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-gray-400 text-sm">
                Tidak ada produk ditemukan.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto scrollbar-none pb-2">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                      <th className="px-6 py-4 w-20">Gambar</th>
                      <th className="px-6 py-4">Nama Produk</th>
                      <th className="px-6 py-4">Kategori</th>
                      <th className="px-6 py-4">Harga</th>
                      <th className="px-6 py-4">Stok</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
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
                      {currentProducts.map((product, idx) => (
                        <motion.tr
                          key={product.id}
                          layout
                          variants={slideIn("up", idx * 0.02, 0.45)}
                          onClick={() => handleOpenDetail(product)}
                          className={`transition-all duration-200 cursor-pointer border-l-2 ${
                            isDetailOpen && detailProduct?.id === product.id
                              ? "bg-gray-900/5 border-gray-900"
                              : "hover:bg-slate-50/70 border-transparent hover:border-brand-secondary"
                          }`}
                        >
                          <td className="px-6 py-4">
                            <img
                              src={
                                product.product_images?.[0]?.image_url ||
                                "https://dummyimage.com/100x100/ccc/000&text=No+Image"
                              }
                              alt={product.name}
                              className="w-12 h-12 rounded-xl object-cover border border-gray-100 bg-gray-50 transition-transform duration-300 group-hover:scale-105"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col max-w-xs">
                              <span className="font-semibold text-gray-800 hover:text-brand-text transition-colors">
                                {product.name}
                              </span>
                              <span
                                className="text-xs text-gray-400 truncate mt-0.5"
                                title={product.description}
                              >
                                {product.description}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-50 border border-gray-200 text-gray-600">
                              {product.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-900">
                            {formatIDR(product.price)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`font-semibold ${
                                product.stock <= 5
                                  ? "text-red-650"
                                  : "text-gray-600"
                              }`}
                            >
                              {product.stock}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit(product);
                              }}
                              className="inline-flex p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                              title="Edit Produk"
                              aria-label="Edit produk"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(product.id);
                              }}
                              className="inline-flex p-2 rounded-lg text-red-650 hover:bg-red-50 hover:text-red-750 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                              title="Hapus Produk"
                              aria-label="Hapus produk"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </motion.tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {filteredProducts.length > productsPerPage && (
                <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-100 flex-wrap gap-4">
                  <span className="text-xs text-gray-400">
                    Menampilkan{" "}
                    <span className="font-semibold text-gray-800">
                      {indexOfFirstProduct + 1}
                    </span>{" "}
                    -{" "}
                    <span className="font-semibold text-gray-800">
                      {Math.min(indexOfLastProduct, filteredProducts.length)}
                    </span>{" "}
                    dari{" "}
                    <span className="font-semibold text-gray-800">
                      {filteredProducts.length}
                    </span>{" "}
                    produk
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

      {/* Floating Detail Modal Overlay */}
      <AnimatePresence>
        {isDetailOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto p-4">
            {/* Smooth backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsDetailOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs cursor-pointer"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-white rounded-3xl border border-gray-150 shadow-2xl overflow-hidden relative z-10 mx-4"
            >
              {detailProduct && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 p-6">
                  {/* Left Column: Image with modern framing */}
                  <div className="md:col-span-2 flex flex-col gap-2">
                    <div className="relative aspect-square bg-gray-55 rounded-2xl overflow-hidden border border-gray-100 flex items-center justify-center shadow-inner group/img">
                      <img
                        src={
                          detailProduct.product_images?.[activeDetailImageIndex]?.image_url ||
                          "https://dummyimage.com/400x300/ccc/000&text=No+Image"
                        }
                        alt={detailProduct.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                      />
                    </div>
                    {/* Thumbnails row */}
                    {detailProduct.product_images && detailProduct.product_images.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto py-1 scrollbar-none">
                        {detailProduct.product_images.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveDetailImageIndex(idx)}
                            className={`w-10 h-10 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer ${
                              activeDetailImageIndex === idx ? "border-gray-900" : "border-transparent opacity-75 hover:opacity-100"
                            }`}
                          >
                            <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Clean, spacious product info */}
                  <div className="md:col-span-3 flex flex-col justify-between min-h-[280px]">
                    <div className="space-y-4">
                      {/* Top Header Row with Category and Close Button */}
                      <div className="flex justify-between items-start">
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 uppercase tracking-wider">
                          {detailProduct.category}
                        </span>
                        <button
                          onClick={() => setIsDetailOpen(false)}
                          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all cursor-pointer z-10 border border-transparent hover:border-gray-200"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {/* Name */}
                      <div>
                        <h3 className="font-bold text-gray-900 text-2xl tracking-tight leading-tight">
                          {detailProduct.name}
                        </h3>
                      </div>

                      {/* Pricing and Stock info */}
                      <div className="flex gap-6 border-t border-b border-gray-100 py-3">
                        <div>
                          <span className="text-gray-400 block text-[9px] uppercase font-bold tracking-wider">
                            Harga
                          </span>
                          <span className="font-black text-gray-900 mt-1 block text-lg">
                            {formatIDR(detailProduct.price)}
                          </span>
                        </div>
                        <div className="border-l border-gray-100 pl-6">
                          <span className="text-gray-400 block text-[9px] uppercase font-bold tracking-wider">
                            Stok
                          </span>
                          <span className="font-bold text-gray-800 mt-1 block text-sm">
                            {detailProduct.stock} unit
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-1">
                        <span className="text-gray-400 text-[9px] uppercase font-bold tracking-wider block">
                          Deskripsi Produk
                        </span>
                        <div className="max-h-36 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                          <p className="text-gray-600 text-xs leading-relaxed">
                            {detailProduct.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="flex gap-3 mt-6 pt-4 border-t border-gray-55">
                      <button
                        onClick={() => handleOpenEdit(detailProduct)}
                        className="flex-1 flex items-center justify-center gap-2 border border-gray-200 bg-white text-gray-700 px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-gray-50 hover:text-gray-900 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                      >
                        <Edit2 size={14} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(detailProduct.id)}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-650 border border-red-100 px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-red-100 hover:text-red-750 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                      >
                        <Trash2 size={14} />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Create & Edit Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-999 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-gray-800">
                  {modalMode === "create"
                    ? "Tambah Produk Baru"
                    : "Edit Detail Produk"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Nama Produk *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all text-sm"
                      placeholder="Masukkan nama produk"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Kategori *
                      </label>
                      <input
                        type="text"
                        name="category"
                        required
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all text-sm"
                        placeholder="Tas, Aksesoris, dll"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Stok Barang *
                      </label>
                      <input
                        type="number"
                        name="stock"
                        required
                        min="0"
                        value={formData.stock}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all text-sm"
                        placeholder="Jumlah stok"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Harga (Rupiah) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      required
                      min="0"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all text-sm"
                      placeholder="Harga produk"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Gambar Produk *
                    </label>
                    
                    {/* Drag and Drop / Select Area */}
                    <div className="relative group/upload flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-6 bg-gray-50 hover:bg-gray-50/50 hover:border-gray-900 transition-all cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <ImageIcon className="w-8 h-8 text-gray-400 group-hover/upload:text-gray-950 transition-colors mb-2" />
                      <span className="text-sm font-semibold text-gray-755 group-hover/upload:text-gray-900">
                        Pilih Gambar Produk
                      </span>
                      <span className="text-xs text-gray-400 mt-1">
                        Format WebP, JPEG, PNG (Maks. beberapa berkas)
                      </span>
                    </div>

                    {/* Previews of newly selected files */}
                    {previews.length > 0 && (
                      <div className="mt-4">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                          Gambar Baru ({previews.length})
                        </span>
                        <div className="grid grid-cols-4 gap-2">
                          {previews.map((url, idx) => (
                            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-150 group">
                              <img src={url} alt="Preview" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeSelectedFile(idx)}
                                className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Previews of existing files (Edit Mode) */}
                    {modalMode === "edit" && existingImages.length > 0 && (
                      <div className="mt-4">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                          Gambar Terdaftar ({existingImages.length})
                        </span>
                        <div className="grid grid-cols-4 gap-2">
                          {existingImages.map((url, idx) => (
                            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-150 group">
                              <img src={url} alt="Existing" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeExistingImage(idx)}
                                className="absolute top-1 right-1 p-1 bg-red-650 hover:bg-red-750 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Deskripsi Produk *
                    </label>
                    <textarea
                      name="description"
                      required
                      rows={3}
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all text-sm resize-none animate-none"
                      placeholder="Masukkan deskripsi lengkap mengenai produk ini..."
                    />
                  </div>
                </div>

                {/* Modal Action Buttons */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-100 cursor-pointer"
                    disabled={isSaving}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="bg-gray-900 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-gray-800 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2 disabled:bg-gray-400"
                    disabled={isSaving}
                  >
                    {isSaving && <Loader2 size={14} className="animate-spin" />}
                    <span>{isSaving ? "Menyimpan..." : "Simpan Produk"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
