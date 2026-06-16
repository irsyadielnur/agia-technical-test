"use client";

import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-white border-t border-gray-150 text-gray-700 py-12 px-6 md:px-20 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Column 1: Brand Info */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold tracking-widest text-gray-800">
            UNEEYA
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed max-w-xs">
            Menghadirkan produk fashion dan aksesoris eksklusif dengan gaya minimalis modern, dipadukan dengan layanan chatbot AI interaktif untuk kenyamanan belanja Anda.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <a href="#" className="p-2 rounded-lg hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-colors" aria-label="Instagram">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
            </a>
            <a href="#" className="p-2 rounded-lg hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-colors" aria-label="Twitter">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
              </svg>
            </a>
            <a href="#" className="p-2 rounded-lg hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-colors" aria-label="Facebook">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Column 2: Collections */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
            Koleksi Pilihan
          </h4>
          <ul className="space-y-2 text-xs text-gray-500">
            <li>
              <a href="#" className="hover:text-gray-900 transition-colors">Pakaian Pria & Wanita</a>
            </li>
            <li>
              <a href="#" className="hover:text-gray-900 transition-colors">Tas Eksklusif</a>
            </li>
            <li>
              <a href="#" className="hover:text-gray-900 transition-colors">Sepatu & Sneakers</a>
            </li>
            <li>
              <a href="#" className="hover:text-gray-900 transition-colors">Aksesoris Minimalis</a>
            </li>
          </ul>
        </div>

        {/* Column 3: Quick Links */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
            Menu Utama
          </h4>
          <ul className="space-y-2 text-xs text-gray-500">
            <li>
              <Link href="/" className="hover:text-gray-900 transition-colors">Beranda</Link>
            </li>
            <li>
              <a href="#" className="hover:text-gray-900 transition-colors">Katalog Toko</a>
            </li>
            <li>
              <a href="#" className="hover:text-gray-900 transition-colors">Tentang UNEEYA</a>
            </li>
            <li>
              <Link href="/admin/dashboard" className="hover:text-gray-900 transition-colors">Dashboard Admin</Link>
            </li>
          </ul>
        </div>

        {/* Column 4: Contact details */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
            Hubungi Kami
          </h4>
          <ul className="space-y-3.5 text-xs text-gray-500">
            <li className="flex items-center gap-2">
              <Mail size={14} className="text-gray-400 shrink-0" />
              <a href="mailto:support@uneeya.com" className="hover:text-gray-900 transition-colors">support@uneeya.com</a>
            </li>
            <li className="flex items-center gap-2">
              <Phone size={14} className="text-gray-400 shrink-0" />
              <span>+62 812-3456-7890</span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
              <span>Gedung UNEEYA Lt. 3, Jakarta Selatan, Indonesia</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Copyright bar */}
      <div className="max-w-7xl mx-auto border-t border-gray-150 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-gray-400">
        <span>
          &copy; {currentYear} UNEEYA E-Commerce. Hak Cipta Dilindungi.
        </span>
        <div className="flex gap-6">
          <a href="#" className="hover:text-gray-650 transition-colors">Ketentuan Layanan</a>
          <a href="#" className="hover:text-gray-650 transition-colors">Kebijakan Privasi</a>
        </div>
      </div>
    </footer>
  );
}
