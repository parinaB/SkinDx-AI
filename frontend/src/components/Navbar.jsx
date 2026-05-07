import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Navbar() {
  const navigate = useNavigate();

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="sticky top-0 z-50 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75 border-b border-mint">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-fraunces italic text-forest text-xl">SkinDx AI</span>
        </div>

        <div className="flex items-center gap-6">
          <button
            className="text-text-muted hover:text-forest transition text-sm font-medium"
            onClick={() => scrollToId("how")}
          >
            How it works
          </button>
          <button
            className="text-text-muted hover:text-forest transition text-sm font-medium"
            onClick={() => scrollToId("products")}
          >
            Products
          </button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            className="rounded-full px-5 py-2.5 border border-forest text-forest font-medium text-sm"
            onClick={() => navigate("/")}
          >
            Back
          </motion.button>
        </div>
      </div>
    </div>
  );
}

