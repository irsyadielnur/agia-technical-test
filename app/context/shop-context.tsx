"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image_url?: string;
  product_images?: { image_url: string }[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

interface ShopContextType {
  cart: CartItem[];
  wishlist: Product[];
  isCartOpen: boolean;
  isWishlistOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  setIsWishlistOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Fetch cart from Supabase
  const fetchCart = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("carts")
        .select("id, quantity, product:products(*, product_images(image_url))")
        .eq("user_id", userId);

      if (error) throw error;

      if (data) {
        const cartItems: CartItem[] = data
          .map((item: any) => ({
            product: item.product,
            quantity: item.quantity,
          }))
          .filter((item: any) => item.product !== null);

        setCart(cartItems);
      }
    } catch (err) {
      console.error("Error fetching cart from Supabase:", err);
    }
  };

  // Fetch wishlist from Supabase
  const fetchWishlist = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("wishlists")
        .select("id, product:products(*, product_images(image_url))")
        .eq("user_id", userId);

      if (error) throw error;

      if (data) {
        const wishlistItems: Product[] = data
          .map((item: any) => item.product)
          .filter(Boolean);

        setWishlist(wishlistItems);
      }
    } catch (err) {
      console.error("Error fetching wishlist from Supabase:", err);
    }
  };

  // Merge guest localStorage data to Supabase
  const mergeLocalDataToSupabase = async (userId: string) => {
    try {
      const cachedOwner = localStorage.getItem("uneeya_user_id");
      // Only merge if the cache is from a guest (no owner, or "guest")
      if (cachedOwner && cachedOwner !== "guest") {
        return;
      }

      const savedCart = localStorage.getItem("uneeya_cart");
      const savedWishlist = localStorage.getItem("uneeya_wishlist");

      const localCart: CartItem[] = savedCart ? JSON.parse(savedCart) : [];
      const localWishlist: Product[] = savedWishlist
        ? JSON.parse(savedWishlist)
        : [];

      if (localCart.length === 0 && localWishlist.length === 0) {
        localStorage.setItem("uneeya_user_id", userId);
        return;
      }

      // Fetch current Supabase data
      const { data: dbCartData } = await supabase
        .from("carts")
        .select("product_id, quantity")
        .eq("user_id", userId);

      const { data: dbWishlistData } = await supabase
        .from("wishlists")
        .select("product_id")
        .eq("user_id", userId);

      // Merge Carts
      if (localCart.length > 0) {
        for (const item of localCart) {
          const dbItem = dbCartData?.find(
            (d) => d.product_id === item.product.id,
          );
          if (dbItem) {
            const newQty = dbItem.quantity + item.quantity;
            const finalQty =
              item.product.stock !== undefined
                ? Math.min(newQty, item.product.stock)
                : newQty;
            await supabase
              .from("carts")
              .update({ quantity: finalQty })
              .eq("user_id", userId)
              .eq("product_id", item.product.id);
          } else {
            await supabase.from("carts").insert({
              user_id: userId,
              product_id: item.product.id,
              quantity: item.quantity,
            });
          }
        }
      }

      // Merge Wishlists
      if (localWishlist.length > 0) {
        for (const product of localWishlist) {
          const existsInDb = dbWishlistData?.some(
            (d) => d.product_id === product.id,
          );
          if (!existsInDb) {
            await supabase.from("wishlists").insert({
              user_id: userId,
              product_id: product.id,
            });
          }
        }
      }

      // Update the cache owner to this user
      localStorage.setItem("uneeya_user_id", userId);
    } catch (err) {
      console.error("Error merging local data to Supabase:", err);
    }
  };

  // Sync auth state and load initial data
  useEffect(() => {
    const handleAuthChange = async (session: any) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // Merge guest data
        await mergeLocalDataToSupabase(currentUser.id);
        // Load user data
        await Promise.all([
          fetchCart(currentUser.id),
          fetchWishlist(currentUser.id),
        ]);
        localStorage.setItem("uneeya_user_id", currentUser.id);
      } else {
        // Guest mode
        localStorage.setItem("uneeya_user_id", "guest");
        try {
          const savedCart = localStorage.getItem("uneeya_cart");
          setCart(savedCart ? JSON.parse(savedCart) : []);

          const savedWishlist = localStorage.getItem("uneeya_wishlist");
          setWishlist(savedWishlist ? JSON.parse(savedWishlist) : []);
        } catch (e) {
          console.error("Failed to load local state:", e);
        }
      }
      setIsMounted(true);
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange(session);
    });

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setCart([]);
        setWishlist([]);
        localStorage.setItem("uneeya_user_id", "guest");
        localStorage.removeItem("uneeya_cart");
        localStorage.removeItem("uneeya_wishlist");
        setUser(null);
      } else {
        await handleAuthChange(session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sync cart to localStorage (acts as local cache for logged-in or guest cart)
  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem("uneeya_cart", JSON.stringify(cart));
    } catch (e) {
      console.error("Failed to save cart state:", e);
    }
  }, [cart, isMounted]);

  // Sync wishlist to localStorage (acts as local cache for logged-in or guest wishlist)
  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem("uneeya_wishlist", JSON.stringify(wishlist));
    } catch (e) {
      console.error("Failed to save wishlist state:", e);
    }
  }, [wishlist, isMounted]);

  const addToCart = async (product: Product, quantity = 1) => {
    // 1. Optimistic update
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        const finalQty =
          product.stock !== undefined
            ? Math.min(newQty, product.stock)
            : newQty;
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: finalQty }
            : item,
        );
      }
      return [
        ...prev,
        { product, quantity: Math.min(quantity, product.stock || 99) },
      ];
    });

    // 2. Database update
    if (user) {
      try {
        const { data: existing } = await supabase
          .from("carts")
          .select("id, quantity")
          .eq("user_id", user.id)
          .eq("product_id", product.id)
          .maybeSingle();

        if (existing) {
          const newQty = existing.quantity + quantity;
          const finalQty =
            product.stock !== undefined
              ? Math.min(newQty, product.stock)
              : newQty;
          await supabase
            .from("carts")
            .update({ quantity: finalQty })
            .eq("id", existing.id);
        } else {
          await supabase.from("carts").insert({
            user_id: user.id,
            product_id: product.id,
            quantity: Math.min(quantity, product.stock || 99),
          });
        }
      } catch (err) {
        console.error("Failed to sync addToCart to Supabase:", err);
        // Fallback: fetch from DB
        fetchCart(user.id);
      }
    }
  };

  const removeFromCart = async (productId: string) => {
    // 1. Optimistic update
    setCart((prev) => prev.filter((item) => item.product.id !== productId));

    // 2. Database update
    if (user) {
      try {
        await supabase
          .from("carts")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId);
      } catch (err) {
        console.error("Failed to sync removeFromCart to Supabase:", err);
        fetchCart(user.id);
      }
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    // 1. Optimistic update
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity:
                item.product.stock !== undefined
                  ? Math.min(quantity, item.product.stock)
                  : quantity,
            }
          : item,
      ),
    );

    // 2. Database update
    if (user) {
      try {
        await supabase
          .from("carts")
          .update({ quantity })
          .eq("user_id", user.id)
          .eq("product_id", productId);
      } catch (err) {
        console.error("Failed to sync updateQuantity to Supabase:", err);
        fetchCart(user.id);
      }
    }
  };

  const clearCart = async () => {
    // 1. Optimistic update
    setCart([]);

    // 2. Database update
    if (user) {
      try {
        await supabase.from("carts").delete().eq("user_id", user.id);
      } catch (err) {
        console.error("Failed to sync clearCart to Supabase:", err);
        fetchCart(user.id);
      }
    }
  };

  const toggleWishlist = async (product: Product) => {
    const exists = wishlist.some((item) => item.id === product.id);

    // 1. Optimistic update
    setWishlist((prev) => {
      if (exists) {
        return prev.filter((item) => item.id !== product.id);
      }
      return [...prev, product];
    });

    // 2. Database update
    if (user) {
      try {
        if (exists) {
          await supabase
            .from("wishlists")
            .delete()
            .eq("user_id", user.id)
            .eq("product_id", product.id);
        } else {
          await supabase.from("wishlists").insert({
            user_id: user.id,
            product_id: product.id,
          });
        }
      } catch (err) {
        console.error("Failed to sync toggleWishlist to Supabase:", err);
        fetchWishlist(user.id);
      }
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some((item) => item.id === productId);
  };

  return (
    <ShopContext.Provider
      value={{
        cart,
        wishlist,
        isCartOpen,
        isWishlistOpen,
        setIsCartOpen,
        setIsWishlistOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleWishlist,
        isInWishlist,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShop must be used within a ShopProvider");
  }
  return context;
}
