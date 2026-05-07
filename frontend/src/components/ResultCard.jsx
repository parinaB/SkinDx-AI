import React, { useMemo } from "react";
import { motion } from "framer-motion";

function toBulletLines(text) {
  if (!text) return [];
  const cleaned = String(text).replace(/\r/g, "").trim();
  if (!cleaned) return [];
  const lines = cleaned
    .split("\n")
    .map((l) => l.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);
  if (lines.length >= 2) return lines;
  return cleaned
    .split(/[.]\s+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 6);
}

const routineLabelMap = {
  0: "Healthy & Clear Routine",
  1: "Acne-Prone Skin Routine",
  2: "Sensitive & Hydrating Routine",
  3: "Balanced Combination Routine",
};

export default function ResultCard({ results, onDownload }) {
  const conditions = results?.conditions || [];
  const suggestions = useMemo(() => toBulletLines(results?.suggestions), [results?.suggestions]);

  const skinLabel = results?.skin_type?.label ? `${results.skin_type.label} Skin` : "Skin Type";
  const confidence = Number(results?.skin_type?.confidence ?? 0);
  const routine = results?.routine;
  const routineDisplay =
    typeof routine === "number" ? routineLabelMap[routine] || String(routine) : String(routine || "");

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-3xl bg-white shadow-card p-8"
    >
      <div className="space-y-6">
        <div>
          <div className="font-fraunces italic text-forest text-3xl">{skinLabel}</div>
          <div className="text-text-muted mt-1">{confidence.toFixed(1)}% confidence</div>
          <div className="mt-3 w-full h-2 rounded-full bg-mint/70 overflow-hidden">
            <div
              className="h-full bg-forest rounded-full"
              style={{ width: `${Math.max(0, Math.min(100, confidence))}%` }}
            />
          </div>
        </div>

        <div>
          <div className="font-semibold text-text-main">Detected Conditions</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {conditions.length ? (
              conditions.map((c) => (
                <span
                  key={c.condition}
                  className="px-4 py-2 rounded-full bg-mint/60 text-forest text-sm font-medium"
                >
                  {c.condition} · {Math.round(c.confidence)}%
                </span>
              ))
            ) : (
              <span className="px-4 py-2 rounded-full bg-mint/60 text-forest text-sm font-medium">
                Clear Skin ✓
              </span>
            )}
          </div>
        </div>

        <div>
          <div className="font-semibold text-text-main">Recommended Routine</div>
          <div className="mt-2 text-forest font-semibold">{routineDisplay}</div>
        </div>

        <div>
          <div className="font-semibold text-text-main">Your Personalised Plan</div>
          <ul className="mt-3 space-y-2 text-[15px] text-text-main list-disc pl-5">
            {suggestions.length ? (
              suggestions.map((s, idx) => <li key={idx}>{s}</li>)
            ) : (
              <li>Keep your routine simple: cleanse gently, moisturize, and wear SPF daily.</li>
            )}
          </ul>
        </div>

        <button
          type="button"
          onClick={onDownload}
          className="rounded-full px-6 py-3 font-medium border border-forest text-forest w-full"
        >
          Download Your Skin Analysis
        </button>
      </div>
    </motion.div>
  );
}

