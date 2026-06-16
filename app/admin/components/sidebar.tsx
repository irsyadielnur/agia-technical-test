"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  Package,
  Users,
  MessageSquareMore,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  ChartLine,
  UserRound,
  Globe,
  LogOut,
} from "lucide-react";

import { usePathname } from "next/navigation";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userMetadata, setUserMetadata] = useState<{
    username?: string;
    avatar_url?: string;
  } | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get current user session
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setUserMetadata(session.user.user_metadata);
      }
    };
    getSession();
  }, []);

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  const menuItems = [
    { id: "dashboard", name: "Dashboard", icon: LayoutDashboard },
    { id: "products", name: "Products", icon: Package },
    { id: "customers", name: "Customers", icon: Users },
    { id: "chat", name: "Chatbot History", icon: MessageSquareMore },
  ];

  return (
    <motion.aside
      animate={{ width: isOpen ? 260 : 72 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="h-screen bg-white border-r border-gray-200 flex flex-col justify-between p-4 sticky shrink-0 overflow-visible top-0 left-0"
    >
      <div>
        {/* Sidebar Header (Logo and Toggle button) */}
        <div
          className="relative flex items-center h-12 mb-6 cursor-pointer"
          onMouseEnter={() => setIsHeaderHovered(true)}
          onMouseLeave={() => setIsHeaderHovered(false)}
        >
          <div className="shrink-0 w-10 h-10 flex items-center justify-center bg-gray-900 text-white rounded-xl font-bold text-lg">
            U
          </div>

          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="ml-3 font-bold text-gray-800 tracking-wide text-base whitespace-nowrap overflow-hidden"
              >
                Uneeya Admin
              </motion.span>
            )}
          </AnimatePresence>

          {/* Toggle button: show on the right of header when open, or when hovered if closed */}
          {(isOpen || isHeaderHovered) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
              className="absolute p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 cursor-pointer shadow-sm border border-gray-150 bg-white"
              style={{
                right: isOpen ? "0px" : "-18px",
                top: "10px",
                zIndex: 50,
              }}
            >
              {isOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
            </button>
          )}
        </div>

        {/* Navigation Menus */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const href = `/admin/${item.id}`;
            const isActive = pathname === href;

            return (
              <Link
                key={item.id}
                href={href}
                className={`flex items-center w-full h-11 px-3 rounded-xl transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-gray-900 text-white font-medium shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {/* Icon Wrapper has fixed size to prevent shifting */}
                <div className="shrink-0 w-8 h-8 flex items-center justify-center">
                  <Icon size={18} />
                </div>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="ml-2.5 text-sm whitespace-nowrap overflow-hidden"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer (User Profile & Setting Dropdown) */}
      <div className="relative border-t border-gray-100 pt-4" ref={menuRef}>
        <div className="flex items-center justify-between w-full">
          <div
            onClick={() => {
              if (!isOpen) {
                setIsMenuOpen(!isMenuOpen);
              }
            }}
            className={`flex items-center min-w-0 ${!isOpen ? "cursor-pointer hover:opacity-80" : ""}`}
          >
            <img
              src={
                userMetadata?.avatar_url ||
                `https://api.dicebear.com/7.x/adventurer/svg?seed=${userMetadata?.username || user?.email || "admin"}`
              }
              alt="Admin Profile"
              className="w-10 h-10 rounded-full object-cover bg-gray-50 shrink-0"
            />

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="ml-3 flex flex-col min-w-0 overflow-hidden"
                >
                  <span className="text-sm font-semibold text-gray-800 truncate leading-none mb-1">
                    {userMetadata?.username || "Admin"}
                  </span>
                  <span className="text-[10px] text-gray-400 truncate leading-none">
                    {user?.email || "admin@uneeya.com"}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {isOpen && (
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 cursor-pointer shrink-0"
            >
              <MoreVertical size={16} />
            </button>
          )}
        </div>

        {/* Dropdown Menu (opens upward) */}
        {isMenuOpen && (
          <div
            className="absolute bottom-14 bg-white rounded-xl shadow-xl border border-gray-150 py-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
            style={{
              left: isOpen ? "0px" : "10px",
              width: isOpen ? "228px" : "180px",
            }}
          >
            <button
              onClick={() => {
                console.log("Admin profile clicked");
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors text-left cursor-pointer"
            >
              <UserRound size={16} />
              <span>Profile</span>
            </button>

            <Link
              href="/"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <Globe size={16} />
              <span>Halaman Beranda</span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-left cursor-pointer border-t border-gray-100 mt-1 pt-1.5"
            >
              <LogOut size={16} />
              <span>Keluar</span>
            </button>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
