import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import PageTransitionProvider from "./page-transition-provider";
import { ShopProvider } from "@/app/context/shop-context";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "AI E-Commerce Chatbot",
  description: "E-Commerce with AI Smart Chatbot",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body
        className={`${roboto.className} bg-brand-bg min-h-full flex flex-col`}
      >
        <ShopProvider>
          <PageTransitionProvider>{children}</PageTransitionProvider>
        </ShopProvider>
      </body>
    </html>
  );
}
