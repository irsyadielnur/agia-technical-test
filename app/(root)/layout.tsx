import React from "react";
import Navbar from "@/app/components/navbar";
import Footer from "@/app/components/footer";
import ChatbotWidget from "@/app/components/chatbot-widget";
import CartDrawer from "@/app/components/cart-drawer";
import WishlistDrawer from "@/app/components/wishlist-drawer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
      <ChatbotWidget />
      <CartDrawer />
      <WishlistDrawer />
    </>
  );
}
