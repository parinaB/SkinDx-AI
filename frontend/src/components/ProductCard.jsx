import React from "react";

export default function ProductCard({ title, desc, bestFor }) {
  return (
    <div className="min-w-[220px] rounded-2xl bg-white shadow-card p-5">
      <div className="font-semibold text-forest">{title}</div>
      <div className="mt-2 text-[13px] text-text-muted leading-relaxed">{desc}</div>
      <div className="mt-3">
        <span className="inline-flex items-center rounded-full bg-mint/60 px-3 py-1 text-xs font-medium text-forest">
          Best for: {bestFor}
        </span>
      </div>
    </div>
  );
}

