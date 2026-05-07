import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PDFModal({ results, uploadedImages, onClose }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const canGenerate = useMemo(() => uploadedImages?.filter(Boolean)?.length === 3 && !!results, [uploadedImages, results]);

  const generate = async () => {
    if (!canGenerate || isBusy) return;
    setIsBusy(true);
    try {
      const base64Images = await Promise.all(uploadedImages.map((f) => fileToBase64(f)));

      const res = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "User",
          age: Number(age || 0),
          skin_type: results.skin_type,
          conditions: results.conditions,
          routine: results.routine,
          suggestions: results.suggestions,
          images: base64Images,
          timestamp: results.timestamp,
        }),
      });

      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "SkinDxAI_Report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      onClose?.();
    } catch {
      setIsBusy(false);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full max-w-lg rounded-3xl bg-white shadow-card p-7"
      >
        <div className="font-fraunces italic text-forest text-2xl">Download Your Report</div>
        <div className="mt-5 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-xl border border-mint-dark px-4 py-3 outline-none focus:border-forest"
          />
          <input
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="Your age"
            type="number"
            className="w-full rounded-xl border border-mint-dark px-4 py-3 outline-none focus:border-forest"
          />
        </div>

        <button
          type="button"
          disabled={!canGenerate || isBusy}
          onClick={generate}
          className="mt-5 w-full rounded-full px-6 py-3 font-medium bg-forest text-white disabled:opacity-50"
        >
          {isBusy ? "Generating..." : "Generate PDF"}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full text-center text-sm text-text-muted hover:text-forest transition"
        >
          Cancel
        </button>
      </motion.div>
    </div>
  );
}

