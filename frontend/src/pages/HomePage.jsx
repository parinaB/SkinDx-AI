import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar.jsx";
import ImageUpload from "../components/ImageUpload.jsx";
import Quiz from "../components/Quiz.jsx";
import ResultCard from "../components/ResultCard.jsx";
import ProductCard from "../components/ProductCard.jsx";
import PDFModal from "../components/PDFModal.jsx";

const heroVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

function Spinner() {
  return (
    <motion.div
      className="w-9 h-9 rounded-full border-2 border-forest/20 border-t-forest"
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
    />
  );
}

export default function HomePage() {
  const [uploadedImages, setUploadedImages] = useState([null, null, null]);
  const [quizAnswers, setQuizAnswers] = useState(null);
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [error, setError] = useState("");

  const resultsRef = useRef(null);

  const imagesReady = useMemo(() => uploadedImages.filter(Boolean).length === 3, [uploadedImages]);
  const quizReady = useMemo(() => !!quizAnswers, [quizAnswers]);
  const canSubmit = imagesReady && quizReady && !isLoading;

  useEffect(() => {
    if (results && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [results]);

  const getAnalysis = async () => {
    if (!canSubmit) return;
    setIsLoading(true);
    setError("");

    try {
      const fd = new FormData();
      uploadedImages.forEach((f) => fd.append("images[]", f));
      fd.append("quiz_answers", JSON.stringify(quizAnswers));

      const res = await fetch("/api/predict", {
        method: "POST",
        body: fd,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Request failed");

      setResults(data);
    } catch (e) {
      setError(e?.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const ingredients = [
    {
      title: "Niacinamide",
      desc: "Controls oil, minimises pores, evens skin tone",
      bestFor: "Oily / Combination",
    },
    {
      title: "Salicylic Acid",
      desc: "Unclogs pores, fights acne-causing bacteria",
      bestFor: "Acne-prone",
    },
    {
      title: "Hyaluronic Acid",
      desc: "Deep hydration without heaviness",
      bestFor: "Dry / Sensitive",
    },
    {
      title: "Retinol",
      desc: "Speeds cell turnover, reduces dark spots",
      bestFor: "Ageing / Uneven tone",
    },
    {
      title: "Vitamin C",
      desc: "Brightens, antioxidant protection, fades spots",
      bestFor: "Dull / Dark spots",
    },
    {
      title: "Centella Asiatica",
      desc: "Calms redness, repairs skin barrier",
      bestFor: "Sensitive / Reactive",
    },
  ];

  return (
    <div className="min-h-screen bg-sage">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-12 space-y-16">
        {/* SECTION 1 — HERO */}
        <motion.div variants={heroVariants} initial="hidden" animate="show" className="text-center">
          <div className="font-fraunces italic text-forest text-[52px] leading-tight">
            Know your skin. Feed it right.
          </div>
          <div className="mt-4 text-text-muted text-lg">
            Upload 3 photos and answer 5 quick questions — we&apos;ll do the rest.
          </div>
        </motion.div>

        {/* SECTION 2 — ANALYSIS BOX */}
        <div className="rounded-3xl bg-white shadow-card p-10 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-[1fr,1px,1fr] gap-10 md:gap-12 items-start">
            <div>
              <ImageUpload onImagesChange={setUploadedImages} />
            </div>

            <div className="hidden md:block w-px bg-mint h-full rounded-full opacity-80" />

            <div>
              <Quiz onQuizComplete={setQuizAnswers} />
            </div>
          </div>

          <div className="mt-10">
            {error ? (
              <div className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-4 py-2 text-sm font-medium">
                {error}
              </div>
            ) : null}

            {isLoading ? (
              <div className="mt-6 flex items-center justify-center">
                <Spinner />
              </div>
            ) : null}

            {imagesReady && quizReady ? (
              <motion.button
                whileTap={{ scale: 0.99 }}
                className="mt-8 w-full bg-forest text-white rounded-full px-6 py-4 font-medium shadow-card"
                onClick={getAnalysis}
                disabled={!canSubmit}
              >
                Get My Skin Analysis
              </motion.button>
            ) : (
              <div className="mt-8 text-sm text-text-muted">
                Complete the 3 photo uploads and submit the quiz to unlock your analysis.
              </div>
            )}
          </div>
        </div>

        {/* RESULTS */}
        {results ? (
          <div ref={resultsRef} className="scroll-mt-28">
            <ResultCard results={results} onDownload={() => setShowPDFModal(true)} />
          </div>
        ) : null}

        {/* SECTION 3 — HOW IT WORKS */}
        <div id="how" className="scroll-mt-28">
          <div className="font-fraunces italic text-forest text-4xl text-center">How SkinDx AI Works</div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: "📸", title: "Upload 3 Photos", desc: "Front and both sides of your face" },
              { icon: "💬", title: "Answer 5 Questions", desc: "About your lifestyle and skin habits" },
              { icon: "✨", title: "Get Your Results", desc: "Skin type, conditions, and a full routine" },
            ].map((c) => (
              <div key={c.title} className="rounded-2xl bg-white shadow-card p-6">
                <div className="text-3xl">{c.icon}</div>
                <div className="mt-3 font-semibold text-text-main">{c.title}</div>
                <div className="mt-2 text-sm text-text-muted">{c.desc}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center text-text-muted italic text-sm">
            Results are AI-generated and are not a substitute for professional dermatological advice.
          </div>
        </div>

        {/* SECTION 4 — INGREDIENTS */}
        <div id="products" className="scroll-mt-28">
          <div className="font-fraunces italic text-forest text-4xl text-center">
            Ingredients Your Skin Might Love
          </div>
          <div className="mt-8 flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {ingredients.map((p) => (
              <ProductCard key={p.title} title={p.title} desc={p.desc} bestFor={p.bestFor} />
            ))}
          </div>
        </div>
      </div>

      {showPDFModal ? (
        <PDFModal
          results={results}
          uploadedImages={uploadedImages}
          onClose={() => setShowPDFModal(false)}
        />
      ) : null}
    </div>
  );
}

