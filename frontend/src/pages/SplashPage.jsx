import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export default function SplashPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-sage relative overflow-hidden flex items-center justify-center px-6">
      <div className="blob w-[360px] h-[360px] left-[-120px] top-[10%] opacity-80" style={{ animationDelay: "0s" }} />
      <div className="blob w-[260px] h-[260px] right-[-90px] top-[18%]" style={{ animationDelay: "1.5s" }} />
      <div className="blob w-[420px] h-[420px] left-[20%] bottom-[-160px]" style={{ animationDelay: "0.7s" }} />
      <div className="blob w-[220px] h-[220px] right-[14%] bottom-[8%]" style={{ animationDelay: "2.2s" }} />

      <motion.div variants={container} initial="hidden" animate="show" className="relative z-10 text-center max-w-xl">
        <motion.div variants={item} className="font-fraunces italic text-forest text-[64px] leading-[1.05]">
          SkinDx AI
        </motion.div>
        <motion.div variants={item} className="mt-4 text-text-muted text-lg">
          Your AI-powered skin companion
        </motion.div>
        <motion.div variants={item} className="mt-10">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/analyse")}
            className="bg-forest text-white rounded-full px-7 py-3.5 font-medium shadow-card"
          >
            Analyse My Skin →
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}

