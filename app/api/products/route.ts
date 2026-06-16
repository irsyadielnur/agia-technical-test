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
    return { isAdmin: false, error: "Server error: supabaseAdmin client not initialized" };
  }

  // Use anon client to verify user from token securely
  const tempClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error } = await tempClient.auth.getUser(token);

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

// POST: Tambah Produk Baru
export async function POST(request: Request) {
  try {
    const auth = await checkAdmin(request);
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: supabaseAdmin client not initialized" }, { status: 500 });
    }

    const body = await request.json();
    const { name, description, price, category, stock, newImages } = body;

    if (!name || !description || price === undefined || !category || stock === undefined) {
      return NextResponse.json({ error: "Semua kolom wajib diisi" }, { status: 400 });
    }

    const { data: newProduct, error } = await supabaseAdmin
      .from("products")
      .insert([{ name, description, price: Number(price), category, stock: Number(stock) }])
      .select()
      .single();

    if (error) throw error;

    const uploadedUrls: string[] = [];

    // Upload new images via supabaseAdmin
    if (newImages && Array.isArray(newImages) && newImages.length > 0) {
      for (const img of newImages) {
        const { name: imgName, base64 } = img;
        const buffer = Buffer.from(base64, "base64");
        const filePath = `products/${imgName}`;

        const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage
          .from("images")
          .upload(filePath, buffer, {
            contentType: "image/webp",
            duplex: "half",
          });

        if (uploadErr) throw uploadErr;

        const { data: { publicUrl } } = supabaseAdmin.storage
          .from("images")
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }
    }

    // Insert images into product_images
    if (uploadedUrls.length > 0) {
      const imageRows = uploadedUrls.map((url: string) => ({
        product_id: newProduct.id,
        image_url: url,
      }));

      const { error: imgError } = await supabaseAdmin
        .from("product_images")
        .insert(imageRows);

      if (imgError) throw imgError;
    }

    // Fetch complete product with images
    const { data: completeProduct, error: fetchErr } = await supabaseAdmin
      .from("products")
      .select("*, product_images(image_url)")
      .eq("id", newProduct.id)
      .single();

    if (fetchErr) throw fetchErr;

    return NextResponse.json({ success: true, data: completeProduct });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || "Gagal menambahkan produk" }, { status: 500 });
  }
}

// PUT: Perbarui Produk
export async function PUT(request: Request) {
  try {
    const auth = await checkAdmin(request);
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: supabaseAdmin client not initialized" }, { status: 500 });
    }

    const body = await request.json();
    const { id, name, description, price, category, stock, existingImages, newImages } = body;

    if (!id || !name || !description || price === undefined || !category || stock === undefined) {
      return NextResponse.json({ error: "ID dan semua kolom wajib diisi" }, { status: 400 });
    }

    const { data: updatedProduct, error } = await supabaseAdmin
      .from("products")
      .update({ name, description, price: Number(price), category, stock: Number(stock) })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    const uploadedUrls: string[] = [];

    // Upload new images via supabaseAdmin
    if (newImages && Array.isArray(newImages) && newImages.length > 0) {
      for (const img of newImages) {
        const { name: imgName, base64 } = img;
        const buffer = Buffer.from(base64, "base64");
        const filePath = `products/${imgName}`;

        const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage
          .from("images")
          .upload(filePath, buffer, {
            contentType: "image/webp",
            duplex: "half",
          });

        if (uploadErr) throw uploadErr;

        const { data: { publicUrl } } = supabaseAdmin.storage
          .from("images")
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }
    }

    // Combine existing URLs and new uploaded URLs
    const finalUrls: string[] = [
      ...(Array.isArray(existingImages) ? existingImages : []),
      ...uploadedUrls,
    ];

    // Update images in product_images
    // 1. Delete existing images
    const { error: delError } = await supabaseAdmin
      .from("product_images")
      .delete()
      .eq("product_id", id);

    if (delError) throw delError;

    // 2. Insert the combined new set
    if (finalUrls.length > 0) {
      const imageRows = finalUrls.map((url: string) => ({
        product_id: id,
        image_url: url,
      }));

      const { error: imgError } = await supabaseAdmin
        .from("product_images")
        .insert(imageRows);

      if (imgError) throw imgError;
    }

    // Fetch complete product with images
    const { data: completeProduct, error: fetchErr } = await supabaseAdmin
      .from("products")
      .select("*, product_images(image_url)")
      .eq("id", id)
      .single();

    if (fetchErr) throw fetchErr;

    return NextResponse.json({ success: true, data: completeProduct });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || "Gagal memperbarui produk" }, { status: 500 });
  }
}

// DELETE: Hapus Produk
export async function DELETE(request: Request) {
  try {
    const auth = await checkAdmin(request);
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: supabaseAdmin client not initialized" }, { status: 500 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID produk wajib disertakan" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("products")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Produk berhasil dihapus" });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || "Gagal menghapus produk" }, { status: 500 });
  }
}
