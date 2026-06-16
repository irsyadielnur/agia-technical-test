"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  MoveLeft,
} from "lucide-react";
import { useLoading } from "@/app/page-transition-provider";
import { slideSwitch } from "@/app/components/motion";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [direction, setDirection] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const router = useRouter();
  const { startLoading, stopLoading } = useLoading();

  const handleSwitch = (toLogin: boolean) => {
    setDirection(toLogin ? -1 : 1);
    setIsLogin(toLogin);
    setMessage(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    startLoading();
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (profileError) {
          console.error("Error fetching user profile:", profileError);
          router.push("/");
          return;
        }

        setMessage({ type: "success", text: "Login sukses! Mengarahkan..." });

        setTimeout(() => {
          if (profile?.role === "admin") {
            router.push("/admin/dashboard");
          } else {
            router.push("/");
          }
        }, 1000);
      }
    } catch (err) {
      const error = err as Error;
      stopLoading();
      setMessage({
        type: "error",
        text: error.message || "Gagal masuk. Silakan cek email & sandi Anda.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    startLoading();
    setMessage(null);

    try {
      if (!username.trim()) {
        throw new Error("Username wajib diisi.");
      }

      const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(username)}`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.trim(),
            avatar_url: avatarUrl,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        if (data.session) {
          setMessage({
            type: "success",
            text: "Pendaftaran berhasil! Mengarahkan...",
          });
          setTimeout(() => {
            router.push("/");
          }, 1000);
        } else {
          stopLoading();
          setMessage({
            type: "success",
            text: "Pendaftaran sukses! Silakan cek kotak masuk email Anda untuk konfirmasi.",
          });
        }
      }
    } catch (err) {
      const error = err as Error;
      stopLoading();
      setMessage({
        type: "error",
        text: error.message || "Gagal mendaftar. Silakan coba lagi.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const slideVariants = slideSwitch();

  return (
    <div className="h-screen w-full flex items-center justify-center bg-brand-bg relative">
      <Link href="/" className="absolute top-5 left-20 flex items-center gap-3">
        <MoveLeft size={20} />
        <span className="font-medium">Kembali</span>
      </Link>
      <div className="relative w-full max-w-md bg-brand-bg rounded-2xl shadow-lg border border-gray-100 p-8 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {isLogin ? (
            <motion.div
              key="login-form"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex justify-center items-center gap-2">
                  <LogIn className="w-6 h-6 text-gray-700" />
                  Masuk Ke Akun
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Silakan masuk untuk melanjutkan belanja Anda
                </p>
              </div>

              {message && (
                <div
                  className={`flex items-start gap-3 p-3 rounded-lg mb-4 text-sm ${
                    message.type === "success"
                      ? "bg-green-50 border border-green-200 text-green-700"
                      : "bg-red-50 border border-red-200 text-red-700"
                  }`}
                >
                  {message.type === "success" ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0" />
                  )}
                  <span>{message.text}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Surel (Email)
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 transition-all text-sm"
                    placeholder="nama@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kata Sandi
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 transition-all text-sm"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gray-900 text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 active:scale-[0.98] transition-all duration-100 disabled:bg-gray-400 text-sm cursor-pointer"
                >
                  {isLoading ? "Sedang masuk..." : "Masuk"}
                </button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-gray-500">Belum punya akun? </span>
                <button
                  onClick={() => handleSwitch(false)}
                  className="text-gray-900 font-semibold hover:underline cursor-pointer"
                >
                  Daftar sekarang
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="register-form"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex justify-center items-center gap-2">
                  <UserPlus className="w-6 h-6 text-gray-700" />
                  Daftar Akun Baru
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Buat akun untuk memulai pengalaman belanja terbaik
                </p>
              </div>

              {message && (
                <div
                  className={`flex items-start gap-3 p-3 rounded-lg mb-4 text-sm ${
                    message.type === "success"
                      ? "bg-green-50 border border-green-200 text-green-700"
                      : "bg-red-50 border border-red-200 text-red-700"
                  }`}
                >
                  {message.type === "success" ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0" />
                  )}
                  <span>{message.text}</span>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Pengguna (Username)
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 transition-all text-sm"
                    placeholder="username123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Surel (Email)
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 transition-all text-sm"
                    placeholder="nama@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kata Sandi
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 transition-all text-sm"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gray-900 text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 active:scale-[0.98] transition-all duration-100 disabled:bg-gray-400 text-sm cursor-pointer"
                >
                  {isLoading ? "Sedang mendaftar..." : "Daftar"}
                </button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-gray-500">Sudah memiliki akun? </span>
                <button
                  onClick={() => handleSwitch(true)}
                  className="text-gray-900 font-semibold hover:underline cursor-pointer"
                >
                  Masuk sekarang
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
