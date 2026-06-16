'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { useShop } from '@/app/context/shop-context';
import { Heart, ShoppingBag, UserRound, Moon, LogIn, LogOut, LayoutDashboard, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { href: '/catalog', label: 'Catalog' },
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { cart, wishlist, setIsCartOpen, setIsWishlistOpen } = useShop();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const pathname = usePathname();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userMetadata, setUserMetadata] = useState<{
    username?: string;
    avatar_url?: string;
  } | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setUserMetadata(session.user.user_metadata);

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        if (profile) {
          setUserRole(profile.role);
        }
      }
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        setUserMetadata(session.user.user_metadata);

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        if (profile) {
          setUserRole(profile.role);
        }
      } else {
        setUser(null);
        setUserMetadata(null);
        setUserRole(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <>
      <nav className="flex justify-between items-center px-4 md:px-8 lg:px-20 w-full h-16 bg-brand-bg/50 backdrop-blur-md fixed top-0 z-50">
        {/* Mobile Menu Button */}
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 rounded-full hover:bg-gray-150 active:bg-gray-200 transition-colors cursor-pointer text-gray-700">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex md:flex-1 gap-8 text-gray-650">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
            return (
              <Link key={link.href} href={link.href} className={`hover:font-semibold transition-all duration-100 ${isActive ? 'font-semibold text-gray-900' : 'font-normal'}`}>
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Logo */}
        <div className="flex-1 md:flex-2 text-2xl md:text-4xl font-bold flex justify-center tracking-widest text-gray-800 hover:opacity-80 transition-opacity">
          <Link href="/">UNEEYA</Link>
        </div>

        {/* Icons */}
        <div className="flex-1 flex justify-end items-center gap-2 md:gap-3">
          {/* Wishlist Button */}
          <button onClick={() => setIsWishlistOpen(true)} className="p-2 rounded-full hover:bg-gray-150 active:bg-gray-200 transition-colors cursor-pointer text-gray-700 relative" aria-label="Daftar Keinginan">
            <Heart size={20} className={wishlist.length > 0 ? 'text-red-500 fill-red-500' : ''} />
            {wishlist.length > 0 && (
              <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white shrink-0 pointer-events-none">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Cart Button */}
          <button onClick={() => setIsCartOpen(true)} className="p-2 rounded-full hover:bg-gray-150 active:bg-gray-200 transition-colors cursor-pointer text-gray-700 relative" aria-label="Keranjang">
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute top-0.5 right-0.5 bg-gray-900 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white shrink-0 pointer-events-none">
                {cartCount}
              </span>
            )}
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className={`p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer text-gray-700 ${isDropdownOpen ? 'bg-gray-100' : ''}`}
              aria-label="User menu"
              aria-haspopup="true"
              aria-expanded={isDropdownOpen}
            >
              {user && userMetadata?.avatar_url ? <img src={userMetadata.avatar_url} alt="User Profile" className="w-5 h-5 rounded-full object-cover" /> : <UserRound size={20} />}
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-brand-bg rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                {user ? (
                  <>
                    {/* Customer / Admin Profile Header Info */}
                    <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100 mb-1.5">
                      <img src={userMetadata?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${userMetadata?.username || user.email}`} alt="User Profile Image" className="w-8 h-8 rounded-full object-cover bg-brand-bg" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-gray-800 truncate">{userMetadata?.username || 'User'}</span>
                        <span className="text-[10px] text-gray-400 capitalize truncate">{userRole || 'customer'}</span>
                      </div>
                    </div>

                    {/* Dashboard link for admin users */}
                    {userRole === 'admin' && (
                      <Link href="/admin/dashboard" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors mb-1">
                        <LayoutDashboard size={16} />
                        <span>Dashboard</span>
                      </Link>
                    )}

                    {/* Keluar (Logout) option */}
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-left cursor-pointer">
                      <LogOut size={16} />
                      <span>Keluar</span>
                    </button>
                  </>
                ) : (
                  /* Login option */
                  <Link href="/auth" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                    <LogIn size={16} />
                    <span>Login</span>
                  </Link>
                )}

                {/* Dark Mode option */}
                <button
                  onClick={() => {
                    console.log('Toggle dark mode clicked');
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors text-left cursor-pointer ${user ? 'border-t border-gray-100 mt-1.5 pt-2' : 'border-t border-gray-100 mt-1 pt-1.5'}`}
                >
                  <Moon size={16} />
                  <span>Dark Mode</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed top-16 left-0 w-full bg-brand-bg/95 backdrop-blur-lg z-40 border-b border-gray-100 shadow-lg">
          <div className="flex flex-col p-6 gap-4">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
              return (
                <Link key={link.href} href={link.href} className={`text-lg hover:font-semibold transition-all duration-100 ${isActive ? 'font-semibold text-gray-900' : 'font-normal text-gray-600'}`}>
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
