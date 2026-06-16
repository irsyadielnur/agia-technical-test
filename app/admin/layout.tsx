'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';
import Sidebar from './components/sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const checkAdmin = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          if (mounted) router.push('/auth');
          return;
        }

        if (mounted) {
          setSession(session);
          setUser(session.user);
        }

        // Verify that the user has the admin role
        const { data: profile, error } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();

        if (error) {
          console.error('Error fetching profile role:', error);
          if (mounted) router.push('/'); // Fallback
          return;
        }

        if (profile?.role !== 'admin') {
          console.warn('User is not admin, redirecting. Role:', profile?.role);
          if (mounted) router.push('/'); // Redirect non-admins back to home
          return;
        }

        if (mounted) setIsLoading(false);
      } catch (err) {
        console.error('Auth check failed:', err);
        if (mounted) router.push('/');
      }
    };

    checkAdmin();

    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50/50 flex">
      {/* Sidebar is always visible */}
      <Sidebar />

      {/* Main Container */}
      <main className="flex-1 p-6 lg:p-8 relative min-h-screen">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/50">
            <Loader2 className="w-10 h-10 text-slate-800 animate-spin" />
            <p className="text-gray-500 font-medium text-sm mt-3">Memeriksa Hak Akses...</p>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">{children}</div>
        )}
      </main>
    </div>
  );
}
