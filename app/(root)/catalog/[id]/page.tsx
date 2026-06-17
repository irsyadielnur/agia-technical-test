import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import ProductImageCarousel from "@/app/components/product-image-carousel";
import ProductActions from "@/app/components/product-actions";
import { ArrowLeft } from "lucide-react";

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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(image_url)")
    .eq("id", id)
    .single();

  const product = data as unknown as Product | null;

  if (error) {
    console.error("Error fetching product:", error);
  }

  // Format IDR Currency
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center gap-4 px-4">
        <h2 className="text-2xl font-bold text-brand-text">
          Produk Tidak Ditemukan
        </h2>
        <p className="text-gray-500 text-sm text-center max-w-md">
          Maaf, produk yang Anda cari tidak tersedia atau telah dihapus dari
          katalog kami.
        </p>
        <Link
          href="/catalog"
          className="mt-2 inline-flex items-center gap-2 bg-brand-text text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Katalog</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text pt-24 pb-8 md:py-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-brand-text font-bold text-xs uppercase tracking-wider transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Katalog</span>
        </Link>

        {/* Product Details Section Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 mt-8 items-start">
          {/* Left Column: Product Image Frame / Carousel */}
          <ProductImageCarousel
            productName={product.name}
            images={product.product_images?.map((img) => img.image_url) || []}
          />

          {/* Right Column: Detailed Product Info */}
          <div className="flex flex-col justify-between h-full space-y-6">
            <div className="space-y-4">
              {/* Category Badge */}
              <div>
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-brand-secondary/10 border border-brand-secondary/20 text-brand-secondary">
                  {product.category}
                </span>
              </div>

              {/* Title Name */}
              <h1 className="font-extrabold text-3xl md:text-4xl tracking-tight leading-tight">
                {product.name}
              </h1>

              {/* Price Row */}
              <div className="border-t border-b border-gray-150/60 py-4">
                <span className="text-gray-400 text-xs uppercase font-bold tracking-widest block">
                  Harga Resmi
                </span>
                <span className="font-black text-3xl md:text-4xl text-brand-text mt-1.5 block">
                  {formatIDR(product.price)}
                </span>
              </div>

              {/* Stock Status Badge */}
              <div className="flex items-center gap-2.5">
                <span className="text-gray-450 text-xs font-semibold">
                  Status Ketersediaan:
                </span>
                {product.stock > 0 ? (
                  <span className="inline-flex px-2.5 py-0.5 rounded-md text-xs font-bold bg-green-50 border border-green-200 text-green-700">
                    {product.stock} Unit Ready
                  </span>
                ) : (
                  <span className="inline-flex px-2.5 py-0.5 rounded-md text-xs font-bold bg-red-50 border border-red-200 text-red-700">
                    Stok Habis
                  </span>
                )}
              </div>

              {/* Description Block */}
              <div className="space-y-2 mt-6">
                <span className="text-gray-400 text-xs uppercase font-bold tracking-widest block">
                  Deskripsi Lengkap
                </span>
                <p className="text-gray-650 text-sm leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            </div>

            {/* Buying action button & trust indicators */}
            <div className="space-y-6 pt-6 border-t border-gray-150/60">
              <ProductActions product={product} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
