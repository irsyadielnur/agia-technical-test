import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 text-brand-secondary animate-spin" />
      <p className="text-brand-text text-sm font-medium animate-pulse">
        Memuat detail produk...
      </p>
    </div>
  );
}
