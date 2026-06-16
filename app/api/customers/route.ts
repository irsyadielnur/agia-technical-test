import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Helper to authenticate request and check if user is admin
async function checkAdmin(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { isAdmin: false, error: "Token otentikasi tidak ditemukan" };
  }

  const token = authHeader.split(" ")[1];

  if (!supabaseAdmin) {
    return {
      isAdmin: false,
      error: "Server error: supabaseAdmin client not initialized",
    };
  }

  // Use anon client to verify user from token securely
  const tempClient = createClient(supabaseUrl, supabaseAnonKey);
  const {
    data: { user },
    error,
  } = await tempClient.auth.getUser(token);

  if (error || !user) {
    return { isAdmin: false, error: "Sesi tidak valid atau telah berakhir" };
  }

  // Fetch role from profiles table using supabaseAdmin (bypassing RLS)
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    return { isAdmin: false, error: "Akses ditolak. Anda bukan admin." };
  }

  return { isAdmin: true, user };
}

// GET: Ambil daftar seluruh customer
export async function GET(request: Request) {
  try {
    const auth = await checkAdmin(request);
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Server error: supabaseAdmin client not initialized" },
        { status: 500 },
      );
    }

    // Ambil semua auth users
    const {
      data: { users },
      error: usersError,
    } = await supabaseAdmin.auth.admin.listUsers();
    if (usersError) {
      throw usersError;
    }

    // Ambil data roles dari profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("*");

    if (profilesError) {
      throw profilesError;
    }

    // Gabungkan data auth users dan profiles role, lalu saring hanya yang ber-role customer
    const customerList = users
      .map((user) => {
        const profile = profiles?.find((p) => p.id === user.id);
        return {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          email_confirmed_at: user.email_confirmed_at,
          phone: user.phone || "-",
          is_anonymous: user.is_anonymous || false,
          username:
            user.user_metadata?.username ||
            user.user_metadata?.full_name ||
            "User",
          avatar_url:
            user.user_metadata?.avatar_url ||
            `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.id)}`,
          role: profile?.role || user.user_metadata?.role || "customer",
          provider: user.app_metadata?.provider || "email",
        };
      })
      .filter((customer) => customer.role === "customer");

    // Fetch all carts with product details (bypassing RLS)
    const { data: cartsData } = await supabaseAdmin
      .from("carts")
      .select("product_id, quantity, created_at, product:products(name, price)");

    // Fetch all wishlists with product details (bypassing RLS)
    const { data: wishlistsData } = await supabaseAdmin
      .from("wishlists")
      .select("product_id, created_at, product:products(name)");

    return NextResponse.json({
      customers: customerList,
      carts: cartsData || [],
      wishlists: wishlistsData || [],
    });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || "Gagal mengambil data pelanggan" },
      { status: 500 },
    );
  }
}
