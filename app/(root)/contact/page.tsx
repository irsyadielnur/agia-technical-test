"use client";

import { motion } from "framer-motion";
import { slideIn } from "@/app/components/motion";

export default function ContactPage() {
  return (
    <main className="flex flex-col items-center justify-center text-center h-screen w-full">
      <motion.h1
        variants={slideIn("left", 0)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.3 }}
        className="text-4xl font-extrabold text-brand-text tracking-tight"
      >
        Contact UNEEYA
      </motion.h1>
    </main>
  );
}
