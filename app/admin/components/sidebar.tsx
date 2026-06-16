'use client';

import { useState, useEffect, useRef, forwardRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { LayoutDashboard, Package, Users, MessageSquareMore, ChevronLeft, ChevronRight, MoreVertical, UserRound, Globe, LogOut, Menu, X } from 'lucide-react';

// Sidebar Content Component with forwardRef
interface SidebarContentProps {
  isOpen: boolean;
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
  isHeaderHovered: boolean;
  setIsHeaderHovered: (hovered: boolean) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  user: User | null;
  userMetadata: { username?: string; avatar_url?: string } | null;
  pathname: string;
  handleLogout: () => Promise<void>;
  setIsOpen?: (open: boolean) => void;
}

const SidebarContent = forwardRef<HTMLDivElement, SidebarContentProps>(
  ({ isOpen, isMobileMenuOpen, setIsMobileMenuOpen, isHeaderHovered, setIsHeaderHovered, isMenuOpen, setIsMenuOpen, user, userMetadata, pathname, handleLogout, setIsOpen }, ref) => {
    const menuItems = [
      { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
      { id: 'products', name: 'Products', icon: Package },
      { id: 'customers', name: 'Customers', icon: Users },
      { id: 'chat', name: 'Chatbot History', icon: MessageSquareMore },
    ];

    return (
      <div className="flex flex-col justify-between h-full">
        <div>
          {/* Sidebar Header (Logo and Toggle button) */}
          <div className="relative flex items-center h-12 mb-6 cursor-pointer" onMouseEnter={() => setIsHeaderHovered(true)} onMouseLeave={() => setIsHeaderHovered(false)}>
            <div className="shrink-0 w-10 h-10 flex items-center justify-center bg-gray-900 text-white rounded-xl font-bold text-lg">U</div>

            {isOpen && <span className="ml-3 font-bold text-gray-800 tracking-wide text-base whitespace-nowrap overflow-hidden">Uneeya Admin</span>}

            {/* Toggle button: show on desktop if setIsOpen is provided */}
            {setIsOpen && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(!isOpen);
                }}
                className="hidden md:block absolute p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 cursor-pointer shadow-sm border border-gray-150 bg-white"
                style={{
                  right: isOpen ? '0px' : '-18px',
                  top: '10px',
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
                  onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)}
                  className={`flex items-center w-full h-11 px-3 rounded-xl transition-all duration-200 cursor-pointer ${isActive ? 'bg-gray-900 text-white font-medium shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  <div className="shrink-0 w-8 h-8 flex items-center justify-center">
                    <Icon size={18} />
                  </div>

                  {isOpen && <span className="ml-2.5 text-sm whitespace-nowrap overflow-hidden">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer (User Profile & Setting Dropdown) */}
        <div className="relative border-t border-gray-100 pt-4" ref={ref}>
          <div className="flex items-center justify-between w-full">
            <div
              onClick={() => {
                if (!isOpen) {
                  setIsMenuOpen(!isMenuOpen);
                }
              }}
              className={`flex items-center min-w-0 ${!isOpen ? 'cursor-pointer hover:opacity-80' : ''}`}
            >
              <img
                src={userMetadata?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${userMetadata?.username || user?.email || 'admin'}`}
                alt="Admin Profile"
                className="w-10 h-10 rounded-full object-cover bg-gray-50 shrink-0"
              />

              {isOpen && (
                <div className="ml-3 flex flex-col min-w-0 overflow-hidden">
                  <span className="text-sm font-semibold text-gray-800 truncate leading-none mb-1">{userMetadata?.username || 'Admin'}</span>
                  <span className="text-[10px] text-gray-400 truncate leading-none">{user?.email || 'admin@uneeya.com'}</span>
                </div>
              )}
            </div>

            {isOpen && (
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 cursor-pointer shrink-0">
                <MoreVertical size={16} />
              </button>
            )}
          </div>

          {isMenuOpen && (
            <div
              className="absolute bottom-14 bg-white rounded-xl shadow-xl border border-gray-150 py-1.5 z-50"
              style={{
                left: isOpen ? '0px' : '10px',
                width: isOpen ? '228px' : '180px',
              }}
            >
              <button onClick={() => setIsMenuOpen(false)} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors text-left cursor-pointer">
                <UserRound size={16} />
                <span>Profile</span>
              </button>
              <Link href="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                <Globe size={16} />
                <span>Halaman Beranda</span>
              </Link>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-left cursor-pointer border-t border-gray-100 mt-1 pt-1.5">
                <LogOut size={16} />
                <span>Keluar</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  },
);

SidebarContent.displayName = 'SidebarContent';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  // Close mobile menu when path changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-700">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center font-bold">U</div>
            <span className="font-bold text-gray-800">Uneeya Admin</span>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          <div onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/30 z-40 md:hidden" />
          <div className="fixed top-0 left-0 h-full w-72 bg-white border-r border-gray-200 z-50 p-4 md:hidden">
            <SidebarContent
              ref={menuRef}
              isOpen={true}
              isMobileMenuOpen={isMobileMenuOpen}
              setIsMobileMenuOpen={setIsMobileMenuOpen}
              isHeaderHovered={isHeaderHovered}
              setIsHeaderHovered={setIsHeaderHovered}
              isMenuOpen={isMenuOpen}
              setIsMenuOpen={setIsMenuOpen}
              user={user}
              userMetadata={userMetadata}
              pathname={pathname}
              handleLogout={handleLogout}
            />
          </div>
        </>
      )}

      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: isOpen ? 260 : 72 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className="hidden md:flex h-screen bg-white border-r border-gray-200 flex-col justify-between p-4 sticky shrink-0 overflow-visible top-0 left-0"
      >
        <SidebarContent
          ref={menuRef}
          isOpen={isOpen}
          isHeaderHovered={isHeaderHovered}
          setIsHeaderHovered={setIsHeaderHovered}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          user={user}
          userMetadata={userMetadata}
          pathname={pathname}
          handleLogout={handleLogout}
          setIsOpen={setIsOpen}
        />
      </motion.aside>
    </>
  );
}
