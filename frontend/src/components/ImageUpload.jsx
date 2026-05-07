import React, { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

const SLOTS = ["Front Face", "Left Side", "Right Side"];

function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 16V8m0 0 3 3m-3-3-3 3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 16.5a4.5 4.5 0 0 0-4.5-4.5h-.7A6 6 0 1 0 5 15.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M7 20h10"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function ImageUpload({ onImagesChange }) {
  const inputRefs = useRef([null, null, null]);
  const [files, setFiles] = useState([null, null, null]);
  const [previews, setPreviews] = useState([null, null, null]);

  const allFilled = useMemo(() => files.every(Boolean), [files]);

  const handlePick = (idx) => {
    const el = inputRefs.current[idx];
    if (el) el.click();
  };

  const handleFile = (idx, file) => {
    if (!file) return;
    const extOk = ["image/jpeg", "image/png"].includes(file.type);
    if (!extOk) return;

    const nextFiles = [...files];
    nextFiles[idx] = file;
    setFiles(nextFiles);

    const url = URL.createObjectURL(file);
    const nextPrev = [...previews];
    nextPrev[idx] = url;
    setPreviews(nextPrev);

    onImagesChange?.(nextFiles);
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="font-semibold text-text-main">Upload Your Skin Photos</div>
        <div className="text-sm text-text-muted">Front face · Left side · Right side</div>
      </div>

      <div className="space-y-3">
        {SLOTS.map((label, idx) => (
          <div key={label} className="relative">
            <input
              ref={(r) => (inputRefs.current[idx] = r)}
              type="file"
              accept="image/jpg,image/jpeg,image/png"
              className="hidden"
              onChange={(e) => handleFile(idx, e.target.files?.[0])}
            />

            <motion.button
              type="button"
              whileTap={{ scale: 0.99 }}
              onClick={() => handlePick(idx)}
              className="w-full h-[100px] rounded-2xl border-2 border-dashed border-mint-dark bg-white/60 hover:bg-white transition flex items-center justify-between px-5"
            >
              <div className="flex items-center gap-3 text-forest">
                <div className="w-10 h-10 rounded-full bg-mint/60 flex items-center justify-center">
                  <UploadIcon />
                </div>
                <div className="text-left">
                  <div className="font-medium text-text-main">{label}</div>
                  <div className="text-sm text-text-muted">JPG or PNG</div>
                </div>
              </div>

              {previews[idx] ? (
                <img
                  src={previews[idx]}
                  alt={`${label} preview`}
                  className="w-[96px] h-[72px] rounded-xl object-cover shadow-card"
                />
              ) : (
                <div className="text-sm text-text-muted">Tap to upload</div>
              )}
            </motion.button>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="w-full rounded-full px-6 py-3 font-medium bg-forest text-white disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!allFilled}
        onClick={() => onImagesChange?.(files)}
      >
        Analyse Images
      </button>
    </div>
  );
}

