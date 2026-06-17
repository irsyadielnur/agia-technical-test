"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { staggerContainer, slideIn } from "@/app/components/motion";
import { ShoppingBag, Layers, Loader2 } from "lucide-react";
import ProductCard from "@/app/components/product-card";
import { supabase } from "@/lib/supabase";

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

interface CategoryItem {
  name: string;
  count: string;
  slug: string;
  color: string;
  imageUrl?: string;
}

const getCategoryFallbackImage = (slug: string) => {
  const clean = slug.toLowerCase();
  if (clean.includes("tas") || clean.includes("bag")) {
    return "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=400";
  }
  if (clean.includes("dompet") || clean.includes("wallet")) {
    return "https://images.unsplash.com/photo-1627124768121-7435d8ee4a21?auto=format&fit=crop&q=80&w=400";
  }
  if (
    clean.includes("aksesoris") ||
    clean.includes("accessory") ||
    clean.includes("perhiasan")
  ) {
    return "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=400";
  }
  if (clean.includes("gantungan") || clean.includes("keychain")) {
    return "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=400";
  }
  return "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=400";
};

export default function Home() {
  const { scrollY } = useScroll();
  const yBg = useTransform(scrollY, [0, 1000], [0, 350]);
  const opacityBg = useTransform(scrollY, [0, 800], [1, 0]);
  const yText = useTransform(scrollY, [0, 800], [0, -80]);
  const opacityText = useTransform(scrollY, [0, 600], [1, 0]);

  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [columnCount, setColumnCount] = useState(4);

  useEffect(() => {
    const updateColumns = () => {
      if (window.innerWidth >= 1024) {
        setColumnCount(4);
      } else if (window.innerWidth >= 768) {
        setColumnCount(3);
      } else {
        setColumnCount(2);
      }
    };
    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  useEffect(() => {
    const fetchLatestProducts = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*, product_images(image_url)")
          .order("created_at", { ascending: false })
          .limit(8);

        if (error) throw error;
        setLatestProducts(data || []);
      } catch (err) {
        console.error("Error fetching latest products:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchCategories = async () => {
      setIsCategoriesLoading(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select("category, product_images(image_url)");

        if (error) throw error;

        // Group and count categories case-insensitively, saving first product image
        const counts: {
          [key: string]: {
            originalName: string;
            count: number;
            imageUrl?: string;
          };
        } = {};

        data?.forEach((item: any) => {
          if (!item.category) return;
          const catName = item.category.trim();
          const key = catName.toLowerCase();
          const imgUrl = item.product_images?.[0]?.image_url;

          if (counts[key]) {
            counts[key].count += 1;
            if (!counts[key].imageUrl && imgUrl) {
              counts[key].imageUrl = imgUrl;
            }
          } else {
            counts[key] = {
              originalName: catName,
              count: 1,
              imageUrl: imgUrl || undefined,
            };
          }
        });

        const colorSchemes = [
          "bg-brand-secondary/10 hover:bg-brand-secondary/20 text-brand-text",
          "bg-brand-tertiary/10 hover:bg-brand-tertiary/20 text-brand-text",
          "bg-gray-100 hover:bg-gray-200 text-brand-text",
          "bg-white border border-gray-200 hover:bg-gray-50 text-brand-text",
        ];

        const formattedCategories: CategoryItem[] = Object.keys(counts).map(
          (key, index) => {
            const original = counts[key].originalName;
            const displayName =
              original.charAt(0).toUpperCase() + original.slice(1);
            return {
              name: displayName,
              count: `${counts[key].count} Produk`,
              slug: key,
              color: colorSchemes[index % colorSchemes.length],
              imageUrl: counts[key].imageUrl || getCategoryFallbackImage(key),
            };
          },
        );

        setCategories(formattedCategories);
      } catch (err) {
        console.error("Error fetching categories:", err);
      } finally {
        setIsCategoriesLoading(false);
      }
    };

    fetchLatestProducts();
    fetchCategories();
  }, []);

  const scrollToProducts = () => {
    document
      .getElementById("products-section")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-col min-h-screen bg-brand-bg selection:bg-brand-secondary/30">
      <section className="relative w-full h-dvh min-h-[500px] flex items-center justify-center pt-16 overflow-hidden px-4 sm:px-6 md:px-20">
        <motion.div
          className="absolute inset-0 z-0"
          variants={slideIn("right", 0.2)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.3 }}
        >
          <Image
            src="/banner-dua.jpg"
            alt="UNEEYA Crochet Banner"
            fill
            className="object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-linear-to-b from-brand-bg/50 via-brand-bg/30 to-brand-bg/0 lg:bg-linear-to-r z-10" />
        </motion.div>

        <div className="relative z-20 h-full w-full flex items-end justify-center py-10">
          <motion.div
            variants={staggerContainer(0.2)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
            style={{ y: yText, opacity: opacityText }}
            className="space-y-3 lg:space-y-8 text-center p-6 sm:p-10 lg:p-0"
          >
            <motion.h1
              variants={slideIn("left", 0)}
              className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-brand-text leading-[1.1] tracking-wider"
            >
              Rajut Handmade
              <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-gray-900 via-gray-700 to-blue-900">
                Sentuhan Hangat Dari Uneeya
              </span>
            </motion.h1>

            <motion.div
              variants={slideIn("left", 0)}
              className="flex justify-center w-full"
            >
              <button
                onClick={scrollToProducts}
                className="flex items-center justify-center gap-2 bg-brand-text text-white px-8 py-3.5 rounded-full text-sm font-semibold hover:opacity-90 transition-all cursor-pointer shadow-lg active:scale-[0.98]"
              >
                <ShoppingBag size={16} />
                <span>Jelajahi Produk</span>
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 md:px-20 bg-brand-bg relative overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-12">
          <motion.div
            variants={staggerContainer(0.2)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.3 }}
            className="text-center max-w-xl mx-auto space-y-3"
          >
            <motion.div
              variants={slideIn("left", 0)}
              className="inline-flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-wider border border-gray-200"
            >
              <Layers size={10} />
              <span>Kategori</span>
            </motion.div>
            <motion.h2
              variants={slideIn("left", 0)}
              className="text-3xl font-extrabold text-brand-text"
            >
              Pilih Kategori Produk
            </motion.h2>
            <motion.p
              variants={slideIn("left", 0)}
              className="text-gray-550 text-xs sm:text-sm leading-relaxed"
            >
              Jelajahi produk berkualitas tinggi kami yang disusun rapi
              berdasarkan kategori kesukaanmu.
            </motion.p>
          </motion.div>

          {isCategoriesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-xl bg-gray-50 border border-gray-100 h-40 animate-pulse flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-2/3 animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse" />
                  </div>
                  <div className="flex justify-end">
                    <div className="w-8 h-8 rounded-xl bg-gray-200 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-gray-200 rounded-2xl bg-white/50">
              <p className="text-gray-400 text-sm">
                Belum ada kategori produk.
              </p>
            </div>
          ) : (
            <motion.div
              variants={staggerContainer(0.2)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.15 }}
              className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/catalog?category=${cat.name}`}
                  className="block group"
                >
                  <motion.div variants={slideIn("right", 0)}>
                    <div className="relative rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-shadow duration-300 ease-in-out cursor-pointer h-40 group">
                      {/* Background Image */}
                      <div className="absolute inset-0 z-0">
                        <img
                          src={cat.imageUrl}
                          alt={cat.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        {/* Dark overlay */}
                        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/60 to-black/10 transition-opacity duration-300 group-hover:opacity-5" />
                      </div>

                      {/* Text Content */}
                      <div className="relative z-10 p-6 flex flex-col justify-center items-center text-center h-full text-white">
                        <div>
                          <h3 className="font-bold text-lg tracking-wide drop-shadow-xs">
                            {cat.name}
                          </h3>
                          <span className="text-[10px] font-bold tracking-wider uppercase bg-white/20 px-2.5 py-0.5 rounded-full inline-block mt-2 backdrop-blur-xs">
                            {cat.count}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Latest Products Section */}
      <section
        id="products-section"
        className="py-20 px-4 sm:px-6 md:px-20 bg-brand-bg scroll-mt-12 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header */}
          <motion.div
            variants={staggerContainer(0.2)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
            className="text-center max-w-xl mx-auto space-y-3"
          >
            <motion.div
              variants={slideIn("left", 0)}
              className="inline-flex items-center gap-1.5 bg-brand-secondary/10 px-3 py-1 rounded-full text-[10px] font-bold text-brand-secondary uppercase tracking-wider border border-brand-secondary/15"
            >
              <ShoppingBag size={10} />
              <span>Produk Baru</span>
            </motion.div>
            <motion.h2
              variants={slideIn("left", 0)}
              className="text-3xl font-extrabold text-brand-text"
            >
              Koleksi Produk Terbaru
            </motion.h2>
            <motion.p
              variants={slideIn("left", 0)}
              className="text-gray-550 text-xs sm:text-sm leading-relaxed"
            >
              Daftar produk keluaran terbaru kami yang diproduksi dengan standar
              tinggi untuk gaya hidup moderen.
            </motion.p>
          </motion.div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              <p className="text-gray-400 text-xs">Memuat katalog terbaru...</p>
            </div>
          ) : latestProducts.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-gray-200 rounded-2xl bg-white/50">
              <p className="text-gray-400 text-sm">
                Belum ada produk yang ditambahkan.
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <motion.div
                variants={staggerContainer(0.2)}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.2 }}
                className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
              >
                {latestProducts.map((product, idx) => {
                  const rowIndex = Math.floor(idx / columnCount);
                  return (
                    <motion.div
                      key={product.id}
                      layout
                      variants={slideIn("right", 0)}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </section>
    </div>
  );
}
