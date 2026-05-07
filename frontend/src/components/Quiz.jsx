import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const QUESTIONS = [
  {
    key: "oil_level",
    title: "How oily does your skin feel by midday?",
    options: [
      { label: "Not oily at all", value: 0 },
      { label: "Slightly shiny", value: 1 },
      { label: "Noticeably oily", value: 2 },
      { label: "Very oily / greasy", value: 3 },
    ],
  },
  {
    key: "sleep_hours",
    title: "How many hours do you sleep on average?",
    options: [
      { label: "Less than 5 hrs", value: 4 },
      { label: "5–6 hours", value: 5 },
      { label: "7–8 hours", value: 8 },
      { label: "9+ hours", value: 9 },
    ],
  },
  {
    key: "water_intake",
    title: "How many glasses of water do you drink daily?",
    options: [
      { label: "1–2 glasses", value: 1 },
      { label: "3 glasses", value: 2 },
      { label: "4 glasses", value: 3 },
      { label: "5+ glasses", value: 5 },
    ],
  },
  {
    key: "stress_level",
    title: "How would you rate your daily stress level?",
    options: [
      { label: "Very low", value: 0 },
      { label: "Mild", value: 1 },
      { label: "Moderate", value: 2 },
      { label: "High / chronic", value: 3 },
    ],
  },
  {
    key: "acne_frequency",
    title: "How often do you get breakouts or acne?",
    options: [
      { label: "Rarely / never", value: 0 },
      { label: "Occasionally", value: 1 },
      { label: "Frequently", value: 2 },
      { label: "Almost always", value: 3 },
    ],
  },
];

const slideVariants = {
  enter: (direction) => ({ x: direction > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({ x: direction > 0 ? -40 : 40, opacity: 0 }),
};

export default function Quiz({ onQuizComplete }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState({});

  const total = QUESTIONS.length;
  const q = QUESTIONS[step];
  const progress = useMemo(() => Math.round(((step + 1) / total) * 100), [step, total]);
  const isLast = step === total - 1;
  const selectedValue = answers[q.key];

  const canNext = selectedValue !== undefined && selectedValue !== null;
  const isComplete = QUESTIONS.every((qq) => answers[qq.key] !== undefined);

  const go = (next) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const onSelect = (val) => setAnswers((prev) => ({ ...prev, [q.key]: val }));

  return (
    <div className="space-y-4">
      <div>
        <div className="font-semibold text-text-main">Tell Us About Your Skin</div>
        <div className="text-sm text-text-muted">Question {step + 1} of {total}</div>
      </div>

      <div className="w-full h-2 rounded-full bg-mint/70 overflow-hidden">
        <motion.div
          className="h-full bg-forest rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />
      </div>

      <div className="min-h-[210px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={q.key}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="space-y-4"
          >
            <div className="text-lg font-medium text-text-main">{q.title}</div>

            <div className="grid grid-cols-1 gap-3">
              {q.options.map((opt) => {
                const active = selectedValue === opt.value;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => onSelect(opt.value)}
                    className={[
                      "w-full text-left rounded-full px-5 py-3 font-medium transition border",
                      active
                        ? "bg-forest text-white border-forest"
                        : "bg-mint/60 text-forest border-mint-dark hover:bg-mint-dark/60",
                    ].join(" ")}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          className="rounded-full px-6 py-3 font-medium border border-forest text-forest disabled:opacity-40"
          disabled={step === 0}
          onClick={() => go(step - 1)}
        >
          Back
        </button>

        {!isLast ? (
          <button
            type="button"
            className="rounded-full px-6 py-3 font-medium bg-forest text-white disabled:opacity-50"
            disabled={!canNext}
            onClick={() => go(step + 1)}
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            className="rounded-full px-6 py-3 font-medium bg-forest text-white disabled:opacity-50"
            disabled={!isComplete}
            onClick={() => onQuizComplete?.(answers)}
          >
            Submit Quiz
          </button>
        )}
      </div>
    </div>
  );
}

