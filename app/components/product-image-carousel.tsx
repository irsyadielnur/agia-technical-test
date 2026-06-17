"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductImageCarouselProps {
  images: string[];
  productName: string;
}

export default function ProductImageCarousel({ images, productName }: ProductImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const slideImages = images && images.length > 0
    ? images
    : ["https://dummyimage.com/600x600/ccc/000&text=No+Image"];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slideImages.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slideImages.length) % slideImages.length);
  };

  return (
    <div className="relative aspect-square w-full bg-white rounded-3xl overflow-hidden border border-gray-150 shadow-md group">
      {/* Slider / Image Viewer */}
      <div className="relative w-full h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="relative w-full h-full"
          >
            <Image
              src={slideImages[currentIndex]}
              alt={`${productName} - Gambar ${currentIndex + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              loading="eager"
              priority
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows (Only show if images > 1) */}
      {slideImages.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 backdrop-blur-xs flex items-center justify-center text-gray-800 hover:bg-white transition-all cursor-pointer opacity-100 lg:opacity-0 lg:group-hover:opacity-100 shadow-md border border-gray-100 z-10"
            aria-label="Gambar sebelumnya"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 backdrop-blur-xs flex items-center justify-center text-gray-800 hover:bg-white transition-all cursor-pointer opacity-100 lg:opacity-0 lg:group-hover:opacity-100 shadow-md border border-gray-100 z-10"
            aria-label="Gambar selanjutnya"
          >
            <ChevronRight size={18} />
          </button>

          {/* Indicator dots at the bottom */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/10 px-3 py-1.5 rounded-full backdrop-blur-xs">
            {slideImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                  currentIndex === idx ? "bg-white w-3" : "bg-white/50"
                }`}
                aria-label={`Pilih gambar ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
